package co.genomicaandina.cotizador.dao;

import co.genomicaandina.cotizador.dto.Dtos.AlertaDTO;
import co.genomicaandina.cotizador.dto.Dtos.ClausulaDTO;
import co.genomicaandina.cotizador.dto.Dtos.CotizacionDocumento;
import co.genomicaandina.cotizador.dto.Dtos.CotizacionResumen;
import co.genomicaandina.cotizador.dto.Dtos.DashboardDTO;
import co.genomicaandina.cotizador.dto.Dtos.ItemDocumento;
import co.genomicaandina.cotizador.dto.Dtos.NormaDTO;
import co.genomicaandina.cotizador.dto.Dtos.RegistroAlertaDTO;
import co.genomicaandina.cotizador.dto.Dtos.RequisitoDTO;
import co.genomicaandina.cotizador.dto.Dtos.TotalesDTO;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.sql.Types;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

import static co.genomicaandina.cotizador.dao.CatalogoDao.toLocalDate;

@Repository
public class CotizacionDao {

    private static final Set<String> VIGENTES = Set.of("borrador", "en_revision", "enviada", "negociacion");

    public record ItemInsert(
            int orden,
            long productoId,
            String tipo,
            String sku,
            String descripcion,
            String marca,
            String modelo,
            String unidad,
            BigDecimal cantidad,
            BigDecimal precio,
            BigDecimal descuento,
            BigDecimal iva,
            boolean aplicaRetefuente,
            String registro,
            LocalDate registroVence,
            String tiempoEntrega,
            String observaciones
    ) {
    }

    private record Header(
            long id,
            String numero,
            int version,
            String estado,
            LocalDate fechaEmision,
            int validezDias,
            String moneda,
            BigDecimal trm,
            long clienteId,
            String formaPago,
            String plazoEntrega,
            String lugarEntrega,
            Integer garantiaMeses,
            String garantiaDetalle,
            String declaracionCumplimiento,
            String observaciones,
            String condicionesComerciales
    ) {
    }

    private record EstadoAgg(String estado, long cantidad, BigDecimal total) {
    }

    private final NamedParameterJdbcTemplate jdbc;
    private final CatalogoDao catalogo;

    public CotizacionDao(NamedParameterJdbcTemplate jdbc, CatalogoDao catalogo) {
        this.jdbc = jdbc;
        this.catalogo = catalogo;
    }

    // ================================================================= lecturas

    private static final String SQL_RESUMEN = """
            SELECT id, numero, version, estado, estado_efectivo, fecha_emision, fecha_vencimiento,
                   dias_para_vencer, cliente, cliente_documento, moneda, subtotal, iva_total, total_bruto,
                   retefuente, reteica, total_neto, requisitos_pendientes, items_registro_vencido
              FROM v_cotizaciones_resumen
            """;

    private static CotizacionResumen mapResumen(java.sql.ResultSet rs, int i) throws java.sql.SQLException {
        return new CotizacionResumen(
                rs.getLong("id"),
                rs.getString("numero"),
                rs.getInt("version"),
                rs.getString("estado"),
                rs.getString("estado_efectivo"),
                toLocalDate(rs, "fecha_emision"),
                toLocalDate(rs, "fecha_vencimiento"),
                rs.getLong("dias_para_vencer"),
                rs.getString("cliente"),
                rs.getString("cliente_documento"),
                rs.getString("moneda"),
                rs.getBigDecimal("subtotal"),
                rs.getBigDecimal("iva_total"),
                rs.getBigDecimal("total_bruto"),
                rs.getBigDecimal("retefuente"),
                rs.getBigDecimal("reteica"),
                rs.getBigDecimal("total_neto"),
                rs.getInt("requisitos_pendientes"),
                rs.getInt("items_registro_vencido")
        );
    }

    public List<CotizacionResumen> listar(String estado) {
        return jdbc.query(SQL_RESUMEN
                        + " WHERE (:estado IS NULL OR estado_efectivo = :estado)"
                        + " ORDER BY fecha_emision DESC, numero DESC",
                new MapSqlParameterSource("estado", estado),
                CotizacionDao::mapResumen);
    }

    public List<CotizacionResumen> recientes(int limite) {
        int tope = Math.max(1, Math.min(limite, 50));
        return jdbc.query(SQL_RESUMEN + " ORDER BY fecha_emision DESC, numero DESC LIMIT :limite",
                new MapSqlParameterSource("limite", tope),
                CotizacionDao::mapResumen);
    }

    public Optional<CotizacionDocumento> documento(String numero) {
        Optional<Header> header = jdbc.query("""
                        SELECT id, numero, version, estado, fecha_emision, validez_dias, moneda, trm,
                               cliente_id, forma_pago, plazo_entrega, lugar_entrega,
                               garantia_meses, garantia_detalle, declaracion_cumplimiento,
                               observaciones, condiciones_comerciales
                          FROM cotizaciones
                         WHERE numero = :numero
                        """,
                Map.of("numero", numero),
                (rs, i) -> new Header(
                        rs.getLong("id"),
                        rs.getString("numero"),
                        rs.getInt("version"),
                        rs.getString("estado"),
                        toLocalDate(rs, "fecha_emision"),
                        rs.getInt("validez_dias"),
                        rs.getString("moneda"),
                        rs.getBigDecimal("trm"),
                        rs.getLong("cliente_id"),
                        rs.getString("forma_pago"),
                        rs.getString("plazo_entrega"),
                        rs.getString("lugar_entrega"),
                        rs.getObject("garantia_meses", Integer.class),
                        rs.getString("garantia_detalle"),
                        rs.getString("declaracion_cumplimiento"),
                        rs.getString("observaciones"),
                        rs.getString("condiciones_comerciales")
                )).stream().findFirst();

        if (header.isEmpty()) {
            return Optional.empty();
        }
        Header h = header.get();

        LocalDate vence = h.fechaEmision().plusDays(h.validezDias());
        String estadoEfectivo = VIGENTES.contains(h.estado()) && vence.isBefore(LocalDate.now())
                ? "vencida"
                : h.estado();

        TotalesDTO totales = totales(h.id());
        var empresa = catalogo.empresaPrincipal().orElse(null);
        var cliente = catalogo.cliente(h.clienteId()).orElse(null);

        if (empresa == null || cliente == null) {
            return Optional.empty();
        }

        return Optional.of(new CotizacionDocumento(
                h.id(),
                h.numero(),
                h.version(),
                h.estado(),
                estadoEfectivo,
                h.fechaEmision(),
                vence,
                h.validezDias(),
                h.moneda(),
                h.trm(),
                empresa,
                cliente,
                items(h.numero()),
                totales,
                requisitos(h.id()),
                clausulas(h.id()),
                normas(h.id()),
                h.formaPago(),
                h.plazoEntrega(),
                h.lugarEntrega(),
                h.garantiaMeses(),
                h.garantiaDetalle(),
                h.declaracionCumplimiento(),
                h.observaciones(),
                h.condicionesComerciales()
        ));
    }

    private TotalesDTO totales(long cotizacionId) {
        return jdbc.query("""
                        SELECT subtotal, iva_total, total_bruto, retefuente, reteiva, reteica, total_neto
                          FROM v_cotizacion_totales
                         WHERE cotizacion_id = :id
                        """,
                Map.of("id", cotizacionId),
                (rs, i) -> new TotalesDTO(
                        rs.getBigDecimal("subtotal"),
                        rs.getBigDecimal("iva_total"),
                        rs.getBigDecimal("total_bruto"),
                        rs.getBigDecimal("retefuente"),
                        rs.getBigDecimal("reteiva"),
                        rs.getBigDecimal("reteica"),
                        rs.getBigDecimal("total_neto")
                )).stream().findFirst()
                .orElse(new TotalesDTO(BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO,
                        BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO));
    }

    private List<ItemDocumento> items(String numero) {
        return jdbc.query("""
                        SELECT d.orden, d.tipo, d.sku, d.descripcion, d.marca, d.modelo, d.unidad_medida, d.cantidad,
                               d.precio_unitario, d.descuento_pct, d.iva_pct, d.subtotal, d.iva_valor, d.total,
                               d.registro_sanitario, d.registro_vence, d.tiempo_entrega, d.observaciones,
                               p.imagen_url
                          FROM v_cotizacion_detalle d
                          LEFT JOIN productos p ON p.sku = d.sku
                         WHERE d.numero = :numero
                         ORDER BY d.orden
                        """,
                Map.of("numero", numero),
                (rs, i) -> new ItemDocumento(
                        rs.getInt("orden"),
                        rs.getString("tipo"),
                        rs.getString("sku"),
                        rs.getString("descripcion"),
                        rs.getString("marca"),
                        rs.getString("modelo"),
                        rs.getString("unidad_medida"),
                        rs.getBigDecimal("cantidad"),
                        rs.getBigDecimal("precio_unitario"),
                        rs.getBigDecimal("descuento_pct"),
                        rs.getBigDecimal("iva_pct"),
                        rs.getBigDecimal("subtotal"),
                        rs.getBigDecimal("iva_valor"),
                        rs.getBigDecimal("total"),
                        rs.getString("registro_sanitario"),
                        toLocalDate(rs, "registro_vence"),
                        rs.getString("tiempo_entrega"),
                        rs.getString("observaciones"),
                        rs.getString("imagen_url")
                ));
    }

    private List<RequisitoDTO> requisitos(long cotizacionId) {
        return jdbc.query("""
                        SELECT r.requisito_codigo, r.titulo, r.categoria, n.codigo AS norma, r.obligatorio,
                               r.estado, r.evidencia_url, r.observaciones
                          FROM cotizacion_requisitos r
                          LEFT JOIN normas n ON n.id = r.norma_id
                         WHERE r.cotizacion_id = :id
                         ORDER BY r.orden
                        """,
                Map.of("id", cotizacionId),
                (rs, i) -> new RequisitoDTO(
                        rs.getString("requisito_codigo"),
                        rs.getString("titulo"),
                        rs.getString("categoria"),
                        rs.getString("norma"),
                        rs.getBoolean("obligatorio"),
                        rs.getString("estado"),
                        rs.getString("evidencia_url"),
                        rs.getString("observaciones")
                ));
    }

    private List<ClausulaDTO> clausulas(long cotizacionId) {
        return jdbc.query("""
                        SELECT codigo, titulo, cuerpo
                          FROM cotizacion_clausulas
                         WHERE cotizacion_id = :id
                         ORDER BY orden
                        """,
                Map.of("id", cotizacionId),
                (rs, i) -> new ClausulaDTO(
                        rs.getString("codigo"),
                        rs.getString("titulo"),
                        rs.getString("cuerpo")
                ));
    }

    private List<NormaDTO> normas(long cotizacionId) {
        return jdbc.query("""
                        SELECT n.codigo, n.titulo, n.entidad, n.anio, n.ambito, n.obligatoria, cn.nota
                          FROM cotizacion_normas cn
                          JOIN normas n ON n.id = cn.norma_id
                         WHERE cn.cotizacion_id = :id
                         ORDER BY n.codigo
                        """,
                Map.of("id", cotizacionId),
                (rs, i) -> new NormaDTO(
                        rs.getString("codigo"),
                        rs.getString("titulo"),
                        rs.getString("entidad"),
                        rs.getObject("anio", Integer.class),
                        rs.getString("ambito"),
                        rs.getBoolean("obligatoria"),
                        rs.getString("nota")
                ));
    }

    public Optional<Long> idPorNumero(String numero) {
        return jdbc.query("SELECT id FROM cotizaciones WHERE numero = :numero",
                        Map.of("numero", numero),
                        (rs, i) -> rs.getLong("id"))
                .stream().findFirst();
    }

    public Optional<String> estadoPorNumero(String numero) {
        return jdbc.query("SELECT estado FROM cotizaciones WHERE numero = :numero",
                        Map.of("numero", numero),
                        (rs, i) -> rs.getString("estado"))
                .stream().findFirst();
    }

    public Optional<Long> usuarioAdmin() {
        return jdbc.query("SELECT id FROM usuarios WHERE rol = 'admin' AND activo = TRUE ORDER BY id LIMIT 1",
                        (rs, i) -> rs.getLong("id"))
                .stream().findFirst();
    }

    // ================================================================= dashboard

    public DashboardDTO dashboard() {
        List<EstadoAgg> aggs = jdbc.query("""
                        SELECT estado_efectivo, COUNT(*) AS n, COALESCE(SUM(total_neto), 0) AS total
                          FROM v_cotizaciones_resumen
                         GROUP BY estado_efectivo
                        """,
                (rs, i) -> new EstadoAgg(rs.getString("estado_efectivo"), rs.getLong("n"), rs.getBigDecimal("total")));

        long total = 0;
        long borradores = 0;
        long enviadas = 0;
        long aceptadas = 0;
        BigDecimal pipeline = BigDecimal.ZERO;
        BigDecimal aceptado = BigDecimal.ZERO;

        for (EstadoAgg a : aggs) {
            total += a.cantidad();
            switch (a.estado()) {
                case "borrador" -> {
                    borradores += a.cantidad();
                    pipeline = pipeline.add(a.total());
                }
                case "en_revision", "enviada", "negociacion" -> {
                    enviadas += a.cantidad();
                    pipeline = pipeline.add(a.total());
                }
                case "aceptada" -> {
                    aceptadas += a.cantidad();
                    aceptado = aceptado.add(a.total());
                }
                default -> {
                }
            }
        }

        List<AlertaDTO> alertas = jdbc.query("""
                        SELECT numero, cliente, estado_efectivo, fecha_vencimiento, dias_para_vencer,
                               requisitos_pendientes, items_registro_vencido, total_neto
                          FROM v_cotizaciones_alertas
                         ORDER BY dias_para_vencer
                         LIMIT 10
                        """,
                (rs, i) -> new AlertaDTO(
                        rs.getString("numero"),
                        rs.getString("cliente"),
                        rs.getString("estado_efectivo"),
                        toLocalDate(rs, "fecha_vencimiento"),
                        rs.getLong("dias_para_vencer"),
                        rs.getInt("requisitos_pendientes"),
                        rs.getInt("items_registro_vencido"),
                        rs.getBigDecimal("total_neto")
                ));

        List<RegistroAlertaDTO> registros = jdbc.query("""
                        SELECT sku, nombre, estado_registro, numero_registro, fecha_vencimiento
                          FROM v_productos_estado_regulatorio
                         WHERE estado_registro IN ('vencido', 'por_vencer')
                         ORDER BY fecha_vencimiento
                         LIMIT 10
                        """,
                (rs, i) -> new RegistroAlertaDTO(
                        rs.getString("sku"),
                        rs.getString("nombre"),
                        rs.getString("estado_registro"),
                        rs.getString("numero_registro"),
                        toLocalDate(rs, "fecha_vencimiento")
                ));

        return new DashboardDTO(total, borradores, enviadas, aceptadas, pipeline, aceptado,
                recientes(8), alertas, registros);
    }

    // ================================================================= escrituras

    public long insertCotizacion(String numero,
                                 long empresaId,
                                 long clienteId,
                                 LocalDate fechaEmision,
                                 int validezDias,
                                 String moneda,
                                 BigDecimal trm,
                                 LocalDate trmFecha,
                                 String formaPago,
                                 String plazoEntrega,
                                 String lugarEntrega,
                                 Integer garantiaMeses,
                                 String garantiaDetalle,
                                 BigDecimal retefuentePct,
                                 BigDecimal reteivaPct,
                                 BigDecimal reteicaPct,
                                 String declaracion,
                                 String observaciones,
                                 String condiciones,
                                 String empresaSnapshot,
                                 String clienteSnapshot,
                                 Long creadoPor) {

        KeyHolder keyHolder = new GeneratedKeyHolder();
        MapSqlParameterSource p = new MapSqlParameterSource()
                .addValue("numero", numero)
                .addValue("empresaId", empresaId)
                .addValue("clienteId", clienteId)
                .addValue("fechaEmision", fechaEmision, Types.DATE)
                .addValue("validezDias", validezDias)
                .addValue("moneda", moneda)
                .addValue("trm", trm)
                .addValue("trmFecha", trmFecha, Types.DATE)
                .addValue("formaPago", formaPago)
                .addValue("plazoEntrega", plazoEntrega)
                .addValue("lugarEntrega", lugarEntrega)
                .addValue("garantiaMeses", garantiaMeses)
                .addValue("garantiaDetalle", garantiaDetalle)
                .addValue("retefuentePct", retefuentePct)
                .addValue("reteivaPct", reteivaPct)
                .addValue("reteicaPct", reteicaPct)
                .addValue("declaracion", declaracion)
                .addValue("observaciones", observaciones)
                .addValue("condiciones", condiciones)
                .addValue("empresaSnapshot", empresaSnapshot)
                .addValue("clienteSnapshot", clienteSnapshot)
                .addValue("creadoPor", creadoPor);

        jdbc.update("""
                INSERT INTO cotizaciones
                    (numero, version, empresa_id, cliente_id, fecha_emision, validez_dias, moneda, trm, trm_fecha,
                     estado, forma_pago, plazo_entrega, lugar_entrega, incoterm, garantia_meses, garantia_detalle,
                     incluye_instalacion, incluye_capacitacion, incluye_validacion,
                     aplica_retefuente, retefuente_pct, reteiva_pct, reteica_pct,
                     declaracion_cumplimiento, observaciones, condiciones_comerciales,
                     datos_empresa_snapshot, datos_cliente_snapshot, creado_por)
                VALUES
                    (:numero, 1, :empresaId, :clienteId, :fechaEmision, :validezDias, :moneda, :trm, :trmFecha,
                     'borrador', :formaPago, :plazoEntrega, :lugarEntrega, 'DAP', :garantiaMeses, :garantiaDetalle,
                     TRUE, TRUE, FALSE,
                     TRUE, :retefuentePct, :reteivaPct, :reteicaPct,
                     :declaracion, :observaciones, :condiciones,
                     :empresaSnapshot, :clienteSnapshot, :creadoPor)
                """, p, keyHolder, new String[]{"id"});

        return keyHolder.getKey().longValue();
    }

    public void insertItem(long cotizacionId, ItemInsert item) {
        jdbc.update("""
                        INSERT INTO cotizacion_items
                            (cotizacion_id, orden, producto_id, tipo, sku, descripcion, marca, modelo, unidad_medida,
                             cantidad, precio_unitario, descuento_pct, iva_pct, aplica_retefuente,
                             registro_sanitario, registro_vence, tiempo_entrega, observaciones)
                        VALUES
                            (:cot, :orden, :producto, :tipo, :sku, :descripcion, :marca, :modelo, :unidad,
                             :cantidad, :precio, :descuento, :iva, :retefuente,
                             :registro, :vence, :entrega, :observaciones)
                        """,
                new MapSqlParameterSource()
                        .addValue("cot", cotizacionId)
                        .addValue("orden", item.orden())
                        .addValue("producto", item.productoId())
                        .addValue("tipo", item.tipo())
                        .addValue("sku", item.sku())
                        .addValue("descripcion", item.descripcion())
                        .addValue("marca", item.marca())
                        .addValue("modelo", item.modelo())
                        .addValue("unidad", item.unidad())
                        .addValue("cantidad", item.cantidad())
                        .addValue("precio", item.precio())
                        .addValue("descuento", item.descuento())
                        .addValue("iva", item.iva())
                        .addValue("retefuente", item.aplicaRetefuente())
                        .addValue("registro", item.registro())
                        .addValue("vence", item.registroVence(), Types.DATE)
                        .addValue("entrega", item.tiempoEntrega())
                        .addValue("observaciones", item.observaciones()));
    }

    public int copiarRequisitos(long cotizacionId, boolean equipo, boolean reactivo, boolean servicio) {
        return jdbc.update("""
                        INSERT INTO cotizacion_requisitos
                            (cotizacion_id, requisito_codigo, titulo, categoria, norma_id, obligatorio, estado, orden)
                        SELECT :cot, codigo, titulo, categoria, norma_id, obligatorio, 'pendiente', orden
                          FROM requisitos_plantilla
                         WHERE activo = TRUE
                           AND (aplica_a = 'todos'
                             OR (aplica_a = 'equipos' AND :equipo = 1)
                             OR (aplica_a = 'reactivos' AND :reactivo = 1)
                             OR (aplica_a = 'servicios' AND :servicio = 1))
                        """,
                new MapSqlParameterSource()
                        .addValue("cot", cotizacionId)
                        .addValue("equipo", equipo ? 1 : 0)
                        .addValue("reactivo", reactivo ? 1 : 0)
                        .addValue("servicio", servicio ? 1 : 0));
    }

    public void copiarClausulas(long cotizacionId, int garantiaMeses, int validezDias, String moneda, String emailDatos) {
        jdbc.update("""
                        INSERT INTO cotizacion_clausulas (cotizacion_id, clausula_id, codigo, titulo, cuerpo, orden)
                        SELECT :cot, id, codigo, titulo,
                               REPLACE(REPLACE(REPLACE(REPLACE(cuerpo,
                                   '{{garantia_meses}}', :garantia),
                                   '{{validez_dias}}', :validez),
                                   '{{moneda}}', :moneda),
                                   '{{email_datos}}', :email),
                               id
                          FROM clausulas
                         WHERE activo = TRUE AND obligatoria = TRUE
                        """,
                new MapSqlParameterSource()
                        .addValue("cot", cotizacionId)
                        .addValue("garantia", String.valueOf(garantiaMeses))
                        .addValue("validez", String.valueOf(validezDias))
                        .addValue("moneda", moneda)
                        .addValue("email", emailDatos));
    }

    public void copiarNormas(long cotizacionId) {
        jdbc.update("""
                        INSERT IGNORE INTO cotizacion_normas (cotizacion_id, norma_id, nota)
                        SELECT DISTINCT :cot, r.norma_id,
                               'Referencia de cumplimiento incluida en los anexos de la oferta'
                          FROM cotizacion_requisitos r
                         WHERE r.cotizacion_id = :cot AND r.norma_id IS NOT NULL
                        """,
                Map.of("cot", cotizacionId));
    }

    public void insertHistorial(long cotizacionId, String anterior, String nuevo, Long usuarioId, String nota) {
        jdbc.update("""
                        INSERT INTO cotizacion_historial (cotizacion_id, estado_anterior, estado_nuevo, usuario_id, nota)
                        VALUES (:cot, :anterior, :nuevo, :usuario, :nota)
                        """,
                new MapSqlParameterSource()
                        .addValue("cot", cotizacionId)
                        .addValue("anterior", anterior)
                        .addValue("nuevo", nuevo)
                        .addValue("usuario", usuarioId)
                        .addValue("nota", nota));
    }

    public void cambiarEstado(long cotizacionId, String estado) {
        jdbc.update("UPDATE cotizaciones SET estado = :estado WHERE id = :id",
                new MapSqlParameterSource().addValue("estado", estado).addValue("id", cotizacionId));
    }

    public int actualizarRequisito(long cotizacionId, String codigo, String estado, String evidencia, String observaciones) {
        return jdbc.update("""
                        UPDATE cotizacion_requisitos
                           SET estado = :estado,
                               evidencia_url = COALESCE(:evidencia, evidencia_url),
                               observaciones = COALESCE(:observaciones, observaciones)
                         WHERE cotizacion_id = :cot AND requisito_codigo = :codigo
                        """,
                new MapSqlParameterSource()
                        .addValue("estado", estado)
                        .addValue("evidencia", evidencia)
                        .addValue("observaciones", observaciones)
                        .addValue("cot", cotizacionId)
                        .addValue("codigo", codigo));
    }

    public void registrarAuditoria(String tabla, long registroId, String accion, Long usuarioId, String detalleJson) {
        jdbc.update("""
                        INSERT INTO auditoria (tabla, registro_id, accion, usuario_id, detalle)
                        VALUES (:tabla, :registro, :accion, :usuario, :detalle)
                        """,
                new MapSqlParameterSource()
                        .addValue("tabla", tabla)
                        .addValue("registro", registroId)
                        .addValue("accion", accion)
                        .addValue("usuario", usuarioId)
                        .addValue("detalle", detalleJson));
    }
}

package co.genomicaandina.cotizador.dao;

import co.genomicaandina.cotizador.dto.Dtos.ClausulaDTO;
import co.genomicaandina.cotizador.dto.Dtos.ClienteDTO;
import co.genomicaandina.cotizador.dto.Dtos.ContactoDTO;
import co.genomicaandina.cotizador.dto.Dtos.CrearClienteRequest;
import co.genomicaandina.cotizador.dto.Dtos.EmpresaDTO;
import co.genomicaandina.cotizador.dto.Dtos.NormaDTO;
import co.genomicaandina.cotizador.dto.Dtos.ProductoDTO;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Repository
public class CatalogoDao {

    public record PrecioRow(BigDecimal precio, String moneda) {
    }

    private final NamedParameterJdbcTemplate jdbc;

    public CatalogoDao(NamedParameterJdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    // ------------------------------------------------------------------ empresa

    private static final String SQL_EMPRESA = """
            SELECT id, nit, digito_verificacion, razon_social, nombre_comercial, direccion, ciudad,
                   departamento, telefono, email, sitio_web, representante_legal, resolucion_facturacion,
                   regimen_tributario
              FROM empresas
             WHERE activo = TRUE
             ORDER BY id
             LIMIT 1
            """;

    public Optional<EmpresaDTO> empresaPrincipal() {
        return jdbc.query(SQL_EMPRESA, (rs, i) -> new EmpresaDTO(
                rs.getLong("id"),
                rs.getString("nit"),
                rs.getString("digito_verificacion"),
                rs.getString("razon_social"),
                rs.getString("nombre_comercial"),
                rs.getString("direccion"),
                rs.getString("ciudad"),
                rs.getString("departamento"),
                rs.getString("telefono"),
                rs.getString("email"),
                rs.getString("sitio_web"),
                rs.getString("representante_legal"),
                rs.getString("resolucion_facturacion"),
                rs.getString("regimen_tributario")
        )).stream().findFirst();
    }

    // ------------------------------------------------------------------ clientes

    private static final String SQL_CLIENTE = """
            SELECT id, tipo_documento, numero_documento, digito_verificacion, razon_social, nombre_comercial,
                   tipo_persona, tipo_cliente, regimen_tributario, responsabilidad_tributaria, actividad_economica,
                   codigo_habilitacion, direccion, ciudad, departamento, telefono, email, autoriza_datos,
                   fecha_autorizacion_datos, notas, activo
              FROM clientes
            """;

    private ClienteDTO mapCliente(ResultSet rs, List<ContactoDTO> contactos) throws SQLException {
        return new ClienteDTO(
                rs.getLong("id"),
                rs.getString("tipo_documento"),
                rs.getString("numero_documento"),
                rs.getString("digito_verificacion"),
                rs.getString("razon_social"),
                rs.getString("nombre_comercial"),
                rs.getString("tipo_persona"),
                rs.getString("tipo_cliente"),
                rs.getString("regimen_tributario"),
                rs.getString("responsabilidad_tributaria"),
                rs.getString("actividad_economica"),
                rs.getString("codigo_habilitacion"),
                rs.getString("direccion"),
                rs.getString("ciudad"),
                rs.getString("departamento"),
                rs.getString("telefono"),
                rs.getString("email"),
                rs.getBoolean("autoriza_datos"),
                toLocalDate(rs, "fecha_autorizacion_datos"),
                rs.getString("notas"),
                rs.getBoolean("activo"),
                contactos
        );
    }

    public Optional<ClienteDTO> cliente(long id) {
        List<ContactoDTO> contactos = contactos(id);
        return jdbc.query(SQL_CLIENTE + " WHERE id = :id",
                        Map.of("id", id),
                        (rs, i) -> mapCliente(rs, contactos))
                .stream().findFirst();
    }

    public Optional<ClienteDTO> clientePorDocumento(String tipo, String numero) {
        return jdbc.query(SQL_CLIENTE + " WHERE tipo_documento = :tipo AND numero_documento = :numero",
                        Map.of("tipo", tipo, "numero", numero),
                        (rs, i) -> mapCliente(rs, List.of()))
                .stream().findFirst();
    }

    public List<ClienteDTO> clientes(String q) {
        StringBuilder sql = new StringBuilder(SQL_CLIENTE).append(" WHERE activo = TRUE");
        MapSqlParameterSource params = new MapSqlParameterSource();
        if (q != null && !q.isBlank()) {
            sql.append(" AND (razon_social LIKE :q OR numero_documento LIKE :q OR nombre_comercial LIKE :q)");
            params.addValue("q", "%" + q.trim() + "%");
        }
        sql.append(" ORDER BY razon_social");
        return jdbc.query(sql.toString(), params, (rs, i) -> mapCliente(rs, List.of()));
    }

    private List<ContactoDTO> contactos(long clienteId) {
        return jdbc.query("""
                        SELECT id, nombre, cargo, email, telefono, celular, principal
                          FROM cliente_contactos
                         WHERE cliente_id = :id
                         ORDER BY principal DESC, id
                        """,
                Map.of("id", clienteId),
                (rs, i) -> new ContactoDTO(
                        rs.getLong("id"),
                        rs.getString("nombre"),
                        rs.getString("cargo"),
                        rs.getString("email"),
                        rs.getString("telefono"),
                        rs.getString("celular"),
                        rs.getBoolean("principal")
                ));
    }

    public long insertCliente(CrearClienteRequest req) {
        KeyHolder keyHolder = new GeneratedKeyHolder();
        MapSqlParameterSource p = new MapSqlParameterSource()
                .addValue("tipoDocumento", req.tipoDocumento())
                .addValue("numeroDocumento", req.numeroDocumento())
                .addValue("digitoVerificacion", req.digitoVerificacion())
                .addValue("razonSocial", req.razonSocial())
                .addValue("nombreComercial", req.nombreComercial())
                .addValue("tipoPersona", orDefault(req.tipoPersona(), "juridica"))
                .addValue("tipoCliente", orDefault(req.tipoCliente(), "otro"))
                .addValue("regimenTributario", orDefault(req.regimenTributario(), "no_aplica"))
                .addValue("responsabilidadTributaria", req.responsabilidadTributaria())
                .addValue("actividadEconomica", req.actividadEconomica())
                .addValue("codigoHabilitacion", req.codigoHabilitacion())
                .addValue("direccion", req.direccion())
                .addValue("ciudad", req.ciudad())
                .addValue("departamento", req.departamento())
                .addValue("telefono", req.telefono())
                .addValue("email", req.email())
                .addValue("autorizaDatos", Boolean.TRUE.equals(req.autorizaDatos()))
                .addValue("notas", req.notas());

        jdbc.update("""
                INSERT INTO clientes
                    (tipo_documento, numero_documento, digito_verificacion, razon_social, nombre_comercial,
                     tipo_persona, tipo_cliente, regimen_tributario, responsabilidad_tributaria, actividad_economica,
                     codigo_habilitacion, direccion, ciudad, departamento, telefono, email,
                     autoriza_datos, fecha_autorizacion_datos, notas)
                VALUES
                    (:tipoDocumento, :numeroDocumento, :digitoVerificacion, :razonSocial, :nombreComercial,
                     :tipoPersona, :tipoCliente, :regimenTributario, :responsabilidadTributaria, :actividadEconomica,
                     :codigoHabilitacion, :direccion, :ciudad, :departamento, :telefono, :email,
                     :autorizaDatos, IF(:autorizaDatos, CURDATE(), NULL), :notas)
                """, p, keyHolder, new String[]{"id"});

        long id = keyHolder.getKey().longValue();

        if (req.contactos() != null) {
            req.contactos().stream()
                    .filter(c -> c.nombre() != null && !c.nombre().isBlank())
                    .forEach(c -> jdbc.update("""
                                    INSERT INTO cliente_contactos (cliente_id, nombre, cargo, email, telefono, celular, principal)
                                    VALUES (:clienteId, :nombre, :cargo, :email, :telefono, :celular, :principal)
                                    """,
                            new MapSqlParameterSource()
                                    .addValue("clienteId", id)
                                    .addValue("nombre", c.nombre())
                                    .addValue("cargo", c.cargo())
                                    .addValue("email", c.email())
                                    .addValue("telefono", c.telefono())
                                    .addValue("celular", c.celular())
                                    .addValue("principal", c.principal())));
        }
        return id;
    }

    // ------------------------------------------------------------------ productos

    private static final String SQL_PRODUCTO = """
            SELECT p.id, p.sku, p.nombre, p.descripcion, p.tipo, p.marca, p.modelo, p.referencia_fabricante,
                   p.unidad_medida, p.requiere_cadena_frio, p.temperatura_almacenamiento, p.es_ivd,
                   p.requiere_registro_sanitario, p.clase_dispositivo, p.iva_pct, p.concepto_tributario,
                   p.aplica_retefuente,
                   p.imagen_url,
                   :moneda AS moneda,
                   (SELECT pp.precio
                      FROM producto_precios pp
                     WHERE pp.producto_id = p.id
                       AND pp.moneda = :moneda
                       AND pp.lista = 'publico'
                       AND pp.vigente_desde <= CURDATE()
                       AND (pp.vigente_hasta IS NULL OR pp.vigente_hasta >= CURDATE())
                     ORDER BY pp.vigente_desde DESC
                     LIMIT 1) AS precio,
                   r.estado_registro, r.numero_registro, r.fecha_vencimiento AS registro_vence
              FROM productos p
              LEFT JOIN v_productos_estado_regulatorio r ON r.id = p.id
             WHERE p.activo = TRUE
            """;

    private static final RowMapper<ProductoDTO> PRODUCTO = (rs, i) -> new ProductoDTO(
            rs.getLong("id"),
            rs.getString("sku"),
            rs.getString("nombre"),
            rs.getString("descripcion"),
            rs.getString("tipo"),
            rs.getString("marca"),
            rs.getString("modelo"),
            rs.getString("referencia_fabricante"),
            rs.getString("unidad_medida"),
            rs.getBoolean("requiere_cadena_frio"),
            rs.getString("temperatura_almacenamiento"),
            rs.getBoolean("es_ivd"),
            rs.getBoolean("requiere_registro_sanitario"),
            rs.getString("clase_dispositivo"),
            rs.getBigDecimal("iva_pct"),
            rs.getString("concepto_tributario"),
            rs.getBoolean("aplica_retefuente"),
            rs.getBigDecimal("precio"),
            rs.getString("moneda"),
            rs.getString("estado_registro"),
            rs.getString("numero_registro"),
            toLocalDate(rs, "registro_vence"),
            rs.getString("imagen_url")
    );

    public List<ProductoDTO> productos(String tipo, String q, String moneda) {
        StringBuilder sql = new StringBuilder(SQL_PRODUCTO);
        MapSqlParameterSource params = new MapSqlParameterSource("moneda", moneda);
        if (tipo != null && !tipo.isBlank()) {
            sql.append(" AND p.tipo = :tipo");
            params.addValue("tipo", tipo);
        }
        if (q != null && !q.isBlank()) {
            sql.append(" AND (p.nombre LIKE :q OR p.sku LIKE :q OR p.marca LIKE :q)");
            params.addValue("q", "%" + q.trim() + "%");
        }
        sql.append(" ORDER BY p.tipo, p.nombre");
        return jdbc.query(sql.toString(), params, PRODUCTO);
    }

    public Optional<ProductoDTO> producto(long id, String moneda) {
        return jdbc.query(SQL_PRODUCTO + " AND p.id = :id",
                        new MapSqlParameterSource().addValue("id", id).addValue("moneda", moneda),
                        PRODUCTO)
                .stream().findFirst();
    }

    public Optional<PrecioRow> precioVigente(long productoId, String moneda) {
        return jdbc.query("""
                        SELECT precio, moneda
                          FROM producto_precios
                         WHERE producto_id = :id
                           AND moneda = :moneda
                           AND lista = 'publico'
                           AND vigente_desde <= CURDATE()
                           AND (vigente_hasta IS NULL OR vigente_hasta >= CURDATE())
                         ORDER BY vigente_desde DESC
                         LIMIT 1
                        """,
                new MapSqlParameterSource().addValue("id", productoId).addValue("moneda", moneda),
                (rs, i) -> new PrecioRow(rs.getBigDecimal("precio"), rs.getString("moneda")))
                .stream().findFirst();
    }

    public Optional<PrecioRow> ultimoPrecio(long productoId) {
        return jdbc.query("""
                        SELECT precio, moneda
                          FROM producto_precios
                         WHERE producto_id = :id AND lista = 'publico'
                         ORDER BY vigente_desde DESC
                         LIMIT 1
                        """,
                Map.of("id", productoId),
                (rs, i) -> new PrecioRow(rs.getBigDecimal("precio"), rs.getString("moneda")))
                .stream().findFirst();
    }

    public Optional<BigDecimal> trmUsdCop() {
        return jdbc.query("""
                        SELECT tasa
                          FROM tasas_cambio
                         WHERE moneda_origen = 'USD' AND moneda_destino = 'COP'
                         ORDER BY fecha DESC
                         LIMIT 1
                        """,
                Map.of(),
                (rs, i) -> rs.getBigDecimal("tasa"))
                .stream().findFirst();
    }

    // ------------------------------------------------------------------ normativa

    public List<NormaDTO> normas() {
        return jdbc.query("""
                        SELECT codigo, titulo, entidad, anio, ambito, obligatoria
                          FROM normas
                         WHERE activo = TRUE
                         ORDER BY ambito, codigo
                        """,
                (rs, i) -> new NormaDTO(
                        rs.getString("codigo"),
                        rs.getString("titulo"),
                        rs.getString("entidad"),
                        rs.getObject("anio", Integer.class),
                        rs.getString("ambito"),
                        rs.getBoolean("obligatoria"),
                        null
                ));
    }

    public List<ClausulaDTO> clausulas() {
        return jdbc.query("""
                        SELECT codigo, titulo, cuerpo
                          FROM clausulas
                         WHERE activo = TRUE
                         ORDER BY categoria, codigo
                        """,
                (rs, i) -> new ClausulaDTO(
                        rs.getString("codigo"),
                        rs.getString("titulo"),
                        rs.getString("cuerpo")
                ));
    }

    // ------------------------------------------------------------------ utilidades

    static LocalDate toLocalDate(ResultSet rs, String column) throws SQLException {
        java.sql.Date date = rs.getDate(column);
        return date == null ? null : date.toLocalDate();
    }

    private static String orDefault(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value;
    }
}

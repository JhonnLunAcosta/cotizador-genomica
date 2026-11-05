package co.genomicaandina.cotizador.service;

import co.genomicaandina.cotizador.dao.CatalogoDao;
import co.genomicaandina.cotizador.dao.CotizacionDao;
import co.genomicaandina.cotizador.dao.CotizacionDao.ItemInsert;
import co.genomicaandina.cotizador.dto.Dtos.ActualizarRequisitoRequest;
import co.genomicaandina.cotizador.dto.Dtos.ClienteDTO;
import co.genomicaandina.cotizador.dto.Dtos.CotizacionDocumento;
import co.genomicaandina.cotizador.dto.Dtos.CotizacionResumen;
import co.genomicaandina.cotizador.dto.Dtos.CrearCotizacionRequest;
import co.genomicaandina.cotizador.dto.Dtos.DashboardDTO;
import co.genomicaandina.cotizador.dto.Dtos.EmpresaDTO;
import co.genomicaandina.cotizador.dto.Dtos.ItemRequest;
import co.genomicaandina.cotizador.dto.Dtos.ProductoDTO;
import co.genomicaandina.cotizador.seguridad.UsuarioPrincipal;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class CotizacionService {

    private final CotizacionDao dao;
    private final CatalogoDao catalogo;
    private final ConsecutivoService consecutivo;
    private final ObjectMapper mapper;
    private final BigDecimal retefuentePct;
    private final BigDecimal reteivaPct;
    private final BigDecimal reteicaPct;
    private final String correoDatos;

    public CotizacionService(CotizacionDao dao,
                             CatalogoDao catalogo,
                             ConsecutivoService consecutivo,
                             ObjectMapper mapper,
                             @Value("${app.retefuente-pct}") BigDecimal retefuentePct,
                             @Value("${app.reteiva-pct}") BigDecimal reteivaPct,
                             @Value("${app.reteica-pct}") BigDecimal reteicaPct,
                             @Value("${app.correo-datos}") String correoDatos) {
        this.dao = dao;
        this.catalogo = catalogo;
        this.consecutivo = consecutivo;
        this.mapper = mapper;
        this.retefuentePct = retefuentePct;
        this.reteivaPct = reteivaPct;
        this.reteicaPct = reteicaPct;
        this.correoDatos = correoDatos;
    }

    // ------------------------------------------------------------------ lecturas

    public List<CotizacionResumen> listar(String estado) {
        return dao.listar(estado);
    }

    public CotizacionDocumento obtener(String numero) {
        return dao.documento(numero)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "No existe la cotización " + numero));
    }

    public DashboardDTO dashboard() {
        return dao.dashboard();
    }

    // ------------------------------------------------------------------ creación

    @Transactional
    public CotizacionDocumento crear(CrearCotizacionRequest req) {
        ClienteDTO cliente = catalogo.cliente(req.clienteId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                        "No existe el cliente con id " + req.clienteId()));
        if (!cliente.activo()) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                    "El cliente " + cliente.razonSocial() + " está inactivo");
        }

        EmpresaDTO empresa = catalogo.empresaPrincipal()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                        "No hay una empresa oferente configurada"));

        String moneda = req.moneda() == null ? "COP" : req.moneda();
        int validez = req.validezDias() == null ? 15 : req.validezDias();
        int garantia = req.garantiaMeses() == null ? 12 : req.garantiaMeses();
        LocalDate hoy = LocalDate.now();
        String numero = consecutivo.siguiente(hoy.getYear());
        BigDecimal trm = catalogo.trmUsdCop().orElse(null);

        String formaPago = req.formaPago() != null && !req.formaPago().isBlank()
                ? req.formaPago()
                : "50% con la orden de compra y 50% contra entrega";
        String plazo = req.plazoEntrega() != null && !req.plazoEntrega().isBlank()
                ? req.plazoEntrega()
                : "Equipos: 45 días calendario. Reactivos: 15 días calendario.";
        String lugar = req.lugarEntrega() != null && !req.lugarEntrega().isBlank()
                ? req.lugarEntrega()
                : cliente.direccion() + ", " + cliente.ciudad();
        String garantiaDetalle = req.garantiaDetalle() != null && !req.garantiaDetalle().isBlank()
                ? req.garantiaDetalle()
                : "Garantía de " + garantia + " meses por defectos de fabricación, con soporte técnico y repuestos incluidos.";
        String condiciones = "Precios expresados en " + moneda
                + ". IVA discriminado. Retención en la fuente sobre servicios y reteICA según las tarifas vigentes.";
        String declaracion = "El OFERENTE declara que los equipos y reactivos ofrecidos cuentan con registro sanitario "
                + "vigente ante el INVIMA cuando la normativa lo exige, y entrega los certificados y protocolos de "
                + "validación relacionados en el checklist regulatorio anexo. El CLIENTE declara conocer y aceptar las "
                + "condiciones de uso, almacenamiento y gestión de residuos descritas en la oferta.";

        Long usuario = usuarioActual();

        long id = dao.insertCotizacion(numero, empresa.id(), cliente.id(), hoy, validez, moneda, trm,
                trm == null ? null : hoy, formaPago, plazo, lugar, garantia, garantiaDetalle,
                retefuentePct, reteivaPct, reteicaPct, declaracion, req.observaciones(), condiciones,
                json(empresa), json(cliente), usuario);

        boolean equipo = false;
        boolean reactivo = false;
        boolean servicio = false;
        int orden = 0;

        for (ItemRequest item : req.items()) {
            orden++;
            ProductoDTO producto = catalogo.producto(item.productoId(), moneda)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                            "No existe el producto con id " + item.productoId()));

            BigDecimal precio = item.precioUnitario() != null
                    ? item.precioUnitario()
                    : resolverPrecio(producto, moneda);

            if (precio == null || precio.signum() <= 0) {
                throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                        "El producto " + producto.sku() + " no tiene un precio válido en " + moneda);
            }

            switch (producto.tipo()) {
                case "equipo" -> equipo = true;
                case "reactivo" -> reactivo = true;
                case "servicio" -> servicio = true;
                default -> {
                }
            }

            dao.insertItem(id, new ItemInsert(
                    orden,
                    producto.id(),
                    producto.tipo(),
                    producto.sku(),
                    producto.nombre(),
                    producto.marca(),
                    producto.modelo(),
                    producto.unidadMedida(),
                    item.cantidad(),
                    precio.setScale(2, RoundingMode.HALF_UP),
                    item.descuentoPct() == null ? BigDecimal.ZERO : item.descuentoPct(),
                    producto.ivaPct(),
                    producto.aplicaRetefuente(),
                    producto.numeroRegistro(),
                    producto.registroVence(),
                    tiempoEntrega(producto.tipo()),
                    null
            ));
        }

        dao.copiarRequisitos(id, equipo, reactivo, servicio);
        dao.copiarClausulas(id, garantia, validez, moneda, correoDatos);
        dao.copiarNormas(id);
        dao.insertHistorial(id, null, "borrador", usuario, "Cotización creada desde la API");
        dao.registrarAuditoria("cotizaciones", id, "crear", usuario, json(Map.of("numero", numero)));

        return obtener(numero);
    }

    // ------------------------------------------------------------------ operación

    @Transactional
    public CotizacionDocumento cambiarEstado(String numero, String estado, String nota) {
        long id = dao.idPorNumero(numero)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "No existe la cotización " + numero));
        String actual = dao.estadoPorNumero(numero).orElse("borrador");

        if (!actual.equals(estado)) {
            Long usuario = usuarioActual();
            dao.cambiarEstado(id, estado);
            dao.insertHistorial(id, actual, estado, usuario,
                    nota == null || nota.isBlank() ? "Cambio de estado desde la API" : nota);
            dao.registrarAuditoria("cotizaciones", id, "cambiar_estado", usuario,
                    json(Map.of("de", actual, "a", estado)));
        }
        return obtener(numero);
    }

    @Transactional
    public CotizacionDocumento actualizarRequisito(String numero, String codigo, ActualizarRequisitoRequest req) {
        long id = dao.idPorNumero(numero)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "No existe la cotización " + numero));

        int filas = dao.actualizarRequisito(id, codigo, req.estado(), req.evidenciaUrl(), req.observaciones());
        if (filas == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,
                    "La cotización " + numero + " no tiene el requisito " + codigo);
        }
        return obtener(numero);
    }

    // ------------------------------------------------------------------ auxiliares

    /**
     * Usuario autenticado que ejecuta la acción. Si no hay contexto de seguridad
     * (por ejemplo una tarea programada), cae al administrador activo.
     */
    private Long usuarioActual() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof UsuarioPrincipal principal) {
            return principal.id();
        }
        return dao.usuarioAdmin().orElse(null);
    }

    private BigDecimal resolverPrecio(ProductoDTO producto, String moneda) {
        if (producto.precio() != null) {
            return producto.precio();
        }
        var ultimo = catalogo.ultimoPrecio(producto.id())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                        "El producto " + producto.sku() + " no tiene precio vigente"));

        if (ultimo.moneda().equals(moneda)) {
            return ultimo.precio();
        }

        BigDecimal trm = catalogo.trmUsdCop()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                        "No hay TRM registrada para convertir el precio de " + producto.sku()));

        if ("COP".equals(moneda) && "USD".equals(ultimo.moneda())) {
            return ultimo.precio().multiply(trm).setScale(2, RoundingMode.HALF_UP);
        }
        if ("USD".equals(moneda) && "COP".equals(ultimo.moneda())) {
            return ultimo.precio().divide(trm, 2, RoundingMode.HALF_UP);
        }
        throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                "No hay precio en " + moneda + " para el producto " + producto.sku());
    }

    private static String tiempoEntrega(String tipo) {
        return switch (tipo) {
            case "equipo" -> "45 días calendario";
            case "reactivo" -> "15 días calendario";
            case "consumible" -> "10 días calendario";
            case "servicio" -> "30 días calendario";
            case "software" -> "5 días calendario";
            default -> "30 días calendario";
        };
    }

    private String json(Object value) {
        try {
            return mapper.writeValueAsString(value);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("No se pudo serializar el snapshot", e);
        }
    }

    private String json(EmpresaDTO empresa) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("nit", empresa.nit());
        m.put("razonSocial", empresa.razonSocial());
        m.put("direccion", empresa.direccion());
        m.put("ciudad", empresa.ciudad());
        m.put("telefono", empresa.telefono());
        m.put("email", empresa.email());
        m.put("resolucionFacturacion", empresa.resolucionFacturacion());
        return json((Object) m);
    }

    private String json(ClienteDTO cliente) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("tipoDocumento", cliente.tipoDocumento());
        m.put("numeroDocumento", cliente.numeroDocumento());
        m.put("razonSocial", cliente.razonSocial());
        m.put("direccion", cliente.direccion());
        m.put("ciudad", cliente.ciudad());
        m.put("email", cliente.email());
        m.put("codigoHabilitacion", cliente.codigoHabilitacion());
        return json((Object) m);
    }
}

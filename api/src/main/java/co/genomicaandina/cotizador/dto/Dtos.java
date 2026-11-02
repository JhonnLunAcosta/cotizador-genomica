package co.genomicaandina.cotizador.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Contrato de la API. Se agrupan como records anidados para mantener un único
 * archivo de referencia del modelo de lectura/escritura.
 */
public final class Dtos {

    private Dtos() {
    }

    // ------------------------------------------------------------------ catálogo

    public record ContactoDTO(
            Long id,
            String nombre,
            String cargo,
            String email,
            String telefono,
            String celular,
            boolean principal
    ) {
    }

    public record ClienteDTO(
            Long id,
            String tipoDocumento,
            String numeroDocumento,
            String digitoVerificacion,
            String razonSocial,
            String nombreComercial,
            String tipoPersona,
            String tipoCliente,
            String regimenTributario,
            String responsabilidadTributaria,
            String actividadEconomica,
            String codigoHabilitacion,
            String direccion,
            String ciudad,
            String departamento,
            String telefono,
            String email,
            boolean autorizaDatos,
            LocalDate fechaAutorizacionDatos,
            String notas,
            boolean activo,
            List<ContactoDTO> contactos
    ) {
    }

    public record EmpresaDTO(
            Long id,
            String nit,
            String digitoVerificacion,
            String razonSocial,
            String nombreComercial,
            String direccion,
            String ciudad,
            String departamento,
            String telefono,
            String email,
            String sitioWeb,
            String representanteLegal,
            String resolucionFacturacion,
            String regimenTributario
    ) {
    }

    public record ProductoDTO(
            Long id,
            String sku,
            String nombre,
            String descripcion,
            String tipo,
            String marca,
            String modelo,
            String referenciaFabricante,
            String unidadMedida,
            boolean requiereCadenaFrio,
            String temperaturaAlmacenamiento,
            boolean esIvd,
            boolean requiereRegistroSanitario,
            String claseDispositivo,
            BigDecimal ivaPct,
            String conceptoTributario,
            boolean aplicaRetefuente,
            BigDecimal precio,
            String moneda,
            String estadoRegistro,
            String numeroRegistro,
            LocalDate registroVence,
            String imagenUrl
    ) {
    }

    public record RegistroAlertaDTO(
            String sku,
            String nombre,
            String estadoRegistro,
            String numeroRegistro,
            LocalDate fechaVencimiento
    ) {
    }

    public record NormaDTO(
            String codigo,
            String titulo,
            String entidad,
            Integer anio,
            String ambito,
            boolean obligatoria,
            String nota
    ) {
    }

    public record ClausulaDTO(
            String codigo,
            String titulo,
            String cuerpo
    ) {
    }

    // ------------------------------------------------------------------ cotizaciones

    public record ItemRequest(
            @NotNull(message = "productoId es obligatorio")
            Long productoId,
            @NotNull(message = "la cantidad es obligatoria")
            @DecimalMin(value = "0.001", message = "la cantidad debe ser mayor a 0")
            BigDecimal cantidad,
            @DecimalMin(value = "0", message = "el descuento no puede ser negativo")
            @DecimalMax(value = "100", message = "el descuento no puede superar 100")
            BigDecimal descuentoPct,
            @DecimalMin(value = "0", message = "el precio no puede ser negativo")
            BigDecimal precioUnitario
    ) {
    }

    public record CrearCotizacionRequest(
            @NotNull(message = "clienteId es obligatorio")
            Long clienteId,
            @Min(value = 1, message = "la validez mínima es 1 día")
            @Max(value = 365, message = "la validez máxima es 365 días")
            Integer validezDias,
            @Pattern(regexp = "COP|USD|EUR", message = "moneda debe ser COP, USD o EUR")
            String moneda,
            @Size(max = 300, message = "la forma de pago es demasiado larga")
            String formaPago,
            @Size(max = 300, message = "el plazo de entrega es demasiado largo")
            String plazoEntrega,
            @Size(max = 200, message = "el lugar de entrega es demasiado largo")
            String lugarEntrega,
            @Min(value = 0, message = "la garantía no puede ser negativa")
            @Max(value = 120, message = "la garantía máxima es 120 meses")
            Integer garantiaMeses,
            @Size(max = 1000, message = "el detalle de garantía es demasiado largo")
            String garantiaDetalle,
            @Size(max = 2000, message = "las observaciones son demasiado largas")
            String observaciones,
            @NotEmpty(message = "la cotización debe tener al menos un ítem")
            @Size(max = 200, message = "la cotización no puede tener más de 200 ítems")
            @Valid
            List<ItemRequest> items
    ) {
    }

    public record CrearClienteRequest(
            @NotBlank(message = "el tipo de documento es obligatorio")
            @Size(max = 20, message = "el tipo de documento es demasiado largo")
            String tipoDocumento,
            @NotBlank(message = "el número de documento es obligatorio")
            @Size(max = 40, message = "el número de documento es demasiado largo")
            String numeroDocumento,
            @Size(max = 4, message = "el dígito de verificación es demasiado largo")
            String digitoVerificacion,
            @NotBlank(message = "la razón social es obligatoria")
            @Size(max = 200, message = "la razón social es demasiado larga")
            String razonSocial,
            @Size(max = 200, message = "el nombre comercial es demasiado largo")
            String nombreComercial,
            @Size(max = 40, message = "el tipo de persona es demasiado largo")
            String tipoPersona,
            @Size(max = 40, message = "el tipo de cliente es demasiado largo")
            String tipoCliente,
            @Size(max = 80, message = "el régimen tributario es demasiado largo")
            String regimenTributario,
            @Size(max = 160, message = "la responsabilidad tributaria es demasiado larga")
            String responsabilidadTributaria,
            @Size(max = 20, message = "la actividad económica es demasiado larga")
            String actividadEconomica,
            @Size(max = 40, message = "el código de habilitación es demasiado largo")
            String codigoHabilitacion,
            @NotBlank(message = "la dirección es obligatoria")
            @Size(max = 200, message = "la dirección es demasiado larga")
            String direccion,
            @NotBlank(message = "la ciudad es obligatoria")
            @Size(max = 80, message = "la ciudad es demasiado larga")
            String ciudad,
            @NotBlank(message = "el departamento es obligatorio")
            @Size(max = 80, message = "el departamento es demasiado largo")
            String departamento,
            @Size(max = 40, message = "el teléfono es demasiado largo")
            String telefono,
            @Email(message = "el correo no tiene formato válido")
            @Size(max = 160, message = "el correo es demasiado largo")
            String email,
            Boolean autorizaDatos,
            @Size(max = 2000, message = "las notas son demasiado largas")
            String notas,
            @Size(max = 20, message = "no se pueden registrar más de 20 contactos")
            @Valid
            List<ContactoDTO> contactos
    ) {
    }

    public record CambiarEstadoRequest(
            @NotBlank(message = "el estado es obligatorio")
            @Pattern(regexp = "borrador|en_revision|enviada|negociacion|aceptada|rechazada|vencida|anulada",
                    message = "estado no válido")
            String estado,
            @Size(max = 1000, message = "la nota es demasiado larga")
            String nota
    ) {
    }

    public record ActualizarRequisitoRequest(
            @NotBlank(message = "el estado es obligatorio")
            @Pattern(regexp = "pendiente|cumplido|no_aplica", message = "estado no válido")
            String estado,
            @Size(max = 500, message = "la URL de evidencia es demasiado larga")
            String evidenciaUrl,
            @Size(max = 1000, message = "las observaciones son demasiado largas")
            String observaciones
    ) {
    }

    // ------------------------------------------------------------------ documento

    public record TotalesDTO(
            BigDecimal subtotal,
            BigDecimal ivaTotal,
            BigDecimal totalBruto,
            BigDecimal retefuente,
            BigDecimal reteiva,
            BigDecimal reteica,
            BigDecimal totalNeto
    ) {
    }

    public record ItemDocumento(
            int orden,
            String tipo,
            String sku,
            String descripcion,
            String marca,
            String modelo,
            String unidadMedida,
            BigDecimal cantidad,
            BigDecimal precioUnitario,
            BigDecimal descuentoPct,
            BigDecimal ivaPct,
            BigDecimal subtotal,
            BigDecimal ivaValor,
            BigDecimal total,
            String registroSanitario,
            LocalDate registroVence,
            String tiempoEntrega,
            String observaciones,
            String imagenUrl
    ) {
    }

    public record RequisitoDTO(
            String codigo,
            String titulo,
            String categoria,
            String norma,
            boolean obligatorio,
            String estado,
            String evidenciaUrl,
            String observaciones
    ) {
    }

    public record CotizacionDocumento(
            Long id,
            String numero,
            int version,
            String estado,
            String estadoEfectivo,
            LocalDate fechaEmision,
            LocalDate fechaVencimiento,
            int validezDias,
            String moneda,
            BigDecimal trm,
            EmpresaDTO empresa,
            ClienteDTO cliente,
            List<ItemDocumento> items,
            TotalesDTO totales,
            List<RequisitoDTO> requisitos,
            List<ClausulaDTO> clausulas,
            List<NormaDTO> normas,
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

    public record CotizacionResumen(
            Long id,
            String numero,
            int version,
            String estado,
            String estadoEfectivo,
            LocalDate fechaEmision,
            LocalDate fechaVencimiento,
            long diasParaVencer,
            String cliente,
            String clienteDocumento,
            String moneda,
            BigDecimal subtotal,
            BigDecimal ivaTotal,
            BigDecimal totalBruto,
            BigDecimal retefuente,
            BigDecimal reteica,
            BigDecimal totalNeto,
            int requisitosPendientes,
            int itemsRegistroVencido
    ) {
    }

    public record AlertaDTO(
            String numero,
            String cliente,
            String estado,
            LocalDate fechaVencimiento,
            long diasParaVencer,
            int requisitosPendientes,
            int itemsRegistroVencido,
            BigDecimal totalNeto
    ) {
    }

    public record DashboardDTO(
            long total,
            long borradores,
            long enviadas,
            long aceptadas,
            BigDecimal pipeline,
            BigDecimal aceptado,
            List<CotizacionResumen> recientes,
            List<AlertaDTO> alertas,
            List<RegistroAlertaDTO> registrosPorVencer
    ) {
    }
}

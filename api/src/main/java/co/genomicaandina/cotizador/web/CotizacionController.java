package co.genomicaandina.cotizador.web;

import co.genomicaandina.cotizador.dto.Dtos.CambiarEstadoRequest;
import co.genomicaandina.cotizador.dto.Dtos.CotizacionDocumento;
import co.genomicaandina.cotizador.dto.Dtos.CotizacionResumen;
import co.genomicaandina.cotizador.dto.Dtos.CrearCotizacionRequest;
import co.genomicaandina.cotizador.dto.Dtos.ActualizarRequisitoRequest;
import co.genomicaandina.cotizador.service.CotizacionService;
import co.genomicaandina.cotizador.service.PdfService;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/cotizaciones")
public class CotizacionController {

    private final CotizacionService service;
    private final PdfService pdfService;

    public CotizacionController(CotizacionService service, PdfService pdfService) {
        this.service = service;
        this.pdfService = pdfService;
    }

    @GetMapping
    public List<CotizacionResumen> listar(@RequestParam(required = false) String estado) {
        return service.listar(estado);
    }

    @GetMapping("/{numero}")
    public CotizacionDocumento obtener(@PathVariable String numero) {
        return service.obtener(numero);
    }

    @PostMapping
    public ResponseEntity<CotizacionDocumento> crear(@Valid @RequestBody CrearCotizacionRequest request) {
        CotizacionDocumento documento = service.crear(request);
        return ResponseEntity
                .created(URI.create("/api/cotizaciones/" + documento.numero()))
                .body(documento);
    }

    @PatchMapping("/{numero}/estado")
    public CotizacionDocumento cambiarEstado(@PathVariable String numero,
                                             @Valid @RequestBody CambiarEstadoRequest request) {
        return service.cambiarEstado(numero, request.estado(), request.nota());
    }

    @PatchMapping("/{numero}/requisitos/{codigo}")
    public CotizacionDocumento actualizarRequisito(@PathVariable String numero,
                                                   @PathVariable String codigo,
                                                   @Valid @RequestBody ActualizarRequisitoRequest request) {
        return service.actualizarRequisito(numero, codigo, request);
    }

    @GetMapping(value = "/{numero}/pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> pdf(@PathVariable String numero) {
        byte[] pdf = pdfService.generar(numero);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + numero + ".pdf\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }
}

package co.genomicaandina.cotizador.web;

import co.genomicaandina.cotizador.dto.AsistenteDtos.ChatRequest;
import co.genomicaandina.cotizador.seguridad.UsuarioPrincipal;
import co.genomicaandina.cotizador.service.AsistenteService;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.Map;

@RestController
@RequestMapping("/api/asistente")
public class AsistenteController {

    private final AsistenteService asistente;

    public AsistenteController(AsistenteService asistente) {
        this.asistente = asistente;
    }

    @GetMapping("/estado")
    public Map<String, Object> estado() {
        return Map.of(
                "disponible", asistente.disponible(),
                "modelo", asistente.modelo()
        );
    }

    @PostMapping(value = "/chat", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter chat(@Valid @RequestBody ChatRequest request,
                           @AuthenticationPrincipal UsuarioPrincipal principal) {
        SseEmitter emitter = new SseEmitter(300_000L);
        asistente.responder(principal, request.mensajes(), emitter);
        return emitter;
    }
}

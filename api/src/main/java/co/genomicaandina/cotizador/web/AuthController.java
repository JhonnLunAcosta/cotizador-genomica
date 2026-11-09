package co.genomicaandina.cotizador.web;

import co.genomicaandina.cotizador.dto.AuthDtos.CambiarPasswordRequest;
import co.genomicaandina.cotizador.dto.AuthDtos.LoginRequest;
import co.genomicaandina.cotizador.seguridad.UsuarioPrincipal;
import co.genomicaandina.cotizador.seguridad.UsuarioService;
import co.genomicaandina.cotizador.seguridad.UsuarioSesion;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UsuarioService usuarios;
    private final SecurityContextRepository contextRepository;

    public AuthController(UsuarioService usuarios, SecurityContextRepository contextRepository) {
        this.usuarios = usuarios;
        this.contextRepository = contextRepository;
    }

    /**
     * Fuerza la creación de la cookie XSRF-TOKEN antes del primer POST.
     */
    @GetMapping("/csrf")
    public ResponseEntity<Void> csrf() {
        return ResponseEntity.noContent()
                .header(HttpHeaders.CACHE_CONTROL, "no-store")
                .build();
    }

    @PostMapping("/login")
    public ResponseEntity<UsuarioSesion> login(@Valid @RequestBody LoginRequest request,
                                               HttpServletRequest httpRequest,
                                               HttpServletResponse httpResponse) {
        UsuarioService.Acceso acceso = usuarios.autenticar(request);

        SecurityContext contexto = SecurityContextHolder.createEmptyContext();
        contexto.setAuthentication(acceso.autenticacion());
        SecurityContextHolder.setContext(contexto);

        // Rotación del identificador de sesión para evitar fijación de sesión.
        httpRequest.getSession(true);
        httpRequest.changeSessionId();
        contextRepository.saveContext(contexto, httpRequest, httpResponse);

        return ResponseEntity.ok()
                .header(HttpHeaders.CACHE_CONTROL, "no-store")
                .body(acceso.principal().sesion());
    }

    @GetMapping("/me")
    public UsuarioSesion me(@AuthenticationPrincipal UsuarioPrincipal principal) {
        return usuarios.sesion(principal.id());
    }

    @PostMapping("/password")
    public ResponseEntity<Void> cambiarPassword(@Valid @RequestBody CambiarPasswordRequest request,
                                                @AuthenticationPrincipal UsuarioPrincipal principal) {
        usuarios.cambiarPassword(principal.id(), request.actual(), request.nueva());
        return ResponseEntity.noContent().build();
    }
}

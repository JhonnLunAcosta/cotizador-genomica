package co.genomicaandina.cotizador.seguridad;

import co.genomicaandina.cotizador.dto.AuthDtos.LoginRequest;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.util.Locale;

@Service
public class UsuarioService {

    private static final int MAX_INTENTOS = 5;

    private final UsuarioDao dao;
    private final PasswordEncoder encoder;
    private final AuthenticationManager authenticationManager;

    public UsuarioService(UsuarioDao dao, PasswordEncoder encoder,
                          AuthenticationManager authenticationManager) {
        this.dao = dao;
        this.encoder = encoder;
        this.authenticationManager = authenticationManager;
    }

    /**
     * Valida credenciales y devuelve el principal ya autenticado.
     * Los mensajes de error son genéricos para no revelar si el correo existe.
     */
    public Acceso autenticar(LoginRequest req) {
        String email = req.email().trim().toLowerCase(Locale.ROOT);
        UsuarioPrincipal principal = dao.buscarPorEmail(email).orElse(null);

        if (principal != null && principal.bloqueado()) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,
                    "Demasiados intentos fallidos. Espera unos minutos e inténtalo de nuevo.");
        }

        try {
            var autenticacion = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(email, req.password()));
            UsuarioPrincipal autenticado = (UsuarioPrincipal) autenticacion.getPrincipal();
            dao.registrarAcceso(autenticado.id());
            return new Acceso(autenticado, autenticacion);
        } catch (AuthenticationException ex) {
            if (principal != null) {
                int intentos = dao.registrarFallo(principal.id());
                if (intentos >= MAX_INTENTOS) {
                    throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,
                            "Demasiados intentos fallidos. La cuenta estará bloqueada 15 minutos.");
                }
            }
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,
                    "Correo o contraseña incorrectos.");
        }
    }

    public UsuarioSesion sesion(long id) {
        return dao.buscarPorId(id)
                .map(UsuarioPrincipal::sesion)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED,
                        "La sesión ya no es válida. Vuelve a iniciar sesión."));
    }

    public void cambiarPassword(long id, String actual, String nueva) {
        UsuarioPrincipal principal = dao.buscarPorId(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED,
                        "La sesión ya no es válida. Vuelve a iniciar sesión."));

        if (!encoder.matches(actual, principal.getPassword())) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                    "La contraseña actual no es correcta.");
        }
        validarFortaleza(nueva, principal.email());
        if (encoder.matches(nueva, principal.getPassword())) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                    "La nueva contraseña debe ser diferente a la actual.");
        }

        dao.actualizarPassword(id, encoder.encode(nueva));
    }

    private void validarFortaleza(String nueva, String email) {
        if (nueva.getBytes(StandardCharsets.UTF_8).length > 72) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                    "La contraseña no puede superar 72 bytes.");
        }
        if (!nueva.matches(".*[A-Za-zÁÉÍÓÚáéíóúÑñ].*") || !nueva.matches(".*\\d.*")) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                    "La contraseña debe incluir al menos una letra y un número.");
        }
        String usuario = email.split("@")[0].toLowerCase(Locale.ROOT);
        if (usuario.length() >= 4 && nueva.toLowerCase(Locale.ROOT).contains(usuario)) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                    "La contraseña no puede contener tu correo.");
        }
        if (nueva.matches("(?i).*(1234|12345|password|qwerty|admin|genomica).*")) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                    "Esa contraseña es demasiado predecible. Elige otra.");
        }
    }

    public record Acceso(UsuarioPrincipal principal, Authentication autenticacion) {
    }
}

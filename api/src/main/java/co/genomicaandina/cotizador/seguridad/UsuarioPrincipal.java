package co.genomicaandina.cotizador.seguridad;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Locale;

/**
 * Principal de Spring Security respaldado por la tabla {@code usuarios}.
 */
public class UsuarioPrincipal implements UserDetails {

    private final long id;
    private final String nombre;
    private final String email;
    private final String rol;
    private final String passwordHash;
    private final boolean activo;
    private final boolean debeCambiarPassword;
    private final LocalDateTime bloqueadoHasta;

    public UsuarioPrincipal(long id, String nombre, String email, String rol,
                            String passwordHash, boolean activo, boolean debeCambiarPassword,
                            LocalDateTime bloqueadoHasta) {
        this.id = id;
        this.nombre = nombre;
        this.email = email;
        this.rol = rol;
        this.passwordHash = passwordHash;
        this.activo = activo;
        this.debeCambiarPassword = debeCambiarPassword;
        this.bloqueadoHasta = bloqueadoHasta;
    }

    public long id() {
        return id;
    }

    public String nombre() {
        return nombre;
    }

    public String email() {
        return email;
    }

    public String rol() {
        return rol;
    }

    public boolean debeCambiarPassword() {
        return debeCambiarPassword;
    }

    public boolean bloqueado() {
        return bloqueadoHasta != null && bloqueadoHasta.isAfter(LocalDateTime.now());
    }

    public UsuarioSesion sesion() {
        return new UsuarioSesion(id, nombre, email, rol, debeCambiarPassword);
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + rol.toUpperCase(Locale.ROOT)));
    }

    @Override
    public String getPassword() {
        return passwordHash;
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return !bloqueado();
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return activo;
    }
}

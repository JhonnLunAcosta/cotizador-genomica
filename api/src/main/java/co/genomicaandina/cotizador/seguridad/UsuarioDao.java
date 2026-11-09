package co.genomicaandina.cotizador.seguridad;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public class UsuarioDao {

    private static final String COLUMNAS = """
            id, nombre, email, rol, password_hash, activo,
            debe_cambiar_password, bloqueado_hasta
            """;

    private final JdbcTemplate jdbc;

    public UsuarioDao(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public Optional<UsuarioPrincipal> buscarPorEmail(String email) {
        return jdbc.query("SELECT " + COLUMNAS + " FROM usuarios WHERE LOWER(email) = LOWER(?)",
                        (rs, i) -> mapear(rs), email)
                .stream()
                .findFirst();
    }

    public Optional<UsuarioPrincipal> buscarPorId(long id) {
        return jdbc.query("SELECT " + COLUMNAS + " FROM usuarios WHERE id = ?",
                        (rs, i) -> mapear(rs), id)
                .stream()
                .findFirst();
    }

    public void registrarAcceso(long id) {
        jdbc.update("""
                UPDATE usuarios
                   SET intentos_fallidos = 0,
                       bloqueado_hasta = NULL,
                       ultimo_acceso = CURRENT_TIMESTAMP
                 WHERE id = ?
                """, id);
    }

    /**
     * Suma un intento fallido y bloquea la cuenta 15 minutos al llegar a 5.
     * Se hace en una sola sentencia para que dos intentos simultáneos no se pisen.
     */
    public int registrarFallo(long id) {
        jdbc.update("""
                UPDATE usuarios
                   SET intentos_fallidos = intentos_fallidos + 1,
                       bloqueado_hasta = CASE
                           WHEN intentos_fallidos + 1 >= 5
                                THEN DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 15 MINUTE)
                           ELSE bloqueado_hasta
                       END
                 WHERE id = ?
                """, id);
        Integer intentos = jdbc.queryForObject(
                "SELECT intentos_fallidos FROM usuarios WHERE id = ?", Integer.class, id);
        return intentos == null ? 0 : intentos;
    }

    public void actualizarPassword(long id, String hash) {
        jdbc.update("""
                UPDATE usuarios
                   SET password_hash = ?,
                       debe_cambiar_password = FALSE,
                       intentos_fallidos = 0,
                       bloqueado_hasta = NULL
                 WHERE id = ?
                """, hash, id);
    }

    private UsuarioPrincipal mapear(ResultSet rs) throws SQLException {
        Timestamp bloqueo = rs.getTimestamp("bloqueado_hasta");
        LocalDateTime bloqueadoHasta = bloqueo == null ? null : bloqueo.toLocalDateTime();
        String hash = rs.getString("password_hash");
        return new UsuarioPrincipal(
                rs.getLong("id"),
                rs.getString("nombre"),
                rs.getString("email"),
                rs.getString("rol"),
                hash,
                rs.getBoolean("activo"),
                rs.getBoolean("debe_cambiar_password"),
                bloqueadoHasta
        );
    }
}

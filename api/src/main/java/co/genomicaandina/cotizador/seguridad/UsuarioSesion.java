package co.genomicaandina.cotizador.seguridad;

/**
 * Datos mínimos del usuario autenticado que viajan al frontend.
 * Nunca incluye el hash de la contraseña.
 */
public record UsuarioSesion(
        long id,
        String nombre,
        String email,
        String rol,
        boolean debeCambiarPassword
) {
}

package co.genomicaandina.cotizador.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Contratos de autenticación. No se exponen en el documento OpenAPI público.
 */
public final class AuthDtos {

    private AuthDtos() {
    }

    public record LoginRequest(
            @NotBlank(message = "el correo es obligatorio")
            @Email(message = "el correo no tiene formato válido")
            @Size(max = 160, message = "el correo es demasiado largo")
            String email,

            @NotBlank(message = "la contraseña es obligatoria")
            @Size(min = 8, max = 72, message = "la contraseña debe tener entre 8 y 72 caracteres")
            String password
    ) {
    }

    public record CambiarPasswordRequest(
            @NotBlank(message = "la contraseña actual es obligatoria")
            @Size(max = 72, message = "la contraseña actual es demasiado larga")
            String actual,

            @NotBlank(message = "la nueva contraseña es obligatoria")
            @Size(min = 10, max = 72, message = "la nueva contraseña debe tener entre 10 y 72 caracteres")
            String nueva
    ) {
    }
}

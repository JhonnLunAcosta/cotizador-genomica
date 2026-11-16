package co.genomicaandina.cotizador.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.List;

public final class AsistenteDtos {

    private AsistenteDtos() {
    }

    public record Mensaje(
            @NotBlank(message = "el mensaje no puede estar vacío")
            @Size(max = 4000, message = "el mensaje es demasiado largo")
            String contenido,

            @NotBlank(message = "el rol es obligatorio")
            @Pattern(regexp = "usuario|asistente", message = "rol no válido")
            String rol
    ) {
    }

    public record ChatRequest(
            @NotEmpty(message = "envía al menos un mensaje")
            @Size(max = 20, message = "la conversación es demasiado larga")
            @Valid
            List<Mensaje> mensajes
    ) {
    }
}

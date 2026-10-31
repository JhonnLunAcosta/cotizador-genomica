package co.genomicaandina.cotizador.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI cotizadorOpenAPI() {
        return new OpenAPI().info(new Info()
                .title("Cotizador Genómica API")
                .version("1.0.0")
                .description("""
                        Cotizaciones de equipos, reactivos y servicios de secuenciación genómica.
                        Calcula totales con IVA y retenciones, copia el checklist regulatorio colombiano,
                        registra el historial de estados y genera el PDF de la oferta.""")
                .contact(new Contact()
                        .name("Genómica Andina S.A.S.")
                        .email("comercial@genomicaandina.co")));
    }
}

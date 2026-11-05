package co.genomicaandina.cotizador.web;

import co.genomicaandina.cotizador.dto.Dtos.DashboardDTO;
import co.genomicaandina.cotizador.service.CotizacionService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final CotizacionService service;

    public DashboardController(CotizacionService service) {
        this.service = service;
    }

    @GetMapping
    public DashboardDTO dashboard() {
        return service.dashboard();
    }
}

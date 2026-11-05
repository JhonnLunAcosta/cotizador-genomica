package co.genomicaandina.cotizador.web;

import co.genomicaandina.cotizador.dao.CatalogoDao;
import co.genomicaandina.cotizador.dto.Dtos.ClausulaDTO;
import co.genomicaandina.cotizador.dto.Dtos.NormaDTO;
import co.genomicaandina.cotizador.dto.Dtos.ProductoDTO;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api")
public class CatalogoController {

    private final CatalogoDao catalogo;

    public CatalogoController(CatalogoDao catalogo) {
        this.catalogo = catalogo;
    }

    @GetMapping("/productos")
    public List<ProductoDTO> productos(@RequestParam(required = false) String tipo,
                                       @RequestParam(required = false) String q,
                                       @RequestParam(defaultValue = "COP") String moneda) {
        return catalogo.productos(tipo, q, moneda);
    }

    @GetMapping("/normas")
    public List<NormaDTO> normas() {
        return catalogo.normas();
    }

    @GetMapping("/clausulas")
    public List<ClausulaDTO> clausulas() {
        return catalogo.clausulas();
    }
}

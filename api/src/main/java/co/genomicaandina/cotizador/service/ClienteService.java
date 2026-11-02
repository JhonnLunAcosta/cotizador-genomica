package co.genomicaandina.cotizador.service;

import co.genomicaandina.cotizador.dao.CatalogoDao;
import co.genomicaandina.cotizador.dto.Dtos.ClienteDTO;
import co.genomicaandina.cotizador.dto.Dtos.CrearClienteRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class ClienteService {

    private final CatalogoDao catalogo;

    public ClienteService(CatalogoDao catalogo) {
        this.catalogo = catalogo;
    }

    public List<ClienteDTO> listar(String q) {
        return catalogo.clientes(q);
    }

    public ClienteDTO obtener(long id) {
        return catalogo.cliente(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "No existe el cliente con id " + id));
    }

    @Transactional
    public ClienteDTO crear(CrearClienteRequest req) {
        catalogo.clientePorDocumento(req.tipoDocumento(), req.numeroDocumento()).ifPresent(c -> {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Ya existe un cliente con " + req.tipoDocumento() + " " + req.numeroDocumento()
                            + " (" + c.razonSocial() + ")");
        });

        long id = catalogo.insertCliente(req);
        return catalogo.cliente(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                        "El cliente se creó pero no se pudo leer"));
    }
}

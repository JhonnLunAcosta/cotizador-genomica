package co.genomicaandina.cotizador.service;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ConsecutivoService {

    private final JdbcTemplate jdbc;

    public ConsecutivoService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    /**
     * Reserva el siguiente número de cotización del año. Debe invocarse dentro de
     * una transacción: el SELECT ... FOR UPDATE serializa las solicitudes concurrentes.
     */
    @Transactional(propagation = Propagation.MANDATORY)
    public String siguiente(int anio) {
        jdbc.update("""
                INSERT IGNORE INTO consecutivos (tipo, prefijo, anio, ultimo_numero)
                VALUES ('cotizacion', 'COT', ?, 0)
                """, anio);

        Object[] row = jdbc.queryForObject("""
                        SELECT prefijo, ultimo_numero
                          FROM consecutivos
                         WHERE tipo = 'cotizacion' AND anio = ?
                         FOR UPDATE
                        """,
                (rs, i) -> new Object[]{rs.getString("prefijo"), rs.getInt("ultimo_numero")},
                anio);

        int siguiente = ((Integer) row[1]) + 1;
        jdbc.update("UPDATE consecutivos SET ultimo_numero = ? WHERE tipo = 'cotizacion' AND anio = ?",
                siguiente, anio);

        return String.format("%s-%d-%04d", row[0], anio, siguiente);
    }
}

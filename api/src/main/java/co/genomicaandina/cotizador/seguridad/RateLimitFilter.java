package co.genomicaandina.cotizador.seguridad;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Límite de peticiones en memoria por IP y por tipo de endpoint.
 * Suficiente para una instalación de un solo servidor; si algún día se
 * despliega en varios nodos, sustituir por Bucket4j + Redis.
 */
public class RateLimitFilter extends OncePerRequestFilter {

    private static final int MAX_CLAVES = 5000;

    private final ObjectMapper mapper;
    private final Map<String, Deque<Long>> marcas = new ConcurrentHashMap<>();

    public RateLimitFilter(ObjectMapper mapper) {
        this.mapper = mapper;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {
        if (!request.getRequestURI().startsWith("/api/")
                || "OPTIONS".equalsIgnoreCase(request.getMethod())) {
            chain.doFilter(request, response);
            return;
        }

        Limite limite = limitePara(request.getRequestURI());
        String clave = limite.nombre() + "|" + request.getRemoteAddr();
        long ventana = limite.segundos() * 1000L;
        long ahora = System.currentTimeMillis();
        long espera = 0;

        if (marcas.size() > MAX_CLAVES) {
            limpiar(ahora);
        }

        Deque<Long> accesos = marcas.computeIfAbsent(clave, k -> new ArrayDeque<>());
        synchronized (accesos) {
            while (!accesos.isEmpty() && ahora - accesos.peekFirst() >= ventana) {
                accesos.pollFirst();
            }
            if (accesos.size() >= limite.maximo()) {
                espera = ((accesos.peekFirst() + ventana - ahora) / 1000L) + 1;
            } else {
                accesos.addLast(ahora);
            }
        }

        if (espera > 0) {
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setHeader("Retry-After", Long.toString(espera));
            response.setContentType(MediaType.APPLICATION_PROBLEM_JSON_VALUE);
            mapper.writeValue(response.getOutputStream(), Map.of(
                    "type", "about:blank",
                    "title", "Demasiadas solicitudes",
                    "status", HttpStatus.TOO_MANY_REQUESTS.value(),
                    "detail", "Has hecho demasiadas peticiones seguidas. Espera unos segundos."));
            return;
        }

        chain.doFilter(request, response);
    }

    private Limite limitePara(String ruta) {
        if (ruta.startsWith("/api/auth/login")) {
            return new Limite("login", 10, 900);
        }
        if (ruta.startsWith("/api/auth/password")) {
            return new Limite("password", 10, 900);
        }
        if (ruta.startsWith("/api/asistente")) {
            return new Limite("asistente", 30, 300);
        }
        if (ruta.endsWith("/pdf")) {
            return new Limite("pdf", 60, 300);
        }
        return new Limite("general", 600, 300);
    }

    private void limpiar(long ahora) {
        marcas.entrySet().removeIf(entrada -> {
            Deque<Long> cola = entrada.getValue();
            synchronized (cola) {
                Long ultimo = cola.peekLast();
                return ultimo == null || ahora - ultimo > 900_000L;
            }
        });
    }

    private record Limite(String nombre, int maximo, int segundos) {
    }
}

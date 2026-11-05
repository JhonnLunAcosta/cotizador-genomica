package co.genomicaandina.cotizador.service;

import co.genomicaandina.cotizador.dto.Dtos.CotizacionDocumento;
import co.genomicaandina.cotizador.dto.Dtos.ItemDocumento;
import co.genomicaandina.cotizador.dto.Dtos.RequisitoDTO;
import co.genomicaandina.cotizador.util.Formato;
import com.openhtmltopdf.pdfboxout.PdfRendererBuilder;
import org.apache.batik.transcoder.SVGAbstractTranscoder;
import org.apache.batik.transcoder.TranscoderInput;
import org.apache.batik.transcoder.TranscoderOutput;
import org.apache.batik.transcoder.image.PNGTranscoder;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.InputStream;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class PdfService {

    private static final String PREFIJO_MEDIA = "/media/";
    private static final Map<String, String> CACHE_IMAGENES = new ConcurrentHashMap<>();

    private final TemplateEngine templateEngine;
    private final CotizacionService cotizacionService;

    public PdfService(TemplateEngine templateEngine, CotizacionService cotizacionService) {
        this.templateEngine = templateEngine;
        this.cotizacionService = cotizacionService;
    }


    public byte[] generar(String numero) {
        CotizacionDocumento documento = cotizacionService.obtener(numero);

        List<RequisitoDTO> requisitos = documento.requisitos();
        long cumplidos = requisitos.stream().filter(r -> "cumplido".equals(r.estado())).count();
        long pendientes = requisitos.stream().filter(r -> "pendiente".equals(r.estado())).count();
        long noAplica = requisitos.stream().filter(r -> "no_aplica".equals(r.estado())).count();

        Context ctx = new Context(new Locale("es", "CO"));
        ctx.setVariable("c", documento);
        ctx.setVariable("fmt", new Formato());
        ctx.setVariable("cumplidos", cumplidos);
        ctx.setVariable("pendientes", pendientes);
        ctx.setVariable("noAplica", noAplica);
        ctx.setVariable("totalRequisitos", requisitos.size());
        ctx.setVariable("conRegistro",
                documento.items().stream().filter(i -> i.registroSanitario() != null).count());
        ctx.setVariable("imgPdf", imagenesPdf(documento));

        String html = templateEngine.process("cotizacion", ctx);

        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            PdfRendererBuilder builder = new PdfRendererBuilder();
            builder.useFastMode();
            builder.withHtmlContent(html, new File(".").toURI().toString());
            builder.toStream(out);
            builder.run();
            return out.toByteArray();
        } catch (Exception e) {
            throw new IllegalStateException("No se pudo generar el PDF de " + numero, e);
        }
    }

    /**
     * Rasteriza cada ilustración del catálogo a PNG y la entrega como data URI.
     * openhtmltopdf incrusta PNG de forma fiable; el SVG (con gradientes,
     * patrones y texto) no se dibuja igual en todas las versiones.
     */
    private Map<String, String> imagenesPdf(CotizacionDocumento documento) {
        Map<String, String> imagenes = new HashMap<>();
        for (ItemDocumento item : documento.items()) {
            String url = item.imagenUrl();
            if (url == null || !url.startsWith(PREFIJO_MEDIA) || item.sku() == null) {
                continue;
            }
            String dataUri = CACHE_IMAGENES.computeIfAbsent(url, this::rasterizar);
            if (dataUri != null) {
                imagenes.put(item.sku(), dataUri);
            }
        }
        return imagenes;
    }

    private String rasterizar(String url) {
        if (!url.endsWith(".svg")) {
            return null;
        }
        ClassPathResource recurso = new ClassPathResource("static" + url);
        if (!recurso.exists()) {
            return null;
        }
        try (InputStream in = recurso.getInputStream();
             ByteArrayOutputStream png = new ByteArrayOutputStream()) {
            PNGTranscoder transcoder = new PNGTranscoder();
            // 720 px de ancho: ~1080 ppp para los 17 mm que ocupa en el PDF.
            transcoder.addTranscodingHint(PNGTranscoder.KEY_WIDTH, 720f);
            transcoder.addTranscodingHint(SVGAbstractTranscoder.KEY_ALLOW_EXTERNAL_RESOURCES, Boolean.FALSE);
            transcoder.transcode(new TranscoderInput(in), new TranscoderOutput(png));
            return "data:image/png;base64," + Base64.getEncoder().encodeToString(png.toByteArray());
        } catch (Exception e) {
            return null;
        }
    }
}

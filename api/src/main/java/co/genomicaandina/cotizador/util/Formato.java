package co.genomicaandina.cotizador.util;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.NumberFormat;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

/**
 * Utilidades de formato para el documento PDF (locale es-CO).
 */
public class Formato {

    private static final Locale CO = new Locale("es", "CO");
    private static final DateTimeFormatter FECHA = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private static final String[] UNIDADES = {
            "", "UNO", "DOS", "TRES", "CUATRO", "CINCO", "SEIS", "SIETE", "OCHO", "NUEVE",
            "DIEZ", "ONCE", "DOCE", "TRECE", "CATORCE", "QUINCE", "DIECISEIS", "DIECISIETE",
            "DIECIOCHO", "DIECINUEVE", "VEINTE", "VEINTIUNO", "VEINTIDOS", "VEINTITRES",
            "VEINTICUATRO", "VEINTICINCO", "VEINTISEIS", "VEINTISIETE", "VEINTIOCHO", "VEINTINUEVE"
    };
    private static final String[] DECENAS = {
            "", "", "", "TREINTA", "CUARENTA", "CINCUENTA", "SESENTA", "SETENTA", "OCHENTA", "NOVENTA"
    };
    private static final String[] CENTENAS = {
            "", "CIENTO", "DOSCIENTOS", "TRESCIENTOS", "CUATROCIENTOS", "QUINIENTOS",
            "SEISCIENTOS", "SETECIENTOS", "OCHOCIENTOS", "NOVECIENTOS"
    };

    private final NumberFormat enteros;
    private final NumberFormat decimales;

    public Formato() {
        enteros = NumberFormat.getNumberInstance(CO);
        enteros.setMinimumFractionDigits(0);
        enteros.setMaximumFractionDigits(0);

        decimales = NumberFormat.getNumberInstance(CO);
        decimales.setMinimumFractionDigits(0);
        decimales.setMaximumFractionDigits(2);
    }

    public String money(BigDecimal valor) {
        return money(valor, "COP");
    }

    public String money(BigDecimal valor, String moneda) {
        BigDecimal v = valor == null ? BigDecimal.ZERO : valor;
        String prefijo = switch (moneda == null ? "COP" : moneda) {
            case "USD" -> "US$ ";
            case "EUR" -> "EUR ";
            default -> "$ ";
        };
        return prefijo + ("COP".equals(moneda) || moneda == null ? enteros.format(v) : decimales.format(v));
    }

    public String num(BigDecimal valor) {
        return valor == null ? "0" : decimales.format(valor);
    }

    public String pct(BigDecimal valor) {
        return (valor == null ? BigDecimal.ZERO : valor).setScale(2, RoundingMode.HALF_UP)
                .toPlainString().replace('.', ',') + " %";
    }

    public String fecha(LocalDate fecha) {
        return fecha == null ? "" : FECHA.format(fecha);
    }

    public String texto(String valor) {
        return valor == null ? "" : valor;
    }

    public String estado(String valor) {
        if (valor == null) {
            return "";
        }
        return switch (valor) {
            case "cumplido" -> "Cumplido";
            case "no_aplica" -> "No aplica";
            case "pendiente" -> "Pendiente";
            case "vigente" -> "Vigente";
            case "vencido" -> "Vencido";
            case "por_vencer" -> "Por vencer";
            case "sin_registro" -> "Sin registro";
            case "borrador" -> "Borrador";
            case "en_revision" -> "En revisión";
            case "enviada" -> "Enviada";
            case "negociacion" -> "En negociación";
            case "aceptada" -> "Aceptada";
            case "rechazada" -> "Rechazada";
            case "vencida" -> "Vencida";
            case "anulada" -> "Anulada";
            default -> valor;
        };
    }

    public String letras(BigDecimal monto, String moneda) {
        long n = (monto == null ? BigDecimal.ZERO : monto)
                .setScale(0, RoundingMode.HALF_UP)
                .longValue();
        String sufijo = "USD".equals(moneda) ? "DOLARES" : "PESOS M/CTE";
        return convertir(n) + " " + sufijo;
    }

    private static String convertir(long n) {
        if (n == 0) {
            return "CERO";
        }
        if (n < 1000) {
            return basico((int) n);
        }
        if (n < 1_000_000L) {
            long miles = n / 1000;
            long resto = n % 1000;
            String s = miles == 1 ? "MIL" : apocope(convertir(miles)) + " MIL";
            return resto == 0 ? s : s + " " + basico((int) resto);
        }
        if (n < 1_000_000_000L) {
            long millones = n / 1_000_000L;
            long resto = n % 1_000_000L;
            String s = millones == 1 ? "UN MILLON" : apocope(convertir(millones)) + " MILLONES";
            return resto == 0 ? s : s + " " + convertir(resto);
        }
        long milesMillones = n / 1_000_000_000L;
        long resto = n % 1_000_000_000L;
        String s = milesMillones == 1 ? "MIL MILLONES" : apocope(convertir(milesMillones)) + " MIL MILLONES";
        return resto == 0 ? s : s + " " + convertir(resto);
    }

    private static String basico(int n) {
        if (n < 30) {
            return UNIDADES[n];
        }
        if (n < 100) {
            int d = n / 10;
            int u = n % 10;
            return u == 0 ? DECENAS[d] : DECENAS[d] + " Y " + UNIDADES[u];
        }
        if (n == 100) {
            return "CIEN";
        }
        int c = n / 100;
        int r = n % 100;
        return r == 0 ? CENTENAS[c] : CENTENAS[c] + " " + basico(r);
    }

    private static String apocope(String s) {
        return s.endsWith("UNO") ? s.substring(0, s.length() - 3) + "UN" : s;
    }
}

# Cotizador Genómica

Base de datos para una aplicación de cotizaciones de **equipos, reactivos y servicios de secuenciación genómica**, con el soporte documental que un cliente colombiano necesita para cumplir la normativa sanitaria, tributaria y de protección de datos.

- **Motor:** MySQL 8.4 (`cotizador_genomica`)
- **Charset:** `utf8mb4` / `utf8mb4_0900_ai_ci`
- **Estado:** backend Spring Boot, frontend React y base de datos operativos, con dos cotizaciones de ejemplo

## Arranque rápido

Doble clic en `iniciar-todo.cmd` (abre la API y el frontend en dos ventanas) y entra a <http://localhost:5173>.

| Componente | URL | Arranque manual |
| --- | --- | --- |
| API | <http://localhost:8080> | `cd api && mvn spring-boot:run` |
| Swagger | <http://localhost:8080/swagger-ui.html> | Solo con `OPENAPI_PUBLICO=true` |
| Frontend | <http://localhost:5173> | `cd web && npm install && npm run dev` |

Requisitos: JDK 17, Maven 3.9+, Node 18+ y MySQL 8 en `127.0.0.1:3306` con `root` / `root`. Flyway crea la base y carga el esquema, el catálogo y las cotizaciones demo en el primer arranque.

### Acceso

La aplicación exige inicio de sesión. El administrador inicial es:

| Usuario | Contraseña temporal | Rol |
| --- | --- | --- |
| `jhonn@genomicaandina.co` | definida en la migración `V6` (hash bcrypt) | admin |

La contraseña inicial se entrega por un canal privado y se guarda únicamente como hash bcrypt en la base de datos; el repositorio no contiene la clave en texto plano. Si necesitas restablecerla, genera un hash nuevo con bcrypt y actualiza `password_hash` en la tabla `usuarios`.

Al entrar, el sistema avisa que la contraseña es temporal y ofrece cambiarla. Política: mínimo 10 caracteres, al menos una letra y un número, sin datos predecibles ni el correo. Tras 5 intentos fallidos la cuenta se bloquea 15 minutos.

Los demás usuarios de la tabla `usuarios` no pueden entrar hasta que el administrador les asigne un `password_hash` (bcrypt). No hay pantalla de gestión de usuarios todavía.

### Variables de entorno

Copia `.env.example` como `.env.local`; `iniciar-api.cmd` lo carga automáticamente.

| Variable | Por defecto | Para qué sirve |
| --- | --- | --- |
| `FREELMAPI_URL` | `http://localhost:3001` | Gateway local de IA (FreeLLMAPI) |
| `FREELMAPI_KEY` | vacío | Clave del gateway; sin ella el chat queda desactivado |
| `FREELMAPI_MODEL` | `auto` | Modelo solicitado al gateway |
| `DB_URL` / `DB_USER` / `DB_PASSWORD` | MySQL local `root/root` | Conexión a la base |
| `CORS_ORIGINS` | `http://localhost:5173,http://127.0.0.1:5173` | Orígenes permitidos en desarrollo |
| `OPENAPI_PUBLICO` | `false` | Expone Swagger y `/api-docs` sin sesión (solo desarrollo) |

La clave de IA vive **solo en el servidor**: el navegador nunca la recibe.

### Seguridad implementada

- Sesión con cookie `HttpOnly` + `SameSite=Strict` (`COTIZADOR_SESION`, 8 h) y rotación de sesión al autenticar.
- CSRF con doble cookie: el SPA llama `GET /api/auth/csrf` y envía `X-XSRF-TOKEN` en cada escritura.
- Contraseñas con bcrypt (coste 10), bloqueo por intentos fallidos y límite de peticiones por IP.
- Cabeceras `CSP`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`, HSTS y `Cross-Origin-*-Policy`.
- Errores en formato ProblemDetail sin trazas ni mensajes internos (`server.error.include-message: never`).
- Los cambios de estado y la creación de cotizaciones registran el usuario autenticado en historial y auditoría.

> **Aviso**: esta aplicación es una herramienta de apoyo. La aplicación de las normas citadas debe validarla un abogado o el área regulatoria antes de usarse con clientes reales.

---

## 1. Modelo de datos

```
empresas ─────────────┐
usuarios ─────────────┤
clientes ─────────────┼──< cotizaciones ──< cotizacion_items >── productos ──< producto_precios
  └──< cliente_contactos        │                                   └──< producto_registros_sanitarios
                                ├──< cotizacion_requisitos >── normas
                                ├──< cotizacion_normas     >── normas
                                ├──< cotizacion_clausulas  >── clausulas
                                ├──< cotizacion_documentos
                                └──< cotizacion_historial

apoyo: requisitos_plantilla · consecutivos · auditoria · categorias_producto
       proveedores · monedas · tasas_cambio
```

| Tabla | Para qué sirve |
| --- | --- |
| `empresas` | Datos legales del oferente: NIT, régimen, resolución DIAN, representante legal. |
| `usuarios` | Vendedores, regulatorio, contabilidad. |
| `clientes` / `cliente_contactos` | Tercero con tipo de documento, régimen, código de habilitación (REPS) y autorización de datos. |
| `proveedores` | Fabricantes y distribuidores autorizados. |
| `categorias_producto` / `productos` | Catálogo con marca, modelo, referencia, unidad, cadena de frío, vida útil, clase de dispositivo, IVA y concepto tributario. |
| `producto_registros_sanitarios` | Historial de registros INVIMA, BPM, libre venta y calibración, con vencimiento. |
| `producto_precios` | Listas público / institucional / distribuidor por moneda y vigencia. |
| `normas` | Marco normativo de referencia (leyes, decretos, resoluciones, estándares). |
| `requisitos_plantilla` | Checklist regulatorio reutilizable que se copia a cada cotización. |
| `clausulas` | Textos legales reutilizables (garantía, datos, confidencialidad, residuos...). |
| `cotizaciones` | Cabecera: número, versión, estado, validez, moneda/TRM, condiciones, retenciones y snapshots. |
| `cotizacion_items` | Líneas con snapshot de descripción, precio y **registro sanitario**. Totales calculados por columnas generadas. |
| `cotizacion_requisitos` | Checklist por cotización con estado, evidencia y norma asociada. |
| `cotizacion_documentos` | Anexos: fichas técnicas, registros, certificados, PDF. |
| `cotizacion_normas` / `cotizacion_clausulas` | Normas citadas y cláusulas congeladas al momento de la oferta. |
| `cotizacion_historial` | Trazabilidad de cambios de estado. |
| `consecutivos` | Numeración anual por prefijo (`COT-2026-0001`). |
| `auditoria` | Bitácora genérica de cambios. |

### Vistas

| Vista | Uso |
| --- | --- |
| `v_cotizacion_totales` | Subtotal, IVA, retenciones y total neto calculados desde las líneas. **Fuente de verdad de los totales.** |
| `v_cotizaciones_resumen` | Tablero comercial: estado efectivo, vencimiento, alertas y totales. |
| `v_cotizacion_detalle` | Documento línea a línea listo para el PDF. |
| `v_productos_estado_regulatorio` | Estado del registro INVIMA: `vigente`, `por_vencer` (≤90 días), `vencido`, `sin_registro`, `no_requiere`. |
| `v_cotizaciones_alertas` | Cotizaciones con requisitos pendientes o registros vencidos. |

### Detalles de diseño

- **Totales derivados:** `subtotal`, `iva_valor` y `total` de cada línea son columnas generadas; los totales de la cotización salen de `v_cotizacion_totales`. No hay totales duplicados que puedan desincronizarse.
- **Snapshots legales:** al enviar una oferta se congelan `datos_empresa_snapshot`, `datos_cliente_snapshot`, el registro sanitario de cada ítem y el texto de cada cláusula. Si mañana cambia el NIT o vence el registro, la cotización histórica no se altera.
- **Retenciones:** `retefuente_pct` se aplica solo a líneas con `aplica_retefuente = TRUE` (servicios y software); `reteiva_pct` sobre el IVA; `reteica_pct` sobre el subtotal (3 decimales, ej. 0,966 %).
- **Checklist:** al crear una cotización se copian los requisitos de `requisitos_plantilla`; los obligatorios pendientes disparan la alerta.

---

## 2. Cómo cumple la norma colombiana

> Las normas están cargadas como **referencia** en la tabla `normas`. La base no sustituye la revisión de tu área jurídica o regulatoria: valida vigencias y tarifas antes de emitir.

| Sección de la cotización | De dónde sale | Norma de referencia |
| --- | --- | --- |
| Identificación del oferente (NIT, régimen, resolución DIAN) | `empresas` | Estatuto Tributario; Res. DIAN 000042 de 2020 |
| Identificación del cliente | `clientes` + `datos_cliente_snapshot` | Ley 1480 de 2011 |
| Descripción veraz de bienes (marca, modelo, referencia, cantidad) | `cotizacion_items` | Ley 1480 de 2011 |
| **Registro sanitario INVIMA por ítem** | `cotizacion_items.registro_sanitario` + `producto_registros_sanitarios` | Decreto 4725 de 2005; Decreto 3772 de 2004; Decreto 780 de 2016 |
| Precios, IVA discriminado y retenciones | `v_cotizacion_totales` | Estatuto Tributario; Decreto 1625 de 2016 |
| Validez de la oferta y condiciones | `cotizaciones.validez_dias` + cláusula `CLA-VALIDEZ` | Ley 1480 de 2011 |
| Garantía | `garantia_meses`, `garantia_detalle` + `CLA-GARANTIA` | Ley 1480 de 2011 |
| Datos personales y **datos genéticos (sensibles)** | `clientes.autoriza_datos` + `CLA-DATOS` + requisitos `DP-01`/`DP-02` | Ley 1581 de 2012; Decreto 1377 de 2013 |
| Gestión de residuos biológicos y químicos | `CLA-RESIDUOS` + requisito `BI-02` | Res. 1164 de 2002; Decreto 1076 de 2015 |
| Habilitación del laboratorio cliente | `clientes.codigo_habilitacion` | Res. 3100 de 2019 |
| Facturación electrónica | requisito `CO-01` + `empresas.resolucion_facturacion` | Res. DIAN 000042 de 2020 |
| Validación de métodos y calidad | requisitos `CA-01`/`CA-02`/`CA-03` | ISO 15189:2022 |
| Anexos regulatorios (BPM, libre venta, carta de fabricante) | `cotizacion_requisitos` + `cotizacion_documentos` | Según checklist |

### Checklist cargado (15 requisitos)

`RS-01` registro sanitario del equipo · `RS-02` registro de reactivos IVD · `RS-03` BPM del fabricante · `RS-04` libre venta · `RS-05` carta de autorización · `IM-01` licencia de importación · `CA-01` calibración · `CA-02` IQ/OQ/PQ · `CA-03` ficha técnica y manual · `BI-01` hojas de seguridad · `BI-02` plan de residuos · `DP-01` autorización de datos · `DP-02` política de datos genéticos · `CO-01` RUT y facturación electrónica · `CO-02` garantía y posventa.

---

## 3. Datos de ejemplo

| Registro | Detalle |
| --- | --- |
| `COT-2026-0001` | Lab San Rafael, 5 ítems, **$687.820.000** con IVA, retefuente 4 % sobre servicios y reteICA 0,966 %. Estado `enviada`. |
| `COT-2026-0002` | Universidad Nacional, 3 ítems, **$249.608.450** con IVA. Estado `borrador`. |
| Catálogo | 15 productos con precios COP/USD, registros INVIMA y alertas de vencimiento. |
| Normativa | 17 normas y 7 cláusulas. |

Consulta rápida de los totales:

```sql
SELECT numero, cliente, subtotal, iva_total, retefuente, reteica, total_neto
FROM v_cotizaciones_resumen;
```

---

## 4. Archivos

```
cotizador-genomica/
├── db/                          -- SQL canónico (se aplica con el MCP)
│   ├── 01_schema.sql            -- 24 tablas (sin vistas)
│   ├── 02_seed.sql              -- monedas, empresa, clientes, catálogo, normas, plantillas
│   ├── 03_demo_cotizacion.sql   -- dos cotizaciones completas
│   ├── 04_views.sql             -- vistas (CREATE OR REPLACE, reaplicable)
│   ├── 05_consultas.sql         -- consultas de operación: PDF, checklist, versionado
│   └── 06_imagenes.sql          -- llena productos.imagen_url (ilustraciones del catálogo)
├── api/                         -- backend Spring Boot 3.2 + Flyway (JDBC)
│   ├── src/main/java/co/genomicaandina/cotizador/
│   │   ├── dao/                 -- CatalogoDao, CotizacionDao
│   │   ├── dto/Dtos.java        -- contrato de la API (records)
│   │   ├── service/             -- CotizacionService, PdfService, ConsecutivoService, ClienteService
│   │   ├── util/Formato.java    -- moneda es-CO y valor en letras
│   │   └── web/                 -- controladores REST y manejo de errores
│   ├── src/main/resources/db/migration/   -- V1..V5 (copia de db/*.sql)
│   ├── src/main/resources/static/media/productos/  -- 15 ilustraciones SVG (<sku>.svg)
│   └── src/main/resources/templates/cotizacion.html
├── scripts/
│   └── generar-imagenes-productos.mjs    -- regenera las ilustraciones SVG
└── web/                         -- frontend React + Vite
```

### Aplicar (a través del MCP)

```powershell
cd "D:\proyectos jhonn\mcp-mysql"

node --env-file-if-exists=.env scripts/apply-sql.js ../cotizador-genomica/db/01_schema.sql --database=cotizador_genomica
node --env-file-if-exists=.env scripts/apply-sql.js ../cotizador-genomica/db/02_seed.sql   --database=cotizador_genomica
node --env-file-if-exists=.env scripts/apply-sql.js ../cotizador-genomica/db/03_demo_cotizacion.sql --database=cotizador_genomica
node --env-file-if-exists=.env scripts/apply-sql.js ../cotizador-genomica/db/04_views.sql  --database=cotizador_genomica
node --env-file-if-exists=.env scripts/apply-sql.js ../cotizador-genomica/db/06_imagenes.sql --database=cotizador_genomica
```

> Usa `node ...` directamente: con `npm run apply -- archivo --database=x`, npm en Windows descarta el flag.

### Reiniciar desde cero

```sql
DROP DATABASE cotizador_genomica;
CREATE DATABASE cotizador_genomica CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
```

---

## 5. Operación diaria

### Siguiente número consecutivo

```sql
START TRANSACTION;
INSERT IGNORE INTO consecutivos (tipo, prefijo, anio, ultimo_numero) VALUES ('cotizacion','COT',YEAR(CURDATE()),0);
UPDATE consecutivos SET ultimo_numero = LAST_INSERT_ID(ultimo_numero + 1)
 WHERE tipo = 'cotizacion' AND anio = YEAR(CURDATE());
SELECT CONCAT(prefijo,'-',anio,'-',LPAD(LAST_INSERT_ID(),4,'0')) AS numero;
COMMIT;
```

### Cambiar de estado con trazabilidad

Insertar en `cotizacion_historial` y actualizar `cotizaciones.estado` en la misma transacción. Los estados válidos son `borrador`, `en_revision`, `enviada`, `negociacion`, `aceptada`, `rechazada`, `vencida`, `anulada`.

### Versionar una oferta

Ver el bloque 9 de `db/05_consultas.sql`: duplica cabecera, ítems, checklist y cláusulas, e incrementa la versión.

### Reglas que conviene implementar en la aplicación

1. No permitir pasar a `enviada` con requisitos obligatorios en `pendiente` (consulta el bloque 3 de `05_consultas.sql`).
2. No permitir cotizar productos con registro vencido (`v_productos_estado_regulatorio`).
3. Calcular los totales siempre desde `v_cotizacion_totales`, nunca en el cliente.
4. Congelar los snapshots justo antes de enviar.

---

## 6. La aplicación

### 6.1 Backend (`api/`)

Spring Boot 3.2.5, Java 17, **JDBC + Flyway** (sin JPA: el esquema y las vistas ya calculan los totales) y PDF con Thymeleaf + openhtmltopdf.

```powershell
cd "D:\proyectos jhonn\cotizador-genomica\api"
mvn spring-boot:run        # http://localhost:8080
```

- Swagger UI: `http://localhost:8080/swagger-ui.html`
- OpenAPI JSON: `http://localhost:8080/api-docs`
- Datasource: `jdbc:mysql://127.0.0.1:3306/cotizador_genomica` (`root` / `root`).
- Flyway crea la base y aplica `V1__esquema_base.sql`, `V2__datos_semilla.sql`, `V3__cotizaciones_demo.sql` y `V4__vistas.sql`. La conexión fija `utf8mb4_0900_ai_ci` para evitar el `Illegal mix of collations`.

Si cambias un `.sql` de `db/`, copia el cambio a la migración correspondiente **y** reinicia la base (Flyway valida el checksum). Para cambios posteriores, agrega `V5__...sql`.

#### Endpoints

| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | `/api/dashboard` | KPIs, cotizaciones recientes, alertas y registros por vencer |
| GET | `/api/cotizaciones?estado=enviada` | Listado desde `v_cotizaciones_resumen` |
| GET | `/api/cotizaciones/{numero}` | Documento completo (cliente, ítems, totales, checklist, cláusulas, normas) |
| POST | `/api/cotizaciones` | Crea en `borrador`, asigna consecutivo y copia checklist + cláusulas + normas |
| PATCH | `/api/cotizaciones/{numero}/estado` | Cambia estado y registra historial + auditoría |
| PATCH | `/api/cotizaciones/{numero}/requisitos/{codigo}` | Marca `pendiente`, `cumplido` o `no_aplica` |
| GET | `/api/cotizaciones/{numero}/pdf` | PDF A4 de la oferta |
| GET/POST | `/api/clientes` | Listado con búsqueda / creación con contactos |
| GET | `/api/clientes/{id}` | Detalle con contactos |
| GET | `/api/productos?tipo=&q=&moneda=COP` | Catálogo con precio vigente y estado del registro |
| GET | `/api/normas`, `/api/clausulas` | Marco normativo y textos legales |

Ejemplo de creación:

```json
{
  "clienteId": 1,
  "validezDias": 15,
  "moneda": "COP",
  "garantiaMeses": 12,
  "items": [
    { "productoId": 1, "cantidad": 1 },
    { "productoId": 5, "cantidad": 4, "descuentoPct": 3 }
  ]
}
```

#### Comportamiento implementado

- **Consecutivo** con `SELECT ... FOR UPDATE` dentro de la transacción (`COT-2026-0003`).
- **Precios**: usa el precio vigente en la moneda pedida; si no existe, toma el último y convierte con la TRM (USD/COP). Si el producto no tiene precio, responde `422`.
- **Checklist**: copia solo los requisitos aplicables al tipo de ítems (`todos`, `equipos`, `reactivos`, `servicios`).
- **Cláusulas**: copia las obligatorias e interpola `{{garantia_meses}}`, `{{validez_dias}}`, `{{moneda}}` y `{{email_datos}}`.
- **Snapshot** de empresa y cliente en JSON al crear la oferta.
- **Totales** siempre desde `v_cotizacion_totales` (subtotal, IVA, retefuente, reteICA, neto). El PDF muestra el valor en letras.
- **Errores** en formato ProblemDetail (RFC 7807) con `errores` por campo cuando falla la validación.
- **CORS** habilitado para `http://localhost:5173`.

### 6.2 Frontend (`web/`)

React + Vite con proxy `/api` hacia el backend.

```powershell
cd "D:\proyectos jhonn\cotizador-genomica\web"
npm install
npm run dev      # http://localhost:5173
npm run build
```

Pantallas: inicio de sesión, dashboard, listado y detalle de cotizaciones (con checklist interactivo y PDF), nueva cotización, clientes y catálogo.

- **Interfaz clínica y limpia** con tipografía Inter local (`@fontsource-variable/inter`), tarjetas suaves y micro-animaciones.
- **Cuenta:** menú de usuario en la barra lateral con cambio de contraseña y cierre de sesión; aviso permanente mientras la contraseña sea temporal.
- **Navegación móvil:** menú lateral deslizante y barra superior con el usuario.
- **Asistente comercial:** botón flotante que abre un chat conectado al catálogo y al tablero. Consume `POST /api/asistente/chat` por SSE con la sesión y el token CSRF; si `FREELMAPI_KEY` no está definida, se muestra desactivado.
  - `pdf_cotizacion`: valida el número contra la base y muestra una tarjeta de descarga en el chat.
  - `preparar_cotizacion` → `crear_cotizacion`: valida cliente, SKU, precios e IVA y arma un borrador. Solo se guarda cuando el usuario confirma en un mensaje posterior; el servidor rechaza la creación en el mismo turno y consume el borrador una sola vez (vigencia 60 min).
  - Crear cotizaciones requiere rol `admin` o `vendedor`; `regulatorio` recibe un rechazo explicado. La auditoría y el historial quedan a nombre del usuario real de la sesión.

Endpoints de autenticación:

| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | `/api/auth/csrf` | Crea la cookie `XSRF-TOKEN` antes del primer POST |
| POST | `/api/auth/login` | Inicia sesión (JSON `email`, `password`) |
| GET | `/api/auth/me` | Usuario de la sesión actual |
| POST | `/api/auth/logout` | Cierra la sesión |
| POST | `/api/auth/password` | Cambia la contraseña (`actual`, `nueva`) |

| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | `/api/asistente/estado` | Indica si el chat está configurado |
| POST | `/api/asistente/chat` | Respuesta en streaming SSE |

### 6.3 Imágenes del catálogo

Cada producto tiene una ilustración referencial en `productos.imagen_url`, que se muestra en el catálogo, en el selector de productos de la cotización, en las líneas y en el detalle; también se incrusta en el PDF del cliente.

- Archivos: `api/src/main/resources/static/media/productos/<sku>.svg`, servidos por el backend en `GET /media/productos/<sku>.svg` (Vite hace proxy de `/media`).
- Migración: `V5__imagenes_productos.sql` (copia canónica en `db/06_imagenes.sql`) llena `imagen_url` con la ruta de cada SKU.
- Regenerar las ilustraciones: `node scripts/generar-imagenes-productos.mjs`.
- **En el PDF** (`PdfService`): cada SVG local se rasteriza a PNG de 960 × 720 px con Batik (dependencia `openhtmltopdf-svg-support`) y se incrusta como data URI, en la columna "Imagen" de la tabla de ítems (17 × 12,75 mm). El resultado se cachea en memoria por ruta.
- **Cambiar una ilustración por una foto real**: reemplaza el archivo conservando el nombre (`seq-001.svg`) o cambia la extensión y ajusta `imagen_url` en la base; también puedes apuntar `imagen_url` a una URL externa (`https://...`). El PDF solo rasteriza archivos locales de `static/media/` que terminen en `.svg`; para una foto `.png`/`.jpg` local hay que ajustar `PdfService.rasterizar`.

### 6.4 Reglas de negocio pendientes de endurecer

1. Bloquear el paso a `enviada` si hay requisitos obligatorios en `pendiente` (hoy la API lo permite y el PDF lo evidencia; la UI puede advertirlo).
2. Bloquear la creación con productos de registro vencido (hoy solo se advierte en el catálogo).
3. Versionado de ofertas y firma electrónica.
4. Gestión de usuarios y roles desde la interfaz (asignar contraseña a los demás usuarios de la tabla `usuarios`).

> **Aviso**: este material es una herramienta de apoyo. La aplicación de las normas citadas debe validarla un abogado o el área regulatoria antes de usarse con clientes reales.

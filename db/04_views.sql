-- ============================================================================
--  VISTAS · se pueden reaplicar sin perder datos
--  Ejecutar con: node scripts/apply-sql.js db/04_views.sql --database=cotizador_genomica
-- ============================================================================

SET NAMES utf8mb4;

-- Totales calculados desde los ítems (fuente de verdad).
CREATE OR REPLACE VIEW v_cotizacion_totales AS
SELECT
  c.id AS cotizacion_id,
  COUNT(i.id) AS items,
  COALESCE(SUM(i.subtotal), 0) AS subtotal,
  COALESCE(SUM(i.iva_valor), 0) AS iva_total,
  COALESCE(SUM(i.total), 0) AS total_bruto,
  ROUND(COALESCE(SUM(CASE WHEN i.aplica_retefuente THEN i.subtotal ELSE 0 END), 0) * c.retefuente_pct / 100, 2) AS retefuente,
  ROUND(COALESCE(SUM(i.iva_valor), 0) * c.reteiva_pct / 100, 2) AS reteiva,
  ROUND(COALESCE(SUM(i.subtotal), 0) * c.reteica_pct / 100, 2) AS reteica,
  COALESCE(SUM(i.total), 0)
    - ROUND(COALESCE(SUM(CASE WHEN i.aplica_retefuente THEN i.subtotal ELSE 0 END), 0) * c.retefuente_pct / 100, 2)
    - ROUND(COALESCE(SUM(i.iva_valor), 0) * c.reteiva_pct / 100, 2)
    - ROUND(COALESCE(SUM(i.subtotal), 0) * c.reteica_pct / 100, 2) AS total_neto
FROM cotizaciones c
LEFT JOIN cotizacion_items i ON i.cotizacion_id = c.id
GROUP BY c.id, c.retefuente_pct, c.reteiva_pct, c.reteica_pct;

-- Cabecera completa para listados y tablero comercial.
CREATE OR REPLACE VIEW v_cotizaciones_resumen AS
SELECT
  c.id,
  c.numero,
  c.version,
  c.estado,
  CASE
    WHEN c.estado IN ('borrador','en_revision','enviada','negociacion')
     AND DATE_ADD(c.fecha_emision, INTERVAL c.validez_dias DAY) < CURDATE() THEN 'vencida'
    ELSE c.estado
  END AS estado_efectivo,
  c.fecha_emision,
  DATE_ADD(c.fecha_emision, INTERVAL c.validez_dias DAY) AS fecha_vencimiento,
  DATEDIFF(DATE_ADD(c.fecha_emision, INTERVAL c.validez_dias DAY), CURDATE()) AS dias_para_vencer,
  e.razon_social AS empresa,
  e.nit AS empresa_nit,
  cl.razon_social AS cliente,
  cl.tipo_cliente,
  cl.tipo_documento AS cliente_tipo_documento,
  cl.numero_documento AS cliente_documento,
  cl.ciudad AS cliente_ciudad,
  c.moneda,
  c.trm,
  t.items,
  t.subtotal,
  t.iva_total,
  t.total_bruto,
  t.retefuente,
  t.reteiva,
  t.reteica,
  t.total_neto,
  (SELECT COUNT(*) FROM cotizacion_requisitos r
    WHERE r.cotizacion_id = c.id AND r.estado = 'pendiente' AND r.obligatorio) AS requisitos_pendientes,
  (SELECT COUNT(*) FROM cotizacion_items i
    WHERE i.cotizacion_id = c.id AND i.registro_vence IS NOT NULL AND i.registro_vence < CURDATE()) AS items_registro_vencido,
  c.creado_en,
  c.actualizado_en
FROM cotizaciones c
JOIN empresas e ON e.id = c.empresa_id
JOIN clientes cl ON cl.id = c.cliente_id
JOIN v_cotizacion_totales t ON t.cotizacion_id = c.id;

-- Detalle línea a línea para generar el PDF de la cotización.
CREATE OR REPLACE VIEW v_cotizacion_detalle AS
SELECT
  c.id AS cotizacion_id,
  c.numero,
  c.version,
  c.estado,
  c.fecha_emision,
  DATE_ADD(c.fecha_emision, INTERVAL c.validez_dias DAY) AS fecha_vencimiento,
  c.validez_dias,
  c.moneda,
  c.trm,
  e.razon_social AS empresa_razon_social,
  e.nit AS empresa_nit,
  e.direccion AS empresa_direccion,
  e.ciudad AS empresa_ciudad,
  e.telefono AS empresa_telefono,
  e.email AS empresa_email,
  cl.razon_social AS cliente_razon_social,
  cl.tipo_documento AS cliente_tipo_documento,
  cl.numero_documento AS cliente_documento,
  cl.direccion AS cliente_direccion,
  cl.ciudad AS cliente_ciudad,
  cl.telefono AS cliente_telefono,
  cl.email AS cliente_email,
  i.orden,
  i.tipo,
  i.sku,
  i.descripcion,
  i.marca,
  i.modelo,
  i.unidad_medida,
  i.cantidad,
  i.precio_unitario,
  i.descuento_pct,
  i.iva_pct,
  i.subtotal,
  i.iva_valor,
  i.total,
  i.registro_sanitario,
  i.registro_vence,
  i.lote,
  i.tiempo_entrega,
  i.observaciones
FROM cotizaciones c
JOIN empresas e ON e.id = c.empresa_id
JOIN clientes cl ON cl.id = c.cliente_id
LEFT JOIN cotizacion_items i ON i.cotizacion_id = c.id;

-- Estado regulatorio del catálogo (registro más reciente por producto).
CREATE OR REPLACE VIEW v_productos_estado_regulatorio AS
SELECT
  p.id,
  p.sku,
  p.nombre,
  p.tipo,
  p.marca,
  p.modelo,
  p.requiere_registro_sanitario,
  p.es_ivd,
  rs.numero_registro,
  rs.autoridad,
  rs.fecha_vencimiento,
  CASE
    WHEN p.requiere_registro_sanitario = FALSE THEN 'no_requiere'
    WHEN rs.id IS NULL THEN 'sin_registro'
    WHEN rs.fecha_vencimiento IS NULL THEN 'vigente'
    WHEN rs.fecha_vencimiento < CURDATE() THEN 'vencido'
    WHEN rs.fecha_vencimiento <= DATE_ADD(CURDATE(), INTERVAL 90 DAY) THEN 'por_vencer'
    ELSE 'vigente'
  END AS estado_registro
FROM productos p
LEFT JOIN producto_registros_sanitarios rs
  ON rs.id = (
    SELECT rs2.id
      FROM producto_registros_sanitarios rs2
     WHERE rs2.producto_id = p.id
       AND rs2.tipo_registro IN ('registro_sanitario','permiso_comercializacion')
     ORDER BY rs2.fecha_vencimiento DESC
     LIMIT 1
  );

-- Alertas: cotizaciones con requisitos pendientes o registros vencidos.
CREATE OR REPLACE VIEW v_cotizaciones_alertas AS
SELECT
  numero,
  cliente,
  estado_efectivo,
  fecha_vencimiento,
  dias_para_vencer,
  requisitos_pendientes,
  items_registro_vencido,
  total_neto
FROM v_cotizaciones_resumen
WHERE estado_efectivo NOT IN ('anulada','rechazada')
  AND (requisitos_pendientes > 0 OR items_registro_vencido > 0);

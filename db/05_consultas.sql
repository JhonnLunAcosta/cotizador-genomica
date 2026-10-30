-- ============================================================================
--  CONSULTAS DE OPERACIÓN
--  Ejemplos listos para usar desde la aplicación o desde el MCP.
-- ============================================================================

SET NAMES utf8mb4;
USE cotizador_genomica;

-- ---------------------------------------------------------------------------
-- 1. Tablero comercial
-- ---------------------------------------------------------------------------
SELECT numero, cliente, estado_efectivo, fecha_emision, fecha_vencimiento, dias_para_vencer,
       items, total_bruto, total_neto, requisitos_pendientes
FROM v_cotizaciones_resumen
ORDER BY fecha_emision DESC, numero DESC;

-- ---------------------------------------------------------------------------
-- 2. Documento de cotización (cabecera + líneas) para el PDF
-- ---------------------------------------------------------------------------
SELECT numero, version, fecha_emision, fecha_vencimiento, validez_dias, moneda,
       empresa_razon_social, empresa_nit, empresa_direccion, empresa_ciudad, empresa_telefono, empresa_email,
       cliente_razon_social, cliente_tipo_documento, cliente_documento, cliente_direccion, cliente_ciudad,
       cliente_telefono, cliente_email,
       orden, sku, descripcion, marca, modelo, unidad_medida, cantidad, precio_unitario,
       descuento_pct, iva_pct, subtotal, iva_valor, total,
       registro_sanitario, registro_vence, tiempo_entrega
FROM v_cotizacion_detalle
WHERE numero = 'COT-2026-0001'
ORDER BY orden;

-- Totales y retenciones de esa cotización
SELECT * FROM v_cotizacion_totales
WHERE cotizacion_id = (SELECT id FROM cotizaciones WHERE numero = 'COT-2026-0001');

-- ---------------------------------------------------------------------------
-- 3. Checklist regulatorio de la cotización
-- ---------------------------------------------------------------------------
SELECT r.orden, r.requisito_codigo, r.titulo, r.categoria, r.obligatorio, r.estado,
       r.evidencia_url, n.codigo AS norma
FROM cotizacion_requisitos r
LEFT JOIN normas n ON n.id = r.norma_id
WHERE r.cotizacion_id = (SELECT id FROM cotizaciones WHERE numero = 'COT-2026-0001')
ORDER BY r.orden;

-- Pendientes obligatorios (bloquean el envío)
SELECT r.requisito_codigo, r.titulo
FROM cotizacion_requisitos r
WHERE r.cotizacion_id = (SELECT id FROM cotizaciones WHERE numero = 'COT-2026-0001')
  AND r.obligatorio = TRUE AND r.estado = 'pendiente'
ORDER BY r.orden;

-- ---------------------------------------------------------------------------
-- 4. Normas y cláusulas anexas
-- ---------------------------------------------------------------------------
SELECT n.codigo, n.titulo, n.entidad, n.anio, n.ambito, n.obligatoria, cn.nota
FROM cotizacion_normas cn
JOIN normas n ON n.id = cn.norma_id
WHERE cn.cotizacion_id = (SELECT id FROM cotizaciones WHERE numero = 'COT-2026-0001')
ORDER BY n.codigo;

SELECT orden, codigo, titulo, cuerpo
FROM cotizacion_clausulas
WHERE cotizacion_id = (SELECT id FROM cotizaciones WHERE numero = 'COT-2026-0001')
ORDER BY orden;

-- ---------------------------------------------------------------------------
-- 5. Alertas regulatorias
-- ---------------------------------------------------------------------------
SELECT * FROM v_cotizaciones_alertas;

SELECT sku, nombre, tipo, estado_registro, numero_registro, fecha_vencimiento
FROM v_productos_estado_regulatorio
WHERE estado_registro IN ('vencido','por_vencer','sin_registro')
ORDER BY fecha_vencimiento;

-- ---------------------------------------------------------------------------
-- 6. Precio vigente de un producto (lista institucional, si existe)
-- ---------------------------------------------------------------------------
SELECT p.sku, p.nombre, pp.lista, pp.moneda, pp.precio, pp.vigente_desde
FROM productos p
JOIN producto_precios pp ON pp.producto_id = p.id
WHERE p.sku = 'SEQ-001'
  AND pp.vigente_desde <= CURDATE()
  AND (pp.vigente_hasta IS NULL OR pp.vigente_hasta >= CURDATE())
ORDER BY pp.moneda, pp.lista;

-- ---------------------------------------------------------------------------
-- 7. Siguiente número consecutivo (ejecutar dentro de una transacción)
-- ---------------------------------------------------------------------------
START TRANSACTION;
INSERT IGNORE INTO consecutivos (tipo, prefijo, anio, ultimo_numero)
VALUES ('cotizacion', 'COT', YEAR(CURDATE()), 0);
UPDATE consecutivos
   SET ultimo_numero = LAST_INSERT_ID(ultimo_numero + 1)
 WHERE tipo = 'cotizacion' AND anio = YEAR(CURDATE());
SELECT CONCAT(prefijo, '-', anio, '-', LPAD(LAST_INSERT_ID(), 4, '0')) AS siguiente_numero
FROM consecutivos
WHERE tipo = 'cotizacion' AND anio = YEAR(CURDATE());
COMMIT;

-- ---------------------------------------------------------------------------
-- 8. Cambiar estado dejando trazabilidad
-- ---------------------------------------------------------------------------
INSERT INTO cotizacion_historial (cotizacion_id, estado_anterior, estado_nuevo, usuario_id, nota)
SELECT id, estado, 'aceptada', (SELECT id FROM usuarios WHERE email = 'laura@genomicaandina.co'),
       'Aprobada por el cliente vía correo electrónico'
FROM cotizaciones WHERE numero = 'COT-2026-0001';

UPDATE cotizaciones
   SET estado = 'aceptada', fecha_respuesta = NOW()
 WHERE numero = 'COT-2026-0001';

-- ---------------------------------------------------------------------------
-- 9. Versión nueva de una cotización (renegociación)
-- ---------------------------------------------------------------------------
SET @origen = (SELECT id FROM cotizaciones WHERE numero = 'COT-2026-0001');

INSERT INTO cotizaciones
  (numero, version, empresa_id, cliente_id, fecha_emision, validez_dias, moneda, trm, trm_fecha, estado,
   forma_pago, plazo_entrega, lugar_entrega, incoterm, garantia_meses, garantia_detalle,
   incluye_instalacion, incluye_capacitacion, incluye_validacion,
   aplica_retefuente, retefuente_pct, reteiva_pct, reteica_pct,
   declaracion_cumplimiento, observaciones, condiciones_comerciales,
   datos_empresa_snapshot, datos_cliente_snapshot, creado_por)
SELECT CONCAT(numero, '-V', version + 1), version + 1, empresa_id, cliente_id, CURDATE(), validez_dias,
       moneda, trm, trm_fecha, 'borrador', forma_pago, plazo_entrega, lugar_entrega, incoterm,
       garantia_meses, garantia_detalle, incluye_instalacion, incluye_capacitacion, incluye_validacion,
       aplica_retefuente, retefuente_pct, reteiva_pct, reteica_pct,
       declaracion_cumplimiento, observaciones, condiciones_comerciales,
       datos_empresa_snapshot, datos_cliente_snapshot, creado_por
FROM cotizaciones WHERE id = @origen;

SET @nueva = LAST_INSERT_ID();

INSERT INTO cotizacion_items
  (cotizacion_id, orden, producto_id, tipo, sku, descripcion, marca, modelo, unidad_medida,
   cantidad, precio_unitario, descuento_pct, iva_pct, aplica_retefuente,
   registro_sanitario, registro_vence, lote, tiempo_entrega, observaciones, datos_regulatorios)
SELECT @nueva, orden, producto_id, tipo, sku, descripcion, marca, modelo, unidad_medida,
       cantidad, precio_unitario, descuento_pct, iva_pct, aplica_retefuente,
       registro_sanitario, registro_vence, lote, tiempo_entrega, observaciones, datos_regulatorios
FROM cotizacion_items WHERE cotizacion_id = @origen;

INSERT INTO cotizacion_requisitos
  (cotizacion_id, requisito_codigo, titulo, categoria, norma_id, obligatorio, estado, evidencia_url, observaciones, orden)
SELECT @nueva, requisito_codigo, titulo, categoria, norma_id, obligatorio, estado, evidencia_url, observaciones, orden
FROM cotizacion_requisitos WHERE cotizacion_id = @origen;

INSERT INTO cotizacion_clausulas (cotizacion_id, clausula_id, codigo, titulo, cuerpo, orden)
SELECT @nueva, clausula_id, codigo, titulo, cuerpo, orden
FROM cotizacion_clausulas WHERE cotizacion_id = @origen;

INSERT INTO cotizacion_historial (cotizacion_id, estado_anterior, estado_nuevo, usuario_id, nota)
VALUES (@nueva, NULL, 'borrador', NULL, 'Nueva versión generada desde COT-2026-0001');

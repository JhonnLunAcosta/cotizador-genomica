-- ============================================================================
--  COTIZACIONES DE EJEMPLO
--  Ejecutar después de 02_seed.sql
-- ============================================================================

SET NAMES utf8mb4;

SET @empresa_id = (SELECT id FROM empresas WHERE nit = '901456789');
SET @cliente_id = (SELECT id FROM clientes WHERE numero_documento = '900123456');
SET @usuario_id = (SELECT id FROM usuarios WHERE email = 'laura@genomicaandina.co');

-- ---------------------------------------------------------------------------
-- COT-2026-0001 · Laboratorio Clínico San Rafael
-- ---------------------------------------------------------------------------
INSERT INTO cotizaciones
  (numero, version, empresa_id, cliente_id, fecha_emision, validez_dias, moneda, trm, trm_fecha, estado,
   forma_pago, plazo_entrega, lugar_entrega, incoterm, garantia_meses, garantia_detalle,
   incluye_instalacion, incluye_capacitacion, incluye_validacion,
   aplica_retefuente, retefuente_pct, reteiva_pct, reteica_pct,
   declaracion_cumplimiento, observaciones, condiciones_comerciales, creado_por)
VALUES
  ('COT-2026-0001', 1, @empresa_id, @cliente_id, '2026-10-29', 15, 'COP', 4100.0000, '2026-10-29', 'enviada',
   '50% con la orden de compra y 50% contra entrega', 'Equipos: 45 días calendario. Reactivos: 15 días calendario.',
   'Laboratorio Clínico San Rafael IPS S.A.S. - Bogotá D.C.', 'DAP', 12,
   'Doce (12) meses de garantía en el equipo por defectos de fabricación, con soporte técnico en sitio y repuestos incluidos.',
   TRUE, TRUE, TRUE,
   TRUE, 4.00, 0.00, 0.966,
   'El OFERENTE declara que los equipos y reactivos ofrecidos cuentan con registro sanitario vigente ante el INVIMA cuando la normativa lo exige, y entrega los certificados y protocolos de validación relacionados en el checklist regulatorio anexo. El CLIENTE declara conocer y aceptar las condiciones de uso, almacenamiento y gestión de residuos descritas en la oferta.',
   'Oferta para el montaje del área de secuenciación de nueva generación. Incluye instalación, capacitación del personal y acompañamiento en la validación inicial.',
   'Precios en pesos colombianos. IVA discriminado. Retención en la fuente sobre servicios y reteICA según las tarifas vigentes en Bogotá D.C.',
   @usuario_id);

SET @cot_id = LAST_INSERT_ID();

-- Snapshot de los datos legales al momento de enviar la oferta
UPDATE cotizaciones
   SET datos_empresa_snapshot = (
         SELECT JSON_OBJECT('nit', nit, 'razon_social', razon_social, 'direccion', direccion, 'ciudad', ciudad,
                            'telefono', telefono, 'email', email, 'resolucion_facturacion', resolucion_facturacion)
           FROM empresas WHERE id = @empresa_id),
       datos_cliente_snapshot = (
         SELECT JSON_OBJECT('tipo_documento', tipo_documento, 'numero_documento', numero_documento,
                            'razon_social', razon_social, 'direccion', direccion, 'ciudad', ciudad,
                            'email', email, 'codigo_habilitacion', codigo_habilitacion)
           FROM clientes WHERE id = @cliente_id)
 WHERE id = @cot_id;

-- Ítems (se copian los datos del producto y el registro sanitario vigente)
INSERT INTO cotizacion_items
  (cotizacion_id, orden, producto_id, tipo, sku, descripcion, marca, modelo, unidad_medida,
   cantidad, precio_unitario, descuento_pct, iva_pct, aplica_retefuente,
   registro_sanitario, registro_vence, tiempo_entrega)
SELECT
  @cot_id, v.orden, p.id, p.tipo, p.sku, p.nombre, p.marca, p.modelo, p.unidad_medida,
  v.cantidad, v.precio, v.descuento, p.iva_pct, p.aplica_retefuente,
  rs.numero_registro, rs.fecha_vencimiento, v.entrega
FROM (
            SELECT 'SEQ-001' AS sku, 1 AS orden, 1.000 AS cantidad, 512500000.00 AS precio, 0.00 AS descuento, '45 días' AS entrega
  UNION ALL SELECT 'REA-002', 2, 4.000, 6800000.00, 0.00, '15 días'
  UNION ALL SELECT 'REA-001', 3, 2.000, 12300000.00, 0.00, '15 días'
  UNION ALL SELECT 'SRV-001', 4, 1.000, 8500000.00, 0.00, '45 días'
  UNION ALL SELECT 'SRV-002', 5, 1.000, 5200000.00, 0.00, '60 días'
) AS v
JOIN productos p ON p.sku = v.sku
LEFT JOIN producto_registros_sanitarios rs
  ON rs.id = (
    SELECT rs2.id FROM producto_registros_sanitarios rs2
     WHERE rs2.producto_id = p.id AND rs2.tipo_registro = 'registro_sanitario'
     ORDER BY rs2.fecha_vencimiento DESC LIMIT 1
  );

-- Checklist regulatorio copiado desde la plantilla
INSERT INTO cotizacion_requisitos
  (cotizacion_id, requisito_codigo, titulo, categoria, norma_id, obligatorio, estado, orden)
SELECT @cot_id, codigo, titulo, categoria, norma_id, obligatorio, 'pendiente', orden
FROM requisitos_plantilla
WHERE activo = TRUE;

UPDATE cotizacion_requisitos
   SET estado = 'cumplido',
       observaciones = 'Documento anexo en la carpeta regulatoria de la oferta',
       evidencia_url = 'https://documentos.genomicaandina.co/cotizaciones/COT-2026-0001/'
 WHERE cotizacion_id = @cot_id
   AND requisito_codigo IN ('RS-01','RS-02','RS-03','RS-05','CO-01','CO-02','DP-01');

UPDATE cotizacion_requisitos
   SET estado = 'no_aplica',
       observaciones = 'No se ofrecen servicios de importación directa en esta oferta'
 WHERE cotizacion_id = @cot_id AND requisito_codigo = 'IM-01';

-- Normas citadas en la oferta
INSERT INTO cotizacion_normas (cotizacion_id, norma_id, nota)
SELECT @cot_id, id, 'Referencia de cumplimiento incluida en los anexos de la oferta'
FROM normas
WHERE codigo IN ('DEC-4725-2005','DEC-3772-2004','LEY-1581-2012','LEY-1480-2011','RES-0042-2020','DEC-1076-2015','ISO-15189');

-- Cláusulas con snapshot del texto y los datos de la oferta ya interpolados
INSERT INTO cotizacion_clausulas (cotizacion_id, clausula_id, codigo, titulo, cuerpo, orden)
SELECT @cot_id, id, codigo, titulo,
       REPLACE(REPLACE(REPLACE(REPLACE(cuerpo,
           '{{garantia_meses}}', '12'),
           '{{validez_dias}}', '15'),
           '{{moneda}}', 'COP'),
           '{{email_datos}}', 'datos@genomicaandina.co'),
       id
FROM clausulas
WHERE activo = TRUE
  AND codigo IN ('CLA-GARANTIA','CLA-VALIDEZ','CLA-DATOS','CLA-REGULATORIO','CLA-ENTREGA','CLA-RESIDUOS');

INSERT INTO cotizacion_historial (cotizacion_id, estado_anterior, estado_nuevo, usuario_id, nota) VALUES
  (@cot_id, 'borrador', 'en_revision', @usuario_id, 'Cotización creada con checklist regulatorio'),
  (@cot_id, 'en_revision', 'enviada', @usuario_id, 'Enviada al cliente con anexos regulatorios');

-- ---------------------------------------------------------------------------
-- COT-2026-0002 · Universidad Nacional (borrador)
-- ---------------------------------------------------------------------------
SET @cliente_unal = (SELECT id FROM clientes WHERE numero_documento = '830987654');

INSERT INTO cotizaciones
  (numero, version, empresa_id, cliente_id, fecha_emision, validez_dias, moneda, trm, trm_fecha, estado,
   forma_pago, plazo_entrega, lugar_entrega, incoterm, garantia_meses,
   incluye_instalacion, incluye_capacitacion, incluye_validacion,
   aplica_retefuente, retefuente_pct, reteiva_pct, reteica_pct,
   observaciones, condiciones_comerciales, creado_por)
VALUES
  ('COT-2026-0002', 1, @empresa_id, @cliente_unal, '2026-10-29', 30, 'COP', 4100.0000, '2026-10-29', 'borrador',
   'Pago de contado contra entrega', '30 días calendario', 'Ciudad Universitaria, Bogotá D.C.', 'DAP', 12,
   TRUE, TRUE, FALSE, TRUE, 4.00, 0.00, 0.966,
   'Oferta para vigilancia genómica en el grupo de investigación. Reactivos sujetos a disponibilidad del fabricante.',
   'Precios en pesos colombianos. IVA discriminado.',
   @usuario_id);

SET @cot2_id = LAST_INSERT_ID();

INSERT INTO cotizacion_items
  (cotizacion_id, orden, producto_id, tipo, sku, descripcion, marca, modelo, unidad_medida,
   cantidad, precio_unitario, descuento_pct, iva_pct, aplica_retefuente, registro_sanitario, registro_vence, tiempo_entrega)
SELECT
  @cot2_id, v.orden, p.id, p.tipo, p.sku, p.nombre, p.marca, p.modelo, p.unidad_medida,
  v.cantidad, v.precio, v.descuento, p.iva_pct, p.aplica_retefuente,
  rs.numero_registro, rs.fecha_vencimiento, v.entrega
FROM (
            SELECT 'SEQ-002' AS sku, 1 AS orden, 1.000 AS cantidad, 198900000.00 AS precio, 5.00 AS descuento, '60 días' AS entrega
  UNION ALL SELECT 'REA-003', 2, 4.000, 3900000.00, 0.00, '20 días'
  UNION ALL SELECT 'SRV-002', 3, 1.000, 5200000.00, 0.00, '30 días'
) AS v
JOIN productos p ON p.sku = v.sku
LEFT JOIN producto_registros_sanitarios rs
  ON rs.id = (
    SELECT rs2.id FROM producto_registros_sanitarios rs2
     WHERE rs2.producto_id = p.id AND rs2.tipo_registro = 'registro_sanitario'
     ORDER BY rs2.fecha_vencimiento DESC LIMIT 1
  );

INSERT INTO cotizacion_requisitos
  (cotizacion_id, requisito_codigo, titulo, categoria, norma_id, obligatorio, estado, orden)
SELECT @cot2_id, codigo, titulo, categoria, norma_id, obligatorio, 'pendiente', orden
FROM requisitos_plantilla WHERE activo = TRUE;

INSERT INTO cotizacion_clausulas (cotizacion_id, clausula_id, codigo, titulo, cuerpo, orden)
SELECT @cot2_id, id, codigo, titulo,
       REPLACE(REPLACE(REPLACE(REPLACE(cuerpo,
           '{{garantia_meses}}', '12'),
           '{{validez_dias}}', '30'),
           '{{moneda}}', 'COP'),
           '{{email_datos}}', 'datos@genomicaandina.co'),
       id
FROM clausulas
WHERE activo = TRUE AND obligatoria = TRUE;

INSERT INTO cotizacion_normas (cotizacion_id, norma_id, nota)
SELECT @cot2_id, id, 'Referencia de cumplimiento incluida en los anexos de la oferta'
FROM normas
WHERE codigo IN ('DEC-4725-2005','DEC-3772-2004','LEY-1581-2012','LEY-1480-2011','RES-0042-2020','DEC-1076-2015','ISO-15189');

INSERT INTO cotizacion_historial (cotizacion_id, estado_anterior, estado_nuevo, usuario_id, nota)
VALUES (@cot2_id, NULL, 'borrador', @usuario_id, 'Borrador creado para revisión regulatoria');

UPDATE consecutivos SET ultimo_numero = 2 WHERE tipo = 'cotizacion' AND anio = 2026;

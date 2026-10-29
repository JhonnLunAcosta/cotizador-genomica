-- ============================================================================
--  DATOS SEMILLA · catálogo, normativa colombiana y plantillas
--  Ejecutar después de 01_schema.sql sobre cotizador_genomica
-- ============================================================================

SET NAMES utf8mb4;

-- ---------------------------------------------------------------------------
-- Monedas y tasas de cambio
-- ---------------------------------------------------------------------------
INSERT INTO monedas (codigo, nombre, simbolo, decimales) VALUES
  ('COP', 'Peso colombiano', '$', 2),
  ('USD', 'Dólar estadounidense', 'US$', 2),
  ('EUR', 'Euro', 'EUR', 2);

INSERT INTO tasas_cambio (moneda_origen, moneda_destino, tasa, fecha, fuente) VALUES
  ('USD', 'COP', 4085.500000, '2026-10-01', 'Banco de la República'),
  ('USD', 'COP', 4112.300000, '2026-10-15', 'Banco de la República'),
  ('USD', 'COP', 4100.000000, '2026-10-29', 'Banco de la República'),
  ('EUR', 'COP', 4780.250000, '2026-10-29', 'Banco de la República');

-- ---------------------------------------------------------------------------
-- Empresa oferente y usuarios
-- ---------------------------------------------------------------------------
INSERT INTO empresas
  (nit, digito_verificacion, razon_social, nombre_comercial, tipo_persona, regimen_tributario,
   responsabilidad_tributaria, actividad_economica, direccion, ciudad, departamento, telefono, email,
   sitio_web, representante_legal, documento_representante, resolucion_facturacion, prefijo_factura)
VALUES
  ('901456789', '3', 'Genómica Andina S.A.S.', 'Genómica Andina', 'juridica', 'responsable_iva',
   'O-13; O-15; O-23; O-47', '4659', 'Calle 93 # 15-20, Oficina 501', 'Bogotá D.C.', 'Cundinamarca',
   '+57 601 745 8899', 'comercial@genomicaandina.co', 'https://genomicaandina.co',
   'María Fernanda Rojas', '1020304050', '18764001234567', 'GA');

INSERT INTO usuarios (nombre, email, rol) VALUES
  ('Jhonn Esteban', 'jhonn@genomicaandina.co', 'admin'),
  ('Laura Cárdenas', 'laura@genomicaandina.co', 'vendedor'),
  ('Andrés Prieto', 'andres@genomicaandina.co', 'regulatorio');

-- ---------------------------------------------------------------------------
-- Clientes y contactos
-- ---------------------------------------------------------------------------
INSERT INTO clientes
  (tipo_documento, numero_documento, digito_verificacion, razon_social, nombre_comercial, tipo_persona,
   tipo_cliente, regimen_tributario, responsabilidad_tributaria, actividad_economica, codigo_habilitacion,
   direccion, ciudad, departamento, telefono, email, autoriza_datos, fecha_autorizacion_datos)
VALUES
  ('NIT', '900123456', '7', 'Laboratorio Clínico San Rafael IPS S.A.S.', 'Lab San Rafael', 'juridica',
   'laboratorio', 'responsable_iva', 'O-13; O-15', '8691', '1100101234',
   'Carrera 45 # 26-85', 'Bogotá D.C.', 'Cundinamarca', '+57 601 555 1234',
   'compras@labsanrafael.co', TRUE, '2026-10-20'),
  ('NIT', '830987654', '1', 'Universidad Nacional de Colombia', 'UNAL', 'juridica',
   'universidad', 'no_responsable_iva', 'O-13', '8541', NULL,
   'Ciudad Universitaria, Edificio 476', 'Bogotá D.C.', 'Cundinamarca', '+57 601 316 5000',
   'genetica@unal.edu.co', TRUE, '2026-09-10'),
  ('NIT', '890765432', '5', 'Clínica del Norte S.A.S.', 'Clínica del Norte', 'juridica',
   'clinica', 'responsable_iva', 'O-13; O-15; O-23', '8610', '1100105678',
   'Calle 100 # 19-54', 'Bogotá D.C.', 'Cundinamarca', '+57 601 603 2020',
   'compras@clinicanorte.co', FALSE, NULL);

INSERT INTO cliente_contactos (cliente_id, nombre, cargo, email, telefono, celular, principal) VALUES
  ((SELECT id FROM clientes WHERE numero_documento = '900123456'), 'Diana Milena Ríos', 'Coordinadora de Compras', 'diana.rios@labsanrafael.co', '+57 601 555 1234', '+57 310 456 7890', TRUE),
  ((SELECT id FROM clientes WHERE numero_documento = '900123456'), 'Carlos Andrés Peña', 'Jefe de Laboratorio', 'carlos.pena@labsanrafael.co', NULL, '+57 320 111 2233', FALSE),
  ((SELECT id FROM clientes WHERE numero_documento = '830987654'), 'Andrea Lozano', 'Directora de Genética', 'alozano@unal.edu.co', '+57 601 316 5000', NULL, TRUE);

-- ---------------------------------------------------------------------------
-- Proveedores
-- ---------------------------------------------------------------------------
INSERT INTO proveedores (nit, razon_social, tipo, pais, contacto, email, telefono, sitio_web) VALUES
  ('US-ILLUMINA', 'Illumina, Inc.', 'fabricante', 'Estados Unidos', 'Global Support', 'support@illumina.com', '+1 858 202 4500', 'https://www.illumina.com'),
  ('GB-ONT', 'Oxford Nanopore Technologies Ltd.', 'fabricante', 'Reino Unido', 'Technical Support', 'support@nanoporetech.com', '+44 20 3405 0000', 'https://nanoporetech.com'),
  ('900555111', 'Biotech Distribuciones S.A.S.', 'distribuidor', 'Colombia', 'Ventas', 'ventas@biotechdist.co', '+57 601 600 7788', NULL);

-- ---------------------------------------------------------------------------
-- Categorías
-- ---------------------------------------------------------------------------
INSERT INTO categorias_producto (nombre, tipo, descripcion, orden) VALUES
  ('Secuenciadores', 'equipo', 'Equipos de secuenciación de nueva generación', 10),
  ('Equipos de laboratorio', 'equipo', 'Termocicladores, fluorómetros y equipos auxiliares', 20),
  ('Reactivos y kits', 'reactivo', 'Kits de librería, secuenciación, control y cuantificación', 30),
  ('Consumibles', 'consumible', 'Puntas, placas y tubos para biología molecular', 40),
  ('Servicios', 'servicio', 'Instalación, capacitación, mantenimiento y validación', 50),
  ('Software', 'software', 'Licencias de análisis bioinformático', 60);

-- ---------------------------------------------------------------------------
-- Catálogo de productos
-- ---------------------------------------------------------------------------
INSERT INTO productos
  (sku, nombre, descripcion, categoria_id, tipo, marca, modelo, referencia_fabricante, fabricante,
   pais_origen, proveedor_id, unidad_medida, presentacion, reacciones_por_kit, requiere_cadena_frio,
   temperatura_almacenamiento, vida_util_meses, clase_dispositivo, es_ivd, requiere_registro_sanitario,
   requiere_licencia_importacion, arancel_pct, iva_tipo, iva_pct, concepto_tributario)
VALUES
  ('SEQ-001', 'Secuenciador NGS de sobremesa MiSeq',
   'Secuenciador de nueva generación para laboratorios clínicos y de investigación. Lecturas de 2x300 pb, hasta 15 Gb por corrida.',
   (SELECT id FROM categorias_producto WHERE nombre = 'Secuenciadores'), 'equipo', 'Illumina', 'MiSeq', 'SY-410-1003', 'Illumina, Inc.',
   'Estados Unidos', (SELECT id FROM proveedores WHERE nit = 'US-ILLUMINA'), 'unidad', 'Equipo completo con estación de análisis y software', NULL, FALSE,
   '15 a 30 °C', 120, 'IIA', FALSE, TRUE, TRUE, 0.00, 'gravado', 19.00, 'bien'),

  ('SEQ-002', 'Secuenciador portátil MinION Mk1C',
   'Secuenciador portátil de lectura larga con cómputo integrado. Ideal para vigilancia genómica y análisis de campo.',
   (SELECT id FROM categorias_producto WHERE nombre = 'Secuenciadores'), 'equipo', 'Oxford Nanopore', 'MinION Mk1C', 'MK1C', 'Oxford Nanopore Technologies',
   'Reino Unido', (SELECT id FROM proveedores WHERE nit = 'GB-ONT'), 'unidad', 'Equipo con flow cell de inicio y maletín de transporte', NULL, FALSE,
   '15 a 25 °C', 96, 'IIA', FALSE, TRUE, TRUE, 0.00, 'gravado', 19.00, 'bien'),

  ('SEQ-003', 'Termociclador Mastercycler X50s',
   'Termociclador de 96 pocillos con gradiente y rampa ajustable para protocolos de PCR y librerías.',
   (SELECT id FROM categorias_producto WHERE nombre = 'Equipos de laboratorio'), 'equipo', 'Eppendorf', 'Mastercycler X50s', '6311000010', 'Eppendorf AG',
   'Alemania', (SELECT id FROM proveedores WHERE nit = '900555111'), 'unidad', 'Equipo de 96 pocillos con módulo de gradiente', NULL, FALSE,
   '15 a 30 °C', 120, 'no_aplica', FALSE, FALSE, FALSE, 0.00, 'gravado', 19.00, 'bien'),

  ('REA-001', 'Kit de librerías Nextera XT DNA',
   'Kit de preparación de librerías por tagmentación enzimática para 96 muestras. Incluye enzimas, buffers y adaptadores indexados.',
   (SELECT id FROM categorias_producto WHERE nombre = 'Reactivos y kits'), 'reactivo', 'Illumina', 'Nextera XT DNA Library Prep', 'FC-131-1096', 'Illumina, Inc.',
   'Estados Unidos', (SELECT id FROM proveedores WHERE nit = 'US-ILLUMINA'), 'kit', 'Kit para 96 muestras (24 índices)', 96, TRUE,
   '-25 a -15 °C', 12, 'no_aplica', TRUE, TRUE, TRUE, 0.00, 'gravado', 19.00, 'bien'),

  ('REA-002', 'Kit de secuenciación MiSeq v3 (600 ciclos)',
   'Cartucho de reactivos y flow cell para corridas de 2x300 pb en MiSeq. Rendimiento de hasta 25 M de lecturas.',
   (SELECT id FROM categorias_producto WHERE nombre = 'Reactivos y kits'), 'reactivo', 'Illumina', 'MiSeq Reagent Kit v3', 'MS-102-3003', 'Illumina, Inc.',
   'Estados Unidos', (SELECT id FROM proveedores WHERE nit = 'US-ILLUMINA'), 'kit', 'Cartucho con flow cell integrada', NULL, TRUE,
   '-25 a -15 °C', 12, 'no_aplica', TRUE, TRUE, TRUE, 0.00, 'gravado', 19.00, 'bien'),

  ('REA-003', 'Flow cell FLO-MIN106D (R9.4.1)',
   'Flow cell de lectura larga para MinION y GridION, 12 meses de vida útil desde su fabricación.',
   (SELECT id FROM categorias_producto WHERE nombre = 'Reactivos y kits'), 'reactivo', 'Oxford Nanopore', 'FLO-MIN106D', 'FLO-MIN106D', 'Oxford Nanopore Technologies',
   'Reino Unido', (SELECT id FROM proveedores WHERE nit = 'GB-ONT'), 'unidad', 'Flow cell individual en empaque sellado', NULL, TRUE,
   '2 a 8 °C', 12, 'no_aplica', TRUE, TRUE, TRUE, 0.00, 'gravado', 19.00, 'bien'),

  ('REA-004', 'Kit de cuantificación Qubit dsDNA HS',
   'Ensayo fluorométrico para cuantificación de ADN de doble cadena en el rango de 0,2 a 100 ng.',
   (SELECT id FROM categorias_producto WHERE nombre = 'Reactivos y kits'), 'reactivo', 'Thermo Fisher', 'Qubit dsDNA HS Assay Kit', 'Q32851', 'Thermo Fisher Scientific',
   'Estados Unidos', (SELECT id FROM proveedores WHERE nit = '900555111'), 'kit', 'Kit para 500 ensayos', 500, TRUE,
   '2 a 8 °C', 12, 'no_aplica', TRUE, TRUE, TRUE, 0.00, 'gravado', 19.00, 'bien'),

  ('REA-005', 'Reactivo AMPure XP (60 mL)',
   'Perlas paramagnéticas para purificación y limpieza de productos de PCR y librerías.',
   (SELECT id FROM categorias_producto WHERE nombre = 'Reactivos y kits'), 'reactivo', 'Beckman Coulter', 'AMPure XP', 'A63881', 'Beckman Coulter',
   'Estados Unidos', (SELECT id FROM proveedores WHERE nit = '900555111'), 'unidad', 'Frasco de 60 mL', NULL, TRUE,
   '2 a 8 °C', 24, 'no_aplica', FALSE, FALSE, FALSE, 0.00, 'gravado', 19.00, 'bien'),

  ('CON-001', 'Puntas filtradas 200 µL (rack de 96)',
   'Puntas estériles con filtro, libres de DNasa y RNasa, para pipetas de 20 a 200 µL.',
   (SELECT id FROM categorias_producto WHERE nombre = 'Consumibles'), 'consumible', 'Axygen', 'T-200-Y-R-S', 'T-200-Y-R-S', 'Axygen',
   'Estados Unidos', (SELECT id FROM proveedores WHERE nit = '900555111'), 'caja', 'Rack de 96 puntas', NULL, FALSE,
   '15 a 30 °C', NULL, 'no_aplica', FALSE, FALSE, FALSE, 0.00, 'gravado', 19.00, 'bien'),

  ('CON-002', 'Placas de PCR 96 pocillos',
   'Placas de polipropileno sin recubrimiento, compatibles con termocicladores y secuenciadores.',
   (SELECT id FROM categorias_producto WHERE nombre = 'Consumibles'), 'consumible', 'Eppendorf', 'twins.tec PCR plate', '0030129512', 'Eppendorf AG',
   'Alemania', (SELECT id FROM proveedores WHERE nit = '900555111'), 'paquete', 'Paquete de 25 placas', NULL, FALSE,
   '15 a 30 °C', NULL, 'no_aplica', FALSE, FALSE, FALSE, 0.00, 'gravado', 19.00, 'bien'),

  ('SRV-001', 'Instalación y puesta en marcha con validación IQ/OQ',
   'Instalación del equipo, verificación de instalación (IQ), verificación de operación (OQ) y entrega de protocolos firmados.',
   (SELECT id FROM categorias_producto WHERE nombre = 'Servicios'), 'servicio', NULL, NULL, NULL, 'Genómica Andina',
   'Colombia', NULL, 'servicio', 'Visita de ingeniero certificado en sitio', NULL, FALSE,
   NULL, NULL, 'no_aplica', FALSE, FALSE, FALSE, 0.00, 'gravado', 19.00, 'servicio_tecnico'),

  ('SRV-002', 'Capacitación operativa (40 horas)',
   'Entrenamiento teórico-práctico para operación del secuenciador, preparación de librerías y análisis primario.',
   (SELECT id FROM categorias_producto WHERE nombre = 'Servicios'), 'servicio', NULL, NULL, NULL, 'Genómica Andina',
   'Colombia', NULL, 'servicio', '40 horas presenciales o virtuales para hasta 6 personas', NULL, FALSE,
   NULL, NULL, 'no_aplica', FALSE, FALSE, FALSE, 0.00, 'gravado', 19.00, 'servicio_tecnico'),

  ('SRV-003', 'Mantenimiento preventivo anual',
   'Mantenimiento preventivo con repuestos menores, verificación de desempeño y reporte técnico.',
   (SELECT id FROM categorias_producto WHERE nombre = 'Servicios'), 'servicio', NULL, NULL, NULL, 'Genómica Andina',
   'Colombia', NULL, 'servicio', 'Una visita anual programada', NULL, FALSE,
   NULL, NULL, 'no_aplica', FALSE, FALSE, FALSE, 0.00, 'gravado', 19.00, 'servicio_tecnico'),

  ('SRV-004', 'Verificación de desempeño y validación de método',
   'Diseño y ejecución de la validación de la prueba genómica según criterios de la ISO 15189 y lineamientos del laboratorio.',
   (SELECT id FROM categorias_producto WHERE nombre = 'Servicios'), 'servicio', NULL, NULL, NULL, 'Genómica Andina',
   'Colombia', NULL, 'servicio', 'Acompañamiento de 8 semanas', NULL, FALSE,
   NULL, NULL, 'no_aplica', FALSE, FALSE, FALSE, 0.00, 'gravado', 19.00, 'servicio_tecnico'),

  ('SW-001', 'Licencia anual de análisis bioinformático',
   'Licencia de plataforma en la nube para análisis secundario, control de calidad y reporte de variantes.',
   (SELECT id FROM categorias_producto WHERE nombre = 'Software'), 'software', 'Genómica Andina', 'Cloud Analysis', 'GA-CLOUD-1Y', 'Genómica Andina',
   'Colombia', NULL, 'licencia', 'Licencia por 12 meses, 5 usuarios concurrentes', NULL, FALSE,
   NULL, NULL, 'no_aplica', FALSE, FALSE, FALSE, 0.00, 'gravado', 19.00, 'software');

-- Los servicios y el software son sujetos de retención en la fuente.
UPDATE productos SET aplica_retefuente = TRUE WHERE tipo IN ('servicio','software');

-- ---------------------------------------------------------------------------
-- Registros sanitarios y certificados
-- ---------------------------------------------------------------------------
INSERT INTO producto_registros_sanitarios
  (producto_id, tipo_registro, numero_registro, autoridad, fecha_expedicion, fecha_vencimiento, estado, observaciones)
VALUES
  ((SELECT id FROM productos WHERE sku = 'SEQ-001'), 'registro_sanitario', 'INVIMA 2019DM-0019876', 'INVIMA', '2019-05-20', '2027-06-30', 'vigente', 'Dispositivo médico clase IIA'),
  ((SELECT id FROM productos WHERE sku = 'SEQ-002'), 'registro_sanitario', 'INVIMA 2022DM-0025431', 'INVIMA', '2022-11-15', '2026-12-31', 'vigente', 'Renovación en trámite'),
  ((SELECT id FROM productos WHERE sku = 'REA-001'), 'registro_sanitario', 'INVIMA 2018RD-0017654', 'INVIMA', '2018-04-10', '2028-03-31', 'vigente', 'Reactivo de diagnóstico in vitro'),
  ((SELECT id FROM productos WHERE sku = 'REA-002'), 'registro_sanitario', 'INVIMA 2020RD-0021345', 'INVIMA', '2020-09-30', '2027-09-30', 'vigente', 'Reactivo de diagnóstico in vitro'),
  ((SELECT id FROM productos WHERE sku = 'REA-003'), 'registro_sanitario', 'INVIMA 2021RD-0023876', 'INVIMA', '2021-12-01', '2026-11-30', 'vigente', 'Reactivo de diagnóstico in vitro'),
  ((SELECT id FROM productos WHERE sku = 'REA-004'), 'registro_sanitario', 'INVIMA 2017RD-0014567', 'INVIMA', '2017-07-01', '2026-08-31', 'vencido', 'Requiere renovación antes de comercializar'),
  ((SELECT id FROM productos WHERE sku = 'SEQ-001'), 'bpm', 'BPM-ILLUMINA-2025', 'INVIMA', '2025-02-01', '2027-01-31', 'vigente', 'Buenas prácticas de manufactura del fabricante'),
  ((SELECT id FROM productos WHERE sku = 'SEQ-001'), 'certificado_libre_venta', 'CFV-ILLUMINA-2025', 'FDA', '2025-03-15', '2026-12-31', 'vigente', 'Certificado de libre venta para importación');

-- ---------------------------------------------------------------------------
-- Listas de precios
-- ---------------------------------------------------------------------------
INSERT INTO producto_precios (producto_id, lista, moneda, costo, precio, vigente_desde) VALUES
  ((SELECT id FROM productos WHERE sku = 'SEQ-001'), 'publico', 'COP', 389500000.00, 512500000.00, '2026-01-01'),
  ((SELECT id FROM productos WHERE sku = 'SEQ-001'), 'publico', 'USD', 95000.00, 125000.00, '2026-01-01'),
  ((SELECT id FROM productos WHERE sku = 'SEQ-002'), 'publico', 'COP', 152000000.00, 198900000.00, '2026-01-01'),
  ((SELECT id FROM productos WHERE sku = 'SEQ-002'), 'publico', 'USD', 37000.00, 49000.00, '2026-01-01'),
  ((SELECT id FROM productos WHERE sku = 'SEQ-003'), 'publico', 'COP', 18700000.00, 26400000.00, '2026-01-01'),
  ((SELECT id FROM productos WHERE sku = 'SEQ-003'), 'publico', 'USD', 4550.00, 6500.00, '2026-01-01'),
  ((SELECT id FROM productos WHERE sku = 'REA-001'), 'publico', 'COP', 9100000.00, 12300000.00, '2026-01-01'),
  ((SELECT id FROM productos WHERE sku = 'REA-002'), 'publico', 'COP', 4950000.00, 6800000.00, '2026-01-01'),
  ((SELECT id FROM productos WHERE sku = 'REA-003'), 'publico', 'COP', 2850000.00, 3900000.00, '2026-01-01'),
  ((SELECT id FROM productos WHERE sku = 'REA-004'), 'publico', 'COP', 1780000.00, 2450000.00, '2026-01-01'),
  ((SELECT id FROM productos WHERE sku = 'REA-005'), 'publico', 'COP', 2300000.00, 3150000.00, '2026-01-01'),
  ((SELECT id FROM productos WHERE sku = 'CON-001'), 'publico', 'COP', 120000.00, 185000.00, '2026-01-01'),
  ((SELECT id FROM productos WHERE sku = 'CON-002'), 'publico', 'COP', 290000.00, 420000.00, '2026-01-01'),
  ((SELECT id FROM productos WHERE sku = 'SRV-001'), 'publico', 'COP', 5200000.00, 8500000.00, '2026-01-01'),
  ((SELECT id FROM productos WHERE sku = 'SRV-002'), 'publico', 'COP', 3000000.00, 5200000.00, '2026-01-01'),
  ((SELECT id FROM productos WHERE sku = 'SRV-003'), 'publico', 'COP', 9800000.00, 14800000.00, '2026-01-01'),
  ((SELECT id FROM productos WHERE sku = 'SRV-004'), 'publico', 'COP', 12000000.00, 18000000.00, '2026-01-01'),
  ((SELECT id FROM productos WHERE sku = 'SW-001'), 'publico', 'COP', 6000000.00, 9600000.00, '2026-01-01');

-- ---------------------------------------------------------------------------
-- Marco normativo de referencia
-- ---------------------------------------------------------------------------
INSERT INTO normas (codigo, titulo, entidad, tipo, anio, ambito, descripcion, obligatoria, nota_vigencia) VALUES
  ('LEY-1581-2012', 'Ley 1581 de 2012 - Protección de datos personales', 'Congreso de la República', 'ley', 2012, 'datos_personales',
   'Establece el régimen general de protección de datos personales. Los datos genéticos son datos sensibles y requieren autorización expresa y medidas reforzadas.', TRUE,
   'Verificar decretos reglamentarios vigentes'),
  ('DEC-1377-2013', 'Decreto 1377 de 2013 - Reglamentación de la Ley 1581', 'Ministerio de Comercio, Industria y Turismo', 'decreto', 2013, 'datos_personales',
   'Reglamenta la autorización del titular, el aviso de privacidad y las políticas de tratamiento de datos.', TRUE, NULL),
  ('LEY-1480-2011', 'Ley 1480 de 2011 - Estatuto del Consumidor', 'Congreso de la República', 'ley', 2011, 'consumidor',
   'Regula la información veraz y suficiente en la oferta, las condiciones de la garantía legal y las responsabilidades del proveedor.', TRUE, NULL),
  ('DEC-1074-2015', 'Decreto 1074 de 2015 - Decreto Único Reglamentario del Sector Comercio', 'Presidencia de la República', 'decreto', 2015, 'consumidor',
   'Compila la reglamentación en materia de protección al consumidor y protección de datos personales.', TRUE, NULL),
  ('DEC-4725-2005', 'Decreto 4725 de 2005 - Régimen de registro sanitario de dispositivos médicos', 'Ministerio de la Protección Social', 'decreto', 2005, 'dispositivos_medicos',
   'Define los requisitos de registro sanitario, vigilancia y control de dispositivos médicos para uso humano, incluidas las clases IIA, IIB y III.', TRUE,
   'Compilado en el Decreto 780 de 2016'),
  ('DEC-3772-2004', 'Decreto 3772 de 2004 - Reactivos de diagnóstico in vitro', 'Ministerio de la Protección Social', 'decreto', 2004, 'ivd',
   'Reglamenta el régimen de registros sanitarios y la vigilancia sanitaria de los reactivos de diagnóstico in vitro.', TRUE,
   'Compilado en el Decreto 780 de 2016'),
  ('DEC-780-2016', 'Decreto 780 de 2016 - Decreto Único Reglamentario del Sector Salud', 'Presidencia de la República', 'decreto', 2016, 'dispositivos_medicos',
   'Compila la normativa sanitaria, incluidos los requisitos de dispositivos médicos y reactivos de diagnóstico in vitro.', TRUE, NULL),
  ('RES-3100-2019', 'Resolución 3100 de 2019 - Habilitación de servicios de salud', 'Ministerio de Salud y Protección Social', 'resolucion', 2019, 'laboratorio',
   'Establece los procedimientos y criterios de habilitación de servicios de salud, aplicables a los laboratorios clientes.', TRUE, NULL),
  ('RES-1995-1999', 'Resolución 1995 de 1999 - Historia clínica', 'Ministerio de Salud', 'resolucion', 1999, 'laboratorio',
   'Norma la custodia, confidencialidad y manejo de la historia clínica y de los resultados de laboratorio.', TRUE, NULL),
  ('RES-8430-1993', 'Resolución 8430 de 1993 - Investigación en salud', 'Ministerio de Salud', 'resolucion', 1993, 'genetica',
   'Establece las normas científicas y administrativas para la investigación en salud, incluido el manejo de muestras biológicas.', TRUE,
   'Verificar aplicabilidad según el uso previsto'),
  ('ESTATUTO-TRIBUTARIO', 'Decreto 624 de 1989 - Estatuto Tributario', 'Congreso de la República', 'decreto', 1989, 'tributario',
   'Define el IVA, las retenciones en la fuente y las obligaciones formales del oferente y del adquirente.', TRUE, NULL),
  ('DEC-1625-2016', 'Decreto 1625 de 2016 - Decreto Único Reglamentario en materia tributaria', 'Presidencia de la República', 'decreto', 2016, 'tributario',
   'Compila la reglamentación tributaria, incluidas tarifas de retención en la fuente y retención de IVA.', TRUE, NULL),
  ('RES-0042-2020', 'Resolución 000042 de 2020 - Facturación electrónica', 'DIAN', 'resolucion', 2020, 'tributario',
   'Desarrolla el sistema de facturación electrónica, los requisitos de los documentos equivalentes y la validación previa.', TRUE,
   'Verificar versiones y resoluciones modificatorias'),
  ('DEC-1076-2015', 'Decreto 1076 de 2015 - Decreto Único Reglamentario del Sector Ambiente', 'Presidencia de la República', 'decreto', 2015, 'residuos',
   'Compila la normativa ambiental, incluida la gestión de residuos peligrosos (RESPEL) generados en laboratorios.', TRUE, NULL),
  ('RES-1164-2002', 'Resolución 1164 de 2002 - Residuos hospitalarios y similares', 'Ministerio de Salud', 'resolucion', 2002, 'residuos',
   'Adopta el manual de procedimientos para la gestión integral de residuos hospitalarios y similares.', TRUE,
   'Verificar normas ambientales aplicables'),
  ('ISO-15189', 'ISO 15189:2022 - Laboratorios clínicos: requisitos de calidad y competencia', 'ISO', 'estandar', 2022, 'calidad',
   'Estándar internacional para la competencia técnica de laboratorios clínicos; referencia para validación de métodos y control de calidad.', FALSE, NULL),
  ('ISO-20387', 'ISO 20387:2018 - Biobancos: requisitos generales', 'ISO', 'estandar', 2018, 'calidad',
   'Requisitos para biobancos que manejan material biológico humano con fines de investigación.', FALSE, NULL);

-- ---------------------------------------------------------------------------
-- Checklist regulatorio reutilizable
-- ---------------------------------------------------------------------------
INSERT INTO requisitos_plantilla (codigo, titulo, descripcion, categoria, obligatorio, norma_id, aplica_a, orden) VALUES
  ('RS-01', 'Registro sanitario INVIMA vigente del equipo',
   'Adjuntar copia del registro sanitario o permiso de comercialización vigente del dispositivo médico ofrecido.',
   'registro_sanitario', TRUE, (SELECT id FROM normas WHERE codigo = 'DEC-4725-2005'), 'equipos', 10),
  ('RS-02', 'Registro sanitario INVIMA de reactivos de diagnóstico in vitro',
   'Adjuntar el registro sanitario de cada reactivo o kit IVD ofrecido, con fecha de vencimiento.',
   'registro_sanitario', TRUE, (SELECT id FROM normas WHERE codigo = 'DEC-3772-2004'), 'reactivos', 20),
  ('RS-03', 'Certificado de Buenas Prácticas de Manufactura del fabricante',
   'Certificado BPM vigente expedido por la autoridad sanitaria del país de origen o por el INVIMA.',
   'registro_sanitario', TRUE, (SELECT id FROM normas WHERE codigo = 'DEC-780-2016'), 'todos', 30),
  ('RS-04', 'Certificado de libre venta y exportación',
   'Documento que acredite que el producto se comercializa legalmente en el país de origen.',
   'importacion', TRUE, NULL, 'todos', 40),
  ('RS-05', 'Carta de autorización del fabricante o distribuidor autorizado',
   'Carta vigente que acredite al oferente como importador o distribuidor autorizado de la marca.',
   'documentos_legales', TRUE, NULL, 'todos', 50),
  ('IM-01', 'Licencia o permiso de importación (si aplica)',
   'Verificar si el producto requiere licencia previa o permiso sanitario para su importación.',
   'importacion', FALSE, NULL, 'todos', 60),
  ('CA-01', 'Certificado de calibración con trazabilidad metrológica',
   'Certificado de calibración de los equipos de medición asociados, con trazabilidad a patrones nacionales.',
   'calidad', TRUE, NULL, 'equipos', 70),
  ('CA-02', 'Protocolo de validación IQ/OQ/PQ',
   'Protocolos de calificación de instalación, operación y desempeño, firmados por el fabricante y el cliente.',
   'calidad', TRUE, (SELECT id FROM normas WHERE codigo = 'ISO-15189'), 'servicios', 80),
  ('CA-03', 'Ficha técnica y manual del usuario en español',
   'Ficha técnica, manual de operación y guía rápida en español para el personal del laboratorio.',
   'calidad', TRUE, NULL, 'todos', 90),
  ('BI-01', 'Hojas de seguridad (SDS) de los reactivos',
   'Hojas de datos de seguridad de cada reactivo químico ofrecido, en español y vigentes.',
   'bioseguridad', TRUE, (SELECT id FROM normas WHERE codigo = 'DEC-1076-2015'), 'reactivos', 100),
  ('BI-02', 'Plan de gestión de residuos generados',
   'Plan de manejo de residuos biológicos y químicos generados durante la operación del equipo.',
   'bioseguridad', TRUE, (SELECT id FROM normas WHERE codigo = 'RES-1164-2002'), 'todos', 110),
  ('DP-01', 'Autorización de tratamiento de datos personales',
   'Autorización expresa del cliente para el tratamiento de datos personales conforme a la Ley 1581 de 2012.',
   'datos_personales', TRUE, (SELECT id FROM normas WHERE codigo = 'LEY-1581-2012'), 'todos', 120),
  ('DP-02', 'Política de tratamiento de datos genéticos',
   'Política específica para datos genéticos por ser datos sensibles, con medidas de seguridad reforzadas.',
   'datos_personales', TRUE, (SELECT id FROM normas WHERE codigo = 'LEY-1581-2012'), 'todos', 130),
  ('CO-01', 'RUT y datos de facturación electrónica del cliente',
   'RUT actualizado, régimen tributario y correo de recepción de factura electrónica.',
   'comercial', TRUE, (SELECT id FROM normas WHERE codigo = 'RES-0042-2020'), 'todos', 140),
  ('CO-02', 'Condiciones de garantía y posventa',
   'Términos de garantía legal y comercial, tiempos de respuesta y canales de soporte.',
   'comercial', TRUE, (SELECT id FROM normas WHERE codigo = 'LEY-1480-2011'), 'todos', 150);

-- ---------------------------------------------------------------------------
-- Cláusulas contractuales reutilizables
-- ---------------------------------------------------------------------------
INSERT INTO clausulas (codigo, titulo, cuerpo, categoria, obligatoria) VALUES
  ('CLA-GARANTIA', 'Garantía',
   'El OFERENTE garantiza los bienes ofrecidos contra defectos de fabricación y funcionamiento por un término de {{garantia_meses}} meses contados a partir de la entrega, sin perjuicio de la garantía legal mínima establecida en la Ley 1480 de 2011. La garantía cubre repuestos, mano de obra y desplazamiento del personal técnico. No cubre daños por uso indebido, instalaciones eléctricas deficientes o intervenciones no autorizadas.',
   'garantia', TRUE),
  ('CLA-DATOS', 'Tratamiento de datos personales',
   'Las partes declaran que los datos personales suministrados serán tratados conforme a la Ley 1581 de 2012 y el Decreto 1377 de 2013, únicamente para las finalidades de la presente oferta y la relación comercial derivada. Los datos genéticos y de salud se consideran datos sensibles y contarán con medidas de seguridad reforzadas, acceso restringido y prohibición de transferencia no autorizada. El titular podrá ejercer sus derechos de conocer, actualizar, rectificar y suprimir la información escribiendo a {{email_datos}}.',
   'datos_personales', TRUE),
  ('CLA-CONFID', 'Confidencialidad',
   'La información técnica, comercial y regulatoria intercambiada entre las partes tiene carácter confidencial y no podrá ser divulgada a terceros sin autorización escrita, salvo requerimiento de autoridad competente. Esta obligación subsiste por cinco (5) años después de finalizada la relación comercial.',
   'confidencialidad', TRUE),
  ('CLA-VALIDEZ', 'Validez de la oferta',
   'La presente oferta tiene una vigencia de {{validez_dias}} días calendario contados desde su fecha de emisión. Los precios están expresados en {{moneda}} y pueden variar por fluctuación de la tasa de cambio, cambios arancelarios o modificaciones de las condiciones del fabricante, situaciones que se informarán por escrito antes de la aceptación.',
   'comercial', TRUE),
  ('CLA-REGULATORIO', 'Cumplimiento regulatorio',
   'El OFERENTE declara que los dispositivos médicos y reactivos de diagnóstico in vitro ofrecidos cuentan con registro sanitario vigente ante el INVIMA cuando la normativa lo exige, y que los documentos regulatorios relacionados en esta oferta se entregan como anexos. El CLIENTE se obliga a destinar los bienes a los usos autorizados en el registro sanitario y a mantener las condiciones de almacenamiento indicadas en la ficha técnica.',
   'regulatoria', TRUE),
  ('CLA-RESIDUOS', 'Gestión de residuos',
   'El CLIENTE será responsable de la gestión integral de los residuos generados por el uso de los reactivos y equipos, conforme a la Resolución 1164 de 2002 y la normativa ambiental vigente, y deberá contar con un gestor autorizado para residuos peligrosos.',
   'regulatoria', FALSE),
  ('CLA-ENTREGA', 'Entrega, transporte y cadena de frío',
   'Los reactivos que requieren cadena de frío se despachan con empaque validado y registrador de temperatura. El CLIENTE deberá verificar las condiciones de llegada y reportar cualquier desviación dentro de las 24 horas siguientes. El plazo de entrega indicado inicia con la confirmación de la orden de compra y no incluye trámites de importación.',
   'comercial', TRUE);

-- ---------------------------------------------------------------------------
-- Consecutivo de cotizaciones
-- ---------------------------------------------------------------------------
INSERT INTO consecutivos (tipo, prefijo, anio, ultimo_numero) VALUES ('cotizacion', 'COT', 2026, 1);

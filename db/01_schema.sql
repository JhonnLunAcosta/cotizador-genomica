-- ============================================================================
--  COTIZADOR DE EQUIPOS Y REACTIVOS DE SECUENCIACIÓN GENÓMICA
--  Esquema base · MySQL 8.0+ · charset utf8mb4
--
--  Ejecutar sobre una base vacía (cotizador_genomica).
--  Para reiniciar desde cero:
--     DROP DATABASE cotizador_genomica;
--     CREATE DATABASE cotizador_genomica CHARACTER SET utf8mb4;
-- ============================================================================

SET NAMES utf8mb4;

-- ============================================================================
-- 1. CATÁLOGOS BÁSICOS
-- ============================================================================

CREATE TABLE monedas (
  codigo CHAR(3) NOT NULL,
  nombre VARCHAR(60) NOT NULL,
  simbolo VARCHAR(6) NOT NULL,
  decimales TINYINT UNSIGNED NOT NULL DEFAULT 2,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  PRIMARY KEY (codigo),
  CONSTRAINT chk_moneda_decimales CHECK (decimales BETWEEN 0 AND 4)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE tasas_cambio (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  moneda_origen CHAR(3) NOT NULL,
  moneda_destino CHAR(3) NOT NULL DEFAULT 'COP',
  tasa DECIMAL(18,6) NOT NULL,
  fecha DATE NOT NULL,
  fuente VARCHAR(120) NULL,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_tasa (moneda_origen, moneda_destino, fecha),
  KEY idx_tasas_fecha (fecha),
  CONSTRAINT fk_tasa_origen FOREIGN KEY (moneda_origen) REFERENCES monedas (codigo),
  CONSTRAINT fk_tasa_destino FOREIGN KEY (moneda_destino) REFERENCES monedas (codigo),
  CONSTRAINT chk_tasa_positiva CHECK (tasa > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ============================================================================
-- 2. EMPRESA OFERENTE Y USUARIOS
-- ============================================================================

CREATE TABLE empresas (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  nit VARCHAR(20) NOT NULL,
  digito_verificacion CHAR(1) NULL,
  razon_social VARCHAR(200) NOT NULL,
  nombre_comercial VARCHAR(200) NULL,
  tipo_persona ENUM('natural','juridica') NOT NULL DEFAULT 'juridica',
  regimen_tributario ENUM('responsable_iva','no_responsable_iva','simple','gran_contribuyente') NOT NULL DEFAULT 'responsable_iva',
  responsabilidad_tributaria VARCHAR(120) NULL COMMENT 'Códigos DIAN separados por punto y coma',
  actividad_economica VARCHAR(10) NULL COMMENT 'Código CIIU',
  direccion VARCHAR(200) NOT NULL,
  ciudad VARCHAR(100) NOT NULL,
  departamento VARCHAR(100) NOT NULL,
  pais VARCHAR(80) NOT NULL DEFAULT 'Colombia',
  telefono VARCHAR(40) NULL,
  email VARCHAR(160) NOT NULL,
  sitio_web VARCHAR(160) NULL,
  representante_legal VARCHAR(160) NULL,
  documento_representante VARCHAR(30) NULL,
  resolucion_facturacion VARCHAR(60) NULL,
  prefijo_factura VARCHAR(10) NULL,
  logo_url VARCHAR(300) NULL,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_empresa_nit (nit)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE usuarios (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(150) NOT NULL,
  email VARCHAR(160) NOT NULL,
  rol ENUM('admin','vendedor','regulatorio','contabilidad') NOT NULL DEFAULT 'vendedor',
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_usuario_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ============================================================================
-- 3. CLIENTES Y PROVEEDORES
-- ============================================================================

CREATE TABLE clientes (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  tipo_documento ENUM('NIT','CC','CE','PP','NUIP','TI') NOT NULL DEFAULT 'NIT',
  numero_documento VARCHAR(30) NOT NULL,
  digito_verificacion CHAR(1) NULL,
  razon_social VARCHAR(200) NOT NULL,
  nombre_comercial VARCHAR(200) NULL,
  tipo_persona ENUM('natural','juridica') NOT NULL DEFAULT 'juridica',
  tipo_cliente ENUM('laboratorio','hospital','clinica','universidad','centro_investigacion','distribuidor','otro') NOT NULL DEFAULT 'otro',
  regimen_tributario ENUM('responsable_iva','no_responsable_iva','simple','gran_contribuyente','no_aplica') NOT NULL DEFAULT 'no_aplica',
  responsabilidad_tributaria VARCHAR(120) NULL,
  actividad_economica VARCHAR(10) NULL,
  codigo_habilitacion VARCHAR(30) NULL COMMENT 'Código de habilitación REPS (Resolución 3100 de 2019)',
  direccion VARCHAR(200) NOT NULL,
  ciudad VARCHAR(100) NOT NULL,
  departamento VARCHAR(100) NOT NULL,
  pais VARCHAR(80) NOT NULL DEFAULT 'Colombia',
  telefono VARCHAR(40) NULL,
  email VARCHAR(160) NULL,
  autoriza_datos BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Autorización Ley 1581 de 2012',
  fecha_autorizacion_datos DATE NULL,
  notas TEXT NULL,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_cliente_documento (tipo_documento, numero_documento),
  KEY idx_clientes_razon_social (razon_social)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE cliente_contactos (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  cliente_id BIGINT UNSIGNED NOT NULL,
  nombre VARCHAR(150) NOT NULL,
  cargo VARCHAR(100) NULL,
  email VARCHAR(160) NULL,
  telefono VARCHAR(40) NULL,
  celular VARCHAR(40) NULL,
  principal BOOLEAN NOT NULL DEFAULT FALSE,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_contactos_cliente (cliente_id),
  CONSTRAINT fk_contacto_cliente FOREIGN KEY (cliente_id) REFERENCES clientes (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE proveedores (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  nit VARCHAR(30) NULL,
  razon_social VARCHAR(200) NOT NULL,
  tipo ENUM('fabricante','distribuidor','importador','representante') NOT NULL DEFAULT 'fabricante',
  pais VARCHAR(80) NULL,
  contacto VARCHAR(150) NULL,
  email VARCHAR(160) NULL,
  telefono VARCHAR(40) NULL,
  sitio_web VARCHAR(160) NULL,
  notas VARCHAR(300) NULL,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_proveedores_nombre (razon_social)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ============================================================================
-- 4. CATÁLOGO DE PRODUCTOS
-- ============================================================================

CREATE TABLE categorias_producto (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(120) NOT NULL,
  tipo ENUM('equipo','reactivo','consumible','servicio','software') NOT NULL,
  descripcion VARCHAR(300) NULL,
  padre_id BIGINT UNSIGNED NULL,
  orden SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  PRIMARY KEY (id),
  UNIQUE KEY uq_categoria_nombre (nombre),
  KEY idx_categoria_padre (padre_id),
  CONSTRAINT fk_categoria_padre FOREIGN KEY (padre_id) REFERENCES categorias_producto (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE productos (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  sku VARCHAR(40) NOT NULL,
  nombre VARCHAR(200) NOT NULL,
  descripcion TEXT NULL,
  categoria_id BIGINT UNSIGNED NULL,
  tipo ENUM('equipo','reactivo','consumible','servicio','software') NOT NULL,
  marca VARCHAR(100) NULL,
  modelo VARCHAR(100) NULL,
  referencia_fabricante VARCHAR(100) NULL,
  fabricante VARCHAR(150) NULL,
  pais_origen VARCHAR(80) NULL,
  proveedor_id BIGINT UNSIGNED NULL,
  unidad_medida ENUM('unidad','kit','caja','paquete','reaccion','servicio','licencia','hora','mes') NOT NULL DEFAULT 'unidad',
  presentacion VARCHAR(150) NULL,
  contenido_por_empaque INT UNSIGNED NULL,
  reacciones_por_kit INT UNSIGNED NULL,
  requiere_cadena_frio BOOLEAN NOT NULL DEFAULT FALSE,
  temperatura_almacenamiento VARCHAR(60) NULL,
  vida_util_meses SMALLINT UNSIGNED NULL,
  clase_dispositivo ENUM('I','IIA','IIB','III','no_aplica') NOT NULL DEFAULT 'no_aplica',
  es_ivd BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Reactivo de diagnóstico in vitro',
  requiere_registro_sanitario BOOLEAN NOT NULL DEFAULT FALSE,
  requiere_licencia_importacion BOOLEAN NOT NULL DEFAULT FALSE,
  arancel_pct DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  iva_tipo ENUM('gravado','excluido','exento') NOT NULL DEFAULT 'gravado',
  iva_pct DECIMAL(5,2) NOT NULL DEFAULT 19.00,
  concepto_tributario ENUM('bien','servicio','servicio_tecnico','honorarios','software') NOT NULL DEFAULT 'bien',
  aplica_retefuente BOOLEAN NOT NULL DEFAULT FALSE,
  ficha_tecnica_url VARCHAR(300) NULL,
  hoja_seguridad_url VARCHAR(300) NULL,
  imagen_url VARCHAR(300) NULL,
  notas_regulatorias TEXT NULL,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_producto_sku (sku),
  KEY idx_productos_tipo (tipo),
  KEY idx_productos_categoria (categoria_id),
  CONSTRAINT fk_producto_categoria FOREIGN KEY (categoria_id) REFERENCES categorias_producto (id) ON DELETE SET NULL,
  CONSTRAINT fk_producto_proveedor FOREIGN KEY (proveedor_id) REFERENCES proveedores (id) ON DELETE SET NULL,
  CONSTRAINT chk_producto_iva CHECK (iva_pct BETWEEN 0 AND 100),
  CONSTRAINT chk_producto_arancel CHECK (arancel_pct BETWEEN 0 AND 100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE producto_registros_sanitarios (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  producto_id BIGINT UNSIGNED NOT NULL,
  tipo_registro ENUM('registro_sanitario','permiso_comercializacion','certificado_libre_venta','bpm','certificado_calibracion','otro') NOT NULL,
  numero_registro VARCHAR(80) NULL,
  autoridad VARCHAR(80) NOT NULL DEFAULT 'INVIMA',
  fecha_expedicion DATE NULL,
  fecha_vencimiento DATE NULL,
  estado ENUM('vigente','vencido','en_tramite','no_requiere') NOT NULL DEFAULT 'vigente',
  archivo_url VARCHAR(300) NULL,
  observaciones VARCHAR(300) NULL,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_registro (producto_id, tipo_registro, numero_registro),
  KEY idx_registros_vencimiento (fecha_vencimiento),
  CONSTRAINT fk_registro_producto FOREIGN KEY (producto_id) REFERENCES productos (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE producto_precios (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  producto_id BIGINT UNSIGNED NOT NULL,
  lista ENUM('publico','institucional','distribuidor') NOT NULL DEFAULT 'publico',
  moneda CHAR(3) NOT NULL DEFAULT 'COP',
  costo DECIMAL(18,2) NULL,
  precio DECIMAL(18,2) NOT NULL,
  vigente_desde DATE NOT NULL,
  vigente_hasta DATE NULL,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_precio (producto_id, lista, moneda, vigente_desde),
  KEY idx_precios_producto (producto_id),
  CONSTRAINT fk_precio_producto FOREIGN KEY (producto_id) REFERENCES productos (id) ON DELETE CASCADE,
  CONSTRAINT fk_precio_moneda FOREIGN KEY (moneda) REFERENCES monedas (codigo),
  CONSTRAINT chk_precio_positivo CHECK (precio >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ============================================================================
-- 5. MARCO NORMATIVO Y PLANTILLAS
-- ============================================================================

CREATE TABLE normas (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  codigo VARCHAR(40) NOT NULL,
  titulo VARCHAR(250) NOT NULL,
  entidad VARCHAR(100) NULL,
  tipo ENUM('ley','decreto','resolucion','circular','estandar','guia') NOT NULL,
  anio SMALLINT UNSIGNED NULL,
  ambito ENUM('dispositivos_medicos','ivd','datos_personales','laboratorio','tributario','consumidor','residuos','importacion','bioseguridad','genetica','calidad') NOT NULL,
  descripcion TEXT NULL,
  url VARCHAR(300) NULL,
  obligatoria BOOLEAN NOT NULL DEFAULT TRUE,
  nota_vigencia VARCHAR(300) NULL,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  PRIMARY KEY (id),
  UNIQUE KEY uq_norma_codigo (codigo),
  KEY idx_normas_ambito (ambito)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE requisitos_plantilla (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  codigo VARCHAR(20) NOT NULL,
  titulo VARCHAR(200) NOT NULL,
  descripcion TEXT NULL,
  categoria ENUM('registro_sanitario','documentos_legales','calidad','datos_personales','bioseguridad','comercial','importacion') NOT NULL,
  obligatorio BOOLEAN NOT NULL DEFAULT TRUE,
  norma_id BIGINT UNSIGNED NULL,
  aplica_a ENUM('todos','equipos','reactivos','servicios') NOT NULL DEFAULT 'todos',
  orden SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  PRIMARY KEY (id),
  UNIQUE KEY uq_requisito_codigo (codigo),
  KEY idx_requisito_norma (norma_id),
  CONSTRAINT fk_requisito_norma FOREIGN KEY (norma_id) REFERENCES normas (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE clausulas (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  codigo VARCHAR(20) NOT NULL,
  titulo VARCHAR(200) NOT NULL,
  cuerpo TEXT NOT NULL,
  categoria ENUM('garantia','datos_personales','confidencialidad','comercial','regulatoria') NOT NULL,
  obligatoria BOOLEAN NOT NULL DEFAULT FALSE,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  PRIMARY KEY (id),
  UNIQUE KEY uq_clausula_codigo (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ============================================================================
-- 6. COTIZACIONES
-- ============================================================================

CREATE TABLE cotizaciones (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  numero VARCHAR(30) NOT NULL,
  version SMALLINT UNSIGNED NOT NULL DEFAULT 1,
  empresa_id BIGINT UNSIGNED NOT NULL,
  cliente_id BIGINT UNSIGNED NOT NULL,
  fecha_emision DATE NOT NULL,
  validez_dias SMALLINT UNSIGNED NOT NULL DEFAULT 15,
  moneda CHAR(3) NOT NULL DEFAULT 'COP',
  trm DECIMAL(18,4) NULL,
  trm_fecha DATE NULL,
  estado ENUM('borrador','en_revision','enviada','negociacion','aceptada','rechazada','vencida','anulada') NOT NULL DEFAULT 'borrador',
  forma_pago VARCHAR(250) NULL,
  plazo_entrega VARCHAR(150) NULL,
  lugar_entrega VARCHAR(250) NULL,
  incoterm ENUM('EXW','FOB','CIF','DAP','DDP','no_aplica') NOT NULL DEFAULT 'no_aplica',
  garantia_meses SMALLINT UNSIGNED NULL,
  garantia_detalle TEXT NULL,
  incluye_instalacion BOOLEAN NOT NULL DEFAULT TRUE,
  incluye_capacitacion BOOLEAN NOT NULL DEFAULT TRUE,
  incluye_validacion BOOLEAN NOT NULL DEFAULT FALSE,
  aplica_retefuente BOOLEAN NOT NULL DEFAULT FALSE,
  retefuente_pct DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  reteiva_pct DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  reteica_pct DECIMAL(6,3) NOT NULL DEFAULT 0.000,
  declaracion_cumplimiento TEXT NULL,
  observaciones TEXT NULL,
  condiciones_comerciales TEXT NULL,
  motivo_anulacion VARCHAR(300) NULL,
  datos_empresa_snapshot JSON NULL COMMENT 'Datos del oferente congelados al enviar',
  datos_cliente_snapshot JSON NULL COMMENT 'Datos del cliente congelados al enviar',
  creado_por BIGINT UNSIGNED NULL,
  aprobado_por BIGINT UNSIGNED NULL,
  fecha_envio DATETIME NULL,
  fecha_respuesta DATETIME NULL,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_cotizacion_numero (numero),
  KEY idx_cotizaciones_cliente (cliente_id, fecha_emision),
  KEY idx_cotizaciones_estado (estado),
  KEY idx_cotizaciones_fecha (fecha_emision),
  CONSTRAINT fk_cotizacion_empresa FOREIGN KEY (empresa_id) REFERENCES empresas (id),
  CONSTRAINT fk_cotizacion_cliente FOREIGN KEY (cliente_id) REFERENCES clientes (id),
  CONSTRAINT fk_cotizacion_moneda FOREIGN KEY (moneda) REFERENCES monedas (codigo),
  CONSTRAINT fk_cotizacion_creador FOREIGN KEY (creado_por) REFERENCES usuarios (id) ON DELETE SET NULL,
  CONSTRAINT fk_cotizacion_aprobador FOREIGN KEY (aprobado_por) REFERENCES usuarios (id) ON DELETE SET NULL,
  CONSTRAINT chk_cotizacion_validez CHECK (validez_dias BETWEEN 1 AND 365),
  CONSTRAINT chk_cotizacion_retenciones CHECK (retefuente_pct BETWEEN 0 AND 100 AND reteiva_pct BETWEEN 0 AND 100 AND reteica_pct BETWEEN 0 AND 100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE cotizacion_items (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  cotizacion_id BIGINT UNSIGNED NOT NULL,
  orden SMALLINT UNSIGNED NOT NULL DEFAULT 1,
  producto_id BIGINT UNSIGNED NULL,
  tipo ENUM('equipo','reactivo','consumible','servicio','software') NOT NULL,
  sku VARCHAR(40) NULL,
  descripcion VARCHAR(300) NOT NULL,
  marca VARCHAR(100) NULL,
  modelo VARCHAR(100) NULL,
  unidad_medida VARCHAR(30) NOT NULL DEFAULT 'unidad',
  cantidad DECIMAL(12,3) NOT NULL DEFAULT 1.000,
  precio_unitario DECIMAL(18,2) NOT NULL,
  descuento_pct DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  iva_pct DECIMAL(5,2) NOT NULL DEFAULT 19.00,
  aplica_retefuente BOOLEAN NOT NULL DEFAULT FALSE,
  registro_sanitario VARCHAR(80) NULL COMMENT 'Snapshot del registro al cotizar',
  registro_vence DATE NULL,
  lote VARCHAR(60) NULL,
  tiempo_entrega VARCHAR(80) NULL,
  observaciones VARCHAR(300) NULL,
  datos_regulatorios JSON NULL,
  subtotal DECIMAL(18,2) GENERATED ALWAYS AS (ROUND(cantidad * precio_unitario * (1 - descuento_pct / 100), 2)) STORED,
  iva_valor DECIMAL(18,2) GENERATED ALWAYS AS (ROUND(ROUND(cantidad * precio_unitario * (1 - descuento_pct / 100), 2) * iva_pct / 100, 2)) STORED,
  total DECIMAL(18,2) GENERATED ALWAYS AS (ROUND(cantidad * precio_unitario * (1 - descuento_pct / 100), 2) + ROUND(ROUND(cantidad * precio_unitario * (1 - descuento_pct / 100), 2) * iva_pct / 100, 2)) STORED,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_items_cotizacion (cotizacion_id, orden),
  KEY idx_items_producto (producto_id),
  CONSTRAINT fk_item_cotizacion FOREIGN KEY (cotizacion_id) REFERENCES cotizaciones (id) ON DELETE CASCADE,
  CONSTRAINT fk_item_producto FOREIGN KEY (producto_id) REFERENCES productos (id) ON DELETE SET NULL,
  CONSTRAINT chk_item_cantidad CHECK (cantidad > 0),
  CONSTRAINT chk_item_descuento CHECK (descuento_pct BETWEEN 0 AND 100),
  CONSTRAINT chk_item_iva CHECK (iva_pct BETWEEN 0 AND 100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE cotizacion_requisitos (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  cotizacion_id BIGINT UNSIGNED NOT NULL,
  requisito_codigo VARCHAR(20) NOT NULL,
  titulo VARCHAR(200) NOT NULL,
  categoria ENUM('registro_sanitario','documentos_legales','calidad','datos_personales','bioseguridad','comercial','importacion') NOT NULL,
  norma_id BIGINT UNSIGNED NULL,
  obligatorio BOOLEAN NOT NULL DEFAULT TRUE,
  estado ENUM('pendiente','cumplido','no_aplica') NOT NULL DEFAULT 'pendiente',
  evidencia_url VARCHAR(300) NULL,
  observaciones VARCHAR(300) NULL,
  orden SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_cotizacion_requisito (cotizacion_id, requisito_codigo),
  KEY idx_requisitos_estado (cotizacion_id, estado),
  CONSTRAINT fk_requisito_cotizacion FOREIGN KEY (cotizacion_id) REFERENCES cotizaciones (id) ON DELETE CASCADE,
  CONSTRAINT fk_requisito_norma_cot FOREIGN KEY (norma_id) REFERENCES normas (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE cotizacion_documentos (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  cotizacion_id BIGINT UNSIGNED NOT NULL,
  tipo ENUM('ficha_tecnica','registro_sanitario','certificado_bpm','libre_venta','carta_fabricante','certificado_calibracion','manual','cotizacion_pdf','otro') NOT NULL,
  nombre VARCHAR(200) NOT NULL,
  url VARCHAR(300) NOT NULL,
  subido_por BIGINT UNSIGNED NULL,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_documentos_cotizacion (cotizacion_id),
  CONSTRAINT fk_documento_cotizacion FOREIGN KEY (cotizacion_id) REFERENCES cotizaciones (id) ON DELETE CASCADE,
  CONSTRAINT fk_documento_usuario FOREIGN KEY (subido_por) REFERENCES usuarios (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE cotizacion_normas (
  cotizacion_id BIGINT UNSIGNED NOT NULL,
  norma_id BIGINT UNSIGNED NOT NULL,
  nota VARCHAR(200) NULL,
  PRIMARY KEY (cotizacion_id, norma_id),
  CONSTRAINT fk_cnorma_cotizacion FOREIGN KEY (cotizacion_id) REFERENCES cotizaciones (id) ON DELETE CASCADE,
  CONSTRAINT fk_cnorma_norma FOREIGN KEY (norma_id) REFERENCES normas (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE cotizacion_clausulas (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  cotizacion_id BIGINT UNSIGNED NOT NULL,
  clausula_id BIGINT UNSIGNED NULL,
  codigo VARCHAR(20) NOT NULL,
  titulo VARCHAR(200) NOT NULL,
  cuerpo TEXT NOT NULL,
  orden SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE KEY uq_cotizacion_clausula (cotizacion_id, codigo),
  CONSTRAINT fk_cclausula_cotizacion FOREIGN KEY (cotizacion_id) REFERENCES cotizaciones (id) ON DELETE CASCADE,
  CONSTRAINT fk_cclausula_clausula FOREIGN KEY (clausula_id) REFERENCES clausulas (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE cotizacion_historial (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  cotizacion_id BIGINT UNSIGNED NOT NULL,
  estado_anterior ENUM('borrador','en_revision','enviada','negociacion','aceptada','rechazada','vencida','anulada') NULL,
  estado_nuevo ENUM('borrador','en_revision','enviada','negociacion','aceptada','rechazada','vencida','anulada') NOT NULL,
  usuario_id BIGINT UNSIGNED NULL,
  nota VARCHAR(300) NULL,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_historial_cotizacion (cotizacion_id, creado_en),
  CONSTRAINT fk_historial_cotizacion FOREIGN KEY (cotizacion_id) REFERENCES cotizaciones (id) ON DELETE CASCADE,
  CONSTRAINT fk_historial_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE consecutivos (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  tipo ENUM('cotizacion','factura') NOT NULL DEFAULT 'cotizacion',
  prefijo VARCHAR(10) NOT NULL DEFAULT 'COT',
  anio SMALLINT UNSIGNED NOT NULL,
  ultimo_numero INT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE KEY uq_consecutivo (tipo, anio)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE auditoria (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  tabla VARCHAR(60) NOT NULL,
  registro_id BIGINT UNSIGNED NULL,
  accion ENUM('crear','actualizar','eliminar','cambiar_estado') NOT NULL,
  usuario_id BIGINT UNSIGNED NULL,
  detalle JSON NULL,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_auditoria_registro (tabla, registro_id),
  KEY idx_auditoria_fecha (creado_en),
  CONSTRAINT fk_auditoria_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


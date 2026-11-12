export const ESTADOS = [
  { value: 'borrador', label: 'Borrador', tone: 'neutral' },
  { value: 'en_revision', label: 'En revisión', tone: 'warn' },
  { value: 'enviada', label: 'Enviada', tone: 'info' },
  { value: 'negociacion', label: 'En negociación', tone: 'accent' },
  { value: 'aceptada', label: 'Aceptada', tone: 'ok' },
  { value: 'rechazada', label: 'Rechazada', tone: 'danger' },
  { value: 'vencida', label: 'Vencida', tone: 'danger' },
  { value: 'anulada', label: 'Anulada', tone: 'neutral' },
]

const ESTADO_MAP = Object.fromEntries(ESTADOS.map((estado) => [estado.value, estado]))

export function estadoMeta(estado) {
  return (
    ESTADO_MAP[estado] || {
      value: estado,
      label: estado ? String(estado).replaceAll('_', ' ') : 'Sin estado',
      tone: 'neutral',
    }
  )
}

export const TIPOS_PRODUCTO = [
  { value: 'equipo', label: 'Equipo' },
  { value: 'reactivo', label: 'Reactivo' },
  { value: 'consumible', label: 'Consumible' },
  { value: 'servicio', label: 'Servicio' },
  { value: 'software', label: 'Software' },
]

const TIPO_MAP = Object.fromEntries(TIPOS_PRODUCTO.map((tipo) => [tipo.value, tipo]))

export function tipoMeta(tipo) {
  return TIPO_MAP[tipo] || { value: tipo, label: tipo ? String(tipo) : 'Sin tipo' }
}

export const REGISTROS = {
  vigente: { label: 'Vigente', tone: 'ok' },
  por_vencer: { label: 'Por vencer', tone: 'warn' },
  vencido: { label: 'Vencido', tone: 'danger' },
  sin_registro: { label: 'Sin registro', tone: 'neutral' },
  no_requiere: { label: 'No requiere', tone: 'info' },
}

export function registroMeta(estado) {
  return REGISTROS[estado] || { label: 'Sin registro', tone: 'neutral' }
}

export const ESTADOS_REQUISITO = [
  { value: 'cumplido', label: 'Cumplido', tone: 'ok' },
  { value: 'no_aplica', label: 'No aplica', tone: 'neutral' },
  { value: 'pendiente', label: 'Pendiente', tone: 'warn' },
]

const REQUISITO_MAP = Object.fromEntries(
  ESTADOS_REQUISITO.map((estado) => [estado.value, estado]),
)

export function requisitoMeta(estado) {
  return (
    REQUISITO_MAP[estado] || { value: estado, label: 'Pendiente', tone: 'warn' }
  )
}

export const CATEGORIAS_REQUISITO = {
  registro_sanitario: 'Registro sanitario',
  importacion: 'Importación',
  calidad: 'Calidad',
  bioseguridad: 'Bioseguridad',
  datos_personales: 'Datos personales',
  comercial: 'Comercial',
  documentos_legales: 'Documentos legales',
}

export function categoriaRequisito(categoria) {
  return (
    CATEGORIAS_REQUISITO[categoria] ||
    (categoria ? String(categoria).replaceAll('_', ' ') : 'General')
  )
}

export const TIPOS_DOCUMENTO = [
  { value: 'NIT', label: 'NIT' },
  { value: 'CC', label: 'Cédula de ciudadanía' },
  { value: 'CE', label: 'Cédula de extranjería' },
  { value: 'PA', label: 'Pasaporte' },
  { value: 'TI', label: 'Tarjeta de identidad' },
]

export const TIPOS_CLIENTE = [
  { value: 'laboratorio', label: 'Laboratorio' },
  { value: 'clinica', label: 'Clínica' },
  { value: 'hospital', label: 'Hospital' },
  { value: 'universidad', label: 'Universidad' },
  { value: 'investigacion', label: 'Investigación' },
  { value: 'distribuidor', label: 'Distribuidor' },
  { value: 'otro', label: 'Otro' },
]

export const REGIMENES = [
  { value: 'responsable_iva', label: 'Responsable de IVA' },
  { value: 'no_responsable_iva', label: 'No responsable de IVA' },
  { value: 'gran_contribuyente', label: 'Gran contribuyente' },
  { value: 'simple', label: 'Régimen simple de tributación' },
]

export function etiquetaTipoCliente(value) {
  return TIPOS_CLIENTE.find((tipo) => tipo.value === value)?.label || value || '—'
}

export function etiquetaRegimen(value) {
  return REGIMENES.find((regimen) => regimen.value === value)?.label || value || '—'
}

export const MONEDAS = {
  COP: 'Peso colombiano',
  USD: 'Dólar estadounidense',
  EUR: 'Euro',
}

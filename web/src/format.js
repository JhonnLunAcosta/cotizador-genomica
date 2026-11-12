const moneyCache = new Map()

function moneyFormatter(moneda, maxDecimals) {
  const key = `${moneda}-${maxDecimals}`
  if (!moneyCache.has(key)) {
    let formatter
    try {
      formatter = new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: moneda || 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: maxDecimals,
      })
    } catch {
      formatter = new Intl.NumberFormat('es-CO', {
        minimumFractionDigits: 0,
        maximumFractionDigits: maxDecimals,
      })
    }
    moneyCache.set(key, formatter)
  }
  return moneyCache.get(key)
}

export function formatMoney(value, moneda = 'COP', options = {}) {
  if (value === null || value === undefined || value === '') return '—'
  const number = Number(value)
  if (!Number.isFinite(number)) return '—'
  const maxDecimals = options.decimals ?? 0
  return moneyFormatter(moneda || 'COP', maxDecimals).format(number)
}

export function formatNumber(value, maxDecimals = 3) {
  if (value === null || value === undefined || value === '') return '—'
  const number = Number(value)
  if (!Number.isFinite(number)) return '—'
  return new Intl.NumberFormat('es-CO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxDecimals,
  }).format(number)
}

export function formatQty(value) {
  return formatNumber(value, 3)
}

export function formatPercent(value, maxDecimals = 3) {
  if (value === null || value === undefined || value === '') return '—'
  const number = Number(value)
  if (!Number.isFinite(number)) return '—'
  return `${formatNumber(number, maxDecimals)} %`
}

export function parseDate(value) {
  if (!value) return null
  if (value instanceof Date) return value
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (match) return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export function formatDate(value) {
  const date = parseDate(value)
  if (!date) return '—'
  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

export function diasHasta(value) {
  const date = parseDate(value)
  if (!date) return null
  const hoy = new Date()
  const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())
  const inicioFecha = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  return Math.round((inicioFecha - inicioHoy) / 86400000)
}

export function diasTexto(dias) {
  if (dias === null || dias === undefined) return '—'
  if (dias < 0) return `Vencida (${Math.abs(dias)} d.)`
  if (dias === 0) return 'Vence hoy'
  return `${dias} ${dias === 1 ? 'día' : 'días'}`
}

export function diasTone(dias) {
  if (dias === null || dias === undefined) return 'neutral'
  if (dias <= 0) return 'danger'
  if (dias <= 7) return 'warn'
  return 'ok'
}

/** Normaliza texto para búsquedas sin distinguir mayúsculas ni tildes. */
export function normalizar(value) {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

export function numero(value) {
  const parsed = Number(String(value ?? '').replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : 0
}

export function redondear(value, decimales = 2) {
  const factor = 10 ** decimales
  return Math.round((Number(value) + Number.EPSILON) * factor) / factor
}

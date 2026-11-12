const BASE = (import.meta.env.VITE_API_BASE || '/api').replace(/\/$/, '')

export class ApiError extends Error {
  constructor(status, problem, retryAfter = null) {
    super(problem?.detail || problem?.title || 'No fue posible completar la solicitud')
    this.name = 'ApiError'
    this.status = status
    this.title = problem?.title || 'Error de la API'
    this.retryAfter = retryAfter
    this.detail =
      problem?.detail ||
      (status === 0
        ? 'No se pudo contactar el servidor. Verifica que el backend esté en ejecución en http://localhost:8080.'
        : status === 429
          ? 'Has hecho demasiadas solicitudes seguidas. Espera unos segundos e inténtalo de nuevo.'
          : 'No fue posible completar la solicitud.')
    this.errores = problem?.errores && typeof problem.errores === 'object' ? problem.errores : null
  }
}

function mensajeRed() {
  return {
    title: 'Sin conexión con el servidor',
    detail:
      'No se pudo contactar la API del cotizador. Verifica que el backend esté en ejecución en http://localhost:8080.',
  }
}

export function leerCookie(nombre) {
  const par = document.cookie.split('; ').find((item) => item.startsWith(`${nombre}=`))
  return par ? decodeURIComponent(par.slice(nombre.length + 1)) : null
}

const METODOS_SEGUROS = new Set(['GET', 'HEAD', 'OPTIONS'])

async function asegurarCsrf() {
  if (leerCookie('XSRF-TOKEN')) return
  await fetch(`${BASE}/auth/csrf`, {
    credentials: 'include',
    headers: { Accept: 'application/json' },
  })
}

async function request(path, { method = 'GET', body, signal } = {}) {
  const seguro = !METODOS_SEGUROS.has(method.toUpperCase())
  const headers = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  if (seguro) {
    await asegurarCsrf()
    const token = leerCookie('XSRF-TOKEN')
    if (token) headers['X-XSRF-TOKEN'] = token
  }

  let response
  try {
    response = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
      credentials: 'include',
    })
  } catch (error) {
    if (error?.name === 'AbortError') throw error
    throw new ApiError(0, mensajeRed())
  }

  if (!response.ok) {
    let problem = null
    try {
      problem = await response.json()
    } catch {
      problem = null
    }
    if (response.status === 401 && !path.startsWith('/auth/')) {
      window.dispatchEvent(new CustomEvent('cotizador:sesion-expirada'))
    }
    throw new ApiError(response.status, problem, response.headers.get('retry-after'))
  }

  if (response.status === 204) return null

  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) return response.text()
  return response.json()
}

function query(params) {
  const search = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') search.set(key, value)
  })
  const serialized = search.toString()
  return serialized ? `?${serialized}` : ''
}

/**
 * Envía la conversación y consume la respuesta en streaming (SSE).
 * Cada fragmento de texto se entrega a `onTexto`; `onFin` se llama al terminar.
 */
async function chat(mensajes, { signal, onTexto, onPdf, onEstado, onError } = {}) {
  await asegurarCsrf()
  const token = leerCookie('XSRF-TOKEN')
  const headers = {
    Accept: 'text/event-stream',
    'Content-Type': 'application/json',
  }
  if (token) headers['X-XSRF-TOKEN'] = token

  let response
  try {
    response = await fetch(`${BASE}/asistente/chat`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ mensajes }),
      signal,
      credentials: 'include',
    })
  } catch (error) {
    if (error?.name === 'AbortError') throw error
    throw new ApiError(0, mensajeRed())
  }

  if (!response.ok) {
    let problem = null
    try {
      problem = await response.json()
    } catch {
      problem = null
    }
    if (response.status === 401) {
      window.dispatchEvent(new CustomEvent('cotizador:sesion-expirada'))
    }
    throw new ApiError(response.status, problem)
  }

  const lector = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  const procesar = (linea) => {
    if (!linea.startsWith('data:')) return
    const datos = linea.slice(5).trim()
    if (!datos || datos === '[DONE]') return
    let evento
    try {
      evento = JSON.parse(datos)
    } catch {
      return
    }
    if (evento.error) {
      onError?.(evento.error)
      return
    }
    if (evento.pdf) {
      onPdf?.(evento.pdf)
      return
    }
    if (typeof evento.estado === 'string') {
      onEstado?.(evento.estado)
      return
    }
    if (typeof evento.t === 'string') onTexto?.(evento.t)
  }

  while (true) {
    const { value, done } = await lector.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const partes = buffer.split(/\r?\n/)
    buffer = partes.pop() ?? ''
    partes.forEach(procesar)
  }
  if (buffer) procesar(buffer)
  // Libera el socket del stream en cuanto termina la respuesta.
  try {
    await lector.cancel()
  } catch {
    // el cuerpo ya estaba cerrado
  }
}

export const api = {
  auth: {
    csrf: () => asegurarCsrf(),
    sesion: (options = {}) => request('/auth/me', options),
    login: (email, password) => request('/auth/login', { method: 'POST', body: { email, password } }),
    logout: () => request('/auth/logout', { method: 'POST' }),
    cambiarPassword: (actual, nueva) =>
      request('/auth/password', { method: 'POST', body: { actual, nueva } }),
  },

  asistente: {
    estado: (options = {}) => request('/asistente/estado', options),
    chat,
  },

  dashboard: (options = {}) => request('/dashboard', options),

  cotizaciones: (estado, options = {}) =>
    request(`/cotizaciones${query({ estado })}`, options),

  cotizacion: (numero, options = {}) =>
    request(`/cotizaciones/${encodeURIComponent(numero)}`, options),

  crearCotizacion: (payload) =>
    request('/cotizaciones', { method: 'POST', body: payload }),

  cambiarEstado: (numero, payload) =>
    request(`/cotizaciones/${encodeURIComponent(numero)}/estado`, {
      method: 'PATCH',
      body: payload,
    }),

  actualizarRequisito: (numero, codigo, payload) =>
    request(
      `/cotizaciones/${encodeURIComponent(numero)}/requisitos/${encodeURIComponent(codigo)}`,
      { method: 'PATCH', body: payload },
    ),

  pdfUrl: (numero) => `${BASE}/cotizaciones/${encodeURIComponent(numero)}/pdf`,

  clientes: (q, options = {}) => request(`/clientes${query({ q })}`, options),

  cliente: (id, options = {}) => request(`/clientes/${encodeURIComponent(id)}`, options),

  crearCliente: (payload) => request('/clientes', { method: 'POST', body: payload }),

  productos: ({ tipo, q, moneda = 'COP' } = {}, options = {}) =>
    request(`/productos${query({ tipo, q, moneda })}`, options),

  normas: (options = {}) => request('/normas', options),

  clausulas: (options = {}) => request('/clausulas', options),
}

import { useEffect, useRef, useState } from 'react'
import Icon from './Icon.jsx'
import { api } from '../api.js'

const SUGERENCIAS = [
  'Descarga el PDF de la cotización COT-2026-0001',
  'Crea una cotización de 2 kits REA-001 para el Laboratorio San Rafael',
  '¿Qué requisitos INVIMA aplican a reactivos?',
]

let contador = 0

function nuevoMensaje(rol, contenido) {
  contador += 1
  return { id: contador, rol, contenido, estado: '', tarjetas: [] }
}

function enLinea(texto) {
  const partes = texto.split(/\*\*(.+?)\*\*/g)
  return partes.map((parte, indice) =>
    indice % 2 === 1 ? <strong key={indice}>{parte}</strong> : <span key={indice}>{parte}</span>,
  )
}

function TextoAsistente({ valor }) {
  const lineas = valor.split(/\r?\n/)
  const bloques = []
  let lista = null

  const cerrarLista = () => {
    if (!lista) return
    const etiqueta = lista.tipo === 'ol' ? 'ol' : 'ul'
    bloques.push(
      etiqueta === 'ol' ? (
        <ol key={`l${bloques.length}`} className="chat-lista">
          {lista.items.map((item, i) => (
            <li key={i}>{enLinea(item)}</li>
          ))}
        </ol>
      ) : (
        <ul key={`l${bloques.length}`} className="chat-lista">
          {lista.items.map((item, i) => (
            <li key={i}>{enLinea(item)}</li>
          ))}
        </ul>
      ),
    )
    lista = null
  }

  lineas.forEach((linea) => {
    const vineta = linea.match(/^\s*[-*]\s+(.*)$/)
    const numerada = linea.match(/^\s*\d+[.)]\s+(.*)$/)
    if (vineta || numerada) {
      const tipo = numerada ? 'ol' : 'ul'
      if (!lista || lista.tipo !== tipo) {
        cerrarLista()
        lista = { tipo, items: [] }
      }
      lista.items.push((vineta || numerada)[1])
      return
    }
    cerrarLista()
    if (linea.trim()) bloques.push(<p key={`p${bloques.length}`}>{enLinea(linea.replace(/^#+\s*/, ''))}</p>)
  })
  cerrarLista()
  return bloques
}

export default function ChatAsistente() {
  const [abierto, setAbierto] = useState(false)
  const [mensajes, setMensajes] = useState([])
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState(null)
  const [estado, setEstado] = useState(null)
  const finRef = useRef(null)
  const entradaRef = useRef(null)
  const abortRef = useRef(null)

  useEffect(() => {
    if (!abierto || estado) return
    api.asistente
      .estado()
      .then(setEstado)
      .catch(() => setEstado({ disponible: false }))
  }, [abierto, estado])

  useEffect(() => {
    if (abierto) finRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [mensajes, abierto, enviando])

  useEffect(() => {
    if (abierto) entradaRef.current?.focus()
  }, [abierto])

  useEffect(() => () => abortRef.current?.abort(), [])

  const enviar = async (contenido) => {
    const limpio = (contenido ?? texto).trim()
    if (!limpio || enviando) return

    const usuario = nuevoMensaje('usuario', limpio)
    const asistente = nuevoMensaje('asistente', '')
    const historial = [...mensajes, usuario]

    setMensajes([...historial, asistente])
    setTexto('')
    setError(null)
    setEnviando(true)

    const control = new AbortController()
    abortRef.current = control

    const actualizarAsistente = (fn) => {
      setMensajes((lista) =>
        lista.map((item) => (item.id === asistente.id ? fn(item) : item)),
      )
    }

    try {
      await api.asistente.chat(
        historial.map(({ rol, contenido: cuerpo }) => ({ rol, contenido: cuerpo })),
        {
          signal: control.signal,
          onTexto: (fragmento) =>
            actualizarAsistente((previo) => ({
              ...previo,
              contenido: previo.contenido + fragmento,
              estado: '',
            })),
          onEstado: (estado) => actualizarAsistente((previo) => ({ ...previo, estado })),
          onPdf: (tarjeta) =>
            actualizarAsistente((previo) =>
              previo.tarjetas.some((item) => item.numero === tarjeta.numero)
                ? previo
                : { ...previo, tarjetas: [...previo.tarjetas, tarjeta] },
            ),
          onError: (mensaje) => {
            setError(mensaje)
            actualizarAsistente((previo) => ({ ...previo, contenido: '', estado: '' }))
          },
        },
      )
    } catch (fallo) {
      if (fallo?.name !== 'AbortError') setError(fallo.detail || fallo.message)
    } finally {
      setEnviando(false)
      abortRef.current = null
    }
  }

  return (
    <div className={`chat${abierto ? ' chat-abierto' : ''}`}>
      {abierto ? (
        <section className="chat-panel" aria-label="Asistente comercial">
          <header className="chat-head">
            <div className="chat-identidad">
              <span className="chat-avatar">
                <Icon name="sparkle" size={19} />
              </span>
              <div>
                <strong>Asistente comercial</strong>
                <small>
                  {estado === null
                    ? 'Conectando…'
                    : estado.disponible
                      ? 'IA conectada al catálogo'
                      : 'No configurado'}
                </small>
              </div>
            </div>
            <button
              type="button"
              className="chat-cerrar"
              onClick={() => setAbierto(false)}
              aria-label="Cerrar asistente"
            >
              <Icon name="close" size={18} />
            </button>
          </header>

          <div className="chat-cuerpo">
            {mensajes.length === 0 ? (
              <div className="chat-bienvenida">
                <p>
                  Hola, soy tu asistente. Conozco el catálogo, los precios y el estado de las
                  cotizaciones. ¿En qué te ayudo?
                </p>
                <div className="chat-sugerencias">
                  {SUGERENCIAS.map((sugerencia) => (
                    <button
                      key={sugerencia}
                      type="button"
                      onClick={() => enviar(sugerencia)}
                      disabled={enviando || estado?.disponible === false}
                    >
                      {sugerencia}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {mensajes.map((mensaje) => (
              <div key={mensaje.id} className={`chat-burbuja chat-${mensaje.rol}`}>
                {mensaje.rol === 'asistente' && enviando && mensaje.estado ? (
                  <p className="chat-estado">
                    <span className="chat-pulso" />
                    {mensaje.estado}
                  </p>
                ) : null}

                {mensaje.contenido ? (
                  mensaje.rol === 'asistente' ? (
                    <div className="chat-texto">
                      <TextoAsistente valor={mensaje.contenido} />
                    </div>
                  ) : (
                    <p>{mensaje.contenido}</p>
                  )
                ) : mensaje.rol === 'asistente' && enviando && !mensaje.estado ? (
                  <span className="chat-typing" aria-label="Escribiendo">
                    <i />
                    <i />
                    <i />
                  </span>
                ) : null}

                {(mensaje.tarjetas ?? []).length > 0 ? (
                  <div className="chat-tarjetas">
                    {(mensaje.tarjetas ?? []).map((tarjeta) => (
                      <a
                        key={tarjeta.numero}
                        className="chat-tarjeta"
                        href={api.pdfUrl(tarjeta.numero)}
                        download={`${tarjeta.numero}.pdf`}
                      >
                        <span className="chat-tarjeta-icono">
                          <Icon name={tarjeta.creada ? 'check' : 'file'} size={18} />
                        </span>
                        <span className="chat-tarjeta-texto">
                          <strong>{tarjeta.creada ? 'Cotización creada' : 'PDF de cotización'}</strong>
                          <span>
                            {tarjeta.numero}
                            {tarjeta.cliente ? ` · ${tarjeta.cliente}` : ''}
                          </span>
                          {tarjeta.total ? (
                            <small>
                              {tarjeta.total}
                              {tarjeta.estado ? ` · ${tarjeta.estado.replaceAll('_', ' ')}` : ''}
                            </small>
                          ) : null}
                        </span>
                        <Icon name="download" size={18} />
                      </a>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}

            {error ? (
              <div className="chat-error" role="alert">
                <Icon name="alert" size={15} />
                <span>{error}</span>
              </div>
            ) : null}

            <div ref={finRef} />
          </div>

          <form
            className="chat-entrada"
            onSubmit={(event) => {
              event.preventDefault()
              enviar()
            }}
          >
            <textarea
              ref={entradaRef}
              rows={1}
              value={texto}
              placeholder={
                estado?.disponible === false
                  ? 'Configura FREELMAPI_KEY para activar el asistente'
                  : 'Escribe tu pregunta…'
              }
              onChange={(event) => setTexto(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault()
                  enviar()
                }
              }}
              disabled={estado?.disponible === false}
            />
            {enviando ? (
              <button
                type="button"
                className="chat-enviar chat-detener"
                onClick={() => abortRef.current?.abort()}
                aria-label="Detener respuesta"
              >
                <Icon name="close" size={16} />
              </button>
            ) : (
              <button
                type="submit"
                className="chat-enviar"
                disabled={!texto.trim() || estado?.disponible === false}
                aria-label="Enviar mensaje"
              >
                <Icon name="send" size={17} />
              </button>
            )}
          </form>
          <p className="chat-nota">Respuestas generadas con IA. Verifica precios antes de enviar.</p>
        </section>
      ) : null}

      <button
        type="button"
        className="chat-boton"
        onClick={() => setAbierto((valor) => !valor)}
        aria-label={abierto ? 'Cerrar asistente' : 'Abrir asistente comercial'}
      >
        <Icon name={abierto ? 'close' : 'sparkle'} size={22} />
        {!abierto ? <span>Asistente</span> : null}
      </button>
    </div>
  )
}

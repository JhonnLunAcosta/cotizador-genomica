import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { api } from '../api.js'
import {
  ESTADOS,
  categoriaRequisito,
  estadoMeta,
  requisitoMeta,
  tipoMeta,
} from '../domain.js'
import {
  diasHasta,
  diasTexto,
  diasTone,
  formatDate,
  formatMoney,
  formatPercent,
  formatQty,
} from '../format.js'
import EstadoBadge from '../components/EstadoBadge.jsx'
import RegistroBadge from '../components/RegistroBadge.jsx'
import ProductoImagen from '../components/ProductoImagen.jsx'
import Icon from '../components/Icon.jsx'
import Aviso from '../components/Aviso.jsx'
import { ErrorState, Loading } from '../components/States.jsx'

function estadoRegistroItem(item) {
  if (!item.registroSanitario) return 'no_requiere'
  const dias = diasHasta(item.registroVence)
  if (dias === null) return 'vigente'
  if (dias < 0) return 'vencido'
  if (dias <= 90) return 'por_vencer'
  return 'vigente'
}

export default function CotizacionDetalle() {
  const { numero } = useParams()
  const location = useLocation()
  const [documento, setDocumento] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [recarga, setRecarga] = useState(0)

  const [estadoNuevo, setEstadoNuevo] = useState('')
  const [nota, setNota] = useState('')
  const [guardandoEstado, setGuardandoEstado] = useState(false)
  const [mensajeEstado, setMensajeEstado] = useState(null)

  const [requisitoActual, setRequisitoActual] = useState(null)
  const [mensajeRequisito, setMensajeRequisito] = useState(null)
  const [avisoCreada, setAvisoCreada] = useState(Boolean(location.state?.creada))

  const cargar = useCallback(
    (signal) => {
      setLoading(true)
      setError(null)
      return api
        .cotizacion(numero, { signal })
        .then((data) => {
          setDocumento(data)
          setEstadoNuevo(data.estado)
          setLoading(false)
        })
        .catch((fallo) => {
          if (fallo?.name === 'AbortError') return
          setError(fallo)
          setLoading(false)
        })
    },
    [numero],
  )

  useEffect(() => {
    const controller = new AbortController()
    cargar(controller.signal)
    return () => controller.abort()
  }, [cargar, recarga])

  const resumen = useMemo(() => {
    const requisitos = documento?.requisitos || []
    const cumplidos = requisitos.filter((r) => r.estado === 'cumplido').length
    const noAplica = requisitos.filter((r) => r.estado === 'no_aplica').length
    const pendientes = requisitos.filter((r) => r.estado === 'pendiente').length
    const obligatoriosPendientes = requisitos.filter(
      (r) => r.obligatorio && r.estado === 'pendiente',
    ).length
    const total = requisitos.length
    const resueltos = cumplidos + noAplica
    return {
      total,
      cumplidos,
      noAplica,
      pendientes,
      obligatoriosPendientes,
      porcentaje: total ? Math.round((resueltos / total) * 100) : 0,
    }
  }, [documento])

  const gruposRequisitos = useMemo(() => {
    const mapa = new Map()
    ;(documento?.requisitos || []).forEach((requisito) => {
      const clave = requisito.categoria || 'general'
      if (!mapa.has(clave)) mapa.set(clave, [])
      mapa.get(clave).push(requisito)
    })
    return Array.from(mapa.entries())
  }, [documento])

  const diasVencimiento = documento ? diasHasta(documento.fechaVencimiento) : null

  async function actualizarEstado(event) {
    event.preventDefault()
    if (!documento) return
    setGuardandoEstado(true)
    setMensajeEstado(null)
    try {
      const actualizado = await api.cambiarEstado(documento.numero, {
        estado: estadoNuevo,
        nota: nota.trim() || undefined,
      })
      setDocumento(actualizado)
      setEstadoNuevo(actualizado.estado)
      setNota('')
      setMensajeEstado({
        tone: 'success',
        title: 'Estado actualizado',
        text: `La cotización quedó en estado ${estadoMeta(actualizado.estado).label.toLowerCase()}.`,
      })
    } catch (fallo) {
      setMensajeEstado({
        tone: 'error',
        title: fallo.title,
        text: fallo.detail,
      })
    } finally {
      setGuardandoEstado(false)
    }
  }

  async function actualizarRequisito(codigo, estado) {
    if (!documento || requisitoActual) return
    setRequisitoActual(codigo)
    setMensajeRequisito(null)
    try {
      const actualizado = await api.actualizarRequisito(documento.numero, codigo, { estado })
      setDocumento(actualizado)
      setMensajeRequisito({
        tone: 'success',
        text: `Requisito ${codigo} marcado como ${requisitoMeta(estado).label.toLowerCase()}.`,
      })
    } catch (fallo) {
      setMensajeRequisito({
        tone: 'error',
        title: fallo.title,
        text: fallo.detail,
      })
    } finally {
      setRequisitoActual(null)
    }
  }

  if (loading && !documento) {
    return (
      <>
        <Link to="/cotizaciones" className="back-link">
          <Icon name="arrowLeft" size={15} />
          Volver a cotizaciones
        </Link>
        <Loading label={`Cargando la cotización ${numero}…`} />
      </>
    )
  }

  if (error && !documento) {
    return (
      <>
        <Link to="/cotizaciones" className="back-link">
          <Icon name="arrowLeft" size={15} />
          Volver a cotizaciones
        </Link>
        <ErrorState
          error={error}
          title={error.status === 404 ? 'Cotización no encontrada' : undefined}
          onRetry={() => setRecarga((valor) => valor + 1)}
        />
      </>
    )
  }

  if (!documento) return null

  const cliente = documento.cliente
  const empresa = documento.empresa
  const totales = documento.totales

  return (
    <>
      {avisoCreada ? (
        <Aviso tone="success" title="Cotización creada" onClose={() => setAvisoCreada(false)}>
          La oferta quedó registrada con su checklist regulatorio. Revisa los requisitos pendientes
          antes de enviarla.
        </Aviso>
      ) : null}

      <header className="page-head detail-head">
        <div className="page-head-text">
          <Link to="/cotizaciones" className="back-link">
            <Icon name="arrowLeft" size={15} />
            Volver a cotizaciones
          </Link>
          <div className="detail-title-row">
            <h1>{documento.numero}</h1>
            <EstadoBadge
              estado={documento.estado}
              efectivo={documento.estadoEfectivo}
            />
            <span className="tag">Versión {documento.version}</span>
          </div>
          <p className="page-subtitle">
            {cliente?.razonSocial} · {cliente?.tipoDocumento} {cliente?.numeroDocumento}
            {cliente?.digitoVerificacion ? `-${cliente.digitoVerificacion}` : ''}
          </p>
        </div>
        <div className="page-actions">
          <Link to="/cotizaciones" className="btn btn-ghost">
            <Icon name="file" size={16} />
            Listado
          </Link>
          <a
            className="btn btn-primary"
            href={api.pdfUrl(documento.numero)}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Icon name="download" size={16} />
            Descargar PDF
          </a>
        </div>
      </header>

      <section className="meta-strip" aria-label="Datos generales de la cotización">
        <div className="meta-cell">
          <p className="meta-label">Cliente</p>
          <p className="meta-value">{cliente?.razonSocial}</p>
          <p className="meta-sub">
            {cliente?.tipoDocumento} {cliente?.numeroDocumento}
            {cliente?.digitoVerificacion ? `-${cliente.digitoVerificacion}` : ''}
          </p>
        </div>
        <div className="meta-cell">
          <p className="meta-label">Emisión</p>
          <p className="meta-value">{formatDate(documento.fechaEmision)}</p>
          <p className="meta-sub">Validez de {documento.validezDias} días</p>
        </div>
        <div className="meta-cell">
          <p className="meta-label">Vencimiento</p>
          <p className="meta-value">{formatDate(documento.fechaVencimiento)}</p>
          <p className={`meta-sub dias ${diasTone(diasVencimiento)}`}>
            {diasTexto(diasVencimiento)}
          </p>
        </div>
        <div className="meta-cell">
          <p className="meta-label">Moneda</p>
          <p className="meta-value">{documento.moneda}</p>
          <p className="meta-sub">
            {documento.trm ? `TRM ${formatMoney(documento.trm)}` : 'Pesos colombianos'}
          </p>
        </div>
        <div className="meta-cell">
          <p className="meta-label">Checklist</p>
          <p className="meta-value">
            {resumen.cumplidos + resumen.noAplica} / {resumen.total}
          </p>
          <p className="meta-sub">
            {resumen.obligatoriosPendientes > 0
              ? `${resumen.obligatoriosPendientes} obligatorios pendientes`
              : 'Sin obligatorios pendientes'}
          </p>
        </div>
      </section>

      <section className="card" aria-labelledby="items-titulo">
        <div className="card-head">
          <div>
            <h2 id="items-titulo">Ítems de la oferta</h2>
            <p>{documento.items?.length || 0} líneas cotizadas con registro sanitario.</p>
          </div>
          <span className="count-pill">{documento.items?.length || 0}</span>
        </div>
        <div className="table-wrap">
          <table className="table table-items">
            <thead>
              <tr>
                <th>#</th>
                <th>Descripción</th>
                <th className="num">Cantidad</th>
                <th className="num">Precio unitario</th>
                <th className="num">Desc.</th>
                <th className="num">IVA</th>
                <th className="num">Total</th>
                <th>Registro sanitario</th>
              </tr>
            </thead>
            <tbody>
              {(documento.items || []).map((item) => (
                <tr key={`${item.orden}-${item.sku}`}>
                  <td className="muted">{item.orden}</td>
                  <td className="item-desc">
                    <div className="cell-producto">
                      <ProductoImagen
                        producto={{ nombre: item.descripcion, imagenUrl: item.imagenUrl }}
                        className="product-img-item"
                        size={14}
                        alt={`Imagen referencial de ${item.descripcion}`}
                      />
                      <div>
                        <span className="cell-strong">{item.descripcion}</span>
                        <span className="cell-sub">
                          {item.sku} · {tipoMeta(item.tipo).label}
                          {item.marca ? ` · ${item.marca}` : ''}
                          {item.modelo ? ` · ${item.modelo}` : ''}
                        </span>
                        {item.tiempoEntrega ? (
                          <span className="cell-sub">Entrega: {item.tiempoEntrega}</span>
                        ) : null}
                      </div>
                    </div>
                  </td>
                  <td className="num">
                    {formatQty(item.cantidad)} <span className="cell-sub-inline">{item.unidadMedida}</span>
                  </td>
                  <td className="num">{formatMoney(item.precioUnitario, documento.moneda)}</td>
                  <td className="num">{formatPercent(item.descuentoPct)}</td>
                  <td className="num">{formatPercent(item.ivaPct)}</td>
                  <td className="num cell-strong">
                    {formatMoney(item.total, documento.moneda)}
                  </td>
                  <td>
                    <RegistroBadge
                      estado={estadoRegistroItem(item)}
                      numero={item.registroSanitario}
                      vence={item.registroVence}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="detail-layout">
        <div className="stack">

          <section className="card" aria-labelledby="checklist-titulo">
            <div className="card-head">
              <div>
                <h2 id="checklist-titulo">Checklist regulatorio</h2>
                <p>Marca cada requisito según la evidencia disponible para la oferta.</p>
              </div>
              <span className="count-pill">{resumen.porcentaje} %</span>
            </div>
            <div className="checklist-resumen">
              <div className="progress-track" aria-hidden="true">
                <div className="progress-fill" style={{ width: `${resumen.porcentaje}%` }} />
              </div>
              <div className="checklist-stats">
                <span>{resumen.cumplidos} cumplidos</span>
                <span>{resumen.noAplica} no aplica</span>
                <span className={resumen.pendientes ? 'text-warn' : ''}>
                  {resumen.pendientes} pendientes
                </span>
                {resumen.obligatoriosPendientes > 0 ? (
                  <span className="text-danger">
                    {resumen.obligatoriosPendientes} obligatorios
                  </span>
                ) : null}
              </div>
            </div>

            {mensajeRequisito ? (
              <div className="checklist-aviso">
                <Aviso
                  tone={mensajeRequisito.tone}
                  title={mensajeRequisito.title}
                  onClose={() => setMensajeRequisito(null)}
                >
                  {mensajeRequisito.text}
                </Aviso>
              </div>
            ) : null}

            <div className="checklist">
              {gruposRequisitos.map(([categoria, requisitos]) => (
                <div className="check-group" key={categoria}>
                  <h3>{categoriaRequisito(categoria)}</h3>
                  {requisitos.map((requisito) => {
                    const meta = requisitoMeta(requisito.estado)
                    const actualizando = requisitoActual === requisito.codigo
                    return (
                      <div
                        className={`check-item estado-${requisito.estado}`}
                        key={requisito.codigo}
                      >
                        <div className="check-main">
                          <div className="check-top">
                            <span className="check-code">{requisito.codigo}</span>
                            <span className={`badge badge-${meta.tone} badge-sm`}>
                              <span className="badge-dot" aria-hidden="true" />
                              {meta.label}
                            </span>
                            {requisito.obligatorio ? (
                              <span className="tag">Obligatorio</span>
                            ) : (
                              <span className="tag">Opcional</span>
                            )}
                            {requisito.norma ? (
                              <span className="tag">{requisito.norma}</span>
                            ) : null}
                          </div>
                          <p className="check-title">{requisito.titulo}</p>
                          <p className="check-meta">
                            {categoriaRequisito(requisito.categoria)}
                            {requisito.evidenciaUrl ? (
                              <>
                                {' · '}
                                <a
                                  href={requisito.evidenciaUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-link"
                                >
                                  Ver evidencia
                                </a>
                              </>
                            ) : null}
                          </p>
                          {requisito.observaciones ? (
                            <p className="check-obs">{requisito.observaciones}</p>
                          ) : null}
                        </div>
                        <div className="check-actions" aria-label={`Actualizar ${requisito.codigo}`}>
                          {[
                            { value: 'cumplido', label: 'Cumplido', clase: 'ok' },
                            { value: 'no_aplica', label: 'No aplica', clase: 'neutral' },
                            { value: 'pendiente', label: 'Pendiente', clase: 'warn' },
                          ].map((opcion) => (
                            <button
                              key={opcion.value}
                              type="button"
                              className={`check-btn ${opcion.clase}${
                                requisito.estado === opcion.value ? ' active' : ''
                              }`}
                              onClick={() => actualizarRequisito(requisito.codigo, opcion.value)}
                              disabled={actualizando}
                              aria-pressed={requisito.estado === opcion.value}
                            >
                              {opcion.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </section>

          <section className="card" aria-labelledby="clausulas-titulo">
            <div className="card-head">
              <div>
                <h2 id="clausulas-titulo">Cláusulas</h2>
                <p>Textos legales congelados al momento de la oferta.</p>
              </div>
              <span className="count-pill">{documento.clausulas?.length || 0}</span>
            </div>
            <div className="card-pad">
              {(documento.clausulas || []).map((clausula) => (
                <details className="clausula" key={clausula.codigo}>
                  <summary>
                    <span className="mono clausula-code">{clausula.codigo}</span>
                    {clausula.titulo}
                  </summary>
                  <p className="clausula-body">{clausula.cuerpo}</p>
                </details>
              ))}
            </div>
          </section>

          <section className="card" aria-labelledby="normas-titulo">
            <div className="card-head">
              <div>
                <h2 id="normas-titulo">Normas citadas</h2>
                <p>Marco normativo de referencia incluido en la oferta.</p>
              </div>
              <span className="count-pill">{documento.normas?.length || 0}</span>
            </div>
            <ul className="normas-lista">
              {(documento.normas || []).map((norma) => (
                <li className="norma-item" key={norma.codigo}>
                  <div className="norma-main">
                    <span className="mono norma-code">{norma.codigo}</span>
                    <p className="norma-titulo">{norma.titulo}</p>
                  </div>
                  <div className="norma-meta">
                    <span>{norma.entidad}</span>
                    <span>{norma.anio}</span>
                    <span className="tag">{norma.ambito}</span>
                    {norma.obligatoria ? (
                      <span className="badge badge-warn badge-sm">Obligatoria</span>
                    ) : (
                      <span className="badge badge-neutral badge-sm">Referencia</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="card" aria-labelledby="condiciones-titulo">
            <div className="card-head">
              <div>
                <h2 id="condiciones-titulo">Condiciones comerciales</h2>
                <p>Plazos, entrega, garantía y declaraciones de la oferta.</p>
              </div>
            </div>
            <div className="card-pad">
              <div className="info-grid">
                <div className="info-block">
                  <span className="info-label">Forma de pago</span>
                  <p>{documento.formaPago || '—'}</p>
                </div>
                <div className="info-block">
                  <span className="info-label">Plazo de entrega</span>
                  <p>{documento.plazoEntrega || '—'}</p>
                </div>
                <div className="info-block">
                  <span className="info-label">Lugar de entrega</span>
                  <p>{documento.lugarEntrega || '—'}</p>
                </div>
                <div className="info-block">
                  <span className="info-label">Garantía</span>
                  <p>{documento.garantiaMeses} meses</p>
                </div>
              </div>

              {documento.garantiaDetalle ? (
                <div className="text-block">
                  <h3>Detalle de garantía</h3>
                  <p>{documento.garantiaDetalle}</p>
                </div>
              ) : null}
              {documento.declaracionCumplimiento ? (
                <div className="text-block">
                  <h3>Declaración de cumplimiento</h3>
                  <p>{documento.declaracionCumplimiento}</p>
                </div>
              ) : null}
              {documento.observaciones ? (
                <div className="text-block">
                  <h3>Observaciones</h3>
                  <p>{documento.observaciones}</p>
                </div>
              ) : null}
              {documento.condicionesComerciales ? (
                <div className="text-block">
                  <h3>Condiciones comerciales</h3>
                  <p>{documento.condicionesComerciales}</p>
                </div>
              ) : null}
            </div>
          </section>

          <section className="card" aria-labelledby="oferente-titulo">
            <div className="card-head">
              <div>
                <h2 id="oferente-titulo">Oferente</h2>
                <p>Datos legales y tributarios de Genómica Andina S.A.S.</p>
              </div>
            </div>
            <div className="card-pad">
              <div className="info-grid info-grid-three">
                <div className="info-block">
                  <span className="info-label">Razón social</span>
                  <p>{empresa?.razonSocial}</p>
                </div>
                <div className="info-block">
                  <span className="info-label">NIT</span>
                  <p>
                    {empresa?.nit}
                    {empresa?.digitoVerificacion ? `-${empresa.digitoVerificacion}` : ''}
                  </p>
                </div>
                <div className="info-block">
                  <span className="info-label">Régimen tributario</span>
                  <p>{empresa?.regimenTributario || '—'}</p>
                </div>
                <div className="info-block">
                  <span className="info-label">Dirección</span>
                  <p>
                    {empresa?.direccion} · {empresa?.ciudad}
                  </p>
                </div>
                <div className="info-block">
                  <span className="info-label">Contacto</span>
                  <p>
                    {empresa?.telefono} · {empresa?.email}
                  </p>
                </div>
                <div className="info-block">
                  <span className="info-label">Resolución de facturación</span>
                  <p>{empresa?.resolucionFacturacion || '—'}</p>
                </div>
                <div className="info-block">
                  <span className="info-label">Representante legal</span>
                  <p>{empresa?.representanteLegal || '—'}</p>
                </div>
                <div className="info-block">
                  <span className="info-label">Sitio web</span>
                  <p>{empresa?.sitioWeb || '—'}</p>
                </div>
              </div>
            </div>
          </section>
        </div>

        <aside className="stack detail-aside">
          <section className="card" aria-labelledby="totales-titulo">
            <div className="card-head">
              <div>
                <h2 id="totales-titulo">Totales</h2>
                <p>Cálculo del servidor en {documento.moneda}.</p>
              </div>
            </div>
            <div className="totals">
              <div className="totals-row">
                <span>Subtotal</span>
                <span>{formatMoney(totales?.subtotal, documento.moneda)}</span>
              </div>
              <div className="totals-row">
                <span>IVA</span>
                <span>{formatMoney(totales?.ivaTotal, documento.moneda)}</span>
              </div>
              <div className="totals-row totals-row-strong">
                <span>Total bruto</span>
                <span>{formatMoney(totales?.totalBruto, documento.moneda)}</span>
              </div>
              <div className="totals-divider" />
              <div className="totals-row">
                <span>Retefuente</span>
                <span>
                  {totales?.retefuente
                    ? `- ${formatMoney(Math.abs(totales.retefuente), documento.moneda)}`
                    : formatMoney(0, documento.moneda)}
                </span>
              </div>
              <div className="totals-row">
                <span>ReteIVA</span>
                <span>
                  {totales?.reteiva
                    ? `- ${formatMoney(Math.abs(totales.reteiva), documento.moneda)}`
                    : formatMoney(0, documento.moneda)}
                </span>
              </div>
              <div className="totals-row">
                <span>ReteICA</span>
                <span>
                  {totales?.reteica
                    ? `- ${formatMoney(Math.abs(totales.reteica), documento.moneda)}`
                    : formatMoney(0, documento.moneda)}
                </span>
              </div>
              <div className="totals-final">
                <span className="totals-final-label">Total neto</span>
                <span className="totals-final-value">
                  {formatMoney(totales?.totalNeto, documento.moneda)}
                </span>
              </div>
              <p className="totals-note">
                Las retenciones de ley se calculan en el servidor a partir de las líneas.
              </p>
            </div>
          </section>

          <section className="card" aria-labelledby="estado-titulo">
            <div className="card-head">
              <div>
                <h2 id="estado-titulo">Cambiar estado</h2>
                <p>El cambio queda registrado en el historial.</p>
              </div>
              <EstadoBadge estado={documento.estado} small />
            </div>
            <form className="card-pad state-form" onSubmit={actualizarEstado}>
              <div className="field">
                <label htmlFor="nuevo-estado">Nuevo estado</label>
                <select
                  id="nuevo-estado"
                  className="select"
                  value={estadoNuevo}
                  onChange={(event) => setEstadoNuevo(event.target.value)}
                >
                  {ESTADOS.map((estado) => (
                    <option key={estado.value} value={estado.value}>
                      {estado.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="nota-estado">Nota (opcional)</label>
                <textarea
                  id="nota-estado"
                  className="textarea"
                  rows={3}
                  placeholder="Motivo o detalle del cambio"
                  value={nota}
                  onChange={(event) => setNota(event.target.value)}
                />
              </div>
              {mensajeEstado ? (
                <Aviso
                  tone={mensajeEstado.tone}
                  title={mensajeEstado.title}
                  onClose={() => setMensajeEstado(null)}
                >
                  {mensajeEstado.text}
                </Aviso>
              ) : null}
              <button type="submit" className="btn btn-primary btn-block" disabled={guardandoEstado}>
                {guardandoEstado ? 'Actualizando…' : 'Actualizar estado'}
              </button>
            </form>
          </section>

          <section className="card" aria-labelledby="cliente-titulo">
            <div className="card-head">
              <div>
                <h2 id="cliente-titulo">Cliente</h2>
                <p>Datos de la entidad destinataria.</p>
              </div>
            </div>
            <div className="card-pad">
              <p className="aside-name">{cliente?.razonSocial}</p>
              <p className="aside-meta">
                {cliente?.tipoDocumento} {cliente?.numeroDocumento}
                {cliente?.digitoVerificacion ? `-${cliente.digitoVerificacion}` : ''}
              </p>
              <dl className="aside-list">
                <div>
                  <dt>Ciudad</dt>
                  <dd>
                    {cliente?.ciudad}, {cliente?.departamento}
                  </dd>
                </div>
                <div>
                  <dt>Dirección</dt>
                  <dd>{cliente?.direccion || '—'}</dd>
                </div>
                <div>
                  <dt>Contacto</dt>
                  <dd>{cliente?.telefono || '—'}</dd>
                </div>
                <div>
                  <dt>Correo</dt>
                  <dd className="break">{cliente?.email || '—'}</dd>
                </div>
                <div>
                  <dt>Habilitación REPS</dt>
                  <dd>{cliente?.codigoHabilitacion || '—'}</dd>
                </div>
                <div>
                  <dt>Datos personales</dt>
                  <dd>{cliente?.autorizaDatos ? 'Autorizados' : 'Sin autorización registrada'}</dd>
                </div>
              </dl>
            </div>
          </section>
        </aside>
      </div>
    </>
  )
}

import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api.js'
import { useApi } from '../hooks/useApi.js'
import { ESTADOS } from '../domain.js'
import { diasTexto, diasTone, formatDate, formatMoney, normalizar } from '../format.js'
import PageHeader from '../components/PageHeader.jsx'
import EstadoBadge from '../components/EstadoBadge.jsx'
import Icon from '../components/Icon.jsx'
import { EmptyState, ErrorState, Loading } from '../components/States.jsx'

export default function Cotizaciones() {
  const { data, loading, error, reload } = useApi(() => api.cotizaciones(), [])
  const [filtro, setFiltro] = useState('todos')
  const [busqueda, setBusqueda] = useState('')

  const cotizaciones = data || []

  const conteos = useMemo(() => {
    const base = { todos: cotizaciones.length }
    ESTADOS.forEach((estado) => {
      base[estado.value] = 0
    })
    cotizaciones.forEach((cotizacion) => {
      const clave = cotizacion.estadoEfectivo || cotizacion.estado
      if (base[clave] === undefined) base[clave] = 0
      base[clave] += 1
    })
    return base
  }, [cotizaciones])

  const filtradas = useMemo(() => {
    const termino = normalizar(busqueda)
    return cotizaciones.filter((cotizacion) => {
      const estado = cotizacion.estadoEfectivo || cotizacion.estado
      if (filtro !== 'todos' && estado !== filtro) return false
      if (!termino) return true
      return [cotizacion.numero, cotizacion.cliente, cotizacion.clienteDocumento]
        .map(normalizar)
        .some((valor) => valor.includes(termino))
    })
  }, [cotizaciones, filtro, busqueda])

  const hayFiltros = filtro !== 'todos' || busqueda.trim() !== ''

  function limpiarFiltros() {
    setFiltro('todos')
    setBusqueda('')
  }

  const acciones = (
    <>
      <button type="button" className="btn btn-secondary" onClick={reload} disabled={loading}>
        <Icon name="refresh" size={16} />
        Actualizar
      </button>
      <Link to="/cotizaciones/nueva" className="btn btn-primary">
        <Icon name="plus" size={16} />
        Nueva cotización
      </Link>
    </>
  )

  return (
    <>
      <PageHeader
        eyebrow="Gestión comercial"
        title="Cotizaciones"
        subtitle="Consulta la cartera por estado, vigencia y avance del checklist regulatorio."
        actions={acciones}
      />

      {loading && !data ? <Loading label="Cargando cotizaciones…" /> : null}
      {error && !data ? <ErrorState error={error} onRetry={reload} /> : null}

      {data ? (
        <section className="card" aria-labelledby="listado-titulo">
          <div className="toolbar">
            <div className="search">
              <Icon name="search" size={16} />
              <input
                type="search"
                className="input"
                placeholder="Buscar por número, cliente o NIT"
                value={busqueda}
                onChange={(event) => setBusqueda(event.target.value)}
                aria-label="Buscar cotizaciones"
              />
            </div>
            <div className="toolbar-spacer" />
            <span className="result-count" aria-live="polite">
              {filtradas.length} de {cotizaciones.length} cotizaciones
            </span>
          </div>

          <div className="chips-bar" role="group" aria-label="Filtrar por estado">
            <button
              type="button"
              className={`chip${filtro === 'todos' ? ' active' : ''}`}
              onClick={() => setFiltro('todos')}
              aria-pressed={filtro === 'todos'}
            >
              Todas
              <span className="chip-count">{conteos.todos}</span>
            </button>
            {ESTADOS.map((estado) => (
              <button
                key={estado.value}
                type="button"
                className={`chip${filtro === estado.value ? ' active' : ''}`}
                onClick={() => setFiltro(estado.value)}
                aria-pressed={filtro === estado.value}
              >
                {estado.label}
                <span className="chip-count">{conteos[estado.value] ?? 0}</span>
              </button>
            ))}
          </div>

          {filtradas.length > 0 ? (
            <div className="table-wrap">
              <table className="table table-cotizaciones">
                <thead>
                  <tr>
                    <th id="listado-titulo">Número</th>
                    <th>Cliente</th>
                    <th>Estado</th>
                    <th>Emisión</th>
                    <th>Vencimiento</th>
                    <th>Días para vencer</th>
                    <th className="num">Total neto</th>
                    <th>Checklist</th>
                    <th aria-label="Abrir detalle" />
                  </tr>
                </thead>
                <tbody>
                  {filtradas.map((cotizacion) => {
                    const dias = cotizacion.diasParaVencer
                    return (
                      <tr key={cotizacion.numero}>
                        <td>
                          <Link
                            to={`/cotizaciones/${cotizacion.numero}`}
                            className="mono table-link"
                          >
                            {cotizacion.numero}
                          </Link>
                          {cotizacion.version > 1 ? (
                            <span className="cell-sub">Versión {cotizacion.version}</span>
                          ) : null}
                        </td>
                        <td>
                          <span className="cell-strong">{cotizacion.cliente}</span>
                          <span className="cell-sub">NIT {cotizacion.clienteDocumento}</span>
                        </td>
                        <td>
                          <EstadoBadge
                            estado={cotizacion.estado}
                            efectivo={cotizacion.estadoEfectivo}
                          />
                        </td>
                        <td className="nowrap">{formatDate(cotizacion.fechaEmision)}</td>
                        <td className="nowrap">{formatDate(cotizacion.fechaVencimiento)}</td>
                        <td>
                          <span className={`dias dias-pill ${diasTone(dias)}`}>
                            {diasTexto(dias)}
                          </span>
                        </td>
                        <td className="num cell-strong">
                          {formatMoney(cotizacion.totalNeto, cotizacion.moneda)}
                        </td>
                        <td>
                          {cotizacion.itemsRegistroVencido > 0 ? (
                            <span className="badge badge-danger badge-sm">
                              {cotizacion.itemsRegistroVencido} registro(s) vencido(s)
                            </span>
                          ) : cotizacion.requisitosPendientes > 0 ? (
                            <span className="badge badge-warn badge-sm">
                              {cotizacion.requisitosPendientes} pendiente(s)
                            </span>
                          ) : (
                            <span className="badge badge-ok badge-sm">
                              <Icon name="check" size={12} />
                              Al día
                            </span>
                          )}
                        </td>
                        <td className="num">
                          <Link
                            to={`/cotizaciones/${cotizacion.numero}`}
                            className="icon-link"
                            aria-label={`Abrir ${cotizacion.numero}`}
                          >
                            <Icon name="chevronRight" size={17} />
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="card-pad">
              <EmptyState
                icon="search"
                title="No hay cotizaciones con estos criterios"
                message={
                  hayFiltros
                    ? 'Prueba con otro estado o término de búsqueda.'
                    : 'Crea la primera cotización para comenzar.'
                }
                action={
                  hayFiltros ? (
                    <button type="button" className="btn btn-secondary btn-sm" onClick={limpiarFiltros}>
                      Limpiar filtros
                    </button>
                  ) : (
                    <Link to="/cotizaciones/nueva" className="btn btn-primary btn-sm">
                      Nueva cotización
                    </Link>
                  )
                }
              />
            </div>
          )}
        </section>
      ) : null}
    </>
  )
}

import { Link } from 'react-router-dom'
import { api } from '../api.js'
import { useApi } from '../hooks/useApi.js'
import { diasHasta, diasTexto, diasTone, formatDate, formatMoney } from '../format.js'
import PageHeader from '../components/PageHeader.jsx'
import KpiCard from '../components/KpiCard.jsx'
import EstadoBadge from '../components/EstadoBadge.jsx'
import RegistroBadge from '../components/RegistroBadge.jsx'
import Icon from '../components/Icon.jsx'
import { EmptyState, ErrorState, Loading } from '../components/States.jsx'

export default function Dashboard() {
  const { data, loading, error, reload } = useApi(() => api.dashboard(), [])

  const acciones = (
    <>
      <button
        type="button"
        className="btn btn-secondary"
        onClick={reload}
        disabled={loading}
      >
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
        eyebrow="Tablero comercial"
        title="Panel de control"
        subtitle={`Cartera, pipeline y alertas regulatorias · ${formatDate(new Date())}`}
        actions={acciones}
      />

      {loading && !data ? <Loading label="Consultando el tablero comercial…" /> : null}
      {error && !data ? <ErrorState error={error} onRetry={reload} /> : null}

      {data ? (
        <>
          <section className="kpi-grid" aria-label="Indicadores principales">
            <KpiCard
              label="Total cotizaciones"
              value={data.total}
              hint={`${data.borradores} en borrador`}
              tone="primary"
              icon={<Icon name="file" size={18} />}
            />
            <KpiCard
              label="Pipeline abierto"
              value={formatMoney(data.pipeline)}
              hint="Cotizaciones en curso"
              tone="accent"
              icon={<Icon name="dna" size={18} />}
            />
            <KpiCard
              label="Aceptadas"
              value={data.aceptadas}
              hint={`${formatMoney(data.aceptado)} adjudicados`}
              tone="ok"
              icon={<Icon name="check" size={18} />}
            />
            <KpiCard
              label="Alertas regulatorias"
              value={data.alertas?.length ?? 0}
              hint="Requieren seguimiento"
              tone="warn"
              icon={<Icon name="alert" size={18} />}
            />
          </section>

          <div className="dashboard-columns">
            <div className="stack">
              <section className="card" aria-labelledby="recientes-titulo">
                <div className="card-head">
                  <div>
                    <h2 id="recientes-titulo">Cotizaciones recientes</h2>
                    <p>Últimos movimientos de la cartera comercial.</p>
                  </div>
                  <Link to="/cotizaciones" className="card-link">
                    Ver todas
                    <Icon name="chevronRight" size={14} />
                  </Link>
                </div>

                {data.recientes?.length ? (
                  <div className="table-wrap">
                    <table className="table table-recientes">
                      <thead>
                        <tr>
                          <th>Número</th>
                          <th>Cliente</th>
                          <th>Estado</th>
                          <th>Vencimiento</th>
                          <th className="num">Total neto</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.recientes.map((cotizacion) => {
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
                              <td>
                                <span>{formatDate(cotizacion.fechaVencimiento)}</span>
                                <span className={`cell-sub dias ${diasTone(dias)}`}>
                                  {diasTexto(dias)}
                                </span>
                              </td>
                              <td className="num cell-strong">
                                {formatMoney(cotizacion.totalNeto, cotizacion.moneda)}
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
                      title="Aún no hay cotizaciones"
                      message="Crea la primera cotización para empezar a construir el pipeline."
                      action={
                        <Link to="/cotizaciones/nueva" className="btn btn-primary btn-sm">
                          Nueva cotización
                        </Link>
                      }
                    />
                  </div>
                )}
              </section>

              <section className="card" aria-labelledby="registros-titulo">
                <div className="card-head">
                  <div>
                    <h2 id="registros-titulo">Registros sanitarios por vencer</h2>
                    <p>Productos del catálogo que requieren renovación ante el INVIMA.</p>
                  </div>
                  <Link to="/productos" className="card-link">
                    Ver catálogo
                    <Icon name="chevronRight" size={14} />
                  </Link>
                </div>

                {data.registrosPorVencer?.length ? (
                  <div className="table-wrap">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>SKU</th>
                          <th>Producto</th>
                          <th>Estado</th>
                          <th>Registro</th>
                          <th>Vence</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.registrosPorVencer.map((registro) => {
                          const dias = diasHasta(registro.fechaVencimiento)
                          return (
                            <tr key={registro.sku}>
                              <td className="mono">{registro.sku}</td>
                              <td className="cell-strong">{registro.nombre}</td>
                              <td>
                                <RegistroBadge
                                  estado={registro.estadoRegistro}
                                  showDetail={false}
                                />
                              </td>
                              <td className="mono cell-sub-inline">
                                {registro.numeroRegistro || 'Sin registro'}
                              </td>
                              <td>
                                <span>{formatDate(registro.fechaVencimiento)}</span>
                                <span className={`cell-sub dias ${diasTone(dias)}`}>
                                  {diasTexto(dias)}
                                </span>
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
                      icon="shield"
                      title="Sin registros próximos a vencer"
                      message="No hay registros sanitarios que expiren en el horizonte de alerta."
                    />
                  </div>
                )}
              </section>
            </div>

            <aside className="stack" aria-labelledby="alertas-titulo">
              <section className="card alert-card">
                <div className="card-head">
                  <div>
                    <h2 id="alertas-titulo">Alertas regulatorias</h2>
                    <p>Requisitos obligatorios y registros vencidos.</p>
                  </div>
                  <span className="count-pill">{data.alertas?.length ?? 0}</span>
                </div>

                {data.alertas?.length ? (
                  <div className="alert-list">
                    {data.alertas.map((alerta) => (
                      <Link
                        key={alerta.numero}
                        to={`/cotizaciones/${alerta.numero}`}
                        className="alert-item"
                      >
                        <div className="alert-top">
                          <span className="mono alert-numero">{alerta.numero}</span>
                          <EstadoBadge estado={alerta.estado} small />
                        </div>
                        <p className="alert-client">{alerta.cliente}</p>
                        <div className="alert-meta">
                          <span className={`dias ${diasTone(alerta.diasParaVencer)}`}>
                            {diasTexto(alerta.diasParaVencer)}
                          </span>
                          {alerta.requisitosPendientes > 0 ? (
                            <span>{alerta.requisitosPendientes} requisitos pendientes</span>
                          ) : null}
                          {alerta.itemsRegistroVencido > 0 ? (
                            <span className="text-danger">
                              {alerta.itemsRegistroVencido} registro(s) vencido(s)
                            </span>
                          ) : null}
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="card-pad">
                    <EmptyState
                      icon="check"
                      title="Sin alertas"
                      message="Todas las cotizaciones tienen su checklist regulatorio al día."
                    />
                  </div>
                )}
              </section>

              <section className="card card-pad quick-card">
                <h2 className="quick-title">Accesos rápidos</h2>
                <div className="quick-links">
                  <Link to="/cotizaciones/nueva">
                    <Icon name="plus" size={16} />
                    <span>
                      <strong>Crear cotización</strong>
                      <small>Cliente, productos y checklist</small>
                    </span>
                  </Link>
                  <Link to="/productos">
                    <Icon name="box" size={16} />
                    <span>
                      <strong>Revisar catálogo</strong>
                      <small>Precios y registros sanitarios</small>
                    </span>
                  </Link>
                  <Link to="/clientes">
                    <Icon name="users" size={16} />
                    <span>
                      <strong>Registrar cliente</strong>
                      <small>Datos tributarios y habilitación</small>
                    </span>
                  </Link>
                </div>
              </section>
            </aside>
          </div>
        </>
      ) : null}
    </>
  )
}

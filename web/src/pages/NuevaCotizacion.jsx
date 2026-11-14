import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api.js'
import { TIPOS_PRODUCTO, tipoMeta } from '../domain.js'
import {
  formatMoney,
  formatPercent,
  formatQty,
  normalizar,
  numero,
  redondear,
} from '../format.js'
import PageHeader from '../components/PageHeader.jsx'
import RegistroBadge from '../components/RegistroBadge.jsx'
import ProductoImagen from '../components/ProductoImagen.jsx'
import Icon from '../components/Icon.jsx'
import Aviso from '../components/Aviso.jsx'
import { EmptyState, ErrorState, Loading } from '../components/States.jsx'

const FORMA_INICIAL = {
  validezDias: 15,
  garantiaMeses: 12,
  moneda: 'COP',
  formaPago: '50% con la orden de compra y 50% contra entrega',
  plazoEntrega: 'Equipos: 45 días calendario. Reactivos: 15 días calendario.',
  lugarEntrega: '',
  observaciones: '',
}

function calcularLinea(linea) {
  const cantidad = numero(linea.cantidad)
  const descuento = Math.min(Math.max(numero(linea.descuento), 0), 100)
  const precio = Number(linea.producto.precio) || 0
  const ivaPct = Number(linea.producto.ivaPct) || 0
  const subtotal = redondear(cantidad * precio * (1 - descuento / 100), 2)
  const iva = redondear((subtotal * ivaPct) / 100, 2)
  return { cantidad, descuento, precio, ivaPct, subtotal, iva, total: redondear(subtotal + iva, 2) }
}

export default function NuevaCotizacion() {
  const navigate = useNavigate()

  const [clientes, setClientes] = useState([])
  const [productos, setProductos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [errorCarga, setErrorCarga] = useState(null)
  const [intento, setIntento] = useState(0)

  const [cliente, setCliente] = useState(null)
  const [busquedaCliente, setBusquedaCliente] = useState('')
  const [busquedaProducto, setBusquedaProducto] = useState('')
  const [tipoFiltro, setTipoFiltro] = useState('todos')
  const [lineas, setLineas] = useState([])
  const [form, setForm] = useState({ ...FORMA_INICIAL })

  const [guardando, setGuardando] = useState(false)
  const [errorGuardar, setErrorGuardar] = useState(null)
  const [erroresCampo, setErroresCampo] = useState({})

  const cargar = useCallback(async (signal) => {
    setCargando(true)
    setErrorCarga(null)
    try {
      const [listaClientes, listaProductos] = await Promise.all([
        api.clientes(undefined, { signal }),
        api.productos({ moneda: 'COP' }, { signal }),
      ])
      setClientes(listaClientes || [])
      setProductos(listaProductos || [])
      setCargando(false)
    } catch (fallo) {
      if (fallo?.name === 'AbortError') return
      setErrorCarga(fallo)
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    cargar(controller.signal)
    return () => controller.abort()
  }, [cargar, intento])

  const clientesFiltrados = useMemo(() => {
    const termino = normalizar(busquedaCliente)
    return clientes
      .filter((item) => {
        if (!termino) return true
        return [item.razonSocial, item.numeroDocumento, item.nombreComercial, item.ciudad]
          .map(normalizar)
          .some((valor) => valor.includes(termino))
      })
      .slice(0, 10)
  }, [clientes, busquedaCliente])

  const conteosTipo = useMemo(() => {
    const conteos = { todos: productos.length }
    TIPOS_PRODUCTO.forEach((tipo) => {
      conteos[tipo.value] = 0
    })
    productos.forEach((producto) => {
      conteos[producto.tipo] = (conteos[producto.tipo] || 0) + 1
    })
    return conteos
  }, [productos])

  const productosFiltrados = useMemo(() => {
    const termino = normalizar(busquedaProducto)
    return productos.filter((producto) => {
      if (tipoFiltro !== 'todos' && producto.tipo !== tipoFiltro) return false
      if (!termino) return true
      return [producto.sku, producto.nombre, producto.marca, producto.modelo]
        .map(normalizar)
        .some((valor) => valor.includes(termino))
    })
  }, [productos, tipoFiltro, busquedaProducto])

  const totales = useMemo(() => {
    return lineas.reduce(
      (acumulado, linea) => {
        const calculo = calcularLinea(linea)
        return {
          subtotal: acumulado.subtotal + calculo.subtotal,
          iva: acumulado.iva + calculo.iva,
          total: acumulado.total + calculo.total,
        }
      },
      { subtotal: 0, iva: 0, total: 0 },
    )
  }, [lineas])

  function elegirCliente(item) {
    setCliente(item)
    setBusquedaCliente('')
    setErroresCampo((previos) => ({ ...previos, cliente: undefined }))
    setForm((previo) => {
      if (previo.lugarEntrega.trim()) return previo
      const lugar = [item.direccion, item.ciudad].filter(Boolean).join(', ')
      return { ...previo, lugarEntrega: lugar }
    })
  }

  function agregarProducto(producto) {
    if (producto.estadoRegistro === 'vencido' || producto.precio === null || producto.precio === undefined) return
    setLineas((previas) => {
      const indice = previas.findIndex((linea) => linea.producto.id === producto.id)
      if (indice >= 0) {
        const copia = [...previas]
        const cantidad = numero(copia[indice].cantidad)
        copia[indice] = { ...copia[indice], cantidad: String(cantidad + 1) }
        return copia
      }
      return [...previas, { producto, cantidad: '1', descuento: '0' }]
    })
    setErroresCampo((previos) => ({ ...previos, items: undefined }))
  }

  function actualizarLinea(indice, campo, valor) {
    setLineas((previas) =>
      previas.map((linea, posicion) =>
        posicion === indice ? { ...linea, [campo]: valor } : linea,
      ),
    )
  }

  function quitarLinea(indice) {
    setLineas((previas) => previas.filter((_, posicion) => posicion !== indice))
  }

  function actualizarForm(campo, valor) {
    setForm((previo) => ({ ...previo, [campo]: valor }))
  }

  function validar() {
    const errores = {}
    if (!cliente) errores.cliente = 'Selecciona el cliente de la cotización.'
    if (lineas.length === 0) errores.items = 'Agrega al menos un producto a la oferta.'

    lineas.forEach((linea, indice) => {
      if (!(numero(linea.cantidad) > 0)) {
        errores[`cantidad-${indice}`] = 'La cantidad debe ser mayor a cero.'
      }
      const descuento = numero(linea.descuento)
      if (descuento < 0 || descuento > 100) {
        errores[`descuento-${indice}`] = 'El descuento debe estar entre 0 y 100.'
      }
    })

    const validez = Number(form.validezDias)
    if (!Number.isInteger(validez) || validez < 1 || validez > 365) {
      errores.validezDias = 'La validez debe ser un entero entre 1 y 365 días.'
    }
    const garantia = Number(form.garantiaMeses)
    if (!Number.isInteger(garantia) || garantia < 0 || garantia > 120) {
      errores.garantiaMeses = 'La garantía debe ser un entero entre 0 y 120 meses.'
    }
    return errores
  }

  async function guardar(event) {
    event.preventDefault()
    setErrorGuardar(null)
    const errores = validar()
    setErroresCampo(errores)
    if (Object.keys(errores).length > 0) {
      setErrorGuardar({
        title: 'Revisa el formulario',
        detail: 'Corrige los campos señalados antes de crear la cotización.',
      })
      return
    }

    setGuardando(true)
    try {
      const creada = await api.crearCotizacion({
        clienteId: cliente.id,
        validezDias: Number(form.validezDias),
        moneda: 'COP',
        formaPago: form.formaPago.trim() || undefined,
        plazoEntrega: form.plazoEntrega.trim() || undefined,
        lugarEntrega: form.lugarEntrega.trim() || undefined,
        garantiaMeses: Number(form.garantiaMeses),
        observaciones: form.observaciones.trim() || undefined,
        items: lineas.map((linea) => ({
          productoId: linea.producto.id,
          cantidad: numero(linea.cantidad),
          descuentoPct: numero(linea.descuento),
        })),
      })
      navigate(`/cotizaciones/${creada.numero}`, { state: { creada: true } })
    } catch (fallo) {
      setErrorGuardar({
        title: fallo.title,
        detail: fallo.detail,
        errores: fallo.errores,
      })
      setGuardando(false)
    }
  }

  const acciones = (
    <Link to="/cotizaciones" className="btn btn-ghost">
      <Icon name="arrowLeft" size={16} />
      Cancelar
    </Link>
  )

  return (
    <>
      <PageHeader
        eyebrow="Nueva oferta"
        title="Crear cotización"
        subtitle="Selecciona el cliente, arma la oferta con el catálogo y define las condiciones comerciales."
        actions={acciones}
      />

      {cargando ? <Loading label="Cargando clientes y catálogo…" /> : null}
      {errorCarga ? (
        <ErrorState
          error={errorCarga}
          onRetry={() => setIntento((valor) => valor + 1)}
        />
      ) : null}

      {!cargando && !errorCarga ? (
        <form className="quote-layout" onSubmit={guardar} noValidate>
          <div className="stack">
            <section className="card" aria-labelledby="cliente-seccion">
              <div className="section-head">
                <span className="step">01</span>
                <div>
                  <h2 id="cliente-seccion">Cliente</h2>
                  <p>Busca por razón social, NIT o ciudad.</p>
                </div>
              </div>
              <div className="section-body">
                {cliente ? (
                  <div className="selected-box">
                    <div>
                      <p className="selected-name">{cliente.razonSocial}</p>
                      <p className="selected-meta">
                        {cliente.tipoDocumento} {cliente.numeroDocumento}
                        {cliente.digitoVerificacion ? `-${cliente.digitoVerificacion}` : ''} ·{' '}
                        {cliente.ciudad}
                        {cliente.email ? ` · ${cliente.email}` : ''}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setCliente(null)}
                    >
                      Cambiar
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="search">
                      <Icon name="search" size={16} />
                      <input
                        type="search"
                        className="input"
                        placeholder="Buscar cliente…"
                        value={busquedaCliente}
                        onChange={(event) => setBusquedaCliente(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') event.preventDefault()
                        }}
                        aria-label="Buscar cliente"
                      />
                    </div>
                    <div className="picker-list">
                      {clientesFiltrados.map((item) => (
                        <button
                          type="button"
                          className="picker-option"
                          key={item.id}
                          onClick={() => elegirCliente(item)}
                        >
                          <span>
                            <span className="picker-name">{item.razonSocial}</span>
                            <span className="picker-meta">
                              {item.tipoDocumento} {item.numeroDocumento}
                              {item.digitoVerificacion ? `-${item.digitoVerificacion}` : ''} ·{' '}
                              {item.ciudad}
                            </span>
                          </span>
                          <Icon name="chevronRight" size={16} />
                        </button>
                      ))}
                      {clientesFiltrados.length === 0 ? (
                        <p className="helper">
                          No hay clientes que coincidan.{' '}
                          <Link to="/clientes" className="inline-link">
                            Registrar un cliente nuevo
                          </Link>
                        </p>
                      ) : null}
                    </div>
                  </>
                )}
                {erroresCampo.cliente ? (
                  <p className="field-error">{erroresCampo.cliente}</p>
                ) : null}
              </div>
            </section>

            <section className="card" aria-labelledby="productos-seccion">
              <div className="section-head">
                <span className="step">02</span>
                <div>
                  <h2 id="productos-seccion">Productos y servicios</h2>
                  <p>Los ítems con registro sanitario vencido no se pueden cotizar.</p>
                </div>
              </div>
              <div className="section-body">
                <div className="search">
                  <Icon name="search" size={16} />
                  <input
                    type="search"
                    className="input"
                    placeholder="Buscar por SKU, nombre, marca o modelo…"
                    value={busquedaProducto}
                    onChange={(event) => setBusquedaProducto(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') event.preventDefault()
                    }}
                    aria-label="Buscar productos"
                  />
                </div>

                <div className="chips product-chips">
                  <button
                    type="button"
                    className={`chip${tipoFiltro === 'todos' ? ' active' : ''}`}
                    onClick={() => setTipoFiltro('todos')}
                    aria-pressed={tipoFiltro === 'todos'}
                  >
                    Todos
                    <span className="chip-count">{conteosTipo.todos}</span>
                  </button>
                  {TIPOS_PRODUCTO.map((tipo) => (
                    <button
                      type="button"
                      className={`chip${tipoFiltro === tipo.value ? ' active' : ''}`}
                      key={tipo.value}
                      onClick={() => setTipoFiltro(tipo.value)}
                      aria-pressed={tipoFiltro === tipo.value}
                    >
                      {tipo.label}
                      <span className="chip-count">{conteosTipo[tipo.value] || 0}</span>
                    </button>
                  ))}
                </div>

                <div className="product-picker">
                  {productosFiltrados.map((producto) => {
                    const linea = lineas.find((item) => item.producto.id === producto.id)
                    const vencido = producto.estadoRegistro === 'vencido'
                    const sinPrecio = producto.precio === null || producto.precio === undefined
                    return (
                      <div
                        className={`product-option${vencido ? ' product-option-disabled' : ''}`}
                        key={producto.id}
                      >
                        <ProductoImagen producto={producto} className="product-img-option" size={18} />
                        <div className="product-option-main">
                          <div className="product-option-top">
                            <span className="mono product-sku">{producto.sku}</span>
                            <span className="tag">{tipoMeta(producto.tipo).label}</span>
                            <RegistroBadge
                              estado={producto.estadoRegistro}
                              numero={producto.numeroRegistro}
                              vence={producto.registroVence}
                              showDetail={false}
                            />
                            {linea ? (
                              <span className="badge badge-accent badge-sm">
                                En la oferta · {formatQty(linea.cantidad)}
                              </span>
                            ) : null}
                          </div>
                          <p className="product-option-name">{producto.nombre}</p>
                          <p className="product-option-meta">
                            {producto.marca}
                            {producto.modelo ? ` · ${producto.modelo}` : ''}
                            {producto.registroVence
                              ? ` · Registro vence ${producto.registroVence.split('-').reverse().join('/')}`
                              : ''}
                          </p>
                          {vencido ? (
                            <p className="field-error">Registro sanitario vencido: no se puede cotizar.</p>
                          ) : null}
                        </div>
                        <div className="product-option-side">
                          <span className="product-option-price">
                            {sinPrecio
                              ? 'Sin precio'
                              : formatMoney(producto.precio, producto.moneda || 'COP')}
                          </span>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => agregarProducto(producto)}
                            disabled={vencido || sinPrecio}
                          >
                            <Icon name="plus" size={14} />
                            {linea ? 'Agregar otra' : 'Agregar'}
                          </button>
                        </div>
                      </div>
                    )
                  })}
                  {productosFiltrados.length === 0 ? (
                    <p className="helper">No hay productos que coincidan con el filtro.</p>
                  ) : null}
                </div>
              </div>
            </section>

            <section className="card" aria-labelledby="lineas-seccion">
              <div className="section-head">
                <span className="step">03</span>
                <div>
                  <h2 id="lineas-seccion">Líneas de la oferta</h2>
                  <p>Ajusta cantidad y descuento; los precios vienen del catálogo.</p>
                </div>
                <span className="count-pill">{lineas.length}</span>
              </div>
              <div className="section-body">
                {lineas.length === 0 ? (
                  <EmptyState
                    icon="flask"
                    title="Aún no hay productos"
                    message="Agrega ítems desde el catálogo para calcular los totales."
                  />
                ) : (
                  <div className="table-wrap">
                    <table className="table lines-table">
                      <thead>
                        <tr>
                          <th>Producto</th>
                          <th className="num">Precio unitario</th>
                          <th>Cantidad</th>
                          <th>Descuento %</th>
                          <th className="num">Subtotal</th>
                          <th className="num">IVA</th>
                          <th className="num">Total</th>
                          <th aria-label="Quitar" />
                        </tr>
                      </thead>
                      <tbody>
                        {lineas.map((linea, indice) => {
                          const calculo = calcularLinea(linea)
                          return (
                            <tr key={linea.producto.id}>
                              <td className="line-desc">
                                <div className="cell-producto">
                                  <ProductoImagen
                                    producto={linea.producto}
                                    className="product-img-line"
                                    size={14}
                                  />
                                  <div>
                                    <span className="cell-strong">{linea.producto.nombre}</span>
                                    <span className="cell-sub">
                                      {linea.producto.sku} · {tipoMeta(linea.producto.tipo).label}
                                    </span>
                                    <RegistroBadge
                                      estado={linea.producto.estadoRegistro}
                                      numero={linea.producto.numeroRegistro}
                                      showDetail={false}
                                    />
                                  </div>
                                </div>
                              </td>
                              <td className="num nowrap">
                                {formatMoney(linea.producto.precio, 'COP')}
                              </td>
                              <td>
                                <input
                                  type="number"
                                  className="input input-compact"
                                  min="0.001"
                                  step="0.001"
                                  value={linea.cantidad}
                                  onChange={(event) =>
                                    actualizarLinea(indice, 'cantidad', event.target.value)
                                  }
                                  aria-label={`Cantidad de ${linea.producto.sku}`}
                                />
                                {erroresCampo[`cantidad-${indice}`] ? (
                                  <span className="field-error">
                                    {erroresCampo[`cantidad-${indice}`]}
                                  </span>
                                ) : null}
                              </td>
                              <td>
                                <input
                                  type="number"
                                  className="input input-compact"
                                  min="0"
                                  max="100"
                                  step="0.01"
                                  value={linea.descuento}
                                  onChange={(event) =>
                                    actualizarLinea(indice, 'descuento', event.target.value)
                                  }
                                  aria-label={`Descuento de ${linea.producto.sku}`}
                                />
                                {erroresCampo[`descuento-${indice}`] ? (
                                  <span className="field-error">
                                    {erroresCampo[`descuento-${indice}`]}
                                  </span>
                                ) : null}
                              </td>
                              <td className="num">{formatMoney(calculo.subtotal, 'COP')}</td>
                              <td className="num">
                                <span>{formatMoney(calculo.iva, 'COP')}</span>
                                <span className="cell-sub">{formatPercent(calculo.ivaPct)}</span>
                              </td>
                              <td className="num cell-strong">
                                {formatMoney(calculo.total, 'COP')}
                              </td>
                              <td className="num">
                                <button
                                  type="button"
                                  className="icon-btn icon-btn-danger"
                                  onClick={() => quitarLinea(indice)}
                                  aria-label={`Quitar ${linea.producto.nombre}`}
                                >
                                  <Icon name="trash" size={16} />
                                </button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
                {erroresCampo.items ? (
                  <p className="field-error">{erroresCampo.items}</p>
                ) : null}
              </div>
            </section>

            <section className="card" aria-labelledby="condiciones-seccion">
              <div className="section-head">
                <span className="step">04</span>
                <div>
                  <h2 id="condiciones-seccion">Condiciones de la oferta</h2>
                  <p>Vigencia, garantía y condiciones comerciales.</p>
                </div>
              </div>
              <div className="section-body">
                <div className="form-grid">
                  <div className="field">
                    <label htmlFor="validez">Validez (días)</label>
                    <input
                      id="validez"
                      type="number"
                      className={`input${erroresCampo.validezDias ? ' input-error' : ''}`}
                      min="1"
                      max="365"
                      step="1"
                      value={form.validezDias}
                      onChange={(event) => actualizarForm('validezDias', event.target.value)}
                    />
                    {erroresCampo.validezDias ? (
                      <span className="field-error">{erroresCampo.validezDias}</span>
                    ) : (
                      <span className="hint">Por defecto 15 días calendario.</span>
                    )}
                  </div>
                  <div className="field">
                    <label htmlFor="garantia">Garantía (meses)</label>
                    <input
                      id="garantia"
                      type="number"
                      className={`input${erroresCampo.garantiaMeses ? ' input-error' : ''}`}
                      min="0"
                      max="120"
                      step="1"
                      value={form.garantiaMeses}
                      onChange={(event) => actualizarForm('garantiaMeses', event.target.value)}
                    />
                    {erroresCampo.garantiaMeses ? (
                      <span className="field-error">{erroresCampo.garantiaMeses}</span>
                    ) : (
                      <span className="hint">Por defecto 12 meses.</span>
                    )}
                  </div>
                  <div className="field">
                    <span className="label-text">Moneda</span>
                    <div className="readonly-field">
                      <span>COP</span>
                      <small>Peso colombiano · catálogo en COP</small>
                    </div>
                  </div>
                  <div className="field">
                    <label htmlFor="forma-pago">Forma de pago</label>
                    <input
                      id="forma-pago"
                      type="text"
                      className="input"
                      value={form.formaPago}
                      onChange={(event) => actualizarForm('formaPago', event.target.value)}
                    />
                  </div>
                  <div className="field span-2">
                    <label htmlFor="plazo-entrega">Plazo de entrega</label>
                    <input
                      id="plazo-entrega"
                      type="text"
                      className="input"
                      value={form.plazoEntrega}
                      onChange={(event) => actualizarForm('plazoEntrega', event.target.value)}
                    />
                  </div>
                  <div className="field span-2">
                    <label htmlFor="lugar-entrega">Lugar de entrega</label>
                    <input
                      id="lugar-entrega"
                      type="text"
                      className="input"
                      value={form.lugarEntrega}
                      onChange={(event) => actualizarForm('lugarEntrega', event.target.value)}
                      placeholder="Dirección y ciudad de entrega"
                    />
                  </div>
                  <div className="field span-2">
                    <label htmlFor="observaciones">Observaciones</label>
                    <textarea
                      id="observaciones"
                      className="textarea"
                      rows={4}
                      value={form.observaciones}
                      onChange={(event) => actualizarForm('observaciones', event.target.value)}
                      placeholder="Alcance, instalación, capacitación u otras notas de la oferta"
                    />
                  </div>
                </div>
              </div>
            </section>
          </div>

          <aside className="quote-aside">
            {errorGuardar ? (
              <Aviso
                tone="error"
                title={errorGuardar.title}
                onClose={() => setErrorGuardar(null)}
              >
                <p>{errorGuardar.detail}</p>
                {errorGuardar.errores ? (
                  <ul className="error-list">
                    {Object.entries(errorGuardar.errores).map(([campo, mensaje]) => (
                      <li key={campo}>
                        <strong>{campo}:</strong> {mensaje}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </Aviso>
            ) : null}

            <section className="card summary-card" aria-labelledby="resumen-titulo">
              <div className="card-head">
                <div>
                  <h2 id="resumen-titulo">Resumen de la oferta</h2>
                  <p>
                    {lineas.length} {lineas.length === 1 ? 'línea' : 'líneas'} ·{' '}
                    {cliente ? cliente.razonSocial : 'Sin cliente'}
                  </p>
                </div>
              </div>
              <div className="summary-body">
                <div className="totals-row">
                  <span>Subtotal</span>
                  <span>{formatMoney(totales.subtotal, 'COP')}</span>
                </div>
                <div className="totals-row">
                  <span>IVA</span>
                  <span>{formatMoney(totales.iva, 'COP')}</span>
                </div>
                <div className="totals-final">
                  <span className="totals-final-label">Total</span>
                  <span className="totals-final-value">{formatMoney(totales.total, 'COP')}</span>
                </div>
                <p className="totals-note">
                  Las retenciones de ley (retefuente, reteIVA y reteICA) se calculan
                  automáticamente en el servidor al guardar la cotización.
                </p>
                <button type="submit" className="btn btn-primary btn-block" disabled={guardando}>
                  {guardando ? 'Creando cotización…' : 'Crear cotización'}
                </button>
                <Link to="/cotizaciones" className="btn btn-ghost btn-block">
                  Cancelar
                </Link>
              </div>
            </section>

            <section className="card card-pad summary-help">
              <h2>Antes de guardar</h2>
              <ul>
                <li>El cliente debe estar activo y con sus datos tributarios completos.</li>
                <li>Los ítems con registro sanitario vencido no se pueden incluir.</li>
                <li>El checklist regulatorio se copia automáticamente a la nueva oferta.</li>
              </ul>
            </section>
          </aside>
        </form>
      ) : null}
    </>
  )
}

import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api.js'
import { useApi } from '../hooks/useApi.js'
import { TIPOS_PRODUCTO, tipoMeta } from '../domain.js'
import { formatMoney, formatPercent, normalizar } from '../format.js'
import PageHeader from '../components/PageHeader.jsx'
import RegistroBadge from '../components/RegistroBadge.jsx'
import ProductoImagen from '../components/ProductoImagen.jsx'
import Icon from '../components/Icon.jsx'
import { EmptyState, ErrorState, Loading } from '../components/States.jsx'

export default function Productos() {
  const { data, loading, error, reload } = useApi(() => api.productos({ moneda: 'COP' }), [])
  const [busqueda, setBusqueda] = useState('')
  const [tipoFiltro, setTipoFiltro] = useState('todos')

  const productos = data || []

  const conteos = useMemo(() => {
    const base = { todos: productos.length, vencidos: 0, porVencer: 0 }
    TIPOS_PRODUCTO.forEach((tipo) => {
      base[tipo.value] = 0
    })
    productos.forEach((producto) => {
      base[producto.tipo] = (base[producto.tipo] || 0) + 1
      if (producto.estadoRegistro === 'vencido') base.vencidos += 1
      if (producto.estadoRegistro === 'por_vencer') base.porVencer += 1
    })
    return base
  }, [productos])

  const filtrados = useMemo(() => {
    const termino = normalizar(busqueda)
    return productos.filter((producto) => {
      if (tipoFiltro !== 'todos' && producto.tipo !== tipoFiltro) return false
      if (!termino) return true
      return [producto.sku, producto.nombre, producto.marca, producto.modelo, producto.descripcion]
        .map(normalizar)
        .some((valor) => valor.includes(termino))
    })
  }, [productos, tipoFiltro, busqueda])

  const hayFiltros = tipoFiltro !== 'todos' || busqueda.trim() !== ''

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
        eyebrow="Catálogo comercial"
        title="Productos y servicios"
        subtitle="Equipos, reactivos, consumibles, software y servicios de secuenciación con su estado regulatorio."
        actions={acciones}
      />

      {loading && !data ? <Loading label="Cargando catálogo…" /> : null}
      {error && !data ? <ErrorState error={error} onRetry={reload} /> : null}

      {data ? (
        <section className="card" aria-labelledby="catalogo-titulo">
          <div className="toolbar">
            <div className="search">
              <Icon name="search" size={16} />
              <input
                type="search"
                className="input"
                placeholder="Buscar por SKU, nombre, marca o modelo"
                value={busqueda}
                onChange={(event) => setBusqueda(event.target.value)}
                aria-label="Buscar productos"
              />
            </div>
            <div className="toolbar-spacer" />
            <div className="catalog-counters" aria-live="polite">
              <span>{filtrados.length} de {productos.length} productos</span>
              {conteos.porVencer > 0 ? (
                <span className="text-warn">{conteos.porVencer} por vencer</span>
              ) : null}
              {conteos.vencidos > 0 ? (
                <span className="text-danger">{conteos.vencidos} vencido(s)</span>
              ) : null}
            </div>
          </div>

          <div className="chips-bar" role="group" aria-label="Filtrar por tipo de producto">
            <button
              type="button"
              className={`chip${tipoFiltro === 'todos' ? ' active' : ''}`}
              onClick={() => setTipoFiltro('todos')}
              aria-pressed={tipoFiltro === 'todos'}
            >
              Todos
              <span className="chip-count">{conteos.todos}</span>
            </button>
            {TIPOS_PRODUCTO.map((tipo) => (
              <button
                key={tipo.value}
                type="button"
                className={`chip${tipoFiltro === tipo.value ? ' active' : ''}`}
                onClick={() => setTipoFiltro(tipo.value)}
                aria-pressed={tipoFiltro === tipo.value}
              >
                {tipo.label}
                <span className="chip-count">{conteos[tipo.value] || 0}</span>
              </button>
            ))}
          </div>

          {filtrados.length > 0 ? (
            <div className="product-grid">
              {filtrados.map((producto) => {
                const vencido = producto.estadoRegistro === 'vencido'
                return (
                  <article
                    className={`product-card${vencido ? ' product-card-vencido' : ''}`}
                    key={producto.id}
                  >
                    <ProductoImagen producto={producto} className="product-img-card" size={28} />
                    <div className="product-top">
                      <span className="mono product-sku">{producto.sku}</span>
                      <span className="badge badge-neutral badge-sm">
                        {tipoMeta(producto.tipo).label}
                      </span>
                    </div>
                    <h3>{producto.nombre}</h3>
                    <p className="product-meta">
                      {producto.marca}
                      {producto.modelo ? ` · ${producto.modelo}` : ''}
                      {producto.referenciaFabricante
                        ? ` · Ref. ${producto.referenciaFabricante}`
                        : ''}
                    </p>
                    {producto.descripcion ? (
                      <p className="product-description">{producto.descripcion}</p>
                    ) : null}

                    <div className="product-tags">
                      <span className="tag">IVA {formatPercent(producto.ivaPct)}</span>
                      <span className="tag">{producto.unidadMedida || 'unidad'}</span>
                      {producto.requiereCadenaFrio ? (
                        <span className="tag">Cadena de frío</span>
                      ) : null}
                      {producto.esIvd ? <span className="tag">IVD</span> : null}
                    </div>

                    <div className="product-reg">
                      <RegistroBadge
                        estado={producto.estadoRegistro}
                        numero={producto.numeroRegistro}
                        vence={producto.registroVence}
                      />
                    </div>

                    <div className="product-price">
                      <span>Precio COP</span>
                      <strong>
                        {producto.precio === null || producto.precio === undefined
                          ? 'Sin precio'
                          : formatMoney(producto.precio, producto.moneda || 'COP')}
                      </strong>
                    </div>
                  </article>
                )
              })}
            </div>
          ) : (
            <div className="card-pad">
              <EmptyState
                icon="box"
                title="No hay productos con estos criterios"
                message={
                  hayFiltros
                    ? 'Prueba con otro tipo o término de búsqueda.'
                    : 'El catálogo está vacío.'
                }
                action={
                  hayFiltros ? (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        setBusqueda('')
                        setTipoFiltro('todos')
                      }}
                    >
                      Limpiar filtros
                    </button>
                  ) : null
                }
              />
            </div>
          )}
        </section>
      ) : null}
    </>
  )
}

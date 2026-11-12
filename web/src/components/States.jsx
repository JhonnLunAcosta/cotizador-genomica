import Icon from './Icon.jsx'

export function Loading({ label = 'Cargando información…' }) {
  return (
    <div className="state-panel" role="status" aria-live="polite">
      <span className="spinner" aria-hidden="true" />
      <p>{label}</p>
    </div>
  )
}

export function EmptyState({ title = 'Sin información', message, action, icon = 'file' }) {
  return (
    <div className="state-panel">
      <span className="state-icon">
        <Icon name={icon} size={22} />
      </span>
      <h2>{title}</h2>
      {message ? <p>{message}</p> : null}
      {action}
    </div>
  )
}

export function ErrorState({ error, onRetry, title }) {
  const listaErrores = error?.errores ? Object.entries(error.errores) : []
  return (
    <div className="state-panel state-error" role="alert">
      <span className="state-icon state-icon-error">
        <Icon name="alert" size={22} />
      </span>
      <h2>{title || error?.title || 'No fue posible cargar la información'}</h2>
      <p>{error?.detail || error?.message || 'Ocurrió un error inesperado.'}</p>
      {listaErrores.length > 0 ? (
        <ul className="error-list">
          {listaErrores.map(([campo, mensaje]) => (
            <li key={campo}>
              <strong>{campo}:</strong> {mensaje}
            </li>
          ))}
        </ul>
      ) : null}
      {onRetry ? (
        <button type="button" className="btn btn-secondary btn-sm" onClick={onRetry}>
          <Icon name="refresh" size={15} />
          Reintentar
        </button>
      ) : null}
    </div>
  )
}

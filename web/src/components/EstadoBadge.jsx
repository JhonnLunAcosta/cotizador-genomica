import { estadoMeta } from '../domain.js'

export default function EstadoBadge({ estado, efectivo, small = false }) {
  const meta = estadoMeta(estado)
  const vencidaPorFecha = efectivo === 'vencida' && estado !== 'vencida'
  return (
    <span className="badge-group">
      <span className={`badge badge-${meta.tone}${small ? ' badge-sm' : ''}`}>
        <span className="badge-dot" aria-hidden="true" />
        {meta.label}
      </span>
      {vencidaPorFecha ? (
        <span className="badge-note">Vencida por fecha</span>
      ) : null}
    </span>
  )
}

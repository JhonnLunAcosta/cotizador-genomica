import { formatDate } from '../format.js'
import { registroMeta } from '../domain.js'

export default function RegistroBadge({ estado, numero, vence, showDetail = true }) {
  const meta = registroMeta(estado)
  return (
    <div className="registro">
      <span className={`badge badge-${meta.tone} badge-sm`}>
        <span className="badge-dot" aria-hidden="true" />
        {meta.label}
      </span>
      {showDetail && numero ? <span className="registro-num">{numero}</span> : null}
      {showDetail && vence ? <span className="registro-fecha">Vence {formatDate(vence)}</span> : null}
    </div>
  )
}

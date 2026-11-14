import { Link } from 'react-router-dom'
import Icon from '../components/Icon.jsx'

export default function NoEncontrada() {
  return (
    <div className="state-panel not-found">
      <span className="state-icon">
        <Icon name="search" size={22} />
      </span>
      <h2>Página no encontrada</h2>
      <p>La ruta solicitada no existe en el cotizador.</p>
      <Link to="/" className="btn btn-primary btn-sm">
        Volver al tablero
      </Link>
    </div>
  )
}

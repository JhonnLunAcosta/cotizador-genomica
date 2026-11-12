import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import Icon from './Icon.jsx'
import ChatAsistente from './ChatAsistente.jsx'
import CambiarPassword from './CambiarPassword.jsx'
import { useAuth } from '../auth/AuthContext.jsx'

const NAVEGACION = [
  { to: '/', label: 'Tablero', icon: 'grid', end: true },
  { to: '/cotizaciones', label: 'Cotizaciones', icon: 'file' },
  { to: '/clientes', label: 'Clientes', icon: 'users' },
  { to: '/productos', label: 'Catálogo', icon: 'box' },
]

function iniciales(nombre = '') {
  return nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0])
    .join('')
    .toUpperCase()
}

export default function Layout() {
  const { usuario, cerrarSesion } = useAuth()
  const [menuAbierto, setMenuAbierto] = useState(false)
  const [menuCuenta, setMenuCuenta] = useState(false)
  const [modalClave, setModalClave] = useState(false)
  const cuentaRef = useRef(null)

  useEffect(() => {
    if (!menuCuenta) return undefined
    const alClic = (event) => {
      if (!cuentaRef.current?.contains(event.target)) setMenuCuenta(false)
    }
    document.addEventListener('mousedown', alClic)
    return () => document.removeEventListener('mousedown', alClic)
  }, [menuCuenta])

  return (
    <div className={`app-shell${menuAbierto ? ' nav-abierta' : ''}`}>
      <button
        type="button"
        className="nav-veil"
        aria-label="Cerrar menú"
        onClick={() => setMenuAbierto(false)}
      />

      <aside className="sidebar">
        <Link to="/" className="brand" aria-label="Genómica Andina, ir al tablero">
          <span className="brand-mark">
            <Icon name="dna" size={25} />
          </span>
          <span className="brand-text">
            <strong>Genómica Andina</strong>
            <small>Cotizador comercial</small>
          </span>
        </Link>

        <nav className="nav" aria-label="Navegación principal">
          {NAVEGACION.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => (isActive ? 'active' : undefined)}
              onClick={() => setMenuAbierto(false)}
            >
              <Icon name={item.icon} size={17} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <p className="sidebar-kicker">Operación Colombia</p>
          <p className="sidebar-line">Precios en COP · IVA discriminado</p>
          <p className="sidebar-muted">Soporte regulatorio INVIMA, tributario y de datos.</p>
        </div>

        {usuario ? (
          <div className="cuenta" ref={cuentaRef}>
            <button
              type="button"
              className="cuenta-boton"
              onClick={() => setMenuCuenta((valor) => !valor)}
              aria-expanded={menuCuenta}
            >
              <span className="cuenta-avatar">{iniciales(usuario.nombre)}</span>
              <span className="cuenta-datos">
                <strong>{usuario.nombre}</strong>
                <small>{usuario.rol === 'admin' ? 'Administrador' : 'Comercial'}</small>
              </span>
              <Icon name="chevronRight" size={15} className="cuenta-flecha" />
            </button>

            {menuCuenta ? (
              <div className="cuenta-menu">
                <button
                  type="button"
                  onClick={() => {
                    setMenuCuenta(false)
                    setModalClave(true)
                  }}
                >
                  <Icon name="key" size={16} />
                  Cambiar contraseña
                </button>
                <button type="button" className="cuenta-salir" onClick={cerrarSesion}>
                  <Icon name="logout" size={16} />
                  Cerrar sesión
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
      </aside>

      <main className="main">
        <div className="topbar">
          <button
            type="button"
            className="icon-btn topbar-menu"
            onClick={() => setMenuAbierto(true)}
            aria-label="Abrir menú"
          >
            <Icon name="menu" size={20} />
          </button>
          <span className="topbar-title">Cotizador Genómica Andina</span>
          {usuario ? <span className="topbar-user">{usuario.email}</span> : null}
        </div>

        {usuario?.debeCambiarPassword ? (
          <button type="button" className="aviso-clave" onClick={() => setModalClave(true)}>
            <Icon name="shield" size={16} />
            <span>Estás usando una contraseña temporal. Cámbiala para proteger tu cuenta.</span>
            <strong>Cambiar ahora</strong>
          </button>
        ) : null}

        <Outlet />
        <footer className="app-footer">
          <span>Genómica Andina S.A.S.</span>
          <span>Cotizador de equipos, reactivos y servicios de secuenciación</span>
        </footer>
      </main>

      <ChatAsistente />
      <CambiarPassword open={modalClave} onClose={() => setModalClave(false)} />
    </div>
  )
}

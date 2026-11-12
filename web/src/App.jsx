import { Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './auth/AuthContext.jsx'
import Layout from './components/Layout.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Cotizaciones from './pages/Cotizaciones.jsx'
import CotizacionDetalle from './pages/CotizacionDetalle.jsx'
import NuevaCotizacion from './pages/NuevaCotizacion.jsx'
import Clientes from './pages/Clientes.jsx'
import Productos from './pages/Productos.jsx'
import NoEncontrada from './pages/NoEncontrada.jsx'
import Login from './pages/Login.jsx'

function PantallaCarga() {
  return (
    <div className="auth-cargando" role="status" aria-live="polite">
      <span className="auth-cargando-marca">
        <span className="brand-mark">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 3c0 6 14 12 14 18" />
            <path d="M19 3c0 6-14 12-14 18" />
            <path d="M7 6h10M8 10h8M8 14h8M7 18h10" />
          </svg>
        </span>
        <strong>Genómica Andina</strong>
      </span>
      <span className="spinner" aria-hidden="true" />
      <p>Verificando sesión…</p>
    </div>
  )
}

function Contenido() {
  const { estado } = useAuth()

  if (estado === 'cargando') return <PantallaCarga />
  if (estado === 'anonimo') return <Login />

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="cotizaciones" element={<Cotizaciones />} />
        <Route path="cotizaciones/nueva" element={<NuevaCotizacion />} />
        <Route path="cotizaciones/:numero" element={<CotizacionDetalle />} />
        <Route path="clientes" element={<Clientes />} />
        <Route path="productos" element={<Productos />} />
        <Route path="*" element={<NoEncontrada />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Contenido />
    </AuthProvider>
  )
}

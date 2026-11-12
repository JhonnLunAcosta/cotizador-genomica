import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api } from '../api.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null)
  const [estado, setEstado] = useState('cargando')

  const refrescar = useCallback(async () => {
    try {
      const sesion = await api.auth.sesion()
      setUsuario(sesion)
      setEstado('autenticado')
      return sesion
    } catch (error) {
      if (error?.status === 401) {
        setUsuario(null)
        setEstado('anonimo')
      } else {
        // Sin conexión: no se puede confirmar la sesión, se muestra el login con aviso.
        setUsuario(null)
        setEstado('anonimo')
      }
      return null
    }
  }, [])

  useEffect(() => {
    refrescar()
    const alExpirar = () => {
      setUsuario(null)
      setEstado('anonimo')
    }
    window.addEventListener('cotizador:sesion-expirada', alExpirar)
    return () => window.removeEventListener('cotizador:sesion-expirada', alExpirar)
  }, [refrescar])

  const iniciarSesion = useCallback(async (email, password) => {
    const sesion = await api.auth.login(email, password)
    setUsuario(sesion)
    setEstado('autenticado')
    return sesion
  }, [])

  const cerrarSesion = useCallback(async () => {
    try {
      await api.auth.logout()
    } catch {
      // Si el servidor no responde, igual se limpia la sesión local.
    }
    setUsuario(null)
    setEstado('anonimo')
  }, [])

  const valor = useMemo(
    () => ({ usuario, estado, iniciarSesion, cerrarSesion, refrescar, setUsuario }),
    [usuario, estado, iniciarSesion, cerrarSesion, refrescar],
  )

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const contexto = useContext(AuthContext)
  if (!contexto) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return contexto
}

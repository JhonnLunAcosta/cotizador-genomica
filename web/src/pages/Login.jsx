import { useEffect, useState } from 'react'
import Icon from '../components/Icon.jsx'
import { useAuth } from '../auth/AuthContext.jsx'

export default function Login() {
  const { iniciarSesion } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [verClave, setVerClave] = useState(false)
  const [error, setError] = useState(null)
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    document.title = 'Ingresar · Cotizador Genómica Andina'
    return () => {
      document.title = 'Cotizador · Genómica Andina'
    }
  }, [])

  const enviar = async (event) => {
    event.preventDefault()
    if (enviando) return
    setError(null)
    setEnviando(true)
    try {
      await iniciarSesion(email.trim(), password)
    } catch (fallo) {
      setError(fallo)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="auth-screen">
      <section className="auth-pitch" aria-hidden="true">
        <div className="auth-brand">
          <span className="brand-mark auth-brand-mark">
            <Icon name="dna" size={26} />
          </span>
          <span className="brand-text">
            <strong>Genómica Andina</strong>
            <small>Cotizador comercial</small>
          </span>
        </div>

        <div className="auth-copy">
          <p className="auth-eyebrow">Plataforma interna</p>
          <h1>Cotiza equipos, reactivos y servicios de secuenciación con precisión.</h1>
          <p>
            Precios en COP, IVA discriminado, retenciones y checklist regulatorio INVIMA en un
            solo flujo. El asistente de IA conoce tu catálogo y te ayuda a armar la oferta.
          </p>
        </div>

        <ul className="auth-puntos">
          <li>
            <Icon name="check" size={16} /> Catálogo con registro sanitario y alertas de
            vencimiento
          </li>
          <li>
            <Icon name="check" size={16} /> PDF corporativo listo para enviar al cliente
          </li>
          <li>
            <Icon name="check" size={16} /> Asistente comercial con IA integrado
          </li>
        </ul>
      </section>

      <section className="auth-panel">
        <form className="auth-card" onSubmit={enviar} noValidate>
          <header>
            <p className="auth-eyebrow">Bienvenido de nuevo</p>
            <h2>Inicia sesión</h2>
            <p className="auth-sub">Usa las credenciales asignadas por el administrador.</p>
          </header>

          {error ? (
            <div className="auth-alerta" role="alert">
              <Icon name="alert" size={17} />
              <div>
                <strong>{error.title}</strong>
                <span>{error.detail}</span>
              </div>
            </div>
          ) : null}

          <label className="field">
            <span>Correo corporativo</span>
            <div className="input-icon">
              <Icon name="mail" size={17} />
              <input
                type="email"
                name="email"
                autoComplete="username"
                inputMode="email"
                placeholder="nombre@genomicaandina.co"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                autoFocus
              />
            </div>
          </label>

          <label className="field">
            <span>Contraseña</span>
            <div className="input-icon">
              <Icon name="lock" size={17} />
              <input
                type={verClave ? 'text' : 'password'}
                name="password"
                autoComplete="current-password"
                placeholder="Tu contraseña"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
              <button
                type="button"
                className="input-suffix"
                onClick={() => setVerClave((valor) => !valor)}
                aria-label={verClave ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                <Icon name={verClave ? 'eye-off' : 'eye'} size={17} />
              </button>
            </div>
          </label>

          <button
            type="submit"
            className="btn btn-primary auth-submit"
            disabled={enviando || !email.trim() || !password}
          >
            {enviando ? <span className="spinner spinner-light" aria-hidden="true" /> : null}
            {enviando ? 'Verificando…' : 'Entrar al cotizador'}
          </button>

          <p className="auth-legal">
            Acceso restringido. Si olvidaste tu contraseña o no tienes cuenta, escribe a{' '}
            <a href="mailto:datos@genomicaandina.co">datos@genomicaandina.co</a>.
          </p>
        </form>
      </section>
    </div>
  )
}

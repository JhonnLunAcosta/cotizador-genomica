import { useEffect, useState } from 'react'
import Modal from './Modal.jsx'
import Icon from './Icon.jsx'
import { api } from '../api.js'
import { useAuth } from '../auth/AuthContext.jsx'

function validar(actual, nueva, confirmar, email) {
  const errores = {}
  if (!actual) errores.actual = 'Escribe tu contraseña actual.'
  if (nueva.length < 10) errores.nueva = 'Debe tener al menos 10 caracteres.'
  else if (new TextEncoder().encode(nueva).length > 72) errores.nueva = 'No puede superar 72 bytes.'
  else if (!/[A-Za-zÁÉÍÓÚáéíóúÑñ]/.test(nueva) || !/\d/.test(nueva))
    errores.nueva = 'Debe incluir al menos una letra y un número.'
  else if (/(1234|12345|password|qwerty|admin|genomica)/i.test(nueva))
    errores.nueva = 'Es demasiado predecible. Elige otra.'
  else {
    const usuario = (email || '').split('@')[0].toLowerCase()
    if (usuario.length >= 4 && nueva.toLowerCase().includes(usuario))
      errores.nueva = 'No puede contener tu correo.'
    else if (nueva === actual) errores.nueva = 'Debe ser diferente a la actual.'
  }
  if (nueva !== confirmar) errores.confirmar = 'Las contraseñas no coinciden.'
  return errores
}

export default function CambiarPassword({ open, onClose }) {
  const { usuario, refrescar } = useAuth()
  const [actual, setActual] = useState('')
  const [nueva, setNueva] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [errores, setErrores] = useState({})
  const [error, setError] = useState(null)
  const [listo, setListo] = useState(false)
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    if (!open) return
    setActual('')
    setNueva('')
    setConfirmar('')
    setErrores({})
    setError(null)
    setListo(false)
  }, [open])

  const enviar = async (event) => {
    event.preventDefault()
    setError(null)
    const fallos = validar(actual, nueva, confirmar, usuario?.email)
    setErrores(fallos)
    if (Object.keys(fallos).length > 0) return

    setEnviando(true)
    try {
      await api.auth.cambiarPassword(actual, nueva)
      setListo(true)
      await refrescar()
      setTimeout(() => onClose?.(), 1400)
    } catch (fallo) {
      setError(fallo)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={enviando ? () => {} : onClose}
      title="Cambiar contraseña"
      subtitle="Por seguridad, define una contraseña propia antes de continuar."
    >
      {listo ? (
        <div className="auth-exito" role="status">
          <span className="state-icon state-icon-ok">
            <Icon name="check" size={20} />
          </span>
          <div>
            <strong>Contraseña actualizada</strong>
            <p>Tu nueva contraseña ya está activa.</p>
          </div>
        </div>
      ) : (
        <form className="form-grid" onSubmit={enviar} noValidate>
          {error ? (
            <div className="auth-alerta form-full" role="alert">
              <Icon name="alert" size={17} />
              <div>
                <strong>{error.title}</strong>
                <span>{error.detail}</span>
              </div>
            </div>
          ) : null}

          <label className="field form-full">
            <span>Contraseña actual</span>
            <input
              type="password"
              autoComplete="current-password"
              value={actual}
              onChange={(event) => setActual(event.target.value)}
              className={`input${errores.actual ? ' input-error' : ''}`}
              autoFocus
            />
            {errores.actual ? <small className="field-error">{errores.actual}</small> : null}
          </label>

          <label className="field">
            <span>Nueva contraseña</span>
            <input
              type="password"
              autoComplete="new-password"
              value={nueva}
              onChange={(event) => setNueva(event.target.value)}
              className={`input${errores.nueva ? ' input-error' : ''}`}
            />
            {errores.nueva ? <small className="field-error">{errores.nueva}</small> : null}
          </label>

          <label className="field">
            <span>Confirmar nueva contraseña</span>
            <input
              type="password"
              autoComplete="new-password"
              value={confirmar}
              onChange={(event) => setConfirmar(event.target.value)}
              className={`input${errores.confirmar ? ' input-error' : ''}`}
            />
            {errores.confirmar ? <small className="field-error">{errores.confirmar}</small> : null}
          </label>

          <ul className="password-hint form-full">
            <li>Mínimo 10 caracteres</li>
            <li>Al menos una letra y un número</li>
            <li>Sin datos predecibles ni tu correo</li>
          </ul>

          <div className="form-actions form-full">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={enviando}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={enviando}>
              {enviando ? <span className="spinner spinner-light" aria-hidden="true" /> : null}
              {enviando ? 'Guardando…' : 'Guardar contraseña'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  )
}

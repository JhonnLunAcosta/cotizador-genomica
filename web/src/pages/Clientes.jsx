import { useEffect, useMemo, useState } from 'react'
import { api } from '../api.js'
import { useApi } from '../hooks/useApi.js'
import {
  REGIMENES,
  TIPOS_CLIENTE,
  TIPOS_DOCUMENTO,
  etiquetaRegimen,
  etiquetaTipoCliente,
} from '../domain.js'
import { formatDate, normalizar } from '../format.js'
import PageHeader from '../components/PageHeader.jsx'
import Icon from '../components/Icon.jsx'
import Modal from '../components/Modal.jsx'
import Aviso from '../components/Aviso.jsx'
import { EmptyState, ErrorState, Loading } from '../components/States.jsx'

const FORMULARIO_INICIAL = {
  tipoDocumento: 'NIT',
  numeroDocumento: '',
  digitoVerificacion: '',
  razonSocial: '',
  nombreComercial: '',
  tipoPersona: 'juridica',
  tipoCliente: 'laboratorio',
  regimenTributario: 'responsable_iva',
  responsabilidadTributaria: '',
  actividadEconomica: '',
  codigoHabilitacion: '',
  direccion: '',
  ciudad: '',
  departamento: '',
  telefono: '',
  email: '',
  autorizaDatos: false,
  notas: '',
}

const OBLIGATORIOS = {
  numeroDocumento: 'El número de documento es obligatorio.',
  razonSocial: 'La razón social es obligatoria.',
  direccion: 'La dirección es obligatoria.',
  ciudad: 'La ciudad es obligatoria.',
  departamento: 'El departamento es obligatorio.',
}

export default function Clientes() {
  const { data, loading, error, reload } = useApi(() => api.clientes(), [])
  const [busqueda, setBusqueda] = useState('')
  const [modalAbierto, setModalAbierto] = useState(false)
  const [formulario, setFormulario] = useState({ ...FORMULARIO_INICIAL })
  const [errores, setErrores] = useState({})
  const [errorApi, setErrorApi] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [aviso, setAviso] = useState(null)

  const clientes = data || []

  const filtrados = useMemo(() => {
    const termino = normalizar(busqueda)
    if (!termino) return clientes
    return clientes.filter((cliente) =>
      [
        cliente.razonSocial,
        cliente.nombreComercial,
        cliente.numeroDocumento,
        cliente.ciudad,
        cliente.email,
        cliente.codigoHabilitacion,
      ]
        .map(normalizar)
        .some((valor) => valor.includes(termino)),
    )
  }, [clientes, busqueda])

  useEffect(() => {
    if (!aviso) return undefined
    const temporizador = setTimeout(() => setAviso(null), 6000)
    return () => clearTimeout(temporizador)
  }, [aviso])

  function abrirModal() {
    setFormulario({ ...FORMULARIO_INICIAL })
    setErrores({})
    setErrorApi(null)
    setModalAbierto(true)
  }

  function cerrarModal() {
    if (guardando) return
    setModalAbierto(false)
    setErrorApi(null)
    setErrores({})
  }

  function actualizar(campo, valor) {
    setFormulario((previo) => ({ ...previo, [campo]: valor }))
    setErrores((previos) => ({ ...previos, [campo]: undefined }))
  }

  function validar() {
    const encontrados = {}
    Object.entries(OBLIGATORIOS).forEach(([campo, mensaje]) => {
      if (!String(formulario[campo] ?? '').trim()) encontrados[campo] = mensaje
    })
    if (formulario.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formulario.email.trim())) {
      encontrados.email = 'El correo no tiene un formato válido.'
    }
    return encontrados
  }

  async function guardar(event) {
    event.preventDefault()
    setErrorApi(null)
    const encontrados = validar()
    setErrores(encontrados)
    if (Object.keys(encontrados).length > 0) {
      setErrorApi({
        title: 'Revisa los campos',
        detail: 'Completa la información obligatoria antes de guardar.',
      })
      return
    }

    setGuardando(true)
    try {
      const payload = {
        tipoDocumento: formulario.tipoDocumento,
        numeroDocumento: formulario.numeroDocumento.trim(),
        digitoVerificacion: formulario.digitoVerificacion.trim() || undefined,
        razonSocial: formulario.razonSocial.trim(),
        nombreComercial: formulario.nombreComercial.trim() || undefined,
        tipoPersona: formulario.tipoPersona,
        tipoCliente: formulario.tipoCliente,
        regimenTributario: formulario.regimenTributario,
        responsabilidadTributaria: formulario.responsabilidadTributaria.trim() || undefined,
        actividadEconomica: formulario.actividadEconomica.trim() || undefined,
        codigoHabilitacion: formulario.codigoHabilitacion.trim() || undefined,
        direccion: formulario.direccion.trim(),
        ciudad: formulario.ciudad.trim(),
        departamento: formulario.departamento.trim(),
        telefono: formulario.telefono.trim() || undefined,
        email: formulario.email.trim() || undefined,
        autorizaDatos: Boolean(formulario.autorizaDatos),
        notas: formulario.notas.trim() || undefined,
      }
      const creado = await api.crearCliente(payload)
      setModalAbierto(false)
      setFormulario({ ...FORMULARIO_INICIAL })
      setAviso({
        tone: 'success',
        title: 'Cliente creado',
        text: `${creado.razonSocial} quedó registrado con el documento ${creado.tipoDocumento} ${creado.numeroDocumento}.`,
      })
      reload()
    } catch (fallo) {
      setErrorApi({
        title: fallo.title,
        detail: fallo.detail,
        errores: fallo.errores,
      })
    } finally {
      setGuardando(false)
    }
  }

  const acciones = (
    <>
      <button type="button" className="btn btn-secondary" onClick={reload} disabled={loading}>
        <Icon name="refresh" size={16} />
        Actualizar
      </button>
      <button type="button" className="btn btn-primary" onClick={abrirModal}>
        <Icon name="plus" size={16} />
        Nuevo cliente
      </button>
    </>
  )

  return (
    <>
      <PageHeader
        eyebrow="Maestro de terceros"
        title="Clientes"
        subtitle="Laboratorios, clínicas, universidades y entidades del sector genómico."
        actions={acciones}
      />

      {aviso ? (
        <Aviso tone={aviso.tone} title={aviso.title} onClose={() => setAviso(null)}>
          {aviso.text}
        </Aviso>
      ) : null}

      {loading && !data ? <Loading label="Cargando clientes…" /> : null}
      {error && !data ? <ErrorState error={error} onRetry={reload} /> : null}

      {data ? (
        <section className="card" aria-labelledby="clientes-titulo">
          <div className="toolbar">
            <div className="search">
              <Icon name="search" size={16} />
              <input
                type="search"
                className="input"
                placeholder="Buscar por razón social, NIT, ciudad o correo"
                value={busqueda}
                onChange={(event) => setBusqueda(event.target.value)}
                aria-label="Buscar clientes"
              />
            </div>
            <div className="toolbar-spacer" />
            <span className="result-count" aria-live="polite">
              {filtrados.length} de {clientes.length} clientes
            </span>
          </div>

          {filtrados.length > 0 ? (
            <div className="table-wrap">
              <table className="table table-clientes">
                <thead>
                  <tr>
                    <th id="clientes-titulo">Cliente</th>
                    <th>Documento</th>
                    <th>Tipo</th>
                    <th>Ubicación</th>
                    <th>Habilitación</th>
                    <th>Contacto</th>
                    <th>Datos personales</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map((cliente) => (
                    <tr key={cliente.id}>
                      <td>
                        <span className="cell-strong">{cliente.razonSocial}</span>
                        {cliente.nombreComercial ? (
                          <span className="cell-sub">{cliente.nombreComercial}</span>
                        ) : null}
                      </td>
                      <td className="nowrap">
                        <span className="mono">
                          {cliente.tipoDocumento} {cliente.numeroDocumento}
                          {cliente.digitoVerificacion ? `-${cliente.digitoVerificacion}` : ''}
                        </span>
                      </td>
                      <td>
                        <span>{etiquetaTipoCliente(cliente.tipoCliente)}</span>
                        <span className="cell-sub">{etiquetaRegimen(cliente.regimenTributario)}</span>
                      </td>
                      <td>
                        <span>{cliente.ciudad}</span>
                        <span className="cell-sub">{cliente.departamento}</span>
                      </td>
                      <td>
                        <span className="mono">{cliente.codigoHabilitacion || '—'}</span>
                      </td>
                      <td>
                        <span className="cell-email">{cliente.email || '—'}</span>
                        <span className="cell-sub">{cliente.telefono || 'Sin teléfono'}</span>
                      </td>
                      <td>
                        {cliente.autorizaDatos ? (
                          <span className="badge badge-ok badge-sm">Autorizados</span>
                        ) : (
                          <span className="badge badge-warn badge-sm">Pendiente</span>
                        )}
                        {cliente.fechaAutorizacionDatos ? (
                          <span className="cell-sub">
                            {formatDate(cliente.fechaAutorizacionDatos)}
                          </span>
                        ) : null}
                      </td>
                      <td>
                        {cliente.activo ? (
                          <span className="badge badge-neutral badge-sm">
                            <span className="badge-dot" aria-hidden="true" />
                            Activo
                          </span>
                        ) : (
                          <span className="badge badge-danger badge-sm">Inactivo</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="card-pad">
              <EmptyState
                icon="users"
                title={busqueda ? 'No hay clientes que coincidan' : 'Aún no hay clientes'}
                message={
                  busqueda
                    ? 'Prueba con otro término de búsqueda.'
                    : 'Registra el primer cliente para poder crear cotizaciones.'
                }
                action={
                  busqueda ? (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setBusqueda('')}
                    >
                      Limpiar búsqueda
                    </button>
                  ) : (
                    <button type="button" className="btn btn-primary btn-sm" onClick={abrirModal}>
                      Nuevo cliente
                    </button>
                  )
                }
              />
            </div>
          )}
        </section>
      ) : null}

      <Modal
        open={modalAbierto}
        onClose={cerrarModal}
        title="Nuevo cliente"
        subtitle="Datos legales, tributarios y de habilitación del tercero."
        wide
      >
        <form onSubmit={guardar} noValidate>
          <div className="modal-body">
            {errorApi ? (
              <Aviso
                tone="error"
                title={errorApi.title}
                onClose={() => setErrorApi(null)}
              >
                <p>{errorApi.detail}</p>
                {errorApi.errores ? (
                  <ul className="error-list">
                    {Object.entries(errorApi.errores).map(([campo, mensaje]) => (
                      <li key={campo}>
                        <strong>{campo}:</strong> {mensaje}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </Aviso>
            ) : null}

            <div className="form-section-title">
              <h3>Identificación</h3>
              <p>Documento y razón social del cliente.</p>
            </div>
            <div className="form-grid">
              <div className="field">
                <label htmlFor="tipo-documento">Tipo de documento</label>
                <select
                  id="tipo-documento"
                  className="select"
                  value={formulario.tipoDocumento}
                  onChange={(event) => actualizar('tipoDocumento', event.target.value)}
                >
                  {TIPOS_DOCUMENTO.map((tipo) => (
                    <option key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="numero-documento">Número de documento *</label>
                <input
                  id="numero-documento"
                  className={`input${errores.numeroDocumento ? ' input-error' : ''}`}
                  value={formulario.numeroDocumento}
                  onChange={(event) => actualizar('numeroDocumento', event.target.value)}
                  placeholder="900123456"
                />
                {errores.numeroDocumento ? (
                  <span className="field-error">{errores.numeroDocumento}</span>
                ) : null}
              </div>
              <div className="field">
                <label htmlFor="digito">Dígito de verificación</label>
                <input
                  id="digito"
                  className="input"
                  value={formulario.digitoVerificacion}
                  onChange={(event) => actualizar('digitoVerificacion', event.target.value)}
                  maxLength={2}
                  placeholder="7"
                />
              </div>
              <div className="field">
                <label htmlFor="tipo-persona">Tipo de persona</label>
                <select
                  id="tipo-persona"
                  className="select"
                  value={formulario.tipoPersona}
                  onChange={(event) => actualizar('tipoPersona', event.target.value)}
                >
                  <option value="juridica">Jurídica</option>
                  <option value="natural">Natural</option>
                </select>
              </div>
              <div className="field span-2">
                <label htmlFor="razon-social">Razón social *</label>
                <input
                  id="razon-social"
                  className={`input${errores.razonSocial ? ' input-error' : ''}`}
                  value={formulario.razonSocial}
                  onChange={(event) => actualizar('razonSocial', event.target.value)}
                  placeholder="Nombre legal del cliente"
                />
                {errores.razonSocial ? (
                  <span className="field-error">{errores.razonSocial}</span>
                ) : null}
              </div>
              <div className="field span-2">
                <label htmlFor="nombre-comercial">Nombre comercial</label>
                <input
                  id="nombre-comercial"
                  className="input"
                  value={formulario.nombreComercial}
                  onChange={(event) => actualizar('nombreComercial', event.target.value)}
                />
              </div>
            </div>

            <div className="form-section-title">
              <h3>Ubicación y contacto</h3>
              <p>Dirección de entrega y canales de comunicación.</p>
            </div>
            <div className="form-grid">
              <div className="field span-2">
                <label htmlFor="direccion">Dirección *</label>
                <input
                  id="direccion"
                  className={`input${errores.direccion ? ' input-error' : ''}`}
                  value={formulario.direccion}
                  onChange={(event) => actualizar('direccion', event.target.value)}
                  placeholder="Calle 100 # 19-54"
                />
                {errores.direccion ? (
                  <span className="field-error">{errores.direccion}</span>
                ) : null}
              </div>
              <div className="field">
                <label htmlFor="ciudad">Ciudad *</label>
                <input
                  id="ciudad"
                  className={`input${errores.ciudad ? ' input-error' : ''}`}
                  value={formulario.ciudad}
                  onChange={(event) => actualizar('ciudad', event.target.value)}
                  placeholder="Bogotá D.C."
                />
                {errores.ciudad ? <span className="field-error">{errores.ciudad}</span> : null}
              </div>
              <div className="field">
                <label htmlFor="departamento">Departamento *</label>
                <input
                  id="departamento"
                  className={`input${errores.departamento ? ' input-error' : ''}`}
                  value={formulario.departamento}
                  onChange={(event) => actualizar('departamento', event.target.value)}
                  placeholder="Cundinamarca"
                />
                {errores.departamento ? (
                  <span className="field-error">{errores.departamento}</span>
                ) : null}
              </div>
              <div className="field">
                <label htmlFor="telefono">Teléfono</label>
                <input
                  id="telefono"
                  className="input"
                  value={formulario.telefono}
                  onChange={(event) => actualizar('telefono', event.target.value)}
                  placeholder="+57 601 555 1234"
                />
              </div>
              <div className="field">
                <label htmlFor="email">Correo electrónico</label>
                <input
                  id="email"
                  type="email"
                  className={`input${errores.email ? ' input-error' : ''}`}
                  value={formulario.email}
                  onChange={(event) => actualizar('email', event.target.value)}
                  placeholder="compras@entidad.co"
                />
                {errores.email ? <span className="field-error">{errores.email}</span> : null}
              </div>
            </div>

            <div className="form-section-title">
              <h3>Información comercial</h3>
              <p>Clasificación, régimen tributario y habilitación.</p>
            </div>
            <div className="form-grid">
              <div className="field">
                <label htmlFor="tipo-cliente">Tipo de cliente</label>
                <select
                  id="tipo-cliente"
                  className="select"
                  value={formulario.tipoCliente}
                  onChange={(event) => actualizar('tipoCliente', event.target.value)}
                >
                  {TIPOS_CLIENTE.map((tipo) => (
                    <option key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="regimen">Régimen tributario</label>
                <select
                  id="regimen"
                  className="select"
                  value={formulario.regimenTributario}
                  onChange={(event) => actualizar('regimenTributario', event.target.value)}
                >
                  {REGIMENES.map((regimen) => (
                    <option key={regimen.value} value={regimen.value}>
                      {regimen.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="responsabilidad">Responsabilidad tributaria</label>
                <input
                  id="responsabilidad"
                  className="input"
                  value={formulario.responsabilidadTributaria}
                  onChange={(event) => actualizar('responsabilidadTributaria', event.target.value)}
                  placeholder="O-13; O-15"
                />
              </div>
              <div className="field">
                <label htmlFor="actividad">Actividad económica (CIIU)</label>
                <input
                  id="actividad"
                  className="input"
                  value={formulario.actividadEconomica}
                  onChange={(event) => actualizar('actividadEconomica', event.target.value)}
                  placeholder="8691"
                />
              </div>
              <div className="field">
                <label htmlFor="habilitacion">Código de habilitación (REPS)</label>
                <input
                  id="habilitacion"
                  className="input"
                  value={formulario.codigoHabilitacion}
                  onChange={(event) => actualizar('codigoHabilitacion', event.target.value)}
                  placeholder="1100101234"
                />
              </div>
              <div className="field checkbox-field">
                <label htmlFor="autoriza-datos" className="checkbox-label">
                  <input
                    id="autoriza-datos"
                    type="checkbox"
                    checked={formulario.autorizaDatos}
                    onChange={(event) => actualizar('autorizaDatos', event.target.checked)}
                  />
                  <span>Autoriza el tratamiento de datos personales</span>
                </label>
                <span className="hint">Ley 1581 de 2012 y Decreto 1377 de 2013.</span>
              </div>
              <div className="field span-2">
                <label htmlFor="notas">Notas</label>
                <textarea
                  id="notas"
                  className="textarea"
                  rows={3}
                  value={formulario.notas}
                  onChange={(event) => actualizar('notas', event.target.value)}
                  placeholder="Condiciones especiales, contactos adicionales u observaciones"
                />
              </div>
            </div>
          </div>

          <div className="modal-foot">
            <button type="button" className="btn btn-ghost" onClick={cerrarModal} disabled={guardando}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={guardando}>
              {guardando ? 'Guardando…' : 'Guardar cliente'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  )
}

import Icon from './Icon.jsx'

export default function Aviso({ tone = 'success', title, children, onClose }) {
  return (
    <div className={`aviso ${tone}`} role={tone === 'error' ? 'alert' : 'status'}>
      <Icon name={tone === 'error' ? 'alert' : tone === 'info' ? 'clock' : 'check'} size={16} />
      <div className="aviso-text">
        {title ? <strong>{title}</strong> : null}
        {children ? <div className="aviso-body">{children}</div> : null}
      </div>
      {onClose ? (
        <button type="button" className="aviso-close" onClick={onClose} aria-label="Cerrar aviso">
          <Icon name="close" size={14} />
        </button>
      ) : null}
    </div>
  )
}

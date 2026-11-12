export default function PageHeader({ eyebrow, title, subtitle, actions, children }) {
  return (
    <header className="page-head">
      <div className="page-head-text">
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h1>{title}</h1>
        {subtitle ? <p className="page-subtitle">{subtitle}</p> : null}
        {children}
      </div>
      {actions ? <div className="page-actions">{actions}</div> : null}
    </header>
  )
}

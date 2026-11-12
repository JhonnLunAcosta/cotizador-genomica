export default function KpiCard({ label, value, hint, tone = 'accent', icon }) {
  return (
    <article className={`kpi kpi-${tone}`}>
      <div className="kpi-top">
        <p className="kpi-label">{label}</p>
        {icon ? <span className="kpi-icon">{icon}</span> : null}
      </div>
      <p className="kpi-value">{value}</p>
      {hint ? <p className="kpi-hint">{hint}</p> : null}
    </article>
  )
}

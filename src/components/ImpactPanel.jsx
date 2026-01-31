export default function ImpactPanel({ intervention, placement }) {
  if (!intervention) {
    return (
      <aside className="impact-panel empty">
        <div className="empty-state">
          <p className="empty-title">No intervention selected</p>
          <p className="empty-text">
            Select an intervention from the sidebar to view potential impacts.
          </p>
        </div>
      </aside>
    )
  }

  if (!placement) {
    return (
      <aside className="impact-panel empty">
        <div className="empty-state">
          <p className="empty-title">Not yet placed</p>
          <p className="empty-text">
            Click on the map to place {intervention.name} and view estimated effects.
          </p>
        </div>
      </aside>
    )
  }

  return (
    <aside className="impact-panel">
      <div className="panel-header">
        <h2>Estimated Effects</h2>
        <span className={`type-badge ${intervention.type}`}>
          {intervention.type}
        </span>
      </div>

      <div className="intervention-info">
        <h3>{intervention.name}</h3>
        <p>{intervention.description}</p>
      </div>

      <div className="impacts">
        <h4>Projected Changes</h4>
        <ul className="impact-list">
          {intervention.impacts.map((impact) => (
            <li key={impact.label} className="impact-item">
              <div className="impact-label">{impact.label}</div>
              <div className={`impact-change ${impact.direction}`}>
                <span className="impact-arrow">
                  {impact.direction === 'up' ? '↑' : '↓'}
                </span>
                <span className="impact-text">{impact.change}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="impact-note">
        <p>
          These estimates are directional and intended for early planning
          discussions. Actual impacts depend on implementation details, local
          conditions, and community engagement.
        </p>
      </div>

      <button
        className="reset-button"
        onClick={() => window.location.reload()}
      >
        Reset Simulation
      </button>
    </aside>
  )
}

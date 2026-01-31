import InterventionSelector from './InterventionSelector'

export default function Sidebar({ selected, onSelect }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2>Interventions</h2>
        <div className="intervention-types">
          <span className="type-badge physical">Physical</span>
          <span className="type-badge digital">Digital</span>
        </div>
      </div>
      <InterventionSelector selected={selected} onSelect={onSelect} />
      {!selected && (
        <div className="sidebar-note">
          Select an intervention to begin simulation.
        </div>
      )}
      {selected && !selected.placement && (
        <div className="sidebar-note active">
          Click on the map to place <strong>{selected.name}</strong>.
        </div>
      )}
    </aside>
  )
}

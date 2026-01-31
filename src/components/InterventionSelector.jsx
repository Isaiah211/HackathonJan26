import { interventions } from '../data/interventions'

export default function InterventionSelector({ selected, onSelect }) {
  const physicalInterventions = interventions.filter(i => i.type === 'physical')
  const digitalInterventions = interventions.filter(i => i.type === 'digital')

  return (
    <div className="intervention-groups">
      <div className="intervention-group">
        <h3 className="group-title">Physical Infrastructure</h3>
        <div className="intervention-list">
          {physicalInterventions.map((item) => (
            <button
              key={item.id}
              className={`intervention ${selected?.id === item.id ? 'selected' : ''}`}
              onClick={() => onSelect(item)}
              aria-pressed={selected?.id === item.id}
            >
              <div className="intervention-name">{item.name}</div>
              <div className="intervention-desc">{item.description}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="intervention-group">
        <h3 className="group-title">Digital Services</h3>
        <div className="intervention-list">
          {digitalInterventions.map((item) => (
            <button
              key={item.id}
              className={`intervention digital ${selected?.id === item.id ? 'selected' : ''}`}
              onClick={() => onSelect(item)}
              aria-pressed={selected?.id === item.id}
            >
              <div className="intervention-name">{item.name}</div>
              <div className="intervention-desc">{item.description}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

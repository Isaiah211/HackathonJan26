import { useState } from 'react'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import MapView from './components/MapView'
import ImpactPanel from './components/ImpactPanel'

export default function App() {
  const [selectedIntervention, setSelectedIntervention] = useState(null)
  const [placement, setPlacement] = useState(null)

  const handleInterventionSelect = (intervention) => {
    setSelectedIntervention(intervention)
    setPlacement(null)
  }

  return (
    <div className="app">
      <Header />
      <main className="layout">
        <Sidebar
          selected={selectedIntervention}
          onSelect={handleInterventionSelect}
        />
        <MapView
          intervention={selectedIntervention}
          placement={placement}
          onPlace={setPlacement}
        />
        <ImpactPanel
          intervention={selectedIntervention}
          placement={placement}
        />
      </main>
    </div>
  )
}

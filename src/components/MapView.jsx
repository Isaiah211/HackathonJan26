import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Circle, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix for default marker icons in Leaflet with bundlers
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const CAPITAL_REGION_CENTER = [42.65, -73.75]
const ZOOM_LEVEL = 11

function MapClickHandler({ onMapClick, enabled }) {
  useMapEvents({
    click: (e) => {
      if (enabled) {
        onMapClick(e.latlng)
      }
    },
  })
  return null
}

export default function MapView({ intervention, placement, onPlace }) {
  const mapRef = useRef(null)

  useEffect(() => {
    if (placement && mapRef.current) {
      mapRef.current.flyTo(placement, 13, { duration: 0.5 })
    }
  }, [placement])

  return (
    <section className="map-section">
      {intervention && !placement && (
        <div className="map-instruction">
          Click on the map to place {intervention.name}
        </div>
      )}
      <MapContainer
        center={CAPITAL_REGION_CENTER}
        zoom={ZOOM_LEVEL}
        className="map-container"
        ref={mapRef}
        zoomControl={true}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapClickHandler
          onMapClick={onPlace}
          enabled={intervention && !placement}
        />

        {placement && intervention && (
          <>
            <Marker position={placement} />
            {intervention.type === 'digital' && (
              <Circle
                center={placement}
                radius={1500}
                pathOptions={{
                  fillColor: '#3b82f6',
                  fillOpacity: 0.15,
                  color: '#3b82f6',
                  weight: 2,
                  opacity: 0.6,
                }}
              />
            )}
            {intervention.type === 'physical' && intervention.id === 'bike_lane' && (
              <Circle
                center={placement}
                radius={800}
                pathOptions={{
                  fillColor: '#10b981',
                  fillOpacity: 0.15,
                  color: '#10b981',
                  weight: 2,
                  opacity: 0.6,
                }}
              />
            )}
            {intervention.type === 'physical' && intervention.id !== 'bike_lane' && (
              <Circle
                center={placement}
                radius={600}
                pathOptions={{
                  fillColor: '#8b5cf6',
                  fillOpacity: 0.15,
                  color: '#8b5cf6',
                  weight: 2,
                  opacity: 0.6,
                }}
              />
            )}
          </>
        )}
      </MapContainer>
    </section>
  )
}

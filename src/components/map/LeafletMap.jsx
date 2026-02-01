import React, { useRef, useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Search, MapPin, Loader, Navigation } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import { formatCurrencyFromThousands } from '../../utils/formatters';

// Fix for default marker icons in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const DEFAULT_CENTER = [42.6526, -73.7562]; // Albany, NY [lat, lng]
const DEFAULT_ZOOM = 13;
const CAPITAL_BOUNDS = [
  [42.4, -74.3], // Southwest
  [43.1, -73.4]  // Northeast
];

/**
 * Custom marker icon creator
 */
const createCustomIcon = (color) => {
  const svgIcon = `
    <svg width="32" height="42" viewBox="0 0 32 42" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
          <feOffset dx="0" dy="2" result="offsetblur"/>
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.3"/>
          </feComponentTransfer>
          <feMerge>
            <feMergeNode/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      <path d="M16 0C10.48 0 6 4.48 6 10C6 17.25 16 32 16 32C16 32 26 17.25 26 10C26 4.48 21.52 0 16 0Z" 
            fill="${color}" 
            filter="url(#shadow)"/>
      <circle cx="16" cy="10" r="4" fill="white"/>
    </svg>
  `;
  
  return L.divIcon({
    html: svgIcon,
    className: 'custom-marker',
    iconSize: [32, 42],
    iconAnchor: [16, 42],
    popupAnchor: [0, -42],
  });
};

/**
 * Map Click Handler Component
 */
const MapClickHandler = ({ onClick }) => {
  useMapEvents({
    click: (e) => {
      onClick(e.latlng);
    },
  });
  return null;
};

/**
 * Fit Bounds Component
 */
const FitBounds = ({ businesses }) => {
  const map = useMap();

  useEffect(() => {
    if (businesses.length > 0) {
      const bounds = businesses
        .filter(b => b.location)
        .map(b => [b.location.lat, b.location.lng]);

      if (bounds.length > 1) {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
      } else if (bounds.length === 1) {
        map.setView(bounds[0], 14);
      }
    }
  }, [businesses, map]);

  return null;
};

/**
 * Search Component
 */
const SearchControl = ({ onSelectLocation }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (query.length < 3) {
      setResults([]);
      return;
    }

    const searchTimer = setTimeout(async () => {
      setIsSearching(true);
      try {
        // Using Nominatim (OpenStreetMap) geocoding - free and open-source
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?` +
          `q=${encodeURIComponent(query)}&` +
          `format=json&` +
          `limit=5&` +
          `viewbox=-74.5,42.0,-73.0,43.0&` +
          `bounded=1&` +
          `countrycodes=us`
        );
        const data = await response.json();
        setResults(data);
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(searchTimer);
  }, [query]);

  const handleSelectResult = (result) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    onSelectLocation({ lat, lng });
    setQuery('');
    setResults([]);
  };

  return (
    <div className="absolute top-4 left-4 right-4 z-[1000] pointer-events-none">
      <div className="max-w-md pointer-events-auto">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search for an address or location..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-3 bg-white border border-neutral-200 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm"
            aria-label="Search location"
          />
          {isSearching && (
            <Loader className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-600 animate-spin" />
          )}
        </div>

        {/* Search Results Dropdown */}
        {results.length > 0 && (
          <div className="mt-2 bg-white border border-neutral-200 rounded-lg shadow-xl max-h-60 overflow-y-auto scrollbar-thin">
            {results.map((result, index) => (
              <button
                key={index}
                onClick={() => handleSelectResult(result)}
                className="w-full text-left px-4 py-3 hover:bg-neutral-50 transition-colors border-b border-neutral-100 last:border-b-0 focus:outline-none focus:bg-neutral-50"
              >
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-neutral-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-900 truncate">
                      {result.display_name}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Main Map Component
 */
const LeafletMap = ({ 
  businesses = [], 
  onBusinessPlace, 
  pendingBusiness = null,
  onBusinessSelect 
}) => {
  const mapRef = useRef(null);
  const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER);
  const [selectedBusiness, setSelectedBusiness] = useState(null);

  const handleMapClick = (latlng) => {
    const withinBounds =
      latlng.lat >= CAPITAL_BOUNDS[0][0] &&
      latlng.lat <= CAPITAL_BOUNDS[1][0] &&
      latlng.lng >= CAPITAL_BOUNDS[0][1] &&
      latlng.lng <= CAPITAL_BOUNDS[1][1];

    if (!withinBounds) {
      return; // Ignore clicks outside the Capital Region
    }

    if (pendingBusiness && onBusinessPlace) {
      onBusinessPlace({
        lat: latlng.lat,
        lng: latlng.lng
      });
    }
  };

  const handleSelectLocation = (location) => {
    setMapCenter([location.lat, location.lng]);
    if (mapRef.current) {
      mapRef.current.setView([location.lat, location.lng], 14);
    }
  };

  const handleMarkerClick = (business) => {
    setSelectedBusiness(business);
    if (onBusinessSelect) {
      onBusinessSelect(business);
    }
  };

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden border border-neutral-200 shadow-lg">
      {/* Search Control */}
      <SearchControl onSelectLocation={handleSelectLocation} />

      {/* Instruction Banner */}
      {pendingBusiness && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[1000] animate-slide-down pointer-events-none">
          <div className="bg-brand-600 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            <span className="text-sm font-medium">
              Click on the map to place {pendingBusiness.name}
            </span>
          </div>
        </div>
      )}

      {/* Business Count Badge */}
      {businesses.length > 0 && (
        <div className="absolute bottom-4 left-4 bg-white px-4 py-2 rounded-full shadow-md border border-neutral-200 z-[999]">
          <p className="text-sm font-medium text-neutral-900">
            {businesses.length} {businesses.length === 1 ? 'Business' : 'Businesses'}
          </p>
        </div>
      )}

      {/* Leaflet Map */}
      <MapContainer
        center={mapCenter}
        zoom={DEFAULT_ZOOM}
        ref={mapRef}
        style={{ height: '100%', width: '100%' }}
        className={pendingBusiness ? 'cursor-crosshair' : 'cursor-grab'}
        zoomControl={false}
        attributionControl={true}
        maxBounds={CAPITAL_BOUNDS}
        maxBoundsViscosity={1.0}
        minZoom={10}
        maxZoom={18}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Zoom Control */}
        <div className="leaflet-top leaflet-right">
          <div className="leaflet-control leaflet-bar">
            <a
              href="#"
              className="bg-white p-2 border border-neutral-200 rounded-t-lg hover:bg-neutral-50 block"
              onClick={(e) => {
                e.preventDefault();
                mapRef.current?.zoomIn();
              }}
              aria-label="Zoom in"
            >
              <span className="text-lg font-bold">+</span>
            </a>
            <a
              href="#"
              className="bg-white p-2 border border-neutral-200 rounded-b-lg hover:bg-neutral-50 block border-t-0"
              onClick={(e) => {
                e.preventDefault();
                mapRef.current?.zoomOut();
              }}
              aria-label="Zoom out"
            >
              <span className="text-lg font-bold">−</span>
            </a>
          </div>
        </div>

        {/* Map Click Handler */}
        <MapClickHandler onClick={handleMapClick} />

        {/* Fit Bounds */}
        <FitBounds businesses={businesses} />

        {/* Business Markers */}
        {businesses.map((business) => {
          if (!business.location) return null;

          return (
            <Marker
              key={business.id}
              position={[business.location.lat, business.location.lng]}
              icon={createCustomIcon(business.category?.color || '#6366f1')}
              eventHandlers={{
                click: () => handleMarkerClick(business),
              }}
            >
              <Popup className="custom-popup">
                <div className="p-4 min-w-[280px]">
                  <div className="flex items-start gap-3 mb-3">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${business.category?.color}20` }}
                    >
                      <MapPin 
                        className="w-5 h-5" 
                        style={{ color: business.category?.color }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-neutral-900 mb-1">
                        {business.name}
                      </h3>
                      <p className="text-sm text-neutral-600">
                        {business.category?.label}
                      </p>
                    </div>
                  </div>

                  {business.location.address && (
                    <div className="flex items-start gap-2 mb-3 text-xs text-neutral-500">
                      <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      <span className="flex-1">{business.location.address}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="text-neutral-500">Employees</p>
                      <p className="font-semibold text-neutral-900">{business.employees}</p>
                    </div>
                    {business.predictions && (
                      <>
                        <div>
                          <p className="text-neutral-500">Jobs Created</p>
                          <p className="font-semibold text-neutral-900">
                            {business.predictions.jobs.total}
                          </p>
                        </div>
                        <div>
                          <p className="text-neutral-500">Annual Revenue</p>
                          <p className="font-semibold text-neutral-900">
                            {formatCurrencyFromThousands(business.predictions.revenue)}
                          </p>
                        </div>
                        <div>
                          <p className="text-neutral-500">Tax Revenue</p>
                          <p className="font-semibold text-neutral-900">
                            {formatCurrencyFromThousands(business.predictions.taxRevenue.total)}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default LeafletMap;

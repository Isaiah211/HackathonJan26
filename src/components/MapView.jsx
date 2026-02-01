import React, { useRef, useEffect, useState } from 'react';
import Map, { Marker, Popup, NavigationControl, GeolocateControl, ScaleControl } from 'react-map-gl';
import { Search, MapPin, Loader } from 'lucide-react';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';
const DEFAULT_CENTER = { lng: -73.7562, lat: 42.6526 }; // Albany, NY
const DEFAULT_ZOOM = 11;

/**
 * MapView Component
 * Interactive map with search, multi-marker support, and business placement
 */
const MapView = ({ 
  businesses = [], 
  onBusinessPlace, 
  pendingBusiness = null,
  onBusinessSelect 
}) => {
  const mapRef = useRef(null);
  const [viewState, setViewState] = useState({
    longitude: DEFAULT_CENTER.lng,
    latitude: DEFAULT_CENTER.lat,
    zoom: DEFAULT_ZOOM
  });
  
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Handle map click for placing business
  const handleMapClick = (event) => {
    if (pendingBusiness) {
      const { lngLat } = event;
      onBusinessPlace({
        lng: lngLat.lng,
        lat: lngLat.lat
      });
    }
  };

  // Search for locations using Mapbox Geocoding API
  const handleSearch = async (query) => {
    if (!query || query.length < 3) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?` +
        `access_token=${MAPBOX_TOKEN}&` +
        `proximity=${DEFAULT_CENTER.lng},${DEFAULT_CENTER.lat}&` +
        `bbox=-74.5,42.0,-73.0,43.0&` + // Limit to Capital Region
        `types=place,locality,neighborhood,address,poi&` +
        `limit=5`
      );
      
      const data = await response.json();
      setSearchResults(data.features || []);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Select search result
  const handleSelectResult = (result) => {
    const [lng, lat] = result.center;
    
    setViewState({
      longitude: lng,
      latitude: lat,
      zoom: 14
    });
    
    setSearchQuery(result.place_name);
    setSearchResults([]);
  };

  // Fit map to show all markers
  useEffect(() => {
    if (businesses.length > 0 && mapRef.current && mapLoaded) {
      const bounds = businesses.reduce((acc, business) => {
        if (!business.location) return acc;
        
        return [
          [
            Math.min(acc[0][0], business.location.lng),
            Math.min(acc[0][1], business.location.lat)
          ],
          [
            Math.max(acc[1][0], business.location.lng),
            Math.max(acc[1][1], business.location.lat)
          ]
        ];
      }, [[180, 90], [-180, -90]]);

      // Only fit bounds if we have valid coordinates
      if (bounds[0][0] !== 180 && businesses.length > 1) {
        mapRef.current.fitBounds(bounds, {
          padding: { top: 50, bottom: 50, left: 50, right: 50 },
          duration: 1000
        });
      } else if (businesses.length === 1 && businesses[0].location) {
        setViewState({
          longitude: businesses[0].location.lng,
          latitude: businesses[0].location.lat,
          zoom: 14
        });
      }
    }
  }, [businesses, mapLoaded]);

  if (!MAPBOX_TOKEN) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-neutral-100 rounded-xl border-2 border-dashed border-neutral-300">
        <div className="text-center p-8 max-w-md">
          <MapPin className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-neutral-900 mb-2">
            Mapbox Token Required
          </h3>
          <p className="text-sm text-neutral-600 mb-4">
            Please add your Mapbox API token to the .env file to enable the map.
          </p>
          <code className="text-xs bg-neutral-200 px-3 py-1 rounded text-neutral-800 block">
            VITE_MAPBOX_TOKEN=your_token_here
          </code>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden border border-neutral-200 shadow-lg">
      {/* Search Bar */}
      <div className="absolute top-4 left-4 right-4 z-10">
        <div className="relative max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Search for address or neighborhood..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-3 bg-white border border-neutral-200 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm"
              aria-label="Search location"
            />
            {isSearching && (
              <Loader className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-600 animate-spin" />
            )}
          </div>

          {/* Search Results Dropdown */}
          {searchResults.length > 0 && (
            <div className="absolute w-full mt-2 bg-white border border-neutral-200 rounded-lg shadow-xl max-h-60 overflow-y-auto animate-slide-down">
              {searchResults.map((result) => (
                <button
                  key={result.id}
                  onClick={() => handleSelectResult(result)}
                  className="w-full text-left px-4 py-3 hover:bg-neutral-50 transition-colors border-b border-neutral-100 last:border-b-0 focus:outline-none focus:bg-neutral-50"
                >
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-neutral-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-900 truncate">
                        {result.text}
                      </p>
                      <p className="text-xs text-neutral-500 truncate">
                        {result.place_name}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Instruction Banner */}
      {pendingBusiness && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-10 animate-slide-down">
          <div className="bg-brand-600 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            <span className="text-sm font-medium">
              Click on the map to place {pendingBusiness.name}
            </span>
          </div>
        </div>
      )}

      {/* Map */}
      <Map
        ref={mapRef}
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        onLoad={() => setMapLoaded(true)}
        onClick={handleMapClick}
        mapboxAccessToken={MAPBOX_TOKEN}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        style={{ width: '100%', height: '100%' }}
        cursor={pendingBusiness ? 'crosshair' : 'grab'}
        attributionControl={false}
      >
        {/* Controls */}
        <NavigationControl position="bottom-right" />
        <GeolocateControl position="bottom-right" />
        <ScaleControl />

        {/* Business Markers */}
        {businesses.map((business) => {
          if (!business.location) return null;
          
          return (
            <Marker
              key={business.id}
              longitude={business.location.lng}
              latitude={business.location.lat}
              anchor="bottom"
              onClick={(e) => {
                e.originalEvent.stopPropagation();
                setSelectedBusiness(business);
                onBusinessSelect?.(business);
              }}
            >
              <div 
                className="relative cursor-pointer group"
                style={{ transform: 'translate(-50%, -100%)' }}
              >
                {/* Pin Icon */}
                <div 
                  className="w-8 h-8 rounded-full shadow-lg border-2 border-white flex items-center justify-center transition-transform group-hover:scale-110"
                  style={{ backgroundColor: business.category?.color || '#6366f1' }}
                >
                  <MapPin className="w-4 h-4 text-white" />
                </div>
                
                {/* Pin stem */}
                <div 
                  className="absolute left-1/2 -translate-x-1/2 w-0.5 h-4 -bottom-4"
                  style={{ backgroundColor: business.category?.color || '#6366f1' }}
                />
                
                {/* Business name label */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-5 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="bg-neutral-900 text-white text-xs px-2 py-1 rounded shadow-lg">
                    {business.name}
                  </div>
                </div>
              </div>
            </Marker>
          );
        })}

        {/* Popup for selected business */}
        {selectedBusiness && selectedBusiness.location && (
          <Popup
            longitude={selectedBusiness.location.lng}
            latitude={selectedBusiness.location.lat}
            anchor="top"
            onClose={() => setSelectedBusiness(null)}
            closeButton={true}
            closeOnClick={false}
            className="business-popup"
          >
            <div className="p-4 min-w-[280px]">
              <div className="flex items-start gap-3 mb-3">
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${selectedBusiness.category?.color}20` }}
                >
                  <MapPin 
                    className="w-5 h-5" 
                    style={{ color: selectedBusiness.category?.color }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-neutral-900 mb-1">
                    {selectedBusiness.name}
                  </h3>
                  <p className="text-sm text-neutral-600">
                    {selectedBusiness.category?.label}
                  </p>
                </div>
              </div>

              {selectedBusiness.location.address && (
                <p className="text-xs text-neutral-500 mb-3">
                  📍 {selectedBusiness.location.address}
                </p>
              )}

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-neutral-500">Employees</p>
                  <p className="font-semibold text-neutral-900">{selectedBusiness.employees}</p>
                </div>
                {selectedBusiness.predictions && (
                  <>
                    <div>
                      <p className="text-neutral-500">Jobs Created</p>
                      <p className="font-semibold text-neutral-900">
                        {selectedBusiness.predictions.jobs.total}
                      </p>
                    </div>
                    <div>
                      <p className="text-neutral-500">Annual Revenue</p>
                      <p className="font-semibold text-neutral-900">
                        ${selectedBusiness.predictions.revenue}k
                      </p>
                    </div>
                    <div>
                      <p className="text-neutral-500">Tax Revenue</p>
                      <p className="font-semibold text-neutral-900">
                        ${selectedBusiness.predictions.taxRevenue.total}k
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </Popup>
        )}
      </Map>

      {/* Business count badge */}
      {businesses.length > 0 && (
        <div className="absolute bottom-4 left-4 bg-white px-4 py-2 rounded-full shadow-md border border-neutral-200">
          <p className="text-sm font-medium text-neutral-900">
            {businesses.length} {businesses.length === 1 ? 'Business' : 'Businesses'}
          </p>
        </div>
      )}
    </div>
  );
};

export default MapView;

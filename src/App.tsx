import { useState, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Map, Marker, ZoomControl } from 'pigeon-maps';
import { Search, MapPin, Loader2, Utensils, Star, Filter, Check, X, ChevronRight } from 'lucide-react';
import { findRestaurants } from './lib/gemini';
import { Restaurant, SearchFilters } from './types';

export default function App() {
  const [craving, setCraving] = useState('');
  const [loading, setLoading] = useState(false);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([0, 0]);
  const [mapZoom, setMapZoom] = useState(13);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [filters, setFilters] = useState<SearchFilters>({
    halal: false,
    vegetarian: false,
    vegan: false,
    glutenFree: false,
  });

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setLocation(coords);
          setMapCenter([coords.lat, coords.lng]);
        },
        (error) => {
          console.error("Geolocation error:", error);
          setLocationError("Could not access your location. Using general search.");
          // Default to a known location if user blocks it, e.g., NYC
          setMapCenter([40.7128, -74.0060]);
        }
      );
    } else {
      setLocationError("Geolocation is not supported by your browser.");
      setMapCenter([40.7128, -74.0060]);
    }
  }, []);

  const handleSearch = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!craving.trim()) return;

    setLoading(true);
    setRestaurants([]);
    setSelectedRestaurant(null);

    const results = await findRestaurants(
      craving,
      location || "nearby",
      filters
    );

    setRestaurants(results);
    setLoading(false);

    if (results.length > 0) {
      setMapCenter([results[0].lat, results[0].lng]);
      setMapZoom(14);
    }
  };

  const toggleFilter = (key: keyof SearchFilters) => {
    setFilters(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="h-screen w-full bg-slate-50 flex overflow-hidden font-sans text-slate-900 text-sm">
      {/* Sidebar */}
      <aside className="w-full md:w-96 bg-white border-r border-slate-200 flex flex-col h-full shadow-sm z-10 shrink-0">
        <div className="p-6 space-y-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-800 flex items-center gap-2 leading-none">
              <Utensils className="w-6 h-6 text-orange-500" />
              foodfinder
            </h1>
            <p className="text-xs text-slate-400 mt-1">Satisfy your hunger in seconds.</p>
          </div>

          {/* Search Input */}
          <form onSubmit={handleSearch} className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              {loading ? (
                <Loader2 className="h-4 w-4 text-orange-500 animate-spin" />
              ) : (
                <Search className="h-4 w-4 text-slate-400" />
              )}
            </div>
            <input
              type="text"
              placeholder="Spicy Miso Ramen..."
              value={craving}
              onChange={(e) => setCraving(e.target.value)}
              disabled={loading}
              className="block w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm transition-all shadow-sm"
            />
          </form>

          {/* Filters */}
          <div className="space-y-3">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Preferences</h3>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(filters) as Array<keyof SearchFilters>).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleFilter(key)}
                  className={`px-3 py-1.5 rounded-full text-[10px] font-bold border transition-all capitalize ${
                    filters[key] 
                      ? 'bg-orange-100 text-orange-700 border-orange-200 shadow-sm' 
                      : 'bg-slate-100 text-slate-600 border-transparent hover:border-slate-300'
                  }`}
                >
                  {key.replace(/([A-Z])/g, ' $1')}
                </button>
              ))}
            </div>
          </div>

          {/* Location Badge */}
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-100 text-slate-400">
            <MapPin className="w-3.5 h-3.5" />
            <span className="text-[9px] font-bold uppercase tracking-[0.15em]">
              {location ? 'Location Active' : (locationError ? 'Global Search' : 'Locating...')}
            </span>
            {location && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-green-500 shadow-sm animate-pulse" />}
          </div>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-hidden flex flex-col border-t border-slate-100">
          <div className="px-6 py-2.5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
              {restaurants.length} Results
            </span>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <AnimatePresence>
              {restaurants.map((res, idx) => (
                <motion.div
                  key={res.name + idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => {
                    setSelectedRestaurant(res);
                    setMapCenter([res.lat, res.lng]);
                    setMapZoom(16);
                  }}
                  className={`p-5 border-b border-slate-50 hover:bg-slate-50/80 transition-all group cursor-pointer ${selectedRestaurant?.name === res.name ? 'bg-orange-50/40 border-l-4 border-l-orange-500' : ''}`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <h4 className="font-bold text-slate-800 text-sm leading-tight">{res.name}</h4>
                    <span className="shrink-0 text-[8px] font-bold uppercase text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-100">
                      {res.cuisineType}
                    </span>
                  </div>
                  
                  <div className="flex items-center mt-1 text-xs text-slate-500">
                    <div className="flex text-orange-400">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`w-2.5 h-2.5 ${i < Math.floor(res.rating) ? 'fill-current' : 'text-slate-200'}`} />
                      ))}
                    </div>
                    <span className="ml-1.5 font-bold">{res.rating}</span>
                    <span className="mx-1.5 text-slate-200">•</span>
                    <span className="text-slate-400">{res.priceRange}</span>
                  </div>

                  <p className="text-[11px] text-slate-500 mt-2 line-clamp-2 leading-relaxed font-medium">
                    {res.whyItMatches}
                  </p>
                </motion.div>
              ))}
            </AnimatePresence>

            {!loading && restaurants.length === 0 && (
              <div className="p-12 text-center opacity-50">
                <Utensils className="w-8 h-8 text-slate-200 mx-auto mb-3" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  {craving ? 'No results found' : 'Ready to search'}
                </p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Area (Real Map) */}
      <main className="flex-1 relative bg-slate-100 overflow-hidden">
        <Map 
          center={mapCenter} 
          zoom={mapZoom} 
          onBoundsChanged={({ center, zoom }) => {
            setMapCenter(center);
            setMapZoom(zoom);
          }}
        >
          <ZoomControl />
          {restaurants.map((res, i) => (
            <Marker 
              key={i} 
              anchor={[res.lat, res.lng]} 
              color={selectedRestaurant?.name === res.name ? '#f97316' : '#94a3b8'} 
              onClick={() => {
                setSelectedRestaurant(res);
                setMapCenter([res.lat, res.lng]);
              }}
            />
          ))}
          {location && <Marker anchor={[location.lat, location.lng]} color="#3b82f6" />}
        </Map>

        {/* Floating Details Overlay */}
        <AnimatePresence>
          {selectedRestaurant && (
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              className="absolute bottom-6 left-6 right-6 md:left-auto md:w-[400px] bg-white/95 backdrop-blur-md p-6 rounded-2xl shadow-2xl border border-white/50 z-20 pointer-events-auto"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">{selectedRestaurant.name}</h3>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                    <MapPin className="w-3 h-3" />
                    <span>{selectedRestaurant.address}</span>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedRestaurant(null)}
                  className="p-1 text-slate-300 hover:text-slate-500 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="bg-slate-50/80 p-4 rounded-xl mb-4 border border-slate-100">
                <p className="text-xs text-slate-600 font-medium leading-relaxed italic">
                  "{selectedRestaurant.description}"
                </p>
              </div>

              <div className="flex flex-wrap gap-1.5 mb-5">
                {selectedRestaurant.features.map((f, i) => (
                  <span key={i} className="text-[9px] font-bold text-slate-400 bg-white border border-slate-100 px-2.5 py-1 rounded-md uppercase tracking-tight">
                    {f}
                  </span>
                ))}
              </div>

              <div className="flex gap-2">
                <a 
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${selectedRestaurant.name} ${selectedRestaurant.address}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-black transition-all shadow-md active:scale-95"
                >
                  Open in Maps <ChevronRight className="w-4 h-4" />
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Map UI Legend / Instructions */}
        {!selectedRestaurant && (
          <div className="absolute top-6 left-6 pointer-events-none">
            <div className="bg-white/90 backdrop-blur-sm px-4 py-3 rounded-2xl shadow-sm border border-white/50">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                {restaurants.length > 0 ? 'Explore markers' : 'Search to begin'}
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}


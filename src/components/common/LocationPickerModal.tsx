import React, { useState } from 'react';
import { 
  X, 
  MapPin, 
  Navigation, 
  Search, 
  Check, 
  Loader2, 
  Globe, 
  Compass, 
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { 
  UserLocation, 
  PREDEFINED_LOCATIONS, 
  requestDeviceLocation,
  fetchPrayerTimings
} from '../../services/prayerTimesService';

interface LocationPickerModalProps {
  currentLocation: UserLocation;
  onSelectLocation: (loc: UserLocation) => void;
  onClose: () => void;
}

export const LocationPickerModal: React.FC<LocationPickerModalProps> = ({
  currentLocation,
  onSelectLocation,
  onClose
}) => {
  const [activeCategory, setActiveCategory] = useState<'Tamil Nadu' | 'India' | 'Middle East' | 'Global'>('Tamil Nadu');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [locatingError, setLocatingError] = useState<string | null>(null);
  const [customTesting, setCustomTesting] = useState(false);
  const [customError, setCustomError] = useState<string | null>(null);

  // Filter predefined locations based on search query
  const allPresets = PREDEFINED_LOCATIONS.flatMap(g => g.locations);
  const filteredPresets = searchQuery.trim()
    ? allPresets.filter(l => 
        l.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (l.state && l.state.toLowerCase().includes(searchQuery.toLowerCase())) ||
        l.displayName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : PREDEFINED_LOCATIONS.find(g => g.category === activeCategory)?.locations || [];

  const handleGpsDetect = async () => {
    setIsLocating(true);
    setLocatingError(null);
    try {
      const detected = await requestDeviceLocation();
      onSelectLocation(detected);
      onClose();
    } catch (err: any) {
      setLocatingError(err.message || 'Could not detect your GPS location. Please select your city below.');
    } finally {
      setIsLocating(false);
    }
  };

  const handleCustomCitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    setCustomTesting(true);
    setCustomError(null);

    try {
      // Split "City, Country" or single "City"
      const parts = query.split(',').map(s => s.trim());
      const city = parts[0];
      const country = parts[1] || '';

      const testLoc: UserLocation = {
        city,
        country: country || 'Global',
        displayName: country ? `${city}, ${country}` : city,
        latitude: 0,
        longitude: 0,
        isGps: false
      };

      // Test with AlAdhan API to verify city
      const result = await fetchPrayerTimings(testLoc, new Date(), 1, 0);
      
      const verifiedLoc: UserLocation = {
        city,
        country: country || result.meta.timezone?.split('/')[0] || 'Worldwide',
        displayName: `${city}${country ? `, ${country}` : ''}`,
        latitude: result.meta.latitude,
        longitude: result.meta.longitude,
        isGps: false,
        timezone: result.meta.timezone
      };

      onSelectLocation(verifiedLoc);
      onClose();
    } catch (err: any) {
      setCustomError(`Could not find prayer times for "${query}". Please check the spelling or pick a nearby city.`);
    } finally {
      setCustomTesting(false);
    }
  };

  const isCurrentActive = (loc: UserLocation) => {
    if (currentLocation.isGps && loc.isGps) return true;
    if (loc.isGps) return false;
    return (
      loc.city.toLowerCase() === currentLocation.city.toLowerCase() &&
      loc.country.toLowerCase() === currentLocation.country.toLowerCase()
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div 
        className="w-full max-w-[430px] bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in slide-in-from-bottom-6 duration-300"
        role="dialog"
        aria-modal="true"
        aria-labelledby="location-modal-title"
      >
        {/* Modal Handle for Touch */}
        <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mt-3 sm:hidden shrink-0" />

        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#087F5B] flex items-center justify-center">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h2 id="location-modal-title" className="text-base font-bold text-slate-900 leading-tight">
                Select Prayer Location
              </h2>
              <p className="text-[11px] text-slate-500">
                Current: <strong className="text-emerald-800">{currentLocation.displayName}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* GPS Quick Action */}
        <div className="p-4 bg-slate-50/80 border-b border-slate-100 shrink-0">
          <button
            onClick={handleGpsDetect}
            disabled={isLocating}
            className="w-full py-2.5 px-3 rounded-2xl bg-gradient-to-r from-[#087F5B] to-[#065A41] text-white font-bold text-xs flex items-center justify-center gap-2 hover:opacity-95 active:scale-[0.99] transition-all shadow-xs disabled:opacity-70"
          >
            {isLocating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                <span>Detecting device coordinates...</span>
              </>
            ) : (
              <>
                <Navigation className="w-4 h-4 text-amber-300 fill-amber-300" />
                <span>Use My Exact GPS Location</span>
              </>
            )}
          </button>

          {currentLocation.isGps && (
            <div className="mt-2 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-emerald-800 bg-emerald-50 py-1 px-2.5 rounded-lg border border-emerald-200/60">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
              <span>GPS Location Currently Active</span>
            </div>
          )}

          {locatingError && (
            <div className="mt-2 p-2 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-1.5 text-[11px] text-rose-700">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-600" />
              <span>{locatingError}</span>
            </div>
          )}
        </div>

        {/* Search Bar */}
        <div className="p-3 border-b border-slate-100 shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Tamil Nadu, India, or Global city..."
              className="w-full h-10 pl-9 pr-8 bg-slate-100 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#087F5B]/30 focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Category Tabs (shown when not actively searching) */}
        {!searchQuery.trim() && (
          <div className="flex border-b border-slate-100 px-3 bg-white shrink-0 overflow-x-auto no-scrollbar">
            {(['Tamil Nadu', 'India', 'Middle East', 'Global'] as const).map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`py-2 px-3 text-xs font-bold whitespace-nowrap border-b-2 transition-colors ${
                  activeCategory === cat
                    ? 'border-[#087F5B] text-[#087F5B]'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Scrollable Location List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          {filteredPresets.map((loc, idx) => {
            const active = isCurrentActive(loc);
            return (
              <button
                key={`${loc.city}-${loc.country}-${idx}`}
                onClick={() => {
                  onSelectLocation(loc);
                  onClose();
                }}
                className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                  active
                    ? 'bg-emerald-50/80 border-[#087F5B] shadow-2xs'
                    : 'bg-white border-slate-200/80 hover:bg-slate-50 active:scale-[0.99]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    active ? 'bg-[#087F5B] text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    <Compass className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-xs font-bold ${active ? 'text-[#087F5B]' : 'text-slate-800'}`}>
                        {loc.displayName}
                      </span>
                      {loc.state && (
                        <span className="text-[10px] font-medium text-slate-400">
                          ({loc.country})
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500 block">
                      {loc.latitude.toFixed(2)}°N, {loc.longitude.toFixed(2)}°E · {loc.timezone || 'Auto TZ'}
                    </span>
                  </div>
                </div>

                {active ? (
                  <div className="w-6 h-6 rounded-full bg-[#087F5B] text-white flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                ) : (
                  <span className="text-[11px] font-semibold text-slate-400 hover:text-[#087F5B]">
                    Select
                  </span>
                )}
              </button>
            );
          })}

          {/* If searching online and not finding in presets */}
          {searchQuery.trim() && (
            <div className="pt-2">
              <form onSubmit={handleCustomCitySubmit} className="p-3 bg-emerald-50/60 rounded-2xl border border-emerald-200 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                  <Globe className="w-3.5 h-3.5 text-[#087F5B]" />
                  <span>Search Worldwide via AlAdhan API</span>
                </div>
                <p className="text-[11px] text-slate-600">
                  Search prayer times for <strong>"{searchQuery.trim()}"</strong> anywhere in the world.
                </p>
                <button
                  type="submit"
                  disabled={customTesting}
                  className="w-full py-2 bg-[#087F5B] hover:bg-[#065A41] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-70"
                >
                  {customTesting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Validating city with AlAdhan...</span>
                    </>
                  ) : (
                    <>
                      <Search className="w-3.5 h-3.5" />
                      <span>Fetch Timings for "{searchQuery.trim()}"</span>
                    </>
                  )}
                </button>
                {customError && (
                  <p className="text-[10px] text-rose-600 font-semibold mt-1">
                    {customError}
                  </p>
                )}
              </form>
            </div>
          )}
        </div>

        {/* Footer Note */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 text-[10px] text-slate-500 text-center shrink-0">
          Times are dynamically computed by the AlAdhan astronomical engine for your selected latitude and longitude.
        </div>
      </div>
    </div>
  );
};

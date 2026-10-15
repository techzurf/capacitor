import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Search, 
  MapPin, 
  Navigation, 
  RefreshCw, 
  Map as MapIcon, 
  List, 
  AlertCircle, 
  Loader2, 
  ExternalLink, 
  Compass, 
  Check, 
  X, 
  ChevronRight,
  Phone,
  Sparkles,
  Sliders
} from 'lucide-react';
import { 
  NearbyMasjid, 
  fetchNearbyMasjidsFromOSM, 
  searchGeocodeLocation, 
  getDirectionsUrl 
} from '../../services/masjidLocatorService';
import { MasjidLeafletMap } from '../masjid/MasjidLeafletMap';
import { MosqueIcon } from '../common/IslamicIcons';
import { PullToRefresh } from '../common/PullToRefresh';

export const MasjidLocatorScreen: React.FC = () => {
  const { userLocation, triggerHapticFeedback } = useApp();

  // Active view: 'list' or 'map'
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  // Coordinates currently active for search
  const [activeCoords, setActiveCoords] = useState<{ latitude: number; longitude: number } | null>(() => {
    if (userLocation?.latitude && userLocation?.longitude) {
      return { latitude: userLocation.latitude, longitude: userLocation.longitude };
    }
    return null;
  });

  const [locationName, setLocationName] = useState<string>(() => {
    return userLocation?.displayName || 'Your Location';
  });

  // State management
  const [isDetectingGps, setIsDetectingGps] = useState<boolean>(false);
  const [permissionDenied, setPermissionDenied] = useState<boolean>(false);
  const [isLoadingMasjids, setIsLoadingMasjids] = useState<boolean>(false);
  const [masjids, setMasjids] = useState<NearbyMasjid[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedMasjid, setSelectedMasjid] = useState<NearbyMasjid | null>(null);
  const [searchRadius, setSearchRadius] = useState<number>(8000); // 8 km default

  // 1. Fetch Masjids around coordinates
  const loadMasjidsForCoordinates = useCallback(async (lat: number, lon: number, radius = 8000) => {
    setIsLoadingMasjids(true);
    setErrorMessage(null);
    try {
      const results = await fetchNearbyMasjidsFromOSM(lat, lon, radius);
      setMasjids(results);
      if (results.length === 0) {
        setErrorMessage('No Masjids found within this radius. Try expanding the search radius or searching a different area.');
      }
    } catch (err: any) {
      console.error('Failed to load nearby masjids:', err);
      setErrorMessage(err.message || 'Unable to load Masjids from OpenStreetMap. Please check your connection.');
    } finally {
      setIsLoadingMasjids(false);
    }
  }, []);

  // 2. Request user GPS location
  const detectGps = useCallback(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setPermissionDenied(true);
      setErrorMessage('Geolocation is not supported by your browser or device. You can search manually below.');
      return;
    }

    setIsDetectingGps(true);
    setErrorMessage(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        setActiveCoords({ latitude: lat, longitude: lon });
        setLocationName('Current GPS Location');
        setPermissionDenied(false);
        setIsDetectingGps(false);
        loadMasjidsForCoordinates(lat, lon, searchRadius);
      },
      (err) => {
        setIsDetectingGps(false);
        if (err.code === err.PERMISSION_DENIED) {
          setPermissionDenied(true);
          setErrorMessage('Location permission was denied. Enter a city, area, or postcode below to find nearby Masjids.');
        } else {
          setErrorMessage('Unable to retrieve your current location. Please search manually below.');
        }

        // If user already has location in context, load that as fallback so screen is never blank!
        if (userLocation?.latitude && userLocation?.longitude) {
          setActiveCoords({ latitude: userLocation.latitude, longitude: userLocation.longitude });
          setLocationName(userLocation.displayName || `${userLocation.city}, ${userLocation.country}`);
          loadMasjidsForCoordinates(userLocation.latitude, userLocation.longitude, searchRadius);
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  }, [loadMasjidsForCoordinates, searchRadius, userLocation]);

  // Request location on initial mount
  useEffect(() => {
    detectGps();
  }, []);

  // 3. Search location by city or locality name
  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    setIsLoadingMasjids(true);
    setErrorMessage(null);
    triggerHapticFeedback('selection');

    try {
      const geo = await searchGeocodeLocation(query);
      if (!geo) {
        setErrorMessage(`Could not find coordinates for "${query}". Please check the spelling or try another city.`);
        setIsLoadingMasjids(false);
        return;
      }

      setActiveCoords({ latitude: geo.latitude, longitude: geo.longitude });
      setLocationName(geo.displayName.split(',').slice(0, 2).join(', '));
      setPermissionDenied(false);

      await loadMasjidsForCoordinates(geo.latitude, geo.longitude, searchRadius);
    } catch (err: any) {
      setErrorMessage(`Search error: ${err.message || 'Failed to search location'}`);
      setIsLoadingMasjids(false);
    }
  };

  const handleRefresh = () => {
    triggerHapticFeedback('selection');
    if (activeCoords) {
      loadMasjidsForCoordinates(activeCoords.latitude, activeCoords.longitude, searchRadius);
    } else {
      detectGps();
    }
  };

  const handleOpenDirections = (masjid: NearbyMasjid, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    triggerHapticFeedback('light');
    const url = getDirectionsUrl(masjid.latitude, masjid.longitude, masjid.name);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleViewOnMap = (masjid: NearbyMasjid, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    triggerHapticFeedback('selection');
    setSelectedMasjid(masjid);
    setViewMode('map');
  };

  // Popular search tags for quick 1-tap search if permission is denied
  const quickCityChips = ['Chennai', 'Coimbatore', 'Madurai', 'Trichy', 'Mumbai', 'London', 'Dubai'];

  return (
    <div className="w-full h-full flex flex-col relative bg-[#F8FAFB]">
      
      {/* ─── TOP APP HEADER & CONTROLS (Sticky) ─── */}
      <div className="w-full bg-white border-b border-slate-200/80 px-4 pt-3 pb-3 shrink-0 shadow-2xs z-20">
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="min-w-0">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#087F5B] flex items-center gap-1">
              <MosqueIcon className="w-3.5 h-3.5" />
              <span>Real-Time OpenStreetMap</span>
            </span>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Find Nearby Masjids
            </h1>
            <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5 truncate">
              <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
              <span className="truncate">{locationName}</span>
            </div>
          </div>

          {/* View Mode Toggle: [ List | Map ] */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 shrink-0">
            <button
              type="button"
              onClick={() => {
                triggerHapticFeedback('selection');
                setViewMode('list');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                viewMode === 'list'
                  ? 'bg-white text-[#087F5B] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>List</span>
            </button>

            <button
              type="button"
              onClick={() => {
                triggerHapticFeedback('selection');
                setViewMode('map');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                viewMode === 'map'
                  ? 'bg-[#087F5B] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span>Map</span>
            </button>
          </div>
        </div>

        {/* Search Bar + GPS Refresh */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-1.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search city, area, or postcode..."
              className="w-full h-10 pl-9 pr-8 bg-slate-50 border border-slate-200/90 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-[#087F5B] focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* GPS Detect Button */}
          <button
            type="button"
            onClick={detectGps}
            disabled={isDetectingGps}
            className="h-10 px-3 bg-emerald-50 hover:bg-emerald-100 text-[#087F5B] border border-emerald-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1 shrink-0 transition-colors disabled:opacity-50"
            title="Use current GPS location"
          >
            {isDetectingGps ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Navigation className="w-4 h-4 fill-current" />
            )}
            <span className="hidden sm:inline">GPS</span>
          </button>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isLoadingMasjids}
            className="w-10 h-10 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl flex items-center justify-center shrink-0 transition-colors disabled:opacity-50"
            title="Refresh Masjids"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingMasjids ? 'animate-spin text-[#087F5B]' : ''}`} />
          </button>
        </form>

        {/* Quick Search Chips if permission denied or user wants to browse other areas */}
        {permissionDenied && (
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase shrink-0">
              Quick:
            </span>
            {quickCityChips.map(city => (
              <button
                key={city}
                type="button"
                onClick={async () => {
                  setSearchQuery(city);
                  setIsLoadingMasjids(true);
                  const geo = await searchGeocodeLocation(city);
                  if (geo) {
                    setActiveCoords({ latitude: geo.latitude, longitude: geo.longitude });
                    setLocationName(geo.city || city);
                    loadMasjidsForCoordinates(geo.latitude, geo.longitude, searchRadius);
                  }
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 text-[11px] font-semibold whitespace-nowrap border border-slate-200/80 transition-colors shrink-0"
              >
                {city}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ─── PERMISSION / ERROR NOTICE BANNER ─── */}
      {permissionDenied && (
        <div className="mx-4 mt-3 p-3 bg-amber-50 border border-amber-300 rounded-2xl flex items-start gap-2.5 text-xs text-amber-900 shrink-0">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold leading-tight">Location Permission Denied</p>
            <p className="text-[11px] text-amber-800/90 mt-0.5">
              We cannot detect your GPS automatically. Enter your city or area in the search bar above to view nearby Masjids.
            </p>
          </div>
        </div>
      )}

      {errorMessage && !permissionDenied && (
        <div className="mx-4 mt-3 p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-start justify-between gap-2 text-xs text-rose-800 shrink-0">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Notice</p>
              <p className="text-[11px] text-rose-700 mt-0.5">{errorMessage}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-bold shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {/* ─── MAIN CONTENT VIEW (List or Interactive Map) ─── */}
      {viewMode === 'map' ? (
        /* INTERACTIVE LEAFLET MAP VIEW */
        <div className="flex-1 w-full min-h-0 relative">
          <MasjidLeafletMap
            userLocation={activeCoords}
            masjids={masjids}
            selectedMasjid={selectedMasjid}
            onSelectMasjid={(m) => setSelectedMasjid(m)}
            onReturnToList={() => setViewMode('list')}
            className="w-full h-full"
          />
        </div>
      ) : (
        /* CLEAN MOBILE-FIRST MASJID LIST VIEW */
        <div className="flex-1 w-full overflow-y-auto px-4 pt-3 pb-8">
          
          {/* Status Sub-Bar */}
          <div className="flex items-center justify-between mb-3 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-slate-700">
              {isLoadingMasjids ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#087F5B]" />
                  <span>Searching OpenStreetMap around {locationName}...</span>
                </>
              ) : (
                <span>Found {masjids.length} Masjids (Closest First)</span>
              )}
            </div>

            {/* Quick Button to Switch to Map */}
            {masjids.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  triggerHapticFeedback('selection');
                  setViewMode('map');
                }}
                className="text-xs font-bold text-[#087F5B] hover:text-[#07543F] flex items-center gap-1 hover:underline cursor-pointer"
              >
                <MapIcon className="w-3.5 h-3.5" />
                <span>View on Map</span>
              </button>
            )}
          </div>

          {/* Loading Skeleton Indicator */}
          {isLoadingMasjids && masjids.length === 0 && (
            <div className="space-y-3 py-4">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="w-full bg-white rounded-3xl p-4 border border-slate-200/80 shadow-2xs animate-pulse">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-slate-200" />
                      <div className="space-y-1.5">
                        <div className="w-36 h-3.5 bg-slate-200 rounded" />
                        <div className="w-48 h-2.5 bg-slate-100 rounded" />
                      </div>
                    </div>
                    <div className="w-12 h-4 bg-slate-200 rounded" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!isLoadingMasjids && masjids.length === 0 && (
            <div className="w-full bg-white rounded-3xl p-6 text-center border border-slate-200/80 shadow-2xs my-6 flex flex-col items-center">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-[#087F5B] flex items-center justify-center mb-3">
                <MosqueIcon className="w-8 h-8 text-emerald-800" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                No Masjids Found Here
              </h3>
              <p className="text-xs text-slate-500 max-w-[260px] mt-1 mb-4">
                We couldn't locate mosques tagged on OpenStreetMap within {searchRadius / 1000} km of {locationName}.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-2 w-full max-w-[280px]">
                <button
                  type="button"
                  onClick={() => {
                    const newR = searchRadius + 7000;
                    setSearchRadius(newR);
                    if (activeCoords) {
                      loadMasjidsForCoordinates(activeCoords.latitude, activeCoords.longitude, newR);
                    }
                  }}
                  className="w-full py-2.5 bg-emerald-50 hover:bg-emerald-100 text-[#087F5B] border border-emerald-200 rounded-xl text-xs font-bold transition-colors"
                >
                  Expand Search Range (+7 km)
                </button>

                <button
                  type="button"
                  onClick={() => setSearchQuery('Chennai')}
                  className="w-full py-2.5 bg-[#087F5B] hover:bg-[#07543F] text-white rounded-xl text-xs font-bold transition-colors"
                >
                  Try Chennai Area
                </button>
              </div>
            </div>
          )}

          {/* List of Real Masjids */}
          <div className="flex flex-col gap-3">
            {masjids.map((masjid) => (
              <div
                key={masjid.id}
                onClick={() => setSelectedMasjid(masjid)}
                className="w-full bg-white rounded-3xl p-4 border border-slate-200/80 shadow-2xs hover:shadow-xs transition-all active:scale-[0.99] flex flex-col justify-between cursor-pointer group"
              >
                {/* Header Row */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-50 group-hover:bg-emerald-100 border border-emerald-200/60 flex items-center justify-center text-[#087F5B] shrink-0 transition-colors">
                      <MosqueIcon className="w-5 h-5 text-[#087F5B]" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-baseline gap-1.5 flex-wrap">
                        <h3 className="text-sm font-extrabold text-slate-900 leading-snug group-hover:text-[#087F5B] transition-colors">
                          {masjid.name}
                        </h3>
                        {masjid.arabicName && (
                          <span className="text-[11px] font-arabic text-amber-800 font-bold">
                            {masjid.arabicName}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="line-clamp-1">{masjid.address}</span>
                      </div>
                    </div>
                  </div>

                  {/* Distance & Time Pill */}
                  <div className="text-right shrink-0">
                    <span className="px-2 py-0.5 rounded-lg bg-emerald-100 text-[#07543F] text-xs font-extrabold tabular-nums block">
                      {masjid.distanceFormatted}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5 font-medium">
                      {masjid.travelTimeEstimate}
                    </span>
                  </div>
                </div>

                {/* Additional Tag Badges */}
                <div className="flex flex-wrap items-center gap-1.5 my-2">
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-semibold">
                    🕌 Place of Worship
                  </span>
                  {masjid.denomination && (
                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200/60 text-[10px] font-semibold capitalize">
                      {masjid.denomination}
                    </span>
                  )}
                  {masjid.hasWheelchair && (
                    <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-semibold">
                      ♿ Accessible
                    </span>
                  )}
                </div>

                {/* Bottom Action Row */}
                <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                  {/* View on Map Button */}
                  <button
                    type="button"
                    onClick={(e) => handleViewOnMap(masjid, e)}
                    className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <MapIcon className="w-3.5 h-3.5 text-[#087F5B]" />
                    <span>View Map</span>
                  </button>

                  {/* Get Directions Button */}
                  <button
                    type="button"
                    onClick={(e) => handleOpenDirections(masjid, e)}
                    className="px-3.5 py-1.5 rounded-xl bg-[#087F5B] hover:bg-[#07543F] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs active:scale-95 transition-all cursor-pointer"
                  >
                    <Navigation className="w-3.5 h-3.5 fill-current" />
                    <span>Get Directions</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* ─── MASJID DETAIL POPUP SHEET ─── */}
      {selectedMasjid && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end justify-center p-0 max-w-[430px] mx-auto animate-in fade-in duration-200">
          <div className="w-full bg-white rounded-t-3xl max-h-[85vh] overflow-y-auto p-5 shadow-2xl flex flex-col animate-in slide-in-from-bottom-6 duration-300">
            <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mb-3 shrink-0"></div>

            <div className="flex items-start justify-between mb-4">
              <div>
                <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-[#07543F] text-[10px] font-extrabold uppercase tracking-wider">
                  {selectedMasjid.distanceFormatted} away · {selectedMasjid.travelTimeEstimate}
                </span>
                <h3 className="text-lg font-extrabold text-slate-900 leading-tight mt-1.5">
                  {selectedMasjid.name}
                </h3>
                <p className="text-xs text-slate-500 mt-1 flex items-start gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span>{selectedMasjid.address}</span>
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedMasjid(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-800 transition-colors -mr-1"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Coordinates info */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 mb-4 text-xs space-y-1">
              <div className="flex items-center justify-between text-slate-600">
                <span>GPS Coordinates:</span>
                <span className="font-mono font-bold text-slate-900">
                  {selectedMasjid.latitude.toFixed(4)}°N, {selectedMasjid.longitude.toFixed(4)}°E
                </span>
              </div>
              {selectedMasjid.denomination && (
                <div className="flex items-center justify-between text-slate-600 pt-1 border-t border-slate-200/50">
                  <span>Denomination / Tradition:</span>
                  <span className="font-semibold text-emerald-800 capitalize">
                    {selectedMasjid.denomination}
                  </span>
                </div>
              )}
            </div>

            {/* Optional Phone if tagged in OpenStreetMap */}
            {selectedMasjid.phone && (
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100 mb-4 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-[#087F5B]" />
                  <span className="font-semibold text-slate-800">{selectedMasjid.phone}</span>
                </div>
                <a 
                  href={`tel:${selectedMasjid.phone}`} 
                  className="font-bold text-[#087F5B] hover:underline"
                >
                  Call Mosque
                </a>
              </div>
            )}

            {/* Two Action Buttons: View on Map & Get Directions */}
            <div className="grid grid-cols-2 gap-2 mt-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedMasjid(selectedMasjid);
                  setViewMode('map');
                }}
                className="py-3 px-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <MapIcon className="w-4 h-4 text-[#087F5B]" />
                <span>Show on Map</span>
              </button>

              <button
                type="button"
                onClick={() => handleOpenDirections(selectedMasjid)}
                className="py-3 px-3 rounded-2xl bg-gradient-to-r from-[#087F5B] to-[#07543F] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"
              >
                <Navigation className="w-4 h-4 fill-current" />
                <span>Get Directions</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default MasjidLocatorScreen;

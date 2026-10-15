import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Navigation, 
  MapPin, 
  List, 
  Maximize2, 
  Crosshair, 
  X, 
  ExternalLink,
  Phone,
  Clock,
  Compass
} from 'lucide-react';
import { NearbyMasjid, getDirectionsUrl } from '../../services/masjidLocatorService';
import { MosqueIcon } from '../common/IslamicIcons';

interface MasjidLeafletMapProps {
  userLocation: { latitude: number; longitude: number } | null;
  masjids: NearbyMasjid[];
  selectedMasjid: NearbyMasjid | null;
  onSelectMasjid: (masjid: NearbyMasjid | null) => void;
  onReturnToList: () => void;
  className?: string;
}

export const MasjidLeafletMap: React.FC<MasjidLeafletMapProps> = ({
  userLocation,
  masjids,
  selectedMasjid,
  onSelectMasjid,
  onReturnToList,
  className = ''
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);

  // Initialize Leaflet map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Default center fallback
    const initialLat = userLocation?.latitude ?? (masjids[0]?.latitude || 13.0827);
    const initialLng = userLocation?.longitude ?? (masjids[0]?.longitude || 80.2707);

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 14,
      zoomControl: false // custom position or clean mobile layout
    });

    // Add standard OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Zoom control at bottom-right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;
    mapInstanceRef.current = map;

    // Invalidate size to ensure container fits properly
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 150);

    return () => {
      clearTimeout(timer);
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update user location marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !userLocation) return;

    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
    }

    // Custom pulsing SVG beacon for user location
    const userIcon = L.divIcon({
      className: 'user-location-marker',
      html: `
        <div style="position: relative; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;">
          <div style="position: absolute; width: 24px; height: 24px; background: rgba(59, 111, 216, 0.25); border-radius: 9999px; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="position: relative; width: 14px; height: 14px; background: #2563EB; border: 2.5px solid #FFFFFF; border-radius: 9999px; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>
        </div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    const marker = L.marker([userLocation.latitude, userLocation.longitude], {
      icon: userIcon,
      zIndexOffset: 1000
    }).addTo(map);

    marker.bindTooltip('Your Location', {
      permanent: false,
      direction: 'top',
      offset: [0, -10]
    });

    userMarkerRef.current = marker;
  }, [userLocation]);

  // Update Masjid markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();

    if (masjids.length === 0) return;

    const latLngBounds = L.latLngBounds([]);
    if (userLocation) {
      latLngBounds.extend([userLocation.latitude, userLocation.longitude]);
    }

    masjids.forEach((masjid) => {
      const isSelected = selectedMasjid?.id === masjid.id;
      latLngBounds.extend([masjid.latitude, masjid.longitude]);

      // Custom Mosque SVG Pin Icon
      const pinColor = isSelected ? '#D4A72C' : '#087F5B';
      const pinBg = isSelected ? '#07543F' : '#FFFFFF';
      const iconSize = isSelected ? 38 : 32;

      const masjidIcon = L.divIcon({
        className: `masjid-marker-${masjid.id}`,
        html: `
          <div style="position: relative; width: ${iconSize}px; height: ${iconSize + 8}px; display: flex; flex-direction: column; align-items: center; cursor: pointer; filter: drop-shadow(0 3px 6px rgba(0,0,0,0.25)); transition: transform 0.2s;">
            <div style="width: ${iconSize}px; height: ${iconSize}px; border-radius: 9999px; background: ${pinColor}; border: 2px solid #FFFFFF; display: flex; align-items: center; justify-content: center; color: ${pinBg};">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 2v3m-3-1l3-2 3 2"/>
                <path d="M4 21V10l8-6 8 6v11"/>
                <path d="M9 21v-6a3 3 0 0 1 6 0v6"/>
              </svg>
            </div>
            <div style="width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 8px solid ${pinColor}; margin-top: -2px;"></div>
          </div>
        `,
        iconSize: [iconSize, iconSize + 8],
        iconAnchor: [iconSize / 2, iconSize + 8]
      });

      const marker = L.marker([masjid.latitude, masjid.longitude], {
        icon: masjidIcon,
        zIndexOffset: isSelected ? 500 : 100
      }).addTo(markersLayer);

      // Tooltip with distance
      marker.bindTooltip(`<b>${masjid.name}</b><br/><span style="color:#087F5B;">${masjid.distanceFormatted}</span>`, {
        direction: 'top',
        offset: [0, -(iconSize + 8)]
      });

      marker.on('click', () => {
        onSelectMasjid(masjid);
      });
    });

    // Fit map to show all markers smoothly
    if (latLngBounds.isValid()) {
      map.fitBounds(latLngBounds, {
        padding: [40, 40],
        maxZoom: 16
      });
    }
  }, [masjids, selectedMasjid, userLocation, onSelectMasjid]);

  // Recenter to user location or selected masjid
  const handleRecenter = () => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (selectedMasjid) {
      map.flyTo([selectedMasjid.latitude, selectedMasjid.longitude], 16, {
        duration: 0.8
      });
      return;
    }

    if (userLocation) {
      map.flyTo([userLocation.latitude, userLocation.longitude], 15, {
        duration: 0.8
      });
      return;
    }

    if (masjids.length > 0) {
      map.flyTo([masjids[0].latitude, masjids[0].longitude], 14, {
        duration: 0.8
      });
    }
  };

  const handleOpenDirections = (masjid: NearbyMasjid) => {
    const url = getDirectionsUrl(masjid.latitude, masjid.longitude, masjid.name);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className={`w-full h-full relative flex flex-col overflow-hidden ${className}`}>
      
      {/* Top Floating Controls Bar */}
      <div className="absolute top-3 inset-x-3 z-[1000] flex items-center justify-between pointer-events-none">
        {/* Return to List Button */}
        <button
          type="button"
          onClick={onReturnToList}
          className="pointer-events-auto h-9 px-3 rounded-full bg-white/95 text-slate-800 hover:text-emerald-800 shadow-md border border-slate-200/80 text-xs font-bold flex items-center gap-1.5 backdrop-blur-xs active:scale-95 transition-all"
        >
          <List className="w-3.5 h-3.5 text-emerald-700" />
          <span>Masjid List</span>
        </button>

        {/* Right Tools (Recenter & Count) */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
          <span className="px-2.5 py-1 rounded-full bg-slate-900/85 text-white text-[11px] font-bold shadow-md backdrop-blur-xs">
            {masjids.length} Masjids
          </span>

          <button
            type="button"
            onClick={handleRecenter}
            className="w-9 h-9 rounded-full bg-white/95 text-slate-700 hover:text-[#087F5B] shadow-md border border-slate-200/80 flex items-center justify-center backdrop-blur-xs active:scale-95 transition-all"
            title="Recenter Map"
            aria-label="Recenter Map"
          >
            <Crosshair className="w-4 h-4 text-emerald-800" />
          </button>
        </div>
      </div>

      {/* Main Leaflet Map Canvas */}
      <div 
        ref={mapContainerRef} 
        className="w-full h-full z-0 bg-[#E8F0EA] min-h-[300px]"
        style={{ width: '100%', height: '100%' }}
      />

      {/* Bottom Floating Selected Masjid Card */}
      {selectedMasjid && (
        <div className="absolute bottom-4 inset-x-3 z-[1000] animate-in slide-in-from-bottom-4 duration-200">
          <div className="w-full bg-white/95 backdrop-blur-md rounded-2xl p-3.5 shadow-xl border border-emerald-500/30 flex flex-col gap-2">
            
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#087F5B] border border-emerald-200/60 flex items-center justify-center shrink-0">
                  <MosqueIcon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-extrabold text-slate-900 truncate">
                      {selectedMasjid.name}
                    </h3>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5 truncate">
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate">{selectedMasjid.address}</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onSelectMasjid(null)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center shrink-0 transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Distance & Actions Row */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-[#07543F] text-xs font-extrabold tabular-nums">
                  {selectedMasjid.distanceFormatted}
                </span>
                <span className="text-[11px] text-slate-500 font-medium">
                  {selectedMasjid.travelTimeEstimate}
                </span>
              </div>

              <button
                type="button"
                onClick={() => handleOpenDirections(selectedMasjid)}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#087F5B] to-[#065A41] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm hover:opacity-95 active:scale-95 transition-all cursor-pointer"
              >
                <Navigation className="w-3.5 h-3.5 fill-current" />
                <span>Get Directions</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

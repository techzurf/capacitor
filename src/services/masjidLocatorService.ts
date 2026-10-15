/**
 * Sirajan Muneera App - Nearby Masjid Locator Service
 * Integrates OpenStreetMap Overpass API and Nominatim Geocoding
 * 
 * Searches for real places of worship with:
 * - amenity=place_of_worship
 * - religion=muslim
 * 
 * Computes exact great-circle distance (Haversine formula),
 * extracts addresses, and formats for mobile display.
 */

export interface NearbyMasjid {
  id: string | number;
  name: string;
  arabicName?: string;
  latitude: number;
  longitude: number;
  distanceMeters: number;
  distanceFormatted: string;
  travelTimeEstimate: string;
  address: string;
  city?: string;
  postcode?: string;
  denomination?: string;
  hasWheelchair?: boolean;
  phone?: string;
  website?: string;
}

export interface GeocodedLocation {
  displayName: string;
  latitude: number;
  longitude: number;
  city?: string;
}

/**
 * Calculates great-circle distance between two coordinates in meters (Haversine)
 */
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Formats distance into human-readable string (e.g. "450 m" or "2.3 km")
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  const km = meters / 1000;
  return `${km.toFixed(1)} km`;
}

/**
 * Estimates driving / walking travel time based on distance
 */
export function estimateTravelTime(meters: number): string {
  if (meters <= 800) {
    const mins = Math.max(1, Math.round(meters / 80)); // walking approx 80m/min
    return `${mins} min walk`;
  }
  const km = meters / 1000;
  const mins = Math.max(3, Math.round(km * 2.5 + 2)); // urban driving
  return `${mins} mins drive`;
}

/**
 * Formats address from OpenStreetMap tags
 */
function extractAddressFromTags(tags: Record<string, string>, lat: number, lon: number): string {
  const parts: string[] = [];

  if (tags['addr:full']) {
    return tags['addr:full'];
  }

  const streetNumber = tags['addr:housenumber'] || '';
  const streetName = tags['addr:street'] || '';
  if (streetName) {
    parts.push(streetNumber ? `${streetNumber} ${streetName}` : streetName);
  }

  if (tags['addr:suburb']) parts.push(tags['addr:suburb']);
  if (tags['addr:district']) parts.push(tags['addr:district']);
  if (tags['addr:city']) parts.push(tags['addr:city']);
  if (tags['addr:postcode']) parts.push(tags['addr:postcode']);

  if (parts.length > 0) {
    return parts.join(', ');
  }

  // Fallback to nearby landmark or coordinates string
  return `Near coordinates (${lat.toFixed(3)}, ${lon.toFixed(3)})`;
}

const OVERPASS_SERVERS = [
  'https://overpass-api.de/api/interpreter',
  'https://lz4.overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter'
];

/**
 * Queries OpenStreetMap Overpass API for real Masjids around coordinates
 */
export async function fetchNearbyMasjidsFromOSM(
  userLat: number,
  userLon: number,
  radiusMeters = 8000
): Promise<NearbyMasjid[]> {
  // Overpass QL query: searches nodes, ways, and relations tagged amenity=place_of_worship & religion=muslim
  const query = `
    [out:json][timeout:20];
    (
      node["amenity"="place_of_worship"]["religion"="muslim"](around:${radiusMeters},${userLat},${userLon});
      way["amenity"="place_of_worship"]["religion"="muslim"](around:${radiusMeters},${userLat},${userLon});
      relation["amenity"="place_of_worship"]["religion"="muslim"](around:${radiusMeters},${userLat},${userLon});
    );
    out center 50;
  `.trim();

  let lastError: Error | null = null;

  for (const server of OVERPASS_SERVERS) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const response = await fetch(server, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'Accept': 'application/json'
        },
        body: `data=${encodeURIComponent(query)}`,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Overpass server returned HTTP ${response.status}`);
      }

      const data = await response.json();
      if (!data || !Array.isArray(data.elements)) {
        throw new Error('Invalid JSON format from Overpass API');
      }

      const masjids: NearbyMasjid[] = [];

      for (const el of data.elements) {
        const lat = el.lat ?? el.center?.lat;
        const lon = el.lon ?? el.center?.lon;
        if (typeof lat !== 'number' || typeof lon !== 'number') continue;

        const tags: Record<string, string> = el.tags || {};
        
        // Extract Name (multilingual check)
        const name =
          tags.name ||
          tags['name:en'] ||
          tags['name:ta'] ||
          tags['name:ar'] ||
          tags['name:ur'] ||
          tags.description ||
          'Masjid / Mosque';

        const arabicName = tags['name:ar'] || undefined;
        const dist = calculateDistanceMeters(userLat, userLon, lat, lon);
        const address = extractAddressFromTags(tags, lat, lon);

        masjids.push({
          id: el.id,
          name,
          arabicName,
          latitude: lat,
          longitude: lon,
          distanceMeters: dist,
          distanceFormatted: formatDistance(dist),
          travelTimeEstimate: estimateTravelTime(dist),
          address,
          city: tags['addr:city'],
          postcode: tags['addr:postcode'],
          denomination: tags.denomination,
          hasWheelchair: tags.wheelchair === 'yes',
          phone: tags.phone || tags['contact:phone'],
          website: tags.website || tags['contact:website']
        });
      }

      // Sort by distance (closest first!)
      masjids.sort((a, b) => a.distanceMeters - b.distanceMeters);

      return masjids;
    } catch (err: any) {
      console.warn(`Overpass server ${server} failed:`, err.message);
      lastError = err;
      // Try next server in list
    }
  }

  // Fallback: If Overpass is completely blocked, try OpenStreetMap Nominatim search
  try {
    const nominatimResults = await fetchMasjidsViaNominatim(userLat, userLon);
    if (nominatimResults.length > 0) {
      return nominatimResults;
    }
  } catch (nomErr) {
    console.warn('Nominatim fallback also failed:', nomErr);
  }

  throw lastError || new Error('Could not connect to OpenStreetMap service. Please check your network and try again.');
}

/**
 * Fallback to OpenStreetMap Nominatim if Overpass is temporarily unreachable
 */
async function fetchMasjidsViaNominatim(userLat: number, userLon: number): Promise<NearbyMasjid[]> {
  const delta = 0.08; // ~8km bounding box
  const viewbox = `${userLon - delta},${userLat + delta},${userLon + delta},${userLat - delta}`;
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=mosque&bounded=1&viewbox=${viewbox}&limit=30`;

  const res = await fetch(url, {
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'SirajanMuneeraApp/1.0'
    }
  });

  if (!res.ok) throw new Error(`Nominatim returned ${res.status}`);
  const items = await res.json();
  if (!Array.isArray(items)) return [];

  const masjids: NearbyMasjid[] = items.map((item: any, idx: number) => {
    const lat = parseFloat(item.lat);
    const lon = parseFloat(item.lon);
    const dist = calculateDistanceMeters(userLat, userLon, lat, lon);
    const rawName = item.name || item.display_name?.split(',')[0] || 'Masjid';

    return {
      id: item.place_id || `nom-${idx}`,
      name: rawName,
      latitude: lat,
      longitude: lon,
      distanceMeters: dist,
      distanceFormatted: formatDistance(dist),
      travelTimeEstimate: estimateTravelTime(dist),
      address: item.display_name || `Near (${lat.toFixed(3)}, ${lon.toFixed(3)})`
    };
  });

  masjids.sort((a, b) => a.distanceMeters - b.distanceMeters);
  return masjids;
}

/**
 * Searches for coordinates by city, area, locality, or postcode using OpenStreetMap Nominatim
 */
export async function searchGeocodeLocation(query: string): Promise<GeocodedLocation | null> {
  const clean = query.trim();
  if (!clean) return null;

  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(clean)}&limit=1`;

  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'SirajanMuneeraApp/1.0'
    }
  });

  if (!response.ok) {
    throw new Error('Failed to resolve location search');
  }

  const results = await response.json();
  if (!Array.isArray(results) || results.length === 0) {
    return null;
  }

  const first = results[0];
  return {
    displayName: first.display_name,
    latitude: parseFloat(first.lat),
    longitude: parseFloat(first.lon),
    city: first.address?.city || first.address?.town || first.address?.village || clean
  };
}

/**
 * Generates turn-by-turn directions URL to open in Google Maps or Native Maps
 */
export function getDirectionsUrl(lat: number, lon: number, name?: string): string {
  const label = name ? encodeURIComponent(name) : '';
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}&destination_place_id=${label}`;
}

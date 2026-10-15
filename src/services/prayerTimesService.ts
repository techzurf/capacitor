/**
 * Sirajan Muneera App - Global Prayer Times Service
 * Powered by the AlAdhan Prayer Times API (https://aladhan.com/prayer-times-api)
 * 
 * Provides:
 * - Real-time prayer calculation based on geographic coordinates or city/country
 * - Location detection (GPS) with reverse geocoding fallback
 * - Comprehensive Tamil Nadu and worldwide predefined locations
 * - Multiple prayer calculation methods (Karachi, MWL, ISNA, Umm Al-Qura, Egyptian, etc.)
 * - Asr calculation school selection (Shafi/Standard vs Hanafi)
 * - LocalStorage caching & graceful offline handling
 * - Accurate dynamic countdowns and midnight/date transitions
 */

export interface UserLocation {
  city: string;
  country: string;
  displayName: string;
  latitude: number;
  longitude: number;
  isGps: boolean;
  timezone?: string;
  state?: string;
}

export interface CalculationMethod {
  id: number;
  name: string;
  organization: string;
  region: string;
}

export type AsrSchool = 0 | 1; // 0 = Standard (Shafi, Maliki, Hanbali), 1 = Hanafi

export const CALCULATION_METHODS: CalculationMethod[] = [
  {
    id: 1,
    name: 'University of Islamic Sciences, Karachi',
    organization: 'Karachi, Pakistan',
    region: 'South Asia (India, Pakistan, Bangladesh, Sri Lanka)'
  },
  {
    id: 3,
    name: 'Muslim World League (MWL)',
    organization: 'Makkah, Saudi Arabia',
    region: 'Europe, Far East, Global Default'
  },
  {
    id: 2,
    name: 'Islamic Society of North America (ISNA)',
    organization: 'Plainfield, Indiana, USA',
    region: 'North America (USA & Canada)'
  },
  {
    id: 4,
    name: 'Umm Al-Qura University, Makkah',
    organization: 'Makkah, Saudi Arabia',
    region: 'Arabian Peninsula (Saudi Arabia, UAE, Qatar, etc.)'
  },
  {
    id: 5,
    name: 'Egyptian General Authority of Survey',
    organization: 'Cairo, Egypt',
    region: 'Africa, Syria, Lebanon, Middle East'
  },
  {
    id: 11,
    name: 'Majlis Ugama Islam Singapura (MUIS)',
    organization: 'Singapore',
    region: 'Southeast Asia (Singapore, Malaysia, Indonesia)'
  },
  {
    id: 13,
    name: 'Diyanet İşleri Başkanlığı, Turkey',
    organization: 'Ankara, Turkey',
    region: 'Turkey & Central Asia'
  }
];

export const ASR_SCHOOLS = [
  { id: 0 as AsrSchool, name: "Shafi'i, Maliki, Hanbali (Standard)", description: 'Shadow length = object length (Earlier Asr)' },
  { id: 1 as AsrSchool, name: 'Hanafi', description: 'Shadow length = 2x object length (Later Asr)' }
];

/**
 * Curated Predefined Locations
 * Prioritizes Tamil Nadu locations, major Indian cities, and global Islamic hubs.
 */
export const PREDEFINED_LOCATIONS: {
  category: 'Tamil Nadu' | 'India' | 'Middle East' | 'Global';
  locations: UserLocation[];
}[] = [
  {
    category: 'Tamil Nadu',
    locations: [
      {
        city: 'Chennai',
        state: 'Tamil Nadu',
        country: 'India',
        displayName: 'Chennai, Tamil Nadu',
        latitude: 13.0827,
        longitude: 80.2707,
        isGps: false,
        timezone: 'Asia/Kolkata'
      },
      {
        city: 'Coimbatore',
        state: 'Tamil Nadu',
        country: 'India',
        displayName: 'Coimbatore, Tamil Nadu',
        latitude: 11.0168,
        longitude: 76.9558,
        isGps: false,
        timezone: 'Asia/Kolkata'
      },
      {
        city: 'Madurai',
        state: 'Tamil Nadu',
        country: 'India',
        displayName: 'Madurai, Tamil Nadu',
        latitude: 9.9252,
        longitude: 78.1198,
        isGps: false,
        timezone: 'Asia/Kolkata'
      },
      {
        city: 'Tirunelveli',
        state: 'Tamil Nadu',
        country: 'India',
        displayName: 'Tirunelveli, Tamil Nadu',
        latitude: 8.7139,
        longitude: 77.7567,
        isGps: false,
        timezone: 'Asia/Kolkata'
      },
      {
        city: 'Tiruchirappalli',
        state: 'Tamil Nadu',
        country: 'India',
        displayName: 'Trichy (Tiruchirappalli), TN',
        latitude: 10.7905,
        longitude: 78.7047,
        isGps: false,
        timezone: 'Asia/Kolkata'
      },
      {
        city: 'Salem',
        state: 'Tamil Nadu',
        country: 'India',
        displayName: 'Salem, Tamil Nadu',
        latitude: 11.6643,
        longitude: 78.1460,
        isGps: false,
        timezone: 'Asia/Kolkata'
      },
      {
        city: 'Vellore',
        state: 'Tamil Nadu',
        country: 'India',
        displayName: 'Vellore, Tamil Nadu',
        latitude: 12.9165,
        longitude: 79.1325,
        isGps: false,
        timezone: 'Asia/Kolkata'
      },
      {
        city: 'Thanjavur',
        state: 'Tamil Nadu',
        country: 'India',
        displayName: 'Thanjavur, Tamil Nadu',
        latitude: 10.7870,
        longitude: 79.1378,
        isGps: false,
        timezone: 'Asia/Kolkata'
      },
      {
        city: 'Kayalpatnam',
        state: 'Tamil Nadu',
        country: 'India',
        displayName: 'Kayalpatnam, Tamil Nadu',
        latitude: 8.5683,
        longitude: 78.1287,
        isGps: false,
        timezone: 'Asia/Kolkata'
      },
      {
        city: 'Vaniyambadi',
        state: 'Tamil Nadu',
        country: 'India',
        displayName: 'Vaniyambadi, Tamil Nadu',
        latitude: 12.6825,
        longitude: 78.6186,
        isGps: false,
        timezone: 'Asia/Kolkata'
      }
    ]
  },
  {
    category: 'India',
    locations: [
      {
        city: 'Mumbai',
        state: 'Maharashtra',
        country: 'India',
        displayName: 'Mumbai, Maharashtra',
        latitude: 19.0760,
        longitude: 72.8777,
        isGps: false,
        timezone: 'Asia/Kolkata'
      },
      {
        city: 'New Delhi',
        state: 'Delhi',
        country: 'India',
        displayName: 'New Delhi, India',
        latitude: 28.6139,
        longitude: 77.2090,
        isGps: false,
        timezone: 'Asia/Kolkata'
      },
      {
        city: 'Bengaluru',
        state: 'Karnataka',
        country: 'India',
        displayName: 'Bengaluru (Bangalore), KA',
        latitude: 12.9716,
        longitude: 77.5946,
        isGps: false,
        timezone: 'Asia/Kolkata'
      },
      {
        city: 'Hyderabad',
        state: 'Telangana',
        country: 'India',
        displayName: 'Hyderabad, Telangana',
        latitude: 17.3850,
        longitude: 78.4867,
        isGps: false,
        timezone: 'Asia/Kolkata'
      },
      {
        city: 'Kozhikode',
        state: 'Kerala',
        country: 'India',
        displayName: 'Calicut (Kozhikode), Kerala',
        latitude: 11.2588,
        longitude: 75.7804,
        isGps: false,
        timezone: 'Asia/Kolkata'
      },
      {
        city: 'Kolkata',
        state: 'West Bengal',
        country: 'India',
        displayName: 'Kolkata, West Bengal',
        latitude: 22.5726,
        longitude: 88.3639,
        isGps: false,
        timezone: 'Asia/Kolkata'
      }
    ]
  },
  {
    category: 'Middle East',
    locations: [
      {
        city: 'Makkah',
        country: 'Saudi Arabia',
        displayName: 'Makkah Al-Mukarramah, KSA',
        latitude: 21.4225,
        longitude: 39.8262,
        isGps: false,
        timezone: 'Asia/Riyadh'
      },
      {
        city: 'Madinah',
        country: 'Saudi Arabia',
        displayName: 'Al-Madinah Al-Munawwarah, KSA',
        latitude: 24.5247,
        longitude: 39.5692,
        isGps: false,
        timezone: 'Asia/Riyadh'
      },
      {
        city: 'Riyadh',
        country: 'Saudi Arabia',
        displayName: 'Riyadh, Saudi Arabia',
        latitude: 24.7136,
        longitude: 46.6753,
        isGps: false,
        timezone: 'Asia/Riyadh'
      },
      {
        city: 'Dubai',
        country: 'United Arab Emirates',
        displayName: 'Dubai, UAE',
        latitude: 25.2048,
        longitude: 55.2708,
        isGps: false,
        timezone: 'Asia/Dubai'
      },
      {
        city: 'Abu Dhabi',
        country: 'United Arab Emirates',
        displayName: 'Abu Dhabi, UAE',
        latitude: 24.4539,
        longitude: 54.3773,
        isGps: false,
        timezone: 'Asia/Dubai'
      },
      {
        city: 'Doha',
        country: 'Qatar',
        displayName: 'Doha, Qatar',
        latitude: 25.2854,
        longitude: 51.5310,
        isGps: false,
        timezone: 'Asia/Qatar'
      },
      {
        city: 'Kuwait City',
        country: 'Kuwait',
        displayName: 'Kuwait City, Kuwait',
        latitude: 29.3759,
        longitude: 47.9774,
        isGps: false,
        timezone: 'Asia/Kuwait'
      }
    ]
  },
  {
    category: 'Global',
    locations: [
      {
        city: 'London',
        country: 'United Kingdom',
        displayName: 'London, United Kingdom',
        latitude: 51.5074,
        longitude: -0.1278,
        isGps: false,
        timezone: 'Europe/London'
      },
      {
        city: 'New York',
        country: 'United States',
        displayName: 'New York, USA',
        latitude: 40.7128,
        longitude: -74.0060,
        isGps: false,
        timezone: 'America/New_York'
      },
      {
        city: 'Chicago',
        country: 'United States',
        displayName: 'Chicago, USA',
        latitude: 41.8781,
        longitude: -87.6298,
        isGps: false,
        timezone: 'America/Chicago'
      },
      {
        city: 'Toronto',
        country: 'Canada',
        displayName: 'Toronto, Canada',
        latitude: 43.6532,
        longitude: -79.3832,
        isGps: false,
        timezone: 'America/Toronto'
      },
      {
        city: 'Kuala Lumpur',
        country: 'Malaysia',
        displayName: 'Kuala Lumpur, Malaysia',
        latitude: 3.1390,
        longitude: 101.6869,
        isGps: false,
        timezone: 'Asia/Kuala_Lumpur'
      },
      {
        city: 'Singapore',
        country: 'Singapore',
        displayName: 'Singapore',
        latitude: 1.3521,
        longitude: 103.8198,
        isGps: false,
        timezone: 'Asia/Singapore'
      },
      {
        city: 'Jakarta',
        country: 'Indonesia',
        displayName: 'Jakarta, Indonesia',
        latitude: -6.2088,
        longitude: 106.8456,
        isGps: false,
        timezone: 'Asia/Jakarta'
      },
      {
        city: 'Istanbul',
        country: 'Turkey',
        displayName: 'Istanbul, Turkey',
        latitude: 41.0082,
        longitude: 28.9784,
        isGps: false,
        timezone: 'Europe/Istanbul'
      },
      {
        city: 'Cairo',
        country: 'Egypt',
        displayName: 'Cairo, Egypt',
        latitude: 30.0444,
        longitude: 31.2357,
        isGps: false,
        timezone: 'Africa/Cairo'
      },
      {
        city: 'Sydney',
        country: 'Australia',
        displayName: 'Sydney, Australia',
        latitude: -33.8688,
        longitude: 151.2093,
        isGps: false,
        timezone: 'Australia/Sydney'
      }
    ]
  }
];

export const DEFAULT_GLOBAL_LOCATION: UserLocation = PREDEFINED_LOCATIONS[0].locations[0]; // Chennai as starter, easily changed

export interface AlAdhanTimings {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Sunset: string;
  Maghrib: string;
  Isha: string;
  Imsak: string;
  Midnight: string;
  Firstthird?: string;
  Lastthird?: string;
}

export interface AlAdhanApiResponse {
  code: number;
  status: string;
  data: {
    timings: AlAdhanTimings;
    date: {
      readable: string;
      timestamp: string;
      gregorian: {
        date: string;
        format: string;
        day: string;
        weekday: { en: string };
        month: { number: number; en: string };
        year: string;
      };
      hijri: {
        date: string;
        format?: string;
        day: string;
        weekday: { en: string; ar: string };
        month: { number: number; en: string; ar: string; days?: number };
        year: string;
        designation?: { abbreviated: string; expanded: string };
        holidays?: string[];
      };
    };
    meta: {
      latitude: number;
      longitude: number;
      timezone: string;
      method: {
        id: number;
        name: string;
      };
      latitudeAdjustmentMethod: string;
      midnightMode: string;
      school: string;
    };
  };
}

export interface ProcessedPrayerTimings {
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
  imsak: string;
  midnight: string;
}

export interface PrayerDayResult {
  timings: ProcessedPrayerTimings;
  rawTimings: AlAdhanTimings;
  dateInfo: {
    gregorianReadable: string;
    gregorianDate: string; // DD-MM-YYYY
    dayOfWeek: string;
    hijriDay: string;
    hijriMonthEn: string;
    hijriMonthAr: string;
    hijriYear: string;
    hijriDateFormatted: string;
    holidays: string[];
  };
  meta: {
    latitude: number;
    longitude: number;
    timezone: string;
    methodName: string;
    methodId: number;
    school: string;
  };
  isCached: boolean;
  isOutdated?: boolean;
  cachedAt?: number;
  fetchError?: string | null;
}

/**
 * Strips any timezone label e.g. "05:14 (IST)" -> "05:14"
 */
export function cleanAlAdhanTime(timeStr: string | undefined): string {
  if (!timeStr) return '00:00';
  return timeStr.trim().split(' ')[0];
}

/**
 * Formats a 24-hour time "13:05" to 12-hour "01:05 PM"
 */
export function formatTo12Hour(time24: string): string {
  if (!time24) return '—';
  const clean = cleanAlAdhanTime(time24);
  const parts = clean.split(':');
  if (parts.length < 2) return time24;

  let h = parseInt(parts[0], 10);
  const m = String(parseInt(parts[1], 10)).padStart(2, '0');
  if (isNaN(h)) return time24;

  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;

  return `${String(h).padStart(2, '0')}:${m} ${ampm}`;
}

/**
 * Normalizes any time string into standard 24h "HH:MM:SS"
 */
export function to24HourString(timeStr: string): string {
  const clean = cleanAlAdhanTime(timeStr);
  const parts = clean.split(':');
  const h = parts[0] ? String(parseInt(parts[0], 10)).padStart(2, '0') : '00';
  const m = parts[1] ? String(parseInt(parts[1], 10)).padStart(2, '0') : '00';
  const s = parts[2] ? String(parseInt(parts[2], 10)).padStart(2, '0') : '00';
  return `${h}:${m}:${s}`;
}

/**
 * Calculates a reasonable congregation Iqamah time based on prayer traditions
 */
export function computeIqamahOffset(adhan24: string, prayerId: 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha' | 'sunrise'): string {
  if (prayerId === 'sunrise') return '—';

  const clean = cleanAlAdhanTime(adhan24);
  const [hStr, mStr] = clean.split(':');
  let h = parseInt(hStr, 10);
  let m = parseInt(mStr, 10);

  // Standard reasonable intervals between Adhan and Iqamah
  let offset = 20;
  if (prayerId === 'fajr') offset = 20;
  else if (prayerId === 'dhuhr') offset = 20;
  else if (prayerId === 'asr') offset = 18;
  else if (prayerId === 'maghrib') offset = 10;
  else if (prayerId === 'isha') offset = 15;

  m += offset;
  while (m >= 60) {
    m -= 60;
    h = (h + 1) % 24;
  }

  const ampm = h >= 12 ? 'PM' : 'AM';
  let h12 = h % 12;
  if (h12 === 0) h12 = 12;

  return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`;
}

/**
 * Returns formatted date string DD-MM-YYYY for AlAdhan API
 */
export function getFormattedDateForApi(d = new Date()): string {
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

/**
 * Returns YYYY-MM-DD format for key indexing
 */
export function getIsoDateKey(d = new Date()): string {
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${year}-${month}-${day}`;
}

/**
 * Recommends an appropriate calculation method ID based on country or timezone
 */
export function getRecommendedMethod(country: string, timezone?: string): number {
  const c = country.toLowerCase();
  const tz = (timezone || '').toLowerCase();

  if (c.includes('india') || c.includes('pakistan') || c.includes('bangladesh') || c.includes('sri lanka')) {
    return 1; // Karachi
  }
  if (c.includes('saudi') || c.includes('makkah') || c.includes('medina') || c.includes('qatar') || c.includes('yemen')) {
    return 4; // Umm Al-Qura
  }
  if (c.includes('united arab emirates') || c.includes('uae') || c.includes('dubai') || c.includes('kuwait')) {
    return 4; // Umm Al-Qura
  }
  if (c.includes('united states') || c.includes('usa') || c.includes('canada') || tz.includes('america')) {
    return 2; // ISNA
  }
  if (c.includes('egypt') || c.includes('sudan') || c.includes('libya') || c.includes('lebanon') || c.includes('syria')) {
    return 5; // Egyptian
  }
  if (c.includes('singapore') || c.includes('malaysia') || c.includes('indonesia') || c.includes('brunei')) {
    return 11; // Singapore MUIS
  }
  if (c.includes('turkey') || c.includes('türkiye')) {
    return 13; // Diyanet
  }
  // Default for UK, Europe, Australia, and worldwide
  return 3; // MWL
}

/**
 * Client-Side Caching in LocalStorage
 */
const CACHE_PREFIX = 'sm_aladhan_v1_';

function getCacheKey(location: UserLocation, dateStr: string, methodId: number, school: AsrSchool): string {
  const locKey = location.isGps
    ? `${location.latitude.toFixed(3)}_${location.longitude.toFixed(3)}`
    : `${location.city.toLowerCase()}_${location.country.toLowerCase()}`;
  return `${CACHE_PREFIX}${locKey}_${dateStr}_m${methodId}_s${school}`;
}

function saveToCache(key: string, data: PrayerDayResult) {
  try {
    const payload = {
      ...data,
      cachedAt: Date.now()
    };
    localStorage.setItem(key, JSON.stringify(payload));
  } catch (err) {
    console.warn('LocalStorage save failed:', err);
  }
}

function getFromCache(key: string): PrayerDayResult | null {
  try {
    const item = localStorage.getItem(key);
    if (!item) return null;
    const parsed = JSON.parse(item);
    return {
      ...parsed,
      isCached: true
    };
  } catch {
    return null;
  }
}

/**
 * Fetches prayer timings from AlAdhan API with full timeout, caching, and fallback support.
 */
export async function fetchPrayerTimings(
  location: UserLocation,
  date: Date = new Date(),
  methodId: number = 1,
  school: AsrSchool = 0
): Promise<PrayerDayResult> {
  const dateStr = getFormattedDateForApi(date);
  const cacheKey = getCacheKey(location, dateStr, methodId, school);

  // 1. Check local cache first for instant initial display
  const cached = getFromCache(cacheKey);

  // 2. Build AlAdhan API URL
  let url = '';
  if (location.latitude && location.longitude && Math.abs(location.latitude) > 0.001) {
    url = `https://api.aladhan.com/v1/timings/${dateStr}?latitude=${location.latitude}&longitude=${location.longitude}&method=${methodId}&school=${school}`;
  } else {
    const encodedCity = encodeURIComponent(location.city || 'Chennai');
    const encodedCountry = encodeURIComponent(location.country || 'India');
    url = `https://api.aladhan.com/v1/timingsByCity/${dateStr}?city=${encodedCity}&country=${encodedCountry}&method=${methodId}&school=${school}`;
  }

  // 3. Network fetch with 7-second timeout
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json'
      }
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`AlAdhan API returned status ${res.status}`);
    }

    const json: AlAdhanApiResponse = await res.json();
    if (json.code !== 200 || !json.data || !json.data.timings) {
      throw new Error(json.status || 'Invalid response from AlAdhan API');
    }

    const { timings, date: apiDate, meta } = json.data;

    const result: PrayerDayResult = {
      timings: {
        fajr: cleanAlAdhanTime(timings.Fajr),
        sunrise: cleanAlAdhanTime(timings.Sunrise),
        dhuhr: cleanAlAdhanTime(timings.Dhuhr),
        asr: cleanAlAdhanTime(timings.Asr),
        maghrib: cleanAlAdhanTime(timings.Maghrib),
        isha: cleanAlAdhanTime(timings.Isha),
        imsak: cleanAlAdhanTime(timings.Imsak),
        midnight: cleanAlAdhanTime(timings.Midnight)
      },
      rawTimings: timings,
      dateInfo: {
        gregorianReadable: apiDate.readable || date.toDateString(),
        gregorianDate: apiDate.gregorian.date,
        dayOfWeek: apiDate.gregorian.weekday.en,
        hijriDay: apiDate.hijri.day,
        hijriMonthEn: apiDate.hijri.month.en,
        hijriMonthAr: apiDate.hijri.month.ar,
        hijriYear: apiDate.hijri.year,
        hijriDateFormatted: `${apiDate.hijri.day} ${apiDate.hijri.month.ar || apiDate.hijri.month.en} ${apiDate.hijri.year} هـ`,
        holidays: apiDate.hijri.holidays || []
      },
      meta: {
        latitude: meta.latitude,
        longitude: meta.longitude,
        timezone: meta.timezone,
        methodName: meta.method?.name || 'Selected Method',
        methodId: meta.method?.id || methodId,
        school: meta.school || (school === 1 ? 'Hanafi' : 'Standard')
      },
      isCached: false,
      isOutdated: false,
      cachedAt: Date.now()
    };

    // Save fresh response to cache
    saveToCache(cacheKey, result);

    return result;
  } catch (err: any) {
    console.warn(`AlAdhan API fetch failed (${err.message}). Checking cache...`);

    // If we have cached data, return it with clear outdated indicator
    if (cached) {
      return {
        ...cached,
        isCached: true,
        isOutdated: true,
        fetchError: `Could not connect to live API (${err.message || 'Network error'}). Showing cached timings.`
      };
    }

    // Try finding ANY cached timing for this location to avoid showing nothing
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(CACHE_PREFIX) && k.includes(location.city.toLowerCase())) {
        const item = getFromCache(k);
        if (item) {
          return {
            ...item,
            isCached: true,
            isOutdated: true,
            fetchError: `Live API temporarily unreachable. Showing recent cached timings for ${location.displayName}.`
          };
        }
      }
    }

    // Rethrow error if neither network nor cache are available
    throw new Error(
      `Unable to retrieve prayer times for ${location.displayName}. Please check your internet connection and tap retry.`
    );
  }
}

/**
 * Fetches full monthly calendar from AlAdhan API
 */
export async function fetchMonthlyPrayerCalendar(
  location: UserLocation,
  year: number,
  month: number,
  methodId: number = 1,
  school: AsrSchool = 0
): Promise<any[]> {
  const cacheKey = `sm_monthly_${location.latitude.toFixed(2)}_${location.longitude.toFixed(2)}_${year}_${month}_m${methodId}_s${school}`;
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch {
    // continue
  }

  let url = '';
  if (location.latitude && location.longitude && Math.abs(location.latitude) > 0.001) {
    url = `https://api.aladhan.com/v1/calendar/${year}/${month}?latitude=${location.latitude}&longitude=${location.longitude}&method=${methodId}&school=${school}`;
  } else {
    url = `https://api.aladhan.com/v1/calendarByCity/${year}/${month}?city=${encodeURIComponent(location.city)}&country=${encodeURIComponent(location.country)}&method=${methodId}&school=${school}`;
  }

  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch monthly calendar');
  const json = await res.json();
  if (json.code === 200 && Array.isArray(json.data)) {
    try {
      localStorage.setItem(cacheKey, JSON.stringify(json.data));
    } catch {}
    return json.data;
  }
  return [];
}

/**
 * Reverse geocodes coordinates to a friendly City, Country string
 */
export async function reverseGeocodeCoordinates(lat: number, lng: number): Promise<{
  city: string;
  country: string;
  displayName: string;
  state?: string;
}> {
  try {
    // Use BigDataCloud free client reverse geocoding (fast, CORS-friendly, no API key needed)
    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`;
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (res.ok) {
      const data = await res.json();
      const city = data.city || data.locality || data.principalSubdivision || 'Detected City';
      const country = data.countryName || 'Detected Country';
      const state = data.principalSubdivision || '';
      const displayName = state ? `${city}, ${state}` : `${city}, ${country}`;
      return { city, country, displayName, state };
    }
  } catch {
    // fallback
  }

  // Fallback: check distance to predefined cities
  let closest = DEFAULT_GLOBAL_LOCATION;
  let minDistance = Number.MAX_VALUE;

  for (const group of PREDEFINED_LOCATIONS) {
    for (const loc of group.locations) {
      const dLat = loc.latitude - lat;
      const dLng = loc.longitude - lng;
      const dist = dLat * dLat + dLng * dLng;
      if (dist < minDistance) {
        minDistance = dist;
        closest = loc;
      }
    }
  }

  return {
    city: closest.city,
    country: closest.country,
    displayName: `${closest.city} (GPS Detected)`,
    state: closest.state
  };
}

/**
 * Requests device GPS location and returns coordinates + resolved city name
 */
export function requestDeviceLocation(): Promise<UserLocation> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser or device.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        try {
          const geo = await reverseGeocodeCoordinates(lat, lng);
          resolve({
            city: geo.city,
            country: geo.country,
            state: geo.state,
            displayName: geo.displayName,
            latitude: lat,
            longitude: lng,
            isGps: true
          });
        } catch {
          resolve({
            city: 'Current Location',
            country: 'Detected via GPS',
            displayName: 'Current Location (GPS)',
            latitude: lat,
            longitude: lng,
            isGps: true
          });
        }
      },
      (err) => {
        let msg = 'Unable to access your location.';
        if (err.code === err.PERMISSION_DENIED) {
          msg = 'Location permission was denied. You can select your city manually.';
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          msg = 'Location information is unavailable on your device.';
        } else if (err.code === err.TIMEOUT) {
          msg = 'The request to obtain your location timed out.';
        }
        reject(new Error(msg));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      }
    );
  });
}

// Sirajan Muneera App - Static In-Memory Data Store (Frontend Prototype)
// Disconnected from external Supabase backend; operates fully client-side.

export interface PrayerTimeRecord {
  id: string;
  prayer_date: string; // 'YYYY-MM-DD'
  date?: string; // alias for compatibility
  fajr: string; // 'HH:MM' or 'HH:MM:SS'
  sunrise: string | null;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
  jummah_1: string | null;
  jummah_2: string | null;
  jummah_3: string | null;
  created_at?: string;
  updated_at?: string;
}

export type CreatePrayerTimeInput = Omit<PrayerTimeRecord, 'id' | 'created_at' | 'updated_at'>;

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Initial default seed record for Sirajan Muneera App
export function getInitialSeedRecord(dateStr?: string): PrayerTimeRecord {
  const d = dateStr || getTodayDateString();
  return {
    id: 'seed-record-' + d,
    prayer_date: d,
    date: d,
    fajr: '05:12:00',
    sunrise: '06:28:00',
    dhuhr: '13:04:00',
    asr: '16:32:00',
    maghrib: '19:14:00',
    isha: '20:36:00',
    jummah_1: '13:15:00',
    jummah_2: '14:15:00',
    jummah_3: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

// In-memory local stores for static prototype
const localPrayersStore: Record<string, PrayerTimeRecord> = {
  [getTodayDateString()]: getInitialSeedRecord(),
};

// ============================================================================
// Client & Config Stubs (UI Prototype Mode - No Network Calls)
// ============================================================================
export const supabase = null;

export function getSupabaseInitError(): string {
  return '';
}

export function getSupabaseConfig(): { url: string; key: string } {
  return { url: 'https://demo.sirajanmuneera.local', key: 'static-demo-key' };
}

export function isSupabaseConfigured(): boolean {
  return true;
}

export function saveSupabaseConfig(_url: string, _key: string) {
  // Prototype stub
}

export function getSupabaseClient() {
  return null;
}

// ============================================================================
// Prayer Times Operations (Static In-Memory)
// ============================================================================

export async function fetchPrayerTimesForDate(dateStr: string, _allowFallback: boolean = true): Promise<{
  data: PrayerTimeRecord | null;
  error: string | null;
  isDemo?: boolean;
}> {
  const existing = localPrayersStore[dateStr] || getInitialSeedRecord(dateStr);
  return { data: existing, error: null, isDemo: true };
}

export async function fetchAllPrayerTimes(limit = 40, _allowFallback: boolean = true): Promise<{
  data: PrayerTimeRecord[];
  error: string | null;
  isDemo?: boolean;
}> {
  let records = Object.values(localPrayersStore);
  if (records.length === 0) {
    records = [getInitialSeedRecord()];
  }
  records.sort((a, b) => b.prayer_date.localeCompare(a.prayer_date));
  return { data: records.slice(0, limit), error: null, isDemo: true };
}

export async function savePrayerTimes(record: {
  id?: string;
  prayer_date: string;
  date?: string;
  fajr: string;
  sunrise?: string | null;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
  jummah_1?: string | null;
  jummah_2?: string | null;
  jummah_3?: string | null;
}, _allowFallback: boolean = true): Promise<{
  data: PrayerTimeRecord | null;
  error: string | null;
  isDemo?: boolean;
}> {
  const pDate = (record.prayer_date || record.date || getTodayDateString()).trim();
  const savedRecord: PrayerTimeRecord = {
    id: record.id || 'prayer-' + Date.now(),
    prayer_date: pDate,
    date: pDate,
    fajr: normalizeTimeTo24h(record.fajr),
    sunrise: record.sunrise ? normalizeTimeTo24h(record.sunrise) : null,
    dhuhr: normalizeTimeTo24h(record.dhuhr),
    asr: normalizeTimeTo24h(record.asr),
    maghrib: normalizeTimeTo24h(record.maghrib),
    isha: normalizeTimeTo24h(record.isha),
    jummah_1: record.jummah_1 ? normalizeTimeTo24h(record.jummah_1) : null,
    jummah_2: record.jummah_2 ? normalizeTimeTo24h(record.jummah_2) : null,
    jummah_3: record.jummah_3 ? normalizeTimeTo24h(record.jummah_3) : null,
    updated_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  };
  localPrayersStore[pDate] = savedRecord;
  return { data: savedRecord, error: null, isDemo: true };
}

export async function deletePrayerTimes(idOrDate: string): Promise<{
  success: boolean;
  error: string | null;
  isDemo?: boolean;
}> {
  for (const [key, val] of Object.entries(localPrayersStore)) {
    if (val.id === idOrDate || val.prayer_date === idOrDate || val.date === idOrDate) {
      delete localPrayersStore[key];
    }
  }
  return { success: true, error: null, isDemo: true };
}

export async function testSupabaseConnection(): Promise<{
  connected: boolean;
  tableExists: boolean;
  message: string;
}> {
  return {
    connected: true,
    tableExists: true,
    message: 'Prototype Mode: Running with static local data.',
  };
}

// ============================================================================
// Formatting & Calculation Helpers
// ============================================================================

export function normalizeTimeTo24h(timeStr: string): string {
  if (!timeStr) return '00:00:00';
  const clean = timeStr.trim();

  if (/am|pm/i.test(clean)) {
    const isPM = /pm/i.test(clean);
    const parts = clean.replace(/am|pm/i, '').trim().split(':');
    let h = parseInt(parts[0], 10);
    const m = parts[1] ? parseInt(parts[1], 10) : 0;
    const s = parts[2] ? parseInt(parts[2], 10) : 0;

    if (isPM && h < 12) h += 12;
    if (!isPM && h === 12) h = 0;

    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  const parts = clean.split(':');
  const h = parts[0] ? String(parseInt(parts[0], 10)).padStart(2, '0') : '00';
  const m = parts[1] ? String(parseInt(parts[1], 10)).padStart(2, '0') : '00';
  const s = parts[2] ? String(parseInt(parts[2], 10)).padStart(2, '0') : '00';
  return `${h}:${m}:${s}`;
}

export function formatTo12h(timeStr: string | null | undefined): string {
  if (!timeStr) return '—';
  const clean = timeStr.trim();
  if (/am|pm/i.test(clean)) return clean;

  const parts = clean.split(':');
  if (parts.length < 2) return timeStr;

  let h = parseInt(parts[0], 10);
  const m = String(parseInt(parts[1], 10)).padStart(2, '0');
  if (isNaN(h)) return timeStr;

  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;

  return `${String(h).padStart(2, '0')}:${m} ${ampm}`;
}

export function formatToInputTime(timeStr: string | null | undefined): string {
  if (!timeStr) return '';
  const clean = timeStr.trim();
  if (/am|pm/i.test(clean)) {
    return normalizeTimeTo24h(clean).slice(0, 5);
  }
  return clean.slice(0, 5);
}

export function calculateDefaultIqamahTime(adhan24h: string, prayerId: string): string {
  const norm = normalizeTimeTo24h(adhan24h);
  const [hStr, mStr] = norm.split(':');
  let h = parseInt(hStr, 10);
  let m = parseInt(mStr, 10);

  let offsetMinutes = 20;
  if (prayerId === 'fajr') offsetMinutes = 23;
  else if (prayerId === 'dhuhr') offsetMinutes = 21;
  else if (prayerId === 'asr') offsetMinutes = 18;
  else if (prayerId === 'maghrib') offsetMinutes = 8;
  else if (prayerId === 'isha') offsetMinutes = 19;
  else if (prayerId === 'sunrise') return '—';

  m += offsetMinutes;
  while (m >= 60) {
    m -= 60;
    h = (h + 1) % 24;
  }

  const ampm = h >= 12 ? 'PM' : 'AM';
  let h12 = h % 12;
  if (h12 === 0) h12 = 12;

  return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`;
}

export interface ComputedPrayerInfo {
  prayersList: Array<{
    id: 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';
    name: string;
    arabicName: string;
    tamilName: string;
    adhanTime: string;
    iqamahTime: string;
    passed: boolean;
    current: boolean;
    isNext: boolean;
    rawDate: Date;
  }>;
  currentPrayer: {
    id: string;
    name: string;
    arabicName: string;
    adhanTime: string;
    iqamahTime: string;
  };
  nextPrayer: {
    id: string;
    name: string;
    arabicName: string;
    adhanTime: string;
    iqamahTime: string;
    secondsRemaining: number;
    rawTime: Date;
  };
  jummahInfo: {
    shiftsCount: number;
    description: string;
    shift1: string | null;
    shift2: string | null;
    shift3: string | null;
  };
}

export function computePrayersFromRecord(record: PrayerTimeRecord, now = new Date()): ComputedPrayerInfo {
  const pDate = record.prayer_date || record.date || getTodayDateString();
  const [year, month, day] = pDate.split('-').map(Number);

  const parseTime = (timeStr: string, isNextDay = false): Date => {
    const norm = normalizeTimeTo24h(timeStr);
    const [h, m, s] = norm.split(':').map(Number);
    const d = new Date(year, month - 1, day, h, m, s || 0);
    if (isNextDay) {
      d.setDate(d.getDate() + 1);
    }
    return d;
  };

  const fajrDate = parseTime(record.fajr);
  const dhuhrDate = parseTime(record.dhuhr);
  const asrDate = parseTime(record.asr);
  const maghribDate = parseTime(record.maghrib);
  const ishaDate = parseTime(record.isha);
  const tomorrowFajrDate = parseTime(record.fajr, true);

  const prayers = [
    {
      id: 'fajr' as const,
      name: 'Fajr',
      arabicName: 'الفجر',
      tamilName: 'ஃபஜ்ர்',
      adhanTime: formatTo12h(record.fajr),
      iqamahTime: calculateDefaultIqamahTime(record.fajr, 'fajr'),
      rawDate: fajrDate,
    },
    {
      id: 'dhuhr' as const,
      name: 'Dhuhr',
      arabicName: 'الظهر',
      tamilName: 'ளுஹர்',
      adhanTime: formatTo12h(record.dhuhr),
      iqamahTime: calculateDefaultIqamahTime(record.dhuhr, 'dhuhr'),
      rawDate: dhuhrDate,
    },
    {
      id: 'asr' as const,
      name: 'Asr',
      arabicName: 'العصر',
      tamilName: 'அஸர்',
      adhanTime: formatTo12h(record.asr),
      iqamahTime: calculateDefaultIqamahTime(record.asr, 'asr'),
      rawDate: asrDate,
    },
    {
      id: 'maghrib' as const,
      name: 'Maghrib',
      arabicName: 'المغرب',
      tamilName: 'மஃரிப்',
      adhanTime: formatTo12h(record.maghrib),
      iqamahTime: calculateDefaultIqamahTime(record.maghrib, 'maghrib'),
      rawDate: maghribDate,
    },
    {
      id: 'isha' as const,
      name: 'Isha',
      arabicName: 'العشاء',
      tamilName: 'இஷா',
      adhanTime: formatTo12h(record.isha),
      iqamahTime: calculateDefaultIqamahTime(record.isha, 'isha'),
      rawDate: ishaDate,
    },
  ];

  const nowMs = now.getTime();

  let nextIdx = prayers.findIndex(p => p.rawDate.getTime() > nowMs);
  let nextPrayerData;

  if (nextIdx !== -1) {
    const p = prayers[nextIdx];
    const diffSec = Math.max(0, Math.floor((p.rawDate.getTime() - nowMs) / 1000));
    nextPrayerData = {
      id: p.id,
      name: p.name,
      arabicName: p.arabicName,
      adhanTime: p.adhanTime,
      iqamahTime: p.iqamahTime,
      secondsRemaining: diffSec,
      rawTime: p.rawDate,
    };
  } else {
    nextIdx = 0;
    const diffSec = Math.max(0, Math.floor((tomorrowFajrDate.getTime() - nowMs) / 1000));
    nextPrayerData = {
      id: 'fajr',
      name: 'Fajr',
      arabicName: 'الفجر',
      adhanTime: formatTo12h(record.fajr),
      iqamahTime: calculateDefaultIqamahTime(record.fajr, 'fajr'),
      secondsRemaining: diffSec,
      rawTime: tomorrowFajrDate,
    };
  }

  let currentIdx = -1;
  for (let i = prayers.length - 1; i >= 0; i--) {
    if (prayers[i].rawDate.getTime() <= nowMs) {
      currentIdx = i;
      break;
    }
  }
  const currentPrayerData = currentIdx !== -1 ? prayers[currentIdx] : prayers[prayers.length - 1];

  const prayersList = prayers.map((p, idx) => ({
    ...p,
    passed: p.rawDate.getTime() < nowMs,
    current: idx === currentIdx,
    isNext: idx === nextIdx,
  }));

  const shifts: string[] = [];
  if (record.jummah_1) shifts.push(`1st ${formatTo12h(record.jummah_1)}`);
  if (record.jummah_2) shifts.push(`2nd ${formatTo12h(record.jummah_2)}`);
  if (record.jummah_3) shifts.push(`3rd ${formatTo12h(record.jummah_3)}`);

  const jummahDesc = shifts.length > 0 
    ? `Jummah: ${shifts.join(' · ')}` 
    : 'Jummah: 1st 1:15 PM · 2nd 2:15 PM';

  return {
    prayersList,
    currentPrayer: {
      id: currentPrayerData.id,
      name: currentPrayerData.name,
      arabicName: currentPrayerData.arabicName,
      adhanTime: currentPrayerData.adhanTime,
      iqamahTime: currentPrayerData.iqamahTime,
    },
    nextPrayer: nextPrayerData,
    jummahInfo: {
      shiftsCount: shifts.length > 0 ? shifts.length : 2,
      description: jummahDesc,
      shift1: record.jummah_1 ? formatTo12h(record.jummah_1) : '01:15 PM',
      shift2: record.jummah_2 ? formatTo12h(record.jummah_2) : '02:15 PM',
      shift3: record.jummah_3 ? formatTo12h(record.jummah_3) : null,
    },
  };
}

// ============================================================================
// Community Members Module (Static In-Memory)
// ============================================================================

export interface CommunityMember {
  id: string;
  full_name: string;
  mobile_number: string;
  gender: string | null;
  date_of_birth: string | null;
  address: string | null;
  notes: string | null;
  email?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateCommunityMemberInput {
  full_name: string;
  mobile_number: string;
  gender?: string | null;
  date_of_birth?: string | null;
  address?: string | null;
  notes?: string | null;
  email?: string | null;
}

const mockCommunityMembersStore: CommunityMember[] = [
  {
    id: 'mem-1',
    full_name: 'Mohammed Farooq',
    mobile_number: '+91 98401 23456',
    gender: 'Male',
    date_of_birth: '1988-06-14',
    address: 'Plot 14, Sirajan Muneera Enclave, Chennai',
    notes: 'Life member and volunteer',
    email: 'farooq.m@example.com',
    created_at: new Date(Date.now() - 86400000 * 20).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 20).toISOString(),
  },
  {
    id: 'mem-2',
    full_name: 'Abdul Rahman Syed',
    mobile_number: '+91 97902 34567',
    gender: 'Male',
    date_of_birth: '1992-03-22',
    address: 'No 45, 4th Cross St, Chennai',
    notes: 'Youth volunteer',
    email: 'abdul.syed@example.com',
    created_at: new Date(Date.now() - 86400000 * 15).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 15).toISOString(),
  },
  {
    id: 'mem-3',
    full_name: 'Fatima Zohra',
    mobile_number: '+91 94440 87654',
    gender: 'Female',
    date_of_birth: '1995-11-08',
    address: 'Flat B3, Crescent Apts, Chennai',
    notes: 'Sisters wing member',
    email: 'fatima.z@example.com',
    created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 10).toISOString(),
  },
];

export async function createCommunityMember(input: CreateCommunityMemberInput): Promise<{
  data: CommunityMember | null;
  error: string | null;
}> {
  const newMember: CommunityMember = {
    id: 'mem-' + Date.now(),
    full_name: input.full_name.trim(),
    mobile_number: input.mobile_number.trim(),
    gender: input.gender || null,
    date_of_birth: input.date_of_birth || null,
    address: input.address?.trim() || null,
    notes: input.notes?.trim() || null,
    email: input.email?.trim() || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  mockCommunityMembersStore.unshift(newMember);
  return { data: newMember, error: null };
}

export async function fetchCommunityMembers(): Promise<{
  data: CommunityMember[];
  error: string | null;
}> {
  return { data: [...mockCommunityMembersStore], error: null };
}

export async function updateCommunityMember(
  id: string,
  updates: Partial<CreateCommunityMemberInput>
): Promise<{
  data: CommunityMember | null;
  error: string | null;
}> {
  const idx = mockCommunityMembersStore.findIndex(m => m.id === id);
  if (idx !== -1) {
    mockCommunityMembersStore[idx] = {
      ...mockCommunityMembersStore[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    return { data: mockCommunityMembersStore[idx], error: null };
  }
  return { data: null, error: 'Member not found' };
}

export async function deleteCommunityMember(id: string): Promise<{
  success: boolean;
  error: string | null;
}> {
  const idx = mockCommunityMembersStore.findIndex(m => m.id === id);
  if (idx !== -1) {
    mockCommunityMembersStore.splice(idx, 1);
  }
  return { success: true, error: null };
}

// ============================================================================
// Masjid Notices Module (Static In-Memory)
// ============================================================================

export interface MasjidNotice {
  id: string;
  title: string;
  message: string;
  category: string;
  image_url?: string | null;
  is_active: boolean;
  priority: number;
  created_at: string;
  updated_at: string;
}

export interface CreateMasjidNoticeInput {
  title: string;
  message: string;
  category?: string;
  image_url?: string | null;
  is_active?: boolean;
  priority?: number;
}

export function getNoticeTimeAgo(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Recently';

    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSec < 60) {
      return 'Just now';
    }
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) {
      return diffMin === 1 ? '1 min ago' : `${diffMin} mins ago`;
    }
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) {
      return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
    }
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) {
      return 'Yesterday';
    }
    if (diffDays < 7) {
      return `${diffDays} days ago`;
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return 'Recently';
  }
}

const mockNoticesStore: MasjidNotice[] = [
  {
    id: 'notice-1',
    title: "Friday Jumu'ah Parking Advisory",
    message: "Designated parking available. Please keep emergency pathways and entrances clear.",
    category: 'Important Notice',
    image_url: null,
    is_active: true,
    priority: 10,
    created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
  },
  {
    id: 'notice-2',
    title: 'Daily Evening Quran Study Circle',
    message: 'Join us daily after Maghrib prayer for Tajweed lessons and Quranic reflections for all ages.',
    category: 'Education',
    image_url: null,
    is_active: true,
    priority: 5,
    created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
  {
    id: 'notice-3',
    title: 'Community Relief Food Drive',
    message: 'Distribution of monthly essentials for local families in need at the community hall.',
    category: 'Community Care',
    image_url: null,
    is_active: true,
    priority: 3,
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
];

export async function fetchHighestPriorityActiveNotice(): Promise<{
  data: MasjidNotice | null;
  error: string | null;
}> {
  const active = mockNoticesStore
    .filter(n => n.is_active)
    .sort((a, b) => b.priority - a.priority || b.created_at.localeCompare(a.created_at));
  return { data: active[0] || null, error: null };
}

export async function fetchAllNoticesAdmin(): Promise<{
  data: MasjidNotice[];
  error: string | null;
}> {
  const sorted = [...mockNoticesStore].sort(
    (a, b) => b.priority - a.priority || b.created_at.localeCompare(a.created_at)
  );
  return { data: sorted, error: null };
}

export async function createMasjidNotice(input: CreateMasjidNoticeInput): Promise<{
  data: MasjidNotice | null;
  error: string | null;
}> {
  const newNotice: MasjidNotice = {
    id: 'notice-' + Date.now(),
    title: input.title.trim(),
    message: input.message.trim(),
    category: input.category?.trim() || 'Important Notice',
    image_url: input.image_url?.trim() || null,
    is_active: input.is_active !== undefined ? input.is_active : true,
    priority: typeof input.priority === 'number' ? input.priority : 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  mockNoticesStore.unshift(newNotice);
  return { data: newNotice, error: null };
}

export async function updateMasjidNotice(
  id: string,
  updates: Partial<CreateMasjidNoticeInput>
): Promise<{
  data: MasjidNotice | null;
  error: string | null;
}> {
  const idx = mockNoticesStore.findIndex(n => n.id === id);
  if (idx !== -1) {
    mockNoticesStore[idx] = {
      ...mockNoticesStore[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    return { data: mockNoticesStore[idx], error: null };
  }
  return { data: null, error: 'Notice not found' };
}

export async function deleteMasjidNotice(id: string): Promise<{
  success: boolean;
  error: string | null;
}> {
  const idx = mockNoticesStore.findIndex(n => n.id === id);
  if (idx !== -1) {
    mockNoticesStore.splice(idx, 1);
  }
  return { success: true, error: null };
}

export function subscribeToMasjidNotices(_callback: () => void): () => void {
  return () => {};
}

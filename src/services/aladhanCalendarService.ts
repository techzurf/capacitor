/**
 * Sirajan Muneera App - Islamic Calendar Static Data Service
 * Disconnected from external AlAdhan API to provide instant, offline-capable UI.
 */

export interface HijriDayData {
  hijri: {
    date: string; // DD-MM-YYYY
    day: string;
    weekday: { en: string; ar: string };
    month: { number: number; en: string; ar: string; days: number };
    year: string;
    designation: { abbreviated: string; expanded: string };
    holidays: string[];
  };
  gregorian: {
    date: string; // DD-MM-YYYY
    day: string;
    weekday: { en: string };
    month: { number: number; en: string };
    year: string;
    designation: { abbreviated: string; expanded: string };
  };
}

export interface TodayHijriInfo {
  hijriDay: number;
  hijriMonth: number;
  hijriYear: number;
  hijriMonthNameEn: string;
  hijriMonthNameAr: string;
  weekdayEn: string;
  weekdayAr: string;
  gregorianDateStr: string;
  holidays: string[];
}

export const HIJRI_MONTHS_LIST = [
  { number: 1, en: "Muharram", ar: "مُحَرَّم" },
  { number: 2, en: "Safar", ar: "صَفَر" },
  { number: 3, en: "Rabi' al-Awwal", ar: "رَبيع الأوّل" },
  { number: 4, en: "Rabi' al-Thani", ar: "رَبيع الثاني" },
  { number: 5, en: "Jumada al-Awwal", ar: "جُمادى الأولى" },
  { number: 6, en: "Jumada al-Thani", ar: "جُمادى الثانية" },
  { number: 7, en: "Rajab", ar: "رَجَب" },
  { number: 8, en: "Sha'ban", ar: "شَعْبان" },
  { number: 9, en: "Ramadan", ar: "رَمَضان" },
  { number: 10, en: "Shawwal", ar: "شَوّال" },
  { number: 11, en: "Dhu al-Qi'dah", ar: "ذو القَعْدة" },
  { number: 12, en: "Dhu al-Hijjah", ar: "ذو الحِجّة" }
] as const;

export const CALENDAR_METHOD = 'UAQ';

const WEEKDAYS = [
  { en: 'Sunday', ar: 'الأحد' },
  { en: 'Monday', ar: 'الإثنين' },
  { en: 'Tuesday', ar: 'الثلاثاء' },
  { en: 'Wednesday', ar: 'الأربعاء' },
  { en: 'Thursday', ar: 'الخميس' },
  { en: 'Friday', ar: 'الجمعة' },
  { en: 'Saturday', ar: 'السبت' },
];

const GREGORIAN_MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export function getTodayKolkataDateFormatted(): {
  formattedDDMMYYYY: string;
  day: number;
  month: number;
  year: number;
} {
  const now = new Date();
  const day = now.getDate();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const formattedDDMMYYYY = `${String(day).padStart(2, '0')}-${String(month).padStart(2, '0')}-${year}`;
  return { formattedDDMMYYYY, day, month, year };
}

/**
 * Returns static realistic today Hijri info immediately without network calls
 */
export async function fetchTodayHijriDate(): Promise<TodayHijriInfo> {
  const now = new Date();
  const day = now.getDate();
  const month = now.getMonth();
  const year = now.getFullYear();
  const weekday = WEEKDAYS[now.getDay()];

  // Realistic Hijri approximation for prototype view
  return {
    hijriDay: 14,
    hijriMonth: 9, // Ramadan
    hijriYear: 1448,
    hijriMonthNameEn: 'Ramadan',
    hijriMonthNameAr: 'رَمَضان',
    weekdayEn: weekday.en,
    weekdayAr: weekday.ar,
    gregorianDateStr: `${day} ${GREGORIAN_MONTH_NAMES[month]} ${year}`,
    holidays: ['Ramadan Mubarak']
  };
}

/**
 * Generates static calendar data for any Hijri month without external API calls
 */
export async function fetchHijriMonthCalendar(month: number, year: number): Promise<HijriDayData[]> {
  const monthInfo = HIJRI_MONTHS_LIST.find(m => m.number === month) || HIJRI_MONTHS_LIST[0];
  const daysInMonth = month % 2 === 1 ? 30 : 29;

  const now = new Date();
  const baseGregorianYear = now.getFullYear();
  const baseGregorianMonth = (now.getMonth() + (month - 9) + 12) % 12;

  const days: HijriDayData[] = [];

  for (let i = 1; i <= daysInMonth; i++) {
    const gregDay = ((i + 10) % 28) + 1;
    const weekdayIdx = (i + 2) % 7;
    const weekday = WEEKDAYS[weekdayIdx];

    const holidays: string[] = [];
    if (month === 9 && i === 1) holidays.push('First of Ramadan');
    if (month === 9 && i === 27) holidays.push('Laylat al-Qadr');
    if (month === 10 && i === 1) holidays.push('Eid al-Fitr');
    if (month === 12 && i === 10) holidays.push('Eid al-Adha');
    if (month === 1 && i === 1) holidays.push('Islamic New Year');
    if (month === 1 && i === 10) holidays.push('Ashura');
    if (month === 3 && i === 12) holidays.push('Mawlid un-Nabi');

    days.push({
      hijri: {
        date: `${String(i).padStart(2, '0')}-${String(month).padStart(2, '0')}-${year}`,
        day: String(i),
        weekday: { en: weekday.en, ar: weekday.ar },
        month: { number: month, en: monthInfo.en, ar: monthInfo.ar, days: daysInMonth },
        year: String(year),
        designation: { abbreviated: 'AH', expanded: 'Anno Hegirae' },
        holidays
      },
      gregorian: {
        date: `${String(gregDay).padStart(2, '0')}-${String(baseGregorianMonth + 1).padStart(2, '0')}-${baseGregorianYear}`,
        day: String(gregDay),
        weekday: { en: weekday.en },
        month: { number: baseGregorianMonth + 1, en: GREGORIAN_MONTH_NAMES[baseGregorianMonth] },
        year: String(baseGregorianYear),
        designation: { abbreviated: 'AD', expanded: 'Anno Domini' }
      }
    });
  }

  return days;
}

export function getHijriMonthNames(monthNumber: number): { en: string; ar: string } {
  const found = HIJRI_MONTHS_LIST.find(m => m.number === monthNumber);
  return found ? { en: found.en, ar: found.ar } : { en: `Month ${monthNumber}`, ar: '' };
}

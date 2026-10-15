import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Clock, 
  MapPin, 
  ChevronLeft, 
  ChevronRight, 
  Bell, 
  BellOff, 
  Calendar, 
  Download, 
  Share2, 
  Sliders,
  Volume2,
  CheckCircle2,
  Sparkles,
  Info,
  Navigation,
  RefreshCw,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { JUMMAH_INFO, MASJID_INFO, RAMADAN_TIMINGS } from '../../data/mockData';
import { RubElHizbIcon } from '../common/IslamicIcons';
import { useTranslation } from '../../utils/translations';
import { PullToRefresh } from '../common/PullToRefresh';
import { 
  PrayerTimeRecord, 
  formatTo12h, 
  computePrayersFromRecord 
} from '../../lib/supabase';
import { 
  fetchPrayerTimings,
  fetchMonthlyPrayerCalendar,
  formatTo12Hour, 
  computeIqamahOffset, 
  to24HourString,
  getFormattedDateForApi,
  getIsoDateKey,
  CALCULATION_METHODS,
  ASR_SCHOOLS,
  PrayerDayResult
} from '../../services/prayerTimesService';

export const PrayerTimesScreen: React.FC = () => {
  const { 
    setOverlayScreen, 
    settings, 
    updateSettings, 
    triggerTestPrayerAlert,
    isPlayingNotificationSound,
    previewSound,
    stopSoundPreview,
    triggerHapticFeedback,
    userLocation,
    setShowLocationModal,
    calculationMethodId,
    asrSchool,
    prayerResult,
    isPrayerCached,
    prayerError,
    isLoadingPrayerTimes,
    refreshPrayerTimes
  } = useApp();
  const t = useTranslation(settings.language);

  // Day offset for previous / next day navigation (-1 yesterday, 0 today, +1 tomorrow)
  const [dayOffset, setDayOffset] = useState(0);
  const [showMonthlyModal, setShowMonthlyModal] = useState(false);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [isLoadingMonthly, setIsLoadingMonthly] = useState(false);

  // Offset specific prayer result when browsing past or future dates
  const [offsetPrayerResult, setOffsetPrayerResult] = useState<PrayerDayResult | null>(null);
  const [isLoadingOffset, setIsLoadingOffset] = useState(false);

  // Date calculation
  const targetDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + dayOffset);
    return d;
  }, [dayOffset]);

  const formattedGregorian = targetDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  // Fetch timings when navigating dates
  useEffect(() => {
    if (dayOffset === 0) {
      setOffsetPrayerResult(null);
      return;
    }

    let isMounted = true;
    setIsLoadingOffset(true);

    fetchPrayerTimings(userLocation, targetDate, calculationMethodId, asrSchool)
      .then(res => {
        if (isMounted) {
          setOffsetPrayerResult(res);
          setIsLoadingOffset(false);
        }
      })
      .catch(err => {
        if (isMounted) {
          console.warn('Offset date fetch error:', err);
          setIsLoadingOffset(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [dayOffset, targetDate, userLocation, calculationMethodId, asrSchool]);

  // Current active data: if dayOffset is 0, use context's prayerResult; otherwise use offsetPrayerResult
  const activePrayerData = dayOffset === 0 ? prayerResult : (offsetPrayerResult || prayerResult);

  // Convert active prayer data into PrayerTimeRecord format for consistent calculation
  const activeRecord: PrayerTimeRecord = useMemo(() => {
    const dKey = getIsoDateKey(targetDate);
    if (activePrayerData) {
      return {
        id: `aladhan-${dKey}`,
        prayer_date: dKey,
        date: dKey,
        fajr: to24HourString(activePrayerData.timings.fajr),
        sunrise: to24HourString(activePrayerData.timings.sunrise),
        dhuhr: to24HourString(activePrayerData.timings.dhuhr),
        asr: to24HourString(activePrayerData.timings.asr),
        maghrib: to24HourString(activePrayerData.timings.maghrib),
        isha: to24HourString(activePrayerData.timings.isha),
        jummah_1: '13:15:00',
        jummah_2: '14:15:00',
        jummah_3: null,
      };
    }
    // Fallback if loading
    return {
      id: `fallback-${dKey}`,
      prayer_date: dKey,
      date: dKey,
      fajr: '05:15:00',
      sunrise: '06:25:00',
      dhuhr: '12:15:00',
      asr: '15:35:00',
      maghrib: '18:10:00',
      isha: '19:25:00',
      jummah_1: '13:15:00',
      jummah_2: '14:15:00',
      jummah_3: null,
    };
  }, [activePrayerData, targetDate]);

  // Dynamic ticking clock for exact countdown
  const [clockNow, setClockNow] = useState<Date>(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => {
      setClockNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const activeComputed = useMemo(() => {
    return computePrayersFromRecord(activeRecord, clockNow);
  }, [activeRecord, clockNow]);

  const { nextPrayer } = activeComputed;

  // Format countdown string HH:MM:SS
  const countdown = useMemo(() => {
    const diffSec = nextPrayer.secondsRemaining;
    const h = Math.floor(diffSec / 3600).toString().padStart(2, '0');
    const m = Math.floor((diffSec % 3600) / 60).toString().padStart(2, '0');
    const s = (diffSec % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  }, [nextPrayer.secondsRemaining]);

  const handleRefresh = async () => {
    triggerHapticFeedback('selection');
    await refreshPrayerTimes();
  };

  const toggleNotif = (key: string) => {
    triggerHapticFeedback('selection');
    const prayerKey = key as keyof typeof settings.prayerNotifications;
    updateSettings({
      prayerNotifications: {
        ...settings.prayerNotifications,
        [prayerKey]: !settings.prayerNotifications[prayerKey]
      }
    });
  };

  const getDayLabel = () => {
    if (dayOffset === 0) return 'Today';
    if (dayOffset === 1) return 'Tomorrow';
    if (dayOffset === -1) return 'Yesterday';
    return `${dayOffset > 0 ? '+' : ''}${dayOffset} Days`;
  };

  // Active Method & School names for display
  const activeMethodName = useMemo(() => {
    const found = CALCULATION_METHODS.find(m => m.id === calculationMethodId);
    return found ? found.name : 'Standard Astronomical Calculation';
  }, [calculationMethodId]);

  const activeSchoolName = useMemo(() => {
    return asrSchool === 1 ? 'Hanafi' : "Shafi'i (Standard)";
  }, [asrSchool]);

  // Load monthly calendar when opening modal
  const handleOpenMonthlyModal = async () => {
    setShowMonthlyModal(true);
    setIsLoadingMonthly(true);
    try {
      const year = targetDate.getFullYear();
      const month = targetDate.getMonth() + 1;
      const data = await fetchMonthlyPrayerCalendar(userLocation, year, month, calculationMethodId, asrSchool);
      setMonthlyData(data);
    } catch (err) {
      console.warn('Failed to load monthly timetable:', err);
    } finally {
      setIsLoadingMonthly(false);
    }
  };

  // 6 Prayers list: Fajr, Sunrise, Dhuhr, Asr, Maghrib, Isha with live AlAdhan data
  const prayersWithSunrise = useMemo(() => {
    return [
      { 
        id: 'fajr' as const, 
        name: 'Fajr', 
        arabic: 'الفجر', 
        adhan: formatTo12Hour(activeRecord.fajr), 
        iqamah: computeIqamahOffset(activeRecord.fajr, 'fajr'), 
        isNext: nextPrayer.id === 'fajr' 
      },
      { 
        id: 'sunrise' as const, 
        name: 'Sunrise', 
        arabic: 'الشروق', 
        adhan: formatTo12Hour(activeRecord.sunrise || '06:00'), 
        iqamah: '—', 
        isNext: false, 
        isSunrise: true 
      },
      { 
        id: 'dhuhr' as const, 
        name: 'Dhuhr', 
        arabic: 'الظهر', 
        adhan: formatTo12Hour(activeRecord.dhuhr), 
        iqamah: computeIqamahOffset(activeRecord.dhuhr, 'dhuhr'), 
        isNext: nextPrayer.id === 'dhuhr' 
      },
      { 
        id: 'asr' as const, 
        name: 'Asr', 
        arabic: 'العصر', 
        adhan: formatTo12Hour(activeRecord.asr), 
        iqamah: computeIqamahOffset(activeRecord.asr, 'asr'), 
        isNext: nextPrayer.id === 'asr' 
      },
      { 
        id: 'maghrib' as const, 
        name: 'Maghrib', 
        arabic: 'المغرب', 
        adhan: formatTo12Hour(activeRecord.maghrib), 
        iqamah: computeIqamahOffset(activeRecord.maghrib, 'maghrib'), 
        isNext: nextPrayer.id === 'maghrib' 
      },
      { 
        id: 'isha' as const, 
        name: 'Isha', 
        arabic: 'العشاء', 
        adhan: formatTo12Hour(activeRecord.isha), 
        iqamah: computeIqamahOffset(activeRecord.isha, 'isha'), 
        isNext: nextPrayer.id === 'isha' 
      }
    ];
  }, [activeRecord, nextPrayer.id]);

  return (
    <PullToRefresh onRefresh={handleRefresh} containerId="main-scroll-container">
      <div className="w-full flex flex-col gap-4 px-4 pt-3 pb-8">
        
        {/* Top Header Location & Actions */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#087F5B]">
                Global Timetable
              </span>
              {activePrayerData?.meta.timezone && (
                <span className="px-1.5 py-0.2 rounded-sm bg-emerald-100 text-[#07543F] text-[9px] font-extrabold uppercase">
                  {activePrayerData.meta.timezone.split('/')[1]?.replace('_', ' ') || activePrayerData.meta.timezone}
                </span>
              )}
            </div>
            
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              {t('prayerTimes')}
            </h1>

            {/* Clickable Location Selector Button */}
            <button
              onClick={() => {
                triggerHapticFeedback('selection');
                setShowLocationModal(true);
              }}
              className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-emerald-800 transition-colors mt-0.5 group text-left"
              title="Change prayer location"
            >
              <div className="w-4 h-4 rounded-full bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0 group-hover:bg-emerald-100">
                <MapPin className="w-2.5 h-2.5" />
              </div>
              <span className="font-semibold underline decoration-emerald-500/40 underline-offset-2">
                {userLocation.displayName || `${userLocation.city}, ${userLocation.country}`}
              </span>
              {userLocation.isGps && (
                <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100/70 px-1 py-0.2 rounded">
                  GPS
                </span>
              )}
              <span className="text-[10px] text-emerald-700 font-bold ml-0.5">
                (Change)
              </span>
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleRefresh}
              disabled={isLoadingPrayerTimes}
              className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors active:scale-95 disabled:opacity-50"
              title="Refresh live timings"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingPrayerTimes ? 'animate-spin text-emerald-700' : ''}`} />
            </button>

            <button
              onClick={handleOpenMonthlyModal}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold hover:bg-emerald-100 transition-colors shadow-2xs"
            >
              <Calendar className="w-3.5 h-3.5 text-emerald-700" />
              <span>Monthly</span>
            </button>
          </div>
        </div>

        {/* Offline / Cached Warning Banner if API fails */}
        {(isPrayerCached || prayerError) && (
          <div className="w-full p-3 rounded-2xl bg-amber-50 border border-amber-300 text-xs flex items-start justify-between gap-2 animate-in fade-in">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-amber-900 leading-tight">
                  {isPrayerCached ? 'Showing Cached Prayer Times' : 'Network Connection Issue'}
                </p>
                <p className="text-[11px] text-amber-800/90 mt-0.5">
                  {prayerError || 'Could not reach live AlAdhan API. Displaying saved timings for your location.'}
                </p>
              </div>
            </div>
            <button
              onClick={handleRefresh}
              className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[10px] font-bold shrink-0 shadow-2xs"
            >
              Retry
            </button>
          </div>
        )}

        {/* Date Navigation Bar (Previous Day / Today / Next Day) */}
        <div className="w-full bg-white rounded-2xl p-2.5 border border-slate-200/80 flex items-center justify-between shadow-xs">
          <button
            onClick={() => {
              triggerHapticFeedback('selection');
              setDayOffset(prev => prev - 1);
            }}
            className="min-w-[40px] min-h-[40px] flex items-center justify-center text-slate-600 hover:text-emerald-800 hover:bg-slate-50 rounded-xl transition-colors active:scale-95"
            aria-label="Previous Day"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="text-center">
            <div className="flex items-center justify-center gap-2">
              <span className="text-xs font-bold text-slate-900">
                {formattedGregorian}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-100/60 text-[10px] font-bold text-emerald-900">
                {getDayLabel()}
              </span>
            </div>
            <span className="text-[11px] font-arabic text-amber-800 font-bold block mt-0.5">
              {activePrayerData?.dateInfo.hijriDateFormatted || 'Islamic Date'}
            </span>
          </div>

          <button
            onClick={() => {
              triggerHapticFeedback('selection');
              setDayOffset(prev => prev + 1);
            }}
            className="min-w-[40px] min-h-[40px] flex items-center justify-center text-slate-600 hover:text-emerald-800 hover:bg-slate-50 rounded-xl transition-colors active:scale-95"
            aria-label="Next Day"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Large Next Prayer Countdown Card */}
        <div className="w-full bg-gradient-to-br from-[#087F5B] to-[#054432] rounded-3xl p-5 text-white shadow-md relative overflow-hidden">
          <div className="absolute top-2 right-2 opacity-15">
            <RubElHizbIcon className="w-24 h-24 text-white" />
          </div>

          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#D4A72C] animate-pulse"></span>
              <span className="text-xs uppercase font-bold tracking-wider text-emerald-200">
                {dayOffset === 0 ? 'Next Prayer' : 'Target Schedule'}
              </span>
            </div>
            <span className="text-sm font-arabic text-amber-300 font-bold">
              {nextPrayer.arabicName}
            </span>
          </div>

          <div className="flex items-baseline justify-between mb-4">
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight">
                {nextPrayer.name} · {nextPrayer.adhanTime}
              </h2>
              <p className="text-xs text-emerald-100/90 font-medium mt-1">
                Jama'ah Iqamah at <strong>{nextPrayer.iqamahTime}</strong>
              </p>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-emerald-200 font-medium block">Starts in</span>
              <span className="text-xl font-bold font-mono text-[#D4A72C] tabular-nums">
                {countdown}
              </span>
            </div>
          </div>

          {/* Quick notification & sound state */}
          <div className="pt-3 border-t border-white/15 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-emerald-100/90 text-[11px]">
              <span>Tone: <strong>{settings.athanSound === 'Madina' ? 'Madina Adhan' : 'Makkah Adhan'}</strong></span>
              <span>·</span>
              <span>Remind: <strong>{settings.reminderMinutesBefore === 0 ? 'At Adhan' : `${settings.reminderMinutesBefore}m before`}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => triggerTestPrayerAlert(nextPrayer.name, settings.reminderMinutesBefore)}
                className="text-white bg-white/20 hover:bg-white/30 px-2 py-0.5 rounded-lg text-[10px] font-bold transition-colors flex items-center gap-1"
                title="Test approaching prayer audio & banner now"
              >
                <Bell className="w-2.5 h-2.5 text-amber-300" />
                <span>Test Alert</span>
              </button>
              <button 
                onClick={() => setOverlayScreen('settings')}
                className="text-amber-300 text-xs font-bold hover:underline"
              >
                Configure
              </button>
            </div>
          </div>
        </div>

        {/* Complete 6-row Timetable (Fajr, Sunrise, Dhuhr, Asr, Maghrib, Isha) */}
        <div className="w-full bg-white rounded-3xl p-4 border border-slate-200/80 shadow-xs relative">
          {(isLoadingPrayerTimes || isLoadingOffset) && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-2xs rounded-3xl flex items-center justify-center z-10">
              <div className="flex items-center gap-2 text-xs font-bold text-[#087F5B] bg-white px-3 py-1.5 rounded-full shadow-md border border-slate-100">
                <Loader2 className="w-4 h-4 animate-spin text-[#087F5B]" />
                <span>Calculating times for {userLocation.city}...</span>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pb-3 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider px-2">
            <span className="w-24">Prayer</span>
            <span className="flex-1 text-center">Adhan</span>
            <span className="flex-1 text-center">Iqamah</span>
            <span className="w-8 text-right">Alert</span>
          </div>

          <div className="divide-y divide-slate-100">
            {prayersWithSunrise.map(p => {
              const isAlertActive = settings.prayerNotifications[p.id as keyof typeof settings.prayerNotifications];
              return (
                <div 
                  key={p.id}
                  className={`py-3 px-2 flex items-center justify-between transition-colors rounded-xl ${
                    p.isNext 
                      ? 'bg-[#E8F7F1]/80 border-l-4 border-[#087F5B] font-semibold' 
                      : p.isSunrise 
                      ? 'bg-amber-50/40 border-l-4 border-amber-300' 
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="w-24">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-sm font-bold ${
                        p.isNext ? 'text-[#087F5B]' : p.isSunrise ? 'text-amber-800' : 'text-slate-900'
                      }`}>
                        {p.name}
                      </span>
                      {p.isNext && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#087F5B] animate-pulse"></span>
                      )}
                      {p.isSunrise && (
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                      )}
                    </div>
                    <span className="text-[11px] font-arabic text-slate-400 block -mt-0.5">
                      {p.arabic}
                    </span>
                  </div>

                  {/* Adhan time (Live dynamic AlAdhan calculation) */}
                  <div className="flex-1 text-center text-xs sm:text-sm font-medium text-slate-700 tabular-nums">
                    {p.adhan}
                  </div>

                  {/* Iqamah time */}
                  <div className="flex-1 text-center text-sm font-bold text-slate-900 tabular-nums">
                    {p.iqamah}
                  </div>

                  <div className="w-8 flex justify-end">
                    {!p.isSunrise ? (
                      <button
                        onClick={() => toggleNotif(p.id)}
                        className={`min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg transition-colors ${
                          isAlertActive 
                            ? 'text-[#087F5B] bg-emerald-50' 
                            : 'text-slate-300 hover:text-slate-500'
                        }`}
                        aria-label={`Toggle alert for ${p.name}`}
                      >
                        {isAlertActive ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-300">—</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Friday Jummah Timetable Card (Preserved with community notes) */}
        <div className="w-full bg-emerald-900 text-white rounded-3xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-3 border-b border-emerald-800 pb-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">🕌</span>
              <div>
                <h3 className="text-sm font-bold text-white leading-tight">
                  Friday Jumu'ah Timetable
                </h3>
                <span className="text-[10px] text-emerald-200 font-medium">
                  Masjid Community Congregation Schedule
                </span>
              </div>
            </div>
            <span className="text-xs font-arabic text-amber-300 font-bold">
              صلاة الجمعة
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            {/* Shift 1 */}
            <div className="bg-white/10 rounded-2xl p-3 border border-white/10">
              <div className="flex items-center justify-between mb-1">
                <span className="text-amber-300 font-bold text-[11px]">1st Shift</span>
                <span className="text-emerald-200 text-[10px]">Doors 12:45 PM</span>
              </div>
              <div className="text-sm font-extrabold text-white mb-0.5">
                Khutbah: {JUMMAH_INFO.firstShift.khutbah}
              </div>
              <div className="text-[11px] text-emerald-100 font-medium">
                Salah: {JUMMAH_INFO.firstShift.salah}
              </div>
              <div className="mt-2 text-[10px] text-emerald-200/80 truncate">
                Khatib: {JUMMAH_INFO.firstShift.khatib}
              </div>
            </div>

            {/* Shift 2 */}
            <div className="bg-white/10 rounded-2xl p-3 border border-white/10">
              <div className="flex items-center justify-between mb-1">
                <span className="text-amber-300 font-bold text-[11px]">2nd Shift</span>
                <span className="text-emerald-200 text-[10px]">Doors 01:50 PM</span>
              </div>
              <div className="text-sm font-extrabold text-white mb-0.5">
                Khutbah: {JUMMAH_INFO.secondShift.khutbah}
              </div>
              <div className="text-[11px] text-emerald-100 font-medium">
                Salah: {JUMMAH_INFO.secondShift.salah}
              </div>
              <div className="mt-2 text-[10px] text-emerald-200/80 truncate">
                Khatib: {JUMMAH_INFO.secondShift.khatib}
              </div>
            </div>
          </div>

          <p className="mt-3 text-[11px] text-emerald-200 leading-tight">
            Please arrive early for parking. Jumu'ah times are configured by the local Masjid administration.
          </p>
        </div>

        {/* Timetable Calculation Method & Accuracy info */}
        <div className="p-3 bg-slate-100 rounded-2xl text-[11px] text-slate-600 leading-relaxed flex items-start justify-between gap-2">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <div>
              <span>Calculated via <strong>{activeMethodName}</strong></span>
              <span className="block text-slate-500 mt-0.5">
                Asr School: <strong>{activeSchoolName}</strong> · Coordinates: {userLocation.latitude.toFixed(2)}°, {userLocation.longitude.toFixed(2)}°
              </span>
            </div>
          </div>

          <button
            onClick={() => setOverlayScreen('settings')}
            className="text-emerald-700 font-bold hover:underline shrink-0 text-[10px] bg-white px-2 py-1 rounded-lg border border-slate-200"
          >
            Change
          </button>
        </div>

        {/* Monthly Timetable Sheet / Dialog Modal */}
        {showMonthlyModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-[430px] bg-white rounded-t-3xl sm:rounded-3xl p-5 max-h-[85vh] overflow-y-auto shadow-2xl flex flex-col animate-in slide-in-from-bottom-6 duration-300">
              <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mb-4 sm:hidden"></div>

              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {targetDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} Timetable
                  </h3>
                  <span className="text-xs text-slate-500">
                    {userLocation.displayName} · AlAdhan Engine
                  </span>
                </div>
                <button
                  onClick={() => setShowMonthlyModal(false)}
                  className="min-h-[44px] px-3 py-1 text-xs font-bold text-slate-500 hover:text-slate-900"
                >
                  Close
                </button>
              </div>

              {/* Monthly Table */}
              <div className="text-xs border border-slate-200 rounded-2xl overflow-hidden mb-4">
                {isLoadingMonthly ? (
                  <div className="p-8 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-[#087F5B]" />
                    <span className="text-xs">Loading monthly calendar from AlAdhan...</span>
                  </div>
                ) : monthlyData.length > 0 ? (
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-[10px] font-bold text-slate-600 border-b border-slate-200">
                      <tr>
                        <th className="p-2">Date</th>
                        <th className="p-2">Fajr</th>
                        <th className="p-2">Sunrise</th>
                        <th className="p-2">Dhuhr</th>
                        <th className="p-2">Asr</th>
                        <th className="p-2">Maghrib</th>
                        <th className="p-2">Isha</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-[10px] font-mono">
                      {monthlyData.slice(0, 31).map((dayItem: any, index: number) => {
                        const dNum = dayItem.date?.gregorian?.day || index + 1;
                        const isTodayRow = Number(dNum) === new Date().getDate();
                        const t = dayItem.timings;
                        return (
                          <tr key={index} className={isTodayRow ? 'bg-emerald-50/90 font-bold text-emerald-950' : ''}>
                            <td className="p-2 font-sans font-semibold">{dNum}</td>
                            <td className="p-2">{cleanAlAdhanDisplay(t?.Fajr)}</td>
                            <td className="p-2 text-amber-700">{cleanAlAdhanDisplay(t?.Sunrise)}</td>
                            <td className="p-2">{cleanAlAdhanDisplay(t?.Dhuhr)}</td>
                            <td className="p-2">{cleanAlAdhanDisplay(t?.Asr)}</td>
                            <td className="p-2 font-semibold text-emerald-800">{cleanAlAdhanDisplay(t?.Maghrib)}</td>
                            <td className="p-2">{cleanAlAdhanDisplay(t?.Isha)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-6 text-center text-slate-500 text-xs">
                    Could not load full monthly table. Using active daily calculations.
                  </div>
                )}
              </div>

              <button
                onClick={() => {
                  alert(`Monthly timetable for ${userLocation.displayName} is ready!`);
                  setShowMonthlyModal(false);
                }}
                className="w-full py-3 bg-[#087F5B] text-white font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-[#07543F] transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Download Printable Timetable</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </PullToRefresh>
  );
};

function cleanAlAdhanDisplay(val: string | undefined): string {
  if (!val) return '—';
  return val.split(' ')[0];
}

export default PrayerTimesScreen;

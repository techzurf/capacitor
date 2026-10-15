import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { 
  ActiveTab, 
  OverlayScreen, 
  AppLanguage, 
  EventItem, 
  ServiceItem, 
  MasjidItem, 
  DuaItem, 
  NotificationItem, 
  UserRegistration,
  AppSettings,
  AthanSoundType,
  ApproachingPrayerAlert
} from '../types';
import { 
  MOCK_EVENTS, 
  MOCK_SERVICES, 
  NEARBY_MASJIDS, 
  DAILY_DUAS, 
  MOCK_NOTIFICATIONS, 
  MOCK_REGISTRATIONS,
  INITIAL_PRAYERS
} from '../data/mockData';
import { playNotificationSound, stopNotificationSound } from '../utils/audioNotification';
import { triggerHaptic, HapticStyle } from '../utils/haptics';
import { 
  PrayerTimeRecord, 
  ComputedPrayerInfo, 
  getTodayDateString, 
  getInitialSeedRecord, 
  computePrayersFromRecord 
} from '../lib/supabase';
import { 
  UserLocation, 
  AsrSchool, 
  PrayerDayResult, 
  fetchPrayerTimings, 
  DEFAULT_GLOBAL_LOCATION, 
  requestDeviceLocation,
  CALCULATION_METHODS,
  to24HourString,
  getIsoDateKey,
  getRecommendedMethod
} from '../services/prayerTimesService';
import { LocationPickerModal } from '../components/common/LocationPickerModal';

interface AppContextType {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  overlayScreen: OverlayScreen;
  setOverlayScreen: (screen: OverlayScreen) => void;
  triggerHapticFeedback: (style?: HapticStyle, withSound?: boolean) => void;
  
  // Global Prayer Times State (AlAdhan API)
  todayPrayerRecord: PrayerTimeRecord | null;
  computedPrayers: ComputedPrayerInfo;
  isLoadingPrayerTimes: boolean;
  isPrayerCached: boolean;
  prayerError: string | null;
  prayerResult: PrayerDayResult | null;
  refreshPrayerTimes: () => Promise<void>;

  // Global Location Management
  userLocation: UserLocation;
  setUserLocation: (loc: UserLocation) => void;
  detectUserLocation: () => Promise<boolean>;
  isDetectingLocation: boolean;
  locationDetectionError: string | null;
  showLocationModal: boolean;
  setShowLocationModal: (show: boolean) => void;

  // Calculation Method & School Settings
  calculationMethodId: number;
  setCalculationMethodId: (id: number) => void;
  asrSchool: AsrSchool;
  setAsrSchool: (school: AsrSchool) => void;

  // Selected detail items
  selectedEvent: EventItem | null;
  setSelectedEvent: (event: EventItem | null) => void;
  selectedService: ServiceItem | null;
  setSelectedService: (service: ServiceItem | null) => void;
  selectedMasjid: MasjidItem | null;
  setSelectedMasjid: (masjid: MasjidItem | null) => void;
  
  // Registration flow
  activeRegistrationType: 'New Member' | 'Volunteer' | 'Event' | 'Service';
  setActiveRegistrationType: (type: 'New Member' | 'Volunteer' | 'Event' | 'Service') => void;
  
  // Duas & Favorites
  duas: DuaItem[];
  toggleFavoriteDua: (id: string) => void;
  
  // Notifications
  notifications: NotificationItem[];
  unreadNotifCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  addNotification: (item: Omit<NotificationItem, 'id' | 'timeAgo' | 'isRead'>) => void;
  
  // User Registrations
  userRegistrations: UserRegistration[];
  addRegistration: (reg: Omit<UserRegistration, 'id' | 'date'>) => void;
  
  // Tasbeeh state
  tasbeehCount: number;
  tasbeehTarget: number;
  tasbeehDhikr: string;
  tasbeehMeaning: string;
  incrementTasbeeh: (soundEnabled?: boolean) => void;
  resetTasbeeh: () => void;
  setTasbeehDhikrPreset: (dhikr: string, meaning: string, target?: number) => void;
  setTasbeehTarget: (target: number) => void;
  
  // App Settings & Preferences
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  toggleSeniorMode: () => void;
  toggleRamadanMode: () => void;
  setLanguage: (lang: AppLanguage) => void;
  
  // Prayer Approaching Notifications & Audio (UI Controls)
  activePrayerAlert: ApproachingPrayerAlert | null;
  dismissPrayerAlert: () => void;
  mutePrayerSound: () => void;
  isPlayingNotificationSound: boolean;
  currentlyPlayingTone: string | null;
  previewSound: (sound: AthanSoundType) => void;
  stopSoundPreview: () => void;
  triggerTestPrayerAlert: (prayerName?: string, minutesLeft?: number) => void;
  notificationPermission: NotificationPermission | 'unsupported';
  requestNotificationPermission: () => Promise<void>;

  // Onboarding
  hasSeenOnboarding: boolean;
  completeOnboarding: () => void;
  restartOnboarding: () => void;
  
  // Mobile device shell simulation toggle
  showDeviceShell: boolean;
  setShowDeviceShell: (val: boolean) => void;
  
  // Helper quick actions
  openEventDetail: (event: EventItem) => void;
  openServiceDetail: (service: ServiceItem) => void;
  openMasjidDetail: (masjid: MasjidItem) => void;
  startRegistration: (type: 'New Member' | 'Volunteer' | 'Event' | 'Service') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [overlayScreen, setOverlayScreen] = useState<OverlayScreen>('splash');
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean>(() => {
    return localStorage.getItem('sirajan_onboarding_done') === 'true';
  });
  
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
  const [selectedMasjid, setSelectedMasjid] = useState<MasjidItem | null>(null);
  const [activeRegistrationType, setActiveRegistrationType] = useState<'New Member' | 'Volunteer' | 'Event' | 'Service'>('New Member');
  
  const [duas, setDuas] = useState<DuaItem[]>(DAILY_DUAS);
  const [notifications, setNotifications] = useState<NotificationItem[]>(MOCK_NOTIFICATIONS);
  const [userRegistrations, setUserRegistrations] = useState<UserRegistration[]>(MOCK_REGISTRATIONS);
  
  // Tasbeeh counter state
  const [tasbeehCount, setTasbeehCount] = useState<number>(0);
  const [tasbeehTarget, setTasbeehTarget] = useState<number>(33);
  const [tasbeehDhikr, setTasbeehDhikr] = useState<string>('SubhanAllah');
  const [tasbeehMeaning, setTasbeehMeaning] = useState<string>('Glory be to Allah');
  
  // Device frame toggle
  const [showDeviceShell, setShowDeviceShell] = useState<boolean>(true);

  // =========================================================================
  // 1. GLOBAL LOCATION & CALCULATION SETTINGS STATE
  // =========================================================================
  const [userLocation, setUserLocationState] = useState<UserLocation>(() => {
    try {
      const saved = localStorage.getItem('sirajan_user_location');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_GLOBAL_LOCATION;
  });

  const [calculationMethodId, setCalculationMethodIdState] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('sirajan_calc_method_id');
      if (saved) return parseInt(saved, 10);
    } catch {}
    return getRecommendedMethod(userLocation.country, userLocation.timezone);
  });

  const [asrSchool, setAsrSchoolState] = useState<AsrSchool>(() => {
    try {
      const saved = localStorage.getItem('sirajan_asr_school');
      if (saved) return parseInt(saved, 10) as AsrSchool;
    } catch {}
    return 0; // Standard (Shafi, Maliki, Hanbali)
  });

  const [showLocationModal, setShowLocationModal] = useState<boolean>(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState<boolean>(false);
  const [locationDetectionError, setLocationDetectionError] = useState<string | null>(null);

  // =========================================================================
  // 2. LIVE ALADHAN PRAYER TIMES STATE & RECORD CONVERSION
  // =========================================================================
  const [prayerResult, setPrayerResult] = useState<PrayerDayResult | null>(null);
  const [isLoadingPrayerTimes, setIsLoadingPrayerTimes] = useState<boolean>(true);
  const [isPrayerCached, setIsPrayerCached] = useState<boolean>(false);
  const [prayerError, setPrayerError] = useState<string | null>(null);

  // Today's prayer record adapted from AlAdhan API response
  const [todayPrayerRecord, setTodayPrayerRecord] = useState<PrayerTimeRecord>(() => getInitialSeedRecord());

  // Real-time ticking clock for exact countdown updates (updates every second)
  const [currentClockTime, setCurrentClockTime] = useState<Date>(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentClockTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch prayer timings from AlAdhan API
  const loadPrayerTimesForCurrentConfig = useCallback(async (
    loc = userLocation,
    method = calculationMethodId,
    school = asrSchool,
    date = new Date()
  ) => {
    setIsLoadingPrayerTimes(true);
    setPrayerError(null);
    try {
      const result = await fetchPrayerTimings(loc, date, method, school);
      setPrayerResult(result);
      setIsPrayerCached(result.isCached);
      setPrayerError(result.fetchError || null);

      const dKey = getIsoDateKey(date);
      const convertedRecord: PrayerTimeRecord = {
        id: `aladhan-${dKey}`,
        prayer_date: dKey,
        date: dKey,
        fajr: to24HourString(result.timings.fajr),
        sunrise: to24HourString(result.timings.sunrise),
        dhuhr: to24HourString(result.timings.dhuhr),
        asr: to24HourString(result.timings.asr),
        maghrib: to24HourString(result.timings.maghrib),
        isha: to24HourString(result.timings.isha),
        jummah_1: '13:15:00',
        jummah_2: '14:15:00',
        jummah_3: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setTodayPrayerRecord(convertedRecord);
    } catch (err: any) {
      console.error('Failed to load prayer times:', err);
      setPrayerError(err.message || 'Unable to fetch prayer times. Please check your internet connection.');
    } finally {
      setIsLoadingPrayerTimes(false);
    }
  }, [userLocation, calculationMethodId, asrSchool]);

  // Initial and reactive fetch on location / calculation change
  useEffect(() => {
    loadPrayerTimesForCurrentConfig(userLocation, calculationMethodId, asrSchool);
  }, [userLocation, calculationMethodId, asrSchool, loadPrayerTimesForCurrentConfig]);

  const refreshPrayerTimes = useCallback(async () => {
    await loadPrayerTimesForCurrentConfig(userLocation, calculationMethodId, asrSchool);
  }, [loadPrayerTimesForCurrentConfig, userLocation, calculationMethodId, asrSchool]);

  // Setters with persistent storage
  const setUserLocation = useCallback((newLoc: UserLocation) => {
    setUserLocationState(newLoc);
    try {
      localStorage.setItem('sirajan_user_location', JSON.stringify(newLoc));
    } catch {}

    // Auto-update calculation method recommendation if moving countries and user hasn't explicitly customized
    const recommended = getRecommendedMethod(newLoc.country, newLoc.timezone);
    if (recommended !== calculationMethodId) {
      // Suggest/switch to region-appropriate default
      setCalculationMethodIdState(recommended);
      try {
        localStorage.setItem('sirajan_calc_method_id', String(recommended));
      } catch {}
    }
  }, [calculationMethodId]);

  const setCalculationMethodId = useCallback((newMethodId: number) => {
    setCalculationMethodIdState(newMethodId);
    try {
      localStorage.setItem('sirajan_calc_method_id', String(newMethodId));
    } catch {}

    const foundMethod = CALCULATION_METHODS.find(m => m.id === newMethodId);
    if (foundMethod) {
      updateSettings({ calculationMethod: foundMethod.name, calculationMethodId: newMethodId });
    }
  }, []);

  const setAsrSchool = useCallback((newSchool: AsrSchool) => {
    setAsrSchoolState(newSchool);
    try {
      localStorage.setItem('sirajan_asr_school', String(newSchool));
    } catch {}
    updateSettings({ asrSchool: newSchool });
  }, []);

  // Request GPS Location detection
  const detectUserLocation = useCallback(async (): Promise<boolean> => {
    setIsDetectingLocation(true);
    setLocationDetectionError(null);
    try {
      const detected = await requestDeviceLocation();
      setUserLocation(detected);
      return true;
    } catch (err: any) {
      setLocationDetectionError(err.message || 'Failed to detect location.');
      return false;
    } finally {
      setIsDetectingLocation(false);
    }
  }, [setUserLocation]);

  // Compute live active prayers using current clock time
  const activeRecord = todayPrayerRecord || getInitialSeedRecord();
  const computedPrayers = useMemo(() => {
    return computePrayersFromRecord(activeRecord, currentClockTime);
  }, [activeRecord, currentClockTime]);

  // =========================================================================
  // 3. SETTINGS WITH LOCAL PERSISTENCE
  // =========================================================================
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('sirajan_masjid_settings');
    const defaultSettings: AppSettings = {
      language: 'en',
      seniorMode: false,
      ramadanMode: false,
      prayerNotifications: {
        fajr: true,
        sunrise: false,
        dhuhr: true,
        asr: true,
        maghrib: true,
        isha: true,
        jummahReminder: true,
      },
      athanSound: 'Makkah',
      reminderMinutesBefore: 10,
      alertVolume: 0.8,
      vibrateOnAlert: true,
      hapticFeedback: true,
      calculationMethod: 'University of Islamic Sciences, Karachi',
      calculationMethodId: 1,
      asrSchool: 0,
      userLocation: DEFAULT_GLOBAL_LOCATION
    };
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const validAthanSound: AthanSoundType = (parsed.athanSound === 'Madina' || parsed.athanSound === 'Madinah')
          ? 'Madina'
          : 'Makkah';
        return {
          ...defaultSettings,
          ...parsed,
          athanSound: validAthanSound,
          prayerNotifications: {
            ...defaultSettings.prayerNotifications,
            ...(parsed.prayerNotifications || {})
          }
        };
      } catch {
        return defaultSettings;
      }
    }
    return defaultSettings;
  });

  // Approaching Prayer Alert & Audio Playback State (UI preview only)
  const [activePrayerAlert, setActivePrayerAlert] = useState<ApproachingPrayerAlert | null>(null);
  const [isPlayingNotificationSound, setIsPlayingNotificationSound] = useState<boolean>(false);
  const [currentlyPlayingTone, setCurrentlyPlayingTone] = useState<string | null>(null);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | 'unsupported'>('default');

  // Check initial browser notification permission
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationPermission(Notification.permission);
    } else {
      setNotificationPermission('unsupported');
    }
  }, []);

  const requestNotificationPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const permission = await Notification.requestPermission();
        setNotificationPermission(permission);
      } catch {
        setNotificationPermission('default');
      }
    }
  };

  const previewSound = (sound: AthanSoundType) => {
    if (isPlayingNotificationSound && currentlyPlayingTone === sound) {
      stopSoundPreview();
      return;
    }

    stopSoundPreview();
    setIsPlayingNotificationSound(true);
    setCurrentlyPlayingTone(sound);

    playNotificationSound(sound, {
      volume: settings.alertVolume,
      vibrate: settings.vibrateOnAlert,
      onEnded: () => {
        setIsPlayingNotificationSound(false);
        setCurrentlyPlayingTone(null);
      }
    });
  };

  const stopSoundPreview = () => {
    stopNotificationSound();
    setIsPlayingNotificationSound(false);
    setCurrentlyPlayingTone(null);
  };

  const mutePrayerSound = () => {
    stopNotificationSound();
    setIsPlayingNotificationSound(false);
  };

  const dismissPrayerAlert = () => {
    setActivePrayerAlert(null);
    mutePrayerSound();
  };

  const addNotification = (item: Omit<NotificationItem, 'id' | 'timeAgo' | 'isRead'>) => {
    const newItem: NotificationItem = {
      ...item,
      id: `notif-${Date.now()}`,
      timeAgo: 'Just now',
      isRead: false
    };
    setNotifications(prev => [newItem, ...prev]);
  };

  const triggerTestPrayerAlert = (prayerName = 'Asr', minutesLeft?: number) => {
    const leadTime = typeof minutesLeft === 'number' ? minutesLeft : (settings.reminderMinutesBefore || 10);
    const prayerInfo = computedPrayers.prayersList.find(p => p.name.toLowerCase() === prayerName.toLowerCase()) || computedPrayers.prayersList[2] || INITIAL_PRAYERS[2];
    
    const alertData: ApproachingPrayerAlert = {
      id: `alert-${Date.now()}`,
      prayerName: prayerInfo.name,
      arabicName: prayerInfo.arabicName,
      time: prayerInfo.adhanTime,
      minutesLeft: leadTime,
      type: leadTime <= 0 ? 'adhan' : 'approaching',
      iqamahTime: prayerInfo.iqamahTime
    };

    setActivePrayerAlert(alertData);

    addNotification({
      title: leadTime <= 0 
        ? `Adhan Time: ${prayerInfo.name} Prayer (${prayerInfo.adhanTime})`
        : `Approaching: ${prayerInfo.name} Prayer in ${leadTime} mins`,
      message: `The adhan for ${prayerInfo.name} is at ${prayerInfo.adhanTime}. Congregation Iqamah will follow at ${prayerInfo.iqamahTime}.`,
      category: 'Prayer Alerts',
      urgent: true
    });
  };

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      try {
        localStorage.setItem('sirajan_masjid_settings', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const completeOnboarding = () => {
    setHasSeenOnboarding(true);
    localStorage.setItem('sirajan_onboarding_done', 'true');
    setOverlayScreen(null);
  };

  const restartOnboarding = () => {
    setOverlayScreen('onboarding');
  };

  const toggleFavoriteDua = (id: string) => {
    setDuas(prev => prev.map(d => d.id === id ? { ...d, isFavorite: !d.isFavorite } : d));
  };

  const unreadNotifCount = notifications.filter(n => !n.isRead).length;

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const addRegistration = (reg: Omit<UserRegistration, 'id' | 'date'>) => {
    const newReg: UserRegistration = {
      ...reg,
      id: `reg-${Date.now()}`,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    };
    setUserRegistrations(prev => [newReg, ...prev]);
  };

  const incrementTasbeeh = (soundEnabled = true) => {
    setTasbeehCount(prev => {
      const next = prev + 1;
      if (soundEnabled && settings.hapticFeedback) {
        triggerHaptic('tasbeeh');
      }
      return next;
    });
  };

  const resetTasbeeh = () => {
    setTasbeehCount(0);
    if (settings.hapticFeedback) {
      triggerHaptic('light');
    }
  };

  const setTasbeehDhikrPreset = (dhikr: string, meaning: string, target = 33) => {
    setTasbeehDhikr(dhikr);
    setTasbeehMeaning(meaning);
    setTasbeehTarget(target);
    setTasbeehCount(0);
  };

  const toggleSeniorMode = () => {
    updateSettings({ seniorMode: !settings.seniorMode });
  };

  const toggleRamadanMode = () => {
    updateSettings({ ramadanMode: !settings.ramadanMode });
  };

  const triggerHapticFeedback = (style: HapticStyle = 'selection', force = false) => {
    if (settings.hapticFeedback || force) {
      triggerHaptic(style);
    }
  };

  const handleSetActiveTab = (tab: ActiveTab) => {
    triggerHapticFeedback('selection');
    setActiveTab(tab);
  };

  const handleSetOverlayScreen = (screen: OverlayScreen) => {
    triggerHapticFeedback('selection');
    setOverlayScreen(screen);
  };

  const setLanguage = (lang: AppLanguage) => {
    updateSettings({ language: lang });
  };

  const openEventDetail = (event: EventItem) => {
    setSelectedEvent(event);
    setOverlayScreen('event_detail');
  };

  const openServiceDetail = (service: ServiceItem) => {
    setSelectedService(service);
    setOverlayScreen('service_detail');
  };

  const openMasjidDetail = (masjid: MasjidItem) => {
    setSelectedMasjid(masjid);
    setOverlayScreen('locator');
  };

  const startRegistration = (type: 'New Member' | 'Volunteer' | 'Event' | 'Service') => {
    setActiveRegistrationType(type);
    setOverlayScreen('registration');
  };

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab: handleSetActiveTab,
        overlayScreen,
        setOverlayScreen: handleSetOverlayScreen,
        triggerHapticFeedback,
        todayPrayerRecord,
        computedPrayers,
        isLoadingPrayerTimes,
        isPrayerCached,
        prayerError,
        prayerResult,
        refreshPrayerTimes,
        userLocation,
        setUserLocation,
        detectUserLocation,
        isDetectingLocation,
        locationDetectionError,
        showLocationModal,
        setShowLocationModal,
        calculationMethodId,
        setCalculationMethodId,
        asrSchool,
        setAsrSchool,
        selectedEvent,
        setSelectedEvent,
        selectedService,
        setSelectedService,
        selectedMasjid,
        setSelectedMasjid,
        activeRegistrationType,
        setActiveRegistrationType,
        duas,
        toggleFavoriteDua,
        notifications,
        unreadNotifCount,
        markAsRead,
        markAllAsRead,
        addNotification,
        userRegistrations,
        addRegistration,
        tasbeehCount,
        tasbeehTarget,
        tasbeehDhikr,
        tasbeehMeaning,
        incrementTasbeeh,
        resetTasbeeh,
        setTasbeehDhikrPreset,
        setTasbeehTarget,
        settings,
        updateSettings,
        toggleSeniorMode,
        toggleRamadanMode,
        setLanguage,
        activePrayerAlert,
        dismissPrayerAlert,
        mutePrayerSound,
        isPlayingNotificationSound,
        currentlyPlayingTone,
        previewSound,
        stopSoundPreview,
        triggerTestPrayerAlert,
        notificationPermission,
        requestNotificationPermission,
        hasSeenOnboarding,
        completeOnboarding,
        restartOnboarding,
        showDeviceShell,
        setShowDeviceShell,
        openEventDetail,
        openServiceDetail,
        openMasjidDetail,
        startRegistration,
      }}
    >
      {children}

      {/* Global Location Picker Modal */}
      {showLocationModal && (
        <LocationPickerModal
          currentLocation={userLocation}
          onSelectLocation={(loc) => {
            setUserLocation(loc);
            setShowLocationModal(false);
          }}
          onClose={() => setShowLocationModal(false)}
        />
      )}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
export default AppContext;

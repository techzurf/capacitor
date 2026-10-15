import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  ArrowRight
} from 'lucide-react';
import { MosqueIcon, RubElHizbIcon } from '../common/IslamicIcons';

export const QuickActions: React.FC = () => {
  const { 
    setOverlayScreen, 
    setActiveTab, 
    triggerHapticFeedback 
  } = useApp();

  const locatorVideoRef = React.useRef<HTMLVideoElement>(null);
  const [videoError, setVideoError] = React.useState(false);

  React.useEffect(() => {
    if (locatorVideoRef.current) {
      locatorVideoRef.current.defaultMuted = true;
      locatorVideoRef.current.muted = true;
      const playPromise = locatorVideoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          if (locatorVideoRef.current) {
            locatorVideoRef.current.muted = true;
            locatorVideoRef.current.play().catch(() => {});
          }
        });
      }
    }
  }, []);

  const handleQuranClick = () => {
    triggerHapticFeedback('light');
    setOverlayScreen('quran');
  };

  const handleQiblaClick = () => {
    triggerHapticFeedback('light');
    setOverlayScreen('qibla');
  };

  const handleTasbeehClick = () => {
    triggerHapticFeedback('light');
    setOverlayScreen('tasbeeh');
  };

  const handleBayanClick = () => {
    triggerHapticFeedback('light');
    const el = document.getElementById('latest-videos-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleServicesClick = () => {
    triggerHapticFeedback('light');
    setActiveTab('services');
    setOverlayScreen(null);
  };

  const handleLocatorClick = () => {
    triggerHapticFeedback('light');
    setOverlayScreen('locator');
  };

  return (
    <div className="w-full">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-2.5 px-0.5">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-3.5 bg-teal-600 rounded-full" />
          <h2 className="text-xs font-extrabold text-slate-800 tracking-wider uppercase">
            Quick Services
          </h2>
        </div>
        <button
          type="button"
          onClick={handleServicesClick}
          className="text-[11px] font-bold text-teal-700 hover:text-teal-900 active:scale-95 transition-all cursor-pointer py-0.5 px-2 rounded-lg hover:bg-teal-50 flex items-center gap-1"
        >
          <span>All Services →</span>
        </button>
      </div>

      {/* Compact 5-Service Grid: Find (Locator) + 2x2 Square Grid (Quran, Qibla, Tasbeeh, Bayan) */}
      <div className="grid grid-cols-5 gap-2 items-stretch">
        
        {/* 1. Find Masjids Tile (Left): Height matches the combined height of the 2 rows beside it */}
        <button
          type="button"
          onClick={handleLocatorClick}
          aria-label="Find Masjids"
          className="col-span-2 h-full rounded-2xl p-2 border border-teal-500/30 shadow-[0_2px_12px_rgba(21,154,156,0.10)] flex flex-col justify-end text-left relative overflow-hidden active:scale-[0.98] transition-all group cursor-pointer bg-slate-950"
        >
          {/* Entire Tile Visual Area: Full-Bleed Cloudinary MP4 Video */}
          {!videoError ? (
            <>
              <video
                ref={locatorVideoRef}
                src="https://res.cloudinary.com/dv16a8l1l/video/upload/v1790315339/Find_qudead.mp4"
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
                disablePictureInPicture
                onError={() => setVideoError(true)}
                className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none z-0"
              />
              {/* Subtle bottom gradient to ensure the View Map button remains crisp */}
              <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/60 to-transparent pointer-events-none z-0" />
            </>
          ) : (
            <>
              {/* Fallback to geometric illustration if video fails to load */}
              <div className="absolute inset-0 bg-gradient-to-b from-[#F0FDFA] via-[#F8FCFB] to-white pointer-events-none" />
              <div className="absolute -right-4 -top-4 w-20 h-20 pointer-events-none opacity-[0.06] text-teal-800">
                <RubElHizbIcon className="w-full h-full" />
              </div>
              <div className="absolute -left-4 -bottom-4 w-16 h-16 pointer-events-none opacity-[0.04] text-emerald-800">
                <MosqueIcon className="w-full h-full" />
              </div>
              <div className="relative z-10 my-auto py-1 flex items-center justify-center">
                <div className="relative w-14 h-14 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full bg-teal-200/35 blur-md transform scale-90" />
                  <svg viewBox="0 0 80 80" className="w-full h-full relative z-10" fill="none">
                    <circle cx="40" cy="40" r="34" stroke="#159A9C" strokeWidth="1" strokeDasharray="3 4" opacity="0.35" />
                    <circle cx="40" cy="40" r="28" fill="#E6FFFA" opacity="0.7" />
                    <path d="M40 18 C33 24 31 33 31 43 L49 43 C49 33 47 24 40 18 Z" fill="#087F5B" opacity="0.85" />
                    <circle cx="40" cy="15" r="2" fill="#D4A72C" />
                    <path d="M40 13 L40 17" stroke="#D4A72C" strokeWidth="1.2" strokeLinecap="round" />
                    <rect x="23" y="27" width="5" height="23" rx="1.5" fill="#159A9C" />
                    <polygon points="25.5,21 22,27 29,27" fill="#07543F" />
                    <circle cx="25.5" cy="20" r="1" fill="#D4A72C" />
                    <rect x="52" y="27" width="5" height="23" rx="1.5" fill="#159A9C" />
                    <polygon points="54.5,21 51,27 58,27" fill="#07543F" />
                    <circle cx="54.5" cy="20" r="1" fill="#D4A72C" />
                    <rect x="20" y="43" width="40" height="9" fill="#087F5B" rx="1" />
                    <path d="M37 52 L37 45 C37 43.5 38.5 42.5 40 42.5 C41.5 42.5 43 43.5 43 45 L43 52 Z" fill="#FDFBF7" />
                    <g filter="drop-shadow(0 2px 4px rgba(21, 154, 156, 0.4))">
                      <path d="M40 48 C36.6 48 34 50.6 34 54 C34 58.5 40 65 40 65 C40 65 46 58.5 46 54 C46 50.6 43.4 48 40 48 Z" fill="#159A9C" />
                      <circle cx="40" cy="54" r="2.5" fill="#FFFFFF" />
                    </g>
                  </svg>
                </div>
              </div>
            </>
          )}

          {/* Bottom Action Pill Overlay */}
          <div className="relative z-10 w-full">
            <div className={`w-full py-1 px-2 rounded-xl text-white text-[10px] font-bold flex items-center justify-between shadow-xs transition-all ${
              !videoError
                ? 'bg-teal-600/90 hover:bg-teal-600 backdrop-blur-xs border border-white/20'
                : 'bg-gradient-to-r from-teal-700 to-emerald-700 group-hover:from-teal-800 group-hover:to-emerald-800'
            }`}>
              <span>View Map</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </button>

        {/* Right 2x2 Grid: 4 Compact Image Tiles with Labels */}
        <div className="col-span-3 grid grid-cols-2 gap-x-2 gap-y-2.5">

          {/* 1. Quran Tile */}
          <button
            type="button"
            onClick={handleQuranClick}
            aria-label="Quran"
            className="flex flex-col items-center group cursor-pointer active:scale-95 transition-all w-full text-center"
          >
            <div className="aspect-square w-full rounded-2xl relative overflow-hidden shadow-2xs">
              <img
                src="https://res.cloudinary.com/ddeivqykl/image/upload/v1791806896/Qur_an_on_Ornate_Wooden_Rehal_Icon_urauov.png"
                alt="Holy Quran on Rehal"
                className="w-full h-full object-cover object-center block"
                style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
                loading="eager"
              />
            </div>
            <span className="text-[12px] sm:text-[13px] font-semibold text-slate-800 mt-1.5 leading-tight tracking-tight text-center">
              Quran
            </span>
          </button>

          {/* 2. Qibla Tile */}
          <button
            type="button"
            onClick={handleQiblaClick}
            aria-label="Qibla Compass"
            className="flex flex-col items-center group cursor-pointer active:scale-95 transition-all w-full text-center"
          >
            <div className="aspect-square w-full rounded-2xl relative overflow-hidden shadow-2xs">
              <img
                src="https://res.cloudinary.com/ddeivqykl/image/upload/v1791807182/Qibla_Compass_with_Kaaba_Motif_2_lzqt5c.png"
                alt="Qibla Compass with Kaaba Motif"
                className="w-full h-full object-cover object-center block"
                style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
                loading="eager"
              />
            </div>
            <span className="text-[12px] sm:text-[13px] font-semibold text-slate-800 mt-1.5 leading-tight tracking-tight text-center">
              Qibla
            </span>
          </button>

          {/* 3. Tasbeeh Tile */}
          <button
            type="button"
            onClick={handleTasbeehClick}
            aria-label="Tasbeeh Counter"
            className="flex flex-col items-center group cursor-pointer active:scale-95 transition-all w-full text-center"
          >
            <div className="aspect-square w-full rounded-2xl relative overflow-hidden shadow-2xs bg-transparent">
              <img
                src="https://res.cloudinary.com/ddeivqykl/image/upload/v1791955147/tasbeeh_pink_icon_transparent_hl7zv0.png"
                alt="Tasbeeh Counter"
                className="w-full h-full object-contain object-center block"
                style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center' }}
                loading="eager"
              />
            </div>
            <span className="text-[12px] sm:text-[13px] font-semibold text-slate-800 mt-1.5 leading-tight tracking-tight text-center">
              Tasbeeh
            </span>
          </button>

          {/* 4. Bayan Tile */}
          <button
            type="button"
            onClick={handleBayanClick}
            aria-label="Bayan Lectures"
            className="flex flex-col items-center group cursor-pointer active:scale-95 transition-all w-full text-center"
          >
            <div className="aspect-square w-full rounded-2xl relative overflow-hidden shadow-2xs bg-transparent">
              <img
                src="https://res.cloudinary.com/ddeivqykl/image/upload/v1791955512/Glossy_Blue_Mosque_Microphone_Icon_irjcxl.png"
                alt="Bayan Lectures"
                className="w-full h-full object-contain object-center block"
                style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center' }}
                loading="eager"
              />
            </div>
            <span className="text-[12px] sm:text-[13px] font-semibold text-slate-800 mt-1.5 leading-tight tracking-tight text-center">
              Bayan
            </span>
          </button>

        </div>

      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { BookOpen, Share2, Copy, Check, ChevronRight } from 'lucide-react';
import { TODAY_REMINDER } from '../../data/mockData';
import { RubElHizbIcon, CrescentStarIcon } from '../common/IslamicIcons';
import { useTranslation } from '../../utils/translations';

export const DailyReminderCard: React.FC = () => {
  const { setOverlayScreen, settings } = useApp();
  const t = useTranslation(settings.language);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'ayah' | 'hadith'>('ayah');

  const handleCopy = () => {
    const textToCopy = activeTab === 'ayah' 
      ? `${TODAY_REMINDER.ayah.arabic}\n\n"${TODAY_REMINDER.ayah.english}" — ${TODAY_REMINDER.ayah.surah}`
      : `"${TODAY_REMINDER.hadith.text}" — ${TODAY_REMINDER.hadith.source}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    const textToShare = activeTab === 'ayah' 
      ? `${TODAY_REMINDER.ayah.arabic}\n\n"${TODAY_REMINDER.ayah.english}" — ${TODAY_REMINDER.ayah.surah}`
      : `"${TODAY_REMINDER.hadith.text}" — ${TODAY_REMINDER.hadith.source}`;
    if (navigator.share) {
      navigator.share({
        title: activeTab === 'ayah' ? "Today's Ayah - Sirajan Muneera" : "Daily Hadith - Sirajan Muneera",
        text: textToShare
      }).catch(() => {});
    } else {
      handleCopy();
    }
  };

  return (
    <div className="w-full rounded-[20px] p-4 sm:p-5 bg-gradient-to-br from-[#064E3B] via-[#056149] to-[#087F6B] border border-white/15 shadow-[0_8px_24px_rgba(6,78,59,0.22)] relative overflow-hidden text-white">
      {/* Background Soft Glow Highlight */}
      <div className="absolute -top-12 right-1/4 w-44 h-44 bg-teal-300/10 rounded-full blur-2xl pointer-events-none" />

      {/* Subtle Islamic Geometric Watermark */}
      <div className="absolute -top-4 -right-4 w-28 h-28 pointer-events-none opacity-[0.08] text-white">
        <RubElHizbIcon className="w-full h-full" />
      </div>
      <div className="absolute -bottom-4 -left-4 w-24 h-24 pointer-events-none opacity-[0.06] text-[#FDE68A]">
        <CrescentStarIcon className="w-full h-full" />
      </div>

      {/* Top Header: Tabs & Quran Shortcut */}
      <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-white/15 relative z-10">
        {/* Segmented Pill Tabs */}
        <div className="flex items-center gap-1 p-0.5 bg-black/25 rounded-xl border border-white/10 backdrop-blur-xs">
          <button
            type="button"
            onClick={() => setActiveTab('ayah')}
            className={`px-2.5 py-1 text-[10px] sm:text-[11px] font-bold tracking-wider uppercase rounded-lg transition-all cursor-pointer ${
              activeTab === 'ayah' 
                ? 'bg-white/25 text-white shadow-xs border border-white/20' 
                : 'text-emerald-100/70 hover:text-white'
            }`}
          >
            TODAY'S AYAH
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('hadith')}
            className={`px-2.5 py-1 text-[10px] sm:text-[11px] font-medium tracking-wide rounded-lg transition-all cursor-pointer ${
              activeTab === 'hadith' 
                ? 'bg-white/25 text-white shadow-xs border border-white/20 font-bold' 
                : 'text-emerald-100/70 hover:text-white'
            }`}
          >
            Daily Hadith
          </button>
        </div>

        {/* Quran Shortcut Button */}
        <button
          type="button"
          onClick={() => setOverlayScreen('quran')}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-xs font-semibold text-[#FDE68A] hover:text-amber-200 border border-white/15 cursor-pointer shadow-2xs"
          title="Open Quran"
        >
          <BookOpen className="w-3.5 h-3.5 text-[#FDE68A]" />
          <span>Quran</span>
          <ChevronRight className="w-3 h-3 text-white/70" />
        </button>
      </div>

      {/* Main Content Area */}
      {activeTab === 'ayah' ? (
        <div className="relative z-10 flex flex-col">
          {/* Prominent Arabic Ayah */}
          <p 
            className="text-right text-lg sm:text-xl font-bold text-white leading-[1.8] sm:leading-[1.9] mb-2.5 px-0.5 dir-rtl" 
            dir="rtl"
            style={{ fontFamily: "'Amiri', 'Traditional Arabic', 'Scheherazade New', serif" }}
          >
            {TODAY_REMINDER.ayah.arabic}
          </p>

          {/* English Translation */}
          <p className="text-xs sm:text-[13px] text-[#EAF7F1] leading-relaxed italic mb-3">
            "{TODAY_REMINDER.ayah.english}"
          </p>

          {/* Tamil Translation if language is Tamil */}
          {settings.language === 'ta' && (
            <p className="text-[11px] text-emerald-100 leading-relaxed mb-3 font-medium bg-black/20 p-2.5 rounded-xl border border-white/10">
              {TODAY_REMINDER.ayah.tamil}
            </p>
          )}

          {/* Reference & Actions Footer */}
          <div className="flex items-center justify-between text-xs pt-2.5 border-t border-white/15 mt-0.5">
            <span className="font-bold text-[#FDE68A] tracking-wide flex items-center gap-1.5 text-[11px] sm:text-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FDE68A]" />
              {TODAY_REMINDER.ayah.surah}
            </span>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-[11px] font-medium text-emerald-100 hover:text-white border border-white/10 cursor-pointer"
                title="Copy verse"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3 text-[#FDE68A]" />
                    <span className="text-[#FDE68A] font-semibold">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleShare}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-[11px] font-medium text-emerald-100 hover:text-white border border-white/10 cursor-pointer"
                title="Share verse"
              >
                <Share2 className="w-3 h-3 text-emerald-200" />
                <span>Reflect & Share</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative z-10 flex flex-col">
          <p className="text-[11px] text-emerald-200/90 mb-1 font-medium">
            Narrated by {TODAY_REMINDER.hadith.narrator}:
          </p>
          <p className="text-xs sm:text-[13px] text-white font-medium leading-relaxed mb-3">
            "{TODAY_REMINDER.hadith.text}"
          </p>

          {/* Reference & Actions Footer */}
          <div className="flex items-center justify-between text-xs pt-2.5 border-t border-white/15 mt-0.5">
            <span className="font-bold text-[#FDE68A] tracking-wide flex items-center gap-1.5 text-[11px] sm:text-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FDE68A]" />
              {TODAY_REMINDER.hadith.source}
            </span>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-[11px] font-medium text-emerald-100 hover:text-white border border-white/10 cursor-pointer"
                title="Copy Hadith"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3 text-[#FDE68A]" />
                    <span className="text-[#FDE68A] font-semibold">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleShare}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-[11px] font-medium text-emerald-100 hover:text-white border border-white/10 cursor-pointer"
                title="Share Hadith"
              >
                <Share2 className="w-3 h-3 text-emerald-200" />
                <span>Reflect & Share</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';

const SPLASH_VIDEO_URL = 'https://res.cloudinary.com/ddeivqykl/video/upload/v1792043647/download_2_kn2cui.mp4';

export const SplashScreen: React.FC = () => {
  const { setOverlayScreen, hasSeenOnboarding } = useApp();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const transitionedRef = useRef(false);

  const handleFinish = () => {
    if (transitionedRef.current) return;
    transitionedRef.current = true;
    if (!hasSeenOnboarding) {
      setOverlayScreen('onboarding');
    } else {
      setOverlayScreen(null);
    }
  };

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.muted = true;
      video.defaultMuted = true;
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn('Autoplay prevented or interrupted:', err);
        });
      }
    }

    // Splash duration & transition timer
    const timer = setTimeout(() => {
      handleFinish();
    }, 4500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-50 w-full h-full h-[100dvh] bg-[#060F1D] flex items-center justify-center overflow-hidden select-none pointer-events-none">
      <video
        ref={videoRef}
        src={SPLASH_VIDEO_URL}
        autoPlay
        muted
        playsInline
        webkit-playsinline="true"
        loop
        controls={false}
        preload="auto"
        className="w-full h-full object-cover object-center"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center',
        }}
      />
    </div>
  );
};

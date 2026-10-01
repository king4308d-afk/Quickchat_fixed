import React, { useState, useEffect } from 'react';
import { useRoulette } from '../context/RouletteContext';
import {
  Globe,
  Radio,
  Volume2,
  VolumeX,
  Maximize2,
  Flag,
  Sparkles,
  Wifi,
  ShieldAlert,
  Play
} from 'lucide-react';

export const StrangerVideoFeed: React.FC = () => {
  const {
    status,
    currentStranger,
    findNextStranger,
    openReportModal,
    selectedInterest,
    isStrangerTyping
  } = useRoulette();

  const [isMuted, setIsMuted] = useState(false);
  const [audioLevel, setAudioLevel] = useState(2);

  // Simulate speaking audio level fluctuations when connected
  useEffect(() => {
    let interval: any = null;
    if (status === 'connected') {
      interval = setInterval(() => {
        // Random level between 1 and 5
        setAudioLevel(Math.floor(Math.random() * 5) + 1);
      }, 250);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [status]);

  return (
    <div className="relative w-full h-full min-h-[260px] sm:min-h-[300px] bg-neutral-950 rounded-2xl sm:rounded-3xl overflow-hidden border border-neutral-800 flex items-center justify-center shadow-2xl">
      {/* 1. MATCH FINDING LOADER (When searching) */}
      {status === 'searching' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-gradient-to-b from-neutral-950 via-neutral-900 to-black z-20">
          {/* Concentric radar scanning circles */}
          <div className="relative w-36 h-36 sm:w-44 sm:h-44 flex items-center justify-center mb-6">
            <div className="absolute inset-0 rounded-full border border-rose-500/20 animate-ping" />
            <div className="absolute inset-4 rounded-full border border-pink-500/30 animate-pulse" />
            <div className="absolute inset-8 rounded-full border border-rose-500/40" />

            {/* Radar scanner sweep line */}
            <div className="absolute inset-0 rounded-full border-2 border-rose-500/60 overflow-hidden">
              <div className="w-1/2 h-1/2 bg-gradient-to-br from-rose-500/40 to-transparent origin-bottom-right animate-spin" />
            </div>

            {/* Center icon */}
            <div className="relative w-16 h-16 rounded-full bg-neutral-800 border-2 border-rose-500 flex items-center justify-center shadow-lg shadow-rose-500/30 z-10">
              <Globe className="w-8 h-8 text-rose-400 animate-spin-slow" />
            </div>
          </div>

          {/* Loader text */}
          <h3 className="text-lg sm:text-xl font-bold text-white text-center mb-1 flex items-center gap-2">
            <span>Finding a Random Stranger</span>
            <span className="flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-bounce" style={{ animationDelay: '300ms' }} />
            </span>
          </h3>

          <p className="text-xs sm:text-sm text-neutral-400 text-center max-w-xs">
            Connecting through secure WebRTC P2P mesh across verified users...
          </p>

          {selectedInterest !== 'All' && (
            <div className="mt-3 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-xs font-semibold text-rose-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Filtering for: {selectedInterest}
            </div>
          )}
        </div>
      )}

      {/* 2. IDLE / STOPPED STATE */}
      {status === 'idle' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-neutral-900/95 z-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-neutral-800 border border-neutral-700 flex items-center justify-center mb-4 text-neutral-400">
            <Radio className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Video Matching is Paused</h3>
          <p className="text-xs sm:text-sm text-neutral-400 max-w-sm mb-6">
            Press the "Next Stranger" button or click below to immediately start meeting people from around the world.
          </p>
          <button
            type="button"
            id="btn-resume-matching"
            onClick={findNextStranger}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-bold text-sm shadow-lg shadow-rose-500/30 flex items-center gap-2 cursor-pointer transition active:scale-95"
          >
            <Play className="w-4 h-4 fill-white" /> Start Video Matching
          </button>
        </div>
      )}

      {/* 3. CONNECTED STRANGER LIVE VIDEO STREAM */}
      {status === 'connected' && currentStranger && (
        <div className="relative w-full h-full overflow-hidden flex items-center justify-center group">
          {/* Background Video/Image Feed with realistic webcam pan & breathing effect */}
          <img
            src={currentStranger.photoUrl}
            alt={currentStranger.name}
            className="w-full h-full object-cover object-center filter brightness-95 contrast-105 select-none transition-transform duration-1000 ease-out"
          />

          {/* Realistic Webcam subtle ambient scanline / lighting overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/60 pointer-events-none" />

          {/* Top-Left Stranger Info HUD */}
          <div className="absolute top-3 sm:top-4 left-3 sm:left-4 z-20 flex flex-col gap-1 max-w-[70%]">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white font-bold text-xs sm:text-sm border border-white/10 flex items-center gap-1.5 shadow-md">
                <span className="text-base">{currentStranger.countryFlag}</span>
                <span>{currentStranger.name}, {currentStranger.age}</span>
              </span>

              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-neutral-900/70 backdrop-blur-md text-[11px] text-neutral-300 border border-white/10">
                <Wifi className="w-3 h-3 text-emerald-400" /> 36ms HD
              </span>
            </div>

            <div className="text-[11px] text-white/80 font-medium drop-shadow-md flex items-center gap-1 pl-1">
              <span>📍 {currentStranger.city}, {currentStranger.country}</span>
            </div>

            {/* Interest badges */}
            <div className="hidden sm:flex items-center gap-1 mt-0.5 flex-wrap">
              {currentStranger.interests.slice(0, 3).map((item) => (
                <span
                  key={item}
                  className="px-2 py-0.5 rounded-md bg-white/15 backdrop-blur-xs text-[10px] text-white/90 border border-white/10"
                >
                  #{item}
                </span>
              ))}
            </div>
          </div>

          {/* Top-Right Action Controls (Report & Volume) */}
          <div className="absolute top-3 sm:top-4 right-3 sm:right-4 z-20 flex items-center gap-1.5">
            <button
              type="button"
              id="btn-stranger-mute"
              onClick={() => setIsMuted(!isMuted)}
              className="p-2 rounded-xl bg-black/50 hover:bg-black/70 backdrop-blur-md text-white/80 hover:text-white border border-white/10 transition cursor-pointer"
              title={isMuted ? 'Unmute Partner' : 'Mute Partner'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
            </button>

            <button
              type="button"
              id="btn-stranger-report"
              onClick={openReportModal}
              className="p-2 rounded-xl bg-black/50 hover:bg-rose-500/80 backdrop-blur-md text-white/80 hover:text-white border border-white/10 transition cursor-pointer"
              title="Report or Block this Stranger"
            >
              <Flag className="w-4 h-4" />
            </button>
          </div>

          {/* Bottom-Left Live Speaking Waveform Bar */}
          <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 z-20 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
            <div className="flex items-center gap-0.5 h-3.5">
              {[1, 2, 3, 4, 5].map((bar) => {
                const height = Math.min(100, Math.max(25, (audioLevel * 20 + bar * 12) % 100));
                return (
                  <span
                    key={bar}
                    style={{ height: isMuted ? '4px' : `${height}%` }}
                    className={`w-1 rounded-full transition-all duration-150 ${
                      isMuted ? 'bg-neutral-500' : 'bg-emerald-400'
                    }`}
                  />
                );
              })}
            </div>
            <span className="text-[11px] font-semibold text-white/90">
              {isMuted ? 'Audio Muted' : 'Speaking...'}
            </span>
          </div>

          {/* Bottom-Right Stranger Typing Indicator Overlay */}
          {isStrangerTyping && (
            <div className="absolute bottom-3 sm:bottom-4 right-3 sm:right-4 z-20 flex items-center gap-2 bg-rose-500/90 backdrop-blur-md text-white px-3 py-1.5 rounded-xl text-xs font-semibold shadow-lg shadow-rose-500/20 animate-pulse border border-rose-400/40">
              <span>{currentStranger.name.split(' ')[0]} is typing</span>
              <span className="flex gap-0.5">
                <span className="w-1 h-1 rounded-full bg-white animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1 h-1 rounded-full bg-white animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1 h-1 rounded-full bg-white animate-bounce" style={{ animationDelay: '300ms' }} />
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

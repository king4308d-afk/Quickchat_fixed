import React from 'react';
import { useRoulette } from '../context/RouletteContext';
import { AVAILABLE_INTEREST_TAGS } from '../data/strangers';
import {
  Video,
  Radio,
  Volume2,
  VolumeX,
  ShieldCheck,
  Users,
  Sparkles
} from 'lucide-react';

export const RouletteHeader: React.FC = () => {
  const {
    onlineCount,
    selectedInterest,
    setSelectedInterest,
    soundEnabled,
    toggleSound,
    callDurationSec,
    status
  } = useRoulette();

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
      .toString()
      .padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <header className="w-full bg-neutral-900 border-b border-neutral-800 text-white select-none z-30 shrink-0">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Brand Logo & Online Counter */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-500 via-pink-500 to-amber-500 flex items-center justify-center shadow-md shadow-rose-500/20">
              <Video className="w-5 h-5 text-white stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg sm:text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-neutral-100 to-neutral-400">
                  Quick<span className="text-rose-500">Chat</span>
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                  LIVE
                </span>
              </div>
            </div>
          </div>

          {/* Online count */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-800/80 border border-neutral-700/60 text-xs text-neutral-300">
            <Users className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-semibold text-white">{onlineCount.toLocaleString()}</span>
            <span className="text-neutral-400">Online</span>
          </div>

          {/* Connected Call Duration indicator */}
          {status === 'connected' && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-xs text-rose-300">
              <Radio className="w-3 h-3 text-rose-400 animate-pulse" />
              <span className="font-mono font-bold">{formatTime(callDurationSec)}</span>
            </div>
          )}
        </div>

        {/* Center: Interest Selector */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 max-w-full sm:max-w-md">
          <span className="text-xs text-neutral-400 hidden md:inline shrink-0 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Topic:
          </span>
          {AVAILABLE_INTEREST_TAGS.slice(0, 6).map((tag) => {
            const isSelected = selectedInterest === tag;
            return (
              <button
                key={tag}
                type="button"
                id={`filter-interest-${tag.toLowerCase().replace(/[^a-z]/g, '')}`}
                onClick={() => setSelectedInterest(tag)}
                className={`text-xs px-2.5 py-1 rounded-full transition-all shrink-0 cursor-pointer border ${
                  isSelected
                    ? 'bg-rose-500 border-rose-400 text-white font-semibold shadow-sm shadow-rose-500/30'
                    : 'bg-neutral-800/90 hover:bg-neutral-700/80 text-neutral-300 border-neutral-700'
                }`}
              >
                {tag}
              </button>
            );
          })}
        </div>

        {/* Right: Sound toggle & Moderation Shield */}
        <div className="flex items-center gap-2 ml-auto sm:ml-0">
          <div className="hidden lg:flex items-center gap-1 text-[11px] text-neutral-400 bg-neutral-800/60 px-2.5 py-1 rounded-full border border-neutral-700/50">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Safe Moderated</span>
          </div>

          <button
            type="button"
            id="btn-toggle-sound"
            onClick={toggleSound}
            className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition cursor-pointer border border-neutral-700"
            title={soundEnabled ? 'Mute Sound Effects' : 'Unmute Sound Effects'}
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-neutral-400" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

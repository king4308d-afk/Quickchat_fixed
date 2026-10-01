import React from 'react';
import { useApp } from '../context/AppContext';
import { Coins, Sparkles, LogOut, Video, User } from 'lucide-react';

export const TopBar: React.FC = () => {
  const { currentUser, setActiveTab, logout } = useApp();

  return (
    <header className="w-full bg-neutral-900/95 backdrop-blur-md border-b border-neutral-800 text-white select-none z-30 shrink-0 sticky top-0">
      <div className="max-w-5xl mx-auto px-4 py-2.5 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setActiveTab('video')}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-pink-600 flex items-center justify-center shadow-md shadow-rose-500/20">
            <Video className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base sm:text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-neutral-100 to-neutral-400">
                Quick<span className="text-rose-500">Chat</span>
              </span>
              <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                HD
              </span>
            </div>
          </div>
        </div>

        {/* ALWAYS DISPLAY CURRENT COIN BALANCE ON TOP-RIGHT CORNER */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            id="top-bar-coin-balance-badge"
            onClick={() => setActiveTab('spin')}
            className="group flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 to-yellow-500/10 border border-amber-500/40 hover:border-amber-400 shadow-sm transition-all cursor-pointer active:scale-95"
            title="Click to Spin & Earn More Coins"
          >
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 flex items-center justify-center shadow-xs">
              <Coins className="w-3.5 h-3.5 text-neutral-900 stroke-[2.5]" />
            </div>
            <div className="flex flex-col items-start leading-none pr-1">
              <div className="flex items-center gap-1">
                <span className="font-mono font-black text-amber-300 text-sm sm:text-base">
                  {(currentUser?.coins ?? 0).toLocaleString()}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400/90">
                  Coins
                </span>
              </div>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/30 text-amber-200 font-bold hidden sm:inline-flex items-center gap-0.5 group-hover:bg-amber-500 group-hover:text-black transition">
              <Sparkles className="w-2.5 h-2.5" /> +Earn
            </span>
          </button>

          {/* User mini profile avatar */}
          {currentUser && (
            <button
              type="button"
              id="top-bar-profile-btn"
              onClick={() => setActiveTab('profile')}
              className="flex items-center gap-2 p-1 rounded-full hover:bg-neutral-800 transition cursor-pointer"
              title="View Profile"
            >
              {currentUser.avatar ? (
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-neutral-700 hover:ring-rose-500 transition"
                />
              ) : (
                <div
                  className="w-8 h-8 rounded-full bg-neutral-800 ring-2 ring-neutral-700 hover:ring-rose-500 flex items-center justify-center text-neutral-400 hover:text-white transition"
                  title="No DP set"
                >
                  <User className="w-4 h-4" />
                </div>
              )}
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

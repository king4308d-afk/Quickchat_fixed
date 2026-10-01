import React, { useState, useEffect, useRef } from 'react';
import { useDating } from '../context/DatingContext';
import { SwipeCard } from './SwipeCard';
import { UserProfile } from '../types';
import { RotateCcw, X, Star, Heart, SlidersHorizontal, Sparkles, RefreshCw } from 'lucide-react';
import { AnimatePresence } from 'motion/react';

interface DiscoveryDeckProps {
  onOpenDetails: (profile: UserProfile) => void;
  onOpenFilters: () => void;
}

export const DiscoveryDeck: React.FC<DiscoveryDeckProps> = ({ onOpenDetails, onOpenFilters }) => {
  const {
    profiles,
    swipeRight,
    swipeLeft,
    superLike,
    undoSwipe,
    resetDeck
  } = useDating();

  const [activeProfile, setActiveProfile] = useState<UserProfile | null>(null);
  const [forcedSwipeDirection, setForcedSwipeDirection] = useState<'left' | 'right' | 'up' | null>(null);
  const isBusyRef = useRef(false);

  useEffect(() => {
    setActiveProfile(profiles[0] || null);
    setForcedSwipeDirection(null);
    isBusyRef.current = false;
  }, [profiles]);

  // Programmatic swipe triggered by buttons or keyboard
  const triggerProgrammaticSwipe = (direction: 'left' | 'right' | 'up') => {
    if (!activeProfile || isBusyRef.current) return;
    isBusyRef.current = true;
    setForcedSwipeDirection(direction);

    setTimeout(() => {
      if (direction === 'left') {
        swipeLeft(activeProfile.id);
      } else if (direction === 'right') {
        swipeRight(activeProfile.id);
      } else if (direction === 'up') {
        superLike(activeProfile.id);
      }
      setForcedSwipeDirection(null);
      isBusyRef.current = false;
    }, 220);
  };

  // Touch or mouse drag swipe directly from the card
  const handleCardSwipe = (direction: 'left' | 'right' | 'up') => {
    if (!activeProfile || isBusyRef.current) return;
    isBusyRef.current = true;
    if (direction === 'left') {
      swipeLeft(activeProfile.id);
    } else if (direction === 'right') {
      swipeRight(activeProfile.id);
    } else if (direction === 'up') {
      superLike(activeProfile.id);
    }
    setTimeout(() => {
      isBusyRef.current = false;
    }, 100);
  };

  // Keyboard shortcut listener for swiping
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!activeProfile || isBusyRef.current) return;
      if (e.key === 'ArrowLeft') {
        triggerProgrammaticSwipe('left');
      } else if (e.key === 'ArrowRight') {
        triggerProgrammaticSwipe('right');
      } else if (e.key === 'ArrowUp') {
        triggerProgrammaticSwipe('up');
      } else if (e.key === 'z' || e.key === 'Z') {
        undoSwipe();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeProfile, undoSwipe]);

  return (
    <div className="flex flex-col items-center justify-between h-[calc(100vh-4.5rem)] max-w-md mx-auto w-full px-4 py-3 sm:py-4">
      {/* Top Deck Header Sub-bar */}
      <div className="w-full flex items-center justify-between px-2 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-rose-500" />
          <span>Top Picks Aaj Ke</span>
        </div>
        <button
          id="deck-filter-btn"
          type="button"
          onClick={onOpenFilters}
          className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 text-rose-600 hover:bg-rose-100 transition cursor-pointer"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Filters</span>
        </button>
      </div>

      {/* Main Swipe Stage Card Container */}
      <div className="relative w-full flex-1 max-h-[580px] min-h-[420px]">
        <AnimatePresence>
          {profiles.length > 0 ? (
            <>
              {/* Preload background card for 3D stack appearance */}
              {profiles.length > 1 && (
                <div className="absolute inset-0 scale-[0.94] translate-y-3 opacity-60 rounded-3xl overflow-hidden pointer-events-none bg-neutral-800">
                  <img
                    src={profiles[1].photos[0]}
                    alt=""
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40" />
                </div>
              )}

              {/* Top Interactive Card */}
              <SwipeCard
                key={profiles[0].id}
                profile={profiles[0]}
                isTopCard={true}
                forcedSwipeDirection={forcedSwipeDirection}
                onSwipe={handleCardSwipe}
                onOpenDetails={onOpenDetails}
              />
            </>
          ) : (
            /* Empty State when cards run out */
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 bg-white/90 backdrop-blur-md rounded-3xl border border-gray-200/80 shadow-xl">
              <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mb-4 shadow-inner">
                <Heart className="w-10 h-10 stroke-[1.5]" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">Koi Naya Profile Nahi Bacha!</h3>
              <p className="text-sm text-gray-500 mt-2 max-w-xs leading-relaxed">
                Aapne apne current filters ke sabhi profiles dekh liye hain.
              </p>
              <button
                id="reset-deck-btn"
                type="button"
                onClick={resetDeck}
                className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-rose-500 to-pink-600 text-white font-semibold rounded-2xl shadow-lg shadow-rose-500/25 hover:from-rose-600 hover:to-pink-700 active:scale-95 transition cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Profiles Dobara Shuru Karein</span>
              </button>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Floating Action Controls Bar */}
      <div className="w-full pt-3 pb-1 flex items-center justify-center gap-3 sm:gap-4">
        {/* Undo Swipe */}
        <button
          id="btn-undo-swipe"
          type="button"
          onClick={undoSwipe}
          disabled={profiles.length === 0}
          className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white hover:bg-amber-50 text-amber-500 border border-gray-200/80 shadow-md flex items-center justify-center active:scale-90 transition disabled:opacity-40 cursor-pointer"
          title="Pichhla Swipe Wapas Layein (Rewind)"
        >
          <RotateCcw className="w-5 h-5" />
        </button>

        {/* Dislike / Nope (X) */}
        <button
          id="btn-swipe-nope"
          type="button"
          onClick={() => triggerProgrammaticSwipe('left')}
          disabled={!activeProfile}
          className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white hover:bg-rose-50 text-rose-500 border border-gray-200/80 shadow-lg flex items-center justify-center active:scale-90 transition disabled:opacity-40 cursor-pointer hover:scale-105"
          title="Pass / Dislike (Left Swipe)"
        >
          <X className="w-7 h-7 sm:w-8 sm:h-8 stroke-[2.5]" />
        </button>

        {/* Super Like (Star) */}
        <button
          id="btn-swipe-superlike"
          type="button"
          onClick={() => triggerProgrammaticSwipe('up')}
          disabled={!activeProfile}
          className="w-12 h-12 sm:w-13 sm:h-13 rounded-full bg-white hover:bg-sky-50 text-sky-500 border border-gray-200/80 shadow-md flex items-center justify-center active:scale-90 transition disabled:opacity-40 cursor-pointer hover:scale-105"
          title="Super Like! (Star)"
        >
          <Star className="w-6 h-6 fill-sky-500 stroke-[1.5]" />
        </button>

        {/* Like (Heart) */}
        <button
          id="btn-swipe-like"
          type="button"
          onClick={() => triggerProgrammaticSwipe('right')}
          disabled={!activeProfile}
          className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 hover:from-emerald-600 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/25 flex items-center justify-center active:scale-90 transition disabled:opacity-40 cursor-pointer hover:scale-105"
          title="Like ❤️ (Right Swipe)"
        >
          <Heart className="w-7 h-7 sm:w-8 sm:h-8 fill-white stroke-[2]" />
        </button>

        {/* Details / Info Toggle */}
        <button
          id="btn-profile-details"
          type="button"
          onClick={() => activeProfile && onOpenDetails(activeProfile)}
          disabled={!activeProfile}
          className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white hover:bg-purple-50 text-purple-600 border border-gray-200/80 shadow-md flex items-center justify-center active:scale-90 transition disabled:opacity-40 cursor-pointer"
          title="Profile Info"
        >
          <Sparkles className="w-5 h-5" />
        </button>
      </div>

      {/* Keyboard guide tip */}
      <div className="hidden sm:block text-[11px] text-gray-400 mt-1">
        Keyboard: <span className="font-semibold text-gray-500">← Pass</span> • <span className="font-semibold text-gray-500">→ Like</span> • <span className="font-semibold text-gray-500">↑ Super Like</span> • <span className="font-semibold text-gray-500">Z Undo</span>
      </div>
    </div>
  );
};

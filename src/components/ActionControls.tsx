import React, { useEffect } from 'react';
import { useRoulette } from '../context/RouletteContext';
import {
  SkipForward,
  Square,
  Flag,
  MessageSquare,
  Play,
  Send,
  Sparkles
} from 'lucide-react';

interface ActionControlsProps {
  onFocusChatInput?: () => void;
}

export const ActionControls: React.FC<ActionControlsProps> = ({ onFocusChatInput }) => {
  const {
    status,
    findNextStranger,
    stopRoulette,
    resumeRoulette,
    openReportModal,
    toggleTextChat,
    isTextChatOpen,
    unreadCount
  } = useRoulette();

  // Keyboard shortcut listener (Spacebar for Next, Escape for Stop)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input or textarea
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.code === 'Space' || e.key === 'ArrowRight') {
        e.preventDefault();
        findNextStranger();
      } else if (e.key === 'Escape' && status === 'connected') {
        stopRoulette();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [findNextStranger, stopRoulette, status]);

  const handleStopOrReportClick = () => {
    if (status === 'connected') {
      openReportModal();
    } else if (status === 'idle') {
      resumeRoulette();
    } else {
      stopRoulette();
    }
  };

  const handleChatButtonClick = () => {
    toggleTextChat();
    if (onFocusChatInput) {
      setTimeout(() => onFocusChatInput(), 100);
    }
  };

  return (
    <div className="w-full bg-neutral-900/90 backdrop-blur-md border-t border-neutral-800 px-3 sm:px-6 py-3 shrink-0 z-30 select-none">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-3 sm:gap-4">
        {/* BUTTON 1: STOP / REPORT */}
        <button
          type="button"
          id="btn-action-stop-report"
          onClick={handleStopOrReportClick}
          className="flex-1 max-w-[200px] py-3 sm:py-3.5 px-3 sm:px-5 rounded-2xl bg-neutral-800 hover:bg-rose-950/40 text-rose-400 hover:text-rose-300 border border-neutral-700 hover:border-rose-500/50 shadow-md font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition active:scale-95 group"
          title="Stop session or Report inappropriate stranger"
        >
          {status === 'idle' ? (
            <>
              <Play className="w-4 h-4 fill-emerald-400 text-emerald-400" />
              <span className="text-emerald-400">Resume</span>
            </>
          ) : (
            <>
              <Flag className="w-4 h-4 text-rose-500 group-hover:scale-110 transition" />
              <span>Stop / Report</span>
            </>
          )}
        </button>

        {/* BUTTON 2: NEXT (PRIMARY MAIN ACTION) */}
        <button
          type="button"
          id="btn-action-next"
          onClick={findNextStranger}
          className="flex-[1.5] max-w-[320px] py-3.5 sm:py-4 px-4 sm:px-8 rounded-2xl bg-gradient-to-r from-rose-500 via-pink-600 to-rose-600 hover:from-rose-600 hover:to-pink-700 text-white font-black text-sm sm:text-base shadow-xl shadow-rose-500/30 flex items-center justify-center gap-2.5 cursor-pointer transition active:scale-[0.97] hover:scale-[1.02]"
          title="Connect to Next Stranger [Spacebar]"
        >
          <SkipForward className="w-5 h-5 fill-white stroke-[2.5]" />
          <span>Next Stranger</span>
          <span className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-black/25 text-[11px] font-mono font-medium text-white/80">
            Space
          </span>
        </button>

        {/* BUTTON 3: SEND TEXT MESSAGE / CHAT TOGGLE */}
        <button
          type="button"
          id="btn-action-send-message"
          onClick={handleChatButtonClick}
          className={`flex-1 max-w-[200px] py-3 sm:py-3.5 px-3 sm:px-5 rounded-2xl border shadow-md font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition active:scale-95 relative ${
            isTextChatOpen
              ? 'bg-neutral-800 text-white border-neutral-700 hover:bg-neutral-700'
              : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-blue-500/50 shadow-blue-500/20'
          }`}
          title="Send Text Message & Chat"
        >
          <MessageSquare className="w-4 h-4 stroke-[2.2]" />
          <span>{isTextChatOpen ? 'Hide Chat' : 'Text Chat'}</span>

          {/* Unread Message Badge */}
          {unreadCount > 0 && !isTextChatOpen && (
            <span className="absolute -top-1.5 -right-1.5 px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black animate-bounce shadow-md">
              {unreadCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
};

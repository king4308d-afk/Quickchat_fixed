import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useDating } from '../context/DatingContext';
import { Heart, MessageCircle, Sparkles, Send, Flame, X } from 'lucide-react';

interface MatchCelebrationModalProps {
  onGoToChat: (profileId: string) => void;
}

export const MatchCelebrationModal: React.FC<MatchCelebrationModalProps> = ({ onGoToChat }) => {
  const { newMatchModal, dismissMatchModal, currentUser, sendMessage } = useDating();
  const [quickMessage, setQuickMessage] = useState('');

  useEffect(() => {
    if (newMatchModal) {
      setQuickMessage('');
    }
  }, [newMatchModal?.id]);

  if (!newMatchModal) return null;

  const ICEBREAKERS = [
    'Chai ya Coffee? ☕',
    'Hey, loved your vibe! ✨',
    'Weekend plans? 🍕',
    'What song are you looping? 🎵'
  ];

  const handleSendQuickMessage = (e: React.FormEvent) => {
    e.preventDefault();
    const text = quickMessage.trim() || 'Hey! Excited to connect with you 😊';
    sendMessage(newMatchModal.id, text);
    dismissMatchModal();
    onGoToChat(newMatchModal.id);
  };

  const handleDirectChat = () => {
    dismissMatchModal();
    onGoToChat(newMatchModal.id);
  };

  const handleSelectIcebreaker = (phrase: string) => {
    setQuickMessage(phrase);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-hidden">
      {/* Celebration floating particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(16)].map((_, i) => (
          <motion.div
            key={i}
            initial={{
              x: Math.random() * 360 - 180,
              y: 50,
              opacity: 0,
              scale: 0.5
            }}
            animate={{
              y: [50, -180, -280],
              opacity: [0, 1, 0],
              scale: [0.5, 1.2, 0.8],
              rotate: [0, (i % 2 === 0 ? 180 : -180)]
            }}
            transition={{
              duration: 2.2 + (i % 3) * 0.4,
              repeat: Infinity,
              delay: (i * 0.15)
            }}
            className={`absolute left-1/2 top-1/2 w-3 h-3 rounded-full ${
              i % 4 === 0
                ? 'bg-rose-400'
                : i % 4 === 1
                ? 'bg-pink-300'
                : i % 4 === 2
                ? 'bg-amber-300'
                : 'bg-teal-300'
            }`}
          />
        ))}
      </div>

      {/* Ambient background glows */}
      <div className="absolute w-80 h-80 bg-rose-600/30 rounded-full blur-3xl pointer-events-none -top-10" />
      <div className="absolute w-80 h-80 bg-pink-500/25 rounded-full blur-3xl pointer-events-none -bottom-10" />

      <motion.div
        initial={{ scale: 0.8, opacity: 0, y: 25 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        className="relative w-full max-w-sm bg-gradient-to-b from-neutral-900 via-neutral-900 to-black text-white rounded-3xl p-6 sm:p-7 text-center shadow-2xl border border-white/15 overflow-hidden z-10"
      >
        {/* Close Button top-right */}
        <button
          id="btn-close-match-modal-x"
          type="button"
          onClick={dismissMatchModal}
          className="absolute top-4 right-4 p-2 text-white/50 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition cursor-pointer"
          title="Band karein"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Top Badge */}
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-gradient-to-r from-rose-500/25 to-pink-500/25 border border-rose-400/30 text-rose-300 text-xs font-semibold mb-3 tracking-wider uppercase shadow-inner">
          <Sparkles className="w-3.5 h-3.5 text-rose-400" />
          <span>New Mutual Match</span>
        </div>

        {/* Title */}
        <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-pink-300 to-amber-200">
          It's a Match! 🎉
        </h2>
        <p className="text-white/80 text-xs sm:text-sm mt-1.5 max-w-xs mx-auto">
          Aap aur <span className="font-bold text-white">{newMatchModal.name}</span> ne ek doosre ko right swipe kiya!
        </p>

        {/* Match Compatibility Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-0.5 mt-2 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold border border-emerald-500/30">
          <Flame className="w-3 h-3 text-emerald-400 fill-emerald-400" />
          <span>{newMatchModal.matchScore || 96}% High Chemistry</span>
        </div>

        {/* Dual Avatars with Pulsing Heart */}
        <div className="relative my-6 flex items-center justify-center">
          {/* User Avatar */}
          <div className="relative w-22 h-22 sm:w-24 sm:h-24 rounded-full p-1 bg-gradient-to-tr from-rose-500 to-pink-500 shadow-2xl -mr-3 z-10 ring-4 ring-rose-500/30">
            <img
              src={
                currentUser?.photos[0] ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'
              }
              alt="You"
              referrerPolicy="no-referrer"
              className="w-full h-full rounded-full object-cover"
            />
          </div>

          {/* Central Pulsating Heart Badge */}
          <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-rose-600 to-pink-600 text-white flex items-center justify-center shadow-xl border-3 border-neutral-900 z-20 animate-pulse">
            <Heart className="w-5 h-5 fill-white text-white" />
          </div>

          {/* Matched Profile Avatar */}
          <div className="relative w-22 h-22 sm:w-24 sm:h-24 rounded-full p-1 bg-gradient-to-tr from-rose-500 to-pink-500 shadow-2xl -ml-3 z-10 ring-4 ring-rose-500/30">
            <img
              src={newMatchModal.photos[0]}
              alt={newMatchModal.name}
              referrerPolicy="no-referrer"
              className="w-full h-full rounded-full object-cover"
            />
          </div>
        </div>

        {/* Quick Icebreakers Suggestions */}
        <div className="mb-3">
          <div className="text-[11px] font-medium text-white/50 mb-1.5 text-left pl-1">
            Quick Icebreaker se shuru karein:
          </div>
          <div className="flex flex-wrap gap-1.5 justify-center">
            {ICEBREAKERS.map((phrase, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectIcebreaker(phrase)}
                className={`text-[11px] px-2.5 py-1 rounded-xl transition cursor-pointer border ${
                  quickMessage === phrase
                    ? 'bg-rose-500/30 border-rose-400 text-white'
                    : 'bg-white/10 hover:bg-white/20 border-white/10 text-white/80'
                }`}
              >
                {phrase}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Message Form */}
        <form onSubmit={handleSendQuickMessage} className="mb-3">
          <div className="relative">
            <input
              id="match-quick-message-input"
              type="text"
              value={quickMessage}
              onChange={(e) => setQuickMessage(e.target.value)}
              placeholder={`Send a greeting to ${newMatchModal.name.split(' ')[0]}...`}
              className="w-full pl-3.5 pr-11 py-2.5 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-white/50 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
            <button
              id="match-quick-send-btn"
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 flex items-center justify-center text-white transition cursor-pointer shadow-md"
              title="Message Bhejein"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>

        {/* Primary Action Button */}
        <button
          id="btn-open-chat-from-match"
          type="button"
          onClick={handleDirectChat}
          className="w-full py-3 px-4 bg-gradient-to-r from-rose-500 via-pink-600 to-rose-600 hover:from-rose-600 hover:to-pink-700 text-white font-semibold rounded-2xl shadow-lg shadow-rose-500/30 flex items-center justify-center gap-2 cursor-pointer transition active:scale-[0.98] text-sm"
        >
          <MessageCircle className="w-4 h-4" />
          <span>Baat Cheet Shuru Karein (Open Chat)</span>
        </button>

        {/* Secondary Dismiss Button */}
        <button
          id="btn-dismiss-match-modal"
          type="button"
          onClick={dismissMatchModal}
          className="w-full mt-2 py-2 text-white/60 hover:text-white text-xs sm:text-sm font-medium transition cursor-pointer"
        >
          Swiping Jari Rakhein (Keep Browsing)
        </button>
      </motion.div>
    </div>
  );
};

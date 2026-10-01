import React from 'react';
import { useApp } from '../context/AppContext';
import { Coins, Disc, Sparkles, X, ArrowRight, Lock, CheckCircle2, AlertCircle } from 'lucide-react';

export const GetMoreCoinsModal: React.FC = () => {
  const {
    insufficientCoinsModal,
    setInsufficientCoinsModal,
    setActiveTab,
    setGenderFilter,
    currentUser,
    spinsRemaining,
    unlockFemalePass,
    femalePassCost
  } = useApp();

  if (!insufficientCoinsModal) return null;

  const handleGoToSpin = () => {
    setInsufficientCoinsModal(false);
    setActiveTab('spin');
  };

  const userCoins = currentUser?.coins ?? 0;
  const canAfford = userCoins >= femalePassCost;

  return (
    <div
      id="modal-insufficient-coins-pass"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
    >
      <div className="w-full max-w-sm bg-neutral-900 border border-amber-500/40 rounded-3xl p-6 text-center shadow-2xl relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute -top-16 -right-16 w-32 h-32 bg-amber-500/20 rounded-full blur-2xl pointer-events-none" />

        {/* Close button */}
        <button
          type="button"
          id="btn-close-pass-modal"
          onClick={() => setInsufficientCoinsModal(false)}
          className="absolute top-4 right-4 p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Icon */}
        <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 mx-auto flex items-center justify-center mb-4 shadow-lg shadow-amber-500/25">
          <Lock className="w-8 h-8 text-neutral-950 stroke-[2.5]" />
        </div>

        {/* Exact Requested Title */}
        <h3 className="text-xl font-black text-white mb-1.5 flex items-center justify-center gap-1.5">
          <AlertCircle className="w-5 h-5 text-amber-400" />
          <span>Insufficient Coins / Pass Required</span>
        </h3>

        <p className="text-xs text-neutral-300 mb-3.5 leading-relaxed">
          Female Video Calls require an <span className="font-bold text-white">Active Female Pass</span> or{' '}
          <span className="font-bold text-amber-400">{femalePassCost.toLocaleString()} Coins</span> to unlock.
        </p>

        {/* Current Balance vs Required */}
        <div className="py-2.5 px-3 rounded-2xl bg-neutral-950 border border-neutral-800 mb-3 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-neutral-400">Current Balance:</span>
            <span className="font-mono font-black text-amber-300 text-sm flex items-center gap-1">
              <Coins className="w-3.5 h-3.5" />
              {userCoins.toLocaleString()} Coins
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-neutral-400">Cost to Unlock:</span>
            <span className="font-mono font-black text-white text-xs">
              {femalePassCost.toLocaleString()} Coins
            </span>
          </div>
        </div>

        {/* Female Pass Rules Notice */}
        <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-left mb-4 flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-[11px] text-neutral-300 leading-snug">
            <div className="font-bold text-amber-300">Female Pass Rules:</div>
            <ul className="list-disc list-inside mt-0.5 space-y-0.5 text-neutral-400">
              <li>Wallet drops to 0 coins upon purchasing.</li>
              <li>Max 15 Calls OR 3 Days validity (whichever expires first).</li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          {canAfford ? (
            <button
              type="button"
              id="btn-modal-unlock-pass"
              onClick={() => {
                unlockFemalePass();
              }}
              className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-neutral-950 font-extrabold rounded-2xl shadow-lg flex items-center justify-center gap-2 cursor-pointer transition transform active:scale-98"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Unlock Female Pass ({femalePassCost.toLocaleString()} Coins)</span>
            </button>
          ) : (
            /* Direct requested button: "Earn Coins via Spin" which redirects straight to Tab 3 (Spin & Earn) */
            <button
              type="button"
              id="btn-earn-coins-spin"
              onClick={handleGoToSpin}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-neutral-950 font-extrabold rounded-2xl shadow-lg flex items-center justify-center gap-2 cursor-pointer transition transform active:scale-98"
            >
              <Disc className="w-4 h-4" />
              <span>Earn Coins via Spin</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            id="btn-switch-free-calls"
            onClick={() => {
              setGenderFilter('both');
              setInsufficientCoinsModal(false);
            }}
            className="w-full py-2.5 px-4 text-xs font-semibold text-neutral-400 hover:text-white transition cursor-pointer"
          >
            Switch to Free Male / Both Calls
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { useRoulette } from '../context/RouletteContext';
import {
  ShieldAlert,
  Flag,
  Square,
  X,
  AlertTriangle,
  UserX,
  CheckCircle2
} from 'lucide-react';

const REPORT_REASONS = [
  'Inappropriate or offensive video stream',
  'Harassment or abusive behavior',
  'Spam, advertising or automated bot',
  'Underage participant',
  'Black screen / inactive user'
];

export const ReportModal: React.FC = () => {
  const {
    isReportModalOpen,
    closeReportModal,
    submitReport,
    stopRoulette,
    currentStranger
  } = useRoulette();

  const [selectedReason, setSelectedReason] = useState(REPORT_REASONS[0]);
  const [submitted, setSubmitted] = useState(false);

  if (!isReportModalOpen) return null;

  const handleConfirmReport = () => {
    setSubmitted(true);
    setTimeout(() => {
      submitReport(selectedReason);
      setSubmitted(false);
    }, 900);
  };

  const handleJustStop = () => {
    closeReportModal();
    stopRoulette();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md select-none animate-fadeIn">
      <div className="relative w-full max-w-md bg-neutral-900 border border-neutral-700 rounded-3xl p-6 text-white shadow-2xl overflow-hidden">
        {/* Close X */}
        <button
          type="button"
          id="btn-close-report-modal"
          onClick={closeReportModal}
          className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-white rounded-full bg-neutral-800 hover:bg-neutral-700 transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {submitted ? (
          <div className="py-8 flex flex-col items-center justify-center text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold mb-1">Stranger Reported & Blocked</h3>
            <p className="text-xs text-neutral-400 max-w-xs">
              Thank you for keeping QuickChat safe. Connecting you to a new partner...
            </p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/30 text-rose-500 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Stop or Report Partner</h3>
                <p className="text-xs text-neutral-400">
                  Choose an action for{' '}
                  <span className="font-semibold text-neutral-200">
                    {currentStranger?.name || 'Current Stranger'}
                  </span>
                </p>
              </div>
            </div>

            {/* Reasons Selection */}
            <div className="space-y-2 mb-6">
              <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block">
                Reason for reporting:
              </label>
              {REPORT_REASONS.map((reason) => (
                <label
                  key={reason}
                  className={`flex items-center gap-3 p-3 rounded-xl border text-xs cursor-pointer transition ${
                    selectedReason === reason
                      ? 'bg-rose-950/30 border-rose-500/60 text-white font-semibold'
                      : 'bg-neutral-800/60 border-neutral-700/60 text-neutral-300 hover:bg-neutral-800'
                  }`}
                >
                  <input
                    type="radio"
                    name="report-reason"
                    checked={selectedReason === reason}
                    onChange={() => setSelectedReason(reason)}
                    className="accent-rose-500 w-4 h-4"
                  />
                  <span>{reason}</span>
                </label>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                id="btn-confirm-report-block"
                onClick={handleConfirmReport}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition active:scale-98 shadow-lg shadow-rose-600/30"
              >
                <Flag className="w-4 h-4 fill-white" /> Report & Block Stranger (Instant Next)
              </button>

              <button
                type="button"
                id="btn-confirm-just-stop"
                onClick={handleJustStop}
                className="w-full py-2.5 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer transition"
              >
                <Square className="w-3.5 h-3.5 fill-current" /> Just Stop & Leave Video Room
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

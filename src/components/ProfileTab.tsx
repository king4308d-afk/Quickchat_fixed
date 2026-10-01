import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import {
  User,
  Coins,
  Copy,
  Check,
  Trophy,
  Video,
  Disc,
  ShieldCheck,
  LogOut,
  Mail,
  Calendar,
  Sparkles,
  Share2,
  Edit2,
  Camera,
  Loader2,
  Trash2,
  X
} from 'lucide-react';
import { resizeImageToDataUrl } from '../utils/imageUtils';

export const ProfileTab: React.FC = () => {
  const {
    currentUser,
    logout,
    setActiveTab,
    spinsRemaining,
    femalePass,
    isFemalePassActive,
    femalePassRemainingDays,
    updateUniqueUserId,
    updateProfileName,
    updateProfileAvatar,
    removeProfileAvatar
  } = useApp();
  const [copied, setCopied] = useState(false);
  const [isEditingId, setIsEditingId] = useState(false);
  const [editIdValue, setEditIdValue] = useState(currentUser?.uniqueUserId || '');
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState(currentUser?.name || '');
  const [isSavingName, setIsSavingName] = useState(false);
  const [nameSuccessToast, setNameSuccessToast] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingDp, setIsUploadingDp] = useState(false);
  const [dpSuccessToast, setDpSuccessToast] = useState(false);
  const [dpErrorToast, setDpErrorToast] = useState<string | null>(null);

  if (!currentUser) return null;

  const handleCopyUserId = () => {
    navigator.clipboard.writeText(currentUser.uniqueUserId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveCustomId = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editIdValue.trim()) return;
    updateUniqueUserId(editIdValue);
    setIsEditingId(false);
  };

  const handleStartEditName = () => {
    setEditNameValue(currentUser.name);
    setIsEditingName(true);
  };

  const handleCancelEditName = () => {
    setEditNameValue(currentUser.name);
    setIsEditingName(false);
  };

  const handleSaveName = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = editNameValue.trim();
    if (!trimmed || trimmed === currentUser.name) {
      setIsEditingName(false);
      return;
    }
    setIsSavingName(true);
    try {
      await updateProfileName(trimmed);
      setIsEditingName(false);
      setNameSuccessToast(true);
      setTimeout(() => setNameSuccessToast(false), 2500);
    } finally {
      setIsSavingName(false);
    }
  };

  const handleOpenImagePicker = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleDpFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setDpErrorToast('Please select a valid image file');
      setTimeout(() => setDpErrorToast(null), 3000);
      return;
    }

    try {
      setIsUploadingDp(true);
      setDpErrorToast(null);

      // Resize and compress client-side to keep data URL crisp, fast and lightweight
      const dataUrl = await resizeImageToDataUrl(file, 400, 400, 0.88);
      updateProfileAvatar(dataUrl);

      setDpSuccessToast(true);
      setTimeout(() => setDpSuccessToast(false), 2500);
    } catch (err) {
      console.error('Failed to process image file:', err);
      setDpErrorToast('Failed to load image. Please select another file.');
      setTimeout(() => setDpErrorToast(null), 3000);
    } finally {
      setIsUploadingDp(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto px-4 py-4 flex flex-col gap-4">
      {/* 1. Main Profile Card */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Hidden Device File Picker Input */}
        <input
          ref={fileInputRef}
          type="file"
          id="input-device-dp-upload"
          accept="image/*"
          onChange={handleDpFileChange}
          className="hidden"
        />

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
          {/* Avatar with click-to-upload & dedicated Edit DP trigger */}
          <div className="flex flex-col items-center gap-2 shrink-0">
            <div className="relative group">
              <button
                type="button"
                id="btn-profile-avatar-click"
                onClick={handleOpenImagePicker}
                disabled={isUploadingDp}
                className="relative rounded-2xl overflow-hidden focus:outline-none focus:ring-2 focus:ring-rose-500 block transition transform active:scale-95 group cursor-pointer"
                title={currentUser.avatar ? "Click to change Profile Picture" : "Click to upload Profile Picture"}
                aria-label="Upload Profile Picture"
              >
                {currentUser.avatar ? (
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover ring-4 ring-neutral-800 shadow-md transition duration-200 group-hover:brightness-75"
                  />
                ) : (
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-neutral-800/90 border-2 border-dashed border-neutral-700 hover:border-rose-500/60 ring-4 ring-neutral-800/70 flex flex-col items-center justify-center text-neutral-400 group-hover:text-rose-300 shadow-md transition duration-200">
                    <User className="w-8 h-8 sm:w-10 sm:h-10 text-neutral-500 group-hover:text-rose-400 transition" />
                    <span className="text-[10px] font-semibold text-neutral-400 group-hover:text-rose-300 mt-0.5">No DP</span>
                  </div>
                )}

                {/* Hover Camera Overlay */}
                <div className="absolute inset-0 bg-black/60 backdrop-blur-[1.5px] opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity duration-200 pointer-events-none">
                  <Camera className="w-5 h-5 text-rose-400 mb-0.5" />
                  <span className="text-[10px] font-bold tracking-tight">
                    {currentUser.avatar ? 'Change DP' : 'Upload DP'}
                  </span>
                </div>

                {/* Loading state indicator */}
                {isUploadingDp && (
                  <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-20">
                    <Loader2 className="w-6 h-6 text-rose-500 animate-spin mb-1" />
                    <span className="text-[9px] font-bold text-neutral-300">Updating...</span>
                  </div>
                )}
              </button>

              <span className="absolute -bottom-1 -right-1 p-1 bg-emerald-500 text-neutral-950 rounded-full ring-2 ring-neutral-900 pointer-events-none z-10 shadow-sm">
                <ShieldCheck className="w-4 h-4 text-white" />
              </span>
            </div>

            {/* Explicit DP Action Buttons */}
            <div className="flex items-center gap-1.5 flex-wrap justify-center">
              <button
                type="button"
                id="btn-edit-dp"
                onClick={handleOpenImagePicker}
                disabled={isUploadingDp}
                className="px-2.5 py-1 rounded-xl bg-neutral-800 hover:bg-neutral-700 active:bg-neutral-600 text-neutral-200 hover:text-white text-[11px] font-semibold border border-neutral-700/80 flex items-center gap-1.5 transition cursor-pointer shadow-sm hover:border-rose-500/50 active:scale-95"
                title="Select an image from device gallery or files"
              >
                {isUploadingDp ? (
                  <>
                    <Loader2 className="w-3 h-3 text-rose-400 animate-spin" />
                    <span>Updating...</span>
                  </>
                ) : (
                  <>
                    <Camera className="w-3.5 h-3.5 text-rose-400" />
                    <span>{currentUser.avatar ? 'Edit DP' : 'Upload DP'}</span>
                  </>
                )}
              </button>

              {Boolean(currentUser.avatar) && (
                <button
                  type="button"
                  id="btn-remove-dp"
                  onClick={() => {
                    removeProfileAvatar();
                    setDpSuccessToast(true);
                    setTimeout(() => setDpSuccessToast(false), 2500);
                  }}
                  disabled={isUploadingDp}
                  className="px-2 py-1 rounded-xl bg-neutral-800/80 hover:bg-rose-950/40 text-neutral-400 hover:text-rose-300 text-[11px] font-semibold border border-neutral-700/60 hover:border-rose-500/40 flex items-center gap-1 transition cursor-pointer shadow-sm active:scale-95"
                  title="Remove profile picture (make DP blank)"
                >
                  <Trash2 className="w-3 h-3 text-rose-400" />
                  <span>Remove</span>
                </button>
              )}
            </div>
          </div>

          {/* User details */}
          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="w-full sm:w-auto">
                {isEditingName ? (
                  <form onSubmit={handleSaveName} className="flex items-center gap-1.5 justify-center sm:justify-start">
                    <input
                      type="text"
                      id="input-edit-profile-name"
                      value={editNameValue}
                      onChange={(e) => setEditNameValue(e.target.value)}
                      maxLength={32}
                      autoFocus
                      disabled={isSavingName}
                      className="px-2.5 py-1 text-base font-bold bg-neutral-800 border border-rose-500/80 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-rose-500/50 min-w-[160px] max-w-[220px]"
                      placeholder="Display Name"
                    />
                    <button
                      type="submit"
                      id="btn-save-profile-name"
                      disabled={isSavingName || !editNameValue.trim()}
                      className="p-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white transition cursor-pointer disabled:opacity-50"
                      title="Save Name"
                    >
                      {isSavingName ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      type="button"
                      id="btn-cancel-edit-profile-name"
                      onClick={handleCancelEditName}
                      disabled={isSavingName}
                      className="p-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition cursor-pointer"
                      title="Cancel"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </form>
                ) : (
                  <div className="flex items-center justify-center sm:justify-start gap-1.5 flex-wrap">
                    <h3 className="text-xl font-extrabold text-white flex items-center gap-1.5">
                      <span id="display-profile-name">{currentUser.name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                        Verified
                      </span>
                    </h3>
                    <button
                      type="button"
                      id="btn-edit-profile-name"
                      onClick={handleStartEditName}
                      className="p-1 rounded-lg text-neutral-400 hover:text-rose-400 hover:bg-neutral-800/80 active:scale-95 transition cursor-pointer"
                      title="Edit Display Name"
                      aria-label="Edit Profile Name"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
                <p className="text-xs text-neutral-400 mt-0.5 flex items-center justify-center sm:justify-start gap-1">
                  <Mail className="w-3 h-3" />
                  <span>{currentUser.email}</span>
                </p>
              </div>

              {/* Log out button */}
              <button
                type="button"
                id="btn-logout"
                onClick={logout}
                className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-rose-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer self-center sm:self-start"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>

            {/* Live Name Update Success Toast */}
            {nameSuccessToast && (
              <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-medium animate-in fade-in">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Profile name updated successfully!</span>
              </div>
            )}

            {/* Live DP Upload Success / Error Toast */}
            {dpSuccessToast && (
              <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-medium animate-in fade-in">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Profile picture updated successfully!</span>
              </div>
            )}
            {dpErrorToast && (
              <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-medium animate-in fade-in">
                <span>{dpErrorToast}</span>
              </div>
            )}

            {/* UNIQUE USER ID DISPLAY, EDIT & COPY */}
            <div className="mt-3.5 flex flex-col gap-2">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neutral-800/90 border border-neutral-700/80 w-fit">
                <span className="text-[11px] text-neutral-400">Your User ID:</span>
                <span className="font-mono font-bold text-xs sm:text-sm text-amber-300">
                  {currentUser.uniqueUserId}
                </span>
                <button
                  type="button"
                  id="btn-copy-user-id"
                  onClick={handleCopyUserId}
                  className="p-1 rounded-md hover:bg-neutral-700 text-neutral-300 hover:text-white transition cursor-pointer"
                  title="Copy User ID to Share with Friends"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
                <button
                  type="button"
                  id="btn-edit-user-id-toggle"
                  onClick={() => {
                    setIsEditingId(!isEditingId);
                    setEditIdValue(currentUser.uniqueUserId);
                  }}
                  className="p-1 rounded-md hover:bg-neutral-700 text-neutral-300 hover:text-white transition cursor-pointer"
                  title="Edit or change your User ID"
                >
                  <Edit2 className="w-3.5 h-3.5 text-rose-400" />
                </button>
                {copied && (
                  <span className="text-[10px] text-emerald-400 font-semibold">Copied!</span>
                )}
              </div>

              {/* Inline ID edit form */}
              {isEditingId && (
                <form onSubmit={handleSaveCustomId} className="flex items-center gap-2 mt-1">
                  <input
                    type="text"
                    value={editIdValue}
                    onChange={(e) => setEditIdValue(e.target.value)}
                    placeholder="e.g. #USER6969"
                    className="px-2.5 py-1 bg-neutral-800 border border-neutral-700 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-rose-500"
                  />
                  <button
                    type="submit"
                    className="px-2.5 py-1 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-lg cursor-pointer transition"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingId(false)}
                    className="px-2 py-1 bg-neutral-700 hover:bg-neutral-600 text-neutral-300 text-xs rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. STATS & COIN SUMMARY GRID */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {/* Total Available Coins */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-400 mb-1">
            <span className="text-xs font-medium">Coin Balance</span>
            <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Coins className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-mono font-black text-amber-300">
            {currentUser.coins.toLocaleString()}
          </div>
          <span className="text-[10px] text-neutral-500 mt-0.5">Available for video calls</span>
        </div>

        {/* Total Coins Won */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-400 mb-1">
            <span className="text-xs font-medium">Lifetime Won</span>
            <div className="w-6 h-6 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center">
              <Trophy className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-mono font-black text-white">
            {currentUser.totalCoinsWon.toLocaleString()}
          </div>
          <span className="text-[10px] text-neutral-500 mt-0.5">Earned from spins</span>
        </div>

        {/* Video Calls Completed */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-3.5 flex flex-col justify-between col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-neutral-400 mb-1">
            <span className="text-xs font-medium">Calls Connected</span>
            <div className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <Video className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-mono font-black text-white">
            {currentUser.totalCallsMade}
          </div>
          <span className="text-[10px] text-neutral-500 mt-0.5">Live sessions</span>
        </div>
      </div>

      {/* 3. Daily Spin Status Bar */}
      <div className="bg-gradient-to-r from-amber-500/15 via-neutral-900 to-rose-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center">
            <Disc className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Daily Spin Wheel</h4>
            <p className="text-xs text-neutral-400">
              {spinsRemaining} of 5 spins remaining today
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setActiveTab('spin')}
          className="px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs flex items-center gap-1 transition shadow cursor-pointer active:scale-95"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Spin Now</span>
        </button>
      </div>

      {/* 4. Female Video Call Pass Status Card */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            isFemalePassActive
              ? 'bg-gradient-to-tr from-amber-500/20 to-rose-500/20 text-amber-300 border border-amber-500/30'
              : 'bg-neutral-800 text-neutral-500 border border-neutral-700'
          }`}>
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-white">Female Call Pass</h4>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                isFemalePassActive
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              }`}>
                {isFemalePassActive ? 'Active' : 'Expired / Locked'}
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              {isFemalePassActive && femalePass
                ? `${femalePass.callsRemaining}/15 calls left • Valid for ${femalePassRemainingDays} ${femalePassRemainingDays === 1 ? 'day' : 'days'}`
                : 'Locked until unlocked with 10,000 Coins (15 calls OR 3 days)'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setActiveTab('video')}
          className="px-3.5 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white font-semibold text-xs flex items-center gap-1 transition cursor-pointer"
        >
          <span>View</span>
        </button>
      </div>

      {/* 4. Unique ID Instructions Card */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
        <h4 className="text-xs font-bold text-neutral-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Share2 className="w-3.5 h-3.5 text-rose-500" />
          <span>Direct Friend Connecting</span>
        </h4>
        <p className="text-xs text-neutral-400 leading-relaxed">
          Give your unique User ID (<span className="font-mono text-amber-300">{currentUser.uniqueUserId}</span>) to any friend so they can immediately message you in the Chat tab without waiting for a random match.
        </p>
      </div>
    </div>
  );
};

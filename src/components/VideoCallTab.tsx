import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { agoraService } from '../services/agoraService';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  RefreshCw,
  PhoneOff,
  ChevronRight,
  Radio,
  Coins,
  ShieldAlert,
  Flag,
  Sparkles,
  MessageSquare,
  Lock,
  UserCheck,
  User
} from 'lucide-react';

export const VideoCallTab: React.FC = () => {
  const {
    genderFilter,
    setGenderFilter,
    currentVideoPartner,
    isCallConnecting,
    isCallActive,
    currentCallRoom,
    agoraChannel,
    startVideoMatch,
    skipToNextPartner,
    endVideoCall,
    currentUser,
    setInsufficientCoinsModal,
    startConversationWithUser,
    femalePass,
    isFemalePassActive,
    femalePassRemainingDays,
    unlockFemalePass
  } = useApp();

  // Local camera media stream
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [showReportToast, setShowReportToast] = useState(false);
  const [agoraStatus, setAgoraStatus] = useState<{ isLive: boolean; notice: string | null }>({
    isLive: false,
    notice: null
  });

  // Initialize camera preview
  useEffect(() => {
    let active = true;

    async function initCamera() {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          let stream: MediaStream | null = null;
          try {
            // First attempt: video + audio
            stream = await navigator.mediaDevices.getUserMedia({
              video: { width: { ideal: 640 }, height: { ideal: 480 } },
              audio: true
            });
          } catch (e1: any) {
            // Fallback 1: video only (if microphone device not found)
            try {
              stream = await navigator.mediaDevices.getUserMedia({
                video: { width: { ideal: 640 }, height: { ideal: 480 } },
                audio: false
              });
            } catch (e2: any) {
              // Fallback 2: audio only (if camera device not found)
              try {
                stream = await navigator.mediaDevices.getUserMedia({
                  video: false,
                  audio: true
                });
              } catch (e3: any) {
                throw e1;
              }
            }
          }

          if (active && stream) {
            setLocalStream(stream);
            if (localVideoRef.current) {
              localVideoRef.current.srcObject = stream;
            }
          }
        }
      } catch (err: any) {
        if (active) {
          console.warn('Camera/mic access unavailable:', err);
          setCameraError('Camera or microphone not detected on this device. Operating in preview mode.');
        }
      }
    }

    initCamera();

    return () => {
      active = false;
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Sync stream to video element whenever camera is toggled
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = cameraEnabled ? localStream : null;
    }
  }, [cameraEnabled, localStream]);

  // Agora RTC Web SDK dynamic stream lifecycle
  useEffect(() => {
    if (isCallActive && agoraChannel) {
      const cleanUid =
        currentUser?.uniqueUserId?.replace(/[^a-zA-Z0-9_-]/g, '') ||
        `user_${Date.now() % 10000}`;

      agoraService
        .join({
          channel: agoraChannel,
          uid: cleanUid,
          containerId: 'remote-video',
          localStream,
          onUserJoined: (user) => {
            console.log('[Agora RTC] Remote stream joined:', user.uid);
            setAgoraStatus({ isLive: true, notice: null });
          },
          onUserLeft: (user) => {
            console.log('[Agora RTC] Remote stream left:', user.uid);
          },
          onFallback: (notice) => {
            setAgoraStatus({ isLive: false, notice });
          }
        })
        .then(() => {
          const isFallback = agoraService.getIsFallbackMode();
          setAgoraStatus({
            isLive: !isFallback,
            notice: agoraService.getFallbackNotice()
          });
        })
        .catch((err) => {
          console.warn('[Agora RTC] Web SDK join note:', err);
          setAgoraStatus({ isLive: false, notice: 'PREVIEW_FALLBACK' });
        });
    } else {
      agoraService.leave();
      setAgoraStatus({ isLive: false, notice: null });
    }

    return () => {
      agoraService.leave();
    };
  }, [isCallActive, agoraChannel, currentUser, localStream]);

  // Keep Agora microphone and camera tracks in sync with UI toggles
  useEffect(() => {
    agoraService.setAudioEnabled(micEnabled);
  }, [micEnabled]);

  useEffect(() => {
    agoraService.setVideoEnabled(cameraEnabled);
  }, [cameraEnabled]);

  const toggleCamera = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setCameraEnabled(videoTrack.enabled);
      }
    } else {
      setCameraEnabled(!cameraEnabled);
    }
  };

  const toggleMic = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setMicEnabled(audioTrack.enabled);
      }
    } else {
      setMicEnabled(!micEnabled);
    }
  };

  const handleGenderSelect = (filter: 'male' | 'female' | 'both') => {
    if (filter === 'female' && !isFemalePassActive) {
      // User MUST NOT be able to make a Female Video Call unless they have an Active Female Pass or 10,000 coins
      // DO NOT connect the call. Open modal immediately
      setInsufficientCoinsModal(true);
      return;
    }
    setGenderFilter(filter);
  };

  const handleStartCall = () => {
    if (genderFilter === 'female' && !isFemalePassActive) {
      setInsufficientCoinsModal(true);
      return;
    }
    startVideoMatch();
  };

  const handleFemaleVideoCallClick = () => {
    if (!isFemalePassActive) {
      // DO NOT connect the call. Open modal immediately
      setInsufficientCoinsModal(true);
      return;
    }
    setGenderFilter('female');
    startVideoMatch();
  };

  const handleReport = () => {
    setShowReportToast(true);
    setTimeout(() => {
      setShowReportToast(false);
      skipToNextPartner();
    }, 1500);
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-3 sm:px-4 py-3 flex-1 flex flex-col gap-3">
      {/* 1. GENDER FILTER & TOP CONTROLS */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-neutral-900 border border-neutral-800 rounded-2xl px-3 py-2.5 shadow-md">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-neutral-400">Match with:</span>

          {/* BOTH (FREE) */}
          <button
            type="button"
            id="filter-both"
            onClick={() => handleGenderSelect('both')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              genderFilter === 'both'
                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
            }`}
          >
            <span>Both</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/30 text-emerald-300 uppercase font-black">
              Free
            </span>
          </button>

          {/* MALE (FREE) */}
          <button
            type="button"
            id="filter-male"
            onClick={() => handleGenderSelect('male')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              genderFilter === 'male'
                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
            }`}
          >
            <span>Male 👦</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/30 text-emerald-300 uppercase font-black">
              Free
            </span>
          </button>

          {/* FEMALE (DUAL-EXPIRY PASS GATED) */}
          <button
            type="button"
            id="filter-female"
            onClick={() => handleGenderSelect('female')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
              genderFilter === 'female'
                ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-white border-amber-400 shadow-md shadow-amber-500/20'
                : isFemalePassActive
                ? 'bg-neutral-800 text-amber-300 border-amber-500/40 hover:bg-neutral-700'
                : 'bg-neutral-800 text-neutral-400 border-neutral-700 hover:bg-neutral-700'
            }`}
          >
            <span>Female 👧</span>
            {isFemalePassActive ? (
              <div className="flex items-center gap-0.5 px-1.5 py-0.2 rounded-full bg-amber-500/30 text-amber-200 text-[10px] font-black">
                <Sparkles className="w-2.5 h-2.5" />
                <span>{femalePass?.callsRemaining ?? 0}/15</span>
              </div>
            ) : (
              <div className="flex items-center gap-0.5 px-1.5 py-0.2 rounded-full bg-neutral-700 text-neutral-300 text-[10px] font-black">
                <Lock className="w-2.5 h-2.5 text-amber-400" />
                <span>10K</span>
              </div>
            )}
          </button>
        </div>

        {/* Status / Active Counter */}
     
      </div>

      {/* 2. LIVE TRACKING STATUS BADGE FOR FEMALE VIDEO CALL PASS */}
      {isFemalePassActive && femalePass ? (
        <div
          id="female-pass-active-badge"
          className="w-full bg-gradient-to-r from-amber-500/15 via-rose-500/10 to-neutral-900 border border-amber-500/40 rounded-2xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-400 to-rose-500 text-neutral-950 flex items-center justify-center font-black shadow-xs shrink-0">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-extrabold text-white flex items-center gap-2 flex-wrap">
                {/* STRICT REQUIRED BADGE TEXT: Female Pass Active: X/15 Calls Remaining | Valid for Y Days */}
                <span className="text-amber-300 font-black">
                  Female Pass Active: {femalePass.callsRemaining}/15 Calls Remaining | Valid for {femalePassRemainingDays} {femalePassRemainingDays === 1 ? 'Day' : 'Days'}
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                Active Pass Limits: 15 Calls OR 3 Days duration • Decreases by 1 after each connected call
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-300 bg-emerald-950/70 border border-emerald-500/30 px-2.5 py-1 rounded-full">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              Active Pass
            </span>
          </div>
        </div>
      ) : (
        <div
          id="female-pass-expired-badge"
          className="w-full bg-neutral-900/90 border border-neutral-800 rounded-2xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-neutral-800 text-neutral-400 border border-neutral-700 flex items-center justify-center shrink-0">
              <Lock className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-bold text-neutral-200 flex items-center gap-2 flex-wrap">
                <span>Female Video Calls:</span>
                <span className="text-rose-400 font-extrabold uppercase text-xs px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20">
                  {femalePass && (femalePass.callsRemaining <= 0 || Date.now() >= femalePass.expiresAt)
                    ? 'Pass Expired (Locked)'
                    : 'Pass Required (Locked)'}
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                Female calls locked until unlocked with 10,000 Coins (Valid for 15 Calls OR 3 Days).
              </p>
            </div>
          </div>
          <button
            type="button"
            id="btn-unlock-female-pass"
            onClick={() => {
              if ((currentUser?.coins ?? 0) >= 10000) {
                unlockFemalePass();
              } else {
                setInsufficientCoinsModal(true);
              }
            }}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-neutral-950 font-black text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition active:scale-95"
          >
            <Coins className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Unlock Pass (10,000 Coins)</span>
          </button>
        </div>
      )}

      {/* REPORT TOAST NOTIFICATION */}
      {showReportToast && (
        <div className="bg-rose-500 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg animate-bounce">
          <ShieldAlert className="w-4 h-4" />
          <span>User reported! Skipping to next safe match...</span>
        </div>
      )}

      {/* 2. MAIN VIDEO DISPLAY CONTAINER (Stranger on top/left, User Camera on bottom/right) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1">
        {/* STRANGER VIDEO STREAM CONTAINER */}
        <div className="relative bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden flex flex-col items-center justify-center shadow-lg min-h-[280px] sm:min-h-[360px]">
          {/* Top Stranger Tag */}
          <div className="absolute top-3 left-3 z-20 flex items-center gap-2">
            <div className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white text-[11px] font-semibold flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  isCallActive ? 'bg-emerald-400 animate-ping' : 'bg-rose-400'
                }`}
              />
              <span>{isCallActive ? 'Connected Stranger' : 'Stranger Feed'}</span>
            </div>
            {genderFilter === 'female' && (
              <div className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30 flex items-center gap-1">
                {isFemalePassActive ? (
                  <>
                    <Sparkles className="w-2.5 h-2.5" />
                    <span>Pass: {femalePass?.callsRemaining ?? 0}/15 Left</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-2.5 h-2.5 text-amber-400" />
                    <span>Pass Expired</span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Report Button (when call active) */}
          {isCallActive && currentVideoPartner && (
            <button
              type="button"
              id="btn-report-stranger"
              onClick={handleReport}
              className="absolute top-3 right-3 z-20 px-2.5 py-1 rounded-full bg-black/60 hover:bg-rose-600/80 backdrop-blur-md border border-white/10 text-neutral-300 hover:text-white text-[11px] font-medium flex items-center gap-1 transition cursor-pointer"
            >
              <Flag className="w-3 h-3 text-rose-400" />
              <span>Report</span>
            </button>
          )}

          {/* Loader Animation: "Searching for online users..." */}
          {isCallConnecting ? (
            <div className="flex flex-col items-center justify-center p-6 text-center animate-fadeIn">
              <div className="relative w-24 h-24 mb-4">
                <div className="absolute inset-0 rounded-full border-4 border-rose-500/20 animate-ping" />
                <div className="absolute inset-2 rounded-full border-4 border-t-rose-500 border-r-pink-500 border-b-transparent border-l-transparent animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Radio className="w-8 h-8 text-rose-400 animate-pulse" />
                </div>
              </div>
              <h4 className="text-base sm:text-lg font-extrabold text-white mb-1.5 flex items-center gap-2">
                <span>Searching for online users...</span>
              </h4>
              <p className="text-xs text-neutral-400 max-w-xs">
                {genderFilter === 'female'
                  ? `Looking for an online female peer (${femalePass?.callsRemaining ?? 0}/15 pass calls remaining)`
                  : genderFilter === 'male'
                  ? 'Looking for an online male peer'
                  : 'Looking for an online peer in real-time queue...'}
              </p>
              <div className="mt-3 flex items-center gap-1.5 text-[11px] font-mono text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span>100% Real P2P matching • Waiting for real user to join</span>
              </div>
            </div>
          ) : isCallActive && currentVideoPartner ? (
            /* Dynamic Agora Remote Video Container */
            <div
              id="remote-video"
              className="relative w-full h-full bg-neutral-950 overflow-hidden flex items-center justify-center"
            >
              {/* Live Peer Feed Container - Agora RTC mounts peer camera video here */}
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-950/90 text-neutral-400 p-6 pointer-events-none">
                {currentVideoPartner.avatar ? (
                  <img
                    src={currentVideoPartner.avatar}
                    alt={currentVideoPartner.name}
                    className="w-20 h-20 rounded-full object-cover border-2 border-rose-500/40 shadow-xl mb-3"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-neutral-800/80 border border-neutral-700/60 flex items-center justify-center text-2xl font-bold text-white shadow-inner mb-3">
                    {currentVideoPartner.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-sm font-semibold text-white">Live Peer Connected</span>
                </div>
                <span className="text-xs text-neutral-400 mt-1 font-mono">{currentVideoPartner.userId}</span>
              </div>

              {/* Agora RTC Channel HUD Badge */}
              <div className="absolute top-12 left-3 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-black/75 backdrop-blur-md border border-neutral-700/80 text-[10px] font-mono shadow-md">
                {agoraStatus.isLive ? (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    <span className="text-emerald-400 font-bold">Agora RTC: Live</span>
                    <span className="text-neutral-500">|</span>
                    <span className="text-neutral-300 truncate max-w-[120px]">{agoraChannel}</span>
                  </>
                ) : (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                    <span className="text-amber-300 font-semibold">WebRTC Preview</span>
                    {agoraStatus.notice === 'TOKEN_REQUIRED' && (
                      <span className="text-neutral-400 text-[9px]">(Dynamic Key)</span>
                    )}
                  </>
                )}
              </div>

              {/* Stranger Info Overlay */}
              <div className="absolute bottom-3 left-3 right-3 z-10 flex items-end justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-base text-white">
                      {currentVideoPartner.name}, {currentVideoPartner.age}
                    </span>
                    <span className="text-base">{currentVideoPartner.countryFlag}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/20 text-white font-medium">
                      {currentVideoPartner.city}
                    </span>
                  </div>
                  <div className="text-xs text-neutral-300 mt-1 flex items-center gap-1.5">
                    <span className="text-emerald-400 font-mono text-[11px]">● 28ms HD (Agora RTC)</span>
                    <span>•</span>
                    <span className="text-[11px] font-mono text-neutral-300 font-bold">
                      ID: {currentVideoPartner.userId}
                    </span>
                  </div>
                  {/* Quick message shortcut */}
                  <button
                    type="button"
                    onClick={() => startConversationWithUser(currentVideoPartner)}
                    className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/90 hover:bg-rose-500 text-white text-xs font-bold transition shadow-md cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Chat in Messages</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Idle Ready to Start state */
            <div className="flex flex-col items-center justify-center p-6 text-center">
              <div className="w-16 h-16 rounded-3xl bg-neutral-800 border border-neutral-700 flex items-center justify-center mb-3">
                <Video className="w-8 h-8 text-neutral-400" />
              </div>
              <h4 className="text-base font-bold text-white mb-1">Random Video Matching</h4>
              <p className="text-xs text-neutral-400 max-w-xs mb-4">
                Click below to instantly connect with live random strangers worldwide.
              </p>

              {/* Matching Actions */}
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full justify-center max-w-md">
                <button
                  type="button"
                  id="btn-start-random-video-match"
                  onClick={handleStartCall}
                  className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 hover:from-rose-400 hover:to-pink-500 text-white font-extrabold text-xs sm:text-sm shadow-xl shadow-rose-500/30 flex items-center justify-center gap-2 cursor-pointer transition transform active:scale-95"
                >
                  <Video className="w-4 h-4" />
                  <span>Start Match ({genderFilter === 'both' ? 'Both' : genderFilter === 'male' ? 'Male' : 'Female'})</span>
                </button>

                {/* Direct Female Video Call Button */}
                <button
                  type="button"
                  id="btn-female-video-call"
                  onClick={handleFemaleVideoCallClick}
                  className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 cursor-pointer transition transform active:scale-95"
                >
                  <Sparkles className="w-4 h-4 text-yellow-200" />
                  <span>Female Video Call</span>
                  {isFemalePassActive ? (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-black/40 text-amber-200 font-mono font-bold">
                      {femalePass?.callsRemaining ?? 0}/15
                    </span>
                  ) : (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-black/40 text-amber-200 font-mono font-bold flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5" /> 10K Coins
                    </span>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* LOCAL USER CAMERA PREVIEW */}
        <div className="relative bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden flex flex-col items-center justify-center shadow-lg min-h-[280px] sm:min-h-[360px]">
          {/* Header Tag */}
          <div className="absolute top-3 left-3 z-20 flex items-center gap-2">
            <div className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white text-[11px] font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              <span>You (Local Feed)</span>
            </div>
            <div className="px-2 py-0.5 rounded-full bg-white/10 text-neutral-300 text-[10px] font-mono font-bold">
              {currentUser?.uniqueUserId}
            </div>
            {isCallConnecting && (
              <div className="px-2 py-0.5 rounded-full bg-rose-500/80 backdrop-blur-sm text-white text-[10px] font-bold flex items-center gap-1 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                <span>Camera Preview Active</span>
              </div>
            )}
          </div>

          {/* User Video feed */}
          {cameraEnabled && !cameraError ? (
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover transform scale-x-[-1]"
            />
          ) : (
            <div className="flex flex-col items-center justify-center p-6 text-center">
              {currentUser?.avatar ? (
                <img
                  src={currentUser.avatar}
                  alt={currentUser?.name}
                  className="w-20 h-20 rounded-full object-cover ring-4 ring-neutral-800 mb-2"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-neutral-800 border-2 border-neutral-700 flex items-center justify-center text-neutral-400 mb-2">
                  <User className="w-9 h-9" />
                </div>
              )}
              <span className="text-xs font-bold text-white">{currentUser?.name}</span>
              <span className="text-[11px] font-mono text-neutral-400 mt-0.5">
                {currentUser?.uniqueUserId}
              </span>
              <span className="text-[10px] text-neutral-500 mt-2">
                {cameraError ? cameraError : 'Camera preview is turned off'}
              </span>
            </div>
          )}

          {/* Camera & Mic Quick Controls Overlay */}
          <div className="absolute bottom-3 right-3 z-20 flex items-center gap-2">
            <button
              type="button"
              id="btn-toggle-mic"
              onClick={toggleMic}
              className={`p-2.5 rounded-full backdrop-blur-md transition cursor-pointer ${
                micEnabled
                  ? 'bg-black/60 hover:bg-black/80 text-white border border-white/10'
                  : 'bg-rose-600 text-white shadow-md'
              }`}
              title={micEnabled ? 'Mute Mic' : 'Unmute Mic'}
            >
              {micEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
            </button>

            <button
              type="button"
              id="btn-toggle-cam"
              onClick={toggleCamera}
              className={`p-2.5 rounded-full backdrop-blur-md transition cursor-pointer ${
                cameraEnabled
                  ? 'bg-black/60 hover:bg-black/80 text-white border border-white/10'
                  : 'bg-rose-600 text-white shadow-md'
              }`}
              title={cameraEnabled ? 'Turn Off Camera' : 'Turn On Camera'}
            >
              {cameraEnabled ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* 3. BOTTOM CALL CONTROLS BAR */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl px-4 py-3 shadow-md flex items-center justify-between gap-3">
        <div className="text-xs text-neutral-400 flex items-center gap-2">
          {isCallConnecting ? (
            <span className="text-amber-400 font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              Searching for online users...
            </span>
          ) : isCallActive ? (
            <span className="text-emerald-400 font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              Connected with {currentVideoPartner?.name} ({currentVideoPartner?.country})
            </span>
          ) : (
            <span>Ready to meet new people • Select filter & start matching</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isCallActive ? (
            <>
              {/* Skip to Next Button */}
              <button
                type="button"
                id="btn-next-partner"
                onClick={skipToNextPartner}
                className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer transition shadow-md shadow-rose-500/20 active:scale-95"
              >
                <span>Next Stranger</span>
                <ChevronRight className="w-4 h-4" />
              </button>

              {/* End Call */}
              <button
                type="button"
                id="btn-end-call"
                onClick={endVideoCall}
                className="p-2 sm:px-3 sm:py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-rose-400 font-semibold text-xs transition cursor-pointer"
                title="End Call"
              >
                <PhoneOff className="w-4 h-4" />
              </button>
            </>
          ) : (
            <button
              type="button"
              id="btn-start-call"
              onClick={handleStartCall}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-400 hover:to-pink-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2 cursor-pointer transition shadow-md shadow-rose-500/20 active:scale-95"
            >
              <Video className="w-4 h-4" />
              <span>Start Random Video Match</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useRef, useEffect } from 'react';
import { useRoulette } from '../context/RouletteContext';
import {
  Camera,
  CameraOff,
  Mic,
  MicOff,
  FlipHorizontal,
  RefreshCw,
  User,
  Shield
} from 'lucide-react';

export const UserVideoPreview: React.FC = () => {
  const {
    localStream,
    isCameraOn,
    isMicOn,
    isMirrored,
    cameraError,
    toggleCamera,
    toggleMic,
    toggleMirror,
    retryCamera,
    isRequestingCamera
  } = useRoulette();

  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Attach local stream to video element when available
  useEffect(() => {
    if (videoRef.current && localStream) {
      videoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  return (
    <div className="relative w-full h-full min-h-[220px] sm:min-h-[260px] bg-neutral-950 rounded-2xl sm:rounded-3xl overflow-hidden border border-neutral-800 flex items-center justify-center shadow-2xl">
      {/* 1. ACTUAL WEBCAM STREAM */}
      {localStream && isCameraOn ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{ transform: isMirrored ? 'scaleX(-1)' : 'none' }}
          className="w-full h-full object-cover object-center select-none"
        />
      ) : (
        /* 2. VIRTUAL CAM / CAMERA OFF PLACEHOLDER */
        <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-gradient-to-tr from-neutral-950 via-neutral-900 to-neutral-950 text-white relative">
          <div className="relative w-20 h-20 rounded-full bg-neutral-800 border-2 border-neutral-700 flex items-center justify-center mb-3 shadow-inner">
            <User className="w-10 h-10 text-neutral-400" />
            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-rose-600 flex items-center justify-center border-2 border-neutral-900">
              <CameraOff className="w-3.5 h-3.5 text-white" />
            </div>
          </div>

          <p className="text-sm font-semibold text-neutral-200 mb-1">
            {cameraError ? 'Camera Unavailable' : 'Your Camera is Off'}
          </p>

          <p className="text-xs text-neutral-400 text-center max-w-xs mb-3">
            {cameraError
              ? 'Permission denied or no webcam found. Strangers can still see your virtual profile.'
              : 'Click camera icon below to turn your video on.'}
          </p>

          {cameraError && (
            <button
              type="button"
              id="btn-retry-camera"
              onClick={retryCamera}
              disabled={isRequestingCamera}
              className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-rose-400 border border-neutral-700 flex items-center gap-1.5 cursor-pointer transition active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRequestingCamera ? 'animate-spin' : ''}`} />
              Retry Camera Access
            </button>
          )}
        </div>
      )}

      {/* Ambient overlay vignette */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/40 pointer-events-none" />

      {/* Top-Left Label Badge */}
      <div className="absolute top-3 sm:top-4 left-3 sm:left-4 z-20 flex items-center gap-2">
        <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white font-bold text-xs border border-white/10 flex items-center gap-1.5 shadow-md">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>You (Camera Preview)</span>
        </span>

        {isCameraOn && (
          <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-neutral-900/70 backdrop-blur-md text-[10px] text-neutral-300 border border-white/10">
            720p HD
          </span>
        )}
      </div>

      {/* Top-Right Quick Toggle: Mirror / Flip */}
      <div className="absolute top-3 sm:top-4 right-3 sm:right-4 z-20 flex items-center gap-1.5">
        <button
          type="button"
          id="btn-toggle-mirror"
          onClick={toggleMirror}
          className="p-2 rounded-xl bg-black/50 hover:bg-black/70 backdrop-blur-md text-white/80 hover:text-white border border-white/10 transition cursor-pointer"
          title={isMirrored ? 'Disable Mirroring' : 'Enable Mirroring'}
        >
          <FlipHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* Bottom Floating Control Strip for Camera / Mic */}
      <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-black/75 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-white/15 shadow-xl">
        {/* Toggle Camera */}
        <button
          type="button"
          id="btn-user-toggle-camera"
          onClick={toggleCamera}
          className={`p-2.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 text-xs font-semibold ${
            isCameraOn
              ? 'bg-neutral-800 hover:bg-neutral-700 text-white'
              : 'bg-rose-600 hover:bg-rose-700 text-white'
          }`}
          title={isCameraOn ? 'Turn Camera Off' : 'Turn Camera On'}
        >
          {isCameraOn ? <Camera className="w-4 h-4" /> : <CameraOff className="w-4 h-4" />}
          <span className="hidden sm:inline">{isCameraOn ? 'Cam On' : 'Cam Off'}</span>
        </button>

        {/* Toggle Mic */}
        <button
          type="button"
          id="btn-user-toggle-mic"
          onClick={toggleMic}
          className={`p-2.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 text-xs font-semibold ${
            isMicOn
              ? 'bg-neutral-800 hover:bg-neutral-700 text-white'
              : 'bg-rose-600 hover:bg-rose-700 text-white'
          }`}
          title={isMicOn ? 'Mute Microphone' : 'Unmute Microphone'}
        >
          {isMicOn ? <Mic className="w-4 h-4 text-emerald-400" /> : <MicOff className="w-4 h-4" />}
          <span className="hidden sm:inline">{isMicOn ? 'Mic On' : 'Muted'}</span>
        </button>
      </div>
    </div>
  );
};

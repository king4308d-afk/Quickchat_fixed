import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  ReactNode
} from 'react';
import { StrangerProfile, ConnectionStatus, ChatMessage, ReportDetails } from '../types';
import { MOCK_STRANGERS, AVAILABLE_INTEREST_TAGS } from '../data/strangers';
import { audioFx } from '../utils/audioFx';

interface RouletteContextType {
  // Matching State
  status: ConnectionStatus;
  currentStranger: StrangerProfile | null;
  selectedInterest: string;
  setSelectedInterest: (interest: string) => void;
  onlineCount: number;
  callDurationSec: number;

  // Primary Action Methods (Requested: Next, Stop/Report, Send Text Message)
  findNextStranger: () => void;
  stopRoulette: () => void;
  resumeRoulette: () => void;
  openReportModal: () => void;
  closeReportModal: () => void;
  submitReport: (reason: string) => void;
  isReportModalOpen: boolean;

  // User Local Media
  localStream: MediaStream | null;
  isCameraOn: boolean;
  isMicOn: boolean;
  isMirrored: boolean;
  cameraError: string | null;
  isRequestingCamera: boolean;
  toggleCamera: () => void;
  toggleMic: () => void;
  toggleMirror: () => void;
  retryCamera: () => void;

  // Text Chat State & Actions
  messages: ChatMessage[];
  isStrangerTyping: boolean;
  isTextChatOpen: boolean;
  setIsTextChatOpen: (open: boolean) => void;
  toggleTextChat: () => void;
  sendTextMessage: (text: string) => void;
  unreadCount: number;

  // Audio & Settings
  soundEnabled: boolean;
  toggleSound: () => void;
}

const RouletteContext = createContext<RouletteContextType | undefined>(undefined);

export const RouletteProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Matching states
  const [status, setStatus] = useState<ConnectionStatus>('idle');
  const [currentStranger, setCurrentStranger] = useState<StrangerProfile | null>(null);
  const [selectedInterest, setSelectedInterest] = useState<string>('All');
  const [onlineCount, setOnlineCount] = useState<number>(34820);
  const [callDurationSec, setCallDurationSec] = useState<number>(0);

  // Local Media states
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isCameraOn, setIsCameraOn] = useState<boolean>(true);
  const [isMicOn, setIsMicOn] = useState<boolean>(true);
  const [isMirrored, setIsMirrored] = useState<boolean>(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isRequestingCamera, setIsRequestingCamera] = useState<boolean>(false);

  // Chat states
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStrangerTyping, setIsStrangerTyping] = useState<boolean>(false);
  const [isTextChatOpen, setIsTextChatOpen] = useState<boolean>(true);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  // Report & Settings
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [blockedStrangerIds, setBlockedStrangerIds] = useState<string[]>([]);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // References for timers and cleanup
  const typingTimerRef = useRef<number | null>(null);
  const greetingTimerRef = useRef<number | null>(null);
  const nextMatchTimerRef = useRef<number | null>(null);
  const strangerIndexRef = useRef<number>(0);

  // 1. Initialize user camera feed on mount
  const initUserMedia = useCallback(async () => {
    setIsRequestingCamera(true);
    setCameraError(null);

    try {
      if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user'
          },
          audio: true
        });
        setLocalStream(stream);
        setIsCameraOn(true);
        setIsMicOn(true);
      } else {
        setCameraError('Webcam API is not available in this browser context.');
      }
    } catch (err: any) {
      console.warn('Camera access could not be acquired or was denied:', err);
      setCameraError('Camera / Mic permission denied or unavailable. Virtual preview activated.');
    } finally {
      setIsRequestingCamera(false);
    }
  }, []);

  useEffect(() => {
    initUserMedia();

    return () => {
      // Clean up media tracks on unmount
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [initUserMedia]);

  // Clean up media tracks if localStream changes
  useEffect(() => {
    return () => {
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [localStream]);

  // Sync track enabled states with UI toggles
  useEffect(() => {
    if (localStream) {
      const videoTracks = localStream.getVideoTracks();
      videoTracks.forEach((track) => {
        track.enabled = isCameraOn;
      });
      const audioTracks = localStream.getAudioTracks();
      audioTracks.forEach((track) => {
        track.enabled = isMicOn;
      });
    }
  }, [isCameraOn, isMicOn, localStream]);

  // Sync sound utility
  useEffect(() => {
    audioFx.enabled = soundEnabled;
  }, [soundEnabled]);

  // 2. Call Duration timer
  useEffect(() => {
    let interval: any = null;
    if (status === 'connected') {
      interval = setInterval(() => {
        setCallDurationSec((prev) => prev + 1);
      }, 1000);
    } else {
      setCallDurationSec(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [status]);

  // 3. Online count organic fluctuations
  useEffect(() => {
    const interval = setInterval(() => {
      const delta = Math.floor(Math.random() * 11) - 5;
      setOnlineCount((prev) => Math.max(28000, prev + delta));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Clear running timers helper
  const clearAllTimers = () => {
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    if (greetingTimerRef.current) clearTimeout(greetingTimerRef.current);
    if (nextMatchTimerRef.current) clearTimeout(nextMatchTimerRef.current);
  };

  // 4. Primary "NEXT" Action
  const findNextStranger = useCallback(() => {
    clearAllTimers();
    audioFx.playNextClick();

    setStatus('searching');
    setCurrentStranger(null);
    setIsStrangerTyping(false);
    setMessages([]);
    setUnreadCount(0);

    // Pick candidate from stranger pool
    const candidates = MOCK_STRANGERS.filter(
      (s) => !blockedStrangerIds.includes(s.id)
    );

    let matchingPool = candidates;
    if (selectedInterest !== 'All') {
      const filtered = candidates.filter((s) =>
        s.interests.some((i) => selectedInterest.toLowerCase().includes(i.toLowerCase()))
      );
      if (filtered.length > 0) {
        matchingPool = filtered;
      }
    }

    // Realistic match finding delay (800ms - 1500ms)
    nextMatchTimerRef.current = window.setTimeout(() => {
      strangerIndexRef.current = (strangerIndexRef.current + 1) % matchingPool.length;
      const matched = matchingPool[strangerIndexRef.current];

      setCurrentStranger(matched);
      setStatus('connected');
      audioFx.playConnectChime();

      // System greeting
      setMessages([
        {
          id: `sys-${Date.now()}`,
          sender: 'system',
          text: `Connected to ${matched.name} from ${matched.city}, ${matched.country} ${matched.countryFlag}. Say hi!`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);

      // Stranger sends personalized initial greeting after 1.4 seconds
      greetingTimerRef.current = window.setTimeout(() => {
        setIsStrangerTyping(true);

        typingTimerRef.current = window.setTimeout(() => {
          setIsStrangerTyping(false);
          const greetingMsg: ChatMessage = {
            id: `stranger-${Date.now()}`,
            sender: 'stranger',
            text: matched.initialGreeting,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
          setMessages((prev) => [...prev, greetingMsg]);
          audioFx.playMessagePop();

          if (!isTextChatOpen) {
            setUnreadCount((c) => c + 1);
          }
        }, 1200);
      }, 1000);
    }, 1100);
  }, [blockedStrangerIds, selectedInterest, isTextChatOpen]);

  // Start initial match on first mount
  useEffect(() => {
    const timer = setTimeout(() => {
      findNextStranger();
    }, 600);
    return () => clearTimeout(timer);
  }, [findNextStranger]);

  // 5. STOP / RESUME Action
  const stopRoulette = () => {
    clearAllTimers();
    audioFx.playDisconnectTone();
    setStatus('idle');
    setCurrentStranger(null);
    setIsStrangerTyping(false);
    setMessages((prev) => [
      ...prev,
      {
        id: `sys-${Date.now()}`,
        sender: 'system',
        text: 'You paused the video matching. Click "Start / Next" anytime to resume.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  const resumeRoulette = () => {
    findNextStranger();
  };

  // 6. REPORT Action
  const openReportModal = () => {
    setIsReportModalOpen(true);
  };

  const closeReportModal = () => {
    setIsReportModalOpen(false);
  };

  const submitReport = (reason: string) => {
    if (currentStranger) {
      setBlockedStrangerIds((prev) => [...prev, currentStranger.id]);
    }
    setIsReportModalOpen(false);
    // Instantly skip to next person
    findNextStranger();
  };

  // 7. SEND TEXT MESSAGE Action
  const sendTextMessage = (text: string) => {
    if (!text.trim() || status !== 'connected' || !currentStranger) return;

    const trimmed = text.trim();
    const userMsg: ChatMessage = {
      id: `me-${Date.now()}`,
      sender: 'me',
      text: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    audioFx.playMessagePop();

    // Generate smart stranger response
    const lower = trimmed.toLowerCase();
    let replyCandidates = currentStranger.dynamicReplies.default;

    if (lower.includes('hi') || lower.includes('hey') || lower.includes('hello') || lower.includes('namaste')) {
      replyCandidates = currentStranger.dynamicReplies.hello || replyCandidates;
    } else if (lower.includes('where') || lower.includes('from') || lower.includes('city') || lower.includes('country')) {
      replyCandidates = currentStranger.dynamicReplies.location || replyCandidates;
    } else if (lower.includes('music') || lower.includes('song') || lower.includes('guitar')) {
      replyCandidates = currentStranger.dynamicReplies.music || replyCandidates;
    } else if (lower.includes('code') || lower.includes('tech') || lower.includes('game')) {
      replyCandidates = currentStranger.dynamicReplies.gaming || currentStranger.dynamicReplies.coding || replyCandidates;
    }

    const replyText = replyCandidates[Math.floor(Math.random() * replyCandidates.length)];

    // Simulate realistic typing delay
    setIsStrangerTyping(true);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);

    typingTimerRef.current = window.setTimeout(() => {
      setIsStrangerTyping(false);
      const strangerMsg: ChatMessage = {
        id: `stranger-${Date.now()}`,
        sender: 'stranger',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, strangerMsg]);
      audioFx.playMessagePop();

      if (!isTextChatOpen) {
        setUnreadCount((c) => c + 1);
      }
    }, 1400 + Math.random() * 800);
  };

  // Media toggles
  const toggleCamera = () => {
    setIsCameraOn((prev) => !prev);
  };

  const toggleMic = () => {
    setIsMicOn((prev) => !prev);
  };

  const toggleMirror = () => {
    setIsMirrored((prev) => !prev);
  };

  const retryCamera = () => {
    initUserMedia();
  };

  const toggleTextChat = () => {
    setIsTextChatOpen((prev) => {
      if (!prev) {
        setUnreadCount(0);
      }
      return !prev;
    });
  };

  const toggleSound = () => {
    setSoundEnabled((prev) => !prev);
  };

  return (
    <RouletteContext.Provider
      value={{
        status,
        currentStranger,
        selectedInterest,
        setSelectedInterest,
        onlineCount,
        callDurationSec,
        findNextStranger,
        stopRoulette,
        resumeRoulette,
        openReportModal,
        closeReportModal,
        submitReport,
        isReportModalOpen,
        localStream,
        isCameraOn,
        isMicOn,
        isMirrored,
        cameraError,
        isRequestingCamera,
        toggleCamera,
        toggleMic,
        toggleMirror,
        retryCamera,
        messages,
        isStrangerTyping,
        isTextChatOpen,
        setIsTextChatOpen,
        toggleTextChat,
        sendTextMessage,
        unreadCount,
        soundEnabled,
        toggleSound
      }}
    >
      {children}
    </RouletteContext.Provider>
  );
};

export const useRoulette = () => {
  const context = useContext(RouletteContext);
  if (!context) {
    throw new Error('useRoulette must be used within a RouletteProvider');
  }
  return context;
};

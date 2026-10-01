import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { getChatRoomDocId } from '../services/firebaseMatchmaking';
import {
  Search,
  MessageCircle,
  Send,
  UserPlus,
  ArrowLeft,
  CheckCheck,
  Sparkles,
  Phone,
  Video,
  Info,
  Shuffle,
  Camera,
  Image as ImageIcon,
  Film,
  X,
  Maximize2,
  MoreVertical,
  Trash2,
  Flag,
  Ban,
  AlertTriangle,
  Loader2
} from 'lucide-react';

export const ChattingTab: React.FC = () => {
  const {
    currentUser,
    updateUniqueUserId,
    conversations,
    activeConversation,
    setActiveConversation,
    deleteConversation,
    blockUser,
    reportUser,
    isPartnerTyping,
    sendMessage,
    startConversationWithUser,
    startRandomTextChat,
    setActiveTab,
    startVideoMatch,
    isFemalePassActive,
    setInsufficientCoinsModal
  } = useApp();

  // 3-Dot Chat Menu & Action States
  const menuRef = useRef<HTMLDivElement>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [selectedReportReason, setSelectedReportReason] = useState('Inappropriate or explicit content');
  const [reportNote, setReportNote] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Close 3-dot menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search by User ID state
  const [searchUserId, setSearchUserId] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [searchMessage, setSearchMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Message input state for active chat
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll when messages arrive or thread changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConversation?.messages?.length, activeConversation?.id]);

  // Media Attachment state (Device Images: PNG/JPG, Videos: MP4)
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingAttachment, setPendingAttachment] = useState<{
    type: 'image' | 'video';
    url: string;
    name: string;
  } | null>(null);

  // Expandable Image Lightbox state
  const [expandedImageUrl, setExpandedImageUrl] = useState<string | null>(null);

  // Handle device file upload (Images PNG/JPG/WEBP or Videos MP4)
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video') || file.name.toLowerCase().endsWith('.mp4');
    const isImage = file.type.startsWith('image');

    if (!isImage && !isVideo) {
      alert('Please select an image (PNG, JPG) or video (MP4) file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setPendingAttachment({
        type: isVideo ? 'video' : 'image',
        url: result,
        name: file.name
      });
    };
    reader.readAsDataURL(file);

    // Reset file input value so selecting the same file again triggers change
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle Search / Connect by User ID (Direct instant connect)
  const handleConnectById = async (e?: React.FormEvent, customId?: string) => {
    if (e) e.preventDefault();
    const targetQuery = (customId || searchUserId).trim();
    if (!targetQuery || isConnecting) return;

    setIsConnecting(true);
    setSearchMessage(null);

    try {
      const res = await startConversationWithUser(targetQuery);
      if (res.success) {
        setSearchMessage({ type: 'success', text: res.message });
        setSearchUserId('');
        if (res.conv) {
          setActiveConversation(res.conv);
        }
      } else {
        setSearchMessage({ type: 'error', text: res.message });
      }
    } catch (err) {
      setSearchMessage({ type: 'error', text: 'Error connecting to user. Please try again.' });
    } finally {
      setIsConnecting(false);
      setTimeout(() => {
        setSearchMessage(null);
      }, 4500);
    }
  };

  // Handle Start Random Text Chat (100% Real P2P)
  const handleStartRandomTextChat = async () => {
    const res = await startRandomTextChat();
    if (res.success) {
      setSearchMessage({ type: 'success', text: `Connected with ${res.conv?.partnerName} for real P2P chat!` });
    } else {
      setSearchMessage({ type: 'error', text: res.message });
    }
    setTimeout(() => {
      setSearchMessage(null);
    }, 4500);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if ((!inputMessage.trim() && !pendingAttachment) || !activeConversation) return;

    sendMessage(
      activeConversation.id,
      inputMessage,
      pendingAttachment
        ? {
            type: pendingAttachment.type,
            url: pendingAttachment.url,
            name: pendingAttachment.name
          }
        : undefined
    );

    setInputMessage('');
    setPendingAttachment(null);
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-3 sm:px-4 py-3 flex-1 flex flex-col">
      {/* 1. TOP SEARCH BAR: "Enter User ID to message directly" + RANDOM TEXT CHAT OPTION */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-3 sm:p-4 mb-3 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-rose-500" />
            <h3 className="text-xs sm:text-sm font-bold text-white">Direct Connect & Search</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-neutral-400 hidden sm:inline">
              Format: <span className="font-mono text-rose-400 font-bold">#USER8555</span>, <span className="font-mono text-rose-400 font-bold">#USER9842</span>
            </span>
            <button
              type="button"
              id="btn-start-random-text-chat"
              onClick={handleStartRandomTextChat}
              className="px-3 py-1 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-bold border border-neutral-700 flex items-center gap-1.5 transition cursor-pointer"
            >
              <Shuffle className="w-3.5 h-3.5 text-rose-400" />
              <span>Start Random Text Chat</span>
            </button>
          </div>
        </div>

        {/* Current User Identity Bar & Multi-tab quick switcher */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 mb-2.5 rounded-xl bg-neutral-800/80 border border-neutral-700/60 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-neutral-400">Your Identity:</span>
            <span className="font-bold text-white flex items-center gap-1.5">
              <span>{currentUser?.name || 'Anonymous'}</span>
              <span className="font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 font-bold">
                {currentUser?.uniqueUserId}
              </span>
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] text-neutral-400">Switch Tab Identity:</span>
            <button
              type="button"
              id="btn-switch-id-6969"
              onClick={() => updateUniqueUserId('#USER6969')}
              className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold transition cursor-pointer ${
                currentUser?.uniqueUserId === '#USER6969'
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'bg-neutral-700 hover:bg-neutral-600 text-neutral-200'
              }`}
            >
              #USER6969
            </button>
            <button
              type="button"
              id="btn-switch-id-8555"
              onClick={() => updateUniqueUserId('#USER8555')}
              className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold transition cursor-pointer ${
                currentUser?.uniqueUserId === '#USER8555'
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'bg-neutral-700 hover:bg-neutral-600 text-neutral-200'
              }`}
            >
              #USER8555
            </button>
          </div>
        </div>

        <form onSubmit={(e) => handleConnectById(e)} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              id="input-search-user-id"
              value={searchUserId}
              onChange={(e) => setSearchUserId(e.target.value)}
              placeholder="Enter Username or User ID (e.g. Priya, Alex, #USER8555)..."
              className="w-full pl-9 pr-3 py-2 bg-neutral-800 border border-neutral-700 rounded-xl text-xs sm:text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
            />
          </div>
          <button
            type="submit"
            id="btn-search-connect-user-id"
            disabled={isConnecting || !searchUserId.trim()}
            className="px-4 py-2 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-rose-500/20 flex items-center gap-1.5 cursor-pointer transition active:scale-95 shrink-0"
          >
            {isConnecting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Connecting...</span>
              </>
            ) : (
              <>
                <span>Connect & Chat</span>
                <UserPlus className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Quick Suggestion Chips */}
        <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
          <span className="text-[11px] text-neutral-400">Quick Connect:</span>
          {['Priya', 'Sarah', 'Alex', '#USER8555', '#USER6969'].map((sampleId) => (
            <button
              key={sampleId}
              type="button"
              onClick={() => {
                setSearchUserId(sampleId);
                handleConnectById(undefined, sampleId);
              }}
              className="px-2 py-0.5 rounded-md bg-neutral-800 hover:bg-neutral-700 text-rose-300 hover:text-white text-[11px] font-semibold border border-neutral-700 hover:border-rose-500/50 transition cursor-pointer"
            >
              {sampleId}
            </button>
          ))}
        </div>

        {searchMessage && (
          <div
            className={`mt-2.5 p-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 ${
              searchMessage.type === 'success'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
            }`}
          >
            <Info className="w-3.5 h-3.5 shrink-0" />
            <span>{searchMessage.text}</span>
          </div>
        )}
      </div>

      {/* 2. CHAT CONTAINER: Conversation list + Message thread */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 flex-1 min-h-[460px] bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-lg">
        {/* LEFT COLUMN: Recent Conversations List */}
        <div
          className={`md:col-span-5 border-r border-neutral-800 flex flex-col ${
            activeConversation ? 'hidden md:flex' : 'flex'
          }`}
        >
          <div className="p-3 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/80">
            <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
              <MessageCircle className="w-4 h-4 text-rose-500" />
              <span>Recent Conversations ({conversations.length})</span>
            </h4>
            <button
              type="button"
              onClick={handleStartRandomTextChat}
              className="text-[11px] text-rose-400 hover:text-rose-300 font-semibold cursor-pointer"
            >
              + New Match
            </button>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-neutral-800/60 max-h-[500px]">
            {conversations.length === 0 ? (
              <div className="p-6 text-center text-neutral-400 text-xs">
                No recent conversations yet. Enter a User ID above or start a random text chat!
              </div>
            ) : (
              conversations.map((c) => {
                const isSelected = activeConversation?.id === c.id;
                return (
                  <div
                    key={c.id}
                    id={`conversation-item-${c.id}`}
                    onClick={() => setActiveConversation(c)}
                    className={`p-3 flex items-center gap-3 cursor-pointer transition ${
                      isSelected ? 'bg-neutral-800/90' : 'hover:bg-neutral-800/40'
                    }`}
                  >
                    <div className="relative">
                      {c.partnerAvatar ? (
                        <img
                          src={c.partnerAvatar}
                          alt={c.partnerName}
                          className="w-11 h-11 rounded-full object-cover ring-2 ring-neutral-700"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-full bg-neutral-800 ring-2 ring-neutral-700 flex items-center justify-center font-bold text-xs text-neutral-200">
                          {c.partnerName.replace('#', '').slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      {c.partnerOnline && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-neutral-900" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="font-bold text-xs sm:text-sm text-white truncate flex items-center gap-1">
                          <span>{c.partnerName}</span>
                          <span>{c.partnerFlag}</span>
                        </div>
                        <span className="text-[10px] text-neutral-400 font-mono">
                          {c.lastMessageTime}
                        </span>
                      </div>

                      <div className="flex items-center justify-between mt-0.5">
                        <p className="text-xs text-neutral-400 truncate pr-2">
                          {c.lastMessage}
                        </p>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {c.unreadCount > 0 && (
                            <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white font-bold text-[9px] animate-pulse shadow-sm">
                              {c.unreadCount}
                            </span>
                          )}
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-neutral-800 text-rose-400 font-mono font-bold">
                            {c.partnerUserId}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Active Chat Thread */}
        <div
          className={`md:col-span-7 flex flex-col ${
            !activeConversation ? 'hidden md:flex' : 'flex'
          }`}
        >
          {activeConversation ? (
            <>
              {/* Chat Thread Header */}
              <div className="p-3 border-b border-neutral-800 bg-neutral-900/90 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setActiveConversation(null)}
                    className="md:hidden p-1.5 rounded-lg bg-neutral-800 text-neutral-300 hover:text-white"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <div className="relative">
                    {activeConversation.partnerAvatar ? (
                      <img
                        src={activeConversation.partnerAvatar}
                        alt={activeConversation.partnerName}
                        className="w-9 h-9 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-neutral-800 ring-1 ring-neutral-700 flex items-center justify-center font-bold text-xs text-neutral-200">
                        {activeConversation.partnerName.replace('#', '').slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    {activeConversation.partnerOnline && (
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-neutral-900" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1">
                      <span>{activeConversation.partnerName}</span>
                      <span>{activeConversation.partnerFlag}</span>
                    </h4>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-mono text-rose-400 font-bold">
                        ID: {activeConversation.partnerUserId}
                      </span>
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-neutral-800 border border-neutral-700 text-[10px] font-mono text-neutral-300">
                        Room: <span className="text-rose-300 font-semibold">{getChatRoomDocId(currentUser?.uniqueUserId || '', activeConversation.partnerUserId)}</span>
                      </span>
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[9px] text-emerald-300 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                        Live onSnapshot
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (activeConversation.partnerGender === 'female' && !isFemalePassActive) {
                        setInsufficientCoinsModal(true);
                        return;
                      }
                      setActiveTab('video');
                      startVideoMatch();
                    }}
                    className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition border border-rose-500/30"
                  >
                    <Video className="w-3.5 h-3.5 text-rose-400" />
                    <span className="hidden sm:inline">Call on Video</span>
                  </button>

                  {/* 3-Dot Options Menu */}
                  <div className="relative" ref={menuRef}>
                    <button
                      id="btn-chat-options-menu"
                      type="button"
                      aria-label="Chat options menu"
                      aria-expanded={isMenuOpen}
                      onClick={() => setIsMenuOpen((prev) => !prev)}
                      className={`p-1.5 rounded-xl transition cursor-pointer border ${
                        isMenuOpen
                          ? 'bg-neutral-800 text-white border-neutral-700 shadow-inner'
                          : 'bg-neutral-800/80 hover:bg-neutral-800 text-neutral-300 hover:text-white border-neutral-700/60'
                      }`}
                      title="Chat options"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {/* Dropdown Menu */}
                    {isMenuOpen && (
                      <div
                        id="chat-header-dropdown-menu"
                        className="absolute right-0 top-full mt-2 w-48 bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl z-40 py-1.5 overflow-hidden animate-in fade-in duration-150 backdrop-blur-xl"
                      >
                        {/* 1. Delete Chat */}
                        <button
                          id="btn-chat-menu-delete"
                          type="button"
                          onClick={() => {
                            setIsMenuOpen(false);
                            setShowDeleteConfirm(true);
                          }}
                          className="w-full px-3.5 py-2.5 text-left text-xs font-semibold text-neutral-300 hover:text-rose-400 hover:bg-rose-500/10 flex items-center gap-2.5 transition cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4 text-rose-400 shrink-0" />
                          <span>Delete Chat</span>
                        </button>

                        {/* 2. Report User */}
                        <button
                          id="btn-chat-menu-report"
                          type="button"
                          onClick={() => {
                            setIsMenuOpen(false);
                            setShowReportModal(true);
                          }}
                          className="w-full px-3.5 py-2.5 text-left text-xs font-semibold text-neutral-300 hover:text-amber-400 hover:bg-amber-500/10 flex items-center gap-2.5 transition cursor-pointer"
                        >
                          <Flag className="w-4 h-4 text-amber-400 shrink-0" />
                          <span>Report User</span>
                        </button>

                        <div className="my-1 border-t border-neutral-800/80" />

                        {/* 3. Block User */}
                        <button
                          id="btn-chat-menu-block"
                          type="button"
                          onClick={() => {
                            setIsMenuOpen(false);
                            setShowBlockConfirm(true);
                          }}
                          className="w-full px-3.5 py-2.5 text-left text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/15 flex items-center gap-2.5 transition cursor-pointer"
                        >
                          <Ban className="w-4 h-4 text-rose-500 shrink-0" />
                          <span>Block User</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Messages List */}
              <div className="flex-1 p-3 sm:p-4 overflow-y-auto flex flex-col gap-2.5 max-h-[380px]">
                {activeConversation.messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex flex-col max-w-[85%] sm:max-w-[75%] ${
                      m.isMine ? 'self-end items-end' : 'self-start items-start'
                    }`}
                  >
                    <div
                      className={`p-2.5 sm:p-3 rounded-2xl text-xs sm:text-sm ${
                        m.isMine
                          ? 'bg-rose-500 text-white rounded-tr-none'
                          : 'bg-neutral-800 text-neutral-100 rounded-tl-none border border-neutral-700/60'
                      }`}
                    >
                      {/* 1. Image Attachment (Expandable Thumbnail) */}
                      {m.mediaType === 'image' && m.mediaUrl && (
                        <div className={`${m.text ? 'mb-2' : ''} relative group`}>
                          <button
                            type="button"
                            onClick={() => setExpandedImageUrl(m.mediaUrl!)}
                            className="block rounded-xl overflow-hidden cursor-zoom-in relative bg-black/40 border border-white/15 transition transform hover:scale-[1.01] active:scale-98"
                            title="Click to view full image"
                          >
                            <img
                              src={m.mediaUrl}
                              alt={m.mediaName || 'Attached image'}
                              className="max-w-[210px] sm:max-w-[280px] max-h-60 w-auto rounded-xl object-cover"
                            />
                            {/* Hover overlay hint */}
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center pointer-events-none">
                              <span className="px-2 py-1 rounded-lg bg-black/70 text-[10px] font-bold text-white flex items-center gap-1 shadow">
                                <Maximize2 className="w-3 h-3" /> Click to Expand
                              </span>
                            </div>
                          </button>
                        </div>
                      )}

                      {/* 2. Video Attachment (Playable HTML5 Player) */}
                      {m.mediaType === 'video' && m.mediaUrl && (
                        <div className={`${m.text ? 'mb-2' : ''} rounded-xl overflow-hidden bg-black/90 border border-white/15 max-w-[230px] sm:max-w-[300px]`}>
                          <video
                            src={m.mediaUrl}
                            controls
                            playsInline
                            preload="metadata"
                            className="w-full max-h-60 rounded-xl bg-black object-contain"
                          />
                        </div>
                      )}

                      {/* 3. Text Message */}
                      {m.text && <p className="leading-relaxed break-words">{m.text}</p>}
                    </div>

                    <div className="text-[10px] text-neutral-500 mt-1 flex items-center gap-1 px-1 font-mono">
                      <span>{m.timestamp}</span>
                      {m.isMine && <CheckCheck className="w-3 h-3 text-rose-400" />}
                    </div>
                  </div>
                ))}

                {/* Partner Typing Indicator */}
                {isPartnerTyping && (
                  <div className="self-start items-start flex flex-col max-w-[85%] sm:max-w-[75%] animate-fadeIn">
                    <div className="px-3.5 py-2 rounded-2xl rounded-tl-none bg-neutral-800 border border-neutral-700/60 text-xs text-neutral-300 flex items-center gap-1.5 shadow-sm">
                      <span className="text-[11px] font-medium text-neutral-400 mr-1">
                        {activeConversation.partnerName} is typing
                      </span>
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Pending Attachment Preview Banner */}
              {pendingAttachment && (
                <div className="px-3 py-2 border-t border-neutral-800 bg-neutral-900/95 flex items-center justify-between gap-2 animate-fadeIn">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {pendingAttachment.type === 'image' ? (
                      <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-neutral-700 shrink-0 bg-neutral-950">
                        <img
                          src={pendingAttachment.url}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-neutral-800 border border-neutral-700 flex items-center justify-center shrink-0">
                        <Film className="w-5 h-5 text-rose-400" />
                      </div>
                    )}
                    <div className="truncate">
                      <span className="text-xs font-bold text-white block truncate">
                        {pendingAttachment.name}
                      </span>
                      <span className="text-[10px] text-amber-400 font-medium capitalize">
                        {pendingAttachment.type} selected • Ready to share
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    id="btn-remove-pending-attachment"
                    onClick={() => setPendingAttachment(null)}
                    className="p-1.5 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white transition cursor-pointer"
                    title="Remove attachment"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Message Input Box */}
              <form
                onSubmit={handleSendMessage}
                className="p-3 border-t border-neutral-800 bg-neutral-900/90 flex items-center gap-2"
              >
                {/* Hidden File Input for Device Media */}
                <input
                  type="file"
                  ref={fileInputRef}
                  id="chat-media-file-input"
                  onChange={handleFileSelect}
                  accept="image/png,image/jpeg,image/jpg,image/webp,video/mp4,video/webm,video/quicktime"
                  className="hidden"
                />

                {/* Gallery / Camera Attachment Button */}
                <button
                  type="button"
                  id="btn-chat-attach-media"
                  onClick={() => fileInputRef.current?.click()}
                  title="Attach Photo or Video (Gallery / Camera)"
                  className="p-2 sm:px-2.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white border border-neutral-700 flex items-center gap-1.5 cursor-pointer transition active:scale-95 shrink-0"
                >
                  <Camera className="w-4 h-4 text-rose-400" />
                  <span className="hidden sm:inline text-xs font-semibold">Attach</span>
                </button>

                <input
                  type="text"
                  id="input-chat-message"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder={
                    pendingAttachment
                      ? `Add caption for ${pendingAttachment.type} (optional)...`
                      : `Message ${activeConversation.partnerName}...`
                  }
                  className="flex-1 px-3.5 py-2 bg-neutral-800 border border-neutral-700 rounded-xl text-xs sm:text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-rose-500"
                />
                <button
                  type="submit"
                  id="btn-send-chat-message"
                  disabled={!inputMessage.trim() && !pendingAttachment}
                  className="p-2 sm:px-4 sm:py-2 bg-rose-500 hover:bg-rose-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-md shadow-rose-500/20 flex items-center gap-1 cursor-pointer transition active:scale-95 shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-neutral-500">
              <MessageCircle className="w-12 h-12 text-neutral-700 mb-2" />
              <h4 className="text-sm font-bold text-neutral-300 mb-1">Select a Conversation</h4>
              <p className="text-xs text-neutral-500 max-w-xs mb-4">
                Choose someone from your chat history or enter a unique User ID above to start chatting directly.
              </p>
              <button
                type="button"
                onClick={handleStartRandomTextChat}
                className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-bold border border-neutral-700 flex items-center gap-1.5 cursor-pointer transition"
              >
                <Shuffle className="w-3.5 h-3.5 text-rose-400" />
                <span>Start Random Text Chat</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Expandable Image Lightbox Modal */}
      {expandedImageUrl && (
        <div
          id="modal-image-lightbox"
          onClick={() => setExpandedImageUrl(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out animate-fadeIn"
        >
          <div
            className="relative max-w-4xl max-h-[90vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              id="btn-close-lightbox"
              onClick={() => setExpandedImageUrl(null)}
              className="absolute -top-12 right-0 p-2 rounded-full bg-neutral-800 text-white hover:bg-neutral-700 transition cursor-pointer border border-neutral-700 shadow-lg"
              title="Close image view"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={expandedImageUrl}
              alt="Full preview"
              className="max-w-full max-h-[82vh] object-contain rounded-2xl shadow-2xl border border-neutral-800"
            />
          </div>
        </div>
      )}

      {/* 1. DELETE CHAT CONFIRMATION MODAL */}
      {showDeleteConfirm && activeConversation && (
        <div
          id="modal-delete-chat-confirm"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white">Delete Chat Conversation?</h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  With <span className="text-rose-400 font-semibold">{activeConversation.partnerName}</span>
                </p>
              </div>
            </div>

            <p className="text-xs text-neutral-300 leading-relaxed bg-neutral-950/60 p-3 rounded-xl border border-neutral-800/80">
              Are you sure you want to delete this chat? All messages and shared media will be permanently removed from your conversation history.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-1">
              <button
                type="button"
                id="btn-cancel-delete-chat"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                id="btn-confirm-delete-chat"
                onClick={() => {
                  const partner = activeConversation.partnerName;
                  deleteConversation(activeConversation.id);
                  setShowDeleteConfirm(false);
                  showToast(`Chat with ${partner} deleted`);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-rose-900/30"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Chat</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. REPORT USER MODAL */}
      {showReportModal && activeConversation && (
        <div
          id="modal-report-user"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowReportModal(false)}
        >
          <div
            className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                  <Flag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white">Report User</h3>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Reporting <span className="text-amber-400 font-semibold">{activeConversation.partnerName}</span> (ID: {activeConversation.partnerUserId})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowReportModal(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-300 mb-2 block">
                Select reason for reporting:
              </label>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {[
                  'Inappropriate or explicit content',
                  'Harassment, hate speech, or abuse',
                  'Scam, fraud, or commercial spam',
                  'Underage user concern',
                  'Impersonation or fake identity',
                  'Other safety policy violation'
                ].map((reason) => (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => setSelectedReportReason(reason)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition cursor-pointer border flex items-center justify-between ${
                      selectedReportReason === reason
                        ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                        : 'bg-neutral-950/60 border-neutral-800/80 text-neutral-300 hover:bg-neutral-800'
                    }`}
                  >
                    <span>{reason}</span>
                    {selectedReportReason === reason && (
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-300 mb-1.5 block">
                Additional Details (Optional):
              </label>
              <textarea
                value={reportNote}
                onChange={(e) => setReportNote(e.target.value)}
                placeholder="Provide any additional context or incident details..."
                rows={2}
                className="w-full px-3 py-2 text-xs rounded-xl bg-neutral-950 border border-neutral-800 text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500/60 transition resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-1">
              <button
                type="button"
                id="btn-cancel-report-user"
                onClick={() => setShowReportModal(false)}
                className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                id="btn-confirm-submit-report"
                onClick={() => {
                  const partner = activeConversation.partnerName;
                  const reason = reportNote.trim() ? `${selectedReportReason} - ${reportNote.trim()}` : selectedReportReason;
                  reportUser(activeConversation.partnerUserId, reason, activeConversation.partnerName);
                  setShowReportModal(false);
                  setReportNote('');
                  showToast(`Report submitted for ${partner}. Thank you.`);
                }}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-amber-900/30"
              >
                <Flag className="w-3.5 h-3.5" />
                <span>Submit Report</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. BLOCK USER CONFIRMATION MODAL */}
      {showBlockConfirm && activeConversation && (
        <div
          id="modal-block-user-confirm"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowBlockConfirm(false)}
        >
          <div
            className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-500 shrink-0">
                <Ban className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white">Block User?</h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Block <span className="text-rose-400 font-semibold">{activeConversation.partnerName}</span> ({activeConversation.partnerUserId})
                </p>
              </div>
            </div>

            <div className="space-y-2 bg-neutral-950/60 p-3 rounded-xl border border-neutral-800/80 text-xs text-neutral-300">
              <p className="flex items-start gap-2">
                <span className="text-rose-400 font-bold">•</span>
                <span>They will no longer be able to message you or connect with you in video roulette.</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-rose-400 font-bold">•</span>
                <span>This conversation and message history will be removed from your chat list.</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-rose-400 font-bold">•</span>
                <span>The block takes effect immediately.</span>
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-1">
              <button
                type="button"
                id="btn-cancel-block-user"
                onClick={() => setShowBlockConfirm(false)}
                className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                id="btn-confirm-block-user"
                onClick={() => {
                  const partner = activeConversation.partnerName;
                  blockUser(activeConversation.partnerUserId, activeConversation.partnerName);
                  setShowBlockConfirm(false);
                  showToast(`${partner} has been blocked`);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-rose-900/30"
              >
                <Ban className="w-3.5 h-3.5" />
                <span>Block User</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Toast Feedback */}
      {toastMessage && (
        <div
          id="toast-chat-action-feedback"
          className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl bg-neutral-900/95 border border-neutral-700 text-white text-xs font-semibold shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3 duration-200"
        >
          <CheckCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

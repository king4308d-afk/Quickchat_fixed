import React, { useState, useEffect, useRef } from 'react';
import { useDating } from '../context/DatingContext';
import { MatchItem, UserProfile } from '../types';
import {
  Search,
  Send,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  MoreVertical,
  Smile,
  Heart,
  Info,
  Clock,
  MessageCircleOff,
  Trash2,
  Flag,
  Ban,
  X,
  CheckCheck
} from 'lucide-react';

interface ChatViewProps {
  onOpenProfile: (profile: UserProfile) => void;
  preselectedMatchId?: string | null;
}

export const ChatView: React.FC<ChatViewProps> = ({ onOpenProfile, preselectedMatchId }) => {
  const { matches, messages, isTyping, sendMessage, selectMatchForChat, activeMatch, currentUser } = useDating();
  
  const [selectedMatch, setSelectedMatch] = useState<MatchItem | null>(null);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 3-Dot Menu & Action States
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

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-select match if passed from Match Celebration or activeMatch
  useEffect(() => {
    if (preselectedMatchId) {
      const found = matches.find(m => m.id === preselectedMatchId);
      if (found) {
        setSelectedMatch(found);
        selectMatchForChat(found);
      }
    } else if (activeMatch) {
      setSelectedMatch(activeMatch);
    } else if (matches.length > 0 && !selectedMatch) {
      // On desktop, auto-select first match
      setSelectedMatch(matches[0]);
      selectMatchForChat(matches[0]);
    }
  }, [preselectedMatchId, activeMatch?.id, matches.length]);

  // Scroll to bottom of chat on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedMatch, messages, isTyping]);

  const activeMessages = selectedMatch ? messages[selectedMatch.id] || [] : [];
  const activeIsTyping = selectedMatch ? isTyping[selectedMatch.id] : false;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMatch || !inputText.trim()) return;
    sendMessage(selectedMatch.id, inputText);
    setInputText('');
  };

  const handleIcebreaker = (phrase: string) => {
    if (!selectedMatch) return;
    sendMessage(selectedMatch.id, phrase);
  };

  const filteredMatches = matches.filter(m =>
    m.profile.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Split matches into "New Matches" (no messages yet) and "Conversations" (have messages)
  const newMatches = matches.filter(m => !messages[m.id] || messages[m.id].length === 0);
  const conversations = filteredMatches.filter(m => messages[m.id] && messages[m.id].length > 0);

  const ICEBREAKERS = [
    'Chai or Coffee? ☕',
    'What’s your ideal Sunday vibe? 🌿',
    'Tell me your favorite travel destination! ✈️',
    'What song is stuck in your head right now? 🎵'
  ];

  return (
    <div className="max-w-6xl mx-auto w-full h-[calc(100vh-4.5rem)] px-2 sm:px-4 py-2 sm:py-3">
      <div className="bg-white rounded-3xl shadow-xl border border-gray-200/70 overflow-hidden h-full flex">
        
        {/* Left Sidebar: Matches & Conversation List */}
        <div
          className={`w-full md:w-80 lg:w-96 flex-col border-r border-gray-100 bg-white shrink-0 ${
            selectedMatch ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Sidebar Header & Search */}
          <div className="p-4 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">Matches & Chat</h2>
            
            {/* Search Input */}
            <div className="relative mt-3">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                id="search-matches-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Matches khojein..."
                className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              />
            </div>
          </div>

          {/* New Matches Horizontal Scroll Rail */}
          {newMatches.length > 0 && (
            <div className="p-3 border-b border-gray-100 bg-rose-50/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Naye Matches ({newMatches.length})
                </span>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
                {newMatches.map(match => (
                  <button
                    key={match.id}
                    type="button"
                    onClick={() => {
                      setSelectedMatch(match);
                      selectMatchForChat(match);
                    }}
                    className="flex flex-col items-center shrink-0 group cursor-pointer"
                  >
                    <div className="relative p-0.5 rounded-full bg-gradient-to-tr from-rose-500 to-pink-500 group-hover:scale-105 transition shadow-sm">
                      <img
                        src={match.profile.photos[0]}
                        alt={match.profile.name}
                        referrerPolicy="no-referrer"
                        className="w-13 h-13 rounded-full object-cover border-2 border-white"
                      />
                      <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full" />
                    </div>
                    <span className="text-xs font-medium text-gray-700 mt-1 max-w-[60px] truncate">
                      {match.profile.name.split(' ')[0]}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
            {conversations.length > 0 ? (
              conversations.map(match => {
                const thread = messages[match.id] || [];
                const last = thread[thread.length - 1];
                const isSelected = selectedMatch?.id === match.id;
                const isOnline = true; // simulated online state

                return (
                  <button
                    key={match.id}
                    id={`conversation-item-${match.id}`}
                    type="button"
                    onClick={() => {
                      setSelectedMatch(match);
                      selectMatchForChat(match);
                    }}
                    className={`w-full p-3.5 flex items-center gap-3 text-left transition cursor-pointer ${
                      isSelected ? 'bg-rose-50/70 border-l-4 border-rose-500' : 'hover:bg-gray-50'
                    }`}
                  >
                    {/* Avatar with status indicator */}
                    <div className="relative shrink-0">
                      <img
                        src={match.profile.photos[0]}
                        alt={match.profile.name}
                        referrerPolicy="no-referrer"
                        className="w-13 h-13 rounded-full object-cover"
                      />
                      {isOnline && (
                        <span className="absolute bottom-0.5 right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
                      )}
                    </div>

                    {/* Meta info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 font-semibold text-gray-900 text-sm truncate">
                          <span>{match.profile.name}</span>
                          {match.profile.verified && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 fill-blue-500 shrink-0" />
                          )}
                        </div>
                        {last && (
                          <span className="text-[11px] text-gray-400 font-medium shrink-0">
                            {last.timestamp}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-1">
                        <p className="text-xs text-gray-500 truncate pr-2">
                          {last ? (
                            last.senderId === currentUser?.id ? `Aap: ${last.text}` : last.text
                          ) : (
                            'Naya Match! Hello kahein 👋'
                          )}
                        </p>
                        {last && last.senderId !== currentUser?.id && last.status !== 'read' && (
                          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0 animate-pulse" />
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            ) : matches.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <MessageCircleOff className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <p className="text-sm font-semibold text-gray-700">Abhi tak koi match nahi mila</p>
                <p className="text-xs text-gray-500 mt-1">
                  Explore tab par jaakar profiles ko right swipe karein match pane ke liye!
                </p>
              </div>
            ) : (
              <div className="p-6 text-center text-gray-400 text-xs">
                Upar diye gaye 'Naye Matches' me se kisi par tap karke conversation shuru karein.
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Active Chat Window */}
        <div
          className={`flex-1 flex-col bg-slate-50/50 ${
            selectedMatch ? 'flex' : 'hidden md:flex items-center justify-center'
          }`}
        >
          {selectedMatch ? (
            <>
              {/* Chat Top Header */}
              <div className="p-3 sm:p-4 bg-white border-b border-gray-200/80 flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-3">
                  {/* Mobile Back Button */}
                  <button
                    type="button"
                    onClick={() => setSelectedMatch(null)}
                    className="md:hidden p-1.5 rounded-full hover:bg-gray-100 text-gray-600"
                    title="Back to conversation list"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>

                  <div
                    onClick={() => onOpenProfile(selectedMatch.profile)}
                    className="relative cursor-pointer group flex items-center gap-3"
                  >
                    <div className="relative">
                      <img
                        src={selectedMatch.profile.photos[0]}
                        alt={selectedMatch.profile.name}
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 sm:w-11 sm:h-11 rounded-full object-cover"
                      />
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5 font-bold text-gray-900 text-sm sm:text-base group-hover:text-rose-600 transition">
                        <span>{selectedMatch.profile.name}, {selectedMatch.profile.age}</span>
                        {selectedMatch.profile.verified && (
                          <CheckCircle2 className="w-4 h-4 text-blue-500 fill-blue-500" />
                        )}
                      </div>
                      <p className="text-[11px] sm:text-xs text-emerald-600 font-medium flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        {activeIsTyping ? 'Typing kar rahe hain...' : 'Active Now'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Profile detail action */}
                  <button
                    id="view-matched-profile-btn"
                    type="button"
                    onClick={() => onOpenProfile(selectedMatch.profile)}
                    className="px-3 py-1.5 rounded-xl border border-gray-200 hover:bg-rose-50 hover:border-rose-200 text-gray-700 hover:text-rose-600 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Info className="w-4 h-4" />
                    <span className="hidden sm:inline">Profile Dekhein</span>
                  </button>

                  {/* 3-Dot Options Menu */}
                  <div className="relative" ref={menuRef}>
                    <button
                      id="btn-chatview-options-menu"
                      type="button"
                      aria-label="Chat options menu"
                      aria-expanded={isMenuOpen}
                      onClick={() => setIsMenuOpen((prev) => !prev)}
                      className={`p-2 rounded-xl transition cursor-pointer border ${
                        isMenuOpen
                          ? 'bg-gray-100 text-gray-900 border-gray-300 shadow-inner'
                          : 'bg-white hover:bg-gray-50 text-gray-600 hover:text-gray-900 border-gray-200'
                      }`}
                      title="More options"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {/* Dropdown Menu */}
                    {isMenuOpen && (
                      <div
                        id="chatview-header-dropdown-menu"
                        className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-2xl shadow-xl z-40 py-1.5 overflow-hidden animate-in fade-in duration-150"
                      >
                        {/* 1. Delete Chat */}
                        <button
                          id="btn-chatview-menu-delete"
                          type="button"
                          onClick={() => {
                            setIsMenuOpen(false);
                            setShowDeleteConfirm(true);
                          }}
                          className="w-full px-3.5 py-2.5 text-left text-xs font-semibold text-gray-700 hover:text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4 text-rose-500 shrink-0" />
                          <span>Delete Chat</span>
                        </button>

                        {/* 2. Report User */}
                        <button
                          id="btn-chatview-menu-report"
                          type="button"
                          onClick={() => {
                            setIsMenuOpen(false);
                            setShowReportModal(true);
                          }}
                          className="w-full px-3.5 py-2.5 text-left text-xs font-semibold text-gray-700 hover:text-amber-600 hover:bg-amber-50 flex items-center gap-2.5 transition cursor-pointer"
                        >
                          <Flag className="w-4 h-4 text-amber-500 shrink-0" />
                          <span>Report User</span>
                        </button>

                        <div className="my-1 border-t border-gray-100" />

                        {/* 3. Block User */}
                        <button
                          id="btn-chatview-menu-block"
                          type="button"
                          onClick={() => {
                            setIsMenuOpen(false);
                            setShowBlockConfirm(true);
                          }}
                          className="w-full px-3.5 py-2.5 text-left text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 flex items-center gap-2.5 transition cursor-pointer"
                        >
                          <Ban className="w-4 h-4 text-rose-500 shrink-0" />
                          <span>Block User</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Chat Message Scroll Area */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
                {/* Matched date stamp */}
                <div className="flex justify-center my-2">
                  <span className="px-3 py-1 rounded-full bg-gray-100 text-[11px] text-gray-500 font-medium flex items-center gap-1">
                    <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
                    Aap aur {selectedMatch.profile.name.split(' ')[0]} ne match kiya
                  </span>
                </div>

                {/* Messages */}
                {activeMessages.map(msg => {
                  const isMine = msg.senderId === currentUser?.id;
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[80%] sm:max-w-[70%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-xs ${
                          isMine
                            ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-tr-xs'
                            : 'bg-white text-gray-800 border border-gray-200/70 rounded-tl-xs'
                        }`}
                      >
                        {msg.text}
                      </div>
                      <div
                        className={`text-[10px] text-gray-400 mt-1 flex items-center gap-1 px-1 ${
                          isMine ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <span>{msg.timestamp}</span>
                        {isMine && <span className="text-rose-500 font-bold">✓✓</span>}
                      </div>
                    </div>
                  );
                })}

                {/* Typing Indicator Bubble */}
                {activeIsTyping && (
                  <div className="flex items-center gap-2 text-gray-400 text-xs mt-2">
                    <img
                      src={selectedMatch.profile.photos[0]}
                      alt=""
                      referrerPolicy="no-referrer"
                      className="w-6 h-6 rounded-full object-cover"
                    />
                    <div className="px-4 py-2.5 rounded-2xl rounded-tl-xs bg-white border border-gray-200 text-gray-500 flex items-center gap-1.5 shadow-xs">
                      <span className="w-2 h-2 rounded-full bg-rose-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 rounded-full bg-rose-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 rounded-full bg-rose-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Quick Icebreaker Suggestions (if fewer than 4 messages) */}
              {activeMessages.length <= 3 && (
                <div className="px-4 py-2 bg-white/80 border-t border-gray-100 flex gap-1.5 overflow-x-auto scrollbar-none">
                  {ICEBREAKERS.map((phrase, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleIcebreaker(phrase)}
                      className="px-3 py-1.5 rounded-full text-xs font-medium bg-rose-50 hover:bg-rose-100 text-rose-700 shrink-0 border border-rose-100 transition cursor-pointer"
                    >
                      {phrase}
                    </button>
                  ))}
                </div>
              )}

              {/* Chat Input Bar */}
              <form onSubmit={handleSend} className="p-3 sm:p-4 bg-white border-t border-gray-200/80 flex items-center gap-2">
                <input
                  id="chat-message-input"
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={`${selectedMatch.profile.name.split(' ')[0]} ko message bhejein...`}
                  className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />

                <button
                  id="btn-send-message"
                  type="submit"
                  disabled={!inputText.trim()}
                  className="w-11 h-11 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white flex items-center justify-center shadow-md shadow-rose-500/25 active:scale-95 transition disabled:opacity-40 cursor-pointer shrink-0"
                  title="Message Bhejein"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </>
          ) : (
            <div className="text-center p-8 text-gray-400">
              <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-3">
                <Heart className="w-8 h-8 fill-rose-500/20" />
              </div>
              <h3 className="text-lg font-bold text-gray-700">Apne Matches Se Baat Karein</h3>
              <p className="text-sm text-gray-500 mt-1 max-w-sm">
                Baat-cheet shuru karne ke liye baayein (left) taraf se koi match chunein.
              </p>
            </div>
          )}
        </div>

      </div>

      {/* 1. DELETE CHAT CONFIRMATION MODAL */}
      {showDeleteConfirm && selectedMatch && (
        <div
          id="modal-delete-chatview-confirm"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            className="w-full max-w-md bg-white rounded-2xl p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150 border border-gray-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-gray-900">Delete Conversation?</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  With <span className="text-rose-600 font-semibold">{selectedMatch.profile.name}</span>
                </p>
              </div>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed bg-gray-50 p-3 rounded-xl border border-gray-200/70">
              Are you sure you want to delete this chat? All messages and conversations with this user will be cleared from your view.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-1">
              <button
                type="button"
                id="btn-cancel-delete-chatview"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                id="btn-confirm-delete-chatview"
                onClick={() => {
                  const partner = selectedMatch.profile.name;
                  setSelectedMatch(null);
                  setShowDeleteConfirm(false);
                  showToast(`Chat with ${partner} deleted`);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-rose-500/20"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Chat</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. REPORT USER MODAL */}
      {showReportModal && selectedMatch && (
        <div
          id="modal-report-chatview-user"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowReportModal(false)}
        >
          <div
            className="w-full max-w-md bg-white rounded-2xl p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150 border border-gray-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500 shrink-0">
                  <Flag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-gray-900">Report User</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Reporting <span className="text-amber-600 font-semibold">{selectedMatch.profile.name}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowReportModal(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 mb-2 block">
                Select reason for reporting:
              </label>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {[
                  'Inappropriate or explicit content',
                  'Harassment, hate speech, or abuse',
                  'Scam, fraud, or commercial spam',
                  'Underage user concern',
                  'Fake profile or impersonation',
                  'Other safety concern'
                ].map((reason) => (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => setSelectedReportReason(reason)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition cursor-pointer border flex items-center justify-between ${
                      selectedReportReason === reason
                        ? 'bg-amber-50 border-amber-300 text-amber-800'
                        : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span>{reason}</span>
                    {selectedReportReason === reason && (
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 mb-1.5 block">
                Additional Details (Optional):
              </label>
              <textarea
                value={reportNote}
                onChange={(e) => setReportNote(e.target.value)}
                placeholder="Provide any additional context or incident details..."
                rows={2}
                className="w-full px-3 py-2 text-xs rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-amber-500 transition resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-1">
              <button
                type="button"
                id="btn-cancel-report-chatview"
                onClick={() => setShowReportModal(false)}
                className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                id="btn-confirm-submit-chatview-report"
                onClick={() => {
                  const partner = selectedMatch.profile.name;
                  setShowReportModal(false);
                  setReportNote('');
                  showToast(`Report submitted for ${partner}. Thank you.`);
                }}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-amber-600/20"
              >
                <Flag className="w-3.5 h-3.5" />
                <span>Submit Report</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. BLOCK USER CONFIRMATION MODAL */}
      {showBlockConfirm && selectedMatch && (
        <div
          id="modal-block-chatview-user-confirm"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowBlockConfirm(false)}
        >
          <div
            className="w-full max-w-md bg-white rounded-2xl p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150 border border-gray-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                <Ban className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-gray-900">Block User?</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Block <span className="text-rose-600 font-semibold">{selectedMatch.profile.name}</span>
                </p>
              </div>
            </div>

            <div className="space-y-2 bg-gray-50 p-3 rounded-xl border border-gray-200/70 text-xs text-gray-600">
              <p className="flex items-start gap-2">
                <span className="text-rose-500 font-bold">•</span>
                <span>They will no longer be able to message you or see your profile.</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-rose-500 font-bold">•</span>
                <span>This match and conversation will be removed from your list.</span>
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-1">
              <button
                type="button"
                id="btn-cancel-block-chatview"
                onClick={() => setShowBlockConfirm(false)}
                className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                id="btn-confirm-block-chatview"
                onClick={() => {
                  const partner = selectedMatch.profile.name;
                  setSelectedMatch(null);
                  setShowBlockConfirm(false);
                  showToast(`${partner} has been blocked`);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-rose-600/20"
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
          id="toast-chatview-action-feedback"
          className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl bg-gray-900/95 border border-gray-800 text-white text-xs font-semibold shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3 duration-200"
        >
          <CheckCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

import React from 'react';
import { useDating } from '../context/DatingContext';
import { ActiveTab } from '../types';
import { Flame, MessageCircle, User, Sparkles } from 'lucide-react';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenProfileModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenProfileModal
}) => {
  const { currentUser, matches, messages } = useDating();

  // Calculate unread message badge count
  const unreadCount = matches.reduce((count, match) => {
    const thread = messages[match.id] || [];
    const hasUnread = thread.some(
      m => m.senderId !== currentUser?.id && m.status !== 'read'
    );
    return count + (hasUnread ? 1 : 0);
  }, 0);

  return (
    <header className="w-full bg-white/95 backdrop-blur-md border-b border-gray-200/80 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        
        {/* Brand Logo */}
        <div
          onClick={() => setActiveTab('explore')}
          className="flex items-center gap-2 cursor-pointer select-none group"
        >
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-500 flex items-center justify-center text-white shadow-md shadow-rose-500/25 group-hover:scale-105 transition">
            <Flame className="w-5 h-5 fill-white" />
          </div>
          <div>
            <span className="font-extrabold text-lg sm:text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-rose-600 to-pink-600">
              Dating App
            </span>
          </div>
        </div>

        {/* Center Navigation Tabs */}
        <nav className="flex items-center gap-1 sm:gap-2">
          {/* Explore Cards Tab */}
          <button
            id="nav-tab-explore"
            type="button"
            onClick={() => setActiveTab('explore')}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-2xl text-xs sm:text-sm font-semibold transition cursor-pointer ${
              activeTab === 'explore'
                ? 'bg-rose-50 text-rose-600 shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <Flame className={`w-4 h-4 ${activeTab === 'explore' ? 'fill-rose-600' : ''}`} />
            <span>Cards</span>
          </button>

          {/* Matches & Chat Tab */}
          <button
            id="nav-tab-matches"
            type="button"
            onClick={() => setActiveTab('matches')}
            className={`relative flex items-center gap-2 px-3 sm:px-4 py-2 rounded-2xl text-xs sm:text-sm font-semibold transition cursor-pointer ${
              activeTab === 'matches'
                ? 'bg-rose-50 text-rose-600 shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <MessageCircle className={`w-4 h-4 ${activeTab === 'matches' ? 'fill-rose-600' : ''}`} />
            <span>Chat</span>
            
            {/* Unread or Match count badge */}
            {matches.length > 0 && (
              <span className="ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r from-rose-500 to-pink-500 text-white">
                {unreadCount > 0 ? unreadCount : matches.length}
              </span>
            )}
          </button>
        </nav>

        {/* User Profile avatar trigger */}
        <div className="flex items-center gap-2">
          {currentUser ? (
            <button
              id="nav-user-profile-btn"
              type="button"
              onClick={onOpenProfileModal}
              className="flex items-center gap-2 p-1.5 rounded-2xl hover:bg-gray-50 transition border border-transparent hover:border-gray-200 cursor-pointer"
            >
              <img
                src={currentUser.photos[0]}
                alt={currentUser.name}
                referrerPolicy="no-referrer"
                className="w-8 h-8 rounded-full object-cover border border-rose-200"
              />
              <span className="hidden md:inline text-xs font-semibold text-gray-700 max-w-[90px] truncate">
                {currentUser.name.split(' ')[0]}
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenProfileModal}
              className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-600 text-xs font-semibold"
            >
              Login
            </button>
          )}
        </div>

      </div>
    </header>
  );
};

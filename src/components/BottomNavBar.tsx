import React from 'react';
import { useApp } from '../context/AppContext';
import { NavigationTab } from '../types';
import { Video, MessageCircle, Disc, User } from 'lucide-react';

export const BottomNavBar: React.FC = () => {
  const { activeTab, setActiveTab, conversations } = useApp();

  const totalUnread = conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0);

  const navItems: { id: NavigationTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'video', label: 'Video Call', icon: Video },
    { id: 'chat', label: 'Chatting', icon: MessageCircle },
    { id: 'spin', label: 'Spin & Earn', icon: Disc },
    { id: 'profile', label: 'Profile', icon: User }
  ];

  return (
    <nav className="w-full bg-neutral-900/95 backdrop-blur-md border-t border-neutral-800 text-white select-none z-30 shrink-0 sticky bottom-0">
      <div className="max-w-md sm:max-w-lg mx-auto grid grid-cols-4 px-2 py-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              id={`tab-btn-${item.id}`}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`relative flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition cursor-pointer ${
                isActive
                  ? 'text-rose-400 font-bold'
                  : 'text-neutral-400 hover:text-neutral-200 font-medium'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform ${
                    isActive ? 'scale-110 text-rose-500' : ''
                  }`}
                />
                {item.id === 'chat' && totalUnread > 0 && (
                  <span className="absolute -top-1 -right-2 px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[9px] font-extrabold animate-pulse">
                    {totalUnread}
                  </span>
                )}
                {item.id === 'spin' && (
                  <span className="absolute -top-1 -right-2 w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                )}
              </div>
              <span className="text-[11px] mt-1 tracking-tight">{item.label}</span>
              {isActive && (
                <span className="absolute bottom-0.5 w-6 h-0.5 rounded-full bg-rose-500" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

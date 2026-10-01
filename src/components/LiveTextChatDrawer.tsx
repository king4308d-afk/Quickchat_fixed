import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useRoulette } from '../context/RouletteContext';
import { QUICK_ICEBREAKERS } from '../data/strangers';
import {
  Send,
  Sparkles,
  MessageCircle,
  X,
  Bot,
  User,
  CornerDownLeft
} from 'lucide-react';

export interface LiveTextChatRef {
  focusInput: () => void;
}

export const LiveTextChatDrawer = forwardRef<LiveTextChatRef>((_, ref) => {
  const {
    messages,
    sendTextMessage,
    isStrangerTyping,
    currentStranger,
    status,
    isTextChatOpen,
    setIsTextChatOpen
  } = useRoulette();

  const [inputVal, setInputVal] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useImperativeHandle(ref, () => ({
    focusInput: () => {
      inputRef.current?.focus();
    }
  }));

  // Auto scroll messages to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStrangerTyping]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;
    sendTextMessage(inputVal);
    setInputVal('');
  };

  const handleQuickIcebreaker = (phrase: string) => {
    sendTextMessage(phrase);
    inputRef.current?.focus();
  };

  if (!isTextChatOpen) return null;

  return (
    <div className="w-full lg:w-80 xl:w-96 bg-neutral-900 border-l border-neutral-800 flex flex-col h-full overflow-hidden select-none shrink-0 z-20">
      {/* Top Chat Header */}
      <div className="p-3 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/90">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-rose-500" />
          <span className="font-bold text-sm text-white">Live In-Call Chat</span>
          {currentStranger && status === 'connected' && (
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-medium border border-emerald-500/30">
              with {currentStranger.name.split(' ')[0]}
            </span>
          )}
        </div>
        <button
          type="button"
          id="btn-close-chat-drawer"
          onClick={() => setIsTextChatOpen(false)}
          className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition cursor-pointer"
          title="Minimize Chat"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Quick Icebreakers chips */}
      {status === 'connected' && (
        <div className="p-2 border-b border-neutral-800/80 bg-neutral-950/40">
          <div className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider mb-1.5 px-1 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400" /> 1-Tap Icebreakers
          </div>
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
            {QUICK_ICEBREAKERS.slice(0, 4).map((ice, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleQuickIcebreaker(ice)}
                className="text-[11px] px-2.5 py-1 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white border border-neutral-700 shrink-0 transition cursor-pointer"
              >
                {ice}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Message History Container */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 bg-neutral-950/60">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4 text-neutral-500">
            <MessageCircle className="w-8 h-8 stroke-[1.5] mb-2 text-neutral-600" />
            <p className="text-xs">No messages yet. Break the ice and say hello!</p>
          </div>
        ) : (
          messages.map((msg) => {
            if (msg.sender === 'system') {
              return (
                <div key={msg.id} className="text-center my-2">
                  <span className="inline-block px-3 py-1 rounded-full bg-neutral-800/80 border border-neutral-700 text-[11px] text-neutral-400">
                    {msg.text}
                  </span>
                </div>
              );
            }

            const isMe = msg.sender === 'me';
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] px-3.5 py-2 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                    isMe
                      ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-br-xs shadow-sm shadow-rose-500/20'
                      : 'bg-neutral-800 text-neutral-100 border border-neutral-700 rounded-bl-xs'
                  }`}
                >
                  <p>{msg.text}</p>
                </div>
                <span className="text-[10px] text-neutral-500 mt-1 px-1">
                  {isMe ? 'You' : currentStranger?.name.split(' ')[0] || 'Stranger'} • {msg.timestamp}
                </span>
              </div>
            );
          })
        )}

        {/* Stranger Typing Bouncing Dots */}
        {isStrangerTyping && (
          <div className="flex flex-col items-start">
            <div className="px-3.5 py-2 rounded-2xl bg-neutral-800 border border-neutral-700 text-neutral-300 text-xs rounded-bl-xs flex items-center gap-1.5">
              <span className="text-[11px] text-neutral-400">
                {currentStranger?.name.split(' ')[0] || 'Stranger'} is typing
              </span>
              <span className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Box Footer */}
      <form onSubmit={handleSubmit} className="p-3 bg-neutral-900 border-t border-neutral-800">
        <div className="relative flex items-center">
          <input
            ref={inputRef}
            id="input-roulette-chat-message"
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            disabled={status !== 'connected'}
            placeholder={
              status === 'connected'
                ? `Message ${currentStranger?.name.split(' ')[0] || 'stranger'}...`
                : 'Connect with a stranger to chat...'
            }
            className="w-full pl-3.5 pr-11 py-2.5 bg-neutral-950 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 text-xs sm:text-sm focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            id="btn-send-chat-message"
            disabled={!inputVal.trim() || status !== 'connected'}
            className="absolute right-1.5 p-2 rounded-lg bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-md shadow-rose-500/20"
            title="Send Message [Enter]"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>
    </div>
  );
});

LiveTextChatDrawer.displayName = 'LiveTextChatDrawer';

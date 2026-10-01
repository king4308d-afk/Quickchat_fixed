import React, { useRef } from 'react';
import { useRoulette } from '../context/RouletteContext';
import { StrangerVideoFeed } from './StrangerVideoFeed';
import { UserVideoPreview } from './UserVideoPreview';
import { LiveTextChatDrawer, LiveTextChatRef } from './LiveTextChatDrawer';
import { ActionControls } from './ActionControls';
import { ReportModal } from './ReportModal';
import { RouletteHeader } from './RouletteHeader';

export const VideoRoom: React.FC = () => {
  const chatRef = useRef<LiveTextChatRef | null>(null);

  const handleFocusChat = () => {
    chatRef.current?.focusInput();
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-neutral-950 text-white overflow-hidden font-sans select-none">
      {/* 1. Header Bar */}
      <RouletteHeader />

      {/* 2. Main Center Body: Video Container Layout + Side Chat Drawer */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* BADA VIDEO CONTAINER LAYOUT (Top: Stranger Video, Niche: User Camera Preview) */}
        <div className="flex-1 flex flex-col p-2 sm:p-3 lg:p-4 gap-2 sm:gap-3 overflow-hidden min-h-0">
          {/* TOP SECTION: STRANGER'S VIDEO (or Match Finding Loader / Idle Screen) */}
          <div className="flex-1 min-h-0 relative w-full">
            <StrangerVideoFeed />
          </div>

          {/* NICHE SECTION: USER'S LOCAL CAMERA PREVIEW */}
          <div className="h-[40%] sm:h-[42%] lg:h-[45%] min-h-[160px] relative w-full">
            <UserVideoPreview />
          </div>
        </div>

        {/* SIDE LIVE TEXT CHAT PANEL (Expandable / Toggleable) */}
        <LiveTextChatDrawer ref={chatRef} />
      </div>

      {/* 3. Bottom 3 Main Action Controls: Next, Stop/Report, Send Text Message */}
      <ActionControls onFocusChatInput={handleFocusChat} />

      {/* 4. Stop / Report & Block Confirmation Modal */}
      <ReportModal />
    </div>
  );
};

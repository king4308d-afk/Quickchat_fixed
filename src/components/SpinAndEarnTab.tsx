import React, { useState } from 'react';

const SEGMENTS = [
  { value: 10, color: '#EF4444' },
  { value: 50, color: '#3B82F6' },
  { value: 15, color: '#10B981' },
  { value: 100, color: '#F59E0B' },
  { value: 20, color: '#8B5CF6' },
  { value: 500, color: '#EC4899' },
  { value: 5, color: '#0B6D4' },
  { value: 200, color: '#6366F1' },
];

export const SpinAndEarnTab: React.FC = () => {
  const [coins, setCoins] = useState(100);
  const [spinsLeft, setSpinsLeft] = useState(5);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [rewardMessage, setRewardMessage] = useState<string | null>(null);

  const [showVideoAd, setShowVideoAd] = useState(false);
  const [videoEnded, setVideoEnded] = useState(false);

  const handleSpinClick = () => {
    if (isSpinning || spinsLeft <= 0) return;
    setShowVideoAd(true);
    setVideoEnded(false);
  };

  const executeSpin = () => {
    setIsSpinning(true);
    const randomSegment = Math.floor(Math.random() * SEGMENTS.length);
    const degreePerSegment = 360 / SEGMENTS.length;
    const targetRotation = rotation + 1800 + (randomSegment * degreePerSegment);
    
    setRotation(targetRotation);

    setTimeout(() => {
      setIsSpinning(false);
      const wonCoins = SEGMENTS[randomSegment].value;
      setCoins(prev => prev + wonCoins);
      setSpinsLeft(prev => prev - 1);
      setRewardMessage(`Aapne jeete ${wonCoins} coins! 🎉`);
    }, 4000);
  };

  return (
    <div className="p-4 max-w-md mx-auto text-center">
      <h2 className="text-2xl font-bold mb-2">Spin & Earn</h2>
      <p className="text-sm text-gray-400 mb-4">Bache hue spins: {spinsLeft}</p>
      <p className="text-lg font-semibold mb-6">Aapke Coins: {coins}</p>

      {/* Wheel Simulation Box */}
      <div className="relative w-64 h-64 mx-auto rounded-full border-4 border-amber-400 flex items-center justify-center overflow-hidden mb-6 bg-gray-900 shadow-lg"
           style={{ transform: `rotate(${rotation}deg)`, transition: 'transform 4s cubic-bezier(0.15, 0.90, 0.15, 1)' }}>
        <span className="text-white font-bold">SPIN WHEEL</span>
      </div>

      <button
        onClick={handleSpinClick}
        disabled={isSpinning || spinsLeft <= 0}
        className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-xl shadow-lg transition"
      >
        {isSpinning ? 'Spin ho raha hai...' : 'Spin Now (Watch Ad)'}
      </button>

      {rewardMessage && (
        <div className="mt-4 p-3 bg-emerald-800 text-white rounded-lg font-medium">
          {rewardMessage}
        </div>
      )}

      {/* Video Ad Modal */}
      {showVideoAd && (
        <div className="fixed inset-0 bg-black/80 z-50 flex flex-col items-center justify-center p-4">
          <div className="bg-gray-800 p-4 rounded-xl max-w-md w-full text-center">
            <h3 className="text-lg font-bold text-white mb-2">Rewarded Ad (AdMob Simulation)</h3>
            <p className="text-xs text-gray-400 mb-4">Ad Unit ID: ca-app-pub-3052800627732979/6149180726</p>
            
            <div className="w-full h-48 bg-black rounded mb-4 overflow-hidden flex items-center justify-center">
              <video 
                className="w-full h-full object-cover"
                src="https://www.w3schools.com/html/mov_bbb.mp4" 
                controls={false}
                autoPlay
                onEnded={() => setVideoEnded(true)}
              />
            </div>

            <button
              disabled={!videoEnded}
              onClick={() => {
                setShowVideoAd(false);
                executeSpin();
              }}
              className={`w-full py-2.5 rounded-xl font-bold transition ${
                videoEnded 
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-black cursor-pointer' 
                  : 'bg-gray-700 text-gray-400 cursor-not-allowed'
              }`}
            >
              {videoEnded ? 'Claim Spin & Continue' : 'Watch ad completely...'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
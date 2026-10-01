import React, { useState, useEffect } from 'react';
import { motion, PanInfo, useMotionValue, useTransform } from 'motion/react';
import { UserProfile } from '../types';
import { CheckCircle2, MapPin, Briefcase, Info, ChevronLeft, ChevronRight } from 'lucide-react';

interface SwipeCardProps {
  profile: UserProfile;
  onSwipe: (direction: 'left' | 'right' | 'up') => void;
  onOpenDetails: (profile: UserProfile) => void;
  isTopCard: boolean;
  forcedSwipeDirection?: 'left' | 'right' | 'up' | null;
}

export const SwipeCard: React.FC<SwipeCardProps> = ({
  profile,
  onSwipe,
  onOpenDetails,
  isTopCard,
  forcedSwipeDirection
}) => {
  const [photoIndex, setPhotoIndex] = useState(0);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Reset photo index if profile changes
  useEffect(() => {
    setPhotoIndex(0);
  }, [profile.id]);

  // Dynamic transforms based on drag
  const rotate = useTransform(x, [-250, 0, 250], [-18, 0, 18]);
  const likeOpacity = useTransform(x, [15, 90], [0, 1]);
  const nopeOpacity = useTransform(x, [-15, -90], [0, 1]);
  const superLikeOpacity = useTransform(y, [-15, -90], [0, 1]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    const thresholdX = 85;
    const thresholdY = 90;
    const velocityThreshold = 280;

    if (info.offset.y < -thresholdY || info.velocity.y < -velocityThreshold) {
      onSwipe('up');
    } else if (info.offset.x > thresholdX || info.velocity.x > velocityThreshold) {
      onSwipe('right');
    } else if (info.offset.x < -thresholdX || info.velocity.x < -velocityThreshold) {
      onSwipe('left');
    }
  };

  const nextPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (photoIndex < profile.photos.length - 1) {
      setPhotoIndex(photoIndex + 1);
    }
  };

  const prevPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (photoIndex > 0) {
      setPhotoIndex(photoIndex - 1);
    }
  };

  // Determine animation target based on forced programmatic swipe or standard idle
  const getAnimateProps = () => {
    if (forcedSwipeDirection === 'right') {
      return { x: 500, rotate: 22, opacity: 0, transition: { duration: 0.22, ease: 'easeOut' } };
    }
    if (forcedSwipeDirection === 'left') {
      return { x: -500, rotate: -22, opacity: 0, transition: { duration: 0.22, ease: 'easeOut' } };
    }
    if (forcedSwipeDirection === 'up') {
      return { y: -500, opacity: 0, transition: { duration: 0.22, ease: 'easeOut' } };
    }
    return {
      x: 0,
      scale: isTopCard ? 1 : 0.95,
      y: isTopCard ? 0 : 12,
      opacity: 1,
      transition: { duration: 0.2 }
    };
  };

  return (
    <motion.div
      style={isTopCard && !forcedSwipeDirection ? { x, y, rotate } : {}}
      drag={isTopCard && !forcedSwipeDirection ? true : false}
      dragElastic={0.65}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      onDragEnd={isTopCard && !forcedSwipeDirection ? handleDragEnd : undefined}
      initial={{ scale: isTopCard ? 0.96 : 0.92, y: isTopCard ? 0 : 12, opacity: 0.8 }}
      animate={getAnimateProps()}
      exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.2 } }}
      className="absolute inset-0 w-full h-full rounded-3xl overflow-hidden shadow-2xl bg-neutral-900 select-none cursor-grab active:cursor-grabbing border border-black/10 touch-none"
    >
      {/* Background Image */}
      <img
        src={profile.photos[photoIndex] || profile.photos[0]}
        alt={profile.name}
        referrerPolicy="no-referrer"
        className="w-full h-full object-cover pointer-events-none"
      />

      {/* Dark gradient for text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-black/30 pointer-events-none" />

      {/* Story / Photo indicators at top */}
      {profile.photos.length > 1 && (
        <div className="absolute top-3 left-4 right-4 flex gap-1.5 z-20">
          {profile.photos.map((_, idx) => (
            <div
              key={idx}
              className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                idx === photoIndex ? 'bg-white shadow' : 'bg-white/40'
              }`}
            />
          ))}
        </div>
      )}

      {/* Tap Zones to switch photos */}
      <div className="absolute inset-0 z-10 flex">
        <div
          onClick={prevPhoto}
          className="w-1/2 h-4/5 cursor-pointer group flex items-center justify-start pl-2"
        >
          {photoIndex > 0 && (
            <span className="opacity-0 group-hover:opacity-80 transition bg-black/40 text-white rounded-full p-1.5 backdrop-blur-xs">
              <ChevronLeft className="w-5 h-5" />
            </span>
          )}
        </div>
        <div
          onClick={nextPhoto}
          className="w-1/2 h-4/5 cursor-pointer group flex items-center justify-end pr-2"
        >
          {photoIndex < profile.photos.length - 1 && (
            <span className="opacity-0 group-hover:opacity-80 transition bg-black/40 text-white rounded-full p-1.5 backdrop-blur-xs">
              <ChevronRight className="w-5 h-5" />
            </span>
          )}
        </div>
      </div>

      {/* LIKE Stamp indicator */}
      {isTopCard && (
        <motion.div
          style={{ opacity: forcedSwipeDirection === 'right' ? 1 : likeOpacity }}
          className="absolute top-10 left-8 z-30 border-4 border-emerald-400 text-emerald-400 font-extrabold text-2xl sm:text-3xl px-4 py-1.5 rounded-2xl rotate-[-18deg] tracking-wider uppercase bg-emerald-950/40 backdrop-blur-xs pointer-events-none shadow-lg"
        >
          LIKE ❤️
        </motion.div>
      )}

      {/* NOPE Stamp indicator */}
      {isTopCard && (
        <motion.div
          style={{ opacity: forcedSwipeDirection === 'left' ? 1 : nopeOpacity }}
          className="absolute top-10 right-8 z-30 border-4 border-rose-500 text-rose-500 font-extrabold text-2xl sm:text-3xl px-4 py-1.5 rounded-2xl rotate-[18deg] tracking-wider uppercase bg-rose-950/40 backdrop-blur-xs pointer-events-none shadow-lg"
        >
          NOPE ✖
        </motion.div>
      )}

      {/* SUPER LIKE Stamp indicator */}
      {isTopCard && (
        <motion.div
          style={{ opacity: forcedSwipeDirection === 'up' ? 1 : superLikeOpacity }}
          className="absolute top-20 left-1/2 -translate-x-1/2 z-30 border-4 border-blue-400 text-blue-400 font-extrabold text-2xl sm:text-3xl px-5 py-1.5 rounded-2xl tracking-wider uppercase bg-blue-950/50 backdrop-blur-xs pointer-events-none shadow-lg"
        >
          SUPER LIKE ⭐
        </motion.div>
      )}

      {/* Bottom Profile Details Banner */}
      <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6 z-20 text-white">
        <div className="flex items-end justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white drop-shadow-sm">
                {profile.name}, {profile.age}
              </h2>
              {profile.verified && (
                <CheckCircle2 className="w-5 h-5 text-blue-400 fill-blue-400 shrink-0" />
              )}
            </div>

            <div className="flex items-center gap-3 text-white/90 text-sm mt-1.5 flex-wrap">
              <span className="flex items-center gap-1">
                <Briefcase className="w-3.5 h-3.5 text-white/70" />
                {profile.occupation}
              </span>
              <span className="text-white/40">•</span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-rose-400" />
                {profile.distanceKm} km away ({profile.location.split(',')[0]})
              </span>
            </div>

            <p className="text-white/90 text-sm mt-2.5 line-clamp-2 leading-relaxed">
              {profile.bio}
            </p>

            {/* Interest Tags */}
            <div className="flex flex-wrap gap-1.5 mt-3">
              {profile.interests.slice(0, 3).map((interest, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded-full text-xs font-medium bg-white/20 backdrop-blur-md text-white border border-white/10"
                >
                  {interest}
                </span>
              ))}
              {profile.interests.length > 3 && (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-black/40 backdrop-blur-md text-white/80">
                  +{profile.interests.length - 3}
                </span>
              )}
            </div>
          </div>

          {/* Info Modal Button */}
          <button
            id={`profile-info-btn-${profile.id}`}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenDetails(profile);
            }}
            className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md flex items-center justify-center text-white shrink-0 shadow transition active:scale-95 cursor-pointer"
            title="Pura profile dekhein"
          >
            <Info className="w-5 h-5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

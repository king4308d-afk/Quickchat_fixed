import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { useDating } from '../context/DatingContext';
import {
  X,
  Heart,
  CheckCircle2,
  MapPin,
  Briefcase,
  Sparkles,
  Award,
  ChevronLeft,
  ChevronRight,
  MessageCircle
} from 'lucide-react';

interface ProfileDetailModalProps {
  profile: UserProfile | null;
  onClose: () => void;
  onOpenChatWithProfile?: (profileId: string) => void;
}

export const ProfileDetailModal: React.FC<ProfileDetailModalProps> = ({
  profile,
  onClose,
  onOpenChatWithProfile
}) => {
  const { swipeRight, swipeLeft, matches } = useDating();
  const [photoIndex, setPhotoIndex] = useState(0);

  useEffect(() => {
    setPhotoIndex(0);
  }, [profile?.id]);

  if (!profile) return null;

  const isMatched = matches.some(m => m.id === profile.id);

  const handleLike = () => {
    swipeRight(profile.id);
    onClose();
  };

  const handlePass = () => {
    swipeLeft(profile.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-3xl overflow-hidden shadow-2xl my-auto max-h-[90vh] flex flex-col border border-gray-200">
        {/* Close Button */}
        <button
          id="close-profile-detail-btn"
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-30 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition backdrop-blur-md cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Photo Carousel */}
        <div className="relative h-80 sm:h-96 w-full bg-neutral-900 shrink-0">
          <img
            src={profile.photos[photoIndex] || profile.photos[0]}
            alt={profile.name}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />

          {/* Photo Dots */}
          {profile.photos.length > 1 && (
            <div className="absolute top-3 left-4 right-16 flex gap-1.5 z-20">
              {profile.photos.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1 flex-1 rounded-full transition-all ${
                    idx === photoIndex ? 'bg-white' : 'bg-white/40'
                  }`}
                />
              ))}
            </div>
          )}

          {/* Previous / Next buttons */}
          {profile.photos.length > 1 && (
            <>
              {photoIndex > 0 && (
                <button
                  type="button"
                  onClick={() => setPhotoIndex(photoIndex - 1)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}
              {photoIndex < profile.photos.length - 1 && (
                <button
                  type="button"
                  onClick={() => setPhotoIndex(photoIndex + 1)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}
            </>
          )}

          {/* Name & Age Overlay */}
          <div className="absolute bottom-4 left-6 right-6 text-white">
            <div className="flex items-center gap-2">
              <h2 className="text-3xl font-bold">{profile.name}, {profile.age}</h2>
              {profile.verified && (
                <CheckCircle2 className="w-5 h-5 text-blue-400 fill-blue-400" />
              )}
            </div>
            <p className="text-white/80 text-sm mt-1 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-rose-400" />
              <span>{profile.location} ({profile.distanceKm} km door)</span>
            </p>
          </div>
        </div>

        {/* Scrollable Profile Details Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Occupation & Education */}
          <div className="flex items-center gap-4 text-sm text-gray-700 bg-gray-50 p-3.5 rounded-2xl">
            <Briefcase className="w-5 h-5 text-rose-500 shrink-0" />
            <div>
              <p className="font-semibold text-gray-900">{profile.occupation}</p>
              {profile.company && <p className="text-xs text-gray-500">{profile.company}</p>}
            </div>
          </div>

          {/* Bio */}
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
              Bio / Mere Baare Mein
            </h3>
            <p className="text-gray-800 text-sm sm:text-base leading-relaxed whitespace-pre-line">
              {profile.bio}
            </p>
          </div>

          {/* Lifestyle Info Badges */}
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5">
              Lifestyle & Basics
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-medium text-gray-700">
              {profile.lookingFor && (
                <div className="p-2.5 bg-rose-50/60 rounded-xl border border-rose-100/60">
                  <span className="text-[10px] text-gray-400 block">Looking For</span>
                  <span className="text-rose-700 font-semibold">{profile.lookingFor}</span>
                </div>
              )}
              {profile.zodiac && (
                <div className="p-2.5 bg-purple-50/60 rounded-xl border border-purple-100/60">
                  <span className="text-[10px] text-gray-400 block">Zodiac</span>
                  <span className="text-purple-700 font-semibold">{profile.zodiac}</span>
                </div>
              )}
              {profile.exercise && (
                <div className="p-2.5 bg-emerald-50/60 rounded-xl border border-emerald-100/60">
                  <span className="text-[10px] text-gray-400 block">Fitness</span>
                  <span className="text-emerald-700 font-semibold">{profile.exercise}</span>
                </div>
              )}
              {profile.drinking && (
                <div className="p-2.5 bg-amber-50/60 rounded-xl border border-amber-100/60">
                  <span className="text-[10px] text-gray-400 block">Drinking</span>
                  <span className="text-amber-700 font-semibold">{profile.drinking}</span>
                </div>
              )}
              {profile.height && (
                <div className="p-2.5 bg-blue-50/60 rounded-xl border border-blue-100/60">
                  <span className="text-[10px] text-gray-400 block">Height</span>
                  <span className="text-blue-700 font-semibold">{profile.height}</span>
                </div>
              )}
            </div>
          </div>

          {/* Interests & Passions */}
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5">
              Shauk & Passions
            </h3>
            <div className="flex flex-wrap gap-2">
              {profile.interests.map((interest, i) => (
                <span
                  key={i}
                  className="px-3.5 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 flex items-center gap-1.5"
                >
                  <Sparkles className="w-3 h-3 text-rose-500" />
                  {interest}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Action Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-center gap-4">
          {isMatched ? (
            <button
              id="detail-open-chat-btn"
              type="button"
              onClick={() => {
                onClose();
                if (onOpenChatWithProfile) onOpenChatWithProfile(profile.id);
              }}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-rose-500 to-pink-600 text-white font-semibold rounded-2xl shadow-md flex items-center justify-center gap-2 hover:from-rose-600 hover:to-pink-700 cursor-pointer"
            >
              <MessageCircle className="w-5 h-5" />
              <span>Chat Kholiye</span>
            </button>
          ) : (
            <>
              <button
                id="detail-pass-btn"
                type="button"
                onClick={handlePass}
                className="flex-1 py-3 px-4 border border-rose-200 text-rose-600 font-semibold rounded-2xl hover:bg-rose-50 flex items-center justify-center gap-2 cursor-pointer transition"
              >
                <X className="w-5 h-5" />
                <span>Pass</span>
              </button>
              <button
                id="detail-like-btn"
                type="button"
                onClick={handleLike}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-rose-500 to-pink-600 text-white font-semibold rounded-2xl shadow-md flex items-center justify-center gap-2 hover:from-rose-600 hover:to-pink-700 cursor-pointer transition"
              >
                <Heart className="w-5 h-5 fill-white" />
                <span>Like Profile</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

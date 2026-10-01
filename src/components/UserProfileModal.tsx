import React, { useState, useEffect } from 'react';
import { useDating } from '../context/DatingContext';
import {
  X,
  User,
  Sliders,
  LogOut,
  MapPin,
  Briefcase,
  Sparkles,
  Check,
  RotateCcw,
  ShieldCheck
} from 'lucide-react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'profile' | 'preferences';
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'profile'
}) => {
  const { currentUser, updateUserProfile, logout, quickDemoLogin } = useDating();
  const [activeTab, setActiveTab] = useState<'profile' | 'preferences'>(initialTab);

  // Form states initialized unconditionally
  const [name, setName] = useState(currentUser?.name || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [occupation, setOccupation] = useState(currentUser?.occupation || '');
  const [location, setLocation] = useState(currentUser?.location || '');

  // Preference states
  const [interestedIn, setInterestedIn] = useState<'male' | 'female' | 'everyone'>(
    currentUser?.preferences?.interestedIn || 'everyone'
  );
  const [minAge, setMinAge] = useState(currentUser?.preferences?.ageRange?.[0] ?? 20);
  const [maxAge, setMaxAge] = useState(currentUser?.preferences?.ageRange?.[1] ?? 35);
  const [maxDistance, setMaxDistance] = useState(currentUser?.preferences?.maxDistanceKm ?? 50);

  const [savedSuccess, setSavedSuccess] = useState(false);

  // Keep state in sync whenever currentUser updates or modal opens
  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name);
      setBio(currentUser.bio);
      setOccupation(currentUser.occupation);
      setLocation(currentUser.location);
      setInterestedIn(currentUser.preferences.interestedIn);
      setMinAge(currentUser.preferences.ageRange[0]);
      setMaxAge(currentUser.preferences.ageRange[1]);
      setMaxDistance(currentUser.preferences.maxDistanceKm);
    }
  }, [currentUser, isOpen]);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab, isOpen]);

  if (!isOpen || !currentUser) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile({
      name,
      bio,
      occupation,
      location,
      preferences: {
        interestedIn,
        ageRange: [minAge, maxAge],
        maxDistanceKm: maxDistance
      }
    });
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-3xl overflow-hidden shadow-2xl my-auto max-h-[90vh] flex flex-col border border-gray-200">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-rose-500 to-pink-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full p-0.5 bg-white/30">
              <img
                src={currentUser.photos[0]}
                alt={currentUser.name}
                referrerPolicy="no-referrer"
                className="w-full h-full rounded-full object-cover"
              />
            </div>
            <div>
              <h2 className="font-bold text-lg flex items-center gap-1.5">
                <span>{currentUser.name}</span>
                <ShieldCheck className="w-4 h-4 text-white fill-white/20" />
              </h2>
              <p className="text-rose-100 text-xs">{currentUser.email}</p>
            </div>
          </div>

          <button
            id="close-user-modal-btn"
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-gray-100 p-2 bg-gray-50">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-xl transition ${
              activeTab === 'profile'
                ? 'bg-white text-rose-600 shadow-xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Mera Profile
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preferences')}
            className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-xl transition ${
              activeTab === 'preferences'
                ? 'bg-white text-rose-600 shadow-xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Discovery Filters
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {activeTab === 'profile' ? (
            <>
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Naam
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Bio
                </label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                    Profession / Kaam
                  </label>
                  <input
                    type="text"
                    value={occupation}
                    onChange={(e) => setOccupation(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                    Location
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                  />
                </div>
              </div>

              {/* Demo Account Switcher */}
              <div className="pt-4 border-t border-gray-100">
                <p className="text-xs font-semibold text-gray-500 mb-2">Test Dusra Account:</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => quickDemoLogin('rohit@dating.app')}
                    className={`flex-1 p-2 text-xs font-medium rounded-xl border transition ${
                      currentUser.email === 'rohit@dating.app'
                        ? 'border-rose-500 bg-rose-50 text-rose-700 font-bold'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    Rohit (Male, 26)
                  </button>
                  <button
                    type="button"
                    onClick={() => quickDemoLogin('priya@dating.app')}
                    className={`flex-1 p-2 text-xs font-medium rounded-xl border transition ${
                      currentUser.email === 'priya@dating.app'
                        ? 'border-rose-500 bg-rose-50 text-rose-700 font-bold'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    Priya (Female, 25)
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Discovery Filters Tab */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                  Kisme interested hain (Looking For)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['female', 'male', 'everyone'] as const).map(option => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setInterestedIn(option)}
                      className={`py-2 text-xs font-semibold rounded-xl border capitalize transition ${
                        interestedIn === option
                          ? 'border-rose-500 bg-rose-50 text-rose-600'
                          : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {option === 'everyone' ? 'Everyone' : option === 'female' ? 'Women' : 'Men'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5 text-xs font-semibold text-gray-700">
                  <span className="uppercase tracking-wider">Age Range</span>
                  <span className="text-rose-600 font-bold">{minAge} - {maxAge} years</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[11px] text-gray-500">Min Age: {minAge}</span>
                    <input
                      type="range"
                      min={18}
                      max={maxAge}
                      value={minAge}
                      onChange={(e) => setMinAge(Number(e.target.value))}
                      className="w-full accent-rose-500"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-gray-500">Max Age: {maxAge}</span>
                    <input
                      type="range"
                      min={minAge}
                      max={55}
                      value={maxAge}
                      onChange={(e) => setMaxAge(Number(e.target.value))}
                      className="w-full accent-rose-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5 text-xs font-semibold text-gray-700">
                  <span className="uppercase tracking-wider">Maximum Distance</span>
                  <span className="text-rose-600 font-bold">{maxDistance} km</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={100}
                  step={5}
                  value={maxDistance}
                  onChange={(e) => setMaxDistance(Number(e.target.value))}
                  className="w-full accent-rose-500"
                />
              </div>
            </>
          )}

          {/* Footer Actions */}
          <div className="pt-4 border-t border-gray-100 flex items-center justify-between gap-3">
            <button
              id="logout-btn"
              type="button"
              onClick={() => {
                logout();
                onClose();
              }}
              className="px-4 py-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl flex items-center gap-1.5 transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out</span>
            </button>

            <button
              id="save-profile-btn"
              type="submit"
              className="px-6 py-2.5 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white text-xs font-semibold rounded-xl shadow-md flex items-center gap-1.5 transition cursor-pointer"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Saved!</span>
                </>
              ) : (
                <span>Save Changes</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

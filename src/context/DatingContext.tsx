import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { CurrentUser, UserProfile, ChatMessage, MatchItem } from '../types';
import { INITIAL_PROFILES, DEMO_USERS, SIMULATED_REPLIES } from '../data/mockProfiles';

interface DatingContextType {
  currentUser: CurrentUser | null;
  profiles: UserProfile[];
  currentProfile: UserProfile | null;
  currentIndex: number;
  matches: MatchItem[];
  activeMatch: MatchItem | null;
  newMatchModal: UserProfile | null;
  messages: Record<string, ChatMessage[]>;
  isTyping: Record<string, boolean>;
  login: (email: string, password: string) => { success: boolean; error?: string };
  register: (userData: Partial<CurrentUser> & { email: string; password: string; name: string }) => { success: boolean; error?: string };
  logout: () => void;
  quickDemoLogin: (email: string) => void;
  swipeRight: (profileId: string) => void;
  swipeLeft: (profileId: string) => void;
  superLike: (profileId: string) => void;
  undoSwipe: () => void;
  dismissMatchModal: () => void;
  selectMatchForChat: (match: MatchItem) => void;
  sendMessage: (matchId: string, text: string) => void;
  updateUserProfile: (updated: Partial<CurrentUser>) => void;
  resetDeck: () => void;
}

const DatingContext = createContext<DatingContextType | undefined>(undefined);

const STORAGE_USERS_KEY = 'dating_app_users_v1';
const STORAGE_CURRENT_USER_KEY = 'dating_app_active_user_v1';
const STORAGE_MESSAGES_KEY = 'dating_app_messages_v1';

export const DatingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Registered users in persistent storage
  const [usersDb, setUsersDb] = useState<Record<string, { password: string; user: CurrentUser }>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_USERS_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    // initialize with demo users
    const initialDb: Record<string, { password: string; user: CurrentUser }> = {};
    (DEMO_USERS as any[]).forEach((u, index) => {
      if (u && u.email) {
        initialDb[u.email.toLowerCase()] = {
          password: u.password || 'demo123',
          user: {
            id: `user-${index + 1}`,
            email: u.email,
            name: u.name,
            age: u.age,
            gender: u.gender,
            bio: u.bio,
            occupation: u.occupation,
            location: u.location,
            distanceKm: u.distanceKm,
            photos: u.photos || [],
            interests: u.interests || [],
            verified: !!u.verified,
            likedProfileIds: [],
            passedProfileIds: [],
            superLikedProfileIds: [],
            matchedProfileIds: [],
            preferences: {
              interestedIn: u.gender === 'male' ? 'female' : 'male',
              ageRange: [20, 32],
              maxDistanceKm: 30
            }
          }
        };
      }
    });
    return initialDb;
  });

  // Active logged in user
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_CURRENT_USER_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    // default to Rohit Malhotra so app immediately loads in active state
    return usersDb['rohit@dating.app']?.user || null;
  });

  // Chat messages by match ID
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_MESSAGES_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    // Seed initial message history for pre-matched profiles
    return {
      'profile-1': [
        {
          id: 'msg-seed-1',
          conversationId: 'profile-1',
          senderId: 'profile-1',
          recipientId: 'user-1',
          text: 'Hey! Loved seeing an architect who appreciates good coffee ☕ How was your day?',
          timestamp: new Date(Date.now() - 3600000 * 2).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: 'read'
        }
      ],
      'profile-3': [
        {
          id: 'msg-seed-2',
          conversationId: 'profile-3',
          senderId: 'profile-3',
          recipientId: 'user-1',
          text: 'Hi Rohit! Your hiking pictures are stunning. Which trek is that in your photo?',
          timestamp: new Date(Date.now() - 3600000 * 5).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: 'read'
        }
      ]
    };
  });

  const [activeMatch, setActiveMatch] = useState<MatchItem | null>(null);
  const [newMatchModal, setNewMatchModal] = useState<UserProfile | null>(null);
  const [isTyping, setIsTyping] = useState<Record<string, boolean>>({});
  const [lastSwiped, setLastSwiped] = useState<{ id: string; type: 'like' | 'pass' | 'superlike' } | null>(null);

  // Sync users DB to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(usersDb));
    } catch {
      // storage quota
    }
  }, [usersDb]);

  // Sync current user to localStorage
  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem(STORAGE_CURRENT_USER_KEY, JSON.stringify(currentUser));
        // Also update in usersDb
        setUsersDb(prev => ({
          ...prev,
          [currentUser.email.toLowerCase()]: {
            password: prev[currentUser.email.toLowerCase()]?.password || 'password123',
            user: currentUser
          }
        }));
      } else {
        localStorage.removeItem(STORAGE_CURRENT_USER_KEY);
      }
    } catch {
      // storage quota
    }
  }, [currentUser]);

  // Sync messages to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_MESSAGES_KEY, JSON.stringify(messages));
    } catch {
      // storage quota
    }
  }, [messages]);

  // Filter available profiles for explore deck
  const profiles = INITIAL_PROFILES.filter(p => {
    if (!currentUser) return true;
    // Exclude already liked or passed
    const isSwiped =
      currentUser.likedProfileIds.includes(p.id) ||
      currentUser.passedProfileIds.includes(p.id) ||
      currentUser.superLikedProfileIds.includes(p.id);
    
    // Filter by preferences if specified
    if (currentUser.preferences.interestedIn !== 'everyone') {
      if (p.gender !== currentUser.preferences.interestedIn) return false;
    }
    if (p.age < currentUser.preferences.ageRange[0] || p.age > currentUser.preferences.ageRange[1]) {
      return false;
    }
    return !isSwiped;
  });

  const currentIndex = 0;
  const currentProfile = profiles.length > 0 ? profiles[0] : null;

  // Build match list
  const matches: MatchItem[] = (currentUser?.matchedProfileIds || []).map(profileId => {
    const profile = INITIAL_PROFILES.find(p => p.id === profileId) || {
      id: profileId,
      name: 'Match User',
      age: 24,
      gender: 'female',
      bio: 'Hey there!',
      occupation: 'Creative',
      location: 'Nearby',
      distanceKm: 4,
      photos: ['https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80'],
      interests: ['Music', 'Coffee'],
      verified: true
    };

    const thread = messages[profileId] || [];
    const last = thread.length > 0 ? thread[thread.length - 1] : undefined;

    return {
      id: profileId,
      profile,
      matchedAt: 'Recently',
      lastMessage: last
        ? {
            text: last.text,
            timestamp: last.timestamp,
            senderId: last.senderId,
            isUnread: last.senderId !== currentUser?.id && last.status !== 'read'
          }
        : undefined
    };
  });

  // Login handler
  const login = (email: string, password: string) => {
    const record = usersDb[email.trim().toLowerCase()];
    if (!record) {
      return { success: false, error: 'Koi account nahi mila iss email ke saath. Kripya Sign Up karein.' };
    }
    if (record.password !== password) {
      return { success: false, error: 'Galat password. Kripya dobara koshish karein.' };
    }
    setCurrentUser(record.user);
    return { success: true };
  };

  // Register handler
  const register = (userData: Partial<CurrentUser> & { email: string; password: string; name: string }) => {
    const emailKey = userData.email.trim().toLowerCase();
    if (usersDb[emailKey]) {
      return { success: false, error: 'Yeh email pehle se registered hai. Kripya login karein.' };
    }

    const newUser: CurrentUser = {
      id: `user-${Date.now()}`,
      email: userData.email.trim(),
      name: userData.name.trim(),
      age: userData.age || 25,
      gender: userData.gender || 'male',
      bio: userData.bio || 'Living life one adventure at a time.',
      occupation: userData.occupation || 'Professional',
      location: userData.location || 'Mumbai',
      distanceKm: 0,
      photos: userData.photos?.length
        ? userData.photos
        : ['https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1000&q=80'],
      interests: userData.interests || ['Music', 'Travel', 'Coffee', 'Fitness'],
      verified: true,
      likedProfileIds: [],
      passedProfileIds: [],
      superLikedProfileIds: [],
      matchedProfileIds: ['profile-1'], // Give new user a starter match to test chat right away!
      preferences: {
        interestedIn: userData.gender === 'male' ? 'female' : 'male',
        ageRange: [20, 35],
        maxDistanceKm: 50
      }
    };

    setUsersDb(prev => ({
      ...prev,
      [emailKey]: {
        password: userData.password,
        user: newUser
      }
    }));
    setCurrentUser(newUser);
    return { success: true };
  };

  const logout = () => {
    setCurrentUser(null);
    setActiveMatch(null);
    setNewMatchModal(null);
  };

  const quickDemoLogin = (email: string) => {
    const record = usersDb[email.toLowerCase()];
    if (record) {
      setCurrentUser(record.user);
    }
  };

  // Swiping Right (Like)
  const swipeRight = (profileId: string) => {
    if (!currentUser) return;
    setLastSwiped({ id: profileId, type: 'like' });

    // Determine if match happens (high probability for exciting demo: 80% or guaranteed for profiles 1, 2, 3, 5)
    const isMatch = true; // In dating app demo, user right swipe matches to allow immediate chat!
    const targetProfile = INITIAL_PROFILES.find(p => p.id === profileId);

    setCurrentUser(prev => {
      if (!prev) return null;
      const updatedLiked = [...prev.likedProfileIds, profileId];
      const updatedMatched = isMatch && !prev.matchedProfileIds.includes(profileId)
        ? [profileId, ...prev.matchedProfileIds]
        : prev.matchedProfileIds;

      return {
        ...prev,
        likedProfileIds: updatedLiked,
        matchedProfileIds: updatedMatched
      };
    });

    if (isMatch && targetProfile) {
      // Trigger match celebration modal!
      setTimeout(() => {
        setNewMatchModal(targetProfile);
      }, 300);
    }
  };

  // Swiping Left (Pass)
  const swipeLeft = (profileId: string) => {
    if (!currentUser) return;
    setLastSwiped({ id: profileId, type: 'pass' });

    setCurrentUser(prev => {
      if (!prev) return null;
      return {
        ...prev,
        passedProfileIds: [...prev.passedProfileIds, profileId]
      };
    });
  };

  // Super Like
  const superLike = (profileId: string) => {
    if (!currentUser) return;
    setLastSwiped({ id: profileId, type: 'superlike' });

    const targetProfile = INITIAL_PROFILES.find(p => p.id === profileId);

    setCurrentUser(prev => {
      if (!prev) return null;
      const updatedLiked = [...prev.likedProfileIds, profileId];
      const updatedSuper = [...prev.superLikedProfileIds, profileId];
      const updatedMatched = !prev.matchedProfileIds.includes(profileId)
        ? [profileId, ...prev.matchedProfileIds]
        : prev.matchedProfileIds;

      return {
        ...prev,
        likedProfileIds: updatedLiked,
        superLikedProfileIds: updatedSuper,
        matchedProfileIds: updatedMatched
      };
    });

    if (targetProfile) {
      setTimeout(() => {
        setNewMatchModal(targetProfile);
      }, 300);
    }
  };

  // Undo / Rewind Swipe
  const undoSwipe = () => {
    if (!currentUser || !lastSwiped) return;
    const { id } = lastSwiped;

    setCurrentUser(prev => {
      if (!prev) return null;
      return {
        ...prev,
        likedProfileIds: prev.likedProfileIds.filter(pid => pid !== id),
        passedProfileIds: prev.passedProfileIds.filter(pid => pid !== id),
        superLikedProfileIds: prev.superLikedProfileIds.filter(pid => pid !== id),
        matchedProfileIds: prev.matchedProfileIds.filter(pid => pid !== id)
      };
    });
    setLastSwiped(null);
  };

  // Reset deck so user can keep swiping if they exhausted profiles
  const resetDeck = () => {
    if (!currentUser) return;
    setCurrentUser(prev => {
      if (!prev) return null;
      return {
        ...prev,
        likedProfileIds: [],
        passedProfileIds: [],
        superLikedProfileIds: []
      };
    });
  };

  const dismissMatchModal = () => {
    setNewMatchModal(null);
  };

  const selectMatchForChat = (match: MatchItem) => {
    setActiveMatch(match);
    setNewMatchModal(null);

    // Mark messages as read
    setMessages(prev => {
      const thread = prev[match.id] || [];
      const updatedThread = thread.map(m => (m.status !== 'read' ? { ...m, status: 'read' as const } : m));
      return {
        ...prev,
        [match.id]: updatedThread
      };
    });
  };

  // Send message in chat with auto-reply simulation
  const sendMessage = useCallback((matchId: string, text: string) => {
    if (!currentUser || !text.trim()) return;

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      conversationId: matchId,
      senderId: currentUser.id,
      recipientId: matchId,
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'delivered'
    };

    setMessages(prev => ({
      ...prev,
      [matchId]: [...(prev[matchId] || []), newMsg]
    }));

    // Simulate match typing and responding realistically
    setIsTyping(prev => ({ ...prev, [matchId]: true }));

    const repliesList = (Array.isArray(SIMULATED_REPLIES) && SIMULATED_REPLIES.length > 0)
      ? SIMULATED_REPLIES
      : ['Hey! Great connecting with you.'];
    const randomReply = repliesList[Math.floor(Math.random() * repliesList.length)];

    setTimeout(() => {
      setIsTyping(prev => ({ ...prev, [matchId]: false }));

      const replyMsg: ChatMessage = {
        id: `reply-${Date.now()}`,
        conversationId: matchId,
        senderId: matchId,
        recipientId: currentUser.id,
        text: randomReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'read'
      };

      setMessages(prev => ({
        ...prev,
        [matchId]: [...(prev[matchId] || []), replyMsg]
      }));
    }, 1800);
  }, [currentUser]);

  const updateUserProfile = (updated: Partial<CurrentUser>) => {
    setCurrentUser(prev => {
      if (!prev) return null;
      return { ...prev, ...updated };
    });
  };

  return (
    <DatingContext.Provider
      value={{
        currentUser,
        profiles,
        currentProfile,
        currentIndex,
        matches,
        activeMatch,
        newMatchModal,
        messages,
        isTyping,
        login,
        register,
        logout,
        quickDemoLogin,
        swipeRight,
        swipeLeft,
        superLike,
        undoSwipe,
        dismissMatchModal,
        selectMatchForChat,
        sendMessage,
        updateUserProfile,
        resetDeck
      }}
    >
      {children}
    </DatingContext.Provider>
  );
};

export const useDating = (): DatingContextType => {
  const context = useContext(DatingContext);
  if (!context) {
    throw new Error('useDating must be used within a DatingProvider');
  }
  return context;
};

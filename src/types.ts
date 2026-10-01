export type GenderFilter = 'male' | 'female' | 'both';
export type NavigationTab = 'video' | 'chat' | 'spin' | 'profile';

export interface FemalePass {
  isActive: boolean;
  callsRemaining: number; // Max 15 calls
  expiresAt: number; // Timestamp (ms) for 3 days duration (72h)
  activatedAt: number; // Timestamp (ms) when pass was activated
}

export interface AppUser {
  id: string;
  uid?: string;
  name: string;
  email: string;
  avatar: string;
  uniqueUserId: string; // e.g., 'LR-89241'
  gender: 'male' | 'female';
  coins: number;
  totalCoinsWon: number;
  totalCallsMade: number;
  joinedDate: string;
  spinCount?: number;
  dailySpinsRemaining: number;
  lastSpinDate: string;
  lastSpinTimestamp?: number;
  femalePass?: FemalePass | null;
}

export interface VideoPartner {
  id: string;
  userId: string;
  name: string;
  age: number;
  gender: 'male' | 'female';
  country: string;
  countryFlag: string;
  city: string;
  avatar: string;
  bio: string;
  interests: string[];
  sampleVideo?: string;
  isOnline: boolean;
  statusMessage?: string;
}

export interface ChatMessage {
  id: string;
  senderId?: string;
  recipientId?: string;
  text: string;
  timestamp: string;
  senderName?: string;
  isMine?: boolean;
  sender?: 'me' | 'stranger' | 'system';
  conversationId?: string;
  status?: 'sending' | 'sent' | 'delivered' | 'read';
  mediaType?: 'image' | 'video';
  mediaUrl?: string;
  mediaName?: string;
}

export interface Conversation {
  id: string;
  partnerId: string;
  partnerUserId: string;
  partnerName: string;
  partnerAvatar: string;
  partnerGender: 'male' | 'female';
  partnerOnline: boolean;
  partnerFlag: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  messages: ChatMessage[];
}

export interface SpinPrize {
  coins: number;
  color: string;
  probability: number;
  label: string;
}

// Backward compatibility types for legacy unused files
export type ConnectionStatus = 'idle' | 'searching' | 'connected' | 'disconnected';
export interface StrangerProfile {
  id: string;
  name: string;
  age: number;
  gender: string;
  country: string;
  countryCode: string;
  countryFlag: string;
  city: string;
  bio: string;
  interests: string[];
  photoUrl: string;
  accentColor: string;
  initialGreeting: string;
  dynamicReplies: Record<string, string[]>;
  isVerifiedBadge?: boolean;
}
export interface ReportDetails {
  strangerId: string;
  strangerName: string;
  reason: string;
  timestamp: string;
}
export interface UserProfile {
  id: string;
  name: string;
  age: number;
  gender: string;
  bio: string;
  occupation: string;
  photos: string[];
  interests: string[];
  verified: boolean;
  location: string;
  distanceKm: number;
  company?: string;
  matchScore?: number;
  height?: string;
  school?: string;
  zodiac?: string;
  drinking?: string;
  exercise?: string;
  lookingFor?: string;
  instagram?: string;
}
export interface CurrentUser extends UserProfile {
  email: string;
  likedProfileIds: string[];
  passedProfileIds: string[];
  superLikedProfileIds: string[];
  matchedProfileIds: string[];
  preferences?: {
    interestedIn: 'male' | 'female' | 'everyone';
    ageRange: [number, number];
    maxDistanceKm: number;
  };
}
export interface MatchItem {
  id: string;
  profile: UserProfile;
  matchedAt: string;
}
export type ActiveTab = 'explore' | 'matches' | 'profile';


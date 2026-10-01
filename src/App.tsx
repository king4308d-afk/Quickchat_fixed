import React, { useEffect, useState } from 'react';
import { Video, MessageCircle, Disc, User as UserIcon, Copy, Edit2, Coins, Sparkles, Shield, Search, Plus, Lock, Check, X, Mail, MoreVertical, Trash2, Ban, Flag, Image as ImageIcon } from 'lucide-react';
import { addDoc, arrayRemove, arrayUnion, collection, doc, getDocs, getDoc, onSnapshot, query, setDoc, serverTimestamp, where, runTransaction } from 'firebase/firestore';
import { onAuthStateChanged, signInWithPopup, signInAnonymously, signOut, type User as FirebaseUser } from 'firebase/auth';
import { getFirebaseAuth, getFirebaseDb, createGoogleAuthProvider } from './services/firebaseConfig';

interface QuickChatUser {
  uid: string;
  name: string;
  email: string;
  avatar: string;
  userId: string;
  coins: number;
  spins: number;
}

interface RecentChat {
  chatId: string;
  otherUid: string;
  otherName: string;
  otherEmail: string;
  otherAvatar: string;
  otherUserId: string;
  otherOnline: boolean;
  otherLastSeen: number;
  lastMessage: string;
  lastSenderUid: string;
  lastMessageAt: number;
  isUnread: boolean;
}

const toTimestampMillis = (value: any) => {
  if (typeof value === 'number') return value;
  if (value?.toMillis) return value.toMillis();
  return 0;
};

const formatLastSeen = (timestamp: number) => {
  if (!timestamp) return 'Offline';
  const diff = Math.max(0, Date.now() - timestamp);
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'last seen just now';
  if (minutes === 1) return 'last seen 1 min ago';
  if (minutes < 60) return 'last seen ' + minutes + ' min ago';
  const hours = Math.floor(minutes / 60);
  if (hours === 1) return 'last seen 1 hr ago';
  if (hours < 24) return 'last seen ' + hours + ' hrs ago';
  return 'last seen ' + Math.floor(hours / 24) + ' days ago';
};

const makeStableUserId = (uid: string) => {
  let hash = 0;
  for (let i = 0; i < uid.length; i++) {
    hash = (hash * 31 + uid.charCodeAt(i)) | 0;
  }
  return '#USER' + String(Math.abs(hash) % 900000 + 100000);
};

const toQuickChatUser = (
  firebaseUser: FirebaseUser,
  profile?: Partial<QuickChatUser>
): QuickChatUser => ({
  uid: firebaseUser.uid,
  name:
    profile?.name ||
    firebaseUser.displayName ||
    (firebaseUser.isAnonymous ? 'Guest User' : 'QuickChat User'),
  email: firebaseUser.email || '',
  avatar: profile?.avatar || firebaseUser.photoURL || '',
  userId: profile?.userId || makeStableUserId(firebaseUser.uid),
  coins: typeof profile?.coins === 'number' ? profile.coins : 100,
  spins: typeof profile?.spins === 'number' ? profile.spins : 5,
});

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState('');
  const [activeTab, setActiveTab] = useState<
    'video' | 'chat' | 'spin' | 'profile'
  >('video');

  const [user, setUser] = useState<QuickChatUser>({
    uid: '',
    name: '',
    email: '',
    avatar: '',
    userId: '',
    coins: 0,
    spins: 0,
  });

  const auth = getFirebaseAuth();
  const db = getFirebaseDb();

  useEffect(() => {
    if (!auth) {
      setAuthError(
        'Firebase Authentication initialize nahi ho pa raha. Firebase configuration check karein.'
      );
      setAuthLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setIsLoggedIn(false);
        setHiddenChatIds([]);
        setBlockedUserUids([]);
        setChatMenuOpen(false);
        setUser({
          uid: '',
          name: '',
          email: '',
          avatar: '',
          userId: '',
          coins: 0,
          spins: 0,
        });
        setAuthLoading(false);
        return;
      }

      try {
        let profile: Partial<QuickChatUser> | undefined;

        if (db) {
          const profileRef = doc(db, 'users', firebaseUser.uid);
          const snapshot = await getDoc(profileRef);

          if (snapshot.exists()) {
            const profileData = snapshot.data();
            profile = profileData as Partial<QuickChatUser>;
            setHiddenChatIds(Array.isArray(profileData.hiddenChatIds) ? profileData.hiddenChatIds.map(String) : []);
            setBlockedUserUids(Array.isArray(profileData.blockedUserUids) ? profileData.blockedUserUids.map(String) : []);
          } else {
            setHiddenChatIds([]);
            setBlockedUserUids([]);
          }

          const nextUser = toQuickChatUser(firebaseUser, profile);

          const profileData: Record<string, unknown> = {
            uid: firebaseUser.uid,
            name: nextUser.name,
            email: firebaseUser.email || '',
            avatar: nextUser.avatar,
            userId: nextUser.userId,
            coins: nextUser.coins,
            spins: nextUser.spins,
            provider: firebaseUser.isAnonymous ? 'anonymous' : 'google.com',
            updatedAt: serverTimestamp(),
          };

          if (!profile?.uid) {
            profileData.createdAt = serverTimestamp();
          }

          await setDoc(profileRef, profileData, { merge: true });
          setUser(nextUser);
        } else {
          setUser(toQuickChatUser(firebaseUser));
        }

        setIsLoggedIn(true);
        setAuthError('');
      } catch (error) {
        console.error('[Auth] Profile sync failed:', error);
        setAuthError(
          'Google login ho gaya, lekin profile save nahi ho paayi. Firestore rules/config check karein.'
        );
        setUser(toQuickChatUser(firebaseUser));
        setIsLoggedIn(true);
      } finally {
        setAuthLoading(false);
      }
    });

    return unsubscribe;
  }, [auth, db]);

  const handleGuestLogin = async () => {
    if (!auth) {
      setAuthError('Firebase Authentication available nahi hai.');
      return;
    }

    setAuthError('');

    try {
      await signInAnonymously(auth);
    } catch (error: any) {
      console.error('[Guest Sign-In]', error);

      if (error?.code === 'auth/operation-not-allowed') {
        setAuthError(
          'Firebase Console mein Authentication > Sign-in method > Anonymous ko enable karein.'
        );
      } else {
        setAuthError(
          error?.message || 'Guest login failed. Dobara try karein.'
        );
      }
    }
  };

  const handleGoogleLogin = async () => {
    if (!auth) {
      setAuthError('Firebase Authentication available nahi hai.');
      return;
    }

    setAuthError('');

    try {
      await signInWithPopup(auth, createGoogleAuthProvider());
    } catch (error: any) {
      console.error('[Google Sign-In]', error);

      if (error?.code === 'auth/popup-closed-by-user') return;

      if (error?.code === 'auth/popup-blocked') {
        setAuthError(
          'Browser ne Google popup block kar diya. Popup allow karke dobara try karein.'
        );
      } else if (error?.code === 'auth/unauthorized-domain') {
        setAuthError(
          'Is website domain ko Firebase Authentication > Settings > Authorized domains mein add karein.'
        );
      } else if (error?.code === 'auth/operation-not-allowed') {
        setAuthError(
          'Firebase Console mein Google Sign-in provider enable karein.'
        );
      } else {
        setAuthError(
          error?.message || 'Google sign-in failed. Dobara try karein.'
        );
      }
    }
  };

  const handleLogout = async () => {
    if (!auth) return;

    try {
      await signOut(auth);
      setIsLoggedIn(false);
    } catch (error) {
      console.error('[Logout]', error);
      setAuthError('Sign out failed. Dobara try karein.');
    }
  };

  // Video Call States
  const [matchType, setMatchType] = useState<
    'both' | 'male' | 'female'
  >('both');
  const [isSearching, setIsSearching] = useState(false);

  // User Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] =
    useState<QuickChatUser | null>(null);
  const [searchError, setSearchError] = useState('');
  const [isUserSearching, setIsUserSearching] = useState(false);

  // Real Direct Chat States
  const [selectedChatUser, setSelectedChatUser] = useState<QuickChatUser | null>(null);
  const [recentChats, setRecentChats] = useState<RecentChat[]>([]);
  const [messages, setMessages] = useState<Array<{
  id: string;
  senderUid: string;
  senderName: string;
  text: string;
  imageUrl?: string;
  messageType?: 'text' | 'image';
  sentAt?: number;
}>>([]);
 const [messageText, setMessageText] = useState('');
const [imageSending, setImageSending] = useState(false);
const [chatLoading, setChatLoading] = useState(false);
const [chatSending, setChatSending] = useState(false);
const [chatError, setChatError] = useState('');
const [chatMenuOpen, setChatMenuOpen] = useState(false);
const [hiddenChatIds, setHiddenChatIds] = useState<string[]>([]);
const [blockedUserUids, setBlockedUserUids] = useState<string[]>([]);
const unreadCount = recentChats.filter((chat) => chat.isUnread).length;
const [presenceTick, setPresenceTick] = useState(0);
const [randomSearching, setRandomSearching] = useState(false);

  const [isFemalePassUnlocked, setIsFemalePassUnlocked] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);

  // Edit State for Profile Name and User ID
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState('');
  const [isEditingId, setIsEditingId] = useState(false);
  const [tempId, setTempId] = useState('');

  const [isSpinning, setIsSpinning] = useState(false);
  const [wheelRotation, setWheelRotation] = useState(0);

  useEffect(() => {
    setTempName(user.name);
    setTempId(user.userId);
  }, [user.name, user.userId]);

  const handleCopyId = () => {
    navigator.clipboard.writeText(user.userId);
    alert('User ID copied to clipboard!');
  };

  const handleSaveName = async () => {
    const name = tempName.trim();

    if (!name || !user.uid || !db) return;

    try {
      await setDoc(
        doc(db, 'users', user.uid),
        {
          name,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      setUser((prev) => ({ ...prev, name }));
      setIsEditingName(false);
    } catch (error) {
      console.error('[Profile] Name update failed:', error);
      alert('Name save nahi ho paaya.');
    }
  };

  const handleSaveId = async () => {
    const nextId = tempId.trim().toUpperCase();

    if (!user.uid || !db) return;

    if (!/^#USER[A-Z0-9_-]{4,16}$/.test(nextId)) {
      alert(
        'User ID #USER ke baad 4-16 letters/numbers ho. Example: #USER6969'
      );
      return;
    }

    if (nextId === user.userId) {
      setIsEditingId(false);
      return;
    }

    try {
      const usersRef = collection(db, 'users');

      const existing = await getDocs(
        query(usersRef, where('userId', '==', nextId))
      );

      const takenByOtherUser = existing.docs.some(
        (snap) => snap.id !== user.uid
      );

      if (takenByOtherUser) {
        alert(
          'Ye User ID already kisi aur user ne le rakhi hai. Dusri ID choose karo.'
        );
        return;
      }

      await setDoc(
        doc(db, 'users', user.uid),
        {
          userId: nextId,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      setUser((prev) => ({ ...prev, userId: nextId }));
      setTempId(nextId);
      setIsEditingId(false);

      alert('User ID successfully update ho gayi.');
    } catch (error) {
      console.error('[Profile] User ID update failed:', error);
      alert(
        'User ID save nahi ho paayi. Firebase/Firestore rules check karein.'
      );
    }
  };

  // User ID Search
  const handleUserSearch = async () => {
    const term = searchQuery.trim().replace(/^#/, '').toUpperCase();

    if (!term) {
      setSearchResult(null);
      setSearchError('Please enter a User ID.');
      return;
    }

    setIsUserSearching(true);
    setSearchError('');
    setSearchResult(null);

    try {
      if (!db) {
        setSearchError('Firebase database available nahi hai.');
        return;
      }

      const usersRef = collection(db, 'users');

      const result = await getDocs(
        query(usersRef, where('userId', '==', '#' + term))
      );

      if (result.empty) {
        setSearchError('User not found.');
      } else {
        const found = result.docs[0].data() as QuickChatUser;

        if (found.uid === user.uid) {
          setSearchError('Ye aapki khud ki User ID hai.');
        } else {
          setSearchResult(found);
        }
      }
    } catch (error) {
      console.error('[Search] User search failed:', error);
      setSearchError('Search failed. Firebase rules check karein.');
    } finally {
      setIsUserSearching(false);
    }
  };

  const makeChatId = (uidA: string, uidB: string) =>
    [uidA, uidB].sort().join('_');

  const handleStartRandomTextChat = async () => {
    if (!db || !user.uid || randomSearching) return;

    setRandomSearching(true);
    setChatError('');

    try {
      await setDoc(
        doc(db, 'users', user.uid),
        {
          randomStatus: 'searching',
          randomPartnerUid: '',
          randomChatId: '',
          randomRequestAt: serverTimestamp(),
        },
        { merge: true }
      );

      const waitingSnapshot = await getDocs(
        query(collection(db, 'users'), where('randomStatus', '==', 'searching'))
      );

      const candidates = waitingSnapshot.docs
        .map((snap) => ({ id: snap.id, data: snap.data() as any }))
        .filter((item) => item.id !== user.uid)
        .filter((item) => !blockedUserUids.includes(item.id))
        .filter((item) => {
          const blocked = Array.isArray(item.data.blockedUserUids)
            ? item.data.blockedUserUids.map(String)
            : [];
          return !blocked.includes(user.uid);
        });

      for (const candidate of candidates) {
        const chatId = makeChatId(user.uid, candidate.id);
        const myRef = doc(db, 'users', user.uid);
        const candidateRef = doc(db, 'users', candidate.id);

        let matched = false;

        await runTransaction(db, async (transaction) => {
          const candidateSnap = await transaction.get(candidateRef);
          const mySnap = await transaction.get(myRef);

          const candidateData = candidateSnap.data() as any;
          const myData = mySnap.data() as any;

          if (
            candidateSnap.exists() &&
            mySnap.exists() &&
            candidateData?.randomStatus === 'searching' &&
            myData?.randomStatus === 'searching'
          ) {
            transaction.set(
              candidateRef,
              {
                randomStatus: 'matched',
                randomPartnerUid: user.uid,
                randomChatId: chatId,
                randomMatchedAt: serverTimestamp(),
              },
              { merge: true }
            );

            transaction.set(
              myRef,
              {
                randomStatus: 'matched',
                randomPartnerUid: candidate.id,
                randomChatId: chatId,
                randomMatchedAt: serverTimestamp(),
              },
              { merge: true }
            );

            transaction.set(
              doc(db, 'chats', chatId),
              {
                chatId,
                participants: [user.uid, candidate.id],
                participantUserIds: [user.userId, String(candidateData?.userId || '')],
                randomChat: true,
                lastMessage: '',
                lastSenderUid: '',
                updatedAt: serverTimestamp(),
              },
              { merge: true }
            );

            matched = true;
          }
        });

        if (matched) return;
      }
    } catch (error) {
      console.error('[Random Chat] Match failed:', error);
      setRandomSearching(false);
      setChatError('Random Chat start nahi ho paayi. Dobara try karein.');
    }
  };

  const handleCancelRandomChat = async () => {
    if (!db || !user.uid) return;
    try {
      await setDoc(
        doc(db, 'users', user.uid),
        { randomStatus: 'idle', randomPartnerUid: '', randomChatId: '' },
        { merge: true }
      );
    } catch (error) {
      console.error('[Random Chat] Cancel failed:', error);
    } finally {
      setRandomSearching(false);
    }
  };

  // Watch this user's profile for a random-chat match made by another user.
  useEffect(() => {
    if (!db || !user.uid) return;

    const unsubscribe = onSnapshot(
      doc(db, 'users', user.uid),
      async (snapshot) => {
        const data = snapshot.data() as any;
        if (data?.randomStatus !== 'matched' || !data?.randomPartnerUid) return;

        try {
          const partnerSnap = await getDoc(doc(db, 'users', String(data.randomPartnerUid)));
          if (!partnerSnap.exists()) return;

          const partner = partnerSnap.data() as QuickChatUser;
          const target: QuickChatUser = {
            uid: String(partner.uid || data.randomPartnerUid),
            name: String(partner.name || 'Random User'),
            email: String(partner.email || ''),
            avatar: String(partner.avatar || ''),
            userId: String(partner.userId || ''),
            coins: typeof partner.coins === 'number' ? partner.coins : 0,
            spins: typeof partner.spins === 'number' ? partner.spins : 0,
          };

          setSelectedChatUser(target);
          setMessages([]);
          setMessageText('');
          setChatError('');
          setRandomSearching(false);
          setActiveTab('chat');

          await setDoc(
            doc(db, 'users', user.uid),
            { randomStatus: 'idle', randomPartnerUid: '', randomChatId: '' },
            { merge: true }
          );
        } catch (error) {
          console.error('[Random Chat] Match open failed:', error);
          setRandomSearching(false);
        }
      }
    );

    return () => unsubscribe();
  }, [db, user.uid]);

  const handleOpenChat = (target: QuickChatUser) => {
    if (blockedUserUids.includes(target.uid)) {
      alert('This user is blocked. Unblock the user from their chat options to chat again.');
      return;
    }
    const chatId = makeChatId(user.uid, target.uid);
    if (db && user.uid) {
      setDoc(
        doc(db, 'chats', chatId),
        { unreadFor: arrayRemove(user.uid), updatedAt: serverTimestamp() },
        { merge: true }
      ).catch((error) => console.error('[Chat] Unread clear failed:', error));
    }
    setChatMenuOpen(false);
    setSelectedChatUser(target);
    setMessages([]);
    setMessageText('');
    setChatError('');
  };

  useEffect(() => {
    if (!user.uid) return;
    const timer = window.setInterval(() => setPresenceTick((value) => value + 1), 15000);
    return () => window.clearInterval(timer);
  }, [user.uid]);

  // Real-time presence: heartbeat keeps the user online; stale heartbeat becomes offline.
  useEffect(() => {
    if (!db || !user.uid) return;

    const presenceRef = doc(db, 'users', user.uid);

    const markOnline = () => {
      setDoc(
        presenceRef,
        { online: true, lastSeen: serverTimestamp() },
        { merge: true }
      ).catch((error) => console.error('[Presence] Online update failed:', error));
    };

    const markOffline = () => {
      setDoc(
        presenceRef,
        { online: false, lastSeen: serverTimestamp() },
        { merge: true }
      ).catch((error) => console.error('[Presence] Offline update failed:', error));
    };

    markOnline();
    const intervalId = window.setInterval(markOnline, 20000);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        markOnline();
      } else {
        markOffline();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('pagehide', markOffline);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('pagehide', markOffline);
      markOffline();
    };
  }, [db, user.uid]);

  // Automatic recent-chat/inbox listener.
  // Receiver ko search kiye bina bhi conversation yahan dikh jayegi.
  useEffect(() => {
    if (!db || !user.uid) {
      setRecentChats([]);
      return;
    }

    const chatsQuery = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', user.uid)
    );

    const unsubscribe = onSnapshot(
      chatsQuery,
      async (snapshot) => {
        try {
          const baseChats = snapshot.docs
            .map((snap) => {
              const data = snap.data();
              const participants = Array.isArray(data.participants)
                ? data.participants.map(String)
                : [];
              const participantUserIds = Array.isArray(data.participantUserIds)
                ? data.participantUserIds.map(String)
                : [];
              const otherIndex = participants.findIndex(
                (participantUid) => participantUid !== user.uid
              );
              const otherUid =
                otherIndex >= 0 ? participants[otherIndex] : '';
              const rawTime = toTimestampMillis(data.lastMessageAt) || toTimestampMillis(data.updatedAt);
              const unreadFor = Array.isArray(data.unreadFor)
                ? data.unreadFor.map(String)
                : [];

              return {
                chatId: snap.id,
                otherUid,
                otherUserId:
                  otherIndex >= 0 ? participantUserIds[otherIndex] || '' : '',
                otherOnline: false,
                otherLastSeen: 0,
                lastMessage: String(data.lastMessage || ''),
                lastSenderUid: String(data.lastSenderUid || ''),
                lastMessageAt: rawTime,
                isUnread: unreadFor.includes(user.uid),
              };
            })
            .filter((chat) => chat.otherUid)
            .filter((chat) => !hiddenChatIds.includes(chat.chatId))
            .filter((chat) => !blockedUserUids.includes(chat.otherUid));

          const fullChats = await Promise.all(
            baseChats.map(async (chat) => {
              try {
                const profileSnap = await getDoc(
                  doc(db, 'users', chat.otherUid)
                );

                if (profileSnap.exists()) {
                  const profile = profileSnap.data() as Partial<QuickChatUser> & { online?: boolean; lastSeen?: any };
                  const lastSeen = toTimestampMillis(profile.lastSeen);
                  const isFresh = lastSeen > 0 && Date.now() - lastSeen < 45000;
                  return {
                    ...chat,
                    otherName: profile.name || chat.otherUserId || 'User',
                    otherEmail: profile.email || '',
                    otherAvatar: profile.avatar || '',
                    otherUserId: profile.userId || chat.otherUserId || '',
                    otherOnline: Boolean(profile.online) && isFresh,
                    otherLastSeen: lastSeen,
                  };
                }
              } catch (profileError) {
                console.error('[Chat] Profile load failed:', profileError);
              }

              return {
                ...chat,
                otherName: chat.otherUserId || 'User',
                otherEmail: '',
                otherAvatar: '',
                otherOnline: false,
                otherLastSeen: 0,
              };
            })
          );

          fullChats.sort((a, b) => b.lastMessageAt - a.lastMessageAt);
          setRecentChats(fullChats);
        } catch (error) {
          console.error('[Chat] Recent chat list failed:', error);
          setRecentChats([]);
        }
      },
      (error) => {
        console.error('[Chat] Recent chat listener failed:', error);
        setRecentChats([]);
      }
    );

    return () => unsubscribe();
  }, [db, user.uid, hiddenChatIds, blockedUserUids, presenceTick]);

  useEffect(() => {
    if (!db || !user.uid || !selectedChatUser?.uid) {
      setMessages([]);
      setChatLoading(false);
      return;
    }

    const chatId = makeChatId(user.uid, selectedChatUser.uid);
    setChatLoading(true);
    setChatError('');

    const messagesQuery = query(
      collection(db, 'chats', chatId, 'messages')
    );

    const unsubscribe = onSnapshot(
      messagesQuery,
      (snapshot) => {
        const nextMessages = snapshot.docs
          .map((snap) => {
            const data = snap.data();
            return {
              id: snap.id,
              senderUid: String(data.senderUid || ''),
              senderName: String(data.senderName || 'User'),
              text: String(data.text || ''),
              sentAt:
                typeof data.sentAt === 'number'
                  ? data.sentAt
                  : data.createdAt?.toMillis?.() || 0,
            };
          })
          .sort((a, b) => (a.sentAt || 0) - (b.sentAt || 0));

        setMessages(nextMessages);
        if (selectedChatUser?.uid && db && user.uid) {
          const chatId = makeChatId(user.uid, selectedChatUser.uid);
          setDoc(
            doc(db, 'chats', chatId),
            { unreadFor: arrayRemove(user.uid) },
            { merge: true }
          ).catch((error) => console.error('[Chat] Active unread clear failed:', error));
        }
        setChatLoading(false);
      },
      (error) => {
        console.error('[Chat] Message listener failed:', error);
        setChatLoading(false);
        setChatError(
          'Chat load nahi ho paayi. Firebase Firestore rules check karein.'
        );
      }
    );

    return () => unsubscribe();
  }, [db, user.uid, selectedChatUser?.uid]);

  const handleDeleteChat = async () => {
    if (!db || !user.uid || !selectedChatUser?.uid) return;

    const chatId = makeChatId(user.uid, selectedChatUser.uid);
    try {
      await setDoc(
        doc(db, 'chats', chatId),
        { hiddenFor: arrayUnion(user.uid), updatedAt: serverTimestamp() },
        { merge: true }
      );
      setHiddenChatIds((prev) => (prev.includes(chatId) ? prev : [...prev, chatId]));
      setSelectedChatUser(null);
      setMessages([]);
      setChatMenuOpen(false);
    } catch (error) {
      console.error('[Chat] Delete chat failed:', error);
      setChatError('Chat delete nahi ho paayi. Dobara try karein.');
    }
  };

  const handleBlockUser = async () => {
    if (!db || !user.uid || !selectedChatUser?.uid) return;

    const target = selectedChatUser;
    const chatId = makeChatId(user.uid, target.uid);
    try {
      await setDoc(
        doc(db, 'users', user.uid),
        { blockedUserUids: arrayUnion(target.uid), updatedAt: serverTimestamp() },
        { merge: true }
      );
      await setDoc(
        doc(db, 'chats', chatId),
        { hiddenFor: arrayUnion(user.uid), updatedAt: serverTimestamp() },
        { merge: true }
      );
      setBlockedUserUids((prev) => (prev.includes(target.uid) ? prev : [...prev, target.uid]));
      setHiddenChatIds((prev) => (prev.includes(chatId) ? prev : [...prev, chatId]));
      setSelectedChatUser(null);
      setMessages([]);
      setChatMenuOpen(false);
    } catch (error) {
      console.error('[Chat] Block user failed:', error);
      setChatError('User block nahi ho paaya. Dobara try karein.');
    }
  };

  const handleReportUser = async () => {
    if (!db || !user.uid || !selectedChatUser?.uid) return;

    const target = selectedChatUser;
    try {
      await setDoc(
        doc(db, 'users', user.uid),
        {
          reports: arrayUnion({
            targetUid: target.uid,
            targetUserId: target.userId,
            targetName: target.name,
            reportedAt: Date.now(),
          }),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      setChatMenuOpen(false);
      alert('Report submitted. Thank you.');
    } catch (error) {
      console.error('[Chat] Report failed:', error);
      setChatError('Report submit nahi ho paayi. Dobara try karein.');
    }
  };

  const handleSendMessage = async () => {
    const text = messageText.trim();

    if (!text || !db || !user.uid || !selectedChatUser?.uid || chatSending) {
      return;
    }

    setChatSending(true);
    setChatError('');

    try {
      const chatId = makeChatId(user.uid, selectedChatUser.uid);
      const sentAt = Date.now();

      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        senderUid: user.uid,
        receiverUid: selectedChatUser.uid,
        senderName: user.name || 'Guest User',
        text,
        sentAt,
        createdAt: serverTimestamp(),
      });

      await setDoc(
        doc(db, 'chats', chatId),
        {
          chatId,
          hiddenFor: arrayRemove(user.uid),
          unreadFor: arrayUnion(selectedChatUser.uid),
          participants: [user.uid, selectedChatUser.uid],
          participantUserIds: [user.userId, selectedChatUser.userId],
          lastMessage: text,
          lastSenderUid: user.uid,
          lastMessageAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      setMessageText('');
    } catch (error) {
      console.error('[Chat] Send message failed:', error);
      setChatError(
        'Message send nahi hua. Firebase Firestore rules check karein.'
      );
    } finally {
      setChatSending(false);
    }
  };

  const handleUnlockPass = () => {
    if (user.coins >= 10000) {
      setUser((prev) => ({
        ...prev,
        coins: prev.coins - 10000,
      }));

      setIsFemalePassUnlocked(true);
      setShowUnlockModal(false);

      alert('Female Video Pass successfully unlocked for 3 days!');
    } else {
      setShowUnlockModal(true);
    }
  };

  // Video Call Actions
  const handleStartMatch = (
    type: 'both' | 'male' | 'female'
  ) => {
    if (type === 'female' && !isFemalePassUnlocked) {
      setShowUnlockModal(true);
      return;
    }

    setIsSearching(true);

    setTimeout(() => {
      setIsSearching(false);
      alert(
        'Connecting to a random match! (Preview mode: Camera/Mic inactive)'
      );
    }, 2000);
  };

  // Spin Wheel Function
  const handleSpin = () => {
    if (isSpinning || user.spins <= 0) return;

    setIsSpinning(true);

    const prizes = [50, 15, 100, 20, 500, 5, 200, 10];
    const randomPrizeIndex = Math.floor(
      Math.random() * prizes.length
    );

    const prize = prizes[randomPrizeIndex];
    const segmentAngle = 360 / prizes.length;

    const targetDegree =
      1800 +
      (prizes.length - randomPrizeIndex) * segmentAngle -
      segmentAngle / 2;

    setWheelRotation(targetDegree);

    setTimeout(() => {
      setIsSpinning(false);

      setUser((prev) => ({
        ...prev,
        coins: prev.coins + prize,
        spins: prev.spins - 1,
      }));

      alert('Congratulations! You won Coins!');
    }, 3000);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0b0b0f] text-white flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center animate-pulse">
            <Video className="w-6 h-6" />
          </div>

          <p className="mt-4 text-sm text-gray-400">
            QuickChat loading...
          </p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#0b0b0f] text-white flex flex-col items-center justify-center p-4 font-sans relative">
        <div className="bg-[#121218] border border-gray-800 p-8 rounded-3xl max-w-md w-full text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center shadow-lg">
            <Video className="w-8 h-8 text-white" />
          </div>

          <div>
            <h1 className="text-2xl font-bold">
              QuickChat{' '}
              <span className="text-xs bg-pink-600 px-2 py-0.5 rounded text-white">
                HD
              </span>
            </h1>

            <p className="text-xs text-gray-400 mt-1">
              Connect with people globally through live video & instant
              direct chat!
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 py-2">
            <div className="bg-[#181822] border border-gray-800 p-3 rounded-xl flex flex-col items-center justify-center text-center">
              <Video className="w-4 h-4 text-pink-500 mb-1" />
              <span className="text-[10px] font-bold">Live Video</span>
              <span className="text-[9px] text-gray-500">
                Instant Match
              </span>
            </div>

            <div className="bg-[#181822] border border-gray-800 p-3 rounded-xl flex flex-col items-center justify-center text-center">
              <MessageCircle className="w-4 h-4 text-blue-500 mb-1" />
              <span className="text-[10px] font-bold">Direct Chat</span>
              <span className="text-[9px] text-gray-500">
                By ID / Name
              </span>
            </div>

            <div className="bg-[#181822] border border-gray-800 p-3 rounded-xl flex flex-col items-center justify-center text-center">
              <Disc className="w-4 h-4 text-amber-400 mb-1" />
              <span className="text-[10px] font-bold">Spin Wheel</span>
              <span className="text-[9px] text-gray-500">
                Daily Coins
              </span>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <button
              onClick={handleGoogleLogin}
              className="w-full bg-white hover:bg-gray-100 text-black font-semibold py-3 px-4 rounded-xl shadow-lg transition flex items-center justify-center gap-2 text-xs cursor-pointer"
            >
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
              >
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-.2.52-2.5.52-2.5z"
                />
              </svg>

              Sign in with Google
            </button>

            <button
              onClick={handleGuestLogin}
              className="w-full bg-[#181822] hover:bg-[#20202c] text-white border border-gray-700 font-semibold py-3 px-4 rounded-xl transition flex items-center justify-center gap-2 text-xs cursor-pointer"
            >
              Continue as Guest
            </button>

            <p className="text-[10px] text-gray-500">
              Guest mode uses a real Firebase anonymous account. You can
              use the app without Google.
            </p>
          </div>

          {authError && (
            <div className="text-xs text-red-300 bg-red-950/40 border border-red-900/60 rounded-xl p-3 text-left">
              {authError}
            </div>
          )}

          <div className="text-[11px] text-gray-500 bg-[#181822] border border-gray-800/60 py-2 px-3 rounded-lg">
            🎁 Free Welcome Coins + 5 Daily Spins included
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0b0f] text-white flex flex-col pb-24 font-sans relative">
      {/* Top Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-[#121218]/80 backdrop-blur-md border-b border-gray-800 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center">
            <Video className="w-4 h-4 text-white" />
          </div>

          <span className="text-lg font-bold">
            QuickChat{' '}
            <span className="text-[10px] bg-pink-600 px-1.5 py-0.5 rounded text-white">
              HD
            </span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-[#181822] border border-gray-800 px-3 py-1.5 rounded-full text-xs">
            <Coins className="w-3.5 h-3.5 text-amber-400" />

            <span className="font-bold text-amber-400">
              {user.coins} COINS
            </span>

            <button
              onClick={() => setActiveTab('spin')}
              className="bg-gradient-to-r from-amber-500 to-orange-500 text-black font-bold text-[10px] px-2 py-0.5 rounded-full ml-1 flex items-center gap-0.5 cursor-pointer hover:opacity-90"
            >
              <Sparkles className="w-2.5 h-2.5" /> +Earn
            </button>
          </div>

          <button
            onClick={() => setActiveTab('profile')}
            className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:text-white cursor-pointer"
          >
            <UserIcon className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Screen Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-6 space-y-6">
        {/* VIDEO CALL TAB */}
        {activeTab === 'video' && (
          <div className="space-y-6">
            <div className="bg-[#121218] border border-gray-800 p-3 rounded-2xl flex items-center gap-3 overflow-x-auto">
              <span className="text-xs text-gray-400 whitespace-nowrap">
                Match with:
              </span>

              {/* FIXED BOTH BUTTON */}
              <button
                onClick={() => setMatchType('both')}
                className={matchType === 'both' ? 'px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition bg-pink-600 text-white shadow-lg' : 'px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition bg-[#181822] text-gray-300 border border-gray-800'}
              >
                Both{' '}
                <span className="text-[9px] bg-black/30 px-1.5 py-0.2 rounded">
                  FREE
                </span>
              </button>

              <button
                onClick={() => setMatchType('male')}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition ${
                  matchType === 'male'
                    ? 'bg-green-600 text-white shadow-lg'
                    : 'bg-[#181822] text-gray-300 border border-gray-800'
                }`}
              >
                Male 👨{' '}
                <span className="text-[9px] bg-green-950 text-green-400 px-1.5 py-0.2 rounded">
                  FREE
                </span>
              </button>

              <button
                onClick={() => {
                  if (!isFemalePassUnlocked) {
                    setShowUnlockModal(true);
                  } else {
                    setMatchType('female');
                  }
                }}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition ${
                  matchType === 'female'
                    ? 'bg-amber-600 text-black shadow-lg'
                    : 'bg-[#181822] text-gray-300 border border-gray-800'
                }`}
              >
                Female 👩{' '}
                {!isFemalePassUnlocked && (
                  <Lock className="w-3 h-3 inline" />
                )}{' '}
                <span className="text-[9px] bg-amber-950 text-amber-400 px-1.5 py-0.2 rounded">
                  10K
                </span>
              </button>
            </div>

            <div className="bg-[#121218] border border-gray-800 p-4 rounded-2xl flex items-center justify-between flex-wrap gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white">
                    Female Video Calls:
                  </span>

                  <span
                    className={
  isFemalePassUnlocked
    ? 'text-[10px] border px-2 py-0.5 rounded font-semibold bg-emerald-950 text-emerald-400 border-emerald-900'
    : 'text-[10px] border px-2 py-0.5 rounded font-semibold bg-red-950 text-red-400 border-red-900'
}
                  >
                    {isFemalePassUnlocked
                      ? 'PASS ACTIVE (UNLOCKED)'
                      : 'PASS EXPIRED (LOCKED)'}
                  </span>
                </div>

                <p className="text-[11px] text-gray-400 mt-1">
                  {isFemalePassUnlocked
                    ? 'Aapka female pass active hai! Ab aap direct female calls match kar sakte hain.'
                    : 'Female calls locked until unlocked with 10,000 Coins (Valid for 15 Calls OR 3 Days).'}
                </p>
              </div>

              {!isFemalePassUnlocked && (
                <button
                  onClick={() => setShowUnlockModal(true)}
                  className="bg-gradient-to-r from-amber-500 to-orange-500 text-black text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-lg cursor-pointer hover:opacity-90"
                >
                  <Lock className="w-3.5 h-3.5" /> Unlock Pass (10,000
                  Coins)
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[#121218] border border-gray-800 rounded-2xl p-6 flex flex-col items-center justify-between min-h-[320px] relative">
                <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-[#181822] px-2.5 py-1 rounded-full border border-gray-800 text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                  <span className="text-gray-300">
                    Stranger Feed ({matchType.toUpperCase()})
                  </span>
                </div>

                <div className="my-auto text-center space-y-3">
                  <div className="w-20 h-20 mx-auto rounded-2xl bg-[#181822] border border-gray-800 flex items-center justify-center text-gray-500">
                    <Video className="w-8 h-8" />
                  </div>

                  <div>
                    <h3 className="font-bold text-white">
                      {isSearching
                        ? 'Searching for stranger...'
                        : 'Random Video Matching'}
                    </h3>

                    <p className="text-xs text-gray-400 max-w-xs mt-1">
                      Click below to instantly connect with live random
                      strangers worldwide.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 w-full mt-4">
                  <button
                    onClick={() => handleStartMatch(matchType)}
                    disabled={isSearching}
                    className="bg-gradient-to-r from-pink-600 to-purple-600 text-white font-semibold text-xs py-3 rounded-xl flex items-center justify-center gap-1.5 shadow-lg cursor-pointer hover:opacity-90 disabled:opacity-50"
                  >
                    <Video className="w-4 h-4" />{' '}
                    {isSearching ? 'Connecting...' : 'Start Match'}
                  </button>

                  <button
                    onClick={() => handleStartMatch('female')}
                    disabled={isSearching}
                    className="bg-gradient-to-r from-amber-500 to-orange-500 text-black font-semibold text-xs py-3 rounded-xl flex items-center justify-center gap-1.5 shadow-lg cursor-pointer hover:opacity-90 disabled:opacity-50"
                  >
                    <Sparkles className="w-4 h-4" /> Female Video Call
                  </button>
                </div>
              </div>

              <div className="bg-[#121218] border border-gray-800 rounded-2xl p-6 flex flex-col items-center justify-between min-h-[320px] relative">
                <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-[#181822] px-2.5 py-1 rounded-full border border-gray-800 text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  <span className="text-gray-300">
                    You (Local Feed)
                  </span>
                </div>

                <div className="absolute top-4 right-4 bg-[#181822] px-2 py-0.5 rounded text-[10px] font-mono text-gray-400 border border-gray-800">
                  {user.userId}
                </div>

                <div className="my-auto text-center space-y-3">
                  <div className="w-20 h-20 mx-auto rounded-full bg-[#181822] border border-gray-800 flex items-center justify-center text-gray-500">
                    <UserIcon className="w-8 h-8" />
                  </div>

                  <div>
                    <h3 className="font-bold text-white">
                      {user.name}
                    </h3>

                    <p className="text-xs font-mono text-amber-400">
                      {user.userId}
                    </p>

                    <p className="text-[11px] text-gray-400 flex items-center justify-center gap-1 mt-1">
                      <Mail className="w-3 h-3 text-pink-500" />{' '}
                      {user.email}
                    </p>
                  </div>
                </div>

                <div className="text-[11px] text-gray-500 text-center">
                  Camera or microphone not detected on this device.
                  Operating in preview mode.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CHATTING TAB */}
        {activeTab === 'chat' && (
          <div className="space-y-6">
            <div className="bg-[#121218] border border-gray-800 p-5 rounded-2xl space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-sm font-bold text-white">
                  Direct Connect & Search
                </span>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-gray-400">
                    Format: #USER8555, #USER9842
                  </span>

                  <button
                    onClick={randomSearching ? handleCancelRandomChat : handleStartRandomTextChat}
                    className={randomSearching
                      ? 'bg-red-600/10 border border-red-900/60 text-red-400 text-xs px-3 py-1 rounded-lg cursor-pointer hover:bg-red-600/20'
                      : 'bg-[#181822] border border-gray-800 text-xs text-pink-400 px-3 py-1 rounded-lg cursor-pointer hover:bg-gray-800'}
                  >
                    {randomSearching ? 'Cancel Search' : 'Start Random Text Chat'}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between bg-[#181822] px-4 py-2 rounded-xl border border-gray-800 text-xs flex-wrap gap-2">
                <div>
                  <span className="text-gray-400">
                    Your Identity:{' '}
                  </span>

                  <span className="font-semibold text-white">
                    {user.name}
                  </span>

                  <span className="ml-2 font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-900/50">
                    {user.userId}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-gray-500" />

                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleUserSearch();
                      }
                    }}
                    placeholder="Enter User ID (e.g. #USER8555)..."
                    className="w-full bg-[#181822] border border-gray-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-pink-500"
                  />
                </div>

                <button
                  onClick={handleUserSearch}
                  disabled={isUserSearching}
                  className="bg-gradient-to-r from-pink-600 to-purple-600 text-white font-semibold px-5 py-2.5 rounded-xl text-xs cursor-pointer hover:opacity-90 disabled:opacity-50"
                >
                  {isUserSearching
                    ? 'Searching...'
                    : 'Connect & Chat'}
                </button>
              </div>

              {searchError && (
                <div className="text-xs text-red-400 bg-red-950/30 border border-red-900/50 rounded-xl px-4 py-3">
                  {searchError}
                </div>
              )}

              {searchResult && (
                <div className="bg-[#181822] border border-emerald-900/50 rounded-xl p-4 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-bold text-white">
                      {searchResult.name}
                    </div>

                    <div className="text-xs font-mono text-emerald-400 mt-1">
                      {searchResult.userId}
                    </div>

                    <div className="text-[10px] text-gray-500 mt-1">
                      User found successfully.
                    </div>
                  </div>

                  <button
                    onClick={() => handleOpenChat(searchResult)}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2 rounded-xl cursor-pointer"
                  >
                    Open Chat
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-[#121218] border border-gray-800 rounded-2xl p-4 min-h-[350px] flex flex-col">
                <div className="flex items-center justify-between pb-3 border-b border-gray-800 text-xs">
                  <span className="font-bold text-white">
                    Recent Conversations ({recentChats.length})
                  </span>

                  <button
                    onClick={() => setSelectedChatUser(null)}
                    className="text-pink-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" /> New Chat
                  </button>
                </div>

                {recentChats.length > 0 ? (
                  <div className="mt-3 space-y-2 overflow-y-auto pr-1">
                    {recentChats.map((chat) => {
                      const isActive = selectedChatUser?.uid === chat.otherUid;

                      return (
                        <button
                          key={chat.chatId}
                          onClick={() =>
                            handleOpenChat({
                              uid: chat.otherUid,
                              name: chat.otherName,
                              email: chat.otherEmail,
                              avatar: chat.otherAvatar,
                              userId: chat.otherUserId,
                              coins: 0,
                              spins: 0,
                            })
                          }
                          className={
                            'w-full text-left rounded-xl p-3 cursor-pointer border ' +
                            (isActive
                              ? 'bg-[#21162b] border-pink-500/60'
                              : 'bg-[#181822] border-gray-800 hover:border-pink-500/50')
                          }
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <div className="text-sm font-semibold text-white truncate">
                                  {chat.otherName}
                                </div>
                                <span
                                  className={
                                    'w-2 h-2 rounded-full flex-shrink-0 ' +
                                    (chat.otherOnline ? 'bg-emerald-500' : 'bg-gray-600')
                                  }
                                  title={chat.otherOnline ? 'Online' : 'Offline'}
                                />
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <div className="text-[10px] font-mono text-emerald-400">
                                  {chat.otherUserId || chat.otherUid}
                                </div>
                                <span className={chat.otherOnline ? 'text-[9px] text-emerald-400' : 'text-[9px] text-gray-500'}>
                                  {chat.otherOnline ? 'Online' : formatLastSeen(chat.otherLastSeen)}
                                </span>
                              </div>
                            </div>

                            {chat.lastMessageAt > 0 && (
                              <div className="text-[9px] text-gray-600 whitespace-nowrap">
                                {new Date(chat.lastMessageAt).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2 mt-2">
                            <div className={chat.isUnread ? 'text-[10px] text-white font-semibold truncate flex-1' : 'text-[10px] text-gray-400 truncate flex-1'}>
                              {chat.lastMessage || 'No messages yet'}
                            </div>
                            {chat.isUnread && (
                              <span className="min-w-5 h-5 px-1.5 rounded-full bg-pink-600 text-white text-[9px] font-bold flex items-center justify-center">
                                New
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-4 text-gray-500 text-xs">
                    No conversations yet. Search a User ID above and tap Open Chat.
                  </div>
                )}
              </div>

              <div className="md:col-span-2 bg-[#121218] border border-gray-800 rounded-2xl min-h-[350px] flex flex-col overflow-hidden">
                {selectedChatUser ? (
                  <>
                    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800 bg-[#101017]">
                      <div>
                        <div className="font-bold text-white text-sm">
                          {selectedChatUser.name}
                        </div>
                        <div className="text-[10px] font-mono text-emerald-400 mt-1">
                          {selectedChatUser.userId}
                        </div>
                        {(() => {
                          const currentRecent = recentChats.find((chat) => chat.otherUid === selectedChatUser.uid);
                          const online = currentRecent?.otherOnline === true;
                          return (
                            <div className={online ? 'text-[10px] text-emerald-400 mt-1' : 'text-[10px] text-gray-500 mt-1'}>
                              <span className={online ? 'inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1' : 'inline-block w-1.5 h-1.5 rounded-full bg-gray-600 mr-1'} />
                              {online ? 'Online' : formatLastSeen(currentRecent?.otherLastSeen || 0)}
                            </div>
                          );
                        })()}
                      </div>
                      <div className="relative">
                        <button
                          onClick={() => setChatMenuOpen((prev) => !prev)}
                          className="text-gray-400 hover:text-white border border-gray-800 rounded-lg p-2 cursor-pointer"
                          title="Chat options"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {chatMenuOpen && (
                          <div className="absolute right-0 top-11 z-30 w-44 bg-[#181822] border border-gray-700 rounded-xl shadow-2xl overflow-hidden">
                            <button
                              onClick={handleDeleteChat}
                              className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-gray-200 hover:bg-white/5 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4 text-gray-400" />
                              Delete Chat
                            </button>
                            <button
                              onClick={handleBlockUser}
                              className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-orange-300 hover:bg-white/5 cursor-pointer"
                            >
                              <Ban className="w-4 h-4" />
                              Block User
                            </button>
                            <button
                              onClick={handleReportUser}
                              className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-red-300 hover:bg-white/5 cursor-pointer"
                            >
                              <Flag className="w-4 h-4" />
                              Report User
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex-1 min-h-[220px] max-h-[380px] overflow-y-auto p-4 space-y-3">
                      {chatLoading ? (
                        <div className="h-full flex items-center justify-center text-xs text-gray-500">
                          Loading messages...
                        </div>
                      ) : messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center text-gray-500">
                          <MessageCircle className="w-9 h-9 mb-2 opacity-40" />
                          <p className="text-xs">No messages yet.</p>
                          <p className="text-[10px] mt-1">Send the first message below.</p>
                        </div>
                      ) : (
                        messages.map((message) => {
                          const mine = message.senderUid === user.uid;
                          return (
                            <div
                              key={message.id}
                              className={mine ? 'flex justify-end' : 'flex justify-start'}
                            >
                              <div
                                className={mine ? 'max-w-[75%] bg-pink-600 text-white rounded-2xl rounded-br-sm px-4 py-2.5' : 'max-w-[75%] bg-[#1b1b26] border border-gray-800 text-white rounded-2xl rounded-bl-sm px-4 py-2.5'}
                              >
                                {!mine && (
                                  <div className="text-[10px] text-emerald-400 font-semibold mb-1">
                                    {message.senderName}
                                  </div>
                                )}
                                <div className="text-xs break-words whitespace-pre-wrap">
                                  {message.text}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {chatError && (
                      <div className="mx-4 mb-2 text-[10px] text-red-400 bg-red-950/30 border border-red-900/50 rounded-lg px-3 py-2">
                        {chatError}
                      </div>
                    )}

                    <div className="p-3 border-t border-gray-800 flex gap-2">
                      <input
                        type="text"
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        placeholder="Type a message..."
                        className="flex-1 bg-[#181822] border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-pink-500"
                      />
                      <button
                        onClick={handleSendMessage}
                        disabled={!messageText.trim() || chatSending}
                        className="bg-gradient-to-r from-pink-600 to-purple-600 text-white font-semibold text-xs px-5 rounded-xl cursor-pointer disabled:opacity-40"
                      >
                        {chatSending ? 'Sending...' : 'Send'}
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-500 p-6">
                    <MessageCircle className="w-10 h-10 mb-2 opacity-40" />
                    <h4 className="font-bold text-white text-sm">Select a Conversation</h4>
                    <p className="text-xs text-gray-500 mt-1 max-w-sm">
                      Search another User ID above and tap Open Chat to start a real-time conversation.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* SPIN & EARN TAB */}
        {activeTab === 'spin' && (
          <div className="flex flex-col items-center justify-center space-y-6 max-w-xl mx-auto py-4">
            <div className="flex items-center gap-4 bg-[#121218] border border-gray-800 px-6 py-2.5 rounded-full text-xs shadow-lg">
              <span className="flex items-center gap-1.5 font-bold text-amber-400">
                <Coins className="w-4 h-4" /> Wallet: {user.coins} Coins
              </span>

              <span className="text-gray-600">|</span>

              <span className="text-gray-400">
                Spins Remaining:{' '}
                <strong className="text-white">
                  {user.spins}
                </strong>
              </span>
            </div>

            <div className="relative flex items-center justify-center">
              <div className="absolute -top-3 z-20 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[20px] border-t-amber-400 drop-shadow-md"></div>

              <div className="w-80 h-80 rounded-full border-4 border-amber-500/80 shadow-[0_0_35px_rgba(245,158,11,0.3)] relative p-1 bg-[#121218]">
                <div
                  className="w-full h-full rounded-full relative overflow-hidden transition-transform ease-out duration-[3000ms]"
                  style={{
                    transform: 'rotate(' + wheelRotation + 'deg)',
                    background:
                      'conic-gradient(#3b82f6 0deg 45deg, #10b981 45deg 90deg, #f59e0b 90deg 135deg, #8b5cf6 135deg 180deg, #ec4899 180deg 225deg, #06b6d4 225deg 270deg, #6366f1 270deg 315deg, #ef4444 315deg 360deg)',
                  }}
                >
                  <span className="absolute top-6 left-[56%] -translate-x-1/2 text-white font-extrabold text-xs drop-shadow">
                    50
                  </span>

                  <span className="absolute top-[28%] right-6 -translate-y-1/2 text-white font-extrabold text-xs drop-shadow">
                    15
                  </span>

                  <span className="absolute bottom-[28%] right-6 translate-y-1/2 text-white font-extrabold text-xs drop-shadow">
                    100
                  </span>

                  <span className="absolute bottom-6 left-[56%] -translate-x-1/2 text-white font-extrabold text-xs drop-shadow">
                    20
                  </span>

                  <span className="absolute bottom-6 left-[28%] -translate-x-1/2 text-white font-extrabold text-xs drop-shadow">
                    500
                  </span>

                  <span className="absolute bottom-[28%] left-6 translate-y-1/2 text-white font-extrabold text-xs drop-shadow">
                    5
                  </span>

                  <span className="absolute top-[28%] left-6 -translate-y-1/2 text-white font-extrabold text-xs drop-shadow">
                    200
                  </span>

                  <span className="absolute top-6 left-[28%] -translate-x-1/2 text-white font-extrabold text-xs drop-shadow">
                    10
                  </span>
                </div>

                <div className="absolute inset-0 flex items-center justify-center">
                  <button
                    onClick={handleSpin}
                    disabled={isSpinning || user.spins <= 0}
                    className="w-20 h-20 rounded-full bg-amber-400 text-black font-extrabold tracking-wider text-sm flex items-center justify-center shadow-2xl border-4 border-[#121218] hover:scale-105 active:scale-95 transition cursor-pointer disabled:opacity-50"
                  >
                    {isSpinning ? '...' : 'SPIN'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PROFILE TAB */}
        {activeTab === 'profile' && (
          <div className="space-y-6 max-w-3xl mx-auto">
            <div className="bg-[#121218] border border-gray-800 p-6 rounded-2xl relative overflow-hidden flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-5">
                <div className="relative">
                  <div className="w-20 h-20 rounded-2xl bg-[#181822] border border-gray-800 flex flex-col items-center justify-center text-gray-500 text-xs">
                    <UserIcon className="w-8 h-8 mb-1" />
                    <span className="text-[10px]">No DP</span>
                  </div>

                  <div className="absolute -bottom-1 -right-1 bg-emerald-600 rounded-full p-1 text-white">
                    <Shield className="w-3 h-3" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  {/* EDITABLE NAME SECTION */}
                  <div className="flex items-center gap-2">
                    {isEditingName ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={tempName}
                          onChange={(e) =>
                            setTempName(e.target.value)
                          }
                          className="bg-[#181822] border border-pink-500 rounded px-2 py-1 text-xs text-white focus:outline-none"
                        />

                        <button
                          onClick={handleSaveName}
                          className="p-1 bg-emerald-600 rounded text-white hover:bg-emerald-500 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => {
                            setIsEditingName(false);
                            setTempName(user.name);
                          }}
                          className="p-1 bg-gray-700 rounded text-white hover:bg-gray-600 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <h2 className="text-lg font-bold text-white">
                          {user.name}
                        </h2>

                        <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-900 px-2 py-0.5 rounded font-semibold">
                          Verified
                        </span>

                        <button
                          onClick={() => {
                            setIsEditingName(true);
                            setTempName(user.name);
                          }}
                          className="text-gray-400 hover:text-white cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>

                  <p className="text-xs text-gray-400 flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-pink-500" />{' '}
                    {user.email}
                  </p>

                  {/* EDITABLE USER ID SECTION */}
                  <div className="flex items-center gap-2 mt-2 bg-[#181822] border border-gray-800 px-3 py-1.5 rounded-xl w-fit">
                    <span className="text-[11px] text-gray-400">
                      Your User ID:
                    </span>

                    {isEditingId ? (
                      <div className="flex items-center gap-1.5 ml-1">
                        <input
                          type="text"
                          value={tempId}
                          onChange={(e) =>
                            setTempId(e.target.value)
                          }
                          className="bg-[#121218] border border-amber-500 rounded px-2 py-0.5 text-xs font-mono text-amber-400 focus:outline-none w-28"
                        />

                        <button
                          onClick={handleSaveId}
                          className="p-1 bg-emerald-600 rounded text-white hover:bg-emerald-500 cursor-pointer"
                        >
                          <Check className="w-3 h-3" />
                        </button>

                        <button
                          onClick={() => {
                            setIsEditingId(false);
                            setTempId(user.userId);
                          }}
                          className="p-1 bg-gray-700 rounded text-white hover:bg-gray-600 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <span className="text-xs font-mono font-bold text-amber-400 ml-1">
                          {user.userId}
                        </span>

                        <button
                          onClick={handleCopyId}
                          className="text-gray-400 hover:text-white ml-1 cursor-pointer"
                          title="Copy ID"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => {
                            setIsEditingId(true);
                            setTempId(user.userId);
                          }}
                          className="text-gray-400 hover:text-white ml-0.5 cursor-pointer"
                          title="Edit ID"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="bg-red-600/10 border border-red-900/50 text-red-400 hover:bg-red-600/20 px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ml-auto cursor-pointer"
              >
                Sign Out
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[#121218] border border-gray-800 p-4 rounded-2xl">
                <div className="text-xs text-gray-400 flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5 text-amber-400" /> Coin
                  Balance
                </div>

                <div className="text-2xl font-extrabold text-white mt-2">
                  {user.coins}
                </div>

                <div className="text-[10px] text-gray-500 mt-1">
                  Available for video calls
                </div>
              </div>

              <div className="bg-[#121218] border border-gray-800 p-4 rounded-2xl">
                <div className="text-xs text-gray-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" /> Lifetime
                  Won
                </div>

                <div className="text-2xl font-extrabold text-white mt-2">
                  {user.coins}
                </div>

                <div className="text-[10px] text-gray-500 mt-1">
                  Earned from spins
                </div>
              </div>

              <div className="bg-[#121218] border border-gray-800 p-4 rounded-2xl">
                <div className="text-xs text-gray-400 flex items-center gap-1.5">
                  <Video className="w-3.5 h-3.5 text-blue-400" /> Calls
                  Connected
                </div>

                <div className="text-2xl font-extrabold text-white mt-2">
                  0
                </div>

                <div className="text-[10px] text-gray-500 mt-1">
                  Live sessions
                </div>
              </div>
            </div>

            <div className="bg-[#121218] border border-gray-800 p-5 rounded-2xl flex items-center justify-between flex-wrap gap-4">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Disc className="w-4 h-4 text-amber-400" /> Daily Spin
                  Wheel
                </h4>

                <p className="text-xs text-gray-400 mt-0.5">
                  {user.spins} of 5 spins remaining today
                </p>
              </div>

              <button
                onClick={() => setActiveTab('spin')}
                className="bg-gradient-to-r from-amber-500 to-orange-500 text-black text-xs font-bold px-4 py-2 rounded-xl shadow-lg hover:opacity-95 transition cursor-pointer"
              >
                Spin Now
              </button>
            </div>
          </div>
        )}
      </main>

      {/* INSUFFICIENT COINS / UNLOCK MODAL */}
      {showUnlockModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#14141c] border border-amber-500/30 rounded-3xl max-w-md w-full p-6 relative shadow-[0_0_50px_rgba(245,158,11,0.15)] space-y-6">
            <button
              onClick={() => setShowUnlockModal(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-white cursor-pointer bg-[#1c1c26] p-1.5 rounded-full"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
                <Lock className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-white">
                  Insufficient Coins / Pass Required
                </h3>

                <p className="text-xs text-gray-400 mt-1 px-4">
                  Female Video Calls require an{' '}
                  <strong className="text-white">
                    Active Female Pass
                  </strong>{' '}
                  or{' '}
                  <strong className="text-amber-400">
                    10,000 Coins
                  </strong>{' '}
                  to unlock.
                </p>
              </div>
            </div>

            <div className="bg-[#1c1c26] border border-gray-800 rounded-2xl p-4 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">
                  Current Balance:
                </span>

                <span className="font-bold text-amber-400 flex items-center gap-1">
                  <Coins className="w-3.5 h-3.5" /> {user.coins} Coins
                </span>
              </div>

              <div className="flex items-center justify-between border-t border-gray-800/60 pt-2">
                <span className="text-gray-400">
                  Cost to Unlock:
                </span>

                <span className="font-bold text-white">
                  10,000 Coins
                </span>
              </div>
            </div>

            <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-3.5 space-y-1.5 text-[11px] text-amber-200/80">
              <div className="font-semibold text-amber-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Female Pass Rules:
              </div>

              <ul className="list-disc list-inside space-y-1 text-gray-300 pl-1">
                <li>Wallet drops to 0 coins upon purchasing.</li>
                <li>
                  Max 15 Calls OR 3 Days validity (whichever expires
                  first).
                </li>
              </ul>
            </div>

            <div className="space-y-2.5">
              <button
                onClick={() => {
                  setShowUnlockModal(false);
                  setActiveTab('spin');
                }}
                className="w-full bg-gradient-to-r from-amber-400 to-orange-500 text-black font-extrabold text-xs py-3.5 rounded-xl shadow-lg hover:opacity-95 transition cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Earn Coins via Spin</span>
                <span className="text-sm">→</span>
              </button>

              <button
                onClick={() => {
                  if (user.coins >= 10000) {
                    handleUnlockPass();
                  } else {
                    alert(
                      'Aapke paas 10,000 coins nahi hain! Pehle Spin karke coins jeeto.'
                    );
                  }
                }}
                className="w-full bg-[#1c1c26] hover:bg-[#252533] border border-gray-800 text-gray-300 font-semibold text-xs py-3 rounded-xl transition cursor-pointer"
              >
                Unlock with Wallet Balance
              </button>
            </div>

            <div className="text-center">
              <button
                onClick={() => {
                  setShowUnlockModal(false);
                  setMatchType('both');
                }}
                className="text-[11px] text-gray-500 hover:text-gray-300 underline cursor-pointer"
              >
                Switch to Free Male / Both Calls
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#121218]/90 backdrop-blur-md border-t border-gray-800 flex justify-around items-center p-3 z-40 shadow-2xl">
        <button
          onClick={() => setActiveTab('video')}
          className={`flex flex-col items-center gap-1 transition cursor-pointer ${
            activeTab === 'video'
              ? 'text-pink-500'
              : 'text-gray-500 hover:text-white'
          }`}
        >
          <Video className="w-5 h-5" />
          <span className="text-[10px] font-medium">
            Video Call
          </span>
        </button>

        <button
          onClick={() => setActiveTab('chat')}
          className={`flex flex-col items-center gap-1 transition cursor-pointer ${
            activeTab === 'chat'
              ? 'text-pink-500'
              : 'text-gray-500 hover:text-white'
          }`}
        >
          <div className="relative">
            <MessageCircle className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-2 -right-3 min-w-4 h-4 px-1 rounded-full bg-red-600 text-white text-[8px] font-bold flex items-center justify-center border border-[#121218]">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-medium">
            Chatting
          </span>
        </button>

        <button
          onClick={() => setActiveTab('spin')}
          className={`flex flex-col items-center gap-1 transition cursor-pointer ${
            activeTab === 'spin'
              ? 'text-pink-500'
              : 'text-gray-500 hover:text-white'
          }`}
        >
          <Disc className="w-5 h-5" />
          <span className="text-[10px] font-medium">
            Spin & Earn
          </span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center gap-1 transition cursor-pointer ${
            activeTab === 'profile'
              ? 'text-pink-500'
              : 'text-gray-500 hover:text-white'
          }`}
        >
          <UserIcon className="w-5 h-5" />
          <span className="text-[10px] font-medium">
            Profile
          </span>
        </button>
      </nav>
    </div>
  );
}

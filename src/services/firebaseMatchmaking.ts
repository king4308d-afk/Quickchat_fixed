import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  arrayUnion
} from 'firebase/firestore';
import { getFirebaseDb } from './firebaseConfig';

/**
 * 100% Real User Peer-To-Peer Matchmaking Service
 * No bots, no simulations, no fake profiles, no pre-recorded video fallbacks.
 * Uses Firebase Firestore for global multi-device matching and
 * cross-tab BroadcastChannel & localStorage synchronization for local peers.
 */

export interface PeerProfile {
  userId: string;
  name: string;
  gender: 'male' | 'female';
  city: string;
  country: string;
  countryFlag: string;
  age?: number;
  avatar?: string;
}

export interface FirebaseUserDocument {
  userId: string;
  name?: string;
  gender?: 'male' | 'female';
  avatar?: string;
  coins: number;
  dailySpinsLeft: number;
  femalePassActive: boolean;
  remainingPassCalls: number;
  passExpiryTimestamp: number | null;
  updatedAt?: number;
}

export interface WaitingUserEntry {
  userId: string;
  name: string;
  gender: 'male' | 'female';
  genderFilter: 'male' | 'female' | 'both';
  city: string;
  country: string;
  countryFlag: string;
  age?: number;
  avatar?: string;
  status: 'waiting' | 'matched';
  callRoomId?: string | null;
  agoraChannel?: string | null;
  partnerInfo?: PeerProfile | null;
  createdAt: number;
}

export interface CallRoomDocument {
  callRoomId: string;
  agoraChannel: string;
  participants: string[];
  partnerInfo?: PeerProfile | null;
  status: 'active' | 'ended';
  createdAt: number;
}

export interface RealtimeChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  recipientId: string;
  text: string;
  mediaType?: 'image' | 'video';
  mediaUrl?: string;
  mediaName?: string;
  timestamp: number;
  timeString?: string;
  chatRoomId?: string;
  status?: 'sent' | 'delivered' | 'read';
}

const STORAGE_QUEUE_KEY = 'quickchat_p2p_waiting_queue_v3';
const P2P_BROADCAST_CHANNEL = 'quickchat_p2p_real_mesh_v3';

// Cross-tab broadcast channel for instant real-time multi-tab testing
let broadcastChannel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    broadcastChannel = new BroadcastChannel(P2P_BROADCAST_CHANNEL);
  }
} catch (e) {
  console.warn('[P2P Matchmaking] BroadcastChannel unavailable:', e);
}

// Memory cache
const inMemoryWaitingQueue = new Map<string, WaitingUserEntry>();
const inMemoryRooms = new Map<string, CallRoomDocument>();

function getLocalQueue(): Record<string, WaitingUserEntry> {
  try {
    const raw = localStorage.getItem(STORAGE_QUEUE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
}

function saveLocalQueue(queue: Record<string, WaitingUserEntry>) {
  try {
    // Purge entries older than 2 minutes (stale users)
    const now = Date.now();
    const cleaned: Record<string, WaitingUserEntry> = {};
    for (const [id, entry] of Object.entries(queue)) {
      if (now - entry.createdAt < 120000) {
        cleaned[id] = entry;
      }
    }
    localStorage.setItem(STORAGE_QUEUE_KEY, JSON.stringify(cleaned));
  } catch {}
}

/**
 * 1. Sync User Profile to Firestore
 */
export async function syncUserProfileToFirestore(userDoc: FirebaseUserDocument): Promise<void> {
  const db = getFirebaseDb();
  if (!db) return;

  try {
    const userRef = doc(db, 'users', userDoc.userId);
    await setDoc(userRef, { ...userDoc, updatedAt: Date.now() }, { merge: true });
  } catch (err) {
    console.warn('[Firebase] Firestore user sync note:', err);
  }
}

/**
 * Fetch User Profile Document from Firestore
 */
export async function getUserProfileFromFirestore(userId: string): Promise<FirebaseUserDocument | null> {
  const db = getFirebaseDb();
  if (db) {
    try {
      const userRef = doc(db, 'users', userId);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        return snap.data() as FirebaseUserDocument;
      }
    } catch (err) {
      console.warn('[Firebase] Firestore read note:', err);
    }
  }
  return null;
}

const KNOWN_USERS_STORAGE_KEY = 'quickchat_known_users_v3';

/**
 * Register a user into cross-session & cross-tab registry (both guest & registered)
 */
export function registerKnownUser(profile: PeerProfile): void {
  if (!profile.userId) return;
  const cleanId = profile.userId.trim().toUpperCase();
  const withHash = cleanId.startsWith('#') ? cleanId : `#${cleanId}`;
  const withoutHash = cleanId.replace('#', '');

  // 1. Update localStorage known users registry
  try {
    const raw = localStorage.getItem(KNOWN_USERS_STORAGE_KEY);
    const registry: Record<string, PeerProfile> = raw ? JSON.parse(raw) : {};
    registry[withHash] = profile;
    registry[withoutHash] = profile;
    localStorage.setItem(KNOWN_USERS_STORAGE_KEY, JSON.stringify(registry));
  } catch (err) {
    console.warn('[P2P Matchmaking] registerKnownUser local storage note:', err);
  }

  // 2. Broadcast to other open tabs
  try {
    broadcastChannel?.postMessage({
      type: 'USER_REGISTERED',
      profile
    });
  } catch {}

  // 3. Sync to Firestore users collection for global discovery
  const db = getFirebaseDb();
  if (db) {
    try {
      const userRef = doc(db, 'users', withHash);
      setDoc(
        userRef,
        {
          userId: withHash,
          name: profile.name,
          gender: profile.gender,
          avatar: profile.avatar || '',
          city: profile.city || 'Online',
          country: profile.country || 'Global',
          countryFlag: profile.countryFlag || '🌐',
          age: profile.age || 23,
          updatedAt: Date.now()
        },
        { merge: true }
      ).catch(() => {});
    } catch {}
  }
}

/**
 * Direct User ID Lookup: 100% Real Registered or Guest Users
 * Queries real users from in-memory cache, local cross-tab registry,
 * waiting queues, or Firestore.
 */
export async function findRealUserById(targetUserId: string): Promise<PeerProfile | null> {
  const rawTarget = targetUserId.trim();
  if (!rawTarget) return null;
  const cleanId = rawTarget.toUpperCase();

  const withHash = cleanId.startsWith('#') ? cleanId : `#${cleanId}`;
  const withoutHash = cleanId.replace('#', '');
  const idVariants = [withHash, withoutHash, cleanId];
  const targetNameLower = rawTarget.toLowerCase();

  // 1. Check in-memory waiting queue
  for (const entry of inMemoryWaitingQueue.values()) {
    const entryId = entry.userId.toUpperCase();
    const entryNameLower = (entry.name || '').toLowerCase();
    if (
      idVariants.some((v) => v === entryId || v.replace('#', '') === entryId.replace('#', '')) ||
      entryNameLower === targetNameLower ||
      entryNameLower.includes(targetNameLower)
    ) {
      return {
        userId: entry.userId,
        name: entry.name,
        gender: entry.gender,
        city: entry.city,
        country: entry.country,
        countryFlag: entry.countryFlag,
        age: entry.age,
        avatar: entry.avatar
      };
    }
  }

  // 2. Check local queue (cross-tab active peers)
  const lq = getLocalQueue();
  for (const entry of Object.values(lq)) {
    const entryId = entry.userId.toUpperCase();
    const entryNameLower = (entry.name || '').toLowerCase();
    if (
      idVariants.some((v) => v === entryId || v.replace('#', '') === entryId.replace('#', '')) ||
      entryNameLower === targetNameLower ||
      entryNameLower.includes(targetNameLower)
    ) {
      return {
        userId: entry.userId,
        name: entry.name,
        gender: entry.gender,
        city: entry.city,
        country: entry.country,
        countryFlag: entry.countryFlag,
        age: entry.age,
        avatar: entry.avatar
      };
    }
  }

  // 3. Check known users registry (cross-session & guest users storage)
  try {
    const raw = localStorage.getItem(KNOWN_USERS_STORAGE_KEY);
    if (raw) {
      const registry: Record<string, PeerProfile> = JSON.parse(raw);
      for (const variant of idVariants) {
        if (registry[variant]) {
          return registry[variant];
        }
      }
      for (const entry of Object.values(registry)) {
        if (
          entry.name &&
          (entry.name.toLowerCase() === targetNameLower ||
            entry.name.toLowerCase().includes(targetNameLower) ||
            targetNameLower.includes(entry.name.toLowerCase()))
        ) {
          return entry;
        }
      }
    }
  } catch {}

  // 4. Check Firestore users & waiting_users collections
  const db = getFirebaseDb();
  if (db) {
    try {
      // Check doc by withHash and withoutHash
      for (const docKey of [withHash, withoutHash]) {
        const userRef = doc(db, 'users', docKey);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
          const data = snap.data() as FirebaseUserDocument;
          const profile: PeerProfile = {
            userId: data.userId || withHash,
            name: data.name || data.userId || `User ${withoutHash}`,
            gender: data.gender || 'male',
            city: 'Online',
            country: 'Global',
            countryFlag: '🌐',
            avatar: data.avatar || ''
          };
          registerKnownUser(profile);
          return profile;
        }
      }

      // Check waiting_users collection
      for (const variant of [withHash, withoutHash]) {
        const q = query(collection(db, 'waiting_users'), where('userId', '==', variant), limit(1));
        const qSnap = await getDocs(q);
        if (!qSnap.empty) {
          const d = qSnap.docs[0].data() as WaitingUserEntry;
          const profile: PeerProfile = {
            userId: d.userId,
            name: d.name,
            gender: d.gender,
            city: d.city,
            country: d.country,
            countryFlag: d.countryFlag,
            age: d.age,
            avatar: d.avatar
          };
          registerKnownUser(profile);
          return profile;
        }
      }
    } catch (err) {
      console.warn('[Firebase] findRealUserById note:', err);
    }
  }

  return null;
}

/**
 * Random Real Peer Finder for text chat
 * 100% Real peer only - returns null if no peer is in queue.
 */
export async function findRandomRealWaitingPeer(currentUserId: string): Promise<PeerProfile | null> {
  // Check in-memory
  for (const [uid, entry] of inMemoryWaitingQueue.entries()) {
    if (uid !== currentUserId && entry.status === 'waiting') {
      return {
        userId: entry.userId,
        name: entry.name,
        gender: entry.gender,
        city: entry.city,
        country: entry.country,
        countryFlag: entry.countryFlag,
        age: entry.age,
        avatar: entry.avatar
      };
    }
  }

  // Check local queue
  const lq = getLocalQueue();
  for (const [uid, entry] of Object.entries(lq)) {
    if (uid !== currentUserId && entry.status === 'waiting') {
      return {
        userId: entry.userId,
        name: entry.name,
        gender: entry.gender,
        city: entry.city,
        country: entry.country,
        countryFlag: entry.countryFlag,
        age: entry.age,
        avatar: entry.avatar
      };
    }
  }

  // Check Firestore
  const db = getFirebaseDb();
  if (db) {
    try {
      const q = query(
        collection(db, 'waiting_users'),
        where('status', '==', 'waiting'),
        limit(5)
      );
      const snap = await getDocs(q);
      for (const d of snap.docs) {
        const entry = d.data() as WaitingUserEntry;
        if (entry.userId !== currentUserId) {
          return {
            userId: entry.userId,
            name: entry.name,
            gender: entry.gender,
            city: entry.city,
            country: entry.country,
            countryFlag: entry.countryFlag,
            age: entry.age,
            avatar: entry.avatar
          };
        }
      }
    } catch (err) {
      console.warn('[Firebase] findRandomRealWaitingPeer note:', err);
    }
  }

  return null;
}

/**
 * 2. Add real user to waiting queue when they start matching
 */
export async function addToWaitingQueue(params: {
  userId: string;
  name: string;
  gender: 'male' | 'female';
  genderFilter: 'male' | 'female' | 'both';
  city?: string;
  country?: string;
  countryFlag?: string;
  age?: number;
  avatar?: string;
}): Promise<WaitingUserEntry> {
  const entry: WaitingUserEntry = {
    userId: params.userId,
    name: params.name || 'User',
    gender: params.gender,
    genderFilter: params.genderFilter,
    city: params.city || 'Online',
    country: params.country || 'Global',
    countryFlag: params.countryFlag || '🌐',
    age: params.age || 23,
    avatar: params.avatar || '',
    status: 'waiting',
    callRoomId: null,
    agoraChannel: null,
    partnerInfo: null,
    createdAt: Date.now()
  };

  inMemoryWaitingQueue.set(params.userId, entry);

  // Sync to local queue
  const lq = getLocalQueue();
  lq[params.userId] = entry;
  saveLocalQueue(lq);

  // Broadcast to other tabs/windows
  broadcastChannel?.postMessage({
    type: 'USER_JOINED_QUEUE',
    entry
  });

  // Sync to Firestore
  const db = getFirebaseDb();
  if (db) {
    try {
      const waitingRef = doc(db, 'waiting_users', params.userId);
      await setDoc(waitingRef, entry);
    } catch (err) {
      console.warn('[Firebase] Queue write note:', err);
    }
  }

  return entry;
}

/**
 * Remove user from waiting queue (e.g. when stopped, cancelled, or disconnected)
 */
export async function removeFromWaitingQueue(userId: string): Promise<void> {
  inMemoryWaitingQueue.delete(userId);

  const lq = getLocalQueue();
  delete lq[userId];
  saveLocalQueue(lq);

  broadcastChannel?.postMessage({
    type: 'USER_LEFT_QUEUE',
    userId
  });

  const db = getFirebaseDb();
  if (db) {
    try {
      const waitingRef = doc(db, 'waiting_users', userId);
      await deleteDoc(waitingRef);
    } catch (err) {
      console.warn('[Firebase] Queue remove note:', err);
    }
  }
}

/**
 * Pair waiting real users into a shared Call Room and assign Agora channel.
 * STRICT: Returns NULL if no matching online real user is available.
 * NEVER simulates bots or fake users!
 */
export async function pairWaitingUsers(
  currentUserId: string,
  preferredGender: 'male' | 'female' | 'both',
  currentUserProfile?: PeerProfile
): Promise<CallRoomDocument | null> {
  const db = getFirebaseDb();

  const generateRoom = (partnerInfo: PeerProfile): CallRoomDocument => {
    const safeP1 = currentUserId.replace(/[^a-zA-Z0-9]/g, '');
    const safeP2 = partnerInfo.userId.replace(/[^a-zA-Z0-9]/g, '');
    const roomId = `p2p_${safeP1}_${safeP2}_${Date.now()}`;
    const agoraChannel = `agora_${roomId}`;
    return {
      callRoomId: roomId,
      agoraChannel,
      participants: [currentUserId, partnerInfo.userId],
      partnerInfo,
      status: 'active',
      createdAt: Date.now()
    };
  };

  const myProfile: PeerProfile = currentUserProfile || {
    userId: currentUserId,
    name: 'Peer User',
    gender: 'male',
    city: 'Online',
    country: 'Global',
    countryFlag: '🌐'
  };

  // 1. Try Firestore Matchmaking if DB available
  if (db) {
    try {
      const waitingCol = collection(db, 'waiting_users');
      let q = query(waitingCol, where('status', '==', 'waiting'), limit(15));
      if (preferredGender !== 'both') {
        q = query(waitingCol, where('status', '==', 'waiting'), where('gender', '==', preferredGender), limit(15));
      }

      const snap = await getDocs(q);
      for (const d of snap.docs) {
        const candidate = d.data() as WaitingUserEntry;
        // Must be another real user who is waiting and not stale (< 90 seconds)
        if (candidate.userId !== currentUserId && candidate.status === 'waiting' && Date.now() - candidate.createdAt < 90000) {
          // Check reciprocal gender filter
          if (candidate.genderFilter === 'both' || candidate.genderFilter === myProfile.gender) {
            const partnerProfile: PeerProfile = {
              userId: candidate.userId,
              name: candidate.name,
              gender: candidate.gender,
              city: candidate.city || 'Online',
              country: candidate.country || 'Global',
              countryFlag: candidate.countryFlag || '🌐',
              age: candidate.age || 24,
              avatar: candidate.avatar || ''
            };

            const room = generateRoom(partnerProfile);

            // Record room in Firestore
            await setDoc(doc(db, 'call_rooms', room.callRoomId), room);

            // Update candidate
            await setDoc(
              doc(db, 'waiting_users', candidate.userId),
              {
                status: 'matched',
                callRoomId: room.callRoomId,
                agoraChannel: room.agoraChannel,
                partnerInfo: myProfile
              },
              { merge: true }
            );

            // Update self
            await setDoc(
              doc(db, 'waiting_users', currentUserId),
              {
                status: 'matched',
                callRoomId: room.callRoomId,
                agoraChannel: room.agoraChannel,
                partnerInfo: partnerProfile
              },
              { merge: true }
            );

            return room;
          }
        }
      }
    } catch (err) {
      console.warn('[Firebase] Firestore query note:', err);
    }
  }

  // 2. Cross-Tab & Local Storage P2P Matching (for local real peers across tabs)
  const lq = getLocalQueue();
  const now = Date.now();

  for (const [uid, candidate] of Object.entries(lq)) {
    if (uid !== currentUserId && candidate.status === 'waiting' && now - candidate.createdAt < 60000) {
      // Check gender compatibility both ways
      const genderMatchesMe = preferredGender === 'both' || candidate.gender === preferredGender;
      const genderMatchesCandidate = candidate.genderFilter === 'both' || candidate.genderFilter === myProfile.gender;

      if (genderMatchesMe && genderMatchesCandidate) {
        const partnerProfile: PeerProfile = {
          userId: candidate.userId,
          name: candidate.name,
          gender: candidate.gender,
          city: candidate.city || 'Online',
          country: candidate.country || 'Global',
          countryFlag: candidate.countryFlag || '🌐',
          age: candidate.age || 24,
          avatar: candidate.avatar || ''
        };

        const room = generateRoom(partnerProfile);
        inMemoryRooms.set(room.callRoomId, room);

        // Update local queue statuses
        lq[currentUserId] = {
          ...lq[currentUserId],
          status: 'matched',
          callRoomId: room.callRoomId,
          agoraChannel: room.agoraChannel,
          partnerInfo: partnerProfile
        };
        lq[candidate.userId] = {
          ...candidate,
          status: 'matched',
          callRoomId: room.callRoomId,
          agoraChannel: room.agoraChannel,
          partnerInfo: myProfile
        };
        saveLocalQueue(lq);

        // Broadcast to candidate tab
        broadcastChannel?.postMessage({
          type: 'MATCH_ESTABLISHED',
          targetUserId: candidate.userId,
          room: {
            ...room,
            partnerInfo: myProfile
          }
        });

        return room;
      }
    }
  }

  // NO REAL USER IS AVAILABLE: Return NULL so the searching loader screen stays active!
  return null;
}

/**
 * Real-time listener for when another online user matches with current user
 */
export function listenToMatchmakingStatus(
  userId: string,
  onMatchFound: (room: CallRoomDocument) => void
): () => void {
  let isUnsubscribed = false;

  // 1. BroadcastChannel message listener (cross-tab real-time)
  const handleBroadcast = (event: MessageEvent) => {
    if (isUnsubscribed) return;
    const data = event.data;
    if (data?.type === 'MATCH_ESTABLISHED' && data.targetUserId === userId && data.room) {
      onMatchFound(data.room);
    }
  };

  broadcastChannel?.addEventListener('message', handleBroadcast);

  // 2. Storage event listener (fallback cross-tab)
  const handleStorage = (event: StorageEvent) => {
    if (isUnsubscribed) return;
    if (event.key === STORAGE_QUEUE_KEY && event.newValue) {
      try {
        const queue = JSON.parse(event.newValue);
        const myEntry = queue[userId];
        if (myEntry && myEntry.status === 'matched' && myEntry.callRoomId && myEntry.agoraChannel) {
          onMatchFound({
            callRoomId: myEntry.callRoomId,
            agoraChannel: myEntry.agoraChannel,
            participants: [userId, myEntry.partnerInfo?.userId || 'peer'],
            partnerInfo: myEntry.partnerInfo,
            status: 'active',
            createdAt: Date.now()
          });
        }
      } catch {}
    }
  };
  window.addEventListener('storage', handleStorage);

  // 3. Firestore onSnapshot (cross-device real-time)
  let firestoreUnsub: (() => void) | null = null;
  const db = getFirebaseDb();
  if (db) {
    try {
      const waitingRef = doc(db, 'waiting_users', userId);
      firestoreUnsub = onSnapshot(waitingRef, (docSnap) => {
        if (isUnsubscribed) return;
        if (docSnap.exists()) {
          const data = docSnap.data() as WaitingUserEntry;
          if (data.status === 'matched' && data.callRoomId && data.agoraChannel) {
            onMatchFound({
              callRoomId: data.callRoomId,
              agoraChannel: data.agoraChannel,
              participants: [userId, data.partnerInfo?.userId || 'peer'],
              partnerInfo: data.partnerInfo,
              status: 'active',
              createdAt: Date.now()
            });
          }
        }
      });
    } catch (err) {
      console.warn('[Firebase] Matchmaking snapshot listener note:', err);
    }
  }

  // Periodic safety poll on local queue in case storage event didn't trigger in same tab
  const pollInterval = setInterval(() => {
    if (isUnsubscribed) return;
    const lq = getLocalQueue();
    const myEntry = lq[userId];
    if (myEntry && myEntry.status === 'matched' && myEntry.callRoomId && myEntry.agoraChannel) {
      onMatchFound({
        callRoomId: myEntry.callRoomId,
        agoraChannel: myEntry.agoraChannel,
        participants: [userId, myEntry.partnerInfo?.userId || 'peer'],
        partnerInfo: myEntry.partnerInfo,
        status: 'active',
        createdAt: Date.now()
      });
    }
  }, 1000);

  return () => {
    isUnsubscribed = true;
    clearInterval(pollInterval);
    broadcastChannel?.removeEventListener('message', handleBroadcast);
    window.removeEventListener('storage', handleStorage);
    if (firestoreUnsub) {
      firestoreUnsub();
    }
  };
}

/**
 * End a call room
 */
export async function leaveCallRoom(callRoomId: string, userId: string): Promise<void> {
  await removeFromWaitingQueue(userId);

  const db = getFirebaseDb();
  if (db) {
    try {
      const roomRef = doc(db, 'call_rooms', callRoomId);
      await setDoc(roomRef, { status: 'ended' }, { merge: true });
    } catch (err) {
      console.warn('[Firebase] Room leave note:', err);
    }
  }

  const room = inMemoryRooms.get(callRoomId);
  if (room) {
    room.status = 'ended';
  }
}

export function isSameOrNormalizedUser(idA?: string | null, idB?: string | null): boolean {
  if (!idA || !idB) return false;
  const aClean = idA.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  const bClean = idB.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  return aClean === bClean;
}

/**
 * 1. Dynamic Chat Room ID Fix:
 * Ensure both users enter the EXACT same Firestore collection path.
 * Uses a sorted algorithm for creating the chat room ID:
 *   const roomId = [currentUser.uid, targetUser.uid].sort().join('_');
 * Strips leading hash and normalizes characters so both users compute
 * the identical room ID regardless of formatting differences.
 */
export function getChatRoomDocId(userId1: string, userId2: string): string {
  const uid1 = (userId1 || '').trim().replace(/^#/, '').toUpperCase().replace(/[^A-Z0-9_-]/g, '');
  const uid2 = (userId2 || '').trim().replace(/^#/, '').toUpperCase().replace(/[^A-Z0-9_-]/g, '');
  const roomId = [uid1, uid2].sort().join('_');
  return roomId;
}

export const getChatRoomId = getChatRoomDocId;

const CHAT_STORAGE_SYNC_KEY = 'quickchat_last_chat_msg_sync_v3';
const CHAT_HISTORY_STORAGE_KEY = 'quickchat_shared_recent_messages_v3';

/**
 * Send real-time message:
 * - Saves message under `chats/${roomId}/messages` with `timestamp`
 * - Updates `chats/${roomId}` parent document for room metadata & query discovery
 * - Writes to subcollection `chat_rooms/${chatRoomDocId}/messages/${payload.id}` (backward compatibility)
 * - Updates recipient's `user_inbox/${cleanRecipient}` document
 * - Broadcasts across tabs instantly using BroadcastChannel
 * - Fires storage events for cross-tab multi-window synchronization
 * - Posts to server-side /api/messages for instant SSE broadcast across different windows & sessions
 * - Fallback error logs added in console on failure
 */
export async function sendRealtimeMessage(message: RealtimeChatMessage): Promise<void> {
  const timeString =
    message.timeString ||
    new Date(message.timestamp || Date.now()).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });

  const chatRoomDocId = getChatRoomDocId(message.senderId, message.recipientId);

  const payload: RealtimeChatMessage = {
    ...message,
    chatRoomId: chatRoomDocId,
    timestamp: message.timestamp || Date.now(),
    timeString
  };

  // 1. Cross-tab BroadcastChannel notification
  try {
    broadcastChannel?.postMessage({
      type: 'CHAT_MESSAGE_SENT',
      message: payload
    });
  } catch (e) {
    console.warn('[P2P Messaging] BroadcastChannel postMessage note:', e);
  }

  // 2. Cross-tab localStorage notification & rolling message cache
  try {
    localStorage.setItem(
      CHAT_STORAGE_SYNC_KEY,
      JSON.stringify({ message: payload, sentAt: Date.now() })
    );

    const rawHistory = localStorage.getItem(CHAT_HISTORY_STORAGE_KEY);
    const history: RealtimeChatMessage[] = rawHistory ? JSON.parse(rawHistory) : [];
    const updated = [payload, ...history.filter((m) => m.id !== payload.id)].slice(0, 100);
    localStorage.setItem(CHAT_HISTORY_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('[P2P Messaging] localStorage sync note:', e);
  }

  // 3. Fast server-side push to /api/messages for instant SSE delivery across any window or tab
  try {
    fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(() => {});
  } catch {}

  // 4. Firestore writes
  const db = getFirebaseDb();
  if (db) {
    const cleanSender = payload.senderId.trim().replace(/^#/, '').toUpperCase().replace(/[^A-Z0-9_-]/g, '');
    const cleanRecipient = payload.recipientId.trim().replace(/^#/, '').toUpperCase().replace(/[^A-Z0-9_-]/g, '');
    const participants = [cleanSender, cleanRecipient];
    const timestampNum = typeof payload.timestamp === 'number' ? payload.timestamp : Date.now();

    const chatMsgData = {
      id: payload.id,
      senderId: payload.senderId,
      senderName: payload.senderName || 'Anonymous',
      senderAvatar: payload.senderAvatar || '',
      recipientId: payload.recipientId,
      text: payload.text || '',
      timestamp: timestampNum,
      timeString: payload.timeString || new Date(timestampNum).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      mediaType: payload.mediaType || null,
      mediaUrl: payload.mediaUrl || null,
      mediaName: payload.mediaName || null,
      roomId: chatRoomDocId
    };

    try {
      console.log(`[Firestore Write] Saving message under chats/${chatRoomDocId}/messages/${payload.id}`, {
        senderId: payload.senderId,
        recipientId: payload.recipientId,
        roomId: chatRoomDocId
      });

      // A. Primary Schema: Save message under `chats/${roomId}/messages`
      const chatMsgRef = doc(collection(db, 'chats', chatRoomDocId, 'messages'), payload.id);
      await setDoc(chatMsgRef, chatMsgData);
      console.log(`[Firestore Write] Successfully saved message under chats/${chatRoomDocId}/messages/${payload.id}`);

      // B. Primary Schema: Update `chats/${roomId}` parent room document
      const chatDocRef = doc(db, 'chats', chatRoomDocId);
      await setDoc(
        chatDocRef,
        {
          roomId: chatRoomDocId,
          participants,
          lastMessage: chatMsgData,
          updatedAt: timestampNum
        },
        { merge: true }
      );
      console.log(`[Firestore Write] Successfully updated chats/${chatRoomDocId}`);

      // C. Legacy & fallback writes: chat_rooms/${chatRoomDocId}
      const roomDocRef = doc(db, 'chat_rooms', chatRoomDocId);
      await setDoc(
        roomDocRef,
        {
          roomId: chatRoomDocId,
          participants,
          lastMessage: payload,
          updatedAt: timestampNum,
          messages: arrayUnion(payload)
        },
        { merge: true }
      );

      const subMsgRef = doc(collection(db, 'chat_rooms', chatRoomDocId, 'messages'), payload.id);
      await setDoc(subMsgRef, {
        ...payload,
        createdAt: timestampNum
      });

      // D. Recipient Inbox notification doc: 'user_inbox/${cleanRecipient}'
      const recipientInboxRef = doc(db, 'user_inbox', cleanRecipient);
      await setDoc(
        recipientInboxRef,
        {
          recipientId: cleanRecipient,
          lastMessage: payload,
          chatRoomId: chatRoomDocId,
          updatedAt: timestampNum
        },
        { merge: true }
      );
      console.log(`[Firestore Write] Successfully updated recipient inbox user_inbox/${cleanRecipient}`);
    } catch (err: any) {
      console.error(`[Firestore Error] Failed to send message to chats/${chatRoomDocId}/messages:`, {
        roomId: chatRoomDocId,
        senderId: payload.senderId,
        recipientId: payload.recipientId,
        errorCode: err?.code,
        errorMessage: err?.message,
        error: err
      });
    }
  } else {
    console.error(`[Firestore Error] Firestore database is not initialized. Cannot send message to chats/${chatRoomDocId}/messages`);
  }
}

/**
 * 2. Firestore Schema & Subscription:
 * - Uses `onSnapshot` with `orderBy('timestamp', 'asc')` on `chats/${roomId}/messages`
 *   for both sender and receiver.
 * - Both users enter the EXACT same collection path via sorted roomId:
 *   const roomId = [currentUser.uid, targetUser.uid].sort().join('_');
 * - Fallback error logs are added in the console if listening fails.
 */
export function listenToChatRoomDoc(
  currentUserId: string,
  partnerUserId: string,
  onMessageReceived: (message: RealtimeChatMessage) => void,
  onMessagesBatch?: (messages: RealtimeChatMessage[]) => void
): () => void {
  if (!currentUserId || !partnerUserId) return () => {};

  const chatRoomDocId = getChatRoomDocId(currentUserId, partnerUserId);
  console.log(`[Firestore Subscription] Subscribing via onSnapshot with orderBy('timestamp', 'asc') to path: chats/${chatRoomDocId}/messages`, {
    currentUser: currentUserId,
    partnerUser: partnerUserId,
    roomId: chatRoomDocId
  });

  let isUnsubscribed = false;
  const processedMessageIds = new Set<string>();

  const handleIncoming = (msg: RealtimeChatMessage) => {
    if (!msg || !msg.id || isUnsubscribed) return;
    if (processedMessageIds.has(msg.id)) return;
    processedMessageIds.add(msg.id);
    console.log(`[Firestore Message Received] Message ${msg.id} on chats/${chatRoomDocId}/messages:`, msg.text);
    onMessageReceived(msg);
  };

  let firestoreChatsUnsub: (() => void) | null = null;
  let firestoreLegacyDocUnsub: (() => void) | null = null;
  const db = getFirebaseDb();

  if (db) {
    try {
      // PRIMARY SUBSCRIPTION: onSnapshot with orderBy('timestamp', 'asc') on `chats/${chatRoomDocId}/messages`
      const chatsMessagesCol = collection(db, 'chats', chatRoomDocId, 'messages');
      const chatsQuery = query(chatsMessagesCol, orderBy('timestamp', 'asc'));

      firestoreChatsUnsub = onSnapshot(
        chatsQuery,
        (snapshot) => {
          if (isUnsubscribed) return;
          console.log(`[Firestore onSnapshot] Real-time event for chats/${chatRoomDocId}/messages: ${snapshot.size} messages in collection (${snapshot.docChanges().length} new/changed)`);

          const batchList: RealtimeChatMessage[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as RealtimeChatMessage;
            if (data && data.id) {
              batchList.push(data);
            }
          });

          if (onMessagesBatch && batchList.length > 0) {
            onMessagesBatch(batchList);
          }

          snapshot.docChanges().forEach((change) => {
            if (change.type === 'added' || change.type === 'modified') {
              const msg = change.doc.data() as RealtimeChatMessage;
              if (msg && msg.id) {
                handleIncoming(msg);
              }
            }
          });
        },
        (err: any) => {
          console.error(`[Firestore Error] Failed to listen to chats/${chatRoomDocId}/messages:`, {
            roomId: chatRoomDocId,
            currentUserId,
            partnerUserId,
            errorCode: err?.code,
            errorMessage: err?.message,
            error: err
          });
        }
      );

      // Legacy fallback: also listen to chat_rooms/${chatRoomDocId}
      const roomDocRef = doc(db, 'chat_rooms', chatRoomDocId);
      firestoreLegacyDocUnsub = onSnapshot(
        roomDocRef,
        (snapshot) => {
          if (isUnsubscribed || !snapshot.exists()) return;
          const data = snapshot.data();
          if (data?.lastMessage && data.lastMessage.id) {
            handleIncoming(data.lastMessage as RealtimeChatMessage);
          }
          if (Array.isArray(data?.messages)) {
            for (const m of data.messages) {
              if (m && m.id) {
                handleIncoming(m);
              }
            }
          }
        },
        (err: any) => {
          console.warn(`[Firestore Fallback Note] chat_rooms/${chatRoomDocId} listener note:`, err?.message || err);
        }
      );
    } catch (err: any) {
      console.error(`[Firestore Error] Setup exception when listening to chats/${chatRoomDocId}/messages:`, {
        roomId: chatRoomDocId,
        errorCode: err?.code,
        errorMessage: err?.message,
        error: err
      });
    }
  } else {
    console.error(`[Firestore Error] Firestore database not initialized. Cannot subscribe to chats/${chatRoomDocId}/messages`);
  }

  // 2. Listen to BroadcastChannel for this chat room
  const handleBroadcast = (event: MessageEvent) => {
    if (isUnsubscribed) return;
    const data = event.data;
    if (data?.type === 'CHAT_MESSAGE_SENT' && data.message) {
      const msg = data.message as RealtimeChatMessage;
      const msgRoomId = msg.chatRoomId || getChatRoomDocId(msg.senderId, msg.recipientId);
      if (msgRoomId === chatRoomDocId) {
        handleIncoming(msg);
      }
    }
  };
  broadcastChannel?.addEventListener('message', handleBroadcast);

  // 3. Listen to localStorage storage events
  const handleStorage = (event: StorageEvent) => {
    if (isUnsubscribed) return;
    if (event.key === CHAT_STORAGE_SYNC_KEY && event.newValue) {
      try {
        const parsed = JSON.parse(event.newValue);
        if (parsed?.message) {
          const msg = parsed.message as RealtimeChatMessage;
          const msgRoomId = msg.chatRoomId || getChatRoomDocId(msg.senderId, msg.recipientId);
          if (msgRoomId === chatRoomDocId) {
            handleIncoming(msg);
          }
        }
      } catch {}
    }
  };
  window.addEventListener('storage', handleStorage);

  // 4. Listen to SSE Stream
  let eventSource: EventSource | null = null;
  try {
    if (typeof window !== 'undefined' && 'EventSource' in window) {
      eventSource = new EventSource('/api/messages/stream');
      eventSource.onmessage = (event) => {
        if (isUnsubscribed || !event.data) return;
        try {
          const parsed = JSON.parse(event.data);
          if (parsed && parsed.id) {
            const msgRoomId = parsed.chatRoomId || getChatRoomDocId(parsed.senderId, parsed.recipientId);
            if (msgRoomId === chatRoomDocId) {
              handleIncoming(parsed);
            }
          }
        } catch {}
      };
    }
  } catch (e) {
    console.warn('[SSE] EventSource init note in listenToChatRoomDoc:', e);
  }

  return () => {
    isUnsubscribed = true;
    if (firestoreChatsUnsub) firestoreChatsUnsub();
    if (firestoreLegacyDocUnsub) firestoreLegacyDocUnsub();
    broadcastChannel?.removeEventListener('message', handleBroadcast);
    window.removeEventListener('storage', handleStorage);
    if (eventSource) {
      eventSource.close();
    }
  };
}

/**
 * Real-time listener for incoming chat messages addressed to current user:
 * - Listens to BroadcastChannel (zero-latency in same browser)
 * - Listens to StorageEvent (cross-tab fallback)
 * - Listens to SSE Stream /api/messages/stream (cross-window / multi-session instant delivery)
 * - Listens to Firestore onSnapshot (remote users / real-time cloud sync)
 * - Maintains deduplication to prevent repeated renders
 */
export function listenToRealtimeMessages(
  currentUserId: string,
  onMessageReceived: (message: RealtimeChatMessage) => void
): () => void {
  if (!currentUserId) return () => {};

  let isUnsubscribed = false;
  const processedMessageIds = new Set<string>();

  const dispatchIfRecipient = (msg: RealtimeChatMessage) => {
    if (!msg || !msg.id || isUnsubscribed) return;
    // Do not dispatch user's own sent messages
    if (isSameOrNormalizedUser(msg.senderId, currentUserId)) return;
    // Must be addressed to current user
    if (isSameOrNormalizedUser(msg.recipientId, currentUserId)) {
      if (!processedMessageIds.has(msg.id)) {
        processedMessageIds.add(msg.id);
        onMessageReceived(msg);
      }
    }
  };

  // 1. Listen via BroadcastChannel (instant across tabs in same browser)
  const handleBroadcast = (event: MessageEvent) => {
    if (isUnsubscribed) return;
    const data = event.data;
    if (data?.type === 'CHAT_MESSAGE_SENT' && data.message) {
      dispatchIfRecipient(data.message);
    }
  };
  broadcastChannel?.addEventListener('message', handleBroadcast);

  // 2. Listen via storage event (cross-tab fallback)
  const handleStorage = (event: StorageEvent) => {
    if (isUnsubscribed) return;
    if (event.key === CHAT_STORAGE_SYNC_KEY && event.newValue) {
      try {
        const parsed = JSON.parse(event.newValue);
        if (parsed?.message) {
          dispatchIfRecipient(parsed.message);
        }
      } catch {}
    }
  };
  window.addEventListener('storage', handleStorage);

  // 3. Listen via Server-Sent Events (cross-window, cross-browser, instant streaming)
  let eventSource: EventSource | null = null;
  try {
    if (typeof window !== 'undefined' && 'EventSource' in window) {
      eventSource = new EventSource('/api/messages/stream');
      eventSource.onmessage = (event) => {
        if (isUnsubscribed || !event.data) return;
        try {
          const parsed = JSON.parse(event.data);
          if (parsed && parsed.id) {
            dispatchIfRecipient(parsed);
          }
        } catch {}
      };
    }
  } catch (e) {
    console.warn('[SSE] EventSource init note:', e);
  }

  // 4. Listen via Firestore onSnapshot (inbox, chat_rooms, and chats real-time sync)
  let firestoreInboxUnsub: (() => void) | null = null;
  let firestoreRoomsUnsub: (() => void) | null = null;
  let firestoreChatsRoomsUnsub: (() => void) | null = null;
  const db = getFirebaseDb();
  if (db) {
    try {
      const cleanMyId = currentUserId.trim().replace(/^#/, '').toUpperCase().replace(/[^A-Z0-9_-]/g, '');

      // A. Listen to user_inbox document
      const inboxRef = doc(db, 'user_inbox', cleanMyId);
      firestoreInboxUnsub = onSnapshot(
        inboxRef,
        (docSnap) => {
          if (isUnsubscribed || !docSnap.exists()) return;
          const data = docSnap.data();
          if (data?.lastMessage && data.lastMessage.id) {
            dispatchIfRecipient(data.lastMessage as RealtimeChatMessage);
          }
        },
        (err) => {
          console.warn('[Firebase] User inbox onSnapshot listener note:', err);
        }
      );

      // B. Listen to chat_rooms where current user is a participant
      const roomsQuery = query(
        collection(db, 'chat_rooms'),
        where('participants', 'array-contains', cleanMyId),
        limit(30)
      );

      firestoreRoomsUnsub = onSnapshot(
        roomsQuery,
        (snapshot) => {
          if (isUnsubscribed) return;
          snapshot.docChanges().forEach((change) => {
            if (change.type === 'added' || change.type === 'modified') {
              const data = change.doc.data();
              if (data?.lastMessage && data.lastMessage.id) {
                dispatchIfRecipient(data.lastMessage as RealtimeChatMessage);
              }
            }
          });
        },
        (err) => {
          console.warn('[Firebase] Chat rooms onSnapshot listener note:', err);
        }
      );

      // C. Listen to chats collection where current user is a participant
      const chatsQuery = query(
        collection(db, 'chats'),
        where('participants', 'array-contains', cleanMyId),
        limit(30)
      );

      firestoreChatsRoomsUnsub = onSnapshot(
        chatsQuery,
        (snapshot) => {
          if (isUnsubscribed) return;
          snapshot.docChanges().forEach((change) => {
            if (change.type === 'added' || change.type === 'modified') {
              const data = change.doc.data();
              if (data?.lastMessage && data.lastMessage.id) {
                dispatchIfRecipient(data.lastMessage as RealtimeChatMessage);
              }
            }
          });
        },
        (err) => {
          console.warn('[Firebase] chats onSnapshot listener note:', err);
        }
      );
    } catch (err) {
      console.warn('[Firebase] listenToRealtimeMessages Firestore init note:', err);
    }
  }

  // 5. Initial check & periodic safety poll on recent messages cache and server
  const checkCachedMessages = () => {
    if (isUnsubscribed) return;
    try {
      const raw = localStorage.getItem(CHAT_HISTORY_STORAGE_KEY);
      if (raw) {
        const history: RealtimeChatMessage[] = JSON.parse(raw);
        for (const msg of history) {
          if (Date.now() - (msg.timestamp || 0) < 120000) {
            dispatchIfRecipient(msg);
          }
        }
      }
    } catch {}
  };

  const fetchRecentServerMessages = async () => {
    if (isUnsubscribed) return;
    try {
      const res = await fetch(`/api/messages?userId=${encodeURIComponent(currentUserId)}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data?.messages)) {
          for (const msg of data.messages) {
            dispatchIfRecipient(msg);
          }
        }
      }
    } catch {}
  };

  checkCachedMessages();
  fetchRecentServerMessages();
  const pollInterval = setInterval(() => {
    checkCachedMessages();
    fetchRecentServerMessages();
  }, 1200);

  return () => {
    isUnsubscribed = true;
    clearInterval(pollInterval);
    broadcastChannel?.removeEventListener('message', handleBroadcast);
    window.removeEventListener('storage', handleStorage);
    if (eventSource) {
      eventSource.close();
    }
    if (firestoreInboxUnsub) {
      firestoreInboxUnsub();
    }
    if (firestoreRoomsUnsub) {
      firestoreRoomsUnsub();
    }
    if (firestoreChatsRoomsUnsub) {
      firestoreChatsRoomsUnsub();
    }
  };
}


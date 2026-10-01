import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore, doc, getDocFromServer } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider, type Auth } from 'firebase/auth';



/**
 * Exact Firebase Project Configuration:
 * Project ID: quickchat-b43d0
 */
export const firebaseConfig = {
  apiKey: "AIzaSyBCIWkX4l2yXkv1mbWi01wMb5-BfRmeXDo",
  authDomain: "quickchat-b43d0.firebaseapp.com",
  projectId: "quickchat-b43d0",
  storageBucket: "quickchat-b43d0.firebasestorage.app",
  messagingSenderId: "1081306187761",
  appId: "1:1081306187761:web:8bcfcb6b3686f156736650",
  measurementId: "G-5YZ6EFDQ2V"
};
export const FIRESTORE_DATABASE_ID = "(default)";

export function getFirebaseApp(): FirebaseApp {
  if (getApps().length > 0) {
    return getApp();
  }
  return initializeApp(firebaseConfig);
}

let dbInstance: Firestore | null = null;

export function getFirebaseDb(): Firestore | null {
  try {
    if (!dbInstance) {
      const app = getFirebaseApp();
      dbInstance = FIRESTORE_DATABASE_ID && FIRESTORE_DATABASE_ID !== '(default)'
        ? getFirestore(app, FIRESTORE_DATABASE_ID)
        : getFirestore(app);
    }
    return dbInstance;
  } catch (err) {
    console.warn('[Firebase] Firestore init note:', err);
    return null;
  }
}

let authInstance: Auth | null = null;

export function getFirebaseAuth(): Auth | null {
  try {
    if (!authInstance) {
      const app = getFirebaseApp();
      authInstance = getAuth(app);
    }
    return authInstance;
  } catch (err) {
    console.warn('[Firebase Auth] Initialization note:', err);
    return null;
  }
}

/**
 * Tests connection to Firestore as required by Firebase guidelines
 */
export async function testFirestoreConnection(): Promise<boolean> {
  const db = getFirebaseDb();
  if (!db) return false;
  try {
    await getDocFromServer(doc(db, 'system', 'connection_test'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('[Firebase] Firestore is currently offline or connecting.');
    }
    return false;
  }
}

// Automatically test connection on boot
if (typeof window !== 'undefined') {
  testFirestoreConnection().catch(() => {});
}

export enum FirestoreOperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: FirestoreOperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: FirestoreOperationType, path: string | null) {
  const auth = getFirebaseAuth();
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
      emailVerified: auth?.currentUser?.emailVerified,
      isAnonymous: auth?.currentUser?.isAnonymous,
      tenantId: auth?.currentUser?.tenantId,
      providerInfo: auth?.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('[Firestore Error]', JSON.stringify(errInfo));
  return errInfo;
}

/**
 * Creates and configures the GoogleAuthProvider with prompt: 'select_account'
 * so that clicking Sign in with Google always prompts the user to select an account.
 */
export function createGoogleAuthProvider(): GoogleAuthProvider {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({
    prompt: 'select_account'
  });
  return provider;
}

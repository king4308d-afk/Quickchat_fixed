import React, { useEffect, useState } from 'react';
import { Video } from 'lucide-react';
import { onAuthStateChanged, signInWithPopup, signInAnonymously, type Auth } from 'firebase/auth';
import { getFirebaseAuth, createGoogleAuthProvider } from '../services/firebaseConfig';

export const AuthScreen: React.FC = () => {
  const [auth, setAuth] = useState<Auth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const firebaseAuth = getFirebaseAuth();
    setAuth(firebaseAuth);
    if (!firebaseAuth) {
      setError('Firebase Authentication initialize nahi ho pa raha.');
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(firebaseAuth, () => setLoading(false));
    return unsubscribe;
  }, []);

  const handleGuestLogin = async () => {
    if (!auth) return;
    setError('');
    try {
      await signInAnonymously(auth);
    } catch (e: any) {
      if (e?.code === 'auth/operation-not-allowed') {
        setError('Firebase Console > Authentication > Sign-in method mein Anonymous enable karein.');
      } else {
        setError(e?.message || 'Guest sign-in failed.');
      }
    }
  };

  const handleGoogleLogin = async () => {
    if (!auth) return;
    setError('');
    try {
      await signInWithPopup(auth, createGoogleAuthProvider());
    } catch (e: any) {
      if (e?.code === 'auth/popup-blocked') {
        setError('Browser ne popup block kar diya. Popup allow karke dobara try karein.');
      } else if (e?.code === 'auth/unauthorized-domain') {
        setError('Firebase Console > Authentication > Settings > Authorized domains mein current domain add karein.');
      } else if (e?.code === 'auth/operation-not-allowed') {
        setError('Firebase Console > Authentication > Sign-in method mein Google enable karein.');
      } else if (e?.code !== 'auth/popup-closed-by-user') {
        setError(e?.message || 'Google sign-in failed.');
      }
    }
  };

  if (loading) return <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4 text-white">
      <div className="max-w-md w-full bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-2xl text-center">
        <div className="w-16 h-16 mx-auto bg-gradient-to-tr from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4">
          <Video className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold">QuickChat</h1>
        <p className="text-sm text-gray-400 mt-2 mb-6">Sign in with your real Google account.</p>
        <button onClick={handleGoogleLogin} className="w-full py-3 px-4 bg-white hover:bg-gray-100 text-gray-900 font-medium rounded-xl shadow-md transition flex items-center justify-center gap-2">
          <span className="font-bold">G</span>
          <span>Sign in with Google</span>
        </button>
        <button onClick={handleGuestLogin} className="w-full py-3 px-4 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-xl transition">
          Continue as Guest
        </button>
        <p className="text-xs text-gray-500 mt-3">Guest mode uses Firebase Anonymous Authentication.</p>
        {error && <div className="mt-4 text-xs text-red-300 bg-red-950/40 border border-red-900/60 rounded-xl p-3 text-left">{error}</div>}
      </div>
    </div>
  );
};

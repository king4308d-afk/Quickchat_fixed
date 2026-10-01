import React, { useState } from 'react';
import { useDating } from '../context/DatingContext';
import { Heart, Lock, Mail, User, Sparkles, MapPin, Briefcase, CheckCircle2, ArrowRight } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose?: () => void;
}

export const AuthView: React.FC<AuthModalProps> = () => {
  const { login, register, quickDemoLogin } = useDating();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  
  // Login fields
  const [email, setEmail] = useState('rohit@dating.app');
  const [password, setPassword] = useState('password123');
  
  // Register fields
  const [name, setName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [age, setAge] = useState<number>(24);
  const [gender, setGender] = useState<'male' | 'female' | 'non-binary'>('female');
  const [occupation, setOccupation] = useState('');
  const [location, setLocation] = useState('Mumbai');
  const [bio, setBio] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState(
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1000&q=80'
  );

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const result = login(email, password);
    if (!result.success) {
      setError(result.error || 'Login failed');
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError('Kripya apna naam darj karein');
      return;
    }
    if (!regEmail.trim()) {
      setError('Kripya email darj karein');
      return;
    }
    if (regPassword.length < 6) {
      setError('Password kam se kam 6 aksharo ka hona chahiye');
      return;
    }

    const result = register({
      email: regEmail,
      password: regPassword,
      name,
      age: Number(age),
      gender,
      occupation: occupation || 'Creative Professional',
      location: location || 'Mumbai',
      bio: bio || 'Excited to meet interesting people!',
      photos: [selectedPhoto],
      interests: ['Coffee', 'Music', 'Travel', 'Art']
    });

    if (!result.success) {
      setError(result.error || 'Registration failed');
    } else {
      setSuccessMsg('Account safaltapoorvak ban gaya!');
    }
  };

  const AVATAR_OPTIONS = [
    { label: 'Woman 1', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80' },
    { label: 'Woman 2', url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80' },
    { label: 'Man 1', url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=600&q=80' },
    { label: 'Man 2', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-pink-50 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-rose-500/5 border border-rose-100/80 overflow-hidden">
        {/* Header Branding */}
        <div className="bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 p-7 text-white text-center relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
          <div className="inline-flex items-center justify-center w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl mb-3 shadow-inner">
            <Heart className="w-8 h-8 text-white fill-white animate-pulse" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Dating App</h1>
          <p className="text-rose-100 text-sm mt-1">
            {mode === 'login' ? 'Apne account mein login karein' : 'Naya profile banayein aur matches khojein'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-gray-100 p-2 bg-gray-50/50">
          <button
            id="tab-login-btn"
            type="button"
            onClick={() => { setMode('login'); setError(null); }}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all ${
              mode === 'login'
                ? 'bg-white text-rose-600 shadow-sm border border-gray-100'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            Email Login
          </button>
          <button
            id="tab-register-btn"
            type="button"
            onClick={() => { setMode('register'); setError(null); }}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all ${
              mode === 'register'
                ? 'bg-white text-rose-600 shadow-sm border border-gray-100'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            Naya Account (Sign Up)
          </button>
        </div>

        <div className="p-6 sm:p-7">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
              {error}
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-green-600" />
              {successMsg}
            </div>
          )}

          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    id="login-email-input"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-11 pr-4 py-3 bg-gray-50/70 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    id="login-password-input"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-11 pr-4 py-3 bg-gray-50/70 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 transition-all"
                  />
                </div>
              </div>

              <button
                id="submit-login-btn"
                type="submit"
                className="w-full mt-2 py-3.5 px-4 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-semibold rounded-xl shadow-lg shadow-rose-500/25 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Login Karein</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Quick Demo Credentials Shortcut */}
              <div className="pt-5 border-t border-gray-100">
                <p className="text-xs text-gray-500 font-medium text-center mb-3">
                  Ya direct demo account se test karein:
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('rohit@dating.app');
                      setPassword('password123');
                      quickDemoLogin('rohit@dating.app');
                    }}
                    className="p-2.5 text-xs font-medium rounded-xl border border-gray-200 bg-gray-50 hover:bg-rose-50 hover:border-rose-200 text-gray-700 hover:text-rose-600 transition-all text-center"
                  >
                    Rohit (Male, 26)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('priya@dating.app');
                      setPassword('password123');
                      quickDemoLogin('priya@dating.app');
                    }}
                    className="p-2.5 text-xs font-medium rounded-xl border border-gray-200 bg-gray-50 hover:bg-rose-50 hover:border-rose-200 text-gray-700 hover:text-rose-600 transition-all text-center"
                  >
                    Priya (Female, 25)
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-3.5 max-h-[60vh] overflow-y-auto pr-1">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Poora Naam
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jaise: Ananya Gupta"
                    className="w-full pl-9 pr-3 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Umar (Age)
                  </label>
                  <input
                    type="number"
                    min={18}
                    max={80}
                    value={age}
                    onChange={(e) => setAge(Number(e.target.value))}
                    className="w-full px-3 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Gender
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as any)}
                    className="w-full px-3 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500"
                  >
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="non-binary">Non-binary</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="w-full pl-9 pr-3 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="password"
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full pl-9 pr-3 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Shehar (City)
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Delhi, Mumbai..."
                      className="w-full pl-9 pr-3 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Kaam / Occupation
                  </label>
                  <div className="relative">
                    <Briefcase className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={occupation}
                      onChange={(e) => setOccupation(e.target.value)}
                      placeholder="Designer, Engineer..."
                      className="w-full pl-9 pr-3 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-sm"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Profile Photo Chunein
                </label>
                <div className="flex gap-2">
                  {AVATAR_OPTIONS.map((opt, i) => (
                    <img
                      key={i}
                      src={opt.url}
                      alt={opt.label}
                      onClick={() => setSelectedPhoto(opt.url)}
                      referrerPolicy="no-referrer"
                      className={`w-12 h-12 rounded-xl object-cover cursor-pointer border-2 transition-all ${
                        selectedPhoto === opt.url ? 'border-rose-500 scale-105 shadow-md' : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Bio (Aapke baare mein)
                </label>
                <textarea
                  rows={2}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell potential matches about your vibe and passions..."
                  className="w-full p-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500"
                />
              </div>

              <button
                id="submit-register-btn"
                type="submit"
                className="w-full py-3 px-4 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-semibold rounded-xl shadow-lg shadow-rose-500/25 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Account Banayein Aur Shuru Karein</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

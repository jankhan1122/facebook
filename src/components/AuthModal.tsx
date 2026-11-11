import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import {
  X, Eye, EyeOff, Sparkles, ShieldCheck, HelpCircle,
  Plus, Check, UserPlus, Lock, Mail, User as UserIcon
} from 'lucide-react';

export const AuthModal: React.FC = () => {
  const { login, register, demoLogin } = useAuth();

  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isForgotOpen, setIsForgotOpen] = useState(false);

  // Login form
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Register form
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [birthDay, setBirthDay] = useState('15');
  const [birthMonth, setBirthMonth] = useState('Jun');
  const [birthYear, setBirthYear] = useState('1998');
  const [gender, setGender] = useState('Male');
  const [customGenderPronoun, setCustomGenderPronoun] = useState('');
  const [regBio, setRegBio] = useState('');
  const [regWork, setRegWork] = useState('');
  const [regLocation, setRegLocation] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80');
  const [regError, setRegError] = useState('');
  const regAvatarInputRef = React.useRef<HTMLInputElement>(null);

  const handleRegAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setSelectedAvatar(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Forgot password
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [forgotStep, setForgotStep] = useState<1 | 2>(1);
  const [forgotMsg, setForgotMsg] = useState('');

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const days = Array.from({ length: 31 }, (_, i) => String(i + 1));
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 80 }, (_, i) => String(currentYear - 12 - i));

  const avatarChoices = [
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80'
  ];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOrUsername.trim() || !password) return;
    setError('');
    setIsSubmitting(true);
    try {
      await login(emailOrUsername.trim(), password);
    } catch (err: any) {
      setError(err.message || 'The email or password you entered is incorrect.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !regEmail.trim() || !regPassword) {
      setRegError('Please complete all required fields.');
      return;
    }

    if (regPassword.length < 6) {
      setRegError('Password must be at least 6 characters.');
      return;
    }

    setRegError('');
    setIsSubmitting(true);
    try {
      const birthday = `${birthMonth} ${birthDay}, ${birthYear}`;
      const finalGender = gender === 'Custom' ? (customGenderPronoun || 'Custom') : gender;

      await register({
        name: `${firstName.trim()} ${lastName.trim()}`,
        email: regEmail.trim(),
        password: regPassword,
        bio: regBio.trim(),
        work: regWork.trim(),
        location: regLocation.trim(),
        birthday,
        gender: finalGender,
        avatar: selectedAvatar
      });
      setIsRegisterOpen(false);
    } catch (err: any) {
      setRegError(err.message || 'Registration failed. Email might already be taken.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendResetCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail.trim() })
      });
      const data = await res.json();
      if (res.ok) {
        setForgotMsg(`Verification code sent to your email! (Demo code: ${data.resetCode})`);
        setResetCode(data.resetCode);
        setForgotStep(2);
      } else {
        setForgotMsg(data.error);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: forgotEmail.trim(),
          code: resetCode.trim(),
          newPassword
        })
      });
      const data = await res.json();
      if (res.ok) {
        alert('Password has been successfully updated! You can now log in.');
        setIsForgotOpen(false);
        setForgotStep(1);
      } else {
        setForgotMsg(data.error);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F2F5] dark:bg-[#18191A] flex flex-col justify-between select-none">
      {/* Facebook-style Main Container */}
      <div className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 sm:py-16 flex flex-col lg:flex-row items-center justify-center gap-10 lg:gap-16">
        {/* Left Side: Brand Logo, Tagline & Recent Logins */}
        <div className="max-w-lg text-center lg:text-left">
          {/* Logo */}
          <div className="flex items-center justify-center lg:justify-start gap-3 mb-2">
            <div className="w-13 h-13 sm:w-16 sm:h-16 rounded-full bg-[#1877F2] text-white font-black text-3xl sm:text-4xl flex items-center justify-center shadow-md tracking-tighter">
              ts
            </div>
            <h1 className="text-4xl sm:text-5xl font-black text-[#1877F2] tracking-tight">
              taimoor social
            </h1>
          </div>

          <p className="text-xl sm:text-2xl font-normal text-gray-800 dark:text-gray-100 leading-snug mt-3">
            Connect • Share • Communicate with friends and the world around you on TAIMOOR SOCIAL.
          </p>

          {/* Facebook-style "Recent Logins / 1-Click Fast Login" Cards */}
          <div className="mt-8 text-left hidden sm:block">
            <div className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#1877F2]" />
              <span>Recent logins / 1-Click demo accounts:</span>
            </div>

            <div className="grid grid-cols-4 gap-2.5">
              {[
                {
                  id: 'user_taimoor',
                  name: 'Taimoor Khan',
                  role: 'Admin / Dev',
                  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
                },
                {
                  id: 'user_sarah',
                  name: 'Sarah Jenkins',
                  role: 'UI Designer',
                  avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80'
                },
                {
                  id: 'user_alex',
                  name: 'Alex Rivera',
                  role: 'Photographer',
                  avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80'
                },
                {
                  id: 'user_marcus',
                  name: 'Marcus Vance',
                  role: 'Athlete',
                  avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80'
                }
              ].map((acc) => (
                <div
                  key={acc.id}
                  onClick={() => demoLogin(acc.id)}
                  className="bg-white dark:bg-[#242526] rounded-xl overflow-hidden shadow-xs hover:shadow-lg border border-gray-200/90 dark:border-[#393A3B] cursor-pointer transition-all hover:-translate-y-1 group"
                >
                  <div className="h-24 w-full overflow-hidden bg-gray-100">
                    <img
                      src={acc.avatar}
                      alt={acc.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-2 text-center">
                    <div className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate">
                      {acc.name}
                    </div>
                    <div className="text-[10px] text-gray-500 truncate">{acc.role}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Facebook Clean Login Card */}
        <div className="w-full max-w-sm">
          <div className="bg-white dark:bg-[#242526] p-6 rounded-2xl shadow-xl border border-gray-200/90 dark:border-[#393A3B] space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 text-rose-600 text-xs font-semibold border border-rose-200">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-3.5">
              <input
                type="text"
                value={emailOrUsername}
                onChange={(e) => setEmailOrUsername(e.target.value)}
                placeholder="Email address or username"
                required
                className="w-full p-3.5 text-sm sm:text-base rounded-xl border border-gray-300 dark:border-[#393A3B] bg-transparent text-gray-900 dark:text-gray-100 outline-none focus:border-[#1877F2] focus:ring-2 focus:ring-[#1877F2]/20"
              />

              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  required
                  className="w-full p-3.5 pr-10 text-sm sm:text-base rounded-xl border border-gray-300 dark:border-[#393A3B] bg-transparent text-gray-900 dark:text-gray-100 outline-none focus:border-[#1877F2] focus:ring-2 focus:ring-[#1877F2]/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-[#1877F2] hover:bg-[#166FE5] text-white font-bold text-base sm:text-lg rounded-xl shadow-md transition-colors cursor-pointer"
              >
                {isSubmitting ? 'Logging In...' : 'Log In'}
              </button>
            </form>

            <div className="flex items-center justify-between text-xs pt-1 px-1">
              <button
                type="button"
                onClick={() => {
                  setEmailOrUsername('taimoor@social.com');
                  setPassword('taimoor123');
                }}
                className="text-gray-500 hover:text-[#1877F2] font-semibold text-[11px] underline cursor-pointer"
                title="Fill demo credentials"
              >
                Auto-fill Demo
              </button>
              <button
                type="button"
                onClick={() => setIsForgotOpen(true)}
                className="text-[#1877F2] hover:underline font-semibold text-xs"
              >
                Forgotten password?
              </button>
            </div>

            <hr className="border-gray-200 dark:border-[#393A3B]" />

            {/* Green "Create new account" button (Facebook signature) */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setIsRegisterOpen(true)}
                className="w-full sm:w-auto px-6 py-3 bg-[#42B72A] hover:bg-[#36A420] text-white font-extrabold text-sm sm:text-base rounded-xl shadow-md transition-colors cursor-pointer inline-flex items-center justify-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                <span>Create new account</span>
              </button>
            </div>
          </div>

          <div className="text-center mt-5 text-xs text-gray-500">
            <span className="font-bold text-gray-700 dark:text-gray-300">Create a Page</span> for a creator, brand or business.
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white dark:bg-[#242526] py-6 border-t border-[#E4E6EB] dark:border-[#393A3B] text-[11px] text-gray-500 text-center space-y-2">
        <div className="flex flex-wrap justify-center gap-4 text-gray-600 dark:text-gray-400 max-w-4xl mx-auto px-4">
          <span>English (UK)</span>
          <span>اردو</span>
          <span>हिन्दी</span>
          <span>Español</span>
          <span>Français</span>
          <span>العربية</span>
          <span>Deutsch</span>
          <span>Italiano</span>
        </div>
        <hr className="max-w-4xl mx-auto border-gray-200 dark:border-[#393A3B]" />
        <div>
          TAIMOOR SOCIAL © 2026 • Connect • Share • Communicate • Designed & Engineered by Taimoor Khan
        </div>
      </footer>

      {/* Facebook Signature "Sign Up - It's quick and easy" Registration Modal */}
      {isRegisterOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#242526] rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-gray-200 dark:border-[#393A3B] relative animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-[#393A3B]">
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-gray-100">
                  Sign Up
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  It's quick and easy. Join TAIMOOR SOCIAL today.
                </p>
              </div>
              <button
                onClick={() => setIsRegisterOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 dark:bg-[#3A3B3C] hover:bg-gray-200 dark:hover:bg-[#4E4F50] flex items-center justify-center text-gray-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {regError && (
              <div className="mt-3 p-3 rounded-xl bg-rose-50 text-rose-600 text-xs font-semibold border border-rose-200">
                {regError}
              </div>
            )}

            <form onSubmit={handleRegister} className="mt-4 space-y-3.5">
              {/* First & Last Name */}
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="First name"
                  required
                  className="p-3 text-sm rounded-xl border border-gray-300 dark:border-[#393A3B] bg-[#F5F6F7] dark:bg-[#3A3B3C] text-gray-900 dark:text-gray-100 outline-none focus:bg-white focus:border-[#1877F2]"
                />
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Surname"
                  required
                  className="p-3 text-sm rounded-xl border border-gray-300 dark:border-[#393A3B] bg-[#F5F6F7] dark:bg-[#3A3B3C] text-gray-900 dark:text-gray-100 outline-none focus:bg-white focus:border-[#1877F2]"
                />
              </div>

              {/* Email Address */}
              <input
                type="email"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                placeholder="Mobile number or email address"
                required
                className="w-full p-3 text-sm rounded-xl border border-gray-300 dark:border-[#393A3B] bg-[#F5F6F7] dark:bg-[#3A3B3C] text-gray-900 dark:text-gray-100 outline-none focus:bg-white focus:border-[#1877F2]"
              />

              {/* Password */}
              <div className="relative">
                <input
                  type={showRegPassword ? 'text' : 'password'}
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="New password (min 6 characters)"
                  required
                  className="w-full p-3 pr-10 text-sm rounded-xl border border-gray-300 dark:border-[#393A3B] bg-[#F5F6F7] dark:bg-[#3A3B3C] text-gray-900 dark:text-gray-100 outline-none focus:bg-white focus:border-[#1877F2]"
                />
                <button
                  type="button"
                  onClick={() => setShowRegPassword(!showRegPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Birthday Selectors (Day, Month, Year) */}
              <div>
                <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-300 font-semibold mb-1">
                  <span>Date of birth</span>
                  <HelpCircle className="w-3.5 h-3.5 text-gray-400" />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <select
                    value={birthDay}
                    onChange={(e) => setBirthDay(e.target.value)}
                    className="p-2.5 text-xs rounded-xl border border-gray-300 dark:border-[#393A3B] bg-white dark:bg-[#3A3B3C] text-gray-900 dark:text-gray-100 outline-none font-medium cursor-pointer"
                  >
                    {days.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>

                  <select
                    value={birthMonth}
                    onChange={(e) => setBirthMonth(e.target.value)}
                    className="p-2.5 text-xs rounded-xl border border-gray-300 dark:border-[#393A3B] bg-white dark:bg-[#3A3B3C] text-gray-900 dark:text-gray-100 outline-none font-medium cursor-pointer"
                  >
                    {months.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>

                  <select
                    value={birthYear}
                    onChange={(e) => setBirthYear(e.target.value)}
                    className="p-2.5 text-xs rounded-xl border border-gray-300 dark:border-[#393A3B] bg-white dark:bg-[#3A3B3C] text-gray-900 dark:text-gray-100 outline-none font-medium cursor-pointer"
                  >
                    {years.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Gender Radio Boxes (Female, Male, Custom) */}
              <div>
                <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-300 font-semibold mb-1">
                  <span>Gender</span>
                  <HelpCircle className="w-3.5 h-3.5 text-gray-400" />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {['Female', 'Male', 'Custom'].map((g) => (
                    <label
                      key={g}
                      className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-colors ${
                        gender === g
                          ? 'border-[#1877F2] bg-blue-50/50 dark:bg-blue-950/40 text-gray-900 dark:text-gray-100'
                          : 'border-gray-300 dark:border-[#393A3B] bg-white dark:bg-[#3A3B3C] text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <span className="text-xs font-semibold">{g}</span>
                      <input
                        type="radio"
                        name="gender"
                        value={g}
                        checked={gender === g}
                        onChange={() => setGender(g)}
                        className="accent-[#1877F2]"
                      />
                    </label>
                  ))}
                </div>
              </div>

              {/* Choose Profile Avatar / Upload Own Photo */}
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#18191A] border border-gray-200 dark:border-[#393A3B] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-700 dark:text-gray-200 font-bold block">
                    Profile Picture:
                  </span>
                  <span className="text-[10px] text-gray-400">Upload your own or pick one</span>
                </div>

                {/* Upload Button & Live Preview */}
                <div className="flex items-center gap-3">
                  <img
                    src={selectedAvatar}
                    alt="Selected"
                    className="w-14 h-14 rounded-full object-cover border-2 border-[#1877F2] shadow-sm shrink-0"
                  />
                  <div className="flex-1">
                    <input
                      type="file"
                      ref={regAvatarInputRef}
                      accept="image/*"
                      onChange={handleRegAvatarUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => regAvatarInputRef.current?.click()}
                      className="w-full py-2 px-3 rounded-xl border border-[#1877F2] bg-white dark:bg-[#242526] hover:bg-blue-50 text-[#1877F2] font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                    >
                      <span>Upload Photo from Device</span>
                    </button>
                    <span className="text-[10px] text-gray-400 block mt-1">Tap to pick picture from gallery or camera</span>
                  </div>
                </div>

                {/* Preset Avatars */}
                <div>
                  <span className="text-[11px] font-semibold text-gray-500 block mb-1.5">
                    Or choose quick avatar:
                  </span>
                  <div className="grid grid-cols-6 gap-2">
                    {avatarChoices.map((url, i) => (
                      <img
                        key={i}
                        src={url}
                        alt=""
                        onClick={() => setSelectedAvatar(url)}
                        className={`h-10 w-10 rounded-full object-cover cursor-pointer transition-all mx-auto ${
                          selectedAvatar === url
                            ? 'ring-2 ring-[#1877F2] scale-105'
                            : 'opacity-70 hover:opacity-100'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Optional Location & Occupation */}
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  value={regWork}
                  onChange={(e) => setRegWork(e.target.value)}
                  placeholder="Job / Profession (optional)"
                  className="p-2.5 text-xs rounded-xl border border-gray-300 dark:border-[#393A3B] bg-transparent text-gray-900 dark:text-gray-100 outline-none"
                />
                <input
                  type="text"
                  value={regLocation}
                  onChange={(e) => setRegLocation(e.target.value)}
                  placeholder="City / Country (optional)"
                  className="p-2.5 text-xs rounded-xl border border-gray-300 dark:border-[#393A3B] bg-transparent text-gray-900 dark:text-gray-100 outline-none"
                />
              </div>

              <p className="text-[10px] text-gray-500 leading-tight">
                By clicking Sign Up, you agree to our <span className="text-[#1877F2]">Terms</span>, <span className="text-[#1877F2]">Privacy Policy</span> and <span className="text-[#1877F2]">Cookies Policy</span>. You may receive SMS notifications from us and can opt out at any time.
              </p>

              {/* Sign Up Button */}
              <div className="pt-2 text-center">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-12 py-2.5 bg-[#00A400] hover:bg-[#36A420] text-white font-extrabold text-base rounded-xl shadow-md transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating account...' : 'Sign Up'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Forgot Password Modal */}
      {isForgotOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#242526] rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-gray-200 dark:border-[#393A3B]">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-[#393A3B]">
              <h3 className="font-bold text-base text-gray-900 dark:text-gray-100">Find Your Account</h3>
              <button onClick={() => setIsForgotOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {forgotMsg && (
              <div className="mt-3 p-2.5 rounded-lg bg-blue-50 text-[#1877F2] text-xs font-semibold">
                {forgotMsg}
              </div>
            )}

            {forgotStep === 1 ? (
              <form onSubmit={handleSendResetCode} className="mt-4 space-y-3">
                <p className="text-xs text-gray-600 dark:text-gray-300">
                  Please enter your email address to search for your account and receive a security code.
                </p>
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="Email address"
                  required
                  className="w-full p-3 text-xs rounded-xl border border-gray-300 dark:border-[#393A3B] bg-transparent text-gray-900 dark:text-gray-100 outline-none"
                />
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsForgotOpen(false)}
                    className="px-4 py-2 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-bold text-white bg-[#1877F2] hover:bg-[#166FE5] rounded-lg shadow"
                  >
                    Search
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="mt-4 space-y-3">
                <p className="text-xs text-gray-600 dark:text-gray-300">
                  Enter the verification code and set your new password.
                </p>
                <input
                  type="text"
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value)}
                  placeholder="Security Code"
                  required
                  className="w-full p-3 text-xs rounded-xl border border-gray-300 dark:border-[#393A3B] bg-transparent text-gray-900 dark:text-gray-100 outline-none"
                />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New Password (min 6 characters)"
                  required
                  className="w-full p-3 text-xs rounded-xl border border-gray-300 dark:border-[#393A3B] bg-transparent text-gray-900 dark:text-gray-100 outline-none"
                />
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="submit"
                    className="w-full py-2.5 text-xs font-bold text-white bg-[#1877F2] hover:bg-[#166FE5] rounded-xl shadow"
                  >
                    Reset Password
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

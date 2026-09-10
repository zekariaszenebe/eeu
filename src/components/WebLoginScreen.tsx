import React, { useState, useEffect } from 'react';
import { 
  Lock, User, Eye, EyeOff, AlertCircle, ArrowRight, Headphones, Shield, 
  HelpCircle, Check, Zap, Users, ShieldCheck, PhoneCall, Info
} from 'lucide-react';
import EEULogo from './EEULogo';
import { UserRole, TeamLeaderUser } from '../types';

interface WebLoginScreenProps {
  onLoginSuccess: (role: UserRole, teamLeader?: TeamLeaderUser) => void;
  teamLeaders?: TeamLeaderUser[];
}

export default function WebLoginScreen({ onLoginSuccess, teamLeaders = [] }: WebLoginScreenProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  // Load saved credentials if 'remember me' is checked
  useEffect(() => {
    const savedRemember = localStorage.getItem('eeu_remember_me') === 'true';
    setRememberMe(savedRemember);
    if (savedRemember) {
      const savedUser = localStorage.getItem('eeu_saved_username') || '';
      const savedPass = localStorage.getItem('eeu_saved_password') || '';
      setUsername(savedUser);
      setPassword(savedPass);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password) {
      setError('Please enter your Employee ID / Username and Password.');
      return;
    }

    setIsSubmitting(true);

    // Normalize user input to compare flexibly with or without leading '@'
    const rawUser = username.trim().toLowerCase();
    const strippedUser = rawUser.startsWith('@') ? rawUser.substring(1) : rawUser;
    const withAtUser = rawUser.startsWith('@') ? rawUser : `@${rawUser}`;

    setTimeout(() => {
      // Prompt Google Password Manager / Browser Credential Store if supported
      if (typeof window !== 'undefined' && 'PasswordCredential' in window && (window as any).PasswordCredential) {
        try {
          const cred = new (window as any).PasswordCredential({
            id: username,
            password: password,
            name: username
          });
          if (navigator.credentials && navigator.credentials.store) {
            navigator.credentials.store(cred).catch(() => {});
          }
        } catch {
          // Silent fallback if browser credential store restrictions apply
        }
      }

      // 1. Check if Admin
      if ((strippedUser === 'admin' || withAtUser === '@admin') && (password === 'Eeu@1234' || password === '@Eeu1234')) {
        saveCredentials();
        onLoginSuccess('admin');
        return;
      }

      // 2. Check registered Users in database
      const matchedTL = teamLeaders.find((tl) => {
        const tlUser = tl.username.trim().toLowerCase();
        const tlStripped = tlUser.startsWith('@') ? tlUser.substring(1) : tlUser;
        return (tlUser === rawUser || tlUser === withAtUser || tlStripped === strippedUser) && tl.password === password;
      });

      if (matchedTL) {
        saveCredentials();
        onLoginSuccess(matchedTL.role || 'team_leader', matchedTL);
        return;
      }

      // Default hardcoded Team Leader fallback (Teams A, B, C, D and named Team Leaders like Zekarias Zenebe)
      if (
        (strippedUser === 'teamleader' || strippedUser === 'tl' || strippedUser === 'team_a' || strippedUser === 'team_b' || strippedUser === 'team_c' || strippedUser === 'team_d' || strippedUser === 'teama' || strippedUser === 'teamb' || strippedUser === 'teamc' || strippedUser === 'teamd' || strippedUser === 'zekarias' || strippedUser === 'zekariaszenebe' || strippedUser === 'zekarias_zenebe' || strippedUser === 'zenebe') && 
        (password === 'Tl@1234' || password === 'Eeu@1234' || password === '@Eeu1234')
      ) {
        let teamName = 'Team Leader';
        let districtName = 'Team A';
        if (strippedUser === 'team_b' || strippedUser === 'teamb') {
          teamName = 'Team Leader';
          districtName = 'Team B';
        }
        if (strippedUser === 'team_c' || strippedUser === 'teamc') {
          teamName = 'Team Leader';
          districtName = 'Team C';
        }
        if (strippedUser === 'team_d' || strippedUser === 'teamd' || strippedUser === 'zekarias' || strippedUser === 'zekariaszenebe' || strippedUser === 'zekarias_zenebe' || strippedUser === 'zenebe') {
          teamName = 'Team Leader';
          districtName = 'Team D';
        }

        saveCredentials();
        onLoginSuccess('team_leader', {
          id: `tl-fallback-${strippedUser}`,
          username: rawUser,
          password: 'Tl@1234',
          name: teamName,
          district: districtName,
          createdAt: new Date().toISOString()
        });
        return;
      }

      // 3. Check Contact Center Agent
      if ((strippedUser === 'contactcenter' || strippedUser === 'agent') && (password === 'Eeu@1234' || password === '@Eeu1234')) {
        saveCredentials();
        onLoginSuccess('agent');
        return;
      }

      // Invalid
      setError('Access Denied: Invalid credentials. Please check your username and password.');
      setIsSubmitting(false);
    }, 500);
  };

  const saveCredentials = () => {
    if (rememberMe) {
      localStorage.setItem('eeu_remember_me', 'true');
      localStorage.setItem('eeu_saved_username', username);
      localStorage.setItem('eeu_saved_password', password);
    } else {
      localStorage.removeItem('eeu_remember_me');
      localStorage.removeItem('eeu_saved_username');
      localStorage.removeItem('eeu_saved_password');
    }
  };

  return (
    <div 
      className="min-h-screen w-full relative flex items-center justify-center p-4 sm:p-6 lg:p-12 select-none overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, #16851D 0%, #1e8d26 15%, #2d942e 28%, #4f9c2d 42%, #839d22 56%, #b88f18 68%, #d8810b 80%, #ea8505 90%, #F28A00 100%)',
        minHeight: '100vh',
        width: '100%'
      }}
    >
      {/* Main Grid: Left Hero Branding + Right Elevated Login Card */}
      <div className="relative z-10 w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        
        {/* LEFT COLUMN: EEU Branding, Hero Typography & Trust Badges */}
        <div className="lg:col-span-6 flex flex-col justify-between text-left space-y-8 py-2 md:py-6">
          
          {/* Top Brand Header: Logo + Ethiopian Electric Utility */}
          <div className="flex items-center gap-3.5 h-[70.2656px]">
            <div className="w-14 h-14 shrink-0 rounded-full shadow-lg overflow-hidden flex items-center justify-center bg-white/10 backdrop-blur-sm border border-white/20">
              <EEULogo size={56} showText={false} />
            </div>
            <div className="leading-tight">
              <div className="font-sans font-medium text-[#f4984a] text-[16px] tracking-wide drop-shadow-sm">
                የኢትዮጵያ ኤሌክትሪክ አገልግሎት
              </div>
              <div className="font-sans font-bold text-[#366933] text-[26px] leading-[32.5px] border-0 tracking-tight drop-shadow-sm">
                Ethiopian Electric Utility
              </div>
            </div>
          </div>

          {/* Center Hero Heading & Slogan */}
          <div className="space-y-3 pt-4 sm:pt-8">
            <h1 className="text-4xl sm:text-5xl lg:text-[56px] font-black text-white leading-[1.08] tracking-tight drop-shadow-md">
              Powering Ethiopia<br />
              Lighting the Future
            </h1>
            <p className="text-base sm:text-lg font-medium text-white/90 tracking-wide pt-1 drop-shadow-sm">
              Reliable. Sustainable. Together.
            </p>
          </div>

          {/* Bottom Feature Badges (Customer Focused, Reliable Service, Powering Progress) */}
          <div className="pt-6 sm:pt-10 grid grid-cols-3 gap-3 sm:gap-4 max-w-lg">
            {/* Feature 1 */}
            <div className="flex items-center gap-2.5 sm:gap-3 text-white">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full border border-white/40 bg-white/10 backdrop-blur-md flex items-center justify-center shrink-0 shadow-sm">
                <Headphones className="w-5 h-5 text-white stroke-[2]" />
              </div>
              <div className="leading-tight text-left">
                <span className="block text-xs sm:text-sm font-bold text-white leading-tight">Customer</span>
                <span className="block text-xs sm:text-sm font-medium text-white/80 leading-tight">Focused</span>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="flex items-center gap-2.5 sm:gap-3 text-white">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full border border-white/40 bg-white/10 backdrop-blur-md flex items-center justify-center shrink-0 shadow-sm">
                <ShieldCheck className="w-5 h-5 text-white stroke-[2]" />
              </div>
              <div className="leading-tight text-left">
                <span className="block text-xs sm:text-sm font-bold text-white leading-tight">Reliable</span>
                <span className="block text-xs sm:text-sm font-medium text-white/80 leading-tight">Service</span>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="flex items-center gap-2.5 sm:gap-3 text-white">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full border border-white/40 bg-white/10 backdrop-blur-md flex items-center justify-center shrink-0 shadow-sm">
                <Zap className="w-5 h-5 text-white stroke-[2.2]" />
              </div>
              <div className="leading-tight text-left">
                <span className="block text-xs sm:text-sm font-bold text-white leading-tight">Powering</span>
                <span className="block text-xs sm:text-sm font-medium text-white/80 leading-tight">Progress</span>
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Elevated Modern EEU Call Center Login Card */}
        <div className="lg:col-span-6 flex justify-center lg:justify-end">
          <div 
            id="web-login-card"
            className="w-full max-w-[460px] bg-white rounded-[28px] sm:rounded-[36px] shadow-2xl shadow-black/35 border border-white/80 p-7 sm:p-9 md:p-10 relative overflow-hidden"
          >
            {/* Top Center Icon */}
            <div className="flex flex-col items-center text-center mb-6">
              {/* Headset Icon */}
              <div className="relative mb-3 flex items-center justify-center">
                <svg className="w-16 h-16 text-[#0d4a2b]" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Headband */}
                  <path 
                    d="M14 34 C14 20, 22 12, 32 12 C42 12, 50 20, 50 34" 
                    stroke="#0d4a2b" 
                    strokeWidth="4" 
                    strokeLinecap="round" 
                  />
                  {/* Left Ear Cushion */}
                  <rect x="9" y="30" width="8" height="15" rx="4" fill="#0d4a2b" />
                  {/* Right Ear Cushion */}
                  <rect x="47" y="30" width="8" height="15" rx="4" fill="#0d4a2b" />
                  {/* Microphone Boom */}
                  <path 
                    d="M48 41 C48 50, 42 54, 35 54" 
                    stroke="#0d4a2b" 
                    strokeWidth="3.5" 
                    strokeLinecap="round" 
                  />
                  {/* Mic head */}
                  <circle cx="34" cy="54" r="2.5" fill="#0d4a2b" />
                </svg>
              </div>

              {/* Title & Subtitle */}
              <h2 className="text-2xl font-black text-[#0d4a2b] tracking-tight uppercase">
                EEU CONTACT CENTER
              </h2>
              <p className="text-xs sm:text-sm font-semibold text-gray-500 mt-0.5">
                Feeder Interruptions Dashboard For Call Center
              </p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} method="post" action="#" className="space-y-4 text-left">
              {/* Username Input */}
              <div>
                <label htmlFor="login-username-input" className="block text-xs sm:text-sm font-bold text-gray-800 mb-1.5 font-sans">
                  Username
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400 pointer-events-none">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    id="login-username-input"
                    name="username"
                    type="text"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0d4a2b] focus:border-transparent transition-all shadow-xs"
                    autoComplete="username"
                    required
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label htmlFor="login-password-input" className="block text-xs sm:text-sm font-bold text-gray-800 mb-1.5 font-sans">
                  Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400 pointer-events-none">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    id="login-password-input"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full pl-10 pr-11 py-2.5 sm:py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0d4a2b] focus:border-transparent transition-all shadow-xs"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    id="login-toggle-password-btn"
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isSubmitting}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    title={showPassword ? "Hide password" : "Show password"}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4.5 h-4.5 text-gray-500 hover:text-gray-700" />
                    ) : (
                      <Eye className="w-4.5 h-4.5 text-gray-500 hover:text-gray-700" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember Me Row */}
              <div className="flex items-center justify-between pt-0.5 select-none text-xs sm:text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    id="login-remember-me"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    disabled={isSubmitting}
                    className="w-4 h-4 rounded border-gray-300 text-[#0d4a2b] focus:ring-[#0d4a2b] cursor-pointer accent-[#0d4a2b]"
                  />
                  <span className="text-gray-600 font-medium">
                    Remember me
                  </span>
                </label>
              </div>

              {/* Error Box */}
              {error && (
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs text-left animate-in fade-in duration-200">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Primary Sign In Button */}
              <button
                id="login-submit-btn"
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 bg-[#0a5c36] hover:bg-[#074729] active:bg-[#053a20] text-white rounded-xl font-bold text-sm sm:text-base transition-all shadow-md shadow-emerald-900/15 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 leading-none mt-2"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Signing in...</span>
                  </>
                ) : (
                  <span>Login</span>
                )}
              </button>
            </form>

            {/* Bottom Credits & Copyright */}
            <div id="login-card-credits-footer" className="mt-6 pt-4 border-t border-gray-150/70 text-center space-y-1 select-text">
              <p className="text-[11.5px] font-medium text-gray-600">
                Developed by <span className="font-bold text-[#0d4a2b]">Zekarias Zenebe</span>
              </p>
              <p className="text-[10px] text-gray-400 font-sans tracking-tight">
                Copyright © {new Date().getFullYear()} Ethiopian Electric Utility. All rights reserved.
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* 24/7 IT Support Modal */}
      {showSupportModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-gray-100 text-left animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-[#0d4a2b] flex items-center justify-center font-bold">
                <Headphones className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-base">EEU 24/7 Support Desk</h3>
                <p className="text-xs text-gray-500">Contact Center Agent Assistance</p>
              </div>
            </div>
            <div className="space-y-2.5 text-xs text-gray-700 bg-gray-50 p-4 rounded-2xl border border-gray-200/80 font-mono">
              <p><strong>Hotline:</strong> 905 / +251 11 123 4567</p>
              <p><strong>IT Desk Email:</strong> support@eeu.gov.et</p>
              <p><strong>HQ Location:</strong> EEU HQ - ICT Department, Addis Ababa</p>
              <p><strong>Support Availability:</strong> 24/7 Continuous Operation</p>
            </div>
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setShowSupportModal(false)}
                className="px-5 py-2.5 bg-[#0a5c36] text-white text-xs font-bold rounded-xl hover:bg-[#074729] cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-gray-100 text-left animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-2xl bg-orange-50 text-[#ea580c] flex items-center justify-center font-bold">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-base">Password Recovery</h3>
                <p className="text-xs text-gray-500">EEU Employee Credentials Protocol</p>
              </div>
            </div>
            <div className="space-y-2.5 text-xs text-gray-700 bg-orange-50/50 p-4 rounded-2xl border border-orange-200/80">
              <p className="font-semibold text-gray-900">To reset your agent credentials:</p>
              <ul className="list-disc pl-4 space-y-1 text-gray-600">
                <li>Contact your Team Leader or Shift Supervisor.</li>
                <li>System Administrators can generate a new temporary passcode.</li>
                <li>Call internal hotline <strong>905</strong> for emergency reset.</li>
              </ul>
            </div>
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="px-5 py-2.5 bg-[#ea580c] text-white text-xs font-bold rounded-xl hover:bg-[#c2410c] cursor-pointer"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}

      {/* We're Here to Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-gray-100 text-left animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-[#0d4a2b] flex items-center justify-center font-bold">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-base">We're Here to Help</h3>
                <p className="text-xs text-gray-500">Contact Center Agent Support & Guidance</p>
              </div>
            </div>
            <div className="space-y-2.5 text-xs text-gray-700 bg-gray-50 p-4 rounded-2xl border border-gray-200/80">
              <p>Welcome to the official <strong>Ethiopian Electric Utility Contact Center Portal</strong>.</p>
              <p>This platform provides real-time access to feeder interruptions, live district outage tracking, resolution archiving, and electric billing & smart meter tariff calculators.</p>
              <p className="text-gray-500 text-[11px] font-mono">Shift supervisors and technical support are standing by 24/7.</p>
            </div>
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="px-5 py-2.5 bg-[#0a5c36] text-white text-xs font-bold rounded-xl hover:bg-[#074729] cursor-pointer"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



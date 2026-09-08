import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { authApi } from '../services/api';
import {
  ArrowLeft,
  ArrowRight,
  Mail,
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  ShieldCheck,
  Shield,
  Zap,
  KeyRound,
  Phone,
  AtSign,
  BadgeCheck,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  LogIn,
  Timer,
} from 'lucide-react';

type Screen = 'welcome' | 'signup' | 'otp' | 'login' | 'reset';

const LIME = '#c3f400';

// ------------------------------------------------------------------
// Neo-brutalist emblem (lime offset block behind a white logo tile)
// ------------------------------------------------------------------
const Emblem: React.FC<{ size?: number }> = ({ size = 96 }) => (
  <div className="relative inline-block" style={{ width: size, height: size }} data-testid="brand-emblem">
    <div
      className="absolute rounded-2xl"
      style={{ inset: 0, transform: 'translate(8px, 8px)', background: LIME }}
    />
    <div className="absolute inset-0 rounded-2xl bg-[#1a1f2b] border-[2.5px] border-[#0b0e14] shadow-brutal flex items-center justify-center">
      <div className="w-[62%] h-[62%] rounded-xl bg-white flex items-center justify-center relative overflow-hidden">
        <div className="w-[58%] h-[58%] bg-[#3865ff] rotate-45 rounded-[6px]" />
        <Zap
          className="absolute"
          style={{ width: '40%', height: '40%', color: LIME, fill: LIME, stroke: '#0b0e14', strokeWidth: 2 }}
        />
      </div>
    </div>
  </div>
);

// ------------------------------------------------------------------
// Field label + tag row
// ------------------------------------------------------------------
const FieldLabel: React.FC<{ icon?: React.ReactNode; children: React.ReactNode; tag?: React.ReactNode }> = ({
  icon,
  children,
  tag,
}) => (
  <div className="flex items-center justify-between mb-2">
    <span className="flex items-center gap-2 text-[13px] font-bold uppercase tracking-[0.06em] text-[#e2e8f0]">
      {icon}
      {children}
    </span>
    {tag}
  </div>
);

export const AuthScreen: React.FC<{ onSuccess?: () => void }> = ({ onSuccess }) => {
  const { establishSession } = useFinance();

  const [screen, setScreen] = useState<Screen>('welcome');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);

  // OTP / reset state
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [expiresIn, setExpiresIn] = useState(600);
  const [resendIn, setResendIn] = useState(45);
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [resetPassword2, setResetPassword2] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timers on OTP / reset screens
  useEffect(() => {
    if (screen !== 'otp' && screen !== 'reset') return;
    const t = setInterval(() => {
      setExpiresIn((p) => (p > 0 ? p - 1 : 0));
      setResendIn((p) => (p > 0 ? p - 1 : 0));
    }, 1000);
    return () => clearInterval(t);
  }, [screen]);

  const resetFeedback = () => {
    setError(null);
    setInfo(null);
  };

  const goTo = (s: Screen) => {
    resetFeedback();
    setScreen(s);
  };

  const fmtTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  // ---------------- Password strength ----------------
  const strength = useMemo(() => {
    let s = 0;
    if (password.length >= 8) s++;
    if (password.length >= 12) s++;
    if (/\d/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    return Math.min(s, 4);
  }, [password]);
  const strengthLabel = ['NONE', 'WEAK', 'FAIR', 'GOOD', 'STRONG'][strength];
  const strengthColor = ['#334155', '#ff4d6d', '#ffb020', '#38bdf8', LIME][strength];

  // ---------------- OTP input handlers ----------------
  const handleOtpChange = (idx: number, val: string) => {
    if (val.length > 1) {
      const pasted = val.replace(/\D/g, '').slice(0, 6);
      if (pasted.length) {
        const next = ['', '', '', '', '', ''];
        for (let i = 0; i < 6; i++) next[i] = pasted[i] || '';
        setOtpDigits(next);
        otpRefs.current[Math.min(pasted.length, 5)]?.focus();
      }
      return;
    }
    const clean = val.replace(/\D/g, '');
    const next = [...otpDigits];
    next[idx] = clean;
    setOtpDigits(next);
    if (clean && idx < 5) otpRefs.current[idx + 1]?.focus();
  };

  const handleOtpKey = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[idx] && idx > 0) otpRefs.current[idx - 1]?.focus();
  };

  // ---------------- Actions ----------------
  const handleGoogle = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + '/';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  const startOtpScreen = (res: { expires_in?: number; dev_otp?: string }) => {
    setOtpDigits(['', '', '', '', '', '']);
    setExpiresIn(res.expires_in || 600);
    setResendIn(45);
    setDevOtp(res.dev_otp || null);
    setScreen('otp');
    setTimeout(() => otpRefs.current[0]?.focus(), 150);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    resetFeedback();
    const cleanEmail = email.trim().toLowerCase();
    if (!name.trim()) return setError('Please enter your full name.');
    if (!cleanEmail.includes('@')) return setError('Please enter a valid email address.');
    if (password.length < 6) return setError('Master key must be at least 6 characters.');
    setIsLoading(true);
    try {
      const res = await authApi.requestOtp({
        name: name.trim(),
        email: cleanEmail,
        password,
        phone: phone.trim() || undefined,
        country_code: '+91',
      });
      startOtpScreen(res);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async () => {
    resetFeedback();
    const code = otpDigits.join('');
    if (code.length < 6) return setError('Enter all 6 digits of the authentication code.');
    setIsLoading(true);
    try {
      const res = await authApi.verify({ email: email.trim().toLowerCase(), code });
      establishSession(res.user);
      onSuccess?.();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    resetFeedback();
    try {
      const res = await authApi.resendOtp(email.trim().toLowerCase());
      setResendIn(45);
      setExpiresIn(res.expires_in || 600);
      setDevOtp(res.dev_otp || null);
      setInfo('A new code was dispatched.');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    resetFeedback();
    setIsLoading(true);
    try {
      const res = await authApi.login({ email: email.trim().toLowerCase(), password });
      establishSession(res.user);
      onSuccess?.();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgot = async () => {
    resetFeedback();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail.includes('@')) {
      setError('Enter your email above first, then tap Forgot Password.');
      return;
    }
    setIsLoading(true);
    try {
      const res = await authApi.forgotPassword(cleanEmail);
      setOtpDigits(['', '', '', '', '', '']);
      setExpiresIn(res.expires_in || 600);
      setResendIn(45);
      setDevOtp(res.dev_otp || null);
      setPassword('');
      setResetPassword2('');
      setScreen('reset');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    resetFeedback();
    const code = otpDigits.join('');
    if (code.length < 6) return setError('Enter the 6-digit reset code.');
    if (password.length < 6) return setError('New master key must be at least 6 characters.');
    if (password !== resetPassword2) return setError('The two master keys do not match.');
    setIsLoading(true);
    try {
      await authApi.resetPassword({ email: email.trim().toLowerCase(), code, new_password: password });
      setInfo('Master key updated. Please log in.');
      setPassword('');
      setResetPassword2('');
      setTimeout(() => goTo('login'), 900);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // ---------------- Shared UI pieces ----------------
  const Feedback = () => (
    <>
      {error && (
        <div
          className="p-3 rounded-xl bg-[#291419] border-2 border-[#ff4d6d] text-[13px] text-[#ff7b8a] font-semibold flex items-center gap-2"
          data-testid="auth-error"
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {info && (
        <div
          className="p-3 rounded-xl bg-[#142b1e] border-2 border-[#c3f400] text-[13px] text-[#c3f400] font-semibold flex items-center gap-2"
          data-testid="auth-info"
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{info}</span>
        </div>
      )}
    </>
  );

  const inputClass =
    'w-full bg-[#0b0e14] border-2 border-[#2a334a] rounded-xl py-3.5 text-[15px] text-white placeholder-[#4b5568] focus:outline-none focus:border-[#c3f400] transition-colors';

  // ==================================================================
  // WELCOME
  // ==================================================================
  if (screen === 'welcome') {
    return (
      <div className="min-h-screen w-full flex flex-col px-6 pt-6 pb-10 max-w-md mx-auto" data-testid="welcome-screen">
        <div className="border-t border-[#2a334a] pt-4 flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-[#647087]">
          <span>SECURE // v2.0</span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#c3f400] animate-pulse" /> NODE ONLINE
          </span>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center text-center gap-6 py-10">
          <Emblem size={104} />
          <div className="space-y-2">
            <h1 className="text-4xl sm:text-5xl font-black uppercase tracking-tight leading-none">
              <span className="text-white">RECORDS</span> <span className="text-[#c3f400]">BY ARSONIST</span>
            </h1>
            <p className="text-[13px] text-[#8b93a7] font-medium">Tactile Personal Finance &amp; Velocity Tracking</p>
          </div>
        </div>

        <div className="space-y-3">
          <button
            type="button"
            onClick={() => goTo('signup')}
            data-testid="welcome-create-account-btn"
            className="w-full py-4 rounded-xl bg-[#c3f400] text-[#0b0e14] text-[14px] font-black uppercase tracking-[0.06em] flex items-center justify-center gap-2 shadow-brutal-white active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
          >
            <UserIcon className="w-4 h-4" strokeWidth={2.5} />
            Create Account
          </button>

          <button
            type="button"
            onClick={() => goTo('login')}
            data-testid="welcome-login-btn"
            className="w-full py-4 rounded-xl bg-[#141824] border-2 border-[#2a334a] text-white text-[14px] font-bold uppercase tracking-[0.06em] flex items-center justify-center gap-2 shadow-brutal active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
          >
            <Mail className="w-4 h-4" />
            Log In With Email
          </button>

          <button
            type="button"
            onClick={handleGoogle}
            data-testid="welcome-google-btn"
            className="w-full py-4 rounded-xl bg-[#0b0e14] border-2 border-[#2a334a] text-white text-[14px] font-bold uppercase tracking-[0.06em] flex items-center justify-center gap-2.5 shadow-brutal active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            Continue with Google
          </button>

          <p className="text-[11px] text-[#647087] text-center pt-2 leading-relaxed">
            By initializing, you accept the{' '}
            <span className="text-[#8b93a7] underline font-semibold">Tactile Terms</span> and{' '}
            <span className="text-[#8b93a7] underline font-semibold">Privacy Codex</span>.
          </p>
        </div>
      </div>
    );
  }

  // ==================================================================
  // CREATE ACCOUNT
  // ==================================================================
  if (screen === 'signup') {
    return (
      <div className="min-h-screen w-full max-w-md mx-auto flex flex-col" data-testid="signup-screen">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[#2a334a]">
          <button
            type="button"
            onClick={() => goTo('welcome')}
            data-testid="signup-back-btn"
            className="w-11 h-11 rounded-xl bg-[#141824] border-2 border-[#2a334a] flex items-center justify-center text-white shadow-brutal-sm active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#c3f400]">Records by Arsonist</p>
            <p className="text-[13px] font-bold uppercase tracking-[0.08em] text-white">Account Credentials</p>
          </div>
        </div>

        <form onSubmit={handleSignup} className="flex-1 px-5 py-6 space-y-6 overflow-y-auto">
          <h1 className="text-4xl font-black uppercase tracking-tight text-white">Create Account</h1>

          <Feedback />

          {/* Full name */}
          <div>
            <FieldLabel
              icon={<BadgeCheck className="w-4 h-4 text-[#c3f400]" />}
              tag={<span className="text-[11px] font-bold uppercase tracking-widest text-[#647087]">Required</span>}
            >
              Full Name
            </FieldLabel>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-[#141824] border-2 border-[#2a334a] flex items-center justify-center text-[#8b93a7] shrink-0">
                <UserIcon className="w-5 h-5" />
              </div>
              <div className="relative flex-1">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Alex Mercer"
                  data-testid="signup-name-input"
                  className={`${inputClass} px-4 pr-11`}
                />
                {name.trim().length > 1 && (
                  <CheckCircle2 className="w-5 h-5 text-[#c3f400] absolute right-3 top-1/2 -translate-y-1/2" />
                )}
              </div>
            </div>
          </div>

          {/* Phone */}
          <div>
            <FieldLabel icon={<Phone className="w-4 h-4 text-[#c3f400]" />}>Phone Number</FieldLabel>
            <div className="flex items-center gap-3">
              <div className="h-12 px-4 rounded-xl bg-[#141824] border-2 border-[#2a334a] flex items-center gap-2 text-[#c3f400] font-bold text-[15px] shrink-0">
                IN +91
              </div>
              <input
                type="tel"
                inputMode="numeric"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/[^\d\s]/g, ''))}
                placeholder="98765 43210"
                data-testid="signup-phone-input"
                className={`${inputClass} px-4`}
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <FieldLabel
              icon={<AtSign className="w-4 h-4 text-[#c3f400]" />}
              tag={<span className="text-[11px] font-bold uppercase tracking-widest text-[#c3f400]">Master ID</span>}
            >
              Email Address
            </FieldLabel>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-[#141824] border-2 border-[#2a334a] flex items-center justify-center text-[#8b93a7] shrink-0">
                <Mail className="w-5 h-5" />
              </div>
              <div className="relative flex-1">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@mercerdesign.com"
                  data-testid="signup-email-input"
                  className={`${inputClass} px-4 pr-11`}
                />
                <Shield className="w-5 h-5 text-[#c3f400] absolute right-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          </div>

          {/* Password */}
          <div>
            <FieldLabel
              icon={<Lock className="w-4 h-4 text-[#c3f400]" />}
              tag={
                password.length > 0 ? (
                  <span
                    className="text-[11px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md border-2"
                    style={{ color: strengthColor, borderColor: strengthColor }}
                    data-testid="password-strength-label"
                  >
                    {strengthLabel}
                  </span>
                ) : undefined
              }
            >
              Master Key (Password)
            </FieldLabel>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-[#141824] border-2 border-[#2a334a] flex items-center justify-center text-[#8b93a7] shrink-0">
                <KeyRound className="w-5 h-5" />
              </div>
              <div className="relative flex-1">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  data-testid="signup-password-input"
                  className={`${inputClass} px-4 pr-11`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8b93a7] hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Strength meter */}
            <div className="mt-3 p-3 rounded-xl bg-[#141824] border-2 border-[#2a334a]">
              <div className="flex items-center gap-2 mb-2">
                {[1, 2, 3, 4].map((n) => (
                  <div
                    key={n}
                    className="h-2 flex-1 rounded-full transition-colors"
                    style={{ background: n <= strength ? strengthColor : '#232a3b' }}
                  />
                ))}
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-[12px] text-[#8b93a7] font-medium">
                  <Shield className="w-3.5 h-3.5 text-[#c3f400]" />
                  12+ chars, symbols, numerals
                </span>
                <span className="text-[11px] font-bold uppercase tracking-widest text-[#647087]">
                  Level {String(strength).padStart(2, '0')}/04
                </span>
              </div>
            </div>
          </div>

          {/* Legal */}
          <div className="flex items-start gap-2.5">
            <BadgeCheck className="w-4 h-4 text-[#c3f400] shrink-0 mt-0.5" />
            <p className="text-[12px] text-[#8b93a7] leading-relaxed">
              By tapping Continue, you agree to our{' '}
              <span className="text-white font-bold underline">Terms of Protocol</span> &amp;{' '}
              <span className="text-white font-bold underline">Privacy Policy</span>. Data transmission is secured with
              post-quantum standards.
            </p>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            data-testid="signup-submit-btn"
            className="w-full py-4 rounded-xl bg-[#c3f400] text-[#0b0e14] text-[14px] font-black uppercase tracking-[0.06em] flex items-center justify-center gap-2 shadow-brutal-white disabled:opacity-60 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
          >
            {isLoading ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Continue to Verification
                <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
              </>
            )}
          </button>

          <p className="text-center text-[13px] text-[#8b93a7] pb-2">
            Already hold an active recorder?{' '}
            <button
              type="button"
              onClick={() => goTo('login')}
              data-testid="signup-goto-login"
              className="text-[#c3f400] font-bold uppercase tracking-wide"
            >
              Log In
            </button>
          </p>
        </form>
      </div>
    );
  }

  // ==================================================================
  // OTP VERIFICATION
  // ==================================================================
  if (screen === 'otp') {
    return (
      <div className="min-h-screen w-full max-w-md mx-auto flex flex-col" data-testid="otp-screen">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2a334a]">
          <button
            type="button"
            onClick={() => goTo('signup')}
            data-testid="otp-back-btn"
            className="w-11 h-11 rounded-xl bg-[#141824] border-2 border-[#2a334a] flex items-center justify-center text-white shadow-brutal-sm active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.1em] text-[#c3f400]">
            <span className="w-2 h-2 rounded-full bg-[#c3f400] animate-pulse" /> Authentication
          </span>
        </div>

        <div className="flex-1 px-5 py-6 space-y-5">
          <span className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[#141824] border-2 border-[#2a334a] text-[12px] font-bold uppercase tracking-[0.08em] text-[#c3f400]">
            <Lock className="w-3.5 h-3.5" /> Two-Factor Authentication
          </span>

          <div className="space-y-2">
            <h1 className="text-4xl font-black text-white tracking-tight">Verify Your Email</h1>
            <p className="text-[14px] text-[#8b93a7]">We sent a 6-digit authentication code to</p>
            <p className="text-[15px]">
              <span className="text-white font-bold border-b-2 border-[#c3f400] pb-0.5">{email}</span>{' '}
              <button
                type="button"
                onClick={() => goTo('signup')}
                data-testid="otp-change-email"
                className="text-[#c3f400] font-bold ml-1"
              >
                Change
              </button>
            </p>
          </div>

          <Feedback />

          {/* OTP card */}
          <div className="p-5 rounded-2xl bg-[#141824] border-2 border-[#2a334a] shadow-brutal space-y-4">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.08em] text-[#8b93a7]">
                <ShieldCheck className="w-4 h-4 text-[#c3f400]" /> Single-Use OTP
              </span>
              <span className="text-[12px] font-bold uppercase tracking-widest text-white px-3 py-1.5 rounded-lg bg-[#0b0e14] border-2 border-[#2a334a] font-mono">
                Expires {fmtTime(expiresIn)}
              </span>
            </div>

            <div className="border-t border-[#2a334a]" />

            <div className="flex items-center justify-center gap-2">
              {otpDigits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => (otpRefs.current[idx] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleOtpKey(idx, e)}
                  data-testid={`otp-digit-${idx}`}
                  className={`w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-black font-mono bg-[#0b0e14] border-2 rounded-xl text-white outline-none transition-all ${
                    digit ? 'border-[#c3f400]' : 'border-[#2a334a] focus:border-[#c3f400]'
                  }`}
                />
              ))}
            </div>

            {devOtp && (
              <div
                className="text-center text-[11px] font-mono text-[#c3f400] bg-[#0b0e14] border border-[#c3f400]/40 rounded-lg py-2"
                data-testid="otp-dev-hint"
              >
                DEV MODE · code: <span className="font-black tracking-widest select-all">{devOtp}</span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[12px] text-[#8b93a7]">
                <Timer className="w-3.5 h-3.5" />
                {expiresIn === 0 ? 'Code expired' : `Valid for ${fmtTime(expiresIn)}`}
              </span>
              <button
                type="button"
                disabled={resendIn > 0}
                onClick={handleResend}
                data-testid="otp-resend-btn"
                className={`text-[12px] font-bold uppercase tracking-wide underline ${
                  resendIn > 0 ? 'text-[#647087] no-underline cursor-not-allowed' : 'text-[#c3f400]'
                }`}
              >
                {resendIn > 0 ? `Resend in ${resendIn}s` : 'Resend Now'}
              </button>
            </div>

            <button
              type="button"
              onClick={handleVerify}
              disabled={isLoading || otpDigits.join('').length < 6}
              data-testid="otp-verify-btn"
              className="w-full py-4 rounded-xl bg-[#c3f400] text-[#0b0e14] text-[14px] font-black uppercase tracking-[0.06em] flex items-center justify-center gap-2 shadow-brutal-white disabled:opacity-50 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
            >
              {isLoading ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Verify Code
                  <Zap className="w-4 h-4" fill="#0b0e14" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==================================================================
  // RESET PASSWORD (reached via Forgot Password)
  // ==================================================================
  if (screen === 'reset') {
    return (
      <div className="min-h-screen w-full max-w-md mx-auto flex flex-col" data-testid="reset-screen">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[#2a334a]">
          <button
            type="button"
            onClick={() => goTo('login')}
            data-testid="reset-back-btn"
            className="w-11 h-11 rounded-xl bg-[#141824] border-2 border-[#2a334a] flex items-center justify-center text-white shadow-brutal-sm active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <p className="text-[13px] font-bold uppercase tracking-[0.08em] text-white">Reset Master Key</p>
        </div>

        <form onSubmit={handleReset} className="flex-1 px-5 py-6 space-y-5">
          <h1 className="text-3xl font-black text-white tracking-tight">Set a New Key</h1>
          <p className="text-[14px] text-[#8b93a7]">
            Enter the code sent to <span className="text-[#c3f400] font-bold">{email}</span> and choose a new master key.
          </p>

          <Feedback />

          <div className="flex items-center justify-center gap-2">
            {otpDigits.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => (otpRefs.current[idx] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(idx, e.target.value)}
                onKeyDown={(e) => handleOtpKey(idx, e)}
                data-testid={`reset-otp-digit-${idx}`}
                className={`w-12 h-14 text-center text-2xl font-black font-mono bg-[#0b0e14] border-2 rounded-xl text-white outline-none transition-all ${
                  digit ? 'border-[#c3f400]' : 'border-[#2a334a] focus:border-[#c3f400]'
                }`}
              />
            ))}
          </div>

          {devOtp && (
            <div className="text-center text-[11px] font-mono text-[#c3f400]" data-testid="reset-dev-hint">
              DEV MODE · code: <span className="font-black tracking-widest select-all">{devOtp}</span>
            </div>
          )}

          <div className="relative">
            <Lock className="w-5 h-5 text-[#8b93a7] absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="New master key"
              data-testid="reset-new-password"
              className={`${inputClass} pl-12 pr-4`}
            />
          </div>
          <div className="relative">
            <Lock className="w-5 h-5 text-[#8b93a7] absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={resetPassword2}
              onChange={(e) => setResetPassword2(e.target.value)}
              placeholder="Confirm master key"
              data-testid="reset-confirm-password"
              className={`${inputClass} pl-12 pr-4`}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            data-testid="reset-submit-btn"
            className="w-full py-4 rounded-xl bg-[#c3f400] text-[#0b0e14] text-[14px] font-black uppercase tracking-[0.06em] flex items-center justify-center gap-2 shadow-brutal-white disabled:opacity-60 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
          >
            {isLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : 'Update Master Key'}
          </button>
        </form>
      </div>
    );
  }

  // ==================================================================
  // LOGIN
  // ==================================================================
  return (
    <div className="min-h-screen w-full max-w-md mx-auto flex flex-col" data-testid="login-screen">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-[#2a334a]">
        <button
          type="button"
          onClick={() => goTo('welcome')}
          data-testid="login-back-btn"
          className="w-11 h-11 rounded-xl bg-[#141824] border-2 border-[#2a334a] flex items-center justify-center text-white shadow-brutal-sm active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-[#c3f400] flex items-center justify-center">
            <Zap className="w-5 h-5 text-[#0b0e14]" fill="#0b0e14" />
          </div>
          <p className="text-[15px] font-bold uppercase tracking-[0.08em] text-white">Records by Arsonist</p>
        </div>
      </div>

      <form onSubmit={handleLogin} className="flex-1 px-5 py-6 space-y-6">
        {/* Hero box */}
        <div className="relative p-6 rounded-2xl bg-[#141824] border-2 border-[#2a334a] overflow-hidden">
          <div
            className="absolute -top-8 -right-8 w-40 h-40 rounded-full opacity-25 blur-2xl"
            style={{ background: LIME }}
          />
          <div className="relative space-y-2">
            <h1 className="text-4xl font-black text-white tracking-tight">Welcome Back.</h1>
            <p className="text-[14px] text-[#8b93a7] leading-relaxed">
              Authenticate your key to access your ledger, liquidity telemetry, and burn rate records.
            </p>
          </div>
        </div>

        <Feedback />

        {/* Email */}
        <div>
          <FieldLabel icon={<span className="w-3 h-3 bg-[#c3f400] rounded-sm inline-block" />}>Email Address</FieldLabel>
          <div className="relative">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alex@recordsbyarsonist.io"
              data-testid="login-email-input"
              className={`${inputClass} px-4 pr-12`}
            />
            <AtSign className="w-5 h-5 text-[#8b93a7] absolute right-4 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        {/* Password */}
        <div>
          <FieldLabel icon={<span className="w-3 h-3 bg-[#c3f400] rounded-sm inline-block" />}>
            Master Key / Password
          </FieldLabel>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              data-testid="login-password-input"
              className={`${inputClass} px-4 pr-12`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8b93a7] hover:text-white"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Remember + forgot */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setRemember((r) => !r)}
            data-testid="login-remember-toggle"
            className="flex items-center gap-2.5 text-[14px] text-white font-medium"
          >
            <span
              className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${
                remember ? 'bg-[#c3f400] border-[#c3f400]' : 'bg-transparent border-[#2a334a]'
              }`}
            >
              {remember && <CheckCircle2 className="w-4 h-4 text-[#0b0e14]" strokeWidth={3} />}
            </span>
            Remember this device
          </button>
          <button
            type="button"
            onClick={handleForgot}
            data-testid="login-forgot-btn"
            className="text-[13px] font-bold uppercase tracking-wide text-[#c3f400]"
          >
            Forgot Password?
          </button>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          data-testid="login-submit-btn"
          className="w-full py-4 rounded-xl bg-[#c3f400] text-[#0b0e14] text-[15px] font-black uppercase tracking-[0.06em] flex items-center justify-center gap-2 shadow-brutal-white disabled:opacity-60 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
        >
          {isLoading ? (
            <RefreshCw className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <LogIn className="w-5 h-5" strokeWidth={2.5} />
              Login →
            </>
          )}
        </button>

        <p className="text-center text-[13px] text-[#8b93a7]">
          Don&apos;t have an account yet?{' '}
          <button
            type="button"
            onClick={() => goTo('signup')}
            data-testid="login-goto-signup"
            className="text-[#c3f400] font-bold uppercase tracking-wide"
          >
            Create Arsonist Account
          </button>
        </p>
      </form>
    </div>
  );
};

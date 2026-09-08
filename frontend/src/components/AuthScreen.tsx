import React, { useState, useEffect, useRef } from 'react';
import { useFinance } from '../context/FinanceContext';
import {
  ShieldCheck,
  Mail,
  Lock,
  User as UserIcon,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  KeyRound,
  Eye,
  EyeOff,
  AlertCircle,
  Copy,
  Check
} from 'lucide-react';

interface AuthScreenProps {
  onSuccess?: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onSuccess }) => {
  const { loginUser, signupUser, loginWithGoogle, loadDemoData } = useFinance();

  const [mode, setMode] = useState<'signup' | 'login' | 'otp' | 'google'>('signup');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // OTP state
  const [generatedOtp, setGeneratedOtp] = useState<string>('');
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [otpTimer, setOtpTimer] = useState<number>(60);
  const [canResend, setCanResend] = useState(false);
  const [copiedOtp, setCopiedOtp] = useState(false);

  // Status & errors
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Input refs for OTP auto-focus
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // OTP Timer countdown
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (mode === 'otp' && otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [mode, otpTimer]);

  // Generate 6-digit random code
  const sendNewOtp = (targetEmail: string) => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);
    setOtpDigits(['', '', '', '', '', '']);
    setOtpTimer(60);
    setCanResend(false);
    console.log(`[Kinetic Ledger Security] OTP for ${targetEmail}: ${code}`);
    return code;
  };

  // 1. Handle initial Signup Form submit (triggers OTP)
  const handleInitiateSignup = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      sendNewOtp(cleanEmail);
      setIsLoading(false);
      setMode('otp');
      // Auto-focus first OTP field
      setTimeout(() => inputRefs.current[0]?.focus(), 150);
    }, 450);
  };

  // 2. Handle OTP digit changes
  const handleOtpChange = (index: number, val: string) => {
    if (val.length > 1) {
      // Handle paste of whole 6-digit OTP
      const pasted = val.replace(/\D/g, '').slice(0, 6);
      if (pasted.length > 0) {
        const nextDigits = [...otpDigits];
        for (let i = 0; i < 6; i++) {
          nextDigits[i] = pasted[i] || '';
        }
        setOtpDigits(nextDigits);
        const focusIdx = Math.min(pasted.length, 5);
        inputRefs.current[focusIdx]?.focus();
      }
      return;
    }

    const cleanChar = val.replace(/\D/g, '');
    const next = [...otpDigits];
    next[index] = cleanChar;
    setOtpDigits(next);

    // Auto advance
    if (cleanChar && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // 3. Confirm OTP and finalize Registration
  const handleVerifyOtp = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    const entered = otpDigits.join('');
    if (entered.length < 6) {
      setError('Please enter all 6 digits of the verification code.');
      return;
    }

    if (entered !== generatedOtp) {
      setError('Invalid verification code. Please check and try again.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const ok = signupUser(name || email.split('@')[0], email, password);
      setIsLoading(false);
      if (ok) {
        setSuccessMsg('Account verified! Welcome to Kinetic Ledger.');
        setTimeout(() => {
          onSuccess?.();
        }, 800);
      } else {
        setError('An account with this email already exists. Please log in.');
        setMode('login');
      }
    }, 500);
  };

  // 4. Handle standard Login
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      const ok = loginUser(email, password);
      if (ok) {
        setSuccessMsg('Authentication successful.');
        setTimeout(() => {
          onSuccess?.();
        }, 500);
      } else {
        setError('Incorrect email or password. Please check your credentials or create a new account.');
      }
    }, 450);
  };

  // 5. Handle Google Continue
  const handleGoogleAuth = () => {
    setIsLoading(true);
    setTimeout(() => {
      const userGoogleEmail = email.trim() || 'user@gmail.com';
      loginWithGoogle(userGoogleEmail, name || 'Google User');
      setIsLoading(false);
      onSuccess?.();
    }, 600);
  };

  // 6. Handle Demo Mode
  const handleExploreDemo = () => {
    setIsLoading(true);
    setTimeout(() => {
      loginUser('jyothiswarup.n@gmail.com', 'arsonist2026');
      loadDemoData();
      setIsLoading(false);
      onSuccess?.();
    }, 400);
  };

  const handleCopyOtp = () => {
    if (!generatedOtp) return;
    navigator.clipboard.writeText(generatedOtp);
    setCopiedOtp(true);
    setTimeout(() => setCopiedOtp(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#0b0e14] text-[#e1e2eb] flex flex-col justify-center items-center px-4 py-8">
      {/* Brand Header */}
      <div className="w-full max-w-md text-center mb-6 space-y-2">
        <div className="inline-flex items-center justify-center gap-2 px-3 py-1 rounded-full bg-[#141824] border border-[#2a334a] text-[#c3f400] text-xs font-mono font-bold tracking-wide uppercase">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Kinetic Ledger • Version 2.0</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase">
          Financial Command Center
        </h1>
        <p className="text-xs text-zinc-400 max-w-xs mx-auto">
          Dual-entry multi-account tracking with local-first security and zero telemetry.
        </p>
      </div>

      {/* Main Authentication Card */}
      <div className="w-full max-w-md bg-[#141824] border-2 border-[#c3f400] rounded-2xl shadow-brutal-lg p-6 space-y-5">
        {/* Navigation Tabs (Signup / Login) */}
        {mode !== 'otp' && (
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#0b0e14] rounded-xl border border-[#2a334a]">
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setError(null);
              }}
              className={`py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
                mode === 'signup'
                  ? 'bg-[#c3f400] text-[#0b0e14] shadow-brutal-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Create Account
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
              }}
              className={`py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
                mode === 'login'
                  ? 'bg-[#c3f400] text-[#0b0e14] shadow-brutal-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Log In
            </button>
          </div>
        )}

        {/* Error / Success Feedback */}
        {error && (
          <div className="p-3 rounded-lg bg-[#291419] border border-[#ff4d6d] text-xs text-[#ff4d6d] font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-lg bg-[#142b1e] border border-[#c3f400] text-xs text-[#c3f400] font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 1: SIGNUP FORM (Step 1)                                   */}
        {/* ------------------------------------------------------------- */}
        {mode === 'signup' && (
          <form onSubmit={handleInitiateSignup} className="space-y-3.5">
            <div>
              <label className="text-[10px] font-bold uppercase text-zinc-400 block mb-1">
                Your Full Name / Alias
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Jyothi Swarup"
                  className="w-full bg-[#0b0e14] border border-[#2a334a] rounded-lg py-2.5 pl-9 pr-3 text-xs text-white focus:outline-none focus:border-[#c3f400]"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase text-zinc-400 block mb-1">
                Email Address (For OTP Verification)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                  className="w-full bg-[#0b0e14] border border-[#2a334a] rounded-lg py-2.5 pl-9 pr-3 text-xs text-white focus:outline-none focus:border-[#c3f400]"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase text-zinc-400 block mb-1">
                Create Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full bg-[#0b0e14] border border-[#2a334a] rounded-lg py-2.5 pl-9 pr-10 text-xs text-white focus:outline-none focus:border-[#c3f400]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-zinc-500 hover:text-zinc-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase text-zinc-400 block mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full bg-[#0b0e14] border border-[#2a334a] rounded-lg py-2.5 pl-9 pr-3 text-xs text-white focus:outline-none focus:border-[#c3f400]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-lg bg-[#c3f400] text-[#0b0e14] text-xs font-bold uppercase tracking-wider shadow-brutal-sm hover:brightness-105 transition-all flex items-center justify-center gap-2 mt-2"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Send Verification Code (OTP)</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 2: OTP VERIFICATION (Step 2)                              */}
        {/* ------------------------------------------------------------- */}
        {mode === 'otp' && (
          <div className="space-y-4">
            <div className="text-center space-y-1">
              <div className="w-10 h-10 rounded-full bg-[#0b0e14] border border-[#c3f400] flex items-center justify-center text-[#c3f400] mx-auto mb-2">
                <KeyRound className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Enter 6-Digit Verification Code
              </h3>
              <p className="text-xs text-zinc-400">
                A verification code was dispatched to:
              </p>
              <span className="text-xs font-mono text-[#c3f400] font-bold block">
                {email}
              </span>
            </div>

            {/* Instant Code Simulator Banner */}
            <div className="p-3 bg-[#0b0e14] border border-[#c3f400]/40 rounded-xl space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  Security OTP Code:
                </span>
                <button
                  type="button"
                  onClick={handleCopyOtp}
                  className="text-[10px] font-mono text-[#c3f400] flex items-center gap-1 hover:underline"
                >
                  {copiedOtp ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedOtp ? 'Copied' : 'Copy Code'}</span>
                </button>
              </div>
              <div className="text-xl font-mono font-black text-[#c3f400] tracking-widest text-center py-1 select-all">
                {generatedOtp || '••••••'}
              </div>
              <span className="text-[10px] text-zinc-500 block text-center">
                (In client mode, code is displayed above for immediate self-testing.)
              </span>
            </div>

            {/* 6-box input */}
            <div className="flex items-center justify-center gap-2 pt-1">
              {otpDigits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => (inputRefs.current[idx] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  className="w-11 h-12 text-center text-lg font-bold font-mono bg-[#0b0e14] border-2 border-[#2a334a] focus:border-[#c3f400] rounded-xl text-white outline-none transition-colors shadow-brutal-sm"
                />
              ))}
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => handleVerifyOtp()}
                disabled={isLoading || otpDigits.join('').length < 6}
                className="w-full py-3 rounded-lg bg-[#c3f400] text-[#0b0e14] text-xs font-bold uppercase tracking-wider shadow-brutal-sm hover:brightness-105 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Verify Code & Start Ledger</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-between text-xs pt-1 px-1">
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setError(null);
                  }}
                  className="text-zinc-400 hover:text-white"
                >
                  ← Change Email
                </button>

                <button
                  type="button"
                  disabled={!canResend}
                  onClick={() => sendNewOtp(email)}
                  className={`font-bold ${
                    canResend
                      ? 'text-[#c3f400] hover:underline cursor-pointer'
                      : 'text-zinc-500 cursor-not-allowed'
                  }`}
                >
                  {canResend ? 'Resend Code' : `Resend in ${otpTimer}s`}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 3: LOGIN FORM                                             */}
        {/* ------------------------------------------------------------- */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-3.5">
            <div>
              <label className="text-[10px] font-bold uppercase text-zinc-400 block mb-1">
                Registered Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                  className="w-full bg-[#0b0e14] border border-[#2a334a] rounded-lg py-2.5 pl-9 pr-3 text-xs text-white focus:outline-none focus:border-[#c3f400]"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] font-bold uppercase text-zinc-400">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setSuccessMsg(`Recovery link simulated for ${email || 'your email'}.`);
                  }}
                  className="text-[10px] text-[#c3f400] hover:underline"
                >
                  Forgot?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#0b0e14] border border-[#2a334a] rounded-lg py-2.5 pl-9 pr-10 text-xs text-white focus:outline-none focus:border-[#c3f400]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-zinc-500 hover:text-zinc-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-lg bg-[#c3f400] text-[#0b0e14] text-xs font-bold uppercase tracking-wider shadow-brutal-sm hover:brightness-105 transition-all flex items-center justify-center gap-2 mt-2"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Log In to Ledger</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* ------------------------------------------------------------- */}
        {/* SOCIAL AUTH: GOOGLE SIGN IN                                   */}
        {/* ------------------------------------------------------------- */}
        {mode !== 'otp' && (
          <div className="space-y-3 pt-2">
            <div className="relative flex items-center justify-center">
              <div className="border-t border-[#2a334a] w-full" />
              <span className="bg-[#141824] px-3 text-[10px] font-bold uppercase tracking-wider text-zinc-500 absolute">
                Or Continue With
              </span>
            </div>

            <button
              type="button"
              onClick={handleGoogleAuth}
              className="w-full py-2.5 px-4 rounded-xl bg-[#0b0e14] border-2 border-[#2a334a] hover:border-white text-xs font-bold text-white flex items-center justify-center gap-2.5 shadow-brutal-sm transition-all hover:brightness-110"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
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
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            {/* Sandbox / Demo option */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={handleExploreDemo}
                className="text-[11px] text-zinc-400 hover:text-[#c3f400] transition-colors"
              >
                Want to test first? <strong className="underline">Explore Demo Mode (Sample Data)</strong>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Trust & Local-First Assurance Footer */}
      <div className="mt-6 flex items-center gap-2 text-xs text-zinc-500 font-mono">
        <ShieldCheck className="w-4 h-4 text-[#c3f400]" />
        <span>Local-First Encryption • No Server Data Tracking</span>
      </div>
    </div>
  );
};

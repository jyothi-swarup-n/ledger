import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Lock, Mail, User as UserIcon, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { loginUser, signupUser } = useFinance();

  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (mode === 'login') {
      const ok = loginUser(email, password);
      if (ok) {
        onClose();
      } else {
        setError('Invalid credentials. Check email and password or create a new account.');
      }
    } else if (mode === 'signup') {
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
      if (password.length < 4) {
        setError('Password must be at least 4 characters long.');
        return;
      }
      const ok = signupUser(name, email, password);
      if (ok) {
        onClose();
      } else {
        setError('An account with this email address already exists.');
      }
    } else if (mode === 'forgot') {
      setSuccess(`Password reset instructions simulated for ${email}. You may now log in.`);
      setTimeout(() => {
        setMode('login');
        setSuccess(null);
      }, 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-[#141824] border-2 border-[#c3f400] rounded-2xl shadow-brutal-lg overflow-hidden p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#0b0e14] border border-[#2a334a] flex items-center justify-center text-[#c3f400]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                {mode === 'login' ? 'Arsonist Access' : mode === 'signup' ? 'Create Account' : 'Recover Account'}
              </h2>
              <span className="text-[10px] text-zinc-400">
                Personal & Business Finance Tracker
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white text-xs font-bold"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="p-2.5 rounded-lg bg-[#291419] border border-[#ff4d6d] text-xs text-[#ff4d6d] font-bold">
            {error}
          </div>
        )}

        {success && (
          <div className="p-2.5 rounded-lg bg-[#142b1e] border border-[#c3f400] text-xs text-[#c3f400] font-bold">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === 'signup' && (
            <div>
              <label className="text-[10px] font-bold uppercase text-zinc-400 block mb-1">
                Display Name
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Jyothi"
                  className="w-full bg-[#0b0e14] border border-[#2a334a] rounded-lg py-2 pl-9 pr-3 text-xs text-white focus:outline-none focus:border-[#c3f400]"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-[10px] font-bold uppercase text-zinc-400 block mb-1">
              Email Identifier
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@arsonist.online"
                className="w-full bg-[#0b0e14] border border-[#2a334a] rounded-lg py-2 pl-9 pr-3 text-xs text-white focus:outline-none focus:border-[#c3f400]"
              />
            </div>
          </div>

          {mode !== 'forgot' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] font-bold uppercase text-zinc-400">
                  Password
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => setMode('forgot')}
                    className="text-[10px] text-[#c3f400] hover:underline"
                  >
                    Forgot?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#0b0e14] border border-[#2a334a] rounded-lg py-2 pl-9 pr-3 text-xs text-white focus:outline-none focus:border-[#c3f400]"
                />
              </div>
            </div>
          )}

          {mode === 'signup' && (
            <div>
              <label className="text-[10px] font-bold uppercase text-zinc-400 block mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#0b0e14] border border-[#2a334a] rounded-lg py-2 pl-9 pr-3 text-xs text-white focus:outline-none focus:border-[#c3f400]"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-2.5 rounded-lg bg-[#c3f400] text-[#0b0e14] text-xs font-bold uppercase tracking-wider shadow-brutal-sm hover:brightness-105 transition-all mt-2 flex items-center justify-center gap-1.5"
          >
            <span>
              {mode === 'login' ? 'Enter Ledger' : mode === 'signup' ? 'Create Profile' : 'Send Recovery Token'}
            </span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Mode Switcher Footer */}
        <div className="pt-3 border-t border-[#2a334a] text-center text-xs text-zinc-400">
          {mode === 'login' ? (
            <p>
              New user?{' '}
              <button
                onClick={() => setMode('signup')}
                className="text-[#c3f400] font-bold hover:underline"
              >
                Create Account
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <button
                onClick={() => setMode('login')}
                className="text-[#c3f400] font-bold hover:underline"
              >
                Log In
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

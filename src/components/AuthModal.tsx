import React, { useState } from 'react';
import { createAccount, logIn, resetPassword } from '../services/auth';
import { X, Mail, Lock, AlertCircle, Check, ArrowRight, ShieldCheck } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess?: () => void;
  initialMode?: 'login' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  initialMode = 'login',
}) => {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    if (mode !== 'forgot') {
      if (!password || password.length < 6) {
        setErrorMsg('Password must be at least 6 characters.');
        return;
      }
    }

    if (mode === 'signup' && password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === 'signup') {
        await createAccount(email, password);
        setSuccessMsg('Account created successfully! Cloud sync active.');
        setTimeout(() => {
          if (onAuthSuccess) onAuthSuccess();
          onClose();
        }, 1000);
      } else if (mode === 'login') {
        await logIn(email, password);
        setSuccessMsg('Logged in successfully! Syncing your journal...');
        setTimeout(() => {
          if (onAuthSuccess) onAuthSuccess();
          onClose();
        }, 1000);
      } else if (mode === 'forgot') {
        await resetPassword(email);
        setSuccessMsg('Password reset link sent to your email. Check your inbox.');
      }
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      let friendly = 'Authentication failed. Please check your credentials.';
      if (error.code === 'auth/email-already-in-use') {
        friendly = 'This email is already registered. Please log in instead.';
      } else if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        friendly = 'Incorrect email or password. Please try again.';
      } else if (error.code === 'auth/user-not-found') {
        friendly = 'No account found with this email. Please create an account.';
      } else if (error.code === 'auth/weak-password') {
        friendly = 'Password is too weak. Please use at least 6 characters.';
      } else if (error.code === 'auth/invalid-email') {
        friendly = 'Please provide a valid email address.';
      } else if (error.message) {
        friendly = error.message;
      }
      setErrorMsg(friendly);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-xs p-0 sm:p-4 overflow-y-auto">
      <div className="w-full sm:max-w-md bg-[#0c0e12] border border-[#1e232b] rounded-t-3xl sm:rounded-3xl shadow-2xl relative overflow-hidden flex flex-col">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-2">
          <div className="flex items-center gap-2.5">
            <img src="/logo.svg" alt="TradeJournal" className="w-8 h-8 rounded-lg border border-[#232934]" />
            <div className="flex items-center text-sm font-black tracking-wider">
              <span className="text-white">TRADE</span>
              <span className="text-[#00E676]">JOURNAL</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-gray-400 hover:text-white hover:bg-[#181c24] transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              {mode === 'login' && 'Log In to TradeJournal'}
              {mode === 'signup' && 'Create Your Account'}
              {mode === 'forgot' && 'Reset Your Password'}
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              {mode === 'login' && 'Access and sync your private trades across phone and laptop.'}
              {mode === 'signup' && 'Start syncing your trades privately to the cloud.'}
              {mode === 'forgot' && 'Enter your email to receive a password reset link.'}
            </p>
          </div>

          {/* Feedback Badges */}
          {errorMsg && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-[#FF334B]/10 border border-[#FF334B]/30 text-[#FF334B] text-xs font-semibold">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-[#00E676]/10 border border-[#00E676]/30 text-[#00E676] text-xs font-semibold">
              <Check className="w-4 h-4 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Email input */}
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="trader@example.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#101318] border border-[#1e232b] text-white text-sm focus:outline-none focus:border-[#00E676] placeholder-gray-600 font-medium"
                required
              />
            </div>
          </div>

          {/* Password input */}
          {mode !== 'forgot' && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  Password
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      setErrorMsg(null);
                      setSuccessMsg(null);
                    }}
                    className="text-[11px] text-gray-400 hover:text-[#00E676] transition font-medium"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#101318] border border-[#1e232b] text-white text-sm focus:outline-none focus:border-[#00E676] placeholder-gray-600 font-medium"
                  required
                />
              </div>
            </div>
          )}

          {/* Confirm Password input for Sign Up */}
          {mode === 'signup' && (
            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#101318] border border-[#1e232b] text-white text-sm focus:outline-none focus:border-[#00E676] placeholder-gray-600 font-medium"
                  required
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-xl bg-[#00E676] text-black font-bold text-sm shadow-lg shadow-[#00E676]/20 hover:bg-[#2bfb8d] transition active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
          >
            {isSubmitting ? (
              <span>Processing...</span>
            ) : (
              <>
                <span>
                  {mode === 'login' && 'Log In'}
                  {mode === 'signup' && 'Create Account'}
                  {mode === 'forgot' && 'Send Reset Link'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {/* Switch Mode Footer */}
          <div className="pt-2 text-center text-xs text-gray-400 border-t border-[#1b1f27]">
            {mode === 'login' && (
              <p>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  className="text-[#00E676] font-semibold hover:underline ml-1"
                >
                  Create Account
                </button>
              </p>
            )}

            {mode === 'signup' && (
              <p>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  className="text-[#00E676] font-semibold hover:underline ml-1"
                >
                  Log In
                </button>
              </p>
            )}

            {mode === 'forgot' && (
              <p>
                Remembered your password?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  className="text-[#00E676] font-semibold hover:underline ml-1"
                >
                  Back to Log In
                </button>
              </p>
            )}
          </div>

          <div className="flex items-center justify-center gap-1.5 text-[10px] text-gray-500 pt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-[#00E676]" />
            <span>Private zero-trust data storage. Your journal is only accessible by you.</span>
          </div>
        </form>
      </div>
    </div>
  );
};

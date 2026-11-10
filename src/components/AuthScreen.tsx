import React, { useState } from 'react';
import {
  createAccount,
  logIn,
  resetPassword,
  signInWithGoogle,
  formatAuthError,
  AuthErrorDetails,
} from '../services/auth';
import { Mail, Lock, AlertCircle, Check, ArrowRight, ExternalLink, ShieldCheck } from 'lucide-react';

interface AuthScreenProps {
  onContinueOffline?: () => void;
  hasLocalTrades?: boolean;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  onContinueOffline,
  hasLocalTrades = false,
}) => {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorDetails, setErrorDetails] = useState<AuthErrorDetails | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Clear errors when user types or changes fields
  const handleEmailChange = (val: string) => {
    setEmail(val);
    if (errorDetails) setErrorDetails(null);
  };

  const handlePasswordChange = (val: string) => {
    setPassword(val);
    if (errorDetails) setErrorDetails(null);
  };

  const handleConfirmPasswordChange = (val: string) => {
    setConfirmPassword(val);
    if (errorDetails) setErrorDetails(null);
  };

  const switchMode = (newMode: 'login' | 'signup' | 'forgot') => {
    setMode(newMode);
    setErrorDetails(null);
    setSuccessMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorDetails(null);
    setSuccessMsg(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setErrorDetails({
        title: 'Invalid Email',
        message: 'Please enter a valid email address (e.g., trader@example.com).',
      });
      return;
    }

    if (mode !== 'forgot') {
      if (!password || password.length < 6) {
        setErrorDetails({
          title: 'Password Too Short',
          message: 'Password must be at least 6 characters.',
        });
        return;
      }
    }

    if (mode === 'signup' && password !== confirmPassword) {
      setErrorDetails({
        title: 'Passwords Mismatch',
        message: 'The confirmation password does not match.',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === 'signup') {
        await createAccount(cleanEmail, password);
        setSuccessMsg('Account created successfully! Logging you in...');
      } else if (mode === 'login') {
        await logIn(cleanEmail, password);
        setSuccessMsg('Logged in! Synchronizing your journal...');
      } else if (mode === 'forgot') {
        await resetPassword(cleanEmail);
        setSuccessMsg('Password reset link sent! Please check your email inbox.');
      }
    } catch (err) {
      const formatted = formatAuthError(err);
      setErrorDetails(formatted);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorDetails(null);
    setSuccessMsg(null);
    setIsSubmitting(true);
    try {
      await signInWithGoogle();
      setSuccessMsg('Signed in with Google! Synchronizing your journal...');
    } catch (err) {
      const formatted = formatAuthError(err);
      setErrorDetails(formatted);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#08090b] flex flex-col justify-center items-center px-4 py-8 select-none">
      <div className="w-full max-w-sm sm:max-w-md bg-[#0c0e12] border border-[#1e232b] rounded-3xl p-6 sm:p-8 shadow-2xl relative">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-[#141820] border border-[#232934] flex items-center justify-center p-2 mb-3 shadow-lg">
            <img src="/logo.svg" alt="TradeJournal" className="w-full h-full object-contain" />
          </div>
          <div className="flex items-center text-xl font-black tracking-wider leading-none">
            <span className="text-white">TRADE</span>
            <span className="text-[#00E676]">JOURNAL</span>
          </div>
          <p className="text-xs text-gray-400 mt-1 font-medium">
            Personal Trading Journal • Cloud Sync
          </p>
        </div>

        {/* Tab Switcher: Log In / Create Account */}
        {mode !== 'forgot' && (
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#101318] border border-[#1c212a] rounded-xl mb-5">
            <button
              type="button"
              onClick={() => switchMode('login')}
              className={`py-2 text-xs font-bold rounded-lg transition ${
                mode === 'login'
                  ? 'bg-[#1b212a] text-[#00E676] shadow-xs'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Log In
            </button>
            <button
              type="button"
              onClick={() => switchMode('signup')}
              className={`py-2 text-xs font-bold rounded-lg transition ${
                mode === 'signup'
                  ? 'bg-[#1b212a] text-[#00E676] shadow-xs'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Create Account
            </button>
          </div>
        )}

        {/* Title for Forgot Mode */}
        {mode === 'forgot' && (
          <div className="mb-4">
            <h2 className="text-base font-bold text-white">Reset Password</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Enter your email address to receive password reset instructions.
            </p>
          </div>
        )}

        {/* Dynamic Error Notice — Only shown when an actual error occurs */}
        {errorDetails && (
          <div className="mb-4 p-3.5 rounded-2xl bg-[#FF334B]/10 border border-[#FF334B]/30 text-left space-y-2 animate-in fade-in duration-150">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-[#FF334B] flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-[#FF334B]">{errorDetails.title}</h4>
                <p className="text-[11px] text-gray-300 mt-0.5 leading-relaxed">
                  {errorDetails.message}
                </p>
              </div>
            </div>

            {errorDetails.isProviderDisabled && errorDetails.consoleUrl && (
              <div className="pt-2 border-t border-[#FF334B]/20">
                <a
                  href={errorDetails.consoleUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FF334B]/20 hover:bg-[#FF334B]/30 text-white text-[11px] font-semibold transition"
                >
                  <span>Open Firebase Console</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                <p className="text-[10px] text-gray-400 mt-1.5">
                  1. Under Sign-in providers, click 'Email/Password'.<br />
                  2. Toggle 'Enable' to ON and click 'Save'.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Success Message */}
        {successMsg && (
          <div className="mb-4 flex items-center gap-2 p-3.5 rounded-2xl bg-[#00E676]/10 border border-[#00E676]/30 text-[#00E676] text-xs font-semibold animate-in fade-in duration-150">
            <Check className="w-4 h-4 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => handleEmailChange(e.target.value)}
                placeholder="trader@example.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#101318] border border-[#1e232b] text-white text-sm focus:outline-none focus:border-[#00E676] placeholder-gray-600 font-medium"
                required
                autoComplete="email"
              />
            </div>
          </div>

          {mode !== 'forgot' && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  Password
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => switchMode('forgot')}
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
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#101318] border border-[#1e232b] text-white text-sm focus:outline-none focus:border-[#00E676] placeholder-gray-600 font-medium"
                  required
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                />
              </div>
            </div>
          )}

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
                  onChange={(e) => handleConfirmPasswordChange(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#101318] border border-[#1e232b] text-white text-sm focus:outline-none focus:border-[#00E676] placeholder-gray-600 font-medium"
                  required
                  autoComplete="new-password"
                />
              </div>
            </div>
          )}

          {/* Primary Action Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-xl bg-[#00E676] text-black font-bold text-sm shadow-lg shadow-[#00E676]/20 hover:bg-[#2bfb8d] transition active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
          >
            {isSubmitting ? (
              <span>Connecting...</span>
            ) : (
              <>
                <span>
                  {mode === 'login' && 'Log In'}
                  {mode === 'signup' && 'Create Account'}
                  {mode === 'forgot' && 'Send Password Reset Email'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {/* Back to Login for Forgot Password */}
          {mode === 'forgot' && (
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => switchMode('login')}
                className="text-xs text-[#00E676] font-semibold hover:underline"
              >
                Back to Log In
              </button>
            </div>
          )}
        </form>

        {/* Google 1-Click Alternate Sign-In (Pre-configured by ProvisionFirebase) */}
        <div className="mt-4 pt-4 border-t border-[#1b1f27]">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isSubmitting}
            className="w-full py-2.5 rounded-xl bg-[#12151b] border border-[#222832] hover:border-[#00E676] text-xs font-semibold text-gray-200 hover:text-white transition flex items-center justify-center gap-2 active:scale-98"
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
            <span>Sign in with Google</span>
          </button>
        </div>

        {/* Offline / Local Mode Option */}
        {onContinueOffline && (
          <div className="mt-4 pt-3 text-center border-t border-[#181c23]">
            <button
              type="button"
              onClick={onContinueOffline}
              className="text-xs text-gray-400 hover:text-gray-200 transition"
            >
              Continue in Offline / Local Mode
              {hasLocalTrades && ' (Access saved local trades)'}
            </button>
          </div>
        )}

        {/* Footer info */}
        <div className="flex items-center justify-center gap-1.5 text-[10px] text-gray-500 mt-5">
          <ShieldCheck className="w-3.5 h-3.5 text-[#00E676]" />
          <span>Private encrypted trading journal. Data is strictly isolated.</span>
        </div>
      </div>
    </div>
  );
};

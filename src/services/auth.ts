import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  User,
} from 'firebase/auth';
import { auth } from './firebase';

export async function createAccount(email: string, pass: string): Promise<User> {
  const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), pass);
  return userCredential.user;
}

export async function logIn(email: string, pass: string): Promise<User> {
  const userCredential = await signInWithEmailAndPassword(auth, email.trim(), pass);
  return userCredential.user;
}

export async function signInWithGoogle(): Promise<User> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const result = await signInWithPopup(auth, provider);
  return result.user;
}

export async function logOut(): Promise<void> {
  await signOut(auth);
}

export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email.trim());
}

export function subscribeToAuth(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export function getCurrentUser(): User | null {
  return auth.currentUser;
}

export interface AuthErrorDetails {
  title: string;
  message: string;
  isProviderDisabled?: boolean;
  consoleUrl?: string;
}

/**
 * Translates Firebase auth errors into clear, user-friendly instructions.
 */
export function formatAuthError(err: unknown): AuthErrorDetails {
  const error = err as { code?: string; message?: string };
  const code = error?.code || '';

  if (code === 'auth/operation-not-allowed') {
    return {
      title: 'Email/Password Sign-In Disabled',
      message:
        'Email/Password sign-in has not been enabled in your Firebase Console yet. To enable it: Go to Firebase Console > Authentication > Sign-in method, click "Email/Password", enable it, and save.',
      isProviderDisabled: true,
      consoleUrl: 'https://console.firebase.google.com/project/singular-path-p09p9/authentication/providers',
    };
  }

  if (code === 'auth/email-already-in-use') {
    return {
      title: 'Account Already Exists',
      message: 'This email is already registered. Please log in with your password instead.',
    };
  }

  if (code === 'auth/invalid-email') {
    return {
      title: 'Invalid Email Address',
      message: 'Please enter a valid email address (e.g., trader@example.com).',
    };
  }

  if (code === 'auth/weak-password') {
    return {
      title: 'Weak Password',
      message: 'Password must be at least 6 characters. Use letters and numbers for better security.',
    };
  }

  if (
    code === 'auth/wrong-password' ||
    code === 'auth/invalid-credential' ||
    code === 'auth/user-mismatch'
  ) {
    return {
      title: 'Invalid Credentials',
      message: 'Incorrect email or password. Please verify your details and try again.',
    };
  }

  if (code === 'auth/user-not-found') {
    return {
      title: 'Account Not Found',
      message: 'No TradeJournal account was found with this email. Please create an account.',
    };
  }

  if (code === 'auth/too-many-requests') {
    return {
      title: 'Too Many Attempts',
      message: 'Too many unsuccessful attempts. Access is temporarily paused for your security. Please wait a few minutes or reset your password.',
    };
  }

  if (code === 'auth/network-request-failed') {
    return {
      title: 'Network Error',
      message: 'Unable to reach the authentication service. Please check your internet connection and try again.',
    };
  }

  if (
    code === 'auth/app-deleted' ||
    code === 'auth/app-not-authorized' ||
    code === 'auth/invalid-api-key'
  ) {
    return {
      title: 'Configuration Error',
      message: 'Firebase configuration error. Please check your Firebase project settings.',
    };
  }

  return {
    title: 'Authentication Error',
    message: error?.message || 'Authentication could not be completed. Please try again.',
  };
}

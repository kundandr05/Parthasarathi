import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { loadArray, loadObject, saveArray, saveObject, storageKeys } from './localStore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId);
export const app = isFirebaseConfigured ? initializeApp(firebaseConfig) : null;
export const auth = isFirebaseConfigured ? getAuth(app) : null;
export const googleProvider = isFirebaseConfigured ? new GoogleAuthProvider() : null;

const localUsersKey = 'local_auth_users';

const makeLocalUser = (email, displayName) => ({
  uid: `local_${btoa(email).replace(/=/g, '')}`,
  displayName: displayName || email.split('@')[0],
  email,
  photoURL: '',
  provider: 'local',
});

const shouldUseLocalFallback = (error) => [
  'auth/operation-not-allowed',
  'auth/popup-blocked',
  'auth/popup-closed-by-user',
  'auth/unauthorized-domain',
  'auth/network-request-failed',
].includes(error?.code);

const registerLocalUser = (email, password) => {
  const users = loadObject(localUsersKey, {});
  if (users[email]) throw new Error('This local email account already exists.');
  users[email] = { password, createdAt: new Date().toISOString() };
  saveObject(localUsersKey, users);
  return makeLocalUser(email);
};

const loginLocalUser = (email, password) => {
  const users = loadObject(localUsersKey, {});
  if (!users[email]) {
    users[email] = { password, createdAt: new Date().toISOString() };
    saveObject(localUsersKey, users);
  } else if (users[email].password !== password) {
    throw new Error('Incorrect local password.');
  }
  return makeLocalUser(email);
};

export const signInWithGoogle = async () => {
  if (isFirebaseConfigured) {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      return {
        uid: result.user.uid,
        displayName: result.user.displayName,
        email: result.user.email,
        photoURL: result.user.photoURL,
        provider: 'google',
      };
    } catch (error) {
      if (!shouldUseLocalFallback(error)) throw error;
    }
  }

  const user = makeLocalUser('google.user@local.app', 'Google User');
  localStorage.setItem('user_auth', JSON.stringify(user));
  return user;
};

export const logoutUser = async () => {
  if (isFirebaseConfigured) return signOut(auth);
  return Promise.resolve();
};

export const registerWithEmail = async (email, password) => {
  if (isFirebaseConfigured) {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      return {
        uid: result.user.uid,
        displayName: result.user.displayName || email.split('@')[0],
        email: result.user.email,
        photoURL: result.user.photoURL,
        provider: 'email',
      };
    } catch (error) {
      if (!shouldUseLocalFallback(error)) throw error;
    }
  }

  return registerLocalUser(email, password);
};

export const loginWithEmail = async (email, password) => {
  if (isFirebaseConfigured) {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      return {
        uid: result.user.uid,
        displayName: result.user.displayName || email.split('@')[0],
        email: result.user.email,
        photoURL: result.user.photoURL,
        provider: 'email',
      };
    } catch (error) {
      if (!shouldUseLocalFallback(error)) throw error;
    }
  }

  return loginLocalUser(email, password);
};

export const loadChatSessions = async (uid) => loadArray(storageKeys(uid).sessions);
export const saveChatSessions = async (uid, sessions) => saveArray(storageKeys(uid).sessions, sessions);
export const loadUserMemories = async (uid) => loadArray(storageKeys(uid).memories);
export const saveUserMemories = async (uid, memories) => saveArray(storageKeys(uid).memories, memories);
export const loadUserProfile = async (uid) => loadObject(storageKeys(uid).profile, null);
export const saveUserProfile = async (uid, profile) => saveObject(storageKeys(uid).profile, profile);

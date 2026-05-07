import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";

// Check if Firebase config is provided via env variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

export const isFirebaseConfigured = !!firebaseConfig.apiKey;
const isConfigured = isFirebaseConfigured;

export const app = isConfigured ? initializeApp(firebaseConfig) : null;
export const auth = isConfigured ? getAuth(app) : null;
export const googleProvider = isConfigured ? new GoogleAuthProvider() : null;

export const signInWithGoogle = async () => {
  if (isConfigured) {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      return {
        uid: result.user.uid,
        displayName: result.user.displayName,
        email: result.user.email,
        photoURL: result.user.photoURL
      };
    } catch (error) {
      console.error("Firebase Auth Error", error);
      throw error;
    }
  } else {
    // MOCK LOGIN if Firebase is not configured yet
    console.warn("Firebase not configured. Simulating Google Login.");
    return new Promise(resolve => setTimeout(() => resolve({
      uid: 'mock-user-123',
      displayName: "KUNDAN DR",
      email: "kundan@example.com",
      photoURL: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
    }), 1200));
  }
};

export const logoutUser = async () => {
  if (isConfigured) {
    return signOut(auth);
  }
  return Promise.resolve();
};

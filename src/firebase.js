import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";

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
export const db = isConfigured ? getFirestore(app) : null;
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
    throw new Error("Firebase is not configured. Please add the Firebase configuration to your Environment Variables.");
  }
};

export const logoutUser = async () => {
  if (isConfigured) {
    return signOut(auth);
  }
  return Promise.resolve();
};

// Firestore Helpers
export const loadChatSessions = async (uid) => {
  if (!db || !uid) return null;
  try {
    const docRef = doc(db, "users", uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data().sessions || null;
    }
    return null;
  } catch (error) {
    console.error("Error loading chat sessions:", error);
    return null;
  }
};

export const saveChatSessions = async (uid, sessions) => {
  if (!db || !uid) return;
  try {
    const docRef = doc(db, "users", uid);
    await setDoc(docRef, { sessions }, { merge: true });
  } catch (error) {
    console.error("Error saving chat sessions:", error);
  }
};

export const loadUserMemories = async (uid) => {
  if (!db || !uid) return null;
  try {
    const docRef = doc(db, "users", uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data().memories || null;
    }
    return null;
  } catch (error) {
    console.error("Error loading user memories:", error);
    return null;
  }
};

export const saveUserMemories = async (uid, memories) => {
  if (!db || !uid) return;
  try {
    const docRef = doc(db, "users", uid);
    await setDoc(docRef, { memories }, { merge: true });
  } catch (error) {
    console.error("Error saving user memories:", error);
  }
};


import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';

// Firebase configuration
// You'll need to replace these with your actual Firebase project config
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'demo-api-key',
  authDomain:
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ||
    'stage-timer-demo.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'stage-timer-demo',
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ||
    'stage-timer-demo.appspot.com',
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '123456789',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:123456789:web:abcdef123456',
};

// Debug: Log the configuration being used (only in development)
if (import.meta.env.DEV) {
  console.log('🔧 Firebase Config:', {
    projectId: firebaseConfig.projectId,
    authDomain: firebaseConfig.authDomain,
    hasApiKey:
      !!firebaseConfig.apiKey && firebaseConfig.apiKey !== 'demo-api-key',
    environment: import.meta.env.MODE,
    useProduction: import.meta.env.VITE_USE_FIREBASE_PROD,
  });
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Auth
export const auth = getAuth(app);

// Connect to emulators in development (only if not using production)
if (import.meta.env.DEV && !import.meta.env.VITE_USE_FIREBASE_PROD) {
  try {
    // Only connect if not already connected
    if (!auth.emulatorConfig) {
      connectAuthEmulator(auth, 'http://localhost:9099');
      console.log('🔧 Connected to Firebase Auth Emulator');
    }
    // Firestore emulator connection is handled differently
    connectFirestoreEmulator(db, 'localhost', 8080);
    console.log('🔧 Connected to Firestore Emulator');
  } catch (error) {
    // Emulators might already be connected or not available
    console.log(
      '⚠️ Firebase emulators already connected or not available:',
      error
    );
  }
} else if (import.meta.env.PROD || import.meta.env.VITE_USE_FIREBASE_PROD) {
  console.log('🚀 Using production Firebase services');
}

export default app;

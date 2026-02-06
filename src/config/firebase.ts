import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase configuration for AI Business Management
const firebaseConfig = {
  apiKey: "AIzaSyC6j7r2kcGX1ulmcQ7znTStFqJ8hCCFGgo",
  authDomain: "ai-buisness-managment-d90e0.firebaseapp.com",
  projectId: "ai-buisness-managment-d90e0",
  storageBucket: "ai-buisness-managment-d90e0.firebasestorage.app",
  messagingSenderId: "130733950150",
  appId: "1:130733950150:web:71ee93f0af540411a043c7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;

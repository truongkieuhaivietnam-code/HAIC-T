// ============================================================
// firebase-config.js
// HAI Multi Country Administration System
// Replace with your actual Firebase project config
// ============================================================

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDrU-X28Z7cE1ebdR4VTYYMnzJpHYbMIRM",
  authDomain: "hai-cloud-88321.firebaseapp.com",
  projectId: "hai-cloud-88321",
  storageBucket: "hai-cloud-88321.firebasestorage.app",
  messagingSenderId: "246892343866",
  appId: "1:246892343866:web:703b0b85d72956a6de7b03",
};

// Initialize Firebase
firebase.initializeApp(FIREBASE_CONFIG);

const auth = firebase.auth();
const db   = firebase.firestore();
const storage = firebase.storage();

// ── Firestore offline persistence (best-effort) ──────────────
db.enablePersistence({ synchronizeTabs: true }).catch(() => {});

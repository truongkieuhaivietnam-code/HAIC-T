// ============================================================
// firebase-config.js
// HAI Multi Country Administration System
// Replace with your actual Firebase project config
// ============================================================

const FIREBASE_CONFIG = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
firebase.initializeApp(FIREBASE_CONFIG);

const auth = firebase.auth();
const db   = firebase.firestore();
const storage = firebase.storage();

// ── Firestore offline persistence ────────────────────────────
// Tắt trên mobile vì hay gây lỗi permissions với multi-tab
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
if (!isMobile) {
  db.enablePersistence({ synchronizeTabs: true }).catch(() => {});
}

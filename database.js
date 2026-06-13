// ===================== database.js =====================
// Firebase config - shared "haic-app" project (same backend as other HAIC apps)
const firebaseConfig = {
  apiKey: "AIzaSyACl0TNIL5cbpAto5rVkAk5acV7Y9NdexU",
  authDomain: "nha-cun.firebaseapp.com",
  projectId: "nha-cun",
  storageBucket: "nha-cun.firebasestorage.app",
  messagingSenderId: "111473511079",
  appId: "1:111473511079:web:b5f522042072249801a982",
  measurementId: "G-ECKVYX1G37"
};

let db = null;
let firebaseReady = false;

try {
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
  db = firebase.firestore();
  firebaseReady = true;
} catch (e) {
  console.warn("Firebase init failed, falling back to localStorage only:", e);
  firebaseReady = false;
}

// Namespacing for this app's data within the shared "haic-app" Firestore project
const FF_PREFIX = "familyFinance_";
const COL = {
  users: FF_PREFIX + "users",
  transactions: FF_PREFIX + "transactions",
  categories: FF_PREFIX + "categories",
  budgets: FF_PREFIX + "budgets",
  goals: FF_PREFIX + "goals",
  assets: FF_PREFIX + "assets",
  settings: FF_PREFIX + "settings",
  auditLog: FF_PREFIX + "auditLog",
};

// ---------- LocalStorage fallback / cache layer ----------
const LS_KEY = "familyFinanceData_v1";

function lsGetAll() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return getDefaultData();
}

function lsSaveAll(data) {
  localStorage.setItem(LS_KEY, JSON.stringify(data));
}

function getDefaultData() {
  return {
    users: [
      { id: "u_truong", name: "Truong", email: "truong.haicambodia@gmail.com", password: "admin123", role: "superadmin", active: true },
      { id: "u_wife", name: "Wife", email: "wife@family.local", password: "wife123", role: "admin", active: true },
      { id: "u_daughter", name: "Daughter", email: "daughter@family.local", password: "daughter123", role: "member", active: true },
    ],
    categories: {
      expense: [
        { id: "c_food", name_vi: "Ăn uống", name_en: "Food", icon: "🍜" },
        { id: "c_transport", name_vi: "Đi lại", name_en: "Transport", icon: "🚗" },
        { id: "c_education", name_vi: "Giáo dục", name_en: "Education", icon: "🎓" },
        { id: "c_shopping", name_vi: "Mua sắm", name_en: "Shopping", icon: "🛍️" },
        { id: "c_health", name_vi: "Y tế", name_en: "Health", icon: "💊" },
        { id: "c_utilities", name_vi: "Hóa đơn / Điện nước", name_en: "Utilities", icon: "💡" },
        { id: "c_entertainment", name_vi: "Giải trí", name_en: "Entertainment", icon: "🎬" },
        { id: "c_other", name_vi: "Khác", name_en: "Other", icon: "📦" },
      ],
      income: [
        { id: "c_salary", name_vi: "Lương", name_en: "Salary", icon: "💰" },
        { id: "c_bonus", name_vi: "Thưởng", name_en: "Bonus", icon: "🎁" },
        { id: "c_investment_in", name_vi: "Đầu tư", name_en: "Investment", icon: "📈" },
        { id: "c_gift", name_vi: "Quà tặng", name_en: "Gift", icon: "🎀" },
        { id: "c_other_in", name_vi: "Khác", name_en: "Other", icon: "📦" },
      ]
    },
    transactions: [],
    budgets: {}, // keyed by "YYYY-MM" -> { categoryId: amountUSD }
    goals: [],
    assets: [
      { id: "a_cash", name: "Cash", type: "cash", value: 0 },
    ],
    settings: {
      primaryCurrency: "USD",
      rateKHR: 4100,
      rateVND: 25400,
      limitAuto: 100,
      limitSuper: 500,
    },
    auditLog: [],
  };
}

// In-memory live store, synced with Firestore if available
let STORE = lsGetAll();
let unsubscribers = [];

// Ensure structure integrity (in case of older saved data)
function ensureStructure() {
  const def = getDefaultData();
  for (const key in def) {
    if (!(key in STORE)) STORE[key] = def[key];
  }
  if (!STORE.categories) STORE.categories = def.categories;
  if (!STORE.categories.expense) STORE.categories.expense = def.categories.expense;
  if (!STORE.categories.income) STORE.categories.income = def.categories.income;
  if (!STORE.settings) STORE.settings = def.settings;
  for (const k in def.settings) {
    if (!(k in STORE.settings)) STORE.settings[k] = def.settings[k];
  }
}
ensureStructure();

// ---------- Persistence ----------
function persist() {
  lsSaveAll(STORE);
  if (firebaseReady && db) {
    // Push the whole document to a single doc for simplicity (matches single-file architecture)
    db.collection(FF_PREFIX + "data").doc("main").set(STORE, { merge: false })
      .catch(err => console.warn("Firestore save failed:", err));
  }
}

// Debounced persist to avoid excessive writes
let persistTimer = null;
function persistDebounced() {
  lsSaveAll(STORE); // local save is instant
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    if (firebaseReady && db) {
      db.collection(FF_PREFIX + "data").doc("main").set(STORE, { merge: false })
        .catch(err => console.warn("Firestore save failed:", err));
    }
  }, 600);
}

// ---------- Real-time sync ----------
function initRealtimeSync(onUpdate) {
  if (!firebaseReady || !db) {
    if (onUpdate) onUpdate();
    return;
  }
  const docRef = db.collection(FF_PREFIX + "data").doc("main");
  docRef.get().then(snap => {
    if (!snap.exists) {
      // First run: push local default data to Firestore
      docRef.set(STORE);
    } else {
      const remote = snap.data();
      if (remote) {
        STORE = remote;
        ensureStructure();
        lsSaveAll(STORE);
      }
    }
    if (onUpdate) onUpdate();

    // Listen for changes from other devices/users
    const unsub = docRef.onSnapshot(snap => {
      if (snap.exists) {
        const remote = snap.data();
        if (remote) {
          STORE = remote;
          ensureStructure();
          lsSaveAll(STORE);
          if (onUpdate) onUpdate();
        }
      }
    }, err => {
      console.warn("Firestore listen error:", err);
    });
    unsubscribers.push(unsub);
  }).catch(err => {
    console.warn("Firestore initial fetch failed, using local data:", err);
    if (onUpdate) onUpdate();
  });
}

// ---------- Generic helpers ----------
function genId(prefix) {
  return prefix + "_" + Date.now().toString(36) + "_" + Math.random().toString(36).substr(2, 6);
}

function nowISO() {
  return new Date().toISOString();
}

function monthKey(dateStr) {
  return dateStr.substring(0, 7); // "YYYY-MM"
}

// ---------- Audit log ----------
function addAuditLog(entry) {
  STORE.auditLog.unshift({
    id: genId("log"),
    timestamp: nowISO(),
    ...entry
  });
  if (STORE.auditLog.length > 200) STORE.auditLog = STORE.auditLog.slice(0, 200);
}

// ---------- Currency conversion ----------
function convertToUSD(amount, currency) {
  amount = parseFloat(amount) || 0;
  if (currency === "USD") return amount;
  if (currency === "KHR") return amount / (STORE.settings.rateKHR || 4100);
  if (currency === "VND") return amount / (STORE.settings.rateVND || 25400);
  return amount;
}

function convertFromUSD(amountUSD, currency) {
  amountUSD = parseFloat(amountUSD) || 0;
  if (currency === "USD") return amountUSD;
  if (currency === "KHR") return amountUSD * (STORE.settings.rateKHR || 4100);
  if (currency === "VND") return amountUSD * (STORE.settings.rateVND || 25400);
  return amountUSD;
}

function formatCurrency(amountUSD, currency) {
  currency = currency || STORE.settings.primaryCurrency || "USD";
  const val = convertFromUSD(amountUSD, currency);
  if (currency === "USD") {
    return "$" + val.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  } else if (currency === "KHR") {
    return Math.round(val).toLocaleString("en-US") + " ៛";
  } else if (currency === "VND") {
    return Math.round(val).toLocaleString("en-US") + " ₫";
  }
  return val.toFixed(2);
}

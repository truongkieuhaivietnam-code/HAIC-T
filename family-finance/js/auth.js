// ===================== auth.js =====================
const SESSION_KEY = "familyFinanceSession_v1";

let currentUser = null;

// ---------- Permission matrix ----------
// Roles: superadmin, admin, member
const PERMISSIONS = {
  createExpense:    { superadmin: true, admin: true,  member: true },
  editOwnExpense:   { superadmin: true, admin: true,  member: true },
  deleteExpense:    { superadmin: true, admin: "own", member: false },
  approveExpense:   { superadmin: true, admin: true,  member: false },
  viewAllFinance:   { superadmin: true, admin: true,  member: "own" },
  manageUsers:      { superadmin: true, admin: false, member: false },
  manageCategories: { superadmin: true, admin: false, member: false },
  manageSettings:   { superadmin: true, admin: false, member: false },
  manageAssets:     { superadmin: true, admin: true,  member: false },
  manageGoals:      { superadmin: true, admin: true,  member: false },
  manageBudget:     { superadmin: true, admin: true,  member: false },
  exportReports:    { superadmin: true, admin: true,  member: false },
};

function can(permission, ownerId) {
  if (!currentUser) return false;
  const rule = PERMISSIONS[permission];
  if (!rule) return false;
  const val = rule[currentUser.role];
  if (val === true) return true;
  if (val === false || val === undefined) return false;
  if (val === "own") return ownerId === currentUser.id;
  return false;
}

function isSuperAdmin() {
  return currentUser && currentUser.role === "superadmin";
}

// ---------- Login ----------
function attemptLogin(email, password) {
  email = (email || "").trim().toLowerCase();
  const user = STORE.users.find(u => u.email.toLowerCase() === email && u.active !== false);
  if (!user) return { success: false, error: "notfound" };
  if (user.password !== password) return { success: false, error: "badpassword" };
  currentUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
  saveSession();
  return { success: true, user: currentUser };
}

function saveSession() {
  const session = {
    userId: currentUser.id,
    timestamp: nowISO(),
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

function restoreSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return false;
    const session = JSON.parse(raw);
    const user = STORE.users.find(u => u.id === session.userId && u.active !== false);
    if (!user) {
      localStorage.removeItem(SESSION_KEY);
      return false;
    }
    currentUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
    return true;
  } catch (e) {
    return false;
  }
}

function logout() {
  currentUser = null;
  localStorage.removeItem(SESSION_KEY);
  unsubscribers.forEach(u => { try { u(); } catch (e) {} });
  unsubscribers = [];
  location.reload();
}

function roleLabel(role) {
  if (role === "superadmin") return t("roleSuperAdmin");
  if (role === "admin") return t("roleAdmin");
  return t("roleMember");
}

// ---------- Approval workflow logic ----------
// Determines initial status for a new expense based on amount + role
function determineExpenseStatus(amountUSD, role) {
  const limitAuto = STORE.settings.limitAuto || 100;
  const limitSuper = STORE.settings.limitSuper || 500;

  if (role === "superadmin") {
    // Super admin's own expenses are auto-approved
    return "approved";
  }
  if (amountUSD < limitAuto) {
    return "approved"; // auto-approved
  }
  return "pending"; // needs approval (regardless of limitSuper tier — super admin reviews all pending)
}

function expenseApprovalTier(amountUSD) {
  const limitAuto = STORE.settings.limitAuto || 100;
  const limitSuper = STORE.settings.limitSuper || 500;
  if (amountUSD < limitAuto) return "auto";
  if (amountUSD >= limitSuper) return "super";
  return "normal";
}

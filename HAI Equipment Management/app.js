// =====================================================================
// HAI EQUIPMENT MANAGEMENT SYSTEM - app.js
// =====================================================================

// ---------------------------------------------------------------------
// 1. CONSTANTS
// ---------------------------------------------------------------------

const SUPERADMIN_EMAIL = "truong.haicambodia@gmail.com";

const ROLES = {
  SUPERADMIN: "superadmin",
  ADMIN: "admin",
  LAB_MANAGER: "lab_manager",
  TECH_MANAGER: "tech_manager",
  CAL_MANAGER: "cal_manager",
  OFFICE_ADMIN: "office_admin",
  EMPLOYEE: "employee"
};

const ROLE_LABELS = {
  superadmin: { vi: "Quản trị tối cao", en: "Super Admin" },
  admin: { vi: "Quản trị viên", en: "Admin" },
  lab_manager: { vi: "QL Phòng Lab", en: "Laboratory Manager" },
  tech_manager: { vi: "QL Kỹ thuật", en: "Technical Manager" },
  cal_manager: { vi: "QL Hiệu chuẩn", en: "Calibration Manager" },
  office_admin: { vi: "QL Văn phòng", en: "Office Admin" },
  employee: { vi: "Nhân viên", en: "Employee" }
};

// Department mapping per manager role
const ROLE_DEPARTMENT = {
  lab_manager: "laboratory",
  tech_manager: "technical",
  cal_manager: "calibration",
  office_admin: "office"
};

const DEPARTMENTS = {
  laboratory: { vi: "Phòng Lab", en: "Laboratory" },
  technical: { vi: "Kỹ thuật", en: "Technical Department" },
  calibration: { vi: "Hiệu chuẩn", en: "Calibration" },
  office: { vi: "Văn phòng", en: "Office" }
};

const COUNTRIES = {
  CAM: { vi: "Campuchia", en: "Cambodia", flag: "🇰🇭" },
  VN: { vi: "Việt Nam", en: "Vietnam", flag: "🇻🇳" },
  LA: { vi: "Lào", en: "Laos", flag: "🇱🇦" }
};

// Type code prefixes used for asset/equipment numbering: {COUNTRY}-{TYPE}-{SEQ}
// (VD: CAM-TECH-0001, CAM-LAB-0001, VN-TECH-0001, LA-CAL-0001)
// Anh có thể chỉnh sửa / bổ sung bảng này theo thực tế công ty.
const TYPE_CODES = {
  FA: { vi: "Tài sản cố định", en: "Fixed Asset" },
  LAB: { vi: "Thiết bị Lab", en: "Laboratory Equipment" },
  TECH: { vi: "Thiết bị Đo đạc", en: "Survey Equipment" },
  DR: { vi: "Thiết bị khoan", en: "Drilling Equipment" },
  CAL: { vi: "Thiết bị hiệu chuẩn", en: "Calibration Equipment" },
  OFF: { vi: "Thiết bị văn phòng", en: "Office Equipment" },
  SP: { vi: "Phụ tùng thay thế", en: "Spare Parts" },
  CON: { vi: "Vật tư tiêu hao", en: "Consumables" }
};

const EQUIPMENT_CATEGORIES = {
  laboratory: {
    label: { vi: "Phòng Lab", en: "Laboratory" },
    sub: ["geological_testing", "material_testing", "field_testing"]
  },
  technical: {
    label: { vi: "Kỹ thuật", en: "Technical Department" },
    sub: ["geological_survey", "topographic_survey"]
  },
  calibration: {
    label: { vi: "Hiệu chuẩn", en: "Calibration" },
    sub: ["calibration_standard", "reference_equipment", "measurement_tools"]
  },
  office: {
    label: { vi: "Văn phòng", en: "Office" },
    sub: ["it_equipment", "furniture"]
  }
};

const SUB_CATEGORY_LABELS = {
  geological_testing: { vi: "Thí nghiệm địa chất", en: "Geological Testing" },
  material_testing: { vi: "Thí nghiệm vật liệu", en: "Material Testing" },
  field_testing: { vi: "Thí nghiệm hiện trường", en: "Field Testing" },
  geological_survey: { vi: "Khảo sát địa chất", en: "Geological Survey" },
  topographic_survey: { vi: "Khảo sát địa hình", en: "Topographic Survey" },
  calibration_standard: { vi: "Chuẩn hiệu chuẩn", en: "Calibration Standard" },
  reference_equipment: { vi: "Thiết bị chuẩn", en: "Reference Equipment" },
  measurement_tools: { vi: "Dụng cụ đo", en: "Measurement Tools" },
  it_equipment: { vi: "Thiết bị IT", en: "IT Equipment" },
  furniture: { vi: "Nội thất", en: "Furniture" }
};

const ASSET_STATUS = ["available", "in_use", "borrowed", "maintenance", "calibration", "lost", "disposed"];
const STATUS_LABELS = {
  available: { vi: "Sẵn sàng", en: "Available", color: "green" },
  in_use: { vi: "Đang sử dụng", en: "In Use", color: "blue" },
  borrowed: { vi: "Đang mượn", en: "Borrowed", color: "orange" },
  maintenance: { vi: "Đang sửa chữa", en: "Under Maintenance", color: "red" },
  calibration: { vi: "Đang hiệu chuẩn", en: "Calibration", color: "orange" },
  lost: { vi: "Thất lạc", en: "Lost", color: "red" },
  disposed: { vi: "Đã thanh lý", en: "Disposed", color: "gray" }
};

const CONDITIONS = ["new", "good", "repair", "damaged", "scrap"];
const CONDITION_LABELS = {
  new: { vi: "Mới", en: "New", color: "blue" },
  good: { vi: "Tốt", en: "Good", color: "green" },
  repair: { vi: "Cần sửa", en: "Repair", color: "orange" },
  damaged: { vi: "Hư hỏng", en: "Damaged", color: "red" },
  scrap: { vi: "Thanh lý/Phế liệu", en: "Scrap", color: "gray" }
};

const MOVEMENT_STATUS = ["pending", "approved", "issued", "returned", "rejected"];
const MOVEMENT_STATUS_LABELS = {
  pending: { vi: "Chờ duyệt", en: "Pending", color: "orange" },
  approved: { vi: "Đã duyệt", en: "Approved", color: "blue" },
  issued: { vi: "Đã xuất", en: "Issued", color: "blue" },
  returned: { vi: "Đã trả", en: "Returned", color: "green" },
  rejected: { vi: "Từ chối", en: "Rejected", color: "red" }
};

const MAINTENANCE_STATUS_LABELS = {
  open: { vi: "Mới báo", en: "Open", color: "red" },
  processing: { vi: "Đang xử lý", en: "Processing", color: "orange" },
  completed: { vi: "Hoàn thành", en: "Completed", color: "green" }
};

const PURCHASE_STATUS_LABELS = {
  pending: { vi: "Chờ duyệt", en: "Pending", color: "orange" },
  approved: { vi: "Đã duyệt", en: "Approved", color: "green" },
  rejected: { vi: "Từ chối", en: "Rejected", color: "red" },
  ordered: { vi: "Đã đặt hàng", en: "Ordered", color: "blue" }
};

const CALIBRATION_EXPIRY_WARNING_DAYS = 30;

// ---------------------------------------------------------------------
// 2. I18N
// ---------------------------------------------------------------------

const I18N = {
  vi: {
    "login.title": "Đăng nhập",
    "login.sub": "Dùng tài khoản HAI-CLOUD hiện có",
    "login.email": "Email",
    "login.password": "Mật khẩu",
    "login.submit": "Đăng nhập",
    "nav.dashboard": "Tổng quan",
    "nav.fixedAssets": "Tài sản cố định",
    "nav.equipment": "Thiết bị",
    "nav.calibration": "Hiệu chuẩn",
    "nav.inventory": "Vật tư tiêu hao",
    "nav.movements": "Mượn/Trả thiết bị",
    "nav.maintenance": "Sửa chữa/Bảo trì",
    "nav.purchase": "Đề nghị mua hàng",
    "nav.reports": "Báo cáo",
    "nav.users": "Người dùng",
    "common.add": "Thêm mới",
    "common.edit": "Sửa",
    "common.delete": "Xóa",
    "common.save": "Lưu",
    "common.cancel": "Hủy",
    "common.close": "Đóng",
    "common.search": "Tìm kiếm...",
    "common.all": "Tất cả",
    "common.exportExcel": "Xuất Excel",
    "common.exportPdf": "Xuất PDF",
    "common.confirm": "Xác nhận",
    "common.noData": "Không có dữ liệu",
    "common.loading": "Đang tải...",
    "common.status": "Trạng thái",
    "common.condition": "Tình trạng",
    "common.country": "Quốc gia",
    "common.department": "Bộ phận",
    "common.location": "Vị trí",
    "common.actions": "Thao tác",
    "common.approve": "Duyệt",
    "common.reject": "Từ chối",
    "common.code": "Mã",
    "common.name": "Tên",
    "common.category": "Phân loại",
    "common.quantity": "Số lượng",
    "common.date": "Ngày",
    "common.notes": "Ghi chú",
    "common.warehouse": "Kho",
    "common.project": "Công trình/Dự án",
    "common.requiredField": "Trường này là bắt buộc",
    "toast.saved": "Đã lưu thành công",
    "toast.deleted": "Đã xóa",
    "toast.error": "Có lỗi xảy ra",
    "toast.approved": "Đã duyệt",
    "toast.rejected": "Đã từ chối"
  },
  en: {
    "login.title": "Sign In",
    "login.sub": "Use your existing HAI-CLOUD account",
    "login.email": "Email",
    "login.password": "Password",
    "login.submit": "Sign In",
    "nav.dashboard": "Dashboard",
    "nav.fixedAssets": "Fixed Assets",
    "nav.equipment": "Equipment",
    "nav.calibration": "Calibration",
    "nav.inventory": "Consumable Inventory",
    "nav.movements": "Equipment Movement",
    "nav.maintenance": "Maintenance",
    "nav.purchase": "Purchase Requests",
    "nav.reports": "Reports",
    "nav.users": "Users",
    "common.add": "Add New",
    "common.edit": "Edit",
    "common.delete": "Delete",
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.close": "Close",
    "common.search": "Search...",
    "common.all": "All",
    "common.exportExcel": "Export Excel",
    "common.exportPdf": "Export PDF",
    "common.confirm": "Confirm",
    "common.noData": "No data",
    "common.loading": "Loading...",
    "common.status": "Status",
    "common.condition": "Condition",
    "common.country": "Country",
    "common.department": "Department",
    "common.location": "Location",
    "common.actions": "Actions",
    "common.approve": "Approve",
    "common.reject": "Reject",
    "common.code": "Code",
    "common.name": "Name",
    "common.category": "Category",
    "common.quantity": "Quantity",
    "common.date": "Date",
    "common.notes": "Notes",
    "common.warehouse": "Warehouse",
    "common.project": "Project / Site",
    "common.requiredField": "This field is required",
    "toast.saved": "Saved successfully",
    "toast.deleted": "Deleted",
    "toast.error": "An error occurred",
    "toast.approved": "Approved",
    "toast.rejected": "Rejected"
  }
};

// ---------------------------------------------------------------------
// 3. STATE
// ---------------------------------------------------------------------

const STATE = {
  lang: localStorage.getItem("hai_eq_lang") || "vi",
  theme: localStorage.getItem("hai_eq_theme") || "light",
  currentUser: null,    // Firebase auth user
  profile: null,        // Firestore user profile {role, department, name}
  page: "dashboard",
  sidebarOpen: false,
  filters: { country: "", department: "" },
  cache: {
    fixedAssets: [],
    equipment: [],
    calibrationStandards: [],
    calibrationRecords: [],
    inventory: [],
    inventoryTransactions: [],
    movements: [],
    maintenance: [],
    purchaseRequests: [],
    users: []
  },
  listeners: []
};

function t(key) {
  return (I18N[STATE.lang] && I18N[STATE.lang][key]) || key;
}

function L(obj) {
  // obj = {vi:"", en:""} -> return current lang string
  if (!obj) return "";
  return obj[STATE.lang] || obj.vi || obj.en || "";
}

// ---------------------------------------------------------------------
// 4. GENERIC HELPERS: toast, modal, formatting
// ---------------------------------------------------------------------

function showToast(message, type = "info") {
  const wrap = document.getElementById("toastWrap");
  const el = document.createElement("div");
  el.className = "toast" + (type === "error" ? " error" : type === "success" ? " success" : "");
  el.textContent = message;
  wrap.appendChild(el);
  setTimeout(() => el.remove(), 4000);
}

// Hiện lỗi kèm message thật từ Firebase (thay vì chỉ "Có lỗi xảy ra" chung)
// để dễ chẩn đoán khi báo lỗi cho người dùng.
function showErrorToast(err) {
  console.error(err);
  const detail = (err && err.code ? `[${err.code}] ` : "") + (err && err.message ? err.message : "");
  showToast(detail || t("toast.error"), "error");
}

function openModal({ title, bodyHtml, footerHtml, size = "" }) {
  document.getElementById("modalTitle").textContent = title;
  document.getElementById("modalBody").innerHTML = bodyHtml;
  document.getElementById("modalFooter").innerHTML = footerHtml || "";
  const box = document.getElementById("modalBox");
  box.className = "modal" + (size === "lg" ? " modal-lg" : "");
  document.getElementById("modalOverlay").classList.add("open");
}

function closeModal() {
  document.getElementById("modalOverlay").classList.remove("open");
}

document.getElementById("modalClose").addEventListener("click", closeModal);
document.getElementById("modalOverlay").addEventListener("click", (e) => {
  if (e.target.id === "modalOverlay") closeModal();
});

function confirmDialog(message, onConfirm) {
  openModal({
    title: t("common.confirm"),
    bodyHtml: `<p>${escapeHtml(message)}</p>`,
    footerHtml: `
      <button class="btn" id="confirmCancel">${t("common.cancel")}</button>
      <button class="btn btn-danger" id="confirmOk">${t("common.confirm")}</button>
    `
  });
  document.getElementById("confirmCancel").onclick = closeModal;
  document.getElementById("confirmOk").onclick = () => {
    closeModal();
    onConfirm();
  };
}

function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function fmtDate(ts) {
  if (!ts) return "-";
  let d;
  if (ts.toDate) d = ts.toDate();
  else d = new Date(ts);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("vi-VN");
}

function fmtMoney(n) {
  if (n === null || n === undefined || n === "") return "-";
  return Number(n).toLocaleString("vi-VN");
}

function badge(labelObj, key) {
  const item = labelObj[key];
  if (!item) return `<span class="badge badge-gray">${escapeHtml(key || "-")}</span>`;
  return `<span class="badge badge-${item.color}">${escapeHtml(L(item))}</span>`;
}

function daysUntil(ts) {
  if (!ts) return null;
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  const diff = Math.ceil((d.getTime() - Date.now()) / 86400000);
  return diff;
}

function nowTs() {
  return firebase.firestore.FieldValue.serverTimestamp();
}

function uid() {
  return STATE.currentUser ? STATE.currentUser.uid : null;
}

// ---------------------------------------------------------------------
// 5. AUTH / RBAC
// ---------------------------------------------------------------------

document.getElementById("btnLogin").addEventListener("click", doLogin);
document.getElementById("loginPassword").addEventListener("keydown", (e) => {
  if (e.key === "Enter") doLogin();
});

async function doLogin() {
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;
  const errEl = document.getElementById("loginError");
  errEl.classList.add("hidden");
  if (!email || !password) {
    errEl.textContent = t("common.requiredField");
    errEl.classList.remove("hidden");
    return;
  }
  try {
    await auth.signInWithEmailAndPassword(email, password);
  } catch (err) {
    errEl.textContent = mapAuthError(err);
    errEl.classList.remove("hidden");
  }
}

function mapAuthError(err) {
  const code = err && err.code;
  const map = {
    "auth/user-not-found": STATE.lang === "vi" ? "Tài khoản không tồn tại" : "Account not found",
    "auth/wrong-password": STATE.lang === "vi" ? "Sai mật khẩu" : "Wrong password",
    "auth/invalid-email": STATE.lang === "vi" ? "Email không hợp lệ" : "Invalid email",
    "auth/too-many-requests": STATE.lang === "vi" ? "Quá nhiều lần thử, vui lòng thử lại sau" : "Too many attempts, try again later"
  };
  return map[code] || (err && err.message) || t("toast.error");
}

document.getElementById("btnLogout").addEventListener("click", () => {
  confirmDialog(STATE.lang === "vi" ? "Đăng xuất khỏi hệ thống?" : "Sign out?", () => auth.signOut());
});

// Bootstrap / load user profile document. Reuses existing HAI-CLOUD auth users;
// if a user logs in for the first time on this app and has no profile doc yet,
// create one (superadmin auto-elevated, others default to 'employee' pending
// an admin assigning the correct role(s)/department(s)).
//
// SCHEMA (hỗ trợ nhiều vai trò theo nhiều phòng ban):
//   globalRole: 'superadmin' | 'admin' | null   -- toàn quyền hệ thống
//   deptRoles: { laboratory: 'employee', technical: 'tech_manager', ... }
//              -- 1 vai trò cho MỖI phòng ban mà người này tham gia,
//                 1 người có thể có mặt ở nhiều phòng ban cùng lúc.
//   managedDepartments: ['technical']  -- derived: các phòng ban mà người
//              này có vai trò QUẢN LÝ (dùng để check quyền nhanh + Firestore rules).
//
// Hồ sơ cũ (tạo trước khi có tính năng đa vai trò) chỉ có field
// role/department đơn — normalizeProfile() sẽ tự quy đổi sang schema mới
// khi đọc, không cần migrate dữ liệu cũ.
async function ensureUserProfile(fbUser) {
  const ref = COLLECTIONS.users.doc(fbUser.uid);
  const snap = await ref.get();
  if (snap.exists) {
    return snap.data();
  }
  const isSuper = fbUser.email && fbUser.email.toLowerCase() === SUPERADMIN_EMAIL.toLowerCase();
  const profile = {
    email: fbUser.email || "",
    name: fbUser.displayName || (fbUser.email ? fbUser.email.split("@")[0] : "User"),
    globalRole: isSuper ? ROLES.SUPERADMIN : null,
    deptRoles: {},
    managedDepartments: [],
    country: null,
    active: true,
    createdAt: nowTs()
  };
  await ref.set(profile);
  return profile;
}

const MANAGER_ROLES = [ROLES.LAB_MANAGER, ROLES.TECH_MANAGER, ROLES.CAL_MANAGER, ROLES.OFFICE_ADMIN];

// Quy đổi hồ sơ (cũ hoặc mới) về 1 dạng chuẩn để toàn bộ app dùng chung.
function normalizeProfile(data) {
  const p = Object.assign({}, data);
  if (!p.deptRoles) {
    p.deptRoles = {};
    // hồ sơ cũ: 1 role + 1 department duy nhất
    if (data.role && data.department && data.role !== ROLES.SUPERADMIN && data.role !== ROLES.ADMIN) {
      p.deptRoles[data.department] = data.role;
    }
  }
  if (p.globalRole === undefined || p.globalRole === null) {
    p.globalRole = (data.role === ROLES.SUPERADMIN || data.role === ROLES.ADMIN) ? data.role : null;
  }
  if (!p.managedDepartments) {
    p.managedDepartments = Object.keys(p.deptRoles).filter((d) => MANAGER_ROLES.includes(p.deptRoles[d]));
  }
  return p;
}

function isAdminLevel() {
  return !!(STATE.profile && (STATE.profile.globalRole === ROLES.SUPERADMIN || STATE.profile.globalRole === ROLES.ADMIN));
}

function isSuperAdminUser() {
  return !!(STATE.profile && STATE.profile.globalRole === ROLES.SUPERADMIN);
}

function myManagedDepartments() {
  return (STATE.profile && STATE.profile.managedDepartments) || [];
}

function myAllDepartments() {
  return STATE.profile ? Object.keys(STATE.profile.deptRoles || {}) : [];
}

function isManagerOfDept(dept) {
  return isAdminLevel() || myManagedDepartments().includes(dept);
}

function canManageEquipment() {
  return isAdminLevel() || myManagedDepartments().length > 0;
}

function canApprove() {
  return isAdminLevel() || myManagedDepartments().length > 0;
}

auth.onAuthStateChanged(async (fbUser) => {
  if (fbUser) {
    STATE.currentUser = fbUser;
    try {
      const rawProfile = await ensureUserProfile(fbUser);
      STATE.profile = normalizeProfile(rawProfile);
    } catch (err) {
      showErrorToast(err);
      return;
    }
    document.getElementById("loginScreen").classList.add("hidden");
    document.getElementById("appShell").classList.remove("hidden");
    renderUserChip();
    buildNav();
    attachRealtimeListeners();
    navigateTo("dashboard");
  } else {
    STATE.currentUser = null;
    STATE.profile = null;
    detachRealtimeListeners();
    document.getElementById("appShell").classList.add("hidden");
    document.getElementById("loginScreen").classList.remove("hidden");
  }
});

function describeMyRoles() {
  const parts = [];
  if (STATE.profile.globalRole) parts.push(L(ROLE_LABELS[STATE.profile.globalRole] || {}));
  Object.keys(STATE.profile.deptRoles || {}).forEach((d) => {
    const r = STATE.profile.deptRoles[d];
    if (!r) return;
    parts.push(`${L(ROLE_LABELS[r] || { vi: r, en: r })} - ${L(DEPARTMENTS[d] || { vi: d, en: d })}`);
  });
  return parts.length ? parts.join(", ") : L(ROLE_LABELS[ROLES.EMPLOYEE]);
}

function renderUserChip() {
  const name = STATE.profile.name || STATE.profile.email || "?";
  document.getElementById("userAvatar").textContent = name.substring(0, 1).toUpperCase();
  document.getElementById("userName").textContent = name;
  document.getElementById("userRole").textContent = describeMyRoles();
}

// ---------------------------------------------------------------------
// 6. THEME / LANG / SIDEBAR TOGGLES
// ---------------------------------------------------------------------

function applyTheme() {
  document.documentElement.setAttribute("data-theme", STATE.theme);
}
applyTheme();

document.getElementById("btnTheme").addEventListener("click", () => {
  STATE.theme = STATE.theme === "light" ? "dark" : "light";
  localStorage.setItem("hai_eq_theme", STATE.theme);
  applyTheme();
});

document.getElementById("btnLang").addEventListener("click", () => {
  STATE.lang = STATE.lang === "vi" ? "en" : "vi";
  localStorage.setItem("hai_eq_lang", STATE.lang);
  buildNav();
  renderUserChip();
  navigateTo(STATE.page);
});

document.getElementById("btnMenuToggle").addEventListener("click", () => {
  document.getElementById("sidebar").classList.toggle("open");
});

// ---------------------------------------------------------------------
// 7. NAVIGATION / ROUTER
// ---------------------------------------------------------------------

const NAV_ITEMS = [
  { id: "dashboard", icon: "📊", label: "nav.dashboard", visible: () => true },
  { id: "fixedAssets", icon: "🏢", label: "nav.fixedAssets", visible: () => true },
  { id: "equipment", icon: "🛠️", label: "nav.equipment", visible: () => true },
  { id: "calibration", icon: "📐", label: "nav.calibration", visible: () => true },
  { id: "inventory", icon: "📦", label: "nav.inventory", visible: () => true },
  { id: "movements", icon: "🚚", label: "nav.movements", visible: () => true },
  { id: "maintenance", icon: "🔧", label: "nav.maintenance", visible: () => true },
  { id: "purchase", icon: "🧾", label: "nav.purchase", visible: () => true },
  { id: "reports", icon: "📑", label: "nav.reports", visible: () => canApprove() },
  { id: "users", icon: "👤", label: "nav.users", visible: () => isAdminLevel() }
];

function buildNav() {
  const nav = document.getElementById("navScroll");
  nav.innerHTML = "";
  NAV_ITEMS.forEach((item) => {
    if (!item.visible()) return;
    const btn = document.createElement("button");
    btn.className = "nav-item" + (STATE.page === item.id ? " active" : "");
    btn.innerHTML = `<span class="ico">${item.icon}</span><span>${t(item.label)}</span>`;
    btn.onclick = () => navigateTo(item.id);
    nav.appendChild(btn);
  });
}

const PAGE_RENDERERS = {}; // populated by each module: PAGE_RENDERERS.dashboard = function(){...}

function navigateTo(pageId) {
  STATE.page = pageId;
  document.getElementById("sidebar").classList.remove("open");
  buildNav();
  const item = NAV_ITEMS.find((i) => i.id === pageId);
  document.getElementById("pageTitle").textContent = item ? t(item.label) : pageId;
  document.getElementById("topbarActions").innerHTML = "";
  const renderer = PAGE_RENDERERS[pageId];
  if (renderer) {
    renderer();
  } else {
    document.getElementById("pageContent").innerHTML = `<div class="empty-state">${t("common.noData")}</div>`;
  }
}

// ---------------------------------------------------------------------
// 8. REALTIME LISTENERS (cache collections used across modules)
// ---------------------------------------------------------------------

function attachRealtimeListeners() {
  detachRealtimeListeners();
  const subs = [
    ["fixedAssets", COLLECTIONS.fixedAssets],
    ["equipment", COLLECTIONS.equipment],
    ["calibrationStandards", COLLECTIONS.calibrationStandards],
    ["calibrationRecords", COLLECTIONS.calibrationRecords],
    ["inventory", COLLECTIONS.inventory],
    ["inventoryTransactions", COLLECTIONS.inventoryTransactions],
    ["movements", COLLECTIONS.movements],
    ["maintenance", COLLECTIONS.maintenance],
    ["purchaseRequests", COLLECTIONS.purchaseRequests],
    ["users", COLLECTIONS.users]
  ];
  subs.forEach(([key, ref]) => {
    const unsub = ref.onSnapshot(
      (snap) => {
        STATE.cache[key] = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        if (STATE.page && PAGE_RENDERERS[STATE.page]) PAGE_RENDERERS[STATE.page]();
      },
      (err) => console.error(`listener ${key} error`, err)
    );
    STATE.listeners.push(unsub);
  });
}

function detachRealtimeListeners() {
  STATE.listeners.forEach((u) => u && u());
  STATE.listeners = [];
}

// ---------------------------------------------------------------------
// 9. CODE GENERATOR: {TYPE}-{COUNTRY}-{SEQ}  e.g. DR-CAM-001
// ---------------------------------------------------------------------

async function generateAssetCode(typeCode, countryCode) {
  const counterId = `${typeCode}_${countryCode}`;
  const counterRef = COLLECTIONS.counters.doc(counterId);
  const newSeq = await db.runTransaction(async (tx) => {
    const snap = await tx.get(counterRef);
    const last = snap.exists ? snap.data().lastSeq || 0 : 0;
    const next = last + 1;
    tx.set(counterRef, { lastSeq: next, typeCode, countryCode, updatedAt: nowTs() }, { merge: true });
    return next;
  });
  // Định dạng đã xác nhận: {QUỐC GIA}-{LOẠI}-{SỐ THỨ TỰ 4 chữ số}
  // VD: CAM-TECH-0001, CAM-LAB-0001, VN-TECH-0001, LA-CAL-0001
  const seqStr = String(newSeq).padStart(4, "0");
  return `${countryCode}-${typeCode}-${seqStr}`;
}

// =====================================================================
// MODULE: DASHBOARD
// =====================================================================

PAGE_RENDERERS.dashboard = function renderDashboard() {
  const fa = STATE.cache.fixedAssets;
  const eq = STATE.cache.equipment;
  const cal = STATE.cache.calibrationStandards;
  const allAssets = [...fa, ...eq, ...cal];
  const inv = STATE.cache.inventory;
  const mv = STATE.cache.movements;
  const mt = STATE.cache.maintenance;
  const pr = STATE.cache.purchaseRequests;

  const visibleAssets = applyScopeFilter(filterByScope(allAssets));
  const total = visibleAssets.length;
  const available = visibleAssets.filter((a) => a.status === "available").length;
  const borrowed = visibleAssets.filter((a) => a.status === "borrowed" || a.status === "in_use").length;
  const inMaintenance = visibleAssets.filter((a) => a.status === "maintenance").length;

  // Cảnh báo hiệu chuẩn: lọc theo quốc gia/phòng ban dựa trên snapshot lưu
  // sẵn trong từng bản ghi calibrationRecords (assetCountry/assetDepartment).
  const calRecordsFiltered = filterByScope(STATE.cache.calibrationRecords).filter((r) =>
    (!STATE.filters.country || r.assetCountry === STATE.filters.country) &&
    (!STATE.filters.department || r.assetDepartment === STATE.filters.department)
  );
  const calDue = calRecordsFiltered.filter((r) => {
    const d = daysUntil(r.expiryDate);
    return d !== null && d <= CALIBRATION_EXPIRY_WARNING_DAYS;
  }).length;

  const lowStock = filterByScope(inv).filter((i) => Number(i.warehouseStock || 0) <= Number(i.minimumStock || 0)).length;
  const pendingMovements = filterByScope(mv).filter((m) => m.status === "pending").length;
  const pendingPurchase = filterByScope(pr).filter((p) => p.status === "pending").length;
  const openMaintenance = filterByScope(mt).filter((m) => m.status !== "completed").length;

  const html = `
    <div class="panel">
      <div class="panel-body" style="padding-bottom:0;">${renderScopeFilterBar()}</div>
    </div>

    <div class="kpi-grid">
      ${kpiCard(STATE.lang === "vi" ? "Tổng thiết bị/tài sản" : "Total Equipment/Assets", total)}
      ${kpiCard(STATE.lang === "vi" ? "Sẵn sàng" : "Available", available, "ok")}
      ${kpiCard(STATE.lang === "vi" ? "Đang mượn/sử dụng" : "Borrowed/In Use", borrowed, "warn")}
      ${kpiCard(STATE.lang === "vi" ? "Đang sửa chữa" : "Maintenance", inMaintenance, "warn")}
      ${kpiCard(STATE.lang === "vi" ? "Sắp hết hạn hiệu chuẩn" : "Calibration Due", calDue, "alert")}
      ${kpiCard(STATE.lang === "vi" ? "Vật tư dưới mức tối thiểu" : "Low Stock", lowStock, "alert")}
      ${kpiCard(STATE.lang === "vi" ? "Yêu cầu mượn chờ duyệt" : "Pending Movement Requests", pendingMovements, "warn")}
      ${kpiCard(STATE.lang === "vi" ? "Đề nghị mua chờ duyệt" : "Pending Purchase Requests", pendingPurchase, "warn")}
      ${kpiCard(STATE.lang === "vi" ? "Sửa chữa chưa xong" : "Open Maintenance", openMaintenance, "alert")}
    </div>

    <div class="panel">
      <div class="panel-header"><h3>${STATE.lang === "vi" ? "Cảnh báo hiệu chuẩn sắp hết hạn" : "Calibration Expiry Alerts"}</h3></div>
      <div class="panel-body">${renderCalibrationAlertsTable(calRecordsFiltered)}</div>
    </div>

    <div class="panel">
      <div class="panel-header"><h3>${STATE.lang === "vi" ? "Vật tư dưới mức tối thiểu" : "Low Stock Items"}</h3></div>
      <div class="panel-body">${renderLowStockTable()}</div>
    </div>
  `;
  document.getElementById("pageContent").innerHTML = html;
  attachScopeFilterHandlers();
};

function kpiCard(label, value, variant) {
  return `<div class="kpi-card ${variant || ""}"><div class="label">${escapeHtml(label)}</div><div class="value">${value}</div></div>`;
}

// Restrict data visible to managers/employees to their own department / own records.
// Admin & superadmin see everything.
// Restrict data visible to managers/employees to their own department(s) /
// own records. Admin & superadmin see everything. A user managing several
// departments (e.g. lab + technical + calibration) sees full data for ALL
// of those departments, plus their own personal items everywhere else.
function filterByScope(items) {
  if (!STATE.profile) return [];
  if (isAdminLevel()) return items;
  const managed = myManagedDepartments();
  if (managed.length > 0) {
    return items.filter((i) =>
      !i.department || managed.includes(i.department) ||
      i.currentUser === uid() || i.requestedBy === uid() || i.employeeId === uid() || i.reportedBy === uid()
    );
  }
  // pure employee (no managed department): only items related to them
  return items.filter((i) =>
    i.currentUser === uid() ||
    i.requestedBy === uid() ||
    i.employeeId === uid() ||
    i.reportedBy === uid()
  );
}

// ---------------------------------------------------------------------
// 9b. BỘ LỌC THEO QUỐC GIA + PHÒNG BAN (dùng chung cho Dashboard + 3 trang
// Tài sản/Thiết bị/Hiệu chuẩn). Trạng thái lọc lưu ở STATE.filters và áp
// dụng lại mỗi khi trang hiện tại được render lại.
// ---------------------------------------------------------------------

function renderScopeFilterBar() {
  return `
    <div class="field-row" style="margin-bottom:14px;align-items:flex-end;">
      <div class="field" style="max-width:220px;margin-bottom:0;">
        <label>${t("common.country")}</label>
        <select id="filterCountry">
          <option value="">${t("common.all")}</option>
          ${Object.keys(COUNTRIES).map((c) => `<option value="${c}" ${STATE.filters.country === c ? "selected" : ""}>${COUNTRIES[c].flag} ${L(COUNTRIES[c])}</option>`).join("")}
        </select>
      </div>
      <div class="field" style="max-width:220px;margin-bottom:0;">
        <label>${t("common.department")}</label>
        <select id="filterDepartment">
          <option value="">${t("common.all")}</option>
          ${Object.keys(DEPARTMENTS).map((d) => `<option value="${d}" ${STATE.filters.department === d ? "selected" : ""}>${L(DEPARTMENTS[d])}</option>`).join("")}
        </select>
      </div>
      ${(STATE.filters.country || STATE.filters.department) ? `<button class="btn btn-sm" id="filterClear">${STATE.lang === "vi" ? "Xóa lọc" : "Clear filter"}</button>` : ""}
    </div>
  `;
}

function attachScopeFilterHandlers() {
  const cSel = document.getElementById("filterCountry");
  const dSel = document.getElementById("filterDepartment");
  if (cSel) cSel.addEventListener("change", (e) => {
    STATE.filters.country = e.target.value;
    if (PAGE_RENDERERS[STATE.page]) PAGE_RENDERERS[STATE.page]();
  });
  if (dSel) dSel.addEventListener("change", (e) => {
    STATE.filters.department = e.target.value;
    if (PAGE_RENDERERS[STATE.page]) PAGE_RENDERERS[STATE.page]();
  });
  const clearBtn = document.getElementById("filterClear");
  if (clearBtn) clearBtn.addEventListener("click", () => {
    STATE.filters.country = "";
    STATE.filters.department = "";
    if (PAGE_RENDERERS[STATE.page]) PAGE_RENDERERS[STATE.page]();
  });
}

function applyScopeFilter(items) {
  return items.filter((i) =>
    (!STATE.filters.country || i.country === STATE.filters.country) &&
    (!STATE.filters.department || i.department === STATE.filters.department)
  );
}

function renderCalibrationAlertsTable(recordsInScope) {
  const source = recordsInScope || filterByScope(STATE.cache.calibrationRecords);
  const records = source
    .filter((r) => daysUntil(r.expiryDate) !== null && daysUntil(r.expiryDate) <= CALIBRATION_EXPIRY_WARNING_DAYS)
    .sort((a, b) => daysUntil(a.expiryDate) - daysUntil(b.expiryDate));
  if (records.length === 0) return `<div class="empty-state">${t("common.noData")}</div>`;
  const rows = records.map((r) => {
    const d = daysUntil(r.expiryDate);
    const overdue = d < 0;
    return `<tr>
      <td>${escapeHtml(r.assetCodeSnapshot || r.assetId || "-")}</td>
      <td>${r.assetCountry ? (COUNTRIES[r.assetCountry] ? COUNTRIES[r.assetCountry].flag + " " + L(COUNTRIES[r.assetCountry]) : r.assetCountry) : "-"}</td>
      <td>${r.assetDepartment ? L(DEPARTMENTS[r.assetDepartment] || {}) : "-"}</td>
      <td>${fmtDate(r.expiryDate)}</td>
      <td>${overdue
        ? `<span class="badge badge-red">${STATE.lang === "vi" ? "Quá hạn" : "Overdue"} ${Math.abs(d)}d</span>`
        : `<span class="badge badge-orange">${d} ${STATE.lang === "vi" ? "ngày còn lại" : "days left"}</span>`}</td>
      <td>${escapeHtml(r.certificateNo || "-")}</td>
    </tr>`;
  }).join("");
  return `<div class="table-wrap"><table class="data-table">
    <thead><tr><th>${t("common.code")}</th><th>${t("common.country")}</th><th>${t("common.department")}</th><th>${STATE.lang === "vi" ? "Hết hạn" : "Expiry"}</th><th>${t("common.status")}</th><th>${STATE.lang === "vi" ? "Số tem/chứng chỉ" : "Cert/Seal No."}</th></tr></thead>
    <tbody>${rows}</tbody></table></div>`;
}

function renderLowStockTable() {
  const items = filterByScope(STATE.cache.inventory).filter((i) => Number(i.warehouseStock || 0) <= Number(i.minimumStock || 0));
  if (items.length === 0) return `<div class="empty-state">${t("common.noData")}</div>`;
  const rows = items.map((i) => `<tr>
    <td>${escapeHtml(i.itemCode || "-")}</td>
    <td>${escapeHtml(i.name || "-")}</td>
    <td class="num">${i.warehouseStock || 0} ${escapeHtml(i.unit || "")}</td>
    <td class="num">${i.minimumStock || 0} ${escapeHtml(i.unit || "")}</td>
  </tr>`).join("");
  return `<div class="table-wrap"><table class="data-table">
    <thead><tr><th>${t("common.code")}</th><th>${t("common.name")}</th><th>${STATE.lang === "vi" ? "Tồn kho" : "Stock"}</th><th>${STATE.lang === "vi" ? "Tối thiểu" : "Minimum"}</th></tr></thead>
    <tbody>${rows}</tbody></table></div>`;
}

// =====================================================================
// GENERIC ASSET MODULE FACTORY
// Used for: Fixed Assets, Equipment, Calibration Standards
// (they share the same record shape: code / name / category / country /
//  status / condition / location / currentUser ...)
// =====================================================================

function makeAssetModule(opts) {
  const {
    pageId, cacheKey, collectionRef, titleVi, titleEn,
    categoryOptions,            // [{value, labelVi, labelEn}]
    defaultTypeCode,            // e.g. "FA", "LAB", "CAL"
    typeCodeChoices,            // array of type codes selectable, defaults to [defaultTypeCode]
    showSubCategory,            // bool: show department sub-category select (for Equipment)
    departmentSource,           // "category" (category value IS the department, e.g. equipment/calibration)
                                 // or "manual" (show a separate department selector, e.g. fixed assets)
    fixedDepartment,            // string: force department to a constant value (e.g. "calibration") instead of asking
    showCalibration             // bool: show "Hiệu chuẩn" quick-entry fields (date/expiry/cert no.)
  } = opts;

  function moduleTitle() { return STATE.lang === "vi" ? titleVi : titleEn; }

  function getItems() {
    return filterByScope(STATE.cache[cacheKey] || []);
  }

  PAGE_RENDERERS[pageId] = function render() {
    document.getElementById("topbarActions").innerHTML = `
      <button class="btn btn-primary" id="btnAdd_${pageId}">+ ${t("common.add")}</button>
    `;
    document.getElementById(`btnAdd_${pageId}`).onclick = () => openAssetForm(null);

    const items = applyScopeFilter(getItems());
    const rows = items.map((item) => {
      const calBadge = calibrationStatusBadge(item);
      return `
      <tr>
        <td><span class="code-preview" style="font-size:11.5px;padding:3px 8px;">${escapeHtml(item.assetCode || "-")}</span></td>
        <td>${escapeHtml(item.name || "-")}</td>
        <td>${escapeHtml(categoryLabel(item))}</td>
        <td>${item.department ? L(DEPARTMENTS[item.department] || {}) : "-"}</td>
        <td>${item.country ? (COUNTRIES[item.country] ? COUNTRIES[item.country].flag + " " + L(COUNTRIES[item.country]) : item.country) : "-"}</td>
        <td>${badge(STATUS_LABELS, item.status)}</td>
        <td>${badge(CONDITION_LABELS, item.condition)}</td>
        <td>${escapeHtml(locationLabel(item))}</td>
        <td>${calBadge}</td>
        <td class="row-actions">
          <button class="btn btn-sm" data-act="edit" data-id="${item.id}">${t("common.edit")}</button>
          ${isAdminLevel() ? `<button class="btn btn-sm btn-danger" data-act="del" data-id="${item.id}">${t("common.delete")}</button>` : ""}
        </td>
      </tr>
    `;
    }).join("");

    document.getElementById("pageContent").innerHTML = `
      <div class="panel">
        <div class="panel-header">
          <h3>${moduleTitle()}</h3>
          <div class="spacer"></div>
          <button class="btn btn-sm" id="btnXlsx_${pageId}">${t("common.exportExcel")}</button>
          <button class="btn btn-sm" id="btnPdf_${pageId}">${t("common.exportPdf")}</button>
        </div>
        <div class="panel-body">
          ${renderScopeFilterBar()}
          ${items.length === 0
            ? `<div class="empty-state"><div class="ico">📭</div>${t("common.noData")}</div>`
            : `<div class="table-wrap"><table class="data-table">
                <thead><tr>
                  <th>${t("common.code")}</th><th>${t("common.name")}</th><th>${t("common.category")}</th>
                  <th>${t("common.department")}</th>
                  <th>${t("common.country")}</th><th>${t("common.status")}</th><th>${t("common.condition")}</th>
                  <th>${t("common.location")}</th>
                  <th>${STATE.lang === "vi" ? "Hiệu chuẩn" : "Calibration"}</th>
                  <th>${t("common.actions")}</th>
                </tr></thead>
                <tbody>${rows}</tbody>
              </table></div>`
          }
        </div>
      </div>
    `;

    attachScopeFilterHandlers();
    document.getElementById(`btnXlsx_${pageId}`).onclick = () => exportAssetsExcel(items, moduleTitle());
    document.getElementById(`btnPdf_${pageId}`).onclick = () => exportAssetsPdf(items, moduleTitle());

    document.querySelectorAll(`#pageContent [data-act="edit"]`).forEach((btn) => {
      btn.onclick = () => openAssetForm(items.find((i) => i.id === btn.dataset.id));
    });
    document.querySelectorAll(`#pageContent [data-act="del"]`).forEach((btn) => {
      btn.onclick = () => confirmDialog(
        STATE.lang === "vi" ? "Xóa mục này?" : "Delete this item?",
        async () => {
          try {
            await collectionRef.doc(btn.dataset.id).delete();
            await COLLECTIONS.calibrationRecords.doc(`quick_${btn.dataset.id}`).delete().catch(() => {});
            showToast(t("toast.deleted"), "success");
          } catch (err) { showErrorToast(err); }
        }
      );
    });
  };

  function calibrationStatusBadge(item) {
    if (!item.calibrationExpiryDate) return `<span class="badge badge-gray">-</span>`;
    const d = daysUntil(item.calibrationExpiryDate);
    if (d === null) return `<span class="badge badge-gray">-</span>`;
    if (d < 0) return `<span class="badge badge-red">${STATE.lang === "vi" ? "Quá hạn" : "Overdue"} ${Math.abs(d)}d</span>`;
    if (d <= CALIBRATION_EXPIRY_WARNING_DAYS) return `<span class="badge badge-orange">${d}${STATE.lang === "vi" ? "ng còn" : "d left"}</span>`;
    return `<span class="badge badge-green">OK</span>`;
  }

  function categoryLabel(item) {
    const opt = categoryOptions.find((c) => c.value === item.category);
    let lbl = opt ? (STATE.lang === "vi" ? opt.labelVi : opt.labelEn) : (item.category || "-");
    if (item.subCategory && SUB_CATEGORY_LABELS[item.subCategory]) {
      lbl += " / " + L(SUB_CATEGORY_LABELS[item.subCategory]);
    }
    return lbl;
  }

  function locationLabel(item) {
    if (!item.location) return "-";
    const typeLbl = item.location.type === "project"
      ? (STATE.lang === "vi" ? "Dự án" : "Project")
      : (STATE.lang === "vi" ? "Kho" : "Warehouse");
    return `${typeLbl}: ${item.location.name || "-"}`;
  }

  function openAssetForm(existing) {
    const choices = typeCodeChoices || [defaultTypeCode];
    const isEdit = !!existing;
    const categorySelectHtml = categoryOptions.map((c) =>
      `<option value="${c.value}" ${existing && existing.category === c.value ? "selected" : ""}>${STATE.lang === "vi" ? c.labelVi : c.labelEn}</option>`
    ).join("");

    const subCatHtml = showSubCategory ? `
      <div class="field" id="subCategoryField">
        <label>${STATE.lang === "vi" ? "Phân loại chi tiết" : "Sub-category"}</label>
        <select id="f_subCategory"></select>
      </div>` : "";

    const departmentFieldHtml = departmentSource === "manual" ? `
      <div class="field">
        <label>${STATE.lang === "vi" ? "Phòng ban sử dụng/phụ trách" : "Department in charge"} *</label>
        <select id="f_department">
          ${Object.keys(DEPARTMENTS).map((d) => `<option value="${d}" ${existing && existing.department === d ? "selected" : ""}>${L(DEPARTMENTS[d])}</option>`).join("")}
        </select>
      </div>` : "";

    const calibrationHtml = showCalibration ? `
      <div class="field" style="margin-top:4px;">
        <label style="font-weight:700;">${STATE.lang === "vi" ? "Hiệu chuẩn (bỏ trống nếu thiết bị không cần hiệu chuẩn)" : "Calibration (leave blank if not applicable)"}</label>
      </div>
      <div class="field-row">
        <div class="field"><label>${STATE.lang === "vi" ? "Ngày hiệu chuẩn gần nhất" : "Last Calibration Date"}</label><input type="date" id="f_calDate" value="${existing && existing.lastCalibrationDate ? toDateInputValue(existing.lastCalibrationDate) : ""}"></div>
        <div class="field"><label>${STATE.lang === "vi" ? "Hạn hiệu chuẩn" : "Calibration Expiry"}</label><input type="date" id="f_calExpiry" value="${existing && existing.calibrationExpiryDate ? toDateInputValue(existing.calibrationExpiryDate) : ""}"></div>
        <div class="field"><label>${STATE.lang === "vi" ? "Số tem/chứng chỉ hiệu chuẩn" : "Calibration Cert/Seal No."}</label><input id="f_calCertNo" value="${escapeHtml(existing && existing.calibrationCertNo || "")}"></div>
      </div>` : "";

    const bodyHtml = `
      <div class="field-row">
        <div class="field">
          <label>${t("common.category")} *</label>
          <select id="f_category">${categorySelectHtml}</select>
        </div>
        ${subCatHtml}
        ${departmentFieldHtml}
      </div>
      <div class="field-row">
        <div class="field">
          <label>${t("common.name")} *</label>
          <input id="f_name" value="${escapeHtml(existing && existing.name || "")}">
        </div>
        <div class="field">
          <label>${t("common.country")} *</label>
          <select id="f_country">
            ${Object.keys(COUNTRIES).map((c) => `<option value="${c}" ${existing && existing.country === c ? "selected" : ""}>${COUNTRIES[c].flag} ${L(COUNTRIES[c])}</option>`).join("")}
          </select>
        </div>
      </div>
      ${choices.length > 1 ? `
      <div class="field">
        <label>${STATE.lang === "vi" ? "Loại mã" : "Code Type"} *</label>
        <select id="f_typeCode">
          ${choices.map((tc) => `<option value="${tc}" ${existing && existing.typeCode === tc ? "selected" : ""}>${tc} - ${L(TYPE_CODES[tc])}</option>`).join("")}
        </select>
      </div>` : `<input type="hidden" id="f_typeCode" value="${defaultTypeCode}">`}
      <div class="field">
        <label>${t("common.code")}</label>
        <div class="code-preview" id="f_codePreview">${existing ? escapeHtml(existing.assetCode) : (STATE.lang === "vi" ? "Tự động sinh khi lưu" : "Auto-generated on save")}</div>
      </div>
      <div class="field-row">
        <div class="field"><label>${STATE.lang === "vi" ? "Hãng SX" : "Brand"}</label><input id="f_brand" value="${escapeHtml(existing && existing.brand || "")}"></div>
        <div class="field"><label>${STATE.lang === "vi" ? "Model" : "Model"}</label><input id="f_model" value="${escapeHtml(existing && existing.model || "")}"></div>
        <div class="field"><label>${STATE.lang === "vi" ? "Số Serial" : "Serial Number"}</label><input id="f_serial" value="${escapeHtml(existing && existing.serialNumber || "")}"></div>
      </div>
      <div class="field-row">
        <div class="field"><label>${STATE.lang === "vi" ? "Ngày mua" : "Purchase Date"}</label><input type="date" id="f_purchaseDate" value="${existing && existing.purchaseDate ? toDateInputValue(existing.purchaseDate) : ""}"></div>
        <div class="field"><label>${STATE.lang === "vi" ? "Giá mua" : "Purchase Price"}</label><input type="number" id="f_price" value="${existing && existing.purchasePrice || ""}"></div>
      </div>
      <div class="field-row">
        <div class="field">
          <label>${t("common.status")} *</label>
          <select id="f_status">${ASSET_STATUS.map((s) => `<option value="${s}" ${existing && existing.status === s ? "selected" : ""}>${L(STATUS_LABELS[s])}</option>`).join("")}</select>
        </div>
        <div class="field">
          <label>${t("common.condition")} *</label>
          <select id="f_condition">${CONDITIONS.map((c) => `<option value="${c}" ${existing && existing.condition === c ? "selected" : ""}>${L(CONDITION_LABELS[c])}</option>`).join("")}</select>
        </div>
      </div>
      <div class="field-row">
        <div class="field">
          <label>${STATE.lang === "vi" ? "Loại vị trí" : "Location Type"}</label>
          <select id="f_locType">
            <option value="warehouse" ${existing && existing.location && existing.location.type === "warehouse" ? "selected" : ""}>${t("common.warehouse")}</option>
            <option value="project" ${existing && existing.location && existing.location.type === "project" ? "selected" : ""}>${t("common.project")}</option>
          </select>
        </div>
        <div class="field">
          <label>${STATE.lang === "vi" ? "Tên kho/Dự án" : "Warehouse/Project Name"}</label>
          <input id="f_locName" value="${escapeHtml(existing && existing.location && existing.location.name || "")}">
        </div>
      </div>
      ${calibrationHtml}
      <div class="field">
        <label>${t("common.notes")}</label>
        <textarea id="f_notes" rows="2">${escapeHtml(existing && existing.notes || "")}</textarea>
      </div>
    `;

    openModal({
      title: isEdit ? `${t("common.edit")} - ${moduleTitle()}` : `${t("common.add")} - ${moduleTitle()}`,
      bodyHtml,
      size: "lg",
      footerHtml: `
        <button class="btn" id="formCancel">${t("common.cancel")}</button>
        <button class="btn btn-primary" id="formSave">${t("common.save")}</button>
      `
    });

    if (showSubCategory) {
      const populateSub = () => {
        const dept = document.getElementById("f_category").value;
        const subs = (EQUIPMENT_CATEGORIES[dept] && EQUIPMENT_CATEGORIES[dept].sub) || [];
        document.getElementById("f_subCategory").innerHTML = subs.map((s) =>
          `<option value="${s}" ${existing && existing.subCategory === s ? "selected" : ""}>${L(SUB_CATEGORY_LABELS[s])}</option>`
        ).join("");
      };
      document.getElementById("f_category").addEventListener("change", populateSub);
      populateSub();
    }

    document.getElementById("formCancel").onclick = closeModal;
    document.getElementById("formSave").onclick = () => saveAssetForm(existing, collectionRef, cacheKey);
  }

  async function saveAssetForm(existing, ref, cacheKeyName) {
    const name = document.getElementById("f_name").value.trim();
    if (!name) { showToast(t("common.requiredField"), "error"); return; }
    const country = document.getElementById("f_country").value;
    const typeCode = document.getElementById("f_typeCode").value;
    const category = document.getElementById("f_category").value;

    let department;
    if (fixedDepartment) department = fixedDepartment;
    else if (departmentSource === "manual") department = document.getElementById("f_department").value;
    else department = category; // departmentSource === "category": category IS the department (equipment)

    const data = {
      name,
      category,
      department,
      subCategory: showSubCategory ? document.getElementById("f_subCategory").value : null,
      country,
      typeCode,
      brand: document.getElementById("f_brand").value.trim(),
      model: document.getElementById("f_model").value.trim(),
      serialNumber: document.getElementById("f_serial").value.trim(),
      purchaseDate: document.getElementById("f_purchaseDate").value || null,
      purchasePrice: document.getElementById("f_price").value ? Number(document.getElementById("f_price").value) : null,
      status: document.getElementById("f_status").value,
      condition: document.getElementById("f_condition").value,
      location: {
        type: document.getElementById("f_locType").value,
        name: document.getElementById("f_locName").value.trim()
      },
      notes: document.getElementById("f_notes").value.trim(),
      updatedAt: nowTs()
    };

    let calDate = null, calExpiry = null, calCertNo = "";
    if (showCalibration) {
      calDate = document.getElementById("f_calDate").value || null;
      calExpiry = document.getElementById("f_calExpiry").value || null;
      calCertNo = document.getElementById("f_calCertNo").value.trim();
      data.lastCalibrationDate = calDate;
      data.calibrationExpiryDate = calExpiry;
      data.calibrationCertNo = calCertNo;
    }

    try {
      const docRef = existing ? ref.doc(existing.id) : ref.doc();
      let assetCode = existing ? existing.assetCode : null;
      if (existing) {
        await docRef.update(data);
      } else {
        assetCode = await generateAssetCode(typeCode, country);
        data.assetCode = assetCode;
        data.createdAt = nowTs();
        data.createdBy = uid();
        await docRef.set(data);
      }

      // Đồng bộ mục hiệu chuẩn (nếu có) vào calibrationRecords để Dashboard
      // tự lên cảnh báo sắp hết hạn — dùng ID cố định "quick_<id thiết bị>"
      // nên mỗi lần sửa sẽ cập nhật đè, không sinh trùng lặp lịch sử.
      if (showCalibration) {
        const quickRef = COLLECTIONS.calibrationRecords.doc(`quick_${docRef.id}`);
        if (calDate && calExpiry) {
          await quickRef.set({
            assetId: docRef.id,
            assetCodeSnapshot: assetCode,
            assetCountry: country,
            assetDepartment: department,
            calibrationDate: calDate,
            expiryDate: calExpiry,
            certificateNo: calCertNo,
            standardUsed: "",
            result: "",
            isQuickEntry: true,
            updatedAt: nowTs()
          }, { merge: true });
        } else {
          await quickRef.delete().catch(() => {});
        }
      }

      closeModal();
      showToast(t("toast.saved"), "success");
    } catch (err) {
      showErrorToast(err);
    }
  }
}

function toDateInputValue(val) {
  if (!val) return "";
  if (typeof val === "string") return val;
  const d = val.toDate ? val.toDate() : new Date(val);
  if (isNaN(d.getTime())) return "";
  return d.toISOString().substring(0, 10);
}

// ---- Instantiate the three asset-like modules ----

makeAssetModule({
  pageId: "fixedAssets",
  cacheKey: "fixedAssets",
  collectionRef: COLLECTIONS.fixedAssets,
  titleVi: "Tài sản cố định",
  titleEn: "Fixed Assets",
  categoryOptions: [
    { value: "vehicle", labelVi: "Xe / Phương tiện", labelEn: "Vehicle" },
    { value: "machinery", labelVi: "Máy móc lớn", labelEn: "Heavy Machinery" },
    { value: "building", labelVi: "Nhà / Công trình", labelEn: "Building / Structure" },
    { value: "furniture", labelVi: "Nội thất giá trị lớn", labelEn: "Furniture (capitalized)" },
    { value: "other", labelVi: "Khác", labelEn: "Other" }
  ],
  defaultTypeCode: "FA",
  typeCodeChoices: ["FA"],
  departmentSource: "manual",
  showCalibration: true
});

makeAssetModule({
  pageId: "equipment",
  cacheKey: "equipment",
  collectionRef: COLLECTIONS.equipment,
  titleVi: "Thiết bị (Lab / Kỹ thuật / Văn phòng)",
  titleEn: "Equipment (Lab / Technical / Office)",
  categoryOptions: [
    { value: "laboratory", labelVi: "Phòng Lab", labelEn: "Laboratory" },
    { value: "technical", labelVi: "Kỹ thuật", labelEn: "Technical Department" },
    { value: "office", labelVi: "Văn phòng", labelEn: "Office" }
  ],
  defaultTypeCode: "LAB",
  typeCodeChoices: ["LAB", "TECH", "DR", "OFF", "SP", "CON"],
  showSubCategory: true,
  departmentSource: "category",
  showCalibration: true
});

makeAssetModule({
  pageId: "calibration",
  cacheKey: "calibrationStandards",
  collectionRef: COLLECTIONS.calibrationStandards,
  titleVi: "Thiết bị / Chuẩn hiệu chuẩn",
  titleEn: "Calibration Standards & Equipment",
  categoryOptions: [
    { value: "calibration", labelVi: "Hiệu chuẩn", labelEn: "Calibration" }
  ],
  defaultTypeCode: "CAL",
  typeCodeChoices: ["CAL"],
  showSubCategory: true,
  fixedDepartment: "calibration",
  showCalibration: true
});

// =====================================================================
// MODULE: CALIBRATION RECORDS (history + expiry, attached to calibration page)
// =====================================================================

(function extendCalibrationPage() {
  const baseRender = PAGE_RENDERERS.calibration;
  PAGE_RENDERERS.calibration = function () {
    baseRender();
    const panel = document.createElement("div");
    panel.className = "panel";
    panel.innerHTML = `
      <div class="panel-header">
        <h3>${STATE.lang === "vi" ? "Lịch sử hiệu chuẩn" : "Calibration Records"}</h3>
        <div class="spacer"></div>
        <button class="btn btn-primary btn-sm" id="btnAddCalRecord">+ ${t("common.add")}</button>
      </div>
      <div class="panel-body" id="calRecordsBody"></div>
    `;
    document.getElementById("pageContent").appendChild(panel);
    document.getElementById("btnAddCalRecord").onclick = () => openCalibrationRecordForm(null);
    renderCalibrationRecordsTable();
  };
})();

function getCalibratableAssets() {
  return getAllTrackedAssets().map((a) => ({ id: a.id, assetCode: a.assetCode, name: a.name, country: a.country, department: a.department }));
}

function renderCalibrationRecordsTable() {
  const records = filterByScope(STATE.cache.calibrationRecords)
    .filter((r) =>
      (!STATE.filters.country || r.assetCountry === STATE.filters.country) &&
      (!STATE.filters.department || r.assetDepartment === STATE.filters.department)
    )
    .sort((a, b) => (daysUntil(a.expiryDate) || 0) - (daysUntil(b.expiryDate) || 0));
  const body = document.getElementById("calRecordsBody");
  if (!body) return;
  if (records.length === 0) {
    body.innerHTML = `<div class="empty-state">${t("common.noData")}</div>`;
    return;
  }
  const rows = records.map((r) => {
    const d = daysUntil(r.expiryDate);
    let statusBadge;
    if (d === null) statusBadge = `<span class="badge badge-gray">-</span>`;
    else if (d < 0) statusBadge = `<span class="badge badge-red">${STATE.lang === "vi" ? "Quá hạn" : "Overdue"}</span>`;
    else if (d <= CALIBRATION_EXPIRY_WARNING_DAYS) statusBadge = `<span class="badge badge-orange">${d} ${STATE.lang === "vi" ? "ngày" : "days"}</span>`;
    else statusBadge = `<span class="badge badge-green">OK</span>`;
    return `<tr>
      <td>${escapeHtml(r.assetCodeSnapshot || "-")}</td>
      <td>${fmtDate(r.calibrationDate)}</td>
      <td>${fmtDate(r.expiryDate)}</td>
      <td>${escapeHtml(r.certificateNo || "-")}</td>
      <td>${escapeHtml(r.standardUsed || "-")}</td>
      <td>${escapeHtml(r.result || "-")}</td>
      <td>${statusBadge}</td>
      <td class="row-actions">
        <button class="btn btn-sm" data-act="editcal" data-id="${r.id}">${t("common.edit")}</button>
        ${isAdminLevel() ? `<button class="btn btn-sm btn-danger" data-act="delcal" data-id="${r.id}">${t("common.delete")}</button>` : ""}
      </td>
    </tr>`;
  }).join("");
  body.innerHTML = `<div class="table-wrap"><table class="data-table">
    <thead><tr>
      <th>${t("common.code")}</th>
      <th>${STATE.lang === "vi" ? "Ngày hiệu chuẩn" : "Calibration Date"}</th>
      <th>${STATE.lang === "vi" ? "Hết hạn" : "Expiry"}</th>
      <th>${STATE.lang === "vi" ? "Số chứng chỉ" : "Certificate"}</th>
      <th>${STATE.lang === "vi" ? "Chuẩn dùng" : "Standard Used"}</th>
      <th>${STATE.lang === "vi" ? "Kết quả" : "Result"}</th>
      <th>${t("common.status")}</th>
      <th>${t("common.actions")}</th>
    </tr></thead><tbody>${rows}</tbody></table></div>`;

  document.querySelectorAll('[data-act="editcal"]').forEach((b) => {
    b.onclick = () => openCalibrationRecordForm(records.find((r) => r.id === b.dataset.id));
  });
  document.querySelectorAll('[data-act="delcal"]').forEach((b) => {
    b.onclick = () => confirmDialog(STATE.lang === "vi" ? "Xóa bản ghi này?" : "Delete this record?", async () => {
      await COLLECTIONS.calibrationRecords.doc(b.dataset.id).delete();
      showToast(t("toast.deleted"), "success");
    });
  });
}

function openCalibrationRecordForm(existing) {
  const assets = getCalibratableAssets();
  const optionsHtml = assets.map((a) => `<option value="${a.id}" data-code="${escapeHtml(a.assetCode || "")}" data-country="${escapeHtml(a.country || "")}" data-dept="${escapeHtml(a.department || "")}" ${existing && existing.assetId === a.id ? "selected" : ""}>${escapeHtml(a.assetCode || "")} - ${escapeHtml(a.name || "")}</option>`).join("");
  const bodyHtml = `
    <div class="field">
      <label>${STATE.lang === "vi" ? "Thiết bị" : "Equipment"} *</label>
      <select id="cr_asset">${optionsHtml}</select>
    </div>
    <div class="field-row">
      <div class="field"><label>${STATE.lang === "vi" ? "Ngày hiệu chuẩn" : "Calibration Date"} *</label><input type="date" id="cr_calDate" value="${existing ? toDateInputValue(existing.calibrationDate) : ""}"></div>
      <div class="field"><label>${STATE.lang === "vi" ? "Ngày hết hạn" : "Expiry Date"} *</label><input type="date" id="cr_expDate" value="${existing ? toDateInputValue(existing.expiryDate) : ""}"></div>
    </div>
    <div class="field-row">
      <div class="field"><label>${STATE.lang === "vi" ? "Số chứng chỉ" : "Certificate No."}</label><input id="cr_cert" value="${escapeHtml(existing && existing.certificateNo || "")}"></div>
      <div class="field"><label>${STATE.lang === "vi" ? "Chuẩn sử dụng" : "Standard Used"}</label><input id="cr_standard" value="${escapeHtml(existing && existing.standardUsed || "")}"></div>
    </div>
    <div class="field"><label>${STATE.lang === "vi" ? "Kết quả" : "Result"}</label><input id="cr_result" value="${escapeHtml(existing && existing.result || "")}"></div>
  `;
  openModal({
    title: existing ? t("common.edit") : t("common.add"),
    bodyHtml,
    footerHtml: `<button class="btn" id="crCancel">${t("common.cancel")}</button><button class="btn btn-primary" id="crSave">${t("common.save")}</button>`
  });
  document.getElementById("crCancel").onclick = closeModal;
  document.getElementById("crSave").onclick = async () => {
    const sel = document.getElementById("cr_asset");
    const assetId = sel.value;
    const assetCode = sel.selectedOptions[0] ? sel.selectedOptions[0].dataset.code : "";
    const calDate = document.getElementById("cr_calDate").value;
    const expDate = document.getElementById("cr_expDate").value;
    if (!assetId || !calDate || !expDate) { showToast(t("common.requiredField"), "error"); return; }
    const data = {
      assetId,
      assetCodeSnapshot: assetCode,
      assetCountry: sel.selectedOptions[0] ? sel.selectedOptions[0].dataset.country : "",
      assetDepartment: sel.selectedOptions[0] ? sel.selectedOptions[0].dataset.dept : "",
      calibrationDate: calDate,
      expiryDate: expDate,
      certificateNo: document.getElementById("cr_cert").value.trim(),
      standardUsed: document.getElementById("cr_standard").value.trim(),
      result: document.getElementById("cr_result").value.trim(),
      updatedAt: nowTs()
    };
    try {
      if (existing) await COLLECTIONS.calibrationRecords.doc(existing.id).update(data);
      else { data.createdAt = nowTs(); data.createdBy = uid(); await COLLECTIONS.calibrationRecords.add(data); }
      closeModal();
      showToast(t("toast.saved"), "success");
    } catch (err) { showErrorToast(err); }
  };
}

// =====================================================================
// MODULE: CONSUMABLE INVENTORY (quantity-based: drill bits, spare parts...)
// =====================================================================

const INVENTORY_CATEGORIES = [
  { value: "rock_core_bit", labelVi: "Mũi khoan lấy mẫu đá", labelEn: "Rock Core Bit" },
  { value: "soil_bit", labelVi: "Mũi khoan đất", labelEn: "Soil Bit" },
  { value: "spare_part", labelVi: "Phụ tùng thay thế", labelEn: "Spare Part" },
  { value: "lab_consumable", labelVi: "Vật tư phòng Lab", labelEn: "Lab Consumable" },
  { value: "chemical", labelVi: "Hóa chất", labelEn: "Chemical" },
  { value: "sample_container", labelVi: "Hộp/Túi đựng mẫu", labelEn: "Sample Container" },
  { value: "other", labelVi: "Khác", labelEn: "Other" }
];
const UNIT_OPTIONS = ["pcs", "set", "box", "kg", "liter", "m", "roll"];

PAGE_RENDERERS.inventory = function renderInventory() {
  document.getElementById("topbarActions").innerHTML = `
    <button class="btn" id="btnIssueReturn">${STATE.lang === "vi" ? "Xuất/Nhập kho" : "Issue / Return"}</button>
    <button class="btn btn-primary" id="btnAddInv">+ ${t("common.add")}</button>
  `;
  document.getElementById("btnAddInv").onclick = () => openInventoryForm(null);
  document.getElementById("btnIssueReturn").onclick = () => openInventoryTransactionForm();

  const items = filterByScope(STATE.cache.inventory);
  const rows = items.map((i) => {
    const low = Number(i.warehouseStock || 0) <= Number(i.minimumStock || 0);
    return `<tr>
      <td>${escapeHtml(i.itemCode || "-")}</td>
      <td>${escapeHtml(i.name || "-")}</td>
      <td>${escapeHtml(invCategoryLabel(i.category))}</td>
      <td>${escapeHtml(i.size || "-")}</td>
      <td class="num">${i.warehouseStock || 0} ${escapeHtml(i.unit || "")}</td>
      <td class="num">${siteStockTotal(i)} ${escapeHtml(i.unit || "")}</td>
      <td class="num">${i.minimumStock || 0}</td>
      <td>${low ? `<span class="badge badge-red">${STATE.lang === "vi" ? "Sắp hết" : "Low Stock"}</span>` : `<span class="badge badge-green">OK</span>`}</td>
      <td class="row-actions">
        <button class="btn btn-sm" data-act="editinv" data-id="${i.id}">${t("common.edit")}</button>
        ${isAdminLevel() ? `<button class="btn btn-sm btn-danger" data-act="delinv" data-id="${i.id}">${t("common.delete")}</button>` : ""}
      </td>
    </tr>`;
  }).join("");

  document.getElementById("pageContent").innerHTML = `
    <div class="panel">
      <div class="panel-header">
        <h3>${t("nav.inventory")}</h3>
        <div class="spacer"></div>
        <button class="btn btn-sm" id="btnXlsxInv">${t("common.exportExcel")}</button>
      </div>
      <div class="panel-body">
        ${items.length === 0 ? `<div class="empty-state">${t("common.noData")}</div>` : `
        <div class="table-wrap"><table class="data-table">
          <thead><tr>
            <th>${t("common.code")}</th><th>${t("common.name")}</th><th>${t("common.category")}</th><th>${STATE.lang === "vi" ? "Kích cỡ" : "Size"}</th>
            <th>${STATE.lang === "vi" ? "Tồn kho chính" : "Warehouse Stock"}</th><th>${STATE.lang === "vi" ? "Tồn tại công trình" : "Site Stock"}</th>
            <th>${STATE.lang === "vi" ? "Tối thiểu" : "Min."}</th><th>${t("common.status")}</th><th>${t("common.actions")}</th>
          </tr></thead><tbody>${rows}</tbody></table></div>`}
      </div>
    </div>
    <div class="panel">
      <div class="panel-header"><h3>${STATE.lang === "vi" ? "Lịch sử xuất/nhập" : "Transaction History"}</h3></div>
      <div class="panel-body" id="invTxBody">${renderInventoryTransactionsTable()}</div>
    </div>
  `;

  document.getElementById("btnXlsxInv").onclick = () => exportInventoryExcel(items);
  document.querySelectorAll('[data-act="editinv"]').forEach((b) => b.onclick = () => openInventoryForm(items.find((i) => i.id === b.dataset.id)));
  document.querySelectorAll('[data-act="delinv"]').forEach((b) => b.onclick = () => confirmDialog(
    STATE.lang === "vi" ? "Xóa vật tư này?" : "Delete this item?",
    async () => { await COLLECTIONS.inventory.doc(b.dataset.id).delete(); showToast(t("toast.deleted"), "success"); }
  ));
};

function invCategoryLabel(value) {
  const c = INVENTORY_CATEGORIES.find((c) => c.value === value);
  return c ? (STATE.lang === "vi" ? c.labelVi : c.labelEn) : value || "-";
}

function siteStockTotal(item) {
  if (!item.siteStock) return 0;
  return Object.values(item.siteStock).reduce((sum, v) => sum + Number(v || 0), 0);
}

function openInventoryForm(existing) {
  const bodyHtml = `
    <div class="field-row">
      <div class="field"><label>${STATE.lang === "vi" ? "Mã vật tư" : "Item Code"} *</label><input id="iv_code" value="${escapeHtml(existing && existing.itemCode || "")}" placeholder="VD: RB-110"></div>
      <div class="field"><label>${t("common.name")} *</label><input id="iv_name" value="${escapeHtml(existing && existing.name || "")}"></div>
    </div>
    <div class="field-row">
      <div class="field"><label>${t("common.category")} *</label>
        <select id="iv_category">${INVENTORY_CATEGORIES.map((c) => `<option value="${c.value}" ${existing && existing.category === c.value ? "selected" : ""}>${STATE.lang === "vi" ? c.labelVi : c.labelEn}</option>`).join("")}</select>
      </div>
      <div class="field"><label>${STATE.lang === "vi" ? "Kích cỡ" : "Size"}</label><input id="iv_size" value="${escapeHtml(existing && existing.size || "")}" placeholder="91mm / 110mm / 130mm"></div>
      <div class="field"><label>${STATE.lang === "vi" ? "Đơn vị" : "Unit"}</label>
        <select id="iv_unit">${UNIT_OPTIONS.map((u) => `<option value="${u}" ${existing && existing.unit === u ? "selected" : ""}>${u}</option>`).join("")}</select>
      </div>
    </div>
    <div class="field-row">
      <div class="field"><label>${STATE.lang === "vi" ? "Tồn kho chính (kho HQ)" : "Warehouse Stock"}</label><input type="number" id="iv_wh" value="${existing && existing.warehouseStock != null ? existing.warehouseStock : 0}"></div>
      <div class="field"><label>${STATE.lang === "vi" ? "Mức tồn tối thiểu" : "Minimum Stock"}</label><input type="number" id="iv_min" value="${existing && existing.minimumStock != null ? existing.minimumStock : 0}"></div>
    </div>
    <div class="field-hint">${STATE.lang === "vi"
      ? "Tồn tại từng công trình được cập nhật qua màn hình Xuất/Nhập kho."
      : "Site-level stock is updated via the Issue/Return screen."}</div>
  `;
  openModal({
    title: existing ? t("common.edit") : t("common.add"),
    bodyHtml,
    footerHtml: `<button class="btn" id="ivCancel">${t("common.cancel")}</button><button class="btn btn-primary" id="ivSave">${t("common.save")}</button>`
  });
  document.getElementById("ivCancel").onclick = closeModal;
  document.getElementById("ivSave").onclick = async () => {
    const itemCode = document.getElementById("iv_code").value.trim();
    const name = document.getElementById("iv_name").value.trim();
    if (!itemCode || !name) { showToast(t("common.requiredField"), "error"); return; }
    const data = {
      itemCode, name,
      category: document.getElementById("iv_category").value,
      size: document.getElementById("iv_size").value.trim(),
      unit: document.getElementById("iv_unit").value,
      warehouseStock: Number(document.getElementById("iv_wh").value || 0),
      minimumStock: Number(document.getElementById("iv_min").value || 0),
      updatedAt: nowTs()
    };
    try {
      if (existing) {
        data.siteStock = existing.siteStock || {};
        await COLLECTIONS.inventory.doc(existing.id).update(data);
      } else {
        data.siteStock = {};
        data.createdAt = nowTs();
        await COLLECTIONS.inventory.add(data);
      }
      closeModal();
      showToast(t("toast.saved"), "success");
    } catch (err) { showErrorToast(err); }
  };
}

// ---- Issue / Return / Transfer transactions ----

function renderInventoryTransactionsTable() {
  const txs = filterByScope(STATE.cache.inventoryTransactions).slice().sort((a, b) => (b.date || "").localeCompare(a.date || "")).slice(0, 50);
  if (txs.length === 0) return `<div class="empty-state">${t("common.noData")}</div>`;
  const rows = txs.map((tx) => `<tr>
    <td>${fmtDate(tx.date)}</td>
    <td>${badge({ issue: { vi: "Xuất", en: "Issue", color: "orange" }, return: { vi: "Nhập trả", en: "Return", color: "green" }, transfer: { vi: "Chuyển", en: "Transfer", color: "blue" }, purchase: { vi: "Nhập mua", en: "Purchase In", color: "blue" } }, tx.type)}</td>
    <td>${escapeHtml(tx.itemName || tx.itemId || "-")}</td>
    <td class="num">${tx.quantity || 0}</td>
    <td>${escapeHtml(tx.from || "-")}</td>
    <td>${escapeHtml(tx.to || "-")}</td>
    <td>${escapeHtml(tx.responsiblePersonName || "-")}</td>
  </tr>`).join("");
  return `<div class="table-wrap"><table class="data-table">
    <thead><tr><th>${t("common.date")}</th><th>${STATE.lang === "vi" ? "Loại" : "Type"}</th><th>${STATE.lang === "vi" ? "Vật tư" : "Item"}</th>
    <th>${t("common.quantity")}</th><th>${STATE.lang === "vi" ? "Từ" : "From"}</th><th>${STATE.lang === "vi" ? "Đến" : "To"}</th><th>${STATE.lang === "vi" ? "Người chịu trách nhiệm" : "Responsible"}</th></tr></thead>
    <tbody>${rows}</tbody></table></div>`;
}

function openInventoryTransactionForm() {
  const items = STATE.cache.inventory;
  const itemOptions = items.map((i) => `<option value="${i.id}" data-name="${escapeHtml(i.name)}" data-wh="${i.warehouseStock || 0}">${escapeHtml(i.itemCode)} - ${escapeHtml(i.name)} (${i.warehouseStock || 0} ${escapeHtml(i.unit || "")} ${STATE.lang === "vi" ? "tại kho" : "in warehouse"})</option>`).join("");
  const bodyHtml = `
    <div class="field">
      <label>${STATE.lang === "vi" ? "Loại giao dịch" : "Transaction Type"} *</label>
      <select id="tx_type">
        <option value="issue">${STATE.lang === "vi" ? "Xuất kho → Công trình" : "Issue: Warehouse → Project"}</option>
        <option value="return">${STATE.lang === "vi" ? "Nhập trả: Công trình → Kho" : "Return: Project → Warehouse"}</option>
        <option value="purchase">${STATE.lang === "vi" ? "Nhập mua mới" : "Purchase In"}</option>
      </select>
    </div>
    <div class="field">
      <label>${STATE.lang === "vi" ? "Vật tư" : "Item"} *</label>
      <select id="tx_item">${itemOptions}</select>
    </div>
    <div class="field-row">
      <div class="field"><label>${t("common.quantity")} *</label><input type="number" id="tx_qty" min="1" value="1"></div>
      <div class="field"><label>${t("common.date")} *</label><input type="date" id="tx_date" value="${new Date().toISOString().substring(0, 10)}"></div>
    </div>
    <div class="field" id="tx_projectField">
      <label>${t("common.project")}</label>
      <input id="tx_project" placeholder="${STATE.lang === "vi" ? "VD: PAS-5" : "e.g. PAS-5"}">
    </div>
    <div class="field">
      <label>${STATE.lang === "vi" ? "Người chịu trách nhiệm" : "Responsible Person"}</label>
      <input id="tx_person" value="${escapeHtml(STATE.profile.name || "")}">
    </div>
  `;
  openModal({
    title: STATE.lang === "vi" ? "Xuất/Nhập kho" : "Issue / Return",
    bodyHtml,
    footerHtml: `<button class="btn" id="txCancel">${t("common.cancel")}</button><button class="btn btn-primary" id="txSave">${t("common.save")}</button>`
  });
  document.getElementById("txCancel").onclick = closeModal;
  document.getElementById("txSave").onclick = async () => {
    const type = document.getElementById("tx_type").value;
    const itemSel = document.getElementById("tx_item");
    const itemId = itemSel.value;
    const qty = Number(document.getElementById("tx_qty").value || 0);
    const project = document.getElementById("tx_project").value.trim();
    if (!itemId || qty <= 0) { showToast(t("common.requiredField"), "error"); return; }
    const itemRef = COLLECTIONS.inventory.doc(itemId);
    try {
      await db.runTransaction(async (txn) => {
        const snap = await txn.get(itemRef);
        if (!snap.exists) throw new Error("Item not found");
        const item = snap.data();
        const siteStock = item.siteStock || {};
        let warehouseStock = Number(item.warehouseStock || 0);
        if (type === "issue") {
          if (warehouseStock < qty) throw new Error(STATE.lang === "vi" ? "Không đủ tồn kho" : "Insufficient warehouse stock");
          warehouseStock -= qty;
          siteStock[project] = Number(siteStock[project] || 0) + qty;
        } else if (type === "return") {
          const current = Number(siteStock[project] || 0);
          if (current < qty) throw new Error(STATE.lang === "vi" ? "Tồn tại công trình không đủ" : "Insufficient site stock");
          siteStock[project] = current - qty;
          warehouseStock += qty;
        } else if (type === "purchase") {
          warehouseStock += qty;
        }
        txn.update(itemRef, { warehouseStock, siteStock, updatedAt: nowTs() });
        txn.set(COLLECTIONS.inventoryTransactions.doc(), {
          type, itemId, itemName: item.name,
          quantity: qty,
          from: type === "issue" ? "warehouse" : (type === "return" ? project : "supplier"),
          to: type === "issue" ? project : (type === "return" ? "warehouse" : "warehouse"),
          date: document.getElementById("tx_date").value,
          responsiblePersonName: document.getElementById("tx_person").value.trim(),
          createdBy: uid(),
          createdAt: nowTs()
        });
      });
      closeModal();
      showToast(t("toast.saved"), "success");
    } catch (err) {
      console.error(err);
      showToast(err.message || t("toast.error"), "error");
    }
  };
}

// =====================================================================
// MODULE: FIELD EQUIPMENT MOVEMENT (Borrow / Issue / Return)
// =====================================================================

function getAllTrackedAssets() {
  return [...STATE.cache.fixedAssets, ...STATE.cache.equipment, ...STATE.cache.calibrationStandards];
}

PAGE_RENDERERS.movements = function renderMovements() {
  document.getElementById("topbarActions").innerHTML = `
    <button class="btn btn-primary" id="btnNewMovement">+ ${STATE.lang === "vi" ? "Tạo yêu cầu" : "New Request"}</button>
  `;
  document.getElementById("btnNewMovement").onclick = () => openMovementForm();

  const items = filterByScope(STATE.cache.movements).slice().sort((a, b) => (b.dateOut || "").localeCompare(a.dateOut || ""));
  const rows = items.map((m) => `<tr>
    <td>${escapeHtml(m.project || "-")}</td>
    <td>${escapeHtml(m.siteLocation || "-")}</td>
    <td>${fmtDate(m.dateOut)}</td>
    <td>${fmtDate(m.expectedReturnDate)}</td>
    <td>${(m.equipmentList || []).length} ${STATE.lang === "vi" ? "thiết bị" : "item(s)"}</td>
    <td>${escapeHtml(m.employeeName || "-")}</td>
    <td>${badge(MOVEMENT_STATUS_LABELS, m.status)}</td>
    <td class="row-actions">
      <button class="btn btn-sm" data-act="viewmv" data-id="${m.id}">${STATE.lang === "vi" ? "Xem" : "View"}</button>
    </td>
  </tr>`).join("");

  document.getElementById("pageContent").innerHTML = `
    <div class="panel">
      <div class="panel-header"><h3>${t("nav.movements")}</h3></div>
      <div class="panel-body">
        ${items.length === 0 ? `<div class="empty-state">${t("common.noData")}</div>` : `
        <div class="table-wrap"><table class="data-table">
          <thead><tr><th>${t("common.project")}</th><th>${STATE.lang === "vi" ? "Địa điểm" : "Site"}</th>
          <th>${STATE.lang === "vi" ? "Ngày đi" : "Date Out"}</th><th>${STATE.lang === "vi" ? "Dự kiến trả" : "Expected Return"}</th>
          <th>${STATE.lang === "vi" ? "Số lượng" : "Items"}</th><th>${STATE.lang === "vi" ? "Người yêu cầu" : "Requested By"}</th>
          <th>${t("common.status")}</th><th>${t("common.actions")}</th></tr></thead>
          <tbody>${rows}</tbody></table></div>`}
      </div>
    </div>
  `;
  document.querySelectorAll('[data-act="viewmv"]').forEach((b) => b.onclick = () => openMovementDetail(items.find((m) => m.id === b.dataset.id)));
};

function openMovementForm() {
  const assets = getAllTrackedAssets().filter((a) => a.status === "available");
  const assetOptionsHtml = assets.map((a) => `<option value="${a.id}" data-code="${escapeHtml(a.assetCode)}" data-name="${escapeHtml(a.name)}">${escapeHtml(a.assetCode)} - ${escapeHtml(a.name)}</option>`).join("");
  const bodyHtml = `
    <div class="field-row">
      <div class="field"><label>${t("common.project")} *</label><input id="mv_project"></div>
      <div class="field"><label>${STATE.lang === "vi" ? "Địa điểm hiện trường" : "Site Location"} *</label><input id="mv_site"></div>
    </div>
    <div class="field-row">
      <div class="field"><label>${STATE.lang === "vi" ? "Ngày đi" : "Date Out"} *</label><input type="date" id="mv_dateOut" value="${new Date().toISOString().substring(0, 10)}"></div>
      <div class="field"><label>${STATE.lang === "vi" ? "Dự kiến ngày trả" : "Expected Return"} *</label><input type="date" id="mv_dateReturn"></div>
    </div>
    <div class="field">
      <label>${STATE.lang === "vi" ? "Thêm thiết bị" : "Add Equipment"}</label>
      <div style="display:flex;gap:8px;">
        <select id="mv_assetSel" style="flex:1;">${assetOptionsHtml}</select>
        <input type="number" id="mv_assetQty" value="1" min="1" style="width:80px;">
        <button class="btn btn-sm" id="mv_addItem">+ ${t("common.add")}</button>
      </div>
    </div>
    <div class="field">
      <table class="data-table" id="mv_itemsTable">
        <thead><tr><th>${t("common.code")}</th><th>${t("common.name")}</th><th>${t("common.quantity")}</th><th></th></tr></thead>
        <tbody></tbody>
      </table>
    </div>
  `;
  openModal({
    title: STATE.lang === "vi" ? "Tạo yêu cầu mượn thiết bị" : "New Equipment Movement Request",
    bodyHtml, size: "lg",
    footerHtml: `<button class="btn" id="mvCancel">${t("common.cancel")}</button><button class="btn btn-primary" id="mvSave">${t("common.save")}</button>`
  });

  const equipmentList = [];
  function renderItemsTable() {
    const tbody = document.querySelector("#mv_itemsTable tbody");
    tbody.innerHTML = equipmentList.map((it, idx) => `<tr>
      <td>${escapeHtml(it.assetCode)}</td><td>${escapeHtml(it.assetName)}</td><td>${it.quantity}</td>
      <td><button class="btn btn-sm" data-idx="${idx}" id="mv_rm_${idx}">✕</button></td>
    </tr>`).join("") || `<tr><td colspan="4" style="text-align:center;color:var(--text-muted);">${t("common.noData")}</td></tr>`;
    equipmentList.forEach((_, idx) => {
      const btn = document.getElementById(`mv_rm_${idx}`);
      if (btn) btn.onclick = () => { equipmentList.splice(idx, 1); renderItemsTable(); };
    });
  }
  renderItemsTable();

  document.getElementById("mv_addItem").onclick = () => {
    const sel = document.getElementById("mv_assetSel");
    if (!sel.value) return;
    const opt = sel.selectedOptions[0];
    equipmentList.push({
      assetId: sel.value,
      assetCode: opt.dataset.code,
      assetName: opt.dataset.name,
      quantity: Number(document.getElementById("mv_assetQty").value || 1)
    });
    renderItemsTable();
  };

  document.getElementById("mvCancel").onclick = closeModal;
  document.getElementById("mvSave").onclick = async () => {
    const project = document.getElementById("mv_project").value.trim();
    const site = document.getElementById("mv_site").value.trim();
    const dateOut = document.getElementById("mv_dateOut").value;
    const dateReturn = document.getElementById("mv_dateReturn").value;
    if (!project || !site || !dateOut || equipmentList.length === 0) { showToast(t("common.requiredField"), "error"); return; }
    try {
      await COLLECTIONS.movements.add({
        project, siteLocation: site, dateOut, expectedReturnDate: dateReturn,
        equipmentList,
        employeeId: uid(),
        employeeName: STATE.profile.name,
        status: "pending",
        createdAt: nowTs()
      });
      closeModal();
      showToast(t("toast.saved"), "success");
    } catch (err) { showErrorToast(err); }
  };
}

function findAssetRefById(id) {
  for (const [key, ref] of [["fixedAssets", COLLECTIONS.fixedAssets], ["equipment", COLLECTIONS.equipment], ["calibrationStandards", COLLECTIONS.calibrationStandards]]) {
    if ((STATE.cache[key] || []).some((a) => a.id === id)) return ref;
  }
  return null;
}

function openMovementDetail(m) {
  const canDecide = canApprove() && m.status === "pending";
  const canIssue = canApprove() && m.status === "approved";
  const canReturn = (canApprove() || m.employeeId === uid()) && m.status === "issued";

  const itemRows = (m.equipmentList || []).map((it) => `<tr><td>${escapeHtml(it.assetCode)}</td><td>${escapeHtml(it.assetName)}</td><td>${it.quantity}</td></tr>`).join("");
  const returnRows = (m.returnChecklist || []).map((rc) => `<tr><td>${escapeHtml(rc.assetCode)}</td><td>${badge(CONDITION_LABELS, rc.condition)}</td></tr>`).join("");

  const bodyHtml = `
    <div class="field-row">
      <div class="field"><label>${t("common.project")}</label><div>${escapeHtml(m.project)}</div></div>
      <div class="field"><label>${STATE.lang === "vi" ? "Địa điểm" : "Site"}</label><div>${escapeHtml(m.siteLocation)}</div></div>
    </div>
    <div class="field-row">
      <div class="field"><label>${STATE.lang === "vi" ? "Ngày đi" : "Date Out"}</label><div>${fmtDate(m.dateOut)}</div></div>
      <div class="field"><label>${STATE.lang === "vi" ? "Dự kiến trả" : "Expected Return"}</label><div>${fmtDate(m.expectedReturnDate)}</div></div>
    </div>
    <div class="field"><label>${t("common.status")}</label><div>${badge(MOVEMENT_STATUS_LABELS, m.status)}</div></div>
    <table class="data-table"><thead><tr><th>${t("common.code")}</th><th>${t("common.name")}</th><th>${t("common.quantity")}</th></tr></thead><tbody>${itemRows}</tbody></table>
    ${m.returnChecklist ? `<h4 style="margin-top:16px;">${STATE.lang === "vi" ? "Checklist trả" : "Return Checklist"}</h4>
      <table class="data-table"><thead><tr><th>${t("common.code")}</th><th>${t("common.condition")}</th></tr></thead><tbody>${returnRows}</tbody></table>` : ""}
  `;

  let footerHtml = `<button class="btn" id="mdClose">${t("common.close")}</button>`;
  if (canDecide) {
    footerHtml = `<button class="btn btn-danger" id="mdReject">${t("common.reject")}</button><button class="btn btn-primary" id="mdApprove">${t("common.approve")}</button>` + footerHtml;
  } else if (canIssue) {
    footerHtml = `<button class="btn btn-primary" id="mdIssue">${STATE.lang === "vi" ? "Xuất thiết bị" : "Issue Equipment"}</button>` + footerHtml;
  } else if (canReturn) {
    footerHtml = `<button class="btn btn-primary" id="mdReturn">${STATE.lang === "vi" ? "Trả thiết bị" : "Return Equipment"}</button>` + footerHtml;
  }

  openModal({ title: `${m.project} - ${m.siteLocation}`, bodyHtml, size: "lg", footerHtml });
  document.getElementById("mdClose").onclick = closeModal;

  const decide = async (newStatus) => {
    await COLLECTIONS.movements.doc(m.id).update({ status: newStatus, approvedBy: uid(), approvedAt: nowTs() });
    closeModal();
    showToast(newStatus === "approved" ? t("toast.approved") : t("toast.rejected"), "success");
  };
  if (document.getElementById("mdApprove")) document.getElementById("mdApprove").onclick = () => decide("approved");
  if (document.getElementById("mdReject")) document.getElementById("mdReject").onclick = () => decide("rejected");

  if (document.getElementById("mdIssue")) {
    document.getElementById("mdIssue").onclick = async () => {
      try {
        const batch = db.batch();
        for (const it of m.equipmentList || []) {
          const ref = findAssetRefById(it.assetId);
          if (ref) batch.update(ref.doc(it.assetId), { status: "borrowed", currentUser: m.employeeId, updatedAt: nowTs() });
        }
        batch.update(COLLECTIONS.movements.doc(m.id), { status: "issued", issuedAt: nowTs() });
        await batch.commit();
        closeModal();
        showToast(t("toast.saved"), "success");
      } catch (err) { showErrorToast(err); }
    };
  }

  if (document.getElementById("mdReturn")) {
    document.getElementById("mdReturn").onclick = () => openReturnChecklistForm(m);
  }
}

function openReturnChecklistForm(m) {
  const rows = (m.equipmentList || []).map((it, idx) => `
    <tr>
      <td>${escapeHtml(it.assetCode)}</td><td>${escapeHtml(it.assetName)}</td>
      <td><select id="rc_cond_${idx}">${CONDITIONS.map((c) => `<option value="${c}">${L(CONDITION_LABELS[c])}</option>`).join("")}</select></td>
    </tr>`).join("");
  openModal({
    title: STATE.lang === "vi" ? "Checklist trả thiết bị" : "Return Checklist",
    bodyHtml: `<table class="data-table"><thead><tr><th>${t("common.code")}</th><th>${t("common.name")}</th><th>${t("common.condition")}</th></tr></thead><tbody>${rows}</tbody></table>
      <div class="field-hint" style="margin-top:8px;">${STATE.lang === "vi" ? "Thiết bị hư hỏng sẽ tự động tạo phiếu sửa chữa." : "Damaged items automatically create a maintenance ticket."}</div>`,
    size: "lg",
    footerHtml: `<button class="btn" id="rcCancel">${t("common.cancel")}</button><button class="btn btn-primary" id="rcSave">${t("common.save")}</button>`
  });
  document.getElementById("rcCancel").onclick = closeModal;
  document.getElementById("rcSave").onclick = async () => {
    const checklist = (m.equipmentList || []).map((it, idx) => ({
      assetId: it.assetId, assetCode: it.assetCode,
      condition: document.getElementById(`rc_cond_${idx}`).value
    }));
    try {
      const batch = db.batch();
      for (const rc of checklist) {
        const ref = findAssetRefById(rc.assetId);
        if (!ref) continue;
        const newStatus = rc.condition === "damaged" ? "maintenance" : "available";
        batch.update(ref.doc(rc.assetId), { status: newStatus, condition: rc.condition, currentUser: null, updatedAt: nowTs() });
        if (rc.condition === "damaged") {
          batch.set(COLLECTIONS.maintenance.doc(), {
            assetId: rc.assetId, assetCodeSnapshot: rc.assetCode,
            problem: STATE.lang === "vi" ? "Hư hỏng phát hiện khi trả thiết bị" : "Damage found during equipment return",
            description: "",
            reportedBy: uid(), date: new Date().toISOString().substring(0, 10),
            status: "open", createdAt: nowTs()
          });
        }
      }
      batch.update(COLLECTIONS.movements.doc(m.id), { status: "returned", returnChecklist: checklist, returnedAt: nowTs() });
      await batch.commit();
      closeModal();
      showToast(t("toast.saved"), "success");
    } catch (err) { showErrorToast(err); }
  };
}

// =====================================================================
// MODULE: MAINTENANCE
// =====================================================================

PAGE_RENDERERS.maintenance = function renderMaintenance() {
  document.getElementById("topbarActions").innerHTML = `<button class="btn btn-primary" id="btnAddMt">+ ${t("common.add")}</button>`;
  document.getElementById("btnAddMt").onclick = () => openMaintenanceForm(null);

  const items = filterByScope(STATE.cache.maintenance).slice().sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  const rows = items.map((m) => `<tr>
    <td>${escapeHtml(m.assetCodeSnapshot || m.assetId || "-")}</td>
    <td>${escapeHtml(m.problem || "-")}</td>
    <td>${fmtDate(m.date)}</td>
    <td>${fmtMoney(m.repairCost)}</td>
    <td>${badge(MAINTENANCE_STATUS_LABELS, m.status)}</td>
    <td class="row-actions"><button class="btn btn-sm" data-act="editmt" data-id="${m.id}">${t("common.edit")}</button></td>
  </tr>`).join("");

  document.getElementById("pageContent").innerHTML = `
    <div class="panel">
      <div class="panel-header"><h3>${t("nav.maintenance")}</h3></div>
      <div class="panel-body">
        ${items.length === 0 ? `<div class="empty-state">${t("common.noData")}</div>` : `
        <div class="table-wrap"><table class="data-table">
          <thead><tr><th>${t("common.code")}</th><th>${STATE.lang === "vi" ? "Vấn đề" : "Problem"}</th><th>${t("common.date")}</th>
          <th>${STATE.lang === "vi" ? "Chi phí" : "Repair Cost"}</th><th>${t("common.status")}</th><th>${t("common.actions")}</th></tr></thead>
          <tbody>${rows}</tbody></table></div>`}
      </div>
    </div>
  `;
  document.querySelectorAll('[data-act="editmt"]').forEach((b) => b.onclick = () => openMaintenanceForm(items.find((m) => m.id === b.dataset.id)));
};

function openMaintenanceForm(existing) {
  const assets = getAllTrackedAssets();
  const assetOptions = assets.map((a) => `<option value="${a.id}" data-code="${escapeHtml(a.assetCode)}" ${existing && existing.assetId === a.id ? "selected" : ""}>${escapeHtml(a.assetCode)} - ${escapeHtml(a.name)}</option>`).join("");
  const bodyHtml = `
    <div class="field"><label>${STATE.lang === "vi" ? "Thiết bị" : "Equipment"} *</label><select id="mt_asset" ${existing ? "disabled" : ""}>${assetOptions}</select></div>
    <div class="field"><label>${STATE.lang === "vi" ? "Vấn đề" : "Problem"} *</label><input id="mt_problem" value="${escapeHtml(existing && existing.problem || "")}"></div>
    <div class="field"><label>${STATE.lang === "vi" ? "Mô tả chi tiết" : "Description"}</label><textarea id="mt_desc" rows="3">${escapeHtml(existing && existing.description || "")}</textarea></div>
    <div class="field-row">
      <div class="field"><label>${t("common.date")} *</label><input type="date" id="mt_date" value="${existing ? toDateInputValue(existing.date) : new Date().toISOString().substring(0, 10)}"></div>
      <div class="field"><label>${t("common.status")} *</label>
        <select id="mt_status">${Object.keys(MAINTENANCE_STATUS_LABELS).map((s) => `<option value="${s}" ${existing && existing.status === s ? "selected" : ""}>${L(MAINTENANCE_STATUS_LABELS[s])}</option>`).join("")}</select>
      </div>
      <div class="field"><label>${STATE.lang === "vi" ? "Chi phí sửa chữa" : "Repair Cost"}</label><input type="number" id="mt_cost" value="${existing && existing.repairCost || ""}"></div>
    </div>
  `;
  openModal({
    title: existing ? t("common.edit") : t("common.add"),
    bodyHtml,
    footerHtml: `<button class="btn" id="mtCancel">${t("common.cancel")}</button><button class="btn btn-primary" id="mtSave">${t("common.save")}</button>`
  });
  document.getElementById("mtCancel").onclick = closeModal;
  document.getElementById("mtSave").onclick = async () => {
    const problem = document.getElementById("mt_problem").value.trim();
    if (!problem) { showToast(t("common.requiredField"), "error"); return; }
    const status = document.getElementById("mt_status").value;
    const data = {
      problem,
      description: document.getElementById("mt_desc").value.trim(),
      date: document.getElementById("mt_date").value,
      status,
      repairCost: document.getElementById("mt_cost").value ? Number(document.getElementById("mt_cost").value) : null,
      updatedAt: nowTs()
    };
    try {
      if (existing) {
        await COLLECTIONS.maintenance.doc(existing.id).update(data);
        const ref = findAssetRefById(existing.assetId);
        if (ref) {
          if (status === "completed") await ref.doc(existing.assetId).update({ status: "available", updatedAt: nowTs() });
          else await ref.doc(existing.assetId).update({ status: "maintenance", updatedAt: nowTs() });
        }
      } else {
        const sel = document.getElementById("mt_asset");
        data.assetId = sel.value;
        data.assetCodeSnapshot = sel.selectedOptions[0] ? sel.selectedOptions[0].dataset.code : "";
        data.reportedBy = uid();
        data.createdAt = nowTs();
        await COLLECTIONS.maintenance.add(data);
        const ref = findAssetRefById(data.assetId);
        if (ref) await ref.doc(data.assetId).update({ status: "maintenance", updatedAt: nowTs() });
      }
      closeModal();
      showToast(t("toast.saved"), "success");
    } catch (err) { showErrorToast(err); }
  };
}

// =====================================================================
// MODULE: PURCHASE REQUEST (with stock-check warning)
// =====================================================================

PAGE_RENDERERS.purchase = function renderPurchase() {
  document.getElementById("topbarActions").innerHTML = `<button class="btn btn-primary" id="btnAddPr">+ ${t("common.add")}</button>`;
  document.getElementById("btnAddPr").onclick = () => openPurchaseForm();

  const items = filterByScope(STATE.cache.purchaseRequests).slice().sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  const rows = items.map((p) => `<tr>
    <td>${escapeHtml(p.itemName || "-")}</td>
    <td class="num">${p.quantity || 0}</td>
    <td class="num">${p.stockCheck ? p.stockCheck.total : "-"}</td>
    <td>${escapeHtml(p.requestedByName || "-")}</td>
    <td>${fmtDate(p.date)}</td>
    <td>${badge(PURCHASE_STATUS_LABELS, p.status)}</td>
    <td class="row-actions">
      ${canApprove() && p.status === "pending" ? `
        <button class="btn btn-sm" data-act="apprpr" data-id="${p.id}">${t("common.approve")}</button>
        <button class="btn btn-sm btn-danger" data-act="rejpr" data-id="${p.id}">${t("common.reject")}</button>` : ""}
    </td>
  </tr>`).join("");

  document.getElementById("pageContent").innerHTML = `
    <div class="panel">
      <div class="panel-header"><h3>${t("nav.purchase")}</h3></div>
      <div class="panel-body">
        ${items.length === 0 ? `<div class="empty-state">${t("common.noData")}</div>` : `
        <div class="table-wrap"><table class="data-table">
          <thead><tr><th>${STATE.lang === "vi" ? "Vật tư/Thiết bị" : "Item"}</th><th>${STATE.lang === "vi" ? "SL yêu cầu" : "Qty Requested"}</th>
          <th>${STATE.lang === "vi" ? "Tồn hiện có" : "Existing Stock"}</th><th>${STATE.lang === "vi" ? "Người yêu cầu" : "Requested By"}</th>
          <th>${t("common.date")}</th><th>${t("common.status")}</th><th>${t("common.actions")}</th></tr></thead>
          <tbody>${rows}</tbody></table></div>`}
      </div>
    </div>
  `;
  document.querySelectorAll('[data-act="apprpr"]').forEach((b) => b.onclick = () => updatePurchaseStatus(b.dataset.id, "approved"));
  document.querySelectorAll('[data-act="rejpr"]').forEach((b) => b.onclick = () => updatePurchaseStatus(b.dataset.id, "rejected"));
};

async function updatePurchaseStatus(id, status) {
  await COLLECTIONS.purchaseRequests.doc(id).update({ status, decidedBy: uid(), decidedAt: nowTs() });
  showToast(status === "approved" ? t("toast.approved") : t("toast.rejected"), "success");
}

function openPurchaseForm() {
  const invItems      = STATE.cache.inventory    || [];
  const equipItems    = STATE.cache.equipment    || [];
  const fixedItems    = STATE.cache.fixedAssets  || [];

  // Build unified source list for dropdown
  // Format: { id, name, source, warehouseStock, category }
  const allItems = [
    ...invItems.map(i => ({
      id:             i.id,
      name:           i.name,
      code:           i.itemCode || '',
      source:         'inventory',
      sourceLabel:    STATE.lang === 'vi' ? 'Vật tư tiêu hao' : 'Consumable',
      warehouseStock: i.warehouseStock || 0,
    })),
    ...equipItems.map(i => ({
      id:             i.id,
      name:           i.name,
      code:           i.assetCode || i.code || '',
      source:         'equipment',
      sourceLabel:    STATE.lang === 'vi' ? 'Thiết bị' : 'Equipment',
      warehouseStock: null, // equipment doesn't have stock qty
    })),
    ...fixedItems.map(i => ({
      id:             i.id,
      name:           i.name,
      code:           i.assetCode || i.code || '',
      source:         'fixedAssets',
      sourceLabel:    STATE.lang === 'vi' ? 'Tài sản cố định' : 'Fixed Asset',
      warehouseStock: null,
    })),
  ].sort((a, b) => a.name.localeCompare(b.name));

  // Group by source for optgroup
  const groups = [
    { key: 'inventory',   label: STATE.lang === 'vi' ? '📦 Vật tư tiêu hao'    : '📦 Consumables' },
    { key: 'equipment',   label: STATE.lang === 'vi' ? '🔧 Thiết bị'            : '🔧 Equipment' },
    { key: 'fixedAssets', label: STATE.lang === 'vi' ? '🏗️ Tài sản cố định'    : '🏗️ Fixed Assets' },
  ];

  const optionsHtml = groups.map(g => {
    const items = allItems.filter(i => i.source === g.key);
    if (!items.length) return '';
    return `<optgroup label="${g.label}">
      ${items.map(i => `<option value="${i.id}" data-source="${i.source}" data-stock="${i.warehouseStock ?? ''}" data-name="${escapeHtml(i.name)}">
        ${i.code ? escapeHtml(i.code) + ' - ' : ''}${escapeHtml(i.name)}
      </option>`).join('')}
    </optgroup>`;
  }).join('');

  const bodyHtml = `
    <div class="field">
      <label>${STATE.lang === "vi" ? "Chọn vật tư/thiết bị có sẵn (tùy chọn)" : "Pick existing item (optional)"}</label>
      <select id="pr_existing">
        <option value="">${STATE.lang === "vi" ? "-- Vật tư mới / khác --" : "-- New / other item --"}</option>
        ${optionsHtml}
      </select>
    </div>
    <div class="field"><label>${STATE.lang === "vi" ? "Tên vật tư/thiết bị" : "Item Name"} *</label><input id="pr_name"></div>
    <div class="field"><label>${t("common.quantity")} *</label><input type="number" id="pr_qty" min="1" value="1"></div>
    <div class="field"><label>${STATE.lang === "vi" ? "Lý do" : "Reason"}</label><textarea id="pr_reason" rows="2"></textarea></div>
    <div id="pr_stockWarning"></div>
  `;
  openModal({
    title: STATE.lang === "vi" ? "Đề nghị mua hàng" : "Purchase Request",
    bodyHtml,
    footerHtml: `<button class="btn" id="prCancel">${t("common.cancel")}</button><button class="btn btn-primary" id="prSave">${t("common.save")}</button>`
  });

  function checkStock() {
    const sel     = document.getElementById("pr_existing");
    const warnBox = document.getElementById("pr_stockWarning");
    if (!sel.value) { warnBox.innerHTML = ""; return; }

    // Get selected option data
    const opt    = sel.selectedOptions[0];
    const source = opt?.dataset.source || 'inventory';
    const name   = opt?.dataset.name   || '';

    // Auto-fill name
    document.getElementById("pr_name").value = name;

    if (source === 'inventory') {
      // Inventory: show warehouse + site stock
      const item = invItems.find((i) => i.id === sel.value);
      if (!item) { warnBox.innerHTML = ''; return; }
      const warehouse     = Number(item.warehouseStock || 0);
      const otherProjects = siteStockTotal(item);
      const total         = warehouse + otherProjects;
      warnBox.innerHTML = `<div class="field-hint" style="background:var(--warning-light);color:var(--warning);padding:8px 10px;border-radius:6px;">
        ${STATE.lang === "vi" ? "Tồn kho hiện có" : "Existing stock"}:
        ${STATE.lang === "vi" ? "Kho" : "Warehouse"} <b>${warehouse}</b> +
        ${STATE.lang === "vi" ? "công trình khác" : "other projects"} <b>${otherProjects}</b> =
        <b>${total}</b>.
        ${total > 0 ? (STATE.lang === "vi" ? " Có thể không cần mua thêm." : " Purchase may not be necessary.") : (STATE.lang === "vi" ? " Hết hàng." : " Out of stock.")}
      </div>`;
    } else if (source === 'equipment') {
      // Equipment: show item exists, suggest checking condition
      const item = equipItems.find((i) => i.id === sel.value);
      const status = item?.status || item?.condition || '';
      warnBox.innerHTML = `<div class="field-hint" style="background:#e8f0fc;color:#1558B0;padding:8px 10px;border-radius:6px;">
        🔧 ${STATE.lang === "vi" ? "Thiết bị đã có trong hệ thống" : "Equipment already in system"}.
        ${status ? `${STATE.lang === "vi" ? "Tình trạng" : "Status"}: <b>${status}</b>.` : ''}
        ${STATE.lang === "vi" ? "Vui lòng xác nhận cần mua thêm." : "Please confirm additional purchase is needed."}
      </div>`;
    } else if (source === 'fixedAssets') {
      // Fixed asset: show it exists
      const item = fixedItems.find((i) => i.id === sel.value);
      const status = item?.status || item?.condition || '';
      warnBox.innerHTML = `<div class="field-hint" style="background:#e8f0fc;color:#1558B0;padding:8px 10px;border-radius:6px;">
        🏗️ ${STATE.lang === "vi" ? "Tài sản cố định đã có trong hệ thống" : "Fixed asset already in system"}.
        ${status ? `${STATE.lang === "vi" ? "Tình trạng" : "Status"}: <b>${status}</b>.` : ''}
        ${STATE.lang === "vi" ? "Vui lòng xác nhận cần mua thêm hoặc thay thế." : "Please confirm if replacement or additional purchase is needed."}
      </div>`;
    }
  }
  document.getElementById("pr_existing").addEventListener("change", checkStock);

  document.getElementById("prCancel").onclick = closeModal;
  document.getElementById("prSave").onclick = async () => {
    const name = document.getElementById("pr_name").value.trim();
    const qty = Number(document.getElementById("pr_qty").value || 0);
    if (!name || qty <= 0) { showToast(t("common.requiredField"), "error"); return; }
    const sel = document.getElementById("pr_existing");
    let stockCheck = null;
    const opt = sel.selectedOptions[0];
    const source = opt?.dataset.source || 'inventory';
    if (sel.value && source === 'inventory') {
      const item = invItems.find((i) => i.id === sel.value);
      if (item) {
        const warehouse     = Number(item.warehouseStock || 0);
        const otherProjects = siteStockTotal(item);
        stockCheck = { warehouse, otherProjects, total: warehouse + otherProjects };
      }
    }
    try {
      await COLLECTIONS.purchaseRequests.add({
        itemId:     sel.value || null,
        itemSource: sel.value ? (sel.selectedOptions[0]?.dataset.source || 'inventory') : null,
        itemName:   name,
        quantity: qty,
        reason: document.getElementById("pr_reason").value.trim(),
        stockCheck,
        requestedBy: uid(),
        requestedByName: STATE.profile.name,
        department: myAllDepartments()[0] || null,
        status: "pending",
        date: new Date().toISOString().substring(0, 10),
        createdAt: nowTs()
      });
      closeModal();
      showToast(t("toast.saved"), "success");
    } catch (err) { showErrorToast(err); }
  };
}

// =====================================================================
// MODULE: USERS (role / department assignment)
// Reuses existing Firebase Auth users (HAI-CLOUD). Admin creates the
// Firestore profile + assigns role here using a secondary Firebase App
// instance so the admin's own session is not interrupted.
// =====================================================================

PAGE_RENDERERS.users = function renderUsers() {
  document.getElementById("topbarActions").innerHTML = `<button class="btn btn-primary" id="btnAddUser">+ ${t("common.add")}</button>`;
  document.getElementById("btnAddUser").onclick = () => openUserForm(null);

  const users = STATE.cache.users.slice().sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  const rows = users.map((u) => {
    const np = normalizeProfile(u);
    const roleBadges = [];
    if (np.globalRole) roleBadges.push(`<span class="badge badge-blue">${L(ROLE_LABELS[np.globalRole] || {})}</span>`);
    Object.keys(np.deptRoles || {}).forEach((d) => {
      const r = np.deptRoles[d];
      const isMgr = MANAGER_ROLES.includes(r);
      roleBadges.push(`<span class="badge ${isMgr ? "badge-orange" : "badge-gray"}">${L(ROLE_LABELS[r] || {})} · ${L(DEPARTMENTS[d] || {})}</span>`);
    });
    return `<tr>
      <td>${escapeHtml(u.name || "-")}</td>
      <td>${escapeHtml(u.email || "-")}</td>
      <td style="display:flex;flex-wrap:wrap;gap:4px;">${roleBadges.join("") || `<span class="badge badge-gray">${L(ROLE_LABELS.employee)}</span>`}</td>
      <td>${u.active === false ? `<span class="badge badge-gray">${STATE.lang === "vi" ? "Khóa" : "Disabled"}</span>` : `<span class="badge badge-green">${STATE.lang === "vi" ? "Hoạt động" : "Active"}</span>`}</td>
      <td class="row-actions">
        <button class="btn btn-sm" data-act="edituser" data-id="${u.id}">${t("common.edit")}</button>
      </td>
    </tr>`;
  }).join("");

  document.getElementById("pageContent").innerHTML = `
    <div class="panel">
      <div class="panel-header"><h3>${t("nav.users")}</h3></div>
      <div class="panel-body">
        <div class="table-wrap"><table class="data-table">
          <thead><tr><th>${t("common.name")}</th><th>Email</th><th>${STATE.lang === "vi" ? "Vai trò (có thể nhiều)" : "Roles (can be multiple)"}</th>
          <th>${t("common.status")}</th><th>${t("common.actions")}</th></tr></thead>
          <tbody>${rows}</tbody></table></div>
      </div>
    </div>
  `;
  document.querySelectorAll('[data-act="edituser"]').forEach((b) => b.onclick = () => openUserForm(users.find((u) => u.id === b.dataset.id)));
};

// Mỗi phòng ban có 1 vai trò "quản lý" riêng + luôn có thể chọn "Nhân viên"
const DEPT_MANAGER_ROLE = {
  laboratory: ROLES.LAB_MANAGER,
  technical: ROLES.TECH_MANAGER,
  calibration: ROLES.CAL_MANAGER,
  office: ROLES.OFFICE_ADMIN
};

function deptRoleSelectHtml(dept, currentRole) {
  const managerRole = DEPT_MANAGER_ROLE[dept];
  return `
    <select id="us_dept_${dept}">
      <option value="" ${!currentRole ? "selected" : ""}>${STATE.lang === "vi" ? "— Không tham gia —" : "— Not assigned —"}</option>
      <option value="${ROLES.EMPLOYEE}" ${currentRole === ROLES.EMPLOYEE ? "selected" : ""}>${L(ROLE_LABELS.employee)}</option>
      <option value="${managerRole}" ${currentRole === managerRole ? "selected" : ""}>${L(ROLE_LABELS[managerRole])}</option>
    </select>`;
}

function openUserForm(existing) {
  const deptRoles = (existing && existing.deptRoles) || (existing ? normalizeProfile(existing).deptRoles : {});
  const isExistingSuperAdmin = existing && (existing.globalRole === ROLES.SUPERADMIN || existing.role === ROLES.SUPERADMIN);
  const currentGlobalRole = existing ? (existing.globalRole || (existing.role === ROLES.ADMIN ? ROLES.ADMIN : null)) : null;

  const deptRowsHtml = Object.keys(DEPARTMENTS).map((d) => `
    <div class="field-row" style="align-items:center;">
      <div style="min-width:140px;font-weight:600;font-size:13px;">${L(DEPARTMENTS[d])}</div>
      <div class="field" style="flex:1;margin-bottom:0;">${deptRoleSelectHtml(d, deptRoles[d])}</div>
    </div>
  `).join("");

  const globalRoleHtml = `
    <div class="field">
      <label>${STATE.lang === "vi" ? "Quyền hệ thống (toàn quyền)" : "System-wide Role"}</label>
      <select id="us_globalRole" ${isExistingSuperAdmin ? "disabled" : ""}>
        <option value="" ${!currentGlobalRole ? "selected" : ""}>${STATE.lang === "vi" ? "— Không (chỉ theo phòng ban bên dưới) —" : "— None (department roles below only) —"}</option>
        <option value="admin" ${currentGlobalRole === "admin" ? "selected" : ""}>${L(ROLE_LABELS.admin)}</option>
        ${isExistingSuperAdmin ? `<option value="superadmin" selected>${L(ROLE_LABELS.superadmin)}</option>` : ""}
      </select>
      <div class="field-hint">${STATE.lang === "vi"
        ? "Admin/Superadmin thấy và quản lý TẤT CẢ phòng ban, không cần gán riêng từng phòng."
        : "Admin/Superadmin see and manage ALL departments, no need to assign departments below."}</div>
    </div>
  `;

  const deptSectionHtml = `
    <div class="field">
      <label>${STATE.lang === "vi" ? "Vai trò theo từng phòng ban (có thể chọn nhiều phòng)" : "Role per Department (can assign multiple)"}</label>
      ${deptRowsHtml}
    </div>
  `;

  const bodyHtml = existing ? `
    <div class="field"><label>${STATE.lang === "vi" ? "Họ tên" : "Name"}</label><input id="us_name" value="${escapeHtml(existing.name || "")}"></div>
    <div class="field"><label>Email</label><div>${escapeHtml(existing.email || "")}</div></div>
    ${globalRoleHtml}
    ${deptSectionHtml}
    <div class="field"><label><input type="checkbox" id="us_active" ${existing.active !== false ? "checked" : ""}> ${STATE.lang === "vi" ? "Hoạt động" : "Active"}</label></div>
  ` : `
    <div class="field-hint" style="margin-bottom:10px;">${STATE.lang === "vi"
      ? "Tạo tài khoản đăng nhập mới trong hệ thống HAI-CLOUD. Phiên đăng nhập của anh sẽ không bị ngắt."
      : "Create a new sign-in account in HAI-CLOUD. Your own session will not be interrupted."}</div>
    <div class="field"><label>Email *</label><input id="us_email" type="email"></div>
    <div class="field"><label>${STATE.lang === "vi" ? "Mật khẩu tạm" : "Temporary Password"} *</label><input id="us_password" type="text" placeholder="${STATE.lang === "vi" ? "ít nhất 6 ký tự" : "min 6 characters"}"></div>
    <div class="field"><label>${STATE.lang === "vi" ? "Họ tên" : "Name"} *</label><input id="us_name"></div>
    ${globalRoleHtml}
    ${deptSectionHtml}
    <div id="us_emailExistsRecovery"></div>
  `;

  openModal({
    title: existing ? t("common.edit") : (STATE.lang === "vi" ? "Tạo người dùng mới" : "Create New User"),
    bodyHtml,
    size: "lg",
    footerHtml: `<button class="btn" id="usCancel">${t("common.cancel")}</button><button class="btn btn-primary" id="usSave">${t("common.save")}</button>`
  });

  function readDeptRolesFromForm() {
    const result = {};
    Object.keys(DEPARTMENTS).forEach((d) => {
      const val = document.getElementById(`us_dept_${d}`).value;
      if (val) result[d] = val;
    });
    return result;
  }
  function computeManagedDepartments(deptRolesObj) {
    return Object.keys(deptRolesObj).filter((d) => MANAGER_ROLES.includes(deptRolesObj[d]));
  }

  document.getElementById("usCancel").onclick = closeModal;
  document.getElementById("usSave").onclick = async () => {
    const newDeptRoles = readDeptRolesFromForm();
    const managedDepartments = computeManagedDepartments(newDeptRoles);
    const globalRoleSel = document.getElementById("us_globalRole");
    const newGlobalRole = globalRoleSel.disabled ? (currentGlobalRole || ROLES.SUPERADMIN) : (globalRoleSel.value || null);

    if (existing) {
      try {
        await COLLECTIONS.users.doc(existing.id).update({
          name: document.getElementById("us_name").value.trim(),
          globalRole: newGlobalRole,
          deptRoles: newDeptRoles,
          managedDepartments,
          active: document.getElementById("us_active").checked,
          // dọn field cũ để tránh nhầm lẫn dữ liệu cũ/mới
          role: firebase.firestore.FieldValue.delete(),
          department: firebase.firestore.FieldValue.delete(),
          updatedAt: nowTs()
        });
        closeModal();
        showToast(t("toast.saved"), "success");
      } catch (err) { showErrorToast(err); }
    } else {
      const email = document.getElementById("us_email").value.trim();
      const password = document.getElementById("us_password").value;
      const name = document.getElementById("us_name").value.trim();
      if (!email || !password || password.length < 6 || !name) { showToast(t("common.requiredField"), "error"); return; }
      try {
        // Secondary Firebase App instance trick: create the new auth user
        // WITHOUT signing out the admin's current session.
        const secondaryApp = firebase.initializeApp(firebaseConfig, "Secondary" + Date.now());
        const cred = await secondaryApp.auth().createUserWithEmailAndPassword(email, password);
        const newUid = cred.user.uid;
        await secondaryApp.auth().signOut();
        await secondaryApp.delete();
        await COLLECTIONS.users.doc(newUid).set({
          email, name,
          globalRole: newGlobalRole,
          deptRoles: newDeptRoles,
          managedDepartments,
          active: true,
          createdAt: nowTs(),
          createdBy: uid()
        });
        closeModal();
        showToast(t("toast.saved"), "success");
      } catch (err) {
        console.error(err);
        if (err.code === "auth/email-already-in-use") {
          showToast(STATE.lang === "vi"
            ? "Email này đã có sẵn trong Firebase Auth (có thể tạo từ app HAIC-T khác). Dán UID vào ô bên dưới."
            : "This email already exists in Firebase Auth (possibly created by another HAIC-T app). Paste its UID below.", "error");
          showExistingAuthUidRecovery(email, name, newGlobalRole, newDeptRoles, managedDepartments);
        } else {
          showToast(mapAuthError(err), "error");
        }
      }
    }
  };
}

// Khi tạo người dùng mới bị trùng email đã có sẵn trong Firebase Auth (do
// dùng chung HAI-CLOUD với các app HAIC-T khác), không tạo Auth mới nữa —
// thay vào đó cho anh dán UID có sẵn (copy từ Firebase Console ->
// Authentication -> tìm email -> cột User UID) để tạo hồ sơ phân quyền cho
// đúng tài khoản đó trong app Equipment. Giống cách app HAI Administration
// đang xử lý.
function showExistingAuthUidRecovery(email, name, newGlobalRole, newDeptRoles, managedDepartments) {
  const container = document.getElementById("us_emailExistsRecovery");
  if (!container) return;
  container.innerHTML = `
    <div class="field-hint" style="background:var(--warning-light);color:var(--warning);padding:10px;border-radius:6px;margin:10px 0;">
      ${STATE.lang === "vi"
        ? `Email <b>${escapeHtml(email)}</b> đã có sẵn trong Firebase Authentication. Vào Firebase Console → Authentication → Users → tìm email này → copy cột "User UID" → dán vào ô dưới.`
        : `Email <b>${escapeHtml(email)}</b> already exists in Firebase Authentication. Go to Firebase Console → Authentication → Users → find this email → copy the "User UID" column → paste below.`}
    </div>
    <div class="field">
      <label>${STATE.lang === "vi" ? "UID có sẵn trong Firebase Auth" : "Existing Firebase Auth UID"} *</label>
      <input id="us_existingUid" placeholder="VD: aB3dEfGh12...">
    </div>
    <button class="btn btn-primary" id="us_useExistingUid" style="width:100%;">${STATE.lang === "vi" ? "Tạo hồ sơ phân quyền với UID này" : "Create profile with this UID"}</button>
  `;
  document.getElementById("us_useExistingUid").onclick = async () => {
    const existingUid = document.getElementById("us_existingUid").value.trim();
    if (!existingUid) { showToast(t("common.requiredField"), "error"); return; }
    try {
      await COLLECTIONS.users.doc(existingUid).set({
        email, name,
        globalRole: newGlobalRole,
        deptRoles: newDeptRoles,
        managedDepartments,
        active: true,
        createdAt: nowTs(),
        createdBy: uid()
      }, { merge: true });
      closeModal();
      showToast(t("toast.saved"), "success");
    } catch (err) {
      showErrorToast(err);
    }
  };
}

// =====================================================================
// MODULE: REPORTS (cross-module exports)
// =====================================================================

PAGE_RENDERERS.reports = function renderReports() {
  document.getElementById("pageContent").innerHTML = `
    <div class="panel">
      <div class="panel-header"><h3>${t("nav.reports")}</h3></div>
      <div class="panel-body">
        <div class="field-row">
          <button class="btn" id="rpFixed">${STATE.lang === "vi" ? "Báo cáo tài sản cố định" : "Fixed Assets Report"}</button>
          <button class="btn" id="rpEquip">${STATE.lang === "vi" ? "Báo cáo thiết bị" : "Equipment Report"}</button>
          <button class="btn" id="rpInv">${STATE.lang === "vi" ? "Báo cáo vật tư" : "Inventory Report"}</button>
          <button class="btn" id="rpMove">${STATE.lang === "vi" ? "Báo cáo mượn/trả" : "Movement Report"}</button>
          <button class="btn" id="rpMt">${STATE.lang === "vi" ? "Báo cáo sửa chữa" : "Maintenance Report"}</button>
          <button class="btn" id="rpPr">${STATE.lang === "vi" ? "Báo cáo mua hàng" : "Purchase Report"}</button>
        </div>
      </div>
    </div>
  `;
  document.getElementById("rpFixed").onclick = () => exportAssetsExcel(filterByScope(STATE.cache.fixedAssets), "Fixed_Assets");
  document.getElementById("rpEquip").onclick = () => exportAssetsExcel(filterByScope(STATE.cache.equipment), "Equipment");
  document.getElementById("rpInv").onclick = () => exportInventoryExcel(filterByScope(STATE.cache.inventory));
  document.getElementById("rpMove").onclick = () => exportMovementsExcel(filterByScope(STATE.cache.movements));
  document.getElementById("rpMt").onclick = () => exportMaintenanceExcel(filterByScope(STATE.cache.maintenance));
  document.getElementById("rpPr").onclick = () => exportPurchaseExcel(filterByScope(STATE.cache.purchaseRequests));
};

// =====================================================================
// EXPORT HELPERS (Excel via SheetJS, PDF via jsPDF)
// =====================================================================

function downloadWorkbook(rows, filename) {
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Data");
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

function exportAssetsExcel(items, label) {
  const rows = items.map((i) => ({
    Code: i.assetCode, Name: i.name, Category: i.category, SubCategory: i.subCategory || "",
    Department: i.department || "", Country: i.country, Brand: i.brand || "", Model: i.model || "", Serial: i.serialNumber || "",
    PurchaseDate: i.purchaseDate || "", PurchasePrice: i.purchasePrice || "",
    Status: i.status, Condition: i.condition,
    LocationType: i.location ? i.location.type : "", LocationName: i.location ? i.location.name : "",
    LastCalibrationDate: i.lastCalibrationDate || "", CalibrationExpiryDate: i.calibrationExpiryDate || "", CalibrationCertNo: i.calibrationCertNo || "",
    Notes: i.notes || ""
  }));
  downloadWorkbook(rows, (label || "Assets").replace(/\s+/g, "_"));
}

function exportAssetsPdf(items, label) {
  const doc = new jspdf.jsPDF({ orientation: "landscape", format: "a4" });
  doc.setFontSize(13);
  doc.text(label || "Report", 14, 14);
  doc.autoTable({
    startY: 20,
    head: [["Code", "Name", "Category", "Department", "Country", "Status", "Condition", "Location", "Calibration Expiry"]],
    body: items.map((i) => [
      i.assetCode || "", i.name || "", i.category || "", i.department ? L(DEPARTMENTS[i.department] || {}) : "", i.country || "",
      L(STATUS_LABELS[i.status] || {}), L(CONDITION_LABELS[i.condition] || {}),
      i.location ? `${i.location.type}: ${i.location.name}` : "",
      i.calibrationExpiryDate || ""
    ]),
    styles: { fontSize: 8 }
  });
  doc.save(`${(label || "report").replace(/\s+/g, "_")}.pdf`);
}

function exportInventoryExcel(items) {
  const rows = items.map((i) => ({
    Code: i.itemCode, Name: i.name, Category: i.category, Size: i.size || "", Unit: i.unit || "",
    WarehouseStock: i.warehouseStock || 0, SiteStockTotal: siteStockTotal(i), MinimumStock: i.minimumStock || 0
  }));
  downloadWorkbook(rows, "Inventory");
}

function exportMovementsExcel(items) {
  const rows = [];
  items.forEach((m) => {
    (m.equipmentList || []).forEach((it) => {
      rows.push({
        Project: m.project, Site: m.siteLocation, DateOut: m.dateOut, ExpectedReturn: m.expectedReturnDate,
        AssetCode: it.assetCode, AssetName: it.assetName, Quantity: it.quantity,
        Employee: m.employeeName, Status: m.status
      });
    });
  });
  downloadWorkbook(rows, "Movements");
}

function exportMaintenanceExcel(items) {
  const rows = items.map((m) => ({
    AssetCode: m.assetCodeSnapshot || m.assetId, Problem: m.problem, Date: m.date,
    Status: m.status, RepairCost: m.repairCost || ""
  }));
  downloadWorkbook(rows, "Maintenance");
}

function exportPurchaseExcel(items) {
  const rows = items.map((p) => ({
    Item: p.itemName, Quantity: p.quantity,
    ExistingStock: p.stockCheck ? p.stockCheck.total : "",
    RequestedBy: p.requestedByName, Date: p.date, Status: p.status
  }));
  downloadWorkbook(rows, "Purchase_Requests");
}


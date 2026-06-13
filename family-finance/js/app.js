// ===================== app.js =====================

let currentDashMonth = null; // "YYYY-MM"
let txFilterStatus = "all"; // for transactions page
let approvalsTab = "pending";
let editingTxId = null;
let pendingReceiptBase64 = null;

// ---------- Init ----------
document.addEventListener("DOMContentLoaded", () => {
  applyTranslations();
  setupLoginScreen();

  if (restoreSession()) {
    initRealtimeSync(() => {
      ensureStructure();
      bootApp();
    });
  }

  document.getElementById("btnLogin").addEventListener("click", handleLoginClick);
  document.getElementById("loginPassword").addEventListener("keydown", e => {
    if (e.key === "Enter") handleLoginClick();
  });
  document.getElementById("btnLang").addEventListener("click", toggleLang);
});

function setupLoginScreen() {
  const note = document.getElementById("demoNote");
  note.innerHTML = currentLang === "vi"
    ? "Tài khoản Super Admin mặc định:<br><b>truong.haicambodia@gmail.com</b> / admin123"
    : "Default Super Admin account:<br><b>truong.haicambodia@gmail.com</b> / admin123";
}

function handleLoginClick() {
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;
  const errEl = document.getElementById("loginError");
  errEl.textContent = "";

  if (!email || !password) {
    errEl.textContent = t("toastFillRequired");
    return;
  }

  // First, try to sync with Firestore to get latest user list before checking
  initRealtimeSync(() => {
    ensureStructure();
    const result = attemptLogin(email, password);
    if (!result.success) {
      errEl.textContent = t("toastLoginError");
      return;
    }
    bootApp();
  });
}

function bootApp() {
  document.getElementById("loginScreen").style.display = "none";
  document.getElementById("app").style.display = "block";

  currentDashMonth = getCurrentMonthKey();

  setupNavigation();
  setupFab();
  setupModalsStatic();
  setupSettingsHandlers();
  setupTxModal();
  setupGoalModal();
  setupAssetModal();
  setupUserModal();
  setupBudgetModal();
  setupRejectModal();
  setupApprovalsTabs();
  setupExportButtons();

  applyTranslations();
  renderAll();
}

// ---------- Toast ----------
let toastTimer = null;
function showToast(message, type) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.className = "toast show" + (type ? " " + type : "");
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2600);
}

// ---------- Modal helpers ----------
function openModal(id) {
  document.getElementById(id).classList.add("active");
}
function closeModal(id) {
  document.getElementById(id).classList.remove("active");
}
document.addEventListener("click", e => {
  if (e.target.classList.contains("modal-overlay")) {
    e.target.classList.remove("active");
  }
});

// ---------- Navigation ----------
const PAGES = ["dashboard", "transactions", "approvals", "budget", "goals", "assets", "members", "reports", "settings"];
const NAV_MAIN = ["dashboard", "transactions", "budget", "goals"]; // shown directly in bottom nav

function setupNavigation() {
  document.querySelectorAll(".nav-item").forEach(item => {
    item.addEventListener("click", () => {
      const page = item.dataset.page;
      if (page === "more") {
        openMoreMenu();
      } else {
        goPage(page);
      }
    });
  });
  document.getElementById("btnNotif").addEventListener("click", () => goPage("approvals"));
}

function openMoreMenu() {
  const list = document.getElementById("moreMenuList");
  const items = [
    { page: "approvals", icon: "🔔", labelKey: "navApprovals" },
    { page: "assets", icon: "🏦", labelKey: "navAssets" },
    { page: "members", icon: "👥", labelKey: "navMembers" },
    { page: "reports", icon: "📈", labelKey: "navReports" },
    { page: "settings", icon: "⚙️", labelKey: "navSettings" },
  ];
  list.innerHTML = items.map(it => `
    <div class="settings-row" style="cursor:pointer;" onclick="goPage('${it.page}'); closeModal('modalMore');">
      <div class="lbl">${it.icon} &nbsp; ${t(it.labelKey)}</div>
      <div>›</div>
    </div>
  `).join("");
  openModal("modalMore");
}

function goPage(page) {
  PAGES.forEach(p => {
    const el = document.getElementById("page-" + p);
    if (el) el.classList.toggle("hidden", p !== page);
  });
  document.querySelectorAll(".nav-item").forEach(item => {
    const isActive = (item.dataset.page === page) ||
      (item.dataset.page === "more" && !NAV_MAIN.includes(page));
    item.classList.toggle("active", isActive);
  });
  // toggle FAB visibility - only show on dashboard/transactions
  const fab = document.getElementById("btnFab");
  fab.style.display = (page === "dashboard" || page === "transactions") ? "flex" : "none";

  // re-render content for the active page
  renderPage(page);
  window.scrollTo(0, 0);
}

function renderPage(page) {
  switch (page) {
    case "dashboard": renderDashboard(); break;
    case "transactions": renderTransactionsPage(); break;
    case "approvals": renderApprovalsPage(); break;
    case "budget": renderBudgetPage(); break;
    case "goals": renderGoalsPage(); break;
    case "assets": renderAssetsPage(); break;
    case "members": renderMembersPage(); break;
    case "reports": renderReportsPage(); break;
    case "settings": renderSettingsPage(); break;
  }
}

function renderAll() {
  renderTopbar();
  // re-render whichever page is currently visible
  const activePage = PAGES.find(p => !document.getElementById("page-" + p).classList.contains("hidden")) || "dashboard";
  renderPage(activePage);
  updateNotifBadge();
}

function renderTopbar() {
  const monthLabel = formatMonthLabel(currentDashMonth);
  document.getElementById("currentMonthLabel").textContent = monthLabel;
}

// ---------- Date helpers ----------
function getCurrentMonthKey() {
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
}

function formatMonthLabel(monthKeyStr) {
  const [y, m] = monthKeyStr.split("-");
  const monthNamesVi = ["Tháng 1","Tháng 2","Tháng 3","Tháng 4","Tháng 5","Tháng 6","Tháng 7","Tháng 8","Tháng 9","Tháng 10","Tháng 11","Tháng 12"];
  const monthNamesEn = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const idx = parseInt(m, 10) - 1;
  const name = currentLang === "vi" ? monthNamesVi[idx] : monthNamesEn[idx];
  return `${name} ${y}`;
}

function todayStr() {
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

function getAvailableMonths() {
  const months = new Set();
  STORE.transactions.forEach(tx => months.add(monthKey(tx.date)));
  months.add(getCurrentMonthKey());
  months.add(currentDashMonth);
  return Array.from(months).sort().reverse();
}

// ===================== DASHBOARD =====================
let pieChartInstance = null;
let trendChartInstance = null;

function getTxForMonth(monthKeyStr, opts) {
  opts = opts || {};
  return STORE.transactions.filter(tx => {
    if (monthKey(tx.date) !== monthKeyStr) return false;
    if (opts.onlyApprovedOrPaid) {
      if (tx.type === "expense" && !["approved", "paid"].includes(tx.status)) return false;
    }
    if (opts.viewerOwn) {
      if (!can("viewAllFinance") && tx.createdBy !== currentUser.id) return false;
    }
    return true;
  });
}

function calcMonthSummary(monthKeyStr) {
  const txs = getTxForMonth(monthKeyStr);
  let income = 0, expense = 0, pendingExpense = 0;
  txs.forEach(tx => {
    if (tx.type === "income") {
      income += tx.amountUSD;
    } else {
      if (tx.status === "approved" || tx.status === "paid") {
        expense += tx.amountUSD;
      } else if (tx.status === "pending") {
        pendingExpense += tx.amountUSD;
      }
    }
  });
  return { income, expense, saving: income - expense, pendingExpense, txCount: txs.length };
}

function calcCategoryBreakdown(monthKeyStr) {
  const txs = getTxForMonth(monthKeyStr).filter(tx => tx.type === "expense" && (tx.status === "approved" || tx.status === "paid"));
  const map = {};
  let total = 0;
  txs.forEach(tx => {
    map[tx.categoryId] = (map[tx.categoryId] || 0) + tx.amountUSD;
    total += tx.amountUSD;
  });
  const cats = STORE.categories.expense;
  const result = cats.map(c => ({
    id: c.id,
    name: currentLang === "vi" ? c.name_vi : c.name_en,
    icon: c.icon,
    value: map[c.id] || 0,
    pct: total > 0 ? Math.round(((map[c.id] || 0) / total) * 1000) / 10 : 0,
  })).filter(c => c.value > 0).sort((a, b) => b.value - a.value);
  return { items: result, total };
}

const CHART_COLORS = ["#163832", "#d9a440", "#3f7d5c", "#c97c2e", "#8a8174", "#b54b3f", "#2a5048", "#e0c68a"];

function renderDashboard() {
  populateMonthSelect();
  const summary = calcMonthSummary(currentDashMonth);
  const currency = STORE.settings.primaryCurrency || "USD";

  document.getElementById("heroMonth").textContent = formatMonthLabel(currentDashMonth);
  document.getElementById("heroBalance").textContent = formatCurrency(summary.saving >= 0 ? summary.saving : summary.saving, currency);
  document.getElementById("heroIncome").textContent = "+" + formatCurrency(summary.income, currency);
  document.getElementById("heroExpense").textContent = "-" + formatCurrency(summary.expense, currency);
  document.getElementById("heroSaving").textContent = formatCurrency(summary.saving, currency);

  document.getElementById("dashSub").textContent = t("welcomeBack") + ", " + currentUser.name;

  // Pending approval banner (visible to those who can approve)
  const pendingBanner = document.getElementById("pendingBanner");
  const allPending = STORE.transactions.filter(tx => tx.type === "expense" && tx.status === "pending");
  if (can("approveExpense") && allPending.length > 0) {
    pendingBanner.classList.remove("hidden");
    let totalPendingUSD = allPending.reduce((s, tx) => s + tx.amountUSD, 0);
    document.getElementById("pendingBannerTitle").textContent = t("pendingApprovalTitle");
    document.getElementById("pendingBannerSub").textContent = allPending.length + " " + t("pendingApprovalSub");
    document.getElementById("pendingBannerAmt").textContent = formatCurrency(totalPendingUSD, currency);
    pendingBanner.onclick = () => goPage("approvals");
  } else {
    pendingBanner.classList.add("hidden");
  }

  renderCategoryChart();
  renderTrendChart();
  renderRecentTransactions();
}

function populateMonthSelect() {
  const select = document.getElementById("dashMonthSelect");
  const months = getAvailableMonths();
  select.innerHTML = months.map(m => `<option value="${m}" ${m === currentDashMonth ? "selected" : ""}>${formatMonthLabel(m)}</option>`).join("");
  select.onchange = () => {
    currentDashMonth = select.value;
    renderDashboard();
  };
}

function renderCategoryChart() {
  const { items, total } = calcCategoryBreakdown(currentDashMonth);
  const ctx = document.getElementById("pieChart");
  if (pieChartInstance) pieChartInstance.destroy();

  if (items.length === 0) {
    document.getElementById("catLegend").innerHTML = `<div class="empty-state"><div class="ico">📊</div><p>${currentLang === 'vi' ? 'Chưa có dữ liệu' : 'No data yet'}</p></div>`;
    pieChartInstance = new Chart(ctx, {
      type: "doughnut",
      data: { labels: ["—"], datasets: [{ data: [1], backgroundColor: ["#e4ddcd"] }] },
      options: { plugins: { legend: { display: false }, tooltip: { enabled: false } }, cutout: "65%" }
    });
    return;
  }

  pieChartInstance = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: items.map(i => i.name),
      datasets: [{
        data: items.map(i => i.value),
        backgroundColor: items.map((_, idx) => CHART_COLORS[idx % CHART_COLORS.length]),
        borderWidth: 0,
      }]
    },
    options: {
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.label}: ${formatCurrency(ctx.raw, STORE.settings.primaryCurrency)}`
          }
        }
      },
      cutout: "62%",
      maintainAspectRatio: false,
    }
  });

  document.getElementById("catLegend").innerHTML = items.map((i, idx) => `
    <div class="cat-row">
      <div class="cat-dot" style="background:${CHART_COLORS[idx % CHART_COLORS.length]}"></div>
      <div class="name">${i.icon} ${i.name}</div>
      <div class="pct">${i.pct}%</div>
    </div>
  `).join("");
}

function renderTrendChart() {
  // last 6 months including current dash month
  const months = [];
  const [y, m] = currentDashMonth.split("-").map(Number);
  for (let i = 5; i >= 0; i--) {
    let mm = m - i, yy = y;
    while (mm <= 0) { mm += 12; yy -= 1; }
    months.push(yy + "-" + String(mm).padStart(2, "0"));
  }
  const incomeData = months.map(mk => calcMonthSummary(mk).income);
  const expenseData = months.map(mk => calcMonthSummary(mk).expense);
  const labels = months.map(mk => {
    const [, mo] = mk.split("-");
    return currentLang === "vi" ? "Th" + mo : "M" + mo;
  });

  const ctx = document.getElementById("trendChart");
  if (trendChartInstance) trendChartInstance.destroy();
  trendChartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        { label: t("lblIncome"), data: incomeData, backgroundColor: "#3f7d5c", borderRadius: 4 },
        { label: t("lblExpense"), data: expenseData, backgroundColor: "#c97c2e", borderRadius: 4 },
      ]
    },
    options: {
      maintainAspectRatio: false,
      plugins: { legend: { position: "bottom", labels: { boxWidth: 10, font: { size: 10 } } } },
      scales: {
        x: { grid: { display: false }, ticks: { font: { size: 10 } } },
        y: { grid: { color: "#eee" }, ticks: { font: { size: 10 }, callback: v => formatCurrency(v, STORE.settings.primaryCurrency) } }
      }
    }
  });
}

function renderRecentTransactions() {
  let txs = getTxForMonth(currentDashMonth, { viewerOwn: true })
    .slice()
    .sort((a, b) => new Date(b.date + "T" + (b.timestamp || "00:00")) - new Date(a.date + "T" + (a.timestamp || "00:00")))
    .slice(0, 5);

  const container = document.getElementById("recentTxList");
  if (txs.length === 0) {
    container.innerHTML = `<div class="empty-state"><div class="ico">📭</div><p>${t("emptyTx")}</p></div>`;
    return;
  }
  container.innerHTML = txs.map(tx => renderTxItem(tx)).join("");
}

function getCategoryById(catId, type) {
  const list = type === "income" ? STORE.categories.income : STORE.categories.expense;
  return list.find(c => c.id === catId) || { name_vi: "Khác", name_en: "Other", icon: "📦" };
}

function getUserById(userId) {
  return STORE.users.find(u => u.id === userId) || { name: "—" };
}

function renderTxItem(tx) {
  const cat = getCategoryById(tx.categoryId, tx.type);
  const catName = currentLang === "vi" ? cat.name_vi : cat.name_en;
  const isIncome = tx.type === "income";
  const amountStr = (isIncome ? "+" : "-") + formatCurrency(tx.amountUSD, STORE.settings.primaryCurrency);
  const paidByUser = getUserById(tx.paidBy);
  const createdByUser = getUserById(tx.createdBy);
  const statusPill = !isIncome ? `<span class="status-pill ${tx.status}">${t("status" + capitalize(tx.status))}</span>` : "";

  return `
    <div class="tx-item" onclick="openTxDetail('${tx.id}')">
      <div class="tx-icon ${isIncome ? "income" : ""}">${cat.icon}</div>
      <div class="tx-detail">
        <div class="top">
          <div class="cat">${catName}</div>
          <div class="amt ${tx.type}">${amountStr}</div>
        </div>
        <div class="meta">
          <span>${formatDateDisplay(tx.date)}</span>
          <span>•</span>
          <span>${paidByUser.name}</span>
          ${statusPill}
        </div>
      </div>
    </div>
  `;
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function formatDateDisplay(dateStr) {
  const [y, m, d] = dateStr.split("-");
  return currentLang === "vi" ? `${d}/${m}/${y}` : `${m}/${d}/${y}`;
}

function openTxDetail(txId) {
  const tx = STORE.transactions.find(t2 => t2.id === txId);
  if (!tx) return;
  // Only allow editing if owner (and editable) or super admin
  if (can("editOwnExpense", tx.createdBy) || isSuperAdmin()) {
    openTxModal(tx);
  }
}

// ===================== TRANSACTIONS PAGE =====================
function renderTransactionsPage() {
  renderTxFilterTabs();
  const filtered = getFilteredTransactions();
  const container = document.getElementById("allTxList");
  const empty = document.getElementById("txEmpty");

  if (filtered.length === 0) {
    container.innerHTML = "";
    empty.classList.remove("hidden");
    return;
  }
  empty.classList.add("hidden");

  // group by date
  const sorted = filtered.slice().sort((a, b) => new Date(b.date + "T" + (b.timestamp || "00:00")) - new Date(a.date + "T" + (a.timestamp || "00:00")));
  container.innerHTML = sorted.map(tx => renderTxItem(tx)).join("");
}

function getFilteredTransactions() {
  let txs = STORE.transactions.filter(tx => {
    if (!can("viewAllFinance") && tx.createdBy !== currentUser.id) return false;
    return true;
  });
  if (txFilterStatus === "income") txs = txs.filter(tx => tx.type === "income");
  else if (txFilterStatus === "expense") txs = txs.filter(tx => tx.type === "expense");
  else if (txFilterStatus !== "all") txs = txs.filter(tx => tx.status === txFilterStatus);
  return txs;
}

function renderTxFilterTabs() {
  const tabs = [
    { key: "all", label: currentLang === "vi" ? "Tất cả" : "All" },
    { key: "income", label: t("typeIncome") },
    { key: "expense", label: t("typeExpense") },
    { key: "pending", label: t("statusPending") },
    { key: "approved", label: t("statusApproved") },
  ];
  const container = document.getElementById("txFilterTabs");
  container.innerHTML = tabs.map(tb => `
    <button class="tab-btn ${txFilterStatus === tb.key ? "active" : ""}" onclick="setTxFilter('${tb.key}')">${tb.label}</button>
  `).join("");
}

function setTxFilter(key) {
  txFilterStatus = key;
  renderTransactionsPage();
}

// ===================== TRANSACTION MODAL =====================
function setupFab() {
  document.getElementById("btnFab").addEventListener("click", () => openTxModal(null));
}

function setupTxModal() {
  document.getElementById("txType").addEventListener("change", () => {
    populateCategoryOptions();
    updateTxStatusPreview();
  });
  document.getElementById("txAmount").addEventListener("input", updateTxStatusPreview);
  document.getElementById("txCurrency").addEventListener("change", updateTxStatusPreview);
  document.getElementById("txReceipt").addEventListener("change", handleReceiptUpload);
  document.getElementById("btnSaveTx").addEventListener("click", saveTransaction);
}

function populateCategoryOptions() {
  const type = document.getElementById("txType").value;
  const list = type === "income" ? STORE.categories.income : STORE.categories.expense;
  const select = document.getElementById("txCategory");
  select.innerHTML = list.map(c => `<option value="${c.id}">${c.icon} ${currentLang === "vi" ? c.name_vi : c.name_en}</option>`).join("");
}

function populatePaidByOptions() {
  const select = document.getElementById("txPaidBy");
  const activeUsers = STORE.users.filter(u => u.active !== false);
  select.innerHTML = activeUsers.map(u => `<option value="${u.id}">${u.name}</option>`).join("");
}

function handleReceiptUpload(e) {
  const file = e.target.files[0];
  if (!file) { pendingReceiptBase64 = null; return; }
  if (file.size > 2 * 1024 * 1024) {
    showToast(currentLang === "vi" ? "Ảnh quá lớn (tối đa 2MB)" : "Image too large (max 2MB)", "error");
    e.target.value = "";
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    pendingReceiptBase64 = reader.result;
    document.getElementById("txReceiptPreview").innerHTML = `<img src="${pendingReceiptBase64}" class="receipt-thumb">`;
  };
  reader.readAsDataURL(file);
}

function updateTxStatusPreview() {
  const type = document.getElementById("txType").value;
  const preview = document.getElementById("txStatusPreview");
  if (type === "income") {
    preview.textContent = "";
    return;
  }
  const amount = parseFloat(document.getElementById("txAmount").value) || 0;
  const currency = document.getElementById("txCurrency").value;
  const amountUSD = convertToUSD(amount, currency);
  const status = determineExpenseStatus(amountUSD, currentUser.role);
  const tier = expenseApprovalTier(amountUSD);

  let label;
  if (status === "approved") {
    label = "✅ " + t("autoApproved");
  } else if (tier === "super") {
    label = "🔺 " + t("needSuperApproval");
  } else {
    label = "⏳ " + t("needApproval");
  }
  preview.textContent = `${t("txStatusInfo")}: ${label}`;
}

function openTxModal(tx) {
  editingTxId = tx ? tx.id : null;
  pendingReceiptBase64 = tx ? (tx.receipt || null) : null;

  document.getElementById("txModalTitle").textContent = tx ? t("txModalEdit") : t("txModalAdd");
  document.getElementById("txType").value = tx ? tx.type : "expense";
  populateCategoryOptions();
  document.getElementById("txCategory").value = tx ? tx.categoryId : (STORE.categories.expense[0] && STORE.categories.expense[0].id);
  document.getElementById("txDate").value = tx ? tx.date : todayStr();
  document.getElementById("txCurrency").value = tx ? (tx.currency || "USD") : "USD";
  document.getElementById("txAmount").value = tx ? (tx.currency === "USD" ? tx.amountUSD : convertFromUSD(tx.amountUSD, tx.currency)).toFixed(2) : "";
  populatePaidByOptions();
  document.getElementById("txPaidBy").value = tx ? tx.paidBy : currentUser.id;
  document.getElementById("txNote").value = tx ? (tx.note || "") : "";

  const preview = document.getElementById("txReceiptPreview");
  preview.innerHTML = pendingReceiptBase64 ? `<img src="${pendingReceiptBase64}" class="receipt-thumb">` : "";
  document.getElementById("txReceipt").value = "";

  updateTxStatusPreview();
  openModal("modalTx");
}

function saveTransaction() {
  const type = document.getElementById("txType").value;
  const categoryId = document.getElementById("txCategory").value;
  const date = document.getElementById("txDate").value;
  const currency = document.getElementById("txCurrency").value;
  const amountRaw = parseFloat(document.getElementById("txAmount").value);
  const paidBy = document.getElementById("txPaidBy").value;
  const note = document.getElementById("txNote").value.trim();

  if (!date || !amountRaw || amountRaw <= 0) {
    showToast(t("toastFillRequired"), "error");
    return;
  }

  const amountUSD = convertToUSD(amountRaw, currency);

  if (editingTxId) {
    const tx = STORE.transactions.find(t2 => t2.id === editingTxId);
    if (!tx) return;
    tx.type = type;
    tx.categoryId = categoryId;
    tx.date = date;
    tx.currency = currency;
    tx.amountUSD = amountUSD;
    tx.paidBy = paidBy;
    tx.note = note;
    tx.receipt = pendingReceiptBase64;
    tx.updatedAt = nowISO();
    // re-evaluate status if it was draft/pending and amount changed (only if not already approved/paid)
    if (type === "expense" && (tx.status === "draft" || tx.status === "pending")) {
      tx.status = determineExpenseStatus(amountUSD, getUserById(tx.createdBy).role);
    }
    addAuditLog({
      userId: currentUser.id, userName: currentUser.name,
      action: "edited", targetType: type === "income" ? t("auditIncome") : t("auditExpense"),
      detail: `${getCategoryById(categoryId, type).name_vi} - ${formatCurrency(amountUSD, "USD")}`
    });
  } else {
    const newTx = {
      id: genId("tx"),
      type, categoryId, date, currency,
      amountUSD,
      paidBy,
      createdBy: currentUser.id,
      note,
      receipt: pendingReceiptBase64,
      timestamp: new Date().toTimeString().substring(0, 5),
      createdAt: nowISO(),
      status: type === "income" ? "approved" : determineExpenseStatus(amountUSD, currentUser.role),
      approvedBy: null,
      approvedAt: null,
      approvalNote: null,
      history: [
        { action: "created", userId: currentUser.id, userName: currentUser.name, timestamp: nowISO() }
      ],
    };
    if (type === "expense" && newTx.status === "approved" && currentUser.role !== "superadmin") {
      newTx.history.push({ action: "auto_approved", userId: "system", userName: "System", timestamp: nowISO() });
    }
    STORE.transactions.push(newTx);

    addAuditLog({
      userId: currentUser.id, userName: currentUser.name,
      action: "created", targetType: type === "income" ? t("auditIncome") : t("auditExpense"),
      detail: `${getCategoryById(categoryId, type).name_vi} - ${formatCurrency(amountUSD, "USD")}`
    });

    // Notify if needs approval
    if (newTx.status === "pending") {
      addNotification({
        type: "new_request",
        txId: newTx.id,
        message: t("notifNewRequest"),
        forSuperAdmin: true,
      });
    }
  }

  persistDebounced();
  closeModal("modalTx");
  showToast(t("toastSaved"), "success");
  renderAll();
}

// ===================== NOTIFICATIONS =====================
function addNotification(notif) {
  if (!STORE.notifications) STORE.notifications = [];
  STORE.notifications.unshift({
    id: genId("notif"),
    timestamp: nowISO(),
    read: false,
    ...notif
  });
  if (STORE.notifications.length > 100) STORE.notifications = STORE.notifications.slice(0, 100);
}

function updateNotifBadge() {
  if (!STORE.notifications) STORE.notifications = [];
  const pendingCount = STORE.transactions.filter(tx => tx.type === "expense" && tx.status === "pending").length;
  const badge = document.getElementById("notifBadge");
  if (can("approveExpense") && pendingCount > 0) {
    badge.textContent = pendingCount;
    badge.classList.remove("hidden");
  } else {
    badge.classList.add("hidden");
  }
}

// ===================== APPROVALS PAGE =====================
function setupApprovalsTabs() {
  document.getElementById("apTabPending").addEventListener("click", () => {
    approvalsTab = "pending";
    document.getElementById("apTabPending").classList.add("active");
    document.getElementById("apTabHistory").classList.remove("active");
    renderApprovalsPage();
  });
  document.getElementById("apTabHistory").addEventListener("click", () => {
    approvalsTab = "history";
    document.getElementById("apTabHistory").classList.add("active");
    document.getElementById("apTabPending").classList.remove("active");
    renderApprovalsPage();
  });
}

function renderApprovalsPage() {
  const container = document.getElementById("approvalsContent");

  if (!can("approveExpense")) {
    container.innerHTML = `<div class="empty-state"><div class="ico">🔒</div><p>${currentLang === "vi" ? "Bạn không có quyền xem trang này" : "You don't have permission to view this page"}</p></div>`;
    return;
  }

  if (approvalsTab === "pending") {
    const pending = STORE.transactions
      .filter(tx => tx.type === "expense" && tx.status === "pending")
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    if (pending.length === 0) {
      container.innerHTML = `<div class="empty-state"><div class="ico">✅</div><p>${t("noApprovalsPending")}</p></div>`;
      return;
    }

    container.innerHTML = pending.map(tx => renderApprovalCard(tx)).join("");
  } else {
    const history = STORE.transactions
      .filter(tx => tx.type === "expense" && (tx.status === "approved" || tx.status === "rejected" || tx.status === "paid") && tx.approvedBy)
      .sort((a, b) => new Date(b.approvedAt || b.createdAt) - new Date(a.approvedAt || a.createdAt));

    if (history.length === 0) {
      container.innerHTML = `<div class="empty-state"><div class="ico">📋</div><p>${t("noApprovalsHistory")}</p></div>`;
      return;
    }

    container.innerHTML = history.map(tx => renderApprovalHistoryCard(tx)).join("");
  }
}

function renderApprovalCard(tx) {
  const cat = getCategoryById(tx.categoryId, "expense");
  const catName = currentLang === "vi" ? cat.name_vi : cat.name_en;
  const createdByUser = getUserById(tx.createdBy);
  const tier = expenseApprovalTier(tx.amountUSD);
  const tierLabel = tier === "super" ? t("needSuperApproval") : t("needApproval");

  return `
    <div class="approval-card">
      <div class="ah">
        <div>
          <div class="amt">${cat.icon} ${catName}</div>
          <div class="who">${t("createdBy")}: ${createdByUser.name} • ${formatDateDisplay(tx.date)}</div>
        </div>
        <div class="amt">${formatCurrency(tx.amountUSD, "USD")}</div>
      </div>
      ${tx.note ? `<div class="note">${escapeHtml(tx.note)}</div>` : ""}
      <div class="text-muted" style="font-size:11.5px; margin-bottom:8px;">
        ${tier === "super" ? "🔺" : "⏳"} ${tierLabel}
      </div>
      ${tx.receipt ? `<img src="${tx.receipt}" class="receipt-thumb" style="margin-bottom:8px;">` : ""}
      <div class="btn-row">
        <button class="btn btn-forest btn-sm" onclick="approveTransaction('${tx.id}')">${t("btnApprove")}</button>
        <button class="btn btn-danger btn-sm" onclick="openRejectModal('${tx.id}')">${t("btnReject")}</button>
      </div>
    </div>
  `;
}

function renderApprovalHistoryCard(tx) {
  const cat = getCategoryById(tx.categoryId, "expense");
  const catName = currentLang === "vi" ? cat.name_vi : cat.name_en;
  const createdByUser = getUserById(tx.createdBy);
  const approverUser = getUserById(tx.approvedBy);

  return `
    <div class="approval-card">
      <div class="ah">
        <div>
          <div class="amt">${cat.icon} ${catName}</div>
          <div class="who">${t("createdBy")}: ${createdByUser.name} • ${formatDateDisplay(tx.date)}</div>
        </div>
        <div class="amt">${formatCurrency(tx.amountUSD, "USD")}</div>
      </div>
      <span class="status-pill ${tx.status}">${t("status" + capitalize(tx.status))}</span>
      <div class="text-muted" style="font-size:12px; margin-top:8px;">
        ${t("approvedBy")}: ${approverUser.name} • ${formatDateDisplay(tx.approvedAt ? tx.approvedAt.substring(0,10) : tx.date)}
      </div>
      ${tx.approvalNote ? `<div class="note">${escapeHtml(tx.approvalNote)}</div>` : ""}
      ${renderHistoryTimeline(tx)}
    </div>
  `;
}

function renderHistoryTimeline(tx) {
  if (!tx.history || tx.history.length === 0) return "";
  return `
    <div style="margin-top:8px; border-top:1px solid var(--line); padding-top:8px;">
      ${tx.history.map(h => `
        <div class="history-item">
          <div class="dot"></div>
          <div>${formatDateTimeShort(h.timestamp)} — ${h.userName} ${t("audit" + capitalize(h.action.split("_")[0]))}</div>
        </div>
      `).join("")}
    </div>
  `;
}

function formatDateTimeShort(iso) {
  const d = new Date(iso);
  const date = formatDateDisplay(d.toISOString().substring(0, 10));
  const time = String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
  return `${date} ${time}`;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function approveTransaction(txId) {
  const tx = STORE.transactions.find(t2 => t2.id === txId);
  if (!tx) return;
  tx.status = "approved";
  tx.approvedBy = currentUser.id;
  tx.approvedAt = nowISO();
  tx.history.push({ action: "approved", userId: currentUser.id, userName: currentUser.name, timestamp: nowISO() });

  addAuditLog({
    userId: currentUser.id, userName: currentUser.name,
    action: "approved", targetType: t("auditExpense"),
    detail: `${getCategoryById(tx.categoryId, "expense").name_vi} - ${formatCurrency(tx.amountUSD, "USD")}`
  });

  addNotification({
    type: "approved",
    txId: tx.id,
    message: `${formatCurrency(tx.amountUSD, "USD")} ${t("notifApproved")}`,
    forUserId: tx.createdBy,
  });

  checkBudgetExceeded(tx);

  persistDebounced();
  showToast(t("toastApproved"), "success");
  renderAll();
}

function openRejectModal(txId) {
  document.getElementById("modalReject").dataset.txId = txId;
  document.getElementById("rejectNote").value = "";
  openModal("modalReject");
}

function setupRejectModal() {
  document.getElementById("btnConfirmReject").addEventListener("click", () => {
    const txId = document.getElementById("modalReject").dataset.txId;
    const note = document.getElementById("rejectNote").value.trim();
    rejectTransaction(txId, note);
    closeModal("modalReject");
  });
}

function rejectTransaction(txId, note) {
  const tx = STORE.transactions.find(t2 => t2.id === txId);
  if (!tx) return;
  tx.status = "rejected";
  tx.approvedBy = currentUser.id;
  tx.approvedAt = nowISO();
  tx.approvalNote = note || null;
  tx.history.push({ action: "rejected", userId: currentUser.id, userName: currentUser.name, timestamp: nowISO() });

  addAuditLog({
    userId: currentUser.id, userName: currentUser.name,
    action: "rejected", targetType: t("auditExpense"),
    detail: `${getCategoryById(tx.categoryId, "expense").name_vi} - ${formatCurrency(tx.amountUSD, "USD")}`
  });

  addNotification({
    type: "rejected",
    txId: tx.id,
    message: `${formatCurrency(tx.amountUSD, "USD")} ${t("notifRejected")}`,
    forUserId: tx.createdBy,
  });

  persistDebounced();
  showToast(t("toastRejected"), "success");
  renderAll();
}

function checkBudgetExceeded(tx) {
  const mk = monthKey(tx.date);
  const budget = STORE.budgets[mk];
  if (!budget || !budget[tx.categoryId]) return;
  const spent = STORE.transactions
    .filter(t2 => t2.type === "expense" && monthKey(t2.date) === mk && t2.categoryId === tx.categoryId && (t2.status === "approved" || t2.status === "paid"))
    .reduce((s, t2) => s + t2.amountUSD, 0);
  if (spent > budget[tx.categoryId]) {
    const cat = getCategoryById(tx.categoryId, "expense");
    addNotification({
      type: "budget_exceeded",
      message: `${currentLang === "vi" ? cat.name_vi : cat.name_en} ${t("notifBudgetExceeded")}`,
      forSuperAdmin: true,
    });
  }
}

// ===================== BUDGET PAGE =====================
function renderBudgetPage() {
  document.getElementById("budgetSub").textContent = formatMonthLabel(currentDashMonth);
  document.getElementById("btnEditBudget").classList.toggle("hidden", !can("manageBudget"));

  const budget = STORE.budgets[currentDashMonth] || {};
  const card = document.getElementById("budgetCard");
  const cats = STORE.categories.expense;

  const hasBudget = Object.keys(budget).length > 0;
  if (!hasBudget) {
    card.innerHTML = `<div class="empty-state"><div class="ico">📊</div><p>${t("noBudgetSet")}</p></div>`;
    return;
  }

  const spentByCategory = {};
  cats.forEach(c => {
    spentByCategory[c.id] = STORE.transactions
      .filter(tx => tx.type === "expense" && monthKey(tx.date) === currentDashMonth && tx.categoryId === c.id && (tx.status === "approved" || tx.status === "paid"))
      .reduce((s, tx) => s + tx.amountUSD, 0);
  });

  card.innerHTML = cats.filter(c => budget[c.id] > 0).map(c => {
    const used = spentByCategory[c.id] || 0;
    const limit = budget[c.id];
    const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
    const realPct = limit > 0 ? (used / limit) * 100 : 0;
    let barClass = "ok";
    let warning = "";
    if (realPct >= 100) { barClass = "over"; warning = t("overLimit"); }
    else if (realPct >= 80) { barClass = "warn"; warning = t("nearLimit"); }

    const catName = currentLang === "vi" ? c.name_vi : c.name_en;
    return `
      <div class="budget-item">
        <div class="bh">
          <div class="cat">${c.icon} ${catName}</div>
          <div class="vals">${formatCurrency(used, "USD")} / ${formatCurrency(limit, "USD")} (${Math.round(realPct)}%)</div>
        </div>
        <div class="bar-track"><div class="bar-fill ${barClass}" style="width:${pct}%"></div></div>
        ${warning ? `<div class="budget-warn">${warning}</div>` : ""}
      </div>
    `;
  }).join("");
}

function setupBudgetModal() {
  document.getElementById("btnEditBudget").addEventListener("click", openBudgetModal);
  document.getElementById("btnSaveBudget").addEventListener("click", saveBudget);
}

function openBudgetModal() {
  const budget = STORE.budgets[currentDashMonth] || {};
  const cats = STORE.categories.expense;
  const grid = document.getElementById("budgetFormGrid");
  grid.innerHTML = cats.map(c => {
    const catName = currentLang === "vi" ? c.name_vi : c.name_en;
    return `
      <div class="form-group">
        <label>${c.icon} ${catName}</label>
        <input type="number" class="budget-input" data-cat="${c.id}" value="${budget[c.id] || ""}" placeholder="0" min="0" step="0.01">
      </div>
    `;
  }).join("");
  openModal("modalBudget");
}

function saveBudget() {
  const inputs = document.querySelectorAll(".budget-input");
  const budget = {};
  inputs.forEach(inp => {
    const val = parseFloat(inp.value);
    if (val > 0) budget[inp.dataset.cat] = val;
  });
  STORE.budgets[currentDashMonth] = budget;
  persistDebounced();
  closeModal("modalBudget");
  showToast(t("toastSaved"), "success");
  renderBudgetPage();
}

// ===================== GOALS PAGE =====================
let editingGoalId = null;

function renderGoalsPage() {
  document.getElementById("btnAddGoal").classList.toggle("hidden", !can("manageGoals"));
  const container = document.getElementById("goalsContent");
  if (!STORE.goals || STORE.goals.length === 0) {
    container.innerHTML = `<div class="empty-state"><div class="ico">🎯</div><p>${t("noGoals")}</p></div>`;
    return;
  }
  container.innerHTML = STORE.goals.map(g => {
    const pct = g.target > 0 ? Math.min(100, Math.round((g.saved / g.target) * 100)) : 0;
    const canManage = can("manageGoals");
    return `
      <div class="goal-card">
        <h4>${g.name}</h4>
        <div class="target">${t("target")}: ${formatCurrency(g.target, "USD")}</div>
        <div class="goal-progress-ring">
          <div class="goal-nums">
            <div class="saved">${formatCurrency(g.saved, "USD")}</div>
            <div class="of">${t("goalProgress")}: ${pct}%</div>
          </div>
          ${canManage ? `<button class="btn btn-sm btn-outline" onclick="openGoalModal('${g.id}')">${t("btnEditAction")}</button>` : ""}
        </div>
        <div class="bar-track" style="margin-top:10px;"><div class="bar-fill ok" style="width:${pct}%"></div></div>
      </div>
    `;
  }).join("");
}

function setupGoalModal() {
  document.getElementById("btnAddGoal").addEventListener("click", () => openGoalModal(null));
  document.getElementById("btnSaveGoal").addEventListener("click", saveGoal);
}

function openGoalModal(goalId) {
  editingGoalId = goalId;
  const goal = goalId ? STORE.goals.find(g => g.id === goalId) : null;
  document.getElementById("goalName").value = goal ? goal.name : "";
  document.getElementById("goalTarget").value = goal ? goal.target : "";
  document.getElementById("goalSaved").value = goal ? goal.saved : "0";
  openModal("modalGoal");
}

function saveGoal() {
  const name = document.getElementById("goalName").value.trim();
  const target = parseFloat(document.getElementById("goalTarget").value);
  const saved = parseFloat(document.getElementById("goalSaved").value) || 0;
  if (!name || !target || target <= 0) {
    showToast(t("toastFillRequired"), "error");
    return;
  }
  if (editingGoalId) {
    const g = STORE.goals.find(g2 => g2.id === editingGoalId);
    g.name = name; g.target = target; g.saved = saved;
  } else {
    STORE.goals.push({ id: genId("goal"), name, target, saved });
  }
  persistDebounced();
  closeModal("modalGoal");
  showToast(t("toastSaved"), "success");
  renderGoalsPage();
}

// ===================== ASSETS PAGE =====================
let editingAssetId = null;
const ASSET_ICONS = { cash: "💵", bank: "🏦", car: "🚗", house: "🏠", investment: "📈", other: "📦" };

function renderAssetsPage() {
  document.getElementById("btnAddAsset").classList.toggle("hidden", !can("manageAssets"));
  const card = document.getElementById("assetsCard");
  const assets = STORE.assets || [];
  const canManage = can("manageAssets");

  let html = "";
  if (assets.length === 0) {
    html = `<div class="empty-state"><div class="ico">🏦</div><p>${t("noAssets")}</p></div>`;
  } else {
    html = assets.map(a => `
      <div class="asset-row" ${canManage ? `onclick="openAssetModal('${a.id}')" style="cursor:pointer;"` : ""}>
        <div class="name"><span class="ic">${ASSET_ICONS[a.type] || "📦"}</span> ${a.name}</div>
        <div class="val">${formatCurrency(a.value, "USD")}</div>
      </div>
    `).join("");
  }

  const total = assets.reduce((s, a) => s + (a.value || 0), 0);
  html += `
    <div class="net-worth-total">
      <div class="lbl">${t("netWorth")}</div>
      <div class="val">${formatCurrency(total, "USD")}</div>
    </div>
  `;
  card.innerHTML = html;
}

function setupAssetModal() {
  document.getElementById("btnAddAsset").addEventListener("click", () => openAssetModal(null));
  document.getElementById("btnSaveAsset").addEventListener("click", saveAsset);
}

function openAssetModal(assetId) {
  editingAssetId = assetId;
  const asset = assetId ? STORE.assets.find(a => a.id === assetId) : null;
  document.getElementById("assetName").value = asset ? asset.name : "";
  document.getElementById("assetType").value = asset ? asset.type : "cash";
  document.getElementById("assetValue").value = asset ? asset.value : "";
  openModal("modalAsset");
}

function saveAsset() {
  const name = document.getElementById("assetName").value.trim();
  const type = document.getElementById("assetType").value;
  const value = parseFloat(document.getElementById("assetValue").value) || 0;
  if (!name) {
    showToast(t("toastFillRequired"), "error");
    return;
  }
  if (editingAssetId) {
    const a = STORE.assets.find(a2 => a2.id === editingAssetId);
    a.name = name; a.type = type; a.value = value;
  } else {
    STORE.assets.push({ id: genId("asset"), name, type, value });
  }
  persistDebounced();
  closeModal("modalAsset");
  showToast(t("toastSaved"), "success");
  renderAssetsPage();
}

// ===================== MEMBERS PAGE =====================
function renderMembersPage() {
  document.getElementById("membersSub").textContent = formatMonthLabel(currentDashMonth);

  // Spending by member for current month
  const spendingByMember = {};
  STORE.transactions
    .filter(tx => tx.type === "expense" && monthKey(tx.date) === currentDashMonth && (tx.status === "approved" || tx.status === "paid"))
    .forEach(tx => {
      spendingByMember[tx.paidBy] = (spendingByMember[tx.paidBy] || 0) + tx.amountUSD;
    });

  const activeUsers = STORE.users.filter(u => u.active !== false);
  const spendList = document.getElementById("memberSpendingList");
  const sorted = activeUsers.slice().sort((a, b) => (spendingByMember[b.id] || 0) - (spendingByMember[a.id] || 0));
  spendList.innerHTML = sorted.map(u => `
    <div class="member-row">
      <div class="member-avatar">${u.name.charAt(0).toUpperCase()}</div>
      <div class="member-info">
        <div class="nm">${u.name}${u.id === currentUser.id ? " (" + t("you") + ")" : ""}</div>
        <div class="role-tag">${roleLabel(u.role)}</div>
      </div>
      <div class="member-amt">${formatCurrency(spendingByMember[u.id] || 0, "USD")}</div>
    </div>
  `).join("");

  // Member list (with roles) - same as spending list essentially, but maybe show all incl inactive for super admin
  const memberListCard = document.getElementById("memberListCard");
  if (!isSuperAdmin()) {
    memberListCard.classList.add("hidden");
  } else {
    memberListCard.classList.remove("hidden");
    const allUsers = STORE.users;
    document.getElementById("memberList").innerHTML = allUsers.map(u => `
      <div class="member-row">
        <div class="member-avatar" style="${u.active === false ? "opacity:.4;" : ""}">${u.name.charAt(0).toUpperCase()}</div>
        <div class="member-info">
          <div class="nm">${u.name} ${u.active === false ? "<span class='text-muted'>(" + (currentLang==='vi'?'Đã khóa':'Inactive') + ")</span>" : ""}</div>
          <div class="role-tag">${roleLabel(u.role)} • ${u.email}</div>
        </div>
      </div>
    `).join("");
  }
}

// ===================== REPORTS PAGE =====================
function renderReportsPage() {
  document.getElementById("reportsSub").textContent = formatMonthLabel(currentDashMonth);
  const summary = calcMonthSummary(currentDashMonth);
  const savingRate = summary.income > 0 ? Math.round((summary.saving / summary.income) * 100) : 0;

  document.getElementById("reportSummaryCard").innerHTML = `
    <h3>${t("monthlyReview")} — ${formatMonthLabel(currentDashMonth)}</h3>
    <div class="cat-row"><div class="name">${t("totalIncome")}</div><div class="pct" style="color:var(--good)">${formatCurrency(summary.income, "USD")}</div></div>
    <div class="cat-row"><div class="name">${t("totalExpense")}</div><div class="pct" style="color:var(--bad)">${formatCurrency(summary.income - summary.saving, "USD")}</div></div>
    <div class="cat-row"><div class="name">${t("approvedExpense")}</div><div class="pct">${formatCurrency(summary.expense, "USD")}</div></div>
    <div class="cat-row"><div class="name">${t("pendingExpense")}</div><div class="pct" style="color:var(--warn)">${formatCurrency(summary.pendingExpense, "USD")}</div></div>
    <div class="cat-row"><div class="name">${t("savingRate")}</div><div class="pct" style="color:var(--forest)">${savingRate}%</div></div>
  `;

  const exportSection = document.querySelectorAll("#page-reports .card")[1];
  if (!can("exportReports")) {
    exportSection.classList.add("hidden");
  } else {
    exportSection.classList.remove("hidden");
  }
}

// ===================== SETTINGS PAGE =====================
function renderSettingsPage() {
  document.getElementById("settingsUserInfo").textContent = `${currentUser.name} • ${roleLabel(currentUser.role)}`;

  const showAdminSections = isSuperAdmin();
  document.getElementById("approvalLimitsSection").classList.toggle("hidden", !showAdminSections);
  document.getElementById("categoryMgmtSection").classList.toggle("hidden", !showAdminSections);
  document.getElementById("userMgmtSection").classList.toggle("hidden", !showAdminSections);

  // settings -> rates
  document.getElementById("primaryCurrencySelect").value = STORE.settings.primaryCurrency || "USD";
  document.getElementById("rateKHR").value = STORE.settings.rateKHR || 4100;
  document.getElementById("rateVND").value = STORE.settings.rateVND || 25400;

  if (showAdminSections) {
    document.getElementById("limitAuto").value = STORE.settings.limitAuto || 100;
    document.getElementById("limitSuper").value = STORE.settings.limitSuper || 500;
    renderCategoryMgmt();
    renderUserMgmt();
  }

  renderAuditLog();
}

function renderCategoryMgmt() {
  const container = document.getElementById("categoryMgmtList");
  const allCats = [
    ...STORE.categories.expense.map(c => ({ ...c, kind: "expense" })),
    ...STORE.categories.income.map(c => ({ ...c, kind: "income" })),
  ];
  container.innerHTML = allCats.map(c => `
    <div class="settings-row">
      <div class="lbl">${c.icon} ${currentLang === "vi" ? c.name_vi : c.name_en} <span class="text-muted" style="font-size:11px;">(${c.kind === "expense" ? t("typeExpense") : t("typeIncome")})</span></div>
    </div>
  `).join("");
}

function setupCategoryHandlers() {
  document.getElementById("btnAddCategory").addEventListener("click", () => {
    const name = document.getElementById("newCategoryName").value.trim();
    if (!name) return;
    STORE.categories.expense.push({
      id: genId("cat"), name_vi: name, name_en: name, icon: "📦"
    });
    document.getElementById("newCategoryName").value = "";
    persistDebounced();
    showToast(t("categoryAdded"), "success");
    renderCategoryMgmt();
  });
}

function renderUserMgmt() {
  const container = document.getElementById("userMgmtList");
  container.innerHTML = STORE.users.map(u => `
    <div class="settings-row">
      <div>
        <div class="lbl">${u.name} ${u.id === currentUser.id ? "<span class='role-badge'>" + t("you") + "</span>" : ""}</div>
        <div class="sub">${u.email} • ${roleLabel(u.role)}</div>
      </div>
      ${u.role !== "superadmin" ? `
        <button class="btn btn-sm btn-outline" onclick="toggleUserActive('${u.id}')">${u.active === false ? t("activate") : t("deactivate")}</button>
      ` : ""}
    </div>
  `).join("");
}

function toggleUserActive(userId) {
  const u = STORE.users.find(u2 => u2.id === userId);
  if (!u) return;
  u.active = u.active === false ? true : false;
  persistDebounced();
  renderUserMgmt();
  showToast(t("toastSaved"), "success");
}

function setupUserModal() {
  document.getElementById("btnAddUser").addEventListener("click", () => openModal("modalUser"));
  document.getElementById("btnSaveUser").addEventListener("click", saveNewUser);
}

function saveNewUser() {
  const name = document.getElementById("newUserName").value.trim();
  const email = document.getElementById("newUserEmail").value.trim().toLowerCase();
  const password = document.getElementById("newUserPassword").value;
  const role = document.getElementById("newUserRole").value;

  if (!name || !email || !password) {
    showToast(t("toastFillRequired"), "error");
    return;
  }
  if (STORE.users.some(u => u.email.toLowerCase() === email)) {
    showToast(currentLang === "vi" ? "Email đã tồn tại" : "Email already exists", "error");
    return;
  }
  STORE.users.push({
    id: genId("user"), name, email, password, role, active: true
  });
  addAuditLog({
    userId: currentUser.id, userName: currentUser.name,
    action: "created", targetType: currentLang === "vi" ? "thành viên" : "member",
    detail: `${name} (${roleLabel(role)})`
  });
  persistDebounced();
  closeModal("modalUser");
  document.getElementById("newUserName").value = "";
  document.getElementById("newUserEmail").value = "";
  document.getElementById("newUserPassword").value = "";
  showToast(t("toastUserAdded"), "success");
  renderUserMgmt();
}

function renderAuditLog() {
  const card = document.getElementById("auditLogCard");
  const logs = (STORE.auditLog || []).slice(0, 15);
  if (logs.length === 0) {
    card.innerHTML = `<div class="empty-state" style="padding:16px;"><p>${currentLang === "vi" ? "Chưa có hoạt động nào" : "No activity yet"}</p></div>`;
    return;
  }
  card.innerHTML = logs.map(log => `
    <div class="history-item">
      <div class="dot"></div>
      <div>${formatDateTimeShort(log.timestamp)} — <b>${log.userName}</b> ${t("audit" + capitalize(log.action))} ${log.targetType}: ${log.detail}</div>
    </div>
  `).join("");
}

function setupSettingsHandlers() {
  document.getElementById("btnSaveRates").addEventListener("click", () => {
    STORE.settings.primaryCurrency = document.getElementById("primaryCurrencySelect").value;
    STORE.settings.rateKHR = parseFloat(document.getElementById("rateKHR").value) || 4100;
    STORE.settings.rateVND = parseFloat(document.getElementById("rateVND").value) || 25400;
    persistDebounced();
    showToast(t("settingsSavedRates"), "success");
    renderAll();
  });

  document.getElementById("btnSaveLimits").addEventListener("click", () => {
    STORE.settings.limitAuto = parseFloat(document.getElementById("limitAuto").value) || 100;
    STORE.settings.limitSuper = parseFloat(document.getElementById("limitSuper").value) || 500;
    persistDebounced();
    showToast(t("settingsSavedLimits"), "success");
  });

  document.getElementById("btnLogout").addEventListener("click", logout);

  setupCategoryHandlers();
}

// ===================== STATIC MODAL SETUP =====================
function setupModalsStatic() {
  // nothing extra needed currently; placeholder for future static bindings
}

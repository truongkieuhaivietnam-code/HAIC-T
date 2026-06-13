// ===================== report.js =====================

function setupExportButtons() {
  document.getElementById("btnExportExcel").addEventListener("click", exportExcel);
  document.getElementById("btnExportPdf").addEventListener("click", exportPdf);
}

function getMonthTxRows() {
  const txs = STORE.transactions
    .filter(tx => monthKey(tx.date) === currentDashMonth)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  return txs.map(tx => {
    const cat = getCategoryById(tx.categoryId, tx.type);
    return {
      [currentLang === "vi" ? "Ngày" : "Date"]: formatDateDisplay(tx.date),
      [currentLang === "vi" ? "Loại" : "Type"]: tx.type === "income" ? t("typeIncome") : t("typeExpense"),
      [currentLang === "vi" ? "Danh mục" : "Category"]: currentLang === "vi" ? cat.name_vi : cat.name_en,
      [currentLang === "vi" ? "Số tiền (USD)" : "Amount (USD)"]: Math.round(tx.amountUSD * 100) / 100,
      [currentLang === "vi" ? "Người thanh toán" : "Paid By"]: getUserById(tx.paidBy).name,
      [currentLang === "vi" ? "Người tạo" : "Created By"]: getUserById(tx.createdBy).name,
      [currentLang === "vi" ? "Trạng thái" : "Status"]: t("status" + capitalize(tx.status)),
      [currentLang === "vi" ? "Ghi chú" : "Note"]: tx.note || "",
    };
  });
}

function exportExcel() {
  const rows = getMonthTxRows();
  if (rows.length === 0) {
    showToast(t("emptyTx"), "error");
    return;
  }
  const summary = calcMonthSummary(currentDashMonth);
  const summaryRows = [
    { [currentLang === "vi" ? "Mục" : "Item"]: t("totalIncome"), [currentLang === "vi" ? "Giá trị (USD)" : "Value (USD)"]: Math.round(summary.income * 100) / 100 },
    { [currentLang === "vi" ? "Mục" : "Item"]: t("totalExpense"), [currentLang === "vi" ? "Giá trị (USD)" : "Value (USD)"]: Math.round((summary.income - summary.saving) * 100) / 100 },
    { [currentLang === "vi" ? "Mục" : "Item"]: t("approvedExpense"), [currentLang === "vi" ? "Giá trị (USD)" : "Value (USD)"]: Math.round(summary.expense * 100) / 100 },
    { [currentLang === "vi" ? "Mục" : "Item"]: t("pendingExpense"), [currentLang === "vi" ? "Giá trị (USD)" : "Value (USD)"]: Math.round(summary.pendingExpense * 100) / 100 },
    { [currentLang === "vi" ? "Mục" : "Item"]: t("lblSaving"), [currentLang === "vi" ? "Giá trị (USD)" : "Value (USD)"]: Math.round(summary.saving * 100) / 100 },
  ];

  const wb = XLSX.utils.book_new();
  const wsTx = XLSX.utils.json_to_sheet(rows);
  const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
  XLSX.utils.book_append_sheet(wb, wsSummary, currentLang === "vi" ? "Tổng kết" : "Summary");
  XLSX.utils.book_append_sheet(wb, wsTx, currentLang === "vi" ? "Giao dịch" : "Transactions");

  const filename = `FamilyFinance_${currentDashMonth}.xlsx`;
  XLSX.writeFile(wb, filename);
  showToast(t("toastSaved"), "success");
}

function exportPdf() {
  const rows = getMonthTxRows();
  if (rows.length === 0) {
    showToast(t("emptyTx"), "error");
    return;
  }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const summary = calcMonthSummary(currentDashMonth);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Family Finance Report", 14, 18);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(formatMonthLabel(currentDashMonth), 14, 26);

  doc.setFontSize(10);
  let y = 38;
  const lines = [
    `${t("totalIncome")}: ${formatCurrency(summary.income, "USD")}`,
    `${t("approvedExpense")}: ${formatCurrency(summary.expense, "USD")}`,
    `${t("pendingExpense")}: ${formatCurrency(summary.pendingExpense, "USD")}`,
    `${t("lblSaving")}: ${formatCurrency(summary.saving, "USD")}`,
  ];
  lines.forEach(line => { doc.text(line, 14, y); y += 6; });

  y += 6;
  doc.setFont("helvetica", "bold");
  doc.text(currentLang === "vi" ? "Giao dịch" : "Transactions", 14, y);
  y += 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);

  const colWidths = [22, 18, 32, 24, 28, 20];
  const headers = currentLang === "vi"
    ? ["Ngày", "Loại", "Danh mục", "Số tiền", "Thanh toán", "Trạng thái"]
    : ["Date", "Type", "Category", "Amount", "Paid By", "Status"];

  let x = 14;
  headers.forEach((h, i) => { doc.text(h, x, y); x += colWidths[i]; });
  y += 5;
  doc.line(14, y - 2, 196, y - 2);

  const txs = STORE.transactions.filter(tx => monthKey(tx.date) === currentDashMonth).sort((a,b) => new Date(a.date) - new Date(b.date));
  txs.forEach(tx => {
    if (y > 280) { doc.addPage(); y = 18; }
    const cat = getCategoryById(tx.categoryId, tx.type);
    const catName = currentLang === "vi" ? cat.name_vi : cat.name_en;
    x = 14;
    const cells = [
      formatDateDisplay(tx.date),
      tx.type === "income" ? t("typeIncome") : t("typeExpense"),
      catName.substring(0, 16),
      formatCurrency(tx.amountUSD, "USD"),
      getUserById(tx.paidBy).name.substring(0, 14),
      t("status" + capitalize(tx.status)),
    ];
    cells.forEach((c, i) => { doc.text(String(c), x, y); x += colWidths[i]; });
    y += 5.5;
  });

  doc.save(`FamilyFinance_${currentDashMonth}.pdf`);
  showToast(t("toastSaved"), "success");
}

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

// ===================== i18n.js =====================
const I18N = {
  vi: {
    appName: "Family Finance",
    appTagline: "Quản lý tài chính gia đình thông minh",
    lblEmail: "Email",
    lblPassword: "Mật khẩu",
    btnLogin: "Đăng nhập",
    navDashboard: "Tổng quan",
    navTransactions: "Giao dịch",
    navApprovals: "Phê duyệt",
    navBudget: "Ngân sách",
    navGoals: "Mục tiêu",
    navAssets: "Tài sản",
    navMembers: "Thành viên",
    navReports: "Báo cáo",
    navSettings: "Cài đặt",
    navMore: "Thêm",
    lblIncome: "Thu nhập",
    lblExpense: "Chi tiêu",
    lblSaving: "Tiết kiệm",
    cardExpenseByCategory: "Chi tiêu theo danh mục",
    cardMonthlyTrend: "Xu hướng theo tháng",
    cardRecentTx: "Giao dịch gần đây",
    seeAll: "Xem tất cả",
    txSub: "Tất cả thu chi của gia đình",
    emptyTx: "Chưa có giao dịch nào",
    approvalSub: "Yêu cầu chi tiêu cần duyệt",
    apPending: "Đang chờ",
    apHistory: "Lịch sử",
    btnEdit: "Sửa",
    btnAdd: "+ Thêm",
    btnAddUser: "+ Thêm thành viên",
    goalsSub: "Tiết kiệm cho tương lai gia đình",
    assetsSub: "Tổng tài sản gia đình",
    cardSpendingByMember: "Chi tiêu theo thành viên",
    cardFamilyMembers: "Thành viên gia đình",
    cardExportData: "Xuất dữ liệu",
    btnExportExcel: "📊 Excel",
    btnExportPdf: "📄 PDF",
    setGeneral: "Chung",
    setCurrency: "Đơn vị tiền tệ hiển thị",
    setCurrencySub: "Đơn vị chính cho dashboard",
    setRateKHR: "Tỷ giá 1 USD = ? KHR",
    setRateVND: "Tỷ giá 1 USD = ? VND",
    btnSave: "Lưu",
    setApprovalLimits: "Hạn mức phê duyệt",
    setAutoLimit: "Tự động duyệt nếu dưới",
    setSuperLimit: "Cần Super Admin duyệt nếu từ",
    setCategories: "Danh mục",
    setUsers: "Quản lý người dùng",
    setAuditLog: "Lịch sử hệ thống",
    btnLogout: "Đăng xuất",
    txModalAdd: "Thêm giao dịch",
    txModalEdit: "Sửa giao dịch",
    lblType: "Loại giao dịch",
    typeExpense: "Chi tiêu",
    typeIncome: "Thu nhập",
    lblDate: "Ngày",
    lblCategory: "Danh mục",
    lblAmount: "Số tiền",
    lblPaidBy: "Người thanh toán",
    lblNote: "Ghi chú",
    lblReceipt: "Ảnh hóa đơn",
    lblReceiptUpload: "📷 Chọn ảnh hóa đơn (tùy chọn)",
    budgetModalTitle: "Đặt ngân sách tháng",
    goalModalTitle: "Thêm mục tiêu tiết kiệm",
    lblGoalName: "Tên mục tiêu",
    lblGoalTarget: "Số tiền mục tiêu ($)",
    lblGoalSaved: "Đã tiết kiệm ($)",
    assetModalTitle: "Thêm tài sản",
    lblAssetName: "Tên tài sản",
    lblAssetType: "Loại",
    assetCash: "Tiền mặt",
    assetBank: "Tài khoản ngân hàng",
    assetCar: "Xe",
    assetHouse: "Nhà / Bất động sản",
    assetInvestment: "Đầu tư",
    assetOther: "Khác",
    lblAssetValue: "Giá trị ($)",
    userModalTitle: "Thêm thành viên",
    lblUserName: "Tên",
    lblUserEmail: "Email",
    lblUserPassword: "Mật khẩu",
    lblUserRole: "Vai trò",
    roleAdmin: "Admin",
    roleMember: "Member",
    roleSuperAdmin: "Super Admin",
    rejectModalTitle: "Lý do từ chối",
    lblRejectNote: "Ghi chú (tùy chọn)",
    btnConfirmReject: "Xác nhận từ chối",
    // dynamic
    totalBalance: "Tổng số dư",
    pendingApprovalTitle: "Yêu cầu chờ duyệt",
    pendingApprovalSub: "yêu cầu",
    statusDraft: "Nháp",
    statusPending: "Chờ duyệt",
    statusApproved: "Đã duyệt",
    statusRejected: "Đã từ chối",
    statusPaid: "Đã thanh toán",
    autoApproved: "Sẽ được tự động duyệt",
    needApproval: "Cần phê duyệt",
    needSuperApproval: "Cần Super Admin duyệt",
    btnApprove: "✓ Duyệt",
    btnReject: "✕ Từ chối",
    noApprovalsPending: "Không có yêu cầu chờ duyệt",
    noApprovalsHistory: "Chưa có lịch sử phê duyệt",
    createdBy: "Người tạo",
    approvedBy: "Người duyệt",
    approvalNote: "Ghi chú duyệt",
    notifNewRequest: "Yêu cầu chi tiêu mới",
    notifApproved: "đã được duyệt",
    notifRejected: "đã bị từ chối",
    notifBudgetExceeded: "vượt ngân sách",
    auditCreated: "đã tạo",
    auditApproved: "đã duyệt",
    auditRejected: "đã từ chối",
    auditEdited: "đã sửa",
    auditDeleted: "đã xóa",
    auditExpense: "chi tiêu",
    auditIncome: "thu nhập",
    budgetUsed: "Đã dùng",
    nearLimit: "⚠️ Sắp đạt hạn mức",
    overLimit: "⚠️ Đã vượt ngân sách",
    noBudgetSet: "Chưa có ngân sách. Nhấn Sửa để thiết lập.",
    goalProgress: "Hoàn thành",
    target: "Mục tiêu",
    noGoals: "Chưa có mục tiêu tiết kiệm nào",
    netWorth: "Tổng tài sản (Net Worth)",
    noAssets: "Chưa có tài sản nào",
    monthlyReview: "Tổng kết tháng",
    totalIncome: "Tổng thu nhập",
    totalExpense: "Tổng chi tiêu",
    approvedExpense: "Chi tiêu đã duyệt",
    pendingExpense: "Đang chờ duyệt",
    savingRate: "Tỷ lệ tiết kiệm",
    toastSaved: "Đã lưu thành công",
    toastDeleted: "Đã xóa",
    toastApproved: "Đã duyệt giao dịch",
    toastRejected: "Đã từ chối giao dịch",
    toastLoginError: "Email hoặc mật khẩu không đúng",
    toastFillRequired: "Vui lòng nhập đầy đủ thông tin",
    toastUserAdded: "Đã thêm thành viên",
    confirmDelete: "Bạn có chắc muốn xóa?",
    btnDelete: "Xóa",
    btnEditAction: "Sửa",
    deactivate: "Vô hiệu hóa",
    activate: "Kích hoạt",
    you: "Bạn",
    txStatusInfo: "Trạng thái sau khi lưu",
    monthLabel: "Tháng",
    foodCat: "Ăn uống",
    transportCat: "Đi lại",
    educationCat: "Giáo dục",
    shoppingCat: "Mua sắm",
    healthCat: "Y tế",
    utilitiesCat: "Hóa đơn / Điện nước",
    entertainmentCat: "Giải trí",
    otherCat: "Khác",
    salaryCat: "Lương",
    bonusCat: "Thưởng",
    investmentCat: "Đầu tư",
    giftCat: "Quà tặng",
    settingsSavedRates: "Đã lưu tỷ giá",
    settingsSavedLimits: "Đã lưu hạn mức phê duyệt",
    categoryAdded: "Đã thêm danh mục",
    superAdminLabel: "Super Admin",
    welcomeBack: "Chào",
  },
  en: {
    appName: "Family Finance",
    appTagline: "Smart family finance management",
    lblEmail: "Email",
    lblPassword: "Password",
    btnLogin: "Sign In",
    navDashboard: "Dashboard",
    navTransactions: "Transactions",
    navApprovals: "Approvals",
    navBudget: "Budget",
    navGoals: "Goals",
    navAssets: "Assets",
    navMembers: "Members",
    navReports: "Reports",
    navSettings: "Settings",
    navMore: "More",
    lblIncome: "Income",
    lblExpense: "Expense",
    lblSaving: "Saving",
    cardExpenseByCategory: "Expense by Category",
    cardMonthlyTrend: "Monthly Trend",
    cardRecentTx: "Recent Transactions",
    seeAll: "See all",
    txSub: "All family income and expenses",
    emptyTx: "No transactions yet",
    approvalSub: "Expense requests needing approval",
    apPending: "Pending",
    apHistory: "History",
    btnEdit: "Edit",
    btnAdd: "+ Add",
    btnAddUser: "+ Add Member",
    goalsSub: "Saving for the family's future",
    assetsSub: "Total family assets",
    cardSpendingByMember: "Spending by Member",
    cardFamilyMembers: "Family Members",
    cardExportData: "Export Data",
    btnExportExcel: "📊 Excel",
    btnExportPdf: "📄 PDF",
    setGeneral: "General",
    setCurrency: "Display Currency",
    setCurrencySub: "Primary currency for dashboard",
    setRateKHR: "Exchange rate 1 USD = ? KHR",
    setRateVND: "Exchange rate 1 USD = ? VND",
    btnSave: "Save",
    setApprovalLimits: "Approval Limits",
    setAutoLimit: "Auto-approve if under",
    setSuperLimit: "Super Admin approval required from",
    setCategories: "Categories",
    setUsers: "User Management",
    setAuditLog: "Audit Log",
    btnLogout: "Log Out",
    txModalAdd: "Add Transaction",
    txModalEdit: "Edit Transaction",
    lblType: "Transaction Type",
    typeExpense: "Expense",
    typeIncome: "Income",
    lblDate: "Date",
    lblCategory: "Category",
    lblAmount: "Amount",
    lblPaidBy: "Paid By",
    lblNote: "Note",
    lblReceipt: "Receipt Image",
    lblReceiptUpload: "📷 Choose receipt image (optional)",
    budgetModalTitle: "Set Monthly Budget",
    goalModalTitle: "Add Saving Goal",
    lblGoalName: "Goal Name",
    lblGoalTarget: "Target Amount ($)",
    lblGoalSaved: "Saved Amount ($)",
    assetModalTitle: "Add Asset",
    lblAssetName: "Asset Name",
    lblAssetType: "Type",
    assetCash: "Cash",
    assetBank: "Bank Account",
    assetCar: "Car",
    assetHouse: "House / Real Estate",
    assetInvestment: "Investment",
    assetOther: "Other",
    lblAssetValue: "Value ($)",
    userModalTitle: "Add Member",
    lblUserName: "Name",
    lblUserEmail: "Email",
    lblUserPassword: "Password",
    lblUserRole: "Role",
    roleAdmin: "Admin",
    roleMember: "Member",
    roleSuperAdmin: "Super Admin",
    rejectModalTitle: "Reject Reason",
    lblRejectNote: "Note (optional)",
    btnConfirmReject: "Confirm Reject",
    totalBalance: "Total Balance",
    pendingApprovalTitle: "Pending Approval",
    pendingApprovalSub: "requests",
    statusDraft: "Draft",
    statusPending: "Pending Approval",
    statusApproved: "Approved",
    statusRejected: "Rejected",
    statusPaid: "Paid",
    autoApproved: "Will be auto-approved",
    needApproval: "Needs Approval",
    needSuperApproval: "Needs Super Admin Approval",
    btnApprove: "✓ Approve",
    btnReject: "✕ Reject",
    noApprovalsPending: "No pending approvals",
    noApprovalsHistory: "No approval history yet",
    createdBy: "Created By",
    approvedBy: "Approved By",
    approvalNote: "Approval Note",
    notifNewRequest: "New expense approval request",
    notifApproved: "was approved",
    notifRejected: "was rejected",
    notifBudgetExceeded: "exceeded budget",
    auditCreated: "created",
    auditApproved: "approved",
    auditRejected: "rejected",
    auditEdited: "edited",
    auditDeleted: "deleted",
    auditExpense: "expense",
    auditIncome: "income",
    budgetUsed: "Used",
    nearLimit: "⚠️ Near limit",
    overLimit: "⚠️ Over budget",
    noBudgetSet: "No budget set. Tap Edit to configure.",
    goalProgress: "Progress",
    target: "Target",
    noGoals: "No saving goals yet",
    netWorth: "Total Net Worth",
    noAssets: "No assets yet",
    monthlyReview: "Monthly Review",
    totalIncome: "Total Income",
    totalExpense: "Total Expense",
    approvedExpense: "Approved Expense",
    pendingExpense: "Pending",
    savingRate: "Saving Rate",
    toastSaved: "Saved successfully",
    toastDeleted: "Deleted",
    toastApproved: "Transaction approved",
    toastRejected: "Transaction rejected",
    toastLoginError: "Incorrect email or password",
    toastFillRequired: "Please fill in all required fields",
    toastUserAdded: "Member added",
    confirmDelete: "Are you sure you want to delete?",
    btnDelete: "Delete",
    btnEditAction: "Edit",
    deactivate: "Deactivate",
    activate: "Activate",
    you: "You",
    txStatusInfo: "Status after saving",
    monthLabel: "Month",
    foodCat: "Food",
    transportCat: "Transport",
    educationCat: "Education",
    shoppingCat: "Shopping",
    healthCat: "Health",
    utilitiesCat: "Utilities",
    entertainmentCat: "Entertainment",
    otherCat: "Other",
    salaryCat: "Salary",
    bonusCat: "Bonus",
    investmentCat: "Investment",
    giftCat: "Gift",
    settingsSavedRates: "Exchange rates saved",
    settingsSavedLimits: "Approval limits saved",
    categoryAdded: "Category added",
    superAdminLabel: "Super Admin",
    welcomeBack: "Hello",
  }
};

let currentLang = localStorage.getItem('ff_lang') || 'vi';

function t(key) {
  return (I18N[currentLang] && I18N[currentLang][key]) || (I18N.vi[key]) || key;
}

function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    el.textContent = t(key);
  });
  document.documentElement.lang = currentLang;
  const btnLang = document.getElementById('btnLang');
  if (btnLang) btnLang.textContent = currentLang === 'vi' ? 'EN' : 'VI';
}

function toggleLang() {
  currentLang = currentLang === 'vi' ? 'en' : 'vi';
  localStorage.setItem('ff_lang', currentLang);
  applyTranslations();
  if (typeof renderAll === 'function') renderAll();
}

<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
<title>Family Finance Manager</title>
<script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js"></script>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
<style>
:root{
  --ink:#1c2b29;
  --forest:#163832;
  --forest-light:#2a5048;
  --gold:#d9a440;
  --gold-soft:#f2dca8;
  --cream:#faf6ee;
  --paper:#fffdf8;
  --line:#e4ddcd;
  --good:#3f7d5c;
  --warn:#c97c2e;
  --bad:#b54b3f;
  --muted:#8a8174;
  --radius:14px;
  --shadow:0 2px 12px rgba(28,43,41,0.07);
  font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
}
*{box-sizing:border-box; -webkit-tap-highlight-color:transparent;}
body{margin:0; background:var(--cream); color:var(--ink); min-height:100vh; -webkit-font-smoothing:antialiased;}
h1,h2,h3,h4{font-family:'Source Serif 4','Georgia',serif; margin:0; letter-spacing:-0.01em;}
button{font-family:inherit; cursor:pointer; border:none;}
input,select,textarea{font-family:inherit; font-size:15px;}
a{color:inherit;}

/* ===== LOGIN ===== */
#loginScreen{
  min-height:100vh; display:flex; align-items:center; justify-content:center;
  background:linear-gradient(160deg,var(--forest) 0%, #0e2521 100%);
  padding:24px;
}
.login-card{
  background:var(--paper); border-radius:20px; padding:40px 32px;
  width:100%; max-width:380px; box-shadow:0 20px 60px rgba(0,0,0,0.25);
  text-align:center; position:relative; overflow:hidden;
}
.login-card::before{
  content:""; position:absolute; top:-60px; right:-60px; width:140px; height:140px;
  background:var(--gold-soft); border-radius:50%; opacity:0.5;
}
.login-mark{
  font-family:'Source Serif 4',serif; font-size:30px; font-weight:700; color:var(--forest);
  width:60px; height:60px; border:2px solid var(--forest); border-radius:50%;
  display:flex; align-items:center; justify-content:center; margin:0 auto 18px;
  position:relative; z-index:1;
}
.login-card h1{font-size:24px; color:var(--forest); position:relative; z-index:1;}
.login-card p.tag{color:var(--muted); font-size:13px; margin:6px 0 28px; position:relative; z-index:1;}
.field{margin-bottom:14px; text-align:left; position:relative; z-index:1;}
.field label{display:block; font-size:12px; font-weight:600; color:var(--forest); margin-bottom:6px; text-transform:uppercase; letter-spacing:.05em;}
.field input{width:100%; padding:12px 14px; border:1.5px solid var(--line); border-radius:10px; background:var(--cream); transition:.15s;}
.field input:focus{outline:none; border-color:var(--gold);}
.btn-primary{
  width:100%; padding:13px; background:var(--forest); color:#fff; border-radius:10px;
  font-weight:600; font-size:15px; margin-top:8px; transition:.15s; position:relative; z-index:1;
}
.btn-primary:active{transform:scale(.98); background:var(--forest-light);}
.login-error{color:var(--bad); font-size:13px; margin-top:10px; min-height:18px; position:relative; z-index:1;}
.demo-note{font-size:11px; color:var(--muted); margin-top:18px; position:relative; z-index:1; line-height:1.6;}

/* ===== APP SHELL ===== */
#app{display:none; min-height:100vh; padding-bottom:74px;}
.topbar{
  background:var(--forest); color:#fff; padding:14px 16px;
  display:flex; align-items:center; justify-content:space-between; position:sticky; top:0; z-index:50;
  box-shadow:0 2px 10px rgba(0,0,0,0.15);
}
.topbar .brand{display:flex; align-items:center; gap:10px;}
.topbar .brand .mark{
  width:34px; height:34px; border:1.5px solid var(--gold); border-radius:50%; display:flex; align-items:center; justify-content:center;
  font-family:'Source Serif 4',serif; font-weight:700; font-size:15px; color:var(--gold);
}
.topbar .brand-text h1{font-size:15px; color:#fff; line-height:1.2;}
.topbar .brand-text span{font-size:11px; color:var(--gold-soft);}
.topbar-actions{display:flex; align-items:center; gap:10px;}
.icon-btn{
  background:rgba(255,255,255,0.08); color:#fff; width:36px; height:36px; border-radius:10px;
  display:flex; align-items:center; justify-content:center; font-size:16px; position:relative; transition:.15s;
}
.icon-btn:active{background:rgba(255,255,255,0.18);}
.badge{
  position:absolute; top:-4px; right:-4px; background:var(--bad); color:#fff; font-size:10px; font-weight:700;
  min-width:16px; height:16px; border-radius:8px; display:flex; align-items:center; justify-content:center; padding:0 3px;
}
.lang-toggle{
  background:rgba(255,255,255,0.08); color:#fff; padding:7px 11px; border-radius:10px; font-size:12px; font-weight:700; letter-spacing:.04em;
}

main{padding:16px; max-width:880px; margin:0 auto;}

/* page title */
.page-head{display:flex; align-items:center; justify-content:space-between; margin-bottom:16px; flex-wrap:wrap; gap:10px;}
.page-head h2{font-size:21px; color:var(--forest);}
.page-head .sub{font-size:12.5px; color:var(--muted); margin-top:2px;}

/* ===== DASHBOARD ===== */
.hero-card{
  background:linear-gradient(135deg,var(--forest) 0%, var(--forest-light) 100%); color:#fff;
  border-radius:var(--radius); padding:22px; margin-bottom:14px; position:relative; overflow:hidden;
}
.hero-card::after{
  content:""; position:absolute; bottom:-40px; right:-40px; width:140px; height:140px;
  background:rgba(217,164,64,0.18); border-radius:50%;
}
.hero-card .month{font-size:12px; color:var(--gold-soft); text-transform:uppercase; letter-spacing:.08em; font-weight:700;}
.hero-card .balance{font-family:'Source Serif 4',serif; font-size:34px; font-weight:700; margin:6px 0 14px; position:relative; z-index:1;}
.hero-row{display:flex; gap:18px; position:relative; z-index:1;}
.hero-stat{flex:1;}
.hero-stat .lbl{font-size:11px; color:rgba(255,255,255,0.65); text-transform:uppercase; letter-spacing:.06em;}
.hero-stat .val{font-size:18px; font-weight:700; margin-top:2px;}
.hero-stat.income .val{color:#a8e0bf;}
.hero-stat.expense .val{color:#f5b8a8;}
.hero-stat.saving .val{color:var(--gold-soft);}

.grid2{display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:14px;}
@media (max-width:620px){.grid2{grid-template-columns:1fr;}}

.card{background:var(--paper); border-radius:var(--radius); padding:16px; box-shadow:var(--shadow); margin-bottom:14px;}
.card h3{font-size:14px; color:var(--forest); margin-bottom:12px; display:flex; align-items:center; justify-content:space-between;}
.card h3 .more{font-size:12px; font-weight:500; color:var(--muted); font-family:inherit;}

.chart-wrap{position:relative; height:220px;}
.chart-wrap.small{height:180px;}

/* legend rows for category breakdown */
.cat-row{display:flex; align-items:center; gap:10px; padding:7px 0; font-size:13px;}
.cat-dot{width:10px; height:10px; border-radius:50%; flex-shrink:0;}
.cat-row .name{flex:1; color:var(--ink);}
.cat-row .pct{font-weight:700; color:var(--forest);}

/* pending approval banner */
.pending-banner{
  background:linear-gradient(135deg,#fff7e6,#fdf0d8); border:1px solid var(--gold-soft); border-radius:var(--radius);
  padding:14px 16px; display:flex; align-items:center; justify-content:space-between; margin-bottom:14px; cursor:pointer; transition:.15s;
}
.pending-banner:active{transform:scale(0.99);}
.pending-banner .left{display:flex; align-items:center; gap:12px;}
.pending-banner .icon{font-size:22px;}
.pending-banner .text strong{display:block; font-size:14px; color:var(--ink);}
.pending-banner .text span{font-size:12px; color:var(--muted);}
.pending-banner .amt{font-weight:700; color:var(--warn); font-size:16px;}

/* ===== LIST / TRANSACTIONS ===== */
.tx-list .tx-item{
  display:flex; align-items:center; gap:12px; padding:12px 0; border-bottom:1px solid var(--line);
}
.tx-list .tx-item:last-child{border-bottom:none;}
.tx-icon{
  width:40px; height:40px; border-radius:11px; display:flex; align-items:center; justify-content:center;
  font-size:18px; flex-shrink:0; background:var(--gold-soft);
}
.tx-icon.income{background:#d8efe1;}
.tx-detail{flex:1; min-width:0;}
.tx-detail .top{display:flex; justify-content:space-between; align-items:baseline; gap:8px;}
.tx-detail .cat{font-weight:600; font-size:14px; color:var(--ink);}
.tx-detail .amt{font-weight:700; font-size:14px; white-space:nowrap;}
.tx-detail .amt.expense{color:var(--bad);}
.tx-detail .amt.income{color:var(--good);}
.tx-detail .meta{font-size:11.5px; color:var(--muted); margin-top:2px; display:flex; gap:6px; flex-wrap:wrap; align-items:center;}
.status-pill{
  display:inline-block; font-size:10px; font-weight:700; padding:2px 8px; border-radius:20px; text-transform:uppercase; letter-spacing:.04em;
}
.status-pill.pending{background:#fdeccd; color:var(--warn);}
.status-pill.approved{background:#dcf0e3; color:var(--good);}
.status-pill.rejected{background:#fbe1dd; color:var(--bad);}
.status-pill.paid{background:#dde9f5; color:#3c6aa8;}
.status-pill.draft{background:#eee; color:var(--muted);}

.empty-state{text-align:center; padding:36px 16px; color:var(--muted);}
.empty-state .ico{font-size:36px; margin-bottom:8px;}
.empty-state p{font-size:13px; margin:0;}

/* ===== FORMS ===== */
.form-grid{display:grid; gap:14px;}
.form-group label{display:block; font-size:12px; font-weight:700; color:var(--forest); margin-bottom:6px; text-transform:uppercase; letter-spacing:.04em;}
.form-group input, .form-group select, .form-group textarea{
  width:100%; padding:11px 13px; border:1.5px solid var(--line); border-radius:10px; background:var(--cream);
}
.form-group input:focus, .form-group select:focus, .form-group textarea:focus{outline:none; border-color:var(--gold);}
.form-row2{display:grid; grid-template-columns:1fr 1fr; gap:12px;}
.amount-input-wrap{display:flex; gap:8px;}
.amount-input-wrap select{flex:0 0 76px;}
.btn{padding:11px 18px; border-radius:10px; font-weight:600; font-size:14px; transition:.15s;}
.btn:active{transform:scale(.98);}
.btn-block{width:100%;}
.btn-fab{
  position:fixed; bottom:88px; right:18px; width:56px; height:56px; border-radius:50%;
  background:var(--gold); color:var(--forest); font-size:26px; box-shadow:0 6px 20px rgba(217,164,64,0.5);
  display:flex; align-items:center; justify-content:center; z-index:40; font-weight:700;
}
.btn-gold{background:var(--gold); color:var(--forest);}
.btn-forest{background:var(--forest); color:#fff;}
.btn-outline{background:transparent; border:1.5px solid var(--line); color:var(--ink);}
.btn-danger{background:#fbe1dd; color:var(--bad);}
.btn-sm{padding:7px 14px; font-size:12.5px; border-radius:8px;}
.btn-row{display:flex; gap:10px; margin-top:6px;}
.btn-row .btn{flex:1;}

/* ===== MODAL ===== */
.modal-overlay{
  position:fixed; inset:0; background:rgba(22,56,50,0.45); z-index:200; display:none;
  align-items:flex-end; justify-content:center; backdrop-filter:blur(2px);
}
.modal-overlay.active{display:flex;}
.modal-sheet{
  background:var(--cream); border-radius:20px 20px 0 0; width:100%; max-width:560px; max-height:92vh; overflow-y:auto;
  padding:20px; animation:slideUp .25s ease;
}
@media (min-width:640px){
  .modal-overlay{align-items:center;}
  .modal-sheet{border-radius:18px; max-height:88vh;}
}
@keyframes slideUp{from{transform:translateY(40px); opacity:0;} to{transform:translateY(0); opacity:1;}}
.modal-head{display:flex; align-items:center; justify-content:space-between; margin-bottom:16px;}
.modal-head h3{font-size:18px; color:var(--forest);}
.modal-close{width:32px; height:32px; border-radius:50%; background:var(--line); display:flex; align-items:center; justify-content:center; font-size:16px; color:var(--ink);}

/* ===== BOTTOM NAV ===== */
.bottom-nav{
  position:fixed; bottom:0; left:0; right:0; background:var(--paper); border-top:1px solid var(--line);
  display:flex; z-index:60; padding-bottom:env(safe-area-inset-bottom);
}
.nav-item{
  flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:3px;
  padding:9px 4px; color:var(--muted); font-size:10.5px; font-weight:600; background:none; position:relative;
}
.nav-item .ic{font-size:19px;}
.nav-item.active{color:var(--forest);}
.nav-item.active .ic{transform:translateY(-1px);}
.nav-item .nbadge{
  position:absolute; top:4px; right:22%; background:var(--bad); color:#fff; font-size:9px; font-weight:700;
  min-width:14px; height:14px; border-radius:7px; display:flex; align-items:center; justify-content:center; padding:0 3px;
}

/* ===== TOAST ===== */
.toast{
  position:fixed; top:16px; left:50%; transform:translateX(-50%) translateY(-60px); background:var(--forest); color:#fff;
  padding:12px 20px; border-radius:10px; font-size:13px; font-weight:600; z-index:300; transition:.3s; box-shadow:0 6px 20px rgba(0,0,0,0.2);
  max-width:90%; text-align:center;
}
.toast.show{transform:translateX(-50%) translateY(0);}
.toast.error{background:var(--bad);}
.toast.success{background:var(--good);}

/* ===== TABS ===== */
.tabbar{display:flex; gap:6px; margin-bottom:14px; overflow-x:auto; scrollbar-width:none; padding-bottom:2px;}
.tabbar::-webkit-scrollbar{display:none;}
.tab-btn{
  padding:9px 16px; border-radius:10px; background:var(--paper); color:var(--muted); font-size:13px; font-weight:600;
  white-space:nowrap; box-shadow:var(--shadow); flex-shrink:0;
}
.tab-btn.active{background:var(--forest); color:#fff;}

/* ===== BUDGET BARS ===== */
.budget-item{margin-bottom:14px;}
.budget-item .bh{display:flex; justify-content:space-between; align-items:baseline; margin-bottom:6px;}
.budget-item .bh .cat{font-weight:600; font-size:13.5px;}
.budget-item .bh .vals{font-size:12px; color:var(--muted);}
.bar-track{height:8px; background:var(--line); border-radius:5px; overflow:hidden;}
.bar-fill{height:100%; border-radius:5px; transition:width .4s ease;}
.bar-fill.ok{background:var(--good);}
.bar-fill.warn{background:var(--warn);}
.bar-fill.over{background:var(--bad);}
.budget-warn{font-size:11px; color:var(--warn); font-weight:700; margin-top:4px;}

/* ===== GOAL CARD ===== */
.goal-card{background:linear-gradient(135deg,#fff,var(--gold-soft) 180%); border:1px solid var(--gold-soft); border-radius:var(--radius); padding:18px; margin-bottom:14px;}
.goal-card h4{font-size:16px; color:var(--forest); margin-bottom:4px;}
.goal-card .target{font-size:12px; color:var(--muted); margin-bottom:12px;}
.goal-progress-ring{display:flex; align-items:center; gap:16px;}
.goal-nums{flex:1;}
.goal-nums .saved{font-size:22px; font-weight:700; color:var(--forest); font-family:'Source Serif 4',serif;}
.goal-nums .of{font-size:12px; color:var(--muted);}

/* asset list */
.asset-row{display:flex; justify-content:space-between; align-items:center; padding:11px 0; border-bottom:1px solid var(--line);}
.asset-row:last-child{border-bottom:none;}
.asset-row .name{display:flex; align-items:center; gap:10px; font-weight:600; font-size:13.5px;}
.asset-row .ic{font-size:18px;}
.asset-row .val{font-weight:700; font-family:'Source Serif 4',serif; color:var(--forest);}
.net-worth-total{
  background:var(--forest); color:#fff; border-radius:12px; padding:16px; text-align:center; margin-top:14px;
}
.net-worth-total .lbl{font-size:11px; color:var(--gold-soft); text-transform:uppercase; letter-spacing:.08em; font-weight:700;}
.net-worth-total .val{font-size:26px; font-weight:700; font-family:'Source Serif 4',serif; margin-top:4px;}

/* member spending */
.member-row{display:flex; align-items:center; gap:12px; padding:11px 0; border-bottom:1px solid var(--line);}
.member-row:last-child{border-bottom:none;}
.member-avatar{
  width:38px; height:38px; border-radius:50%; background:var(--forest); color:#fff; display:flex; align-items:center; justify-content:center;
  font-weight:700; font-size:14px; flex-shrink:0;
}
.member-info{flex:1;}
.member-info .nm{font-weight:600; font-size:13.5px;}
.member-info .role-tag{font-size:10.5px; color:var(--muted); text-transform:uppercase; letter-spacing:.04em;}
.member-amt{font-weight:700; color:var(--forest); font-family:'Source Serif 4',serif;}

/* settings */
.settings-section{margin-bottom:18px;}
.settings-section h4{font-size:13px; color:var(--forest); text-transform:uppercase; letter-spacing:.06em; margin-bottom:10px;}
.settings-row{
  display:flex; align-items:center; justify-content:space-between; padding:13px 0; border-bottom:1px solid var(--line);
}
.settings-row:last-child{border-bottom:none;}
.settings-row .lbl{font-size:14px; font-weight:500;}
.settings-row .sub{font-size:11.5px; color:var(--muted); margin-top:2px;}

/* approval card */
.approval-card{border:1px solid var(--line); border-radius:12px; padding:14px; margin-bottom:10px; background:var(--paper);}
.approval-card .ah{display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px;}
.approval-card .ah .amt{font-size:18px; font-weight:700; color:var(--forest); font-family:'Source Serif 4',serif;}
.approval-card .ah .who{font-size:12px; color:var(--muted); margin-top:2px;}
.approval-card .note{font-size:13px; color:var(--ink); margin:8px 0; background:var(--cream); padding:8px 10px; border-radius:8px;}
.history-item{display:flex; gap:10px; font-size:12px; padding:6px 0; color:var(--muted);}
.history-item .dot{width:8px; height:8px; border-radius:50%; background:var(--gold); margin-top:4px; flex-shrink:0;}

/* receipt thumb */
.receipt-thumb{width:60px; height:60px; border-radius:8px; object-fit:cover; border:1px solid var(--line);}
.file-input-label{
  display:flex; align-items:center; justify-content:center; gap:8px; border:1.5px dashed var(--line); border-radius:10px;
  padding:18px; color:var(--muted); font-size:13px; cursor:pointer; background:var(--cream);
}
.file-input-label input{display:none;}
.img-preview{margin-top:10px; display:flex; gap:8px;}

/* utility */
.hidden{display:none !important;}
.center{text-align:center;}
.text-muted{color:var(--muted);}
.flex-between{display:flex; justify-content:space-between; align-items:center;}
.role-badge{
  display:inline-block; font-size:10px; font-weight:700; padding:2px 8px; border-radius:20px; text-transform:uppercase;
  background:var(--gold-soft); color:var(--forest); letter-spacing:.04em; margin-left:6px;
}
.section-spacer{height:80px;}
.divider-label{font-size:11px; font-weight:700; color:var(--muted); text-transform:uppercase; letter-spacing:.06em; margin:18px 0 8px;}
</style>
</head>
<body>

<!-- ===================== LOGIN SCREEN ===================== -->
<div id="loginScreen">
  <div class="login-card">
    <div class="login-mark">F</div>
    <h1 data-i18n="appName">Family Finance</h1>
    <p class="tag" data-i18n="appTagline">Quản lý tài chính gia đình thông minh</p>
    <div class="field">
      <label data-i18n="lblEmail">Email</label>
      <input type="email" id="loginEmail" placeholder="email@example.com" autocomplete="email">
    </div>
    <div class="field">
      <label data-i18n="lblPassword">Mật khẩu</label>
      <input type="password" id="loginPassword" placeholder="••••••••" autocomplete="current-password">
    </div>
    <button class="btn-primary" id="btnLogin" data-i18n="btnLogin">Đăng nhập</button>
    <div class="login-error" id="loginError"></div>
    <div class="demo-note" id="demoNote"></div>
  </div>
</div>

<!-- ===================== MAIN APP ===================== -->
<div id="app">
  <div class="topbar">
    <div class="brand">
      <div class="mark">F</div>
      <div class="brand-text">
        <h1 data-i18n="appName">Family Finance</h1>
        <span id="currentMonthLabel"></span>
      </div>
    </div>
    <div class="topbar-actions">
      <button class="lang-toggle" id="btnLang">EN</button>
      <button class="icon-btn" id="btnNotif">🔔<span class="badge hidden" id="notifBadge">0</span></button>
    </div>
  </div>

  <main>
    <!-- PAGE: DASHBOARD -->
    <section id="page-dashboard" class="page">
      <div class="page-head">
        <div>
          <h2 data-i18n="navDashboard">Tổng quan</h2>
          <div class="sub" id="dashSub"></div>
        </div>
        <select id="dashMonthSelect" class="tab-btn" style="border:1.5px solid var(--line); background:var(--paper);"></select>
      </div>

      <div class="hero-card">
        <div class="month" id="heroMonth"></div>
        <div class="balance" id="heroBalance">$0</div>
        <div class="hero-row">
          <div class="hero-stat income">
            <div class="lbl" data-i18n="lblIncome">Thu nhập</div>
            <div class="val" id="heroIncome">+$0</div>
          </div>
          <div class="hero-stat expense">
            <div class="lbl" data-i18n="lblExpense">Chi tiêu</div>
            <div class="val" id="heroExpense">-$0</div>
          </div>
          <div class="hero-stat saving">
            <div class="lbl" data-i18n="lblSaving">Tiết kiệm</div>
            <div class="val" id="heroSaving">$0</div>
          </div>
        </div>
      </div>

      <div class="pending-banner hidden" id="pendingBanner">
        <div class="left">
          <div class="icon">🔔</div>
          <div class="text">
            <strong id="pendingBannerTitle"></strong>
            <span id="pendingBannerSub"></span>
          </div>
        </div>
        <div class="amt" id="pendingBannerAmt"></div>
      </div>

      <div class="grid2">
        <div class="card">
          <h3 data-i18n="cardExpenseByCategory">Chi tiêu theo danh mục</h3>
          <div class="chart-wrap small"><canvas id="pieChart"></canvas></div>
          <div id="catLegend"></div>
        </div>
        <div class="card">
          <h3 data-i18n="cardMonthlyTrend">Xu hướng theo tháng</h3>
          <div class="chart-wrap small"><canvas id="trendChart"></canvas></div>
        </div>
      </div>

      <div class="card">
        <h3>
          <span data-i18n="cardRecentTx">Giao dịch gần đây</span>
          <button class="more" data-i18n="seeAll" onclick="goPage('transactions')">Xem tất cả</button>
        </h3>
        <div class="tx-list" id="recentTxList"></div>
      </div>
    </section>

    <!-- PAGE: TRANSACTIONS -->
    <section id="page-transactions" class="page hidden">
      <div class="page-head">
        <div>
          <h2 data-i18n="navTransactions">Giao dịch</h2>
          <div class="sub" data-i18n="txSub">Tất cả thu chi của gia đình</div>
        </div>
      </div>
      <div class="tabbar" id="txFilterTabs"></div>
      <div class="card">
        <div class="tx-list" id="allTxList"></div>
        <div class="empty-state hidden" id="txEmpty">
          <div class="ico">📭</div>
          <p data-i18n="emptyTx">Chưa có giao dịch nào</p>
        </div>
      </div>
    </section>

    <!-- PAGE: APPROVALS -->
    <section id="page-approvals" class="page hidden">
      <div class="page-head">
        <div>
          <h2 data-i18n="navApprovals">Phê duyệt</h2>
          <div class="sub" data-i18n="approvalSub">Yêu cầu chi tiêu cần duyệt</div>
        </div>
      </div>
      <div class="tabbar">
        <button class="tab-btn active" id="apTabPending" data-i18n="apPending">Đang chờ</button>
        <button class="tab-btn" id="apTabHistory" data-i18n="apHistory">Lịch sử</button>
      </div>
      <div id="approvalsContent"></div>
    </section>

    <!-- PAGE: BUDGET -->
    <section id="page-budget" class="page hidden">
      <div class="page-head">
        <div>
          <h2 data-i18n="navBudget">Ngân sách</h2>
          <div class="sub" id="budgetSub"></div>
        </div>
        <button class="btn btn-sm btn-outline" id="btnEditBudget" data-i18n="btnEdit">Sửa</button>
      </div>
      <div class="card" id="budgetCard"></div>
    </section>

    <!-- PAGE: GOALS -->
    <section id="page-goals" class="page hidden">
      <div class="page-head">
        <div>
          <h2 data-i18n="navGoals">Mục tiêu</h2>
          <div class="sub" data-i18n="goalsSub">Tiết kiệm cho tương lai gia đình</div>
        </div>
        <button class="btn btn-sm btn-gold" id="btnAddGoal" data-i18n="btnAdd">+ Thêm</button>
      </div>
      <div id="goalsContent"></div>
    </section>

    <!-- PAGE: ASSETS -->
    <section id="page-assets" class="page hidden">
      <div class="page-head">
        <div>
          <h2 data-i18n="navAssets">Tài sản</h2>
          <div class="sub" data-i18n="assetsSub">Tổng tài sản gia đình</div>
        </div>
        <button class="btn btn-sm btn-gold" id="btnAddAsset" data-i18n="btnAdd">+ Thêm</button>
      </div>
      <div class="card" id="assetsCard"></div>
    </section>

    <!-- PAGE: MEMBERS -->
    <section id="page-members" class="page hidden">
      <div class="page-head">
        <div>
          <h2 data-i18n="navMembers">Thành viên</h2>
          <div class="sub" id="membersSub"></div>
        </div>
      </div>
      <div class="card">
        <h3 data-i18n="cardSpendingByMember">Chi tiêu theo thành viên</h3>
        <div id="memberSpendingList"></div>
      </div>
      <div class="card" id="memberListCard">
        <h3 data-i18n="cardFamilyMembers">Thành viên gia đình</h3>
        <div id="memberList"></div>
      </div>
    </section>

    <!-- PAGE: REPORTS -->
    <section id="page-reports" class="page hidden">
      <div class="page-head">
        <div>
          <h2 data-i18n="navReports">Báo cáo</h2>
          <div class="sub" id="reportsSub"></div>
        </div>
      </div>
      <div class="card" id="reportSummaryCard"></div>
      <div class="card">
        <h3 data-i18n="cardExportData">Xuất dữ liệu</h3>
        <div class="btn-row">
          <button class="btn btn-forest" id="btnExportExcel" data-i18n="btnExportExcel">📊 Excel</button>
          <button class="btn btn-outline" id="btnExportPdf" data-i18n="btnExportPdf">📄 PDF</button>
        </div>
      </div>
    </section>

    <!-- PAGE: SETTINGS -->
    <section id="page-settings" class="page hidden">
      <div class="page-head">
        <div>
          <h2 data-i18n="navSettings">Cài đặt</h2>
          <div class="sub" id="settingsUserInfo"></div>
        </div>
      </div>

      <div class="settings-section">
        <h4 data-i18n="setGeneral">Chung</h4>
        <div class="card">
          <div class="settings-row">
            <div>
              <div class="lbl" data-i18n="setCurrency">Đơn vị tiền tệ hiển thị</div>
              <div class="sub" data-i18n="setCurrencySub">Đơn vị chính cho dashboard</div>
            </div>
            <select id="primaryCurrencySelect">
              <option value="USD">USD</option>
              <option value="KHR">KHR</option>
              <option value="VND">VND</option>
            </select>
          </div>
          <div class="settings-row">
            <div>
              <div class="lbl" data-i18n="setRateKHR">Tỷ giá 1 USD = ? KHR</div>
            </div>
            <input type="number" id="rateKHR" style="width:110px; text-align:right; border:1.5px solid var(--line); border-radius:8px; padding:8px;">
          </div>
          <div class="settings-row">
            <div>
              <div class="lbl" data-i18n="setRateVND">Tỷ giá 1 USD = ? VND</div>
            </div>
            <input type="number" id="rateVND" style="width:110px; text-align:right; border:1.5px solid var(--line); border-radius:8px; padding:8px;">
          </div>
          <div class="settings-row">
            <button class="btn btn-forest btn-sm" id="btnSaveRates" data-i18n="btnSave">Lưu</button>
          </div>
        </div>
      </div>

      <div class="settings-section" id="approvalLimitsSection">
        <h4 data-i18n="setApprovalLimits">Hạn mức phê duyệt</h4>
        <div class="card">
          <div class="settings-row">
            <div>
              <div class="lbl" data-i18n="setAutoLimit">Tự động duyệt nếu dưới</div>
            </div>
            <div class="amount-input-wrap" style="max-width:160px;">
              <span style="padding:10px 0;">$</span>
              <input type="number" id="limitAuto" style="text-align:right; border:1.5px solid var(--line); border-radius:8px; padding:8px;">
            </div>
          </div>
          <div class="settings-row">
            <div>
              <div class="lbl" data-i18n="setSuperLimit">Cần Super Admin duyệt nếu từ</div>
            </div>
            <div class="amount-input-wrap" style="max-width:160px;">
              <span style="padding:10px 0;">$</span>
              <input type="number" id="limitSuper" style="text-align:right; border:1.5px solid var(--line); border-radius:8px; padding:8px;">
            </div>
          </div>
          <div class="settings-row">
            <button class="btn btn-forest btn-sm" id="btnSaveLimits" data-i18n="btnSave">Lưu</button>
          </div>
        </div>
      </div>

      <div class="settings-section" id="categoryMgmtSection">
        <h4 data-i18n="setCategories">Danh mục</h4>
        <div class="card">
          <div id="categoryMgmtList"></div>
          <div class="btn-row">
            <input type="text" id="newCategoryName" placeholder="Tên danh mục mới" style="flex:1; border:1.5px solid var(--line); border-radius:8px; padding:9px 12px;">
            <button class="btn btn-gold btn-sm" id="btnAddCategory" data-i18n="btnAdd">+ Thêm</button>
          </div>
        </div>
      </div>

      <div class="settings-section" id="userMgmtSection">
        <h4 data-i18n="setUsers">Quản lý người dùng</h4>
        <div class="card">
          <div id="userMgmtList"></div>
          <button class="btn btn-gold btn-sm btn-block" id="btnAddUser" data-i18n="btnAddUser">+ Thêm thành viên</button>
        </div>
      </div>

      <div class="settings-section">
        <h4 data-i18n="setAuditLog">Lịch sử hệ thống</h4>
        <div class="card" id="auditLogCard"></div>
      </div>

      <div class="settings-section">
        <button class="btn btn-danger btn-block" id="btnLogout" data-i18n="btnLogout">Đăng xuất</button>
      </div>
    </section>
  </main>

  <button class="btn-fab" id="btnFab">+</button>

  <div class="bottom-nav">
    <button class="nav-item active" data-page="dashboard"><span class="ic">🏠</span><span data-i18n="navDashboard">Tổng quan</span></button>
    <button class="nav-item" data-page="transactions"><span class="ic">💳</span><span data-i18n="navTransactions">Giao dịch</span></button>
    <button class="nav-item" data-page="budget"><span class="ic">📊</span><span data-i18n="navBudget">Ngân sách</span></button>
    <button class="nav-item" data-page="goals"><span class="ic">🎯</span><span data-i18n="navGoals">Mục tiêu</span></button>
    <button class="nav-item" data-page="more"><span class="ic">⋯</span><span data-i18n="navMore">Thêm</span></button>
  </div>
</div>

<!-- ===================== MODALS ===================== -->

<!-- Transaction Modal -->
<div class="modal-overlay" id="modalTx">
  <div class="modal-sheet">
    <div class="modal-head">
      <h3 id="txModalTitle" data-i18n="txModalAdd">Thêm giao dịch</h3>
      <button class="modal-close" onclick="closeModal('modalTx')">✕</button>
    </div>
    <div class="form-grid">
      <div class="form-row2">
        <div class="form-group">
          <label data-i18n="lblType">Loại giao dịch</label>
          <select id="txType">
            <option value="expense" data-i18n="typeExpense">Chi tiêu</option>
            <option value="income" data-i18n="typeIncome">Thu nhập</option>
          </select>
        </div>
        <div class="form-group">
          <label data-i18n="lblDate">Ngày</label>
          <input type="date" id="txDate">
        </div>
      </div>
      <div class="form-group">
        <label data-i18n="lblCategory">Danh mục</label>
        <select id="txCategory"></select>
      </div>
      <div class="form-group">
        <label data-i18n="lblAmount">Số tiền</label>
        <div class="amount-input-wrap">
          <select id="txCurrency">
            <option value="USD">USD</option>
            <option value="KHR">KHR</option>
            <option value="VND">VND</option>
          </select>
          <input type="number" id="txAmount" placeholder="0.00" min="0" step="0.01">
        </div>
      </div>
      <div class="form-group">
        <label data-i18n="lblPaidBy">Người thanh toán</label>
        <select id="txPaidBy"></select>
      </div>
      <div class="form-group">
        <label data-i18n="lblNote">Ghi chú</label>
        <textarea id="txNote" rows="2" placeholder=""></textarea>
      </div>
      <div class="form-group">
        <label data-i18n="lblReceipt">Ảnh hóa đơn</label>
        <label class="file-input-label">
          <span data-i18n="lblReceiptUpload">📷 Chọn ảnh hóa đơn (tùy chọn)</span>
          <input type="file" id="txReceipt" accept="image/*">
        </label>
        <div class="img-preview" id="txReceiptPreview"></div>
      </div>
      <div id="txStatusPreview" class="text-muted" style="font-size:12px;"></div>
      <button class="btn btn-forest btn-block" id="btnSaveTx" data-i18n="btnSave">Lưu</button>
    </div>
  </div>
</div>

<!-- Budget Modal -->
<div class="modal-overlay" id="modalBudget">
  <div class="modal-sheet">
    <div class="modal-head">
      <h3 data-i18n="budgetModalTitle">Đặt ngân sách tháng</h3>
      <button class="modal-close" onclick="closeModal('modalBudget')">✕</button>
    </div>
    <div class="form-grid" id="budgetFormGrid"></div>
    <button class="btn btn-forest btn-block" id="btnSaveBudget" style="margin-top:16px;" data-i18n="btnSave">Lưu</button>
  </div>
</div>

<!-- Goal Modal -->
<div class="modal-overlay" id="modalGoal">
  <div class="modal-sheet">
    <div class="modal-head">
      <h3 data-i18n="goalModalTitle">Thêm mục tiêu tiết kiệm</h3>
      <button class="modal-close" onclick="closeModal('modalGoal')">✕</button>
    </div>
    <div class="form-grid">
      <div class="form-group">
        <label data-i18n="lblGoalName">Tên mục tiêu</label>
        <input type="text" id="goalName" placeholder="Mua xe mới">
      </div>
      <div class="form-row2">
        <div class="form-group">
          <label data-i18n="lblGoalTarget">Số tiền mục tiêu ($)</label>
          <input type="number" id="goalTarget" placeholder="30000">
        </div>
        <div class="form-group">
          <label data-i18n="lblGoalSaved">Đã tiết kiệm ($)</label>
          <input type="number" id="goalSaved" placeholder="0">
        </div>
      </div>
      <button class="btn btn-forest btn-block" id="btnSaveGoal" data-i18n="btnSave">Lưu</button>
    </div>
  </div>
</div>

<!-- Asset Modal -->
<div class="modal-overlay" id="modalAsset">
  <div class="modal-sheet">
    <div class="modal-head">
      <h3 data-i18n="assetModalTitle">Thêm tài sản</h3>
      <button class="modal-close" onclick="closeModal('modalAsset')">✕</button>
    </div>
    <div class="form-grid">
      <div class="form-group">
        <label data-i18n="lblAssetName">Tên tài sản</label>
        <input type="text" id="assetName" placeholder="Nhà, xe, tiền mặt...">
      </div>
      <div class="form-group">
        <label data-i18n="lblAssetType">Loại</label>
        <select id="assetType">
          <option value="cash" data-i18n="assetCash">Tiền mặt</option>
          <option value="bank" data-i18n="assetBank">Tài khoản ngân hàng</option>
          <option value="car" data-i18n="assetCar">Xe</option>
          <option value="house" data-i18n="assetHouse">Nhà / Bất động sản</option>
          <option value="investment" data-i18n="assetInvestment">Đầu tư</option>
          <option value="other" data-i18n="assetOther">Khác</option>
        </select>
      </div>
      <div class="form-group">
        <label data-i18n="lblAssetValue">Giá trị ($)</label>
        <input type="number" id="assetValue" placeholder="0">
      </div>
      <button class="btn btn-forest btn-block" id="btnSaveAsset" data-i18n="btnSave">Lưu</button>
    </div>
  </div>
</div>

<!-- User Modal -->
<div class="modal-overlay" id="modalUser">
  <div class="modal-sheet">
    <div class="modal-head">
      <h3 data-i18n="userModalTitle">Thêm thành viên</h3>
      <button class="modal-close" onclick="closeModal('modalUser')">✕</button>
    </div>
    <div class="form-grid">
      <div class="form-group">
        <label data-i18n="lblUserName">Tên</label>
        <input type="text" id="newUserName" placeholder="Tên thành viên">
      </div>
      <div class="form-group">
        <label data-i18n="lblUserEmail">Email</label>
        <input type="email" id="newUserEmail" placeholder="email@example.com">
      </div>
      <div class="form-group">
        <label data-i18n="lblUserPassword">Mật khẩu</label>
        <input type="text" id="newUserPassword" placeholder="••••••••">
      </div>
      <div class="form-group">
        <label data-i18n="lblUserRole">Vai trò</label>
        <select id="newUserRole">
          <option value="admin" data-i18n="roleAdmin">Admin</option>
          <option value="member" data-i18n="roleMember">Member</option>
        </select>
      </div>
      <button class="btn btn-forest btn-block" id="btnSaveUser" data-i18n="btnSave">Lưu</button>
    </div>
  </div>
</div>

<!-- Approval reject reason modal -->
<div class="modal-overlay" id="modalReject">
  <div class="modal-sheet">
    <div class="modal-head">
      <h3 data-i18n="rejectModalTitle">Lý do từ chối</h3>
      <button class="modal-close" onclick="closeModal('modalReject')">✕</button>
    </div>
    <div class="form-grid">
      <div class="form-group">
        <label data-i18n="lblRejectNote">Ghi chú (tùy chọn)</label>
        <textarea id="rejectNote" rows="3"></textarea>
      </div>
      <button class="btn btn-danger btn-block" id="btnConfirmReject" data-i18n="btnConfirmReject">Xác nhận từ chối</button>
    </div>
  </div>
</div>

<!-- More menu (for mobile bottom nav "more") -->
<div class="modal-overlay" id="modalMore">
  <div class="modal-sheet">
    <div class="modal-head">
      <h3 data-i18n="navMore">Thêm</h3>
      <button class="modal-close" onclick="closeModal('modalMore')">✕</button>
    </div>
    <div id="moreMenuList"></div>
  </div>
</div>

<div class="toast" id="toast"></div>

<script src="js/i18n.js"></script>
<script src="js/database.js"></script>
<script src="js/auth.js"></script>
<script src="js/app.js"></script>
<script src="js/report.js"></script>
</body>
</html>

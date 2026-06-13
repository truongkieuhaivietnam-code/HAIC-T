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

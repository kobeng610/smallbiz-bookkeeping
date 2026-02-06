// ===========================
// INITIALIZATION
// ===========================
function initializeApp() {
  initializeAppFeatures();
  setupEventListeners();
  loadData();
  renderCurrentPage();
  checkBackupReminder();
}

// ===========================
// APP STATE & CONFIGURATION
// ===========================
const APP = {
  currentUser: null,
  currentPeriod: '2026-02',
  currentPage: 'dashboard',
  transactions: [],
  periods: {},
  businessInfo: {},
  selectedTransactions: new Set(),
  charts: {},
  lastBackupReminder: null
};
  
  // Original initialization code continues below
  initializeAppFeatures();
  setupEventListeners();
  loadData();
  renderCurrentPage();
  checkBackupReminder();
}

// ===========================
// APP STATE & CONFIGURATION
// ===========================
const APP = {
  currentUser: null,
  currentPeriod: '2026-02',
  currentPage: 'dashboard',
  transactions: [],
  periods: {},
  businessInfo: {},
  selectedTransactions: new Set(),
  charts: {},
  lastBackupReminder: null
};

// ===========================
// STORAGE WARNING & BACKUP REMINDERS
// ===========================
function dismissWarning() {
  const banner = document.querySelector('.storage-warning-banner');
  if (banner) {
    banner.classList.add('dismissed');
    localStorage.setItem('warningDismissed', 'true');
  }
}

function checkBackupReminder() {
  const lastBackup = localStorage.getItem('lastBackupDate');
  const warningDismissed = localStorage.getItem('warningDismissed');
  
  // Show warning banner if not dismissed
  if (!warningDismissed) {
    const banner = document.querySelector('.storage-warning-banner');
    if (banner) banner.classList.remove('dismissed');
  }
  
  // Check if backup is overdue (30 days)
  if (lastBackup) {
    const daysSinceBackup = Math.floor((Date.now() - new Date(lastBackup)) / (1000 * 60 * 60 * 24));
    if (daysSinceBackup > 30) {
      showBackupReminder(daysSinceBackup);
    }
  } else if (APP.transactions.length > 10) {
    // If user has transactions but never backed up
    showBackupReminder(null);
  }
}

function showBackupReminder(daysSinceBackup) {
  const message = daysSinceBackup 
    ? `⚠️ It's been ${daysSinceBackup} days since your last backup! Export your data now to prevent loss.`
    : `⚠️ You have ${APP.transactions.length} transactions but no backup! Export your data now.`;
  
  // Don't spam - only show once per session
  if (!APP.lastBackupReminder) {
    showToast(message, 'warning');
    APP.lastBackupReminder = Date.now();
  }
}

function recordBackup() {
  localStorage.setItem('lastBackupDate', new Date().toISOString());
  showToast('✅ Backup created! Your data is safe.', 'success');
}

// Make functions global
window.dismissWarning = dismissWarning;

// ===========================
// INITIALIZATION
// ===========================
function initializeAppFeatures() {
  // Simulate user authentication
  APP.currentUser = {
    email: localStorage.getItem('userEmail') || 'user@example.com',
    name: localStorage.getItem('userName') || 'Business Owner'
  };
  
  // Set default date
  const today = new Date().toISOString().split('T')[0];
  if (document.getElementById('txnDate')) {
    document.getElementById('txnDate').value = today;
  }
}

function setupEventListeners() {
  // Navigation
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      if (!link.classList.contains('logout-link')) {
        e.preventDefault();
        const page = link.dataset.page;
        if (page) switchPage(page);
      }
    });
  });

  // Period selectors
  const periodSelectors = ['dashboardPeriod', 'transactionPeriod', 'reportPeriod'];
  periodSelectors.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('change', (e) => {
        APP.currentPeriod = e.target.value;
        loadData();
        renderCurrentPage();
      });
    }
  });

  // Add transaction form
  const addTxnForm = document.getElementById('addTransactionForm');
  if (addTxnForm) {
    addTxnForm.addEventListener('submit', (e) => {
      e.preventDefault();
      addTransaction();
    });
  }

  // Import file
  const importFileInput = document.getElementById('importFileInput');
  if (importFileInput) {
    importFileInput.addEventListener('change', handleFileImport);
  }

  // Search and filters
  const searchInput = document.getElementById('searchTransactions');
  if (searchInput) {
    searchInput.addEventListener('input', applyFilters);
  }

  ['filterType', 'filterCategory', 'filterReviewed'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('change', applyFilters);
  });

  // Business info form
  const bizForm = document.getElementById('businessInfoForm');
  if (bizForm) {
    bizForm.addEventListener('submit', (e) => {
      e.preventDefault();
      saveBusinessInfo();
    });
  }
}

// ===========================
// PAGE NAVIGATION
// ===========================
function switchPage(pageName) {
  // Update navigation
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.remove('active');
  });
  document.querySelector(`[data-page="${pageName}"]`)?.classList.add('active');

  // Update page content
  document.querySelectorAll('.page').forEach(page => {
    page.classList.remove('active');
  });
  document.getElementById(`${pageName}-page`)?.classList.add('active');

  APP.currentPage = pageName;
  renderCurrentPage();
}

function renderCurrentPage() {
  switch (APP.currentPage) {
    case 'dashboard':
      renderDashboard();
      break;
    case 'transactions':
      renderTransactions();
      break;
    case 'reports':
      renderReports();
      break;
    case 'tax':
      renderTaxCenter();
      break;
    case 'settings':
      renderSettings();
      break;
  }
}

// ===========================
// DATA MANAGEMENT
// ===========================
function getStorageKey(type) {
  return `sbfa_${type}_${APP.currentUser.email}_${APP.currentPeriod}`;
}

function loadData() {
  // Load transactions for current period
  const txnKey = getStorageKey('txns');
  APP.transactions = JSON.parse(localStorage.getItem(txnKey) || '[]')
    .filter(t => !t.deleted);

  // Load period status
  const periodKey = getStorageKey('period');
  APP.periods[APP.currentPeriod] = JSON.parse(localStorage.getItem(periodKey) || '{}');

  // Load business info
  const bizKey = `sbfa_business_${APP.currentUser.email}`;
  APP.businessInfo = JSON.parse(localStorage.getItem(bizKey) || '{}');

  // Update UI
  updatePeriodStatus();
  populateCategoryFilters();
}

function saveData() {
  const txnKey = getStorageKey('txns');
  localStorage.setItem(txnKey, JSON.stringify(APP.transactions));
}

function savePeriodStatus() {
  const periodKey = getStorageKey('period');
  localStorage.setItem(periodKey, JSON.stringify(APP.periods[APP.currentPeriod]));
}

function isPeriodClosed() {
  return APP.periods[APP.currentPeriod]?.closed || false;
}

// ===========================
// TRANSACTION MANAGEMENT
// ===========================
function addTransaction() {
  if (isPeriodClosed()) {
    showToast('Period is closed. Cannot add transactions.', 'error');
    return;
  }

  const transaction = {
    id: Date.now() + Math.random(),
    date: document.getElementById('txnDate').value,
    type: document.getElementById('txnType').value,
    amount: Math.abs(parseFloat(document.getElementById('txnAmount').value)),
    category: document.getElementById('txnCategory').value,
    description: document.getElementById('txnDescription').value,
    vendor: document.getElementById('txnVendor').value || '',
    paymentMethod: document.getElementById('txnPayment').value,
    notes: document.getElementById('txnNotes').value || '',
    reviewed: document.getElementById('txnReviewed').checked,
    deleted: false,
    createdAt: new Date().toISOString()
  };

  APP.transactions.push(transaction);
  saveData();
  
  closeModal('addTransactionModal');
  document.getElementById('addTransactionForm').reset();
  document.getElementById('txnDate').value = new Date().toISOString().split('T')[0];
  
  showToast('Transaction added successfully', 'success');
  renderCurrentPage();
}

function toggleReview(id) {
  if (isPeriodClosed()) {
    showToast('Period is closed. Cannot modify transactions.', 'error');
    return;
  }

  const txn = APP.transactions.find(t => t.id === id);
  if (txn) {
    txn.reviewed = !txn.reviewed;
    saveData();
    renderCurrentPage();
    showToast(`Transaction marked as ${txn.reviewed ? 'reviewed' : 'unreviewed'}`, 'success');
  }
}

function deleteTransaction(id) {
  if (isPeriodClosed()) {
    showToast('Period is closed. Cannot delete transactions.', 'error');
    return;
  }

  const txn = APP.transactions.find(t => t.id === id);
  if (!txn) return;

  if (txn.reviewed) {
    showToast('Cannot delete reviewed transactions', 'error');
    return;
  }

  if (confirm('Are you sure you want to delete this transaction?')) {
    txn.deleted = true;
    APP.transactions = APP.transactions.filter(t => t.id !== id);
    saveData();
    renderCurrentPage();
    showToast('Transaction deleted', 'success');
  }
}

// ===========================
// BULK OPERATIONS
// ===========================
function toggleSelectAll() {
  const checkbox = document.getElementById('selectAllTransactions') || 
                   document.getElementById('tableSelectAll');
  const isChecked = checkbox.checked;
  
  const txnCheckboxes = document.querySelectorAll('.txn-checkbox');
  txnCheckboxes.forEach(cb => {
    cb.checked = isChecked;
    const id = parseFloat(cb.dataset.id);
    if (isChecked) {
      APP.selectedTransactions.add(id);
    } else {
      APP.selectedTransactions.delete(id);
    }
  });
  
  updateBulkActionsUI();
}

function updateBulkActionsUI() {
  const count = APP.selectedTransactions.size;
  const countEl = document.getElementById('selectedCount');
  const reviewBtn = document.getElementById('bulkReviewBtn');
  const deleteBtn = document.getElementById('bulkDeleteBtn');
  
  if (countEl) countEl.textContent = `${count} selected`;
  if (reviewBtn) reviewBtn.disabled = count === 0;
  if (deleteBtn) deleteBtn.disabled = count === 0;
}

function bulkReview() {
  if (isPeriodClosed()) {
    showToast('Period is closed', 'error');
    return;
  }

  let updated = 0;
  APP.selectedTransactions.forEach(id => {
    const txn = APP.transactions.find(t => t.id === id);
    if (txn && !txn.reviewed) {
      txn.reviewed = true;
      updated++;
    }
  });

  if (updated > 0) {
    saveData();
    APP.selectedTransactions.clear();
    renderCurrentPage();
    showToast(`${updated} transactions marked as reviewed`, 'success');
  }
}

function bulkDelete() {
  if (isPeriodClosed()) {
    showToast('Period is closed', 'error');
    return;
  }

  const toDelete = Array.from(APP.selectedTransactions);
  const reviewed = toDelete.filter(id => 
    APP.transactions.find(t => t.id === id)?.reviewed
  );

  if (reviewed.length > 0) {
    showToast('Cannot delete reviewed transactions', 'error');
    return;
  }

  if (confirm(`Delete ${toDelete.length} transactions?`)) {
    APP.transactions = APP.transactions.filter(t => !toDelete.includes(t.id));
    saveData();
    APP.selectedTransactions.clear();
    renderCurrentPage();
    showToast(`${toDelete.length} transactions deleted`, 'success');
  }
}

// ===========================
// FILTERS
// ===========================
function applyFilters() {
  const search = document.getElementById('searchTransactions')?.value.toLowerCase() || '';
  const typeFilter = document.getElementById('filterType')?.value || '';
  const categoryFilter = document.getElementById('filterCategory')?.value || '';
  const reviewedFilter = document.getElementById('filterReviewed')?.value || '';

  const filtered = APP.transactions.filter(txn => {
    const matchesSearch = !search || 
      txn.description.toLowerCase().includes(search) ||
      txn.vendor.toLowerCase().includes(search) ||
      txn.category.toLowerCase().includes(search);
    
    const matchesType = !typeFilter || txn.type === typeFilter;
    const matchesCategory = !categoryFilter || txn.category === categoryFilter;
    const matchesReviewed = !reviewedFilter || 
      (reviewedFilter === 'reviewed' && txn.reviewed) ||
      (reviewedFilter === 'unreviewed' && !txn.reviewed);

    return matchesSearch && matchesType && matchesCategory && matchesReviewed;
  });

  renderTransactionTable(filtered);
}

function clearFilters() {
  document.getElementById('searchTransactions').value = '';
  document.getElementById('filterType').value = '';
  document.getElementById('filterCategory').value = '';
  document.getElementById('filterReviewed').value = '';
  applyFilters();
}

function populateCategoryFilters() {
  const categories = [...new Set(APP.transactions.map(t => t.category))];
  const select = document.getElementById('filterCategory');
  
  if (select) {
    const currentValue = select.value;
    select.innerHTML = '<option value="">All Categories</option>';
    categories.sort().forEach(cat => {
      select.innerHTML += `<option value="${cat}">${cat}</option>`;
    });
    select.value = currentValue;
  }
}

// ===========================
// FILE IMPORT
// ===========================
function handleFileImport(e) {
  const file = e.target.files[0];
  if (!file) return;

  if (file.name.endsWith('.csv')) {
    readCSV(file);
  } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
    readExcel(file);
  } else {
    showToast('Please upload a CSV or Excel file', 'error');
  }
}

function readCSV(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const text = e.target.result;
    const rows = text.split(/\r?\n/).filter(Boolean).map(r => 
      r.split(',').map(c => c.trim().replace(/^"|"$/g, ''))
    );
    processImportedRows(rows);
  };
  reader.readAsText(file);
}

function readExcel(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, { type: 'array' });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
    processImportedRows(rows);
  };
  reader.readAsArrayBuffer(file);
}

function processImportedRows(rows) {
  if (isPeriodClosed()) {
    showToast('Period is closed. Cannot import transactions.', 'error');
    return;
  }

  if (rows.length < 2) {
    showToast('File is empty or invalid', 'error');
    return;
  }

  const headers = rows[0].map(h => String(h).toLowerCase());
  const dateIdx = headers.findIndex(h => h.includes('date'));
  const descIdx = headers.findIndex(h => h.includes('desc'));
  const amountIdx = headers.findIndex(h => h.includes('amount'));
  const typeIdx = headers.findIndex(h => h.includes('type'));
  const categoryIdx = headers.findIndex(h => h.includes('category') || h.includes('cat'));

  if (dateIdx === -1 || descIdx === -1 || amountIdx === -1) {
    showToast('Required columns missing: Date, Description, Amount', 'error');
    return;
  }

  let imported = 0;
  const dataRows = rows.slice(1);

  dataRows.forEach(row => {
    const amount = parseFloat(row[amountIdx]);
    if (isNaN(amount)) return;

    const transaction = {
      id: Date.now() + Math.random(),
      date: normalizeDate(row[dateIdx]),
      description: row[descIdx] || 'Imported transaction',
      amount: Math.abs(amount),
      type: typeIdx >= 0 ? (row[typeIdx]?.toLowerCase() || (amount > 0 ? 'income' : 'expense')) : (amount > 0 ? 'income' : 'expense'),
      category: categoryIdx >= 0 ? (row[categoryIdx] || 'Uncategorized') : 'Uncategorized',
      vendor: '',
      paymentMethod: 'Other',
      notes: 'Imported from file',
      reviewed: false,
      deleted: false,
      createdAt: new Date().toISOString()
    };

    APP.transactions.push(transaction);
    imported++;
  });

  saveData();
  closeModal('importModal');
  showToast(`Imported ${imported} transactions`, 'success');
  renderCurrentPage();
}

function normalizeDate(value) {
  if (typeof value === 'number') {
    // Excel date serial number
    const excelEpoch = new Date(1899, 11, 30);
    const date = new Date(excelEpoch.getTime() + value * 86400000);
    return date.toISOString().split('T')[0];
  }
  
  // Try parsing as string
  const parsed = new Date(value);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
  }
  
  return value;
}

// ===========================
// DASHBOARD RENDERING
// ===========================
function renderDashboard() {
  updatePeriodStatus('periodStatusBanner');
  
  const reviewed = APP.transactions.filter(t => t.reviewed);
  const unreviewed = APP.transactions.filter(t => !t.reviewed);
  
  const income = reviewed.filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  const expenses = reviewed.filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  const net = income - expenses;

  // Update summary cards
  document.getElementById('dashTotalIncome').textContent = formatCurrency(income);
  document.getElementById('dashTotalExpenses').textContent = formatCurrency(expenses);
  document.getElementById('dashNetProfit').textContent = formatCurrency(net);
  document.getElementById('dashNetProfit').style.color = net >= 0 ? '#10b981' : '#ef4444';
  document.getElementById('dashPendingCount').textContent = unreviewed.length;

  // Render charts
  renderTrendChart();
  renderCategoryChart();

  // Render recent transactions
  renderRecentTransactions();
}

function renderTrendChart() {
  const ctx = document.getElementById('trendChart');
  if (!ctx) return;

  // Destroy existing chart
  if (APP.charts.trend) {
    APP.charts.trend.destroy();
  }

  // Group by week
  const weeks = {};
  APP.transactions.filter(t => t.reviewed).forEach(txn => {
    const date = new Date(txn.date);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    const weekKey = weekStart.toISOString().split('T')[0];
    
    if (!weeks[weekKey]) {
      weeks[weekKey] = { income: 0, expenses: 0 };
    }
    
    if (txn.type === 'income') {
      weeks[weekKey].income += txn.amount;
    } else {
      weeks[weekKey].expenses += txn.amount;
    }
  });

  const sortedWeeks = Object.keys(weeks).sort();
  const labels = sortedWeeks.map(w => new Date(w).toLocaleDateString());
  const incomeData = sortedWeeks.map(w => weeks[w].income);
  const expenseData = sortedWeeks.map(w => weeks[w].expenses);

  APP.charts.trend = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Income',
          data: incomeData,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.4
        },
        {
          label: 'Expenses',
          data: expenseData,
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          tension: 0.4
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'top' }
      },
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}

function renderCategoryChart() {
  const ctx = document.getElementById('categoryChart');
  if (!ctx) return;

  if (APP.charts.category) {
    APP.charts.category.destroy();
  }

  const expenses = APP.transactions.filter(t => t.type === 'expense' && t.reviewed);
  const byCategory = {};
  
  expenses.forEach(txn => {
    byCategory[txn.category] = (byCategory[txn.category] || 0) + txn.amount;
  });

  const sortedCategories = Object.entries(byCategory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  APP.charts.category = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: sortedCategories.map(c => c[0]),
      datasets: [{
        data: sortedCategories.map(c => c[1]),
        backgroundColor: [
          '#667eea', '#764ba2', '#f093fb', '#4facfe',
          '#43e97b', '#fa709a', '#fee140', '#30cfd0',
          '#a8edea', '#fed6e3'
        ]
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'right' }
      }
    }
  });
}

function renderRecentTransactions() {
  const container = document.getElementById('recentTransactionsList');
  if (!container) return;

  const recent = APP.transactions
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 10);

  if (recent.length === 0) {
    container.innerHTML = '<p style="color: #6b7280; text-align: center; padding: 20px;">No transactions yet</p>';
    return;
  }

  container.innerHTML = recent.map(txn => `
    <div class="transaction-item">
      <div class="transaction-info">
        <div class="transaction-date">${formatDate(txn.date)}</div>
        <div class="transaction-description">${txn.description}</div>
        <div class="transaction-category">${txn.category}</div>
      </div>
      <div class="${txn.type === 'income' ? 'amount-positive' : 'amount-negative'}">
        ${txn.type === 'income' ? '+' : '-'}${formatCurrency(txn.amount)}
      </div>
    </div>
  `).join('');
}

// ===========================
// TRANSACTIONS PAGE
// ===========================
function renderTransactions() {
  updatePeriodStatus('transactionLockBanner');
  renderTransactionTable(APP.transactions);
}

function renderTransactionTable(transactions) {
  const tbody = document.getElementById('transactionsTableBody');
  const noDataMsg = document.getElementById('noTransactionsMessage');
  
  if (!tbody) return;

  if (transactions.length === 0) {
    tbody.innerHTML = '';
    if (noDataMsg) noDataMsg.style.display = 'block';
    return;
  }

  if (noDataMsg) noDataMsg.style.display = 'none';

  const sorted = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));

  tbody.innerHTML = sorted.map(txn => `
    <tr class="${txn.reviewed ? '' : 'unreviewed'}">
      <td>
        <input type="checkbox" class="txn-checkbox" data-id="${txn.id}"
          ${APP.selectedTransactions.has(txn.id) ? 'checked' : ''}
          onchange="handleCheckboxChange(${txn.id}, this.checked)">
      </td>
      <td>${formatDate(txn.date)}</td>
      <td><span class="transaction-type ${txn.type}">${txn.type.toUpperCase()}</span></td>
      <td>${txn.description}</td>
      <td>${txn.category}</td>
      <td class="${txn.type === 'income' ? 'amount-positive' : 'amount-negative'}">
        ${formatCurrency(txn.amount)}
      </td>
      <td>
        <span class="status-badge ${txn.reviewed ? 'reviewed' : 'unreviewed'}">
          ${txn.reviewed ? '✓ Reviewed' : '⏳ Pending'}
        </span>
      </td>
      <td>
        <button class="btn btn-sm" onclick="toggleReview(${txn.id})">
          ${txn.reviewed ? 'Unreview' : 'Review'}
        </button>
        <button class="btn btn-sm btn-danger" onclick="deleteTransaction(${txn.id})">
          Delete
        </button>
      </td>
    </tr>
  `).join('');
}

function handleCheckboxChange(id, checked) {
  if (checked) {
    APP.selectedTransactions.add(id);
  } else {
    APP.selectedTransactions.delete(id);
  }
  updateBulkActionsUI();
}

// ===========================
// REPORTS RENDERING
// ===========================
function renderReports() {
  switchReport('income-statement');
}

function switchReport(reportType) {
  // Update tabs
  document.querySelectorAll('.report-tab').forEach(tab => {
    tab.classList.remove('active');
  });
  document.querySelector(`[data-report="${reportType}"]`)?.classList.add('active');

  // Update content
  document.querySelectorAll('.report-content').forEach(content => {
    content.classList.remove('active');
  });
  document.getElementById(`${reportType}-report`)?.classList.add('active');

  // Render specific report
  switch (reportType) {
    case 'income-statement':
      renderIncomeStatement();
      break;
    case 'cash-flow':
      renderCashFlow();
      break;
    case 'category-analysis':
      renderCategoryAnalysis();
      break;
    case 'comparison':
      break; // Rendered on demand
  }
}

function renderIncomeStatement() {
  const reviewed = APP.transactions.filter(t => t.reviewed);
  const income = reviewed.filter(t => t.type === 'income');
  const expenses = reviewed.filter(t => t.type === 'expense');

  // Group by category
  const incomeByCategory = groupByCategory(income);
  const expensesByCategory = groupByCategory(expenses);

  // Update period
  document.getElementById('isReportPeriod').textContent = formatPeriod(APP.currentPeriod);

  // Render revenue
  const revenueTbody = document.getElementById('incomeStatementRevenue');
  revenueTbody.innerHTML = Object.entries(incomeByCategory)
    .map(([cat, amt]) => `
      <tr>
        <td>${cat}</td>
        <td>${formatCurrency(amt)}</td>
      </tr>
    `).join('');

  const totalRevenue = Object.values(incomeByCategory).reduce((sum, v) => sum + v, 0);
  document.getElementById('totalRevenue').textContent = formatCurrency(totalRevenue);

  // Render expenses
  const expensesTbody = document.getElementById('incomeStatementExpenses');
  expensesTbody.innerHTML = Object.entries(expensesByCategory)
    .map(([cat, amt]) => `
      <tr>
        <td>${cat}</td>
        <td>${formatCurrency(amt)}</td>
      </tr>
    `).join('');

  const totalExpenses = Object.values(expensesByCategory).reduce((sum, v) => sum + v, 0);
  document.getElementById('totalExpensesReport').textContent = formatCurrency(totalExpenses);

  // Net income
  const netIncome = totalRevenue - totalExpenses;
  const netIncomeEl = document.getElementById('netIncomeReport');
  netIncomeEl.textContent = formatCurrency(netIncome);
  netIncomeEl.style.color = netIncome >= 0 ? '#10b981' : '#ef4444';
}

function renderCashFlow() {
  const reviewed = APP.transactions.filter(t => t.reviewed);
  const inflows = reviewed.filter(t => t.type === 'income');
  const outflows = reviewed.filter(t => t.type === 'expense');

  document.getElementById('cfReportPeriod').textContent = formatPeriod(APP.currentPeriod);

  // Inflows
  const inflowsByCategory = groupByCategory(inflows);
  const inflowsTbody = document.getElementById('cashFlowInflows');
  inflowsTbody.innerHTML = Object.entries(inflowsByCategory)
    .map(([cat, amt]) => `
      <tr>
        <td>${cat}</td>
        <td>${formatCurrency(amt)}</td>
      </tr>
    `).join('');

  const totalInflows = Object.values(inflowsByCategory).reduce((sum, v) => sum + v, 0);
  document.getElementById('totalInflows').textContent = formatCurrency(totalInflows);

  // Outflows
  const outflowsByCategory = groupByCategory(outflows);
  const outflowsTbody = document.getElementById('cashFlowOutflows');
  outflowsTbody.innerHTML = Object.entries(outflowsByCategory)
    .map(([cat, amt]) => `
      <tr>
        <td>${cat}</td>
        <td>${formatCurrency(amt)}</td>
      </tr>
    `).join('');

  const totalOutflows = Object.values(outflowsByCategory).reduce((sum, v) => sum + v, 0);
  document.getElementById('totalOutflows').textContent = formatCurrency(totalOutflows);

  // Net cash flow
  const netCashFlow = totalInflows - totalOutflows;
  const netCashFlowEl = document.getElementById('netCashFlow');
  netCashFlowEl.textContent = formatCurrency(netCashFlow);
  netCashFlowEl.style.color = netCashFlow >= 0 ? '#10b981' : '#ef4444';
}

function renderCategoryAnalysis() {
  document.getElementById('caReportPeriod').textContent = formatPeriod(APP.currentPeriod);
  
  const reviewed = APP.transactions.filter(t => t.reviewed);
  const expenses = reviewed.filter(t => t.type === 'expense');
  const income = reviewed.filter(t => t.type === 'income');

  const expensesByCategory = groupByCategory(expenses);
  const incomeByCategory = groupByCategory(income);

  const container = document.getElementById('categoryAnalysisContent');
  
  let html = '<div class="report-section"><h4>Expense Categories</h4><table class="report-table"><tbody>';
  
  Object.entries(expensesByCategory)
    .sort((a, b) => b[1] - a[1])
    .forEach(([cat, amt]) => {
      const percent = (amt / Object.values(expensesByCategory).reduce((s, v) => s + v, 0) * 100).toFixed(1);
      html += `
        <tr>
          <td>${cat}</td>
          <td>${formatCurrency(amt)} (${percent}%)</td>
        </tr>
      `;
    });
  
  html += '</tbody></table></div>';

  html += '<div class="report-section"><h4>Income Categories</h4><table class="report-table"><tbody>';
  
  Object.entries(incomeByCategory)
    .sort((a, b) => b[1] - a[1])
    .forEach(([cat, amt]) => {
      const percent = (amt / Object.values(incomeByCategory).reduce((s, v) => s + v, 0) * 100).toFixed(1);
      html += `
        <tr>
          <td>${cat}</td>
          <td>${formatCurrency(amt)} (${percent}%)</td>
        </tr>
      `;
    });
  
  html += '</tbody></table></div>';

  container.innerHTML = html;
}

function runComparison() {
  const period1 = document.getElementById('comparisonPeriod1').value;
  const period2 = document.getElementById('comparisonPeriod2').value;

  const txns1 = JSON.parse(localStorage.getItem(`sbfa_txns_${APP.currentUser.email}_${period1}`) || '[]')
    .filter(t => !t.deleted && t.reviewed);
  const txns2 = JSON.parse(localStorage.getItem(`sbfa_txns_${APP.currentUser.email}_${period2}`) || '[]')
    .filter(t => !t.deleted && t.reviewed);

  const income1 = txns1.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const income2 = txns2.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expenses1 = txns1.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const expenses2 = txns2.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const net1 = income1 - expenses1;
  const net2 = income2 - expenses2;

  const container = document.getElementById('comparisonContent');
  container.innerHTML = `
    <div class="report-section">
      <table class="report-table">
        <thead>
          <tr>
            <th>Metric</th>
            <th>${formatPeriod(period1)}</th>
            <th>${formatPeriod(period2)}</th>
            <th>Change</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Total Income</td>
            <td>${formatCurrency(income1)}</td>
            <td>${formatCurrency(income2)}</td>
            <td style="color: ${income2 >= income1 ? '#10b981' : '#ef4444'}">
              ${formatCurrency(income2 - income1)} (${((income2 - income1) / income1 * 100).toFixed(1)}%)
            </td>
          </tr>
          <tr>
            <td>Total Expenses</td>
            <td>${formatCurrency(expenses1)}</td>
            <td>${formatCurrency(expenses2)}</td>
            <td style="color: ${expenses2 <= expenses1 ? '#10b981' : '#ef4444'}">
              ${formatCurrency(expenses2 - expenses1)} (${((expenses2 - expenses1) / expenses1 * 100).toFixed(1)}%)
            </td>
          </tr>
          <tr class="net-income-row">
            <td><strong>Net Profit/Loss</strong></td>
            <td><strong>${formatCurrency(net1)}</strong></td>
            <td><strong>${formatCurrency(net2)}</strong></td>
            <td style="color: ${net2 >= net1 ? '#10b981' : '#ef4444'}">
              <strong>${formatCurrency(net2 - net1)} (${net1 !== 0 ? ((net2 - net1) / Math.abs(net1) * 100).toFixed(1) : 'N/A'}%)</strong>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  `;
}

// ===========================
// TAX CENTER
// ===========================
function renderTaxCenter() {
  const year = document.getElementById('taxYear')?.value || '2026';
  
  // Get all transactions for the tax year
  const allTxns = [];
  for (let month = 1; month <= 12; month++) {
    const period = `${year}-${String(month).padStart(2, '0')}`;
    const txns = JSON.parse(localStorage.getItem(`sbfa_txns_${APP.currentUser.email}_${period}`) || '[]')
      .filter(t => !t.deleted && t.reviewed);
    allTxns.push(...txns);
  }

  const income = allTxns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expenses = allTxns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const netIncome = income - expenses;
  const selfEmploymentTax = netIncome > 0 ? netIncome * 0.153 : 0;

  document.getElementById('taxDeductibleExpenses').textContent = formatCurrency(expenses);
  document.getElementById('taxBusinessIncome').textContent = formatCurrency(income);
  document.getElementById('taxNetIncome').textContent = formatCurrency(netIncome);
  document.getElementById('taxSelfEmployment').textContent = formatCurrency(selfEmploymentTax);

  // Category breakdown
  const expensesByCategory = groupByCategory(allTxns.filter(t => t.type === 'expense'));
  const breakdown = document.getElementById('taxCategoriesBreakdown');
  
  breakdown.innerHTML = `
    <table class="report-table">
      <thead>
        <tr>
          <th>Schedule C Category</th>
          <th>Amount</th>
        </tr>
      </thead>
      <tbody>
        ${Object.entries(expensesByCategory)
          .sort((a, b) => b[1] - a[1])
          .map(([cat, amt]) => `
            <tr>
              <td>${cat}</td>
              <td>${formatCurrency(amt)}</td>
            </tr>
          `).join('')}
      </tbody>
      <tfoot>
        <tr class="total-row">
          <td><strong>Total Deductions</strong></td>
          <td><strong>${formatCurrency(expenses)}</strong></td>
        </tr>
      </tfoot>
    </table>
  `;
}

// ===========================
// SETTINGS
// ===========================
function renderSettings() {
  // Load business info
  document.getElementById('businessName').value = APP.businessInfo.name || '';
  document.getElementById('taxId').value = APP.businessInfo.taxId || '';
  document.getElementById('businessAddress').value = APP.businessInfo.address || '';
  
  // Update backup status
  updateBackupStatus();
}

function updateBackupStatus() {
  const lastBackup = localStorage.getItem('lastBackupDate');
  const statusEl = document.getElementById('lastBackupText');
  
  if (!statusEl) return;
  
  if (lastBackup) {
    const backupDate = new Date(lastBackup);
    const daysSince = Math.floor((Date.now() - backupDate) / (1000 * 60 * 60 * 24));
    
    let statusText = `Last backup: ${backupDate.toLocaleDateString()} (${daysSince} days ago)`;
    let statusClass = '';
    
    if (daysSince > 30) {
      statusText += ' ⚠️ OVERDUE - Backup recommended!';
      statusClass = 'backup-overdue';
    } else if (daysSince > 14) {
      statusText += ' ⏰ Backup soon recommended';
      statusClass = 'backup-warning';
    } else {
      statusText += ' ✅ Up to date';
      statusClass = 'backup-good';
    }
    
    statusEl.textContent = statusText;
    statusEl.className = statusClass;
  } else {
    statusEl.textContent = '⚠️ No backup created yet - Export your data now!';
    statusEl.className = 'backup-never';
  }
}

function saveBusinessInfo() {
  APP.businessInfo = {
    name: document.getElementById('businessName').value,
    taxId: document.getElementById('taxId').value,
    address: document.getElementById('businessAddress').value
  };

  const bizKey = `sbfa_business_${APP.currentUser.email}`;
  localStorage.setItem(bizKey, JSON.stringify(APP.businessInfo));
  
  showToast('Business information saved', 'success');
}

function closePeriod(period) {
  const periodKey = `sbfa_period_${APP.currentUser.email}_${period}`;
  localStorage.setItem(periodKey, JSON.stringify({ 
    closed: true, 
    closedAt: new Date().toISOString() 
  }));
  
  showToast(`Period ${formatPeriod(period)} closed`, 'success');
  
  if (period === APP.currentPeriod) {
    loadData();
    renderCurrentPage();
  }
}

function reopenPeriod(period) {
  if (!confirm(`Reopen period ${formatPeriod(period)}? This will allow modifications again.`)) {
    return;
  }

  const periodKey = `sbfa_period_${APP.currentUser.email}_${period}`;
  localStorage.setItem(periodKey, JSON.stringify({ closed: false }));
  
  showToast(`Period ${formatPeriod(period)} reopened`, 'success');
  
  if (period === APP.currentPeriod) {
    loadData();
    renderCurrentPage();
  }
}

function exportAllData() {
  const allData = {
    transactions: {},
    periods: {},
    businessInfo: APP.businessInfo,
    exportDate: new Date().toISOString(),
    version: '2.0'
  };

  // Get all transactions
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith(`sbfa_txns_${APP.currentUser.email}`)) {
      allData.transactions[key] = localStorage.getItem(key);
    }
    if (key.startsWith(`sbfa_period_${APP.currentUser.email}`)) {
      allData.periods[key] = localStorage.getItem(key);
    }
  });

  const dataStr = JSON.stringify(allData, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `bookkeeping-backup-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
  
  recordBackup(); // Record that backup was created
}

function importAllData() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  
  input.onchange = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        
        // Import transactions
        Object.entries(data.transactions || {}).forEach(([key, value]) => {
          localStorage.setItem(key, value);
        });
        
        // Import periods
        Object.entries(data.periods || {}).forEach(([key, value]) => {
          localStorage.setItem(key, value);
        });
        
        // Import business info
        if (data.businessInfo) {
          const bizKey = `sbfa_business_${APP.currentUser.email}`;
          localStorage.setItem(bizKey, JSON.stringify(data.businessInfo));
        }
        
        loadData();
        renderCurrentPage();
        showToast('Data imported successfully', 'success');
      } catch (err) {
        showToast('Error importing data: ' + err.message, 'error');
      }
    };
    
    reader.readAsText(file);
  };
  
  input.click();
}

function clearAllData() {
  if (!confirm('Delete ALL data? This cannot be undone!')) return;
  if (!confirm('Are you absolutely sure? All transactions and settings will be permanently deleted!')) return;

  Object.keys(localStorage).forEach(key => {
    if (key.startsWith(`sbfa_`) && key.includes(APP.currentUser.email)) {
      localStorage.removeItem(key);
    }
  });

  APP.transactions = [];
  APP.periods = {};
  APP.businessInfo = {};
  
  renderCurrentPage();
  showToast('All data cleared', 'success');
}

// ===========================
// PDF EXPORT
// ===========================
function generatePDFReport() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  const reviewed = APP.transactions.filter(t => t.reviewed);
  const income = reviewed.filter(t => t.type === 'income');
  const expenses = reviewed.filter(t => t.type === 'expense');

  const incomeByCategory = groupByCategory(income);
  const expensesByCategory = groupByCategory(expenses);

  const totalIncome = Object.values(incomeByCategory).reduce((s, v) => s + v, 0);
  const totalExpenses = Object.values(expensesByCategory).reduce((s, v) => s + v, 0);
  const netIncome = totalIncome - totalExpenses;

  // Header
  doc.setFontSize(20);
  doc.text('Financial Report', 105, 20, { align: 'center' });
  
  doc.setFontSize(12);
  doc.text(`Period: ${formatPeriod(APP.currentPeriod)}`, 105, 30, { align: 'center' });
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 105, 37, { align: 'center' });

  // Business Info
  if (APP.businessInfo.name) {
    doc.setFontSize(10);
    doc.text(APP.businessInfo.name, 20, 50);
    if (APP.businessInfo.taxId) {
      doc.text(`Tax ID: ${APP.businessInfo.taxId}`, 20, 56);
    }
  }

  let yPos = 70;

  // Income Statement
  doc.setFontSize(14);
  doc.text('Income Statement', 20, yPos);
  yPos += 10;

  const incomeData = Object.entries(incomeByCategory).map(([cat, amt]) => [cat, formatCurrency(amt)]);
  incomeData.push(['Total Revenue', formatCurrency(totalIncome)]);

  doc.autoTable({
    startY: yPos,
    head: [['Revenue Category', 'Amount']],
    body: incomeData,
    theme: 'striped',
    headStyles: { fillColor: [102, 126, 234] }
  });

  yPos = doc.lastAutoTable.finalY + 15;

  const expenseData = Object.entries(expensesByCategory).map(([cat, amt]) => [cat, formatCurrency(amt)]);
  expenseData.push(['Total Expenses', formatCurrency(totalExpenses)]);

  doc.autoTable({
    startY: yPos,
    head: [['Expense Category', 'Amount']],
    body: expenseData,
    theme: 'striped',
    headStyles: { fillColor: [239, 68, 68] }
  });

  yPos = doc.lastAutoTable.finalY + 10;

  // Net Income
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text(`Net Income: ${formatCurrency(netIncome)}`, 20, yPos);

  // Save
  doc.save(`financial-report-${APP.currentPeriod}.pdf`);
  showToast('PDF report generated', 'success');
}

function generateTaxPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  const year = document.getElementById('taxYear')?.value || '2026';
  
  const allTxns = [];
  for (let month = 1; month <= 12; month++) {
    const period = `${year}-${String(month).padStart(2, '0')}`;
    const txns = JSON.parse(localStorage.getItem(`sbfa_txns_${APP.currentUser.email}_${period}`) || '[]')
      .filter(t => !t.deleted && t.reviewed);
    allTxns.push(...txns);
  }

  const income = allTxns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expenses = allTxns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const netIncome = income - expenses;

  doc.setFontSize(20);
  doc.text('Tax Summary Report', 105, 20, { align: 'center' });
  
  doc.setFontSize(12);
  doc.text(`Tax Year: ${year}`, 105, 30, { align: 'center' });
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 105, 37, { align: 'center' });

  if (APP.businessInfo.name) {
    doc.setFontSize(10);
    doc.text(APP.businessInfo.name, 20, 50);
    if (APP.businessInfo.taxId) {
      doc.text(`Tax ID: ${APP.businessInfo.taxId}`, 20, 56);
    }
  }

  let yPos = 70;

  doc.setFontSize(14);
  doc.text('Schedule C Summary', 20, yPos);
  yPos += 10;

  const summaryData = [
    ['Gross Receipts (Income)', formatCurrency(income)],
    ['Total Deductible Expenses', formatCurrency(expenses)],
    ['Net Business Income', formatCurrency(netIncome)],
    ['Est. Self-Employment Tax (15.3%)', formatCurrency(netIncome > 0 ? netIncome * 0.153 : 0)]
  ];

  doc.autoTable({
    startY: yPos,
    body: summaryData,
    theme: 'striped',
    headStyles: { fillColor: [102, 126, 234] }
  });

  yPos = doc.lastAutoTable.finalY + 15;

  doc.setFontSize(14);
  doc.text('Expense Deductions by Category', 20, yPos);
  yPos += 10;

  const expensesByCategory = groupByCategory(allTxns.filter(t => t.type === 'expense'));
  const categoryData = Object.entries(expensesByCategory)
    .sort((a, b) => b[1] - a[1])
    .map(([cat, amt]) => [cat, formatCurrency(amt)]);

  doc.autoTable({
    startY: yPos,
    head: [['Category', 'Amount']],
    body: categoryData,
    theme: 'striped',
    headStyles: { fillColor: [102, 126, 234] }
  });

  doc.save(`tax-summary-${year}.pdf`);
  showToast('Tax PDF generated', 'success');
}

function exportToExcel() {
  const reviewed = APP.transactions.filter(t => t.reviewed);
  
  const data = reviewed.map(txn => ({
    Date: txn.date,
    Type: txn.type,
    Category: txn.category,
    Description: txn.description,
    Vendor: txn.vendor,
    Amount: txn.amount,
    'Payment Method': txn.paymentMethod
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Transactions');

  XLSX.writeFile(wb, `transactions-${APP.currentPeriod}.xlsx`);
  showToast('Excel file exported', 'success');
}

// ===========================
// UI HELPERS
// ===========================
function updatePeriodStatus(elementId = 'periodStatusBanner') {
  const banner = document.getElementById(elementId);
  if (!banner) return;

  if (isPeriodClosed()) {
    banner.className = 'status-banner locked';
    banner.innerHTML = '🔒 This period is closed. Transactions are locked and cannot be modified.';
    banner.style.display = 'block';
  } else {
    banner.className = 'status-banner open';
    banner.innerHTML = '✓ This period is open for editing.';
    banner.style.display = 'block';
  }
}

function showAddTransactionModal() {
  if (isPeriodClosed()) {
    showToast('Period is closed. Cannot add transactions.', 'error');
    return;
  }
  openModal('addTransactionModal');
}

function showImportModal() {
  if (isPeriodClosed()) {
    showToast('Period is closed. Cannot import transactions.', 'error');
    return;
  }
  openModal('importModal');
}

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('active');
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('active');
  }
}

function showToast(message, type = 'info') {
  const toast = document.getElementById('notificationToast');
  if (!toast) return;

  toast.textContent = message;
  toast.className = `toast ${type} show`;

  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

function handleLogout() {
  if (confirm('Are you sure you want to logout?')) {
    window.location.href = 'login.html';
  }
}

// ===========================
// UTILITY FUNCTIONS
// ===========================
function formatCurrency(amount) {
  return '$' + Math.abs(amount).toFixed(2);
}

function formatDate(dateStr) {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
}

function formatPeriod(period) {
  const [year, month] = period.split('-');
  const date = new Date(year, parseInt(month) - 1);
  return date.toLocaleDateString('en-US', { 
    month: 'long', 
    year: 'numeric' 
  });
}

function groupByCategory(transactions) {
  const grouped = {};
  transactions.forEach(txn => {
    grouped[txn.category] = (grouped[txn.category] || 0) + txn.amount;
  });
  return grouped;
}

// ===========================
// MAKE FUNCTIONS GLOBAL
// ===========================
window.switchPage = switchPage;
window.toggleReview = toggleReview;
window.deleteTransaction = deleteTransaction;
window.toggleSelectAll = toggleSelectAll;
window.bulkReview = bulkReview;
window.bulkDelete = bulkDelete;
window.handleCheckboxChange = handleCheckboxChange;
window.clearFilters = clearFilters;
window.switchReport = switchReport;
window.runComparison = runComparison;
window.closePeriod = closePeriod;
window.reopenPeriod = reopenPeriod;
window.exportAllData = exportAllData;
window.importAllData = importAllData;
window.clearAllData = clearAllData;
window.generatePDFReport = generatePDFReport;
window.generateTaxPDF = generateTaxPDF;
window.exportToExcel = exportToExcel;
window.showAddTransactionModal = showAddTransactionModal;
window.showImportModal = showImportModal;
window.closeModal = closeModal;
window.confirmImport = function() {
  // Placeholder for import confirmation
  showToast('Import functionality ready', 'info');
};
window.cancelImport = function() {
  closeModal('importModal');
};

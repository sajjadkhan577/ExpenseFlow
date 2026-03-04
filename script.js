// --- Core Application Logic ---
const App = {
    data: {
        transactions: [],
        profile: { name: 'User', budget: 10000, theme: 'light', lang: 'en' },
        categories: ['Food', 'Transport', 'Books/Fees', 'Entertainment', 'Utilities', 'Business', 'Salary', 'Other']
    },

    init() {
        this.loadData();
        this.initUI();
        this.renderAll();
    },

    loadData() {
        const savedTrans = localStorage.getItem('pesh_trans');
        const savedProfile = localStorage.getItem('pesh_profile');
        if (savedTrans) this.data.transactions = JSON.parse(savedTrans);
        if (savedProfile) this.data.profile = JSON.parse(savedProfile);

        // Demo data if empty
        if (this.data.transactions.length === 0) {
            this.data.transactions = [
                { id: 1, type: 'income', amount: 50000, category: 'Salary', desc: 'Monthly Allowance', date: '2026-02-01' },
                { id: 2, type: 'expense', amount: 1500, category: 'Food', desc: 'Namkeen Tikka Dinner', date: '2026-02-05' },
                { id: 3, type: 'expense', amount: 200, category: 'Transport', desc: 'BRT to University', date: '2026-02-08' }
            ];
            this.saveData();
        }
    },

    saveData() {
        localStorage.setItem('pesh_trans', JSON.stringify(this.data.transactions));
        localStorage.setItem('pesh_profile', JSON.stringify(this.data.profile));
    },

    initUI() {
        // Navigation
        document.querySelectorAll('#sidebar .nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.showSection(link.dataset.section);
            });
        });

        // Flatpickr
        flatpickr("#transDate", { defaultDate: "today" });

        // Form
        document.getElementById('transactionForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addTransaction();
        });

        // Edit Form
        document.getElementById('editForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.updateTransaction();
        });

        // Tax Form
        document.getElementById('taxForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.calculateTax();
        });

        // Language init
        setLanguage(this.data.profile.lang);
    },

    showSection(sectionId) {
        document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
        document.getElementById(sectionId).classList.add('active');

        document.querySelectorAll('#sidebar .nav-link').forEach(l => l.classList.remove('active'));
        const navLink = document.querySelector(`[data-section="${sectionId}"]`);
        if (navLink) navLink.classList.add('active');

        // Update title
        const titleKey = 'nav' + sectionId.charAt(0).toUpperCase() + sectionId.slice(1).replace(/-([a-z])/g, (g) => g[1].toUpperCase());
        document.getElementById('sectionTitle').innerText = translations[this.data.profile.lang][titleKey] || sectionId;

        if (sectionId === 'reports') this.renderReports('weekly');
        if (window.innerWidth < 992) toggleSidebar();
    },

    addTransaction() {
        const trans = {
            id: Date.now(),
            type: document.getElementById('transType').value,
            amount: parseFloat(document.getElementById('transAmount').value),
            category: document.getElementById('transCategory').value,
            date: document.getElementById('transDate').value,
            desc: document.getElementById('transDesc').value
        };

        if (isNaN(trans.amount) || trans.amount <= 0) {
            alert('Please enter a valid amount');
            return;
        }

        this.data.transactions.unshift(trans);
        this.saveData();
        this.renderAll();
        this.showSection('dashboard');
        document.getElementById('transactionForm').reset();
    },

    editTransaction(id) {
        const trans = this.data.transactions.find(t => t.id === id);
        if (!trans) return;

        document.getElementById('editId').value = trans.id;
        document.getElementById('editType').value = trans.type;
        document.getElementById('editAmount').value = trans.amount;
        document.getElementById('editCategory').value = trans.category;
        document.getElementById('editDate').value = trans.date;
        document.getElementById('editDesc').value = trans.desc;

        if (!this.editDatePicker) {
            this.editDatePicker = flatpickr("#editDate");
        }
        this.editDatePicker.setDate(trans.date);

        const modal = new bootstrap.Modal(document.getElementById('editModal'));
        modal.show();
    },

    updateTransaction() {
        const id = parseInt(document.getElementById('editId').value);
        const index = this.data.transactions.findIndex(t => t.id === id);

        if (index !== -1) {
            const amount = parseFloat(document.getElementById('editAmount').value);
            if (isNaN(amount) || amount <= 0) {
                alert('Please enter a valid amount');
                return;
            }

            this.data.transactions[index] = {
                id: id,
                type: document.getElementById('editType').value,
                amount: amount,
                category: document.getElementById('editCategory').value,
                date: document.getElementById('editDate').value,
                desc: document.getElementById('editDesc').value
            };

            this.saveData();
            this.renderAll();

            const modalEl = document.getElementById('editModal');
            const modal = bootstrap.Modal.getInstance(modalEl);
            modal.hide();

            alert('Transaction updated successfully!');
        }
    },

    deleteTransaction(id) {
        if (confirm('Delete this record?')) {
            this.data.transactions = this.data.transactions.filter(t => t.id !== id);
            this.saveData();
            this.renderAll();
        }
    },

    renderAll() {
        this.renderDashboard();
        this.renderHistory();
        this.updateTheme();
        this.updateBudgetUI();
    },

    renderDashboard(filterMonth = null) {
        let income = 0, expenses = 0;
        const catTotals = {};

        // Filtering
        const filteredTrans = filterMonth
            ? this.data.transactions.filter(t => t.date && t.date.startsWith(filterMonth))
            : this.data.transactions;

        filteredTrans.forEach(t => {
            if (t.type === 'income') income += t.amount;
            else {
                expenses += t.amount;
                catTotals[t.category] = (catTotals[t.category] || 0) + t.amount;
            }
        });

        document.getElementById('totalIncome').innerText = income.toLocaleString();
        document.getElementById('totalExpenses').innerText = expenses.toLocaleString();
        document.getElementById('netBalance').innerText = (income - expenses).toLocaleString();

        // Update Labels
        const periodLabel = document.getElementById('currentPeriodLabel');
        if (periodLabel) {
            periodLabel.innerText = filterMonth ? `Data for ${filterMonth}` : 'Full History';
        }

        // Recent List (Always show latest overall for dashboard)
        const list = document.getElementById('recentTransactionsList');
        list.innerHTML = this.data.transactions.slice(0, 5).map(t => `
            <div class="d-flex justify-content-between align-items-center mb-3">
                <div class="d-flex align-items-center gap-3">
                    <div class="rounded-circle p-2 ${t.type === 'income' ? 'bg-success' : 'bg-danger'} bg-opacity-10 text-${t.type === 'income' ? 'success' : 'danger'}">
                        <i class="fas fa-${t.type === 'income' ? 'arrow-down' : 'arrow-up'}"></i>
                    </div>
                    <div>
                        <div class="fw-bold text-truncate" style="max-width: 150px;">${t.desc}</div>
                        <div class="small text-muted">${t.date}</div>
                    </div>
                </div>
                <div class="fw-bold text-${t.type === 'income' ? 'success' : 'danger'}">
                    ${t.type === 'income' ? '+' : '-'}₨${t.amount.toLocaleString()}
                </div>
            </div>
        `).join('') || '<p class="text-center text-muted py-4">No transactions found</p>';

        this.updateChart(catTotals);

        // Comparison Logic
        if (filterMonth) {
            this.calculateComparison(filterMonth, expenses);
        } else {
            document.getElementById('comparisonStats').classList.add('d-none');
        }
    },

    handleDashboardFilter() {
        const val = document.getElementById('dashboardMonthFilter').value;
        if (val) this.renderDashboard(val);
    },

    resetDashboardFilter() {
        document.getElementById('dashboardMonthFilter').value = '';
        this.renderDashboard();
    },

    calculateComparison(selectedMonth, currentExpenses) {
        // Get previous month string
        const date = new Date(selectedMonth + "-01");
        date.setMonth(date.getMonth() - 1);
        const prevMonth = date.toISOString().slice(0, 7);

        const prevExpenses = this.data.transactions
            .filter(t => t.type === 'expense' && t.date && t.date.startsWith(prevMonth))
            .reduce((sum, t) => sum + t.amount, 0);

        const statsArea = document.getElementById('comparisonStats');
        const text = document.getElementById('comparisonText');
        const valEl = document.getElementById('comparisonValue');
        const badge = document.getElementById('comparisonBadge');

        statsArea.classList.remove('d-none');

        if (prevExpenses === 0) {
            text.innerText = `No data found for ${prevMonth} to compare.`;
            valEl.innerText = '---';
            badge.innerText = 'N/A';
            badge.className = 'badge bg-secondary';
            return;
        }

        const diff = currentExpenses - prevExpenses;
        const percent = ((diff / prevExpenses) * 100).toFixed(1);

        text.innerText = `Vs Previous Month (${prevMonth})`;
        valEl.innerText = (percent > 0 ? '+' : '') + percent + '%';

        if (percent > 0) {
            badge.innerText = translations[this.data.profile.lang].increasedSpending || 'Increased Spending';
            badge.className = 'badge bg-danger';
        } else {
            badge.innerText = translations[this.data.profile.lang].decreasedSpending || 'Decreased Spending';
            badge.className = 'badge bg-success';
        }
    },

    renderReports(period) {
        const ctx = document.getElementById('trendsChart').getContext('2d');
        if (window.trendChart) window.trendChart.destroy();

        // Group by date
        const grouped = {};
        this.data.transactions.filter(t => t.type === 'expense').forEach(t => {
            if (t.date) grouped[t.date] = (grouped[t.date] || 0) + t.amount;
        });

        const sortedDates = Object.keys(grouped).sort();
        const labels = period === 'weekly' ? sortedDates.slice(-7) : sortedDates.slice(-30);
        const values = labels.map(l => grouped[l]);

        window.trendChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Spending (₨)',
                    data: values,
                    borderColor: '#0d9488',
                    backgroundColor: 'rgba(13, 148, 136, 0.1)',
                    fill: true,
                    tension: 0.3
                }]
            },
            options: { maintainAspectRatio: false }
        });

        // Toggle active button manually
        document.querySelectorAll('#reports .btn-group button').forEach(b => {
            b.classList.toggle('active', b.getAttribute('onclick').includes(`'${period}'`));
        });
    },

    calculateTax() {
        const annual = parseFloat(document.getElementById('annualIncome').value);
        let deductions = 0;
        if (document.getElementById('deductEdu').checked) deductions += annual * 0.05;
        if (document.getElementById('deductCharity').checked) deductions += annual * 0.02; // Mock

        const taxable = Math.max(0, annual - deductions);
        let tax = 0;

        // FBR 2026 Slabs (Salaried Mock)
        if (taxable <= 600000) tax = 0;
        else if (taxable <= 1200000) tax = (taxable - 600000) * 0.05;
        else if (taxable <= 2400000) tax = 30000 + (taxable - 1200000) * 0.15;
        else if (taxable <= 3600000) tax = 210000 + (taxable - 2400000) * 0.25;
        else tax = 510000 + (taxable - 3600000) * 0.35;

        document.getElementById('taxResultsArea').innerHTML = `
            <div class="mb-3 d-flex justify-content-between">
                <span>Taxable Income:</span>
                <span class="fw-bold">₨ ${taxable.toLocaleString()}</span>
            </div>
            <div class="mb-3 d-flex justify-content-between text-danger">
                <span>Total Tax Liability:</span>
                <h4 class="fw-bold">₨ ${tax.toLocaleString()}</h4>
            </div>
            <div class="mb-0 small text-muted">
                *Based on FBR Projections for FY 2026. Includes standard deductions.
            </div>
            <button class="btn btn-dark w-100 mt-4" onclick="App.exportTaxReport(${taxable}, ${tax})">Download Tax Report</button>
        `;
    },

    updateProfileName() {
        const newName = document.getElementById('profileNameInput').value;
        this.data.profile.name = newName;
        this.saveData();
        document.getElementById('profileNameDisplay').innerText = newName;
        alert('Profile updated!');
    },

    updateBudget() {
        this.data.profile.budget = parseFloat(document.getElementById('budgetInput').value);
        this.saveData();
        this.updateBudgetUI();
    },

    updateBudgetUI() {
        const today = new Date();
        const monthStr = today.toISOString().slice(0, 7); // YYYY-MM

        const monthlyExpenses = this.data.transactions
            .filter(t => t && t.type === 'expense' && t.date && t.date.startsWith(monthStr))
            .reduce((sum, t) => sum + t.amount, 0);

        const status = document.getElementById('budgetStatus');
        if (status) {
            if (monthlyExpenses > this.data.profile.budget) {
                status.innerText = 'Over Budget!';
                status.classList.add('text-danger', 'fw-bold');
            } else {
                status.innerText = 'Budget OK';
                status.classList.remove('text-danger', 'fw-bold');
            }
        }
    },

    exportCSV() {
        const csv = Papa.unparse(this.data.transactions);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.setAttribute("download", "transactions.csv");
        link.click();
    },

    exportPDF() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // Header
        doc.setFillColor(13, 148, 136); // Primary Color
        doc.rect(0, 0, 210, 40, 'F');
        doc.setTextColor(255, 255, 255);
        doc.text("EXPENSEFLOW REPORT", 20, 25);
        doc.setFontSize(10);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, 33);

        // Summary Data
        let income = 0, expenses = 0;
        this.data.transactions.forEach(t => {
            if (t.type === 'income') income += t.amount;
            else expenses += t.amount;
        });

        // Summary Box
        doc.setTextColor(51, 65, 85);
        doc.setFontSize(14);
        doc.text("Financial Summary", 20, 55);

        doc.autoTable({
            startY: 60,
            margin: { left: 20 },
            tableWidth: 80,
            head: [['Metric', 'Amount (PKR)']],
            body: [
                ['Total Income', `PKR ${income.toLocaleString()}`],
                ['Total Expenses', `PKR ${expenses.toLocaleString()}`],
                ['Net Balance', `PKR ${(income - expenses).toLocaleString()}`]
            ],
            theme: 'grid',
            headStyles: { fillColor: [13, 148, 136] }
        });

        // Transactions Table
        doc.text("Recent Transactions", 20, doc.lastAutoTable.finalY + 15);

        const tableData = this.data.transactions.map(t => [
            t.date,
            t.category,
            t.desc,
            t.type.toUpperCase(),
            `PKR ${t.amount.toLocaleString()}`
        ]);

        doc.autoTable({
            startY: doc.lastAutoTable.finalY + 20,
            head: [['Date', 'Category', 'Description', 'Type', 'Amount']],
            body: tableData,
            theme: 'striped',
            headStyles: { fillColor: [115, 53, 15] }, // Teak Brown
            alternateRowStyles: { fillColor: [248, 250, 252] }
        });

        // Footer
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(10);
            doc.setTextColor(115, 115, 115);
                doc.text(`ExpenseFlow - Professional Edition | Page ${i} of ${pageCount}`, 105, 285, { align: 'center' });
        }

        doc.save(`ExpenseFlow_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
    },

    exportTaxReport(taxable, tax) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // Header
        doc.setFillColor(30, 41, 59); // Dark Slate
        doc.rect(0, 0, 210, 40, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.text("FBR TAX PROJECTION 2026", 20, 25);
        doc.setFontSize(10);
        doc.text(`Estimated for: ${this.data.profile.name}`, 20, 33);

        // Tax Table
        doc.autoTable({
            startY: 50,
            margin: { left: 20 },
            tableWidth: 100,
            head: [['Tax Description', 'Amount (PKR)']],
            body: [
                ['Taxable Income', `PKR ${taxable.toLocaleString()}`],
                ['Net Tax Liability', `PKR ${tax.toLocaleString()}`],
                ['Monthly Tax Amount', `PKR ${(tax / 12).toLocaleString()}`]
            ],
            theme: 'grid',
            headStyles: { fillColor: [30, 41, 59] }
        });

        // Disclaimer
        doc.setTextColor(115, 115, 115);
        doc.setFontSize(9);
        doc.text("* This is an automated projection based on FBR 2026 tax slabs.", 20, doc.lastAutoTable.finalY + 10);
        doc.text("Please consult a professional tax advisor for official filings.", 20, doc.lastAutoTable.finalY + 15);

        // Footer
        doc.setFontSize(10);
doc.text("Generated via ExpenseFlow - Professional Edition", 105, 285, { align: 'center' });

            doc.save(`Tax_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
    },

    resetData() {
        if (confirm('Are you absolutely sure? All data will be lost.')) {
            localStorage.clear();
            location.reload();
        }
    },

    renderHistory() {
        const body = document.getElementById('historyTableBody');
        body.innerHTML = this.data.transactions.map(t => `
            <tr>
                <td class="small">${t.date}</td>
                <td><span class="badge bg-light text-dark border">${t.category}</span></td>
                <td>${t.desc}</td>
                <td class="fw-bold text-${t.type === 'income' ? 'success' : 'danger'}">
                    ${t.type === 'income' ? '+' : '-'}₨${t.amount.toLocaleString()}
                </td>
                <td>
                    <div class="btn-group">
                        <button class="btn btn-sm btn-outline-primary" onclick="App.editTransaction(${t.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="App.deleteTransaction(${t.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('') || '<tr><td colspan="5" class="text-center text-muted py-4">No transactions found</td></tr>';
    },

    filterHistory() {
        const query = document.getElementById('historySearch').value.toLowerCase();
        const filtered = this.data.transactions.filter(t =>
            t.desc.toLowerCase().includes(query) || t.category.toLowerCase().includes(query)
        );

        const body = document.getElementById('historyTableBody');
        body.innerHTML = filtered.map(t => `
            <tr>
                <td class="small">${t.date}</td>
                <td><span class="badge bg-light text-dark border">${t.category}</span></td>
                <td>${t.desc}</td>
                <td class="fw-bold text-${t.type === 'income' ? 'success' : 'danger'}">
                    ${t.type === 'income' ? '+' : '-'}₨${t.amount.toLocaleString()}
                </td>
                <td>
                    <div class="btn-group">
                        <button class="btn btn-sm btn-outline-primary" onclick="App.editTransaction(${t.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="App.deleteTransaction(${t.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('') || '<tr><td colspan="5" class="text-center text-muted py-4">No matching records</td></tr>';
    },

    updateChart(catTotals) {
        const ctx = document.getElementById('categoryChart').getContext('2d');
        if (window.myChart) window.myChart.destroy();

        window.myChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(catTotals),
                datasets: [{
                    data: Object.values(catTotals),
                    backgroundColor: ['#0d9488', '#78350f', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6', '#ec4899', '#64748b']
                }]
            },
            options: { maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
        });
    },

    updateTheme() {
        if (this.data.profile.theme === 'dark') {
            document.body.classList.add('dark-mode');
            document.getElementById('themeIcon').classList.replace('fa-moon', 'fa-sun');
        } else {
            document.body.classList.remove('dark-mode');
            document.getElementById('themeIcon').classList.replace('fa-sun', 'fa-moon');
        }
    }
};

// --- Utility Globals ---
function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('show');
}

function toggleDarkMode() {
    App.data.profile.theme = App.data.profile.theme === 'light' ? 'dark' : 'light';
    App.saveData();
    App.updateTheme();
}

// Initialize
document.addEventListener('DOMContentLoaded', () => App.init());

// i18n Dictionary
const translations = {
    en: {
        navDashboard: 'Dashboard', navAddTransaction: 'Add Transaction', navHistory: 'History', navReports: 'Reports', navTaxCalc: 'Tax Calculator', navSettings: 'Settings',
        income: 'Total Income', expenses: 'Total Expenses', balance: 'Net Balance',
        categoryBreakdown: 'Category Breakdown', recentTransactions: 'Recent Activity', viewAll: 'View All',
        addNewTransaction: 'Add New Transaction', type: 'Type', expense: 'Expense', amount: 'Amount', category: 'Category', date: 'Date', description: 'Description', btnSave: 'Save Transaction',
                savingTipTitle: 'Smart Saving Tip', savingTipBody: 'Track your expenses regularly to identify spending patterns and optimize your budget for better financial management.',
        transactionHistory: 'Transaction History', actions: 'Actions', editTransaction: 'Edit Transaction',
        spendingComparison: 'Spending Comparison', increasedSpending: 'Increased Spending', decreasedSpending: 'Decreased Spending',
        spendingTrends: 'Spending Trends', weekly: 'Weekly', monthly: 'Monthly', exportData: 'Export Data', btnCSV: 'Export as CSV', btnPDF: 'Export as PDF',
        taxCalcTitle: 'Tax Calculator (FBR 2026)', annualIncome: 'Annual Income', btnCalcTax: 'Calculate Liability', taxResults: 'Tax Summary', userName: 'User Name', monthlyBudget: 'Monthly Budget'
    },
    ur: {
        navDashboard: 'ڈیش بورڈ', navAddTransaction: 'اندراج کریں', navHistory: 'ہسٹری', navReports: 'رپورٹس', navTaxCalc: 'ٹیکس کیلکولیٹر', navSettings: 'سیٹنگز',
        income: 'کل آمدنی', expenses: 'کل اخراجات', balance: 'بقیہ رقم',
        categoryBreakdown: 'زمرہ جات', recentTransactions: 'حالیہ سرگرمی', viewAll: 'سب دیکھیں',
        addNewTransaction: 'نیا اندراج کریں', type: 'قسم', expense: 'خرچہ', amount: 'رقم', category: 'زمرہ', date: 'تاریخ', description: 'تفصیل', btnSave: 'محفوظ کریں',
        savingTipTitle: 'سمارٹ بچت کا ٹپ', savingTipBody: 'اپنے اخراجات کو باقاعدگی سے ٹریک کریں تاکہ خرچ کے نمونے کی نشاندہی کریں اور بہتر مالیاتی انتظام کے لیے اپنے بجٹ کو بہتر بنائیں۔',
        transactionHistory: 'لین دین کی تفصیل', actions: 'عمل', editTransaction: 'تبدیلی کریں',
        spendingComparison: 'اخراجات کا موازنہ', increasedSpending: 'اخراجات میں اضافہ', decreasedSpending: 'اخراجات میں کمی',
        spendingTrends: 'اخراجات کے رجحانات', weekly: 'ہفتہ وار', monthly: 'ماہانہ', exportData: 'ڈیٹا ایکسپورٹ کریں', btnCSV: 'سی ایس وی ایکسپورٹ', btnPDF: 'پی ڈی ایف ایکسپورٹ',
        taxCalcTitle: 'ٹیکس کیلکولیٹر', annualIncome: 'سالانہ آمدنی', btnCalcTax: 'ٹیکس معلوم کریں', taxResults: 'ٹیکس کا خلاصہ', userName: 'صارف کا نام', monthlyBudget: 'ماہانہ بجٹ'
    },
    ps: {
        navDashboard: 'ډشبورډ', navAddTransaction: 'داخله کړی', navHistory: 'تاریخچه', navReports: 'راپورونه', navTaxCalc: 'ټیکس حسابونکی', navSettings: 'ترتیبات',
        income: 'ټوله عاید', expenses: 'ټول لګښتونه', balance: 'پاتې رقم',
        categoryBreakdown: 'د کټګورۍ ویش', recentTransactions: 'وروستي فعالیتونه', viewAll: 'ټول وګورئ',
        addNewTransaction: 'نوې معامله ور اضافه کړئ', type: 'ډول', expense: 'لګښت', amount: 'رقم', category: 'کټګورۍ', date: 'نیټه', description: 'تفصیل', btnSave: 'خوندي کړئ',
        savingTipTitle: 'هوشیار بچت ټپ', savingTipBody: 'خپل مصارف په منظم توب سره تعقیب کړئ تر څو د خرچ نمونې پیژندل شي او د بہتر مالی اداره کولو لپاره خپله بجٹ بہتر کړئ۔',
        transactionHistory: 'د معاملاتو تاریخ', actions: 'عمل', editTransaction: 'اصلاح کول',
        spendingComparison: 'د لګښتونو پرتله کول', increasedSpending: 'د لګښتونو زیاتوالی', decreasedSpending: 'د لګښتونو کمښت',
        spendingTrends: 'د لګښت رجحانات', weekly: 'اونیزه', monthly: 'میاشتنی', exportData: 'ډاټا صادره کړئ', btnCSV: 'CSV صادر کړئ', btnPDF: 'PDF صادر کړئ',
        taxCalcTitle: 'ټیکس حسابونکی', annualIncome: 'کلنی عاید', btnCalcTax: 'ټیکس حساب کړه', taxResults: 'د مالیې لنډیز', userName: 'ستاسو نوم', monthlyBudget: 'میاشتنۍ بودیجه'
    }
};

function setLanguage(lang) {
    App.data.profile.lang = lang;
    App.saveData();
    document.documentElement.lang = lang;
    document.documentElement.dir = (lang === 'ur' || lang === 'ps') ? 'rtl' : 'ltr';
    document.getElementById('currentLang').innerText = lang === 'ur' ? 'اردو' : lang === 'ps' ? 'پښتو' : 'English';

    // Translate elements
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.dataset.i18n;
        if (translations[lang] && translations[lang][key]) {
            if (el.tagName === 'INPUT' && el.type === 'placeholder') el.placeholder = translations[lang][key];
            else el.innerText = translations[lang][key];
        }
    });

    // Update section title based on language
    const activeSectionId = document.querySelector('.section.active').id;
    App.showSection(activeSectionId);
}

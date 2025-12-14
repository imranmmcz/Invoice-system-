// Matsya Hisab - Fish Accounting System
// Author: MiniMax Agent

class MatsyaHisab {
    constructor() {
        this.expenses = this.loadExpenses();
        this.currentPage = 'dashboard';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setCurrentDate();
        this.updateDashboard();
        this.showPage('dashboard');
    }

    // Data Management
    loadExpenses() {
        const stored = localStorage.getItem('matsyaHisabExpenses');
        return stored ? JSON.parse(stored) : [];
    }

    saveExpenses() {
        localStorage.setItem('matsyaHisabExpenses', JSON.stringify(this.expenses));
    }

    // Event Listeners
    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = e.currentTarget.dataset.page;
                this.showPage(page);
            });
        });

        // Mobile menu toggle
        const mobileToggle = document.getElementById('mobile-menu-toggle');
        const sidebar = document.querySelector('.sidebar');
        
        if (mobileToggle) {
            mobileToggle.addEventListener('click', () => {
                sidebar.classList.toggle('active');
            });
        }

        // Daily form
        this.setupDailyForm();

        // Monthly page
        this.setupMonthlyPage();

        // Export functionality
        this.setupExportPage();

        // Form input calculation
        this.setupFormCalculations();
    }

    // Page Management
    showPage(pageName) {
        // Hide all pages
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });

        // Show selected page
        const targetPage = document.getElementById(pageName);
        if (targetPage) {
            targetPage.classList.add('active');
        }

        // Update navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        const activeNav = document.querySelector(`[data-page="${pageName}"]`);
        if (activeNav) {
            activeNav.closest('.nav-item').classList.add('active');
        }

        this.currentPage = pageName;

        // Update page content
        switch (pageName) {
            case 'dashboard':
                this.updateDashboard();
                break;
            case 'monthly':
                this.updateMonthlyPage();
                break;
            case 'yearly':
                this.updateYearlyPage();
                break;
            case 'invoice':
                this.setupInvoicePage();
                break;
        }

        // Close mobile menu
        document.querySelector('.sidebar')?.classList.remove('active');
    }

    // Dashboard Functions
    updateDashboard() {
        const today = new Date().toISOString().split('T')[0];
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();

        const todayExpenses = this.expenses
            .filter(exp => exp.date === today)
            .reduce((sum, exp) => sum + exp.amount, 0);

        const monthExpenses = this.expenses
            .filter(exp => {
                const expDate = new Date(exp.date);
                return expDate.getMonth() + 1 === currentMonth && expDate.getFullYear() === currentYear;
            })
            .reduce((sum, exp) => sum + exp.amount, 0);

        const yearExpenses = this.expenses
            .filter(exp => new Date(exp.date).getFullYear() === currentYear)
            .reduce((sum, exp) => sum + exp.amount, 0);

        // Update dashboard cards
        document.getElementById('today-expense').textContent = this.formatCurrency(todayExpenses);
        document.getElementById('month-expense').textContent = this.formatCurrency(monthExpenses);
        document.getElementById('year-expense').textContent = this.formatCurrency(yearExpenses);

        // Update recent entries
        this.updateRecentEntries();
    }

    updateRecentEntries() {
        const tbody = document.getElementById('recent-entries-body');
        const recentExpenses = this.expenses
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 10);

        tbody.innerHTML = recentExpenses.map(exp => `
            <tr>
                <td>${this.formatDate(exp.date)}</td>
                <td>${this.getCategoryName(exp.category)}</td>
                <td>${exp.item}</td>
                <td class="amount">${this.formatCurrency(exp.amount)}</td>
            </tr>
        `).join('');
    }

    // Daily Form Functions
    setupDailyForm() {
        const form = document.getElementById('daily-form');
        
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveDailyEntry();
            });

            document.getElementById('clear-form').addEventListener('click', () => {
                this.clearForm();
            });
        }
    }

    setCurrentDate() {
        const dateInput = document.getElementById('entry-date');
        if (dateInput) {
            dateInput.value = new Date().toISOString().split('T')[0];
        }
    }

    setupFormCalculations() {
        const inputs = document.querySelectorAll('#daily-form input[type="number"]');
        inputs.forEach(input => {
            input.addEventListener('input', () => {
                this.calculateTotal();
            });
        });
    }

    calculateTotal() {
        const inputs = document.querySelectorAll('#daily-form input[type="number"]');
        let total = 0;

        inputs.forEach(input => {
            const value = parseFloat(input.value) || 0;
            total += value;
        });

        document.getElementById('total-amount').textContent = this.formatCurrency(total);
    }

    saveDailyEntry() {
        const date = document.getElementById('entry-date').value;
        const entries = [];

        // Collect all form data
        const formData = {
            packaging: {
                'ককশীট': parseFloat(document.getElementById('cork-sheet').value) || 0,
                'পলি': parseFloat(document.getElementById('polythene').value) || 0,
                'টেপ': parseFloat(document.getElementById('tape').value) || 0,
                'মার্কার': parseFloat(document.getElementById('marker').value) || 0,
                'কলাপাতা': parseFloat(document.getElementById('banana-leaves').value) || 0
            },
            storage: {
                'বরফ': parseFloat(document.getElementById('ice').value) || 0
            },
            labor: {
                'শ্রমিক': parseFloat(document.getElementById('workers').value) || 0,
                'শ্রমিক যাতায়াত ভাড়া': parseFloat(document.getElementById('worker-transport').value) || 0,
                'বকশিস': parseFloat(document.getElementById('tips').value) || 0,
                'শ্রমিক নাস্তা': parseFloat(document.getElementById('worker-snacks').value) || 0
            },
            transport: {
                'গাড়ি ভাড়া মাছ আনা': parseFloat(document.getElementById('fish-van').value) || 0,
                'গাড়ি ভাড়া বরফ আনা': parseFloat(document.getElementById('ice-van').value) || 0,
                'গাড়ি ভাড়া BFT': parseFloat(document.getElementById('bft-van').value) || 0
            },
            other: {
                'অন্যান্য': parseFloat(document.getElementById('miscellaneous').value) || 0,
                'শেড খরচ': parseFloat(document.getElementById('shed-cost').value) || 0
            }
        };

        // Create entries for non-zero amounts
        Object.keys(formData).forEach(category => {
            Object.keys(formData[category]).forEach(item => {
                const amount = formData[category][item];
                if (amount > 0) {
                    entries.push({
                        id: Date.now() + Math.random(),
                        date: date,
                        category: category,
                        item: item,
                        amount: amount
                    });
                }
            });
        });

        if (entries.length === 0) {
            this.showToast('কমপক্ষে একটি আইটেমের পরিমাণ দিন', 'error');
            return;
        }

        // Save to storage
        this.expenses.push(...entries);
        this.saveExpenses();

        this.showToast(`${entries.length}টি এন্ট্রি সফলভাবে সংরক্ষিত হয়েছে`, 'success');
        this.clearForm();
        this.updateDashboard();
    }

    clearForm() {
        document.getElementById('daily-form').reset();
        this.setCurrentDate();
        this.calculateTotal();
    }

    // Monthly Page Functions
    setupMonthlyPage() {
        document.querySelectorAll('.month-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const month = parseInt(e.target.dataset.month);
                this.selectMonth(month);
            });
        });
    }

    updateMonthlyPage() {
        // Reset month selection
        document.querySelectorAll('.month-btn').forEach(btn => {
            btn.classList.remove('active');
        });
    }

    selectMonth(month) {
        // Update button state
        document.querySelectorAll('.month-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const selectedBtn = document.querySelector(`[data-month="${month}"]`);
        if (selectedBtn) {
            selectedBtn.classList.add('active');
        }

        const monthNames = [
            'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
            'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
        ];

        // Update month name
        document.getElementById('selected-month-name').textContent = monthNames[month - 1];

        // Filter expenses for selected month
        const monthExpenses = this.expenses.filter(exp => {
            const expDate = new Date(exp.date);
            return expDate.getMonth() + 1 === month && expDate.getFullYear() === 2025;
        });

        // Calculate category totals
        const categoryTotals = {
            packaging: 0,
            storage: 0,
            labor: 0,
            transport: 0,
            other: 0
        };

        monthExpenses.forEach(exp => {
            categoryTotals[exp.category] += exp.amount;
        });

        // Update category displays
        document.getElementById('packaging-total').textContent = this.formatCurrency(categoryTotals.packaging);
        document.getElementById('storage-total').textContent = this.formatCurrency(categoryTotals.storage);
        document.getElementById('labor-total').textContent = this.formatCurrency(categoryTotals.labor);
        document.getElementById('transport-total').textContent = this.formatCurrency(categoryTotals.transport);
        document.getElementById('other-total').textContent = this.formatCurrency(categoryTotals.other);

        const total = Object.values(categoryTotals).reduce((sum, val) => sum + val, 0);
        document.getElementById('month-total').textContent = this.formatCurrency(total);

        // Update monthly entries table
        this.updateMonthlyEntriesTable(monthExpenses);
    }

    updateMonthlyEntriesTable(expenses) {
        const tbody = document.getElementById('monthly-entries-body');
        
        tbody.innerHTML = expenses.map(exp => `
            <tr>
                <td>${this.formatDate(exp.date)}</td>
                <td>${this.getCategoryName(exp.category)}</td>
                <td>${exp.item}</td>
                <td class="amount">${this.formatCurrency(exp.amount)}</td>
                <td>
                    <button class="action-btn edit" onclick="app.editEntry('${exp.id}')">সম্পাদনা</button>
                    <button class="action-btn delete" onclick="app.deleteEntry('${exp.id}')">মুছে ফেলুন</button>
                </td>
            </tr>
        `).join('');
    }

    // Yearly Page Functions
    updateYearlyPage() {
        const year = 2025;
        const yearExpenses = this.expenses.filter(exp => new Date(exp.date).getFullYear() === year);

        // Calculate total
        const total = yearExpenses.reduce((sum, exp) => sum + exp.amount, 0);
        document.getElementById('year-total-amount').textContent = this.formatCurrency(total);

        // Calculate category totals
        const categoryTotals = {
            packaging: 0,
            storage: 0,
            labor: 0,
            transport: 0,
            other: 0
        };

        yearExpenses.forEach(exp => {
            categoryTotals[exp.category] += exp.amount;
        });

        // Update category bars and values
        const maxValue = Math.max(...Object.values(categoryTotals));
        
        Object.keys(categoryTotals).forEach(category => {
            const value = categoryTotals[category];
            const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
            
            document.getElementById(`${category}-bar`).style.width = `${percentage}%`;
            document.getElementById(`${category}-year`).textContent = this.formatCurrency(value);
        });

        // Update monthly overview
        this.updateMonthlyOverview();
    }

    updateMonthlyOverview() {
        const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
        
        months.forEach((month, index) => {
            const monthExpenses = this.expenses.filter(exp => {
                const expDate = new Date(exp.date);
                return expDate.getMonth() === index && expDate.getFullYear() === 2025;
            });
            
            const total = monthExpenses.reduce((sum, exp) => sum + exp.amount, 0);
            document.getElementById(`${month}-amount`).textContent = this.formatCurrency(total);
        });
    }

    // Export Functions
    setupExportPage() {
        document.getElementById('export-excel').addEventListener('click', () => {
            this.exportToExcel();
        });

        document.getElementById('export-csv').addEventListener('click', () => {
            this.exportToCSV();
        });

        document.getElementById('export-monthly-pdf').addEventListener('click', () => {
            this.exportMonthlyPDF();
        });

        document.getElementById('export-yearly-pdf').addEventListener('click', () => {
            this.exportYearlyPDF();
        });
    }

    exportToExcel() {
        // Convert data to CSV format for Excel compatibility
        const csvData = this.convertToCSV();
        this.downloadFile(csvData, 'matsya-hisab.csv', 'text/csv');
        this.showToast('Excel ফাইল ডাউনলোড শুরু হয়েছে', 'success');
    }

    exportToCSV() {
        const csvData = this.convertToCSV();
        this.downloadFile(csvData, 'matsya-hisab.csv', 'text/csv');
        this.showToast('CSV ফাইল ডাউনলোড শুরু হয়েছে', 'success');
    }

    convertToCSV() {
        const headers = ['তারিখ', 'বিভাগ', 'আইটেম', 'পরিমাণ', 'একক', 'একক দাম', 'মোট টাকা', 'ইনভয়েজ নম্বর'];
        const rows = this.expenses.map(exp => [
            this.formatDate(exp.date),
            this.getCategoryName(exp.category),
            exp.item,
            exp.quantity || '',
            exp.unit || '',
            exp.unitPrice ? this.formatCurrency(exp.unitPrice) : '',
            this.formatCurrency(exp.amount),
            exp.invoiceId || ''
        ]);

        return [headers, ...rows]
            .map(row => row.map(cell => `"${cell}"`).join(','))
            .join('\n');
    }

    exportMonthlyPDF() {
        // This would require a PDF library in a real implementation
        this.showToast('PDF এক্সপোর্ট সুবিধা শীঘ্রই আসছে', 'info');
    }

    exportYearlyPDF() {
        // This would require a PDF library in a real implementation
        this.showToast('PDF এক্সপোর্ট সুবিধা শীঘ্রই আসছে', 'info');
    }

    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    // Utility Functions
    formatCurrency(amount) {
        return `৳ ${amount.toLocaleString('bn-BD', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('bn-BD', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    getCategoryName(category) {
        const categoryNames = {
            packaging: 'প্যাকেজিং সামগ্রী',
            storage: 'সংরক্ষণ সামগ্রী',
            labor: 'শ্রমিক খরচ',
            transport: 'পরিবহন খরচ',
            other: 'অন্যান্য খরচ'
        };
        return categoryNames[category] || category;
    }

    showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = `toast show ${type}`;
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    // Entry Management
    editEntry(id) {
        const entry = this.expenses.find(exp => exp.id == id);
        if (entry) {
            this.showToast('সম্পাদনা সুবিধা শীঘ্রই আসছে', 'info');
        }
    }

    deleteEntry(id) {
        if (confirm('এই এন্ট্রিটি মুছে ফেলতে চান?')) {
            this.expenses = this.expenses.filter(exp => exp.id != id);
            this.saveExpenses();
            this.showToast('এন্ট্রি মুছে ফেলা হয়েছে', 'success');
            this.updateDashboard();
            
            // Refresh current page if on monthly or yearly
            if (this.currentPage === 'monthly') {
                this.updateMonthlyPage();
            } else if (this.currentPage === 'yearly') {
                this.updateYearlyPage();
            }
        }
    }

    // Search and Filter
    searchExpenses(query) {
        return this.expenses.filter(exp => 
            exp.item.toLowerCase().includes(query.toLowerCase()) ||
            this.getCategoryName(exp.category).toLowerCase().includes(query.toLowerCase())
        );
    }

    filterByDateRange(startDate, endDate) {
        return this.expenses.filter(exp => {
            const expDate = new Date(exp.date);
            return expDate >= new Date(startDate) && expDate <= new Date(endDate);
        });
    }

    filterByCategory(category) {
        return this.expenses.filter(exp => exp.category === category);
    }

    // Invoice Functions
    setupInvoicePage() {
        this.generateInvoiceNumber();
        this.setCurrentDate();
        this.setupInvoiceEventListeners();
        this.addInvoiceItem(); // Add first row by default
    }

    setupInvoiceEventListeners() {
        document.getElementById('add-item-btn').addEventListener('click', () => {
            this.addInvoiceItem();
        });

        document.getElementById('clear-invoice').addEventListener('click', () => {
            this.clearInvoice();
        });

        document.getElementById('preview-invoice').addEventListener('click', () => {
            this.previewInvoice();
        });

        document.getElementById('save-invoice').addEventListener('click', () => {
            this.saveInvoice();
        });

        // Modal close events
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => {
                this.closeModal();
            });
        });

        document.getElementById('print-invoice').addEventListener('click', () => {
            this.printInvoice();
        });

        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            const modal = document.getElementById('invoice-preview-modal');
            if (e.target === modal) {
                this.closeModal();
            }
        });
    }

    generateInvoiceNumber() {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const count = this.expenses.filter(exp => exp.invoiceId).length + 1;
        const invoiceNumber = `INV-${year}${month}-${String(count).padStart(3, '0')}`;
        document.getElementById('invoice-number').value = invoiceNumber;
    }

    addInvoiceItem() {
        const tbody = document.getElementById('invoice-items-body');
        const rowCount = tbody.children.length;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${rowCount + 1}</td>
            <td>
                <select class="item-category">
                    <option value="">বিভাগ নির্বাচন করুন</option>
                    <option value="packaging">প্যাকেজিং সামগ্রী</option>
                    <option value="storage">সংরক্ষণ সামগ্রী</option>
                    <option value="labor">শ্রমিক খরচ</option>
                    <option value="transport">পরিবহন খরচ</option>
                    <option value="other">অন্যান্য খরচ</option>
                </select>
                <input type="text" class="item-name" placeholder="আইটেমের নাম" style="margin-top: 8px;">
            </td>
            <td>
                <select class="item-category-select">
                    <option value="">নির্বাচন করুন</option>
                    <option value="packaging">প্যাকেজিং সামগ্রী</option>
                    <option value="storage">সংরক্ষণ সামগ্রী</option>
                    <option value="labor">শ্রমিক খরচ</option>
                    <option value="transport">পরিবহন খরচ</option>
                    <option value="other">অন্যান্য খরচ</option>
                </select>
            </td>
            <td><input type="number" class="item-quantity" min="1" step="0.01" placeholder="০"></td>
            <td>
                <select class="item-unit">
                    <option value="pcs">টি</option>
                    <option value="kg">কেজি</option>
                    <option value="ltr">লিটার</option>
                    <option value="day">দিন</option>
                    <option value="trip">ট্রিপ</option>
                    <option value="set">সেট</option>
                </select>
            </td>
            <td><input type="number" class="item-price" min="0" step="0.01" placeholder="০.০০"></td>
            <td class="item-total amount-cell">৳ 0</td>
            <td><button class="remove-item-btn" onclick="app.removeInvoiceItem(this)">মুছুন</button></td>
        `;
        
        tbody.appendChild(row);
        this.setupInvoiceItemEvents(row);
        this.updateInvoiceTotals();
    }

    removeInvoiceItem(button) {
        const row = button.closest('tr');
        row.remove();
        this.renumberInvoiceItems();
        this.updateInvoiceTotals();
    }

    renumberInvoiceItems() {
        const rows = document.querySelectorAll('#invoice-items-body tr');
        rows.forEach((row, index) => {
            row.children[0].textContent = index + 1;
        });
    }

    setupInvoiceItemEvents(row) {
        const quantityInput = row.querySelector('.item-quantity');
        const priceInput = row.querySelector('.item-price');
        const categorySelect = row.querySelector('.item-category-select');
        const nameInput = row.querySelector('.item-name');

        // Sync category selection between dropdown and input
        categorySelect.addEventListener('change', () => {
            const categorySelect2 = row.querySelector('.item-category');
            categorySelect2.value = categorySelect.value;
        });

        row.querySelector('.item-category').addEventListener('change', () => {
            categorySelect.value = row.querySelector('.item-category').value;
        });

        // Calculate total when quantity or price changes
        [quantityInput, priceInput].forEach(input => {
            input.addEventListener('input', () => {
                this.calculateRowTotal(row);
            });
        });

        // Auto-fill item name based on category
        categorySelect.addEventListener('change', () => {
            this.autoFillItemName(row);
        });
    }

    autoFillItemName(row) {
        const category = row.querySelector('.item-category-select').value;
        const nameInput = row.querySelector('.item-name');
        
        const categoryItems = {
            packaging: ['ককশীট', 'পলি', 'টেপ', 'মার্কার', 'কলাপাতা'],
            storage: ['বরফ'],
            labor: ['শ্রমিক', 'শ্রমিক যাতায়াত ভাড়া', 'বকশিস', 'শ্রমিক নাস্তা'],
            transport: ['গাড়ি ভাড়া মাছ আনা', 'গাড়ি ভাড়া বরফ আনা', 'গাড়ি ভাড়া BFT'],
            other: ['অন্যান্য', 'শেড খরচ']
        };

        if (categoryItems[category]) {
            nameInput.placeholder = categoryItems[category][0] || 'আইটেমের নাম';
        }
    }

    calculateRowTotal(row) {
        const quantity = parseFloat(row.querySelector('.item-quantity').value) || 0;
        const price = parseFloat(row.querySelector('.item-price').value) || 0;
        const total = quantity * price;
        
        row.querySelector('.item-total').textContent = this.formatCurrency(total);
        this.updateInvoiceTotals();
    }

    updateInvoiceTotals() {
        let subtotal = 0;
        const rows = document.querySelectorAll('#invoice-items-body tr');
        
        rows.forEach(row => {
            const totalText = row.querySelector('.item-total').textContent;
            const total = parseFloat(totalText.replace('৳ ', '').replace(/,/g, '')) || 0;
            subtotal += total;
        });

        const vat = subtotal * 0; // 0% VAT for now
        const grandTotal = subtotal + vat;

        document.getElementById('subtotal').textContent = this.formatCurrency(subtotal);
        document.getElementById('vat').textContent = this.formatCurrency(vat);
        document.getElementById('grand-total').textContent = this.formatCurrency(grandTotal);
    }

    clearInvoice() {
        document.getElementById('invoice-items-body').innerHTML = '';
        this.addInvoiceItem();
        this.generateInvoiceNumber();
        this.setCurrentDate();
        this.updateInvoiceTotals();
    }

    previewInvoice() {
        const invoiceData = this.collectInvoiceData();
        if (invoiceData.items.length === 0) {
            this.showToast('কমপক্ষে একটি আইটেম যোগ করুন', 'error');
            return;
        }

        const previewContent = this.generateInvoicePreview(invoiceData);
        document.getElementById('invoice-preview-content').innerHTML = previewContent;
        document.getElementById('invoice-preview-modal').style.display = 'block';
    }

    saveInvoice() {
        const invoiceData = this.collectInvoiceData();
        if (invoiceData.items.length === 0) {
            this.showToast('কমপক্ষে একটি আইটেম যোগ করুন', 'error');
            return;
        }

        // Save each item as a separate expense entry
        const invoiceId = document.getElementById('invoice-number').value;
        const date = document.getElementById('invoice-date').value;

        invoiceData.items.forEach(item => {
            const expense = {
                id: Date.now() + Math.random(),
                date: date,
                category: item.category,
                item: item.name,
                amount: item.total,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                unit: item.unit,
                invoiceId: invoiceId
            };
            this.expenses.push(expense);
        });

        this.saveExpenses();
        this.showToast(`ইনভয়েজ ${invoiceId} সফলভাবে সংরক্ষিত হয়েছে`, 'success');
        this.clearInvoice();
        this.updateDashboard();
    }

    collectInvoiceData() {
        const items = [];
        const rows = document.querySelectorAll('#invoice-items-body tr');
        
        rows.forEach(row => {
            const category = row.querySelector('.item-category-select').value;
            const name = row.querySelector('.item-name').value.trim();
            const quantity = parseFloat(row.querySelector('.item-quantity').value) || 0;
            const unit = row.querySelector('.item-unit').value;
            const unitPrice = parseFloat(row.querySelector('.item-price').value) || 0;
            const total = quantity * unitPrice;

            if (category && name && quantity > 0 && unitPrice > 0) {
                items.push({
                    category,
                    name,
                    quantity,
                    unit,
                    unitPrice,
                    total
                });
            }
        });

        return {
            date: document.getElementById('invoice-date').value,
            number: document.getElementById('invoice-number').value,
            items,
            subtotal: parseFloat(document.getElementById('subtotal').textContent.replace('৳ ', '').replace(/,/g, '')),
            vat: parseFloat(document.getElementById('vat').textContent.replace('৳ ', '').replace(/,/g, '')),
            total: parseFloat(document.getElementById('grand-total').textContent.replace('৳ ', '').replace(/,/g, ''))
        };
    }

    generateInvoicePreview(data) {
        const itemsHtml = data.items.map(item => `
            <tr>
                <td>${item.name}</td>
                <td>${this.getCategoryName(item.category)}</td>
                <td style="text-align: center;">${item.quantity}</td>
                <td style="text-align: center;">${item.unit}</td>
                <td style="text-align: right;">${this.formatCurrency(item.unitPrice)}</td>
                <td style="text-align: right;">${this.formatCurrency(item.total)}</td>
            </tr>
        `).join('');

        return `
            <div class="invoice-preview">
                <div class="invoice-preview-header">
                    <div class="invoice-preview-company">মাছ ব্যবসা</div>
                    <div class="invoice-preview-address">ঠিকানা: ঢাকা, বাংলাদেশ</div>
                    <div class="invoice-preview-address">ফোন: ০১৭০০০০০০০০</div>
                </div>

                <div class="invoice-preview-invoice-info">
                    <div>
                        <strong>ইনভয়েজ নম্বর:</strong> ${data.number}<br>
                        <strong>তারিখ:</strong> ${this.formatDate(data.date)}
                    </div>
                    <div style="text-align: right;">
                        <strong>বিল তারিখ:</strong> ${this.formatDate(data.date)}
                    </div>
                </div>

                <table class="invoice-preview-table">
                    <thead>
                        <tr>
                            <th>আইটেম</th>
                            <th>বিভাগ</th>
                            <th>পরিমাণ</th>
                            <th>একক</th>
                            <th>একক দাম</th>
                            <th>মোট দাম</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHtml}
                    </tbody>
                </table>

                <div class="invoice-preview-summary">
                    <div class="invoice-preview-summary-row">
                        <span>সাবটোটাল:</span>
                        <span>${this.formatCurrency(data.subtotal)}</span>
                    </div>
                    <div class="invoice-preview-summary-row">
                        <span>ভ্যাট (০%):</span>
                        <span>${this.formatCurrency(data.vat)}</span>
                    </div>
                    <div class="invoice-preview-summary-row total">
                        <span>মোট:</span>
                        <span>${this.formatCurrency(data.total)}</span>
                    </div>
                </div>
            </div>
        `;
    }

    closeModal() {
        document.getElementById('invoice-preview-modal').style.display = 'none';
    }

    printInvoice() {
        const printContent = document.getElementById('invoice-preview-content').innerHTML;
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>ইনভয়েজ প্রিন্ট</title>
                    <style>
                        body { font-family: 'Hind Siliguri', sans-serif; margin: 20px; }
                        .invoice-preview { background: white; }
                        .invoice-preview-table { width: 100%; border-collapse: collapse; }
                        .invoice-preview-table th, .invoice-preview-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                        .invoice-preview-table th { background: #00695C; color: white; }
                        .invoice-preview-summary { margin-left: auto; width: 300px; }
                        .invoice-preview-summary-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #ddd; }
                        .invoice-preview-summary-row.total { font-weight: bold; font-size: 18px; color: #00695C; border-top: 2px solid #00695C; }
                        @media print { body { margin: 0; } }
                    </style>
                </head>
                <body>${printContent}</body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    }
}

// Initialize the application
const app = new MatsyaHisab();

// Global functions for inline event handlers
window.app = app;

// Matsya Hisab - Fish Accounting System
// Author: MiniMax Agent

class MatsyaHisab {
    constructor() {
        this.expenses = this.loadExpenses();
        this.income = this.loadIncome();
        this.customers = this.loadCustomers();
        this.currentPage = 'dashboard';
        this.editingInvoiceId = null; // Track if we're editing an invoice
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

    loadIncome() {
        const stored = localStorage.getItem('matsyaHisabIncome');
        return stored ? JSON.parse(stored) : [];
    }

    saveIncome() {
        localStorage.setItem('matsyaHisabIncome', JSON.stringify(this.income));
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

        // Invoice page
        this.setupInvoicePage();
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
            case 'invoices-list':
                this.setupInvoicesListPage();
                break;
            case 'customers':
                this.setupCustomersPage();
                break;
            case 'income':
                this.setupIncomePage();
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

        // Calculate expenses
        const todayExpenses = this.expenses
            .filter(exp => exp.date === today)
            .reduce((sum, exp) => sum + exp.amount, 0);

        const monthExpenses = this.expenses
            .filter(exp => {
                const expDate = new Date(exp.date);
                return expDate.getMonth() + 1 === currentMonth && expDate.getFullYear() === currentYear;
            })
            .reduce((sum, exp) => sum + exp.amount, 0);

        const totalExpenses = this.expenses
            .filter(exp => new Date(exp.date).getFullYear() === currentYear)
            .reduce((sum, exp) => sum + exp.amount, 0);

        // Calculate income
        const todayIncome = this.income
            .filter(inc => inc.date === today)
            .reduce((sum, inc) => sum + inc.amount, 0);

        const monthIncome = this.income
            .filter(inc => {
                const incDate = new Date(inc.date);
                return incDate.getMonth() + 1 === currentMonth && incDate.getFullYear() === currentYear;
            })
            .reduce((sum, inc) => sum + inc.amount, 0);

        const totalIncome = this.income
            .filter(inc => new Date(inc.date).getFullYear() === currentYear)
            .reduce((sum, inc) => sum + inc.amount, 0);

        // Calculate balance
        const currentBalance = totalIncome - totalExpenses;
        const todayBalance = todayIncome - todayExpenses;
        const monthBalance = monthIncome - monthExpenses;

        // Update dashboard cards
        document.getElementById('total-income').textContent = this.formatCurrency(totalIncome);
        document.getElementById('total-expense').textContent = this.formatCurrency(totalExpenses);
        document.getElementById('current-balance').textContent = this.formatCurrency(currentBalance);
        document.getElementById('month-expense').textContent = this.formatCurrency(monthExpenses);

        // Update financial summary
        this.updateFinancialSummary({
            todayIncome,
            todayExpenses,
            todayBalance,
            monthIncome,
            monthExpenses,
            monthBalance,
            totalIncome,
            totalExpenses,
            currentBalance
        });

        // Update recent entries
        this.updateRecentEntries();
    }

    updateFinancialSummary(data) {
        // Update individual summary items
        document.getElementById('today-income').textContent = this.formatCurrency(data.todayIncome);
        document.getElementById('month-income').textContent = this.formatCurrency(data.monthIncome);
        document.getElementById('total-income-summary').textContent = this.formatCurrency(data.totalIncome);

        document.getElementById('today-expense-summary').textContent = this.formatCurrency(data.todayExpenses);
        document.getElementById('month-expense-summary').textContent = this.formatCurrency(data.monthExpenses);
        document.getElementById('total-expense-summary').textContent = this.formatCurrency(data.totalExpenses);

        // Update balance with color coding
        const todayBalanceEl = document.getElementById('today-balance');
        const monthBalanceEl = document.getElementById('month-balance');
        const currentBalanceEl = document.getElementById('current-balance-summary');

        todayBalanceEl.textContent = this.formatCurrency(data.todayBalance);
        monthBalanceEl.textContent = this.formatCurrency(data.monthBalance);
        currentBalanceEl.textContent = this.formatCurrency(data.currentBalance);

        // Apply color classes
        todayBalanceEl.className = data.todayBalance >= 0 ? 'positive' : 'negative';
        monthBalanceEl.className = data.monthBalance >= 0 ? 'positive' : 'negative';
        currentBalanceEl.className = data.currentBalance >= 0 ? 'positive' : 'negative';
    }

    updateRecentEntries() {
        const tbody = document.getElementById('recent-entries-body');
        
        // Combine income and expenses
        const allTransactions = [
            ...this.expenses.map(exp => ({
                ...exp,
                type: 'expense',
                typeName: 'ব্যয়'
            })),
            ...this.income.map(inc => ({
                ...inc,
                type: 'income',
                typeName: 'আয়',
                category: inc.type,
                item: inc.source
            }))
        ];

        // Sort by date (newest first) and take only 10
        const recentTransactions = allTransactions
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 10);

        tbody.innerHTML = recentTransactions.map(trans => `
            <tr>
                <td>${this.formatDate(trans.date)}</td>
                <td>
                    <span class="income-type-badge ${trans.type}">${trans.typeName}</span>
                </td>
                <td>${this.getCategoryName(trans.category)}</td>
                <td>${trans.item}</td>
                <td class="amount ${trans.type === 'income' ? 'positive' : 'negative'}">
                    ${trans.type === 'income' ? '+' : '-'}${this.formatCurrency(trans.amount)}
                </td>
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

    // Invoice Functions
    setupInvoicePage() {
        this.generateInvoiceNumber();
        this.setCurrentDate();
        this.setupInvoiceEventListeners();
        this.addInvoiceRow(); // Add first row by default
        
        // Ensure initial totals calculation with delay
        setTimeout(() => {
            this.updateInvoiceTotals();
            console.log('Initial invoice totals calculated');
        }, 200);
        
        // Reset editing state if not already editing
        if (!this.editingInvoiceId) {
            document.getElementById('invoice-page-title').textContent = 'ইনভয়েজ তৈরি';
            document.getElementById('invoice-page-subtitle').textContent = 'প্রফেশনাল ইনভয়েজ তৈরি করুন এবং অটো ক্যালকুলেশন করুন';
            document.querySelector('.invoice-container').classList.remove('edit-mode');
        } else {
            document.querySelector('.invoice-container').classList.add('edit-mode');
        }
    }

    setupInvoiceEventListeners() {
        const addRowBtn = document.getElementById('add-row-btn');
        if (addRowBtn) {
            addRowBtn.replaceWith(addRowBtn.cloneNode(true));
            document.getElementById('add-row-btn').addEventListener('click', () => {
                this.addInvoiceRow();
            });
        }

        const clearInvoiceBtn = document.getElementById('clear-invoice');
        if (clearInvoiceBtn) {
            clearInvoiceBtn.replaceWith(clearInvoiceBtn.cloneNode(true));
            document.getElementById('clear-invoice').addEventListener('click', () => {
                this.clearInvoice();
            });
        }

        const previewBtn = document.getElementById('preview-invoice');
        if (previewBtn) {
            previewBtn.replaceWith(previewBtn.cloneNode(true));
            document.getElementById('preview-invoice').addEventListener('click', () => {
                this.previewInvoice();
            });
        }

        const saveBtn = document.getElementById('save-invoice');
        if (saveBtn) {
            saveBtn.replaceWith(saveBtn.cloneNode(true));
            document.getElementById('save-invoice').addEventListener('click', () => {
                this.saveInvoice();
            });
        }

        // Modal close events
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.replaceWith(btn.cloneNode(true));
            document.querySelectorAll('.modal-close').forEach(newBtn => {
                newBtn.addEventListener('click', () => {
                    this.closeModal();
                });
            });
        });

        const printBtn = document.getElementById('print-invoice');
        if (printBtn) {
            printBtn.replaceWith(printBtn.cloneNode(true));
            document.getElementById('print-invoice').addEventListener('click', () => {
                this.printInvoice();
            });
        }

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

    // Item list based on the original image
    getAllItems() {
        return [
            // Packaging Materials
            { name: 'ককশীট', category: 'packaging' },
            { name: 'পলি', category: 'packaging' },
            { name: 'টেপ', category: 'packaging' },
            { name: 'মার্কার', category: 'packaging' },
            { name: 'কলাপাতা', category: 'packaging' },
            // Storage Materials
            { name: 'বরফ', category: 'storage' },
            // Labor Costs
            { name: 'শ্রমিক', category: 'labor' },
            { name: 'শ্রমিক যাতায়াত ভাড়া', category: 'labor' },
            { name: 'বকশিস', category: 'labor' },
            { name: 'শ্রমিক নাস্তা', category: 'labor' },
            // Transportation
            { name: 'গাড়ি ভাড়া মাছ আনা', category: 'transport' },
            { name: 'গাড়ি ভাড়া বরফ আনা', category: 'transport' },
            { name: 'গাড়ি ভাড়া BFT', category: 'transport' },
            // Other
            { name: 'অন্যান্য', category: 'other' },
            { name: 'শেড খরচ', category: 'other' }
        ];
    }

    addInvoiceRow() {
        const tbody = document.getElementById('invoice-items-body');
        const rowCount = tbody.children.length;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td style="text-align: center; font-weight: 600;">${rowCount + 1}</td>
            <td>
                <select class="item-select" required>
                    <option value="">আইটেম নির্বাচন করুন</option>
                    ${this.getAllItems().map(item => 
                        `<option value="${item.name}|${item.category}">${item.name}</option>`
                    ).join('')}
                </select>
            </td>
            <td><input type="number" class="unit-price" min="0" step="0.01" placeholder="০.০০" required></td>
            <td><input type="number" class="quantity" min="1" step="1" placeholder="০" required></td>
            <td class="row-total" style="text-align: right; font-weight: 600; background: #F8FAFC;">৳ 0</td>
            <td style="text-align: center;"><button class="remove-row-btn" onclick="app.removeInvoiceRow(this)">মুছুন</button></td>
        `;
        
        tbody.appendChild(row);
        
        // Setup events with a small delay to ensure DOM is updated
        setTimeout(() => {
            this.setupInvoiceRowEvents(row);
            this.updateInvoiceTotals();
        }, 50);
    }

    removeInvoiceRow(button) {
        const row = button.closest('tr');
        row.remove();
        this.renumberInvoiceRows();
        this.updateInvoiceTotals();
    }

    renumberInvoiceRows() {
        const rows = document.querySelectorAll('#invoice-items-body tr');
        rows.forEach((row, index) => {
            row.children[0].textContent = index + 1;
        });
    }

    setupInvoiceRowEvents(row) {
        const unitPriceInput = row.querySelector('.unit-price');
        const quantityInput = row.querySelector('.quantity');

        if (unitPriceInput && quantityInput) {
            // Remove existing listeners to prevent duplicates
            const newUnitPriceInput = unitPriceInput.cloneNode(true);
            const newQuantityInput = quantityInput.cloneNode(true);
            
            unitPriceInput.parentNode.replaceChild(newUnitPriceInput, unitPriceInput);
            quantityInput.parentNode.replaceChild(newQuantityInput, quantityInput);
            
            // Add event listeners to the new inputs
            newUnitPriceInput.addEventListener('input', () => {
                this.calculateRowTotal(row);
            });
            
            newQuantityInput.addEventListener('input', () => {
                this.calculateRowTotal(row);
            });
            
            // Also add change event for better compatibility
            newUnitPriceInput.addEventListener('change', () => {
                this.calculateRowTotal(row);
            });
            
            newQuantityInput.addEventListener('change', () => {
                this.calculateRowTotal(row);
            });
        }
    }

    calculateRowTotal(row) {
        const unitPriceInput = row.querySelector('.unit-price');
        const quantityInput = row.querySelector('.quantity');
        
        if (!unitPriceInput || !quantityInput) {
            console.error('Unit price or quantity input not found');
            return;
        }
        
        // Parse inputs safely
        let unitPrice = parseFloat(unitPriceInput.value) || 0;
        let quantity = parseFloat(quantityInput.value) || 0;
        
        // Ensure positive values
        unitPrice = Math.max(0, unitPrice);
        quantity = Math.max(0, quantity);
        
        const total = unitPrice * quantity;
        
        const totalElement = row.querySelector('.row-total');
        if (totalElement) {
            totalElement.textContent = this.formatCurrency(total);
            console.log(`Row total calculated: ${total}`);
        }
        
        // Update the invoice totals immediately
        this.updateInvoiceTotals();
    }

    updateInvoiceTotals() {
        let subtotal = 0;
        const rows = document.querySelectorAll('#invoice-items-body tr');
        
        console.log('Updating invoice totals, rows found:', rows.length);
        
        rows.forEach((row, index) => {
            const totalElement = row.querySelector('.row-total');
            if (totalElement) {
                const totalText = totalElement.textContent;
                console.log(`Row ${index + 1} total text:`, totalText);
                
                // Remove currency symbol and clean the text
                let cleanText = totalText.replace(/[৳$]/g, '').trim();
                
                // Convert Bengali numerals to English numerals
                const bengaliNumerals = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
                const englishNumerals = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
                
                bengaliNumerals.forEach((bengali, index) => {
                    cleanText = cleanText.replace(new RegExp(bengali, 'g'), englishNumerals[index]);
                });
                
                // Remove any remaining non-numeric characters except decimal point
                cleanText = cleanText.replace(/[^\d.-]/g, '');
                
                const total = parseFloat(cleanText) || 0;
                subtotal += total;
                console.log(`Row ${index + 1} parsed total:`, total, 'Clean text:', cleanText);
            } else {
                console.error(`Row ${index + 1} total element not found`);
            }
        });

        const vat = subtotal * 0; // 0% VAT for now
        const grandTotal = subtotal + vat;

        console.log('Final totals:', { subtotal, vat, grandTotal });

        const subtotalElement = document.getElementById('subtotal');
        const vatElement = document.getElementById('vat');
        const grandTotalElement = document.getElementById('grand-total');
        
        if (subtotalElement && vatElement && grandTotalElement) {
            subtotalElement.textContent = this.formatCurrency(subtotal);
            vatElement.textContent = this.formatCurrency(vat);
            grandTotalElement.textContent = this.formatCurrency(grandTotal);
            
            console.log('Totals updated successfully');
        } else {
            console.error('Invoice total elements not found');
            console.log('Subtotal element:', !!subtotalElement);
            console.log('VAT element:', !!vatElement);
            console.log('Grand total element:', !!grandTotalElement);
        }
    }

    clearInvoice() {
        document.getElementById('invoice-items-body').innerHTML = '';
        this.addInvoiceRow();
        this.generateInvoiceNumber();
        this.setCurrentDate();
        this.updateInvoiceTotals();
        this.editingInvoiceId = null; // Clear editing flag
        
        // Restore original page title
        document.getElementById('invoice-page-title').textContent = 'ইনভয়েজ তৈরি';
        document.getElementById('invoice-page-subtitle').textContent = 'প্রফেশনাল ইনভয়েজ তৈরি করুন এবং অটো ক্যালকুলেশন করুন';
    }

    // Universal modal display function
    showInvoiceModal(content) {
        const previewContentElement = document.getElementById('invoice-preview-content');
        const previewModalElement = document.getElementById('invoice-preview-modal');
        
        if (previewContentElement && previewModalElement) {
            previewContentElement.innerHTML = content;
            
            // Add modal-open class to body to prevent background scrolling
            document.body.classList.add('modal-open');
            
            // Force immediate display with multiple methods
            previewModalElement.classList.add('show');
            previewModalElement.style.display = 'flex';
            previewModalElement.style.visibility = 'visible';
            previewModalElement.style.opacity = '1';
            previewModalElement.style.zIndex = '99999';
            
            // Force reflow to ensure display takes effect
            previewModalElement.offsetHeight;
            
            console.log('Modal displayed with content');
            return true;
        } else {
            console.error('Modal elements not found');
            console.log('Content element:', !!previewContentElement);
            console.log('Modal element:', !!previewModalElement);
            return false;
        }
    }

    previewInvoice() {
        console.log('previewInvoice called');
        const invoiceData = this.collectInvoiceData();
        console.log('Invoice data:', invoiceData);
        
        if (invoiceData.items.length === 0) {
            this.showToast('কমপক্ষে একটি আইটেম যোগ করুন', 'error');
            return;
        }

        const previewContent = this.generateInvoicePreview(invoiceData);
        this.showInvoiceModal(previewContent);
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
        const customerId = document.getElementById('invoice-customer').value;

        invoiceData.items.forEach(item => {
            const expense = {
                id: Date.now() + Math.random(),
                date: date,
                category: item.category,
                item: item.name,
                amount: item.total,
                quantity: item.quantity,
                customerId: customerId,
                unitPrice: item.unitPrice,
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
            const itemSelect = row.querySelector('.item-select');
            const unitPriceInput = row.querySelector('.unit-price');
            const quantityInput = row.querySelector('.quantity');
            
            const itemValue = itemSelect.value;
            if (itemValue) {
                const [name, category] = itemValue.split('|');
                const unitPrice = parseFloat(unitPriceInput.value) || 0;
                const quantity = parseFloat(quantityInput.value) || 0;
                const total = unitPrice * quantity;

                if (unitPrice > 0 && quantity > 0) {
                    items.push({
                        name,
                        category,
                        unitPrice,
                        quantity,
                        total
                    });
                }
            }
        });

        return {
            date: document.getElementById('invoice-date').value,
            number: document.getElementById('invoice-number').value,
            customerId: document.getElementById('invoice-customer').value,
            items,
            subtotal: parseFloat(document.getElementById('subtotal').textContent.replace('৳ ', '').replace(/,/g, '')),
            vat: parseFloat(document.getElementById('vat').textContent.replace('৳ ', '').replace(/,/g, '')),
            total: parseFloat(document.getElementById('grand-total').textContent.replace('৳ ', '').replace(/,/g, ''))
        };
    }

    generateInvoicePreview(data) {
        const itemsHtml = data.items.map(item => `
            <tr>
                <td style="text-align: center;">${item.name}</td>
                <td style="text-align: center;">${this.getCategoryName(item.category)}</td>
                <td style="text-align: center;">${item.quantity}</td>
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
        const modal = document.getElementById('invoice-preview-modal');
        if (modal) {
            modal.classList.remove('show');
            modal.style.display = 'none';
            modal.style.visibility = 'hidden';
            modal.style.opacity = '0';
            modal.style.zIndex = '-1';
            
            // Remove modal-open class from body
            document.body.classList.remove('modal-open');
            
            console.log('Modal closed');
        }
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
        const headers = ['তারিখ', 'বিভাগ', 'আইটেম', 'পরিমাণ', 'একক দাম', 'মোট টাকা', 'ইনভয়েজ নম্বর'];
        const rows = this.expenses.map(exp => [
            this.formatDate(exp.date),
            this.getCategoryName(exp.category),
            exp.item,
            exp.quantity || '',
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

    // Invoices List Functions
    setupInvoicesListPage() {
        this.loadInvoicesList();
        this.setupInvoicesListEvents();
    }

    setupInvoicesListEvents() {
        // Search functionality
        const searchInput = document.getElementById('invoice-search');
        if (searchInput) {
            searchInput.addEventListener('input', () => {
                this.filterInvoices();
            });
        }

        // Month filter
        const monthFilter = document.getElementById('invoice-month-filter');
        if (monthFilter) {
            monthFilter.addEventListener('change', () => {
                this.filterInvoices();
            });
        }
    }

    loadInvoicesList() {
        const invoiceGroups = this.groupExpensesByInvoice();
        this.displayInvoicesList(invoiceGroups);
    }

    groupExpensesByInvoice() {
        const grouped = {};
        
        this.expenses.forEach(expense => {
            if (expense.invoiceId) {
                if (!grouped[expense.invoiceId]) {
                    grouped[expense.invoiceId] = {
                        id: expense.invoiceId,
                        date: expense.date,
                        items: [],
                        total: 0
                    };
                }
                grouped[expense.invoiceId].items.push(expense);
                grouped[expense.invoiceId].total += expense.amount;
            }
        });

        // Sort by date (newest first)
        return Object.values(grouped).sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    displayInvoicesList(invoices) {
        const tbody = document.getElementById('invoices-table-body');
        const noDataMessage = document.getElementById('no-invoices-message');
        
        if (invoices.length === 0) {
            tbody.innerHTML = '';
            noDataMessage.style.display = 'block';
            return;
        }

        noDataMessage.style.display = 'none';
        
        tbody.innerHTML = invoices.map(invoice => `
            <tr>
                <td style="font-weight: 600; color: #00695C;">${invoice.id}</td>
                <td>${this.formatDate(invoice.date)}</td>
                <td>${this.getCustomerName(invoice.customerId)}</td>
                <td style="text-align: center;">${invoice.items.length}</td>
                <td class="invoice-amount">${this.formatCurrency(invoice.total)}</td>
                <td>
                    <div class="invoice-actions">
                        <button class="invoice-action-btn view" onclick="app.viewInvoice('${invoice.id}')" title="দেখুন">
                            👁️
                        </button>
                        <button class="invoice-action-btn edit" onclick="app.editInvoice('${invoice.id}')" title="সম্পাদনা">
                            ✏️
                        </button>
                        <button class="invoice-action-btn duplicate" onclick="app.duplicateInvoice('${invoice.id}')" title="কপি করুন">
                            📋
                        </button>
                        <button class="invoice-action-btn delete" onclick="app.deleteInvoice('${invoice.id}')" title="মুছে ফেলুন">
                            🗑️
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    filterInvoices() {
        const searchTerm = document.getElementById('invoice-search').value.toLowerCase();
        const selectedMonth = document.getElementById('invoice-month-filter').value;
        
        let invoices = this.groupExpensesByInvoice();
        
        // Apply search filter
        if (searchTerm) {
            invoices = invoices.filter(invoice => 
                invoice.id.toLowerCase().includes(searchTerm) ||
                this.formatDate(invoice.date).toLowerCase().includes(searchTerm)
            );
        }
        
        // Apply month filter
        if (selectedMonth) {
            invoices = invoices.filter(invoice => {
                const invoiceMonth = new Date(invoice.date).getMonth() + 1;
                return invoiceMonth.toString() === selectedMonth;
            });
        }
        
        this.displayInvoicesList(invoices);
    }

    viewInvoice(invoiceId) {
        console.log('viewInvoice called for invoice:', invoiceId);
        const invoiceData = this.getInvoiceData(invoiceId);
        if (!invoiceData) {
            this.showToast('ইনভয়েজ খুঁজে পাওয়া যায়নি', 'error');
            return;
        }

        const previewContent = this.generateInvoicePreview(invoiceData);
        const success = this.showInvoiceModal(previewContent);
        
        if (success) {
            console.log('Invoice view modal opened successfully');
        } else {
            console.error('Failed to open invoice view modal');
        }
    }

    editInvoice(invoiceId) {
        const invoiceData = this.getInvoiceData(invoiceId);
        if (!invoiceData) {
            this.showToast('ইনভয়েজ খুঁজে পাওয়া যায়নি', 'error');
            return;
        }

        // Pre-populate the invoice form
        this.populateInvoiceForm(invoiceData);
        
        // Switch to invoice page
        this.showPage('invoice');
        
        // Set flag that we're editing
        this.editingInvoiceId = invoiceId;
        this.showToast(`ইনভয়েজ ${invoiceId} সম্পাদনার জন্য খোলা হয়েছে`, 'info');
    }

    populateInvoiceForm(invoiceData) {
        // Update page title to show editing mode
        document.getElementById('invoice-page-title').textContent = 'ইনভয়েজ সম্পাদনা';
        document.getElementById('invoice-page-subtitle').textContent = `ইনভয়েজ ${invoiceData.number} সম্পাদনা করুন`;
        
        // Set invoice date and number
        document.getElementById('invoice-date').value = invoiceData.date;
        document.getElementById('invoice-number').value = invoiceData.number;
        
        // Set customer if exists
        if (invoiceData.customerId) {
            document.getElementById('invoice-customer').value = invoiceData.customerId;
        }
        
        // Clear existing rows
        document.getElementById('invoice-items-body').innerHTML = '';
        
        // Add rows with existing data
        invoiceData.items.forEach(item => {
            this.addInvoiceRow();
            const lastRow = document.querySelector('#invoice-items-body tr:last-child');
            
            // Set item
            const itemSelect = lastRow.querySelector('.item-select');
            itemSelect.value = `${item.name}|${item.category}`;
            
            // Set unit price and quantity
            lastRow.querySelector('.unit-price').value = item.unitPrice;
            lastRow.querySelector('.quantity').value = item.quantity;
            
            // Calculate row total
            this.calculateRowTotal(lastRow);
        });
        
        // Update totals
        this.updateInvoiceTotals();
    }

    duplicateInvoice(invoiceId) {
        const invoiceData = this.getInvoiceData(invoiceId);
        if (!invoiceData) {
            this.showToast('ইনভয়েজ খুঁজে পাওয়া যায়নি', 'error');
            return;
        }

        // Generate new invoice number
        this.generateInvoiceNumber();
        
        // Pre-populate with existing data (but not save)
        const newInvoiceData = {
            ...invoiceData,
            number: document.getElementById('invoice-number').value,
            date: new Date().toISOString().split('T')[0] // Set to today
        };
        
        this.populateInvoiceForm(newInvoiceData);
        this.showPage('invoice');
        this.showToast(`ইনভয়েজ ${invoiceId} থেকে নতুন কপি তৈরি হয়েছে`, 'success');
    }

    deleteInvoice(invoiceId) {
        if (confirm(`ইনভয়েজ ${invoiceId} মুছে ফেলতে চান? এই কাজটি পূর্বাবস্থায় ফেরানো যাবে না।`)) {
            // Remove all expenses with this invoice ID
            this.expenses = this.expenses.filter(exp => exp.invoiceId !== invoiceId);
            this.saveExpenses();
            
            // Refresh the list
            this.loadInvoicesList();
            this.updateDashboard();
            
            this.showToast(`ইনভয়েজ ${invoiceId} মুছে ফেলা হয়েছে`, 'success');
        }
    }

    getInvoiceData(invoiceId) {
        const invoiceExpenses = this.expenses.filter(exp => exp.invoiceId === invoiceId);
        
        if (invoiceExpenses.length === 0) {
            return null;
        }

        // Group items by name (in case there are multiple items with same name)
        const itemsMap = new Map();
        invoiceExpenses.forEach(exp => {
            const key = `${exp.item}|${exp.category}`;
            if (itemsMap.has(key)) {
                const existing = itemsMap.get(key);
                existing.quantity += exp.quantity || 1;
                existing.total += exp.amount;
            } else {
                itemsMap.set(key, {
                    name: exp.item,
                    category: exp.category,
                    unitPrice: exp.unitPrice || 0,
                    quantity: exp.quantity || 1,
                    total: exp.amount
                });
            }
        });

        const items = Array.from(itemsMap.values());
        const total = invoiceExpenses.reduce((sum, exp) => sum + exp.amount, 0);
        
        return {
            date: invoiceExpenses[0].date,
            number: invoiceId,
            customerId: invoiceExpenses[0].customerId,
            items,
            subtotal: total,
            vat: 0,
            total: total
        };
    }

    saveInvoice() {
        // If we're editing an existing invoice, first remove the old one
        if (this.editingInvoiceId) {
            this.expenses = this.expenses.filter(exp => exp.invoiceId !== this.editingInvoiceId);
        }

        const invoiceData = this.collectInvoiceData();
        if (invoiceData.items.length === 0) {
            this.showToast('কমপক্ষে একটি আইটেম যোগ করুন', 'error');
            return;
        }

        // Save each item as a separate expense entry
        const invoiceId = document.getElementById('invoice-number').value;
        const date = document.getElementById('invoice-date').value;
        const customerId = document.getElementById('invoice-customer').value;

        invoiceData.items.forEach(item => {
            const expense = {
                id: Date.now() + Math.random(),
                date: date,
                category: item.category,
                item: item.name,
                amount: item.total,
                quantity: item.quantity,
                customerId: customerId,
                unitPrice: item.unitPrice,
                invoiceId: invoiceId
            };
            this.expenses.push(expense);
        });

        this.saveExpenses();
        
        const action = this.editingInvoiceId ? 'আপডেট' : 'সংরক্ষিত';
        this.showToast(`ইনভয়েজ ${invoiceId} ${action} হয়েছে`, 'success');
        
        // Clear editing flag and form
        this.editingInvoiceId = null;
        this.clearInvoice();
        this.updateDashboard();
    }

    // Income Functions
    setupIncomePage() {
        this.setCurrentDate();
        this.setupIncomeEventListeners();
        this.loadIncomeList();
    }

    setupCustomersPage() {
        // Ensure we're on the customers page
        this.loadCustomerList();
        this.updateCustomerDropdown();
        
        // Setup event listeners with a small delay to ensure DOM is ready
        setTimeout(() => {
            this.setupCustomerEventListeners();
        }, 100);
    }

    setupIncomeEventListeners() {
        // Income form submission
        const incomeForm = document.getElementById('income-form');
        if (incomeForm) {
            incomeForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveIncomeEntry();
            });

            document.getElementById('clear-income-form').addEventListener('click', () => {
                this.clearIncomeForm();
            });
        }

        // Edit income modal
        document.getElementById('update-income').addEventListener('click', () => {
            this.updateIncomeEntry();
        });

        // Modal close events
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => {
                this.closeIncomeModal();
            });
        });

        // Filter events
        const typeFilter = document.getElementById('income-type-filter');
        const monthFilter = document.getElementById('income-month-filter');
        
        if (typeFilter) {
            typeFilter.addEventListener('change', () => {
                this.filterIncomeList();
            });
        }

        if (monthFilter) {
            monthFilter.addEventListener('change', () => {
                this.filterIncomeList();
            });
        }
    }

    setCurrentDate() {
        const incomeDateInput = document.getElementById('income-date');
        if (incomeDateInput) {
            incomeDateInput.value = new Date().toISOString().split('T')[0];
        }
    }

    saveIncomeEntry() {
        const date = document.getElementById('income-date').value;
        const type = document.getElementById('income-type').value;
        const source = document.getElementById('income-source').value;
        const amount = parseFloat(document.getElementById('income-amount').value);
        const description = document.getElementById('income-description').value;

        if (!date || !type || !source || !amount) {
            this.showToast('সব প্রয়োজনীয় ক্ষেত্র পূরণ করুন', 'error');
            return;
        }

        const incomeEntry = {
            id: Date.now() + Math.random(),
            date: date,
            type: type,
            source: source,
            amount: amount,
            description: description
        };

        this.income.push(incomeEntry);
        this.saveIncome();

        this.showToast('আয় সফলভাবে যোগ করা হয়েছে', 'success');
        this.clearIncomeForm();
        this.loadIncomeList();
        this.updateDashboard();
    }

    clearIncomeForm() {
        document.getElementById('income-form').reset();
        this.setCurrentDate();
    }

    loadIncomeList() {
        this.displayIncomeList(this.income);
    }

    displayIncomeList(incomeList) {
        const tbody = document.getElementById('income-table-body');
        const noDataMessage = document.getElementById('no-income-message');
        
        if (incomeList.length === 0) {
            tbody.innerHTML = '';
            noDataMessage.style.display = 'block';
            return;
        }

        noDataMessage.style.display = 'none';
        
        tbody.innerHTML = incomeList.map(income => `
            <tr>
                <td>${this.formatDate(income.date)}</td>
                <td>
                    <span class="income-type-badge ${income.type}">${this.getIncomeTypeName(income.type)}</span>
                </td>
                <td>${income.source}</td>
                <td class="income-amount">${this.formatCurrency(income.amount)}</td>
                <td>
                    <div class="income-actions">
                        <button class="income-action-btn edit" onclick="app.editIncome('${income.id}')">
                            ✏️ সম্পাদনা
                        </button>
                        <button class="income-action-btn delete" onclick="app.deleteIncome('${income.id}')">
                            🗑️ মুছুন
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    filterIncomeList() {
        const typeFilter = document.getElementById('income-type-filter').value;
        const monthFilter = document.getElementById('income-month-filter').value;
        
        let filteredIncome = [...this.income];
        
        // Filter by type
        if (typeFilter) {
            filteredIncome = filteredIncome.filter(inc => inc.type === typeFilter);
        }
        
        // Filter by month
        if (monthFilter) {
            const [year, month] = monthFilter.split('-');
            filteredIncome = filteredIncome.filter(inc => {
                const incDate = new Date(inc.date);
                return incDate.getFullYear() === parseInt(year) && 
                       (incDate.getMonth() + 1) === parseInt(month);
            });
        }
        
        this.displayIncomeList(filteredIncome);
    }

    editIncome(incomeId) {
        const income = this.income.find(inc => inc.id == incomeId);
        if (!income) {
            this.showToast('আয় খুঁজে পাওয়া যায়নি', 'error');
            return;
        }

        // Populate edit form
        document.getElementById('edit-income-id').value = income.id;
        document.getElementById('edit-income-date').value = income.date;
        document.getElementById('edit-income-type').value = income.type;
        document.getElementById('edit-income-source').value = income.source;
        document.getElementById('edit-income-amount').value = income.amount;
        document.getElementById('edit-income-description').value = income.description || '';

        // Show modal
        document.getElementById('edit-income-modal').style.display = 'block';
    }

    updateIncomeEntry() {
        const id = document.getElementById('edit-income-id').value;
        const date = document.getElementById('edit-income-date').value;
        const type = document.getElementById('edit-income-type').value;
        const source = document.getElementById('edit-income-source').value;
        const amount = parseFloat(document.getElementById('edit-income-amount').value);
        const description = document.getElementById('edit-income-description').value;

        if (!date || !type || !source || !amount) {
            this.showToast('সব প্রয়োজনীয় ক্ষেত্র পূরণ করুন', 'error');
            return;
        }

        // Update income entry
        const incomeIndex = this.income.findIndex(inc => inc.id == id);
        if (incomeIndex !== -1) {
            this.income[incomeIndex] = {
                id: id,
                date: date,
                type: type,
                source: source,
                amount: amount,
                description: description
            };

            this.saveIncome();
            this.loadIncomeList();
            this.updateDashboard();
            this.closeIncomeModal();
            this.showToast('আয় সফলভাবে আপডেট করা হয়েছে', 'success');
        }
    }

    deleteIncome(incomeId) {
        if (confirm('এই আয় মুছে ফেলতে চান?')) {
            this.income = this.income.filter(inc => inc.id != incomeId);
            this.saveIncome();
            this.loadIncomeList();
            this.updateDashboard();
            this.showToast('আয় মুছে ফেলা হয়েছে', 'success');
        }
    }

    closeIncomeModal() {
        document.getElementById('edit-income-modal').style.display = 'none';
    }

    // Customer Management
    loadCustomers() {
        const stored = localStorage.getItem('matsyaHisabCustomers');
        return stored ? JSON.parse(stored) : [];
    }

    saveCustomers() {
        localStorage.setItem('matsyaHisabCustomers', JSON.stringify(this.customers));
    }

    generateCustomerId() {
        return 'CUS-' + Date.now().toString().slice(-6);
    }

    setupCustomerEventListeners() {
        const customerForm = document.getElementById('customer-form');
        if (customerForm) {
            // Remove any existing event listeners to prevent conflicts
            customerForm.replaceWith(customerForm.cloneNode(true));
            const newCustomerForm = document.getElementById('customer-form');
            
            newCustomerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.saveCustomer();
                return false;
            });
            
            // Also add click handler for submit button to be safe
            const submitBtn = newCustomerForm.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.saveCustomer();
                    return false;
                });
            }
        }

        const clearBtn = document.getElementById('clear-customer-form');
        if (clearBtn) {
            clearBtn.replaceWith(clearBtn.cloneNode(true));
            document.getElementById('clear-customer-form').addEventListener('click', () => {
                this.clearCustomerForm();
            });
        }

        const searchInput = document.getElementById('customer-search');
        if (searchInput) {
            searchInput.replaceWith(searchInput.cloneNode(true));
            document.getElementById('customer-search').addEventListener('input', () => {
                this.filterCustomers();
            });
        }

        // Edit customer modal
        const editCustomerForm = document.getElementById('edit-customer-form');
        if (editCustomerForm) {
            editCustomerForm.replaceWith(editCustomerForm.cloneNode(true));
            const newEditForm = document.getElementById('edit-customer-form');
            
            newEditForm.addEventListener('submit', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.updateCustomer();
                return false;
            });
        }

        // Modal close handlers
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.replaceWith(btn.cloneNode(true));
            document.querySelectorAll('.modal-close').forEach(newBtn => {
                newBtn.addEventListener('click', () => {
                    document.getElementById('edit-customer-modal').style.display = 'none';
                });
            });
        });
    }

    saveCustomer() {
        console.log('saveCustomer called');
        
        const nameInput = document.getElementById('customer-name');
        const phoneInput = document.getElementById('customer-phone');
        const addressInput = document.getElementById('customer-address');
        const emailInput = document.getElementById('customer-email');
        const notesInput = document.getElementById('customer-notes');
        
        if (!nameInput || !phoneInput || !addressInput || !emailInput || !notesInput) {
            console.error('Customer form elements not found');
            this.showToast('ফর্ম উপাদান পাওয়া যায়নি', 'error');
            return;
        }
        
        const name = nameInput.value.trim();
        const phone = phoneInput.value.trim();
        const address = addressInput.value.trim();
        const email = emailInput.value.trim();
        const notes = notesInput.value.trim();

        console.log('Customer data:', { name, phone, address, email, notes });

        if (!name) {
            this.showToast('কাস্টমারের নাম আবশ্যক', 'error');
            nameInput.focus();
            return;
        }

        const customer = {
            id: this.generateCustomerId(),
            name,
            phone,
            address,
            email,
            notes,
            createdAt: new Date().toISOString()
        };

        console.log('Adding customer:', customer);
        
        this.customers.push(customer);
        this.saveCustomers();
        this.loadCustomerList();
        this.updateCustomerDropdown();
        this.clearCustomerForm();
        this.showToast('কাস্টমার সফলভাবে যোগ করা হয়েছে', 'success');
    }

    clearCustomerForm() {
        document.getElementById('customer-form').reset();
    }

    loadCustomerList() {
        const tbody = document.getElementById('customer-table-body');
        const noDataMessage = document.getElementById('no-customers-message');
        
        if (this.customers.length === 0) {
            tbody.innerHTML = '';
            noDataMessage.style.display = 'block';
            return;
        }

        noDataMessage.style.display = 'none';
        tbody.innerHTML = this.customers.map(customer => `
            <tr>
                <td style="font-weight: 600;">${customer.name}</td>
                <td>${customer.phone || '-'}</td>
                <td>${customer.address || '-'}</td>
                <td>${customer.email || '-'}</td>
                <td>
                    <div class="customer-actions">
                        <button class="customer-action-btn edit" onclick="app.editCustomer('${customer.id}')" title="সম্পাদনা">
                            ✏️
                        </button>
                        <button class="customer-action-btn delete" onclick="app.deleteCustomer('${customer.id}')" title="মুছে ফেলুন">
                            🗑️
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    filterCustomers() {
        const searchTerm = document.getElementById('customer-search').value.toLowerCase();
        const filteredCustomers = this.customers.filter(customer => 
            customer.name.toLowerCase().includes(searchTerm) ||
            (customer.phone && customer.phone.toLowerCase().includes(searchTerm)) ||
            (customer.email && customer.email.toLowerCase().includes(searchTerm))
        );
        
        this.displayFilteredCustomers(filteredCustomers);
    }

    displayFilteredCustomers(customers) {
        const tbody = document.getElementById('customer-table-body');
        const noDataMessage = document.getElementById('no-customers-message');
        
        if (customers.length === 0) {
            tbody.innerHTML = '';
            noDataMessage.style.display = 'block';
            return;
        }

        noDataMessage.style.display = 'none';
        tbody.innerHTML = customers.map(customer => `
            <tr>
                <td style="font-weight: 600;">${customer.name}</td>
                <td>${customer.phone || '-'}</td>
                <td>${customer.address || '-'}</td>
                <td>${customer.email || '-'}</td>
                <td>
                    <div class="customer-actions">
                        <button class="customer-action-btn edit" onclick="app.editCustomer('${customer.id}')" title="সম্পাদনা">
                            ✏️
                        </button>
                        <button class="customer-action-btn delete" onclick="app.deleteCustomer('${customer.id}')" title="মুছে ফেলুন">
                            🗑️
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    editCustomer(customerId) {
        const customer = this.customers.find(c => c.id === customerId);
        if (!customer) {
            this.showToast('কাস্টমার পাওয়া যায়নি', 'error');
            return;
        }

        document.getElementById('edit-customer-id').value = customer.id;
        document.getElementById('edit-customer-name').value = customer.name;
        document.getElementById('edit-customer-phone').value = customer.phone || '';
        document.getElementById('edit-customer-address').value = customer.address || '';
        document.getElementById('edit-customer-email').value = customer.email || '';
        document.getElementById('edit-customer-notes').value = customer.notes || '';

        document.getElementById('edit-customer-modal').style.display = 'block';
    }

    updateCustomer() {
        const customerId = document.getElementById('edit-customer-id').value;
        const name = document.getElementById('edit-customer-name').value.trim();
        const phone = document.getElementById('edit-customer-phone').value.trim();
        const address = document.getElementById('edit-customer-address').value.trim();
        const email = document.getElementById('edit-customer-email').value.trim();
        const notes = document.getElementById('edit-customer-notes').value.trim();

        if (!name) {
            this.showToast('কাস্টমারের নাম আবশ্যক', 'error');
            return;
        }

        const customerIndex = this.customers.findIndex(c => c.id === customerId);
        if (customerIndex === -1) {
            this.showToast('কাস্টমার পাওয়া যায়নি', 'error');
            return;
        }

        this.customers[customerIndex] = {
            ...this.customers[customerIndex],
            name,
            phone,
            address,
            email,
            notes,
            updatedAt: new Date().toISOString()
        };

        this.saveCustomers();
        this.loadCustomerList();
        this.updateCustomerDropdown();
        document.getElementById('edit-customer-modal').style.display = 'none';
        this.showToast('কাস্টমার সফলভাবে আপডেট করা হয়েছে', 'success');
    }

    deleteCustomer(customerId) {
        // Check if customer has any invoices
        const hasInvoices = this.expenses.some(exp => exp.customerId === customerId);
        
        if (hasInvoices) {
            if (!confirm('এই কাস্টমারের ইনভয়েজ রয়েছে। মুছে ফেললে ইনভয়েজ থেকে কাস্টমারের তথ্য সরিয়ে ফেলা হবে। এগিয়ে যেতে চান?')) {
                return;
            }
            
            // Remove customer reference from invoices
            this.expenses = this.expenses.map(exp => {
                if (exp.customerId === customerId) {
                    return { ...exp, customerId: null };
                }
                return exp;
            });
            this.saveExpenses();
        } else {
            if (!confirm('এই কাস্টমার মুছে ফেলতে চান?')) {
                return;
            }
        }

        this.customers = this.customers.filter(c => c.id !== customerId);
        this.saveCustomers();
        this.loadCustomerList();
        this.updateCustomerDropdown();
        this.showToast('কাস্টমার মুছে ফেলা হয়েছে', 'success');
    }

    updateCustomerDropdown() {
        const select = document.getElementById('invoice-customer');
        if (!select) return;

        const currentValue = select.value;
        select.innerHTML = '<option value="">কাস্টমার নির্বাচন করুন</option>';
        
        this.customers.forEach(customer => {
            const option = document.createElement('option');
            option.value = customer.id;
            option.textContent = customer.name;
            select.appendChild(option);
        });

        // Restore previous selection if still valid
        if (currentValue && this.customers.some(c => c.id === currentValue)) {
            select.value = currentValue;
        }
    }

    getCustomerName(customerId) {
        if (!customerId) return 'সাধারণ';
        const customer = this.customers.find(c => c.id === customerId);
        return customer ? customer.name : 'অজানা কাস্টমার';
    }

    getIncomeTypeName(type) {
        const typeNames = {
            capital: 'মূলধন',
            sales: 'বিক্রয়',
            investment: 'বিনিয়োগ',
            loan: 'ঋণ',
            other: 'অন্যান্য'
        };
        return typeNames[type] || type;
    }
}

// Initialize the application
const app = new MatsyaHisab();

// Global functions for inline event handlers
window.app = app;

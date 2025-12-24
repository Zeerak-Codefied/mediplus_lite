/**
 * Checkout Modal Handler
 * Handles checkout modal display and payment processing
 * 
 * @author Pakistan Medico International
 * @version 1.0.0
 */

class CheckoutHandler {
    constructor() {
        this.modal = null;
        this.meezanBankAPI = null;
        this.currentAmount = 0; // No default - user must select
        this.currentFund = 'Funds clean water access'; // Default fund

        this.init();
    }

    /**
     * Initialize checkout handler
     */
    init() {
        // Get base path dynamically - more robust method (same logic as MeezanBankAPI)
        // Method 1: Try to get base path from current script location
        let basePath = '';
        try {
            const scripts = document.getElementsByTagName('script');
            for (let script of scripts) {
                if (script.src && script.src.includes('meezan-bank-api.js')) {
                    const scriptPath = new URL(script.src).pathname;
                    const scriptDir = scriptPath.substring(0, scriptPath.lastIndexOf('/'));
                    // Remove /js from path to get base directory
                    basePath = scriptDir.replace('/js', '');
                    break;
                }
            }
        } catch (e) {
            console.warn('Could not get base path from script tag:', e);
        }
        
        // Method 2: Fallback to pathname-based detection
        if (!basePath || basePath === '/') {
            let pathname = window.location.pathname;
            // Remove trailing slash
            if (pathname.endsWith('/')) {
                pathname = pathname.slice(0, -1);
            }
            // Extract directory path
            const lastSlashIndex = pathname.lastIndexOf('/');
            if (lastSlashIndex > 0) {
                const afterLastSlash = pathname.substring(lastSlashIndex + 1);
                // If it looks like a file (has extension), extract directory
                if (afterLastSlash.includes('.')) {
                    basePath = pathname.substring(0, lastSlashIndex);
                } else {
                    // It's already a directory path
                    basePath = pathname;
                }
            } else if (pathname === '/') {
                basePath = '';
            } else {
                basePath = pathname;
            }
        }
        
        // Ensure basePath doesn't end with /
        if (basePath.endsWith('/')) {
            basePath = basePath.slice(0, -1);
        }
        
        // Initialize Meezan Bank EPG API with production credentials
        this.meezanBankAPI = new MeezanBankAPI({
            apiUrl: 'https://acquiring.meezanbank.com/payment/rest/',
            username: 'PAKISTANMEDICO_api',
            password: 'P987658',
            returnUrl: window.location.origin + basePath + '/payment-success.html',
            failUrl: window.location.origin + basePath + '/payment-fail.html'
        });

        this.setupEventListeners();
        this.setupFormValidation();
        this.setupAmountSelection();
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Open modal when "Donate Now" button is clicked
        const donateNowBtn = document.getElementById('donateNowBtn');
        if (donateNowBtn) {
            donateNowBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.openModal();
            });
        }

        // Open modal when "Donate Online" button is clicked (from donation cards)
        const donateOnlineBtn = document.getElementById('donateOnlineBtn');
        if (donateOnlineBtn) {
            donateOnlineBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.openModal();
            });
        }

        // Close modal handlers
        const closeModalBtn = document.getElementById('checkoutCloseBtn');
        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', () => this.closeModal());
        }

        const cancelBtn = document.getElementById('checkoutCancelBtn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.closeModal());
        }

        // Close on overlay click
        const modalOverlay = document.getElementById('checkoutModalOverlay');
        if (modalOverlay) {
            modalOverlay.addEventListener('click', (e) => {
                if (e.target === modalOverlay) {
                    this.closeModal();
                }
            });
        }

        // Handle form submission
        const checkoutForm = document.getElementById('checkoutForm');
        if (checkoutForm) {
            checkoutForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handlePayment();
            });
        }

    }

    /**
     * Setup donation amount selection
     */
    setupAmountSelection() {
        // Handle amount button clicks
        const amountButtons = document.querySelectorAll('.amount-btn');
        amountButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                // Remove active class from all buttons
                amountButtons.forEach(b => b.classList.remove('active'));
                // Add active class to clicked button
                btn.classList.add('active');
                // Clear custom amount input
                const customAmount = document.getElementById('customAmount');
                if (customAmount) {
                    customAmount.value = '';
                }
                // Set amount
                const amount = parseFloat(btn.getAttribute('data-amount'));
                this.setAmount(amount);
            });
        });

        // Handle custom amount input
        const customAmount = document.getElementById('customAmount');
        if (customAmount) {
            const MAX_AMOUNT = 100000000000000; // 100,000B maximum

            // Prevent exceeding max amount while typing
            customAmount.addEventListener('input', (e) => {
                let value = e.target.value.replace(/[^0-9]/g, ''); // Remove non-numeric characters
                
                // Check if value exceeds maximum
                if (value && parseFloat(value) > MAX_AMOUNT) {
                    value = MAX_AMOUNT.toString();
                    e.target.value = value;
                } else {
                    e.target.value = value;
                }

                // Remove validation errors while typing
                e.target.classList.remove('error');
                const existingError = e.target.parentElement.querySelector('.field-error');
                if (existingError) {
                    existingError.remove();
                }

                // Update amount display if valid
                const amount = parseFloat(value);
                if (amount && amount > 0) {
                    // Remove active class from all buttons
                    amountButtons.forEach(b => b.classList.remove('active'));
                    // Set custom amount (will be capped by formatAmount if needed)
                    this.setAmount(amount);
                } else {
                    this.setAmount(0);
                }
            });

            // Only validate on blur (not while typing)
            customAmount.addEventListener('blur', (e) => {
                const amount = parseFloat(e.target.value);
                if (!e.target.value || amount <= 0) {
                    this.validateField(customAmount);
                } else if (amount > MAX_AMOUNT) {
                    customAmount.value = MAX_AMOUNT;
                    this.setAmount(MAX_AMOUNT);
                }
            });
        }
    }

    /**
     * Format amount with k/m notation for large numbers
     * @param {number} amount - Amount to format
     * @returns {string} Formatted amount string
     */
    formatAmount(amount) {
        if (!amount || amount === 0) {
            return 'Select Amount';
        }

        const num = parseFloat(amount);
        if (isNaN(num) || !isFinite(num)) {
            return 'Select Amount';
        }

        // Limit maximum to 100,000B (100,000,000,000,000)
        const maxAmount = 100000000000000;
        const cappedNum = num > maxAmount ? maxAmount : num;

        // Count digits
        const numStr = Math.floor(cappedNum).toString();
        const digitCount = numStr.length;

        // Format with k/m/b notation for numbers exceeding 6 digits (1,000,000+)
        if (digitCount > 6) {
            if (cappedNum >= 1000000000) {
                // Billions (10+ digits)
                const billions = cappedNum / 1000000000;
                const formatted = billions % 1 === 0 
                    ? Math.floor(billions).toLocaleString() 
                    : billions.toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 0 });
                return `PKR ${formatted}B`;
            } else if (cappedNum >= 1000000) {
                // Millions (7-9 digits)
                const millions = cappedNum / 1000000;
                const formatted = millions % 1 === 0 
                    ? Math.floor(millions).toLocaleString() 
                    : millions.toLocaleString('en-US', { maximumFractionDigits: 1, minimumFractionDigits: 0 });
                return `PKR ${formatted}M`;
            } else if (cappedNum >= 100000) {
                // 100,000 - 999,999 (6 digits) - use K for readability
                const thousands = cappedNum / 1000;
                const formatted = thousands % 1 === 0 
                    ? Math.floor(thousands).toLocaleString() 
                    : Math.floor(thousands).toLocaleString();
                return `PKR ${formatted}K`;
            }
        }

        // Regular format with commas for numbers with 6 digits or less
        return `PKR ${Math.floor(cappedNum).toLocaleString()}`;
    }

    /**
     * Set donation amount
     */
    setAmount(amount) {
        this.currentAmount = amount;
        const amountInput = document.getElementById('donationAmount');
        if (amountInput) {
            amountInput.value = amount;
        }
        const amountDisplay = document.getElementById('donationAmountDisplay');
        if (amountDisplay) {
            const formatted = this.formatAmount(amount);
            amountDisplay.textContent = formatted;
            
            // Set data attribute for responsive font sizing
            const textLength = formatted.length;
            if (textLength <= 15) {
                amountDisplay.setAttribute('data-length', 'short');
            } else if (textLength <= 25) {
                amountDisplay.setAttribute('data-length', 'medium');
            } else {
                amountDisplay.setAttribute('data-length', 'long');
            }
        }
    }

    /**
     * Setup form validation
     */
    setupFormValidation() {
        const form = document.getElementById('checkoutForm');
        if (!form) return;

        const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
        inputs.forEach(input => {
            input.addEventListener('blur', () => this.validateField(input));
            input.addEventListener('input', () => {
                if (input.classList.contains('error')) {
                    this.validateField(input);
                }
            });
        });

        // Card number formatting
        const cardNumberInput = document.getElementById('cardNumber');
        if (cardNumberInput) {
            cardNumberInput.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\s/g, '');
                let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
                if (formattedValue.length <= 19) {
                    e.target.value = formattedValue;
                }
            });
        }

        // Expiration date formatting
        const expirationInput = document.getElementById('expirationDate');
        if (expirationInput) {
            expirationInput.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\D/g, '');
                if (value.length >= 2) {
                    value = value.substring(0, 2) + '/' + value.substring(2, 4);
                }
                e.target.value = value;
            });
        }

        // CVV formatting (numbers only)
        const cvvInput = document.getElementById('cvv');
        if (cvvInput) {
            cvvInput.addEventListener('input', (e) => {
                e.target.value = e.target.value.replace(/\D/g, '');
            });
        }

        // Phone formatting
        const phoneInput = document.getElementById('phone');
        if (phoneInput) {
            phoneInput.addEventListener('input', (e) => {
                e.target.value = e.target.value.replace(/[^\d\s\-\+\(\)]/g, '');
            });
        }
    }

    /**
     * Validate individual field
     */
    validateField(field) {
        const value = field.value.trim();
        let isValid = true;
        let errorMessage = '';

        // Remove previous error
        field.classList.remove('error');
        const existingError = field.parentElement.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }

        // Required field validation
        if (field.hasAttribute('required') && !value) {
            isValid = false;
            errorMessage = 'This field is required';
        }

        // Email validation
        if (field.type === 'email' && value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                isValid = false;
                errorMessage = 'Please enter a valid email address';
            }
        }

        // Phone validation
        if (field.type === 'tel' && value) {
            const phoneRegex = /^[\d\s\-\+\(\)]+$/;
            if (!phoneRegex.test(value) || value.replace(/\D/g, '').length < 10) {
                isValid = false;
                errorMessage = 'Please enter a valid phone number';
            }
        }

        // Card number validation
        if (field.id === 'cardNumber' && value) {
            const cardNumber = value.replace(/\s/g, '');
            if (cardNumber.length < 13 || cardNumber.length > 19) {
                isValid = false;
                errorMessage = 'Please enter a valid card number';
            }
        }

        // CVV validation
        if (field.id === 'cvv' && value) {
            if (value.length < 3 || value.length > 4) {
                isValid = false;
                errorMessage = 'Please enter a valid CVV';
            }
        }

        // Show error if invalid
        if (!isValid) {
            field.classList.add('error');
            const errorDiv = document.createElement('div');
            errorDiv.className = 'field-error';
            errorDiv.textContent = errorMessage;
            field.parentElement.appendChild(errorDiv);
        }

        return isValid;
    }

    /**
     * Validate entire form
     */
    validateForm() {
        const form = document.getElementById('checkoutForm');
        if (!form) return false;

        const requiredFields = form.querySelectorAll('input[required], select[required], textarea[required]');
        let isValid = true;

        requiredFields.forEach(field => {
            if (!this.validateField(field)) {
                isValid = false;
            }
        });

        return isValid;
    }

    /**
     * Open checkout modal
     */
    openModal(amount = 0, fund = 'Funds clean water access') {
        this.currentAmount = amount;
        this.currentFund = fund;

        const modal = document.getElementById('checkoutModalOverlay');
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';

            // Reset amount selection
            document.querySelectorAll('.amount-btn').forEach(btn => btn.classList.remove('active'));
            const customAmount = document.getElementById('customAmount');
            if (customAmount) {
                customAmount.value = '';
            }

            // Update amount display
            const amountDisplay = document.getElementById('donationAmountDisplay');
            if (amountDisplay) {
                if (amount > 0) {
                    const formatted = this.formatAmount(amount);
                    amountDisplay.textContent = formatted;
                    
                    // Set data attribute for responsive font sizing
                    const textLength = formatted.length;
                    if (textLength <= 15) {
                        amountDisplay.setAttribute('data-length', 'short');
                    } else if (textLength <= 25) {
                        amountDisplay.setAttribute('data-length', 'medium');
                    } else {
                        amountDisplay.setAttribute('data-length', 'long');
                    }
                } else {
                    amountDisplay.textContent = 'Select Amount';
                    amountDisplay.removeAttribute('data-length');
                }
            }

            const fundDisplay = document.getElementById('donationFundDisplay');
            if (fundDisplay) {
                fundDisplay.textContent = fund;
            }

            const amountInput = document.getElementById('donationAmount');
            if (amountInput) {
                amountInput.value = amount || '';
            }
        }
    }

    /**
     * Close checkout modal
     */
    closeModal() {
        const modal = document.getElementById('checkoutModalOverlay');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = 'auto';

            // Reset form
            const form = document.getElementById('checkoutForm');
            if (form) {
                form.reset();
                // Clear errors
                form.querySelectorAll('.error').forEach(field => {
                    field.classList.remove('error');
                });
                form.querySelectorAll('.field-error').forEach(error => {
                    error.remove();
                });
            }
        }
    }

    /**
     * Update donation amount
     */
    updateAmount(amount) {
        this.setAmount(parseFloat(amount) || 0);
    }

    /**
     * Handle payment processing (Redirection Model)
     */
    async handlePayment() {
        // Validate form - only basic info needed for redirection model
        // Card details will be entered on Meezan Bank's payment page
        const requiredFields = ['fullName', 'email', 'phone', 'address'];
        let isValid = true;

        requiredFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field && !this.validateField(field)) {
                isValid = false;
            }
        });

        if (!isValid) {
            this.showMessage('Please fill in all required fields correctly.', 'error');
            return;
        }

        // Get form data
        const formData = this.getFormData();

        // Validate amount
        if (!this.currentAmount || this.currentAmount < 1) {
            this.showMessage('Please select or enter a donation amount (minimum 1 PKR).', 'error');
            // Highlight amount selection
            const customAmount = document.getElementById('customAmount');
            if (customAmount) {
                customAmount.focus();
                customAmount.style.borderColor = '#f44336';
            }
            return;
        }

        // Show loading state
        this.setLoadingState(true);

        try {
            // Prepare payment data for order registration
            const paymentData = {
                amount: this.currentAmount,
                currency: '586', // Currency code 586 for Meezan Bank
                customerName: formData.fullName,
                customerEmail: formData.email,
                customerPhone: formData.phone,
                description: `Donation to Pakistan Medico International: ${this.currentFund}`
            };

            // Register order with Meezan Bank (Step 1)
            const result = await this.meezanBankAPI.registerOrder(paymentData);

            if (result.success) {
                // Store order info in sessionStorage for verification after redirect
                sessionStorage.setItem('meezanOrderId', result.orderId);
                sessionStorage.setItem('meezanOrderNumber', result.orderNumber);
                sessionStorage.setItem('meezanAmount', this.currentAmount.toString());
                sessionStorage.setItem('meezanFund', this.currentFund);

                // Close modal
                this.closeModal();

                // Show redirecting message
                this.showMessage('Redirecting to secure payment page...', 'info');

                // Small delay to show message, then redirect
                setTimeout(() => {
                    // Redirect to Meezan Bank payment form (Step 2)
                    this.meezanBankAPI.redirectToPayment(result.formUrl);
                }, 500);
            } else {
                // Registration failed
                this.showMessage(result.error || 'Failed to initialize payment. Please try again.', 'error');
                this.setLoadingState(false);
            }
        } catch (error) {
            console.error('Payment error:', error);
            this.showMessage('An error occurred while processing your payment. Please try again.', 'error');
            this.setLoadingState(false);
        }
    }

    /**
     * Get form data
     */
    getFormData() {
        const form = document.getElementById('checkoutForm');
        if (!form) return {};

        return {
            fullName: document.getElementById('fullName')?.value.trim() || '',
            email: document.getElementById('email')?.value.trim() || '',
            phone: document.getElementById('phone')?.value.trim() || '',
            address: document.getElementById('address')?.value.trim() || ''
        };
    }

    /**
     * Set loading state
     */
    setLoadingState(loading) {
        const submitBtn = document.getElementById('checkoutSubmitBtn');
        if (submitBtn) {
            submitBtn.disabled = loading;
            submitBtn.textContent = loading ? 'Processing...' : 'Complete Payment';
        }

        const form = document.getElementById('checkoutForm');
        if (form) {
            form.querySelectorAll('input, select, textarea, button').forEach(field => {
                field.disabled = loading;
            });
        }
    }

    /**
     * Show message
     */
    showMessage(message, type = 'info') {
        // Create or update message element
        let messageEl = document.getElementById('checkoutMessage');
        if (!messageEl) {
            messageEl = document.createElement('div');
            messageEl.id = 'checkoutMessage';
            messageEl.className = 'checkout-message';
            const form = document.getElementById('checkoutForm');
            if (form) {
                form.insertBefore(messageEl, form.firstChild);
            }
        }

        messageEl.textContent = message;
        messageEl.className = `checkout-message ${type}`;
        messageEl.style.display = 'block';

        // Auto-hide after 5 seconds
        setTimeout(() => {
            messageEl.style.display = 'none';
        }, 5000);
    }

    /**
     * Show success message
     */
    showSuccessMessage(result) {
        const message = `Payment successful! Transaction ID: ${result.transactionId}`;
        alert(message); // Replace with a better success modal/notification
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.checkoutHandler = new CheckoutHandler();
});


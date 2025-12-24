/**
 * Meezan Bank EPG (Electronic Payment Gateway) API Integration
 * Professional and Clean Code Structure
 * 
 * @author Pakistan Medico International
 * @version 2.0.0
 * 
 * Based on Meezan Bank EPG API Documentation
 * Endpoint: https://acquiring.meezanbank.com/payment/rest/
 */

class MeezanBankAPI {
    constructor(config) {
        // Get base path dynamically - more robust method
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

        this.config = {
            apiUrl: config.apiUrl || 'https://acquiring.meezanbank.com/payment/rest/',
            username: config.username || '',
            password: config.password || '',
            returnUrl: config.returnUrl || window.location.origin + basePath + '/payment-success.html',
            failUrl: config.failUrl || window.location.origin + basePath + '/payment-fail.html',
            proxyUrl: config.proxyUrl || basePath + '/api/meezan-bank-proxy.php',
            ...config
        };

        // Debug: Log the calculated URLs (removed for production)
        // console.log('🔍 Meezan Bank API Configuration:');
        // console.log('  - Base Path:', basePath || '(root domain)');
        // console.log('  - Return URL:', this.config.returnUrl);
        // console.log('  - Fail URL:', this.config.failUrl);
        // console.log('  - Current Pathname:', window.location.pathname);
        // console.log('  - Current Origin:', window.location.origin);

        this.init();
    }

    /**
     * Initialize the API client
     */
    init() {
        this.validateConfig();
        // console.log('Meezan Bank EPG API initialized');
    }

    /**
     * Validate API configuration
     */
    validateConfig() {
        if (!this.config.username) {
            throw new Error('API Username is required');
        }
        if (!this.config.password) {
            throw new Error('API Password is required');
        }
    }

    /**
     * Generate unique order number
     * @returns {string} Generated order number
     */
    generateOrderNumber() {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 100000);
        return `PMI${timestamp}${random}`;
    }

    /**
     * Register an order for payment (Step 1 of Redirection Model)
     * Uses PHP proxy to avoid CORS issues
     * @param {Object} paymentData - Payment information
     * @returns {Promise<Object>} Registration response with orderId and formUrl
     */
    async registerOrder(paymentData) {
        try {
            // Generate order number if not provided
            const orderNumber = paymentData.orderNumber || this.generateOrderNumber();

            // Convert amount to smallest currency unit (paise for PKR)
            // Meezan Bank expects amount in paise (multiply by 100)
            const amountInPaise = Math.round(paymentData.amount * 100);

            // Prepare data for proxy
            // Use currency code 586 as specified
            const currencyCode = paymentData.currency || '586';

            const requestData = {
                action: 'register',
                orderNumber: orderNumber,
                amount: amountInPaise,
                currency: currencyCode, // Currency code 586 for Meezan Bank
                returnUrl: this.config.returnUrl,
                failUrl: this.config.failUrl
            };

            // Debug: Log the currency and URLs being sent (removed for production)
            // console.log('🔍 API Request - Currency Code:', currencyCode);
            // console.log('🔍 API Request - Return URL:', this.config.returnUrl);
            // console.log('🔍 API Request - Fail URL:', this.config.failUrl);
            // console.log('🔍 API Request - Full Payload:', requestData);

            // Optional parameters
            if (paymentData.description) {
                requestData.description = paymentData.description;
            }
            if (paymentData.customerEmail) {
                requestData.email = paymentData.customerEmail;
            }
            if (paymentData.customerPhone) {
                requestData.phone = paymentData.customerPhone;
            }
            if (paymentData.customerName) {
                requestData.clientId = paymentData.customerName;
            }

            // Make request through proxy (works with both PHP and Python servers)
            const formData = new FormData();
            Object.keys(requestData).forEach(key => {
                formData.append(key, requestData[key]);
            });

            // Use the proxy endpoint (works with both PHP and Python)
            const response = await fetch(this.config.proxyUrl, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('API Response Error:', {
                    status: response.status,
                    statusText: response.statusText,
                    body: errorText
                });
                throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
            }

            const result = await response.json();

            if (!result.success) {
                // Log comprehensive debug info
                console.group('❌ Payment Gateway Error');
                console.error('Error Message:', result.error);
                console.error('Error Source:', result.source || 'unknown');

                if (result.debug) {
                    console.error('🔍 Debug Information:', result.debug);
                    if (result.debug.allResponseData) {
                        console.error('📦 Full API Response:', result.debug.allResponseData);
                    }
                    if (result.debug.rawResponse) {
                        console.error('📄 Raw Response String:', result.debug.rawResponse);
                    }
                }

                if (result.response) {
                    console.error('📋 Response Data:', result.response);
                }

                if (result.errorCode) {
                    console.error('🚫 Error Code:', result.errorCode);
                }

                console.groupEnd();

                // Create a more descriptive error message
                let errorMsg = result.error || 'Failed to register order';

                if (result.source === 'meezan_bank_error') {
                    // Check for specific error codes
                    if (result.errorCode == 5 || result.requires_action === 'password_change_required') {
                        errorMsg = 'Payment gateway configuration issue. Please contact support.';
                        console.error('⚠️ Meezan Bank API requires password change. Contact Meezan Bank support.');
                    } else {
                        errorMsg = `Payment Gateway Error: ${result.user_message || result.errorMessage || result.error}`;
                    }
                } else if (result.source === 'code_validation_failed') {
                    errorMsg = `Invalid API Response: ${result.error}. Check console for details.`;
                } else if (result.source === 'api_connection_failed') {
                    errorMsg = `Connection Failed: ${result.error}`;
                }

                throw new Error(errorMsg);
            }

            return {
                success: true,
                orderId: result.orderId,
                orderNumber: result.orderNumber,
                formUrl: result.formUrl
            };
        } catch (error) {
            console.error('Error registering order:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get order status (Step 2 - Verification)
     * Uses PHP proxy to avoid CORS issues
     * @param {string} orderId - Order ID (mdOrder) from register.do response
     * @param {string} orderNumber - Optional order number (orderId takes priority)
     * @returns {Promise<Object>} Order status response
     */
    async getOrderStatus(orderId, orderNumber = null) {
        try {
            if (!orderId && !orderNumber) {
                throw new Error('Either orderId or orderNumber is required');
            }

            // Prepare data for proxy
            const formData = new FormData();
            formData.append('action', 'getStatus');
            if (orderId) {
                formData.append('orderId', orderId);
            } else {
                formData.append('orderNumber', orderNumber);
            }

            // Use the proxy endpoint (works with both PHP and Python servers)
            const response = await fetch(this.config.proxyUrl, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            if (!result.success && result.error) {
                throw new Error(result.error);
            }

            return result;
        } catch (error) {
            console.error('Error getting order status:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Parse response text (key=value format)
     * @param {string} responseText - Response text from API
     * @returns {Object} Parsed response object
     */
    parseResponse(responseText) {
        const data = {};
        const pairs = responseText.split('&');

        pairs.forEach(pair => {
            const [key, value] = pair.split('=');
            if (key && value !== undefined) {
                data[key] = decodeURIComponent(value);
            }
        });

        return data;
    }

    /**
     * Redirect to payment form
     * @param {string} formUrl - Form URL from register.do response
     */
    redirectToPayment(formUrl) {
        if (formUrl) {
            window.location.href = formUrl;
        } else {
            throw new Error('Form URL is required for redirection');
        }
    }

    /**
     * Format amount for display
     * @param {number} amount - Amount to format
     * @param {string} currency - Currency code
     * @returns {string} Formatted amount
     */
    formatAmount(amount, currency = 'PKR') {
        if (currency === 'PKR' || currency === '934') {
            return new Intl.NumberFormat('en-PK', {
                style: 'currency',
                currency: 'PKR',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            }).format(amount);
        }
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency
        }).format(amount);
    }

    /**
     * Validate payment data before registration
     * @param {Object} paymentData - Payment data to validate
     */
    validatePaymentData(paymentData) {
        if (!paymentData.amount || paymentData.amount <= 0) {
            throw new Error('Invalid payment amount');
        }
        if (paymentData.amount < 1) {
            throw new Error('Minimum payment amount is 1 PKR');
        }
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MeezanBankAPI;
}

/**
 * Meezan Bank API Configuration Example
 * 
 * INSTRUCTIONS:
 * 1. Copy this file and rename it to 'config.js'
 * 2. Replace the placeholder values with your actual Meezan Bank API credentials
 * 3. DO NOT commit config.js to version control (add it to .gitignore)
 * 
 * To get your API credentials:
 * - Contact Meezan Bank's merchant services department
 * - Register your business/website for payment gateway services
 * - Obtain your Merchant ID and API Key
 */

const MEEZAN_BANK_CONFIG = {
    // Your Meezan Bank Merchant ID
    merchantId: 'YOUR_MERCHANT_ID_HERE',
    
    // Your Meezan Bank API Key
    apiKey: 'YOUR_API_KEY_HERE',
    
    // Meezan Bank API Endpoint URL
    // Sandbox/Test URL (for testing)
    apiUrl: 'https://sandbox-api.meezanbank.com/payment',
    
    // Production URL (use this when going live)
    // apiUrl: 'https://api.meezanbank.com/payment',
    
    // Environment: 'sandbox' for testing, 'production' for live
    environment: 'sandbox'
};

// Usage in checkout-handler.js:
// Replace the MeezanBankAPI initialization with:
// this.meezanBankAPI = new MeezanBankAPI(MEEZAN_BANK_CONFIG);



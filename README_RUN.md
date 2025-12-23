# How to Run MediPlus Lite Project

## 🚀 Quick Start

### Option 1: Using Batch File (Easiest)
1. Double-click `START_PROJECT.bat`
2. It will check Apache status and open the project in your browser

### Option 2: Manual Start

#### Step 1: Start XAMPP Apache
1. Open **XAMPP Control Panel**
2. Click **Start** next to **Apache**
3. Wait until Apache status shows "Running" (green)

#### Step 2: Access the Project
Open your browser and go to:
```
http://localhost/mediplus-lite/
```

## 🔗 Important URLs

- **Homepage**: `http://localhost/mediplus-lite/`
- **Payment Success**: `http://localhost/mediplus-lite/payment-success.html`
- **Payment Fail**: `http://localhost/mediplus-lite/payment-fail.html`
- **API Proxy**: `http://localhost/mediplus-lite/api/meezan-bank-proxy.php`

## ✅ Verify Everything is Working

1. **Check Apache is Running**
   - XAMPP Control Panel shows Apache as "Running"
   - Or visit: `http://localhost/` (should show XAMPP dashboard)

2. **Test the Website**
   - Open: `http://localhost/mediplus-lite/`
   - Click "DONATE ONLINE" button
   - You should see the checkout modal with donation amount buttons

3. **Test API Connection**
   - Open browser console (F12)
   - Try to make a donation
   - Check console for any errors

## 🔧 Meezan Bank API Configuration

**Current Settings:**
- **API Endpoint**: `https://acquiring.meezanbank.com/payment/rest/`
- **Username**: `PAKISTANMEDICO_api`
- **Currency Code**: `586`
- **Status**: ✅ Configured and ready

## 📝 Troubleshooting

### Apache Not Starting
- Check if port 80 is already in use
- Run XAMPP as Administrator
- Check XAMPP error logs

### Project Not Loading
- Verify Apache is running
- Check file path: `C:\xampp\htdocs\mediplus-lite\`
- Clear browser cache (Ctrl + F5)

### Payment Gateway Errors
- Check browser console (F12) for errors
- Verify API credentials in `api/meezan-bank-proxy.php`
- Ensure currency code is `586`

## 🎯 Next Steps

1. Start Apache in XAMPP
2. Open: `http://localhost/mediplus-lite/`
3. Test the donation flow
4. Check payment gateway integration

---

**Project Status**: ✅ Ready to Run
**Last Updated**: 2025-12-19


/**
 * Global Donation Modal Handler
 * Works across all pages to open the donation checkout modal
 * 
 * @author Pakistan Medico International
 * @version 1.0.0
 */

(function() {
    'use strict';

    // Global function to open donation modal
    window.openDonationModal = function() {
        // Check if checkout handler exists (from checkout-handler.js)
        if (window.checkoutHandler && typeof window.checkoutHandler.openModal === 'function') {
            window.checkoutHandler.openModal();
            return;
        }

        // Fallback: Direct modal opening if checkout handler not loaded
        const modal = document.getElementById('checkoutModalOverlay');
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        } else {
            console.warn('Donation modal not found. Please ensure checkout modal HTML is included in the page.');
        }
    };

    // Initialize on DOM ready
    function init() {
        // Find all "Donate Now" buttons and attach event listeners
        const donateButtons = document.querySelectorAll('#donateNowBtn, .donate-now-btn, a[href*="appointment.html"]');
        
        donateButtons.forEach(btn => {
            // Skip if already has event listener
            if (btn.dataset.donationListener === 'true') {
                return;
            }

            btn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                // Update button to have correct ID if it doesn't
                if (!this.id || this.id !== 'donateNowBtn') {
                    this.id = 'donateNowBtn';
                }
                
                // Open modal
                window.openDonationModal();
            });

            // Mark as having listener
            btn.dataset.donationListener = 'true';
        });
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Also initialize after a short delay to catch dynamically loaded buttons
    setTimeout(init, 500);
})();


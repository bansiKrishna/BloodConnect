// BloodConnect App - Shared JavaScript for all pages

(function() {
    'use strict';

    // App Configuration
    const App = {
        currentPage: '',
        isTransitioning: false,
        
        // Initialize app
        init: function() {
            this.currentPage = window.location.pathname.split('/').pop() || 'home.html';
            this.setupNavigation();
            this.setupPageTransitions();
            this.setupSmoothScroll();
            this.setupMobileMenu();
            this.updateActiveNav();
        },

        // Setup navigation handling
        setupNavigation: function() {
            // Keep native browser navigation for reliable back/forward behavior.
            document.addEventListener('click', function(e) {
                const link = e.target.closest('a');
                if (!link) return;
                if (link.getAttribute('data-app-nav') === 'true') {
                    const href = link.getAttribute('href');
                    if (!href) return;
                    if (href.startsWith('http') || href.startsWith('#') || href.startsWith('javascript:')) {
                        return;
                    }
                    if (e.ctrlKey || e.metaKey || e.shiftKey) {
                        return;
                    }
                    e.preventDefault();
                    App.navigateTo(href);
                }
            });
        },

        // Navigate to a page with transition
        navigateTo: function(url) {
            if (this.isTransitioning || url === this.currentPage) return;
            
            this.isTransitioning = true;
            
            // Show loading overlay
            this.showPageLoader();
            
            // Simulate page load delay for smooth transition
            setTimeout(() => {
                window.location.href = url;
            }, 300);
        },

        // Show page loader
        showPageLoader: function() {
            let loader = document.getElementById('pageLoader');
            if (!loader) {
                loader = document.createElement('div');
                loader.id = 'pageLoader';
                loader.innerHTML = `
                    <div class="fixed inset-0 bg-white z-[9999] flex items-center justify-center transition-opacity duration-300">
                        <div class="text-center">
                            <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center animate-pulse">
                                <i class="fas fa-tint text-white text-2xl"></i>
                            </div>
                            <p class="text-gray-600 font-medium">Loading...</p>
                        </div>
                    </div>
                `;
                document.body.appendChild(loader);
            }
            loader.querySelector('div').classList.remove('opacity-0');
        },

        // Setup page transitions
        setupPageTransitions: function() {
            // Add fade-in effect when page loads
            document.body.style.opacity = '0';
            document.body.style.transition = 'opacity 0.3s ease';
            
            window.addEventListener('load', function() {
                document.body.style.opacity = '1';
                
                // Hide loader if exists
                const loader = document.getElementById('pageLoader');
                if (loader) {
                    loader.querySelector('div').classList.add('opacity-0');
                    setTimeout(() => loader.remove(), 300);
                }
            });
        },

        // Setup smooth scroll for anchor links
        setupSmoothScroll: function() {
            document.querySelectorAll('a[href^="#"]').forEach(anchor => {
                anchor.addEventListener('click', function(e) {
                    const targetId = this.getAttribute('href');
                    if (targetId === '#') return;
                    
                    const targetElement = document.querySelector(targetId);
                    if (targetElement) {
                        e.preventDefault();
                        targetElement.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start'
                        });
                    }
                });
            });
        },

        // Setup mobile menu
        setupMobileMenu: function() {
            const mobileMenuBtn = document.getElementById('mobileMenuBtn');
            const mobileMenu = document.getElementById('mobileMenu');
            
            if (mobileMenuBtn && mobileMenu) {
                mobileMenuBtn.addEventListener('click', function() {
                    mobileMenu.classList.toggle('hidden');
                    const icon = this.querySelector('i');
                    if (icon) {
                        icon.classList.toggle('fa-bars');
                        icon.classList.toggle('fa-times');
                    }
                });

                // Close menu when clicking a link
                mobileMenu.querySelectorAll('a').forEach(link => {
                    link.addEventListener('click', () => {
                        mobileMenu.classList.add('hidden');
                        const icon = mobileMenuBtn.querySelector('i');
                        if (icon) {
                            icon.classList.add('fa-bars');
                            icon.classList.remove('fa-times');
                        }
                    });
                });
            }
        },

        // Update active navigation state
        updateActiveNav: function() {
            const currentPage = window.location.pathname.split('/').pop() || 'home.html';
            
            document.querySelectorAll('nav a, aside nav a').forEach(link => {
                const href = link.getAttribute('href');
                if (href === currentPage) {
                    link.classList.add('active');
                    // Add active styling
                    if (!link.classList.contains('bg-gradient-to-r')) {
                        link.classList.add('text-red-700', 'bg-red-50');
                    }
                } else {
                    link.classList.remove('active', 'text-red-700', 'bg-red-50');
                }
            });
        },

        // Toast notification system
        showToast: function(message, type = 'info', duration = 3000) {
            // Remove existing toasts
            const existingToast = document.getElementById('appToast');
            if (existingToast) existingToast.remove();

            const toast = document.createElement('div');
            toast.id = 'appToast';
            
            const colors = {
                success: 'bg-green-600',
                error: 'bg-red-600',
                warning: 'bg-yellow-600',
                info: 'bg-gray-800'
            };
            
            const icons = {
                success: 'fa-check-circle',
                error: 'fa-exclamation-circle',
                warning: 'fa-exclamation-triangle',
                info: 'fa-info-circle'
            };

            toast.className = `fixed bottom-4 right-4 ${colors[type]} text-white px-6 py-4 rounded-xl shadow-2xl transform translate-y-20 opacity-0 transition-all duration-300 z-[9999] flex items-center gap-3 min-w-[300px]`;
            toast.innerHTML = `
                <i class="fas ${icons[type]} text-xl"></i>
                <span class="font-medium">${message}</span>
            `;

            document.body.appendChild(toast);

            // Animate in
            requestAnimationFrame(() => {
                toast.classList.remove('translate-y-20', 'opacity-0');
            });

            // Auto dismiss
            setTimeout(() => {
                toast.classList.add('translate-y-20', 'opacity-0');
                setTimeout(() => toast.remove(), 300);
            }, duration);
        },

        // Confirm dialog
        confirm: function(message, onConfirm, onCancel) {
            const modal = document.createElement('div');
            modal.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4';
            modal.innerHTML = `
                <div class="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full transform scale-95 opacity-0 transition-all duration-300">
                    <div class="text-center mb-6">
                        <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                            <i class="fas fa-question text-2xl text-red-600"></i>
                        </div>
                        <h3 class="text-xl font-bold text-gray-800 mb-2">Confirm Action</h3>
                        <p class="text-gray-600">${message}</p>
                    </div>
                    <div class="flex gap-3">
                        <button class="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors" data-action="cancel">
                            Cancel
                        </button>
                        <button class="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors" data-action="confirm">
                            Confirm
                        </button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            // Animate in
            requestAnimationFrame(() => {
                modal.querySelector('div').classList.remove('scale-95', 'opacity-0');
            });

            // Handle buttons
            modal.addEventListener('click', function(e) {
                const action = e.target.dataset.action;
                if (action === 'confirm') {
                    modal.querySelector('div').classList.add('scale-95', 'opacity-0');
                    setTimeout(() => {
                        modal.remove();
                        if (onConfirm) onConfirm();
                    }, 300);
                } else if (action === 'cancel') {
                    modal.querySelector('div').classList.add('scale-95', 'opacity-0');
                    setTimeout(() => {
                        modal.remove();
                        if (onCancel) onCancel();
                    }, 300);
                }
            });
        },

        // Loading spinner
        showLoading: function(element, text = 'Loading...') {
            const originalContent = element.innerHTML;
            element.dataset.originalContent = originalContent;
            element.disabled = true;
            element.innerHTML = `
                <i class="fas fa-spinner fa-spin mr-2"></i>
                <span>${text}</span>
            `;
            return originalContent;
        },

        hideLoading: function(element) {
            const originalContent = element.dataset.originalContent;
            if (originalContent) {
                element.innerHTML = originalContent;
                element.disabled = false;
                delete element.dataset.originalContent;
            }
        }
    };

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => App.init());
    } else {
        App.init();
    }

    // Expose App globally
    window.BloodConnect = App;
})();

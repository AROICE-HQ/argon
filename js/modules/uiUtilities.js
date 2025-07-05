/**
 * UI Utilities Module - Handles navigation, modals, and other UI utilities
 */
class UIUtilities {
    constructor() {
        // Navigation elements
        this.navLinks = document.querySelectorAll('.sidebar-nav a');
        this.pageContents = document.querySelectorAll('.page-content');
        this.pageTitle = document.getElementById('page-title');
        
        // Help dropdown elements
        this.helpButton = document.getElementById('help-menu-trigger');
        this.helpDropdown = this.helpButton?.parentElement;
        this.dropdownMenu = document.getElementById('help-dropdown-menu');
    }

    /**
     * Initialize UI utilities
     */
    init() {
        this.initNavigation();
        this.initHelpDropdown();
    }

    /**
     * Initialize navigation functionality
     */
    initNavigation() {
        // Handle navigation based on URL hash
        this.handleHashNavigation();
        
        // Listen for hash changes
        window.addEventListener('hashchange', () => this.handleHashNavigation());
    }

    /**
     * Handle navigation based on URL hash
     */
    handleHashNavigation() {
        const hash = window.location.hash;
        if (hash) {
            const targetId = hash.substring(1); // Remove the # symbol
            const navLink = document.querySelector(`.sidebar-nav a[href="#${targetId}"]`);
            if (navLink) {
                // Navigate to the target section
                this.navigateToPage(targetId);
                
                // Update active link
                this.navLinks.forEach(link => {
                    link.classList.remove('active');
                });
                navLink.classList.add('active');
                
                // Page-specific navigation code can be added here if needed
            }
        }
    }

    /**
     * Function to navigate to a specific page
     */
    navigateToPage(pageId) {
        // Hide all pages
        this.pageContents.forEach(content => {
            content.classList.remove('active');
        });
        
        // Show the target page
        const targetPage = document.getElementById(pageId);
        if (targetPage) {
            targetPage.classList.add('active');
            
            // Update page title
            if (this.pageTitle) {
                const navItem = document.querySelector(`[data-page="${pageId}"]`);
                if (navItem) {
                    const span = navItem.querySelector('span');
                    if (span) {
                        this.pageTitle.textContent = span.textContent;
                    }
                } else {
                    // Fallback title mapping
                    const titles = {
                        'analytics': 'Screen Time Analytics',
                        'blocked-sites': 'Blocked Sites',
                        'pomodoro': 'Pomodoro Timer',
                        'doom-blocker': 'Doom Scroll Blocker',
                        'health-reminders': 'Digital Wellbeing',
                        'settings': 'Settings'
                    };
                    this.pageTitle.textContent = titles[pageId] || 
                        pageId.charAt(0).toUpperCase() + pageId.slice(1);
                }
            }
        }
    }

    /**
     * Help dropdown functionality
     */
    initHelpDropdown() {
        if (!this.helpButton || !this.helpDropdown) return;
        
        // Toggle dropdown
        this.helpButton.addEventListener('click', (e) => {
            e.stopPropagation();
            this.helpDropdown.classList.toggle('active');
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.helpDropdown.contains(e.target)) {
                this.helpDropdown.classList.remove('active');
            }
        });
        
        // What's New modal
        const whatsNewBtn = document.getElementById('whats-new-btn');
        const whatsNewModal = document.getElementById('whats-new-modal');
        
        if (whatsNewBtn && whatsNewModal) {
            whatsNewBtn.addEventListener('click', () => {
                whatsNewModal.classList.add('active');
                this.helpDropdown.classList.remove('active');
            });
        }
        
        // About Developer modal
        const aboutDeveloperBtn = document.getElementById('about-developer-btn');
        const aboutDeveloperModal = document.getElementById('about-developer-modal');
        
        if (aboutDeveloperBtn && aboutDeveloperModal) {
            aboutDeveloperBtn.addEventListener('click', () => {
                aboutDeveloperModal.classList.add('active');
                this.helpDropdown.classList.remove('active');
            });
        }
        
        // About Designer modal
        const aboutDesignerBtn = document.getElementById('about-designer-btn');
        const aboutDesignerModal = document.getElementById('about-designer-modal');
        
        if (aboutDesignerBtn && aboutDesignerModal) {
            aboutDesignerBtn.addEventListener('click', () => {
                aboutDesignerModal.classList.add('active');
                this.helpDropdown.classList.remove('active');
            });
        }
        
        // Close modals
        document.querySelectorAll('[data-modal]').forEach(button => {
            button.addEventListener('click', () => {
                const modalId = button.getAttribute('data-modal');
                const modal = document.getElementById(modalId);
                if (modal) {
                    modal.classList.remove('active');
                }
            });
        });
        
        // Close modals when clicking outside
        [whatsNewModal, aboutDeveloperModal, aboutDesignerModal].forEach(modal => {
            if (modal) {
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        modal.classList.remove('active');
                    }
                });
            }
        });
        
        // Keyboard support for modals (ESC to close)
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                // Close any active modal
                [whatsNewModal, aboutDeveloperModal, aboutDesignerModal].forEach(modal => {
                    if (modal && modal.classList.contains('active')) {
                        modal.classList.remove('active');
                    }
                });
            }
        });
        
        // Copy email functionality
        const copyIcon = document.querySelector('.copy-icon');
        if (copyIcon) {
            copyIcon.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const email = 'aryan@aroice.in';
                
                // Try to use the modern clipboard API
                if (navigator.clipboard && window.isSecureContext) {
                    navigator.clipboard.writeText(email).then(() => {
                        this.showCopyFeedback(copyIcon);
                    }).catch(() => {
                        this.fallbackCopyTextToClipboard(email, copyIcon);
                    });
                } else {
                    this.fallbackCopyTextToClipboard(email, copyIcon);
                }
            });
        }
    }

    /**
     * Show copy feedback animation
     */
    showCopyFeedback(element) {
        const originalIcon = element.className;
        element.className = 'fas fa-check copy-icon';
        element.style.color = 'var(--success-color)';
        
        setTimeout(() => {
            element.className = originalIcon;
            element.style.color = '';
        }, 2000);
    }

    /**
     * Fallback copy function for older browsers
     */
    fallbackCopyTextToClipboard(text, element) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            document.execCommand('copy');
            this.showCopyFeedback(element);
        } catch (err) {
            console.error('Fallback: Oops, unable to copy', err);
        }
        
        document.body.removeChild(textArea);
    }

    /**
     * Switch between different dashboard pages
     * @param {string} pageName - Name of the page to show
     */
    switchPage(pageName) {
        // Update URL hash
        window.location.hash = `#${pageName}`;
        
        // Navigation will be handled by handleHashNavigation
        this.handleHashNavigation();
    }
}

// Export for use in main dashboard
window.UIUtilities = UIUtilities;

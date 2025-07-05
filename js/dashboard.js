/**
 * Main Dashboard Controller
 * This file loads and coordinates all the modular components
 */

// Load all modules and initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
    // Load module files
    const moduleFiles = [
        'js/modules/analytics.js',
        'js/modules/blockedSites.js',
        'js/modules/pomodoroTimer.js',
        'js/modules/doomBlocker.js',
        'js/modules/healthReminders.js',
        'js/modules/settings.js',
        'js/modules/uiUtilities.js'
    ];

    // Function to load script files
    function loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    // Load all modules sequentially
    Promise.all(moduleFiles.map(loadScript))
        .then(() => {
            console.log('All modules loaded successfully');
            initializeDashboard();
        })
        .catch(error => {
            console.error('Error loading modules:', error);
            // Initialize with basic functionality even if modules fail
            initializeDashboard();
        });

    function initializeDashboard() {
        // Get refresh button
        const refreshDataBtn = document.getElementById('refresh-data');
        
        // Initialize module instances
        const analytics = new (window.AnalyticsManager || class { init() {} refreshData() {} })();
        const blockedSites = new (window.BlockedSitesManager || class { init() {} refreshData() {} })();
        const doomBlocker = new (window.DoomBlocker || class { init() {} refreshData() {} })();
        const healthReminders = new (window.HealthReminders || class { init() {} refreshData() {} })();
        const settings = new (window.SettingsManager || class { init() {} refreshData() {} })();
        const uiUtilities = new (window.UIUtilities || class { init() {} })();
        let pomodoroTimer = null;

        // Initialize core dashboard functionality
        initDashboard();

        /**
         * Initialize the dashboard when it first loads
         */
        function initDashboard() {
            // Initialize UI utilities first
            uiUtilities.init();
            
            // Initialize all modules
            analytics.init();
            blockedSites.init();
            doomBlocker.init();
            healthReminders.init();
            settings.init();

            // Initialize event listeners
            initEventListeners();

            // Set initial page based on hash or default to analytics
            const hash = window.location.hash || '#analytics';
            const pageName = hash.substring(1);
            switchPage(pageName);
        }

        /**
         * Switch between different dashboard pages
         * @param {string} pageName - Name of the page to show
         */
        function switchPage(pageName) {
            // Use UI utilities for page switching
            if (uiUtilities.switchPage) {
                uiUtilities.switchPage(pageName);
            }

            // Page-specific initialization
            handlePageSpecificInit(pageName);
        }

        /**
         * Handle page-specific initialization
         * @param {string} pageName - Name of the page
         */
        function handlePageSpecificInit(pageName) {
            if (pageName === 'pomodoro') {
                // Initialize Pomodoro Timer when switching to pomodoro page
                if (!pomodoroTimer && window.PomodoroTimer) {
                    setTimeout(() => {
                        pomodoroTimer = new window.PomodoroTimer();
                    }, 100);
                }
            }
            
            if (pageName === 'doom-blocker') {
                // Ensure doom blocker is initialized
                setTimeout(() => {
                    if (doomBlocker && doomBlocker.refreshData) {
                        doomBlocker.refreshData();
                    }
                }, 100);
            }
            
            if (pageName === 'health-reminders' && healthReminders) {
                // Refresh health reminders UI
                setTimeout(() => {
                    if (healthReminders.updateUI) {
                        healthReminders.updateUI();
                    }
                }, 100);
            }
        }

        /**
         * Handle refresh data button click with enhanced animations
         */
        async function handleRefreshData() {
            if (!refreshDataBtn) return;
            
            // Add loading state with animation
            refreshDataBtn.classList.add('loading');
            refreshDataBtn.disabled = true;
            
            try {
                // Simulate some processing time and refresh data
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // Refresh all modules
                const refreshPromises = [];
                
                if (analytics.refreshData) refreshPromises.push(analytics.refreshData());
                if (blockedSites.refreshData) refreshPromises.push(blockedSites.refreshData());
                if (doomBlocker.refreshData) refreshPromises.push(doomBlocker.refreshData());
                if (healthReminders.refreshData) refreshPromises.push(healthReminders.refreshData());
                if (settings.refreshData) refreshPromises.push(settings.refreshData());
                
                await Promise.all(refreshPromises);
                
                // Show success animation
                refreshDataBtn.classList.remove('loading');
                refreshDataBtn.classList.add('success');
                
                // Remove success animation after completion
                setTimeout(() => {
                    refreshDataBtn.classList.remove('success');
                    refreshDataBtn.disabled = false;
                }, 600);
                
            } catch (error) {
                console.error('Error refreshing data:', error);
                
                // Remove loading state on error
                refreshDataBtn.classList.remove('loading');
                refreshDataBtn.disabled = false;
            }
        }

        /**
         * Initialize event listeners
         */
        function initEventListeners() {
            // Refresh data button with enhanced animations
            if (refreshDataBtn) {
                refreshDataBtn.addEventListener('click', async () => {
                    await handleRefreshData();
                });
            }
        }

        // Make switchPage available globally for backward compatibility
        window.switchPage = switchPage;
        
        // Make module instances available globally if needed
        window.dashboardModules = {
            analytics,
            blockedSites,
            doomBlocker,
            healthReminders,
            settings,
            uiUtilities,
            getPomodoroTimer: () => pomodoroTimer
        };
    }
});

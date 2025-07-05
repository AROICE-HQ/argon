/**
 * Settings Module - Handles application settings and preferences
 */
class SettingsManager {
    constructor() {
        // Settings page elements
        this.blockPageStyleSelect = document.getElementById('block-page-style');
        this.enableSchedulingToggle = document.getElementById('enable-scheduling');
        this.enableKeywordBlockingToggle = document.getElementById('enable-keyword-blocking');
        this.keywordSettings = document.getElementById('keyword-settings');
        this.keywordInput = document.getElementById('keyword-input');
        this.addKeywordBtn = document.getElementById('add-keyword-btn');
        this.keywordsList = document.getElementById('keywords-list');
    }

    /**
     * Initialize settings functionality
     */
    init() {
        this.loadSettings();
        this.initEventListeners();
    }

    /**
     * Initialize event listeners for settings
     */
    initEventListeners() {
        // Settings event listeners
        if (this.blockPageStyleSelect) {
            this.blockPageStyleSelect.addEventListener('change', () => this.updateSetting());
        }
        if (this.enableSchedulingToggle) {
            this.enableSchedulingToggle.addEventListener('change', () => this.updateSetting());
        }
        if (this.enableKeywordBlockingToggle) {
            this.enableKeywordBlockingToggle.addEventListener('change', () => this.updateSetting());
        }
        if (this.addKeywordBtn) {
            this.addKeywordBtn.addEventListener('click', () => this.addKeyword());
        }
        if (this.keywordInput) {
            this.keywordInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.addKeyword();
                }
            });
        }
    }

    /**
     * Load settings from storage
     */
    loadSettings() {
        chrome.storage.local.get(['settings'], (data) => {
            const settings = data.settings || {
                blockPageStyle: 'default',
                enableScheduling: false,
                schedules: [],
                enableKeywordBlocking: false,
                blockedKeywords: []
            };
            
            // Add null checks before setting values
            if (this.blockPageStyleSelect) {
                this.blockPageStyleSelect.value = settings.blockPageStyle || 'default';
            }
            if (this.enableSchedulingToggle) {
                this.enableSchedulingToggle.checked = settings.enableScheduling || false;
            }
            if (this.enableKeywordBlockingToggle) {
                this.enableKeywordBlockingToggle.checked = settings.enableKeywordBlocking || false;
            }
            
            // Show/hide keyword settings based on toggle
            if (this.keywordSettings) {
                this.keywordSettings.style.display = settings.enableKeywordBlocking ? 'block' : 'none';
            }
            
            // Load keywords
            this.renderKeywords(settings.blockedKeywords || []);
        });
    }

    /**
     * Update a setting in storage
     */
    updateSetting() {
        chrome.storage.local.get(['settings'], (data) => {
            const settings = data.settings || {};
            
            // Update individual settings
            if (this.blockPageStyleSelect) {
                settings.blockPageStyle = this.blockPageStyleSelect.value;
            }
            if (this.enableSchedulingToggle) {
                settings.enableScheduling = this.enableSchedulingToggle.checked;
            }
            if (this.enableKeywordBlockingToggle) {
                settings.enableKeywordBlocking = this.enableKeywordBlockingToggle.checked;
            }
            
            // Show/hide keyword settings based on toggle
            if (this.keywordSettings) {
                this.keywordSettings.style.display = settings.enableKeywordBlocking ? 'block' : 'none';
            }
            
            // Save settings
            chrome.storage.local.set({ settings });
        });
    }

    /**
     * Render keywords list
     * @param {Array} keywords - Array of keyword strings
     */
    renderKeywords(keywords) {
        if (!this.keywordsList) return;
        
        this.keywordsList.innerHTML = '';
        
        keywords.forEach(keyword => {
            const keywordElement = document.createElement('div');
            keywordElement.className = 'keyword-tag';
            keywordElement.innerHTML = `
                ${keyword}
                <button class="remove-keyword" data-keyword="${keyword}">
                    <i class="fas fa-times"></i>
                </button>
            `;
            this.keywordsList.appendChild(keywordElement);
        });
        
        // Add event listeners to remove buttons
        document.querySelectorAll('.remove-keyword').forEach(button => {
            button.addEventListener('click', () => {
                const keyword = button.dataset.keyword;
                this.removeKeyword(keyword);
            });
        });
    }

    /**
     * Add a new keyword to blocked keywords
     */
    addKeyword() {
        if (!this.keywordInput) return;
        
        const keyword = this.keywordInput.value.trim();
        
        if (!keyword) return;
        
        chrome.storage.local.get(['settings'], (data) => {
            const settings = data.settings || {};
            let blockedKeywords = settings.blockedKeywords || [];
            
            // Check if keyword already exists
            if (blockedKeywords.includes(keyword)) {
                alert('This keyword is already blocked.');
                return;
            }
            
            // Add keyword
            blockedKeywords.push(keyword);
            
            // Update settings
            settings.blockedKeywords = blockedKeywords;
            chrome.storage.local.set({ settings }, () => {
                this.keywordInput.value = '';
                this.renderKeywords(blockedKeywords);
            });
        });
    }

    /**
     * Remove a keyword from blocked keywords
     * @param {string} keyword - Keyword to remove
     */
    removeKeyword(keyword) {
        chrome.storage.local.get(['settings'], (data) => {
            const settings = data.settings || {};
            let blockedKeywords = settings.blockedKeywords || [];
            
            // Remove keyword
            blockedKeywords = blockedKeywords.filter(k => k !== keyword);
            
            // Update settings
            settings.blockedKeywords = blockedKeywords;
            chrome.storage.local.set({ settings }, () => {
                this.renderKeywords(blockedKeywords);
            });
        });
    }

    /**
     * Refresh settings data
     */
    async refreshData() {
        this.loadSettings();
    }
}

// Export for use in main dashboard
window.SettingsManager = SettingsManager;

/**
 * Blocked Sites Module - Handles blocked sites management and functionality
 */
class BlockedSitesManager {
    constructor() {
        // UI Elements
        this.addSiteBtn = document.getElementById('add-site-btn');
        this.searchBlockedSitesInput = document.getElementById('search-blocked-sites');
        this.blockedSitesList = document.getElementById('blocked-sites-list');
        this.addSiteModal = document.getElementById('add-site-modal');
        this.closeBtns = document.querySelectorAll('.close-modal, .cancel-btn');
        this.saveSiteBtn = document.getElementById('save-site-btn');
        this.siteUrlInput = document.getElementById('site-url');
    }

    /**
     * Initialize blocked sites functionality
     */
    init() {
        this.loadBlockedSites();
        this.initEventListeners();
    }

    /**
     * Initialize event listeners for blocked sites
     */
    initEventListeners() {
        // Add site button
        if (this.addSiteBtn) {
            this.addSiteBtn.addEventListener('click', () => {
                console.log('Add site button clicked');
                this.siteUrlInput.value = '';
                this.saveSiteBtn.dataset.mode = 'add';
                delete this.saveSiteBtn.dataset.originalHostname;
                this.addSiteModal.classList.add('active');
                console.log('Modal should be visible now');
            });
        } else {
            console.error('Add site button not found');
        }

        // Modal close buttons
        if (this.closeBtns.length > 0) {
            this.closeBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    console.log('Close button clicked');
                    this.addSiteModal.classList.remove('active');
                });
            });
        } else {
            console.error('Close buttons not found');
        }

        // Close modal when clicking outside
        if (this.addSiteModal) {
            this.addSiteModal.addEventListener('click', (e) => {
                if (e.target === this.addSiteModal) {
                    console.log('Clicked outside modal');
                    this.addSiteModal.classList.remove('active');
                }
            });
        } else {
            console.error('Add site modal not found');
        }

        // Save site button
        if (this.saveSiteBtn) {
            this.saveSiteBtn.addEventListener('click', () => {
                console.log('Save site button clicked');
                this.saveSite();
            });
        } else {
            console.error('Save site button not found');
        }

        // Search blocked sites
        if (this.searchBlockedSitesInput) {
            this.searchBlockedSitesInput.addEventListener('input', () => {
                this.loadBlockedSites();
            });
        }
    }

    /**
     * Load blocked sites list
     */
    loadBlockedSites() {
        chrome.storage.local.get(['blockedSites'], (data) => {
            const blockedSites = data.blockedSites || [];
            this.renderBlockedSites(blockedSites);
        });
    }

    /**
     * Render the blocked sites list 
     * @param {Array} sites - Array of blocked site objects
     */
    renderBlockedSites(sites) {
        if (!this.blockedSitesList) return;
        
        this.blockedSitesList.innerHTML = '';
        
        if (sites.length === 0) {
            this.blockedSitesList.innerHTML = `
                <div class="empty-state">
                    <p>No sites have been blocked yet.</p>
                    <p>Click "Add Site" to start blocking distractions.</p>
                </div>
            `;
            return;
        }
        
        // Filter sites if search text exists
        const searchText = this.searchBlockedSitesInput ? this.searchBlockedSitesInput.value.toLowerCase() : '';
        const filteredSites = searchText ? 
            sites.filter(site => site.toLowerCase().includes(searchText)) : 
            sites;
        
        filteredSites.forEach(site => {
            const siteElement = document.createElement('div');
            siteElement.className = 'blocked-site-item';
            siteElement.innerHTML = `
                <div class="blocked-site-info">
                    <span class="site-name">${site}</span>
                </div>
                <div class="blocked-site-actions">
                    <button class="action-btn edit" data-hostname="${site}" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete" data-hostname="${site}" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            
            this.blockedSitesList.appendChild(siteElement);
        });
        
        // Add event listeners to action buttons
        document.querySelectorAll('.action-btn.edit').forEach(button => {
            button.addEventListener('click', () => {
                const hostname = button.dataset.hostname;
                this.editBlockedSite(hostname);
            });
        });
        
        document.querySelectorAll('.action-btn.delete').forEach(button => {
            button.addEventListener('click', () => {
                const hostname = button.dataset.hostname;
                this.deleteBlockedSite(hostname);
            });
        });
    }

    /**
     * Edit a blocked site (FIX: treat as string)
     * @param {string} hostname - Hostname to edit
     */
    editBlockedSite(hostname) {
        this.siteUrlInput.value = hostname;
        this.saveSiteBtn.dataset.mode = 'edit';
        this.saveSiteBtn.dataset.originalHostname = hostname;
        this.addSiteModal.classList.add('active');
    }

    /**
     * Delete a blocked site (FIX: treat as string)
     * @param {string} hostname - Hostname to delete
     */
    deleteBlockedSite(hostname) {
        if (confirm(`Are you sure you want to unblock ${hostname}?`)) {
            chrome.storage.local.get(['blockedSites'], (data) => {
                let blockedSites = data.blockedSites || [];
                blockedSites = blockedSites.filter(site => site !== hostname);
                chrome.storage.local.set({ blockedSites }, () => {
                    this.loadBlockedSites();
                });
            });
        }
    }

    /**
     * Save blocked site data (FIX: store as array of strings, not objects)
     */
    saveSite() {
        const hostname = this.siteUrlInput.value.trim();
        if (!hostname) {
            alert('Please enter a valid domain name.');
            return;
        }
        
        // Clean up the hostname (remove http://, www., etc.)
        const cleanHostname = hostname
            .replace(/^https?:\/\//i, '')
            .replace(/^www\./i, '')
            .split('/')[0]; // Take only domain part
            
        chrome.storage.local.get(['blockedSites', 'settings'], (data) => {
            let blockedSites = data.blockedSites || [];
            const settings = data.settings || {};
            const mode = this.saveSiteBtn.dataset.mode || 'add';
            const originalHostname = this.saveSiteBtn.dataset.originalHostname;
            
            if (mode === 'add') {
                // Check if site is already in the list
                if (blockedSites.includes(cleanHostname)) {
                    alert('This site is already blocked.');
                    return;
                }
                // Add new site (as string)
                blockedSites.push(cleanHostname);
            } else if (mode === 'edit') {
                blockedSites = blockedSites.map(site => site === originalHostname ? cleanHostname : site);
            }
            
            // Save to storage
            chrome.storage.local.set({ 
                blockedSites,
                settings
            }, () => {
                this.addSiteModal.classList.remove('active');
                this.renderBlockedSites(blockedSites);
            });
        });
    }

    /**
     * Refresh blocked sites data
     */
    async refreshData() {
        this.loadBlockedSites();
    }
}

// Export for use in main dashboard
window.BlockedSitesManager = BlockedSitesManager;

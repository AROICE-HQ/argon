/**
 * Doom Scroll Blocker Module - Handles doom scroll blocker functionality
 */
class DoomBlocker {
    constructor() {
        this.doomSiteInput = document.getElementById('doom-site-input');
        this.doomAddBtn = document.getElementById('doom-add-btn');
        this.doomSitesList = document.getElementById('doom-sites-list');
        this.doomEmptyState = document.getElementById('doom-empty-state');
    }

    /**
     * Initialize doom blocker functionality
     */
    init() {
        if (!this.doomSiteInput || !this.doomAddBtn || !this.doomSitesList) return;
        
        // Load doom sites on initialization
        this.loadDoomSites();
        this.loadDoomStats();
        this.initEventListeners();
    }

    /**
     * Initialize event listeners
     */
    initEventListeners() {
        // Add site button event
        this.doomAddBtn.addEventListener('click', () => this.addDoomSite());
        
        // Enter key support for input
        this.doomSiteInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addDoomSite();
            }
        });
        
        // Remove site event delegation
        this.doomSitesList.addEventListener('click', (e) => {
            if (e.target.classList.contains('doom-btn') && e.target.classList.contains('danger')) {
                const siteItem = e.target.closest('.doom-site-item');
                const siteName = siteItem.dataset.site;
                this.removeDoomSite(siteName);
            }
        });
    }

    /**
     * Load doom scroll sites
     */
    loadDoomSites() {
        chrome.storage.local.get(['doomblockedsites'], (data) => {
            const sites = data.doomblockedsites || [];
            this.renderDoomSites(sites);
        });
    }

    /**
     * Render doom sites list
     */
    renderDoomSites(sites) {
        if (!this.doomSitesList) return;
        
        this.doomSitesList.innerHTML = '';
        
        if (sites.length === 0) {
            if (this.doomEmptyState) this.doomEmptyState.style.display = 'block';
            return;
        }
        
        if (this.doomEmptyState) this.doomEmptyState.style.display = 'none';
        
        sites.forEach(site => {
            const siteItem = document.createElement('div');
            siteItem.className = 'doom-site-item';
            siteItem.dataset.site = site;
            
            const favicon = this.getFaviconUrl(site);
            
            siteItem.innerHTML = `
                <div class="doom-site-info">
                    <div class="doom-site-icon">
                        <i class="fas fa-skull"></i>
                    </div>
                    <div class="doom-site-name">${site}</div>
                </div>
                <div class="doom-site-actions">
                    <button class="doom-btn danger" title="Remove site">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            
            // Add animation class for new items
            siteItem.classList.add('new');
            setTimeout(() => siteItem.classList.remove('new'), 300);
            
            this.doomSitesList.appendChild(siteItem);
        });
    }

    /**
     * Add doom scroll site
     */
    addDoomSite() {
        if (!this.doomSiteInput || !this.doomAddBtn) return;
        
        const site = this.doomSiteInput.value.trim().toLowerCase();
        
        if (!site) {
            alert('Please enter a website URL');
            return;
        }
        
        // Validate site format
        const siteRegex = /^[a-z0-9.-]+\.[a-z]{2,}(\/[a-z0-9\-._~%!$&'()*+,;=:@/]*\*?)?$/i;
        if (!siteRegex.test(site)) {
            alert('Please enter a valid domain (e.g., example.com or example.com/*)');
            return;
        }
        
        // Add loading state
        this.doomAddBtn.classList.add('loading');
        this.doomSiteInput.disabled = true;
        
        chrome.storage.local.get(['doomblockedsites'], (data) => {
            const sites = data.doomblockedsites || [];
            
            if (sites.includes(site)) {
                alert('This site is already in your doom scroll list');
                this.doomAddBtn.classList.remove('loading');
                this.doomSiteInput.disabled = false;
                return;
            }
            
            sites.push(site);
            
            chrome.storage.local.set({ doomblockedsites: sites }, () => {
                if (chrome.runtime.lastError) {
                    console.error('Error adding doom site:', chrome.runtime.lastError);
                    alert('Failed to add site. Please try again.');
                } else {
                    this.doomSiteInput.value = '';
                    this.loadDoomSites();
                    this.loadDoomStats();
                }
                
                this.doomAddBtn.classList.remove('loading');
                this.doomSiteInput.disabled = false;
            });
        });
    }

    /**
     * Remove doom scroll site
     */
    removeDoomSite(site) {
        if (!confirm(`Remove ${site} from doom scroll protection?`)) {
            return;
        }
        
        chrome.storage.local.get(['doomblockedsites'], (data) => {
            const sites = data.doomblockedsites || [];
            const updatedSites = sites.filter(s => s !== site);
            
            chrome.storage.local.set({ doomblockedsites: updatedSites }, () => {
                if (chrome.runtime.lastError) {
                    console.error('Error removing doom site:', chrome.runtime.lastError);
                    alert('Failed to remove site. Please try again.');
                } else {
                    // Simple success feedback without notification
                    this.loadDoomSites();
                    this.loadDoomStats();
                }
            });
        });
    }

    /**
     * Load doom scroll statistics
     */
    loadDoomStats() {
        chrome.storage.local.get(['doomStats'], (data) => {
            const stats = data.doomStats || {
                interventionsToday: 0,
                timeSaved: 0,
                streak: 0
            };
            
            // Update stats display
            const interventionsEl = document.getElementById('doom-interventions-today');
            const timeSavedEl = document.getElementById('doom-time-saved');
            const streakEl = document.getElementById('doom-streak');
            
            if (interventionsEl) interventionsEl.textContent = stats.interventionsToday;
            if (timeSavedEl) timeSavedEl.textContent = `${stats.timeSaved}m`;
            if (streakEl) streakEl.textContent = stats.streak;
        });
    }

    /**
     * Get favicon URL for a domain
     */
    getFaviconUrl(domain) {
        if (!domain) return '';
        if (domain.startsWith('chrome://')) return '';
        return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
    }

    /**
     * Refresh doom blocker data
     */
    async refreshData() {
        this.loadDoomSites();
        this.loadDoomStats();
    }
}

// Export for use in main dashboard
window.DoomBlocker = DoomBlocker;

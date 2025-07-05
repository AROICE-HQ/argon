/**
 * ARGON - Popup Script
 * This is where all the magic happens for our little popup window! :)
 * It is like that mini control center that shows up when you click the extension icon
 */

// Wait for the DOM to load before we start doing anything
// Kind of like waiting for all the HTML elements to be ready before we do something with it
document.addEventListener('DOMContentLoaded', () => {
    
    // === Grab all the HTML elements we need to work with ===

    // These are basically references to parts of our popup HTML
    const screenTimeElement = document.getElementById('screen-time'); // Shows how long we've been online today
    const blocksToday = document.getElementById('blocks-today'); // Counter for blocked attempts
    const sitesBlockedCount = document.getElementById('sites-blocked'); // Total number of sites in our block list
    const blockSiteBtn = document.getElementById('block-site-btn'); // The main block/unblock button
    const analyticsBtn = document.getElementById('analytics-btn'); // Opens the dashboard analytics page
    const settingsBtn = document.getElementById('settings-btn'); // Opens the blocked sites settings page
    

    // === Timer-related elements ===

    // These only show up when a site is temporarily allowed (the 5-minute timer)
    const temporaryAllowContainer = document.getElementById('temporary-allow-container');
    const timerSiteElement = document.getElementById('timer-site'); // Shows which site is temporarily allowed
    const timerCountdown = document.getElementById('timer-countdown'); // The actual countdown timer (5:00, 4:59,...)
    const timerProgress = document.getElementById('timer-progress'); // The circular progress bar

    // === Timer variables ===
    let timerInterval = null; // Keeps track of our countdown timer so we can stop it later
    const CIRCLE_CIRCUMFERENCE = 157; // Math stuff for the circular progress bar (2πr, where r=25) for visual progress bar

    /**
     * Extract domain from URL - basically gets the main website name from a full URL
     * For example: https://www.google.com/search?q=aryantechie -> google.com
     * why?
     * We need this because we store blocked sites as just domain names, not full URLs
     * 
     * @param {string} url - The URL we want to extract the domain from
     * @returns {string} - Just the domain part (like facebook.com)
     */

    function extractDomain(url) {
        try {
            // If someone passes us nothing, return nothing
            if (!url) return "";
            
            // Handle weird browser pages like chrome://settings or about:blank
            // These need special treatment because they're not normal websites
            if (url.startsWith("chrome://") || 
                url.startsWith("chrome-extension://") || 
                url.startsWith("about:")) {
                return url.split("/")[0] + "//" + url.split("/")[2];
            }
            
            // For normal websites, use the built-in URL parser
            const urlObj = new URL(url);
            let domain = urlObj.hostname; // This gets us something like "www.aroice.in"
            
            // Most people don't care about the "www." part, so let's remove it
            if (domain.startsWith('www.')) {
                domain = domain.substring(4); // Remove the first 4 characters ("www.")
            }
            
            return domain; // Now we have just "aroice.in"
        } catch (e) {
            // If something goes wrong (like a malformed URL), just log it and return empty
            console.error("Error extracting domain:", e);
            return "";
        }
    }

    /**
     * start the popup with data from storage
     * 
     * This is like setting up our popup window when it first opens
     * We check what website the user is currently on and update our buttons accordingly
     */
    function initPopup() {
        // checks the current state like which site user is currently on"
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs.length === 0) return; // If no tabs, stop.
            
            const currentTab = tabs[0];
            // deadcode - start
            const hostname = new URL(currentTab.url).hostname;
            // deadcode - end
            const domain = extractDomain(currentTab.url); // Get the clean domain name
            
            // Update the block/unblock button based on current site
            if (domain && !isInternalPage(currentTab.url)) {
                // Check if this site is already in our block list
                checkIfBlocked(domain).then(isBlocked => {
                    if (isBlocked) {
                        // Site is blocked, so show "Unblock" button
                        blockSiteBtn.innerHTML = '<i class="fas fa-check-circle"></i> Unblock Site';
                        blockSiteBtn.classList.replace('primary-btn', 'secondary-btn');
                    } else {
                        // Site is not blocked, so show "Block" button
                        blockSiteBtn.innerHTML = '<i class="fas fa-ban"></i> Block Site';
                        blockSiteBtn.classList.replace('secondary-btn', 'primary-btn');
                    }
                    blockSiteBtn.dataset.hostname = domain; // Store the domain for later use
                });

                // Check if this site is temporarily allowed (has the 5-minute timer going)
                checkIfTemporarilyAllowed(hostname, currentTab.url);
            } else {
                // Can't block special browser pages like settings, so disable the button
                blockSiteBtn.disabled = true;
                blockSiteBtn.innerHTML = '<i class="fas fa-ban"></i> Cannot Block';
                hideTimer(); // Make sure timer is hidden
            }
        });

        // Load and display all our stats (screen time, block count, etc.)
        updateStats();
        
        // Set up a timer that checks every second if we need to update the countdown
        // This keeps the timer ticking down in real-time
        setInterval(() => {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs.length > 0) {
                    const currentTab = tabs[0];
                    const hostname = new URL(currentTab.url).hostname;
                    if (!isInternalPage(currentTab.url)) {
                        checkIfTemporarilyAllowed(hostname, currentTab.url);
                    }
                }
            });
        }, 1000); // Update every 1000ms = 1 second
    }

    /**
     * Check if a site is temporarily allowed and display timer
     * This function checks if the user clicked "Allow Once" on the block page
     * 
     * If they did, we show them a countdown timer for how much time is left
     * @param {string} hostname - The hostname to check (like google.com)
     * @param {string} fullUrl - The full URL of the site they're visiting
     */
    function checkIfTemporarilyAllowed(hostname, fullUrl) {
        // Use the same domain extraction logic as our background script
        // This ensures consistency across the extension
        const domain = extractDomain(fullUrl);
        
        // Check our storage to see if this domain has a temporary pass
        chrome.storage.local.get(['temporaryAllowed'], (data) => {
            const temporaryAllowed = data.temporaryAllowed || {}; // Get temp allowed sites, or empty object if none
            
            // Is this domain temporarily allowed AND is the time still valid?
            if (temporaryAllowed[domain] && temporaryAllowed[domain] > Date.now()) {
                // Calculate how much time is left (in milliseconds)
                const remainingMs = temporaryAllowed[domain] - Date.now();
                
                // Show the timer with remaining time
                showTimer(domain, remainingMs);
            } else {
                // Either not temporarily allowed, or the time expired
                // Clean up expired entries to keep storage tidy
                if (temporaryAllowed[domain] && temporaryAllowed[domain] <= Date.now()) {
                    delete temporaryAllowed[domain]; // Remove expired entry
                    chrome.storage.local.set({ temporaryAllowed }); // Save the cleanup
                }
                hideTimer(); // Make sure timer is hidden
            }
        });
    }

    /**
     * Show the timer for temporarily allowed site
     * This creates the little countdown timer that shows when you've given yourself 5 minutes
     * @param {string} hostname - Site hostname
     * @param {number} remainingMs - Remaining time in ms
     */
    function showTimer(hostname, remainingMs) {
        // Make the timer container visible (it's hidden by default)
        temporaryAllowContainer.style.display = 'block';
        
        // Show which site we're temporarily allowing
        timerSiteElement.textContent = hostname;
        
        // If there's already a timer running, stop it first
        // We don't want multiple timers running at the same time!
        if (timerInterval) {
            clearInterval(timerInterval);
        }
        
        // Update the countdown display immediately
        updateCountdown(remainingMs);
        
        // Start a new timer that updates every second
        timerInterval = setInterval(() => {
            remainingMs -= 1000; // Subtract 1 second (1000 milliseconds)
            
            // Time's up! Hide the timer and refresh everything
            if (remainingMs <= 0) {
                hideTimer();
                clearInterval(timerInterval);
                // Refresh the popup to update the UI (site should be blocked again)
                window.location.reload();
                return;
            }
            
            // Still got time left, update the display
            updateCountdown(remainingMs);
        }, 1000); // Run this every 1000ms = 1 second
    }

    /**
     * Update the countdown display
     * This function calculates minutes and seconds from milliseconds and updates the UI
     * 
     * @param {number} remainingMs - Time remaining in milliseconds
     */
    function updateCountdown(remainingMs) {
        // Convert milliseconds to total seconds (rounded up)
        const totalSeconds = Math.ceil(remainingMs / 1000);
        // Figure out how many whole minutes we have
        const minutes = Math.floor(totalSeconds / 60);
        // And how many seconds are left over
        const seconds = totalSeconds % 60;
        
        // Update the countdown text display (like "4:59" or "0:30")
        // padStart ensures seconds always shows 2 digits (e.g., "05" instead of "5")
        timerCountdown.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        // Update the circular progress ring around the timer
        // This shows visually how much time is left (the ring gets smaller as time runs out)
        const progressPercent = Math.min(1, remainingMs / (5 * 60 * 1000)); // 5 minutes total
        const strokeDashOffset = CIRCLE_CIRCUMFERENCE * (1 - progressPercent);
        timerProgress.style.strokeDashoffset = strokeDashOffset;
    }

    /**
     * this Hides the timer and clean up
     * Called when the temporary access period ends or if there's no timer to show
     */
    function hideTimer() {
        // Make the timer container invisible
        temporaryAllowContainer.style.display = 'none';
        // Stop the countdown if it's running
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
    }

    /**
     * Check if a URL is an internal browser page
     * These are special browser pages like chrome://settings that we can't really block
     * @param {string} url - URL to check
     * @returns {boolean} - True if internal page
     */
    function isInternalPage(url) {
        return url.startsWith('chrome://') || 
               url.startsWith('chrome-extension://') || 
               url.startsWith('edge://') || 
               url.startsWith('about:');
    }

    /**
     * Check if a site is in the blocked list (uses same domain extraction as background)
     * This asks our stored storage like: "Hey, is this website on our blocked list???"
     * 
     * @param {string} domain - Domain to check (already extracted)
     * @returns {Promise<boolean>} - Promise resolving to true if blocked
     */
    async function checkIfBlocked(domain) {
        return new Promise((resolve) => {
            chrome.storage.local.get(['blockedSites'], (data) => {
                const blockedSites = data.blockedSites || []; // Get blocked sites list, or empty array if none
                resolve(blockedSites.includes(domain)); // Return true if domain is in the list
            });
        });
    }

    /**
     * Update all stats in the popup
     * This takes all our important numbers and displays them nicely
     */
    function updateStats() {
        // Ask Chrome storage for our saved data
        chrome.storage.local.get(['screenTimeData', 'blockedSites', 'blockCounts'], (data) => {
            // === Screen time display ===
            // How long have we been browsing today?
            const screenTimeData = data.screenTimeData || { todaySeconds: 0 };
            screenTimeElement.textContent = formatTime(screenTimeData.todaySeconds);
            
            // === Blocked sites count ===
            // How many sites are on our block list?
            const blockedSites = data.blockedSites || [];
            sitesBlockedCount.textContent = blockedSites.length;
            
            // === Block attempts today ===
            // How many times did we try to visit blocked sites today?
            const blockCounts = data.blockCounts || {};
            // We need to add up all the individual site counts to get the total
            const totalBlocksToday = Object.values(blockCounts).reduce((sum, count) => sum + count, 0);
            blocksToday.textContent = totalBlocksToday;
        });
    }

    /**
     * Format time in seconds to a readable format
     * @param {number} seconds - Time in seconds
     * @returns {string} - Formatted time string
     */
    function formatTime(seconds) {
        if (seconds < 60) return `${seconds} sec`;
        if (seconds < 3600) return `${Math.floor(seconds / 60)} min`;
        
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        
        if (minutes === 0) return `${hours} hr`;
        return `${hours} hr ${minutes} min`;
    }

    /**
     * Event handler for block/unblock button
     */
    blockSiteBtn.addEventListener('click', () => {
        const hostname = blockSiteBtn.dataset.hostname;
        if (!hostname) return;
        checkIfBlocked(hostname).then(isBlocked => {
            if (isBlocked) {
                // Unblock site
                chrome.runtime.sendMessage({ action: 'removeBlockedSite', site: hostname }, (response) => {
                    if (response && response.success) {
                        blockSiteBtn.innerHTML = '<i class="fas fa-ban"></i> Block Site';
                        blockSiteBtn.classList.replace('secondary-btn', 'primary-btn');
                        updateStats();
                    }
                });
            } else {
                // Block site
                chrome.runtime.sendMessage({ action: 'addBlockedSite', site: hostname }, (response) => {
                    if (response && response.success) {
                        blockSiteBtn.innerHTML = '<i class="fas fa-check-circle"></i> Unblock Site';
                        blockSiteBtn.classList.replace('primary-btn', 'secondary-btn');
                        updateStats();
                    }
                });
            }
        });
    });

    /**
     * Event handler for analytics button
     */
    analyticsBtn.addEventListener('click', () => {
        chrome.tabs.create({ url: 'dashboard.html#analytics' });
    });

    /**
     * Event handler for settings button
     */
    settingsBtn.addEventListener('click', () => {
        chrome.tabs.create({ url: 'dashboard.html#blocked-sites' });
    });

    // Initialize popup when loaded
    initPopup();
});

/**
 * ARGON - Background Service Worker
 * Handles website blocking, screen time tracking, and other background tasks
 */

// Global variables
let blockedSites = [];
let isExtensionEnabled = true;
let activeTabId = null;
let screenTimeData = {
  todaySeconds: 0,
  lastUpdated: new Date().toDateString(),
  siteTracking: {},
  weeklyHistory: {},
  hourlyData: {}
};
let temporaryAllowed = {};

// Initialize the extension
chrome.runtime.onInstalled.addListener(async () => {
  console.log("ARGON Extension installed");
  
  // Initialize storage with default values
  // Fix: always initialize blockedSites as array of strings
  const defaultSettings = {
    blockedSites: [],
    isEnabled: true,
    screenTimeData: {
      todaySeconds: 0,
      lastUpdated: new Date().toDateString(),
      siteTracking: {},
      weeklyHistory: {},
      hourlyData: {}
    }
  };
  
  await chrome.storage.local.set(defaultSettings);
  
  // Load settings from storage
  loadSettings();
  
  // Set up alarms for time tracking (every 1 second)
  chrome.alarms.create("screenTimeTracker", { periodInMinutes: 1/60 });
});

/**
 * Load settings from storage
 */
async function loadSettings() {
  const data = await chrome.storage.local.get(['blockedSites', 'isEnabled', 'screenTimeData', 'temporaryAllowed']);
  
  blockedSites = data.blockedSites || [];
  isExtensionEnabled = data.isEnabled !== undefined ? data.isEnabled : true;
  temporaryAllowed = data.temporaryAllowed || {};
  
  if (data.screenTimeData) {
    screenTimeData = data.screenTimeData;
    
    // Reset daily stats if it's a new day
    const today = new Date().toDateString();
    if (screenTimeData.lastUpdated !== today) {
      // Store yesterday's data in weekly history before resetting
      if (!screenTimeData.weeklyHistory) {
        screenTimeData.weeklyHistory = {};
      }
      
      // Store the previous day's data
      const yesterday = screenTimeData.lastUpdated;
      if (yesterday && screenTimeData.todaySeconds > 0) {
        screenTimeData.weeklyHistory[yesterday] = screenTimeData.todaySeconds;
      }
      
      // Clean up old data (keep only last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      Object.keys(screenTimeData.weeklyHistory).forEach(dateStr => {
        const date = new Date(dateStr);
        if (date < sevenDaysAgo) {
          delete screenTimeData.weeklyHistory[dateStr];
        }
      });
      
      screenTimeData.todaySeconds = 0;
      screenTimeData.lastUpdated = today;
      
      // Keep historical site data but reset today's count
      Object.keys(screenTimeData.siteTracking).forEach(site => {
        if (screenTimeData.siteTracking[site].todaySeconds) {
          screenTimeData.siteTracking[site].todaySeconds = 0;
        }
      });
      await chrome.storage.local.set({ screenTimeData });
    }
  }
  
  console.log("Settings loaded:", { blockedSites, isExtensionEnabled, screenTimeData });
  
  // Make screenTimeData available to popup by storing it separately
  await chrome.storage.local.set({ screenTimeData });
}

/**
 * Extract domain from URL - improved version
 * @param {string} url - The URL to extract the domain from
 * @returns {string} - The extracted domain
 */
function extractDomain(url) {
  try {
    if (!url) return "";
    
    // Handle special cases like chrome:// urls
    if (url.startsWith("chrome://") || 
        url.startsWith("chrome-extension://") || 
        url.startsWith("about:")) {
      return url.split("/")[0] + "//" + url.split("/")[2];
    }
    
    // For standard URLs
    const urlObj = new URL(url);
    let domain = urlObj.hostname;
    
    // Remove www. if present
    if (domain.startsWith('www.')) {
      domain = domain.substring(4);
    }
    
    return domain;
  } catch (e) {
    console.error("Error extracting domain:", e);
    return "";
  }
}

/**
 * Check if a URL should be blocked
 * @param {string} url - The URL to check
 * @returns {boolean} - True if the URL should be blocked
 */
function shouldBlockUrl(url) {
  if (!isExtensionEnabled || !url) return false;
  
  const domain = extractDomain(url);
  if (!domain) return false;
  
  // Check if temporarily allowed and not expired
  if (temporaryAllowed[domain]) {
    if (Date.now() < temporaryAllowed[domain]) {
      return false; // Temporarily allowed
    } else {
      // Expired, remove from temporaryAllowed
      delete temporaryAllowed[domain];
      chrome.storage.local.set({ temporaryAllowed });
    }
  }
  
  // Improved matching algorithm
  return blockedSites.some(blockedSite => {
    const blockedDomain = blockedSite.toLowerCase().trim();
    
    // Exact domain match
    if (domain === blockedDomain) return true;
    
    // Check if it's a subdomain of a blocked domain
    if (domain.endsWith(`.${blockedDomain}`)) return true;
    
    // Check if the blocked entry is a path on the current domain
    // This handles cases like "youtube.com/shorts" specifically
    if (blockedSite.includes('/') && url.includes(blockedSite)) return true;
    
    return false;
  });
}

/**
 * Block navigation to blocked sites
 */
chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
  // Only process main frame navigation (not iframes, etc)
  if (details.frameId !== 0) return;
  
  await loadSettings(); // Ensure we have the latest settings
  
  if (shouldBlockUrl(details.url)) {
    console.log(`Blocking navigation to: ${details.url}`);
    
    // Close the tab and open our block page
    chrome.tabs.update(details.tabId, {
      url: chrome.runtime.getURL('block.html') + '?blocked=' + encodeURIComponent(details.url)
    });
    
    // Track the blocked attempt
    incrementBlockCount(details.url);
  }
});

/**
 * Also check tabs when they are updated
 */
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // Only process when URL changes and is loaded
  if (changeInfo.status === 'complete' && changeInfo.url) {
    await loadSettings(); // Ensure we have the latest settings
    
    if (shouldBlockUrl(tab.url)) {
      console.log(`Blocking loaded tab: ${tab.url}`);
      
      // Update to our block page
      chrome.tabs.update(tabId, {
        url: chrome.runtime.getURL('block.html') + '?blocked=' + encodeURIComponent(tab.url)
      });
      
      // Track the blocked attempt
      incrementBlockCount(tab.url);
    }
  }
});

/**
 * Immediate blocking on tab activation
 */
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  activeTabId = activeInfo.tabId;
  const tab = await chrome.tabs.get(activeTabId);
  
  await loadSettings(); // Ensure we have the latest settings
  
  if (tab.url && shouldBlockUrl(tab.url)) {
    console.log(`Blocking activated tab: ${tab.url}`);
    
    chrome.tabs.update(activeTabId, {
      url: chrome.runtime.getURL('block.html') + '?blocked=' + encodeURIComponent(tab.url)
    });
    
    incrementBlockCount(tab.url);
  }
});

/**
 * Add a site to blocklist
 * @param {string} site - The site to block
 * @returns {boolean} - True if the site was added to the blocklist
 */
async function addBlockedSite(site) {
  // Normalize the site input
  site = site.toLowerCase().trim();
  
  // If the site doesn't start with http/https and doesn't have ://, assume it's a domain
  if (!site.includes('://') && !site.startsWith('chrome://')) {
    // Remove any accidental http/https/www prefixes
    site = site.replace(/^(https?:\/\/)?(www\.)?/, '');
  }
  
  await loadSettings();
  
  if (!blockedSites.includes(site)) {
    blockedSites.push(site);
    await chrome.storage.local.set({ blockedSites });
    console.log(`Added ${site} to blocklist`);
    return true;
  }
  return false;
}

/**
 * Remove a site from blocklist
 * @param {string} site - The site to remove
 * @returns {boolean} - True if the site was removed from the blocklist
 */
async function removeBlockedSite(site) {
  site = site.toLowerCase().trim();
  
  await loadSettings();
  
  const index = blockedSites.indexOf(site);
  if (index > -1) {
    blockedSites.splice(index, 1);
    await chrome.storage.local.set({ blockedSites });
    console.log(`Removed ${site} from blocklist`);
    return true;
  }
  return false;
}

/**
 * Toggle extension enabled state
 * @returns {boolean} - The new enabled state of the extension
 */
async function toggleEnabled() {
  isExtensionEnabled = !isExtensionEnabled;
  await chrome.storage.local.set({ isEnabled: isExtensionEnabled });
  console.log(`Extension ${isExtensionEnabled ? 'enabled' : 'disabled'}`);
  return isExtensionEnabled;
}

/**
 * Increment the count for blocked attempts
 * @param {string} url - The URL that was blocked
 */
async function incrementBlockCount(url) {
  const domain = extractDomain(url);
  
  // Get the current block counts
  const data = await chrome.storage.local.get('blockCounts');
  let blockCounts = data.blockCounts || {};
  
  // Increment the count for this domain
  blockCounts[domain] = (blockCounts[domain] || 0) + 1;
  
  // Save back to storage
  await chrome.storage.local.set({ blockCounts });
}

/**
 * Screen time tracking
 */
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === "screenTimeTracker") {
    await updateScreenTime();
  }
});

/**
 * Track active tab screen time
 */
async function updateScreenTime() {
  // Get the current active tab
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tabs.length === 0) return;
  
  const activeTab = tabs[0];
  activeTabId = activeTab.id;
  
  // Skip extension pages entirely to avoid console errors
  if (activeTab.url.startsWith(chrome.runtime.getURL('')) || 
      activeTab.url.startsWith('chrome://') || 
      activeTab.url.startsWith('chrome-extension://')) {
    return;
  }
  
  // Check if the tab is actually visible (not minimized/background)
  try {
    // Use scripting API to check if document is visible
    const results = await chrome.scripting.executeScript({
      target: { tabId: activeTabId },
      func: () => document.visibilityState === 'visible'
    });
    
    const isVisible = results[0].result;
    if (!isVisible) return;
    
    // Update the screen time (1 second interval)
    await updateSiteTime(activeTab.url);
  } catch (e) {
    // This can happen for special pages like chrome:// URLs
    console.log("Could not check visibility for this tab", e);
  }
}

/**
 * Update site-specific time
 * @param {string} url - The URL of the site to update
 */
async function updateSiteTime(url) {
  // Don't track extension pages
  if (url.startsWith(chrome.runtime.getURL(''))) return;
  
  // Get current screen time data
  await loadSettings();
  
  // Check if we need to reset daily data
  const today = new Date().toDateString();
  if (screenTimeData.lastUpdated !== today) {
    // Save yesterday's data to weekly history
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayKey = yesterday.toISOString().split('T')[0];
    screenTimeData.weeklyHistory[yesterdayKey] = screenTimeData.todaySeconds;
    
    // Reset daily data
    screenTimeData.todaySeconds = 0;
    screenTimeData.lastUpdated = today;
    screenTimeData.hourlyData = {};
    
    // Reset site daily tracking
    Object.keys(screenTimeData.siteTracking).forEach(domain => {
      screenTimeData.siteTracking[domain].todaySeconds = 0;
    });
  }
  
  // Update the total screen time
  screenTimeData.todaySeconds += 1;
  
  // Update hourly data
  const currentHour = new Date().getHours().toString().padStart(2, '0');
  if (!screenTimeData.hourlyData[currentHour]) {
    screenTimeData.hourlyData[currentHour] = 0;
  }
  screenTimeData.hourlyData[currentHour] += 1;
  
  // Update site-specific tracking
  const domain = extractDomain(url);
  if (domain) {
    if (!screenTimeData.siteTracking[domain]) {
      screenTimeData.siteTracking[domain] = {
        totalSeconds: 0,
        todaySeconds: 0,
        favicon: getFaviconFromDomain(domain)
      };
    }
    
    screenTimeData.siteTracking[domain].totalSeconds += 1;
    screenTimeData.siteTracking[domain].todaySeconds += 1;
  }
  
  // Save the updated data
  await chrome.storage.local.set({ screenTimeData });
}

/**
 * Get site favicon
 * @param {string} domain - The domain to get the favicon for
 * @returns {string} - The URL of the favicon
 */
function getFaviconFromDomain(domain) {
  if (!domain) return '';
  if (domain.startsWith('chrome://')) return 'chrome://favicon/chrome://logo';
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
}

/**
 * Allow a site temporarily (once)
 * @param {string} url - The URL to allow temporarily
 * @returns {boolean} - True if the site was allowed temporarily
 */
async function allowSiteTemporarily(url, duration = 5 * 60 * 1000) {
  const domain = extractDomain(url);
  if (!domain) return false;
  await loadSettings();
  // Set expiration timestamp
  temporaryAllowed[domain] = Date.now() + duration;
  await chrome.storage.local.set({ temporaryAllowed });
  return true;
}

/**
 * Listen for messages from popup and content scripts
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  (async () => {
    let response = null;
    switch (request.action) {
      case 'getBlockedSites':
        await loadSettings();
        response = { blockedSites };
        break;
      case 'addBlockedSite':
        response = { success: await addBlockedSite(request.site) };
        break;
      case 'removeBlockedSite':
        response = { success: await removeBlockedSite(request.site) };
        break;
      case 'getExtensionStatus':
        await loadSettings();
        response = { isEnabled: isExtensionEnabled };
        break;
      case 'toggleEnabled':
        response = { isEnabled: await toggleEnabled() };
        break;
      case 'getScreenTime':
        await loadSettings();
        response = { screenTimeData }; // Changed to match the actual property name
        break;
      case 'allowSiteTemporarily':
        response = { success: await allowSiteTemporarily(request.url, request.duration) };
        break;
      case 'getTopSites':
        await loadSettings();
        response = { sites: getTopSites(5) };
        break;
        
      case 'openQuickNotes':
        // Open dashboard with quick notes active
        chrome.tabs.query({ url: chrome.runtime.getURL('dashboard.html*') }, (tabs) => {
          if (tabs.length > 0) {
            // Dashboard already open, update URL and focus tab
            chrome.tabs.update(tabs[0].id, { 
              active: true,
              url: chrome.runtime.getURL('dashboard.html#quick-notes')
            });
          } else {
            // Open new dashboard tab with quick notes active
            chrome.tabs.create({ url: chrome.runtime.getURL('dashboard.html#quick-notes') });
          }
        });
        response = { success: true };
        break;
    }
    if (response) sendResponse(response);
  })();
  return true;
});

/**
 * Get the top sites by usage
 * @param {number} limit - The maximum number of sites to return
 * @returns {Array} - The top sites
 */
function getTopSites(limit = 5) {
  const sites = Object.entries(screenTimeData.siteTracking || {})
    .map(([domain, data]) => ({
      domain,
      timeSpent: data.todaySeconds,
      favicon: data.favicon || getFaviconFromDomain(domain)
    }))
    .sort((a, b) => b.timeSpent - a.timeSpent)
    .slice(0, limit);
  
  return sites;
}

/**
 * Handle keyboard commands
 */
chrome.commands.onCommand.addListener((command) => {
  console.log('Command received:', command);
  // Command handlers can be added here if needed
});

// Command handlers can be added here in the future if needed

/**
 * DOOM SCROLL BLOCKER INTEGRATION
 * Enhanced doom scroll protection with content script injection
 */

// Initialize doom scroll blocker on extension install
chrome.runtime.onInstalled.addListener(async () => {
  // Initialize default doom scroll sites
  const defaultDoomSites = [
    "facebook.com",
    "twitter.com", 
    "x.com",
    "instagram.com",
    "reddit.com",
    "youtube.com/shorts",
    "tiktok.com"
  ];
  
  // Get existing doom blocked sites
  const data = await chrome.storage.local.get(['doomblockedsites']);
  if (!data.doomblockedsites) {
    await chrome.storage.local.set({ doomblockedsites: defaultDoomSites });
  }
});

// Inject doom scroll content script when tabs are updated
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    // Check if this is a doom scroll site
    const { doomblockedsites } = await chrome.storage.local.get(['doomblockedsites']);
    const doomSites = doomblockedsites || [];
    
    const domain = extractDomain(tab.url);
    const isDoomSite = doomSites.some(site => {
      return domain === site || domain.endsWith('.' + site) || tab.url.includes(site);
    });
    
    if (isDoomSite) {
      try {
        // Inject the doom scroll detection content script
        await chrome.scripting.executeScript({
          target: { tabId: tabId },
          files: ['feat/doom/contentScript.js']
        });
        
        // Send message to check if site should be monitored
        chrome.tabs.sendMessage(tabId, {
          action: 'checkBlockedSite',
          url: tab.url
        });
      } catch (error) {
        console.log('Could not inject doom scroll script:', error);
      }
    }
  }
});

/**
 * Handle doom scroll blocker messages
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'doomScrollDetected') {
    console.log('Doom scroll detected! Updating stats...');
    // Update doom scroll statistics
    updateDoomStats();
    sendResponse({ success: true });
  }
  return true;
});

/**
 * Update doom scroll intervention statistics
 */
async function updateDoomStats() {
  const today = new Date().toDateString();
  const { doomStats } = await chrome.storage.local.get(['doomStats']);
  
  const stats = doomStats || {
    interventionsToday: 0,
    timeSaved: 0,
    streak: 0,
    lastUpdate: today
  };
  
  // Reset daily stats if it's a new day
  if (stats.lastUpdate !== today) {
    // Update streak
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (stats.lastUpdate === yesterday.toDateString() && stats.interventionsToday > 0) {
      stats.streak += 1;
    } else if (stats.interventionsToday === 0) {
      stats.streak = 0;
    }
    
    stats.interventionsToday = 0;
    stats.lastUpdate = today;
  }
  
  // Update today's stats
  stats.interventionsToday += 1;
  stats.timeSaved += 5; // Assume 5 minutes saved per intervention
  
  await chrome.storage.local.set({ doomStats: stats });
}

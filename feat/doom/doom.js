(() => {
  function loadDoomSites() {
    const sitesList = document.getElementById("doomsitelist");
    sitesList.innerHTML = "";
    
    chrome.storage.local.get(["doomblockedsites"], function (data) {
      const sites = data.doomblockedsites || [];
      console.log('Loaded doom sites:', sites);
      
      sites.forEach((site) => {
        const listItem = document.createElement("li");
        
        const siteSpan = document.createElement("span");
        siteSpan.textContent = site;
        
        const removeBtn = document.createElement("button");
        removeBtn.textContent = "Remove";
        removeBtn.dataset.site = site;
        removeBtn.title = `Remove ${site}`;
        
        listItem.appendChild(siteSpan);
        listItem.appendChild(removeBtn);
        sitesList.appendChild(listItem);
      });
    });
  }

  function addDoomSite() {
    const siteInput = document.getElementById("siteInput");
    const addBtn = document.getElementById("addSiteBtn");
    
    const site = siteInput.value.trim().toLowerCase();
    
    if (!site) {
      alert("Please enter a website URL");
      return;
    }

    // Validate site format
    const siteRegex = /^[a-z0-9.-]+\.[a-z]{2,}(\/[a-z0-9\-._~%!$&'()*+,;=:@/]*\*?)?$/i;
    if (!siteRegex.test(site)) {
      alert("Please enter a valid domain (e.g., example.com or example.com/*)");
      return;
    }

    // Add loading state
    addBtn.disabled = true;
    addBtn.textContent = "Adding...";

    chrome.storage.local.get(["doomblockedsites"], function (data) {
      const sites = data.doomblockedsites || [];
      
      if (sites.includes(site)) {
        alert("This site is already in your doom scroll protection list");
        addBtn.disabled = false;
        addBtn.textContent = "Add Site";
        return;
      }

      sites.push(site);
      
      chrome.storage.local.set({ doomblockedsites: sites }, function () {
        if (chrome.runtime.lastError) {
          console.error("Error saving site:", chrome.runtime.lastError);
          alert("Failed to add site. Please try again.");
        } else {
          siteInput.value = "";
          loadDoomSites();
          
          // Show success message
          const originalText = addBtn.textContent;
          addBtn.textContent = "Added!";
          addBtn.style.background = "rgba(40, 167, 69, 0.8)";
          
          setTimeout(() => {
            addBtn.textContent = "Add Site";
            addBtn.style.background = "";
          }, 1500);
        }
        
        addBtn.disabled = false;
      });
    });
  }

  function removeDoomSite(site) {
    if (!confirm(`Remove ${site} from doom scroll protection?`)) {
      return;
    }
    
    chrome.storage.local.get(["doomblockedsites"], function (data) {
      const sites = data.doomblockedsites || [];
      const updatedSites = sites.filter(s => s !== site);
      
      chrome.storage.local.set({ doomblockedsites: updatedSites }, function () {
        if (chrome.runtime.lastError) {
          console.error("Error removing site:", chrome.runtime.lastError);
          alert("Failed to remove site. Please try again.");
        } else {
          loadDoomSites();
        }
      });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    const siteInput = document.getElementById("siteInput");
    const addSiteBtn = document.getElementById("addSiteBtn");
    const closeButton = document.getElementById("closeButton");
    const sitesList = document.getElementById("doomsitelist");

    // Load existing sites
    loadDoomSites();

    // Add site button event
    addSiteBtn.addEventListener("click", addDoomSite);

    // Enter key support
    siteInput.addEventListener("keypress", function (e) {
      if (e.key === "Enter") {
        addDoomSite();
      }
    });

    // Remove site events (event delegation)
    sitesList.addEventListener("click", function (e) {
      if (e.target.tagName === "BUTTON") {
        const site = e.target.dataset.site;
        removeDoomSite(site);
      }
    });

    // Close button
    closeButton.addEventListener("click", function () {
      window.close();
    });

    // Auto-focus input
    siteInput.focus();
  });
})();

(() => {
  let scrollHandler;
  let scrollAmount = 0;
  let isBlinking = false;
  let isInterventionActive = false;
  let blinkInterval;

  function createDoomScrollOverlay() {
    const overlay = document.createElement("div");
    overlay.id = "doomscroll-overlay";
    overlay.style.cssText = `
      height: 100vh;
      position: fixed;
      width: 100vw;
      top: 0;
      left: 0;
      z-index: 9999;
      display: flex;
      justify-content: center;
      flex-direction: column;
      color: #f94144;
      font-weight: bolder;
      text-align: center;
      font-size: min(7vw, 4rem);
      background: rgba(0, 0, 0, 0.9);
      transition: opacity 0.3s ease;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;
    overlay.innerText = "DOOM SCROLL DETECTED!";
    return overlay;
  }

  function initDoomScrollDetection() {
    scrollHandler = () => {
      const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
      const scrollDelta = currentScroll - scrollAmount;
      scrollAmount = currentScroll;

      // Detect rapid scrolling down (doom scrolling behavior)
      if (scrollDelta > 0 && !isInterventionActive && scrollAmount > 4000) {
        triggerDoomScrollIntervention();
      }
    };

    window.addEventListener("scroll", scrollHandler, { passive: true });
  }

  function triggerDoomScrollIntervention() {
    isInterventionActive = true;
    
    // Notify background script about doom scroll detection
    chrome.runtime.sendMessage({ 
      action: 'doomScrollDetected',
      url: window.location.href 
    });

    const overlay = createDoomScrollOverlay();
    document.body.appendChild(overlay);

    // Hide other content
    const children = document.body.children;
    for (let child of children) {
      if (child.id !== "doomscroll-overlay") {
        child.style.opacity = "0.1";
        child.style.transition = "opacity 3s ease";
      }
    }

    // Start blinking effect - just one blink
    let blinkCount = 0;
    blinkInterval = setInterval(() => {
      overlay.style.opacity = isBlinking ? "0.3" : "1";
      isBlinking = !isBlinking;
      blinkCount++;
      
      // Stop after one complete blink (2 changes: dim -> bright)
      if (blinkCount >= 2) {
        clearInterval(blinkInterval);
        overlay.style.opacity = "1"; // Make sure it's visible
      }
    }, 400);

    // Redirect after 2 seconds
    setTimeout(() => {
      redirectToGrassPage();
    }, 2000);
  }

  function resetPageVisibility() {
    const children = document.body.children;
    for (let child of children) {
      if (child.id !== "doomscroll-overlay") {
        child.style.opacity = "";
        child.style.transition = "";
      }
    }
  }

  function redirectToGrassPage() {
    // Create a full screen overlay with the grass page content instead of redirecting
    const grassOverlay = document.createElement("div");
    grassOverlay.id = "grass-overlay";
    grassOverlay.style.cssText = `
      height: 100vh;
      position: fixed;
      width: 100vw;
      top: 0;
      left: 0;
      z-index: 10000;
      background-color: #000000;
      color: #ffffff;
      font-family: 'Arial Black', Arial, sans-serif;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      line-height: 1.2;
    `;
    
    // Remove the doom scroll overlay
    const doomOverlay = document.getElementById("doomscroll-overlay");
    if (doomOverlay) {
      doomOverlay.remove();
    }
    
    // Add grass page content
    grassOverlay.innerHTML = `
      <div id="messages-container"></div>
      <div style="position: fixed; bottom: 20px; right: 20px; color: #444; font-size: 0.8rem; padding: 8px 12px; border: 1px solid #333; border-radius: 20px; font-family: Arial, sans-serif; font-weight: normal; cursor: pointer;" onclick="window.location.reload();">Refresh</div>
    `;
    
    document.body.appendChild(grassOverlay);
    
    // Add the grass page messages
    const messages = [
      "TOUCH SOME GRASS",
      "GO OUTSIDE", 
      "TIME TO STEP AWAY",
      "BREATHE FRESH AIR",
      "MOVE YOUR BODY",
      "DISCONNECT TO RECONNECT",
      "TAKE A WALK",
      "SEE THE SKY",
      "FEEL THE SUN",
      "NATURE IS CALLING",
      "LOOK UP FROM SCREEN",
      "GET SOME VITAMIN D",
      "STRETCH YOUR LEGS",
      "CLEAR YOUR MIND",
      "REAL LIFE AWAITS",
      "STEP INTO REALITY",
      "FIND SOME PEACE",
      "RECONNECT WITH EARTH"
    ];
    
    function getRandomColor() {
      return Math.random() > 0.5 ? '#ff2222' : '#00dd00';
    }
    
    function displayRandomMessages() {
      const container = grassOverlay.querySelector('#messages-container');
      container.innerHTML = '';
      
      const numMessages = Math.floor(Math.random() * 2) + 3;
      const selectedMessages = [...messages]
        .sort(() => 0.5 - Math.random())
        .slice(0, numMessages);
      
      selectedMessages.forEach((text) => {
        const div = document.createElement('div');
        div.style.cssText = `
          font-size: clamp(3rem, 10vw, 8rem);
          font-weight: 900;
          margin: 0.3em 0;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: ${getRandomColor()};
        `;
        div.textContent = text;
        container.appendChild(div);
      });
    }
    
    displayRandomMessages();
  }

  function removeDoomScrollDetection() {
    if (scrollHandler) {
      window.removeEventListener("scroll", scrollHandler);
      scrollHandler = null;
    }
    
    const overlay = document.getElementById("doomscroll-overlay");
    if (overlay) {
      overlay.remove();
    }
    
    resetPageVisibility();
    
    if (blinkInterval) {
      clearInterval(blinkInterval);
    }
    
    isInterventionActive = false;
  }

  // Listen for messages from background script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "checkBlockedSite") {
      chrome.storage.local.get(["doomblockedsites"], function (data) {
        const doomSites = data.doomblockedsites || [];
        const currentUrl = window.location.href;
        const currentDomain = window.location.hostname.replace(/^www\./, '');
        
        const isDoomSite = doomSites.some((site) => {
          return currentDomain === site || 
                 currentDomain.endsWith('.' + site) || 
                 currentUrl.includes(site);
        });

        if (isDoomSite) {
          initDoomScrollDetection();
        } else {
          removeDoomScrollDetection();
        }

        if (sendResponse) {
          sendResponse({ isBlocked: isDoomSite });
        }
      });
      return true;
    }
  });

  // Add CSS for animations
  if (!document.getElementById('doom-scroll-styles')) {
    const style = document.createElement('style');
    style.id = 'doom-scroll-styles';
    style.textContent = `
      @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
      }
    `;
    document.head.appendChild(style);
  }
})();

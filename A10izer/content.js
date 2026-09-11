const STYLE_ID = 'page-rotator-style';
let delayTimer = null;

function applyRotation() {
  removeRotation(); // Clear any pending timer or existing style
  delayTimer = setTimeout(() => {
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      html {
        transform: rotate(-15deg) !important;
        transform-origin: center center !important;
        transition: transform 0.6s ease-in-out !important;
        overflow-x: hidden !important;
      }
    `;
    (document.head || document.documentElement).appendChild(style);
  }, 2000);
}

function removeRotation() {
  if (delayTimer) {
    clearTimeout(delayTimer);
    delayTimer = null;
  }
  const existing = document.getElementById(STYLE_ID);
  if (existing) {
    existing.remove();
  }
}

// Check initial state on page load
chrome.storage.local.get({ isEnabled: true }, (res) => {
  if (res.isEnabled) {
    applyRotation();
  }
});

// Listen for messages from the popup button
chrome.runtime.onMessage.addListener((message) => {
  if (message.isEnabled) {
    applyRotation();
  } else {
    removeRotation();
  }
});
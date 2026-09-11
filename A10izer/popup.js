const btn = document.getElementById('toggleBtn');

function updateUI(isEnabled) {
  if (isEnabled) {
    btn.textContent = 'Turn OFF';
    btn.className = 'btn-off';
  } else {
    btn.textContent = 'Turn ON';
    btn.className = 'btn-on';
  }
}

// Load current state (default is true/on)
chrome.storage.local.get({ isEnabled: true }, (res) => {
  updateUI(res.isEnabled);
});

// Toggle state on click
btn.addEventListener('click', () => {
  chrome.storage.local.get({ isEnabled: true }, (res) => {
    const newState = !res.isEnabled;
    chrome.storage.local.set({ isEnabled: newState }, () => {
      updateUI(newState);
      // Notify active tab to apply or remove rotation immediately
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.tabs.sendMessage(tabs[0].id, { isEnabled: newState });
        }
      });
    });
  });
});
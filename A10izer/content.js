const styleId = 'page-rotator-style';

function setRotationEnabled(enabled) {
  const existingStyle = document.getElementById(styleId);

  if (!enabled) {
    existingStyle?.remove();
    return;
  }

  if (existingStyle) {
    return;
  }

  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    html {
      transform: rotate(-15deg) !important;
      transform-origin: center center !important;
      transition: transform 0.6s ease-in-out !important;
      overflow-x: hidden !important;
    }
  `;

  (document.head || document.documentElement).appendChild(style);
}

chrome.storage.local.get({ rotationEnabled: false }, ({ rotationEnabled }) => {
  setRotationEnabled(rotationEnabled);
});

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'setRotationEnabled') {
    setRotationEnabled(message.enabled);
  }
});
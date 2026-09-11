function applyTilt() {
  const styleId = 'div-rotator-style';

  // Prevent duplicate style tags if the script runs more than once
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      div {
        transform: rotate(-30deg) !important;
        transition: transform 0.4s ease-out !important;
      }
    `;
    (document.head || document.documentElement).appendChild(style);
  }
}

// Inject immediately or as soon as the DOM starts loading
if (document.head || document.documentElement) {
  applyTilt();
} else {
  document.addEventListener('DOMContentLoaded', applyTilt);
}
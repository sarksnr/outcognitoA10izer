setTimeout(() => {
  const style = document.createElement('style');
  style.id = 'page-rotator-style';
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
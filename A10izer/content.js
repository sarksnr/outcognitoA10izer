// Function to rotate all divs on the page
function rotateAllDivs(degrees = 15) {
  const divs = document.querySelectorAll('div');

  divs.forEach((div) => {
    // Add smooth animation
    div.style.transition = 'transform 0.5s ease-in-out';
    
    // Check for existing transform or apply new rotation
    const currentRotation = div.dataset.currentRotation 
      ? parseInt(div.dataset.currentRotation, 10) 
      : 0;
    
    const newRotation = currentRotation + degrees;
    div.style.transform = `rotate(${newRotation}deg)`;
    div.dataset.currentRotation = newRotation;
  });
}

// Run rotation when the DOM is fully loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => rotateAllDivs(180));
} else {
  rotateAllDivs(180);
}
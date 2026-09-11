const actionButton = document.getElementById('cbg');
const originalImageUrl = 'a10.jpeg';
const newImageUrl = 'a10f.png';



actionButton.addEventListener('change', () => {
  const imageUrl = actionButton.checked ? newImageUrl : originalImageUrl;
  document.body.style.backgroundImage = `url("${chrome.runtime.getURL(imageUrl)}")`;

  chrome.storage.local.set({ rotationEnabled: actionButton.checked });
  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    if (tab?.id) {
      chrome.tabs.sendMessage(tab.id, {
        type: 'setRotationEnabled',
        enabled: actionButton.checked
      }).catch(() => {});
    }
  });
}); 

chrome.storage.local.get({ rotationEnabled: false }, ({ rotationEnabled }) => {
  actionButton.checked = rotationEnabled;
});
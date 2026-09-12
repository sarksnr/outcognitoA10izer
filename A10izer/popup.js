const actionButton = document.getElementById('cbg');
const originalImageUrl = 'a10.jpeg';
const newImageUrl = 'a10f.png';

var myAudio = new Audio(chrome.runtime.getURL("sgir.mp3"));
var myAudio2 = new Audio(chrome.runtime.getURL("kuttyaan.mp3"));





actionButton.addEventListener('change', () => {
  const imageUrl = actionButton.checked ? newImageUrl : originalImageUrl;
  document.body.style.backgroundImage = `url("${chrome.runtime.getURL(imageUrl)}")`;

  if (actionButton.checked) {
    myAudio.play();
  } else {
    myAudio2.play();
  }

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
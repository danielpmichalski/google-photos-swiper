chrome.storage.local.get(['ps_skip', 'ps_add'], d => {
  document.getElementById('n-skip').textContent = d.ps_skip || 0;
  document.getElementById('n-add').textContent = d.ps_add || 0;
});

document.getElementById('btn-photos').addEventListener('click', e => {
  e.preventDefault();
  chrome.tabs.create({url: 'https://photos.google.com'});
});

document.getElementById('btn-albums').addEventListener('click', e => {
  e.preventDefault();
  chrome.tabs.create({url: 'https://photos.google.com/albums'});
});

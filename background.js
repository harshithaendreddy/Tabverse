chrome.runtime.onStartup.addListener(() => {
  chrome.storage.sync.get('lastSession', (data) => {
    if (data.lastSession) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: 'Restore Last Session?',
        message: 'Click to restore your last saved tab group.',
        buttons: [{ title: 'Restore Now' }]
      });
    }
  });
});

chrome.notifications.onButtonClicked.addListener(() => {
  chrome.storage.sync.get('lastSession', (data) => {
    const groups = data.lastSession || [];
    groups.forEach(group => {
      group.tabs.forEach(tab => {
        chrome.tabs.create({ url: tab.url });
      });
    });
  });
});

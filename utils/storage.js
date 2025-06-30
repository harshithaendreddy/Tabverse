export function saveGroup(group) {
  chrome.storage.sync.get({ tabGroups: [] }, ({ tabGroups }) => {
    tabGroups.push(group);
    chrome.storage.sync.set({ tabGroups });
  });
}

export function loadGroups(callback) {
  chrome.storage.sync.get('tabGroups', ({ tabGroups }) => callback(tabGroups || []));
}

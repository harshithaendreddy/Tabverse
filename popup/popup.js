document.getElementById('saveGroup').addEventListener('click', async () => {
  const tabs = await chrome.tabs.query({ currentWindow: true });
  const groupName = prompt("Enter a name for this group:");
  if (!groupName) return;

  const group = {
    name: groupName,
    timestamp: Date.now(),
    tabs: tabs.map(tab => ({
      title: tab.title,
      url: tab.url,
      favIconUrl: tab.favIconUrl
    }))
  };

  chrome.storage.sync.get({ tabGroups: [] }, ({ tabGroups }) => {
    tabGroups.push(group);
    chrome.storage.sync.set({ tabGroups });
    chrome.storage.sync.set({ lastSession: [group] });
    renderGroups(); // Re-render UI
  });
});

// 🔍 Live Search
document.getElementById('search').addEventListener('input', (e) => {
  const query = e.target.value.toLowerCase();
  renderGroups(query);
});

// 🌐 Encode JSON safely
function utf8ToBase64(str) {
  return btoa(
    encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
      (_, p1) => String.fromCharCode('0x' + p1)
    )
  );
}

// 🧠 Render Tab Groups
function renderGroups(filter = '') {
  chrome.storage.sync.get('tabGroups', ({ tabGroups }) => {
    const container = document.getElementById('groups');
    container.innerHTML = '';

    tabGroups?.forEach((group, index) => {
      if (!group.name.toLowerCase().includes(filter)) return;

      const groupDiv = document.createElement('div');
      groupDiv.className = 'group-item';

      const groupTitle = document.createElement('span');
      groupTitle.textContent = group.name;
      groupTitle.className = 'group-title';
      groupTitle.style.cursor = 'pointer';
      groupTitle.addEventListener('click', () => {
        chrome.windows.create({
          url: group.tabs.map(tab => tab.url),
          focused: true
        });
      });

      // 🗑 Delete Button
      const deleteBtn = document.createElement('button');
      deleteBtn.textContent = '🗑️';
      deleteBtn.style.marginLeft = '10px';
      deleteBtn.addEventListener('click', () => {
        const confirmDelete = confirm(`Are you sure you want to delete the group "${group.name}"?`);
        if (confirmDelete) {
          tabGroups.splice(index, 1);
          chrome.storage.sync.set({ tabGroups });
          renderGroups(filter);
        }
      });

      // 🔗 Share Button
      const shareBtn = document.createElement('button');
      shareBtn.textContent = '🔗';
      shareBtn.style.marginLeft = '10px';
      shareBtn.addEventListener('click', () => {
        const json = JSON.stringify(group.tabs);
        const encoded = encodeURIComponent(utf8ToBase64(json));
        const shareUrl = chrome.runtime.getURL(`popup/share.html?tabs=${encoded}`);

        navigator.clipboard.writeText(shareUrl).then(() => {
          alert('Share link copied to clipboard!');
        }).catch(err => {
          console.error('Copy failed:', err);
          prompt("Copy this URL manually:", shareUrl);
        });
      });

      groupDiv.appendChild(groupTitle);
groupDiv.appendChild(shareBtn);  // ⬅ Share comes before delete
groupDiv.appendChild(deleteBtn);
      container.appendChild(groupDiv);
    });
  });
}
function base64ToUtf8(str) {
  return decodeURIComponent(atob(str).split('').map(c =>
    '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
  ).join(''));
}

document.getElementById('importBtn').addEventListener('click', () => {
  const input = document.getElementById('importLink').value.trim();
  if (!input) return alert("Please paste a link!");

  const url = new URL(input);
  const encoded = url.searchParams.get('tabs');

  if (!encoded) return alert("Invalid share link!");

  try {
    const json = base64ToUtf8(decodeURIComponent(encoded));
    const tabs = JSON.parse(json);

    // Open all tabs in a new window
    chrome.windows.create({
      url: tabs.map(tab => tab.url),
      focused: true
    });
  } catch (err) {
    console.error(err);
    alert("Failed to decode the shared tabs.");
  }
});

// 🔃 Initial load
renderGroups();

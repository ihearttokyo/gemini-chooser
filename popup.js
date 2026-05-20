document.addEventListener('DOMContentLoaded', () => {
  const autoUpgradeToggle = document.getElementById('auto-upgrade');
  const defaultModelSelect = document.getElementById('default-model');
  const statusText = document.getElementById('status-text');

  // Tab switching
  const tabs = document.querySelectorAll('.tab-btn');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      
      tab.classList.add('active');
      document.getElementById(tab.dataset.tab).classList.add('active');
    });
  });

  // Diagnostics controls
  const debugLog = document.getElementById('debug-log');
  const runScanBtn = document.getElementById('run-scan');
  const forceTestBtn = document.getElementById('force-test');
  const copyLogBtn = document.getElementById('copy-log');
  let lastReport = null;

  // Load preferences
  chrome.storage.sync.get({
    autoUpgrade: true,
    defaultModel: 'pro'
  }, (items) => {
    autoUpgradeToggle.checked = items.autoUpgrade;
    defaultModelSelect.value = items.defaultModel;
    updateStatusDisplay(items.autoUpgrade);
  });

  // Save auto-upgrade toggle change
  autoUpgradeToggle.addEventListener('change', () => {
    const isEnabled = autoUpgradeToggle.checked;
    chrome.storage.sync.set({ autoUpgrade: isEnabled }, () => {
      updateStatusDisplay(isEnabled);
      notifyContentScript();
    });
  });

  // Save default model change
  defaultModelSelect.addEventListener('change', () => {
    const model = defaultModelSelect.value;
    chrome.storage.sync.set({ defaultModel: model }, () => {
      notifyContentScript();
    });
  });

  // Run DOM Scan click handler
  runScanBtn.addEventListener('click', () => {
    debugLog.textContent = 'Scanning active Gemini tab DOM...';
    debugLog.style.color = '#38bdf8';
    
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length === 0 || !tabs[0].url.startsWith('https://gemini.google.com')) {
        debugLog.textContent = 'Error: No active Gemini.google.com tab found in this window. Make sure you have the Gemini tab active and selected.';
        debugLog.style.color = '#ef4444';
        return;
      }

      chrome.tabs.sendMessage(tabs[0].id, { action: 'runDiagnostics' }, (response) => {
        if (chrome.runtime.lastError) {
          debugLog.textContent = `Communication Error:\n${chrome.runtime.lastError.message}\n\nTroubleshooting:\n1. Refresh the Gemini tab to load the active extension.\n2. Ensure the tab is fully loaded.`;
          debugLog.style.color = '#ef4444';
          return;
        }

        if (response && response.status === 'ok') {
          lastReport = response.data;
          debugLog.textContent = JSON.stringify(response.data, null, 2);
          debugLog.style.color = '#34d399'; // Green success color
          copyLogBtn.removeAttribute('disabled');
        } else {
          debugLog.textContent = `Failed to get diagnostics: ${response ? response.error : 'Unknown response error'}`;
          debugLog.style.color = '#ef4444';
        }
      });
    });
  });

  // Force Trigger test click
  forceTestBtn.addEventListener('click', () => {
    debugLog.textContent = 'Sending force evaluation command...';
    debugLog.style.color = '#38bdf8';

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length === 0 || !tabs[0].url.startsWith('https://gemini.google.com')) {
        debugLog.textContent = 'Error: Active tab is not a Gemini app page.';
        debugLog.style.color = '#ef4444';
        return;
      }

      chrome.tabs.sendMessage(tabs[0].id, { action: 'forceTrigger' }, (response) => {
        if (chrome.runtime.lastError) {
          debugLog.textContent = `Error sending force command: ${chrome.runtime.lastError.message}`;
          debugLog.style.color = '#ef4444';
          return;
        }

        debugLog.textContent = 'Force selection triggered! Check the Gemini tab to watch the automation run.';
        debugLog.style.color = '#a855f7';
      });
    });
  });

  // Copy Log to clipboard
  copyLogBtn.addEventListener('click', () => {
    if (!lastReport) return;
    navigator.clipboard.writeText(JSON.stringify(lastReport, null, 2)).then(() => {
      const originalText = copyLogBtn.innerHTML;
      copyLogBtn.innerHTML = '<span>✅ Copied!</span>';
      setTimeout(() => {
        copyLogBtn.innerHTML = originalText;
      }, 1500);
    });
  });

  function updateStatusDisplay(enabled) {
    if (enabled) {
      statusText.textContent = 'ON';
      statusText.style.color = '#22c55e';
      const dot = document.querySelector('.pulse-dot');
      if (dot) {
        dot.style.backgroundColor = '#22c55e';
        dot.style.boxShadow = '0 0 6px #22c55e';
      }
    } else {
      statusText.textContent = 'OFF';
      statusText.style.color = '#a3a1cc';
      const dot = document.querySelector('.pulse-dot');
      if (dot) {
        dot.style.backgroundColor = '#a3a1cc';
        dot.style.boxShadow = 'none';
      }
    }
  }

  // Notify all active Gemini tabs about changes
  function notifyContentScript() {
    chrome.tabs.query({ url: 'https://gemini.google.com/*' }, (tabs) => {
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, {
          action: 'preferencesUpdated',
          autoUpgrade: autoUpgradeToggle.checked,
          defaultModel: defaultModelSelect.value
        }).catch(() => {
          // Tab might be sleeping or not fully loaded, ignore
        });
      });
    });
  }
});

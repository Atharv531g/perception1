// Background service worker for AccessAI extension

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // Open onboarding page on first install
    chrome.tabs.create({
      url: chrome.runtime.getURL('index.html#/onboarding')
    });
  }
});

// Listen for messages from content scripts or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getSettings') {
    chrome.storage.local.get(['extensionSettings'], (result) => {
      sendResponse(result.extensionSettings || {});
    });
    return true; // Keep channel open for async response
  }
  
  if (request.action === 'saveSettings') {
    chrome.storage.local.set({ extensionSettings: request.settings }, () => {
      sendResponse({ success: true });
    });
    return true;
  }
});

// Monitor tab updates to apply settings
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    chrome.storage.local.get(['extensionSettings'], (result) => {
      const settings = result.extensionSettings || {};
      
      if (settings.enabled) {
        // Inject content scripts if needed
        chrome.scripting.executeScript({
          target: { tabId: tabId },
          files: ['content.js']
        });
      }
    });
  }
});


// Background service worker for AccessAI extension
// Improvised for modern async/await, error handling, and robust injection.

/**
 * 1. Onboarding Page on Install
 *
 * Opens the onboarding page when the extension is first installed.
 */
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    try {
      await chrome.tabs.create({
        url: chrome.runtime.getURL('index.html#/onboarding')
      });
    } catch (e) {
      console.error('Failed to open onboarding page:', e);
    }
  }
});

// --- Helper Functions ---

/**
 * Retrieves the extension settings from storage.
 * @returns {Promise<object>} A promise that resolves to the settings object.
 */
async function getExtensionSettings() {
  try {
    const result = await chrome.storage.local.get(['extensionSettings']);
    // Provide a default structure if no settings are found
    return result.extensionSettings || { enabled: false };
  } catch (e) {
    console.error('Error retrieving extension settings:', e);
    // Return default settings on error
    return { enabled: false };
  }
}

/**
 * Saves the extension settings to storage.
 * @param {object} settings - The settings object to save.
 * @returns {Promise<{success: boolean, error?: string}>} A promise indicating success or failure.
 */
async function saveExtensionSettings(settings) {
  try {
    if (typeof settings !== 'object' || settings === null) {
      throw new Error('Invalid settings object.');
    }
    await chrome.storage.local.set({ extensionSettings: settings });
    return { success: true };
  } catch (e) {
    console.error('Error saving extension settings:', e);
    return { success: false, error: e.message };
  }
}

// --- Event Listeners ---

/**
 * 2. Message Listener for Settings
 *
 * Handles requests from the popup or content scripts.
 * This now uses an async listener, which returns a promise.
 */
chrome.runtime.onMessage.addListener(async (request, sender) => {
  if (request.action === 'getSettings') {
    // Return the promise from the helper function
    return await getExtensionSettings();
  }

  if (request.action === 'saveSettings') {
    // Return the promise from the helper function
    return await saveExtensionSettings(request.settings);
  }

  // If no action matches, the promise resolves to undefined,
  // which is fine and closes the message channel.
});

/**
 * 3. Tab Update Monitor for Content Script Injection
 *
 * Injects the content script when a tab finishes loading.
 */
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // Ensure the tab is fully loaded and has a valid URL
  if (changeInfo.status !== 'complete' || !tab.url) {
    return;
  }

  // **Improvement:** Only inject into http/https pages.
  // This prevents errors on "chrome://", "file://", or "about:blank" pages.
  if (!tab.url.startsWith('http:') && !tab.url.startsWith('https:')) {
    return;
  }

  try {
    const settings = await getExtensionSettings();

    if (settings.enabled) {
      // **Improvement:** Added error handling for the injection itself.
      await chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ['content.js']
      });
    }
  } catch (e) {
    // This will catch injection errors (e.g., if the user is on the
    // Chrome Web Store, where injection is forbidden).
    console.warn(`Failed to inject script into ${tab.url}: ${e.message}`);
  }
});

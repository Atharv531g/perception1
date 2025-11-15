// Content script for AccessAI extension
// This runs on web pages to apply accessibility modifications

(function() {
  'use strict';

  let settings = {};

  // Load settings from storage
  function loadSettings() {
    chrome.runtime.sendMessage({ action: 'getSettings' }, (response) => {
      settings = response || {};
      if (settings.enabled) {
        applySettings();
      }
    });
  }

  // Apply accessibility modifications based on settings
  function applySettings() {
    // Focus Mode: Hide distracting elements
    if (settings.cognitive?.focusMode) {
      applyFocusMode();
    }

    // Motion Blocker: Reduce animations
    if (settings.visual?.motionBlocker) {
      blockMotion();
    }

    // Contrast Control
    if (settings.visual?.contrast && settings.visual.contrast > 100) {
      applyContrastBoost(settings.visual.contrast);
    }

    // Larger Click Targets
    if (settings.motor?.largerTargets) {
      enlargeClickTargets();
    }
  }

  // Focus Mode Implementation
  function applyFocusMode() {
    const style = document.createElement('style');
    style.id = 'accessai-focus-mode';
    style.textContent = `
      /* Hide common distraction elements */
      [class*="ad-"], [class*="advertisement"],
      [id*="ad-"], [id*="advertisement"],
      aside, [role="complementary"],
      .sidebar, #sidebar {
        opacity: 0.3 !important;
        filter: blur(3px) !important;
        pointer-events: none !important;
      }
    `;
    document.head.appendChild(style);
  }

  // Motion Blocker Implementation
  function blockMotion() {
    const style = document.createElement('style');
    style.id = 'accessai-motion-blocker';
    style.textContent = `
      * {
        animation-duration: 0.001ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.001ms !important;
      }
      img, video {
        animation: none !important;
      }
    `;
    document.head.appendChild(style);

    // Pause all videos and GIFs
    document.querySelectorAll('video').forEach(video => {
      video.pause();
      video.style.filter = 'grayscale(50%)';
    });
  }

  // Contrast Boost Implementation
  function applyContrastBoost(level) {
    const filterValue = (level / 100).toFixed(2);
    const style = document.createElement('style');
    style.id = 'accessai-contrast';
    style.textContent = `
      html {
        filter: contrast(${filterValue}) !important;
      }
    `;
    document.head.appendChild(style);
  }

  // Larger Click Targets Implementation
  function enlargeClickTargets() {
    const style = document.createElement('style');
    style.id = 'accessai-larger-targets';
    style.textContent = `
      a, button, input, select, textarea,
      [role="button"], [role="link"],
      [onclick], [tabindex] {
        min-width: 44px !important;
        min-height: 44px !important;
        padding: 12px !important;
        cursor: pointer !important;
      }
    `;
    document.head.appendChild(style);
  }

  // Initialize on load
  loadSettings();

  // Listen for settings changes
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'settingsUpdated') {
      loadSettings();
    }
  });

  console.log('AccessAI content script loaded');
})();

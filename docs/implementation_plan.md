# Gemini Chooser: Automated Extended Model Selector

A Chrome extension designed for `https://gemini.google.com/app` that automatically chooses the "Extended" thinking level whenever the app is opened, or when the user manually switches between "3.1 Pro" or "3.5 Flash" models. It defaults to "Pro Extended" and updates to "Flash Extended" if the user selects "3.5 Flash".

## User Review Required

> [!IMPORTANT]
> The extension relies on dynamic DOM inspection of `gemini.google.com` to locate the model picker and thinking level menus. Since Google obfuscates classes and dynamically updates the page, the extension will use robust text-based and hierarchical selector lookups rather than hardcoded CSS classes to ensure maximum resilience against future updates.

## Open Questions

> [!NOTE]
> No immediate blocking questions. The extension will provide an elegant options popup that allows toggling the auto-switcher and selecting the default model (Pro Extended vs. Flash Extended).

---

## Proposed Changes

### Chrome Extension Frontend

#### [NEW] [manifest.json](../manifest.json)
- Setup Manifest V3 metadata.
- Declare host permission for `https://gemini.google.com/*`.
- Declare `storage` permission to store the default model choice and active state.
- Declare `content.js` as the content script.
- Declare `popup.html` as the browser action popup.

#### [NEW] [content.js](../content.js)
- Monitor the Gemini active model dropdown button in the DOM.
- Trigger model switching on:
  - Page load / Chat initialization (if active model is standard, switch to user's preferred default Extended model).
  - Manual model changes (if user clicks "3.1 Pro" or "3.5 Flash", auto-select its corresponding "Extended" thinking level).
- Programmatic UI automation flow:
  1. Click the model dropdown button.
  2. Locate the "Thinking level" element, click or hover it to reveal the submenu.
  3. Click the "Extended" element in the submenu to activate it.
  4. Ensure menus are gracefully dismissed.
- Implement robust MutationObserver and dynamic retry logic to handle SPA page updates and dynamic content rendering.

#### [NEW] [popup.html](../popup.html)
- A premium, glassmorphic Chrome Extension popup UI built with beautiful CSS design:
  - Vibrant gradients (violet/indigo theme) to match Gemini Pro aesthetics.
  - Dropdown/Select to choose the default model (Pro Extended vs. Flash Extended).
  - Modern toggle switch to turn auto-chooser ON/OFF.
  - Micro-animations on interactive states.

#### [NEW] [popup.js](../popup.js)
- Handles popup interactions and syncs options to `chrome.storage.sync`.
- Sends dynamic messages to the active Gemini tab when preferences are updated to trigger immediate re-selection if needed.

---

## Verification Plan

### Manual Verification
1. Load the unpacked extension in Chrome from `the project directory`.
2. Open `https://gemini.google.com/app` and verify it automatically defaults to **Pro Extended**.
3. Click the model switcher and choose **3.5 Flash**. Verify it automatically triggers the submenu and switches to **Flash Extended**.
4. Click the model switcher and choose **3.1 Pro**. Verify it automatically switches to **Pro Extended**.
5. Toggle the switcher off in the extension popup and verify the automation stops.

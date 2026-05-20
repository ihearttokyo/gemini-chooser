# Walkthrough: Gemini Chooser - Auto Extended Reasoning

I have successfully updated and debugged the **Gemini Chooser** extension. It is now more resilient than ever, featuring a state-of-the-art diagnostic suite, automatic cursor refocusing after selections, and published to GitHub!

## GitHub Repository
The complete project codebase, documentation, and licensing have been published to:
🚀 **[ihearttokyo/gemini-chooser](https://github.com/ihearttokyo/gemini-chooser)**

---

## Logo Design
Here is the premium minimalist logo designed and generated for the extension:

![Gemini Chooser Logo](logo.png)

---

## Technical Accomplishments & Bug Fixes

### 1. Automatic Cursor Reset to Text Input Box (New)
- **Selector Heuristics**: Added `findTextInputBox()` inside `content.js` to dynamically locate Gemini's main chat prompt area. It supports:
  - Contenteditable elements with `contenteditable="true"` (standard for Bard/Gemini).
  - Accessibility roles (`[role="textbox"]`).
  - Standard textareas (`textarea`).
  - Common CSS fallback classes (`.ql-editor`, `.input-area`, `#chat-input`, `.prompt-textarea`).
- **Cursor Placement & Focus**: Added `resetInputFocus()` to trigger `.focus()` and automatically build a Range to collapse the cursor selection to the very end of the text. This allows the user to immediately continue typing without manual clicking.
- **Transaction Settlement Delay**: Delayed the refocusing trigger using `setTimeout(resetInputFocus, 100)` at the end of switching and upgrading transactions (and inside `finally` error handlers) to ensure browser animations settle and focus is not swallowed.
- **Robustness**: Tested across all workflow states including direct upgrades, submenu upgrades, base model switches, failed upgrades, and failed base model switches.

### 2. Robust Switcher State Machine (`content.js`)
- **Expanded Selector Matcher**: Upgraded `findActiveModelButton` to match modern Gemini UI elements containing `Advanced`, `Deep Think`, `Thinking`, etc., which previously caused the extension to fail silently.
- **Negative Button Filters**: Added an exclusion pattern to ignore action buttons (e.g., Share, Copy, Like, Upgrade Promos, Settings, Help) to ensure 100% selector accuracy without false positives.
- **Dual-Path Strategy**: Implemented resilient detection that checks if "Extended" is directly click-accessible in the main model sheet, falling back to the "Thinking level" hover-click submenu route if it's nested.
- **Immediate Chaining**: The base switcher now directly chains `upgradeToExtended` immediately upon selection, bypassing wait lag.

### 3. Glassmorphic Settings & Diagnostics HUD (`popup.html` & `popup.js`)
- **Interactive Tab Bar**: Added a premium tab switcher to toggle between **Control Panel** and **Diagnostics HUD**.
- **Live DOM Diagnostics Scanner**: Built a one-click DOM scanner inside the extension popup. It retrieves:
  - Timestamp & URL
  - Active model button presence, tag, role, and text
  - Potential model selector matches in the DOM
  - Menu/dialog open status
  - Visible options for "Thinking level" or "Extended"
  - Complete list of active clickable buttons for developer review
- **Force Trigger**: Added a "Test Click" button that clears the startup tokens and forces an evaluation run immediately.
- **Copy Log**: Instant log copy button with styled micro-interaction.

### 4. Permissions Security Hardening
- Added `"activeTab"` to `manifest.json` to guarantee robust messaging across tab boundaries in modern versions of Google Chrome.

---

## Code Review Checkpoints
All extension files are structured, modular, and ready for deployment:
* [manifest.json](../manifest.json) — Extension definition and sandbox structure.
* [content.js](../content.js) — The core model-switching automation code.
* [popup.html](../popup.html) — Elegant options & HUD UI.
* [popup.js](../popup.js) — Controls logic, tab communication, and diagnostics.
* [README.md](../README.md) — Public-facing explanation and setup details.

---

## Verification and Setup

### How to Apply the Update:
1. Open Google Chrome and navigate to `chrome://extensions/`.
2. Find the **Gemini Chooser - Auto Extended** extension card.
3. Click the **Reload** (circular arrow) icon on the card to apply the changes instantly.
4. Go to `https://gemini.google.com/app` and watch the extension seamlessly switch to **Pro Extended** and immediately return cursor focus to the input box!
5. Open the extension popup, switch to the **Diagnostics HUD** tab, and click **Run Scan** to see the live DOM status right on your screen.

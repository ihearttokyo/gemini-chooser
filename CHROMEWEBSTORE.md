# Chrome Web Store Listing — Gemini Chooser - Auto Extended

> Last Updated: 2026-05-20

## Store Listing

**Extension Name** [REQUIRED]
`Gemini Chooser - Auto Extended`

**Short Description** [REQUIRED]
`Automatically defaults to Gemini Pro/Flash Extended reasoning models to get the best responses without manual clicks.`

**Detailed Description** [REQUIRED]
```text
Default to Gemini's premium Extended models automatically, every single time.

Every time you open Gemini, or switch between Pro and Flash models, you have to click into a submenu to toggle "Extended" or "Thinking level" options. Gemini Chooser automates this tedious process, ensuring that your chat prompt is always routed to the strongest reasoning models so you never waste API tokens or compromise on answer quality.

Key Features:
- Intelligent Automation: Instantly detects when a standard model is active and upgrades it to the Extended version.
- Dual-Path UI Navigation: Resilient matching handles both direct menu item upgrades and nested submenus seamlessly.
- Automatic Cursor Recovery: Instantly restores cursor focus back to the text input box after selection so you can type immediately without manual clicking.
- Glassmorphic Settings UI: Beautiful options popup to toggle auto-upgrades and set your default initial model (Pro or Flash).
- Developer Diagnostics HUD: Built-in real-time DOM diagnostics scanner to inspect active page states and troubleshoot selectors.
- Lightweight & Privacy-First: Zero third-party trackers, zero data collection, and zero network calls.

How to Use:
1. Install Gemini Chooser and pin it to your browser toolbar.
2. Open the extension popup to select your preferred default model (Pro or Flash) and ensure auto-upgrade is enabled.
3. Open or refresh https://gemini.google.com/app.
4. Watch the extension seamlessly default to the Extended version and instantly focus your chat box!
```

**Category** [REQUIRED]
`Productivity` or `Developer Tools` or `Search Tools`

**Single Purpose** [REQUIRED]
`Automatically selects and sets the Extended reasoning versions of active Gemini models.`

**Primary Language** [REQUIRED]
`English`


## Graphics & Assets

| Asset | Dimensions | Status | Filename |
|-------|-----------|--------|----------|
| Store Icon [REQUIRED] | 128×128 PNG | ✅ Ready | `icons/icon128.png` |
| Screenshot 1 [REQUIRED] | 1280×800 or 640×400 | ⬜ Not created | `screenshots/screenshot_pro_extended.png` |
| Screenshot 2 [RECOMMENDED] | 1280×800 or 640×400 | ⬜ Not created | `screenshots/screenshot_popup_controls.png` |
| Screenshot 3 [RECOMMENDED] | 1280×800 or 640×400 | ⬜ Not created | `screenshots/screenshot_diagnostics_hud.png` |
| Small Promo Tile [RECOMMENDED] | 440×280 | ⬜ Not created | `screenshots/promo_tile_440x280.png` |

### Screenshot Notes
- **Screenshot 1**: Captures the Gemini web app in action showing the dropdown selector showing "Pro Extended" successfully active.
- **Screenshot 2**: Shows the clean, glassmorphic Control Panel tab inside the toolbar popup menu.
- **Screenshot 3**: Demonstrates the Diagnostics HUD executing a live DOM scan showing active model button details.


## Permissions Justification

| Permission | Type | Justification |
|------------|------|---------------|
| `storage` | permissions | Used to store user settings (e.g. enabling/disabling auto-upgrade and selecting default model preference) locally on the device to persist their options across browser sessions. |
| `activeTab` | permissions | Allows the toolbar popup UI to safely communicate with the active tab to force-trigger evaluations or run live diagnostics when clicked. |
| `https://gemini.google.com/*` | host_permissions | Enables the extension content script to securely run on the Gemini website in order to monitor model selector dropdowns and automate choices. |


## Privacy & Data Use

### Data Collection

**Does the extension collect user data?** No

All user configurations (such as model preferences and auto-upgrade toggles) are kept 100% locally on your machine via Chrome storage. The extension does not collect, record, or transmit any sensitive data, network history, personal identifiers, location, or telemetry.

### Data Use Certification
- [x] Data is NOT sold to third parties
- [x] Data is NOT used for purposes unrelated to the extension's core functionality
- [x] Data is NOT used for creditworthiness or lending purposes


## Privacy Policy

**Privacy Policy URL** [REQUIRED]
`https://[your-username].github.io/gemini-chooser/privacy.html`
*(Can be hosted on GitHub Pages or a public Gist. A template is provided in `docs/PRIVACY.md`)*


## Distribution

**Visibility**: Public
**Regions**: All regions
**Pricing**: Free


## Developer Info

**Publisher Name** [REQUIRED]
`ihearttokyo` (or your chosen publisher name)

**Contact Email** [REQUIRED]
`your-email@example.com`

**Support URL / Email** [RECOMMENDED]
`https://github.com/ihearttokyo/gemini-chooser/issues`


## Version History

| Version | Date | Changes | Status |
|---------|------|---------|--------|
| 1.1 | 2026-05-20 | Added cursor focus reset to text input, submenu dual-path selectors, action button negative filters, and diagnostics HUD. | Draft |
| 1.0 | 2026-05-19 | Initial release with basic model automatic switching. | Draft |

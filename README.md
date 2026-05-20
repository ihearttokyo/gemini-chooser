# Gemini Chooser - Auto Extended Reasoning

Say goodbye to manual clicks. Automatically default to Gemini Pro & Flash **"Extended"** thinking models in your browser.

![Gemini Chooser Logo](icons/icon128.png)

---

## 💡 The Problem (Why This Is Necessary)

Google Gemini's web interface saves massive amounts of compute tokens by defaulting to standard reasoning models. Every time you start a new session or switch between standard **Pro** or **Flash** models, you are forced to navigate into a submenu and click **"Extended"** (or **"Complex problem solving"**) again. 

This extension is built for power users, developers, and researchers who want to cut out this manual friction and ensure they are **always getting the highest quality reasoning and chain-of-thought responses** by default.

---

## ✨ Features

- ⚡ **Zero-Click Upgrades**: Seamlessly switches to "Extended" reasoning on startup and whenever you select standard Pro or Flash models.
- 🎨 **Glassmorphic Option Panel**: A sleek, premium dark-mode interface matching modern web aesthetics with tailorable startup defaults.
- 🔍 **Integrated Diagnostics HUD**: A built-in DOM parser in the popup to inspect active page states, trigger force runs, and copy debug reports instantly.
- 🛡️ **Resilient DOM Selector Engine**: Utilizes accessibility attributes (`role="button"`, `aria-label`) and semantic string heuristics rather than brittle, obfuscated Google CSS hash classes that break during regular updates.

---

## 🛠️ How to Install (Simple Install Methodology)

Setting up the extension takes less than a minute. Since this is a developer-focused utility, it can be loaded directly as an unpacked extension:

### Step 1: Clone or Download this Repo
Clone this repository to your local machine:
```bash
git clone https://github.com/ihearttokyo/gemini-chooser.git
```
*(Or download the repository as a ZIP file and extract it to a folder on your computer).*

### Step 2: Open Chrome Extensions
In your Google Chrome browser, navigate to:
```text
chrome://extensions/
```

### Step 3: Enable Developer Mode
Toggle the **"Developer mode"** switch in the **top-right corner** of the page to **ON**.

### Step 4: Load the Unpacked Extension
1. Click the **"Load unpacked"** button in the **top-left corner**.
2. Select the `Gemini Chooser` folder containing the `manifest.json` file.

### Step 5: Start Reasoning!
Navigate to [gemini.google.com/app](https://gemini.google.com/app). The extension will automatically choose **Pro Extended** as your startup model!

---

## ⚙️ Customization & Diagnostics

Click the **Gemini Chooser** icon in your browser toolbar to:
1. **Toggle Auto-Upgrade**: Turn the automatic switcher ON or OFF instantly.
2. **Default Preference**: Choose between starting on `3.1 Pro Extended` vs. `3.5 Flash Extended`.
3. **Diagnostics HUD**: Run a live DOM scanner on your active Gemini tab to verify element paths, check menu statuses, and copy system reports if Google changes their layout.

---

## 📄 License

This project is open-source under the [MIT License](LICENSE).

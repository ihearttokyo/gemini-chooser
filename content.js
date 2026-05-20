(function () {
  let isUpgrading = false;
  let isEvaluating = false;
  let lastActiveModelText = '';
  
  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  // Dynamic Element Waiter: polls finder function until it returns an element
  async function waitForElement(finderFn, timeout = 2000) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      const el = finderFn();
      if (el) return el;
      await new Promise(r => setTimeout(r, 50));
    }
    return null;
  }

  // Helper: Find the main active model button
  function findActiveModelButton() {
    const buttons = document.querySelectorAll('button, [role="button"], [role="combobox"], [role="listbox"], [aria-haspopup="true"], .model-selector-button');
    const excludePattern = /(Share|Copy|Like|Dislike|Export|Upload|Listen|Edit|New\s*chat|Help|Settings|Activity|Apps|Upgrade|Close|Menu|Next|Previous|Cancel|Submit|Send|Voice)/i;
    
    for (const btn of buttons) {
      const text = (btn.textContent || '').trim();
      const ariaLabel = btn.getAttribute('aria-label') || '';
      const combinedText = (text + ' ' + ariaLabel).trim();
      
      // Main button has Gemini, Flash, Pro, Advanced, Deep Think, or Lite, and is not inside the open menu/sidebar
      if (/(Gemini|Flash|Pro|Lite|Advanced|Thinking|Deep\s*Think)/i.test(combinedText) &&
          !excludePattern.test(combinedText) &&
          !btn.closest('[role="menu"], [role="listbox"], .dropdown-menu, .menu, [class*="menu-container"], [class*="sidebar"], [class*="nav-container"]')) {
        return btn;
      }
    }
    return null;
  }

  // Helper: Find "Thinking level" element in the active dropdown menu
  function findThinkingLevelMenuItem() {
    const elements = document.querySelectorAll('button, [role="menuitem"], [role="option"], li, div, a, span');
    let bestMatch = null;
    let bestDepth = -1;
    for (const el of elements) {
      const text = el.textContent || '';
      if (/Thinking\s*level/i.test(text) &&
          el.closest('[role="menu"], [role="listbox"], [role="dialog"], .dropdown-menu, .menu, [class*="menu-container"], [class*="picker"]')) {
        // Calculate depth in the DOM tree to get the leaf node
        let depth = 0;
        let parent = el;
        while (parent) {
          depth++;
          parent = parent.parentElement;
        }
        if (depth > bestDepth) {
          bestDepth = depth;
          bestMatch = el;
        }
      }
    }
    if (bestMatch) {
      return bestMatch.closest('button, [role="menuitem"], [role="option"], li, div') || bestMatch;
    }
    return null;
  }

  // Helper: Find "Extended" option currently visible anywhere in open menus/dialogs
  function findExtendedOptionDirect() {
    const elements = document.querySelectorAll('button, [role="menuitem"], [role="option"], [role="radio"], li, div, span, a');
    let bestMatch = null;
    let bestDepth = -1;
    for (const el of elements) {
      const text = el.textContent || '';
      // We look for "Extended" or "Complex problem solving"
      // Also make sure it's inside an open menu/listbox/dialog/dropdown
      if ((/Complex\s*problem\s*solving/i.test(text) || /Extended/i.test(text)) &&
          el.closest('[role="menu"], [role="listbox"], [role="dialog"], .dropdown-menu, .menu, [class*="menu-container"], [class*="picker"]')) {
        let depth = 0;
        let parent = el;
        while (parent) {
          depth++;
          parent = parent.parentElement;
        }
        if (depth > bestDepth) {
          bestDepth = depth;
          bestMatch = el;
        }
      }
    }
    if (bestMatch) {
      return bestMatch.closest('button, [role="menuitem"], [role="option"], [role="radio"], li, div') || bestMatch;
    }
    return null;
  }

  // Helper: Find standard model item (e.g. 3.1 Pro, 3.5 Flash)
  function findBaseModelMenuItem(targetModel) {
    const activeBtn = findActiveModelButton();
    const elements = document.querySelectorAll('button, [role="menuitem"], [role="option"], li, div, span, a');
    let bestMatch = null;
    let bestDepth = -1;
    for (const el of elements) {
      const text = el.textContent || '';
      const isProMatch = targetModel === 'pro' && /Pro/i.test(text) && !/Extended/i.test(text);
      const isFlashMatch = targetModel === 'flash' && /Flash/i.test(text) && !/Extended/i.test(text) && !/Lite/i.test(text);
      
      if ((isProMatch || isFlashMatch) && el !== activeBtn && !(activeBtn && activeBtn.contains(el))) {
        let depth = 0;
        let parent = el;
        while (parent) {
          depth++;
          parent = parent.parentElement;
        }
        if (depth > bestDepth) {
          bestDepth = depth;
          bestMatch = el;
        }
      }
    }
    if (bestMatch) {
      return bestMatch.closest('button, [role="menuitem"], [role="option"], li, div') || bestMatch;
    }
    return null;
  }

  // Action: Upgrade the currently selected model to its Extended version
  async function upgradeToExtended() {
    if (isUpgrading) return;
    isUpgrading = true;
    console.log("[Gemini Chooser] Upgrading active model to Extended...");
    let success = false;

    try {
      const dropdownBtn = findActiveModelButton();
      if (!dropdownBtn) {
        console.warn("[Gemini Chooser] Active model button not found.");
        isUpgrading = false;
        return;
      }

      // 1. Open active model dropdown
      console.log("[Gemini Chooser] Clicking active model dropdown...");
      dropdownBtn.click();
      await sleep(250); // wait for anim

      // 2. Check if Extended option is already directly visible in the menu
      console.log("[Gemini Chooser] Checking for direct Extended option...");
      let extendedOption = findExtendedOptionDirect();
      
      if (extendedOption) {
        console.log("[Gemini Chooser] Found direct Extended option, clicking...");
        extendedOption.click();
        success = true;
        console.log("[Gemini Chooser] Successfully upgraded to Extended model!");
        return;
      }

      // 3. Direct Extended option not found, try to locate "Thinking level" item to open submenu
      console.log("[Gemini Chooser] Direct Extended not found. Searching for 'Thinking level'...");
      const thinkingItem = await waitForElement(findThinkingLevelMenuItem, 1500);
      if (!thinkingItem) {
        console.warn("[Gemini Chooser] Neither 'Extended' nor 'Thinking level' was found.");
        dropdownBtn.click(); // Close the dropdown since we failed
        return;
      }

      // 4. Hover and click Thinking level to reveal submenu
      console.log("[Gemini Chooser] Found 'Thinking level' item, clicking...");
      thinkingItem.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
      thinkingItem.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      thinkingItem.click();
      await sleep(250);

      // 5. Wait for Extended option in the submenu
      console.log("[Gemini Chooser] Searching for 'Extended' option in submenu...");
      extendedOption = await waitForElement(findExtendedOptionDirect, 1500);
      if (!extendedOption) {
        console.warn("[Gemini Chooser] 'Extended' submenu option not found after clicking 'Thinking level'.");
        dropdownBtn.click(); // Close
        return;
      }

      extendedOption.click();
      success = true;
      console.log("[Gemini Chooser] Successfully upgraded to Extended model via submenu!");
    } catch (err) {
      console.error("[Gemini Chooser] Error during upgrade:", err);
    } finally {
      await sleep(300); // Cool down
      isUpgrading = false;
      updateCachedText();
      // Let any closing animations finish completely before focusing the text area
      setTimeout(resetInputFocus, 100);
    }
  }

  // Action: Switch the base model
  async function switchBaseModel(targetModel) {
    if (isUpgrading) return;
    isUpgrading = true;
    console.log(`[Gemini Chooser] Switching base model to ${targetModel}...`);
    let triggeredUpgrade = false;

    try {
      const dropdownBtn = findActiveModelButton();
      if (!dropdownBtn) {
        console.warn("[Gemini Chooser] Active model button not found for base model switch.");
        isUpgrading = false;
        return;
      }

      dropdownBtn.click();
      await sleep(250);

      const baseModelItem = await waitForElement(() => findBaseModelMenuItem(targetModel), 2000);
      if (!baseModelItem) {
        console.warn(`[Gemini Chooser] Base model item for '${targetModel}' not found.`);
        dropdownBtn.click(); // Close
        return;
      }

      baseModelItem.click();
      console.log(`[Gemini Chooser] Switched base model to: ${targetModel}`);
      
      // After switching base model, wait a little bit and then trigger upgrade to Extended
      await sleep(800);
      isUpgrading = false; // Release lock so upgradeToExtended can run
      triggeredUpgrade = true;
      await upgradeToExtended();
    } catch (err) {
      console.error("[Gemini Chooser] Error switching base model:", err);
    } finally {
      isUpgrading = false;
      updateCachedText();
      if (!triggeredUpgrade) {
        // Let any closing animations finish completely before focusing the text area
        setTimeout(resetInputFocus, 100);
      }
    }
  }

  // Helper: Find the main Gemini chat text input box
  function findTextInputBox() {
    // 1. Contenteditable div is standard for Gemini's prompt input
    const editableDiv = document.querySelector('div[contenteditable="true"]');
    if (editableDiv) return editableDiv;

    // 2. Sometimes role="textbox" is used
    const textbox = document.querySelector('[role="textbox"]');
    if (textbox) return textbox;

    // 3. Fallback to any textarea
    const textarea = document.querySelector('textarea');
    if (textarea) return textarea;

    // 4. Fallback to selectors commonly used by Gemini/Bard
    const classFallbacks = document.querySelector('.ql-editor, .input-area, #chat-input, .prompt-textarea');
    if (classFallbacks) return classFallbacks;

    return null;
  }

  // Reset cursor focus to the text input box
  function resetInputFocus() {
    console.log("[Gemini Chooser] Resetting cursor to text input box...");
    const inputEl = findTextInputBox();
    if (inputEl) {
      inputEl.focus();
      try {
        if (inputEl.tagName === 'DIV' && inputEl.getAttribute('contenteditable') === 'true') {
          const range = document.createRange();
          const sel = window.getSelection();
          range.selectNodeContents(inputEl);
          range.collapse(false); // collapse to end of text
          sel.removeAllRanges();
          sel.addRange(range);
        }
      } catch (err) {
        console.warn("[Gemini Chooser] Error placing cursor in contenteditable:", err);
      }
      console.log("[Gemini Chooser] Cursor successfully reset and focused.");
      return true;
    }
    console.warn("[Gemini Chooser] Could not find text input box to focus.");
    return false;
  }

  function updateCachedText() {
    const btn = findActiveModelButton();
    if (btn) {
      lastActiveModelText = btn.textContent || '';
    }
  }

  // Primary State Evaluator
  function evaluateAndProcess() {
    if (isUpgrading || isEvaluating) return;
    isEvaluating = true;

    chrome.storage.sync.get({
      autoUpgrade: true,
      defaultModel: 'pro'
    }, async (settings) => {
      try {
        if (!settings.autoUpgrade) return;

        const activeBtn = findActiveModelButton();
        if (!activeBtn) return; // UI not loaded yet

        const activeText = activeBtn.textContent || '';
        
        // If we are already Extended/Thinking, do nothing
        if (/Extended|Thinking|Deep\s*Think|Complex/i.test(activeText)) {
          sessionStorage.setItem('gemini_chooser_done_initial', 'true');
          lastActiveModelText = activeText;
          return;
        }

        // Verify if we have run the initial startup choice
        const hasInitialDone = sessionStorage.getItem('gemini_chooser_done_initial') === 'true';

        if (!hasInitialDone) {
          const targetBaseModel = settings.defaultModel; // 'pro' or 'flash'
          const isActivePro = /Pro/i.test(activeText);
          const isActiveFlash = /Flash/i.test(activeText);

          sessionStorage.setItem('gemini_chooser_done_initial', 'true');

          if (targetBaseModel === 'pro' && !isActivePro) {
            await switchBaseModel('pro');
          } else if (targetBaseModel === 'flash' && !isActiveFlash) {
            await switchBaseModel('flash');
          } else {
            await upgradeToExtended();
          }
        } else {
          // Sub-sequent active session: upgrade whichever model standard was selected
          if (/Pro|Flash/i.test(activeText) && !/Extended|Thinking|Deep\s*Think/i.test(activeText)) {
            await upgradeToExtended();
          }
        }
      } catch (err) {
        console.error("[Gemini Chooser] Error in evaluation:", err);
      } finally {
        isEvaluating = false;
      }
    });
  }

  // Run Diagnostics and return DOM facts
  function runDiagnostics() {
    console.log("[Gemini Chooser] Running DOM Diagnostics...");
    const facts = {
      timestamp: new Date().toISOString(),
      url: window.location.href,
      activeModelButton: null,
      potentialModelButtons: [],
      menuOpen: false,
      visibleExtendedOptions: [],
      visibleThinkingLevelOptions: [],
      allButtons: []
    };

    const clickables = document.querySelectorAll('button, [role="button"], [role="combobox"], [role="listbox"], [aria-haspopup="true"]');
    const excludePattern = /(Share|Copy|Like|Dislike|Export|Upload|Listen|Edit|New\s*chat|Help|Settings|Activity|Apps|Upgrade|Close|Menu|Next|Previous|Cancel|Submit|Send|Voice)/i;

    clickables.forEach(el => {
      const text = (el.textContent || '').trim();
      const ariaLabel = el.getAttribute('aria-label') || '';
      const combinedText = (text + ' ' + ariaLabel).trim();
      const rect = el.getBoundingClientRect();
      const isVisible = rect.width > 0 && rect.height > 0;
      
      const elementInfo = {
        tag: el.tagName.toLowerCase(),
        text: text.slice(0, 50),
        ariaLabel: ariaLabel.slice(0, 50),
        classes: el.className,
        role: el.getAttribute('role') || '',
        visible: isVisible,
        rect: { width: Math.round(rect.width), height: Math.round(rect.height) }
      };

      if (isVisible) {
        facts.allButtons.push(elementInfo);
      }

      if (/(Gemini|Flash|Pro|Lite|Advanced|Thinking|Deep\s*Think)/i.test(combinedText) &&
          !excludePattern.test(combinedText) &&
          !el.closest('[role="menu"], [role="listbox"], .dropdown-menu, .menu, [class*="menu-container"], [class*="sidebar"], [class*="nav-container"]')) {
        facts.potentialModelButtons.push(elementInfo);
      }
    });

    const activeBtn = findActiveModelButton();
    if (activeBtn) {
      const rect = activeBtn.getBoundingClientRect();
      facts.activeModelButton = {
        tag: activeBtn.tagName.toLowerCase(),
        text: (activeBtn.textContent || '').trim(),
        ariaLabel: activeBtn.getAttribute('aria-label') || '',
        classes: activeBtn.className,
        role: activeBtn.getAttribute('role') || '',
        visible: rect.width > 0 && rect.height > 0
      };
    }

    const openMenu = document.querySelector('[role="menu"], [role="listbox"], [role="dialog"], .dropdown-menu, .menu, [class*="menu-container"], [class*="picker"]');
    if (openMenu) {
      facts.menuOpen = true;
    }

    const allElements = document.querySelectorAll('button, [role="menuitem"], [role="option"], [role="radio"], li, div, span, a');
    allElements.forEach(el => {
      const text = (el.textContent || '').trim();
      const rect = el.getBoundingClientRect();
      const isVisible = rect.width > 0 && rect.height > 0;
      if (!isVisible) return;

      const elementInfo = {
        tag: el.tagName.toLowerCase(),
        text: text.slice(0, 50),
        classes: el.className,
        role: el.getAttribute('role') || ''
      };

      if (/Thinking\s*level/i.test(text)) {
        facts.visibleThinkingLevelOptions.push(elementInfo);
      }
      if (/Complex\s*problem\s*solving/i.test(text) || /Extended/i.test(text)) {
        facts.visibleExtendedOptions.push(elementInfo);
      }
    });

    return facts;
  }

  // Initialize and observe
  function init() {
    console.log("[Gemini Chooser] Active and monitoring model selections.");
    
    // 1. Initial run with safety timeout
    setTimeout(evaluateAndProcess, 1500);

    // 2. Poll fallback (extremely lightweight, keeps it reliable)
    setInterval(() => {
      const activeBtn = findActiveModelButton();
      if (activeBtn) {
        const currentText = activeBtn.textContent || '';
        if (currentText !== lastActiveModelText) {
          lastActiveModelText = currentText;
          evaluateAndProcess();
        }
      }
    }, 1000);

    // 3. MutationObserver to capture instant additions
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.addedNodes.length > 0) {
          const btn = findActiveModelButton();
          if (btn && btn.textContent !== lastActiveModelText) {
            evaluateAndProcess();
            break;
          }
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // Listen for preference updates or diagnostics from action popup
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'preferencesUpdated') {
      console.log("[Gemini Chooser] Preferences updated, evaluating...");
      sessionStorage.removeItem('gemini_chooser_done_initial');
      evaluateAndProcess();
      sendResponse({ status: 'ok' });
    } else if (message.action === 'runDiagnostics') {
      try {
        const report = runDiagnostics();
        sendResponse({ status: 'ok', data: report });
      } catch (err) {
        sendResponse({ status: 'error', error: err.message });
      }
    } else if (message.action === 'forceTrigger') {
      sessionStorage.removeItem('gemini_chooser_done_initial');
      evaluateAndProcess();
      sendResponse({ status: 'ok' });
    }
    return true;
  });

  // Start extension content script
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    init();
  } else {
    document.addEventListener('DOMContentLoaded', init);
  }
})();

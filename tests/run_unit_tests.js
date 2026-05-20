import fs from 'fs';

console.log("==========================================");
console.log("RUNNING GEMINI CHOOSER EXTENSION UNIT TESTS");
console.log("==========================================\n");

// Read content.js
const filePath = './content.js';
let fileContent = fs.readFileSync(filePath, 'utf8');

// Strip IIFE wrapper to make functions accessible to test context
let innerCode = fileContent.trim();
if (innerCode.startsWith('(function () {')) {
  innerCode = innerCode.replace('(function () {', '');
  if (innerCode.endsWith('})();')) {
    innerCode = innerCode.substring(0, innerCode.length - 5);
  } else if (innerCode.endsWith('})();\n')) {
    innerCode = innerCode.substring(0, innerCode.length - 6);
  }
}

// Global state mocks
let mockStorage = {
  autoUpgrade: true,
  defaultModel: 'pro'
};

let sessionStorageStore = {};
const sessionStorageMock = {
  getItem: (key) => sessionStorageStore[key] || null,
  setItem: (key, val) => { sessionStorageStore[key] = String(val); },
  removeItem: (key) => { delete sessionStorageStore[key]; }
};

let domElements = [];

function matchesSelector(el, sel) {
  const parts = sel.split(',').map(s => s.trim());
  if (parts.length > 1) {
    return parts.some(part => matchesSelector(el, part));
  }

  if (sel === 'div[contenteditable="true"]') {
    return el.tagName === 'DIV' && el.attributes.contenteditable === 'true';
  }
  if (sel === 'textarea') {
    return el.tagName === 'TEXTAREA';
  }
  if (sel === '[role="textbox"]') {
    return el.attributes.role === 'textbox';
  }
  if (sel === 'button') {
    return el.tagName === 'BUTTON';
  }
  if (sel === '[role="button"]') {
    return el.attributes.role === 'button';
  }
  if (sel === '[role="combobox"]') {
    return el.attributes.role === 'combobox';
  }
  if (sel === '[role="listbox"]') {
    return el.attributes.role === 'listbox';
  }
  if (sel === '[role="menu"]') {
    return el.attributes.role === 'menu';
  }
  if (sel === '[role="menuitem"]') {
    return el.attributes.role === 'menuitem';
  }
  if (sel === '[role="option"]') {
    return el.attributes.role === 'option';
  }
  if (sel === '[role="radio"]') {
    return el.attributes.role === 'radio';
  }
  if (sel === '[role="dialog"]') {
    return el.attributes.role === 'dialog';
  }
  if (sel === '[aria-haspopup="true"]') {
    return el.attributes['aria-haspopup'] === 'true';
  }
  if (sel === '.model-selector-button') {
    return el.attributes.class === 'model-selector-button';
  }
  if (['li', 'div', 'span', 'a'].includes(sel)) {
    return el.tagName === sel.toUpperCase();
  }
  if (sel === '.dropdown-menu' || sel === '.menu') {
    return el.attributes.class && el.attributes.class.includes(sel.slice(1));
  }
  if (sel.includes('class*')) {
    const match = sel.match(/class\*=\"([^\"]+)\"/);
    if (match && el.attributes.class) {
      return el.attributes.class.includes(match[1]);
    }
  }
  return false;
}

class MockElement {
  constructor(tagName, textContent = '', attributes = {}) {
    this.tagName = tagName.toUpperCase();
    this.textContent = textContent;
    this.attributes = attributes;
    this.clicked = false;
    this.focused = false;
    this.clicksCount = 0;
    this.parent = null;
    this.visible = true;
  }
  getAttribute(name) {
    return this.attributes[name] || null;
  }
  click() {
    this.clicked = true;
    this.clicksCount++;
    if (this.onclick) this.onclick();
  }
  focus() {
    this.focused = true;
  }
  dispatchEvent(event) {
    // Stub
  }
  closest(selector) {
    let curr = this;
    while (curr) {
      if (matchesSelector(curr, selector)) return curr;
      curr = curr.parent;
    }
    return null;
  }
  contains(el) {
    return false;
  }
  getBoundingClientRect() {
    return this.visible ? { width: 100, height: 40 } : { width: 0, height: 0 };
  }
}

const documentMock = {
  readyState: 'interactive', // Avoid immediate automatic run of init()
  addEventListener: () => {},
  body: { observeCallback: null },
  querySelector: (sel) => {
    for (const el of domElements) {
      if (matchesSelector(el, sel)) return el;
    }
    return null;
  },
  querySelectorAll: (sel) => {
    return domElements.filter(el => matchesSelector(el, sel));
  },
  createRange: () => ({
    selectNodeContents: () => {},
    collapse: () => {}
  })
};

const windowMock = {
  location: { href: 'https://gemini.google.com/app' },
  getSelection: () => ({
    removeAllRanges: () => {},
    addRange: () => {}
  })
};

class MutationObserverMock {
  constructor(callback) {
    documentMock.body.observeCallback = callback;
  }
  observe() {}
}

const sandbox = {
  chrome: {
    storage: {
      sync: {
        get: (defaults, callback) => {
          callback(Object.assign({}, defaults, mockStorage));
        }
      }
    },
    runtime: {
      onMessage: { addListener: () => {} }
    }
  },
  sessionStorage: sessionStorageMock,
  document: documentMock,
  window: windowMock,
  MouseEvent: class { constructor(t, i) { this.type = t; Object.assign(this, i); } },
  MutationObserver: MutationObserverMock,
  setInterval: () => {},
  setTimeout: (fn, delay) => {
    // Execute immediately in test runner to keep tests synchronous/predictable
    fn();
  },
  console: {
    log: (...args) => console.log("   [LOG]", ...args),
    warn: (...args) => console.warn("   [WARN]", ...args),
    error: (...args) => console.error("   [ERROR]", ...args)
  }
};

function runInSandbox(code, ctx) {
  const keys = Object.keys(ctx);
  const vals = Object.values(ctx);
  const runFn = new Function(...keys, code + '\nreturn { findActiveModelButton, findTextInputBox, resetInputFocus, upgradeToExtended, switchBaseModel, evaluateAndProcess };');
  return runFn(...vals);
}

const contentExports = runInSandbox(innerCode, sandbox);

// Helper to construct a standard mock DOM layout
function buildMockDOM({ activeModelText, hasDirectExtended, hasThinkingLevel, hasSubmenuExtended, hasBasePro, hasBaseFlash }) {
  domElements = [];
  sessionStorageStore = {};

  // Text input box
  const chatInput = new MockElement('div', '', { contenteditable: 'true' });
  domElements.push(chatInput);

  // Active Model Picker Button
  const activeBtn = new MockElement('button', activeModelText, { role: 'combobox' });
  domElements.push(activeBtn);

  // Menu Container Mock
  const menuContainer = new MockElement('div', '', { role: 'menu' });
  domElements.push(menuContainer);

  let directExtended = null;
  let thinkingItem = null;
  let submenuExtended = null;
  let basePro = null;
  let baseFlash = null;

  if (hasDirectExtended) {
    directExtended = new MockElement('div', 'Gemini Advanced Extended', { role: 'option' });
    directExtended.parent = menuContainer;
    directExtended.onclick = () => {
      activeBtn.textContent = 'Gemini Advanced Extended';
    };
    domElements.push(directExtended);
  }

  if (hasSubmenuExtended) {
    submenuExtended = new MockElement('div', 'Gemini Advanced Extended', { role: 'option' });
    submenuExtended.parent = menuContainer;
    // Set to invisible until clicked
    submenuExtended.visible = !hasThinkingLevel; 
    submenuExtended.onclick = () => {
      activeBtn.textContent = 'Gemini Advanced Extended';
    };
    if (!hasThinkingLevel) {
      domElements.push(submenuExtended);
    }
  }

  if (hasThinkingLevel) {
    thinkingItem = new MockElement('div', 'Thinking level', { role: 'option' });
    thinkingItem.parent = menuContainer;
    thinkingItem.onclick = () => {
      console.log("      * Thinking level clicked, opening submenu...");
      if (hasSubmenuExtended) {
        submenuExtended.visible = true;
        if (!domElements.includes(submenuExtended)) {
          domElements.push(submenuExtended);
        }
      }
    };
    domElements.push(thinkingItem);
  }

  if (hasBasePro) {
    basePro = new MockElement('div', 'Gemini 1.5 Pro', { role: 'option' });
    basePro.parent = menuContainer;
    basePro.onclick = () => {
      activeBtn.textContent = 'Gemini 1.5 Pro';
    };
    domElements.push(basePro);
  }

  if (hasBaseFlash) {
    baseFlash = new MockElement('div', 'Gemini 1.5 Flash', { role: 'option' });
    baseFlash.parent = menuContainer;
    baseFlash.onclick = () => {
      activeBtn.textContent = 'Gemini 1.5 Flash';
    };
    domElements.push(baseFlash);
  }

  return { chatInput, activeBtn, directExtended, thinkingItem, submenuExtended, basePro, baseFlash };
}

// Sleep utility in test runner
const sleep = (ms) => new Promise(r => setTimeout(r, 10));

// Test Suite
(async () => {
  let allPassed = true;

  // TEST 1: Direct Upgrade Path
  console.log("--- TEST 1: Direct Upgrade Path ---");
  const t1 = buildMockDOM({
    activeModelText: 'Gemini 1.5 Pro',
    hasDirectExtended: true,
    hasThinkingLevel: false,
    hasSubmenuExtended: false
  });

  contentExports.evaluateAndProcess();
  await sleep(100);

  console.log("   Verifications:");
  console.log("   - Active model picker button was clicked:", t1.activeBtn.clicked ? "PASS" : "FAIL");
  console.log("   - Direct Extended option was clicked:", t1.directExtended.clicked ? "PASS" : "FAIL");
  console.log("   - Chat input was refocused:", t1.chatInput.focused ? "PASS" : "FAIL");

  if (t1.activeBtn.clicked && t1.directExtended.clicked && t1.chatInput.focused) {
    console.log("TEST 1 RESULT: SUCCESS 🎉\n");
  } else {
    console.log("TEST 1 RESULT: FAILED ❌\n");
    allPassed = false;
  }

  // TEST 2: Submenu Upgrade Path
  console.log("--- TEST 2: Submenu Upgrade Path ---");
  const t2 = buildMockDOM({
    activeModelText: 'Gemini 1.5 Pro',
    hasDirectExtended: false,
    hasThinkingLevel: true,
    hasSubmenuExtended: true
  });

  contentExports.evaluateAndProcess();
  // Allow nested microtasks/timeouts to complete
  await sleep(600);

  console.log("   Verifications:");
  console.log("   - Active model picker button was clicked:", t2.activeBtn.clicked ? "PASS" : "FAIL");
  console.log("   - Thinking level item was clicked:", t2.thinkingItem.clicked ? "PASS" : "FAIL");
  console.log("   - Submenu Extended option was clicked:", t2.submenuExtended.clicked ? "PASS" : "FAIL");
  console.log("   - Chat input was refocused:", t2.chatInput.focused ? "PASS" : "FAIL");

  if (t2.activeBtn.clicked && t2.thinkingItem.clicked && t2.submenuExtended.clicked && t2.chatInput.focused) {
    console.log("TEST 2 RESULT: SUCCESS 🎉\n");
  } else {
    console.log("TEST 2 RESULT: FAILED ❌\n");
    allPassed = false;
  }

  // TEST 3: Base Model Switch + Upgrade
  console.log("--- TEST 3: Base Model Switch + Upgrade ---");
  mockStorage.defaultModel = 'pro';
  const t3 = buildMockDOM({
    activeModelText: 'Gemini 1.5 Flash',
    hasDirectExtended: true,
    hasThinkingLevel: false,
    hasSubmenuExtended: false,
    hasBasePro: true
  });

  contentExports.evaluateAndProcess();
  // Switch base model does switch, wait 800ms, then upgradeToExtended. So sleep longer here:
  await sleep(1200);

  console.log("   Verifications:");
  console.log("   - Active model picker button was clicked first time:", t3.activeBtn.clicksCount >= 1 ? "PASS" : "FAIL");
  console.log("   - Pro base model item was clicked:", t3.basePro.clicked ? "PASS" : "FAIL");
  console.log("   - Active model button was clicked second time for upgrade:", t3.activeBtn.clicksCount >= 2 ? "PASS" : "FAIL");
  console.log("   - Direct Extended option was clicked:", t3.directExtended.clicked ? "PASS" : "FAIL");
  console.log("   - Chat input was refocused at final stage:", t3.chatInput.focused ? "PASS" : "FAIL");

  if (t3.basePro.clicked && t3.directExtended.clicked && t3.chatInput.focused) {
    console.log("TEST 3 RESULT: SUCCESS 🎉\n");
  } else {
    console.log("TEST 3 RESULT: FAILED ❌\n");
    allPassed = false;
  }

  // TEST 4: Failed Upgrade Focus Recovery
  console.log("--- TEST 4: Failed Upgrade Focus Recovery ---");
  const t4 = buildMockDOM({
    activeModelText: 'Gemini 1.5 Pro',
    hasDirectExtended: false,
    hasThinkingLevel: false,
    hasSubmenuExtended: false
  });

  contentExports.evaluateAndProcess();
  await sleep(400);

  console.log("   Verifications:");
  console.log("   - Active model button clicked to open dropdown:", t4.activeBtn.clicked ? "PASS" : "FAIL");
  console.log("   - Active model button clicked second time to close on failure:", t4.activeBtn.clicksCount >= 2 ? "PASS" : "FAIL");
  console.log("   - Focus successfully recovered back to text input:", t4.chatInput.focused ? "PASS" : "FAIL");

  if (t4.activeBtn.clicksCount >= 2 && t4.chatInput.focused) {
    console.log("TEST 4 RESULT: SUCCESS 🎉\n");
  } else {
    console.log("TEST 4 RESULT: FAILED ❌\n");
    allPassed = false;
  }

  // TEST 5: Failed Base Model Switch Focus Recovery
  console.log("--- TEST 5: Failed Base Model Switch Focus Recovery ---");
  mockStorage.defaultModel = 'pro';
  const t5 = buildMockDOM({
    activeModelText: 'Gemini 1.5 Flash',
    hasDirectExtended: false,
    hasThinkingLevel: false,
    hasSubmenuExtended: false,
    hasBasePro: false // Missing Pro item to simulate failure!
  });

  contentExports.evaluateAndProcess();
  await sleep(400);

  console.log("   Verifications:");
  console.log("   - Active model button clicked to open dropdown:", t5.activeBtn.clicked ? "PASS" : "FAIL");
  console.log("   - Active model button clicked second time to close dropdown on failure:", t5.activeBtn.clicksCount >= 2 ? "PASS" : "FAIL");
  console.log("   - Focus successfully recovered back to text input:", t5.chatInput.focused ? "PASS" : "FAIL");

  if (t5.activeBtn.clicksCount >= 2 && t5.chatInput.focused) {
    console.log("TEST 5 RESULT: SUCCESS 🎉\n");
  } else {
    console.log("TEST 5 RESULT: FAILED ❌\n");
    allPassed = false;
  }

  if (allPassed) {
    console.log("ALL TESTS COMPLETED SUCCESSFULLY! 🚀");
    process.exit(0);
  } else {
    console.log("SOME TESTS FAILED!");
    process.exit(1);
  }
})();

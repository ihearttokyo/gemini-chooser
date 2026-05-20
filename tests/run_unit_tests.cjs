const fs = require('fs');
const path = require('path');

console.log("==========================================");
console.log("RUNNING GEMINI CHOOSER EXTENSION UNIT TESTS");
console.log("==========================================\n");

// Read content.js
const filePath = path.join(__dirname, '../content.js');
let fileContent = fs.readFileSync(filePath, 'utf8');

// Strip IIFE wrapper (function () { ... })() to make internal functions and variables accessible to tests
// This lets us call the functions directly for testing.
// We extract the code inside the outer (function () { and })();
let innerCode = fileContent.trim();
if (innerCode.startsWith('(function () {')) {
  innerCode = innerCode.replace('(function () {', '');
  // Remove the trailing })();
  if (innerCode.endsWith('})();')) {
    innerCode = innerCode.substring(0, innerCode.length - 5);
  } else if (innerCode.endsWith('})();\n')) {
    innerCode = innerCode.substring(0, innerCode.length - 6);
  }
}

// Global Mocks
let mockStorage = {
  autoUpgrade: true,
  defaultModel: 'pro'
};

let chromeMock = {
  storage: {
    sync: {
      get: (defaults, callback) => {
        callback(Object.assign({}, defaults, mockStorage));
      }
    }
  },
  runtime: {
    onMessage: {
      addListener: (callback) => {
        chromeMock.runtime.messageListener = callback;
      }
    }
  }
};

let sessionStorageMock = {
  store: {},
  getItem: (key) => sessionStorageMock.store[key] || null,
  setItem: (key, val) => { sessionStorageMock.store[key] = String(val); },
  removeItem: (key) => { delete sessionStorageMock.store[key]; }
};

let mockElements = {};
let documentMock = {
  readyState: 'complete',
  addEventListener: () => {},
  body: {
    observeCallback: null
  },
  querySelector: (sel) => {
    // Return mock element based on selector
    if (sel === 'div[contenteditable="true"]') {
      return mockElements.chatInput;
    }
    // Content.js matches active button
    if (sel === 'button, [role="combobox"], [role="button"]') {
      return mockElements.activeModelButton;
    }
    // Direct extended option
    if (sel.includes('Extended') || sel.includes('Complex') || sel.includes('Thinking')) {
      // Find based on query
      return mockElements.extendedOption;
    }
    return null;
  },
  querySelectorAll: (sel) => {
    if (sel.includes('button')) {
      const list = [];
      if (mockElements.activeModelButton) list.push(mockElements.activeModelButton);
      return list;
    }
    return [];
  },
  createRange: () => ({
    selectNodeContents: () => {},
    collapse: () => {}
  })
};

let windowMock = {
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

// Compile content.js in a sandboxed VM or eval with mocks
const sandbox = {
  chrome: chromeMock,
  sessionStorage: sessionStorageMock,
  document: documentMock,
  window: windowMock,
  MutationObserver: MutationObserverMock,
  setInterval: () => {},
  setTimeout: (fn, delay) => {
    // Store timeouts to execute them synchronously in tests
    sandbox.timeouts.push({ fn, delay });
  },
  console: {
    log: (...args) => console.log("   [LOG]", ...args),
    warn: (...args) => console.warn("   [WARN]", ...args),
    error: (...args) => console.error("   [ERROR]", ...args)
  },
  timeouts: []
};

// Evaluate the inner script inside the sandbox context
function runInSandbox(code, ctx) {
  const keys = Object.keys(ctx);
  const vals = Object.values(ctx);
  const runFn = new Function(...keys, code + '\nreturn { findActiveModelButton, findTextInputBox, resetInputFocus, upgradeToExtended, switchBaseModel, evaluateAndProcess, timeouts };');
  return runFn(...vals);
}

// Execute sandboxed context
const exports = runInSandbox(innerCode, sandbox);

// Setup our Mock Elements before each test
function resetMockElements() {
  mockElements = {
    chatInput: {
      tagName: 'DIV',
      focused: false,
      focus: function() {
        this.focused = true;
        console.log("      * Mock input box received focus!");
      },
      getAttribute: function(name) {
        if (name === 'contenteditable') return 'true';
        return null;
      }
    },
    activeModelButton: {
      tagName: 'BUTTON',
      textContent: 'Gemini 1.5 Pro',
      clicked: false,
      click: function() {
        this.clicked = true;
        console.log("      * Model dropdown clicked!");
      },
      getAttribute: () => null
    },
    extendedOption: null
  };
  sandbox.timeouts.length = 0; // Clear timeouts
}

// TEST 1: Direct Upgrade Path (Option is immediately visible)
console.log("--- TEST 1: Direct Upgrade Path ---");
resetMockElements();

// Setup the Extended option to be directly visible when searched
mockElements.extendedOption = {
  tagName: 'DIV',
  textContent: 'Gemini Advanced Extended',
  clicked: false,
  click: function() {
    this.clicked = true;
    mockElements.activeModelButton.textContent = 'Gemini Advanced Extended';
    console.log("      * Direct Extended option clicked!");
  },
  closest: (sel) => mockElements.extendedOption
};

// Execute evaluateAndProcess (which triggers upgradeToExtended)
exports.evaluateAndProcess();

// Execute any scheduled setTimeout calls (like resetInputFocus after 100ms)
console.log("   Executing scheduled timeouts...");
sandbox.timeouts.forEach(t => t.fn());

// Verify results
console.log("\n   Verifications:");
console.log("   - Model button was clicked to open dropdown:", mockElements.activeModelButton.clicked === true ? "PASS" : "FAIL");
console.log("   - Direct Extended option was clicked:", mockElements.extendedOption.clicked === true ? "PASS" : "FAIL");
console.log("   - Model text updated to Extended:", mockElements.activeModelButton.textContent.includes('Extended') ? "PASS" : "FAIL");
console.log("   - Chat input was focused:", mockElements.chatInput.focused === true ? "PASS" : "FAIL");

const t1Passed = mockElements.activeModelButton.clicked && 
                 mockElements.extendedOption.clicked && 
                 mockElements.chatInput.focused;
console.log(`\nTEST 1 RESULT: ${t1Passed ? "SUCCESS 🎉" : "FAILED ❌"}\n`);

// TEST 2: Non-direct Upgrade Path is not fully mockable here due to multiple waitForElement steps,
// but let's test input focus selector resolution itself.
console.log("--- TEST 2: Input Box Selector Resolution & Focus ---");
resetMockElements();

// Verify findTextInputBox returns correct element under different structures
const resolvedInput = exports.findTextInputBox();
console.log("   - Resolved standard contenteditable input box:", resolvedInput === mockElements.chatInput ? "PASS" : "FAIL");

// Test with textarea instead of contenteditable
mockElements.chatInput = null; // remove contenteditable
mockElements.textarea = {
  tagName: 'TEXTAREA',
  focused: false,
  focus: function() { this.focused = true; }
};
documentMock.querySelector = (sel) => {
  if (sel === 'textarea') return mockElements.textarea;
  return null;
};

const resolvedTextarea = exports.findTextInputBox();
console.log("   - Resolved fallback textarea input box:", resolvedTextarea === mockElements.textarea ? "PASS" : "FAIL");

// Test resetInputFocus calling
exports.resetInputFocus();
console.log("   - resetInputFocus successfully focused fallback textarea:", mockElements.textarea.focused === true ? "PASS" : "FAIL");

const t2Passed = resolvedInput !== null && resolvedTextarea === mockElements.textarea && mockElements.textarea.focused;
console.log(`\nTEST 2 RESULT: ${t2Passed ? "SUCCESS 🎉" : "FAILED ❌"}\n`);

if (t1Passed && t2Passed) {
  console.log("ALL TESTS COMPLETED SUCCESSFULLY! 🚀");
  process.exit(0);
} else {
  console.log("SOME TESTS FAILED!");
  process.exit(1);
}

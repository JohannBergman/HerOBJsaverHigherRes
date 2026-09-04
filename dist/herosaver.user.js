// ==UserScript==
// @name         HerosaverHigherRes
// @namespace    https://github.com/JohannBergman/HerOBJsaverHigherRes
// @version      1.3.3
// @description  Save Configuration and STLs from websites using the THREE.JS framework
// @author       reformagus
// @homepageURL  https://github.com/JohannBergman/HerOBJsaverHigherRes
// @match        *://*.heroforge.com/*
// @grant        GM_registerMenuCommand
// @run-at       document-start
// ==/UserScript==

(function () {
  'use strict';

  const SRC =
    'https://cdn.jsdelivr.net/gh/JohannBergman/HerOBJsaverHigherRes@master/dist/herosaver.js';

  let bundleLoaded = false;
  let bundleLoading = false;
  const pendingCalls = [];

  function loadBundle() {
    if (bundleLoaded) {
      flushCalls();
      return;
    }

    if (bundleLoading) return;

    bundleLoading = true;

    const script = document.createElement('script');
    script.src = SRC + '?_=' + Date.now();

    script.onload = () => {
      bundleLoaded = true;
      console.log('HerOBJsaver loaded');
      flushCalls();
    };

    script.onerror = (error) => {
      bundleLoading = false;
      console.error('Failed to load HerOBJsaver:', error);
    };

    (document.head || document.documentElement).appendChild(script);
  }

  function run(functionName) {
    if (!bundleLoaded) {
      pendingCalls.push(functionName);
      loadBundle();
      return;
    }

    injectCall(functionName);
  }

  function flushCalls() {
    while (pendingCalls.length) {
      injectCall(pendingCalls.shift());
    }
  }

  function injectCall(functionName) {
    const script = document.createElement('script');

    script.textContent = `
      if (typeof window.${functionName} === 'function') {
        window.${functionName}();
      } else {
        console.error('Herosaver function not found: ${functionName}');
      }
    `;

    (document.head || document.documentElement).appendChild(script);
    script.remove();
  }

  GM_registerMenuCommand('Herosaver: Save STL', () => {
    run('saveCleanStl');
  });

  GM_registerMenuCommand('Herosaver: Save OBJ', () => {
    run('saveObj');
  });

  GM_registerMenuCommand('Herosaver: Save JSON', () => {
    run('saveJson');
  });

  function removeForeignSaveStlButtons() {
    const panel = document.getElementById('herosaver-panel');

    document
      .querySelectorAll(
        'button, a, [role="button"], input[type="button"], input[type="submit"]'
      )
      .forEach((el) => {
        if (panel && panel.contains(el)) return;

        const label = (el.textContent || el.value || '').trim();

        if (label === 'Save STL') {
          el.remove();
        }
      });
  }

  function injectPanel() {
    if (document.getElementById('herosaver-panel')) return;

    const panel = document.createElement('div');

    panel.id = 'herosaver-panel';
    panel.style.cssText = [
      'position:fixed',
      'right:16px',
      'bottom:16px',
      'z-index:2147483647',
      'display:flex',
      'flex-direction:column',
      'gap:6px',
      'padding:10px',
      'border-radius:10px',
      'background:rgba(17,24,39,0.92)',
      'box-shadow:0 4px 16px rgba(0,0,0,0.35)',
      'font-family:system-ui,-apple-system,sans-serif',
      'font-size:13px'
    ].join(';');

    const title = document.createElement('div');
    title.textContent = 'Herosaver';
    title.style.cssText =
      'color:#9ca3af;font-weight:600;font-size:11px;letter-spacing:.05em;text-transform:uppercase;margin-bottom:2px';

    panel.appendChild(title);

    function makeButton(label, functionName, primary) {
      const button = document.createElement('button');

      button.textContent = label;
      button.style.cssText = [
        'cursor:pointer',
        'border:0',
        'border-radius:6px',
        'padding:7px 12px',
        'font-size:13px',
        'font-weight:600',
        'text-align:left',
        primary ? 'background:#2563eb' : 'background:#374151',
        'color:#fff'
      ].join(';');

      button.addEventListener('click', () => {
        run(functionName);
      });

      return button;
    }

    panel.appendChild(makeButton('Save STL', 'saveCleanStl', true));
    panel.appendChild(makeButton('Save OBJ', 'saveObj', false));
    panel.appendChild(makeButton('Save JSON', 'saveJson', false));

    document.body.appendChild(panel);
  }

  function init() {
    injectPanel();
    removeForeignSaveStlButtons();

    [1000, 2500, 5000].forEach((ms) => {
      setTimeout(removeForeignSaveStlButtons, ms);
    });
  }

  if (document.body) {
    init();
  } else {
    window.addEventListener('DOMContentLoaded', init);
  }

  // Begin loading the bundle immediately.
  loadBundle();
})();

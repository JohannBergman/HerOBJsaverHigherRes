// ==UserScript==
// @name         HerosaverHigherRes
// @namespace    https://github.com/JohannBergman/HerOBJsaverHigherRes
// @version      1.3.5
// @description  Save Configuration and STLs from HeroForge
// @author       reformagus
// @homepageURL  https://github.com/JohannBergman/HerOBJsaverHigherRes
// @match        *://*.heroforge.com/*
// @grant        GM_registerMenuCommand
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  const SRC =
    'https://cdn.jsdelivr.net/gh/JohannBergman/HerOBJsaverHigherRes@master/dist/herosaver.js';

  const SUBDIVISIONS = 2;

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

    // Wait for HeroForge to finish creating its character data.
    setTimeout(() => {
      const script = document.createElement('script');

      script.src = `${SRC}?_=${Date.now()}`;

      script.onload = () => {
        bundleLoaded = true;
        console.log('Herosaver bundle loaded');
        flushCalls();
      };

      script.onerror = (error) => {
        bundleLoading = false;
        console.error('Failed to load Herosaver bundle:', error);
      };

      (document.head || document.documentElement).appendChild(script);
    }, 2000);
  }

  function run(functionName, subdivisions = SUBDIVISIONS) {
    if (!bundleLoaded) {
      pendingCalls.push({
        functionName,
        subdivisions
      });

      loadBundle();
      return;
    }

    injectCall(functionName, subdivisions);
  }

  function flushCalls() {
    while (pendingCalls.length > 0) {
      const call = pendingCalls.shift();
      injectCall(call.functionName, call.subdivisions);
    }
  }

  function injectCall(functionName, subdivisions = SUBDIVISIONS) {
    const safeFunctionName = JSON.stringify(functionName);
    const safeSubdivisions = Number(subdivisions);

    const script = document.createElement('script');

    script.textContent = `
      try {
        const functionName = ${safeFunctionName};
        const exportFunction = window[functionName];

        if (typeof exportFunction !== 'function') {
          throw new Error(
            'Herosaver function not found: window.' + functionName
          );
        }

        console.log(
          'Starting ' + functionName + '(' + ${safeSubdivisions} + ')'
        );

        exportFunction(${safeSubdivisions});

        console.log(
          'Finished ' + functionName + '(' + ${safeSubdivisions} + ')'
        );
      } catch (error) {
        console.error('Herosaver export failed:', error);
      }
    `;

    (document.head || document.documentElement).appendChild(script);
    script.remove();
  }

  function removeForeignSaveStlButtons() {
    const panel = document.getElementById('herosaver-panel');

    document
      .querySelectorAll(
        'button, a, [role="button"], input[type="button"], input[type="submit"]'
      )
      .forEach((element) => {
        if (panel && panel.contains(element)) return;

        const label = (
          element.textContent ||
          element.value ||
          ''
        ).trim();

        if (label === 'Save STL') {
          element.remove();
        }
      });
  }

  function makeButton(label, callback, primary) {
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

    button.addEventListener('click', callback);

    return button;
  }

  function injectPanel() {
    if (document.getElementById('herosaver-panel')) return;
    if (!document.body) return;

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

    panel.appendChild(
      makeButton(
        'Save STL',
        () => run('saveCleanStl', SUBDIVISIONS),
        true
      )
    );

    panel.appendChild(
      makeButton(
        'Save OBJ',
        () => run('saveObj', SUBDIVISIONS),
        false
      )
    );

    panel.appendChild(
      makeButton(
        'Save JSON',
        () => run('saveJson', SUBDIVISIONS),
        false
      )
    );

    document.body.appendChild(panel);
  }

  GM_registerMenuCommand('Herosaver: Save STL', () => {
    run('saveCleanStl', SUBDIVISIONS);
  });

  GM_registerMenuCommand('Herosaver: Save OBJ', () => {
    run('saveObj', SUBDIVISIONS);
  });

  GM_registerMenuCommand('Herosaver: Save JSON', () => {
    run('saveJson', SUBDIVISIONS);
  });

  function init() {
    injectPanel();
    removeForeignSaveStlButtons();

    [1000, 2500, 5000].forEach((delay) => {
      setTimeout(removeForeignSaveStlButtons, delay);
    });
  }

  if (document.body) {
    init();
  } else {
    window.addEventListener('DOMContentLoaded', init, { once: true });
  }
})();

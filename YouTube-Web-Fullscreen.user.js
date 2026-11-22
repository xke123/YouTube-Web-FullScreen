// ==UserScript==
// @name         YouTube Web Fullscreen
// @name:zh-CN   YouTube 网页化全屏
// @namespace    MaximizeVideo
// @version      18.0.0
// @description  Stable YouTube web fullscreen for Safari with native player button
// @match        https://www.youtube.com/*
// @run-at       document-idle
// @grant        none
// @inject-into  content
// ==/UserScript==

;(() => {
  'use strict';

  const INSTANCE = 'data-mv18-running';
  const BUTTON_ID = 'mv18-button';
  const STYLE_ID = 'mv18-style';
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const root = document.documentElement;

  // A shared DOM marker prevents duplicate page/content-world instances.
  if (root.hasAttribute(INSTANCE)) return;
  root.setAttribute(INSTANCE, '1');

  const state = {
    active: false,
    player: null,
    button: null,
    mountMode: '',
    mountedPlayer: null,
    forceFallback: false,
    hidden: new Set(),
    ancestors: new Set(),
    observer: null,
    timer: null,
    url: location.href,
    scrollX: 0,
    scrollY: 0,
  };

  const CSS = `
    html.mv18-active, body.mv18-active { overflow: hidden !important; }
    body.mv18-active .mv18-hidden { display: none !important; }
    body.mv18-active .mv18-ancestor {
      overflow: visible !important;
      transform: none !important;
      filter: none !important;
      perspective: none !important;
      contain: none !important;
      clip-path: none !important;
      will-change: auto !important;
    }
    #movie_player.mv18-player, .html5-video-player.mv18-player {
      position: fixed !important;
      inset: 0 !important;
      width: 100vw !important;
      height: 100vh !important;
      height: 100dvh !important;
      min-width: 0 !important;
      min-height: 0 !important;
      max-width: none !important;
      max-height: none !important;
      margin: 0 !important;
      padding: 0 !important;
      transform: none !important;
      border-radius: 0 !important;
      z-index: 2147483646 !important;
      background: #000 !important;
      overflow: hidden !important;
    }
    .mv18-player .html5-video-container {
      position: absolute !important;
      inset: 0 !important;
      width: 100% !important;
      height: 100% !important;
    }
    .mv18-player video.html5-main-video {
      position: absolute !important;
      inset: 0 !important;
      left: 0 !important;
      top: 0 !important;
      width: 100% !important;
      height: 100% !important;
      object-fit: contain !important;
    }
    #mv18-button {
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      box-sizing: border-box !important;
      width: 48px !important;
      min-width: 48px !important;
      height: 100% !important;
      padding: 0 !important;
      margin: 0 !important;
      border: 0 !important;
      border-radius: 0 !important;
      background: transparent !important;
      color: #fff !important;
      cursor: pointer !important;
      visibility: visible !important;
      flex-shrink: 0 !important;
      vertical-align: top !important;
    }
    #mv18-button:hover { color: #ddd !important; }
    #mv18-button:focus-visible {
      outline: 2px solid white !important;
      outline-offset: -3px !important;
    }
    #mv18-button svg {
      width: 24px !important;
      height: 24px !important;
      display: block !important;
      fill: none !important;
      stroke: currentColor !important;
      stroke-width: 1.8 !important;
      stroke-linecap: round !important;
      stroke-linejoin: round !important;
      pointer-events: none !important;
    }
    #mv18-button.mv18-fallback {
      position: absolute !important;
      top: 14px !important;
      right: 14px !important;
      width: 44px !important;
      min-width: 44px !important;
      height: 44px !important;
      border-radius: 8px !important;
      background: rgba(0,0,0,.82) !important;
      z-index: 2147483647 !important;
      pointer-events: auto !important;
    }
  `;

  function installStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = CSS;
    (document.head || root).appendChild(style);
  }

  // Build icons using DOM APIs, avoiding TrustedHTML restrictions.
  function createIcon(active) {
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');
    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', active
      ? 'M4 9h5V4 M20 9h-5V4 M4 15h5v5 M20 15h-5v5'
      : 'M9 4H4v5 M15 4h5v5 M4 15v5h5 M20 15v5h-5');
    svg.appendChild(path);
    return svg;
  }

  function isVideoPage() {
    return location.pathname === '/watch' ||
      location.pathname.startsWith('/live/');
  }

  function getPlayer() {
    if (!isVideoPage()) return null;
    const player = document.querySelector('#movie_player') ||
      document.querySelector('ytd-player .html5-video-player');
    return player?.isConnected ? player : null;
  }

  function updateButton() {
    const button = state.button;
    if (!button) return;
    const icon = state.active ? 'exit' : 'enter';
    if (button.dataset.icon !== icon) {
      button.replaceChildren(createIcon(state.active));
      button.dataset.icon = icon;
    }
    const label = state.active
      ? '退出网页全屏 (Alt+W)'
      : '网页全屏 (Alt+W)';
    if (button.title !== label) {
      button.title = label;
      button.setAttribute('aria-label', label);
    }
    button.setAttribute('aria-pressed', String(state.active));
  }

  function createButton() {
    const button = document.createElement('button');
    button.id = BUTTON_ID;
    button.type = 'button';
    button.className = 'ytp-button';
    for (const type of ['pointerdown', 'mousedown']) {
      button.addEventListener(type, event => event.stopPropagation());
    }
    button.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      toggle();
    });
    state.button = button;
    updateButton();
    return button;
  }

  function directChild(parent, descendant) {
    if (!parent || !descendant || !parent.contains(descendant)) return null;
    let node = descendant;
    while (node && node.parentElement !== parent) {
      node = node.parentElement;
    }
    return node?.parentElement === parent ? node : null;
  }

  function mountFallback(player) {
    const button = state.button || createButton();
    if (button.parentElement !== player) player.appendChild(button);
    button.classList.add('mv18-fallback');
    state.mountMode = 'fallback';
  }

  // Mount once per player. Do not continually reorder YouTube controls.
  function mountButton(player) {
    if (!player) return;
    if (state.mountedPlayer !== player) {
      state.mountedPlayer = player;
      state.forceFallback = false;
      state.mountMode = '';
    }
    const button = state.button || createButton();
    const controls = player.querySelector('.ytp-right-controls');
    if (state.mountMode === 'native' &&
        button.isConnected && controls?.contains(button)) return;
    if (state.mountMode === 'native' && !controls?.contains(button)) {
      state.forceFallback = true;
    }
    if (state.forceFallback || !controls) {
      mountFallback(player);
      return;
    }
    if (state.mountMode === 'fallback') {
      if (!button.isConnected) mountFallback(player);
      return;
    }
    try {
      const native = controls.querySelector('.ytp-fullscreen-button');
      const anchor = directChild(controls, native);
      if (anchor && anchor !== button) {
        controls.insertBefore(button, anchor);
      } else {
        controls.appendChild(button);
      }
      button.classList.remove('mv18-fallback');
      state.mountMode = 'native';
      console.info('[MV18] Button mounted in native controls');
    } catch (error) {
      console.warn('[MV18] Native mounting failed, using fallback', error);
      state.forceFallback = true;
      mountFallback(player);
    }
  }

  function isolate() {
    const player = state.player;
    if (!player?.isConnected) return;
    let current = player;
    while (current && current !== document.body) {
      const parent = current.parentElement;
      if (!parent) break;
      for (const sibling of parent.children) {
        if (sibling !== current &&
            !['SCRIPT', 'STYLE', 'LINK'].includes(sibling.tagName) &&
            !sibling.classList.contains('mv18-hidden')) {
          sibling.classList.add('mv18-hidden');
          state.hidden.add(sibling);
        }
      }
      if (parent !== document.body &&
          !parent.classList.contains('mv18-ancestor')) {
        parent.classList.add('mv18-ancestor');
        state.ancestors.add(parent);
      }
      current = parent;
    }
  }

  function restore() {
    for (const element of state.hidden) {
      element.classList.remove('mv18-hidden');
    }
    for (const element of state.ancestors) {
      element.classList.remove('mv18-ancestor');
    }
    state.hidden.clear();
    state.ancestors.clear();
  }

  function notifyResize() {
    window.dispatchEvent(new Event('resize'));
  }

  function enter() {
    if (state.active || document.fullscreenElement) return;
    const player = getPlayer();
    if (!player) return;
    state.player = player;
    state.scrollX = window.scrollX;
    state.scrollY = window.scrollY;
    isolate();
    root.classList.add('mv18-active');
    document.body.classList.add('mv18-active');
    player.classList.add('mv18-player');
    state.active = true;
    updateButton();
    notifyResize();
  }

  function exit(restoreScroll = true) {
    if (!state.active) return;
    state.player?.classList.remove('mv18-player');
    root.classList.remove('mv18-active');
    document.body.classList.remove('mv18-active');
    restore();
    state.active = false;
    state.player = null;
    updateButton();
    notifyResize();
    if (restoreScroll) {
      window.scrollTo(state.scrollX, state.scrollY);
    }
  }

  function toggle() {
    state.active ? exit() : enter();
  }

  function reconcile() {
    const url = location.href;
    if (url !== state.url) {
      state.url = url;
      if (state.active) exit(false);
    }
    if (!isVideoPage()) {
      if (state.active) exit(false);
      state.button?.remove();
      state.mountMode = '';
      state.mountedPlayer = null;
      return;
    }
    const player = getPlayer();
    if (!player) {
      if (state.active) exit(false);
      return;
    }
    if (state.active && state.player !== player) exit(false);
    if (state.active) isolate();
    mountButton(player);
  }

  function schedule(delay = 150) {
    if (state.timer !== null) return;
    state.timer = window.setTimeout(() => {
      state.timer = null;
      try {
        reconcile();
      } catch (error) {
        console.error('[MV18] Reconcile error:', error);
      }
    }, delay);
  }

  function handleKeydown(event) {
    if (event.key === 'Escape' && state.active) {
      exit();
      return;
    }
    const shortcut = event.altKey && !event.ctrlKey &&
      !event.metaKey && event.code === 'KeyW';
    if (!shortcut || !isVideoPage()) return;
    const target = event.target;
    if (target instanceof Element &&
        target.closest('input,textarea,select,[contenteditable="true"]')) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    toggle();
  }

  function init() {
    installStyle();
    state.observer = new MutationObserver(records => {
      const relevant = records.some(record => {
        if (record.type !== 'childList') return false;
        if (state.button &&
            (record.target === state.button ||
             state.button.contains(record.target))) return false;
        return record.addedNodes.length > 0 ||
          record.removedNodes.length > 0;
      });
      if (relevant) schedule();
    });
    state.observer.observe(root, { childList: true, subtree: true });
    document.addEventListener('keydown', handleKeydown, true);
    document.addEventListener('fullscreenchange', () => {
      if (document.fullscreenElement && state.active) exit(false);
    });
    document.addEventListener('yt-navigate-start', () => {
      if (state.active) exit(false);
    });
    document.addEventListener('yt-navigate-finish', () => schedule(0));
    document.addEventListener('yt-page-data-updated', () => schedule(0));
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) schedule(0);
    });
    window.setInterval(() => {
      if (!document.hidden) schedule(0);
    }, 3000);
    reconcile();
    console.info('[MV18] YouTube Web Fullscreen initialized');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();

(() => {
  if (!window.__ME_BACKEND__) return;
  window.__ME_VSCODE__ = true;

  const backend = window.__ME_BACKEND__;
  const originalFetchWithTimeout = window.fetchWithTimeout;

  function isExternalUrl(url) {
    return typeof url === 'string'
      && (url.startsWith('https://api.openai.com/')
        || url.startsWith('https://generativelanguage.googleapis.com/'));
  }

  function normalizeHeaders(headers) {
    if (!headers) return {};
    if (typeof headers.forEach === 'function') {
      const out = {};
      headers.forEach((value, key) => {
        out[String(key).toLowerCase()] = String(value);
      });
      return out;
    }
    if (Array.isArray(headers)) {
      const out = {};
      headers.forEach((pair) => {
        if (!pair || pair.length < 2) return;
        out[String(pair[0]).toLowerCase()] = String(pair[1]);
      });
      return out;
    }
    if (typeof headers === 'object') {
      const out = {};
      Object.entries(headers).forEach(([key, value]) => {
        if (typeof value === 'undefined') return;
        out[String(key).toLowerCase()] = String(value);
      });
      return out;
    }
    return {};
  }

  function buildResponse(payload) {
    const status = payload && Number.isFinite(payload.status) ? payload.status : 0;
    const statusText = payload && payload.statusText ? payload.statusText : '';
    const headers = payload && payload.headers ? payload.headers : {};
    const body = payload && typeof payload.body === 'string' ? payload.body : '';
    const headerMap = new Map();
    Object.entries(headers).forEach(([key, value]) => {
      headerMap.set(String(key).toLowerCase(), String(value));
    });
    return {
      ok: status >= 200 && status < 300,
      status,
      statusText,
      headers: {
        get: (name) => headerMap.get(String(name).toLowerCase()) || null
      },
      json: async () => {
        if (!body) return {};
        return JSON.parse(body);
      },
      text: async () => body
    };
  }

  function makeAbortError() {
    const err = new Error('The operation was aborted.');
    err.name = 'AbortError';
    return err;
  }

  if (typeof originalFetchWithTimeout === 'function') {
    window.fetchWithTimeout = (url, options = {}, timeoutMs = 0, timeoutState = null) => {
      if (!isExternalUrl(url)) {
        return originalFetchWithTimeout(url, options, timeoutMs, timeoutState);
      }

      const body = options.body;
      if (body && typeof body !== 'string') {
        return Promise.reject(new Error('Supporting file uploads are not supported in the VS Code extension yet.'));
      }

      const safeOptions = {
        method: options.method || 'GET',
        headers: normalizeHeaders(options.headers),
        body
      };

      let aborted = false;
      let timeoutId = null;
      const externalSignal = options.signal;
      let abortHandler = null;

      return new Promise((resolve, reject) => {
        let settled = false;
        const finishReject = (err) => {
          if (settled) return;
          settled = true;
          reject(err);
        };
        const finishResolve = (value) => {
          if (settled) return;
          settled = true;
          resolve(value);
        };

        const abortNow = (timedOut) => {
          if (aborted) return;
          aborted = true;
          if (timeoutState) timeoutState.timedOut = !!timedOut;
          finishReject(makeAbortError());
        };

        abortHandler = () => abortNow(false);

        if (externalSignal) {
          if (externalSignal.aborted) {
            abortNow(false);
            return;
          }
          externalSignal.addEventListener('abort', abortHandler, { once: true });
        }

        if (Number.isFinite(timeoutMs) && timeoutMs > 0) {
          timeoutId = setTimeout(() => abortNow(true), timeoutMs);
        }

        backend.request('http.fetch', {
          url,
          options: safeOptions,
          timeoutMs
        }).then((responsePayload) => {
          if (aborted) {
            return;
          }
          finishResolve(buildResponse(responsePayload));
        }).catch((err) => {
          if (aborted) {
            return;
          }
          finishReject(err);
        });
      }).finally(() => {
        if (timeoutId) clearTimeout(timeoutId);
        if (externalSignal && abortHandler) {
          externalSignal.removeEventListener('abort', abortHandler);
        }
      });
    };
  }

  function inferFormatFromVsCode(payload) {
    if (!payload) return '';
    const languageId = String(payload.languageId || '').toLowerCase();
    if (languageId.includes('latex')) return 'latex';
    if (languageId.includes('markdown')) return 'markdown';
    const uri = String(payload.uri || '').toLowerCase();
    if (uri.endsWith('.tex')) return 'latex';
    if (uri.endsWith('.md') || uri.endsWith('.markdown')) return 'markdown';
    return 'plain';
  }

  let lastLoadedUri = '';
  let lastLoadedVersion = null;
  let lastLoadedSelection = null;
  let lastObservedUri = '';
  let lastObservedVersion = null;
  let lastObservedSelection = null;

  async function loadFromVsCode(options = {}) {
    const silent = Boolean(options.silent);
    const force = Boolean(options.force);
    const input = document.getElementById('documentInput');
    try {
      const payload = await backend.request('editor.getActive');
      if (!payload || typeof payload.text !== 'string') {
        if (!silent) alert('No active editor text found in VS Code.');
        return false;
      }
      const incomingText = payload.text;
      const incomingUri = typeof payload.uri === 'string' ? payload.uri : '';
      const incomingVersion = Number.isInteger(payload.version) ? payload.version : null;
      const incomingSelection = payload && payload.selection && Number.isInteger(payload.selection.start) && Number.isInteger(payload.selection.end)
        ? { start: payload.selection.start, end: payload.selection.end }
        : null;
      // Track what VS Code has, even if we don't overwrite the webview.
      lastObservedUri = incomingUri || lastObservedUri;
      lastObservedVersion = incomingVersion !== null ? incomingVersion : lastObservedVersion;
      lastObservedSelection = incomingSelection || lastObservedSelection;

      if (!force && input && input.value && input.value.trim()) {
        return false;
      }
      lastLoadedUri = incomingUri;
      lastLoadedVersion = incomingVersion;
      lastLoadedSelection = incomingSelection && incomingSelection.end > incomingSelection.start
        ? incomingSelection
        : null;
      const format = inferFormatFromVsCode(payload);
      if (typeof window.__ME_VSCODE_IMPORT_TEXT__ === 'function') {
        window.__ME_VSCODE_IMPORT_TEXT__(incomingText, { format, source: payload.uri || '' });
      } else {
        if (input) input.value = incomingText;
      }
      return true;
    } catch (err) {
      const message = err && err.message ? err.message : String(err);
      if (!silent) alert(`Failed to load from VS Code: ${message}`);
      return false;
    }
  }

  async function applyToVsCode() {
    const input = document.getElementById('documentInput');
    if (!input) return;
    let text = String(input.value || '');

    // If the document is empty and no URI is tracked, try to pull from VS Code once.
    if ((!text || !text.trim()) && !lastLoadedUri) {
      const loaded = await loadFromVsCode({ silent: true });
      if (loaded) {
        text = String(input.value || '');
      }
    }

    if (!lastLoadedUri && (!text || !text.trim())) {
      alert('No document loaded. Use “Load from VS Code” first.');
      return;
    }

    try {
      const payload = { text };
      if (lastLoadedUri) {
        payload.uri = lastLoadedUri;
        if (lastLoadedVersion !== null) payload.version = lastLoadedVersion;
        if (lastLoadedSelection) payload.selection = lastLoadedSelection;
      } else {
        const proceed = window.confirm('No document loaded from VS Code yet. Apply will overwrite the currently active editor. Continue?');
        if (!proceed) return;
      }
      const result = await backend.request('editor.replaceAll', payload);
      return result && result.ok !== false;
    } catch (err) {
      const message = err && err.message ? err.message : String(err);
      alert(`Failed to apply to VS Code: ${message}`);
      return false;
    }
  }

  async function buildAndViewPdf() {
    try {
      const applied = await applyToVsCode();
      if (applied === false) return;
      const buildResult = await backend.request('latex.build');
      if (buildResult && buildResult.ok === false) return;
      await backend.request('latex.view');
    } catch (err) {
      const message = err && err.message ? err.message : String(err);
      alert(`LaTeX Workshop failed: ${message}`);
    }
  }

  function getOffsetFromPoint(rootEl, x, y) {
    if (!rootEl) return null;
    let node = null;
    let nodeOffset = 0;
    if (document.caretPositionFromPoint) {
      const pos = document.caretPositionFromPoint(x, y);
      if (!pos) return null;
      node = pos.offsetNode;
      nodeOffset = pos.offset;
    } else if (document.caretRangeFromPoint) {
      const range = document.caretRangeFromPoint(x, y);
      if (!range) return null;
      node = range.startContainer;
      nodeOffset = range.startOffset;
    } else {
      return null;
    }
    const walker = document.createTreeWalker(rootEl, NodeFilter.SHOW_TEXT);
    let acc = 0;
    let cur;
    while ((cur = walker.nextNode())) {
      const len = cur.nodeValue ? cur.nodeValue.length : 0;
      if (cur === node) {
        return acc + nodeOffset;
      }
      acc += len;
    }
    return null;
  }

  function findTextNodeAtOffset(rootEl, targetOffset) {
    if (!rootEl || targetOffset < 0) return null;
    const walker = document.createTreeWalker(rootEl, NodeFilter.SHOW_TEXT);
    let acc = 0;
    let node;
    while ((node = walker.nextNode())) {
      const len = node.nodeValue ? node.nodeValue.length : 0;
      if (acc + len >= targetOffset) {
        return { node, localOffset: targetOffset - acc };
      }
      acc += len;
    }
    return null;
  }

  function scrollToOffset(offset) {
    const overlay = document.getElementById('highlightOverlay');
    if (!overlay) return;
    const total = overlay.textContent ? overlay.textContent.length : 0;
    const clamped = Math.max(0, Math.min(offset, total));
    const loc = findTextNodeAtOffset(overlay, clamped);
    if (!loc || !loc.node) return;
    const range = document.createRange();
    range.setStart(loc.node, loc.localOffset);
    range.collapse(true);
    const marker = document.createElement('span');
    marker.className = 'me-sync-marker';
    marker.textContent = '\u200b';
    range.insertNode(marker);
    marker.scrollIntoView({ block: 'center' });
    marker.remove();
    overlay.normalize();
  }

  function handleSyncClick(event) {
    if (!event.altKey) return; // Alt/Option-click only to avoid clobbering editor gestures
    if (!lastLoadedUri) return;
    const root = document.getElementById('highlightOverlay');
    const offset = getOffsetFromPoint(root, event.clientX, event.clientY);
    if (offset === null || offset === undefined) return;
    event.preventDefault();
    event.stopPropagation();
    backend.request('sync.toPdf', { uri: lastLoadedUri, offset }).catch((err) => {
      console.warn('Sync to PDF failed:', err);
    });
  }

  window.addEventListener('DOMContentLoaded', () => {
    const loadBtn = document.getElementById('vscodeLoadBtn');
    if (loadBtn) loadBtn.addEventListener('click', () => loadFromVsCode({ force: true }));

    const applyBtn = document.getElementById('vscodeApplyBtn');
    if (applyBtn) applyBtn.addEventListener('click', applyToVsCode);

    const latexBtn = document.getElementById('latexBuildViewBtn');
    if (latexBtn) latexBtn.addEventListener('click', buildAndViewPdf);

    // Best-effort auto-load of the active VS Code document on startup to avoid sample text overwrites.
    // If we have no loaded URI yet, try to pull the last observed (fallback to active editor).
    void loadFromVsCode({ silent: true, force: true });

    // When returning to the tab, if it's empty, try to reload the active VS Code document silently.
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        const input = document.getElementById('documentInput');
        const hasContent = input && input.value && input.value.trim();
        if (!hasContent) {
          void loadFromVsCode({ silent: true, force: true });
        }
      }
    });

    const overlay = document.getElementById('highlightOverlay');
    if (overlay) {
      overlay.addEventListener('click', handleSyncClick, true);
    }
    const input = document.getElementById('documentInput');
    if (input) {
      input.addEventListener('click', handleSyncClick, true);
    }
  });

  window.addEventListener('message', (event) => {
    const msg = event.data;
    if (!msg || msg.type !== 'sync.revealInModernEditor') return;
    const { uri, offset } = msg.payload || {};
    if (!uri || uri !== lastLoadedUri) return;
    if (!Number.isFinite(offset)) return;
    scrollToOffset(offset);
  });
})();

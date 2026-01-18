(() => {
  if (typeof acquireVsCodeApi !== 'function') return;
  const vscode = acquireVsCodeApi();
  const pending = new Map();
  const DEFAULT_TIMEOUT_MS = 0; // 0 = no timeout; use per-request timeouts instead if needed

  function makeId() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return `req_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  }

  function request(type, payload, options = {}) {
    const requestId = makeId();
    const timeoutMs = Number.isFinite(options.timeoutMs) ? options.timeoutMs : DEFAULT_TIMEOUT_MS;
    vscode.postMessage({ requestId, type, payload });
    return new Promise((resolve, reject) => {
      let timeoutId = null;
      if (timeoutMs > 0) {
        timeoutId = setTimeout(() => {
          pending.delete(requestId);
          reject(new Error('Request timed out.'));
        }, timeoutMs);
      }
      pending.set(requestId, { resolve, reject, timeoutId });
    });
  }

  window.addEventListener('message', (event) => {
    const msg = event.data;
    if (!msg || !msg.requestId) return;
    const entry = pending.get(msg.requestId);
    if (!entry) return;
    pending.delete(msg.requestId);
    if (entry.timeoutId) clearTimeout(entry.timeoutId);
    if (msg.ok) {
      entry.resolve(msg.result);
    } else {
      entry.reject(msg.error || { message: 'Unknown error' });
    }
  });

  window.__ME_BACKEND__ = {
    request,
    log: (level, message) => request('log', { level, message }).catch(() => {})
  };
})();

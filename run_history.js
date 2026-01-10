(function () {
  const DB_NAME = 'modernEditorRunHistory';
  const DB_VERSION = 1;
  const STORE_NAME = 'runs';
  let dbPromise = null;

  function openDb() {
    if (!('indexedDB' in window)) {
      return Promise.reject(new Error('IndexedDB not available'));
    }
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
          store.createIndex('createdAt', 'createdAt', { unique: false });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error('IndexedDB open failed'));
    });
    return dbPromise;
  }

  function addEntry(entry, options = {}) {
    if (!entry || typeof entry !== 'object') return Promise.resolve(false);
    const maxEntries = Number.isFinite(options.maxEntries) ? options.maxEntries : 200;
    return openDb()
      .then((db) => new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.add({ ...entry, createdAt: Date.now() });
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => reject(tx.error || new Error('IndexedDB add failed'));
      }))
      .then(() => prune(maxEntries))
      .catch((err) => {
        console.warn('Run history add failed:', err);
        return false;
      });
  }

  function prune(maxEntries) {
    if (!Number.isFinite(maxEntries) || maxEntries < 1) return Promise.resolve(false);
    return openDb()
      .then((db) => new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const keysReq = store.getAllKeys();
        keysReq.onsuccess = () => {
          const keys = keysReq.result || [];
          if (keys.length > maxEntries) {
            const toDelete = keys.slice(0, keys.length - maxEntries);
            toDelete.forEach((key) => store.delete(key));
          }
        };
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => reject(tx.error || new Error('IndexedDB prune failed'));
      }))
      .catch((err) => {
        console.warn('Run history prune failed:', err);
        return false;
      });
  }

  function getRecent(limit = 5) {
    if (!Number.isFinite(limit) || limit < 1) return Promise.resolve([]);
    return openDb()
      .then((db) => new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const index = store.index('createdAt');
        const results = [];
        const request = index.openCursor(null, 'prev');
        request.onsuccess = () => {
          const cursor = request.result;
          if (!cursor || results.length >= limit) {
            resolve(results);
            return;
          }
          results.push(cursor.value);
          cursor.continue();
        };
        request.onerror = () => reject(request.error || new Error('IndexedDB read failed'));
      }))
      .catch((err) => {
        console.warn('Run history read failed:', err);
        return [];
      });
  }

  function clear() {
    return openDb()
      .then((db) => new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.clear();
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => reject(tx.error || new Error('IndexedDB clear failed'));
      }))
      .catch((err) => {
        console.warn('Run history clear failed:', err);
        return false;
      });
  }

  window.runHistoryStore = {
    addEntry,
    getRecent,
    clear
  };
})();

const vscode = require('vscode');
const path = require('path');
const fs = require('fs');

let currentPanel = null;
let outputChannel = null;
let lastActiveEditor = null;
let lastActiveDocumentUri = null;
let logger = null;
let suppressSelectionPushUntil = 0;

const SECRET_KEYS = {
  openai: 'modernEditor.openaiApiKey',
  gemini: 'modernEditor.geminiApiKey'
};
const ALLOWED_SECRET_KEYS = new Set(Object.values(SECRET_KEYS));

function createLogger() {
  const channel = outputChannel;
  const getDebug = () => {
    try {
      return vscode.workspace.getConfiguration('modernEditor').get('debugLogging', false);
    } catch (_) {
      return false;
    }
  };

  const write = (level, message) => {
    if (!channel) return;
    const stamp = new Date().toISOString();
    channel.appendLine(`[${stamp}] [${level}] ${message}`);
  };

  return {
    info: (message) => write('info', message),
    warn: (message) => write('warn', message),
    error: (message) => write('error', message),
    debug: (message) => {
      if (getDebug()) write('debug', message);
    }
  };
}

function requireSecretStorage(secrets) {
  if (!secrets || typeof secrets.get !== 'function') {
    throw new Error('Secret storage unavailable.');
  }
  return secrets;
}

function requireSecretKey(payload) {
  const key = payload && typeof payload.key === 'string' ? payload.key.trim() : '';
  if (!ALLOWED_SECRET_KEYS.has(key)) {
    throw new Error('Unknown secret key.');
  }
  return key;
}

function getWebviewHtml(context, webview) {
  const templatePath = path.join(context.extensionPath, 'media', 'index.vscode.html');
  const template = fs.readFileSync(templatePath, 'utf8');
  const baseUri = webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'media')).toString();
  const cspSource = webview.cspSource;
  return template
    .replace(/\{\{baseUri\}\}/g, baseUri)
    .replace(/\{\{cspSource\}\}/g, cspSource);
}

function isAllowedUrl(url) {
  if (typeof url !== 'string') return false;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') return false;
    const host = parsed.hostname.toLowerCase();
    return host === 'api.openai.com'
      || host === 'generativelanguage.googleapis.com';
  } catch (_) {
    return false;
  }
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
    for (const pair of headers) {
      if (!pair || pair.length < 2) continue;
      out[String(pair[0]).toLowerCase()] = String(pair[1]);
    }
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

function trackActiveEditor(editor, log) {
  if (!editor || !editor.document) return;
  lastActiveEditor = editor;
  lastActiveDocumentUri = editor.document.uri;
  const sink = log || logger;
  if (sink) sink.debug(`Tracked active editor: ${editor.document.uri.toString()}`);
}

async function resolveEditor(log) {
  const active = vscode.window.activeTextEditor;
  if (active) {
    trackActiveEditor(active, log);
    return active;
  }
  if (lastActiveDocumentUri) {
    try {
      const doc = await vscode.workspace.openTextDocument(lastActiveDocumentUri);
      const editor = await vscode.window.showTextDocument(doc, { preview: false });
      trackActiveEditor(editor, log);
      return editor;
    } catch (err) {
      const sink = log || logger;
      if (sink) sink.warn(`Failed to reopen last active editor: ${err.message || String(err)}`);
    }
  }
  if (lastActiveEditor && lastActiveEditor.document && !lastActiveEditor.document.isClosed) {
    return lastActiveEditor;
  }
  return null;
}

async function openEditorForUri(uriString, log) {
  if (!uriString) return null;
  try {
    const uri = vscode.Uri.parse(uriString);
    const doc = await vscode.workspace.openTextDocument(uri);
    const editor = await vscode.window.showTextDocument(doc, { preview: false });
    trackActiveEditor(editor, log);
    return editor;
  } catch (err) {
    const sink = log || logger;
    if (sink) sink.warn(`Failed to open target URI ${uriString}: ${err.message || String(err)}`);
    throw new Error('Could not open target document.');
  }
}

async function handleHttpFetch(payload, log) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Invalid payload.');
  }
  const url = payload.url;
  if (!isAllowedUrl(url)) {
    throw new Error('Blocked request: URL not allowlisted.');
  }

  const options = payload.options && typeof payload.options === 'object' ? payload.options : {};
  const method = options.method || 'GET';
  const headers = normalizeHeaders(options.headers);
  const redirect = 'error';

  let body = undefined;
  if (options && typeof options === 'object' && options.multipart) {
    const multipart = options.multipart;
    const formData = new FormData();
    const fields = multipart.fields && typeof multipart.fields === 'object' ? multipart.fields : {};
    Object.entries(fields).forEach(([key, value]) => {
      if (typeof value === 'undefined' || value === null) return;
      formData.append(key, String(value));
    });
    const files = Array.isArray(multipart.files) ? multipart.files : [];
    files.forEach((file) => {
      if (!file || !file.dataBase64 || !file.fieldName) return;
      const bytes = Buffer.from(String(file.dataBase64), 'base64');
      const blob = new Blob([bytes], { type: file.contentType || 'application/octet-stream' });
      formData.append(file.fieldName, blob, file.filename || 'file');
    });
    delete headers['content-type'];
    body = formData;
  } else if (typeof options.body === 'string') {
    body = options.body;
  } else if (typeof options.body === 'undefined' || options.body === null) {
    body = undefined;
  } else {
    throw new Error('Unsupported request body type.');
  }

  const timeoutMs = Number.isFinite(payload.timeoutMs) ? payload.timeoutMs : 0;
  const controller = new AbortController();
  const timer = timeoutMs > 0
    ? setTimeout(() => controller.abort(), timeoutMs)
    : null;

  log.debug(`HTTP fetch: ${method} ${url}`);

  try {
    const response = await fetch(url, {
      method,
      headers,
      body,
      redirect,
      signal: controller.signal
    });
    const responseText = await response.text();
    const responseHeaders = {};
    response.headers.forEach((value, key) => {
      responseHeaders[String(key).toLowerCase()] = String(value);
    });

    return {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      body: responseText
    };
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function handleEditorGetActive(log) {
  // Avoid stealing focus: use the current active editor if present, otherwise
  // load the last active document without revealing it.
  const active = vscode.window.activeTextEditor;
  if (active && active.document) {
    trackActiveEditor(active, log);
    return {
      uri: active.document.uri.toString(),
      languageId: active.document.languageId,
      text: active.document.getText(),
      version: active.document.version,
      selection: active.selection
        ? {
            start: active.document.offsetAt(active.selection.start),
            end: active.document.offsetAt(active.selection.end)
          }
        : null
    };
  }

  if (lastActiveDocumentUri) {
    try {
      const doc = await vscode.workspace.openTextDocument(lastActiveDocumentUri);
      return {
        uri: doc.uri.toString(),
        languageId: doc.languageId,
        text: doc.getText(),
        version: doc.version,
        selection: null
      };
    } catch (err) {
      log.warn(`Failed to load last active document for snapshot: ${err.message || String(err)}`);
    }
  }

  return null;
}

async function handleEditorReplaceAll(payload, log) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Invalid payload.');
  }
  const text = typeof payload.text === 'string' ? payload.text : '';
  const targetUri = typeof payload.uri === 'string' ? payload.uri : '';
  const expectedVersion = Number.isInteger(payload.version) ? payload.version : null;
  const selection = payload && typeof payload.selection === 'object' ? payload.selection : null;

  if (typeof text !== 'string') {
    throw new Error('Invalid text payload.');
  }

  let editor = null;
  if (targetUri) {
    editor = await openEditorForUri(targetUri, log);
  } else {
    editor = await resolveEditor(log);
    if (editor) {
      await vscode.window.showTextDocument(editor.document, { preview: false, preserveFocus: true });
    }
  }

  if (!editor) throw new Error('No active editor available.');
  if (expectedVersion !== null && editor.document.version !== expectedVersion) {
    throw new Error('Document changed in VS Code; reload before applying.');
  }
  let targetRange = null;
  if (selection && Number.isInteger(selection.start) && Number.isInteger(selection.end) && selection.end > selection.start) {
    const start = Math.max(0, Math.min(selection.start, editor.document.getText().length));
    const end = Math.max(start, Math.min(selection.end, editor.document.getText().length));
    targetRange = new vscode.Range(
      editor.document.positionAt(start),
      editor.document.positionAt(end)
    );
  } else {
    targetRange = new vscode.Range(
      editor.document.positionAt(0),
      editor.document.positionAt(editor.document.getText().length)
    );
  }
  const edit = new vscode.WorkspaceEdit();
  edit.replace(editor.document.uri, targetRange, text);
  const applied = await vscode.workspace.applyEdit(edit);
  if (!applied) throw new Error('Failed to apply edits.');
  return { ok: true };
}

async function pickSynctexCommandId() {
  try {
    const commands = await vscode.commands.getCommands(true);
    if (commands.includes('latex-workshop.synctex')) return 'latex-workshop.synctex';
    const fallback = commands.find((cmd) => /synctex/i.test(cmd));
    return fallback || null;
  } catch (err) {
    logger?.warn(`Failed to enumerate commands: ${err.message || String(err)}`);
    return null;
  }
}

async function handleSyncToPdf(payload, log) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Invalid payload.');
  }
  const uriString = typeof payload.uri === 'string' && payload.uri ? payload.uri : (lastActiveDocumentUri ? lastActiveDocumentUri.toString() : '');
  if (!uriString) throw new Error('No document URI provided.');
  const offset = Number(payload.offset);
  if (!Number.isFinite(offset) || offset < 0) throw new Error('Invalid offset.');

  const synctexCommand = await pickSynctexCommandId();
  if (!synctexCommand) {
    throw new Error('LaTeX Workshop SyncTeX command not found. Open the PDF once or ensure LaTeX Workshop is installed.');
  }

  const doc = await vscode.workspace.openTextDocument(vscode.Uri.parse(uriString));
  const editor = await vscode.window.showTextDocument(doc, { preview: false, preserveFocus: true });
  const clampedOffset = Math.min(offset, doc.getText().length);
  const pos = doc.positionAt(clampedOffset);
  const range = new vscode.Range(pos, pos);
  editor.selection = new vscode.Selection(pos, pos);
  editor.revealRange(range, vscode.TextEditorRevealType.InCenter);
  suppressSelectionPushUntil = Date.now() + 500;
  try {
    await vscode.commands.executeCommand(synctexCommand);
  } finally {
    if (currentPanel) {
      currentPanel.reveal(currentPanel.viewColumn, true);
    }
  }
  return { ok: true };
}

async function handleLatexBuild(log) {
  const editor = await resolveEditor(log);
  if (!editor) {
    void vscode.window.showWarningMessage('Open a LaTeX document to compile.');
    throw new Error('No active editor available.');
  }
  try {
    await vscode.window.showTextDocument(editor.document, { preview: false, preserveFocus: true });
    await vscode.commands.executeCommand('latex-workshop.build');
    return { ok: true };
  } catch (err) {
    void vscode.window.showErrorMessage('Could not run LaTeX Workshop build command.');
    throw err;
  }
}

async function handleLatexView(log) {
  const editor = await resolveEditor(log);
  if (!editor) {
    void vscode.window.showWarningMessage('Open a LaTeX document to view.');
    throw new Error('No active editor available.');
  }
  try {
    await vscode.window.showTextDocument(editor.document, { preview: false, preserveFocus: true });
    await vscode.commands.executeCommand('latex-workshop.view');
    return { ok: true };
  } catch (err) {
    void vscode.window.showErrorMessage('Could not run LaTeX Workshop view command.');
    throw err;
  }
}

async function handleLatexCompile(log) {
  const editor = await resolveEditor(log);
  if (!editor) {
    void vscode.window.showWarningMessage('Open a LaTeX document to compile.');
    throw new Error('No active editor available.');
  }

  const config = vscode.workspace.getConfiguration('modernEditor');
  const viewMode = config.get('compile.viewMode', 'viewInternal');
  const refocus = config.get('compile.refocusAfterView', false);

  const showDoc = async () => {
    await vscode.window.showTextDocument(editor.document, { preview: false, preserveFocus: true });
  };

  try {
    await showDoc();
    await vscode.commands.executeCommand('latex-workshop.build');

    if (viewMode === 'buildOnly') {
      return { ok: true };
    }

    let viewCommand = 'latex-workshop.view';
    if (viewMode === 'viewExternal') {
      viewCommand = 'latex-workshop.viewExternal';
    }

    try {
      await showDoc();
      await vscode.commands.executeCommand(viewCommand);
    } catch (err) {
      if (viewMode === 'viewExternal' && viewCommand !== 'latex-workshop.view') {
        await vscode.commands.executeCommand('latex-workshop.view');
      } else {
        throw err;
      }
    }

    if (refocus && currentPanel) {
      currentPanel.reveal(currentPanel.viewColumn, true);
    }
    return { ok: true };
  } catch (err) {
    void vscode.window.showErrorMessage('Could not run LaTeX Workshop commands.');
    throw err;
  }
}

async function handleSecretGet(payload, log, secrets) {
  const store = requireSecretStorage(secrets);
  const key = requireSecretKey(payload);
  log.debug(`Secret get: ${key}`);
  const value = await store.get(key);
  return value || '';
}

async function handleSecretSet(payload, log, secrets) {
  const store = requireSecretStorage(secrets);
  const key = requireSecretKey(payload);
  const value = payload && typeof payload.value === 'string' ? payload.value : '';
  if (!value) {
    await store.delete(key);
    log.debug(`Secret cleared: ${key}`);
    return { ok: true };
  }
  await store.store(key, value);
  log.debug(`Secret stored: ${key}`);
  return { ok: true };
}

async function handleSecretDelete(payload, log, secrets) {
  const store = requireSecretStorage(secrets);
  const key = requireSecretKey(payload);
  await store.delete(key);
  log.debug(`Secret deleted: ${key}`);
  return { ok: true };
}

async function routeMessage(type, payload, log, secrets) {
  if (!type) throw new Error('Message type required.');
  switch (type) {
    case 'http.fetch':
      return handleHttpFetch(payload, log);
    case 'editor.getActive':
      return handleEditorGetActive(log);
    case 'editor.replaceAll':
      return handleEditorReplaceAll(payload, log);
    case 'sync.toPdf':
      return handleSyncToPdf(payload, log);
    case 'latex.build':
      return handleLatexBuild(log);
    case 'latex.view':
      return handleLatexView(log);
    case 'latex.compile':
      return handleLatexCompile(log);
    case 'secrets.get':
      return handleSecretGet(payload, log, secrets);
    case 'secrets.set':
      return handleSecretSet(payload, log, secrets);
    case 'secrets.delete':
      return handleSecretDelete(payload, log, secrets);
    case 'log':
      if (payload && payload.level && payload.message) {
        const level = String(payload.level).toLowerCase();
        if (level === 'debug') log.debug(payload.message);
        else if (level === 'warn') log.warn(payload.message);
        else if (level === 'error') log.error(payload.message);
        else log.info(payload.message);
      }
      return { ok: true };
    default:
      throw new Error(`Unknown message type: ${type}`);
  }
}

function activate(context) {
  outputChannel = vscode.window.createOutputChannel('Modern Editor');
  const log = createLogger();
  logger = log;
  context.subscriptions.push(outputChannel);
  trackActiveEditor(vscode.window.activeTextEditor, log);

  context.subscriptions.push(
    vscode.commands.registerCommand('modernEditor.showLogs', () => {
      outputChannel.show(true);
    })
  );

  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (!editor) return;
      trackActiveEditor(editor, log);
    })
  );

  const pushSelectionToWebview = (() => {
    let timer = null;
    return (editor) => {
      if (!currentPanel) return;
      if (!editor || !editor.document) return;
      if (Date.now() < suppressSelectionPushUntil) return;
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        const active = editor.selection && editor.selection.active;
        if (!active) return;
        const offset = editor.document.offsetAt(active);
        currentPanel.webview.postMessage({
          type: 'sync.revealInModernEditor',
          payload: {
            uri: editor.document.uri.toString(),
            offset,
            line: active.line,
            character: active.character
          }
        });
        const config = vscode.workspace.getConfiguration('modernEditor');
        const behavior = config.get('sync.reverseFocusBehavior', 'none');
        const legacyRefocus = config.get('sync.refocusAfterReverse', false);
        const focusMode = behavior || 'none';
        const shouldRefocusModernEditor = focusMode === 'modernEditor' || (focusMode === 'none' && legacyRefocus);
        const shouldFocusPdf = focusMode === 'pdf';
        if (shouldRefocusModernEditor && currentPanel) {
          const column = currentPanel.viewColumn ?? editor.viewColumn ?? vscode.ViewColumn.Active;
          currentPanel.reveal(column, false);
        } else if (shouldFocusPdf) {
          void vscode.commands.executeCommand('latex-workshop.view').catch((err) => {
            logger?.warn(`Failed to refocus PDF after reverse sync: ${err?.message || String(err)}`);
          });
        }
      }, 75);
    };
  })();

  context.subscriptions.push(
    vscode.commands.registerCommand('modernEditor.open', () => {
      trackActiveEditor(vscode.window.activeTextEditor, log);
      const activeEditor = vscode.window.activeTextEditor;
      const targetColumn = activeEditor && activeEditor.viewColumn
        ? activeEditor.viewColumn
        : vscode.ViewColumn.One;
      const retainContext = vscode.workspace.getConfiguration('modernEditor')
        .get('retainContextWhenHidden', true);
      if (currentPanel) {
        currentPanel.reveal(currentPanel.viewColumn ?? targetColumn);
        return;
      }

      const panel = vscode.window.createWebviewPanel(
        'modernEditor',
        'Modern Editor',
        targetColumn,
        {
          enableScripts: true,
          retainContextWhenHidden: retainContext,
          localResourceRoots: [
            vscode.Uri.joinPath(context.extensionUri, 'media')
          ]
        }
      );

      currentPanel = panel;
      panel.webview.html = getWebviewHtml(context, panel.webview);

      panel.onDidDispose(() => {
        currentPanel = null;
      }, null, context.subscriptions);

      panel.webview.onDidReceiveMessage(async (msg) => {
        const requestId = msg && msg.requestId;
        const type = msg && msg.type;
        if (!requestId || !type) return;
        try {
          const result = await routeMessage(type, msg.payload, log, context.secrets);
          panel.webview.postMessage({ requestId, ok: true, result });
        } catch (err) {
          const message = err && err.message ? err.message : String(err);
          log.warn(`Message failed (${type}): ${message}`);
          panel.webview.postMessage({ requestId, ok: false, error: { message } });
        }
      });

      log.info('Modern Editor webview opened.');
    })
  );

  context.subscriptions.push(
    vscode.window.onDidChangeTextEditorSelection((event) => {
      if (!event || !event.textEditor) return;
      pushSelectionToWebview(event.textEditor);
    })
  );
}

function deactivate() {}

module.exports = {
  activate,
  deactivate
};

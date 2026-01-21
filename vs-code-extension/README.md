# Modern Editor (VS Code)

Private/local VS Code extension that hosts Modern Editor in a webview.

You have direct access to the modern editor in the browser at
https://slauerma.github.io/Modern-Editor-w-Import/

## Installation options

Requires LaTeX Workshop and a working LaTeX toolchain in VS Code.

**VSIX (recommended)**
1) Build or grab `modern-editor-vscode-0.1.0.vsix`.
2) Install via Extensions → “Install from VSIX…”.
3) Open a `.tex` file in VS Code, then run `Modern Editor: Open` from the Command Palette.

**Dev run (for debugging)**
1) Open the `vs-code/` folder in VS Code.
2) Start debugging (press `F5`) to launch the Extension Development Host.
3) In that host, run `Modern Editor: Open` from the Command Palette.

## Usage basics

1. Keep a `.tex` file open in VS Code. Use “Load from VS Code” (sidebar button or File menu) to pull the active file, version, and selection.
2. Edit in the webview. “Apply to VS Code” respects the loaded version/selection to avoid clobbering editor changes.
3. “Save & Compile” applies changes, then runs LaTeX Workshop build/view. It overwrites the loaded VS Code document (no prompt once loaded). By default VS Code focuses the LaTeX/PDF tab; optional refocus is available via settings below.
4. SyncTeX: Alt/Option+click in the webview to forward-sync to the PDF; reverse sync is Cmd/Ctrl+click in the PDF viewer (handled by LaTeX Workshop). Optional refocus back to Modern Editor is available via settings.

## Settings (VS Code)

- `modernEditor.compile.viewMode`: `buildOnly`, `viewInternal`, or `viewExternal` (default `viewInternal`).
- `modernEditor.compile.refocusAfterView`: bring Modern Editor back after the view step (default `false`).
- `modernEditor.sync.reverseFocusBehavior`: after reverse SyncTeX, choose `none` (stay in source), `modernEditor` (focus webview), or `pdf` (return to PDF). Legacy `sync.refocusAfterReverse` is honored when behavior is `none`.
- `modernEditor.retainContextWhenHidden`: keep the webview alive when hidden (default `true`).
- `modernEditor.debugLogging`: verbose logging (default `false`).

## Notes

- All extension assets live under `vs-code/`.
- Webview assets are under `vs-code/media/`.
- Logging goes to the "Modern Editor" Output channel.
- Supporting file uploads are not yet supported in the VS Code extension.
- Load/apply from VS Code via the sidebar button or the hamburger/File menu.
- LaTeX Workshop integration: “Save & Compile” applies the webview text, then runs `latex-workshop.build` followed by `latex-workshop.view`.
- HTTP allowlist: only `https://api.openai.com` and `https://generativelanguage.googleapis.com`, with string request bodies. Other endpoints or multipart uploads are blocked in the VS Code extension.
- External key scripts may be blocked by the VS Code webview CSP unless packaged as webview resources.

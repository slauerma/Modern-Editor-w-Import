# Modern Editor (VS Code)

Private/local VS Code extension that hosts Modern Editor in a webview.

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
3. “Save & Compile” applies changes, then runs LaTeX Workshop build/view. For now VS Code will switch to the LaTeX/PDF tab; you need to manually go back to Modern Editor afterward.
4. SyncTeX: Alt/Option+click in the webview to forward-sync to the PDF; reverse sync remains Cmd/Ctrl+click in the PDF viewer (handled by LaTeX Workshop).

## Notes

- All extension assets live under `vs-code/`.
- Webview assets are under `vs-code/media/`.
- Logging goes to the "Modern Editor" Output channel.
- Supporting file uploads are not yet supported in the VS Code extension.
- Load/apply from VS Code via the sidebar button or the hamburger/File menu.
- LaTeX Workshop integration: “Save & Compile” applies the webview text, then runs `latex-workshop.build` followed by `latex-workshop.view`.


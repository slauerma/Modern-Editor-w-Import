# Modern Editor (VS Code)

Private/local VS Code extension that hosts Modern Editor in a webview.

## Install (VSIX)

1. Build or grab `modern-editor-vscode-0.1.0.vsix`.
2. Install via Extensions → “Install from VSIX…” (or `code --install-extension modern-editor-vscode-0.1.0.vsix`).
3. Open a `.tex` file in VS Code, then run `Modern Editor: Open` from the Command Palette.
4. Use the sidebar “Load from VS Code” button (or File menu) to pull the active `.tex`; “Apply” respects version/selection to avoid clobbering VS Code edits.

## Dev run

1. Open the `vs-code/` folder in VS Code.
2. Start debugging (press `F5`) to launch the Extension Development Host.
3. In the Extension Development Host window, run `Modern Editor: Open` from the Command Palette.
4. Use “Load from VS Code” (sidebar or File menu) to pull the active `.tex` plus its version and selection; “Apply” respects that version/selection to avoid overwriting changes made in VS Code.
5. “Save & Compile” applies, then runs LaTeX Workshop build/view; focus is preserved where possible, but the LaTeX/PDF tab may still focus briefly during build/view.

## Notes

- All extension assets live under `vs-code/`.
- Webview assets are under `vs-code/media/`.
- Logging goes to the "Modern Editor" Output channel.
- Supporting file uploads are not yet supported in the VS Code extension.
- Load/apply from VS Code via the sidebar button or the hamburger/File menu.
- LaTeX Workshop integration: “Save & Compile” applies the webview text, then runs `latex-workshop.build` followed by `latex-workshop.view` (focus is preserved when possible; the LaTeX/PDF tab may briefly focus during compile/view).
- SyncTeX: Alt/Option+click inside the Modern Editor webview to forward-sync to the PDF; LaTeX Workshop will open/focus the LaTeX/PDF tabs during sync. Cmd/Ctrl+Click is reserved for the PDF viewer’s reverse sync (PDF → source).

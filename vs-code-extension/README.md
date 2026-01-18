# Modern Editor (VS Code)

Private/local VS Code extension that hosts Modern Editor in a webview.

## Dev run

1. Open the `vs-code/` folder in VS Code.
2. Start debugging (press `F5`) to launch the Extension Development Host.
3. In the Extension Development Host window, run `Modern Editor: Open` from the Command Palette.
4. “Load from VS Code” brings over the active file plus its version and selection; “Apply” respects that version/selection to avoid overwriting changes made in VS Code.
5. “Save & Compile” applies, then runs LaTeX Workshop build/view; focus is preserved where possible, but the LaTeX/PDF tab may still focus briefly during build/view.

## Notes

- All extension assets live under `vs-code/`.
- Webview assets are under `vs-code/media/`.
- Logging goes to the "Modern Editor" Output channel.
- Supporting file uploads are not yet supported in the VS Code extension.
- Use the hamburger menu to “Load from VS Code” / “Apply to VS Code”.
- LaTeX Workshop integration: “Save & Compile” applies the webview text, then runs `latex-workshop.build` followed by `latex-workshop.view` (focus is preserved when possible; the LaTeX/PDF tab may briefly focus during compile/view).
- SyncTeX: Alt/Option+click inside the Modern Editor webview to forward-sync to the PDF; LaTeX Workshop will open/focus the LaTeX/PDF tabs during sync. Cmd/Ctrl+Click is reserved for the PDF viewer’s reverse sync (PDF → source).

# ModernEditor (OpenAI GPT-5 port, MIT)

![ModernEditor screenshot](./shot.jpg)

Original: Kevin Bryan (July 2025)  
Port/maintainer: Stephan Lauermann  

ModernEditor is a browser-based editor for LaTeX/Markdown/plain text with inline GPT-assisted editing using the OpenAI GPT family and Gemini. It runs grammar, style, simplification, and proof checks; it can also run Python to check math and search the web when enabled under GPT. You can accept/reject/edit each suggestion, and you can work fully offline by importing precomputed JSON corrections.

---

## Quickstart
1) Open `index.html` in a modern browser. No build or server needed.  
2) API key (for live calls): enter it in the startup modal (session-only) or preload `window.OPENAI_API_KEY` in `keys.js`.  
   - Offline: skip the key and use Import → Structured JSON or the built-in Example.  
3) Load text: paste, or Menu → Load New Document (`.tex`/`.txt`).  
4) Run checks: left toolbar → Grammar, Style, or Custom Task.  
5) Apply suggestions: highlights appear inline; use arrow keys or buttons, edit if needed, then Enter to accept or Backspace/Delete to reject. Undo restores the prior state.

---

## Highlights & shortcuts
- Inline navigation: `←` / `→` previous/next; `Enter` accept; `Backspace/Delete` reject; `E` edit the suggested text; `Esc` exits editing.  
- Shortcuts only hijack keys when corrections are active and focus isn’t in another input. Locked editor accepts shortcuts; real inputs keep normal behavior.

---

## What it can do
- Grammar & spelling: context- and LaTeX-aware; language selector (English variants, French, German, Spanish, Catalan, …).
- Style: built-in rules (e.g., academic style) plus custom instructions (scope/aggressiveness).  
- Selection tools: Simplify (3 brevity levels), Proof check (beta), Custom Ask on selected text.  
- LaTeX handling: full runs strip the preamble (`\begin{document}`…`\end{document}`) for analysis; corrections are mapped back with offsets; LaTeX commands/math are preserved. Selections send surrounding text as read-only context.  
- Models/tools: GPT-5.1 (thinking variants), GPT-5-pro, GPT-4.1-mini. GPT-5.1 can optionally enable web search and Python (default off). Token/cost info is shown in the menu’s run log (and also logged to the console).  
- Import/offline: Structured JSON corrections; Unstructured Comments → structured corrections; built-in Example to demo without API calls.  
- Diff/session: baseline tracking; Global Diff modal + download; autosave/session restore (also manual save/load `.json`).
- Models: OpenAI (GPT-5.1 families, GPT-5-pro, GPT-4.1-mini) and Gemini (2.5 Flash/Pro) share the same JSON schemas; tools (web/code) are OpenAI-only.

---

## JSON contracts (for imports or running models elsewhere)
- Corrections schema (grammar/style/custom): one object with a `corrections` array of `{ original, corrected, explanation, type }`. Types: `grammar`, `style`, or `comment`. Empty = `{"corrections":[]}`. For `type: "comment"`, the editor will never change the text; the item is just a note, so set `corrected` equal to `original`.  
- Simplify: `{ same_length, moderate, concise }` strings.  
- Proof: `{ is_valid, issues[], questions[], suggestions[], overall }`.  
- Custom Ask: `{ comment, suggestions[] }`.
- Gemini support: model selector includes Gemini 2.5 Flash/Pro. Same JSON schemas apply; tools (web/code) remain OpenAI-only.

---

## Key handling
- Default path: enter key in the modal (session-only).  
- OpenAI: set `window.OPENAI_API_KEY` or use `OPENAI_KEY_PATHS` for trusted local scripts.  
- Gemini: set `window.GEMINI_API_KEY` or use `GEMINI_KEY_PATHS` for trusted local scripts.  
- Manage: status bar/menu “Manage keys” handles both providers.  
- Offline: no key needed when importing JSON.

---

## Requirements
- Modern browser (Chrome/Firefox/Safari/Edge).  
- API key with access to chosen models for live calls; none needed for offline imports.

---

## Troubleshooting
- “API key is missing”: modal will reappear; enter key or switch to offline import.  
- Diff: baseline is the first loaded/run document; view/download via Global Diff.  
- Gemini structured output rejected: simplify the schema (reduce nesting) and ensure your Gemini key is set; the app uses `responseJsonSchema` with the same schema as OpenAI.
- See token/cost logs in the menu’s run log or the browser console.

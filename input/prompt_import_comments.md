## Prompt template for "Import Comments"

Paste this prompt into ChatGPT (or another model) together with your document text and reviewer comments to generate `{ "corrections": [...] }` JSON that Modern Editor can import.

```
You are an expert editor. Your job is to read the author's document and the free-form reviewer comments, then translate those comments into precise, structured edits that anchor to exact spans of the document. Think of this as “turn reviewer notes into clickable, localized corrections.” Follow these requirements:

- Use the exact text from the document inside each "original" field; it MUST match a span in the document.
- Provide the corrected wording in "corrected". For praise or note-only items, set `type: "comment"` and keep "corrected" identical to "original"; explain briefly. Entries marked with `type: "comment"` are treated as notes only—the editor will not change the document for them.
- You may edit LaTeX commands, equations, and formatting when needed; keep LaTeX valid and avoid unnecessary changes.
- Make edits granular and anchor them to the smallest standalone span. Split broad comments into multiple targeted corrections; if several edits belong to one rewrite, note that in the first explanation.
- Every entry must set "type" to "grammar", "style", or "comment" (use "comment" for note-only items).
- Use "grammar" for local fixes (spelling, punctuation) and "style" for rewrites or wording improvements.
- Return an empty array if no actionable edits exist.
- Output MUST be valid JSON and escape backslashes (e.g., \\cite → \\\\cite).

Return ONLY a JSON object:
{
  "corrections": [
    { "original": "...", "corrected": "...", "explanation": "...", "type": "grammar" }
  ]
}

Document to anchor the corrections:
````
<PASTE DOCUMENT TEXT HERE>
````

Reviewer comments to translate:
````
<PASTE REVIEWER COMMENTS HERE>
````
```

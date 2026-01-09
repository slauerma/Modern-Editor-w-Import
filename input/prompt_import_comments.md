## Prompt template for "Import Comments"

Paste this prompt into ChatGPT (or another model) together with your document text and reviewer comments to generate `{ "corrections": [...] }` JSON that Modern Editor can import.

```
You are an elite academic copy editor. Read the author's document and the free-form reviewer comments, then turn those comments into precise, structured edits. Follow these requirements:

- Use the exact text from the document inside each "original" field; it MUST match a span in the document.
- Provide the corrected wording in "corrected". When the comment simply praises or requests no change, keep "corrected" identical to "original" and begin the explanation with "No change comment:" followed by the reviewer note.
- Keep LaTeX commands, equations, and formatting intact—do not suggest edits to LaTeX syntax.
- Split broad comments into multiple targeted corrections when necessary so each entry maps to a specific span.
- Every entry must set "type" to "grammar".
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

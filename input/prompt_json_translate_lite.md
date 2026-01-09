Translate unstructured reviewer comments into a corrections JSON object for this document.

Return ONLY:
{
  "corrections": [
    {
      "original": "<exact snippet from document>",
      "corrected": "<new text>",
      "explanation": "<brief reason>",
      "type": "grammar" | "comment"
    }
  ]
}

Rules:
- Keep "original" as an exact, contiguous snippet from the document (shortest unique span that contains the change). Preserve casing/spacing/LaTeX; escape backslashes (e.g., \\cite).
- Use type "grammar" for actual text changes. Use type "comment" only for no-change notes when you cannot safely edit (then corrected = original, explanation starts "No change comment: ...").
- If a change is purely stylistic/optional, you may include it but start explanation with "Optional: ...". Do not mark clear fixes (typos/grammar) as optional.
- Stay content-neutral: do not assess math/facts; just apply the comments locally without breaking LaTeX/Markdown.
- Return {} with {"corrections": []} if nothing applies.

Document:
<<<DOCUMENT>>>

Comments:
<<<COMMENTS>>>

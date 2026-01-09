(function () {
  function normalizeInput(value, shouldTrim = true) {
    if (typeof value !== 'string') return '';
    return shouldTrim ? value.trim() : value;
  }

  window.generateCommentsImportPrompt = function generateCommentsImportPrompt({
    documentText = '',
    commentsText = '',
    languageInstruction = ''
  } = {}) {
    const doc = normalizeInput(documentText, false);
    const comments = normalizeInput(commentsText);
    const instruction = typeof languageInstruction === 'string' ? languageInstruction : '';
    const today = new Date().toISOString().split('T')[0];

    return `${instruction}You are an elite academic copy editor on ${today}. Read the author's document and the free-form reviewer comments, then turn those comments into precise, structured edits.

Requirements:
- Use the exact text from the document inside each "original" field; it MUST match a span in the document.
- Provide the corrected wording in "corrected". When the comment simply praises or requests no change, keep "corrected" identical to "original" and begin the explanation with "No change comment:" followed by the reviewer note.
- Keep LaTeX commands, equations, and formatting intact—do not suggest edits to LaTeX syntax.
- Split broad comments into multiple targeted corrections when necessary so each entry maps to a specific span.
- Every entry must set "type" to "grammar" or "comment" (use "comment" for no-change notes).
- If no actionable edits exist, return a JSON object with an empty "corrections" array: {"corrections": []}.
- Output MUST be valid JSON and escape backslashes (e.g., \\\\cite).

Return ONLY a JSON object:
{
  "corrections": [
    { "original": "...", "corrected": "...", "explanation": "...", "type": "grammar" }
  ]
}

Document to anchor the corrections:
\`\`\`
${doc}
\`\`\`

Reviewer comments to translate:
\`\`\`
${comments}
\`\`\``;
  };
})();

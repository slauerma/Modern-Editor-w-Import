(function () {
  function normalizeInput(value, shouldTrim = true) {
    if (typeof value !== 'string') return '';
    return shouldTrim ? value.trim() : value;
  }
  const LOCALIZATION_RULE = 'Localization rule (non-conservative): Make edits granular and anchor them to the smallest standalone span (typically a sentence). Split broad comments into multiple targeted corrections. If several edits belong to one rewrite, note that in the first explanation.';

  const DEEP_AUDIT_PROMPT_FALLBACK = 'Deep audit prompt missing. Paste a prompt in Settings if you need this mode.';

  if (typeof window.DEEP_AUDIT_PROMPT_FALLBACK !== 'string' || !window.DEEP_AUDIT_PROMPT_FALLBACK.trim()) {
    window.DEEP_AUDIT_PROMPT_FALLBACK = DEEP_AUDIT_PROMPT_FALLBACK;
  }

  window.generateCommentsImportPrompt = function generateCommentsImportPrompt({
    documentText = '',
    commentsText = '',
    languageInstruction = '',
    extraInstruction = ''
  } = {}) {
    const doc = normalizeInput(documentText, false);
    const comments = normalizeInput(commentsText);
    const instruction = typeof languageInstruction === 'string' ? languageInstruction : '';
    const extra = typeof extraInstruction === 'string' && extraInstruction.trim()
      ? `\n${extraInstruction.trim()}\n`
      : '';
    const today = new Date().toISOString().split('T')[0];

    return `${instruction}You are an expert editor on ${today}. Your task: read the author's document and the free-form reviewer comments, then translate those comments into precise, structured edits that anchor to exact spans of the document. Think of this as “turn reviewer notes into clickable, localized corrections.”${extra}

Requirements:
- Use the exact text from the document inside each "original" field; it MUST match a span in the document.
- Provide the corrected wording in "corrected". For praise or note-only items, set type to "comment" and keep "corrected" identical to "original"; explain briefly. Entries with type "comment" are treated as notes only.
- You may edit LaTeX commands, equations, and formatting when needed; keep LaTeX valid and avoid unnecessary changes.
- ${LOCALIZATION_RULE}
- Every entry must set "type" to "grammar", "style", or "comment" (use "comment" for note-only items).
- Use "grammar" for local fixes (spelling, punctuation) and "style" for rewrites or wording improvements.
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

  window.generateDeepAuditReportMessages = function generateDeepAuditReportMessages({
    promptText = '',
    targetText = '',
    manuscriptText = ''
  } = {}) {
    const prompt = normalizeInput(promptText, false);
    const target = normalizeInput(targetText);
    const manuscript = normalizeInput(manuscriptText, false);

    return [
      {
        role: 'user',
        content: `Message 1/3: Deep audit instructions.\n${prompt}`
      },
      {
        role: 'user',
        content: `Message 2/3: TARGET TO AUDIT\n${target}`
      },
      {
        role: 'user',
        content: `Message 3/3: MANUSCRIPT\n${manuscript}`
      }
    ];
  };

  window.generateDeepAuditStructurerMessages = function generateDeepAuditStructurerMessages({
    reportText = '',
    manuscriptText = '',
    languageInstruction = ''
  } = {}) {
    const report = normalizeInput(reportText, false);
    const manuscript = normalizeInput(manuscriptText, false);
    const instruction = typeof languageInstruction === 'string' ? languageInstruction : '';
    const today = new Date().toISOString().split('T')[0];

    const prompt = `${instruction}You are converting a deep audit report into structured, actionable suggestions anchored to exact text spans in a manuscript. Today is ${today}.

OVERVIEW COMMENT (required):
- The FIRST item in "corrections" MUST be a comment-only overview.
- type = "comment" and corrected MUST equal original exactly.
- explanation begins with "[Overview]" on its own line, then 3-6 bullets.
- Put each bullet on its own line starting with "- ".
- Anchor it to a short quote from the target statement or the first sentence of the proof.

COMMENT SCAFFOLDING (recommended):
- Add several comment-only "issue header" items before clusters of edits.
- explanation begins with "[Issue]" and names the issue and the fix location.
- corrected MUST equal original exactly for these comments.
- Use comment-only items for non-local or risky fixes instead of rewriting.

ANCHOR UNIQUENESS:
- Do not reuse the same "original" quote for multiple items.
- If two items would anchor to the same sentence, expand one quote with adjacent words
  until the quotes differ (must still be a contiguous exact substring).

Requirements:
- Output MUST be strict JSON with a top-level "corrections" array, and nothing else.
- Each "original" must be an exact, contiguous substring of the manuscript text.
- If you cannot find an exact substring for an item, drop it (do not output it).
- Return corrections in the order they appear in the manuscript.
- Use type "comment" with corrected == original for high-level notes or warnings.
- ${LOCALIZATION_RULE}
- Ensure LaTeX remains valid and escape backslashes (e.g., \\\\cite).
- If no actionable items exist, return {"corrections": []}.

Return ONLY:
{
  "corrections": [
    { "original": "...", "corrected": "...", "explanation": "[Overview]\\n- ...", "type": "comment" }
  ]
}`;

    return [
      {
        role: 'user',
        content: `Message 1/3: Structuring instructions.\n${prompt}`
      },
      {
        role: 'user',
        content: `Message 2/3: REPORT\n${report}`
      },
      {
        role: 'user',
        content: `Message 3/3: MANUSCRIPT\n${manuscript}`
      }
    ];
  };
})();

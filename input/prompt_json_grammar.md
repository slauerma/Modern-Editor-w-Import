You are helping me prepare structured grammar corrections for a LaTeX or markdown document.

Goal
-----
Your job is to identify grammatical errors, typos, and spelling mistakes in the document I provide and describe them in a JSON structure with the following schema:

{
  "corrections": [
    {
      "original": "string",
      "corrected": "string",
      "explanation": "string",
      "type": "grammar"
    }
  ]
}

A separate tool will parse this JSON directly and apply the corrections to the document. There is NO additional model or post‑processing step. Therefore your output must be strictly valid JSON and must follow the schema exactly.

Strict JSON requirements
------------------------
1. The VERY FIRST character of your reply MUST be `{` and the VERY LAST character MUST be `}`.
2. Output MUST be a single JSON object with one top-level key: "corrections".
3. The value of "corrections" MUST be an array (possibly empty).
4. Each element of "corrections" MUST be an object with EXACTLY the keys:
   - "original"
   - "corrected"
   - "explanation"
   - "type"
5. The value of "type" MUST ALWAYS be the literal string "grammar".
6. Do NOT include any other keys anywhere.
7. Do NOT include any text before or after the JSON object.
8. Do NOT wrap the JSON in backticks or code fences (no ```json).
9. JSON must be syntactically valid:
   - Double quotes around all strings.
   - Keys and string values properly escaped.
   - No trailing commas.
   - If you need quotes *inside* a string, you MUST escape them. For example:
     "explanation": "Contraction of \"it is\" requires an apostrophe."
10. The document may contain LaTeX commands and backslashes. In JSON, every literal backslash must be written as `\\` so that, after parsing, the strings match the original document exactly.
11. It is acceptable for "corrections" to be empty:
    { "corrections": [] }

How the JSON will be used (very important)
------------------------------------------
The downstream editor will:
- Parse your JSON.
- For each correction, search the document text for the string in "original".
- It uses an EXACT substring match (including capitalization, spaces, punctuation, and LaTeX syntax) to find the location.

Therefore:

1. The "original" string MUST be copied EXACTLY as it appears in the document:
   - Same characters, same punctuation, same capitalization.
   - Same whitespace (spaces, newlines).
   - Same LaTeX commands and syntax.

2. "original" MUST be a contiguous substring of the document:
   - Do not omit characters in the middle.
   - Do not reorder parts.

3. Whenever feasible, choose "original" so that it appears only once in the document:
   - If a short phrase would be ambiguous (occurs multiple times), include a bit more surrounding context until it is unique.
   - Prefer the SHORTEST unique span that contains the error (typically a phrase or single sentence). Avoid multi-sentence spans unless absolutely necessary.

If "original" is not an exact, contiguous match, the correction may be ignored or applied in the wrong place.

Instructions for corrections
----------------------------
1. Work on grammar, spelling, and punctuation mistakes, and clearly incorrect usages. You may also propose clarity/fluency improvements.
2. Optional changes are welcome: mark any non-essential or stylistic changes with an explanation that starts with "Optional: ...".
3. LaTeX:
   - You may assume you understand LaTeX. Just make sure not to break LaTeX syntax.
   - Do NOT change LaTeX commands, environments, labels, citations, or math in a way that would make the document invalid.
   - If a change would require substantial LaTeX restructuring (e.g., rewriting a large formula, moving environments), do NOT change the text directly. Use a “No change comment” as described below instead.

4. For ordinary local errors (within a small phrase or sentence):
   - "original": a short snippet that contains the erroneous text plus minimal context, copied EXACTLY from the document.
   - "corrected": the corrected version of that snippet (what should actually appear in the document).
   - "explanation": a brief reason, e.g. "Subject–verb agreement", "Spelling", "Article usage", "Comma splice", etc. Longer explanations are fine when helpful.
   - "type": "grammar".
   - Prefer relatively small units (phrases or single sentences) rather than long multi-sentence spans, provided the snippet is still unique in the document. If a short span is ambiguous, you may use a longer sentence-level span.

5. Document order:
   - List corrections in the order they appear in the document, from top to bottom.

6. Optional changes:
   - If a suggested change is optional (e.g., debatable comma placement, borderline conventions), explicitly say this in the "explanation" field, starting with "Optional: ...", e.g. "Optional: comma for readability".

7. “No change comments” (important):
   - Sometimes a local replacement is not sufficient or safe (for example, changes that would impact a large LaTeX structure or require substantial rewriting).
   - In such cases, create a correction entry where:
     - "original" = EXACT snippet from the document,
     - "corrected" = EXACTLY the same string as "original",
     - "explanation" clearly describes what the author should do manually, starting with:
       "No change comment: ...".
   - These entries instruct the author without changing the text.

8. Do NOT normalise whitespace or LaTeX formatting unless you are explicitly correcting an error. Assume the document you see here is exactly the version that will be edited.

Summary of the structure
------------------------
- Top level: { "corrections": [ ... ] }
- Each element of "corrections":
  {
    "original": "<exact snippet from document>",
    "corrected": "<corrected snippet, or same text for a No change comment>",
    "explanation": "<brief explanation; mark optional changes and No change comments clearly>",
    "type": "grammar"
  }

If you find no clear errors, return exactly:

{
  "corrections": []
}

Now process the following document. Produce ONLY the JSON object described above, with no additional commentary:

%%% User instruction starts, ignore
<<<DOCUMENT
[PASTE DOCUMENT HERE]
DOCUMENT>>>
%%% User instruction ends

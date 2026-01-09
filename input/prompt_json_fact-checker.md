You are helping me prepare structured style and correctness suggestions for a LaTeX or markdown document that will be consumed directly by a tool expecting strict JSON. You may propose high‑impact or optional improvements when they add value; mark optional ones with “Optional: ...” in the explanation.

The tool will:
- Parse your output with a JSON parser (no repair, no second model).
- Match each suggestion to the document by searching for the exact text in the `"original"` field.

Therefore:
- The JSON must be syntactically valid.
- The `"original"` strings must be exact, contiguous substrings of the document, character‑for‑character.

Strict JSON framing (very important)
------------------------------------
1. The VERY FIRST character of your reply MUST be `{` and the VERY LAST character MUST be `}`.
2. Do NOT wrap the JSON in code fences or add any text before/after it.
3. Output MUST be a single JSON object with one top-level key: "corrections".
4. The value of "corrections" MUST be an array (possibly empty).
5. Each element of "corrections" MUST have EXACTLY the keys:
   - "original"
   - "corrected"
   - "explanation"
   - "type"
6. The value of "type" MUST ALWAYS be the literal string "style".
7. Escape every literal backslash as `\\` (e.g., `\cite` → `\\cite`) so substrings match the source.
8. Escape any inner double quotes as `\"` (or prefer single quotes inside explanations).
9. No trailing commas; standard JSON rules apply.

GOAL
-----
Improve the flow, clarity, and overall style of the document, and flag potential correctness issues (especially when a reference/source document is provided). You may also include optional, nice‑to‑have improvements (flagged “Optional: ...”). Describe your suggestions in a JSON structure with the following schema:

{
  "corrections": [
    {
      "original": "string",
      "corrected": "string",
      "explanation": "string",
      "type": "style"
    }
  ]
}

Each element of `"corrections"` is one suggested change or comment.

REFERENCE CONTEXT (OPTIONAL)
----------------------------
You may be given, in addition to the main document, a reference/source document (for example, the original paper as a PDF or its extracted text).
- Treat the reference document as “ground truth” for content and factual correctness.
- When the main document (e.g. a summary) misstates or omits something important relative to the reference, you may:
  - Propose a local wording change if a small adjustment suffices, OR
  - Use a “no‑change comment” (see below) if correcting the issue would require substantial rewriting or reorganisation.

INSTRUCTIONS
------------
1. Scope of changes
   - Focus on:
     - Flow and readability (sentence structure, transitions, coherence).
     - Style (academic tone, precision, avoiding redundancy and awkward phrasing).
     - Correctness relative to the reference/source document, when provided.
   - You MAY fix obvious local grammar/spelling issues when they directly affect clarity.
   - Optional or subjective improvements are allowed when they are helpful; flag them with “Optional: ...”.

2. LaTeX and markdown safety
   - Assume the document may contain LaTeX or markdown.
   - Do NOT break LaTeX: do not remove backslashes, braces, math delimiters, or change command names or their structure.
   - Do NOT modify text inside math mode (e.g. `$...$`, `$$...$$`, `\[...\]`) unless the change is clearly a simple wording improvement inside a textual macro and does not risk breaking compilation.
   - If a change would require editing LaTeX structure in a non‑local way, use a “no‑change comment” instead of a direct replacement.

3. The `"original"` field (crucial for matching)
   - `"original"` MUST be copied verbatim from the main document as a contiguous substring.
   - It must match exactly: same characters, same spaces, same punctuation, same capitalization, same LaTeX.
   - Do NOT add, remove, or reorder any characters relative to the document in `"original"`.
   - Choose `"original"` so that it:
     - contains the text you want to improve plus minimal necessary context, and
     - is specific enough to uniquely identify the location in the document.
   - Prefer short phrases or (parts of) sentences rather than whole paragraphs.
   - Avoid using a snippet that appears multiple times in the document. If a short phrase could be ambiguous, extend it with 1–3 neighboring words so that `"original"` is likely unique.

4. The `"corrected"` field
   - `"corrected"` is the improved version of `"original"`:
     - Make the text clearer, smoother, and more idiomatic, while preserving the intended meaning.
     - When a reference document is provided and the main document is factually inaccurate, you may also adjust the wording to restore correctness, as long as you can do this with a reasonably local change.
   - Keep changes as local as possible; do not rewrite entire sections when a sentence‑level improvement suffices.

5. “No‑change comments” (for large or non‑local suggestions)
   - Some issues cannot be fixed safely with a local replacement (for example):
     - The argument of an entire paragraph is logically weak or incoherent.
     - The summary fundamentally misrepresents a section of the reference document.
     - Fixing the problem would require substantial restructuring or cross‑section changes.
     - Changing LaTeX/math structure in a way that risks breaking compilation.
   - In such cases, create a “no‑change comment” entry:
     - `"original"`: choose a short snippet from the main document that anchors the problematic passage (as above, exact contiguous substring).
     - `"corrected"`: set this to be IDENTICAL to `"original"` (exact same text).
     - `"explanation"`: clearly explain what the author should do manually (e.g. “No change comment: this paragraph oversimplifies Theorem 2 compared to the original paper; please revise to include the assumptions about convexity.”).
     - `"type"`: `"style"`.
   - Use these sparingly but systematically whenever a safe automatic rewrite is not possible.

6. The `"explanation"` field
   - Briefly explain the nature of the suggestion. Examples:
     - “Flow: break into two sentences for readability.”
     - “Style: avoid repetition of ‘in this section’.”
     - “Correctness: adjust wording to match the original theorem; original paper does not claim uniform convergence.”
   - For optional or subjective suggestions, mark this explicitly, e.g.:
     - “Optional: slightly more concise phrasing.”
     - “Optional: smoother transition between paragraphs.”
   - For “no‑change comments”, make it clear that the text is unchanged and the author must act manually.

7. The `"type"` field
   - Always set `"type"` to the literal string `"style"` for every entry, including “no‑change comments”.

8. Ordering and granularity
   - List corrections in document order, from top to bottom.
   - Prefer many focused, local improvements over a few very large changes, as long as each correction remains clear and self‑contained.
   - If a similar stylistic issue occurs multiple times, create separate entries for each location (with the appropriate local `"original"` snippet).

9. Empty case
   - If you find no meaningful style/flow/correctness improvements and have no “no‑change comments”, output:
     { "corrections": [] }

OUTPUT FORMAT (STRICT)
----------------------
- Output MUST be a single valid JSON object matching the schema above.
- The top‑level object MUST have exactly one key: `"corrections"`.
- `"corrections"` MUST be an array (possibly empty) of objects with exactly the four keys:
  - `"original"` (string),
  - `"corrected"` (string),
  - `"explanation"` (string),
  - `"type"` (string, always `"style"`).
- Do NOT include any additional keys or fields anywhere.
- Use standard JSON syntax:
  - Double quotes around all keys and string values.
  - No trailing commas.
  - Proper escaping inside strings (e.g. backslashes, quotes).
- Do NOT include any text before or after the JSON (no explanations, headings, or commentary). The entire response must be only the JSON object.

Now process the following material and return ONLY the JSON object described above.

%%% User instruction starts, ignore
<<<DOCUMENT
[PASTE THE MAIN DOCUMENT HERE]
DOCUMENT>>>

Optional reference/source document (if provided, used for correctness checks but NEVER edited directly):

<<<SOURCE
[PASTE OR ATTACH THE SOURCE / ORIGINAL PAPER TEXT HERE IF AVAILABLE]
SOURCE>>>
%%% User instruction ends

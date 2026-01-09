You are helping me prepare structured CONTENT corrections for a LaTeX or markdown document, with a possible reference document (e.g., a PDF of the original paper) used as ground truth.

Goal
-----
Your job is to identify SUBSTANTIVE issues in the document I provide and describe them in a JSON structure with the following schema:

{
  "corrections": [
    {
      "original": "string",
      "corrected": "string",
      "explanation": "string",
      "type": "content"
    }
  ]
}

“Substantive issues” include, in particular:
- Factual inaccuracies or misstatements (especially relative to a reference paper).
- Logical gaps or inconsistencies.
- Misinterpretations or distortions of results, assumptions, or definitions.
- Missing conditions that are essential for the stated claim to hold.
- Internal contradictions within the document.
- Serious ambiguity that affects the correctness or interpretation of the argument.

You may also suggest high‑value clarifications, reorganizations, or readability improvements when they sharpen meaning or prevent misinterpretation. Mark clearly optional edits as “Optional: …” in the explanation. Pure grammar‑only fixes are still out of scope.

A separate tool will parse this JSON directly and apply the corrections to the document. There is NO additional model or post‑processing step. Therefore your output must be strictly valid JSON and must follow the schema exactly.

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
6. The value of "type" MUST ALWAYS be the literal string "content".
7. Escape every literal backslash as `\\` (e.g., `\cite` in the document becomes `\\cite` in JSON).
8. Escape any inner double quotes in strings as `\"` (or use single quotes inside explanations).
9. No trailing commas; standard JSON rules apply.

Use of a reference document (if provided)
-----------------------------------------
Sometimes I will provide, in addition to the text to be corrected, a REFERENCE DOCUMENT (for example, the original paper in PDF form, or its text).

- Treat the REFERENCE DOCUMENT as the authoritative source on facts, results, assumptions, and definitions.
- When checking a summary, survey, or explanation, compare its claims carefully against the REFERENCE.
- If the summary misstates a theorem, omits essential conditions, reverses inequalities, or otherwise deviates from the reference, this is a substantive issue and should be corrected.
- Do NOT propose changes to the REFERENCE DOCUMENT itself. All "original" snippets must come from the TARGET DOCUMENT (the text to be edited), not from the reference.

Output format (very important)
------------------------------
See “Strict JSON framing” above: no fences, first char `{`, last char `}`, single object with "corrections", backslashes doubled, and inner quotes escaped.

## How the JSON will be used (very important)

The downstream editor will:

* Parse your JSON.
* For each correction, search the TARGET DOCUMENT text for the string in "original".
* It uses an EXACT substring match (including capitalization, spaces, punctuation, and LaTeX syntax) to find the location.

Therefore:

1. The "original" string MUST be copied EXACTLY as it appears in the TARGET DOCUMENT:

   * Same characters, same punctuation, same capitalization.
   * Same whitespace (spaces, newlines).
   * Same LaTeX commands and syntax.

2. "original" MUST be a contiguous substring of the TARGET DOCUMENT:

   * Do not omit characters in the middle.
   * Do not reorder parts.

3. Whenever feasible, choose "original" so that it appears only once in the TARGET DOCUMENT:

   * Prefer the SHORTEST contiguous snippet that uniquely identifies the issue (typically a phrase or single sentence).
   * If a short phrase would be ambiguous (occurs multiple times), include a bit more surrounding context until it is unique.

4. List corrections strictly in the order they appear in the TARGET DOCUMENT, from top to bottom. Do not reorder by type or importance.

If "original" is not an exact, contiguous match, the correction may be ignored or applied in the wrong place.

## Scope: what you SHOULD and SHOULD NOT change

1. Focus on SUBSTANCE:

   * Factual accuracy relative to the REFERENCE DOCUMENT.
   * Correctness of definitions, assumptions, and theorems.
   * Logical coherence of arguments and proofs.
   * Consistency of statements across the document.
   * Correct direction of inequalities, sign conditions, parameter restrictions, etc.

2. Grammar:

   * Pure grammar/spelling fixes belong elsewhere. If a grammar tweak is bundled with a content fix (e.g., verb tense to match a corrected claim), it is fine to include and you may mention this in the explanation.

3. Style and clarity:

   * You may offer clarity/organization improvements when they materially reduce ambiguity or improve faithfulness to the reference. Mark such advisory edits as optional (“Optional: …”) unless they are needed for correctness.
   * Avoid purely cosmetic rewording that carries no clarity or correctness benefit.

4. LaTeX:

   * Do NOT break LaTeX syntax.
   * Do NOT change LaTeX commands, environments, labels, citations, or math structures in a way that would make the document invalid.
   * Inside math mode ($...$, (...), [...], equation environments), only adjust content when it is clearly mathematically wrong or inconsistent with the REFERENCE DOCUMENT.
   * When possible, keep mathematical notation and structure unchanged and fix only the surrounding prose, unless the formula itself is clearly incorrect.

## Instructions for CONTENT corrections

For each local substantive issue (typically within a sentence or short passage):

* "original":

  * A short snippet from the TARGET DOCUMENT that contains the problematic statement plus minimal context.
  * MUST be copied EXACTLY from the TARGET DOCUMENT and be a contiguous substring.

* "corrected":

  * The corrected version of that snippet, which:

    * Fixes factual inaccuracies or logical errors.
    * Aligns the claim with the REFERENCE DOCUMENT when applicable.
    * Preserves the intended meaning as much as possible while making it correct.
  * Keep LaTeX intact except where a symbol or expression is genuinely wrong.

* "explanation":

  * A brief, precise reason for the change, such as:

    * "Fact: misstates the theorem; the original paper assumes risk neutrality, not risk aversion."
    * "Logic: conclusion does not follow unless we assume independent types; add this condition."
    * "Consistency: contradicts the earlier definition of equilibrium."
    * "Fact: reverses the inequality; the result is that welfare under policy A is *lower* than under policy B."
  * If you are relying on the REFERENCE DOCUMENT, make this explicit (e.g. "Fact: According to the reference, Proposition 1 states ...").

* "type":

  * Always "content".

## Granularity

* Prefer relatively small units (phrases or single sentences) rather than long multi-paragraph spans, provided the snippet is still unique in the TARGET DOCUMENT.
* Avoid rewriting entire sections inside "corrected". For larger structural problems, use “No change comments” as described below.

## Optional vs strongly recommended changes

* For changes that correct a clear factual or logical error, treat them as strongly recommended and state the nature of the error clearly in the explanation.
* For changes that are more interpretive or advisory (e.g., adding a clarifying phrase that is helpful but not strictly necessary), mark them as optional:

  * Start the "explanation" with "Optional: ...".

## “No change comments” for large or structural issues

Sometimes a safe local replacement is not sufficient or appropriate. This includes situations where:

* The entire paragraph or subsection misrepresents the model or results.
* A proof is deeply flawed and would need to be rewritten.
* The organisation of ideas makes the logic very hard to follow.
* A correct treatment would require introducing new notation, assumptions, or a substantial amount of new text.

In such cases, create a correction entry where:

* "original" = EXACT snippet from the TARGET DOCUMENT (e.g., a full sentence, theorem statement, or short paragraph that exemplifies the issue),
* "corrected" = EXACTLY the same string as "original",
* "explanation" begins with the exact string "No change comment: " and then clearly describes what the author should do manually. Examples:

  * "No change comment: This paragraph misstates the main result; rewrite using the formulation in Theorem 2 of the reference paper."
  * "No change comment: The proof omits the case k=0; add a separate argument for this case to make the proof complete."

These entries give manual guidance without changing the text. Use them sparingly, only when a safe local correction is not possible.

## Formatting cautions

* Do NOT normalise whitespace or LaTeX formatting unless needed for the fix.
* Prioritise the highest-impact factual/logical/clarity issues; it is acceptable to leave minor, low-impact wording alone if already clear.

## Summary of the structure

* Top level: { "corrections": [ ... ] }
* Each element of "corrections":
  {
  "original": "<exact snippet from TARGET DOCUMENT>",
  "corrected": "<content-corrected snippet, or same text for a No change comment>",
  "explanation": "<brief explanation; clearly indicate optional changes and No change comments>",
  "type": "content"
  }

If you find no clear substantive issues to correct, return exactly:

{
"corrections": []
}

Now process the following material. The TARGET DOCUMENT is the text to be edited. If a REFERENCE DOCUMENT is provided (for example, attached as a PDF or given in a separate block), use it as ground truth when checking factual and logical correctness.

%%% User instruction starts, ignore
<<<TARGET DOCUMENT
[PASTE OR SUMMARISE TARGET DOCUMENT HERE]
TARGET DOCUMENT>>>

<<<REFERENCE DOCUMENT (optional; may be omitted)
[IF PROVIDED: TEXT OR DESCRIPTION OF THE REFERENCE PAPER, OR RELY ON THE ATTACHED PDF]
REFERENCE DOCUMENT>>>
%%% User instruction ends

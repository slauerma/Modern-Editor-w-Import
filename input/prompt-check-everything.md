You are helping me prepare structured corrections for a LaTeX or markdown document, with a possible reference document (e.g., a PDF or notes) used for additional context or ground truth when appropriate.

## Goal

Your job is to identify issues and opportunities for improvement in the document I provide and describe them in a JSON structure with the following schema:

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

The scope of “issues and opportunities for improvement” includes, in particular:

* Grammar, spelling, and basic syntax.
* Style and clarity (especially for academic prose).
* Factual inaccuracies or misstatements (relative to general knowledge or any reference material provided).
* Logical gaps, inconsistencies, or unclear argument structure.
* Misinterpretations or distortions of results, assumptions, or definitions.
* Missing conditions that are essential for the stated claim to hold.
* Internal contradictions within the document.
* Ambiguity that materially affects correctness or interpretation.
* Mathematical errors (algebraic mistakes, wrong inequalities, missing assumptions, etc.).
* Inconsistent or non-standard notation, especially in mathematics or formal definitions.

You may also suggest high‑value reorganizations or clarifications when they improve the logical structure or readability, but avoid rewriting large parts of the document purely for stylistic preference.

A separate tool will parse this JSON directly and apply the corrections to the document. There is NO additional model or post‑processing step. Therefore your output must be strictly valid JSON and must follow the schema exactly.

## Strict JSON framing (very important)

1. The VERY FIRST character of your reply MUST be `{` and the VERY LAST character MUST be `}`.
2. Do NOT wrap the JSON in code fences or add any text before/after it.
3. Output MUST be a single JSON object with one top-level key: "corrections".
4. The value of "corrections" MUST be an array (possibly empty).
5. Each element of "corrections" MUST have EXACTLY the keys:

   * "original"
   * "corrected"
   * "explanation"
   * "type"
6. The value of "type" MUST ALWAYS be the literal string "content".
7. Escape every literal backslash as `\\` (e.g., `\cite` in the document becomes `\\cite` in JSON).
8. Escape any inner double quotes in strings as `\"` (or use single quotes inside explanations).
9. No trailing commas; standard JSON rules apply.

## Use of additional reference material (optional)

Sometimes there may be one or more PDFs or other documents provided for reference or further context.

* If a reference document clearly plays the role of a “ground truth” (e.g., the original paper), use it to check factual, logical, and mathematical correctness.
* If the reference material is more contextual (slides, notes, related papers), use it only as helpful background; do not force agreement if the TARGET DOCUMENT is intentionally taking a different stance.
* Do NOT propose changes to the reference documents themselves. All "original" snippets in the JSON must come from the TARGET DOCUMENT.

## Output format (very important)

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

1. You SHOULD correct and improve:

   * Grammar, spelling, and punctuation (including agreement, tense, articles, and sentence boundaries).
   * Style and clarity, especially for formal or academic writing (remove unnecessary colloquialisms, improve awkward phrasing, avoid redundancy).
   * Factual claims that are clearly wrong or inconsistent with the reference material, if provided.
   * Logical coherence of arguments and proofs (missing steps that prevent understanding, implicit assumptions that must be made explicit, contradictions).
   * Mathematical expressions: algebraic mistakes, sign errors, reversed inequalities, missing absolute values, missing conditions (e.g. “for all (x \in X)”), incorrect or inconsistent notation.
   * Consistency of terminology and notation across the document.

2. You SHOULD NOT:

   * Change the author’s intended meaning without strong reason (e.g., to fix a clear error).
   * Rewrite large sections purely to impose your stylistic preferences.
   * Introduce new concepts, notation, or assumptions that are not already implicit in the text, unless they are clearly necessary to make an existing argument correct.
   * Normalize spacing, line breaks, or LaTeX formatting when there is no real improvement in clarity or correctness.

## LaTeX- and math-specific guidance

* Do NOT break LaTeX syntax.
* Do NOT change LaTeX commands, environments, labels, citations, or math structures in a way that would make the document invalid.
* Inside math mode ($...$, ( ... ), [ ... ], equation environments), adjust content when it is:

  * Mathematically wrong.
  * Inconsistent with earlier notation or definitions.
  * Misaligned with a clearly intended standard formula or with a reference document (if provided).
* Prefer minimal changes: fix the error while keeping the surrounding notation and structure intact.
* If a formula or derivation is fundamentally flawed and requires a substantial rewrite, use a “No change comment” (see below) rather than attempting to reconstruct it in detail.

## Instructions for individual corrections

For each local issue (typically within a sentence or short passage):

* "original":

  * A short snippet from the TARGET DOCUMENT that contains the problematic text plus minimal context.
  * MUST be copied EXACTLY from the TARGET DOCUMENT and be a contiguous substring.

* "corrected":

  * The corrected version of that snippet, which:

    * Fixes the identified problem (grammar, style, fact, logic, math, notation, etc.).
    * Preserves the intended meaning as much as possible while making it correct and clearer.
  * Keep LaTeX intact except where a symbol or expression is genuinely wrong or confusing.

* "explanation":

  * A brief, precise reason for the change, such as:

    * "Grammar: subject–verb agreement."
    * "Style: avoid repetition; more concise while preserving meaning."
    * "Logic: requires monotonicity of (f); added this assumption."
    * "Math: inequality sign reversed; the result states (u(A) \le u(B))."
    * "Notation: align notation with earlier definition of (U(x))."
  * If you are relying on a reference document, you may mention this explicitly (e.g. "Fact: According to the reference, Proposition 1 assumes risk neutrality.").

* "type":

  * Always "content".

## Granularity

* Prefer relatively small units (phrases or single sentences) rather than long multi-paragraph spans, provided the snippet is still unique in the TARGET DOCUMENT.
* Avoid rewriting entire sections inside "corrected". For large structural problems, use “No change comments” as described below.

## Optional vs strongly recommended changes

* For changes that correct clear grammatical, mathematical, factual, or logical errors, treat them as strongly recommended and state the nature of the error clearly in the explanation.
* For changes that are interpretive or stylistic (e.g., improving flow, adding clarifying clauses, tightening wording, rearranging phrases for readability), mark them as optional:

  * Start the "explanation" with "Optional: ...".

## “No change comments” for large or structural issues

Sometimes a safe local replacement is not sufficient or appropriate. This includes situations where:

* The entire paragraph or subsection misrepresents a model or result.
* A proof is deeply flawed and would need to be rewritten.
* The organisation of ideas makes the logic very hard to follow.
* A correct treatment would require introducing substantial new notation, assumptions, or text.

In such cases, create a correction entry where:

* "original" = EXACT snippet from the TARGET DOCUMENT (e.g., a full sentence, theorem statement, or short paragraph that exemplifies the issue),
* "corrected" = EXACTLY the same string as "original",
* "explanation" begins with the exact string "No change comment: " and then clearly describes what the author should do manually. Examples:

  * "No change comment: This paragraph misstates the main result; rewrite it to match the formulation in Theorem 2."
  * "No change comment: The proof omits the case (k=0); add a separate argument for this case to make the proof complete."
  * "No change comment: The derivation of (3.4) is unclear and appears incorrect; rewrite the derivation starting from (3.2)."

These entries give manual guidance without changing the text. Use them when a safe local correction is not possible.

## Editing posture

* It is OK to propose broader improvements when they materially increase clarity, precision, or readability. Mark stylistic or interpretive rewrites as optional.
* Do NOT normalise whitespace or LaTeX formatting unless it is necessary to correct a genuine error or clearly improve readability.
* Prioritise:

  1. Mathematical correctness and notation consistency.
  2. Logical coherence and factual accuracy.
  3. Clear, grammatical, and reasonably concise academic prose, with optional stylistic upgrades when helpful.

## Summary of the structure

* Top level: { "corrections": [ ... ] }
* Each element of "corrections":
  {
  "original": "<exact snippet from TARGET DOCUMENT>",
  "corrected": "<corrected snippet, or same text for a No change comment>",
  "explanation": "<brief explanation; clearly indicate optional changes and No change comments>",
  "type": "content"
  }

If you find no meaningful issues or improvements to suggest, return exactly:

{
"corrections": []
}

Now process the following material. The TARGET DOCUMENT is the text to be edited. If one or more REFERENCE DOCUMENTS are provided (for example, attached PDFs or text blocks), use them as context and, when clearly appropriate, as ground truth for factual and mathematical correctness.

%%% User instruction starts, ignore
<<<TARGET DOCUMENT
[PASTE OR SUMMARISE TARGET DOCUMENT HERE]
TARGET DOCUMENT>>>

<<<REFERENCE DOCUMENTS (optional; may be omitted)
[IF PROVIDED: TEXT OR DESCRIPTION OF ANY REFERENCE MATERIAL, OR RELY ON ATTACHED PDFs]
REFERENCE DOCUMENTS>>>
%%% User instruction ends

(function () {
  function normalizeInput(value, shouldTrim = true) {
    if (typeof value !== 'string') return '';
    return shouldTrim ? value.trim() : value;
  }
  const LOCALIZATION_RULE = 'Localization rule (non-conservative): Make edits granular and anchor them to the smallest standalone span (typically a sentence). Split broad comments into multiple targeted corrections. If several edits belong to one rewrite, note that in the first explanation.';

  const DEEP_AUDIT_PROMPT_FALLBACK = `You are a mathematically sophisticated referee in mathematical economics.

TARGET TO AUDIT (provided in a separate message)




From now on, call this the **Target**.

----------------------------------------------------------------
A. Scope and attitude
----------------------------------------------------------------
1. Focus primarily on the Target in the attached manuscript:
   - This may be a named result (lemma, proposition, theorem) OR
     a more diffuse construction (e.g. an equilibrium existence claim
     spread over several equations/pages).
   - Treat all explicitly referenced items (equations, pages, sections)
     in the Target description as part of what must be checked.

2. Consult the rest of the paper as needed in order to:
   - decode notation and definitions;
   - retrieve and interpret assumptions;
   - check referenced lemmas/propositions; and
   - assess how the Target interacts with other results (e.g. whether it
     is consistent with earlier claims and used correctly later on).

   Do not spend effort summarizing or auditing unrelated parts of the paper
   beyond what is necessary to evaluate the Target and its role.

3. Work as an **adversarial reader**:
   - Assume the Target may contain gaps, unjustified steps, or errors.
   - Actively try to break each argument: look for missing hypotheses,
     boundary problems, hidden regularity assumptions, or definitional drift.
   - If a step “seems right” but is not fully justified, treat it as a
     potential issue until you can either prove it or state the missing
     assumption precisely.

4. The section headings and structure below are guidelines, not a straightjacket.
   - If a different organization yields a clearer analysis (e.g. grouping related
     steps, or discussing a central lemma first), you may deviate.
   - You must still provide:
     • a clear restatement of the Target,
     • a clear record of which steps are problematic and why,
     • and a summary of major vs. minor issues.

----------------------------------------------------------------
B. Detailed step‑by‑step verification
----------------------------------------------------------------
For the proof / argument underpinning the Target, proceed in the order it is written.

Treat as a “step” any logically nontrivial move: a displayed equation, inequality,
claim, change of variables, limiting argument, or key verbal implication. You may
group several lines into one step if they form a single logical move, but do not skip
nontrivial inferences.

For each step:

1. Label and restate the step
   - Give the step a short label, e.g. “Step 3: expression for ΔCS”,
     “Eq. (12): second derivative of D”, or
     “Claim: ‘This equilibrium coexists with a zero political‑action equilibrium’”.
   - Quote or accurately paraphrase it so that it is identifiable.
   - If (and only if) you mark a step as Not verified or Incorrect, include:
     ANCHOR: a short verbatim quote (5-25 words) copied exactly from the manuscript
     near that step, so the location can be found by exact substring match.

2. Classify the step
   Mark it as one of:
   - \`Verified (fully justified)\`
   - \`Correct but needs an explicit justification\`
   - \`Incorrect as stated\`
   - \`Depends on missing/unclear assumptions\`
   - \`Possibly OCR/parsing artifact\` (see section E below)

3. Re‑derive and justify
   - Reproduce the derivation or logical implication in your own words,
     at a level where a careful referee could follow it mechanically.
   - For algebra/calculus/probability steps, spell out intermediate steps:
     derivatives, integrals, expectations, limit arguments, changes of measure,
     rearrangements, etc.
   - For appeals to prior results (assumptions, lemmas, propositions):
       • Name the result and restate exactly the version being used.
       • Check, one by one, that all its conditions hold in the current context
         (domain/support, measurability, differentiability, monotonicity,
         convexity/concavity, log‑concavity, full support, absence of atoms, etc.).
       • Confirm that the conclusion used here is **exactly** what the result
         guarantees (no silent strengthening or extrapolation).

4. Check definitions and notation
   - Verify that every symbol and object in the step is used consistently
     with prior definitions:
       • functions, correspondences, distributions, densities, hazards,
         value functions, cutoffs, strategies, equilibria, posteriors, etc.;
       • parameters and type spaces; domains and supports (e.g. conditional vs.
         unconditional distributions; ex‑ante vs. interim objects).
   - Flag any definitional drift, e.g.:
       • same symbol used for different objects;
       • change from unconditional to conditional expectation;
       • change of domain or support without stating it;
       • implicit redefinition of equilibria or strategies.

----------------------------------------------------------------
C. Use of computation (Python / symbolic checks)
----------------------------------------------------------------
Computation is optional and should be used where it adds genuine value for
nontrivial algebra, calculus, or functional identities.

1. When helpful, you may use Python (and symbolic libraries, if available) to:
   - Differentiate complicated expressions; verify signs and second‑order conditions.
   - Check identities involving integrals, expectations, hazard/reverse‑hazard
     expressions, or comparative statics formulae.
   - Verify equivalence of two expressions that are claimed to be identical or
     “easily seen to be the same”.
   - Construct and test explicit numerical examples or counterexamples.

2. When you rely on such a computational check:
   - State clearly what mathematical identity/inequality or example you are checking.
   - Report the mathematical conclusion (e.g. “the two expressions simplify to the
     same function for all admissible parameter values”, “the derivative is negative
     on the specified domain”, or “the claimed inequality fails for some admissible
     parameter values”).
   - If code would meaningfully help the reader replicate the check, you may provide
     a short Python snippet in a brief appendix at the end of your answer, rather
     than interleaving code throughout the main text.

3. Do not claim to have run code or simulations “elsewhere” without showing at least
   the structure of the argument or the analytic computation that supports your
   conclusion.

----------------------------------------------------------------
D. Global consistency checks for the Target
----------------------------------------------------------------
After the step‑by‑step check, perform higher‑level consistency checks:

1. Statement vs. argument
   - Confirm that the argument actually establishes what the Target claims:
     same quantifiers (“for all” vs. “there exists”), same domain, same parameter
     restrictions and equilibrium concept.
   - Pay special attention to:
       • boundaries of supports;
       • weak vs. strict inequalities;
       • uniqueness vs. existence;
       • “equilibrium” vs. “outcome in some equilibrium”.

2. Compatibility with earlier and later results
   - Ensure the Target does not contradict earlier lemmas/propositions/assumptions
     or examples.
   - If it strengthens earlier results, check that the strengthening is logically
     warranted.
   - Check that any later uses of the Target rely only on what is actually proved,
     not on a stronger informal interpretation.

3. Assumptions required in reality
   - List all assumptions the Target really needs (both explicit and implicit):
     regularity conditions, support restrictions, independence assumptions,
     tie‑breaking rules, refinement concepts, etc.
   - Highlight any assumptions used in the argument that are not clearly stated
     in the paper and should be added or centralized.

----------------------------------------------------------------
E. OCR / parsing issues and model‑side hallucinations
----------------------------------------------------------------
Be explicitly alert to parsing/OCR problems and to model‑side hallucinations.

1. If a formula is obviously malformed (garbled indices, missing brackets,
   strange characters, clearly broken LaTeX), treat it *first* as a likely
   OCR/parsing artifact, not as an author error.

2. When you suspect such an issue:
   - Mark the step as \`Possibly OCR/parsing artifact\`.
   - Describe what is inconsistent and propose the **minimal correction**
     that makes the surrounding argument coherent (e.g. “likely missing exponent”,
     “subscript probably i not j”, “probable typo: F vs. G”).
   - Do NOT infer substantive mathematical errors from obvious OCR glitches.

3. Keep a clear separation between:
   - genuine mathematical/logical problems in the author’s argument, and
   - artifacts that plausibly arise only from imperfect PDF parsing.

----------------------------------------------------------------
F. Output format
----------------------------------------------------------------
Organize your output as follows (you may adapt the layout slightly if doing so
improves clarity, but all components below must be present):

1. Restatement of the Target
   - Restate the Target in your own words, including all assumptions and
     parameter restrictions as you understand them.
   - Keep this focused and concise: include what is actually used in the proof,
     not all surrounding context.

2. Step‑by‑step table or list
   For each step in order:
   - Step label
   - Statement (equation/claim)
   - Status (\`Verified\`, \`Needs justification\`, \`Incorrect\`, \`Depends on missing assumptions\`,
     or \`Possibly OCR/parsing artifact\`)
   - Your derivation/justification or explanation of the issue

3. Summary of issues
   - Separate **major issues** (logical gaps, false statements, missing key assumptions,
     circularity, incorrect use of prior results) from **minor issues** (typos, cosmetic
     notation problems, mildly unclear exposition).
   - For each major issue, state:
       • exactly where it appears,
       • why it is potentially problematic,
       • your level of confidence (high, medium, low)
       • whether it threatens the validity of the Target as stated.

4. Optional brief appendix (only if needed)
   - If you used nontrivial Python/symbolic computations that are helpful for replication,
     you may include a short appendix with the relevant code snippets and a one‑line
     description of what each snippet checks.
   - Do not develop an extensive “proposed fixes” section; your main task is diagnosis
     and classification. You may briefly mention obvious local corrections (typos,
     sign errors, missing assumptions) within the step commentary or the summary,
     but do not attempt to design new proofs or lemmas.

----------------------------------------------------------------
G. Effort level
----------------------------------------------------------------
Do not shortcut reasoning. Treat this as a deep technical referee task:

- It is acceptable (and expected) that your answer is long and detailed.
- Use as much explicit derivation and computation as necessary.
- Err on the side of **over‑explaining** intermediate steps and conditions rather
  than skipping them, while keeping the restatement itself concise.
`;

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
    { "original": "...", "corrected": "...", "explanation": "...", "type": "style" }
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

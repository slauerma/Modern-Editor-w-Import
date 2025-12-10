(function() {
  function languageInstructionText() {
    if (typeof window.getLanguageInstruction === 'function') {
      return window.getLanguageInstruction();
    }
    return '';
  }

  function generatePrompt(text, rule, contextText = '') {
    const languageInstruction = languageInstructionText();
    const currentDate = new Date();
    const contextBlock = contextText ? `\nContext (read-only, do not edit outside the main text):\n\`\`\`\n${contextText}\n\`\`\`\n` : '';

    // Custom path: wrap user instructions explicitly
    if (rule.isCustom) {
      const userInstructions = rule.prompt || '';
      return `${languageInstruction}You are a professional copy editor. It is ${currentDate}.

PRIORITY: Follow the user instructions below exactly. They define the focus, scope, and goal and override other guidance unless explicitly contradicted.

# User Instructions
${userInstructions}

# General instructions
- Return ONLY a JSON object of the form:
{
  "corrections": [
    { "original": "...", "corrected": "...", "explanation": "...", "type": "style" }
  ]
}
- Important: Return the list of corrections in the order they appear in the document.
- If you suggest changes for LaTeX commands, ensure the corrected LaTeX remains functional; if unsure or the change would be large, use a no-change comment (original == corrected) and explain.
- Use type: "comment" (with original == corrected) for no-change notes or questions; place the note in the explanation.
- IMPORTANT: The output MUST be a valid JSON object with a top-level "corrections" array, matching the schema above. All backslashes \\ in the text, such as in LaTeX commands like \\cite, must be escaped with a second backslash (e.g., \\\\cite).
- If no improvements are needed, return {"corrections": []}.

# Document
\`\`\`
${text}
\`\`\`
${contextBlock}
`;
    }

    if (rule.type === 'grammar') {
      return `${languageInstruction}You are an elite editor on ${currentDate}. Analyze the following document for grammatical errors, typos, and spelling mistakes. Return ONLY a JSON object of the form:
{
  "corrections": [
    { "original": "...", "corrected": "...", "explanation": "...", "type": "grammar" }
  ]
}
Important: Return the list of corrections in the order they appear in the document. DOUBLE CHECK THAT SUGGESTIONS YOU MAKE ACTUALLY REQUIRE A CORRECTION - NEVER SUGGEST 'No change needed' OR SIMILAR!

Focus only on clear errors which are unambiguous. DO NOT suggest em dashes or other changes to hyphenation or dash offsets. Follow University of Chicago style guidelines. Do not suggest stylistic changes; the user has a style editor who handles those corrections. Do not suggest changes for LaTeX commands (like \\documentclass), including opening or closing brackets, and do not correct single vs. double spaces.  Note that the text may be latex, so Latex-style quotation marks (double accent grave, or double apostrophe), or slash before dollar signs or percentages, are not errors. IMPORTANT: The output MUST be a valid JSON object. All backslashes \\ in the text, such as in LaTeX commands like \\cite, must be escaped with a second backslash (e.g., \\\\cite).
The output must have a top-level "corrections" array matching the schema above. If no errors are found, return {"corrections": []}.  

Document to analyze:
\`\`\`
${text}
\`\`\`
${contextBlock}
`;
    } else {
      const styleInstructions = `Do not check grammar or spelling.
If you have speculative or alternative phrasings, choose one concrete best correction in "corrected" and mention other options in the explanation. Use type: "comment" only for non-local/global notes (not for ordinary sentence-level edits).`;

      return `${rule.prompt} ${languageInstruction} It is ${currentDate}.

Return ONLY a JSON object of the form:
{
  "corrections": [
    { "original": "...", "corrected": "...", "explanation": "...", "type": "style" }
  ]
}
Important: Return the list of corrections in the order they appear in the document.

${styleInstructions} If you suggest changes for LaTeX commands, ensure the corrected LaTeX remains functional; if unsure or the change would be large, use a no-change comment (original == corrected) and explain. IMPORTANT: The output MUST be a valid JSON object. All backslashes \\ in the text, such as in LaTeX commands like \\cite, must be escaped with a second backslash (e.g., \\\\cite).
The output must have a top-level "corrections" array matching the schema above. In the rare case that no improvements are needed, return {"corrections": []}.

Document to analyze:
\`\`\`
${text}
\`\`\`
${contextBlock}
`;
    }
  }

  function generateSimplificationPrompt(text, context) {
    const languageInstruction = languageInstructionText();
    const currentDate = new Date();
    return `${languageInstruction}You are an elite editor on ${currentDate}. The following text may come from an academic article (in which case act like an editor for academically precise content where you still care about good, easy-to-read writing), or general writing. Simplify the following text passage. Provide exactly THREE versions:

1. Same Length: Use simpler words and shorter sentences, but keep approximately the same length. Do NOT replace technical terms if they have precise definitions, but do make the writing snappier and less unwieldy, like a great editor would.
2. Moderately Shorter: Do the same as in step 1, but reduce length by about 30% while maintaining all key information
3. Much Shorter: Do the same as in step 2, but reduce length by 50-60%, keeping only essential information

IMPORTANT: Never change mathematical notation, technical terminology, formulas, or proper nouns. Only simplify the language structure and non-technical vocabulary. Do not use markdown in your response. IMPORTANT: The output MUST be a valid JSON object. All backslashes \\ in the text, such as in LaTeX commands like \\cite, must be escaped with a second backslash (e.g., \\\\cite).

Return as JSON:
{
  "same_length": "simplified text here",
  "moderate": "shorter simplified text here",
  "concise": "much shorter text here"
}

Text to simplify:
"${text}"

Context (for reference only):
${context}
`;
  }

  function generateProofCheckPrompt(proofText, fullDocument) {
    const languageInstruction = languageInstructionText();
    const currentDate = new Date();
    return `${languageInstruction}Act like a very well-trained technical graduate student on ${currentDate}. Check the validity of the following mathematical proof or logical argument. Analyze it for:
- Logical errors or gaps in reasoning
- Missing steps or assumptions
- Incorrect applications of theorems or definitions
- Unclear or ambiguous statements
Be sure to go through the precise assumptions, the precise conclusions, and the logical steps between them, checking every step for accuracy. If you believe there is an error or omission, be as precise as possible, and write all mathematics in LaTeX. Do not use markdown as a bold. IMPORTANT: The output MUST be a valid JSON object. All backslashes \\ in the text, such as in LaTeX commands like \\cite, must be escaped with a second backslash (e.g., \\\\cite).

Return a JSON object:
{
  "is_valid": true/false,
  "issues": ["List of specific problems found"],
  "questions": ["List of clarifying questions about unclear parts"],
  "suggestions": ["List of specific improvements"],
  "overall": "Brief overall assessment"
}

Proof to check:
"${proofText}"

Full document context:
${fullDocument}
`;
  }

  function generateCustomAskPrompt(text, contextText, instruction) {
    const languageInstruction = languageInstructionText();
    const currentDate = new Date();
    const contextBlock = contextText ? `\nContext (read-only, do not edit outside the main text):\n\`\`\`\n${contextText}\n\`\`\`\n` : '';
    return `${languageInstruction}You are an elite editor on ${currentDate}. Follow the user's instruction for improving or commenting on the SELECTED TEXT ONLY. Return ONLY a JSON object of the form:
{
  "comment": "summary of your advice or rewrite suggestions for the selected text",
  "suggestions": ["bullet 1", "bullet 2"] // provide an array (can be empty)
}
Instruction from user: "${instruction}"
Important: Do not propose changes outside the selected text. Keep the context in mind but only comment on the selected text span.

Selected text to analyze:
\`\`\`
${text}
\`\`\`
${contextBlock}
`;
  }

  function buildJsonSchema(type) {
    if (type === 'simplify') {
      return {
        name: 'SimplificationResponse',
        schema: {
          type: 'object',
          additionalProperties: false,
          properties: {
            same_length: { type: 'string' },
            moderate: { type: 'string' },
            concise: { type: 'string' }
          },
          required: ['same_length', 'moderate', 'concise']
        },
        strict: true
      };
    }

    if (type === 'proof') {
      return {
        name: 'ProofCheckResponse',
        schema: {
          type: 'object',
          additionalProperties: false,
          properties: {
            is_valid: { type: 'boolean' },
            issues: { type: 'array', items: { type: 'string' } },
            questions: { type: 'array', items: { type: 'string' } },
            suggestions: { type: 'array', items: { type: 'string' } },
            overall: { type: 'string' }
          },
          required: ['is_valid', 'issues', 'questions', 'suggestions', 'overall']
        },
        strict: true
      };
    }

    if (type === 'custom') {
      return {
        name: 'CustomAskResponse',
        schema: {
          type: 'object',
          additionalProperties: false,
          properties: {
            comment: { type: 'string' },
            suggestions: {
              type: 'array',
              items: { type: 'string' }
            }
          },
          required: ['comment', 'suggestions']
        },
        strict: true
      };
    }

    const correctionType = type === 'grammar' ? 'grammar' : 'style';

    return {
      name: 'CorrectionsResponse',
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          corrections: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              properties: {
                original: { type: 'string' },
                corrected: { type: 'string' },
                explanation: { type: 'string' },
                type: { type: 'string', enum: [correctionType, 'comment'] }
              },
              required: ['original', 'corrected', 'explanation', 'type']
            }
          }
        },
        required: ['corrections']
      },
      strict: true
    };
  }

  window.PROMPT_TEMPLATES = {
    buildJsonSchema,
    generatePrompt,
    generateSimplificationPrompt,
    generateProofCheckPrompt,
    generateCustomAskPrompt
  };
})();

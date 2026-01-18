(function() {
  function languageInstructionText() {
    if (typeof window.getLanguageInstruction === 'function') {
      return window.getLanguageInstruction();
    }
    return '';
  }

  function formatInstructionText() {
    if (typeof window.getFormatInstruction === 'function') {
      return window.getFormatInstruction();
    }
    return '';
  }

  const JSON_STRICTNESS_LINE = 'IMPORTANT: The output MUST be a valid JSON object. All backslashes \\\\ in the text, such as in LaTeX commands like \\\\cite, must be escaped with a second backslash (e.g., \\\\\\\\cite).';
  const JSON_TOP_LEVEL_LINE = 'The output must have a top-level "corrections" array matching the schema above.';
  const JSON_ORDER_LINE = 'Important: Return the list of corrections in the order they appear in the document.';
  const JSON_EMPTY_LINE_BY_TYPE = {
    grammar: 'If no errors are found, return {"corrections": []}.',
    style: 'In the rare case that no improvements are needed, return {"corrections": []}.'
  };
  const CUSTOM_COMMENT_GUIDANCE = 'Use type: "comment" (with original == corrected) for notes or questions; place the note in the explanation.';
  const LATEX_EDIT_GUIDANCE = 'If you suggest changes for LaTeX commands, ensure the corrected LaTeX remains functional; if unsure or the change would be large, add a comment-only note instead of editing (type "comment", corrected == original).';
  const LOCALIZATION_RULE = 'Localization rule (non-conservative): Make edits granular and anchor them to the smallest standalone span (typically a sentence). Split broad comments into multiple targeted corrections. If several edits belong to one rewrite, note that in the first explanation.';
  const GRAMMAR_ORDER_LINE = 'Important: Return the list of corrections in the order they appear in the document. DOUBLE CHECK THAT SUGGESTIONS YOU MAKE ACTUALLY REQUIRE A CORRECTION - NEVER SUGGEST "No change needed" OR SIMILAR!';
  const GRAMMAR_FOCUS_GUIDANCE = 'DO NOT suggest em dashes or other changes to hyphenation or dash offsets. Follow University of Chicago style guidelines. Do not suggest stylistic changes; the user has a style editor who handles those corrections. You may suggest changes for LaTeX commands (like \\\\documentclass) when needed; keep LaTeX valid and avoid large restructuring. Do not correct single vs. double spaces. Note that the text may be latex, so Latex-style quotation marks (double accent grave, or double apostrophe), or slash before dollar signs or percentages, are not errors.';

  function buildJsonExample(typeLabel) {
    return `{\n  "corrections": [\n    { "original": "...", "corrected": "...", "explanation": "...", "type": "${typeLabel}" }\n  ]\n}`;
  }

  function buildJsonParagraphGuidance(typeLabel, extraLines = [], options = {}) {
    const orderLine = options.orderLine || JSON_ORDER_LINE;
    const emptyLine = JSON_EMPTY_LINE_BY_TYPE[typeLabel] || JSON_EMPTY_LINE_BY_TYPE.style;
    const lines = [
      `Return ONLY a JSON object of the form:\n${buildJsonExample(typeLabel)}`,
      orderLine,
      ...extraLines,
      JSON_STRICTNESS_LINE,
      JSON_TOP_LEVEL_LINE,
      emptyLine
    ];
    return lines.join('\n');
  }

  function buildJsonBulletGuidance(typeLabel, extraBullets = [], options = {}) {
    const orderLine = options.orderLine || JSON_ORDER_LINE;
    const emptyLine = JSON_EMPTY_LINE_BY_TYPE[typeLabel] || JSON_EMPTY_LINE_BY_TYPE.style;
    const bullets = [
      `Return ONLY a JSON object of the form:\n${buildJsonExample(typeLabel)}`,
      orderLine,
      ...extraBullets,
      JSON_STRICTNESS_LINE,
      JSON_TOP_LEVEL_LINE,
      emptyLine
    ];
    return bullets.map(item => `- ${item}`).join('\n');
  }

  function buildSelectionContextGuidance(text, contextText) {
    const combined = `${text || ''}\n${contextText || ''}`;
    if (!/\[SELECTION_\d+]/.test(combined) && !/\[CONTEXT_\d+]/.test(combined)) {
      return '';
    }
    const lines = [
      'Selection context note:',
      '- These are snippets from a larger document; snippets may start or end mid-word or mid-sentence.',
      '- The editable snippet is wrapped in [SNIPPET_START]/[SNIPPET_END]; do not edit or include the markers.',
      '- Use [CONTEXT_i] (and [FULL_DOCUMENT] if present) to interpret meaning and check consistency.',
      '- Do not complete or infer missing letters/words at snippet boundaries.',
      '- If [SELECTION_i] markers appear, propose corrections only inside those blocks. Otherwise, edit only within [SNIPPET_START]/[SNIPPET_END].',
      '- Every "original" must appear exactly within the allowed snippet text.'
    ];
    return lines.join('\n');
  }

  function buildCustomPromptBody({
    baseInstruction,
    currentDate,
    userInstructions,
    boundaryGuidance,
    text,
    docLabel,
    blockPrefix = '',
    blockSuffix = ''
  }) {
    const jsonBullets = buildJsonBulletGuidance('style', [
      LATEX_EDIT_GUIDANCE,
      CUSTOM_COMMENT_GUIDANCE,
      LOCALIZATION_RULE
    ]);
    const boundaryBlock = boundaryGuidance ? `\n${boundaryGuidance}\n\n` : '\n\n';
    const prefixBlock = blockPrefix ? `${blockPrefix}\n` : '';
    const suffixBlock = blockSuffix ? `\n${blockSuffix}` : '';
    return `${baseInstruction}You are a professional copy editor. It is ${currentDate}.${boundaryBlock}
PRIORITY: Follow the user instructions below exactly. They define the focus, scope, and goal and override other guidance unless explicitly contradicted.

# User Instructions
${userInstructions}

# General instructions
${jsonBullets}

${docLabel}
${prefixBlock}\`\`\`
${text}
\`\`\`${suffixBlock}
`;
  }

  function buildGrammarPromptBody({
    baseInstruction,
    currentDate,
    boundaryGuidance,
    text,
    docLabel,
    subjectLabel = 'document',
    blockPrefix = '',
    blockSuffix = ''
  }) {
    const jsonGuidance = buildJsonParagraphGuidance('grammar', [GRAMMAR_FOCUS_GUIDANCE, LOCALIZATION_RULE], {
      orderLine: GRAMMAR_ORDER_LINE
    });
    const boundaryBlock = boundaryGuidance ? `\n${boundaryGuidance}\n\n` : ' ';
    const prefixBlock = blockPrefix ? `${blockPrefix}\n` : '';
    const suffixBlock = blockSuffix ? `\n${blockSuffix}` : '';
    return `${baseInstruction}You are an elite editor on ${currentDate}. Analyze the following ${subjectLabel} for grammatical errors, typos, and spelling mistakes.${boundaryBlock}${jsonGuidance}

${docLabel}
${prefixBlock}\`\`\`
${text}
\`\`\`${suffixBlock}
`;
  }

  function buildStylePromptBody({
    rulePrompt,
    baseInstruction,
    currentDate,
    boundaryGuidance,
    text,
    docLabel,
    allowGrammar = false,
    blockPrefix = '',
    blockSuffix = ''
  }) {
    const styleInstructions = allowGrammar
      ? ''
      : 'Do not do a general grammar or spelling pass. Only fix grammar/spelling when it is needed to carry out the style instructions or to remove ambiguity.\nIf you have speculative or alternative phrasings, choose one concrete best correction in "corrected" and mention other options in the explanation. Use type: "comment" only for non-local/global notes (not for ordinary sentence-level edits).';
    const guidanceLines = [
      ...(styleInstructions ? [styleInstructions] : []),
      LOCALIZATION_RULE,
      LATEX_EDIT_GUIDANCE
    ];
    const jsonGuidance = buildJsonParagraphGuidance('style', guidanceLines);
    const boundaryBlock = boundaryGuidance ? `\n${boundaryGuidance}\n\n` : '\n\n';
    const prefixBlock = blockPrefix ? `${blockPrefix}\n` : '';
    const suffixBlock = blockSuffix ? `\n${blockSuffix}` : '';
    const prefix = rulePrompt ? `${rulePrompt} ` : '';
    return `${prefix}${baseInstruction}It is ${currentDate}.${boundaryBlock}${jsonGuidance}

${docLabel}
${prefixBlock}\`\`\`
${text}
\`\`\`${suffixBlock}
`;
  }

  function generatePrompt(text, rule, contextText = '') {
    const languageInstruction = languageInstructionText();
    const formatInstruction = formatInstructionText();
    const baseInstruction = `${languageInstruction}${formatInstruction}`;
    const currentDate = new Date();
    const boundaryGuidance = buildSelectionContextGuidance(text, contextText);
    const analysisSubject = boundaryGuidance ? 'snippets from a document' : 'document';
    const snippetPrefix = boundaryGuidance ? '[SNIPPET_START]' : '';
    const snippetSuffix = boundaryGuidance ? '[SNIPPET_END]' : '';
    const docLabel = boundaryGuidance ? 'Snippets to analyze:' : 'Document to analyze:';
    const contextBlock = contextText ? `\nContext (read-only, do not edit outside the main text):\n\`\`\`\n${contextText}\n\`\`\`\n` : '';

    // Custom path: wrap user instructions explicitly
    if (rule.isCustom) {
      const userInstructions = rule.prompt || '';
      return `${buildCustomPromptBody({
        baseInstruction,
        currentDate,
        userInstructions,
        boundaryGuidance,
        text,
        docLabel: boundaryGuidance ? '# Snippets' : '# Document',
        blockPrefix: snippetPrefix,
        blockSuffix: snippetSuffix
      })}${contextBlock}`;
    }

    if (rule.type === 'grammar') {
      return `${buildGrammarPromptBody({
        baseInstruction,
        currentDate,
        boundaryGuidance,
        text,
        docLabel,
        subjectLabel: analysisSubject,
        blockPrefix: snippetPrefix,
        blockSuffix: snippetSuffix
      })}${contextBlock}`;
    } else {
      return `${buildStylePromptBody({
        rulePrompt: rule.prompt || '',
        baseInstruction,
        currentDate,
        boundaryGuidance,
        text,
        docLabel,
        allowGrammar: !!rule.allowGrammar,
        blockPrefix: snippetPrefix,
        blockSuffix: snippetSuffix
      })}${contextBlock}`;
    }
  }

  function generateChunkPromptMessages({
    text,
    rule,
    contextBefore = '',
    contextAfter = '',
    extraContext = '',
    chunkIndex = 0,
    chunkCount = 1
  }) {
    const languageInstruction = languageInstructionText();
    const formatInstruction = formatInstructionText();
    const baseInstruction = `${languageInstruction}${formatInstruction}`;
    const currentDate = new Date();
    const selectionGuidance = buildSelectionContextGuidance(text, extraContext);
    const boundaryGuidance = `Chunk boundary note:
- This is chunk ${chunkIndex + 1} of ${chunkCount}.
- Messages 1/3 and 3/3 are read-only context; only edit the text in Message 2/3.
- The marker "CHUNK CONTINUES" indicates the text is truncated at a boundary; do NOT complete or infer missing text.
- If a sentence or LaTeX environment is cut off at a boundary, do not rewrite it. If needed, add a comment entry (type "comment", corrected == original) noting the truncation.`;
    const combinedGuidance = selectionGuidance
      ? `${boundaryGuidance}\n${selectionGuidance}`
      : boundaryGuidance;
    const analysisSubject = selectionGuidance ? 'snippets from a document' : 'document';
    const snippetPrefix = selectionGuidance ? '[SNIPPET_START]' : '';
    const snippetSuffix = selectionGuidance ? '[SNIPPET_END]' : '';
    const chunkLabel = selectionGuidance ? 'Editable Snippet (Message 2/3):' : 'Editable Chunk (Message 2/3):';
    const chunkHeader = selectionGuidance ? '# Editable Snippet (Message 2/3)' : '# Editable Chunk (Message 2/3)';
    const beforeMarker = contextBefore ? 'CHUNK CONTINUES.' : 'START OF DOCUMENT.';
    const afterMarker = contextAfter ? 'CHUNK CONTINUES.' : 'END OF DOCUMENT.';
    const beforeBlock = contextBefore
      ? `\`\`\`\n${contextBefore}\n\`\`\``
      : '(no preceding context)';
    const afterBlock = contextAfter
      ? `\`\`\`\n${contextAfter}\n\`\`\``
      : '(no following context)';
    const extraBlock = extraContext
      ? `\nAdditional context (read-only, outside the chunk):\n\`\`\`\n${extraContext}\n\`\`\`\n`
      : '';

    const message1 = `Message 1/3: Context BEFORE (read-only).
${beforeBlock}
${beforeMarker}${extraBlock}`;

    let message2 = '';
    if (rule.isCustom) {
      const userInstructions = rule.prompt || '';
      message2 = buildCustomPromptBody({
        baseInstruction,
        currentDate,
        userInstructions,
        boundaryGuidance: combinedGuidance,
        text,
        docLabel: chunkHeader,
        blockPrefix: snippetPrefix,
        blockSuffix: snippetSuffix
      });
    } else if (rule.type === 'grammar') {
      message2 = buildGrammarPromptBody({
        baseInstruction,
        currentDate,
        boundaryGuidance: combinedGuidance,
        text,
        docLabel: chunkLabel,
        subjectLabel: analysisSubject,
        blockPrefix: snippetPrefix,
        blockSuffix: snippetSuffix
      });
    } else {
      message2 = buildStylePromptBody({
        rulePrompt: rule.prompt || '',
        baseInstruction,
        currentDate,
        boundaryGuidance: combinedGuidance,
        text,
        docLabel: chunkLabel,
        allowGrammar: !!rule.allowGrammar,
        blockPrefix: snippetPrefix,
        blockSuffix: snippetSuffix
      });
    }

    const message3 = `Message 3/3: Context AFTER (read-only).
${afterBlock}
${afterMarker}`;

    return [
      { role: 'user', content: message1 },
      { role: 'user', content: message2 },
      { role: 'user', content: message3 }
    ];
  }

  function generateSelectionPromptMessages({
    text,
    rule,
    contextBefore = '',
    contextAfter = '',
    includeFullDocument = false,
    fullDocumentText = ''
  }) {
    const languageInstruction = languageInstructionText();
    const formatInstruction = formatInstructionText();
    const baseInstruction = `${languageInstruction}${formatInstruction}`;
    const currentDate = new Date();
    const totalMessages = includeFullDocument ? 4 : 3;
    const boundaryLines = [
      'Selection context note:',
      `- Messages 1/${totalMessages} and 3/${totalMessages} are read-only context; only edit the text in Message 2/${totalMessages}.`,
      '- These are snippets from a larger document; snippets may start or end mid-word or mid-sentence.',
      `- Use the before/after context to interpret meaning, but propose corrections only for text inside Message 2/${totalMessages}.`,
      '- Do not complete or infer missing letters/words at snippet boundaries.',
      '- The editable snippet is wrapped in [SNIPPET_START]/[SNIPPET_END]; do not edit or include the markers.',
      `- Every "original" must appear exactly in Message 2/${totalMessages}; do not trim or edit context-only text.`
    ];
    if (includeFullDocument) {
      boundaryLines.push(`- Message 4/${totalMessages} is the full document (read-only).`);
      boundaryLines.push(`- Use the full document only for consistency checks; do not propose edits outside Message 2/${totalMessages}.`);
    }
    boundaryLines.push(`- Do not edit text outside Message 2/${totalMessages}.`);
    const boundaryGuidance = boundaryLines.join('\n');
    const analysisSubject = 'snippets from a document';
    const snippetPrefix = '[SNIPPET_START]';
    const snippetSuffix = '[SNIPPET_END]';
    const snippetLabel = `Selected snippet (Message 2/${totalMessages}):`;
    const snippetHeader = `# Selected Snippet (Message 2/${totalMessages})`;

    const beforeBlock = contextBefore
      ? `\`\`\`\n${contextBefore}\n\`\`\``
      : '(no preceding context)';
    const afterBlock = contextAfter
      ? `\`\`\`\n${contextAfter}\n\`\`\``
      : '(no following context)';
    const fullDocBlock = fullDocumentText
      ? `\`\`\`\n${fullDocumentText}\n\`\`\``
      : '(empty document)';

    const message1 = `Message 1/${totalMessages}: Context BEFORE (read-only).
${beforeBlock}`;

    let message2 = '';
    if (rule.isCustom) {
      const userInstructions = rule.prompt || '';
      message2 = buildCustomPromptBody({
        baseInstruction,
        currentDate,
        userInstructions,
        boundaryGuidance,
        text,
        docLabel: snippetHeader,
        blockPrefix: snippetPrefix,
        blockSuffix: snippetSuffix
      });
    } else if (rule.type === 'grammar') {
      message2 = buildGrammarPromptBody({
        baseInstruction,
        currentDate,
        boundaryGuidance,
        text,
        docLabel: snippetLabel,
        subjectLabel: analysisSubject,
        blockPrefix: snippetPrefix,
        blockSuffix: snippetSuffix
      });
    } else {
      message2 = buildStylePromptBody({
        rulePrompt: rule.prompt || '',
        baseInstruction,
        currentDate,
        boundaryGuidance,
        text,
        docLabel: snippetLabel,
        allowGrammar: !!rule.allowGrammar,
        blockPrefix: snippetPrefix,
        blockSuffix: snippetSuffix
      });
    }

    const message3 = `Message 3/${totalMessages}: Context AFTER (read-only).
${afterBlock}`;

    const messages = [
      { role: 'user', content: message1 },
      { role: 'user', content: message2 },
      { role: 'user', content: message3 }
    ];

    if (includeFullDocument) {
      messages.push({
        role: 'user',
        content: `Message 4/${totalMessages}: Full document (read-only).
${fullDocBlock}`
      });
    }

    return messages;
  }

  function generateSimplificationPrompt(text, context) {
    const languageInstruction = languageInstructionText();
    const formatInstruction = formatInstructionText();
    const baseInstruction = `${languageInstruction}${formatInstruction}`;
    const currentDate = new Date();
    return `${baseInstruction}You are an elite editor on ${currentDate}. The following text may come from an academic article (in which case act like an editor for academically precise content where you still care about good, easy-to-read writing), or general writing. Simplify the following text passage. Provide exactly THREE versions:

1. Same Length: Use simpler words and shorter sentences, but keep approximately the same length. Do NOT replace technical terms if they have precise definitions, but do make the writing snappier and less unwieldy, like a great editor would.
2. Moderately Shorter: Do the same as in step 1, but reduce length by about 30% while maintaining all key information
3. Much Shorter: Do the same as in step 2, but reduce length by 50-60%, keeping only essential information

IMPORTANT: Never change mathematical notation, technical terminology, formulas, or proper nouns. Only simplify the language structure and non-technical vocabulary. Do not use markdown in your response.
${JSON_STRICTNESS_LINE}

Return ONLY a JSON object:
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
    const formatInstruction = formatInstructionText();
    const baseInstruction = `${languageInstruction}${formatInstruction}`;
    const currentDate = new Date();
    return `${baseInstruction}Act like a very well-trained technical graduate student on ${currentDate}. Check the validity of the following mathematical proof or logical argument. Analyze it for:
- Logical errors or gaps in reasoning
- Missing steps or assumptions
- Incorrect applications of theorems or definitions
- Unclear or ambiguous statements
Be sure to go through the precise assumptions, the precise conclusions, and the logical steps between them, checking every step for accuracy. If you believe there is an error or omission, be as precise as possible, and write all mathematics in LaTeX. Do not use markdown as a bold.
${JSON_STRICTNESS_LINE}

Return ONLY a JSON object:
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
    const formatInstruction = formatInstructionText();
    const baseInstruction = `${languageInstruction}${formatInstruction}`;
    const currentDate = new Date();
    const contextBlock = contextText ? `\nContext (read-only, do not edit outside the main text):\n\`\`\`\n${contextText}\n\`\`\`\n` : '';
    return `${baseInstruction}You are an elite editor on ${currentDate}. Follow the user's instruction for improving or commenting on the SELECTED TEXT ONLY. Return ONLY a JSON object of the form:
{
  "comment": "summary of your advice or rewrite suggestions for the selected text",
  "suggestions": ["bullet 1", "bullet 2"] // provide an array (can be empty)
}
${JSON_STRICTNESS_LINE}
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

    const allowedTypes = type === 'mixed'
      ? ['grammar', 'style', 'comment']
      : [type === 'grammar' ? 'grammar' : 'style', 'comment'];
    const schemaName = type === 'mixed' ? 'CorrectionsResponseMixed' : 'CorrectionsResponse';

    return {
      name: schemaName,
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
                type: { type: 'string', enum: allowedTypes }
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
    generateChunkPromptMessages,
    generateSelectionPromptMessages,
    generateSimplificationPrompt,
    generateProofCheckPrompt,
    generateCustomAskPrompt
  };
})();

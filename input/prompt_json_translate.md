Translate unstructured review comments into a corrections JSON object for this document.

Goal: produce a JSON object of the form:
{
  "corrections": [
    { "original": "...", "corrected": "...", "explanation": "...", "type": "grammar" | "comment" }
  ]
}

Steps:
1) Read the full document below.
2) Read the unstructured comments below.
3) For each actionable item in the comments, find the exact span in the document.
4) Emit a correction entry with:
   - original: exact text from the document (must match)
   - corrected: the improved text (or keep identical for a "No change comment")
   - explanation: short rationale
   - type: "grammar" (or "comment" if no text change, explanation starts with "No change comment:")
5) If no actionable edits exist, return {"corrections": []}.
6) Escape backslashes (e.g., \\cite) properly for JSON.
7) Return ONLY the JSON object.

Document:
<<<DOCUMENT>>>

Unstructured comments:
<<<COMMENTS>>>

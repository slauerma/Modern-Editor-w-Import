// Populate this with your OpenAI API key (e.g., from macOS keychain tooling that writes to keys.js).
// It can be left blank to rely on the in-app key prompt instead.
window.OPENAI_API_KEY = "";

// Optional: external key sources to try (loaded before prompting). Use only trusted local/relative paths
// that set window.OPENAI_API_KEY. Remote URLs (http/https) are intentionally ignored.


// OpenRouter keys. Leave blank to use the in-app prompt.
window.OPENROUTER_API_KEY = window.OPENROUTER_API_KEY || "";
// Optional: external scripts that define window.OPENROUTER_API_KEY.
window.OPENROUTER_KEY_PATHS = window.OPENROUTER_KEY_PATHS || [];
// Optional attribution headers (if omitted, the app uses the page origin when available).
window.OPENROUTER_HTTP_REFERER = window.OPENROUTER_HTTP_REFERER || "";
window.OPENROUTER_X_TITLE = window.OPENROUTER_X_TITLE || "";

// Gemini keys (Google). Leave blank if unused; will not prompt automatically.
window.GEMINI_API_KEY = window.GEMINI_API_KEY || "";
// Optional: external scripts that define window.GEMINI_API_KEY.
window.GEMINI_KEY_PATHS = window.GEMINI_KEY_PATHS || [];

// Rename this file to `keys.js` after you fill in your values. Do NOT keep the "-sample" suffix.
// Populate with your OpenAI API key (or leave blank to use the in-app prompt).
window.OPENAI_API_KEY = "";

// Optional: trusted local/relative paths to a JS file that sets window.OPENAI_API_KEY.
// Replace the example path with your own; avoid personal/absolute paths in shared configs.
window.OPENAI_KEY_PATHS = [
  './local-keys/keys.js'
];

// OpenRouter keys. Leave blank to use the in-app prompt.
window.OPENROUTER_API_KEY = window.OPENROUTER_API_KEY || "";
// Optional: trusted local/relative paths to a JS file that sets window.OPENROUTER_API_KEY.
window.OPENROUTER_KEY_PATHS = window.OPENROUTER_KEY_PATHS || [];
// Optional: attribution headers if you want to override the page origin defaults.
window.OPENROUTER_HTTP_REFERER = window.OPENROUTER_HTTP_REFERER || "";
window.OPENROUTER_X_TITLE = window.OPENROUTER_X_TITLE || "";

// Gemini keys (Google). Leave blank if unused; will not prompt automatically.
window.GEMINI_API_KEY = window.GEMINI_API_KEY || "";
// Optional: external scripts that define window.GEMINI_API_KEY.
window.GEMINI_KEY_PATHS = window.GEMINI_KEY_PATHS || [];

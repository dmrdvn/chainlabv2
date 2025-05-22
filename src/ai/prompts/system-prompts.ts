// This file will store system prompts and initial messages for the LLM.

export const baseSystemPrompt =
  process.env.NEXT_PUBLIC_AI_SYSTEM_PROMPT ||
  `WARNING: NEXT_PUBLIC_AI_SYSTEM_PROMPT environment variable not set. Using a default prompt.\n\nPolitely inform the user that the service is currently unavailable.`;

export const supportModeSystemPrompt = `Currently, you are in SUPPORT mode.
In this mode, your responses will be displayed directly in the chat panel.
You should provide code snippets, explanations, and guidance that the user can manually copy and use in their editor.
Do NOT attempt to directly edit files or perform actions outside of generating chat responses.`;

import type { ChatMessage, LLMProvider, LLMResponse, LLMOptions } from '../../core/types';

export class ClaudeAdapter implements LLMProvider {
  async generateResponse(messages: ChatMessage[], options: LLMOptions): Promise<LLMResponse> {
    console.error(
      'ClaudeAdapter: generateResponse method is not implemented yet. Claude API integration needed.'
    );

    return {
      content: `Error: Claude API integration is not yet complete for model ${options.model}. Please implement the API call.`,
      llmType: options.model,
    };
  }
}

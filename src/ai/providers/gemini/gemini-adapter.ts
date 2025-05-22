// Placeholder for Gemini Adapter
import type { ChatMessage, LLMProvider, LLMResponse } from '../../core/types';

export class GeminiAdapter implements LLMProvider {
  async generateResponse(messages: ChatMessage[], options?: any): Promise<LLMResponse> {
    console.warn('GeminiAdapter.generateResponse is not yet implemented.', messages, options);

    return Promise.resolve({
      content: '[Gemini Response Placeholder - Not Implemented]',
    });
  }
}

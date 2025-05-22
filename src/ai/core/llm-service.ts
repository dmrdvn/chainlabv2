import type { ChatMessage, LLMProvider, LLMResponse } from './types';
import { ChatGPTAdapter } from '../providers/chatgpt/chatgpt-adapter';
import { GeminiAdapter } from '../providers/gemini/gemini-adapter';

class LLMService {
  private providers: Record<string, LLMProvider> = {};

  constructor() {
    this.providers['openai'] = new ChatGPTAdapter();
    this.providers['gemini'] = new GeminiAdapter();
  }

  async sendMessage(messages: ChatMessage[], llmType: string): Promise<LLMResponse> {
    let providerKey = llmType.split('-')[0].toLowerCase(); // örn: "gemini", "gpt", "claude"

    if (providerKey === 'gpt' || llmType.startsWith('gpt')) {
      providerKey = 'openai';
    } else if (llmType.startsWith('claude')) {
      providerKey = 'claude';
    } else if (llmType.startsWith('gemini')) {
      providerKey = 'gemini';
    }

    const provider = this.providers[providerKey];

    if (!provider) {
      console.error(`No provider found for base key: ${providerKey} (derived from ${llmType})`);
      throw new Error(
        `LLM provider for type "${llmType}" not found. Please check llm-service.ts configuration.`
      );
    }

    return provider.generateResponse(messages, { model: llmType });
  }
}

export const llmService = new LLMService();

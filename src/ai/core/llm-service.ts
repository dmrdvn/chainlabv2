import type { ChatMessage, LLMProvider, LLMResponse, LLMOptions } from './types';
import { ChatGPTAdapter } from '../providers/chatgpt/chatgpt-adapter';
import { GeminiAdapter } from '../providers/gemini/gemini-adapter';
import { SensayAdapter } from '../providers/sensay/sensay-adapter';
import { ClaudeAdapter } from '../providers/claude/claude-adapter';

class LLMService {
  private providers: Record<string, LLMProvider> = {};

  constructor() {
    this.providers['openai'] = new ChatGPTAdapter();
    this.providers['gemini'] = new GeminiAdapter();
    this.providers['sensay'] = new SensayAdapter();
    this.providers['claude'] = new ClaudeAdapter();
  }

  async sendMessage(messages: ChatMessage[], llmType: string): Promise<LLMResponse> {
    let providerKey = '';
    const lowerLlmType = llmType.toLowerCase();

    if (lowerLlmType.startsWith('gpt')) {
      providerKey = 'openai';
    } else if (lowerLlmType.startsWith('claude')) {
      providerKey = 'claude';
    } else if (lowerLlmType.startsWith('gemini')) {
      providerKey = 'gemini';
    } else if (lowerLlmType.startsWith('sensay')) {
      providerKey = 'sensay';
    } else {
      const parts = lowerLlmType.split('-');
      if (parts.length > 0 && this.providers[parts[0]]) {
        providerKey = parts[0];
      } else {
        console.error(`Could not determine provider for LLM type: ${llmType}`);
        throw new Error(`LLM provider for type "${llmType}" not found or ambiguous.`);
      }
    }

    const provider = this.providers[providerKey];

    if (!provider) {
      console.error(`No provider found for resolved key: ${providerKey} (derived from ${llmType})`);
      throw new Error(
        `LLM provider for type "${llmType}" (resolved to key "${providerKey}") not found. Please check llm-service.ts configuration.`
      );
    }

    const options: LLMOptions = { model: llmType };

    return provider.generateResponse(messages, options);
  }
}

export const llmService = new LLMService();

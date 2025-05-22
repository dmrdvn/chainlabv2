export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
  status?: 'sending' | 'completed' | 'error' | 'pending_response';
}

export interface LLMResponse {
  content: string;
}

export interface LLMProvider {
  generateResponse: (messages: ChatMessage[], options?: any) => Promise<LLMResponse>;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
  status?: 'sending' | 'completed' | 'error' | 'pending_response';
}

export interface LLMOptions {
  model: string; // Model adı veya Sensay için Replica UUID
  userId?: string; // Sensay gibi kullanıcı bazlı sistemler için eklendi
  // Gelecekte başka provider'lar için farklı opsiyonlar eklenebilir
}

export interface LLMResponse {
  content: string;
  llmType: string; // Yanıtı üreten LLM'in tipi (örn: gpt-4o, sensay-replica-1)
  // tokens?: { prompt: number; completion: number; total: number }; // Opsiyonel token bilgisi
}

export interface LLMProvider {
  generateResponse: (messages: ChatMessage[], options: LLMOptions) => Promise<LLMResponse>;
}

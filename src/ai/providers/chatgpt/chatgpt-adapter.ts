import axiosInstance from 'src/lib/axios';
import type { ChatMessage, LLMProvider, LLMResponse } from '../../core/types';

const OPENAI_API_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

export class ChatGPTAdapter implements LLMProvider {
  async generateResponse(messages: ChatMessage[], options?: any): Promise<LLMResponse> {
    if (!OPENAI_API_KEY) {
      throw new Error('OpenAI API key is not configured. Please set NEXT_PUBLIC_OPENAI_API_KEY.');
    }

    const apiMessages = messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    try {
      const response = await axiosInstance.post(
        OPENAI_API_URL,
        {
          model: options?.model || 'gpt-4o',
          messages: apiMessages,
          stream: false,
        },
        {
          headers: {
            Authorization: `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const assistantMessage = response.data.choices[0]?.message?.content;
      if (!assistantMessage) {
        throw new Error('No content in assistant_message from OpenAI response');
      }

      return {
        content: assistantMessage,
        llmType: options?.model || 'gpt-4o',
      };
    } catch (error: any) {
      console.error(
        'Error calling OpenAI API with axiosInstance:',
        error.response?.data || error.message
      );

      const errorMessage =
        error.response?.data?.error?.message ||
        (typeof error === 'string' && error.includes('Something went wrong'))
          ? error.response?.data?.error?.message || 'Failed to get detailed error from OpenAI.'
          : error.message || 'Unknown error connecting to OpenAI';
      throw new Error(`OpenAI API Error: ${errorMessage}`);
    }
  }
}

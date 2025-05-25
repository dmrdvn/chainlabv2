import type { ChatMessage, LLMProvider, LLMResponse, LLMOptions } from '../../core/types';

const SENSAY_API_URL = 'https://api.sensay.io/v1';
const ORGANIZATION_SECRET = process.env.NEXT_PUBLIC_SENSAY_API_KEY || '';
const SENSAY_API_VERSION = process.env.NEXT_PUBLIC_SENSAY_API_VERSION || '2025-03-25';

interface SensayCompletionRequest {
  content: string;
}

interface SensayCompletionResponse {
  success: boolean;
  content?: string;
  error?: {
    message: string;
    type: string;
  };
}

export class SensayAdapter implements LLMProvider {
  async generateResponse(messages: ChatMessage[], options: LLMOptions): Promise<LLMResponse> {
    if (!ORGANIZATION_SECRET) {
      console.error(
        'Sensay API secret is not configured in environment variables (SENSAY_SENSAY_API_KEY).'
      );
      throw new Error(
        'Sensay API secret is not configured. Please set SENSAY_SENSAY_API_KEY in your environment variables.'
      );
    }

    const replicaUUID = options.model;

    const actualReplicaUUID = replicaUUID?.startsWith('sensay-')
      ? replicaUUID.substring(7)
      : replicaUUID;

    if (!actualReplicaUUID) {
      throw new Error(
        'Sensay replica UUID must be provided in LLMOptions.model (e.g., "sensay-your-replica-uuid").'
      );
    }

    const userMessages = messages.filter((msg) => msg.role === 'user');
    const lastUserMessage = userMessages[userMessages.length - 1];

    if (!lastUserMessage) {
      throw new Error('No user message found in the chat history for Sensay.');
    }

    const requestBody: SensayCompletionRequest = {
      content: lastUserMessage.content,
    };

    const userIdForRequest = options.userId || 'chainlab_01';

    try {
      const response = await fetch(
        `${SENSAY_API_URL}/replicas/${actualReplicaUUID}/chat/completions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-ORGANIZATION-SECRET': ORGANIZATION_SECRET,
            'X-API-Version': SENSAY_API_VERSION,
            'X-USER-ID': userIdForRequest,
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        console.error('Sensay API Error:', errorData);
        throw new Error(
          `Sensay API request failed with status ${response.status}: ${errorData.message || 'Unknown error'}`
        );
      }

      const data = (await response.json()) as SensayCompletionResponse;

      if (!data.success || !data.content) {
        console.error('Sensay API did not return a successful response or content:', data);
        throw new Error(
          data.error?.message || 'Sensay API call was not successful or content is missing.'
        );
      }

      return {
        content: data.content,
        llmType: options.model || 'sensay-unknown-replica',
      };
    } catch (error) {
      console.error('Error calling Sensay API:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unknown error occurred while communicating with Sensay API.');
    }
  }
}

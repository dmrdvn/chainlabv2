import { NextResponse } from 'next/server';

const SENSAY_API_URL = 'https://api.sensay.io';

const getProviderFromModelId = (modelId: string): string => {
  if (modelId.toLowerCase().includes('gpt')) return 'openai';
  if (modelId.toLowerCase().includes('claude')) return 'anthropic';

  return 'openai';
};

export async function POST(request: Request) {
  const apiKey = process.env.SENSAY_API_KEY;
  const apiVersion = process.env.SENSAY_API_VERSION;
  const userId = process.env.SENSAY_DEFAULT_USER_ID;

  if (!apiKey || !apiVersion || !userId) {
    return NextResponse.json(
      { message: 'Sensay API key, version, or User ID is not configured in server environment.' },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { name, short_description, model: baseModelId, system_prompt, greeting } = body;

    if (!name || !baseModelId || !short_description) {
      return NextResponse.json(
        { message: 'Replica name, short description, and base model ID are required.' },
        { status: 400 }
      );
    }

    const slug = `${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`.substring(0, 100);
    const provider = getProviderFromModelId(baseModelId);

    const llmConfigForSensay: { provider: string; model: string; systemMessage?: string } = {
      provider: provider,
      model: baseModelId,
    };

    if (system_prompt && system_prompt.trim() !== '') {
      llmConfigForSensay.systemMessage = system_prompt;
    }

    const finalSensayPayload = {
      name,
      slug,
      ownerID: userId,
      shortDescription: short_description,
      greeting: greeting || undefined,
      private: false,
      llm: llmConfigForSensay,
    };

    const response = await fetch(`${SENSAY_API_URL}/v1/replicas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-ORGANIZATION-SECRET': apiKey,
        'X-API-Version': apiVersion,
      },
      body: JSON.stringify(finalSensayPayload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Sensay API Error:', errorData);
      return NextResponse.json(
        {
          message: errorData.message || 'Failed to create replica on Sensay API',
          details: errorData.errors || errorData,
          fingerprint: errorData.fingerprint,
        },
        { status: response.status }
      );
    }

    const createdReplica = await response.json();

    return NextResponse.json(
      {
        id: createdReplica.uuid,
        name: finalSensayPayload.name,
        model: baseModelId,
        shortDescription: finalSensayPayload.shortDescription,
        greeting: finalSensayPayload.greeting,
        systemPrompt: llmConfigForSensay.systemMessage,
        createdAt: new Date().toISOString(),
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error in /api/ai/create-sensay-replica:', error);
    return NextResponse.json(
      { message: error.message || 'An unexpected error occurred.' },
      { status: 500 }
    );
  }
}

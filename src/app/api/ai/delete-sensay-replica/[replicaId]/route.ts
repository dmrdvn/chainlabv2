import { NextRequest, NextResponse } from 'next/server';

const SENSAY_API_URL = 'https://api.sensay.io';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ replicaId: string }> }
) {
  const apiKey = process.env.SENSAY_API_KEY;
  const apiVersion = process.env.SENSAY_API_VERSION;
  const { replicaId } = await params;

  if (!apiKey || !apiVersion) {
    return NextResponse.json(
      { message: 'Sensay API key or version is not configured in server environment.' },
      { status: 500 }
    );
  }

  if (!replicaId) {
    return NextResponse.json({ message: 'Replica ID is required for deletion.' }, { status: 400 });
  }

  try {
    const response = await fetch(`${SENSAY_API_URL}/v1/replicas/${replicaId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'X-ORGANIZATION-SECRET': apiKey,
        'X-API-Version': apiVersion,
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.warn(`Replica with ID ${replicaId} not found on Sensay. Proceeding as if deleted.`);
        return NextResponse.json(
          { message: 'Replica not found on Sensay, assumed deleted.' },
          { status: 200 }
        );
      }
      const errorData = await response.json().catch(() => null);
      console.error('Sensay API Error during deletion:', errorData);
      return NextResponse.json(
        {
          message: errorData?.message || 'Failed to delete replica on Sensay API',
          details: errorData?.errors || errorData,
          fingerprint: errorData?.fingerprint,
        },
        { status: response.status }
      );
    }

    if (response.status === 204 || response.status === 200) {
      return NextResponse.json(
        { message: `Replica ${replicaId} deleted successfully from Sensay.` },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        message: `Replica ${replicaId} deletion returned status ${response.status}. Check Sensay API documentation.`,
      },
      { status: response.status }
    );
  } catch (error: any) {
    console.error('Error in /api/ai/delete-sensay-replica route handler:', error);
    return NextResponse.json(
      { message: error.message || 'An unexpected error occurred during the deletion process.' },
      { status: 500 }
    );
  }
}

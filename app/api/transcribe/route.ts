import { NextResponse } from 'next/server';
import { safeRequireUser } from '@/lib/auth/safe-stack';

async function transcribeAudio(audioData: Buffer | ArrayBuffer): Promise<string> {
  try {
    const formData = new FormData();
    const uint8Array = audioData instanceof Buffer ? new Uint8Array(audioData) : new Uint8Array(audioData);
    const audioBlob = new Blob([uint8Array], { type: 'audio/webm' });
    formData.append('file', audioBlob, 'audio.webm');
    formData.append('model', 'whisper-1');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to transcribe audio');
    }

    const data = await response.json();
    return data.text;
  } catch (error) {
    console.error('Audio transcription error:', error);
    throw new Error('Failed to transcribe audio');
  }
}

export async function POST(request: Request) {
  try {
    await safeRequireUser();
    
    const body = await request.json();
    const { audioData, organizationId } = body;

    if (!audioData) {
      return NextResponse.json({ error: 'No audio data provided' }, { status: 400 });
    }

    // Extract base64 data and convert to buffer
    const base64Audio = audioData.replace('data:audio/webm;base64,', '');
    const audioBuffer = Buffer.from(base64Audio, 'base64');

    // Transcribe the audio
    const transcription = await transcribeAudio(audioBuffer);

    return NextResponse.json({ 
      success: true, 
      transcription: transcription.trim() 
    });

  } catch (error) {
    console.error('Transcription API error:', error);
    if (error instanceof Error && error.message === 'Not authenticated') {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    return NextResponse.json({ 
      error: 'Failed to transcribe audio',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

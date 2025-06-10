import { handleImageRequest } from '@/app/lib/image';
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Proxy endpoint for the OpenAI Responses API
export async function POST(req: NextRequest) {
	const body = await req.json();

    const result = await handleImageRequest(body.image, body.history);
    console.log('result', result);

    return NextResponse.json(result);
}

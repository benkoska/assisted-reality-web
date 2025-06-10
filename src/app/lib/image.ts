// This runs on the server
import { Agent, run } from '@openai/agents';
import type { RealtimeItem } from '@openai/agents/realtime';
import z from 'zod';

const agent = new Agent({
    name: 'Image Expert',
    instructions: 'You are an image expert. The user will have asked a question about what they are looking at. You will need to determine the response to their question based on the image provided, which is taken from the users point of view.',
    model: 'gpt-4.1-nano',
});

export async function handleImageRequest(
    image: string,
    history: RealtimeItem[],
) {
    const input = `
To answer the user's last question, it was determined that an image of their current view was needed.

Current conversation history:
${JSON.stringify(history, null, 2)}
`.trim();

console.log('input', input);

    const result = await run(agent, [
        {
            type: 'message',
            content: input,
            role: 'user'
        },
        {
            type: 'message',
            content: [{
                type: 'input_image',
                image: image
            }],
            role: 'user'
        }
    ]);

console.log('got a result');

    return JSON.stringify({ output: result.finalOutput }, null, 2);
}
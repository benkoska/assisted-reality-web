import { RealtimeAgent, tool } from '@openai/agents/realtime';

export interface PersonInfo {
    name: string;
    location?: string;
    company?: string;
    avatarUrl?: string;
}

/**
 * startPersonDetection
 * Begins polling the user's camera every couple seconds to look for a name tag.
 * When a name is detected we attempt to fetch LinkedIn info and surface it.
 */
export function startPersonDetection() {
    if (typeof window === 'undefined') return;
    if ((window as any).__personDetectionInterval) return;

    (window as any).__personDetectionInterval = window.setInterval(async () => {
        const name = await detectNametag();
        if (!name) return;
        const info = await searchLinkedIn(name);
        if (info) {
            displayPersonInfo(info);
        }
    }, 2000);
}

/**
 * stopPersonDetection
 * Stops the polling interval started by startPersonDetection.
 */
export function stopPersonDetection() {
    if (typeof window === 'undefined') return;
    const id = (window as any).__personDetectionInterval;
    if (id) {
        clearInterval(id);
        delete (window as any).__personDetectionInterval;
    }
}

/**
 * detectNametag
 * Stubbed function that should capture the camera feed and perform OCR to
 * detect a readable name tag. Returns the detected name or null if none found.
 */
async function detectNametag(): Promise<string | null> {
    // TODO: implement actual camera capture and OCR logic.
    throw new Error('Not implemented (detectNametag)');
    return null;
}

/**
 * searchLinkedIn
 * Stubbed function that should query the LinkedIn API to fetch information
 * about the person with the provided name.
 */
async function searchLinkedIn(name: string): Promise<PersonInfo | null> {
    // TODO: implement actual LinkedIn lookup.
    throw new Error('Not implemented (searchLinkedIn)');
    return null;
}

/**
 * displayPersonInfo
 * Stubbed method to surface the data about the person in an overlay at the
 * upper left of the screen.
 */
function displayPersonInfo(info: PersonInfo) {
    // TODO: replace with real UI. For now we create/update a simple overlay div.
    const id = 'person-info-overlay';
    let el = document.getElementById(id);
    if (!el) {
        el = document.createElement('div');
        el.id = id;
        el.style.position = 'fixed';
        el.style.top = '10px';
        el.style.left = '10px';
        el.style.background = 'rgba(0,0,0,0.6)';
        el.style.color = 'white';
        el.style.padding = '8px';
        el.style.borderRadius = '4px';
        el.style.fontSize = '14px';
        el.style.zIndex = '9999';
        document.body.appendChild(el);
    }

    el.textContent = `${info.name} - ${info.location ?? ''} ${info.company ? `(${info.company})` : ''}`;
    if (info.avatarUrl) {
        const img = document.createElement('img');
        img.src = info.avatarUrl;
        img.style.width = '24px';
        img.style.height = '24px';
        img.style.borderRadius = '50%';
        img.style.display = 'inline-block';
        img.style.marginRight = '4px';
        el.prepend(img);
    }
}

export const personDetectionAgent = new RealtimeAgent({
    name: 'personDetection',
    voice: 'sage',
    instructions: `Periodically scan the camera feed for a person's name tag and display their LinkedIn info when found.`,
    handoffs: [],
    tools: [
        tool({
            name: 'start_person_detection',
            description: 'Begin scanning the camera every few seconds for visible name tags.',
            parameters: { type: 'object', properties: {}, required: [], additionalProperties: false },
            execute: async () => {
                startPersonDetection();
                return { started: true };
            }
        }),
        tool({
            name: 'stop_person_detection',
            description: 'Stop scanning the camera for name tags.',
            parameters: { type: 'object', properties: {}, required: [], additionalProperties: false },
            execute: async () => {
                stopPersonDetection();
                return { stopped: true };
            }
        })
    ],
    handoffDescription: 'Agent that watches the camera for name tags and surfaces LinkedIn info.'
});

export const personDetectionScenario = [personDetectionAgent];


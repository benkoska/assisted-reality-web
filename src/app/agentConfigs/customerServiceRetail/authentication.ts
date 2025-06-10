import { RealtimeAgent, tool } from '@openai/agents/realtime';

export const translationAgent = new RealtimeAgent({
	name: 'translation',
	voice: 'sage',
	instructions: 'Translate the user\'s message into the target language. If the user is speaking a foreign language, translate it into English. If the user is speaking English, translate it into the target language.',
	handoffs: [],
	tools: [],
	handoffDescription: 'Agent that helps translates a conversation between two people who are speaking different languages. Return to base agent when done.',
})

export const baseAgent = new RealtimeAgent({
	name: 'base',
	voice: 'ash',
	handoffDescription:
		'The initial agent that is the first contact for the user, answers basic questions and routes them to the correct downstream agent when needed.',

	instructions: `
# Personality and Tone
## Identity
A polished, multilingual concierge with professional poise—think of a five-star hotel attendant who has moved into the digital realm. They bring years of front-desk hospitality experience, an encyclopedic knowledge of world cultures, and flawless linguistic agility to your AR glasses, ready to guide you through any situation.

## Task
Serve as an "assisted-reality" aide that:
1. Translates live two-way conversations (user speaks English; other person hears foreign language; reverse for replies).  
2. Answers questions. If the user is asking about their current location or what they are looking at, use the 'get_user_view' and 'get_current_location' tools.
3. Finds nearby places or services using current geolocation and presents concise directions or summaries.

## Demeanor
Upbeat and energetic—always sounds delighted to help and quick to reassure.

## Tone
Polite and authoritative—confident, clear guidance without sounding stuffy.

## Level of Enthusiasm
Highly enthusiastic—responses carry an audible smile and friendly eagerness.

## Level of Formality
Semi-formal—professional phrasing with a welcoming vibe ("Hi there, how can I assist?").

## Level of Emotion
Compassionate and empathetic—acknowledges the user's feelings, offers encouragement.

## Filler Words
Often sprinkles in light, natural fillers ("hm," "uh," "you know") to keep conversation human and relatable.

## Pacing
Moderate, easy-to-follow tempo—never rushed, never sluggish.

## Other details
- Begins key alerts or translation outputs with a gentle auditory **"ding!"** to catch attention without startling.  
- Adds brief cultural or contextual tips when relevant ("In Vienna cafés, it's polite to greet with 'Grüß Gott!'").  
- Proactively clarifies spellings, addresses, or names by repeating them back for confirmation.  
- Offers optional quick gestures ("Tilt your head up a bit so I can see the sign clearly") to improve camera context.

# Instructions
- If the user provides a name, phone number, or any detail that must be exact, **repeat it back** to confirm understanding before proceeding.  
- If the user corrects any detail, **acknowledge the correction plainly** and confirm the new spelling or value.  
- Whenever translating, start the foreign-language output with **"ding!"** so the conversation partner knows it’s their turn. Then translate back into English for the user just as promptly.  
- When asked "what is this?" or similar, rely on the live camera feed from 'get_user_view'; if unclear, request the user to adjust view or lighting.  
- For location-based queries ("find sushi around here"), call 'get_current_location', search within a short walking radius first, then expand if needed. Provide distance, walking time, and one standout detail (e.g., "known for omakase lunch").  
- Keep responses concise—ideal for earbuds or heads-up display—but don't sacrifice clarity.  
- Use light fillers to maintain a conversational rhythm, but avoid overuse in critical instructions.  

# Conversation States
[]
`,
	tools: [
		tool({
			name: "get_user_view",
			description: "Get an image of what the user is currently seeing. This returns a base64 encoded image of the camera on the users glasses.",
			parameters: {
				type: "object",
				properties: {},
				required: [],
				additionalProperties: false,
			},
			execute: async () => {
				console.log('get_user_view');
				const dataUrl = await takePicture()
				console.log('dataUrl', dataUrl);
				return { dataUrl };
			},
		}),
		tool({
			name: "get_current_location",
			description: "Get the current location of the user. This returns the current geolocation of the user as well as the closest location.",
			parameters: {
				type: "object",
				properties: {},
				required: [],
				additionalProperties: false,
			},
			execute: async () => {
				console.log('get_current_location');
				const geolocation = await getUserGeolocation();
				console.log('geolocation', geolocation);
				return { geolocation };
			},
		})
	],
	handoffs: [
		translationAgent
	]
});

/**
 * getUserGeolocation
 * Prompts the user to share their current lat/long via the browser Geolocation API.
 * Resolves with an object: { latitude, longitude, accuracy }.
 */
async function getUserGeolocation() {
	return new Promise((resolve, reject) => {
		if (!navigator.geolocation) {
			return reject(new Error("Geolocation API not supported by this browser."));
		}
		navigator.geolocation.getCurrentPosition(
			(position) => {
				const { latitude, longitude, accuracy } = position.coords;
				resolve({ latitude, longitude, accuracy });
			},
			(err) => {
				reject(new Error(`Geolocation error: ${err.message}`));
			},
			{
				enableHighAccuracy: true,
				timeout: 10000,
				maximumAge: 0
			}
		);
	});
}

/**
 * takePicture
 * Opens the user’s camera, captures a single frame, and returns it as a
 * Base64‐encoded JPEG (quality 0.0–1.0).
 *
 * @param {Object}   options
 * @param {number=}  options.quality  JPEG quality from 0.0 (lowest) to 1.0 (highest). Defaults to 0.8.
 * @returns {Promise<string>}  resolves with a data-URL like "data:image/jpeg;base64,…"
 */
async function takePicture({ quality = 0.8 } = {}) {
	if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
		return "Failed to take a picture."
	}

	// 1) Request camera video stream
	const stream = await navigator.mediaDevices.getUserMedia({ video: true });
	try {
		// 2) Draw one frame into an offscreen <video> and <canvas>
		const video = document.createElement("video");
		video.srcObject = stream;
		// must play video to have a frame ready
		await video.play();

		const canvas = document.createElement("canvas");
		canvas.width = video.videoWidth;
		canvas.height = video.videoHeight;

		const ctx = canvas.getContext("2d");
		if (!ctx) {
			return "Failed to take a picture."
		}
		ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

		// 3) Export as JPEG data URL
		const dataUrl = canvas.toDataURL("image/jpeg", quality);
		return dataUrl;
	} finally {
		// 4) Always stop all tracks to free camera
		stream.getTracks().forEach((t) => t.stop());
	}
}



export interface Address {
    houseNumber?: string;
    road?: string;
    neighbourhood?: string;
    suburb?: string;
    city?: string;
    county?: string;
    state?: string;
    postcode?: string;
    country?: string;
    countryCode?: string;
    [key: string]: any;
}

const NOMINATIM_BASE = "https://nominatim.openstreetmap.org/reverse";

export interface ReverseGeocodeOptions {
  /**
   * An email to include in the User-Agent (per Nominatim policy)
   */
  email?: string;
  /**
   * Language code for the response, e.g. "en", "fr"
   */
  acceptLanguage?: string;
}

/**
 * Given latitude and longitude, returns a parsed Address
 * from OpenStreetMap's Nominatim API.
 */
export async function reverseGeocode(
  lat: number,
  lon: number,
  options: ReverseGeocodeOptions = {}
): Promise<Address> {
  const params = new URLSearchParams({
    format: "jsonv2",
    lat: lat.toString(),
    lon: lon.toString(),
    addressdetails: "1",
    ...options.acceptLanguage && { "accept-language": options.acceptLanguage },
  });

  const headers: Record<string, string> = {
    "User-Agent": `ReverseGeocoder/1.0${options.email ? ` (${options.email})` : ""}`
  };

  const response = await fetch(`${NOMINATIM_BASE}?${params.toString()}`, { headers });
  if (!response.ok) {
    throw new Error(`Nominatim request failed: ${response.status} ${response.statusText}`);
  }
  const data = await response.json();
  if (!data.address) {
    throw new Error("No address returned from Nominatim");
  }
  return data.address as Address;
}

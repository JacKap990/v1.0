import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

/**
 * Get a Gemini text model instance.
 * Uses gemini-2.5-flash for fast, free-tier-friendly responses.
 */
export function getGeminiModel() {
    return genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
}

/**
 * Get a Gemini model with Vision capabilities (for image analysis like receipts).
 */
export function getGeminiVisionModel() {
    return genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
}

/**
 * Helper: Convert a base64 data URL to a Gemini-compatible inline image part.
 */
export function base64ToGeminiPart(base64DataUrl: string) {
    // Extract mime type and data from data URL
    const match = base64DataUrl.match(/^data:(.*?);base64,(.*)$/);
    if (!match) throw new Error("Invalid base64 data URL");

    return {
        inlineData: {
            mimeType: match[1],
            data: match[2],
        },
    };
}

/**
 * Ask Gemini a simple text question and get a string response.
 * Includes a simple retry logic for 429 (Quota) errors.
 */
export async function askGemini(prompt: string, retries = 2): Promise<string> {
    try {
        const model = getGeminiModel();
        const result = await model.generateContent(prompt);
        return result.response.text();
    } catch (error: any) {
        if (retries > 0 && (error?.message?.includes("429") || error?.message?.includes("quota"))) {
            console.log(`Gemini Quota reached. Retrying in 2s... (${retries} left)`);
            await new Promise(resolve => setTimeout(resolve, 2000));
            return askGemini(prompt, retries - 1);
        }
        throw error;
    }
}

/**
 * Send an image (base64) + text prompt to Gemini Vision and get a response.
 */
export async function askGeminiWithImage(prompt: string, base64Image: string): Promise<string> {
    const model = getGeminiVisionModel();
    const imagePart = base64ToGeminiPart(base64Image);
    const result = await model.generateContent([prompt, imagePart]);
    return result.response.text();
}

import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        // In the future this will receive the image and call OpenAI GPT-4 Vision
        // const body = await req.json();
        // const { imageBase64 } = body;

        // Simulate AI Processing delay
        await new Promise((resolve) => setTimeout(resolve, 3000));

        // Return a smart mock response
        const mockDetectedItems = [
            { name: "חלב טרי תנובה 3%", quantity: 2, unit: "יחידה", emoji: "🥛", category: "מוצרי חלב" },
            { name: "לחם אחיד פרוס", quantity: 1, unit: "יחידה", emoji: "🍞", category: "לחם ומאפים" },
            { name: "קוטג' תנובה 5%", quantity: 3, unit: "יחידה", emoji: "🧀", category: "מוצרי חלב" },
            { name: "ביצים L קרטון", quantity: 1, unit: "יחידה", emoji: "🥚", category: "מוצרי חלב וביצים" },
            { name: "עגבניות מארז", quantity: 1, unit: "יחידה", emoji: "🍅", category: "ירקות ופירות" }
        ];

        return NextResponse.json({ success: true, items: mockDetectedItems });
    } catch (error) {
        console.error("OCR API Error:", error);
        return NextResponse.json({ success: false, error: "Failed to process receipt" }, { status: 500 });
    }
}

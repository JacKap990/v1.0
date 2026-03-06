export const runtime = 'edge';
import { NextResponse } from "next/server";
import { askGeminiWithImage } from "@/lib/gemini";

export async function POST(req: Request) {
    try {
        const { image } = await req.json();

        if (!image) {
            return NextResponse.json({ error: "No image provided" }, { status: 400 });
        }

        const prompt = `אתה עוזר חכם שמנתח תמונות של קבלות קנייה מסופרמרקטים בישראל.
נתח את הקבלה בתמונה וחלץ את רשימת המוצרים.

עבור כל מוצר, החזר:
- name: שם המוצר בעברית (קצר ונקי, בלי קודי מוצר)
- quantity: כמות (מספר, ברירת מחדל 1)
- category: קטגוריה מתוך: חלב וביצים, בשר ודגים, ירקות ופירות, לחם ומאפים, שתייה, חטיפים ומתוקים, שימורים, ניקיון, תבלינים ורטבים, קפואים, כללי
- emoji: אימוג'י אחד שמתאים למוצר

חשוב מאוד:
- תתעלם משורות של מחירים, מע"מ, סיכום, הנחות ותאריכים.
- רק מוצרים אמיתיים.
- אם אתה לא בטוח לגבי שם מוצר מסוים, תנחש את הסביר ביותר.

החזר JSON בלבד (בלי markdown, בלי backticks) בפורמט:
[{"name": "חלב תנובה 3%", "quantity": 2, "category": "חלב וביצים", "emoji": "🥛"}, ...]`;

        const response = await askGeminiWithImage(prompt, image);

        // Parse the JSON response (Gemini sometimes wraps in markdown)
        let products;
        try {
            // Try to extract JSON from potential markdown wrapping
            const jsonMatch = response.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                products = JSON.parse(jsonMatch[0]);
            } else {
                products = JSON.parse(response);
            }
        } catch (parseErr) {
            console.error("Failed to parse Gemini response:", response);
            return NextResponse.json({
                error: "Failed to parse AI response",
                raw: response
            }, { status: 422 });
        }

        return NextResponse.json({ success: true, products });
    } catch (error: any) {
        console.error("Receipt scan error:", error);

        const msg = error?.message || "";
        if (msg.includes("429") || msg.includes("quota") || msg.includes("Too Many Requests")) {
            return NextResponse.json({
                error: "המכסה היומית של ה-AI נגמרה. נסה שוב בעוד כדקה."
            }, { status: 429 });
        }

        return NextResponse.json({
            error: "שגיאה בניתוח הקבלה. נסה שוב."
        }, { status: 500 });
    }
}

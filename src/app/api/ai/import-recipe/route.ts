import { NextResponse } from "next/server";
import { askGemini } from "@/lib/gemini";

export async function POST(req: Request) {
    try {
        const { url } = await req.json();

        if (!url) {
            return NextResponse.json({ error: "URL is required" }, { status: 400 });
        }

        // Step 1: Fetch the webpage HTML
        let html: string;
        try {
            const res = await fetch(url, {
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                    "Accept-Language": "he-IL,he;q=0.9,en;q=0.8",
                }
            });
            html = await res.text();
        } catch (fetchErr) {
            return NextResponse.json({ error: "Could not fetch URL" }, { status: 400 });
        }

        // Step 2: Trim the HTML to reduce token usage (take only <body> content, limit size)
        const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
        const bodyText = bodyMatch ? bodyMatch[1] : html;
        // Strip script/style tags and limit to ~15000 chars
        const cleanText = bodyText
            .replace(/<script[\s\S]*?<\/script>/gi, "")
            .replace(/<style[\s\S]*?<\/style>/gi, "")
            .replace(/<[^>]+>/g, " ")
            .replace(/\s+/g, " ")
            .trim()
            .slice(0, 15000);

        // Step 3: Send to Gemini for extraction
        const prompt = `אתה צריך לחלץ מתכון מתוך טקסט של דף אינטרנט ישראלי.
הנה הטקסט:
---
${cleanText}
---

חלץ ממנו מתכון מובנה וארגן אותו בפורמט JSON בלבד (בלי markdown, בלי backticks):
{
  "title": "שם המתכון בעברית",
  "description": "תיאור קצר של המנה",
  "prepTime": "זמן הכנה (למשל: 30 דקות)",
  "servings": מספר_מנות,
  "ingredients": [
    {"name": "שם המצרך", "amount": "כמות", "unit": "יחידה"},
    ...
  ],
  "instructions": ["שלב 1...", "שלב 2...", ...],
  "tags": ["קל", "צמחוני", ...]
}

חשוב:
- אם יש כמה מתכונים בדף, קח רק את הראשון/מרכזי.
- תרגם את הכל לעברית אם צריך.
- אם אתה לא מוצא מתכון, החזר: {"error": "no recipe found"}`;

        const response = await askGemini(prompt);

        let recipe;
        try {
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                recipe = JSON.parse(jsonMatch[0]);
            } else {
                recipe = JSON.parse(response);
            }
        } catch (parseErr) {
            console.error("Failed to parse recipe response:", response);
            return NextResponse.json({
                error: "Failed to parse AI response",
                raw: response
            }, { status: 422 });
        }

        if (recipe.error) {
            return NextResponse.json({ success: false, error: recipe.error }, { status: 404 });
        }

        return NextResponse.json({ success: true, recipe });
    } catch (error: any) {
        console.error("Recipe import error:", error);

        const msg = error?.message || "";
        if (msg.includes("429") || msg.includes("quota") || msg.includes("Too Many Requests")) {
            return NextResponse.json({
                error: "המכסה היומית של ה-AI נגמרה. נסה שוב בעוד כדקה."
            }, { status: 429 });
        }

        return NextResponse.json({
            error: "שגיאה בייבוא המתכון. נסה שוב."
        }, { status: 500 });
    }
}

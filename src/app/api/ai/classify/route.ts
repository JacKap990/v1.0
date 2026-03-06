import { NextResponse } from "next/server";
import { askGemini } from "@/lib/gemini";

export async function POST(request: Request) {
    try {
        const { name } = await request.json();

        if (!name || typeof name !== "string") {
            return NextResponse.json({ error: "שם מוצר חסר" }, { status: 400 });
        }

        const prompt = `אתה מנוע סיווג מוצרים ישראלי. בהינתן שם מוצר, החזר JSON בלבד (בלי markdown):
{
  "category": "קטגוריה אחת למוצר (בחר מהרשימה: מוצרי חלב, לחם ומאפים, בשר ועוף, ירקות, פירות, שתייה, חטיפים ומתוקים, שימורים, תבלינים ורטבים, דגנים וקטניות, ניקיון, טיפוח, מוצרי תינוקות, קפואים, כללי)",
  "emoji": "אימוג'י מתאים אחד שמייצג את המוצר",
  "baseProductName": "שם הבסיס של המוצר ללא תיאור מותג או גודל (למשל: 'חלב תנובה 3%' -> 'חלב', 'במבה אסם' -> 'במבה')",
  "manufacturer": "שם היצרן (למשל: תנובה, אסם, שטראוס) או null אם לא ידוע",
  "brand": "שם המותג (למשל: יופיקס, עלית) או null אם לא ידוע",
  "kosher": "סטטוס כשרות (למשל: כשר חלבי, בד\"צ, רבנות) או null אם לא ידוע",
  "estimatedShelfDays": מספר ימי שמירות מוערך (חלב=7, לחם=5, שימורים=365 וכו'),
  "unit": "יחידת מידה מתאימה (יח', ק\"ג, ליטר, גרם, מ\"ל, חבילה)"
}

שם המוצר: "${name}"`;

        const response = await askGemini(prompt);

        let result;
        try {
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                result = JSON.parse(jsonMatch[0]);
            } else {
                result = JSON.parse(response);
            }
        } catch {
            return NextResponse.json({
                success: true,
                category: "כללי",
                emoji: "📦",
                estimatedShelfDays: 30,
                unit: "יח'"
            });
        }

        return NextResponse.json({
            success: true,
            ...result
        });
    } catch (error: any) {
        console.error("Classification error:", error);

        const msg = error?.message || "";
        if (msg.includes("429") || msg.includes("quota") || msg.includes("Too Many Requests")) {
            return NextResponse.json({
                success: true,
                category: "כללי",
                emoji: "📦",
                estimatedShelfDays: 30,
                unit: "יח'"
            });
        }

        return NextResponse.json({
            success: true,
            category: "כללי",
            emoji: "📦",
            estimatedShelfDays: 30,
            unit: "יח'"
        });
    }
}

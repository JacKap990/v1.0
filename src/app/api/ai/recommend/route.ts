import { NextResponse } from "next/server";
import { askGemini } from "@/lib/gemini";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/auth/serverAuth";

export async function POST() {
    try {
        const userId = await getUserId();

        // Step 1: Get the user's current inventory
        const items = await prisma.inventoryItem.findMany({
            where: { userId },
            select: {
                name: true,
                quantity: true,
                unit: true,
                category: true,
                expiryDate: true,
            }
        });

        if (items.length === 0) {
            return NextResponse.json({
                success: false,
                error: "המלאי שלך ריק. הוסף מוצרים כדי לקבל המלצות!"
            }, { status: 400 });
        }

        // Step 2: Build a summary of inventory for the prompt
        const inventorySummary = items.map(i => {
            let expInfo = "";
            if (i.expiryDate) {
                const daysLeft = Math.ceil((new Date(i.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                if (daysLeft <= 3) expInfo = ` ⚠️ (יפוג בעוד ${daysLeft} ימים!)`;
                else if (daysLeft <= 7) expInfo = ` (יפוג בעוד ${daysLeft} ימים)`;
            }
            return `- ${i.name}: ${i.quantity} ${i.unit}${expInfo}`;
        }).join("\n");

        // Step 3: Get User dietary preferences
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { familySize: true, dietaryTags: true }
        });

        const dietaryInfo = user?.dietaryTags
            ? `העדפות תזונה: ${user.dietaryTags}`
            : "אין העדפות תזונה מיוחדות";
        const familySize = user?.familySize || 1;

        const prompt = `אתה שף AI ישראלי מוכשר ומנוסה מאוד. המשימה שלך היא להציע 3 מתכונים ברמה מקצועית, עשירים בטעם ומדויקים, המבוססים על המלאי הקיים.
        
חשוב מאוד: אל תציע מתכונים בסיסיים מדי (כמו "חביתה עם ירק"). המשתמש מצפה למתכונים "אמיתיים" ומלאים (למשל: פלאפל ביתי מבוסס חומוס, שקשוקה חריפה ומיוחדת, תבשיל קדירה עשיר, סלטים מורכבים וכו').

המלאי שלי:
${inventorySummary}

${dietaryInfo}
גודל משפחה: ${familySize} אנשים

כללים קולינריים:
1. כל מתכון חייב לכלול לפחות 5-10 מרכיבים (אם המלאי מאפשר, השתמש בתבלינים ושילובים חכמים).
2. ציין בבירור אילו מרכיבים קיימים במלאי (✅) ואילו חסרים (❌).
3. העדף מוצרים שעומדים לפוג (מסומנים ב-⚠️).
4. הוראות ההכנה צריכות להיות מפורטות ומקצועיות.
5. התאם כמויות ל-${familySize} אנשים.

החזר JSON בלבד (בלי markdown, בלי backticks) בפורמט:
[
  {
    "title": "שם המנה (מושך ומקצועי)",
    "description": "תיאור קולינרי מעורר תיאבון",
    "prepTime": "זמן הכנה",
    "difficulty": "קל/בינוני/מתקדם",
    "usesExpiring": true/false,
    "ingredients": [{"name": "מצרך", "amount": "כמות מדויקת", "fromPantry": true/false}],
    "instructions": ["שלב 1 כולל טכניקה...", "שלב 2...", ...],
    "emoji": "🍳"
  }
]`;

        const response = await askGemini(prompt);

        let recipes;
        try {
            const jsonMatch = response.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                recipes = JSON.parse(jsonMatch[0]);
            } else {
                recipes = JSON.parse(response);
            }
        } catch (parseErr) {
            console.error("Failed to parse recommendations:", response);
            return NextResponse.json({
                error: "ה-AI החזיר תשובה בפורמט לא תקין. נסה שוב.",
                raw: response
            }, { status: 422 });
        }

        return NextResponse.json({ success: true, recipes });
    } catch (error: any) {
        console.error("Recommendation error:", error);

        const msg = error?.message || "";
        if (msg.includes("429") || msg.includes("quota") || msg.includes("Too Many Requests")) {
            return NextResponse.json({
                error: "המכסה החינמית של Google Gemini הסתיימה לרגע זה (מגבלת Google). אנא המתן כדקה ונסה שוב. המערכת עוברת ל-Flash 2.0 כדי למזער תקלות אלו."
            }, { status: 429 });
        }

        return NextResponse.json({
            error: "שגיאה בחיבור למנוע ה-AI. נסה שוב מאוחר יותר."
        }, { status: 500 });
    }
}

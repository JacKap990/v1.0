import { askGemini, askGeminiWithImage } from "@/lib/gemini";
import { getUserId } from "@/lib/auth/serverAuth";
import { NextResponse } from "next/server";

export const runtime = 'edge';

export async function POST(req: Request, { params }: { params: { action: string } }) {
    const { action } = params;

    // Auth check for most AI actions
    const userId = await getUserId();
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();

        switch (action) {
            case "chat":
                return handleChat(body);
            case "scan-receipt":
                return handleScanReceipt(body);
            case "classify":
                return handleClassify(body);
            case "import-recipe":
                return handleImportRecipe(body);
            case "recommend":
                return handleRecommend(body);
            case "generate-rates":
                return handleGenerateRates(body);
            default:
                return NextResponse.json({ error: "Invalid action" }, { status: 400 });
        }
    } catch (error: any) {
        console.error(`AI Gateway Error [${action}]:`, error);

        const msg = error?.message || "";
        if (msg.includes("429") || msg.includes("quota")) {
            return NextResponse.json({ error: "המכסה היומית של ה-AI נגמרה. נסה שוב בעוד כדקה." }, { status: 429 });
        }

        return NextResponse.json({ error: error.message || "שגיאה בפעולת ה-AI" }, { status: 500 });
    }
}

async function handleChat(body: any) {
    const { messages } = body;
    const lastMsg = messages[messages.length - 1]?.content;

    const prompt = `אתה עוזר חכם למטבח בשם "המזווה".
    ענה למשתמש בעברית בצורה מנומסת.

    באפשרותך לבצע פעולות במערכת על ידי הוספת תגית <action> בפורמט JSON בסוף ההודעה.
    פעולות נתמכות:
    - {"type": "add_item", "payload": {"name": "...", "quantity": 1, "unit": "..."}}
    - {"type": "delete_item", "payload": {"id": "..."}}
    - {"type": "update_quantity", "payload": {"id": "...", "quantity": 2}}
    - {"type": "add_to_list", "payload": {"name": "...", "quantity": 1}}

    הודעת משתמש: ${lastMsg}`;

    const response = await askGemini(prompt, messages.slice(0, -1));
    return NextResponse.json({ content: response });
}

async function handleScanReceipt(body: any) {
    const { image } = body;
    const prompt = `אתה עוזר חכם שמנתח תמונות של קבלות קנייה מסופרמרקטים בישראל.
    נתח את הקבלה בתמונה וחלץ את רשימת המוצרים.

    עבור כל מוצר, החזר:
    - name: שם המוצר בעברית (קצר ונקי)
    - quantity: כמות (מספר)
    - category: קטגוריה (חלב וביצים, בשר ודגים, ירקות ופירות, לחם ומאפים, שתייה, חטיפים ומתוקים, שימורים, ניקיון, תבלינים ורטבים, קפואים, כללי)
    - emoji: אימוג'י מתאים

    החזר JSON בלבד במבנה: [{"name": "...", "quantity": 1, "category": "...", "emoji": "..."}]`;

    const response = await askGeminiWithImage(prompt, image);
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error("Could not find JSON in AI response");

    return NextResponse.json({ success: true, products: JSON.parse(jsonMatch[0]) });
}

async function handleClassify(body: any) {
    const { name } = body;
    const prompt = `סווג את המוצר "${name}" לקטגוריה ותן אימוג'י.
    קטגוריות: חלב וביצים, בשר ודגים, ירקות ופירות, לחם ומאפים, שתייה, חטיפים ומתוקים, שימורים, ניקיון, תבלינים ורטבים, קפואים, כללי.
    החזר JSON: {"category": "...", "emoji": "..."}`;

    const response = await askGemini(prompt);
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Could not find JSON in AI response");

    return NextResponse.json(JSON.parse(jsonMatch[0]));
}

async function handleImportRecipe(body: any) {
    const { text } = body;
    const prompt = `נתח את המתכון: ${text}
    חלץ JSON: {"title": "...", "ingredients": [], "instructions": [], "time": "..."}`;

    const response = await askGemini(prompt);
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Could not find JSON in AI response");

    return NextResponse.json(JSON.parse(jsonMatch[0]));
}

async function handleRecommend(body: any) {
    const { inventory } = body;
    const prompt = `המלאי שלי: ${JSON.stringify(inventory)}
    המלץ על מתכון אחד שאפשר להכין.
    החזר JSON: {"title": "...", "description": "..."}`;

    const response = await askGemini(prompt);
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Could not find JSON in AI response");

    return NextResponse.json(JSON.parse(jsonMatch[0]));
}
async function handleGenerateRates(body: any) {
    const { items } = body;
    const prompt = `אתה מנתח צריכה למשק בית ממוצע בישראל.
    עבור כל אחד מהמוצרים הבאים בארון/מקרר, הערך כמה ימים (בממוצע) לוקח לסיים את המוצר לפי הכמות שיש כרגע.
    שים לב: חלק מהמוצרים הם גרסאות שונות של אותו מוצר בסיס (למשל חלב תנובה וחלב טרה).
    הערך את ימי הצריכה עבור מוצר הבסיס.

    המוצרים:
    ${JSON.stringify(items)}

    החזר JSON בלבד (ללא markdown וללא הערות) במבנה הבא:
    [
      { "id": "מזהה המוצר", "estimatedDays": מספר_ימים (למשל 7) }
    ]`;

    const response = await askGemini(prompt);
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error("Could not find JSON in AI response");

    return NextResponse.json({ success: true, rates: JSON.parse(jsonMatch[0]) });
}

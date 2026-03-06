export const runtime = 'edge';
import { NextResponse } from "next/server";
import { askGemini } from "@/lib/gemini";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/auth/serverAuth";

export async function POST(req: Request) {
    try {
        const userId = await getUserId();
        const { messages } = await req.json();

        if (!messages || !Array.isArray(messages)) {
            return NextResponse.json({ error: "Messages are required" }, { status: 400 });
        }

        // 1. Get Inventory Context
        const items = await prisma.inventoryItem.findMany({
            where: { userId },
            select: {
                id: true,
                name: true,
                quantity: true,
                unit: true,
                category: true,
                expiryDate: true,
            }
        });

        const inventorySummary = items.map(i => {
            let expInfo = "";
            if (i.expiryDate) {
                const daysLeft = Math.ceil((new Date(i.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                if (daysLeft <= 3) expInfo = " (⚠️ עומד לפוג!)";
            }
            // Include ID for tool use
            return `- ${i.name} (ID: ${i.id}): ${i.quantity} ${i.unit}${expInfo}`;
        }).join("\n") || "המלאי כרגע ריק.";

        // 2. Get Shopping List Context
        const lists = await prisma.shoppingList.findMany({
            where: { userId },
            include: { items: { select: { name: true, quantity: true, unit: true, isChecked: true } } }
        });

        const listSummary = lists.map(l => {
            const itemDetails = l.items.map(i => `${i.name} (${i.quantity} ${i.unit})${i.isChecked ? ' [V]' : ''}`).join(", ");
            return `- ${l.name} (${l.type}): ${itemDetails || "חלקה"}`;
        }).join("\n") || "אין רשימות כרגע.";

        // 3. Get User Context
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { familySize: true, dietaryTags: true }
        });

        const systemicPrompt = `אתה "מנהל המזווה החכם" - עוזר אישי מקצועי, חד ובקיא בניהול משק הבית.
המשימה שלך היא לנהל את המלאי ואת רשימות הקניות בצורה אקטיבית.

**הקשר המלאי הנוכחי:**
${inventorySummary}

**רשימות קניות נוכחיות:**
${listSummary}

העדפות תזונה: ${user?.dietaryTags || "אין"}
גודל משפחה: ${user?.familySize || 1} אנשים

**לוגיקת ניהול (מנוע הצריכה):**
1. לכל מוצר יש "קצב צריכה" (למשל: בקבוק אקונומיקה מספיק לחודשיים).
2. אם מוצר נקנה לפני חודש וקצב הצריכה שלו הוא חודשיים, הוא כרגע ב-50% תכולה.
3. תפקידך להתריע על מוצרים שצפויים להיגמר בקרוב ולהוסיף אותם ל"רשימת קניות" (type: home) או להציע זאת למשתמש.

**סמכויות ופעולות:**
אם המשתמש מבקש לעדכן, למחוק או להוסיף, עליך להחזיר בלוק JSON בתוך תגיות <action>.
דוגמאות:
<action>{"type": "update_quantity", "payload": {"id": "123", "quantity": 5}}</action>
<action>{"type": "add_item", "payload": {"name": "חלב", "quantity": 2, "unit": "ליטר"}}</action>
<action>{"type": "add_to_list", "payload": {"name": "ביצים", "quantity": 1, "unit": "מארז"}}</action>

סוגי פעולות:
- update_quantity: שינוי כמות פריט במלאי (InventoryItem). דורש "id" ו-"quantity".
- add_item: הוספת פריט חדש למלאי (InventoryItem). דורש "name", "quantity", "unit".
- delete_item: מחיקת פריט מהמלאי (InventoryItem). דורש "id".
- add_to_list: הוספת פריט לרשימת הקניות הראשית. דורש "name", "quantity", "unit".

כללים לשיחה:
1. דבר בעברית טבעית, מקצועית וישירה.
2. אל תחשוף מזהי ID למשתמש.
3. אם מוצר עומד להיגמר לפי החישוב שלך, שאל את המשתמש אם להוסיף אותו ל"רשימת קניות".
4. תמיד תעדף שימוש במוצרים עם תוקף קצר.

היסטוריית השיחה:
${messages.map((m: any) => `${m.role === 'user' ? 'משתמש' : 'עוזר'}: ${m.content}`).join("\n")}
עוזר:`;

        const response = await askGemini(systemicPrompt);

        return NextResponse.json({ content: response });
    } catch (error: any) {
        console.error("Chat error:", error);

        const msg = error?.message || "";
        if (msg.includes("429") || msg.includes("quota") || msg.includes("Too Many Requests")) {
            return NextResponse.json({
                content: "אופס! נראה שהגענו למכסה החינמית של Google Gemini לרגע זה. אנא המתינו כדקה ונסו שוב. (שגיאת Quota 429)"
            });
        }

        return NextResponse.json({ error: "שגיאה בחיבור ל-AI" }, { status: 500 });
    }
}

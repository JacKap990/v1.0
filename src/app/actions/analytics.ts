"use server";

import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/auth/serverAuth";
import { askGemini } from "@/lib/gemini";

export async function getAnalytics() {
    try {
        const userId = await getUserId();

        // 1. Get Inventory Data
        const items = await prisma.inventoryItem.findMany({
            where: { userId },
            orderBy: { expiryDate: 'asc' }
        });

        if (items.length === 0) {
            return { success: true, data: null };
        }

        // 2. Simple Statistics
        const totalItems = items.length;
        const lowStock = items.filter((i: any) => (i.quantity || 0) <= 0.2 * (i.minQuantity || 1)).length;
        const expiringSoon = items.filter(i => {
            if (!i.expiryDate) return false;
            const daysLeft = Math.ceil((new Date(i.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
            return daysLeft >= 0 && daysLeft <= 3;
        }).length;

        // 3. Group by Base Product Name
        const groups: Record<string, any> = {};
        items.forEach(i => {
            const groupKey = (i as any).baseProductName || i.name;
            if (!groups[groupKey]) {
                groups[groupKey] = {
                    name: groupKey,
                    totalQty: 0,
                    totalMinQty: 0,
                    avgRate: 0,
                    count: 0,
                    unit: i.unit,
                    category: i.category || "אחר"
                };
            }
            groups[groupKey].totalQty += i.quantity || 0;
            groups[groupKey].totalMinQty += (i as any).minQuantity || 1;
            groups[groupKey].avgRate += (i as any).consumptionRate || 7;
            groups[groupKey].count += 1;
        });

        const groupedItems = Object.values(groups).map((g: any) => {
            const avgRate = g.avgRate / g.count;
            const weeklyUsage = (g.totalQty / avgRate) * 7;
            const monthlyUsage = (g.totalQty / avgRate) * 30;
            const percentage = Math.min(100, Math.round((g.totalQty / g.totalMinQty) * 100));

            return {
                name: g.name,
                quantity: g.totalQty,
                unit: g.unit,
                category: g.category,
                weeklyUsage: weeklyUsage.toFixed(1),
                monthlyUsage: monthlyUsage.toFixed(1),
                percentage
            };
        });

        // 4. Category Breakdown
        const categories: Record<string, number> = {};
        items.forEach(i => {
            const cat = i.category || "אחר";
            categories[cat] = (categories[cat] || 0) + 1;
        });

        return {
            success: true,
            data: {
                totalItems,
                lowStock,
                expiringSoon,
                categories,
                predictions: [],
                items: groupedItems.sort((a, b) => a.percentage - b.percentage)
            }
        };
    } catch (error) {
        console.error("Analytics Action Error:", error);
        return { success: false, error: "שגיאה בטעינת נתוני ניתוח" };
    }
}

export async function generateSmartConsumptionRates() {
    try {
        const userId = await getUserId();
        const items = await prisma.inventoryItem.findMany({
            where: { userId },
            select: { id: true, name: true, category: true, quantity: true, unit: true, baseProductName: true }
        });

        if (items.length === 0) return { success: true, updated: 0 };

        // Group by base name for AI context
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

        const aiResponse = await askGemini(prompt);
        const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
        if (!jsonMatch) return { success: false, error: "AI failed to return valid JSON" };

        const rates = JSON.parse(jsonMatch[0]);

        let updated = 0;
        for (const rate of rates) {
            if (rate.id && rate.estimatedDays > 0) {
                // Update specific item
                await prisma.inventoryItem.update({
                    where: { id: rate.id, userId },
                    data: { consumptionRate: Math.round(rate.estimatedDays) }
                });
                updated++;
            }
        }

        return { success: true, updated };
    } catch (error) {
        console.error("Failed to generate smart rates:", error);
        return { success: false, error: "Failed to generate smart rates" };
    }
}

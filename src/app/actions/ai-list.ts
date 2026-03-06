"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getUserId } from "@/lib/auth/serverAuth";
import { isRunningLow } from "@/lib/consumption";

export async function syncAiShoppingList() {
    try {
        const userId = await getUserId();
        if (!userId) return { success: false };

        // 1. Find or create the AI list
        let aiList = await prisma.shoppingList.findFirst({
            where: { userId, name: "רשימת AI" }
        });

        if (!aiList) {
            aiList = await prisma.shoppingList.create({
                data: {
                    userId,
                    name: "רשימת AI",
                    icon: "🤖",
                    type: "ai"
                }
            });
        }

        // 2. Get all inventory items running low
        const inventory = await prisma.inventoryItem.findMany({
            where: { userId }
        });

        const lowItems = inventory.filter(item =>
            isRunningLow(item.updatedAt, item.quantity, item.consumptionRate || 7)
        );

        // 3. Get current items in the AI list to avoid duplicates
        const existingItems = await prisma.shoppingListItem.findMany({
            where: { shoppingListId: aiList.id },
            select: { name: true }
        });
        const existingNames = new Set(existingItems.map(i => i.name.toLowerCase()));

        // 4. Add missing items
        let addedCount = 0;
        for (const item of lowItems) {
            if (!existingNames.has(item.name.toLowerCase())) {
                await prisma.shoppingListItem.create({
                    data: {
                        shoppingListId: aiList.id,
                        name: item.name,
                        category: item.category || "כללי",
                        emoji: item.emoji,
                        imageUrl: item.imageUrl,
                        manufacturer: item.manufacturer,
                        brand: (item as any).brand,
                        baseProductName: (item as any).baseProductName,
                        quantity: 1,
                        unit: item.unit || "יח'"
                    }
                });
                addedCount++;
            }
        }

        if (addedCount > 0) {
            revalidatePath(`/list/${aiList.id}`);
            revalidatePath("/lists");
        }

        return { success: true, addedCount };
    } catch (error) {
        console.error("AI Sync failed:", error);
        return { success: false };
    }
}

"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getUserId } from "@/lib/auth/serverAuth";
import { calculateSmartExpiry } from "@/lib/smartEngine";
import { normalizeProductData, getRecommendedUnit } from "@/lib/unitConversion";

export async function getShoppingLists() {
    try {
        const userId = await getUserId();
        await ensureDefaultLists(userId); // Ensure user has basic lists

        const lists = await db.shoppingList.findMany({
            where: { userId },
            include: {
                _count: {
                    select: { items: true }
                },
                items: {
                    where: { isChecked: true }
                }
            },
            orderBy: { updatedAt: "desc" },
        });

        // Map to UI friendly
        return lists.map((list: any) => ({
            ...list,
            totalCount: list._count.items,
            checkedCount: list.items.length
        }));
    } catch (error) {
        console.error("Failed to fetch shopping lists:", error);
        return [];
    }
}

export async function createShoppingList(name: string, icon: string = "🛒") {
    try {
        const userId = await getUserId();
        const list = await db.shoppingList.create({
            data: { name, icon, userId },
        });
        revalidatePath("/");
        return { success: true, list };
    } catch (error) {
        console.error("Failed to create shopping list:", error);
        return { success: false, error: "Failed to create list" };
    }
}

export async function getShoppingListById(listId: string) {
    try {
        const userId = await getUserId();
        const list = await db.shoppingList.findFirst({
            where: { id: listId, userId },
            include: {
                items: {
                    orderBy: { addedAt: "desc" }
                }
            }
        });
        return list;
    } catch (err) {
        return null;
    }
}

function extractBaseName(name: string): string {
    if (!name) return "";
    return name.trim().split(" ")[0] || name;
}

export async function addShoppingListItem(listId: string, name: string, emoji?: string, remoteImage?: string, category?: string, manufacturer?: string, brand?: string, baseProductName?: string) {
    try {
        const userId = await getUserId();
        // Verify ownership
        const list = await db.shoppingList.findFirst({ where: { id: listId, userId } });
        if (!list) throw new Error("List not found or unauthorized");

        const { quantity, unit } = normalizeProductData(name, 1, "יח'");

        const item = await db.shoppingListItem.create({
            data: {
                shoppingListId: listId,
                name,
                category: category || "כללי",
                emoji,
                imageUrl: remoteImage,
                manufacturer: manufacturer || null,
                brand: (brand as any) || null,
                brandName: (brand as any) || null, // Temporary fix if the field was renamed in client
                baseProductName: (baseProductName as any) || extractBaseName(name),
                quantity,
                unit
            } as any
        });
        revalidatePath(`/list/${listId}`);
        return { success: true, item };
    } catch (err) {
        return { success: false };
    }
}

export async function toggleListItemChecked(itemId: string, isChecked: boolean, listId: string) {
    try {
        const userId = await getUserId();
        if (!userId) return { success: false };

        // Ownership check: verify the list belongs to this user
        const list = await db.shoppingList.findFirst({
            where: { id: listId, userId }
        });
        if (!list) return { success: false };

        await db.shoppingListItem.update({
            where: { id: itemId },
            data: { isChecked }
        });
        revalidatePath(`/list/${listId}`);
        return { success: true };
    } catch (err) {
        return { success: false };
    }
}

export async function clearCheckedItems(listId: string) {
    try {
        const userId = await getUserId();
        await db.shoppingListItem.deleteMany({
            where: { shoppingListId: listId, isChecked: true }
        });
        revalidatePath(`/list/${listId}`);
        return { success: true };
    } catch (err) {
        return { success: false };
    }
}

export async function finishShoppingRoute(listId: string) {
    try {
        const userId = await getUserId();

        // Find all checked items
        const checkedItems = await db.shoppingListItem.findMany({
            where: { shoppingListId: listId, isChecked: true }
        });

        if (checkedItems.length === 0) return { success: true, count: 0 };

        // Move to Inventory
        const inventoryData = checkedItems.map((item: any) => {
            const { quantity, unit } = normalizeProductData(item.name, item.quantity, item.unit);
            return {
                userId,
                name: item.name,
                quantity,
                unit,
                category: item.category || "כללי",
                emoji: item.emoji,
                imageUrl: item.imageUrl,
                manufacturer: item.manufacturer,
                brand: (item as any).brand,
                kosher: (item as any).kosher,
                packWeight: (item as any).packWeight,
                packUnit: (item as any).packUnit,
                baseProductName: (item as any).baseProductName || extractBaseName(item.name),
                expiryDate: calculateSmartExpiry(item.name).toISOString(),
            };
        });

        await db.inventoryItem.createMany({
            data: inventoryData
        });

        // Delete from list
        await db.shoppingListItem.deleteMany({
            where: { shoppingListId: listId, isChecked: true }
        });

        revalidatePath(`/list/${listId}`);
        revalidatePath(`/inventory`);
        return { success: true, count: checkedItems.length };
    } catch (err) {
        console.error("Failed to finish shopping:", err);
        return { success: false };
    }
}

export async function updateItemQuantity(itemId: string, quantity: number, listId: string) {
    try {
        const userId = await getUserId();
        await db.shoppingListItem.update({
            where: { id: itemId },
            data: { quantity }
        });
        revalidatePath(`/list/${listId}`);
        return { success: true };
    } catch (err) {
        return { success: false };
    }
}

export async function updateShoppingListItemDetails(itemId: string, name: string, emoji?: string, listId?: string) {
    try {
        await db.shoppingListItem.update({
            where: { id: itemId },
            data: { name, emoji }
        });
        if (listId) revalidatePath(`/list/${listId}`);
        return { success: true };
    } catch (err) {
        return { success: false };
    }
}

export async function deleteShoppingListItem(itemId: string, listId?: string) {
    try {
        const userId = await getUserId();
        if (!userId) return { success: false };

        // Ownership check: verify the list belongs to this user
        if (listId) {
            const list = await db.shoppingList.findFirst({
                where: { id: listId, userId }
            });
            if (!list) return { success: false };
        }

        await db.shoppingListItem.delete({
            where: { id: itemId }
        });
        if (listId) revalidatePath(`/list/${listId}`);
        return { success: true };
    } catch (err) {
        return { success: false };
    }
}

export async function deleteShoppingList(listId: string) {
    try {
        const userId = await getUserId();
        await db.shoppingList.delete({
            where: {
                id: listId,
                userId: userId
            }
        });
        revalidatePath("/");
        return { success: true };
    } catch (err) {
        console.error("Failed to delete shopping list:", err);
        return { success: false, error: "Failed to delete list" };
    }
}

export async function ensureDefaultLists(userId: string) {
    const defaultConfigs = [
        { name: "רשימת קניות", icon: "🛒", type: "home" },
        { name: "רשימת AI חכמה", icon: "🤖", type: "ai" }
    ];

    for (const config of defaultConfigs) {
        // Check both by name and type to avoid duplicates if renamed
        const exists = await db.shoppingList.findFirst({
            where: {
                userId,
                OR: [
                    { name: config.name },
                    { type: config.type }
                ]
            }
        });

        if (!exists) {
            await db.shoppingList.create({
                data: {
                    userId,
                    name: config.name,
                    icon: config.icon,
                    type: config.type
                }
            });
        } else if (exists.type !== config.type || exists.icon !== config.icon) {
            // Update existing to ensure correct type/icon if it was legacy
            await db.shoppingList.update({
                where: { id: exists.id },
                data: { type: config.type, icon: config.icon }
            });
        }
    }
}

export async function addItemToDefaultList(item: { name: string; emoji?: string; category?: string; unit?: string; quantity?: number }) {
    try {
        const userId = await getUserId();
        let list = await db.shoppingList.findFirst({
            where: { userId, name: "רשימת קניות" }
        });

        if (!list) {
            await ensureDefaultLists(userId);
            list = await db.shoppingList.findFirst({
                where: { userId, name: "רשימת קניות" }
            });
        }

        if (!list) throw new Error("Could not find or create default list");

        const { quantity, unit } = normalizeProductData(item.name, 1, item.unit || getRecommendedUnit(item.name));

        await db.shoppingListItem.create({
            data: {
                shoppingListId: list.id,
                name: item.name,
                emoji: item.emoji,
                category: item.category || "כללי",
                unit: unit,
                quantity: item.quantity || quantity
            }
        });

        revalidatePath("/lists");
        return { success: true };
    } catch (err) {
        console.error("Move to list failed:", err);
        return { success: false };
    }
}

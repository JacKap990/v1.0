"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { calculateSmartExpiry } from "@/lib/smartEngine";
import { getUserId } from "@/lib/auth/serverAuth";
import { getRecommendedUnit, normalizeProductData } from "@/lib/unitConversion";

function extractBaseName(name: string): string {
    if (!name) return "";
    // Remove brands and common descriptors to get a "base" product
    const commonBrands = ["תנובה", "טרה", "שטראוס", "יטבתה", "גד", "מחלבות", "אסם", "עלית", "סוגת", "וילי פוד", "Tnuva", "Tara", "Strauss", "Yotvata", "Elite", "Osem"];
    let base = name.trim();

    // Remove brands
    commonBrands.forEach(brand => {
        const regex = new RegExp(`\\b${brand}\\b`, "i");
        base = base.replace(regex, "");
    });

    // Remove percentage and descriptors like "1%", "3%", "Milk" adjectives
    base = base.replace(/\d+%/g, "")
        .replace(/דל שומן/g, "")
        .replace(/מועשר/g, "")
        .replace(/בשקית/g, "")
        .replace(/בקרטון/g, "");

    return base.trim().split(" ")[0] || base.trim();
}

export async function getInventory() {
    try {
        const userId = await getUserId();
        const items = await db.inventoryItem.findMany({
            where: { userId },
            orderBy: { expiryDate: "asc" },
        });
        return items;
    } catch (error) {
        console.error("Failed to fetch inventory:", error);
        return [];
    }
}

export async function addInventoryItem(data: {
    name: string;
    category?: string;
    quantity: number;
    unit: string;
    expiryDate?: Date;
    emoji?: string;
    remoteImage?: string;
    barcode?: string;
    baseProductName?: string | null;
    manufacturer?: string | null;
    brand?: string | null;
    kosher?: string | null;
    packWeight?: number | null;
    packUnit?: string | null;
}) {
    // Normalize unit/qty before saving (e.g. fix 1.5g Milk -> 1.5L)
    const { quantity, unit } = normalizeProductData(data.name, data.quantity, data.unit);

    try {
        const { remoteImage, ...itemData } = data;
        const userId = await getUserId();

        console.log("Adding inventory item for user:", userId, data.name);

        const item = await db.inventoryItem.create({
            data: {
                ...itemData,
                quantity: quantity || 1,
                unit: unit || "יח'",
                userId,
                imageUrl: remoteImage || null,
                barcode: data.barcode || null,
                baseProductName: data.baseProductName || extractBaseName(data.name),
                expiryDate: data.expiryDate || calculateSmartExpiry(data.name),
                manufacturer: data.manufacturer || null,
                brand: (data.brand as any) || null,
                kosher: data.kosher || null,
                packWeight: data.packWeight || null,
                packUnit: data.packUnit || null,
                consumptionRate: 7, // Default to 7 days per unit for initial tracking
            } as any,
        });

        console.log("Successfully added item:", item.id);
        revalidatePath("/inventory");
        return { success: true, item };
    } catch (error) {
        console.error("CRITICAL: Failed to add inventory item:", error);
        return { success: false, error: error instanceof Error ? error.message : "Failed to add item" };
    }
}

// Alias for addInventoryItem to match function name expected in Scanner 
export const addItemToInventory = addInventoryItem;

export async function updateInventoryQuantity(id: string, quantity: number) {
    try {
        const userId = await getUserId();

        // Fetch current item to get baseProductName
        const item = await db.inventoryItem.findUnique({
            where: { id, userId }
        });

        if (!item) return { success: false, error: "Item not found" };

        if (quantity <= 0) {
            // If item is finished, we could calculate a consumption rate here
            // For now, let's just delete or set to 0
            await db.inventoryItem.delete({
                where: { id, userId },
            });

            // SYNC LOGIC: If this item is finished, and it has a baseProductName,
            // we should technically update a "UserProductPreference" or similar
            // to store the consumption rate for this BASE product.
            // Since we don't have that table yet, we'll just ensure baseProductName is consistent.
        } else {
            await db.inventoryItem.update({
                where: { id, userId },
                data: { quantity },
            });
        }

        revalidatePath("/inventory");
        return { success: true };
    } catch (error) {
        console.error("Failed to update inventory quantity:", error);
        return { success: false, error: "Failed to update item" };
    }
}

export async function deleteInventoryItem(id: string) {
    try {
        const userId = await getUserId();
        await db.inventoryItem.delete({
            where: { id, userId },
        });
        revalidatePath("/inventory");
        return { success: true };
    } catch (error) {
        console.error("Failed to delete inventory item:", error);
        return { success: false, error: "Failed to delete item" };
    }
}

export async function updateInventoryItemDetails(id: string, name: string, emoji?: string) {
    try {
        const userId = await getUserId();
        await db.inventoryItem.update({
            where: { id, userId },
            data: { name, emoji }
        });
        revalidatePath("/inventory");
        return { success: true };
    } catch (error) {
        console.error("Failed to update inventory item details:", error);
        return { success: false };
    }
}

export async function addMultipleItemsToInventory(items: {
    name: string;
    category?: string;
    quantity: number;
    unit: string;
    expiryDate?: Date;
    emoji?: string;
    remoteImage?: string;
    manufacturer?: string | null;
    brand?: string | null;
    kosher?: string | null;
    packWeight?: number | null;
    packUnit?: string | null;
    baseProductName?: string | null;
}[]) {
    try {
        const userId = await getUserId();

        const data = items.map(item => {
            const { quantity, unit } = normalizeProductData(item.name, item.quantity, item.unit || getRecommendedUnit(item.name));
            return {
                name: item.name,
                userId,
                category: item.category || "כללי",
                quantity,
                unit,
                emoji: item.emoji || "📦",
                imageUrl: item.remoteImage,
                expiryDate: item.expiryDate || calculateSmartExpiry(item.name),
                baseProductName: item.baseProductName || extractBaseName(item.name),
                manufacturer: item.manufacturer,
                brand: item.brand,
                kosher: item.kosher,
                packWeight: item.packWeight,
                packUnit: item.packUnit,
            };
        });

        const createdCount = await db.inventoryItem.createMany({
            data: data
        });

        revalidatePath("/inventory");
        return { success: true, count: createdCount.count };
    } catch (error) {
        console.error("Failed to add multiple items to inventory:", error);
        return { success: false, error: "Failed to add items" };
    }
}

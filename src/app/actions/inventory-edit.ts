"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getUserId } from "@/lib/auth/serverAuth";

export async function updateInventoryItemFull(
    id: string,
    data: {
        name: string;
        emoji: string;
        quantity: number;
        unit: string;
        expiryDate: Date | null;
        imageUrl?: string | null;
        manufacturer?: string | null;
        brand?: string | null;
        kosher?: string | null;
        packWeight?: number | null;
        packUnit?: string | null;
    }
) {
    try {
        const userId = await getUserId();

        await prisma.inventoryItem.update({
            where: { id, userId },
            data: {
                name: data.name,
                emoji: data.emoji,
                quantity: data.quantity,
                unit: data.unit,
                expiryDate: data.expiryDate,
                manufacturer: data.manufacturer,
                brand: data.brand,
                kosher: data.kosher,
                packWeight: data.packWeight,
                packUnit: data.packUnit,
                ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl })
            }
        });

        revalidatePath("/inventory");
        return { success: true };
    } catch (error) {
        console.error("Failed to update item fully:", error);
        return { success: false, error: "Update failed" };
    }
}

export async function deleteMultipleInventoryItems(ids: string[]) {
    try {
        const userId = await getUserId();

        await prisma.inventoryItem.deleteMany({
            where: {
                id: { in: ids },
                userId: userId
            }
        });

        revalidatePath("/inventory");
        return { success: true };
    } catch (err) {
        console.error("Failed bulk delete", err);
        return { success: false, error: "Bulk delete failed" };
    }
}

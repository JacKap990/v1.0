"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getUserId } from "@/lib/auth/serverAuth";

export async function updateShoppingListItemFull(
    id: string,
    data: {
        name: string;
        emoji: string;
        quantity: number;
        unit: string;
        expiryDate: Date | null;
    }
) {
    try {
        const userId = await getUserId();

        await db.shoppingListItem.update({
            where: { id: id },
            data: {
                name: data.name,
                emoji: data.emoji,
                quantity: data.quantity,
                unit: data.unit,
                expiryDate: data.expiryDate
            }
        });

        revalidatePath("/list");
        return { success: true };
    } catch (error) {
        console.error("Failed to update item fully:", error);
        return { success: false, error: "Update failed" };
    }
}

export async function deleteMultipleShoppingListItems(ids: string[]) {
    try {
        const userId = await getUserId();

        await db.shoppingListItem.deleteMany({
            where: {
                id: { in: ids },
                shoppingList: {
                    userId: userId
                } as any
            }
        });

        revalidatePath("/list");
        return { success: true };
    } catch (err) {
        console.error("Failed bulk delete", err);
        return { success: false, error: "Bulk delete failed" };
    }
}

export async function duplicateShoppingList(listId: string) {
    try {
        const userId = await getUserId();

        // 1. Fetch original list + items
        const original = await db.shoppingList.findUnique({
            where: { id: listId, userId: userId },
            include: { items: true }
        });

        if (!original) return { success: false, error: "List not found" };

        // 2. Create the copy
        await db.shoppingList.create({
            data: {
                userId: userId,
                name: `${(original as any).name} (העתק)`,
                type: (original as any).type,
                icon: (original as any).icon,
                items: {
                    create: (original as any).items.map((item: any) => ({
                        name: item.name,
                        barcode: item.barcode,
                        category: item.category,
                        quantity: item.quantity,
                        unit: item.unit,
                        emoji: item.emoji,
                        imageUrl: item.imageUrl,
                        manufacturer: item.manufacturer,
                        expiryDate: item.expiryDate,
                        isChecked: false // Reset tracking 
                    }))
                }
            }
        });

        revalidatePath("/");
        revalidatePath("/list");
        return { success: true };
    } catch (err) {
        console.error("Failed to duplicate list", err);
        return { success: false, error: "Duplication failed" };
    }
}

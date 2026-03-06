"use server";

import { prisma } from "@/lib/prisma";
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

        await prisma.shoppingListItem.update({
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

        await prisma.shoppingListItem.deleteMany({
            where: {
                id: { in: ids },
                shoppingList: {
                    userId: userId
                }
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
        const original = await prisma.shoppingList.findUnique({
            where: { id: listId, userId: userId },
            include: { items: true }
        });

        if (!original) return { success: false, error: "List not found" };

        // 2. Create the copy
        await prisma.shoppingList.create({
            data: {
                userId: userId,
                name: `${original.name} (העתק)`,
                type: original.type,
                icon: original.icon,
                items: {
                    create: original.items.map((item: any) => ({
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

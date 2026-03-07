"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getUserId } from "@/lib/auth/serverAuth";

export async function enrichMissingMetadata() {
    try {
        const userId = await getUserId();
        if (!userId) return { success: false, error: "Unauthorized" };

        // 1. Find items missing key technical data
        const itemsToEnrich = await db.inventoryItem.findMany({
            where: {
                userId,
                OR: [
                    { manufacturer: null } as any,
                    { brand: null } as any,
                    { kosher: null } as any,
                    { baseProductName: null } as any
                ]
            },
            take: 20 // Batching to avoid timeouts
        });

        if (itemsToEnrich.length === 0) {
            return { success: true, count: 0 };
        }

        let enrichedCount = 0;
        const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

        for (const item of itemsToEnrich) {
            try {
                // Call the internal classify API (hits consolidated AI gateway)
                const res = await fetch(`${baseUrl}/api/ai/classify`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name: item.name })
                });

                if (!res.ok) continue;

                const data = await res.json();
                if (!data.success) continue;

                // Update the item
                await db.inventoryItem.update({
                    where: { id: item.id },
                    data: {
                        manufacturer: (item as any).manufacturer || data.manufacturer,
                        brand: (item as any).brand || data.brand,
                        kosher: (item as any).kosher || data.kosher,
                        baseProductName: (item as any).baseProductName || data.baseProductName,
                        category: item.category || data.category,
                        emoji: item.emoji || data.emoji
                    }
                });
                enrichedCount++;
            } catch (err) {
                console.error(`Failed to enrich item ${item.name}:`, err);
            }
        }

        if (enrichedCount > 0) {
            revalidatePath("/inventory");
        }

        return { success: true, count: enrichedCount };
    } catch (error) {
        console.error("Enrichment failed:", error);
        return { success: false, error: "Internal error" };
    }
}

"use server";

import { db } from "@/lib/db";
import { getUserId } from "@/lib/auth/serverAuth";
import { isRunningLow } from "@/lib/consumption";
import { differenceInDays } from "date-fns";

export type NotificationType = "expiry" | "low_stock" | "suggestion" | "info";

export interface SmartNotification {
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    itemId?: string;
    actionLabel?: string;
    actionUrl?: string;
    severity: "low" | "medium" | "high";
    createdAt: Date;
}

export async function getSmartNotifications(): Promise<SmartNotification[]> {
    try {
        const userId = await getUserId();
        if (!userId) return [];

        const notifications: SmartNotification[] = [];
        const now = new Date();

        // 1. Get Inventory for Expiry and Low Stock
        const inventory = await db.inventoryItem.findMany({
            where: { userId }
        });

        // 2. Check for Expiring Items (within 3 days)
        const expiringItems = inventory.filter((item: any) => {
            if (!item.expiryDate) return false;
            const days = differenceInDays(new Date(item.expiryDate), now);
            return days >= 0 && days <= 3;
        });

        expiringItems.forEach((item: any) => {
            notifications.push({
                id: `expiry-${item.id}`,
                type: "expiry",
                title: "מוצר עומד פג תוקף",
                message: `המוצר "${item.name}" יפוג בעוד ${differenceInDays(new Date(item.expiryDate!), now)} ימים. כדאי להשתמש בו בקרוב!`,
                itemId: item.id,
                actionLabel: "עבור למלאי",
                actionUrl: "/inventory",
                severity: "high",
                createdAt: now
            });
        });

        // 3. Check for Low Stock (running low and NOT in any shopping list)
        const lowItems = inventory.filter((item: any) =>
            isRunningLow(item.updatedAt, item.quantity, (item as any).consumptionRate || 7)
        );

        const shoppingListItems = await db.shoppingListItem.findMany({
            where: {
                shoppingList: { userId } as any
            },
            select: { name: true }
        });
        const itemsInLists = new Set(shoppingListItems.map((i: any) => i.name.toLowerCase()));

        lowItems.forEach((item: any) => {
            if (!itemsInLists.has(item.name.toLowerCase())) {
                notifications.push({
                    id: `low-${item.id}`,
                    type: "low_stock",
                    title: "מוצר עומד להיגמר",
                    message: `המוצר "${item.name}" עומד להיגמר. האם להוסיף אותו לרשימת הקניות?`,
                    itemId: item.id,
                    actionLabel: "הוסף לרשימה",
                    actionUrl: "/inventory",
                    severity: "medium",
                    createdAt: now
                });
            }
        });

        // 4. Add a generic AI Suggestion if pantry is very healthy
        if (notifications.length === 0 && inventory.length > 5) {
            notifications.push({
                id: "suggestion-recipe",
                type: "suggestion",
                title: "הצעה למתכון",
                message: "המזווה שלך מלא! מה דעתך להכין ארוחת ערב חגיגית עם המצרכים שיש לך?",
                actionLabel: "מצא מתכון",
                actionUrl: "/recipes",
                severity: "low",
                createdAt: now
            });
        }

        return notifications.sort((a, b) => {
            const severityMap = { high: 0, medium: 1, low: 2 };
            return severityMap[a.severity] - severityMap[b.severity];
        });
    } catch (error) {
        console.error("Failed to fetch smart notifications:", error);
        return [];
    }
}

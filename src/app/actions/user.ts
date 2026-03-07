"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getUserId } from "@/lib/auth/serverAuth";

export async function getUserSettings() {
    try {
        const userId = await getUserId();
        const user = await db.user.findUnique({
            where: { id: userId },
            select: {
                name: true,
                email: true,
                familySize: true,
                dietaryTags: true,
                themePref: true,
                aiVisionEnabled: true,
                aiRecommendationsEnabled: true
            }
        });

        return user;
    } catch (error) {
        console.error("Failed to fetch user settings:", error);
        return null;
    }
}

export async function updateUserSettings(data: {
    name?: string;
    familySize?: number;
    dietaryTags?: string;
    themePref?: string;
    aiVisionEnabled?: boolean;
    aiRecommendationsEnabled?: boolean;
}) {
    try {
        const userId = await getUserId();
        await db.user.update({
            where: { id: userId },
            data
        });

        revalidatePath("/settings");
        return { success: true };
    } catch (error) {
        console.error("Failed to update user settings:", error);
        return { success: false, error: "Failed to update settings" };
    }
}

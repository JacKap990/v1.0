"use server";

import { auth } from "../../../auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

export async function getUserSettings() {
    const session = await auth();
    const userId = (session?.user as any)?.id;
    if (!userId) return null;

    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                themePref: true,
                colorTheme: true,
                displayDensity: true,
                familySize: true,
                dietaryTags: true,
                aiVisionEnabled: true,
                aiRecommendationsEnabled: true,
                aiAutoPilot: true,
                dataCollection: true,
                autoRestock: true,
                profileImage: true,
                language: true,
            }
        });
        return user;
    } catch (error) {
        console.error("Error fetching user settings:", error);
        return null;
    }
}

export async function updateUserSettings(data: {
    themePref?: string;
    colorTheme?: string;
    displayDensity?: string;
    familySize?: number;
    dietaryTags?: string;
    aiVisionEnabled?: boolean;
    aiRecommendationsEnabled?: boolean;
    aiAutoPilot?: boolean;
    dataCollection?: boolean;
    autoRestock?: boolean;
    profileImage?: string;
    language?: string;
}) {
    const session = await auth();
    const userId = (session?.user as any)?.id;
    if (!userId) return { success: false, error: "Not authenticated" };

    try {
        await prisma.user.update({
            where: { id: userId },
            data
        });

        // Set cookies for lightweight layout access
        const cookieStore = await cookies();
        if (data.themePref) cookieStore.set("pantry-theme", data.themePref, { maxAge: 60 * 60 * 24 * 365 });
        if (data.colorTheme) cookieStore.set("pantry-color", data.colorTheme, { maxAge: 60 * 60 * 24 * 365 });
        if (data.displayDensity) cookieStore.set("pantry-density", data.displayDensity, { maxAge: 60 * 60 * 24 * 365 });
        if (data.language) cookieStore.set("pantry-lang", data.language, { maxAge: 60 * 60 * 24 * 365 });
        if (data.profileImage) cookieStore.set("pantry-profile", data.profileImage, { maxAge: 60 * 60 * 24 * 365 });

        revalidatePath("/settings");
        revalidatePath("/");
        return { success: true };
    } catch (error) {
        console.error("Error updating user settings:", error);
        return { success: false, error: "Database error" };
    }
}

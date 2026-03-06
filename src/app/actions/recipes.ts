"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import { getUserId } from "@/lib/auth/serverAuth";

export async function getRecipes() {
    try {
        let userId: string | null = null;
        try {
            userId = await getUserId();
        } catch (e) {
            userId = null;
        }

        const recipes = await prisma.recipe.findMany({
            where: {
                OR: [
                    { isPrivate: false },
                    { userId: null }, // System/global recipes
                    ...(userId ? [{ userId, isPrivate: true }] : [])
                ]
            },
            orderBy: { name: "asc" }
        });
        return recipes;
    } catch (error) {
        console.error("Failed to fetch recipes:", error);
        return [];
    }
}

export async function getRecipeById(id: string) {
    try {
        const recipe = await prisma.recipe.findUnique({
            where: { id }
        });
        return recipe;
    } catch (error) {
        console.error("Failed to fetch recipe:", error);
        return null;
    }
}

export async function getUserRecipes() {
    try {
        const userId = await getUserId();

        const recipes = await prisma.recipe.findMany({
            where: { userId: userId },
            orderBy: { updatedAt: "desc" }
        });
        return recipes;
    } catch (error) {
        console.error("Failed to fetch user recipes:", error);
        return [];
    }
}

export async function getUserFavorites() {
    try {
        const userId = await getUserId();

        const favorites = await prisma.userFavoriteRecipe.findMany({
            where: { userId: userId },
            include: { recipe: true },
            orderBy: { addedAt: "desc" }
        });
        return favorites.map(f => f.recipe);
    } catch (error) {
        console.error("Failed to fetch favorites:", error);
        return [];
    }
}

export async function toggleFavorite(recipeId: string) {
    try {
        const userId = await getUserId();

        const existing = await prisma.userFavoriteRecipe.findUnique({
            where: {
                userId_recipeId: {
                    userId: userId,
                    recipeId
                }
            }
        });

        if (existing) {
            await prisma.userFavoriteRecipe.delete({
                where: { id: existing.id }
            });
            return { success: true, favorited: false };
        } else {
            await prisma.userFavoriteRecipe.create({
                data: {
                    userId: userId,
                    recipeId
                }
            });
            return { success: true, favorited: true };
        }
    } catch (error) {
        console.error("Failed to toggle favorite:", error);
        return { success: false };
    }
}

export async function isFavorited(recipeId: string) {
    try {
        const userId = await getUserId();

        const existing = await prisma.userFavoriteRecipe.findUnique({
            where: {
                userId_recipeId: {
                    userId: userId,
                    recipeId
                }
            }
        });
        return !!existing;
    } catch (error) {
        return false;
    }
}

export async function forkRecipe(recipeId: string) {
    try {
        const userId = await getUserId();

        const original = await prisma.recipe.findUnique({
            where: { id: recipeId }
        });

        if (!original) return { success: false };

        const forked = await prisma.recipe.create({
            data: {
                userId: userId,
                isPrivate: true,
                originalId: original.id,
                name: `${original.name} (גרסה שלי)`,
                emoji: original.emoji,
                image: original.image,
                time: original.time,
                difficulty: original.difficulty,
                servings: original.servings,
                tags: original.tags,
                ingredients: original.ingredients,
                instructions: original.instructions,
            }
        });

        return { success: true, recipe: forked };
    } catch (error) {
        console.error("Failed to fork recipe:", error);
        return { success: false };
    }
}

export async function createCustomRecipe(data: {
    name: string;
    description?: string;
    servings?: number;
    time?: string;
    difficulty?: string;
    tags?: string[];
    ingredients?: { name: string; amount: number; unit: string }[];
    instructions?: string[];
}) {
    try {
        const userId = await getUserId();

        const recipe = await prisma.recipe.create({
            data: {
                userId: userId,
                isPrivate: true,
                name: data.name,
                description: data.description,
                servings: data.servings || 4,
                time: data.time || "",
                difficulty: data.difficulty || "קל",
                tags: JSON.stringify(data.tags || []),
                ingredients: JSON.stringify(data.ingredients || []),
                instructions: JSON.stringify(data.instructions || []),
                emoji: "🍽️",
            }
        });

        return { success: true, recipe };
    } catch (error) {
        console.error("Failed to create recipe:", error);
        return { success: false };
    }
}

export async function updateRecipe(id: string, data: {
    name?: string;
    description?: string;
    servings?: number;
    time?: string;
    difficulty?: string;
    tags?: string[];
    ingredients?: any[];
    instructions?: string[];
    emoji?: string;
}) {
    try {
        const userId = await getUserId();

        // Ensure user owns the recipe
        const existing = await prisma.recipe.findUnique({ where: { id } });
        if (!existing || existing.userId !== userId) {
            return { success: false, error: "Unauthorized" };
        }

        const updated = await prisma.recipe.update({
            where: { id },
            data: {
                name: data.name,
                description: data.description,
                servings: data.servings,
                time: data.time,
                difficulty: data.difficulty,
                tags: data.tags ? JSON.stringify(data.tags) : undefined,
                ingredients: data.ingredients ? JSON.stringify(data.ingredients) : undefined,
                instructions: data.instructions ? JSON.stringify(data.instructions) : undefined,
                emoji: data.emoji,
            }
        });

        return { success: true, recipe: updated };
    } catch (error) {
        console.error("Failed to update recipe:", error);
        return { success: false };
    }
}

export async function deleteRecipe(id: string) {
    try {
        const userId = await getUserId();

        // Ensure user owns the recipe
        const existing = await prisma.recipe.findUnique({ where: { id } });
        if (!existing || existing.userId !== userId) {
            return { success: false, error: "Unauthorized" };
        }

        await prisma.recipe.delete({ where: { id } });
        return { success: true };
    } catch (error) {
        console.error("Failed to delete recipe:", error);
        return { success: false };
    }
}

export async function seedSystemRecipes() {
    try {
        const systemRecipes = [
            {
                id: "challah-professional",
                name: "חלה של שבת (מתכון מקצועי)",
                description: "חלה רכה, עננית וזהובה. מתכון מדויק בגרמים לתוצאה מושלמת בכל פעם.",
                servings: 2,
                time: "3 שעות",
                difficulty: "בינוני",
                emoji: "🍞",
                tags: ["פרווה", "לחם", "שבת", "מסורתי"],
                ingredients: [
                    { name: "קמח לחם / קמח לבן מנופה", amount: 1000, unit: "גרם" },
                    { name: "שמרים יבשים", amount: 20, unit: "גרם" },
                    { name: "סוכר לבן", amount: 150, unit: "גרם" },
                    { name: "מלח דק", amount: 20, unit: "גרם" },
                    { name: "שמן קנולה/צמחי", amount: 120, unit: "גרם" },
                    { name: "ביצים L", amount: 2, unit: "יחידות" },
                    { name: "מים פושרים", amount: 450, unit: "מ\"ל" },
                    { name: "ביצה טרופה (להברשה)", amount: 1, unit: "יחידה" },
                    { name: "שומשום/פרג (לעיטור)", amount: 20, unit: "גרם" }
                ],
                instructions: [
                    "בקערת מיקסר עם וו לישה, מערבבים קמח, שמרים וסוכר.",
                    "מוסיפים מים, ביצים ושמן ומתחילים בלישה במהירות נמוכה במשך 2 דקות.",
                    "מוסיפים את המלח וממשיכים ללוש במהירות בינונית עוד 8-10 דקות עד לקבלת בצק גמיש, חלק ומעט דביק שנפרד מדפנות הקערה.",
                    "משמנים קלות קערה גדולה, מעבירים אליה את הבצק, מכסים בניילון נצמד ומתפיחים בטמפרטורת החדר כשעה וחצי או עד הכפלת הנפח.",
                    "מחלקים את הבצק ל-6 או 8 כדורים שווים (לשתי חלות גדולות). קולעים צמות מהרצועות.",
                    "מניחים את החלות על תבנית עם נייר אפייה, מכסים במגבת לחה ומתפיחים שוב כ-40 דקות.",
                    "מחממים תנור ל-180 מעלות. מברישים בביצה ומפזרים שומשום.",
                    "אופים 25-30 דקות עד שהחלות שחומות מאוד גם בתחתית. מצננים על רשת."
                ]
            },
            {
                id: "shakshuka-ultimate",
                name: "שקשוקה של אלופים",
                description: "השקשוקה המושלמת - פיקנטית, עשירה וטעימה להפליא.",
                servings: 4,
                time: "30 דק",
                difficulty: "קל",
                emoji: "🍳",
                tags: ["צמחוני", "ישראלי", "ארוחת בוקר"],
                ingredients: [
                    { name: "שמן זית", amount: 4, unit: "כפות" },
                    { name: "בצל לבן גדול קצוץ", amount: 1, unit: "יחידה" },
                    { name: "פלפל אדום (גמבה) חתוך לקוביות", amount: 1, unit: "יחידה" },
                    { name: "שיני שום פרוסות", amount: 5, unit: "שיני" },
                    { name: "פלפל חריף (אופציונלי)", amount: 0.5, unit: "יחידה" },
                    { name: "עגבניות בשלות קצוצות", amount: 6, unit: "יחידות" },
                    { name: "רסק עגבניות", amount: 100, unit: "גרם" },
                    { name: "פפריקה מתוקה", amount: 1, unit: "כף" },
                    { name: "כמון", amount: 1, unit: "כפית" },
                    { name: "מלח ופלפל שחור", amount: 1, unit: "לפי הטעם" },
                    { name: "ביצים L", amount: 4, unit: "יחידות" }
                ],
                instructions: [
                    "מחממים שמן זית במחבת רחבה ומטגנים בצל ופלפלים עד לריכוך קל.",
                    "מוסיפים שום ופלפל חריף ומטגנים עוד דקה.",
                    "מוסיפים רסק עגבניות ותבלינים ומערבבים היטב.",
                    "מוסיפים את העגבניות הקצוצות (וחצי כוס מים אם צריך) ומבשלים על אש קטנה 15-20 דקות עד לקבלת רוטב סמיך.",
                    "יוצרים גומחות ברוטב ושוברים לתוכן את הביצים.",
                    "מכסים את המחבת ומבשלים 5-7 דקות עד שהחלבון יציב אך החלמון עדיין רך.",
                    "מעטרים בפטרוזיליה טרייה ומגישים עם לחם פרנה או חלה."
                ]
            }
        ];

        for (const r of systemRecipes) {
            await prisma.recipe.upsert({
                where: { id: r.id },
                update: {
                    name: r.name,
                    description: r.description as any,
                    servings: r.servings,
                    time: r.time,
                    difficulty: r.difficulty,
                    emoji: r.emoji,
                    tags: JSON.stringify(r.tags),
                    ingredients: JSON.stringify(r.ingredients),
                    instructions: JSON.stringify(r.instructions)
                },
                create: {
                    id: r.id,
                    userId: null,
                    isPrivate: false,
                    name: r.name,
                    servings: r.servings,
                    time: r.time,
                    difficulty: r.difficulty,
                    emoji: r.emoji,
                    tags: JSON.stringify(r.tags),
                    ingredients: JSON.stringify(r.ingredients),
                    instructions: JSON.stringify(r.instructions)
                }
            });
        }
        return { success: true };
    } catch (error: any) {
        console.error("Failed to seed recipes:", error);
        return { success: false };
    }
}


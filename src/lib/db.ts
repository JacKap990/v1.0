/**
 * Lightweight Database Client - Proxy for Prisma
 * 
 * This client sends database requests to a single internal API route.
 * This prevents the heavy Prisma engine from being bundled into every Edge route,
 * which is critical for staying under the Cloudflare 25MB bundle limit.
 */

const DB_GATEWAY_SECRET = process.env.DB_GATEWAY_SECRET || "internal_dev_secret";
const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

async function dbRequest(model: string, action: string, args: any) {
    try {
        const response = await fetch(`${baseUrl}/api/gateway/db`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-db-secret": DB_GATEWAY_SECRET,
            },
            body: JSON.stringify({ model, action, args }),
            // Internal calls should be fast and not cached
            cache: "no-store",
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || "Database Gateway Error");
        }

        return result.data;
    } catch (error) {
        console.error(`DB Proxy Error [${model}.${action}]:`, error);
        throw error;
    }
}

export const db = {
    user: {
        findUnique: (args: any) => dbRequest("user", "findUnique", args),
        findFirst: (args: any) => dbRequest("user", "findFirst", args),
        upsert: (args: any) => dbRequest("user", "upsert", args),
        update: (args: any) => dbRequest("user", "update", args),
        create: (args: any) => dbRequest("user", "create", args),
    },
    inventoryItem: {
        findMany: (args: any) => dbRequest("inventoryItem", "findMany", args),
        findUnique: (args: any) => dbRequest("inventoryItem", "findUnique", args),
        findFirst: (args: any) => dbRequest("inventoryItem", "findFirst", args),
        create: (args: any) => dbRequest("inventoryItem", "create", args),
        createMany: (args: any) => dbRequest("inventoryItem", "createMany", args),
        update: (args: any) => dbRequest("inventoryItem", "update", args),
        delete: (args: any) => dbRequest("inventoryItem", "delete", args),
        deleteMany: (args: any) => dbRequest("inventoryItem", "deleteMany", args),
    },
    shoppingList: {
        findMany: (args: any) => dbRequest("shoppingList", "findMany", args),
        findFirst: (args: any) => dbRequest("shoppingList", "findFirst", args),
        findUnique: (args: any) => dbRequest("shoppingList", "findUnique", args),
        create: (args: any) => dbRequest("shoppingList", "create", args),
        update: (args: any) => dbRequest("shoppingList", "update", args),
        delete: (args: any) => dbRequest("shoppingList", "delete", args),
    },
    shoppingListItem: {
        findMany: (args: any) => dbRequest("shoppingListItem", "findMany", args),
        create: (args: any) => dbRequest("shoppingListItem", "create", args),
        update: (args: any) => dbRequest("shoppingListItem", "update", args),
        delete: (args: any) => dbRequest("shoppingListItem", "delete", args),
        deleteMany: (args: any) => dbRequest("shoppingListItem", "deleteMany", args),
    },
    globalProduct: {
        findUnique: (args: any) => dbRequest("globalProduct", "findUnique", args),
        findMany: (args: any) => dbRequest("globalProduct", "findMany", args),
        upsert: (args: any) => dbRequest("globalProduct", "upsert", args),
        create: (args: any) => dbRequest("globalProduct", "create", args),
    },
    recipe: {
        findMany: (args: any) => dbRequest("recipe", "findMany", args),
        findUnique: (args: any) => dbRequest("recipe", "findUnique", args),
        create: (args: any) => dbRequest("recipe", "create", args),
        update: (args: any) => dbRequest("recipe", "update", args),
        delete: (args: any) => dbRequest("recipe", "delete", args),
        upsert: (args: any) => dbRequest("recipe", "upsert", args),
    },
    userFavoriteRecipe: {
        findMany: (args: any) => dbRequest("userFavoriteRecipe", "findMany", args),
        findUnique: (args: any) => dbRequest("userFavoriteRecipe", "findUnique", args),
        create: (args: any) => dbRequest("userFavoriteRecipe", "create", args),
        delete: (args: any) => dbRequest("userFavoriteRecipe", "delete", args),
    },
    passwordResetToken: {
        upsert: (args: any) => dbRequest("passwordResetToken", "upsert", args),
    },
};

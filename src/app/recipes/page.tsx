export const runtime = 'edge';
import { getRecipes, getUserFavorites } from "@/app/actions/recipes";
import { getInventory } from "@/app/actions/inventory";
import { Sparkles, Plus } from "lucide-react";
import { RecipeList } from "@/components/RecipeList";
import { auth } from "../../../auth";

import { FAB } from "@/components/ui/FAB";

export default async function RecipesPage() {
    const session = await auth();
    const user = session?.user as any;
    const userId = user?.id || null;

    const [rawRecipes, inventory, favorites] = await Promise.all([
        getRecipes(),
        getInventory(),
        getUserFavorites()
    ]);

    const favoriteIds = favorites.map((f: any) => f.id);

    return (
        <div className="p-4 pb-24">
            {/* Header */}
            <header className="mb-6">
                <div className="flex items-center justify-between mb-2">
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight">המתכונים שלי</h1>
                    <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
                        <Sparkles className="w-5 h-5" />
                    </div>
                </div>
                <p className="text-sm text-slate-500">גלו מתכונים שתוכלו להכין עם מה שיש במזווה</p>
            </header>

            {/* Interactive Recipe List */}
            <RecipeList
                initialRecipes={rawRecipes}
                inventory={inventory}
                currentUser={userId}
                favoriteIds={favoriteIds}
            />
        </div>
    );
}

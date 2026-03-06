"use client";

import { useState, useMemo } from "react";
import { Search, Clock, ChefHat, Sparkles, Heart, ChefHat as ChefHatIcon, Flame, Plus, Brain, Link2, Loader2, X } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { isIngredientMatch } from "@/lib/smartEngine";
import { FAB } from "./ui/FAB";
import { NewRecipeModal } from "./NewRecipeModal";
import { useRouter } from "next/navigation";

interface Recipe {
    id: string;
    name: string;
    emoji: string | null;
    image: string | null;
    time: string | null;
    difficulty: string | null;
    tags: string | null;
    ingredients: string | null;
    userId: string | null;
    missingCount?: number;
}

interface RecipeListProps {
    initialRecipes: any[];
    inventory: any[];
    currentUser: string | null;
    favoriteIds: string[];
}

const CATEGORIES = [
    { id: "all", label: "הכל" },
    { id: "breakfast", label: "ארוחת בוקר" },
    { id: "lunch", label: "צהריים" },
    { id: "dinner", label: "ארוחת ערב" },
    { id: "meat", label: "בשרי" },
    { id: "dairy", label: "חלבי" },
    { id: "vegetarian", label: "צמחוני" },
    { id: "vegan", label: "טבעוני" },
    { id: "dessert", label: "קינוחים" },
];

const VIEW_TABS = [
    { id: "all", label: "הכל", icon: Sparkles },
    { id: "favorites", label: "מועדפים", icon: Heart },
    { id: "my", label: "שלי", icon: ChefHatIcon },
];

export function RecipeList({ initialRecipes, inventory, currentUser, favoriteIds }: RecipeListProps) {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [activeCategory, setActiveCategory] = useState("all");
    const [activeView, setActiveView] = useState("all");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [recipeToEdit, setRecipeToEdit] = useState<any>(null);

    // AI features state
    const [aiRecommendations, setAiRecommendations] = useState<any[]>([]);
    const [aiLoading, setAiLoading] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [importUrl, setImportUrl] = useState("");
    const [importLoading, setImportLoading] = useState(false);
    const [importedRecipe, setImportedRecipe] = useState<any>(null);
    const [importError, setImportError] = useState("");

    const handleAiRecommend = async () => {
        setAiLoading(true);
        try {
            const res = await fetch("/api/ai/recommend", { method: "POST" });
            const data = await res.json();
            if (data.success) {
                setAiRecommendations(data.recipes);
            } else {
                alert(data.error || "שגיאה בקבלת המלצות");
            }
        } catch {
            alert("שגיאה בחיבור לשרת");
        } finally {
            setAiLoading(false);
        }
    };

    const handleImportRecipe = async () => {
        if (!importUrl.trim()) return;
        setImportLoading(true);
        setImportError("");
        try {
            const res = await fetch("/api/ai/import-recipe", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url: importUrl }),
            });
            const data = await res.json();
            if (data.success) {
                setImportedRecipe(data.recipe);
                setImportUrl(""); // Clear URL after success
            } else {
                setImportError(data.error || "לא נמצא מתכון בכתובת");
            }
        } catch {
            setImportError("שגיאה בחיבור לשרת ה-AI");
        } finally {
            setImportLoading(false);
        }
    };

    const scoredRecipes = useMemo(() => {
        return initialRecipes.map((recipe) => {
            let missingCount = 0;
            let ingredients: any[] = [];
            try {
                ingredients = recipe.ingredients ? JSON.parse(recipe.ingredients) : [];
            } catch (e) {
                ingredients = [];
            }

            const tags = recipe.tags ? JSON.parse(recipe.tags) : [];

            if (Array.isArray(ingredients)) {
                ingredients.forEach((ing: any) => {
                    const ingName = typeof ing === "string" ? ing : ing?.name || "";
                    const hasItem = inventory.some((invItem: any) =>
                        isIngredientMatch(ingName, invItem.name) && invItem.quantity > 0
                    );
                    if (!hasItem) missingCount++;
                });
            }

            return {
                ...recipe,
                ingredientsList: ingredients,
                tagsList: tags.map((t: string) => t.toLowerCase()),
                missingCount,
            };
        });
    }, [initialRecipes, inventory]);

    const filteredRecipes = useMemo(() => {
        return scoredRecipes.filter((recipe) => {
            // Search filter
            const matchesSearch = recipe.name.toLowerCase().includes(searchQuery.toLowerCase());

            // Category filter
            const matchesCategory = activeCategory === "all" || recipe.tagsList.includes(activeCategory);

            // View filter
            let matchesView = true;
            if (activeView === "favorites") {
                matchesView = favoriteIds.includes(recipe.id);
            } else if (activeView === "my") {
                matchesView = recipe.userId === currentUser && currentUser !== null;
            }

            return matchesSearch && matchesCategory && matchesView;
        }).sort((a, b) => {
            // Priority: Can make now (0 missing) > missing count > name
            if (a.missingCount === 0 && b.missingCount !== 0) return -1;
            if (a.missingCount !== 0 && b.missingCount === 0) return 1;
            if (a.missingCount !== b.missingCount) return (a.missingCount || 0) - (b.missingCount || 0);
            return a.name.localeCompare(b.name);
        });
    }, [scoredRecipes, searchQuery, activeCategory, activeView, favoriteIds, currentUser]);

    return (
        <div className="space-y-6">
            {/* Search & View Switcher */}
            <div className="space-y-4">
                <div className="relative group">
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="איזה מתכון תרצו למצוא?"
                        className="w-full bg-white/80 backdrop-blur-md border border-slate-200 rounded-2xl py-4 pr-12 pl-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="flex bg-slate-100/50 p-1 rounded-xl gap-1">
                    {VIEW_TABS.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveView(tab.id)}
                                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${activeView === tab.id
                                    ? "bg-white text-indigo-600 shadow-sm"
                                    : "text-slate-500 hover:bg-white/50"
                                    }`}
                            >
                                <Icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Category Tabs */}
            <div className="overflow-x-auto -mx-4 px-4 pb-2 no-scrollbar">
                <div className="flex gap-2">
                    {CATEGORIES.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id)}
                            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${activeCategory === cat.id
                                ? "bg-indigo-600 border-indigo-600 text-white shadow-md"
                                : "bg-white border-slate-200 text-slate-600 hover:border-indigo-300"
                                }`}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* AI Action Buttons — positioned above results for visibility */}
            <div className="flex gap-2 mb-2">
                <button
                    onClick={handleAiRecommend}
                    disabled={aiLoading}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-violet-500 to-indigo-500 text-white font-bold text-sm shadow-md hover:shadow-lg active:scale-95 transition-all disabled:opacity-60"
                >
                    {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
                    מה לבשל מהמלאי?
                </button>
                <button
                    onClick={() => setShowImportModal(true)}
                    className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-white border border-slate-200 text-slate-700 font-bold text-sm shadow-sm hover:bg-slate-50 active:scale-95 transition-all"
                >
                    <Link2 className="w-4 h-4" /> ייבא מתכון מאתר
                </button>
            </div>

            {/* AI Recommendations Section */}
            {aiRecommendations.length > 0 && (
                <div className="mb-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <h2 className="font-black text-indigo-600 flex items-center gap-2">
                            <Brain className="w-5 h-5" /> המלצות AI
                        </h2>
                        <button onClick={() => setAiRecommendations([])} className="text-xs text-slate-400">סגור</button>
                    </div>
                    {aiRecommendations.map((rec, i) => (
                        <div key={i} className="bg-gradient-to-br from-violet-50 to-indigo-50 border border-violet-200 p-4 rounded-2xl">
                            <div className="flex items-start gap-3">
                                <span className="text-3xl">{rec.emoji}</span>
                                <div className="flex-1">
                                    <h3 className="font-bold text-slate-800">{rec.title}</h3>
                                    <p className="text-xs text-slate-500 mt-1">{rec.description}</p>
                                    <div className="flex gap-2 mt-2 text-[10px]">
                                        <span className="bg-white px-2 py-1 rounded-full border border-violet-100">{rec.prepTime}</span>
                                        <span className="bg-white px-2 py-1 rounded-full border border-violet-100">{rec.difficulty}</span>
                                        {rec.usesExpiring && <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded-full">⚠️ פג תוקף</span>}
                                    </div>
                                    <div className="mt-3 text-xs text-slate-600">
                                        <p className="font-bold mb-1">מצרכים:</p>
                                        <ul className="list-disc pr-4 space-y-0.5">
                                            {rec.ingredients?.map((ing: any, j: number) => (
                                                <li key={j} className={ing.fromPantry ? "text-emerald-600" : "text-slate-500"}>
                                                    {ing.name} - {ing.amount} {ing.fromPantry ? "✅" : "❌"}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div className="mt-3 text-xs text-slate-600">
                                        <p className="font-bold mb-1">הוראות:</p>
                                        <ol className="list-decimal pr-4 space-y-1">
                                            {rec.instructions?.map((step: string, j: number) => (
                                                <li key={j}>{step}</li>
                                            ))}
                                        </ol>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Results Grid */}
            {filteredRecipes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400">
                    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                        <Search className="w-10 h-10 text-slate-300" />
                    </div>
                    <p className="font-bold text-slate-600">לא נמצאו מתכונים</p>
                    <p className="text-xs">נסו לחפש משהו אחר או שנו קטגוריה</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {filteredRecipes.map((recipe) => {
                        const canMakeNow = recipe.missingCount === 0 && recipe.ingredientsList.length > 0;
                        const isFavorite = favoriteIds.includes(recipe.id);
                        const isOwner = recipe.userId === currentUser;

                        return (
                            <div key={recipe.id} className="relative group">
                                <Link
                                    href={`/recipes/${recipe.id}`}
                                    className="block bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
                                >
                                    <div className="flex p-3 gap-4">
                                        {/* Thumbnail */}
                                        <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
                                            {recipe.image ? (
                                                <img
                                                    src={recipe.image}
                                                    alt={recipe.name}
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-3xl">
                                                    {recipe.emoji || "🍽️"}
                                                </div>
                                            )}
                                            {canMakeNow && (
                                                <div className="absolute top-1 left-1 bg-emerald-500 text-white p-1 rounded-lg">
                                                    <Sparkles className="w-3 h-3" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 flex flex-col justify-between py-1">
                                            <div>
                                                <div className="flex items-start justify-between">
                                                    <h3 className="font-bold text-slate-800 line-clamp-1 pr-6">
                                                        {recipe.name}
                                                    </h3>
                                                    {isFavorite && <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />}
                                                </div>

                                                <div className="flex items-center gap-3 mt-1">
                                                    <span className="flex items-center gap-1 text-[10px] text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded">
                                                        <Clock className="w-2.5 h-2.5" />
                                                        {recipe.time || "N/A"}
                                                    </span>
                                                    <span className="flex items-center gap-1 text-[10px] text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded">
                                                        <Flame className="w-2.5 h-2.5" />
                                                        {recipe.difficulty || "קל"}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between mt-2">
                                                <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${canMakeNow
                                                    ? "bg-emerald-100 text-emerald-700"
                                                    : recipe.missingCount && recipe.missingCount <= 2
                                                        ? "bg-amber-100 text-amber-700"
                                                        : "bg-slate-100 text-slate-600"
                                                    }`}>
                                                    {canMakeNow
                                                        ? "✓ ניתן להכנה"
                                                        : recipe.missingCount === 0 && recipe.ingredientsList.length === 0
                                                            ? "ללא מצרכים"
                                                            : `חסרים ${recipe.missingCount} מצרכים`
                                                    }
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </Link>

                                {/* Actions Overlay for Owner */}
                                {isOwner ? (
                                    <div className="absolute top-4 left-4 flex gap-2 z-10">
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                setRecipeToEdit(recipe);
                                                setIsModalOpen(true);
                                            }}
                                            className="p-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-full shadow-sm transition-colors"
                                            title="ערוך מתכון"
                                        >
                                            <ChefHat className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={async (e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                if (confirm("האם למחוק מתכון זה מהרשימה האישית שלך?")) {
                                                    const { deleteRecipe } = await import("@/app/actions/recipes");
                                                    const res = await deleteRecipe(recipe.id);
                                                    if (res.success) router.refresh();
                                                }
                                            }}
                                            className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-500 rounded-full shadow-sm transition-colors"
                                            title="מחק"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : !recipe.userId && currentUser && (
                                    <div className="absolute top-4 left-4 z-10">
                                        <button
                                            onClick={async (e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                const { forkRecipe } = await import("@/app/actions/recipes");
                                                const res = await forkRecipe(recipe.id);
                                                if (res.success) {
                                                    router.refresh();
                                                    // Optional: Open edit modal immediately
                                                    // setRecipeToEdit(res.recipe as any);
                                                    // setIsModalOpen(true);
                                                }
                                            }}
                                            className="px-3 py-2 bg-white/90 backdrop-blur-sm hover:bg-white text-indigo-600 rounded-xl shadow-sm text-[10px] font-black border border-indigo-100 flex items-center gap-1.5 transition-all active:scale-95"
                                        >
                                            <Plus className="w-3 h-3" /> שמור כעותק שלי
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Floating Action Button */}
            <FAB
                onClick={() => {
                    setRecipeToEdit(null);
                    setIsModalOpen(true);
                }}
                icon={<Plus className="w-8 h-8" />}
            />

            {/* Import from URL Modal */}
            <AnimatePresence>
                {showImportModal && (
                    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowImportModal(false)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden p-6"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                                    <Link2 className="w-6 h-6 text-indigo-500" /> ייבוא מתכון
                                </h3>
                                <button onClick={() => setShowImportModal(false)}>
                                    <X className="w-6 h-6 text-slate-400" />
                                </button>
                            </div>

                            {!importedRecipe ? (
                                <div className="space-y-4">
                                    <p className="text-sm text-slate-500">הדבק כתובת URL של מתכון מכל אתר (Mako, Xnet, וכו') וה-AI שלנו יחלץ אותו עבורך!</p>
                                    <div className="relative">
                                        <input
                                            type="url"
                                            value={importUrl}
                                            onChange={(e) => setImportUrl(e.target.value)}
                                            placeholder="https://..."
                                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-4 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                        />
                                    </div>
                                    {importError && <p className="text-xs text-rose-500 font-bold">{importError}</p>}
                                    <button
                                        onClick={handleImportRecipe}
                                        disabled={importLoading || !importUrl}
                                        className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {importLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                                        {importLoading ? "מנתח מתכון..." : "ייבא עכשיו"}
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="flex items-center gap-4 bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                                        <div className="text-3xl">✅</div>
                                        <div>
                                            <p className="font-black text-emerald-800 text-sm">המתכון זוהה בהצלחה!</p>
                                            <p className="text-emerald-600 text-xs">{importedRecipe.title}</p>
                                        </div>
                                    </div>

                                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 max-h-48 overflow-y-auto text-xs space-y-2 no-scrollbar">
                                        <p className="font-bold text-slate-700">מה חילצנו:</p>
                                        <p><span className="text-slate-400">זמן:</span> {importedRecipe.prepTime}</p>
                                        <p><span className="text-slate-400">מנות:</span> {importedRecipe.servings}</p>
                                        <p><span className="text-slate-400">מצרכים:</span> {importedRecipe.ingredients?.length} פריטים</p>
                                    </div>

                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setImportedRecipe(null)}
                                            className="flex-1 py-3 border border-slate-200 rounded-2xl text-sm font-bold text-slate-500"
                                        >
                                            ביטול
                                        </button>
                                        <button
                                            onClick={async () => {
                                                const { createCustomRecipe } = await import("@/app/actions/recipes");
                                                const res = await createCustomRecipe({
                                                    name: importedRecipe.title,
                                                    description: importedRecipe.description,
                                                    time: importedRecipe.prepTime,
                                                    servings: importedRecipe.servings,
                                                    ingredients: importedRecipe.ingredients,
                                                    instructions: importedRecipe.instructions,
                                                    tags: importedRecipe.tags
                                                });
                                                if (res.success) {
                                                    setShowImportModal(false);
                                                    setImportedRecipe(null);
                                                    router.refresh();
                                                }
                                            }}
                                            className="flex-[2] py-3 bg-indigo-600 text-white rounded-2xl font-black shadow-lg"
                                        >
                                            שמור במזווה שלי
                                        </button>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Manual Recipe Modal */}
            <NewRecipeModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setRecipeToEdit(null);
                }}
                onSuccess={() => router.refresh()}
                recipe={recipeToEdit}
            />
        </div>
    );
}

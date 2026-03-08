"use client";
export const runtime = 'edge';


import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
    Clock, ChefHat, ArrowRight, Utensils, Heart,
    Users, Minus, Plus, GitFork, Leaf, Check,
    PlayCircle, ChevronLeft, ChevronRight as ChevronRightIcon,
    Timer, Sparkles
} from "lucide-react";
import {
    getRecipeById, toggleFavorite, isFavorited, forkRecipe
} from "@/app/actions/recipes";
import { scaleIngredients, transformRecipeIngredients } from "@/lib/recipeUtils";
import { useToast } from "@/components/ui/Toast";

export default function RecipeDetailPage() {
    const router = useRouter();
    const params = useParams();
    const recipeId = params.id as string;
    const { showToast } = useToast();
    const [recipe, setRecipe] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isFav, setIsFav] = useState(false);

    // Servings
    const [servings, setServings] = useState(4);
    const [baseServings, setBaseServings] = useState(4);

    // Parsed data
    const [tags, setTags] = useState<string[]>([]);
    const [ingredients, setIngredients] = useState<any[]>([]);
    const [scaledIngredients, setScaledIngredients] = useState<any[]>([]);
    const [instructions, setInstructions] = useState<string[]>([]);

    // Cooking Mode
    const [cookingMode, setCookingMode] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);

    useEffect(() => {
        loadRecipe();
    }, []);

    const loadRecipe = async () => {
        const data = await getRecipeById(recipeId);
        if (!data) {
            router.push("/recipes");
            return;
        }
        setRecipe(data);

        const parsedTags = data.tags ? JSON.parse(data.tags) : [];
        const parsedIngs = data.ingredients ? JSON.parse(data.ingredients) : [];
        const parsedInst = data.instructions ? JSON.parse(data.instructions) : [];

        setTags(parsedTags);
        setIngredients(parsedIngs);
        setScaledIngredients(parsedIngs);
        setInstructions(parsedInst);
        setServings((data as any).servings || 4);
        setBaseServings((data as any).servings || 4);

        const fav = await isFavorited(recipeId);
        setIsFav(fav);
        setLoading(false);
    };

    // Update scaled ingredients when servings change
    useEffect(() => {
        if (ingredients.length > 0) {
            setScaledIngredients(scaleIngredients(ingredients, baseServings, servings));
        }
    }, [servings, ingredients, baseServings]);

    const handleToggleFav = async () => {
        const res = await toggleFavorite(recipeId);
        if (res.success) {
            setIsFav(res.favorited || false);
            showToast(res.favorited ? "נוסף למועדפים ❤️" : "הוסר מהמועדפים", "success");
        }
    };

    const handleFork = async () => {
        const res = await forkRecipe(recipeId);
        if (res.success && res.recipe) {
            showToast("המתכון שוכפל לאזור האישי שלך! ✨", "success");
            router.push(`/recipes/${res.recipe.id}`);
        } else {
            showToast("שגיאה בשכפול המתכון", "error");
        }
    };

    const handleTransform = (mode: "vegan" | "vegetarian" | "kosher") => {
        const transformed = transformRecipeIngredients(scaledIngredients, mode);
        setScaledIngredients(transformed);
        const labels = { vegan: "טבעוני", vegetarian: "צמחוני", kosher: "כשר" };
        showToast(`המתכון הומר ל${labels[mode]}! 🌱`, "success");
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="w-8 h-8 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin" />
            </div>
        );
    }

    // COOKING MODE (Step-by-Step Fullscreen)
    if (cookingMode) {
        return (
            <div className="fixed inset-0 z-[200] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col animate-in fade-in duration-300">
                {/* Top bar */}
                <div className="p-4 flex items-center justify-between">
                    <button
                        onClick={() => setCookingMode(false)}
                        className="text-white/60 hover:text-white transition-colors text-sm font-medium"
                    >
                        ✕ סגור
                    </button>
                    <span className="text-white/40 text-sm">
                        שלב {currentStep + 1} מתוך {instructions.length}
                    </span>
                </div>

                {/* Progress Bar */}
                <div className="px-4 mb-8">
                    <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-emerald-400 rounded-full transition-all duration-300 ease-out"
                            style={{ width: `${((currentStep + 1) / instructions.length) * 100}%` }}
                        />
                    </div>
                </div>

                {/* Step Content */}
                <div className="flex-1 flex items-center justify-center px-8 relative overflow-hidden">
                    <div
                        key={currentStep}
                        className="text-center max-w-md animate-in fade-in slide-in-from-left-4 duration-500"
                    >
                        <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-8">
                            <span className="text-4xl font-bold text-emerald-400">{currentStep + 1}</span>
                        </div>
                        <p className="text-white text-xl leading-relaxed font-medium">
                            {instructions[currentStep]}
                        </p>
                    </div>
                </div>

                {/* Navigation */}
                <div className="p-6 flex items-center justify-between gap-4">
                    <button
                        onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                        disabled={currentStep === 0}
                        className="w-14 h-14 rounded-full bg-white/10 text-white flex items-center justify-center disabled:opacity-20 transition-all hover:bg-white/20"
                    >
                        <ChevronRightIcon className="w-6 h-6" />
                    </button>

                    {currentStep === instructions.length - 1 ? (
                        <button
                            onClick={() => { setCookingMode(false); showToast("בתיאבון! 🎉", "success"); }}
                            className="flex-1 bg-emerald-500 text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-emerald-500/30 active:scale-95 transition-transform"
                        >
                            סיימתי! 🎉
                        </button>
                    ) : (
                        <button
                            onClick={() => setCurrentStep(currentStep + 1)}
                            className="flex-1 bg-white/10 text-white py-4 rounded-2xl font-bold text-lg hover:bg-white/20 transition-all active:scale-95"
                        >
                            ← שלב הבא
                        </button>
                    )}

                    <button
                        onClick={() => setCurrentStep(Math.min(instructions.length - 1, currentStep + 1))}
                        disabled={currentStep === instructions.length - 1}
                        className="w-14 h-14 rounded-full bg-white/10 text-white flex items-center justify-center disabled:opacity-20 transition-all hover:bg-white/20"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                </div>
            </div>
        );
    }

    // NORMAL RECIPE VIEW
    return (
        <div className="pb-24 animate-in fade-in duration-500">
            {/* Hero */}
            <div className="relative h-56 w-full shrink-0">
                {recipe.image ? (
                    <img src={recipe.image} alt={recipe.name} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-emerald-100 to-cyan-50 flex items-center justify-center text-6xl">
                        {recipe.emoji || "🍳"}
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/30 to-transparent" />

                {/* Top Actions */}
                <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-10">
                    <Link href="/recipes" className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/30 transition-colors">
                        <ArrowRight className="w-5 h-5" />
                    </Link>
                    <div className="flex gap-2">
                        <button
                            onClick={handleToggleFav}
                            className={`w-10 h-10 rounded-full backdrop-blur-md flex items-center justify-center transition-all ${isFav ? "bg-red-500 text-white" : "bg-white/20 text-white hover:bg-white/30"}`}
                        >
                            <Heart className={`w-5 h-5 ${isFav ? "fill-current" : ""}`} />
                        </button>
                        <button
                            onClick={handleFork}
                            className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                            title="שכפל והתאם אישית"
                        >
                            <GitFork className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Title */}
                <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                    <h1 className="text-2xl font-bold leading-tight">{recipe.name}</h1>
                    <div className="flex flex-wrap gap-2 mt-3">
                        {recipe.time && (
                            <span className="flex items-center gap-1 text-sm font-medium bg-black/30 backdrop-blur-sm px-3 py-1 rounded-full">
                                <Clock className="w-4 h-4 text-emerald-300" /> {recipe.time}
                            </span>
                        )}
                        {recipe.difficulty && (
                            <span className="flex items-center gap-1 text-sm font-medium bg-black/30 backdrop-blur-sm px-3 py-1 rounded-full">
                                <ChefHat className="w-4 h-4 text-amber-300" /> {recipe.difficulty}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-5 -mt-3 relative z-10 bg-slate-50 rounded-t-3xl">

                {/* Tags */}
                {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-5">
                        {tags.map((tag: string, i: number) => (
                            <span key={i} className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full">
                                {tag}
                            </span>
                        ))}
                    </div>
                )}

                {/* Servings Slider */}
                <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm mb-5">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                            <Users className="w-4 h-4 text-emerald-500" /> מנות
                        </span>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setServings(Math.max(1, servings - 1))}
                                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-gray-600 hover:bg-slate-200 active:scale-90 transition-all"
                            >
                                <Minus className="w-4 h-4" />
                            </button>
                            <span className="text-2xl font-bold text-emerald-600 w-8 text-center">{servings}</span>
                            <button
                                onClick={() => setServings(Math.min(20, servings + 1))}
                                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-gray-600 hover:bg-slate-200 active:scale-90 transition-all"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                    {servings !== baseServings && (
                        <p className="text-[11px] text-emerald-500 text-center">
                            ✨ הכמויות הותאמו ל-{servings} מנות (במקור {baseServings})
                        </p>
                    )}
                </div>

                {/* Dietary Transformations */}
                <div className="flex gap-2 mb-5 overflow-x-auto pb-1 no-scrollbar">
                    {[
                        { mode: "vegan" as const, label: "הפוך לטבעוני", emoji: "🌱" },
                        { mode: "vegetarian" as const, label: "הפוך לצמחוני", emoji: "🥚" },
                        { mode: "kosher" as const, label: "הפוך לכשר", emoji: "🕍" },
                    ].map(t => (
                        <button
                            key={t.mode}
                            onClick={() => handleTransform(t.mode)}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-gray-100 text-xs font-medium text-gray-600 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700 transition-all whitespace-nowrap active:scale-95 shadow-sm"
                        >
                            <span>{t.emoji}</span>
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* Ingredients */}
                <section className="mb-6">
                    <h2 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
                        <Utensils className="w-5 h-5 text-emerald-500" /> המצרכים
                        <span className="text-xs text-gray-400 font-normal">({scaledIngredients.length})</span>
                    </h2>
                    <ul className="grid gap-2">
                        {scaledIngredients.map((ing: any, i: number) => (
                            <li key={i} className="bg-white rounded-xl p-3 shadow-sm border border-slate-100 flex items-center justify-between">
                                <span className="font-medium text-slate-700 text-sm">{ing.name}</span>
                                <span className="text-slate-500 text-sm font-medium bg-slate-50 px-2.5 py-0.5 rounded-lg">
                                    {ing.amount} {ing.unit === 'units' ? 'יח׳' : ing.unit === 'grams' ? 'גרם' : ing.unit === 'kg' ? 'ק"ג' : ing.unit === 'ml' ? 'מ"ל' : ing.unit === 'cups' ? 'כוסות' : ing.unit === 'tbsp' ? 'כף' : ing.unit === 'tsp' ? 'כפית' : ing.unit}
                                </span>
                            </li>
                        ))}
                    </ul>
                </section>

                {/* Instructions */}
                <section className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <Check className="w-5 h-5 text-emerald-500" /> אופן ההכנה
                        </h2>
                        {instructions.length > 1 && (
                            <button
                                onClick={() => { setCookingMode(true); setCurrentStep(0); }}
                                className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-100 hover:bg-emerald-100 transition-all active:scale-95"
                            >
                                <PlayCircle className="w-4 h-4" /> התחל בישול
                            </button>
                        )}
                    </div>
                    <div className="space-y-4">
                        {instructions.map((step: string, i: number) => (
                            <div key={i} className="flex gap-3">
                                <div className="shrink-0 w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                                    {i + 1}
                                </div>
                                <p className="text-slate-600 leading-relaxed text-sm pt-0.5">
                                    {step}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}

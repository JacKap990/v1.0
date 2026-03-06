"use client";

import { useState } from "react";
import { X, Plus, Trash2, Save, Sparkles, ChefHat, Clock, Utensils } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createCustomRecipe, updateRecipe } from "@/app/actions/recipes";
import { useToast } from "@/components/ui/Toast";

interface NewRecipeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    recipe?: any; // Optional recipe for editing
}

export function NewRecipeModal({ isOpen, onClose, onSuccess, recipe }: NewRecipeModalProps) {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);

    // Initialize with recipe data if editing
    const [name, setName] = useState(recipe?.name || "");
    const [time, setTime] = useState(recipe?.time || "");
    const [difficulty, setDifficulty] = useState(recipe?.difficulty || "קל");
    const [servings, setServings] = useState(recipe?.servings || 4);
    const [tags, setTags] = useState<string[]>(recipe?.tags ? JSON.parse(recipe.tags) : []);
    const [ingredients, setIngredients] = useState<{ name: string; amount: number; unit: string }[]>(
        recipe?.ingredients ? JSON.parse(recipe.ingredients) : []
    );
    const [instructions, setInstructions] = useState<string[]>(
        recipe?.instructions ? JSON.parse(recipe.instructions) : []
    );
    const [description, setDescription] = useState(recipe?.description || "");

    // Update state when recipe prop changes (e.g. when opening modal with a different recipe)
    useState(() => {
        if (recipe) {
            setName(recipe.name || "");
            setTime(recipe.time || "");
            setDifficulty(recipe.difficulty || "קל");
            setServings(recipe.servings || 4);
            setTags(recipe.tags ? JSON.parse(recipe.tags) : []);
            setIngredients(recipe.ingredients ? JSON.parse(recipe.ingredients) : []);
            setInstructions(recipe.instructions ? JSON.parse(recipe.instructions) : []);
            setDescription(recipe.description || "");
        }
    });

    // Helpers
    const addIngredient = () => setIngredients([...ingredients, { name: "", amount: 1, unit: "יחידות" }]);
    const removeIngredient = (index: number) => setIngredients(ingredients.filter((_, i) => i !== index));
    const updateIngredient = (index: number, field: string, value: any) => {
        const newIngs = [...ingredients];
        newIngs[index] = { ...newIngs[index], [field]: value };
        setIngredients(newIngs);
    };

    const addInstruction = () => setInstructions([...instructions, ""]);
    const removeInstruction = (index: number) => setInstructions(instructions.filter((_, i) => i !== index));
    const updateInstruction = (index: number, value: string) => {
        const newInsts = [...instructions];
        newInsts[index] = value;
        setInstructions(newInsts);
    };

    const handleSubmit = async () => {
        if (!name) {
            showToast("נא להזין שם למתכון", "error");
            return;
        }
        setLoading(true);

        let res;
        if (recipe?.id) {
            res = await updateRecipe(recipe.id, {
                name,
                description,
                time,
                difficulty,
                servings,
                tags,
                ingredients,
                instructions
            });
        } else {
            res = await createCustomRecipe({
                name,
                description,
                time,
                difficulty,
                servings,
                tags,
                ingredients,
                instructions
            });
        }

        if (res.success) {
            showToast(recipe?.id ? "המתכון עודכן בהצלחה!" : "המתכון נשמר בהצלחה!", "success");
            onSuccess();
            onClose();
            if (!recipe?.id) {
                // Reset only if creating new
                setName(""); setTime(""); setDifficulty("קל"); setTags([]); setIngredients([]); setInstructions([]);
            }
        } else {
            showToast("שגיאה בשמירת המתכון", "error");
        }
        setLoading(false);
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                />

                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                >
                    {/* Header */}
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                                <ChefHat className="w-6 h-6" />
                            </div>
                            <h2 className="text-xl font-black text-slate-800 tracking-tight">צור מתכון חדש</h2>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                            <X className="w-6 h-6 text-slate-400" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar">
                        {/* Basic Info */}
                        <section className="space-y-4">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                <Sparkles className="w-4 h-4" /> פרטים בסיסיים
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-slate-500 mb-1 mr-1">שם המתכון</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="למשל: השניצל המנצח של סבתא"
                                        className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-slate-500 mb-1 mr-1">תיאור קצר</label>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="ספר בכמה מילים על המתכון..."
                                        rows={2}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all resize-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1 mr-1">זמן הכנה</label>
                                    <div className="relative">
                                        <Clock className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <input
                                            type="text"
                                            value={time}
                                            onChange={(e) => setTime(e.target.value)}
                                            placeholder="למשל: 30 דק"
                                            className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 pr-10 pl-4 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1 mr-1">דרגת קושי</label>
                                    <select
                                        value={difficulty}
                                        onChange={(e) => setDifficulty(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                    >
                                        <option value="קל">קל</option>
                                        <option value="בינוני">בינוני</option>
                                        <option value="קשה">קשה</option>
                                    </select>
                                </div>
                            </div>
                        </section>

                        {/* Ingredients */}
                        <section className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                    <Utensils className="w-4 h-4" /> מצרכים
                                </h3>
                                <button
                                    onClick={addIngredient}
                                    className="text-xs font-bold text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                                >
                                    <Plus className="w-3 h-3" /> הוסף מצרך
                                </button>
                            </div>

                            <div className="space-y-3">
                                {ingredients.map((ing, idx) => (
                                    <div key={idx} className="flex gap-2 items-end bg-slate-50/50 p-3 rounded-2xl border border-dashed border-slate-200">
                                        <div className="flex-[3]">
                                            <label className="block text-[10px] font-bold text-slate-400 mb-1">שם המצרך</label>
                                            <input
                                                type="text"
                                                value={ing.name}
                                                onChange={(e) => updateIngredient(idx, "name", e.target.value)}
                                                className="w-full bg-white border border-slate-100 rounded-lg py-2 px-3 text-sm focus:border-indigo-300 outline-none"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <label className="block text-[10px] font-bold text-slate-400 mb-1">כמות</label>
                                            <input
                                                type="number"
                                                value={ing.amount}
                                                onChange={(e) => updateIngredient(idx, "amount", parseFloat(e.target.value))}
                                                className="w-full bg-white border border-slate-100 rounded-lg py-2 px-3 text-sm focus:border-indigo-300 outline-none"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <label className="block text-[10px] font-bold text-slate-400 mb-1">יחידה</label>
                                            <input
                                                type="text"
                                                value={ing.unit}
                                                onChange={(e) => updateIngredient(idx, "unit", e.target.value)}
                                                className="w-full bg-white border border-slate-100 rounded-lg py-2 px-3 text-sm focus:border-indigo-300 outline-none"
                                            />
                                        </div>
                                        <button onClick={() => removeIngredient(idx)} className="p-2 text-rose-400 hover:bg-rose-50 rounded-lg transition-colors">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                                {ingredients.length === 0 && (
                                    <p className="text-center py-4 text-xs text-slate-400 italic">לא התווספו מצרכים עדיין</p>
                                )}
                            </div>
                        </section>

                        {/* Instructions */}
                        <section className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                    <ChefHat className="w-4 h-4" /> שלבי הכנה
                                </h3>
                                <button
                                    onClick={addInstruction}
                                    className="text-xs font-bold text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                                >
                                    <Plus className="w-3 h-3" /> הוסף שלב
                                </button>
                            </div>
                            <div className="space-y-3">
                                {instructions.map((inst, idx) => (
                                    <div key={idx} className="flex gap-3 group">
                                        <span className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 text-xs font-black flex items-center justify-center flex-shrink-0 mt-2">
                                            {idx + 1}
                                        </span>
                                        <textarea
                                            value={inst}
                                            onChange={(e) => updateInstruction(idx, e.target.value)}
                                            rows={2}
                                            className="flex-1 bg-white border border-slate-100 rounded-xl py-2 px-4 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all resize-none"
                                            placeholder="תארו את שלב ההכנה..."
                                        />
                                        <button onClick={() => removeInstruction(idx)} className="p-2 text-slate-300 hover:text-rose-400 transition-colors self-start mt-2">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                                {instructions.length === 0 && (
                                    <p className="text-center py-4 text-xs text-slate-400 italic">לא התווספו שלבים עדיין</p>
                                )}
                            </div>
                        </section>
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="px-6 py-3 rounded-2xl text-sm font-bold text-slate-500 hover:bg-white transition-colors"
                        >
                            ביטול
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="px-8 py-3 bg-indigo-600 text-white rounded-2xl text-sm font-black shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
                        >
                            {loading ? "שומר..." : <>
                                <Save className="w-4 h-4" />
                                שמור מתכון
                            </>}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}

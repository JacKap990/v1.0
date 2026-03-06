"use client";

import { useState } from "react";
import { CheckSquare, Square, Trash2, ArrowRight, RotateCcw, UtensilsCrossed } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type BulkActionBarProps = {
    selectedIds: string[];
    onClearSelection: () => void;
    onDeleteSelected: () => void;
    onResetSelected?: () => void;
    onRecipeSearch?: () => void;
    onMoveSelected?: () => void;
    moveLabel?: string;
};

export function BulkActionBar({
    selectedIds,
    onClearSelection,
    onDeleteSelected,
    onResetSelected,
    onRecipeSearch,
    onMoveSelected,
    moveLabel
}: BulkActionBarProps) {
    const count = selectedIds.length;

    return (
        <AnimatePresence>
            {count > 0 && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    className="fixed bottom-24 left-4 right-4 z-50 bg-slate-900/95 backdrop-blur-xl text-white rounded-2xl shadow-2xl p-4 flex flex-col gap-3 border border-slate-700/50"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={onClearSelection}
                                className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center hover:bg-slate-700 transition-colors"
                            >
                                <span className="text-xl leading-none">&times;</span>
                            </button>
                            <span className="font-medium text-slate-200">
                                נבחרו {count} פריטים
                            </span>
                        </div>

                        <div className="flex items-center gap-2">
                            {onRecipeSearch && (
                                <button
                                    onClick={onRecipeSearch}
                                    className="p-2 bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 rounded-xl transition-colors"
                                    title="חפש מתכונים"
                                >
                                    <UtensilsCrossed className="w-5 h-5" />
                                </button>
                            )}
                            <button
                                onClick={onDeleteSelected}
                                className="p-2 bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 rounded-xl transition-colors"
                                title="מחק"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        {onMoveSelected && (
                            <button
                                onClick={onMoveSelected}
                                className="flex items-center justify-center gap-1.5 py-2.5 bg-indigo-500 hover:bg-indigo-600 rounded-xl font-bold transition-colors text-sm shadow-lg shadow-indigo-500/20"
                            >
                                <ArrowRight className="w-4 h-4" />
                                {moveLabel || "העבר לקניות"}
                            </button>
                        )}
                        {onResetSelected && (
                            <button
                                onClick={onResetSelected}
                                className="flex items-center justify-center gap-1.5 py-2.5 bg-slate-700 hover:bg-slate-600 rounded-xl font-bold transition-colors text-sm"
                            >
                                <RotateCcw className="w-4 h-4" />
                                אפס כמות
                            </button>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

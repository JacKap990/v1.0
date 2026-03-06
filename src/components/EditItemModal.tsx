"use client";

import { useState, useEffect } from "react";
import { X, Trash2, Edit2, Save } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { getCategoryLabel } from "@/lib/localization";

interface EditItemModalProps {
    isOpen: boolean;
    onClose: () => void;
    item: {
        id: string;
        name: string;
        emoji?: string;
        imageUrl?: string;
        category?: string;
    } | null;
    onSave: (id: string, newName: string, newEmoji?: string) => void;
    onDelete: (id: string) => void;
    title?: string;
}

export function EditItemModal({ isOpen, onClose, item, onSave, onDelete, title = "עריכת מוצר" }: EditItemModalProps) {
    const [name, setName] = useState("");
    const [emoji, setEmoji] = useState("");

    useEffect(() => {
        if (item) {
            setName(item.name);
            setEmoji(item.emoji || "");
        }
    }, [item]);

    if (!isOpen || !item) return null;

    const handleSave = () => {
        if (!name.trim()) return;
        onSave(item.id, name.trim(), emoji.trim() || undefined);
        onClose();
    };

    const handleDelete = () => {
        onDelete(item.id);
        onClose();
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className="bg-[#f0f4f8] w-full sm:max-w-md bg-white sm:rounded-3xl rounded-t-3xl shadow-2xl flex flex-col overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="bg-white px-6 py-5 flex items-center justify-between border-b border-gray-100 shrink-0">
                        <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800">
                            <Edit2 className="w-5 h-5 text-blue-600" />
                            {title}
                        </h2>
                        <button
                            onClick={onClose}
                            className="p-2 bg-gray-50 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* Visual Display */}
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 border border-blue-100 shadow-sm flex items-center justify-center shrink-0 relative overflow-hidden">
                                {item.imageUrl ? (
                                    <Image src={item.imageUrl} alt={item.name} fill className="object-contain p-2" />
                                ) : (
                                    <span className="text-3xl">{emoji || item.emoji || "📦"}</span>
                                )}
                            </div>
                            <div className="flex-1">
                                <p className="text-xs text-slate-400 font-medium mb-1">קטגוריה: {getCategoryLabel(item.category || "כללי")}</p>
                                <h3 className="text-lg font-bold text-slate-800">{item.name}</h3>
                            </div>
                        </div>

                        {/* Fields */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-600 mb-1.5 px-1">שם המוצר</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-800 font-medium text-lg"
                                />
                            </div>
                            {!item.imageUrl && (
                                <div>
                                    <label className="block text-sm font-semibold text-slate-600 mb-1.5 px-1">אמוג'י (אופציונלי)</label>
                                    <input
                                        type="text"
                                        maxLength={2}
                                        value={emoji}
                                        onChange={(e) => setEmoji(e.target.value)}
                                        placeholder="לדוג': 🍎"
                                        className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-2xl text-center"
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="bg-gray-50 p-6 border-t border-gray-100 flex gap-3">
                        <button
                            onClick={handleDelete}
                            className="px-4 py-4 rounded-xl font-bold bg-red-100 text-red-600 hover:bg-red-200 transition-colors flex items-center justify-center"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                        <button
                            onClick={handleSave}
                            className="flex-1 py-4 rounded-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                            שמור שינויים <Save className="w-5 h-5" />
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

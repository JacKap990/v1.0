"use client";

import { useState } from "react";
import { X, Save, Trash2, Calendar, Tag, ShieldCheck, Box, Factory, ExternalLink, Image as ImageIcon } from "lucide-react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { CATEGORY_MAP } from "@/lib/localization";

type ProductEditModalProps = {
    isOpen: boolean;
    onClose: () => void;
    item: {
        id: string;
        name: string;
        emoji: string | null;
        quantity: number;
        unit: string;
        expiryDate: Date | null;
        category?: string | null;
        manufacturer?: string | null;
        brand?: string | null;
        kosher?: string | null;
        imageUrl?: string | null;
        barcode?: string | null;
    } | null;
    onSave: (id: string, data: any) => Promise<void>;
    onDelete: (id: string) => Promise<void>;
};
const categories = Object.entries(CATEGORY_MAP);

export function ProductEditModal({ isOpen, onClose, item, onSave, onDelete }: ProductEditModalProps) {
    const [name, setName] = useState(item?.name || "");
    const [brand, setBrand] = useState(item?.brand || "");
    const [manufacturer, setManufacturer] = useState(item?.manufacturer || "");
    const [category, setCategory] = useState(item?.category || "אחר");
    const [kosher, setKosher] = useState(item?.kosher || "");
    const [barcode, setBarcode] = useState(item?.barcode || "");
    const [emoji, setEmoji] = useState(item?.emoji || "📦");
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const initialDate = item?.expiryDate ? format(new Date(item.expiryDate), "yyyy-MM-dd") : "";
    const [expiryStr, setExpiryStr] = useState(initialDate);

    if (!isOpen || !item) return null;

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await onSave(item.id, {
                name,
                brand,
                manufacturer,
                category,
                kosher,
                barcode,
                emoji,
                expiryDate: expiryStr ? new Date(expiryStr) : null,
                quantity: item.quantity,
                unit: item.unit
            });
            onClose();
        } catch (e) {
            console.error(e);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm("האם אתה בטוח שברצונך למחוק מוצר זה?")) return;
        setIsDeleting(true);
        try {
            await onDelete(item.id);
            onClose();
        } catch (e) {
            console.error(e);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
                    aria-hidden="true"
                />

                <motion.div
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="modal-title"
                    className="relative bg-white/95 backdrop-blur-2xl w-full max-w-lg sm:rounded-[40px] rounded-t-[40px] shadow-2xl p-8 overflow-y-auto max-h-[90vh]"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-3xl shadow-sm">
                                {item.imageUrl ? (
                                    <img src={item.imageUrl} alt={name} className="w-12 h-12 object-contain" />
                                ) : (
                                    <span>{emoji}</span>
                                )}
                            </div>
                            <div>
                                <h2 id="modal-title" className="text-2xl font-black text-slate-800 tracking-tight">ערוך מוצר</h2>
                                <p className="text-slate-400 text-sm font-bold">ניהול מידע מתקדם ומותגי</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-3 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors">
                            <X className="w-6 h-6 text-slate-400" />
                        </button>
                    </div>

                    {/* Form Content */}
                    <div className="space-y-6">
                        {/* Name & Brand */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                    <Box className="w-3 h-3" /> שם המוצר
                                </label>
                                <input
                                    value={name} onChange={e => setName(e.target.value)}
                                    className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-4 font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                    <Tag className="w-3 h-3" /> מותג
                                </label>
                                <input
                                    value={brand} onChange={e => setBrand(e.target.value)}
                                    className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-4 font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                />
                            </div>
                        </div>

                        {/* Manufacturer & Kosher */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                    <Factory className="w-3 h-3" /> יצרן
                                </label>
                                <input
                                    value={manufacturer} onChange={e => setManufacturer(e.target.value)}
                                    className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-4 font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                    <ShieldCheck className="w-3 h-3" /> כשרות
                                </label>
                                <input
                                    value={kosher} onChange={e => setKosher(e.target.value)}
                                    className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-4 font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                />
                            </div>
                        </div>

                        {/* Category & Expiry */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                    <ImageIcon className="w-3 h-3" /> קטגוריה
                                </label>
                                <select
                                    value={category} onChange={e => setCategory(e.target.value)}
                                    className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-4 font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none"
                                >
                                    {categories.map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                    <Calendar className="w-3 h-3" /> תוקף
                                </label>
                                <input
                                    type="date"
                                    value={expiryStr} onChange={e => setExpiryStr(e.target.value)}
                                    className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-4 font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-right"
                                />
                            </div>
                        </div>

                        {/* Barcode */}
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                <ExternalLink className="w-3 h-3" /> ברקוד / מק"ט
                            </label>
                            <input
                                value={barcode} onChange={e => setBarcode(e.target.value)}
                                className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-4 font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-10 flex gap-4">
                        <button
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="flex-1 h-14 bg-rose-50 hover:bg-rose-100 text-rose-500 rounded-2xl font-black transition-all flex items-center justify-center gap-2"
                        >
                            <Trash2 className="w-5 h-5" />
                            {isDeleting ? "מוחק..." : "מחק מוצר"}
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="flex-[2] h-14 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99]"
                        >
                            <Save className="w-5 h-5" />
                            {isSaving ? "שומר..." : "שמור שינויים"}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}

"use client";

import { useState, useEffect } from "react";
import { X, Save, Trash2, Calendar, Tag, ShieldCheck, Box, Factory, ExternalLink, Image as ImageIcon, Edit3, Lock, Barcode, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { CATEGORY_MAP, getCategoryLabel } from "@/lib/localization";
import { getUnitLabel, formatQuantity, ensureNormalizedDisplay } from "@/lib/unitConversion";

type ProductDetailModalProps = {
    isOpen: boolean;
    onClose: () => void;
    item: {
        id: string;
        name: string;
        emoji: string | null;
        quantity: number;
        unit: string;
        expiryDate: Date | string | null;
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

export function ProductDetailModal({ isOpen, onClose, item, onSave, onDelete }: ProductDetailModalProps) {
    const [isEditMode, setIsEditMode] = useState(false);

    // Form States
    const [name, setName] = useState("");
    const [brand, setBrand] = useState("");
    const [manufacturer, setManufacturer] = useState("");
    const [category, setCategory] = useState("Other");
    const [kosher, setKosher] = useState("");
    const [barcode, setBarcode] = useState("");
    const [emoji, setEmoji] = useState("📦");
    const [quantity, setQuantity] = useState("1");
    const [unit, setUnit] = useState("יחידות");
    const [expiryStr, setExpiryStr] = useState("");

    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Sync form state when item changes or modal opens
    useEffect(() => {
        if (item && isOpen) {
            setName(item.name || "");
            setBrand(item.brand || "");
            setManufacturer(item.manufacturer || "");
            setCategory(item.category || "Other");
            setKosher(item.kosher || "");
            setBarcode(item.barcode || "");
            setEmoji(item.emoji || "📦");
            setQuantity(item.quantity?.toString() || "1");
            setUnit(item.unit || "יחידות");
            setExpiryStr(item.expiryDate ? format(new Date(item.expiryDate), "yyyy-MM-dd") : "");
            setIsEditMode(false);
        }
    }, [item, isOpen]);

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
                quantity: parseFloat(quantity),
                unit
            });
            setIsEditMode(false);
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

    const { qty: displayQty, label: displayUnitName } = ensureNormalizedDisplay(item.name, item.quantity, item.unit);

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                />

                <motion.div
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="relative bg-white w-full max-w-lg sm:rounded-[40px] rounded-t-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[95vh]"
                >
                    {/* Hero Section */}
                    <div className="relative h-48 sm:h-56 bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-700 shrink-0">
                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="absolute top-6 left-6 p-2 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full text-white transition-all z-10"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        {/* Edit Mode Toggle */}
                        {!isEditMode && (
                            <button
                                onClick={() => setIsEditMode(true)}
                                className="absolute top-6 right-6 px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-2xl text-white font-black text-xs flex items-center gap-2 transition-all z-10"
                            >
                                <Edit3 className="w-4 h-4" /> עריכה
                            </button>
                        )}

                        {/* Product Image/Emoji */}
                        <div className="absolute -bottom-10 right-8 w-24 h-24 sm:w-28 sm:h-28 bg-white rounded-[32px] shadow-xl border-4 border-white flex items-center justify-center overflow-hidden z-20">
                            {item.imageUrl ? (
                                <img src={item.imageUrl} alt={name} className="w-20 h-20 object-contain" />
                            ) : (
                                <span className="text-5xl">{emoji}</span>
                            )}
                        </div>

                        {/* Title Overlay */}
                        <div className="absolute bottom-6 left-8 right-36 text-white text-right">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70">
                                {getCategoryLabel(isEditMode ? category : item.category)}
                            </span>
                            <h2 className="text-2xl sm:text-3xl font-black truncate leading-tight mt-1">
                                {isEditMode ? name : item.name}
                            </h2>
                        </div>
                    </div>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto p-8 pt-14 bg-slate-50/50">
                        {!isEditMode ? (
                            /* VIEW MODE */
                            <div className="space-y-6">
                                {/* Quantities & Timing Grid */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-col gap-1">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider text-right">כמות נוכחית</span>
                                        <div className="flex items-baseline gap-1.5 flex-row-reverse">
                                            <span className="text-2xl font-black text-slate-800">{formatQuantity(displayQty, item.unit)}</span>
                                            <span className="text-xs font-bold text-slate-400 uppercase">{displayUnitName}</span>
                                        </div>
                                    </div>
                                    <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-col gap-1">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider text-right">תוקף</span>
                                        <div className="flex items-center gap-2 flex-row-reverse justify-end">
                                            <Calendar className={`w-4 h-4 ${item.expiryDate && new Date(item.expiryDate) < new Date() ? 'text-rose-500' : 'text-indigo-500'}`} />
                                            <span className={`text-sm font-black ${item.expiryDate && new Date(item.expiryDate) < new Date() ? 'text-rose-600' : 'text-slate-700'}`}>
                                                {item.expiryDate ? new Date(item.expiryDate).toLocaleDateString('he-IL') : 'לא הוזן'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Metadata Grid */}
                                <div className="space-y-4">
                                    <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.1em] px-1 text-right">מידע מותגי</h4>

                                    <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm divide-y divide-slate-50 overflow-hidden text-right">
                                        <div className="p-5 flex items-center justify-between flex-row-reverse">
                                            <div className="flex items-center gap-3 flex-row-reverse">
                                                <div className="p-2.5 bg-indigo-50 rounded-2xl text-indigo-600">
                                                    <Tag className="w-5 h-5" />
                                                </div>
                                                <span className="text-sm font-bold text-slate-500">מותג</span>
                                            </div>
                                            <span className="text-sm font-black text-slate-800">{item.brand || '---'}</span>
                                        </div>

                                        <div className="p-5 flex items-center justify-between flex-row-reverse">
                                            <div className="flex items-center gap-3 flex-row-reverse">
                                                <div className="p-2.5 bg-violet-50 rounded-2xl text-violet-600">
                                                    <Factory className="w-5 h-5" />
                                                </div>
                                                <span className="text-sm font-bold text-slate-500">יצרן</span>
                                            </div>
                                            <span className="text-sm font-black text-slate-800 max-w-[200px] truncate">{item.manufacturer || '---'}</span>
                                        </div>

                                        <div className="p-5 flex items-center justify-between flex-row-reverse">
                                            <div className="flex items-center gap-3 flex-row-reverse">
                                                <div className="p-2.5 bg-emerald-50 rounded-2xl text-emerald-600">
                                                    <ShieldCheck className="w-5 h-5" />
                                                </div>
                                                <span className="text-sm font-bold text-slate-500">כשרות</span>
                                            </div>
                                            <span className="text-sm font-black text-slate-800">{item.kosher || '---'}</span>
                                        </div>

                                        <div className="p-5 flex items-center justify-between flex-row-reverse">
                                            <div className="flex items-center gap-3 flex-row-reverse">
                                                <div className="p-2.5 bg-amber-50 rounded-2xl text-amber-600">
                                                    <Barcode className="w-5 h-5" />
                                                </div>
                                                <span className="text-sm font-bold text-slate-500">ברקוד / מק"ט</span>
                                            </div>
                                            <span className="text-xs font-mono font-bold text-slate-400">{item.barcode || 'חסר במערכת'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* EDIT MODE */
                            <div className="space-y-6 text-right">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-1">שם המוצר</label>
                                        <input
                                            value={name} onChange={e => setName(e.target.value)}
                                            dir="rtl"
                                            className="w-full h-14 bg-white border border-slate-200 rounded-2xl px-4 font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-1">מותג</label>
                                        <input
                                            value={brand} onChange={e => setBrand(e.target.value)}
                                            dir="rtl"
                                            className="w-full h-14 bg-white border border-slate-200 rounded-2xl px-4 font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-1">כמות</label>
                                        <input
                                            type="number" step="any"
                                            value={quantity} onChange={e => setQuantity(e.target.value)}
                                            className="w-full h-14 bg-white border border-slate-200 rounded-2xl px-4 font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-1">יחידה</label>
                                        <select
                                            value={unit} onChange={e => setUnit(e.target.value)}
                                            className="w-full h-14 bg-white border border-slate-200 rounded-2xl px-4 font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none"
                                        >
                                            {["יחידות", "קג", "גרם", "ליטר", "מל", "מארז"].map(u => (
                                                <option key={u} value={u}>{getUnitLabel(u)}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-1">קטגוריה</label>
                                        <select
                                            value={category} onChange={e => setCategory(e.target.value)}
                                            className="w-full h-14 bg-white border border-slate-200 rounded-2xl px-4 font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none"
                                        >
                                            {categories.map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-1">תוקף</label>
                                        <input
                                            type="date"
                                            value={expiryStr} onChange={e => setExpiryStr(e.target.value)}
                                            className="w-full h-14 bg-white border border-slate-200 rounded-2xl px-4 font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-right"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-1 flex items-center justify-between flex-row-reverse">
                                        <span>ברקוד / מק"ט</span>
                                        {item.barcode && <span className="flex items-center gap-1 text-indigo-500 lowercase"><Lock className="w-3 h-3" /> read-only</span>}
                                    </label>
                                    <div className="relative">
                                        <input
                                            value={barcode}
                                            onChange={e => !item.barcode && setBarcode(e.target.value)}
                                            disabled={!!item.barcode}
                                            className={`w-full h-14 bg-white border border-slate-200 rounded-2xl px-4 font-mono font-bold text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all ${item.barcode ? 'bg-slate-50 text-slate-300 border-dashed' : 'text-slate-800'}`}
                                        />
                                        {item.barcode && <div className="absolute inset-0 z-10 cursor-not-allowed" title="Barcode cannot be changed once assigned" />}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer Actions */}
                    <div className="p-8 bg-white border-t border-slate-100 flex gap-4 shrink-0 flex-row-reverse">
                        {isEditMode ? (
                            <>
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="flex-[2] h-14 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2"
                                >
                                    <Save className="w-5 h-5" />
                                    {isSaving ? "שומר..." : "שמור שינויים"}
                                </button>
                                <button
                                    onClick={() => setIsEditMode(false)}
                                    className="flex-1 h-14 bg-slate-50 hover:bg-slate-100 text-slate-400 rounded-2xl font-black transition-all"
                                >
                                    ביטול
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={onClose}
                                    className="flex-[2] h-14 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black shadow-lg transition-all"
                                >
                                    סגור
                                </button>
                                <button
                                    onClick={handleDelete}
                                    disabled={isDeleting}
                                    className="flex-1 h-14 bg-rose-50 hover:bg-rose-100 text-rose-500 rounded-2xl font-black transition-all flex items-center justify-center gap-2"
                                >
                                    <Trash2 className="w-5 h-5" />
                                    {isDeleting ? "..." : "מחק"}
                                </button>
                            </>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}

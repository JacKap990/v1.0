"use client";

import { useState, useEffect } from "react";
import { X, Save, Trash2, Calendar, Tag, ShieldCheck, Box, Factory, ExternalLink, Image as ImageIcon, Edit3, Lock } from "lucide-react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { CATEGORY_MAP } from "@/lib/localization";

type ProductDetailModalProps = {
    isOpen: boolean;
    onClose: () => void;
    item: {
        id: string;
        name: string;
        emoji: string | null;
        quantity: number;
        unit: string;
        expiryDate: Date | null | string;
        category?: string | null;
        manufacturer?: string | null;
        brand?: string | null;
        kosher?: string | null;
        imageUrl?: string | null;
        barcode?: string | null;
    } | null;
    onSave: (id: string, data: any) => Promise<void>;
    onDelete?: (id: string) => Promise<void>;
};

const categories = Object.entries(CATEGORY_MAP);

export function ProductDetailModal({ isOpen, onClose, item, onSave, onDelete }: ProductDetailModalProps) {
    const [isEditMode, setIsEditMode] = useState(false);

    // Form state
    const [name, setName] = useState("");
    const [brand, setBrand] = useState("");
    const [manufacturer, setManufacturer] = useState("");
    const [category, setCategory] = useState("אחר");
    const [kosher, setKosher] = useState("");
    const [barcode, setBarcode] = useState("");
    const [emoji, setEmoji] = useState("📦");
    const [quantity, setQuantity] = useState("1");
    const [unit, setUnit] = useState("יח'");
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const [expiryStr, setExpiryStr] = useState("");

    // Sync state when item changes or modal opens
    useEffect(() => {
        if (item && isOpen) {
            setName(item.name || "");
            setBrand(item.brand || "");
            setManufacturer(item.manufacturer || "");
            setCategory(item.category || "אחר");
            setKosher(item.kosher || "");
            setBarcode(item.barcode || "");
            setEmoji(item.emoji || "📦");
            setQuantity(item.quantity?.toString() || "1");
            setUnit(item.unit || "יח'");

            const initialDate = item.expiryDate ? format(new Date(item.expiryDate), "yyyy-MM-dd") : "";
            setExpiryStr(initialDate);

            // Always start in details mode
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
        if (!onDelete) return;
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

    const renderField = (label: string, value: string | number | undefined, icon: any, fieldName: string, type: string = "text", options?: [string, string][]) => {
        const Icon = icon;
        const isBarcode = fieldName === "barcode";
        const isLocked = isBarcode && item.barcode; // Barcode is locked if it exists in DB

        if (!isEditMode) {
            return (
                <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Icon className="w-3 h-3" /> {label}
                    </label>
                    <p className="text-sm font-bold text-slate-700 bg-slate-50/50 p-3 rounded-xl border border-transparent">
                        {value || "---"}
                    </p>
                </div>
            );
        }

        return (
            <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <Icon className="w-3 h-3" /> {label}
                    {Boolean(isLocked) && <Lock className="w-2.5 h-2.5 ml-auto text-amber-500" />}
                </label>
                {options ? (
                    <select
                        value={value}
                        onChange={e => setCategory(e.target.value)}
                        className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-3 font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none text-sm"
                    >
                        {options.map(([key, lbl]) => <option key={key} value={key}>{lbl}</option>)}
                    </select>
                ) : (
                    <input
                        type={type}
                        value={value}
                        onChange={e => {
                            if (fieldName === "name") setName(e.target.value);
                            if (fieldName === "brand") setBrand(e.target.value);
                            if (fieldName === "manufacturer") setManufacturer(e.target.value);
                            if (fieldName === "kosher") setKosher(e.target.value);
                            if (fieldName === "barcode" && !isLocked) setBarcode(e.target.value);
                            if (fieldName === "expiry") setExpiryStr(e.target.value);
                            if (fieldName === "quantity") setQuantity(e.target.value);
                            if (fieldName === "unit") setUnit(e.target.value);
                        }}
                        disabled={Boolean(isLocked)}
                        className={`w-full h-11 bg-white border border-slate-200 rounded-xl px-3 font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm ${Boolean(isLocked) ? 'bg-slate-50 text-slate-400 cursor-not-allowed' : ''}`}
                    />
                )}
            </div>
        );
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
                />

                <motion.div
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="relative bg-white w-full max-w-lg sm:rounded-[40px] rounded-t-[40px] shadow-2xl p-6 sm:p-8 overflow-y-auto max-h-[95vh]"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-3xl shadow-sm relative group">
                                {item.imageUrl ? (
                                    <img src={item.imageUrl} alt={name} className="w-10 h-10 object-contain" />
                                ) : (
                                    <span>{emoji}</span>
                                )}
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-slate-800 tracking-tight">
                                    {isEditMode ? "עריכת מוצר" : "פרטי מוצר"}
                                </h2>
                                <p className="text-slate-400 text-xs font-bold">
                                    {isEditMode ? "עדכון מידע ומותגיות" : "סקירה כללית של הנתונים"}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {!isEditMode && (
                                <button
                                    onClick={() => setIsEditMode(true)}
                                    className="p-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl transition-all active:scale-90"
                                    title="ערוך"
                                >
                                    <Edit3 className="w-5 h-5" />
                                </button>
                            )}
                            <button onClick={onClose} className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors">
                                <X className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="space-y-5">
                        <div className="grid grid-cols-2 gap-4">
                            {renderField("שם המוצר", name, Box, "name")}
                            {renderField("מותג", brand, Tag, "brand")}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {renderField("יצרן", manufacturer, Factory, "manufacturer")}
                            {renderField("כשרות", kosher, ShieldCheck, "kosher")}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {renderField("קטגוריה", category, ImageIcon, "category", "text", categories)}
                            {renderField("תוקף", expiryStr, Calendar, "expiry", "date")}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {renderField("כמות", quantity, Tag, "quantity", "number")}
                            {renderField("יחידה", unit, Box, "unit")}
                        </div>

                        {renderField("ברקוד / מק\"ט", barcode, ExternalLink, "barcode")}
                    </div>

                    {/* Actions */}
                    <AnimatePresence mode="wait">
                        {isEditMode ? (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="mt-8 flex gap-3"
                            >
                                <button
                                    onClick={() => setIsEditMode(false)}
                                    className="flex-1 h-12 bg-slate-100 text-slate-600 rounded-xl font-black transition-all"
                                >
                                    ביטול
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="flex-[2] h-12 bg-indigo-600 text-white rounded-xl font-black shadow-lg shadow-indigo-100 transition-all flex items-center justify-center gap-2"
                                >
                                    <Save className="w-4 h-4" />
                                    {isSaving ? "שומר..." : "שמור שינויים"}
                                </button>
                            </motion.div>
                        ) : (
                            onDelete && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="mt-8"
                                >
                                    <button
                                        onClick={handleDelete}
                                        disabled={isDeleting}
                                        className="w-full h-12 bg-rose-50 hover:bg-rose-100 text-rose-500 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        {isDeleting ? "מוחק..." : "מחק מוצר מהרשימה"}
                                    </button>
                                </motion.div>
                            )
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}

"use client";

import { useState, useEffect } from "react";
import { X, Plus, Minus, Check } from "lucide-react";
import { getUnitLabel, estimateConversion } from "@/lib/unitConversion";
// Removed framer-motion imports

type SmartQtyModalProps = {
    isOpen: boolean;
    onClose: () => void;
    item: {
        id: string;
        name: string;
        quantity: number;
        unit: string;
        category?: string | null;
        emoji?: string | null;
    } | null;
    onSave: (id: string, data: { quantity: number; unit: string }) => Promise<void>;
};

const getUnitOptions = (name: string, category?: string | null) => {
    const cat = category?.toLowerCase() || "";
    const n = name.toLowerCase();

    const isLiquid = n.includes('חלב') || n.includes('שתייה') || n.includes('מים') || n.includes('מיץ') || n.includes('תירוש') || n.includes('יין') || n.includes('שמן') || n.includes('שתיה') || n.includes('סירופ') || n.includes('רוטב') || n.includes('סבון') || n.includes('שמפו') || n.includes('מרכך') || n.includes('אקונומיקה') || cat.includes("beverages") || cat.includes("משקאות");

    const isProduceOrMeat = cat.includes("vegetables") || cat.includes("fruits") || cat.includes("meat") || cat.includes("produce") || cat.includes("ירקות") || cat.includes("פירות") || cat.includes("בשר") || cat.includes("תוצרת") || n.includes("עגבניה") || n.includes("עגבנייה") || n.includes("מלפפון") || n.includes("בצל") || n.includes("תפוח") || n.includes("בשר") || n.includes("עוף") || n.includes("דג") || n.includes("סטייק") || n.includes("חזה");

    if (isLiquid) {
        return ["יחידות", "ליטר", "מל"];
    }

    if (isProduceOrMeat) {
        return ["יחידות", "קג", "גרם"];
    }

    // Default for everything else - but still prioritize relevance
    // If not obviously liquid, don't show liters to avoid confusion
    return ["יחידות", "קג", "גרם"];
};

export function SmartQtyModal({ isOpen, onClose, item, onSave }: SmartQtyModalProps) {
    const [qty, setQty] = useState(item?.quantity || 1);
    const [unit, setUnit] = useState(item?.unit || "יחידות");
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (item) {
            setQty(item.quantity);
            setUnit(item.unit);
        }
    }, [item]);

    if (!isOpen || !item) return null;

    const handleUnitChange = (newUnit: string) => {
        const converted = estimateConversion(item.name, qty, unit, newUnit);
        setQty(converted);
        setUnit(newUnit);
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await onSave(item.id, { quantity: qty, unit });
            onClose();
        } catch (e) {
            console.error(e);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                onClick={onClose}
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-md z-0 animate-in fade-in duration-300"
            />

            {/* Modal Container */}
            <div
                role="dialog"
                aria-modal="true"
                className="relative bg-white/95 backdrop-blur-2xl border border-white/20 shadow-2xl rounded-[40px] w-full max-w-sm overflow-hidden flex flex-col z-10 animate-in fade-in zoom-in-95 duration-300"
            >
                {/* Header with Title */}
                <div className="p-6 pb-2 text-center relative">
                    <button
                        onClick={onClose}
                        className="absolute left-6 top-6 p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors text-slate-500"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="text-4xl mb-3">{item.emoji || "📦"}</div>
                    <h2 className="text-2xl font-black text-slate-800 leading-tight">{item.name}</h2>
                    <p className="text-slate-400 text-sm font-bold mt-1">עדכון כמות ויחידות מידה</p>
                </div>

                {/* Unit Tabs */}
                <div className="px-6 py-4">
                    <div className="bg-slate-100/80 p-1 rounded-2xl flex gap-1 overflow-x-auto no-scrollbar">
                        {getUnitOptions(item.name, item.category).map((u) => (
                            <button
                                key={u}
                                onClick={() => handleUnitChange(u)}
                                className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all min-w-[60px] ${unit === u
                                    ? "bg-white text-indigo-600 shadow-sm"
                                    : "text-slate-400 hover:text-slate-600"
                                    }`}
                            >
                                {getUnitLabel(u)}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Quantity Controls */}
                <div className="px-8 py-8 flex flex-col items-center">
                    <div className="flex items-center justify-between w-full mb-8">
                        <button
                            onClick={() => setQty(Math.max(0, qty - (unit === "יחידות" ? 1 : 0.1)))}
                            className="w-16 h-16 rounded-[28px] bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-slate-200 transition-colors shadow-sm active:scale-95"
                        >
                            <Minus className="w-8 h-8" />
                        </button>

                        <div className="flex flex-col items-center">
                            <span
                                key={qty}
                                className="text-6xl font-black text-indigo-700 tabular-nums animate-in fade-in zoom-in duration-200"
                            >
                                {qty % 1 === 0 ? qty : qty.toFixed(1)}
                            </span>
                            <span className="text-slate-400 font-bold uppercase tracking-wider text-xs">
                                {getUnitLabel(unit)}
                            </span>
                        </div>

                        <button
                            onClick={() => setQty(qty + (unit === "יחידות" ? 1 : 0.1))}
                            className="w-16 h-16 rounded-[28px] bg-indigo-50 text-indigo-600 flex items-center justify-center hover:bg-indigo-100 transition-colors shadow-sm active:scale-95"
                        >
                            <Plus className="w-8 h-8" />
                        </button>
                    </div>

                    {/* Presets (Quick Access) */}
                    <div className="flex gap-3 w-full">
                        {[0, 0.5, 1, 2].map(p => (
                            <button
                                key={p}
                                onClick={() => setQty(p)}
                                className="flex-1 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-500 hover:bg-white hover:shadow-md transition-all active:scale-95"
                            >
                                {p === 0 ? "אפס" : p}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Save Button */}
                <div className="p-6 pt-0">
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="w-full h-16 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-[24px] font-black text-lg shadow-xl shadow-indigo-200 flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                        {isSaving ? (
                            <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <span>אישור ועדכון</span>
                                <Check className="w-6 h-6" />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

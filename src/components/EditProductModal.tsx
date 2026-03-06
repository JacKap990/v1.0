"use client";

import { useState } from "react";
import { X, Save, Edit3, CalendarIcon } from "lucide-react";
import { format } from "date-fns";

type EditModalProps = {
    isOpen: boolean;
    onClose: () => void;
    item: {
        id: string;
        name: string;
        emoji: string | null;
        quantity: number;
        unit: string;
        expiryDate: Date | null;
    } | null;
    onSave: (id: string, data: { name: string; emoji: string; quantity: number; unit: string; expiryDate: Date | null }) => Promise<void>;
};

const commonUnits = ["יחידות", "ק\"ג", "גרם", "ליטר", "מ\"ל", "אריזות", "בקבוקים", "קופסאות"];

export function EditProductModal({ isOpen, onClose, item, onSave }: EditModalProps) {
    if (!isOpen || !item) return null;

    return <EditForm item={item} onClose={onClose} onSave={onSave} />;
}

// Inner component so hooks are always called unconditionally (fixes B045)
function EditForm({ item, onClose, onSave }: { item: NonNullable<EditModalProps['item']>; onClose: () => void; onSave: EditModalProps['onSave'] }) {
    const [name, setName] = useState(item.name);
    const [emoji, setEmoji] = useState(item.emoji || "📦");
    const [quantity, setQuantity] = useState(item.quantity.toString());
    const [unit, setUnit] = useState(item.unit);

    // Format date for the input logic YYYY-MM-DD
    const initialDate = item.expiryDate ? format(new Date(item.expiryDate), "yyyy-MM-dd") : "";
    const [expiryDateStr, setExpiryDateStr] = useState(initialDate);

    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const qtyNum = parseFloat(quantity);
            if (isNaN(qtyNum) || qtyNum <= 0) {
                alert("כמות לא חוקית");
                return;
            }

            const expDate = expiryDateStr ? new Date(expiryDateStr) : null;

            await onSave(item.id, {
                name,
                emoji,
                quantity: qtyNum,
                unit,
                expiryDate: expDate
            });

            onClose();
        } catch (error) {
            console.error("Failed saving", error);
            alert("שגיאה בשמירה");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal Box */}
            <div className="bg-white w-full sm:w-[400px] rounded-t-3xl sm:rounded-3xl shadow-2xl z-10 p-6 flex flex-col gap-6 animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:fade-in duration-300">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <Edit3 className="w-5 h-5 text-indigo-500" /> ערוך מוצר
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body Form */}
                <div className="flex flex-col gap-4">

                    {/* Emoji + Name */}
                    <div className="flex gap-3">
                        <div className="shrink-0 flex flex-col gap-1">
                            <label className="text-xs font-semibold text-slate-500">אמוג'י</label>
                            <input
                                type="text"
                                value={emoji}
                                onChange={(e) => setEmoji(e.target.value)}
                                className="w-14 h-12 text-center text-2xl bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                maxLength={2}
                            />
                        </div>
                        <div className="flex-1 flex flex-col gap-1">
                            <label className="text-xs font-semibold text-slate-500">שם המוצר</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full h-12 px-3 text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                    </div>

                    {/* Quantity + Unit */}
                    <div className="flex gap-3">
                        <div className="flex-1 flex flex-col gap-1">
                            <label className="text-xs font-semibold text-slate-500">כמות</label>
                            <input
                                type="number"
                                step="any"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                                className="w-full h-12 px-3 text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                        <div className="flex-1 flex flex-col gap-1">
                            <label className="text-xs font-semibold text-slate-500">יחידת מידה</label>
                            <select
                                value={unit}
                                onChange={(e) => setUnit(e.target.value)}
                                className="w-full h-12 px-3 text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none app-appearance-none"
                            >
                                {commonUnits.map(u => (
                                    <option key={u} value={u}>{u}</option>
                                ))}
                                {!commonUnits.includes(unit) && (
                                    <option value={unit}>{unit}</option>
                                )}
                            </select>
                        </div>
                    </div>

                    {/* Expiry Date */}
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                            <CalendarIcon className="w-3.5 h-3.5" /> תוקף (אופציונלי)
                        </label>
                        <input
                            type="date"
                            value={expiryDateStr}
                            onChange={(e) => setExpiryDateStr(e.target.value)}
                            className="w-full h-12 px-3 text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-right"
                        />
                    </div>
                </div>

                {/* Actions */}
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors mt-2"
                >
                    <Save className="w-5 h-5" />
                    {isSaving ? "שומר..." : "שמור שינויים"}
                </button>

            </div>
        </div>
    );
}

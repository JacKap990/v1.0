"use client";
export const runtime = 'edge';


import { useState, useRef } from "react";
import { Camera, Upload, Loader2, PackagePlus, Check, X, ChevronLeft, Receipt } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { getCategoryLabel } from "@/lib/localization";

type ScannedProduct = {
    name: string;
    quantity: number;
    category: string;
    emoji: string;
    selected: boolean;
};

export default function ReceiptScanPage() {
    const [image, setImage] = useState<string | null>(null);
    const [products, setProducts] = useState<ScannedProduct[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [saved, setSaved] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (ev) => {
            const dataUrl = ev.target?.result as string;
            setImage(dataUrl);
            setProducts([]);
            setError("");
            setSaved(false);
            analyzeReceipt(dataUrl);
        };
        reader.readAsDataURL(file);
    };

    const analyzeReceipt = async (dataUrl: string) => {
        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/ai/scan-receipt", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ image: dataUrl }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "שגיאה בניתוח הקבלה");
                return;
            }

            setProducts(data.products.map((p: any) => ({ ...p, selected: true })));
        } catch (err) {
            setError("שגיאה בחיבור לשרת. נסה שוב.");
        } finally {
            setLoading(false);
        }
    };

    const toggleProduct = (index: number) => {
        setProducts(prev =>
            prev.map((p, i) => i === index ? { ...p, selected: !p.selected } : p)
        );
    };

    const addToInventory = async () => {
        const selected = products.filter(p => p.selected);
        if (selected.length === 0) return;

        setLoading(true);
        try {
            // Add each product to inventory via the existing inventory action
            for (const product of selected) {
                await fetch("/api/lookup", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        name: product.name,
                        category: product.category,
                        emoji: product.emoji,
                    }),
                });
            }
            setSaved(true);
        } catch (err) {
            setError("שגיאה בשמירת המוצרים");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 pb-24 min-h-screen">
            {/* Header */}
            <header className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                    <Link href="/" className="p-2 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors">
                        <ChevronLeft className="w-5 h-5 text-slate-600" />
                    </Link>
                    <div className="flex-1">
                        <h1 className="text-2xl font-black text-slate-800 tracking-tight">סריקת קבלה</h1>
                        <p className="text-xs text-slate-500">צלם קבלה מהסופר והמערכת תזהה את המוצרים</p>
                    </div>
                    <div className="p-2.5 bg-violet-50 rounded-xl">
                        <Receipt className="w-5 h-5 text-violet-600" />
                    </div>
                </div>
            </header>

            {/* Upload Area */}
            {!image && !loading && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center gap-4"
                >
                    <div
                        onClick={() => fileRef.current?.click()}
                        className="w-full aspect-[3/4] max-w-xs bg-gradient-to-br from-violet-50 to-indigo-50 border-2 border-dashed border-violet-200 rounded-3xl flex flex-col items-center justify-center cursor-pointer hover:border-violet-400 transition-all group"
                    >
                        <div className="w-20 h-20 bg-violet-100 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <Camera className="w-10 h-10 text-violet-500" />
                        </div>
                        <p className="text-violet-700 font-bold text-lg">צלם או העלה קבלה</p>
                        <p className="text-violet-500 text-sm mt-1">מהמצלמה או מהגלריה</p>
                    </div>

                    <input
                        ref={fileRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleFileSelect}
                        className="hidden"
                    />
                </motion.div>
            )}

            {/* Loading State */}
            {loading && !saved && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center py-16 gap-4"
                >
                    <div className="relative">
                        <div className="w-20 h-20 bg-violet-100 rounded-full flex items-center justify-center">
                            <Loader2 className="w-10 h-10 text-violet-500 animate-spin" />
                        </div>
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-emerald-400 rounded-full flex items-center justify-center animate-pulse">
                            <span className="text-white text-xs">AI</span>
                        </div>
                    </div>
                    <p className="font-bold text-slate-700">מנתח את הקבלה...</p>
                    <p className="text-sm text-slate-400">Gemini AI קורא ומזהה מוצרים</p>
                </motion.div>
            )}

            {/* Error */}
            {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl text-sm font-medium mb-4">
                    {error}
                </div>
            )}

            {/* Results */}
            {products.length > 0 && !saved && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-3"
                >
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="font-bold text-slate-700">
                            זוהו {products.length} מוצרים
                        </h2>
                        <button
                            onClick={() => { setImage(null); setProducts([]); }}
                            className="text-xs text-slate-400 hover:text-slate-600"
                        >
                            סרוק מחדש
                        </button>
                    </div>

                    {products.map((product, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            onClick={() => toggleProduct(i)}
                            className={`flex items-center gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${product.selected
                                ? "bg-violet-50 border-violet-200 shadow-sm"
                                : "bg-slate-50 border-slate-100 opacity-50"
                                }`}
                        >
                            <span className="text-2xl">{product.emoji}</span>
                            <div className="flex-1">
                                <p className="font-bold text-sm text-slate-800">{product.name}</p>
                                <p className="text-[11px] text-slate-400">{getCategoryLabel(product.category)} · כמות: {product.quantity}</p>
                            </div>
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${product.selected ? "bg-violet-500 text-white" : "bg-slate-200"
                                }`}>
                                {product.selected && <Check className="w-4 h-4" />}
                            </div>
                        </motion.div>
                    ))}

                    <button
                        onClick={addToInventory}
                        disabled={loading || products.filter(p => p.selected).length === 0}
                        className="w-full mt-4 p-4 bg-gradient-to-r from-violet-500 to-indigo-500 text-white font-bold text-lg rounded-2xl shadow-[0_8px_24px_rgba(139,92,246,0.3)] hover:shadow-[0_12px_32px_rgba(139,92,246,0.4)] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        <PackagePlus className="w-5 h-5" />
                        הוסף {products.filter(p => p.selected).length} מוצרים למלאי
                    </button>
                </motion.div>
            )}

            {/* Success */}
            {saved && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-16"
                >
                    <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Check className="w-10 h-10 text-emerald-500" />
                    </div>
                    <p className="text-xl font-black text-slate-800 mb-2">המוצרים נוספו! 🎉</p>
                    <p className="text-sm text-slate-500 mb-6">המוצרים מהקבלה נוספו למאגר המוצרים</p>
                    <div className="flex gap-3 justify-center">
                        <button
                            onClick={() => { setImage(null); setProducts([]); setSaved(false); }}
                            className="px-6 py-3 bg-violet-100 text-violet-700 font-bold rounded-2xl"
                        >
                            סרוק עוד
                        </button>
                        <Link href="/inventory" className="px-6 py-3 bg-slate-900 text-white font-bold rounded-2xl">
                            צפה במלאי
                        </Link>
                    </div>
                </motion.div>
            )}
        </div>
    );
}

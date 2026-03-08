"use client";

import { useState, useRef } from "react";
// Removed framer-motion imports
import { X, Upload, FileText, BrainCircuit, CheckCircle2, Minus, Plus, Trash2, ArrowRight } from "lucide-react";
import { addMultipleItemsToInventory } from "@/app/actions/inventory";
import { useToast } from "@/components/ui/Toast";
import Image from "next/image";
import { getCategoryLabel } from "@/lib/localization";
import { useLanguage } from "@/components/LanguageProvider";

interface DetectedItem {
    id: string; // local id for list rendering
    name: string;
    quantity: number;
    unit: string;
    emoji?: string;
    category?: string;
}

interface ReceiptScannerModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function ReceiptScannerModal({ isOpen, onClose }: ReceiptScannerModalProps) {
    const { showToast } = useToast();
    const { t } = useLanguage();
    const [step, setStep] = useState<"upload" | "analyzing" | "review" | "saving">("upload");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [detectedItems, setDetectedItems] = useState<DetectedItem[]>([]);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const resetState = () => {
        setStep("upload");
        setSelectedFile(null);
        setPreviewUrl(null);
        setDetectedItems([]);
    };

    const handleClose = () => {
        if (step === "analyzing" || step === "saving") return; // block close during operations
        resetState();
        onClose();
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
            handleAnalyze(file);
        }
    };

    const handleAnalyze = async (file: File) => {
        setStep("analyzing");

        try {
            const res = await fetch('/api/gateway/ocr', { method: 'POST' });

            if (res.ok) {
                const data = await res.json();
                if (data.success && data.items) {
                    const itemsWithIds = data.items.map((it: any) => ({
                        ...it,
                        id: Math.random().toString(36).substr(2, 9)
                    }));
                    setDetectedItems(itemsWithIds);
                    setStep("review");
                } else {
                    showToast(t("error_saving"), "error");
                    setStep("upload");
                }
            } else {
                showToast(t("error_saving"), "error");
                setStep("upload");
            }
        } catch (error) {
            console.error(error);
            showToast(t("error_saving"), "error");
            setStep("upload");
        }
    };

    const updateQuantity = (id: string, delta: number) => {
        setDetectedItems(prev => prev.map(item => {
            if (item.id === id) {
                const newQty = Math.max(1, item.quantity + delta);
                return { ...item, quantity: newQty };
            }
            return item;
        }));
    };

    const removeItem = (id: string) => {
        setDetectedItems(prev => prev.filter(item => item.id !== id));
    };

    const handleSaveToInventory = async () => {
        if (detectedItems.length === 0) return;
        setStep("saving");

        const itemsToSave = detectedItems.map(item => ({
            name: item.name,
            quantity: item.quantity,
            unit: item.unit || "יחידה",
            emoji: item.emoji,
            category: item.category
        }));

        const result = await addMultipleItemsToInventory(itemsToSave);
        if (result.success) {
            showToast(t("save_success"), "success");
            resetState();
            onClose();
        } else {
            showToast(t("error_saving"), "error");
            setStep("review");
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div
                onClick={handleClose}
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300"
            />

            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="scanner-modal-title"
                className="bg-white/95 backdrop-blur-xl w-full sm:max-w-md h-[90vh] sm:h-[85vh] sm:rounded-[40px] rounded-t-[40px] shadow-2xl flex flex-col overflow-hidden relative animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-white px-6 py-4 flex items-center justify-between border-b border-slate-100 shrink-0 relative z-10">
                    <div className="flex items-center gap-2">
                        <BrainCircuit className="w-6 h-6 text-indigo-600" />
                        <h2 id="scanner-modal-title" className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
                            {t("smart_scanner_title")}
                        </h2>
                    </div>
                    <button
                        onClick={handleClose}
                        disabled={step === "analyzing" || step === "saving"}
                        aria-label="סגור"
                        className="p-2 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto relative p-4 flex flex-col">
                    {step === "upload" && (
                        <div className="flex flex-col items-center justify-center h-full text-center px-4 animate-in fade-in zoom-in duration-300">
                            <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mb-6 shadow-inner border-2 border-indigo-100">
                                <FileText className="w-10 h-10 text-indigo-500" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-800 mb-2">{t("upload_receipt")}</h3>
                            <p className="text-slate-500 mb-8 max-w-[260px]">
                                {t("upload_receipt_desc")}
                            </p>

                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                ref={fileInputRef}
                                onChange={handleFileSelect}
                            />

                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white px-6 py-4 rounded-2xl font-bold shadow-lg shadow-indigo-200 transition-all active:scale-[0.98] flex items-center justify-center gap-3 text-lg"
                            >
                                <Upload className="w-6 h-6" />
                                {t("choose_image")}
                            </button>
                        </div>
                    )}

                    {step === "analyzing" && (
                        <div className="flex flex-col items-center justify-center h-full text-center px-4 animate-in fade-in duration-300">
                            <div className="relative mb-8">
                                <div className="w-32 h-32 rounded-full border-4 border-indigo-100 flex items-center justify-center overflow-hidden shadow-lg relative">
                                    {previewUrl ? (
                                        <img src={previewUrl} alt="Receipt Preview" className="w-full h-full object-cover opacity-50" />
                                    ) : (
                                        <FileText className="w-12 h-12 text-slate-300" />
                                    )}
                                    <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-500 shadow-[0_0_15px_3px_rgba(99,102,241,0.8)] animate-scan z-10"></div>
                                </div>
                                <div className="absolute inset-[-4px] border-t-4 border-indigo-600 rounded-full animate-spin"></div>
                                <div className="absolute inset-[-12px] border-r-4 border-violet-400 opacity-60 rounded-full animate-[spin_2s_infinite_ease-in-out_reverse]"></div>
                            </div>

                            <h3 className="text-xl font-bold text-slate-800 mb-2">{t("analyzing_ai")}</h3>
                            <p className="text-slate-500 animate-pulse">
                                {t("analyzing_desc")}
                            </p>
                        </div>
                    )}

                    {step === "review" && (
                        <div className="flex flex-col h-full animate-in fade-in slide-in-from-right duration-300">
                            <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 mb-4 flex items-start gap-3 shrink-0">
                                <CheckCircle2 className="w-6 h-6 text-indigo-600 shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="font-bold text-slate-800">{t("analysis_complete")}</h4>
                                    <p className="text-sm text-slate-600 mt-1">
                                        {t("analysis_complete_desc").replace("{count}", detectedItems.length.toString())}
                                    </p>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto space-y-3 pb-6">
                                {detectedItems.length === 0 ? (
                                    <div className="text-center py-12 text-slate-400">לא זוהו מוצרים בקבלה</div>
                                ) : (
                                    detectedItems.map(item => (
                                        <div key={item.id} className="bg-white border border-slate-100 shadow-sm rounded-2xl p-3 flex flex-col gap-3">
                                            <div className="flex justify-between items-start">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-xl shrink-0">
                                                        {item.emoji || "📦"}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-slate-800 line-clamp-1 break-all">{item.name}</div>
                                                        <div className="text-xs text-slate-400">{getCategoryLabel(item.category || "")}</div>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => removeItem(item.id)}
                                                    className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>

                                            <div className="flex items-center justify-between border-t border-slate-50 pt-2 mt-1">
                                                <span className="text-sm text-slate-500 font-medium whitespace-pre">{t("quantity")} ({item.unit})</span>
                                                <div className="flex items-center gap-3 bg-slate-50 rounded-xl px-2 py-1 border border-slate-100">
                                                    <button
                                                        onClick={() => updateQuantity(item.id, -1)}
                                                        className="w-7 h-7 bg-white rounded-lg flex items-center justify-center text-slate-600 shadow-sm disabled:opacity-50"
                                                        disabled={item.quantity <= 1}
                                                    >
                                                        <Minus className="w-3 h-3" />
                                                    </button>
                                                    <span className="w-6 text-center font-bold text-slate-800 text-sm">
                                                        {item.quantity}
                                                    </span>
                                                    <button
                                                        onClick={() => updateQuantity(item.id, 1)}
                                                        className="w-7 h-7 bg-white rounded-lg flex items-center justify-center text-indigo-600 shadow-sm"
                                                    >
                                                        <Plus className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                            <div className="mt-auto shrink-0 pt-2 bg-slate-50">
                                <button
                                    onClick={handleSaveToInventory}
                                    disabled={detectedItems.length === 0}
                                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:opacity-90 disabled:opacity-50 text-white px-6 py-4 rounded-2xl font-bold shadow-lg shadow-emerald-200 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                                >
                                    <ArrowRight className="w-5 h-5 rotate-180" />
                                    <span>{t("save_to_inventory").replace("{count}", detectedItems.length.toString())}</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {step === "saving" && (
                        <div className="flex flex-col items-center justify-center h-full text-center px-4">
                            <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin mb-4"></div>
                            <h3 className="text-xl font-bold text-slate-800">{t("saving_to_inventory")}</h3>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X, Package, Plus, Sparkles } from "lucide-react";
// Removed framer-motion imports
import Image from "next/image";
import { getCategoryLabel } from "@/lib/localization";
import { useLanguage } from "@/components/LanguageProvider";

interface ProductOption {
    id: string;
    name: string;
    category: string;
    emoji?: string;
    image?: string;
    remoteImage?: string;
    manufacturer?: string;
    brand?: string;
}

interface ProductSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (product: { name: string; emoji?: string; category?: string; remoteImage?: string; manufacturer?: string; brand?: string; }) => void;
    title?: string;
}

export function ProductSearchModal({ isOpen, onClose, onSelect, title }: ProductSearchModalProps) {
    const { t } = useLanguage();
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<ProductOption[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Focus input on open
    useEffect(() => {
        if (isOpen) {
            setQuery("");
            setResults([]);
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    // Debounced Search
    useEffect(() => {
        if (query.trim().length < 2) {
            setResults([]);
            return;
        }

        const fetchResults = async () => {
            setIsLoading(true);
            try {
                const res = await fetch(`/api/gateway/lookup?q=${encodeURIComponent(query)}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.success && Array.isArray(data.products)) {
                        setResults(data.products.slice(0, 15));
                    } else {
                        setResults([]);
                    }
                }
            } catch (err) {
                console.error("Search error:", err);
            } finally {
                setIsLoading(false);
            }
        };

        const timer = setTimeout(fetchResults, 300);
        return () => clearTimeout(timer);
    }, [query]);

    // Handle Manual Add - also saves to global DB and classifies via AI
    const handleManualAdd = async () => {
        if (!query.trim()) return;
        const productName = query.trim();
        // Start with defaults but immediately close modal for fast UX
        const defaultData = { name: productName, category: "כללי", emoji: "🛒" };
        onSelect(defaultData);
        onClose();

        // AI classify in the background (fire and forget — improves future lookups)
        try {
            const classifyRes = await fetch('/api/gateway/ai/classify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: productName })
            });
            const classifyData = await classifyRes.json();
            if (classifyData.success && classifyData.category) {
                // Save to global DB with AI-classified data
                fetch('/api/gateway/lookup', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: productName,
                        category: classifyData.category,
                        emoji: classifyData.emoji || "📦"
                    })
                });
            }
        } catch (e) {
            // Fire and forget — save with defaults
            fetch('/api/gateway/lookup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(defaultData)
            });
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-300"
            onClick={onClose}
        >
            <div
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
                onClick={onClose}
            />

            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="search-modal-title"
                className="relative bg-white/95 backdrop-blur-2xl w-full max-w-lg sm:rounded-[40px] rounded-t-[40px] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-6 flex items-center justify-between border-b border-gray-100/50 shrink-0 bg-gradient-to-r from-emerald-50 to-cyan-50/30">
                    <div className="flex flex-col">
                        <h2 id="search-modal-title" className="text-xl font-black text-slate-800 flex items-center gap-2">
                            <Plus className="w-6 h-6 text-emerald-600" />
                            {t("new_inventory_item")}
                        </h2>
                        <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest mt-0.5">חיפוש מוצרים חכם</p>
                    </div>
                    <button
                        onClick={onClose}
                        aria-label="סגור"
                        className="w-10 h-10 bg-white/80 text-gray-400 rounded-2xl flex items-center justify-center hover:bg-white hover:text-gray-600 transition-all shadow-sm border border-slate-100"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Search Input */}
                <div className="p-5 bg-white shrink-0 z-10 relative">
                    <div className="relative group">
                        <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder={t("search_placeholder_global")}
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="w-full pl-4 pr-12 py-4 rounded-[22px] bg-slate-50 border border-slate-100 focus:bg-white focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10 transition-all font-bold text-lg shadow-inner outline-none"
                        />
                        {query && (
                            <button
                                onClick={() => setQuery("")}
                                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Results Area */}
                <div className="flex-1 overflow-y-auto p-4 pb-24 no-scrollbar">
                    {isLoading && (
                        <div className="flex flex-col items-center justify-center py-12 gap-4">
                            <div className="w-10 h-10 rounded-2xl border-4 border-emerald-100 border-t-emerald-600 animate-spin shadow-sm"></div>
                            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest animate-pulse">מחפש במאגר...</p>
                        </div>
                    )}

                    {!isLoading && results.length > 0 && (
                        <div className="space-y-3">
                            {results.map((product, idx) => (
                                <button
                                    key={product.id}
                                    onClick={() => {
                                        onSelect(product);
                                        onClose();
                                    }}
                                    className="w-full bg-white p-4 rounded-[28px] flex items-center gap-4 hover:shadow-lg hover:shadow-emerald-500/5 active:scale-[0.98] transition-all border border-slate-100 hover:border-emerald-200 group relative overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                                    style={{ animationDelay: `${idx * 30}ms` }}
                                >
                                    <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100 overflow-hidden relative shadow-inner">
                                        {product.remoteImage || product.image ? (
                                            <Image
                                                src={product.remoteImage || product.image || ""}
                                                alt={product.name}
                                                fill
                                                sizes="56px"
                                                className="object-contain p-1.5 transition-transform group-hover:scale-110"
                                            />
                                        ) : (
                                            <span className="text-3xl" aria-hidden="true">{product.emoji || "📦"}</span>
                                        )}
                                    </div>
                                    <div className="flex-1 text-right min-w-0">
                                        <h3 className="font-black text-slate-800 text-sm group-hover:text-emerald-700 transition-colors truncate">
                                            {product.name}
                                        </h3>
                                        <div className="flex flex-wrap gap-1.5 mt-1">
                                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-100/50">
                                                {getCategoryLabel(product.category)}
                                            </span>
                                            {product.brand && (
                                                <span className="text-[10px] font-bold text-slate-400">
                                                    {product.brand}
                                                </span>
                                            )}
                                            {product.manufacturer && (
                                                <span className="text-[10px] font-medium text-slate-300">
                                                    • {product.manufacturer}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="w-8 h-8 flex items-center justify-center text-emerald-600 bg-emerald-50 rounded-xl opacity-0 group-hover:opacity-100 transition-all border border-emerald-100 shadow-sm translate-x-4 group-hover:translate-x-0">
                                        <Plus className="w-5 h-5" strokeWidth={3} />
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    {!isLoading && query.length >= 2 && results.length === 0 && (
                        <div className="text-center py-12 px-6 bg-slate-50/50 rounded-[32px] border border-dashed border-slate-200">
                            <div className="w-16 h-16 bg-white text-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-sm border border-slate-100">
                                <Sparkles className="w-8 h-8" />
                            </div>
                            <h3 className="text-lg font-black text-slate-800 mb-1">{t("no_results")}</h3>
                            <p className="text-slate-500 text-xs font-medium">
                                {t("add_manually").replace("{name}", query)}
                            </p>
                        </div>
                    )}

                    {!query && (
                        <div className="text-center py-16 px-6 opacity-40">
                            <Package className="w-20 h-20 text-slate-300 mx-auto mb-4 stroke-[1.5]" />
                            <p className="text-slate-500 text-xs font-black uppercase tracking-widest">{t("start_typing_search")}</p>
                        </div>
                    )}
                </div>

                {/* Sticky Add Button */}
                {query.trim().length >= 2 && (
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-md border-t border-slate-100">
                        <button
                            onClick={handleManualAdd}
                            className="w-full bg-gradient-to-tr from-emerald-600 via-emerald-500 to-cyan-500 text-white p-4 rounded-[24px] font-black text-sm flex items-center justify-center gap-3 active:scale-[0.98] transition-all shadow-xl shadow-emerald-200 relative overflow-hidden group animate-in slide-in-from-bottom-4 duration-300"
                        >
                            <div className="absolute inset-0 bg-white/20 translate-x-full group-hover:translate-x-[-100%] transition-transform duration-1000 skew-x-[-20deg]" />
                            <Plus className="w-5 h-5" strokeWidth={3} />
                            <span className="uppercase tracking-widest">{t("add_manually").replace("{name}", query.trim())}</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

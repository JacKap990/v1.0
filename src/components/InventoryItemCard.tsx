"use client";

import { motion } from "framer-motion";
import { Package, Calendar, Tag, ShieldCheck, Factory, Beaker, Clock, Sparkles, Plus } from "lucide-react";
import { parseUnit, formatQuantity, ensureNormalizedDisplay } from "@/lib/unitConversion";
import { getCategoryLabel } from "@/lib/localization";
import { estimatePercentage, getStatusColor, getStatusText } from "@/lib/consumption";
import { useLanguage } from "@/components/LanguageProvider";
import { predictDaysRemaining, getUrgencyScore } from "@/lib/aiConsumptionEngine";

interface InventoryItem {
    id: string;
    name: string;
    quantity: number;
    unit: string;
    category?: string | null;
    manufacturer?: string | null;
    brand?: string | null;
    kosher?: string | null;
    expiryDate?: Date | string | null;
    updatedAt: Date | string;
    consumptionRate?: number;
    minQuantity?: number | null;
    emoji?: string | null;
    imageUrl?: string | null;
}

interface Props {
    item: InventoryItem;
    onEdit?: (item: any) => void;
    onQuantityClick?: (item: any) => void;
    showStatus?: boolean;
    isChecked?: boolean;
}

export function InventoryItemCard({ item, onEdit, onQuantityClick, showStatus = true, isChecked = false }: Props) {
    const { t, language } = useLanguage();
    const percentage = estimatePercentage(item.updatedAt, item.quantity, item.consumptionRate || 7, item.minQuantity || 1);
    const statusColor = getStatusColor(percentage);
    const statusText = getStatusText(percentage, language);

    // Use Advanced Normalization for display
    const { qty: displayQty, label: displayUnit } = ensureNormalizedDisplay(item.name, item.quantity, item.unit);

    const daysRemaining = predictDaysRemaining({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        updatedAt: item.updatedAt,
        consumptionRate: item.consumptionRate,
        minQuantity: item.minQuantity || 1
    });

    return (
        <motion.div
            layout
            onClick={() => onEdit?.(item)}
            className={`group relative bg-white border border-slate-200/80 rounded-[24px] p-4 flex flex-col gap-3 hover:shadow-xl hover:border-indigo-400/30 transition-all cursor-pointer overflow-hidden mb-1 ${isChecked ? 'opacity-60 bg-slate-50/50' : ''}`}
        >
            {/* Header Area: Icon + Name + Category */}
            <div className="flex items-start gap-3">
                {/* Visual Area */}
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 border transition-colors shadow-inner overflow-hidden ${isChecked ? 'bg-slate-100 border-slate-200' : 'bg-slate-50 border-slate-100 group-hover:bg-indigo-50/50'}`}>
                    {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className={`w-full h-full object-contain p-1.5 transition-transform group-hover:scale-110 ${isChecked ? 'grayscale' : ''}`} />
                    ) : item.emoji ? (
                        <span className={`text-2xl drop-shadow-sm transition-all ${isChecked ? 'grayscale' : ''}`}>{item.emoji}</span>
                    ) : (
                        <Package className="w-5 h-5 text-slate-300" />
                    )}
                </div>

                {/* Name and Tags */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider ${isChecked ? 'bg-slate-200 text-slate-400' : 'text-indigo-600 bg-indigo-50'}`}>
                            {getCategoryLabel(item.category)}
                        </span>
                        {!isChecked && daysRemaining > 0 && (
                            <span className="flex items-center gap-1 text-[9px] font-black text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded-md">
                                <Sparkles className="w-2.5 h-2.5" />
                                {daysRemaining} ימים
                            </span>
                        )}
                    </div>
                    <h3 className={`font-black text-slate-800 text-base leading-tight transition-all truncate ${isChecked ? 'text-slate-400 line-through' : 'group-hover:text-indigo-800'}`}>
                        {item.name}
                    </h3>
                    {(item.brand || item.manufacturer) && (
                        <p className="text-[10px] font-bold text-slate-400 truncate mt-0.5">
                            {item.brand}{item.brand && item.manufacturer ? ' • ' : ''}{item.manufacturer}
                        </p>
                    )}
                </div>

                {/* Actionable Quantity Box (Pinned Right in RTL usually, but here fixed for symmetry) */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onQuantityClick?.(item);
                    }}
                    disabled={isChecked}
                    className={`flex flex-col items-center justify-center w-14 h-14 rounded-2xl border shrink-0 transition-all relative group/qty ${isChecked ? 'bg-slate-100 border-slate-200 text-slate-400' : 'bg-slate-900 border-slate-800 text-white shadow-[0_4px_12px_rgba(0,0,0,0.1)] active:scale-95 hover:border-indigo-500'}`}
                >
                    <span className="text-[17px] font-black leading-none">{formatQuantity(displayQty, item.unit)}</span>
                    <span className="text-[9px] font-bold opacity-70 uppercase tracking-tighter mt-1">{displayUnit}</span>

                    {!isChecked && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-indigo-600 rounded-lg flex items-center justify-center border-2 border-white shadow-sm scale-0 group-hover/qty:scale-100 transition-transform">
                            <Plus className="w-3 h-3 text-white" strokeWidth={4} />
                        </div>
                    )}
                </button>
            </div>

            {/* Middle Row: Meta Details (Kosher, etc.) */}
            {!isChecked && item.kosher && (
                <div className="flex gap-2">
                    <div className="flex items-center gap-1 px-2 py-1 bg-emerald-50 rounded-lg text-[10px] font-black text-emerald-600 border border-emerald-100/30">
                        <ShieldCheck className="w-3 h-3" />
                        <span>{item.kosher}</span>
                    </div>
                </div>
            )}

            {/* Bottom Row: Status Bar */}
            {showStatus && !isChecked && (
                <div className="mt-1 pt-3 border-t border-slate-50">
                    <div className="flex justify-between items-center mb-1.5 px-0.5">
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${daysRemaining <= 2 ? 'bg-rose-500 animate-ping' :
                                statusColor === 'rose' ? 'bg-rose-500 animate-pulse' :
                                    statusColor === 'amber' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                            <span className={`text-[10px] font-black tracking-wider uppercase ${daysRemaining <= 2 ? 'text-rose-600' : 'text-slate-500'}`}>
                                {daysRemaining <= 2 ? 'דחוף' : statusText}
                            </span>
                        </div>
                        <span className={`text-[10px] font-black ${statusColor === 'rose' || daysRemaining <= 2 ? 'text-rose-500' :
                            statusColor === 'amber' ? 'text-amber-600' : 'text-emerald-600'}`}>
                            {percentage}%
                        </span>
                    </div>

                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden relative shadow-inner">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ duration: 1.2, ease: "easeOut" }}
                            className={`h-full rounded-full ${daysRemaining <= 2 ? 'bg-gradient-to-r from-rose-500 to-rose-700' :
                                statusColor === 'rose' ? 'bg-gradient-to-r from-rose-400 to-rose-600' :
                                    statusColor === 'amber' ? 'bg-gradient-to-r from-amber-400 to-amber-500' :
                                        'bg-gradient-to-r from-emerald-400 to-emerald-500'
                                }`}
                        />
                    </div>
                </div>
            )}

            {/* Expiry Badge */}
            {item.expiryDate && !isChecked && (
                <div className={`absolute top-0 right-0 px-3 py-1 rounded-bl-2xl border-l border-b text-[9px] font-black flex items-center gap-1.5 ${new Date(item.expiryDate) < new Date()
                    ? 'bg-rose-500 border-rose-600 text-white'
                    : 'bg-slate-50 border-slate-100 text-slate-400'
                    }`}>
                    <Clock className="w-3 h-3" />
                    {new Date(item.expiryDate) < new Date() ? 'expired'.toUpperCase() : new Date(item.expiryDate).toLocaleDateString('he-IL')}
                </div>
            )}
        </motion.div>
    );
}

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
            className={`group relative bg-white border border-slate-200/80 rounded-[28px] p-4 flex flex-col gap-3 hover:shadow-xl hover:border-indigo-400/30 transition-all cursor-pointer overflow-hidden mb-1 ${isChecked ? 'opacity-60 bg-slate-50/50' : ''}`}
        >
            {/* Horizontal Layout Container */}
            <div className="flex items-start gap-4">
                {/* Visual Area */}
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 border transition-colors shadow-inner overflow-hidden ${isChecked ? 'bg-slate-100 border-slate-200' : 'bg-slate-50 border-slate-100 group-hover:bg-indigo-50/50'}`}>
                    {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className={`w-full h-full object-contain p-1.5 transition-transform group-hover:scale-110 ${isChecked ? 'grayscale' : ''}`} />
                    ) : item.emoji ? (
                        <span className={`text-2xl drop-shadow-sm transition-all ${isChecked ? 'grayscale' : ''}`}>{item.emoji}</span>
                    ) : (
                        <Package className="w-6 h-6 text-slate-300" />
                    )}
                </div>

                {/* Content Area */}
                <div className="flex-1 min-w-0 flex flex-col gap-1">
                    {/* Tags Row */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider ${isChecked ? 'bg-slate-200 text-slate-400' : 'text-indigo-600 bg-indigo-50'}`}>
                            {getCategoryLabel(item.category)}
                        </span>
                        {!isChecked && daysRemaining > 0 && (
                            <span className="flex items-center gap-1 text-[8px] font-black text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded-md border border-violet-100/50">
                                <Sparkles className="w-2 h-2" />
                                {daysRemaining} ימים
                            </span>
                        )}
                        {item.brand && (
                            <span className="text-[9px] font-bold text-slate-400 truncate max-w-[80px]">
                                • {item.brand}
                            </span>
                        )}
                    </div>

                    {/* Product Name */}
                    <h3 className={`font-black text-slate-800 text-[15px] leading-tight transition-all ${isChecked ? 'text-slate-400 line-through' : 'group-hover:text-indigo-800'}`}>
                        {item.name}
                    </h3>

                    {/* Metadata Detail Chips */}
                    {!isChecked && (item.brand || item.manufacturer || item.kosher) && (
                        <div className="flex flex-wrap gap-1.5 mt-0.5">
                            {item.manufacturer && (
                                <div className="flex items-center gap-1 px-1.5 py-0.5 bg-slate-50 rounded-lg text-[9px] font-bold text-slate-500 border border-slate-100/50">
                                    <Factory className="w-2.5 h-2.5 opacity-50" />
                                    <span className="truncate max-w-[60px]">{item.manufacturer}</span>
                                </div>
                            )}
                            {item.kosher && (
                                <div className="flex items-center gap-1 px-1.5 py-0.5 bg-emerald-50 rounded-lg text-[9px] font-black text-emerald-600 border border-emerald-100/30">
                                    <ShieldCheck className="w-2.5 h-2.5" />
                                    <span>{item.kosher}</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Quantity Box - Pinned Left (for Hebrew/RTL) */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onQuantityClick?.(item);
                    }}
                    disabled={isChecked}
                    className={`flex flex-col items-center justify-center w-14 h-12 rounded-2xl border shrink-0 transition-all relative group/qty ${isChecked ? 'bg-slate-100 border-slate-200 text-slate-400' : 'bg-slate-900 border-slate-800 text-white shadow-lg active:scale-95 hover:border-indigo-500'}`}
                >
                    <span className="text-sm font-black leading-none">{formatQuantity(displayQty, item.unit)}</span>
                    <span className="text-[8px] font-bold opacity-60 uppercase tracking-tighter mt-0.5">{displayUnit}</span>

                    {/* Quick Access Visual Cue */}
                    {!isChecked && (
                        <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-indigo-600 rounded-lg flex items-center justify-center border-2 border-white shadow-sm scale-0 group-hover/qty:scale-100 transition-transform">
                            <Plus className="w-3 h-3 text-white" strokeWidth={3} />
                        </div>
                    )}
                </button>
            </div>

            {/* Bottom Row: Status Bar */}
            {showStatus && !isChecked && (
                <div className="border-t border-slate-50 pt-3">
                    <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center gap-1.5 text-right w-full justify-between">
                            <div className="flex items-center gap-2">
                                <div className={`w-1.5 h-1.5 rounded-full ${daysRemaining <= 2 ? 'bg-rose-500 animate-ping' :
                                    statusColor === 'rose' ? 'bg-rose-500 animate-pulse' :
                                        statusColor === 'amber' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                                <span className={`text-[9px] font-black tracking-wider ${daysRemaining <= 2 ? 'text-rose-600' : 'text-slate-400'}`}>
                                    {daysRemaining <= 2 ? 'דחוף' : statusText.toUpperCase()}
                                </span>
                            </div>
                            <span className={`text-[9px] font-black ${statusColor === 'rose' || daysRemaining <= 2 ? 'text-rose-500' :
                                statusColor === 'amber' ? 'text-amber-600' : 'text-emerald-600'}`}>
                                {percentage}%
                            </span>
                        </div>
                    </div>

                    <div className="h-1.5 w-full bg-slate-50 rounded-full border border-slate-100 overflow-hidden relative shadow-inner">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ duration: 1 }}
                            className={`h-full rounded-full ${daysRemaining <= 2 ? 'bg-gradient-to-r from-rose-500 to-rose-700' :
                                statusColor === 'rose' ? 'bg-gradient-to-r from-rose-400 to-rose-600' :
                                    statusColor === 'amber' ? 'bg-gradient-to-r from-amber-400 to-amber-500' :
                                        'bg-gradient-to-r from-emerald-400 to-emerald-500'
                                }`}
                        />
                    </div>
                </div>
            )}

            {/* Expiry Badge - Static positioning at top left of card (RTL) */}
            {item.expiryDate && !isChecked && (
                <div className={`absolute top-0 left-0 px-3 py-1 rounded-br-xl border-b border-r text-[8px] font-black flex items-center gap-1 ${new Date(item.expiryDate) < new Date()
                    ? 'bg-rose-500 border-rose-600 text-white'
                    : 'bg-slate-50 border-slate-100 text-slate-400'
                    }`}>
                    <Clock className="w-2.5 h-2.5" />
                    {new Date(item.expiryDate) < new Date() ? 'expired' : new Date(item.expiryDate).toLocaleDateString()}
                </div>
            )}
        </motion.div>
    );
}

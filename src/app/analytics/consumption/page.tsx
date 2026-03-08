"use client";


import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { GlassCard } from "@/components/ui/GlassCard";
import {
    BarChart3,
    TrendingDown,
    TrendingUp,
    Package,
    Calendar,
    ChevronLeft,
    PieChart,
    Activity,
    AlertCircle
} from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { getInventory } from "@/app/actions/inventory";
import { estimatePercentage, getStatusColor } from "@/lib/consumption";
import { useLanguage } from "@/components/LanguageProvider";

export default function ConsumptionAnalytics() {
    const { status } = useSession();
    const { t } = useLanguage();
    const router = useRouter();
    const [inventory, setInventory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (status === "authenticated") {
            loadData();
        }
    }, [status]);

    const loadData = async () => {
        setLoading(true);
        const data = await getInventory();
        setInventory(data);
        setLoading(false);
    };

    if (status === "loading" || loading) {
        return (
            <div className="flex items-center justify-center p-12 h-[80vh]">
                <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-2xl animate-spin" />
            </div>
        );
    }

    // Process Analytics
    const lowStockCount = inventory.filter(i => estimatePercentage(i.updatedAt, i.quantity, i.consumptionRate || 7) < 20).length;
    const totalItems = inventory.length;

    // Group by category for chart
    const categoryStats = inventory.reduce((acc: any, item) => {
        const cat = item.category || "General";
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
    }, {});

    return (
        <div className="p-6 pb-32 max-w-2xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4 mb-2">
                <button
                    onClick={() => router.back()}
                    className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 active:scale-90 transition-all"
                >
                    <ChevronLeft className="w-5 h-5 text-slate-600" />
                </button>
                <div>
                    <h1 className="text-2xl font-black text-slate-800">ניתוח צריכה</h1>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">תובנות המזווה החכם שלך</p>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
                <GlassCard className="p-4 border-l-4 border-l-indigo-500">
                    <div className="flex justify-between items-start mb-2">
                        <div className="p-2 bg-indigo-50 rounded-xl">
                            <Package className="w-5 h-5 text-indigo-600" />
                        </div>
                    </div>
                    <div className="text-2xl font-black text-slate-800">{totalItems}</div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">סך הכל מוצרים</div>
                </GlassCard>

                <GlassCard className="p-4 border-l-4 border-l-rose-500">
                    <div className="flex justify-between items-start mb-2">
                        <div className="p-2 bg-rose-50 rounded-xl">
                            <TrendingDown className="w-5 h-5 text-rose-600" />
                        </div>
                        {lowStockCount > 0 && (
                            <div className="bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full animate-pulse">
                                דחוף
                            </div>
                        )}
                    </div>
                    <div className="text-2xl font-black text-slate-800">{lowStockCount}</div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">מוצרים במלאי נמוך</div>
                </GlassCard>
            </div>

            {/* Usage Patterns Section */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 px-1">
                    <Activity className="w-5 h-5 text-indigo-500" />
                    <h2 className="font-black text-slate-800 text-sm uppercase tracking-wider">דפוסי שימוש</h2>
                </div>

                <GlassCard className="p-6">
                    <div className="space-y-6">
                        {inventory.slice(0, 5).map((item, idx) => {
                            const pct = estimatePercentage(item.updatedAt, item.quantity, item.consumptionRate || 7);
                            const color = getStatusColor(pct);

                            return (
                                <div key={item.id} className="space-y-2">
                                    <div className="flex justify-between items-end">
                                        <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                                            <span>{item.emoji || "📦"}</span>
                                            {item.name}
                                        </div>
                                        <span className={`text-[10px] font-black ${color === 'rose' ? 'text-rose-500' : color === 'amber' ? 'text-amber-600' : 'text-emerald-600'
                                            }`}>
                                            {pct}% נותר
                                        </span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${pct}%` }}
                                            className={`h-full rounded-full ${color === 'rose' ? 'bg-rose-500' : color === 'amber' ? 'bg-amber-500' : 'bg-emerald-500'
                                                }`}
                                        />
                                    </div>
                                    <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase">
                                        <span>קצב צריכה: {item.consumptionRate || 7} ימים</span>
                                        <span>עודכן לפני {Math.floor((new Date().getTime() - new Date(item.updatedAt).getTime()) / (1000 * 60 * 60 * 24))} ימים</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {inventory.length === 0 && (
                        <div className="text-center py-8">
                            <AlertCircle className="w-12 h-12 text-slate-200 mx-auto mb-2" />
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">אין נתונים להצגה</p>
                        </div>
                    )}
                </GlassCard>
            </div>

            {/* Prediction Card */}
            <GlassCard className="p-6 bg-gradient-to-br from-indigo-500 to-violet-600 text-white border-none shadow-xl shadow-indigo-200">
                <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-5 h-5 text-indigo-200" />
                    <h2 className="font-black text-sm uppercase tracking-widest">תובנות AI</h2>
                </div>
                <p className="text-sm font-medium leading-relaxed opacity-90">
                    מבוסס על היסטוריית הצריכה שלך, אנחנו ממליצים להוסיף
                    <span className="font-black mx-1 underline decoration-indigo-300 underline-offset-4">
                        {lowStockCount} מוצרים
                    </span>
                    לרשימת הקניות הקרובה כדי למנוע חוסרים.
                </p>
                <button
                    onClick={() => router.push('/lists')}
                    className="mt-6 w-full bg-white/20 hover:bg-white/30 backdrop-blur-md text-white py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 border border-white/30"
                >
                    צפה ברשימות
                </button>
            </GlassCard>
        </div>
    );
}

function Sparkles(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
            <path d="M5 3v4" />
            <path d="M19 17v4" />
            <path d="M3 5h4" />
            <path d="M17 19h4" />
        </svg>
    )
}

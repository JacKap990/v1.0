"use client";

import { useEffect, useState } from "react";
import { getAnalytics } from "@/app/actions/analytics";
import { getCategoryLabel } from "@/lib/localization";
import {
    BarChart3,
    TrendingDown,
    AlertTriangle,
    Calendar,
    Package,
    CheckCircle2,
    BrainCircuit,
    ArrowUpRight,
    Loader2
} from "lucide-react";
import { motion } from "framer-motion";

export default function AnalyticsPage() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            const res = await getAnalytics();
            if (res.success) setStats(res.data);
            setLoading(false);
        };
        load();
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
                <p className="text-slate-500 font-medium">מנתח את המזווה שלך...</p>
            </div>
        );
    }

    if (!stats || stats.totalItems === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-4">
                    <BarChart3 className="w-10 h-10" />
                </div>
                <h2 className="text-xl font-black text-slate-800">אין מספיק נתונים</h2>
                <p className="text-slate-500 mt-2">הוסיפו מוצרים למלאי כדי להתחיל לראות ניתוח צריכה ותחזיות AI.</p>
            </div>
        );
    }

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="p-6 space-y-8 pb-32 max-w-md mx-auto"
        >
            {/* Header */}
            <div>
                <h1 className="text-3xl font-black tracking-tight text-slate-900">ניתוח נתוני צריכה</h1>
                <p className="text-slate-500 font-medium">תובנות חכמות ותחזיות מלאי מבוססות AI</p>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
                <motion.div variants={item} className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-125" />
                    <Package className="w-6 h-6 text-indigo-600 mb-3 relative" />
                    <p className="text-2xl font-black text-slate-900 relative">{stats.totalItems}</p>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider relative">סה"כ מוצרים</p>
                </motion.div>

                <motion.div variants={item} className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-rose-50 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-125" />
                    <TrendingDown className="w-6 h-6 text-rose-500 mb-3 relative" />
                    <p className="text-2xl font-black text-slate-900 relative">{stats.lowStock}</p>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider relative">מלאי נמוך</p>
                </motion.div>

                <motion.div variants={item} className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-125" />
                    <AlertTriangle className="w-6 h-6 text-amber-500 mb-3 relative" />
                    <p className="text-2xl font-black text-slate-900 relative">{stats.expiringSoon}</p>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider relative">פג תוקף בקרוב</p>
                </motion.div>

                <motion.div variants={item} className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-125" />
                    <CheckCircle2 className="w-6 h-6 text-emerald-500 mb-3 relative" />
                    <p className="text-2xl font-black text-slate-900 relative">{Math.round((1 - stats.lowStock / stats.totalItems) * 100)}%</p>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider relative">בריאות המזווה</p>
                </motion.div>
            </div>

            {/* AI Predictions Section */}
            {stats.predictions && stats.predictions.length > 0 && (
                <motion.div variants={item} className="space-y-4">
                    <div className="flex items-center gap-2 px-1">
                        <BrainCircuit className="w-5 h-5 text-indigo-600" />
                        <h3 className="font-black text-lg text-slate-800">תחזיות AI</h3>
                    </div>
                    <div className="space-y-3">
                        {stats.predictions.map((p: any, idx: number) => (
                            <div key={idx} className="bg-gradient-to-r from-violet-600 to-indigo-600 p-4 rounded-3xl text-white shadow-lg shadow-indigo-100 flex items-center justify-between">
                                <div className="space-y-1">
                                    <h4 className="font-bold text-sm leading-none opacity-80 uppercase tracking-widest">{p.name}</h4>
                                    <p className="text-base font-black">{p.recommendation}</p>
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-black leading-none">{p.daysLeft}</div>
                                    <div className="text-[10px] uppercase font-bold tracking-tighter opacity-80">ימים נותרו</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Consumption Bars */}
            <motion.div variants={item} className="space-y-6">
                <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                        <TrendingDown className="w-5 h-5 text-indigo-600" />
                        <h3 className="font-black text-lg text-slate-800">מצב המלאי וקצב צריכה</h3>
                    </div>
                    <button
                        onClick={async () => {
                            setLoading(true);
                            const res = await fetch('/api/ai/analyze-consumption', { method: 'POST' });
                            window.location.reload();
                        }}
                        className="text-[10px] font-black uppercase tracking-widest bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-full hover:bg-indigo-100 transition-colors flex items-center gap-1"
                    >
                        <BrainCircuit className="w-3 h-3" />
                        לחשב מחדש
                    </button>
                </div>

                <div className="bg-white p-6 rounded-[40px] shadow-sm border border-slate-100 space-y-6">
                    {stats.items.slice(0, 5).map((i: any) => (
                        <div key={i.id} className="space-y-2">
                            <div className="flex justify-between items-end">
                                <span className="text-sm font-black text-slate-800">{i.name}</span>
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${i.percentage <= 20 ? "bg-rose-50 text-rose-500" :
                                    i.percentage <= 50 ? "bg-amber-50 text-amber-600" :
                                        "bg-emerald-50 text-emerald-600"
                                    }`}>
                                    {i.percentage}%
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold px-0.5">
                                <span>צריכה: {i.weeklyUsage} {i.unit}/שבוע</span>
                                <span>~ {i.monthlyUsage} לחודש</span>
                            </div>
                            <div
                                className="h-2.5 w-full bg-slate-50 rounded-full overflow-hidden"
                                role="progressbar"
                                aria-valuenow={i.percentage}
                                aria-valuemin={0}
                                aria-valuemax={100}
                                aria-label={`${i.name} - ${i.percentage}%`}
                            >
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${i.percentage}%` }}
                                    transition={{ duration: 1, ease: "easeOut" }}
                                    className={`h-full rounded-full ${i.percentage <= 20 ? "bg-gradient-to-r from-rose-400 to-rose-500" :
                                        i.percentage <= 50 ? "bg-gradient-to-r from-amber-400 to-amber-500" :
                                            "bg-gradient-to-r from-emerald-400 to-emerald-500"
                                        }`}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </motion.div>

            {/* Category Heatmap (Simplified) */}
            <motion.div variants={item} className="space-y-4">
                <div className="flex items-center gap-2 px-1">
                    <Calendar className="w-5 h-5 text-indigo-600" />
                    <h3 className="font-black text-lg text-slate-800">התפלגות קטגוריות</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                    {Object.entries(stats.categories).map(([cat, count]: [string, any]) => (
                        <div key={cat} className="bg-white border border-slate-100 px-4 py-3 rounded-2xl flex items-center gap-3 shadow-sm">
                            <div className="w-2 h-2 rounded-full bg-indigo-500" />
                            <span className="text-sm font-bold text-slate-600">{getCategoryLabel(cat)}</span>
                            <span className="text-xs font-black text-slate-900 bg-slate-100 px-2 py-1 rounded-lg">{count}</span>
                        </div>
                    ))}
                </div>
            </motion.div>
        </motion.div>
    );
}

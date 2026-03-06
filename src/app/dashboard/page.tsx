"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import {
    LayoutDashboard,
    ShoppingBag,
    Package,
    AlertTriangle,
    ChefHat,
    Sparkles,
    TrendingDown,
    Clock,
    Receipt,
    Plus,
    Activity,
    Heart
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getInventory } from "@/app/actions/inventory";
import { getShoppingLists } from "@/app/actions/lists";
import { getAnalytics } from "@/app/actions/analytics";
import { getSmartNotifications, SmartNotification } from "@/app/actions/notifications";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardSkeleton } from "@/components/ui/Skeletons";
import { useLanguage } from "@/components/LanguageProvider";
import { isRunningLow } from "@/lib/consumption";

export default function Dashboard() {
    const router = useRouter();
    const { t } = useLanguage();
    const { data: session, status } = useSession();
    const [stats, setStats] = useState<any>(null);
    const [notifications, setNotifications] = useState<SmartNotification[]>([]);
    const [loading, setLoading] = useState(true);
    const [quickInput, setQuickInput] = useState("");

    useEffect(() => {
        const load = async () => {
            const [inv, lists, analytics, smartNotes] = await Promise.all([
                getInventory(),
                getShoppingLists(),
                getAnalytics(),
                getSmartNotifications()
            ]);

            const runningLow = inv.filter(i => isRunningLow(i.updatedAt, i.quantity, (i as any).consumptionRate));

            setStats({
                inventoryCount: inv.length,
                expiringCount: inv.filter(i => {
                    if (!i.expiryDate) return false;
                    const days = Math.ceil((new Date(i.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                    return days >= 0 && days <= 3;
                }).length,
                runningLowCount: runningLow.length,
                pendingShopping: lists.reduce((acc: any, l: any) => acc + (l.totalCount - l.checkedCount), 0),
                health: inv.length === 0 ? 100 : Math.round((1 - (analytics.data?.lowStock || 0) / inv.length) * 100)
            });
            setNotifications(smartNotes);
            setLoading(false);
        };
        if (status === "authenticated") load();
    }, [status]);

    const handleQuickAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!quickInput.trim()) return;
        setQuickInput("");
        // Logic to add item to inventory via existing action with default values
        const { addInventoryItem } = await import("@/app/actions/inventory");
        const res = await addInventoryItem({
            name: quickInput.trim(),
            quantity: 1,
            unit: "יח'",
            category: "other"
        });
        if (res.success) {
            router.push("/inventory");
        }
    };

    if (status === "loading" || loading) {
        return <DashboardSkeleton />;
    }

    const userName = session?.user?.name || "חבר";

    return (
        <div className="p-6 space-y-8 pb-32 max-w-md mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 leading-tight">{t("hello")}, {userName}</h1>
                    <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mt-1">{t("dashboard_welcome")}</p>
                </div>
                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 border border-indigo-100">
                    <Heart className="w-6 h-6 fill-indigo-600" />
                </div>
            </div>

            {/* Health Score Card - Premium Home Gauge */}
            <GlassCard className="!bg-gradient-to-br from-indigo-700 via-violet-700 to-slate-900 text-white p-8 border-none shadow-2xl shadow-indigo-200/50 overflow-hidden relative min-h-[180px] flex flex-col justify-center rounded-[40px]">
                <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/5 rounded-full blur-3xl animate-pulse" />
                <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-2xl" />

                <div className="relative z-10 flex items-center justify-between gap-6">
                    <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2 opacity-80">
                            <Activity className="w-3 h-3" />
                            <p className="text-[10px] font-black uppercase tracking-widest">{t("pantryHealth")}</p>
                        </div>
                        <h2 className="text-5xl font-black tracking-tighter drop-shadow-sm">{stats.health}%</h2>
                        <p className="text-xs font-bold text-indigo-100 max-w-[150px] leading-relaxed">{t("pantry_health_desc")}</p>
                    </div>

                    <div className="w-24 h-24 relative flex items-center justify-center shrink-0">
                        {/* Background Glow */}
                        <div className="absolute inset-0 bg-white/10 rounded-full blur-xl scale-75" />

                        <svg className="w-full h-full transform -rotate-90 filter drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">
                            <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-white/10" />
                            <motion.circle
                                initial={{ strokeDashoffset: 251 }}
                                animate={{ strokeDashoffset: 251 - (251 * (Number(stats?.health) || 0)) / 100 }}
                                transition={{ duration: 1.5, ease: "easeOut" }}
                                cx="48"
                                cy="48"
                                r="40"
                                stroke="currentColor"
                                strokeWidth="8"
                                fill="transparent"
                                strokeDasharray="251"
                                className="text-white"
                                strokeLinecap="round"
                            />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="bg-white/20 p-2 rounded-2xl backdrop-blur-sm border border-white/20">
                                <Sparkles className="w-6 h-6 text-white" />
                            </div>
                        </div>
                    </div>
                </div>
            </GlassCard>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-2 gap-4">
                <button onClick={() => router.push("/scan")} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center gap-3 active:scale-95 transition-all text-slate-800 hover:border-indigo-200 group">
                    <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                        <Plus className="w-6 h-6" />
                    </div>
                    <span className="font-black text-xs">{t("addManual")}</span>
                </button>
                <button onClick={() => router.push("/scan-receipt")} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center gap-3 active:scale-95 transition-all text-slate-800 hover:border-violet-200 group">
                    <div className="w-12 h-12 bg-violet-50 rounded-2xl flex items-center justify-center text-violet-600 group-hover:bg-violet-600 group-hover:text-white transition-colors">
                        <Receipt className="w-6 h-6" />
                    </div>
                    <span className="font-black text-xs">{t("scanReceipt")}</span>
                </button>
            </div>

            {/* Quick Entry Bar */}
            <form onSubmit={handleQuickAdd} className="relative group">
                <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                    <Plus className="w-5 h-5 text-indigo-400 group-focus-within:text-indigo-600 transition-colors" />
                </div>
                <input
                    type="text"
                    value={quickInput}
                    onChange={(e) => setQuickInput(e.target.value)}
                    placeholder="הוספה מהירה למלאי..."
                    className="w-full bg-white border border-slate-200 rounded-3xl py-4 pr-12 pl-4 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 transition-all shadow-sm font-bold text-sm"
                />
            </form>

            {/* Smart Notifications / Actionable Alerts */}
            <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                    <h3 className="font-black text-slate-800 text-sm">{t("statusSummary")}</h3>
                    <Sparkles className="w-4 h-4 text-indigo-500 animate-pulse" />
                </div>

                <div className="space-y-3">
                    <AnimatePresence mode="popLayout">
                        {notifications.length > 0 ? (
                            notifications.map((note) => (
                                <motion.div
                                    layout
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    key={note.id}
                                    className={`p-4 rounded-[32px] border flex flex-col gap-3 transition-all ${note.severity === 'high'
                                        ? 'bg-rose-50 border-rose-100'
                                        : note.severity === 'medium'
                                            ? 'bg-amber-50 border-amber-100'
                                            : 'bg-indigo-50 border-indigo-100'
                                        }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-2xl shadow-sm flex items-center justify-center ${note.severity === 'high' ? 'bg-white text-rose-500' :
                                            note.severity === 'medium' ? 'bg-white text-amber-500' : 'bg-white text-indigo-500'
                                            }`}>
                                            {note.type === 'expiry' ? <Clock className="w-5 h-5" /> :
                                                note.type === 'low_stock' ? <TrendingDown className="w-5 h-5" /> : <ChefHat className="w-5 h-5" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-black text-slate-800 text-sm truncate">{note.title}</p>
                                            <p className="text-[10px] text-slate-600 font-bold leading-tight line-clamp-2">{note.message}</p>
                                        </div>
                                    </div>
                                    <div className="flex justify-end pr-1">
                                        <Link href={note.actionUrl || "#"} className={`text-[10px] font-black px-4 py-2 rounded-full shadow-sm transition-all hover:scale-105 active:scale-95 ${note.severity === 'high' ? 'bg-rose-500 text-white' :
                                            note.severity === 'medium' ? 'bg-amber-500 text-white' : 'bg-indigo-600 text-white'
                                            }`}>
                                            {note.actionLabel || t("handle")}
                                        </Link>
                                    </div>
                                </motion.div>
                            ))
                        ) : (
                            /* Fallback items if no smart notes */
                            <>
                                <div className="bg-slate-50 border border-slate-100 p-4 rounded-3xl flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-indigo-600">
                                            <ShoppingBag className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="font-black text-slate-800 text-sm">{t("shoppingList")}</p>
                                            <p className="text-[10px] text-slate-500 font-bold">{stats.pendingShopping} {t("itemsToRestock")}</p>
                                        </div>
                                    </div>
                                    <Link href="/lists" className="text-[10px] font-black text-indigo-600 bg-white px-3 py-1.5 rounded-full shadow-sm">{t("view")}</Link>
                                </div>
                                <div className="bg-slate-50/50 p-8 rounded-[40px] border border-dashed border-slate-200 text-center">
                                    <Heart className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                                    <p className="text-xs font-bold text-slate-400">המזווה במצב מצוין! אין התראות דחופות.</p>
                                </div>
                            </>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* AI Call to Action */}
            <div className="bg-indigo-50/50 border border-indigo-100 rounded-[40px] p-6 flex items-center gap-6 relative overflow-hidden group">
                <div className="absolute right-0 bottom-0 pointer-events-none opacity-20 transform translate-x-4 translate-y-4 transition-transform group-hover:scale-110">
                    <Sparkles className="w-32 h-32 text-indigo-300" />
                </div>
                <div className="relative z-10 flex-1">
                    <h4 className="font-black text-indigo-900 text-lg">{t("aiAssistant")}</h4>
                    <p className="text-indigo-700 text-xs font-bold mt-1 leading-relaxed">
                        {t("ai_chat_desc")}
                    </p>
                    <button onClick={() => window.dispatchEvent(new CustomEvent("open-ai-chat"))} className="mt-4 text-xs font-black bg-indigo-600 text-white px-6 py-2.5 rounded-full shadow-lg shadow-indigo-200">
                        {t("startConversation")}
                    </button>
                </div>
            </div>
        </div>
    );
}

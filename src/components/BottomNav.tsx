"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ListTodo, CheckSquare, ScanBarcode, Settings, ChefHat, BarChart3, LayoutDashboard } from "lucide-react";
import { useState, useEffect } from "react";
import { useLanguage } from "@/components/LanguageProvider";

export function BottomNav() {
    const pathname = usePathname();
    const router = useRouter();
    const { t } = useLanguage();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    // Hidden on Auth screens
    if (pathname === "/login" || pathname === "/register") {
        return null;
    }

    const items = [
        { label: t("dashboard"), icon: LayoutDashboard, href: "/" },
        { label: t("shoppingList"), icon: CheckSquare, href: "/lists" },
        { label: t("inventory"), icon: ListTodo, href: "/inventory" },
        { label: t("recipes"), icon: ChefHat, href: "/recipes" },
        { label: t("analytics"), icon: BarChart3, href: "/analytics" },
        { label: t("settings"), icon: Settings, href: "/settings" },
    ];

    return (
        <div className="fixed bottom-4 left-0 right-0 w-full max-w-md mx-auto z-50 px-2 transition-all duration-500 animate-in slide-in-from-bottom-4">
            <div className="bg-white/80 backdrop-blur-3xl border border-white/60 shadow-[0_12px_40px_rgba(0,0,0,0.12)] rounded-[35px] grid grid-cols-7 items-center px-1 relative h-[78px]">
                {/* 1. Dashboard */}
                <NavItem item={items[0]} isActive={pathname === "/"} />

                {/* 2. Shopping List */}
                <NavItem item={items[1]} isActive={pathname.startsWith("/lists") || pathname.startsWith("/list/")} />

                {/* 3. Inventory */}
                <NavItem item={items[2]} isActive={pathname === "/inventory"} />

                {/* 4. Scanner (Center) */}
                <div className="flex flex-col items-center justify-center -mt-8 relative z-20">
                    <button
                        onClick={() => router.push("/scan")}
                        aria-label={t("scan")}
                        className="w-14 h-14 rounded-[22px] bg-gradient-to-tr from-indigo-600 via-violet-600 to-indigo-700 text-white flex items-center justify-center shadow-lg shadow-indigo-200 border border-white/40 active:scale-90 hover:scale-105 transition-all outline outline-4 outline-white group"
                    >
                        <ScanBarcode className="w-7 h-7 group-hover:rotate-12 transition-transform" strokeWidth={2.5} />
                    </button>
                    <span className="text-[10px] font-black text-indigo-600 mt-1 uppercase tracking-widest">{t("scan")}</span>
                </div>

                {/* 5. Recipes */}
                <NavItem item={items[3]} isActive={pathname === "/recipes"} />

                {/* 6. Analytics */}
                <NavItem item={items[4]} isActive={pathname === "/analytics"} />

                {/* 7. Settings */}
                <NavItem item={items[5]} isActive={pathname === "/settings"} />
            </div>
        </div>
    );
}

function NavItem({ item, isActive }: { item: any; isActive: boolean }) {
    const Icon = item.icon;
    return (
        <Link
            href={item.href}
            aria-label={item.label}
            aria-current={isActive ? "page" : undefined}
            className={`flex flex-col items-center justify-center h-full min-w-0 transition-all duration-300 ${isActive
                ? "text-indigo-600 scale-105 drop-shadow-[0_2px_8px_rgba(99,102,241,0.25)]"
                : "text-slate-400 hover:text-slate-600 hover:-translate-y-0.5"
                }`}
        >
            <Icon
                className={`w-5 h-5 mb-1 transition-all duration-300`}
                strokeWidth={isActive ? 2.5 : 2}
            />
            <span className={`text-[9.5px] font-bold text-center leading-[1.2] transition-all duration-300 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`}>
                {item.label}
            </span>
            {isActive && (
                <div className="absolute bottom-1 w-1 h-1 bg-indigo-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
            )}
        </Link>
    );
}

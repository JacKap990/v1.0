"use client";

import { useRouter, usePathname } from "next/navigation";
import { UserCircle, ChevronRight, Share, Plus, Sparkles } from "lucide-react";

export function Header({
    profileImage,
    onPlus,
    onAiChat
}: {
    profileImage?: string | null;
    onPlus?: () => void;
    onAiChat?: () => void;
}) {
    const router = useRouter();
    const pathname = usePathname();

    // Hide the header on the login and register pages where it doesn't belong
    if (pathname === "/login" || pathname === "/register") {
        return null;
    }

    // Determine the dynamic header title based on logic
    // Similar to the vanilla js logic
    let title = "דף הבית";
    let showBack = false;
    let showShare = false;
    let showPlus = !!onPlus;

    if (pathname === "/") {
        title = "דף הבית";
    } else if (pathname === "/lists") {
        title = "רשימות קניות";
        showPlus = true;
    } else if (pathname === "/inventory") {
        title = "המלאי שלי";
    } else if (pathname === "/recipes") {
        title = "מתכונים";
        showBack = true;
    } else if (pathname === "/scan") {
        title = "סריקה חכמה";
        showBack = true;
    } else if (pathname === "/settings") {
        title = "הגדרות";
        showBack = true;
    } else if (pathname === "/analytics") {
        title = "ניתוח נתוני צריכה";
        showBack = true;
    } else if (pathname.startsWith("/list/")) {
        title = "רשימת קניות";
        showBack = true;
        showShare = true;
    }

    // Don't render the global header on the scan page since it has its own full-screen UI overlay
    if (pathname === "/scan") return null;

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'המזווה החכם - רשימת קניות',
                    text: 'קבל קישור לרשימת הקניות מהמזווה החכם:',
                    url: window.location.href,
                });
            } catch (error) {
                // removed console.log
            }
        } else {
            // Fallback for desktop/unsupported browsers
            navigator.clipboard.writeText(window.location.href);
            alert("הקישור הועתק ללוח!");
        }
    };

    return (
        <header className="sticky top-0 z-50 w-full bg-white/70 backdrop-blur-2xl border-b border-slate-200/50 shadow-[0_4px_30px_rgba(0,0,0,0.03)] px-4 py-3 flex items-center justify-between transition-all animate-in fade-in slide-in-from-top-4 duration-500 min-h-[64px]">
            {/* Right Side (Start/Right) - AI + Back Button */}
            <div className="flex items-center w-36 gap-2 z-10 justify-start">
                <button
                    onClick={onAiChat}
                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-violet-600 text-white hover:bg-violet-700 active:scale-95 transition-all shadow-lg shadow-violet-200 relative overflow-hidden group"
                >
                    <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full border-2 border-white animate-pulse" />
                </button>

                {showBack && (
                    <button
                        onClick={() => router.back()}
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 hover:bg-slate-100 active:scale-95 transition-all border border-slate-200 text-slate-700 shadow-sm"
                    >
                        <ChevronRight className="w-6 h-6" strokeWidth={2.5} />
                    </button>
                )}
            </div>

            {/* Center Title (Absolute) */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                <h1 className="text-lg font-black bg-gradient-to-r from-indigo-700 via-violet-700 to-fuchsia-700 bg-clip-text text-transparent drop-shadow-sm tracking-tight">
                    {title}
                </h1>
            </div>

            {/* Left Side (End/Left) - Plus / Share / Profile */}
            <div className="flex items-center gap-2 z-10 justify-end w-36">
                {showShare && (
                    <button
                        onClick={handleShare}
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 hover:bg-slate-100 active:scale-95 transition-all border border-slate-200 text-slate-700 shadow-sm"
                    >
                        <Share className="w-4 h-4" strokeWidth={2.5} />
                    </button>
                )}

                {showPlus && (
                    <button
                        onClick={onPlus}
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white active:scale-95 transition-all border border-emerald-100 shadow-sm"
                    >
                        <Plus className="w-6 h-6" strokeWidth={2.5} />
                    </button>
                )}

                <button
                    onClick={() => router.push("/settings")}
                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-indigo-50/80 text-indigo-600 hover:bg-indigo-100 active:scale-95 transition-all border border-indigo-200 shadow-[0_0_10px_rgba(99,102,241,0.1)] overflow-hidden"
                >
                    {profileImage ? (
                        <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                        <UserCircle className="w-6 h-6" strokeWidth={2} />
                    )}
                </button>
            </div>
        </header>
    );
}

"use client";

import { usePathname } from "next/navigation";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { OnboardingTour } from "@/components/OnboardingTour";
import { AIChatPanel } from "@/components/AIChatPanel";
import { useState, useEffect } from "react";
import { Sparkles } from "lucide-react";

export function MainLayoutWrapper({ children, profileImage }: { children: React.ReactNode, profileImage?: string | null }) {
    const pathname = usePathname();
    const isAuth = pathname === "/login" || pathname === "/register";
    const [isChatOpen, setIsChatOpen] = useState(false);

    const handlePlusClick = () => {
        // Dispatch a custom event that pages can listen to
        window.dispatchEvent(new CustomEvent("open-product-search"));
    };

    useEffect(() => {
        const handleOpenChat = () => setIsChatOpen(true);
        window.addEventListener("open-ai-chat", handleOpenChat);
        return () => window.removeEventListener("open-ai-chat", handleOpenChat);
    }, []);

    return (
        <div className="flex justify-center items-start h-[100dvh] w-full relative z-10 overflow-hidden">
            <main className={`w-full max-w-md h-[100dvh] relative flex flex-col border-x border-slate-200/50 ${isAuth ? "bg-slate-50" : "bg-white/50 backdrop-blur-3xl shadow-[0_0_60px_rgba(0,0,0,0.05)]"}`}>
                <Header
                    profileImage={profileImage}
                    onAiChat={() => setIsChatOpen(true)}
                    onPlus={["/inventory", "/lists"].includes(pathname) || pathname.startsWith("/list/") ? handlePlusClick : undefined}
                />
                <div className={`flex-1 overflow-y-auto overflow-x-hidden w-full relative scroll-smooth ${isAuth ? "" : "pb-[140px] px-2"}`}>
                    {!isAuth && <OnboardingTour />}
                    {children}
                </div>
                <BottomNav />

                {!isAuth && (
                    <AIChatPanel isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
                )}
            </main>
        </div>
    );
}

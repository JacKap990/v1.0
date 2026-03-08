"use client";

import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Sparkles } from "lucide-react";
import dynamic from "next/dynamic";

const OnboardingTour = dynamic(() => import("@/components/OnboardingTour").then(mod => mod.OnboardingTour), { ssr: false });
const AIChatPanel = dynamic(() => import("@/components/AIChatPanel").then(mod => mod.AIChatPanel), { ssr: false });
const Header = dynamic(() => import("@/components/Header").then(mod => mod.Header), { ssr: false });
const BottomNav = dynamic(() => import("@/components/BottomNav").then(mod => mod.BottomNav), { ssr: false });
const ProductSearchModal = dynamic(() => import("@/components/ProductSearchModal").then(mod => mod.ProductSearchModal), { ssr: false });

export function MainLayoutWrapper({ children, profileImage }: { children: React.ReactNode, profileImage?: string | null }) {
    const pathname = usePathname();
    const isAuth = pathname === "/login" || pathname === "/register";
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    const handlePlusClick = () => {
        setIsSearchOpen(true);
    };

    useEffect(() => {
        const handleOpenChat = () => setIsChatOpen(true);
        const handleOpenSearch = () => setIsSearchOpen(true);

        window.addEventListener("open-ai-chat", handleOpenChat);
        window.addEventListener("open-product-search", handleOpenSearch);

        return () => {
            window.removeEventListener("open-ai-chat", handleOpenChat);
            window.removeEventListener("open-product-search", handleOpenSearch);
        };
    }, []);

    if (isAuth) return <div className="h-screen bg-slate-50">{children}</div>;

    return (
        <div className="flex justify-center items-start h-[100dvh] w-full relative z-10 overflow-hidden">
            <div className="w-full max-w-md h-[100dvh] relative flex flex-col border-x border-slate-200/50 bg-slate-50">
                <Header
                    profileImage={profileImage}
                    onAiChat={() => setIsChatOpen(true)}
                    onPlus={["/inventory", "/lists"].includes(pathname) || pathname.startsWith("/list/") ? handlePlusClick : undefined}
                />

                <div className="flex-1 overflow-y-auto overflow-x-hidden w-full relative scroll-smooth">
                    {!isAuth && <OnboardingTour />}
                    {children}
                </div>

                <BottomNav />

                <AIChatPanel isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
                <ProductSearchModal
                    isOpen={isSearchOpen}
                    onClose={() => setIsSearchOpen(false)}
                    onSelect={(p) => {
                        window.dispatchEvent(new CustomEvent('add-to-inventory', { detail: p }));
                        setIsSearchOpen(false);
                    }}
                />
            </div>
        </div>
    );
}

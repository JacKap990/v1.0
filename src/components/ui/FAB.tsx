"use client";

import { Plus } from "lucide-react";

interface FABProps {
    onClick: () => void;
    icon?: React.ReactNode;
    className?: string;
    ariaLabel?: string;
}

export function FAB({ onClick, icon, className = "", ariaLabel }: FABProps) {
    return (
        <button
            onClick={onClick}
            aria-label={ariaLabel}
            className={`fixed bottom-24 right-6 w-14 h-14 bg-gradient-to-tr from-[#4A00E0] to-[#8E2DE2] text-white rounded-full flex items-center justify-center shadow-[0_8px_24px_rgba(74,0,224,0.4)] hover:shadow-[0_12px_32px_rgba(74,0,224,0.5)] hover:-translate-y-1 active:scale-95 transition-all z-40 ${className}`}
        >
            {icon || <Plus className="w-8 h-8" strokeWidth={2.5} />}
        </button>
    );
}

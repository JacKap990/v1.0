import { ReactNode } from "react";

interface GlassCardProps {
    children: ReactNode;
    className?: string;
    onClick?: () => void;
}

export function GlassCard({ children, className = "", onClick }: GlassCardProps) {
    return (
        <div
            onClick={onClick}
            className={`glass rounded-2xl p-4 transition-all duration-300 ${onClick ? "cursor-pointer hover:-translate-y-1 hover:shadow-lg active:scale-95" : ""} ${className}`}
        >
            {children}
        </div>
    );
}

"use client";

import { LucideIcon } from "lucide-react";
import { useState, useRef } from "react";

interface SwipeAction {
    icon: LucideIcon;
    label: string;
    bgColor: string;
    onClick: () => void | Promise<void>;
}

interface SwipeableCardProps {
    children: React.ReactNode;
    leftAction?: SwipeAction;  // Reveals when swiping Right
    rightAction?: SwipeAction; // Reveals when swiping Left
    disabled?: boolean;
}

export function SwipeableCard({ children, leftAction, rightAction, disabled = false }: SwipeableCardProps) {
    const [isActioning, setIsActioning] = useState(false);
    const [offsetX, setOffsetX] = useState(0);
    const [isDragging, setIsDragging] = useState(false);

    const startX = useRef(0);
    const threshold = 50;
    const actionWidth = 80;

    const handleTouchStart = (e: React.TouchEvent) => {
        if (disabled) return;
        startX.current = e.touches[0].clientX;
        setIsDragging(true);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isDragging || disabled) return;
        const currentX = e.touches[0].clientX;
        const diff = currentX - startX.current;

        // Constrain movement based on available actions
        let newOffset = diff;
        if (newOffset > 0 && !leftAction) newOffset = 0;
        if (newOffset < 0 && !rightAction) newOffset = 0;

        // Resilience/Elastic effect
        if (Math.abs(newOffset) > actionWidth) {
            newOffset = (newOffset > 0 ? actionWidth : -actionWidth) + (newOffset - (newOffset > 0 ? actionWidth : -actionWidth)) * 0.2;
        }

        setOffsetX(newOffset);
    };

    const handleTouchEnd = () => {
        if (!isDragging) return;
        setIsDragging(false);

        if (offsetX > threshold && leftAction) {
            setOffsetX(actionWidth);
        } else if (offsetX < -threshold && rightAction) {
            setOffsetX(-actionWidth);
        } else {
            setOffsetX(0);
        }
    };

    const handleAction = async (action: SwipeAction, direction: number) => {
        setIsActioning(true);
        // Animate out (handled by parent removal mostly, but we set state)
        setOffsetX(direction * 500);
        await action.onClick();

        // Reset if still mounted
        setIsActioning(false);
        setOffsetX(0);
    };

    if (isActioning) return null;

    return (
        <div className="relative w-full rounded-[24px] mb-2 group overflow-hidden shadow-sm bg-slate-100">
            {/* Left Action (revealed by swiping Right) */}
            {leftAction && (
                <div className="absolute inset-y-0 left-0 flex z-0">
                    <button
                        onClick={() => handleAction(leftAction, 1)}
                        aria-label={leftAction.label}
                        className={`w-[80px] ${leftAction.bgColor} flex flex-col items-center justify-center text-white transition-colors`}
                    >
                        <leftAction.icon className="w-5 h-5 mb-1" />
                        <span className="text-[10px] font-black tracking-tight">{leftAction.label}</span>
                    </button>
                </div>
            )}

            {/* Right Action (revealed by swiping Left) */}
            {rightAction && (
                <div className="absolute inset-y-0 right-0 flex z-0">
                    <button
                        onClick={() => handleAction(rightAction, -1)}
                        aria-label={rightAction.label}
                        className={`w-[80px] ${rightAction.bgColor} flex flex-col items-center justify-center text-white transition-colors`}
                    >
                        <rightAction.icon className="w-5 h-5 mb-1" />
                        <span className="text-[10px] font-black tracking-tight">{rightAction.label}</span>
                    </button>
                </div>
            )}

            {/* Foreground Content Card */}
            <div
                className={`relative z-10 w-full transition-transform duration-200 ease-out cursor-grab active:cursor-grabbing ${isDragging ? 'transition-none' : ''}`}
                style={{ transform: `translateX(${offsetX}px)` }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                <div className="bg-white rounded-[24px] overflow-hidden">
                    {children}
                </div>
            </div>
        </div>
    );
}

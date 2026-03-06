"use client";

import { motion, useAnimation, useMotionValue, PanInfo } from "framer-motion";
import { Trash2, ShoppingCart, Check, Edit2, LucideIcon } from "lucide-react";
import { useState } from "react";

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
    const controls = useAnimation();
    const x = useMotionValue(0);

    const handleDragEnd = async (e: any, info: PanInfo) => {
        if (disabled) return;
        const threshold = 50;

        if (info.offset.x > threshold && leftAction) {
            controls.start({ x: 80 });
        } else if (info.offset.x < -threshold && rightAction) {
            controls.start({ x: -80 });
        } else {
            controls.start({ x: 0 });
        }
    };

    const handleAction = async (action: SwipeAction, direction: number) => {
        setIsActioning(true);
        // Animate out
        await controls.start({
            x: direction * 500,
            opacity: 0,
            transition: { duration: 0.2, ease: "easeOut" }
        });
        await action.onClick();

        // If the component wasn't unmounted by the parent, reset it
        setIsActioning(false);
        controls.set({ x: 0, opacity: 1 });
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
            <motion.div
                className="relative z-10 w-full"
                drag={disabled ? false : "x"}
                dragConstraints={{
                    left: rightAction ? -80 : 0,
                    right: leftAction ? 80 : 0
                }}
                dragElastic={0.2}
                onDragEnd={handleDragEnd}
                animate={controls}
                style={{ x }}
                whileTap={{ scale: disabled ? 1 : 0.98, cursor: disabled ? "default" : "grabbing" }}
                transition={{ type: "spring", stiffness: 600, damping: 30 }}
            >
                <div className="bg-white rounded-[24px] overflow-hidden">
                    {children}
                </div>
            </motion.div>
        </div>
    );
}

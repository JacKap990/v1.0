"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, AlertCircle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface Toast {
    id: string;
    message: string;
    type: ToastType;
    onUndo?: () => void;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType, onUndo?: () => void) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error("useToast must be used within a ToastProvider");
    }
    return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    const showToast = useCallback((message: string, type: ToastType = "success", onUndo?: () => void) => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts((prev) => [...prev, { id, message, type, onUndo }]);

        // Auto remove after 3s (or 5s if has undo)
        setTimeout(() => {
            removeToast(id);
        }, onUndo ? 5000 : 3000);
    }, [removeToast]);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed bottom-24 left-0 right-0 z-[100] flex flex-col items-center gap-2 pointer-events-none px-4">
                <AnimatePresence>
                    {toasts.map((toast) => (
                        <motion.div
                            key={toast.id}
                            initial={{ opacity: 0, y: 50, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl max-w-sm w-full backdrop-blur-md border ${toast.type === "success"
                                ? "bg-emerald-50/95 border-emerald-200 text-emerald-800"
                                : toast.type === "error"
                                    ? "bg-rose-50/95 border-rose-200 text-rose-800"
                                    : "bg-indigo-50/95 border-indigo-200 text-indigo-800"
                                }`}
                        >
                            {/* Icon */}
                            <div className="shrink-0">
                                {toast.type === "success" && <CheckCircle className="w-5 h-5 text-emerald-600" />}
                                {toast.type === "error" && <AlertCircle className="w-5 h-5 text-rose-600" />}
                                {toast.type === "info" && <Info className="w-5 h-5 text-indigo-600" />}
                            </div>

                            {/* Message */}
                            <p className="flex-1 text-sm font-bold">{toast.message}</p>

                            {/* Undo Button */}
                            {toast.onUndo && (
                                <button
                                    onClick={() => {
                                        toast.onUndo?.();
                                        removeToast(toast.id);
                                    }}
                                    className="px-3 py-1 rounded-lg bg-white/50 hover:bg-white text-xs font-black transition-all border border-black/5"
                                >
                                    ביטול
                                </button>
                            )}

                            {/* Close */}
                            <button
                                onClick={() => removeToast(toast.id)}
                                className="p-1 rounded-full hover:bg-black/5 transition-colors shrink-0"
                            >
                                <X className="w-4 h-4 opacity-50 hover:opacity-100" />
                            </button>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
}


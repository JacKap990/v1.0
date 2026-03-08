"use client";


import { useEffect } from "react";
import { AlertOctagon, RotateCcw, Home } from "lucide-react";
import Link from "next/link";

export default function ErrorBoundary({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error("Global Error Caught:", error);
    }, [error]);

    return (
        <div className="min-h-[100dvh] flex flex-col items-center justify-center p-6 bg-slate-50 text-center">
            <div className="w-24 h-24 bg-rose-100 rounded-full flex items-center justify-center mb-6 shadow-sm">
                <AlertOctagon className="w-12 h-12 text-rose-500" />
            </div>

            <h1 className="text-2xl font-black text-slate-800 mb-2">אופס! משהו השתבש...</h1>
            <p className="text-slate-500 font-medium text-sm mb-8 max-w-xs">
                קרתה שגיאה לא צפויה במערכת. אל דאגה, הנתונים שלך שמורים במזווה.
            </p>

            <div className="flex flex-col gap-3 w-full max-w-xs">
                <button
                    onClick={() => reset()}
                    className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-bold text-lg shadow-[0_8px_24px_rgba(99,102,241,0.25)] hover:shadow-[0_12px_32px_rgba(99,102,241,0.35)] active:scale-95 transition-all"
                >
                    <RotateCcw className="w-5 h-5" /> נסה שוב
                </button>

                <Link
                    href="/"
                    className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl bg-white border border-slate-200 text-slate-600 font-bold text-lg shadow-sm hover:bg-slate-50 active:scale-95 transition-all"
                >
                    <Home className="w-5 h-5" /> חזרה לדף הבית
                </Link>
            </div>
        </div>
    );
}

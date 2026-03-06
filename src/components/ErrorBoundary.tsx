"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCcw, Home } from "lucide-react";

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
                    <div className="max-w-md w-full bg-white rounded-[32px] shadow-xl p-8 border border-rose-100">
                        <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <AlertTriangle className="w-10 h-10 text-rose-500" />
                        </div>

                        <h1 className="text-2xl font-black text-slate-800 mb-2">אופס! משהו השתבש</h1>
                        <p className="text-slate-500 mb-8 font-medium">
                            נתקלנו בשגיאה לא צפויה. אל דאגה, המזווה שלך בטוח. נסה לרענן את העמוד או לחזור לדף הבית.
                        </p>

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => window.location.reload()}
                                className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all active:scale-[0.98]"
                            >
                                <RefreshCcw className="w-5 h-5" />
                                רענן עמוד
                            </button>

                            <a
                                href="/"
                                className="w-full bg-white text-slate-600 font-bold py-4 rounded-2xl border border-slate-200 flex items-center justify-center gap-2 hover:bg-slate-50 transition-all active:scale-[0.98]"
                            >
                                <Home className="w-5 h-5" />
                                חזרה לבית
                            </a>
                        </div>

                        {process.env.NODE_ENV === "development" && (
                            <div className="mt-8 p-4 bg-slate-900 rounded-2xl text-left overflow-auto max-h-40">
                                <code className="text-[10px] text-rose-300 whitespace-pre">
                                    {this.state.error?.toString()}
                                </code>
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

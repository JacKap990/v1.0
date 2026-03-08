"use client";

import { useState, useRef, useEffect } from "react";
import { X, Send, Bot, User, Loader2, Sparkles, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { updateInventoryQuantity, addInventoryItem, deleteInventoryItem } from "@/app/actions/inventory";
import { addItemToDefaultList } from "@/app/actions/lists";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";

interface Message {
    role: "user" | "assistant";
    content: string;
}

interface AIChatPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

export function AIChatPanel({ isOpen, onClose }: AIChatPanelProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const { showToast } = useToast();
    const router = useRouter();
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, loading]);

    const handleSendMessage = async () => {
        if (!input.trim() || loading) return;

        const userMsg: Message = { role: "user", content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setLoading(true);

        try {
            const response = await fetch("/api/gateway/ai/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messages: [...messages, userMsg] }),
            });

            const data = await response.json();
            if (data.content) {
                let displayContent = data.content;

                // Parse potential actions
                const actionRegex = /<action>([\s\S]*?)<\/action>/;
                const match = displayContent.match(actionRegex);

                if (match) {
                    try {
                        const actionData = JSON.parse(match[1]);
                        displayContent = displayContent.replace(actionRegex, "").trim();

                        console.log("AI Action detected:", actionData.type, actionData.payload);

                        // Execute Action
                        if (actionData.type === "update_quantity") {
                            await updateInventoryQuantity(actionData.payload.id, actionData.payload.quantity);
                            showToast("המלאי עודכן על ידי העוזר", "success");
                        } else if (actionData.type === "add_item") {
                            await addInventoryItem(actionData.payload);
                            showToast("מוצר נוסף על ידי העוזר", "success");
                        } else if (actionData.type === "delete_item") {
                            await deleteInventoryItem(actionData.payload.id);
                            showToast("מוצר נמחק על ידי העוזר", "info");
                        } else if (actionData.type === "add_to_list") {
                            const result = await addItemToDefaultList({
                                name: actionData.payload.name,
                                quantity: actionData.payload.quantity,
                                unit: actionData.payload.unit,
                                emoji: actionData.payload.emoji || "🛒",
                                category: actionData.payload.category
                            });

                            if (result.success) {
                                showToast(`הוספתי ${actionData.payload.name} לרשימת הקניות`, "success");
                                router.refresh();
                            } else {
                                showToast("נכשלתי בהוספת המוצר לרשימה", "error");
                            }
                        }
                    } catch (e) {
                        console.error("Failed to parse AI action", e);
                    }
                }

                setMessages(prev => [...prev, { role: "assistant", content: displayContent }]);
            } else {
                setMessages(prev => [...prev, { role: "assistant", content: "מצטער, הייתה לי שגיאה קטנה בזיכרון המלוח שלי..." }]);
            }
        } catch (error) {
            setMessages(prev => [...prev, { role: "assistant", content: "שגיאה בחיבור ל-AI. נסה שוב מאוחר יותר." }]);
        } finally {
            setLoading(false);
        }
    };

    const clearChat = () => {
        if (confirm("האם למחוק את היסטוריית הצ'אט?")) {
            setMessages([]);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex justify-end">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                    />

                    {/* Panel */}
                    <motion.div
                        drag="x"
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={0.1}
                        onDragEnd={(_, info) => {
                            if (info.offset.x > 100) onClose();
                        }}
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 30, stiffness: 120, mass: 1.5 }}
                        className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col overflow-hidden"
                    >
                        {/* Drag Handle (Mobile) */}
                        <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1 h-12 bg-slate-200 rounded-full sm:hidden" />
                        {/* Header */}
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-violet-600 to-indigo-600 text-white">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md">
                                    <Sparkles className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-black tracking-tight">מנהל המזווה</h2>
                                    <p className="text-[10px] text-violet-100 font-bold uppercase tracking-widest">מלווה אותך בניהול הבית</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                {messages.length > 0 && (
                                    <button onClick={clearChat} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/70 hover:text-white">
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                )}
                                <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50 no-scrollbar">
                            {messages.length === 0 && (
                                <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                                    <div className="w-20 h-20 bg-violet-100 rounded-full flex items-center justify-center text-violet-600">
                                        <Bot className="w-10 h-10" />
                                    </div>
                                    <div>
                                        <p className="font-black text-slate-800 text-lg">מה שלומך? אני המנהל שלך.</p>
                                        <p className="text-sm text-slate-500 mt-1 max-w-[250px]">
                                            אפשר לבקש ממני "תעדכן שיש לי 5 חלב" או "מה אפשר לבשל היום?"
                                        </p>
                                    </div>
                                    <div className="flex flex-wrap justify-center gap-2 mt-4">
                                        {["עדכן 2 ליטר חלב", "מה עומד לפוג?", "הצע לי ארוחת ערב"].map((suggestion, i) => (
                                            <button
                                                key={i}
                                                onClick={() => setInput(suggestion)}
                                                className="text-xs bg-white border border-slate-200 px-3 py-2 rounded-full hover:border-violet-300 hover:text-violet-600 transition-all shadow-sm"
                                            >
                                                {suggestion}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {messages.map((msg, i) => (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    key={i}
                                    className={`flex ${msg.role === "user" ? "justify-start" : "justify-end"}`}
                                >
                                    <div className={`flex gap-3 max-w-[85%] ${msg.role === "user" ? "flex-row" : "flex-row-reverse"}`}>
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${msg.role === "user" ? "bg-slate-200 text-slate-600" : "bg-violet-600 text-white shadow-md shadow-violet-200"
                                            }`}>
                                            {msg.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                                        </div>
                                        <div className={`p-4 rounded-2xl text-sm leading-relaxed ${msg.role === "user"
                                            ? "bg-white border border-slate-100 text-slate-800 shadow-sm rounded-tr-none"
                                            : "bg-gradient-to-br from-violet-600 to-indigo-700 text-white shadow-lg shadow-violet-100 rounded-tl-none"
                                            }`}>
                                            {msg.content}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}

                            {loading && (
                                <div className="flex justify-end">
                                    <div className="flex gap-3 max-w-[85%] flex-row-reverse">
                                        <div className="w-8 h-8 rounded-full bg-violet-600 text-white flex items-center justify-center animate-pulse">
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        </div>
                                        <div className="p-4 bg-slate-100 rounded-2xl rounded-tl-none">
                                            <div className="flex gap-1">
                                                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Input Area */}
                        <div className="p-4 border-t border-slate-100 bg-white">
                            <div className="relative flex items-center gap-2">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                                    placeholder="כתבו כאן למנהל המזווה..."
                                    className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl py-4 pr-4 pl-12 text-sm focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all"
                                />
                                <button
                                    onClick={handleSendMessage}
                                    disabled={!input.trim() || loading}
                                    className="absolute left-2 w-10 h-10 bg-violet-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-violet-200 hover:bg-violet-700 transition-all active:scale-95 disabled:opacity-50"
                                >
                                    <Send className="w-5 h-5" />
                                </button>
                            </div>
                            <p className="text-[10px] text-center text-slate-400 mt-3 font-bold uppercase tracking-widest">Powered by Gemini 2.0 Flash</p>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

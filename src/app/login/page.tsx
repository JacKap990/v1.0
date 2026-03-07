"use client";
export const runtime = 'edge';


import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogIn, ArrowRight, Package, ScanLine, ChefHat, UserCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const ONBOARDING_SLIDES = [
    {
        icon: <Package className="w-16 h-16 text-emerald-500" />,
        title: "המזווה החכם שלך",
        description: "נהל את כל המוצרים בבית במקום אחד. קבל התראות על תוקף ואל תזרוק אוכל לפח."
    },
    {
        icon: <ScanLine className="w-16 h-16 text-emerald-500" />,
        title: "סורק קבלות מבוסס AI",
        description: "חזרת מהסופר? צלם את הקבלה והבינה המלאכותית שלנו תכניס את כל המוצרים למלאי בשניות."
    },
    {
        icon: <ChefHat className="w-16 h-16 text-emerald-500" />,
        title: "מה מבשלים היום?",
        description: "המערכת מנתחת את המזווה שלך ומציעה מתכונים שניתן להכין ברגע זה ממה שיש בבית."
    }
];

export default function LoginPage() {
    const router = useRouter();
    const [currentSlide, setCurrentSlide] = useState(0);
    const [showLogin, setShowLogin] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [guestLoading, setGuestLoading] = useState(false);

    // Forgot Password State
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [resetEmail, setResetEmail] = useState("");
    const [resetMessage, setResetMessage] = useState("");
    const [resetLoading, setResetLoading] = useState(false);

    // Auto-advance carousel
    useEffect(() => {
        if (showLogin) return;
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % ONBOARDING_SLIDES.length);
        }, 4000);
        return () => clearInterval(timer);
    }, [showLogin]);

    const handleLoginClick = () => {
        setShowLogin(true);
    };

    const handleGuestLogin = async () => {
        setGuestLoading(true);
        setError("");
        try {
            const res = await signIn("credentials", {
                redirect: false,
                email: "guest@pantry.com",
                password: "guest123",
            });
            if (res?.error) {
                setError("שגיאה ביצירת חשבון האורח.");
            } else {
                router.push("/");
                router.refresh();
            }
        } catch (err) {
            setError("אירעה שגיאה בחיבור לשרת.");
        } finally {
            setGuestLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const res = await signIn("credentials", {
                redirect: false,
                email,
                password,
            });

            if (res?.error) {
                setError("שם משתמש או סיסמה שגויים");
            } else {
                router.push("/");
                router.refresh();
            }
        } catch (err) {
            setError("אירעה שגיאה בחיבור לשרת");
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setResetMessage("");
        setResetLoading(true);

        try {
            const res = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: resetEmail }),
            });

            const data = await res.json();

            if (res.ok) {
                setResetMessage(data.message || "קישור לאיפוס סיסמה נשלח בהצלחה (ראה קונסול שרת)");
                setResetEmail("");
            } else {
                setResetMessage(data.error || "שגיאה בשליחת בקשת איפוס");
            }
        } catch (err) {
            setResetMessage("אירעה שגיאה. נסה שוב מאוחר יותר.");
        } finally {
            setResetLoading(false);
        }
    };

    return (
        <div className="flex w-full h-full overflow-hidden flex-col items-center justify-center p-6 relative">
            {/* Ambient Animated Mesh Background - Light Theme */}
            <div className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-emerald-400/20 blur-[120px] mix-blend-multiply animate-blob" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-cyan-400/20 blur-[100px] mix-blend-multiply animate-blob animation-delay-2000" />

            <AnimatePresence mode="wait">
                {!showLogin ? (
                    <motion.div
                        key="onboarding"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, x: -100 }}
                        transition={{ duration: 0.4 }}
                        className="glass w-full max-w-sm rounded-[32px] p-8 relative z-10 flex flex-col items-center text-center shadow-2xl border border-white/60"
                    >
                        {/* Interactive Carousel Area */}
                        <div className="h-[260px] flex flex-col items-center justify-center relative w-full mb-6">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={currentSlide}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ duration: 0.3 }}
                                    className="flex flex-col items-center"
                                >
                                    <div className="w-24 h-24 rounded-3xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-6 shadow-[0_8px_24px_rgba(16,185,129,0.15)]">
                                        {ONBOARDING_SLIDES[currentSlide].icon}
                                    </div>
                                    <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-500 to-cyan-500 bg-clip-text text-transparent mb-3">
                                        {ONBOARDING_SLIDES[currentSlide].title}
                                    </h2>
                                    <p className="text-gray-600 text-sm leading-relaxed">
                                        {ONBOARDING_SLIDES[currentSlide].description}
                                    </p>
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        {/* Pagination Dots */}
                        <div className="flex gap-2 mb-8">
                            {ONBOARDING_SLIDES.map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setCurrentSlide(i)}
                                    className={`w-2 h-2 rounded-full transition-all duration-300 ${i === currentSlide ? "bg-emerald-500 w-6" : "bg-gray-200 hover:bg-gray-300"
                                        }`}
                                />
                            ))}
                        </div>

                        {/* Action Buttons */}
                        <div className="w-full flex flex-col gap-3">
                            <button
                                onClick={handleLoginClick}
                                className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white p-4 rounded-2xl font-bold text-lg shadow-[0_8px_32px_rgba(16,185,129,0.3)] hover:shadow-[0_12px_40px_rgba(16,185,129,0.4)] hover:-translate-y-1 active:scale-95 transition-all"
                            >
                                התחבר לחשבון שלי
                            </button>
                            <button
                                onClick={handleGuestLogin}
                                disabled={guestLoading}
                                className="w-full bg-white/50 hover:bg-white/80 border border-gray-200 text-gray-700 p-4 rounded-2xl font-bold text-lg active:scale-95 transition-all flex items-center justify-center gap-2"
                            >
                                {guestLoading ? (
                                    <div className="w-6 h-6 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <UserCircle className="w-5 h-5 text-gray-500" />
                                        התנסות במערכת כאורח
                                    </>
                                )}
                            </button>
                        </div>
                        {error && (
                            <div className="text-red-500 text-xs mt-4 bg-red-50 p-2 rounded-xl border border-red-100">
                                {error}
                            </div>
                        )}
                    </motion.div>
                ) : (
                    <motion.div
                        key="login"
                        initial={{ opacity: 0, x: 100 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.4 }}
                        className="glass w-full max-w-sm rounded-[32px] p-8 relative z-10 flex flex-col items-center text-center shadow-2xl border border-white/60"
                    >
                        {showForgotPassword ? (
                            <>
                                <button
                                    onClick={() => {
                                        setShowForgotPassword(false);
                                        setResetMessage("");
                                    }}
                                    className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <ArrowRight className="w-6 h-6" />
                                </button>

                                <div className="w-16 h-16 bg-gradient-to-tr from-emerald-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-[0_8px_24px_rgba(16,185,129,0.3)] mb-6 mt-4">
                                    <UserCircle className="w-8 h-8 text-white" />
                                </div>

                                <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-500 to-cyan-500 bg-clip-text text-transparent mb-2">
                                    שכחת סיסמה?
                                </h1>
                                <p className="text-gray-500 text-sm mb-6 font-medium">
                                    הכנס את כתובת האימייל שלך ונשלח (ונדפיס בשרת) קישור לאיפוס סיסמה.
                                </p>

                                <form onSubmit={handleForgotPassword} className="w-full flex flex-col gap-4">
                                    <input
                                        type="email"
                                        value={resetEmail}
                                        onChange={(e) => setResetEmail(e.target.value)}
                                        placeholder="אימייל"
                                        required
                                        dir="ltr"
                                        className="w-full text-center p-4 bg-white/60 border border-white/40 focus:bg-white focus:border-emerald-400 rounded-xl outline-none transition-all placeholder:text-gray-400 font-medium text-gray-800 focus:ring-2 focus:ring-emerald-100"
                                    />

                                    {resetMessage && (
                                        <div className={`text-sm font-medium p-3 rounded-xl mt-2 border ${resetMessage.includes("שגיאה") ? "bg-red-50 text-red-500 border-red-100" : "bg-emerald-50 text-emerald-600 border-emerald-100"}`}>
                                            {resetMessage}
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={resetLoading}
                                        className="w-full mt-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white p-4 rounded-xl font-bold text-lg shadow-[0_8px_24px_rgba(16,185,129,0.3)] hover:shadow-[0_12px_32px_rgba(16,185,129,0.4)] hover:-translate-y-1 active:scale-95 transition-all flex justify-center items-center"
                                    >
                                        {resetLoading ? (
                                            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            "שליחת קישור"
                                        )}
                                    </button>
                                </form>
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={() => setShowLogin(false)}
                                    className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <ArrowRight className="w-6 h-6" />
                                </button>

                                <div className="w-16 h-16 bg-gradient-to-tr from-emerald-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-[0_8px_24px_rgba(16,185,129,0.3)] mb-6 mt-4">
                                    <LogIn className="w-8 h-8 text-white" />
                                </div>

                                <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-500 to-cyan-500 bg-clip-text text-transparent mb-2">
                                    התחבר למזווה
                                </h1>
                                <p className="text-gray-500 text-sm mb-8 font-medium">
                                    הכנס את פרטייך האישיים למטה
                                </p>

                                <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="אימייל"
                                        required
                                        dir="ltr"
                                        className="w-full text-center p-4 bg-white/60 border border-white/40 focus:bg-white focus:border-emerald-400 rounded-xl outline-none transition-all placeholder:text-gray-400 font-medium text-gray-800 focus:ring-2 focus:ring-emerald-100"
                                    />
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="סיסמה"
                                        required
                                        dir="ltr"
                                        className="w-full text-center p-4 bg-white/60 border border-white/40 focus:bg-white focus:border-emerald-400 rounded-xl outline-none transition-all placeholder:text-gray-400 font-medium text-gray-800 tracking-widest focus:ring-2 focus:ring-emerald-100"
                                    />

                                    {error && (
                                        <div className="text-red-500 text-sm font-medium bg-red-50 border border-red-100 p-3 rounded-xl mt-2">
                                            {error}
                                        </div>
                                    )}

                                    <div className="flex justify-end w-full mt-1">
                                        <button
                                            type="button"
                                            onClick={() => setShowForgotPassword(true)}
                                            className="text-[13px] font-bold text-emerald-600 hover:text-emerald-700 hover:underline transition-colors"
                                        >
                                            שכחת סיסמה?
                                        </button>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full mt-4 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white p-4 rounded-xl font-bold text-lg shadow-[0_8px_24px_rgba(16,185,129,0.3)] hover:shadow-[0_12px_32px_rgba(16,185,129,0.4)] hover:-translate-y-1 active:scale-95 transition-all flex justify-center items-center"
                                    >
                                        {loading ? (
                                            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            "כניסה מאובטחת"
                                        )}
                                    </button>
                                </form>

                                <div className="mt-8 text-sm text-gray-500">
                                    עוד אין לך חשבון?{" "}
                                    <Link
                                        href="/register"
                                        className="text-emerald-500 font-bold hover:text-emerald-600 hover:underline transition-colors"
                                    >
                                        צור חשבון חדש
                                    </Link>
                                </div>
                            </>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

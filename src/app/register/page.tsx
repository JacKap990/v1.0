"use client";



import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UserPlus, ArrowRight } from "lucide-react";

export default function RegisterPage() {
    const router = useRouter();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const res = await fetch("/api/gateway/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "שגיאה ביצירת החשבון");
            }

            const loginRes = await signIn("credentials", {
                redirect: false,
                email,
                password,
            });

            if (loginRes?.error) {
                setError("חשבון נוצר אך ההתחברות נכשלה");
            } else {
                router.push("/");
                router.refresh();
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex w-full h-full overflow-hidden flex-col items-center justify-center p-6 relative">
            {/* Ambient Animated Mesh Background - Light Theme */}
            <div className="absolute top-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-teal-400/20 blur-[120px] mix-blend-multiply animate-blob" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-cyan-400/20 blur-[100px] mix-blend-multiply animate-blob animation-delay-2000" />

            <div className="glass w-full max-w-sm rounded-[32px] p-8 relative z-10 flex flex-col items-center text-center shadow-2xl border border-white/60 animate-in fade-in zoom-in duration-500">
                <Link
                    href="/login"
                    className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <ArrowRight className="w-6 h-6" />
                </Link>

                <div className="w-16 h-16 bg-gradient-to-tr from-teal-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-[0_8px_24px_rgba(20,184,166,0.3)] mb-6 mt-4">
                    <UserPlus className="w-8 h-8 text-white" />
                </div>

                <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-500 to-cyan-500 bg-clip-text text-transparent mb-2">
                    חשבון חדש
                </h1>
                <p className="text-gray-500 text-sm mb-8 font-medium">
                    הצטרף למזווה החכם בחינם
                </p>

                <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="שם מלא (לדוג: ישראל ישראלי)"
                        required
                        className="w-full text-center p-4 bg-white/60 border border-white/40 focus:bg-white focus:border-teal-400 rounded-xl outline-none transition-all placeholder:text-gray-400 font-medium text-gray-800 focus:ring-2 focus:ring-teal-100"
                    />
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="אימייל"
                        required
                        dir="ltr"
                        className="w-full text-center p-4 bg-white/60 border border-white/40 focus:bg-white focus:border-teal-400 rounded-xl outline-none transition-all placeholder:text-gray-400 font-medium text-gray-800 focus:ring-2 focus:ring-teal-100"
                    />
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="סיסמה (לפחות 6 תווים)"
                        required
                        minLength={6}
                        dir="ltr"
                        className="w-full text-center p-4 bg-white/60 border border-white/40 focus:bg-white focus:border-teal-400 rounded-xl outline-none transition-all placeholder:text-gray-400 font-medium text-gray-800 tracking-widest focus:ring-2 focus:ring-teal-100"
                    />

                    {error && (
                        <div className="text-red-500 text-sm font-medium bg-red-50 border border-red-100 p-3 rounded-xl mt-2">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full mt-4 bg-gradient-to-r from-teal-500 to-cyan-500 text-white p-4 rounded-xl font-bold text-lg shadow-[0_8px_24px_rgba(20,184,166,0.3)] hover:shadow-[0_12px_32px_rgba(20,184,166,0.4)] hover:-translate-y-1 active:scale-95 transition-all flex justify-center items-center"
                    >
                        {loading ? (
                            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            "צור חשבון"
                        )}
                    </button>
                </form>

                <div className="mt-8 text-sm text-gray-500">
                    כבר יש לך חשבון?{" "}
                    <Link
                        href="/login"
                        className="text-teal-500 font-bold hover:text-teal-600 hover:underline transition-colors"
                    >
                        התחבר כאן
                    </Link>
                </div>
            </div>
        </div>
    );
}

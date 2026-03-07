"use client";
export const runtime = 'edge';


import { useTheme } from "@/components/ThemeProvider";
import { useState, useEffect } from "react";
import { getUserSettings, updateUserSettings } from "@/app/actions/settings";
import {
    Sun, Moon, Monitor, Palette,
    User, Check, ChevronLeft, Layout, Camera
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

const THEMES = [
    { id: "indigo", name: "אינדיגו", color: "#6366F1" },
    { id: "rose", name: "ורוד רוז", color: "#FB7185" },
    { id: "emerald", name: "ברקת", color: "#10B981" },
    { id: "amber", name: "ענבר", color: "#F59E0B" },
    { id: "slate", name: "אפור כהה", color: "#475569" },
    { id: "violet", name: "סגול", color: "#8B5CF6" },
];

export default function SettingsPage() {
    const { theme, setTheme, colorTheme, setColorTheme, density, setDensity } = useTheme();

    // Local state for non-visual settings with optimistic updates
    const [familySize, setFamilySize] = useState(1);
    const [dietaryTags, setDietaryTags] = useState<string[]>([]);
    const [aiVision, setAiVision] = useState(true);
    const [aiRecs, setAiRecs] = useState(true);
    const [aiAutoPilot, setAiAutoPilot] = useState(false);
    const [dataCollection, setDataCollection] = useState(true);
    const [autoRestock, setAutoRestock] = useState(true);
    const [profileImage, setProfileImage] = useState<string | null>(null);
    const [language, setLanguage] = useState("he");
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function load() {
            const s = await getUserSettings();
            if (s) {
                setFamilySize((s as any).familySize || 1);
                setDietaryTags(JSON.parse((s as any).dietaryTags || "[]"));
                setAiVision((s as any).aiVisionEnabled !== false);
                setAiRecs((s as any).aiRecommendationsEnabled !== false);
                setAiAutoPilot(!!(s as any).aiAutoPilot);
                setDataCollection((s as any).dataCollection !== false);
                setAutoRestock((s as any).autoRestock !== false);
                setProfileImage((s as any).profileImage || null);
                setLanguage((s as any).language || "he");
            }
            setIsLoading(false);
        }
        load();
    }, []);

    const toggleDietary = (tag: string) => {
        const next = dietaryTags.includes(tag)
            ? dietaryTags.filter(t => t !== tag)
            : [...dietaryTags, tag];
        setDietaryTags(next);
        updateUserSettings({ dietaryTags: JSON.stringify(next) });
    };

    const updateFamily = (val: number) => {
        const next = Math.max(1, familySize + val);
        setFamilySize(next);
        updateUserSettings({ familySize: next });
    };

    const toggleAI = (type: string) => {
        if (type === 'vision') {
            setAiVision(!aiVision); updateUserSettings({ aiVisionEnabled: !aiVision });
        } else if (type === 'recs') {
            setAiRecs(!aiRecs); updateUserSettings({ aiRecommendationsEnabled: !aiRecs });
        } else if (type === 'autoPilot') {
            setAiAutoPilot(!aiAutoPilot);
            updateUserSettings({ aiAutoPilot: !aiAutoPilot, dataCollection: true });
            if (!aiAutoPilot) setDataCollection(true);
        } else if (type === 'data') {
            setDataCollection(!dataCollection); updateUserSettings({ dataCollection: !dataCollection });
        } else if (type === 'restock') {
            setAutoRestock(!autoRestock); updateUserSettings({ autoRestock: !autoRestock });
        }
    };

    const updateLanguage = (id: string) => {
        setLanguage(id);
        updateUserSettings({ language: id });
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Resize and convert to base64
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement("canvas");
                const MAX_WIDTH = 150;
                const MAX_HEIGHT = 150;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext("2d");
                ctx?.drawImage(img, 0, 0, width, height);

                // Compress to save DB space
                const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
                setProfileImage(dataUrl);
                updateUserSettings({ profileImage: dataUrl });
            };
            img.src = event.target?.result as string;
        };
        reader.readAsDataURL(file);
    };

    if (isLoading) return <div className="min-h-screen flex items-center justify-center font-black">טוען הגדרות...</div>;

    return (
        <div className="min-h-screen pb-24 dark:bg-slate-950">
            {/* Header */}
            <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-800 p-4">
                <div className="flex items-center gap-4">
                    <Link href="/" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                        <ChevronLeft className="w-6 h-6" />
                    </Link>
                    <h1 className="text-xl font-black">הגדרות</h1>
                </div>
            </header>

            <main className="p-6 space-y-8 max-w-2xl mx-auto overflow-hidden">
                {/* Profile Section */}
                <section className="space-y-4">
                    <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                        <User className="w-4 h-4" /> פרופיל משתמש
                    </h2>
                    <div className="bg-card glass rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4">
                        <label className="relative cursor-pointer group w-16 h-16 shrink-0 block">
                            {profileImage ? (
                                <img src={profileImage} alt="Profile" className="w-16 h-16 rounded-full object-cover shadow-md" />
                            ) : (
                                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary text-2xl font-black shadow-sm">
                                    J
                                </div>
                            )}
                            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Camera className="w-6 h-6 text-white" />
                            </div>
                            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                        </label>
                        <div className="flex-1">
                            <p className="font-bold text-lg">יעקב</p>
                            <p className="text-sm text-slate-500">jacob@example.com</p>
                        </div>
                    </div>
                </section>

                {/* AI Intelligence Section */}
                <section className="space-y-4">
                    <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2 text-indigo-500">
                        בינה מלאכותית (AI)
                    </h2>
                    <div className="bg-card glass rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
                        {[
                            { id: 'autoPilot', label: 'הפעלה מוחלטת של AI (Auto-Pilot)', desc: 'המערכת לומדת דפוסים ומנהלת מלאי ורשימות קניות באוטומציה מלאה.', active: aiAutoPilot },
                            { id: 'data', label: 'איסוף נתוני שימוש התנהגותיים', desc: 'אישור למערכת לאסוף ולנתח מתי קנית או סיימת מוצרים לשיפור החיזוי.', active: dataCollection },
                            { id: 'restock', label: 'הוספה אוטומטית לרשימת קניות', desc: 'מוצרים שזוהו כחסרים בעקבות שימוש יתווספו אוטומטית לקניות.', active: autoRestock },
                            { id: 'vision', label: 'סריקת מצרכים חכמה', desc: 'זיהוי מצרכים וקבלות באמצעות המצלמה', active: aiVision },
                            { id: 'recs', label: 'המלצות מותאמות אישית', desc: 'הצעות למתכונים וקניות לפי הרגלי הצריכה', active: aiRecs }
                        ].map(item => (
                            <div key={item.id} className="flex items-center justify-between gap-4">
                                <div className="flex-1">
                                    <p className="font-bold text-sm">{item.label}</p>
                                    <p className="text-[10px] text-slate-500">{item.desc}</p>
                                </div>
                                <button
                                    onClick={() => toggleAI(item.id as any)}
                                    className={`w-11 h-6 rounded-full transition-all flex items-center px-1 ${item.active ? 'bg-indigo-600 justify-end' : 'bg-slate-200 dark:bg-slate-700 justify-start'}`}
                                >
                                    <motion.div
                                        layout
                                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                        className="w-4 h-4 bg-white rounded-full shadow-sm"
                                    />
                                </button>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Household Section */}
                <section className="space-y-4">
                    <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider">משק בית ותזונה</h2>
                    <div className="bg-card glass rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-bold text-sm">גודל משפחה</p>
                                <p className="text-[10px] text-slate-500">משפיע על כמויות במתכונים ורשימות קניות</p>
                            </div>
                            <div className="flex items-center gap-4 bg-slate-100 dark:bg-slate-900/50 p-1 rounded-2xl">
                                <button onClick={() => updateFamily(-1)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-white dark:bg-slate-800 shadow-sm text-primary font-black">-</button>
                                <span className="font-black text-lg min-w-[1.5rem] text-center">{familySize}</span>
                                <button onClick={() => updateFamily(1)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-white dark:bg-slate-800 shadow-sm text-primary font-black">+</button>
                            </div>
                        </div>

                        <div>
                            <p className="font-bold text-sm mb-3">הגדרות תזונה</p>
                            <div className="flex flex-wrap gap-2">
                                {['כשר', 'טבעוני', 'צמחוני', 'ללא גלוטן', 'ללא לקטוז'].map(tag => (
                                    <button
                                        key={tag}
                                        onClick={() => toggleDietary(tag)}
                                        className={`px-4 py-2 rounded-2xl text-xs font-bold border transition-all ${dietaryTags.includes(tag)
                                            ? 'bg-primary text-white border-primary shadow-lg scale-105'
                                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600'
                                            }`}
                                    >
                                        {tag}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Appearance Section */}
                <section className="space-y-4">
                    <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                        <Palette className="w-4 h-4" /> מראה ואווירה
                    </h2>

                    <div className="bg-card glass rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
                        {/* Theme Select */}
                        <div>
                            <label className="block text-sm font-bold mb-3">מצב תצוגה</label>
                            <div className="grid grid-cols-3 gap-2 bg-slate-100 dark:bg-slate-900/50 p-1 rounded-2xl">
                                {[
                                    { id: "light", label: "בהיר", icon: Sun },
                                    { id: "dark", label: "כהה", icon: Moon },
                                    { id: "system", label: "מערכת", icon: Monitor },
                                ].map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => setTheme(item.id as any)}
                                        className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${theme === item.id
                                            ? "bg-white dark:bg-slate-800 shadow-md text-primary"
                                            : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                                            }`}
                                    >
                                        <item.icon className="w-4 h-4" />
                                        {item.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Language Select */}
                        <div>
                            <label className="block text-sm font-bold mb-3">שפת ממשק / Language</label>
                            <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-900/50 p-1 rounded-2xl">
                                {[
                                    { id: "he", label: "עברית (Hebrew)" },
                                    { id: "en", label: "English" },
                                ].map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => updateLanguage(item.id)}
                                        className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${language === item.id
                                            ? "bg-white dark:bg-slate-800 shadow-md text-primary"
                                            : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                                            }`}
                                    >
                                        {item.label}
                                    </button>
                                ))}
                            </div>
                            <p className="text-[10px] text-slate-500 mt-2 font-bold pr-1">
                                (תרגום מלא של הממשק יתווסף בהמשך הפיתוח)
                            </p>
                        </div>

                        {/* Color Theme Picker */}
                        <div>
                            <label className="block text-sm font-bold mb-3">צבע מותג</label>
                            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                                {THEMES.map((t) => (
                                    <button
                                        key={t.id}
                                        onClick={() => setColorTheme(t.id as any)}
                                        className="flex flex-col items-center gap-2"
                                    >
                                        <div
                                            className="w-10 h-10 rounded-full flex items-center justify-center relative transition-transform active:scale-90"
                                            style={{ backgroundColor: t.color }}
                                        >
                                            {colorTheme === t.id && (
                                                <motion.div
                                                    layoutId="activeColor"
                                                    className="absolute inset-0 border-4 border-white dark:border-slate-800 rounded-full shadow-lg"
                                                />
                                            )}
                                            {colorTheme === t.id && <Check className="w-5 h-5 text-white z-10" />}
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-500">{t.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Info/Logout Button */}
                <div className="pt-4">
                    <button className="w-full py-4 rounded-3xl bg-rose-500/10 text-rose-500 font-black hover:bg-rose-500/20 transition-all active:scale-[0.98]">
                        התנתק מהמערכת
                    </button>
                    <p className="text-center text-[10px] text-slate-400 mt-4 font-bold uppercase tracking-widest">
                        גרסה 2.1.0 • Smart Pantry AI
                    </p>
                </div>
            </main>
        </div>
    );
}

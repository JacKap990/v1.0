"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ScanLine, ListChecks, Brain, X, ChevronLeft, ChevronRight, Check } from "lucide-react";

const TOUR_STEPS = [
    {
        id: "welcome",
        title: "ברוכים הבאים למזווה החכם! 🎉",
        description: "המערכת שתיקח את ניהול המטבח שלך צעד אחד קדימה. בואו נראה איך זה עובד.",
        icon: <Sparkles className="w-12 h-12 text-indigo-500" />,
        color: "from-indigo-500 to-purple-500"
    },
    {
        id: "inventory",
        title: "ניהול מלאי ורשימות",
        description: "כל המוצרים שלך במקום אחד. המערכת תתריע כשיחסר משהו ותוסיף אוטומטית לרשימת הקניות שלך.",
        icon: <ListChecks className="w-12 h-12 text-emerald-500" />,
        color: "from-emerald-500 to-teal-500"
    },
    {
        id: "scanner",
        title: "סריקה חכמה ומהירה",
        description: "אין צורך להקליד! פשוט סרקו את הברקוד של המוצר להוספה מיידית למלאי או לרשימה.",
        icon: <ScanLine className="w-12 h-12 text-blue-500" />,
        color: "from-blue-500 to-cyan-500"
    },
    {
        id: "ai",
        title: "מנוע בינה מלאכותית",
        description: "המערכת לומדת את הרגלי הצריכה שלך, מסווגת מוצרים אוטומטית וממליצה על מתכונים.",
        icon: <Brain className="w-12 h-12 text-rose-500" />,
        color: "from-rose-500 to-orange-500"
    }
];

export function OnboardingTour() {
    const [isVisible, setIsVisible] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);

    useEffect(() => {
        // Check local storage to see if user has seen the tour
        const hasSeenTour = localStorage.getItem("hasSeenTour");
        if (!hasSeenTour) {
            // Small delay for better UX
            const timer = setTimeout(() => setIsVisible(true), 1500);
            return () => clearTimeout(timer);
        }
    }, []);

    const finishTour = () => {
        localStorage.setItem("hasSeenTour", "true");
        setIsVisible(false);
    };

    const nextStep = () => {
        if (currentStep < TOUR_STEPS.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            finishTour();
        }
    };

    const prevStep = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    };

    if (!isVisible) return null;

    const step = TOUR_STEPS[currentStep];

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
            >
                <div className="absolute inset-0" onClick={finishTour} />

                <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-[32px] overflow-hidden shadow-2xl z-10 border border-slate-200 dark:border-slate-800"
                >
                    {/* Skip Button */}
                    <button
                        onClick={finishTour}
                        className="absolute top-4 left-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors z-20 bg-slate-100/50 dark:bg-slate-800/50 rounded-full"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    {/* Header Decoration */}
                    <div className={`h-32 w-full bg-gradient-to-br ${step.color} relative overflow-hidden flex items-center justify-center`}>
                        <div className="absolute inset-0 bg-black/10 mix-blend-overlay" />
                        <div className="absolute w-64 h-64 bg-white/20 blur-3xl rounded-full -top-10 -right-10" />

                        <motion.div
                            initial={{ scale: 0, rotate: -45 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: "spring", delay: 0.1 }}
                            className="bg-white p-4 rounded-3xl shadow-lg transform rotate-3 z-10 relative"
                        >
                            {step.icon}
                        </motion.div>
                    </div>

                    {/* Content */}
                    <div className="p-8 text-center">
                        <motion.h2
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-2xl font-black mb-3 text-slate-800 dark:text-slate-100"
                        >
                            {step.title}
                        </motion.h2>
                        <motion.p
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-slate-500 dark:text-slate-400 font-medium text-[15px] leading-relaxed mb-8 h-16"
                        >
                            {step.description}
                        </motion.p>

                        {/* Pagination Dots */}
                        <div className="flex items-center justify-center gap-2 mb-8 direction-ltr">
                            {TOUR_STEPS.map((_, idx) => (
                                <div
                                    key={idx}
                                    className={`h-2 rounded-full transition-all duration-300 ${idx === currentStep ? "w-8 bg-indigo-500" : "w-2 bg-slate-200 dark:bg-slate-700"
                                        }`}
                                />
                            ))}
                        </div>

                        {/* Controls */}
                        <div className="flex items-center justify-between gap-4">
                            <button
                                onClick={prevStep}
                                disabled={currentStep === 0}
                                className={`p-4 rounded-2xl flex items-center justify-center border-2 border-slate-200 dark:border-slate-800 text-slate-500 transition-all ${currentStep === 0 ? "opacity-30 cursor-not-allowed" : "hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95"
                                    }`}
                            >
                                <ChevronRight className="w-6 h-6" /> {/* Right arrow because RTL */}
                            </button>

                            <button
                                onClick={nextStep}
                                className="flex-1 p-4 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-lg flex items-center justify-center gap-2 shadow-[0_8px_24px_rgba(0,0,0,0.15)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.2)] active:scale-95 transition-all"
                            >
                                {currentStep === TOUR_STEPS.length - 1 ? (
                                    <>
                                        בואו נתחיל! <Check className="w-5 h-5" />
                                    </>
                                ) : (
                                    <>
                                        הבא <ChevronLeft className="w-5 h-5" />
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

"use client";
export const runtime = 'edge';


import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Html5Qrcode } from "html5-qrcode";
import { Scan, X, PackageOpen, Plus, Loader2, BrainCircuit } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { ReceiptScannerModal } from "@/components/ReceiptScannerModal";
import { addItemToInventory } from "@/app/actions/inventory";
import { getShoppingLists, addShoppingListItem } from "@/app/actions/lists";

export default function ScanPage() {
    const router = useRouter();
    const [isScanning, setIsScanning] = useState(false);
    const [scanResult, setScanResult] = useState<string | null>(null);
    const [productData, setProductData] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isOcrOpen, setIsOcrOpen] = useState(false);

    // Routing state
    const [shoppingLists, setShoppingLists] = useState<any[]>([]);
    const [destination, setDestination] = useState<string>("pantry"); // 'pantry' or listId

    // Fetch lists on mount
    useEffect(() => {
        getShoppingLists().then(lists => setShoppingLists(lists)).catch(console.error);
    }, []);

    const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

    // Initialize Scanner
    useEffect(() => {
        html5QrCodeRef.current = new Html5Qrcode("reader");

        const startScanner = async () => {
            try {
                await html5QrCodeRef.current?.start(
                    { facingMode: "environment" },
                    {
                        fps: 10,
                        qrbox: { width: 250, height: 250 },
                        aspectRatio: 1.0,
                    },
                    (decodedText) => {
                        // On Success
                        handleScanSuccess(decodedText);
                    },
                    (errorMessage) => {
                        // Ignore normal non-matching frames
                    }
                );
                setIsScanning(true);
            } catch (err) {
                console.error("Camera error:", err);
            }
        };

        startScanner();

        // Cleanup on unmount
        return () => {
            if (html5QrCodeRef.current?.isScanning) {
                html5QrCodeRef.current.stop().catch(console.error);
            }
        };
    }, []);

    const handleScanSuccess = async (barcode: string) => {
        // Prevent multiple triggers
        if (scanResult === barcode) return;

        if (html5QrCodeRef.current?.isScanning) {
            await html5QrCodeRef.current.pause(); // Pause camera while reviewing
        }

        setScanResult(barcode);
        setIsLoading(true);

        // Play beep sound (like legacy app)
        try {
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
            audio.play().catch(e => console.log('Audio blocked by browser policy'));
        } catch (e) { }

        // Fetch product from 13MB Israeli products Database Backend
        try {
            const res = await fetch(`/api/lookup?barcode=${barcode}`);
            if (!res.ok) {
                // Product not in DB
                setIsLoading(false);
                setProductData(null);
                return;
            }

            const data = await res.json();
            setIsLoading(false);
            setProductData({
                name: data.name,
                category: data.category || "other",
                image: data.image || null,
            });

        } catch (err) {
            setIsLoading(false);
            setProductData(null);
        }
    };

    const resumeScanning = async () => {
        setScanResult(null);
        setProductData(null);
        setDestination("pantry"); // Reset destination
        if (html5QrCodeRef.current?.getState() === 2) { // 2 = PAUSED
            await html5QrCodeRef.current.resume();
        }
    };

    const handleSave = async () => {
        if (!productData) return;
        setIsSaving(true);
        try {
            if (destination === "pantry") {
                await addItemToInventory({
                    name: productData.name,
                    category: productData.category,
                    barcode: scanResult || undefined,
                    remoteImage: productData.image,
                    quantity: 1,
                    unit: "יחידות"
                });
            } else {
                // It's a shopping list ID
                await addShoppingListItem(
                    destination,
                    productData.name,
                    "📦", // Default emoji since image might not be supported in lists
                    productData.image,
                    productData.category
                );
            }
            // Show success and clear
            setIsSaving(false);
            resumeScanning();
        } catch (error) {
            console.error("Failed to add item:", error);
            setIsSaving(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-black relative">

            {/* Scanner Header */}
            <div className="absolute top-0 left-0 right-0 p-4 z-20 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
                <button
                    onClick={() => router.back()}
                    className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white"
                >
                    <X className="w-6 h-6" />
                </button>
                <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-full text-white font-medium text-sm flex gap-2">
                    <Scan className="w-5 h-5" /> ברקוד ומק"ט
                </div>
            </div>

            {/* Camera Viewport */}
            <div className="flex-1 relative overflow-hidden flex items-center justify-center">
                <div id="reader" className="w-full h-full object-cover"></div>

                {/* Target Overlay */}
                {!scanResult && (
                    <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                        <div className="w-64 h-64 border-2 border-white/50 rounded-3xl relative">
                            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-3xl"></div>
                            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-3xl"></div>
                            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-3xl"></div>
                            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-3xl"></div>

                            {/* Scanning Laser Animation */}
                            <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-green-500 shadow-[0_0_8px_2px_rgba(34,197,94,0.6)] animate-scan"></div>
                        </div>
                        <p className="mt-8 text-white font-medium opacity-80 backdrop-blur-sm bg-black/20 px-4 py-1 rounded-full">
                            כוון לברקוד על גבי האריזה
                        </p>

                        <button
                            onClick={() => {
                                if (html5QrCodeRef.current?.isScanning) html5QrCodeRef.current.pause();
                                setIsOcrOpen(true);
                            }}
                            className="mt-6 pointer-events-auto bg-gradient-to-r from-indigo-500/80 to-violet-500/80 hover:from-indigo-600/90 hover:to-violet-600/90 backdrop-blur-md px-6 py-3 rounded-full text-white font-bold flex items-center gap-2 border border-white/20 transition-all shadow-[0_0_15px_rgba(99,102,241,0.5)]"
                        >
                            <BrainCircuit className="w-5 h-5 shadow-sm" />
                            סרוק קבלה חכמה (AI)
                        </button>
                    </div>
                )}
            </div>

            {/* Result Modal Overlay */}
            {scanResult && (
                <div className="absolute inset-0 z-30 bg-black/40 backdrop-blur-sm flex items-end animate-in fade-in duration-200">
                    <div className="bg-white w-full rounded-t-3xl p-6 shadow-2xl animate-in slide-in-from-bottom duration-300">

                        {isLoading ? (
                            <div className="flex flex-col items-center p-8 gap-4">
                                <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
                                <p className="text-gray-500 font-medium">מאתר מוצר במאגר...</p>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center text-center">
                                {productData?.image ? (
                                    <div className="w-24 h-24 mb-4 rounded-2xl border-4 border-indigo-100 overflow-hidden shadow-lg">
                                        <img src={productData.image} alt="Product" className="w-full h-full object-cover" />
                                    </div>
                                ) : (
                                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-indigo-500">
                                        <PackageOpen className="w-10 h-10" />
                                    </div>
                                )}

                                <h3 className="text-xl font-bold text-gray-800 mb-1">{productData?.name || "מוצר לא מוכר"}</h3>
                                <p className="text-gray-400 font-mono text-sm bg-gray-50 px-3 py-1 rounded-lg mb-4">{scanResult}</p>

                                <div className="w-full mb-6">
                                    <label className="block text-right text-sm font-medium text-slate-700 mb-2">לאן להוסיף את המוצר?</label>
                                    <select
                                        value={destination}
                                        onChange={(e) => setDestination(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl focus:ring-indigo-500 focus:border-indigo-500 block p-3 px-4 transition-all"
                                        dir="rtl"
                                    >
                                        <option value="pantry" className="font-bold">🏠 למזווה שלי (מלאי)</option>
                                        {shoppingLists.length > 0 && (
                                            <optgroup label="רשימות קניות:">
                                                {shoppingLists.map(list => (
                                                    <option key={list.id} value={list.id}>
                                                        {list.icon} {list.name}
                                                    </option>
                                                ))}
                                            </optgroup>
                                        )}
                                    </select>
                                </div>

                                <div className="w-full flex gap-3">
                                    <button
                                        onClick={handleSave}
                                        disabled={isSaving}
                                        className="flex-1 bg-gradient-to-r from-indigo-600 to-violet-600 text-white p-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-md disabled:opacity-50"
                                    >
                                        {isSaving ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <Plus className="w-5 h-5" />
                                        )}
                                        {isSaving ? "שומר..." : "שמור לשם"}
                                    </button>
                                    <button
                                        onClick={resumeScanning}
                                        className="px-6 bg-gray-100 text-gray-700 p-4 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                                    >
                                        בטל
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <ReceiptScannerModal
                isOpen={isOcrOpen}
                onClose={async () => {
                    setIsOcrOpen(false);
                    if (html5QrCodeRef.current?.getState() === 2) {
                        await html5QrCodeRef.current.resume();
                    }
                }}
            />
        </div>
    );
}

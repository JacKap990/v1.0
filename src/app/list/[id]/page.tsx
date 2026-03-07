"use client";
export const runtime = 'edge';


import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { GlassCard } from "@/components/ui/GlassCard";
import { FAB } from "@/components/ui/FAB";
import {
    Check,
    ArrowRight,
    Save,
    Trash2,
    Edit2,
    Minus,
    Plus,
    ShoppingCart,
    CheckCircle,
    Search,
    ShoppingBag,
    Sparkles
} from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";
import {
    getShoppingListById,
    addShoppingListItem,
    toggleListItemChecked,
    finishShoppingRoute,
    updateItemQuantity,
    updateShoppingListItemDetails,
    deleteShoppingListItem
} from "../../actions/lists";
import { getInventory } from "@/app/actions/inventory";
import { isRunningLow } from "@/lib/consumption";
import { ProductSearchModal } from "@/components/ProductSearchModal";
import { EditProductModal } from "@/components/EditProductModal";
import { ProductDetailModal } from "@/components/ProductDetailModal";
import { updateShoppingListItemFull, deleteMultipleShoppingListItems } from "@/app/actions/lists-edit";
import { useToast } from "@/components/ui/Toast";
import { BulkActionBar } from "@/components/BulkActionBar";
import { CheckSquare, Square } from "lucide-react";
import { SwipeableCard } from "@/components/SwipeableCard";
import { InventoryItemCard } from "@/components/InventoryItemCard";
import { SmartQtyModal } from "@/components/SmartQtyModal";
import { smartSearch, smartSearchScore } from "@/lib/searchUtils";
import { getCategoryLabel } from "@/lib/localization";
import { useLanguage } from "@/components/LanguageProvider";

export default function ShoppingListDetail() {
    const { id } = useParams();
    const router = useRouter();
    const { status } = useSession();
    const { showToast } = useToast();
    const { t, language } = useLanguage();

    const [list, setList] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [finishing, setFinishing] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    // Add Item Modal
    const [showAddMenu, setShowAddMenu] = useState(false);
    const [itemToEdit, setItemToEdit] = useState<any>(null);

    // Bulk Selection State
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const isSelectMode = selectedIds.length > 0;

    const [itemForQty, setItemForQty] = useState<any>(null);

    const [recommendations, setRecommendations] = useState<any[]>([]); // New state

    const loadList = async () => {
        setLoading(true);
        const [data, inventory] = await Promise.all([
            getShoppingListById(id as string),
            getInventory()
        ]);

        if (!data) {
            router.push("/");
            return;
        }

        setList(data);

        // Generate recommendations: items running low in inventory NOT in the current list
        if (inventory && data) {
            const listNames = new Set(data.items.map((i: any) => i.name.toLowerCase()));
            const recs = inventory.filter((i: any) =>
                isRunningLow(i.updatedAt, i.quantity, (i as any).consumptionRate) &&
                !listNames.has(i.name.toLowerCase())
            );
            setRecommendations(recs);
        }

        setLoading(false);
    };

    useEffect(() => {
        if (status === "authenticated") {
            loadList();
        }

        const handleGlobalPlus = () => setShowAddMenu(true);
        window.addEventListener("open-product-search", handleGlobalPlus);
        return () => window.removeEventListener("open-product-search", handleGlobalPlus);
    }, [status, id]);

    const handleToggle = async (itemId: string, isChecked: boolean) => {
        setList((prev: any) => ({
            ...prev,
            items: prev.items.map((i: any) => i.id === itemId ? { ...i, isChecked } : i)
        }));
        await toggleListItemChecked(itemId, isChecked, id as string);
    };

    const handleAddItem = async (product: { name: string; category?: string; emoji?: string; remoteImage?: string; manufacturer?: string; brand?: string; }) => {
        setShowAddMenu(false);

        // Add item optimistically
        const tempId = `temp-${Date.now()}`;
        const tempItem = {
            id: tempId,
            name: product.name,
            emoji: product.emoji || "📦",
            quantity: 1,
            unit: "יח'",
            isChecked: false,
            category: product.category || "other",
            imageUrl: product.remoteImage,
            manufacturer: product.manufacturer,
            brand: product.brand
        };

        setList((prev: any) => ({
            ...prev,
            items: [tempItem, ...prev.items]
        }));

        const res = await addShoppingListItem(id as string, product.name, product.emoji, product.remoteImage, product.category, product.manufacturer, product.brand);
        if (res.success && res.item) {
            setList((prev: any) => ({
                ...prev,
                items: prev.items.map((i: any) => i.id === tempId ? res.item : i)
            }));
            showToast(t("item_added_success").replace("{name}", product.name), "success");
        } else {
            showToast(t("error_adding_item"), "error");
        }
    };

    const reloadData = async () => {
        const data = await getShoppingListById(id as string);
        setList(data);
    };

    const handleEditSave = async (itemId: string, data: { name: string; emoji: string; quantity: number; unit: string; expiryDate: Date | null }) => {
        // Optimistic UI update
        setList((prev: any) => ({
            ...prev,
            items: prev.items.map((i: any) => i.id === itemId ? { ...i, ...data } : i)
        }));

        const res = await updateShoppingListItemFull(itemId, data);
        if (res.success) {
            showToast(t("save_success"), "success");
        } else {
            showToast(t("error_saving"), "error");
        }
    };

    const handleFinishShopping = async () => {
        setFinishing(true);
        const res = await finishShoppingRoute(id as string);
        if (res.success) {
            // Remove checked items
            setList((prev: any) => ({
                ...prev,
                items: prev.items.filter((i: any) => !i.isChecked)
            }));
            showToast(t("shopping_finished_success").replace("{count}", (res.count || 0).toString()), "success");
        } else {
            showToast(t("error_saving"), "error");
        }
        setFinishing(false);
    };

    const handleEditDelete = async (itemId: string) => {
        const itemToDelete = list.items.find((i: any) => i.id === itemId);
        if (!itemToDelete) return;

        // Optimistic
        setList((prev: any) => ({
            ...prev,
            items: prev.items.filter((i: any) => i.id !== itemId)
        }));

        const res = await deleteShoppingListItem(itemId, id as string);
        if (res.success) {
            showToast(t("item_deleted_info").replace("{name}", itemToDelete.name), "info");
        } else {
            showToast(t("error_deleting_item"), "error");
        }
    };

    const toggleSelection = (itemId: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        if (selectedIds.includes(itemId)) {
            setSelectedIds(selectedIds.filter(selId => selId !== itemId));
        } else {
            setSelectedIds([...selectedIds, itemId]);
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;
        const confirmDelete = confirm(t("confirm_delete_multiple_items").replace("{count}", selectedIds.length.toString()));
        if (!confirmDelete) return;

        // Optimistic update
        setList((prev: any) => ({
            ...prev,
            items: prev.items.filter((item: any) => !selectedIds.includes(item.id))
        }));

        const idsToDelete = [...selectedIds];
        setSelectedIds([]);

        const res = await deleteMultipleShoppingListItems(idsToDelete);
        if (res.success) {
            showToast(t("items_deleted_success"), "info");
        } else {
            showToast(t("error_deleting_item"), "error");
            reloadData();
        }
    };

    if (status === "loading" || loading || !list) {
        return (
            <div className="flex items-center justify-center p-12 h-screen">
                <div className="w-8 h-8 border-4 border-[#4A00E0]/30 border-t-[#4A00E0] rounded-full animate-spin" />
            </div>
        );
    }

    const pendingItems = list.items.filter((i: any) => !i.isChecked);
    const completedItems = list.items.filter((i: any) => i.isChecked);

    return (
        <div className="p-6 relative min-h-screen bg-slate-50">
            <div className="flex items-center gap-3 mb-6 pt-2">
                <button onClick={() => router.push("/lists")} className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm border border-slate-200 hover:bg-slate-50 active:scale-95 transition-all">
                    <ArrowRight className="w-5 h-5 text-slate-800" />
                </button>
                <div className="flex-1 flex items-center justify-between">
                    <div className="flex flex-col">
                        <h2 className={`text-xl font-black flex items-center gap-2 ${list.type === 'ai' || list.name.includes('AI')
                            ? 'text-violet-700'
                            : 'bg-gradient-to-r from-indigo-700 to-violet-700 bg-clip-text text-transparent'
                            }`}>
                            <span>{list.type === 'ai' || list.name.includes('AI') ? "🤖" : list.icon}</span> {list.name}
                        </h2>
                        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-0.5">
                            {pendingItems.length} {t("items_remaining")} ({t("out_of")} {list.items.length})
                        </p>
                    </div>
                    <button
                        onClick={() => {
                            if (isSelectMode) setSelectedIds([]);
                            else setSelectedIds([list.items[0]?.id].filter(Boolean));
                        }}
                        className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all ${isSelectMode ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-indigo-600 border border-indigo-100 shadow-sm'}`}
                    >
                        {isSelectMode ? t("cancel_selection") : t("multi_select")}
                    </button>
                </div>
            </div>

            {/* Smart Search Bar */}
            <div className="relative group mb-6">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                <input
                    type="text"
                    placeholder={t("search_placeholder_list")}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl py-3 pr-10 pl-4 text-sm text-slate-800 focus:outline-none focus:border-indigo-400 transition-all shadow-sm font-bold"
                />
            </div>

            <div className="flex flex-col gap-3 pb-40">
                {/* Pending Items */}
                {pendingItems
                    .filter((item: any) => smartSearch(searchQuery, item.name))
                    .sort((a: any, b: any) => {
                        if (!searchQuery) return 0;
                        return smartSearchScore(searchQuery, b.name) - smartSearchScore(searchQuery, a.name);
                    })
                    .map((item: any) => (
                        <SwipeableCard
                            key={item.id}
                            leftAction={{
                                icon: Check,
                                label: t("check"),
                                bgColor: "bg-emerald-500",
                                onClick: () => handleToggle(item.id, !item.isChecked)
                            }}
                            rightAction={{
                                icon: Trash2,
                                label: t("delete"),
                                bgColor: "bg-rose-500",
                                onClick: () => handleEditDelete(item.id)
                            }}
                            disabled={isSelectMode}
                        >
                            <div className="flex items-center gap-2">
                                {/* Checkbox Area */}
                                <div className="flex flex-col gap-2 shrink-0">
                                    {isSelectMode ? (
                                        <button onClick={(e) => toggleSelection(item.id, e)} className="p-2 text-indigo-500">
                                            {selectedIds.includes(item.id) ? <CheckSquare className="w-6 h-6" /> : <Square className="w-6 h-6 text-slate-300" />}
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleToggle(item.id, !item.isChecked)}
                                            className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all border-slate-300 hover:border-indigo-500 hover:bg-emerald-50 text-transparent`}
                                        >
                                            <Check className="w-4 h-4" strokeWidth={3} />
                                        </button>
                                    )}
                                </div>

                                <div className="flex-1 relative group/card">
                                    <InventoryItemCard
                                        item={{
                                            ...item,
                                            updatedAt: new Date().toISOString(),
                                            brand: item.brand,
                                            manufacturer: item.manufacturer,
                                            kosher: item.kosher,
                                            imageUrl: item.imageUrl
                                        }}
                                        isChecked={item.isChecked}
                                        onEdit={() => {
                                            if (isSelectMode) toggleSelection(item.id);
                                            else setItemToEdit(item);
                                        }}
                                        onQuantityClick={(it) => setItemForQty(it)}
                                        showStatus={false}
                                    />
                                </div>
                            </div>
                        </SwipeableCard>
                    ))}

                {/* Recommendations */}
                {recommendations.length > 0 && (
                    <div className="mb-8 space-y-4 px-1">
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-amber-500 fill-amber-500" />
                            <h3 className="font-black text-slate-800 text-sm uppercase tracking-wider">{t("smart_suggestions")}</h3>
                        </div>
                        <div className="flex gap-4 overflow-x-auto pb-4 scroll-smooth no-scrollbar">
                            {recommendations.map((rec) => (
                                <motion.div
                                    key={rec.id}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="min-w-[140px] bg-white rounded-3xl p-4 border border-amber-100 shadow-sm flex flex-col items-center text-center gap-2 relative group"
                                >
                                    <div className="text-3xl mb-1">{rec.emoji || "📦"}</div>
                                    <h4 className="font-bold text-xs text-slate-800 line-clamp-1">{rec.name}</h4>
                                    <p className="text-[10px] font-bold text-amber-600 uppercase tracking-tighter">{t("running_low")}</p>
                                    <button
                                        onClick={() => handleAddItem({ name: rec.name, emoji: rec.emoji, category: rec.category })}
                                        className="mt-2 w-full bg-slate-900 text-white py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all"
                                    >
                                        + {t("add")}
                                    </button>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {list.items.length === 0 && (
                    <div className="text-center py-20 bg-white/50 rounded-[32px] border border-dashed border-slate-200">
                        <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-4 opacity-50" />
                        <p className="font-black text-slate-400">{t("list_is_empty")}</p>
                        <p className="text-xs text-slate-400 mt-1">{t("add_items_to_start")}</p>
                    </div>
                )}

                {/* Completed Items Section */}
                {completedItems.length > 0 && (
                    <div className="mt-8 border-t border-dashed border-slate-300 pt-6">
                        <div className="flex items-center justify-between px-2 mb-4">
                            <span className="text-emerald-600 font-bold text-sm flex items-center gap-1.5"><CheckCircle className="w-4 h-4" /> {t("purchased")} ({completedItems.length})</span>
                        </div>

                        <div className="flex flex-col gap-2 opacity-60">
                            {completedItems.map((item: any) => (
                                <SwipeableCard
                                    key={item.id}
                                    leftAction={{
                                        icon: ShoppingCart,
                                        label: t("shoppingList"),
                                        bgColor: "bg-emerald-500",
                                        onClick: () => handleToggle(item.id, false)
                                    }}
                                    rightAction={{
                                        icon: Trash2,
                                        label: t("delete"),
                                        bgColor: "bg-rose-500",
                                        onClick: () => handleEditDelete(item.id)
                                    }}
                                    disabled={isSelectMode}
                                >
                                    <div className="relative" onClick={() => handleToggle(item.id, false)}>
                                        <div className="absolute inset-0 z-10 bg-white/40 pointer-events-none rounded-2xl" />
                                        <InventoryItemCard
                                            item={{
                                                ...item,
                                                updatedAt: new Date(),
                                            }}
                                            isChecked={true}
                                            showStatus={false}
                                        />
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center border border-emerald-200">
                                            <Check className="w-4 h-4" strokeWidth={3} />
                                        </div>
                                    </div>
                                </SwipeableCard>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Smart Add Content Modal */}
            <ProductSearchModal
                isOpen={showAddMenu}
                onClose={() => setShowAddMenu(false)}
                onSelect={handleAddItem}
                title={t("add_to_list")}
            />

            <ProductDetailModal
                isOpen={!!itemToEdit}
                onClose={() => setItemToEdit(null)}
                item={itemToEdit}
                onSave={handleEditSave}
                onDelete={handleEditDelete}
            />

            <BulkActionBar
                selectedIds={selectedIds}
                onClearSelection={() => setSelectedIds([])}
                onDeleteSelected={handleBulkDelete}
            />

            <SmartQtyModal
                isOpen={!!itemForQty}
                onClose={() => setItemForQty(null)}
                item={itemForQty}
                onSave={async (id: string, data: { quantity: number; unit: string }) => {
                    // Update locally optimistically
                    setList((prev: any) => ({
                        ...prev,
                        items: prev.items.map((i: any) => i.id === id ? { ...i, ...data } : i)
                    }));

                    // Update DB
                    const res = await updateShoppingListItemFull(id, {
                        ...itemForQty,
                        quantity: data.quantity,
                        unit: data.unit,
                        name: itemForQty.name,
                        emoji: itemForQty.emoji || "📦",
                        expiryDate: itemForQty.expiryDate || null
                    });

                    if (!res.success) {
                        showToast(t("error_saving"), "error");
                        loadList();
                    }
                    setItemForQty(null);
                }}
            />

            {/* Finish Shopping Button */}
            {completedItems.length > 0 && (
                <div className="fixed bottom-24 left-4 right-4 z-40 max-w-md mx-auto animate-in slide-in-from-bottom-5">
                    <button
                        onClick={handleFinishShopping}
                        disabled={finishing}
                        className={`w-full py-4 rounded-[22px] font-black flex items-center justify-center gap-3 transition-all shadow-lg active:scale-95 ${finishing
                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                            : 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-indigo-200'
                            }`}
                    >
                        {finishing ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <ShoppingCart className="w-5 h-5" />
                                {t("finish_shopping")} ({completedItems.length})
                            </>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
}

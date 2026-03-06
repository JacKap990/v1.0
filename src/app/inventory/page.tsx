"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { GlassCard } from "@/components/ui/GlassCard";
import { FAB } from "@/components/ui/FAB";
import { Package, Plus, Minus, Search, Calendar, Tag, CheckSquare, Square, Sparkles, AlertTriangle, Clock, Trash2, ShoppingCart } from "lucide-react";
import Image from "next/image";
import { getInventory, addInventoryItem, updateInventoryQuantity, deleteInventoryItem, updateInventoryItemDetails, addMultipleItemsToInventory } from "@/app/actions/inventory";
import { updateInventoryItemFull, deleteMultipleInventoryItems } from "@/app/actions/inventory-edit";
import { getShoppingLists, addShoppingListItem, addItemToDefaultList } from "@/app/actions/lists";
import { enrichMissingMetadata } from "@/app/actions/enrichment";
import { ProductSearchModal } from "@/components/ProductSearchModal";
import { ProductDetailModal } from "@/components/ProductDetailModal";
import { useToast } from "@/components/ui/Toast";
import { BulkActionBar } from "@/components/BulkActionBar";
import { SwipeableCard } from "@/components/SwipeableCard";
import { differenceInDays } from "date-fns";
import { getUnitLabel, estimateConversion } from "@/lib/unitConversion";
import { SmartQtyModal } from "../../components/SmartQtyModal";
import { InventoryItemCard } from "@/components/InventoryItemCard";
import { InventorySkeleton } from "@/components/ui/Skeletons";
import { smartSearch, smartSearchScore } from "@/lib/searchUtils";
import { getCategoryLabel } from "@/lib/localization";
import { estimatePercentage } from "@/lib/consumption";
import { useLanguage } from "@/components/LanguageProvider";
// Define the type loosely based on Prisma returns
type InventoryItem = {
    id: string;
    name: string;
    category?: string | null;
    quantity: number;
    unit: string;
    expiryDate: Date | null;
    emoji?: string | null;
    remoteImage?: string | null;
    image?: string | null;
    imageUrl?: string | null;
    barcode?: string | null;
    manufacturer?: string | null;
    brand?: string | null;
    kosher?: string | null;
    packWeight?: number | null;
    packUnit?: string | null;
    baseProductName?: string | null;
};

export default function InventoryPage() {
    const { status } = useSession();
    const { showToast } = useToast();
    const { t, language } = useLanguage();

    const [items, setItems] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddMenu, setShowAddMenu] = useState(false);
    const [itemToEdit, setItemToEdit] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState("");

    // Bulk Selection State
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const isSelectMode = selectedIds.length > 0;

    // Auto Restock
    const [restockItem, setRestockItem] = useState<InventoryItem | null>(null);
    const [itemForQty, setItemForQty] = useState<InventoryItem | null>(null);
    const [shoppingLists, setShoppingLists] = useState<any[]>([]);
    const [targetListId, setTargetListId] = useState<string>("");

    const allLabel = language === "en" ? "All" : "הכל";

    // Categories logic
    const categories = [allLabel, ...Array.from(new Set(items.map(item => getCategoryLabel(item.category))))];
    const [selectedCategory, setSelectedCategory] = useState(allLabel);

    const filteredItems = items.filter(item => {
        const matchesSearch = smartSearch(searchQuery, item.name) ||
            smartSearch(searchQuery, item.category || "");
        const catLabel = getCategoryLabel(item.category);
        const matchesCategory = selectedCategory === allLabel || catLabel === selectedCategory;
        return matchesSearch && matchesCategory;
    }).sort((a, b) => {
        if (!searchQuery) return 0;
        const scoreA = Math.max(smartSearchScore(searchQuery, a.name), smartSearchScore(searchQuery, a.category || ""));
        const scoreB = Math.max(smartSearchScore(searchQuery, b.name), smartSearchScore(searchQuery, b.category || ""));
        return scoreB - scoreA;
    });

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await getInventory();
            setItems(data);
        } catch (error) {
            console.error("Failed to load data:", error);
            showToast(t("error_loading_data"), "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (status === "authenticated") {
            loadData();
        }

        const handleGlobalPlus = () => setShowAddMenu(true);
        window.addEventListener("open-product-search", handleGlobalPlus);

        // Background enrichment
        if (status === "authenticated") {
            enrichMissingMetadata().then(res => {
                if (res.success && res.count && res.count > 0) {
                    loadData(); // Reload if data was enriched
                }
            });
        }

        return () => window.removeEventListener("open-product-search", handleGlobalPlus);
    }, [status]);

    const handleUpdateQuantity = async (id: string, currentQty: number, change: number) => {
        const newQty = Math.max(0, currentQty + change);
        const itemContext = items.find(i => i.id === id);

        // Optimistic UI update
        if (newQty === 0) {
            setItems(items.filter(item => item.id !== id));

            showToast(`הסרת את "${itemContext?.name}"`, "info", async () => {
                // UNDO logic
                if (!itemContext) return;
                const res = await addInventoryItem({
                    name: itemContext.name,
                    quantity: itemContext.quantity, // Restore original quantity
                    unit: itemContext.unit,
                    category: itemContext.category || undefined,
                    emoji: itemContext.emoji || undefined,
                    remoteImage: itemContext.imageUrl || undefined,
                    expiryDate: itemContext.expiryDate || undefined
                });
                if (res.success && res.item) {
                    setItems(prev => [res.item as InventoryItem, ...prev]);
                    showToast("הפעולה בוטלה", "success");
                }
            });

            // Auto Restock Prompt
            if (itemContext) {
                setRestockItem(itemContext);
            }
        } else {
            setItems(items.map(item => item.id === id ? { ...item, quantity: newQty } : item));
        }

        const res = await updateInventoryQuantity(id, newQty);
        if (!res.success) {
            showToast("שגיאה בעדכון המלאי", "error");
        }
    };

    const handleAddItem = async (product: any) => {
        setShowAddMenu(false);

        // Create a temporary item for immediate feedback if needed, 
        // but since we wait for the response, let's just use the real item.
        const res = await addInventoryItem({
            name: product.name,
            quantity: 1,
            unit: product.unit || "יח'",
            category: product.category || "other",
            emoji: product.emoji,
            remoteImage: product.remoteImage || product.image,
            brand: product.brand,
            manufacturer: product.manufacturer,
            kosher: product.kosher,
            packWeight: product.packWeight,
            packUnit: product.packUnit,
            baseProductName: product.baseProductName
        });

        if (res.success && res.item) {
            // Use the real item from the response to avoid ID mismatches
            setItems(prev => {
                // Check if already exists (to avoid duplicates if revalidatePath triggered a refresh)
                if (prev.find(i => i.id === res.item!.id)) return prev;
                return [res.item as InventoryItem, ...prev];
            });
            showToast(t("item_added_success").replace("{name}", product.name), "success");
        } else {
            showToast(t("error_adding_item"), "error");
        }
    };

    const handleDeleteItem = async (id: string) => {
        const res = await deleteInventoryItem(id);
        if (res.success) {
            setItems(items.filter(it => it.id !== id));
            showToast(t("item_deleted_success"), "success");
        } else {
            showToast(t("error_deleting_item"), "error");
        }
    };

    const reloadData = async () => {
        const data = await getInventory();
        setItems(data);
    };

    const handleEditSave = async (id: string, data: any) => {
        // Optimistic UI update
        setItems(items.map(item => item.id === id ? { ...item, ...data } : item));

        const res = await updateInventoryItemFull(id, data);
        if (res.success) {
            showToast(t("save_success"), "success");
        } else {
            showToast(t("error_saving"), "error");
        }
    };

    const handleEditDelete = async (id: string) => {
        const itemToDelete = items.find(i => i.id === id);
        if (!itemToDelete) return;

        // Optimistic
        setItems(items.filter(item => item.id !== id));

        const res = await deleteInventoryItem(id);
        if (res.success) {
            showToast(t("item_deleted_info").replace("{name}", itemToDelete.name), "info", async () => {
                // UNDO logic
                const undoRes = await addInventoryItem({
                    name: itemToDelete.name,
                    quantity: itemToDelete.quantity,
                    unit: itemToDelete.unit,
                    category: itemToDelete.category || undefined,
                    emoji: itemToDelete.emoji || undefined,
                    remoteImage: itemToDelete.imageUrl || undefined,
                    expiryDate: itemToDelete.expiryDate || undefined
                });
                if (undoRes.success && undoRes.item) {
                    setItems(prev => [undoRes.item as InventoryItem, ...prev]);
                    showToast(t("action_undone"), "success");
                }
            });
        } else {
            showToast(t("error_deleting_item"), "error");
        }
    };

    const toggleSelection = (id: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation(); // prevent opening edit modal
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(selId => selId !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;
        if (!confirm(t("confirm_delete_multiple_items").replace("{count}", selectedIds.length.toString()))) return;

        for (const id of selectedIds) {
            await deleteInventoryItem(id);
        }
        setItems(items.filter(it => !selectedIds.includes(it.id)));
        setSelectedIds([]);
        showToast(t("items_deleted_success"), "success");
    };

    const handleBulkReset = async () => {
        if (selectedIds.length === 0) return;
        if (!confirm(t("confirm_reset_multiple_quantities").replace("{count}", selectedIds.length.toString()))) return;

        for (const id of selectedIds) {
            await updateInventoryQuantity(id, 0);
        }
        setItems(items.map(it => selectedIds.includes(it.id) ? { ...it, quantity: 0 } : it));
        setSelectedIds([]);
        showToast(t("quantities_reset_success"), "success");
    };

    const handleBulkMove = async () => {
        if (selectedIds.length === 0) return;
        if (!targetListId) {
            showToast(t("select_shopping_list_first"), "error");
            return;
        }

        const selectedItems = items.filter(it => selectedIds.includes(it.id));
        for (const item of selectedItems) {
            await addShoppingListItem(
                targetListId,
                item.name,
                item.emoji || "📦",
                item.imageUrl || undefined,
                item.category || undefined
            );
        }
        setSelectedIds([]);
        showToast(t("items_moved_to_list_success").replace("{count}", selectedItems.length.toString()), "success");
    };

    const handleBulkRecipeSearch = () => {
        if (selectedIds.length === 0) return;
        const selectedNames = items
            .filter(it => selectedIds.includes(it.id))
            .map(it => it.name)
            .join(",");
        window.location.href = `/recipes?search=${encodeURIComponent(selectedNames)}`;
    };

    const getExpiryBadge = (date: Date | string) => {
        const days = differenceInDays(new Date(date), new Date());
        if (days < 0) {
            return {
                label: t("expired"),
                classes: "bg-rose-50 text-rose-600 border-rose-100",
                icon: <AlertTriangle className="w-3 h-3 text-rose-500" />
            };
        }
        if (days <= 7) {
            return {
                label: t("days_left").replace("{days}", days.toString()),
                classes: "bg-amber-50 text-amber-600 border-amber-100",
                icon: <Clock className="w-3 h-3 text-amber-500" />
            };
        }
        return {
            label: new Date(date).toLocaleDateString(language === "en" ? "en-US" : "he-IL"),
            classes: "bg-emerald-50 text-emerald-600 border-emerald-100",
            icon: <Calendar className="w-3 h-3 text-emerald-500" />
        };
    };

    if (status === "loading" || loading) {
        return <InventorySkeleton />;
    }

    return (
        <div className="min-h-screen w-full max-w-md mx-auto relative pb-20 pt-6 px-4 bg-slate-50">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-700 via-violet-700 to-indigo-600 tracking-tight">
                    {t("my_inventory")}
                </h1>
                <button
                    onClick={() => {
                        if (isSelectMode) setSelectedIds([]);
                        else setSelectedIds([items[0]?.id].filter(Boolean));
                    }}
                    className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all ${isSelectMode ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-indigo-600 border border-indigo-100 shadow-sm'}`}
                >
                    {isSelectMode ? t("cancel_selection") : t("multi_select")}
                </button>
            </div>

            {/* Smart Search Bar */}
            <div className="relative mb-4 group">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                <input
                    type="text"
                    placeholder={t("search_placeholder_inventory")}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-[22px] py-4 pr-12 pl-4 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 transition-all shadow-sm font-medium"
                />
            </div>

            {/* Category Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-4 mb-2 no-scrollbar scroll-smooth">
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all border ${selectedCategory === cat
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20'
                            : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                            }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            <div className="flex flex-col gap-3 pb-24">
                {filteredItems.length === 0 ? (
                    <div className="text-center py-16 text-slate-400 bg-white/50 rounded-[32px] border border-dashed border-slate-200 flex flex-col items-center justify-center">
                        <Package className="w-12 h-12 opacity-10 mb-4" />
                        <p className="font-bold text-lg text-slate-500">{t("empty_pantry")}</p>
                        <p className="text-xs">{t("add_some_items")}</p>
                    </div>
                ) : (
                    filteredItems.map((item) => (
                        <SwipeableCard
                            key={item.id}
                            leftAction={{
                                icon: ShoppingCart,
                                label: t("shoppingList"),
                                bgColor: "bg-emerald-500",
                                onClick: async () => {
                                    await addItemToDefaultList({
                                        name: item.name,
                                        emoji: item.emoji || "📦",
                                        category: item.category || undefined,
                                        unit: item.unit
                                    });
                                    showToast(t("item_moved_to_shopping_list").replace("{name}", item.name), "success");
                                }
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
                                {isSelectMode && (
                                    <div
                                        onClick={() => toggleSelection(item.id)}
                                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${selectedIds.includes(item.id) ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'}`}
                                    >
                                        {selectedIds.includes(item.id) && <CheckSquare className="w-4 h-4 text-white" />}
                                    </div>
                                )}
                                <div className="flex-1">
                                    <InventoryItemCard
                                        item={item as any}
                                        onEdit={() => {
                                            if (isSelectMode) toggleSelection(item.id);
                                            else setItemToEdit(item);
                                        }}
                                        onQuantityClick={(it) => setItemForQty(it as any)}
                                    />
                                </div>
                            </div>
                        </SwipeableCard>
                    ))
                )}
            </div>

            <ProductSearchModal
                isOpen={showAddMenu}
                onClose={() => setShowAddMenu(false)}
                onSelect={handleAddItem}
                title={t("new_inventory_item")}
            />

            {/* Smart Quantity Modal */}
            <SmartQtyModal
                isOpen={itemForQty !== null}
                onClose={() => setItemForQty(null)}
                item={itemForQty}
                onSave={async (id: string, data: { quantity: number; unit: string }) => {
                    // Update locally
                    setItems(items.map(it => it.id === id ? { ...it, ...data } : it));

                    // Update DB - Using updateInventoryItemFull to sync both qty and unit
                    const currentItem = items.find(it => it.id === id);
                    if (currentItem) {
                        await updateInventoryItemFull(id, {
                            ...currentItem,
                            quantity: data.quantity,
                            unit: data.unit,
                            emoji: currentItem.emoji || "📦",
                        });
                    }

                    showToast(t("quantity_updated"), "success");
                }}
            />

            {/* Product Detail Modal */}
            <ProductDetailModal
                isOpen={itemToEdit !== null}
                onClose={() => setItemToEdit(null)}
                item={itemToEdit}
                onSave={handleEditSave}
                onDelete={handleDeleteItem}
            />
            {/* Auto Restock Modal - Deprecated (Swiping adds directly now) */}

            <BulkActionBar
                selectedIds={selectedIds}
                onClearSelection={() => setSelectedIds([])}
                onDeleteSelected={handleBulkDelete}
                onResetSelected={handleBulkReset}
                onMoveSelected={handleBulkMove}
                onRecipeSearch={handleBulkRecipeSearch}
            />
        </div>
    );
}

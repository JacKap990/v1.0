export const runtime = 'edge';
"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import {
  ShoppingBag,
  MoreVertical,
  Plus,
  Copy,
  Trash2,
  Clock,
  Search,
  CheckSquare,
  Sparkles
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getShoppingLists, createShoppingList, deleteShoppingList } from "../actions/lists";
import { duplicateShoppingList } from "../actions/lists-edit";
import { useToast } from "@/components/ui/Toast";
import { smartSearch, smartSearchScore } from "@/lib/searchUtils";

export default function ListsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { showToast } = useToast();
  const [lists, setLists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Add List Modal
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [newListName, setNewListName] = useState("");

  // Context Menu State
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  // Confirm Delete Modal
  const [listToDelete, setListToDelete] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getShoppingLists();
      setLists(data);
    } catch (error) {
      console.error("Failed to load lists", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated") loadData();
  }, [status]);

  const handleAddList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim()) return;

    setShowAddMenu(false);
    const res = await createShoppingList(newListName, "🛒");
    if (res.success && res.list) {
      router.push(`/list/${res.list.id}`);
    }
    setNewListName("");
  };

  const handleDuplicate = async (listId: string) => {
    setMenuOpenId(null);
    const res = await duplicateShoppingList(listId);
    if (res.success) {
      showToast("הרשימה שוכפלה בהצלחה", "success");
      loadData();
    } else {
      showToast("שגיאה בשכפול", "error");
    }
  };

  const confirmDeleteList = (listId: string) => {
    setMenuOpenId(null);
    setListToDelete(listId);
  };

  const executeDeleteList = async () => {
    if (!listToDelete) return;
    const res = await deleteShoppingList(listToDelete);
    if (res.success) {
      showToast("הרשימה נמחקה", "info");
      setLists(lists.filter(l => l.id !== listToDelete));
    } else {
      showToast("שגיאה במחיקה", "error");
    }
    setListToDelete(null);
  };

  const filteredLists = lists.filter(l => smartSearch(searchQuery, l.name)).sort((a, b) => {
    if (!searchQuery) return 0;
    return smartSearchScore(searchQuery, b.name) - smartSearchScore(searchQuery, a.name);
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 pb-32">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black text-slate-900">רשימות קניות</h1>
        <button
          onClick={() => setShowAddMenu(true)}
          className="w-10 h-10 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-200 flex items-center justify-center active:scale-95 transition-all"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {/* Smart Search Bar */}
      <div className="relative group">
        <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
        <input
          type="text"
          placeholder="חפש רשימה..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white border border-slate-200 rounded-2xl py-4 pr-12 pl-4 text-slate-800 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 transition-all shadow-sm font-bold"
        />
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredLists.map((list) => {
          const isAI = list.type === 'ai';
          const isHome = list.type === 'home';

          return (
            <Link href={`/list/${list.id}`} key={list.id}>
              <GlassCard className={`p-5 flex items-center justify-between group relative overflow-hidden active:scale-[0.98] transition-all border-slate-100 ${isAI ? 'bg-gradient-to-br from-violet-50/80 to-indigo-50/50 border-violet-200/50' :
                isHome ? 'bg-gradient-to-br from-emerald-50/80 to-teal-50/50 border-emerald-200/50' : ''
                }`}>

                {/* Decorative background glow */}
                <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full blur-3xl opacity-20 transition-opacity group-hover:opacity-40 ${isAI ? 'bg-violet-400' : isHome ? 'bg-emerald-400' : 'bg-slate-400'
                  }`} />

                <div className="flex items-center gap-4 relative z-10 min-w-0">
                  <div className={`text-3xl w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-inner ${isAI ? 'bg-violet-600/10 text-violet-600 group-hover:bg-violet-600 group-hover:text-white' :
                    isHome ? 'bg-emerald-600/10 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white' :
                      'bg-slate-50 group-hover:bg-indigo-50'
                    }`}>
                    {list.icon || (isAI ? "🤖" : "🛒")}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className={`font-black text-lg truncate ${isAI ? 'text-violet-900' : isHome ? 'text-emerald-900' : 'text-slate-800'
                        }`}>
                        {list.name}
                      </h3>
                      {isAI && (
                        <div className="flex items-center gap-1 bg-violet-600 text-white px-2 py-0.5 rounded-full shadow-lg shadow-violet-200">
                          <Sparkles className="w-2.5 h-2.5" />
                          <span className="text-[8px] font-black uppercase tracking-widest">Smart</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        <Clock className="w-2.5 h-2.5" />
                        {new Date(list.updatedAt).toLocaleDateString("he-IL", { day: '2-digit', month: '2-digit' })}
                      </div>
                      <div className={`text-[10px] font-black px-2.5 py-0.5 rounded-lg border ${isAI ? 'bg-violet-50 text-violet-700 border-violet-100' :
                        isHome ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                          'bg-slate-50 text-slate-500 border-slate-100'
                        }`}>
                        {list.checkedCount}/{list.totalCount} פריטים
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  className="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center hover:bg-indigo-50 hover:text-indigo-600 transition-all relative z-20"
                  onClick={(e) => {
                    e.preventDefault();
                    setMenuOpenId(menuOpenId === list.id ? null : list.id);
                  }}
                >
                  <MoreVertical className="w-5 h-5" />
                </button>

                {/* Dropdown Menu */}
                {menuOpenId === list.id && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={(e) => { e.preventDefault(); setMenuOpenId(null); }}></div>
                    <div className="absolute left-6 top-16 w-36 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                      <button onClick={() => handleDuplicate(list.id)} className="w-full px-4 py-3 text-right text-xs font-black text-slate-700 hover:bg-slate-50 flex items-center gap-2 border-b border-slate-50">
                        <Copy className="w-3.5 h-3.5 text-indigo-500" /> שכפל
                      </button>
                      <button onClick={() => confirmDeleteList(list.id)} className="w-full px-4 py-3 text-right text-xs font-black text-rose-600 hover:bg-rose-50 flex items-center gap-2">
                        <Trash2 className="w-3.5 h-3.5" /> מחק
                      </button>
                    </div>
                  </>
                )}
              </GlassCard>
            </Link>
          );
        })}

        {filteredLists.length === 0 && (
          <div className="py-20 text-center space-y-4">
            <ShoppingBag className="w-16 h-16 text-slate-200 mx-auto" />
            <div>
              <p className="text-slate-400 font-black">לא נמצאו רשימות</p>
              <p className="text-[10px] text-slate-300 font-bold">נסה חיפוש אחר או צור רשימה חדשה</p>
            </div>
          </div>
        )}
      </div>

      {/* Add List Modal */}
      {showAddMenu && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <form onSubmit={handleAddList} className="w-full max-w-md bg-white rounded-[40px] p-8 mb-4 shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center gap-3 mb-6 font-black text-xl text-slate-800">
              <div className="p-2 bg-indigo-50 rounded-xl">
                <ShoppingBag className="w-6 h-6 text-indigo-600" />
              </div>
              יצירת רשימה חדשה
            </div>
            <input
              type="text" autoFocus value={newListName} onChange={(e) => setNewListName(e.target.value)}
              placeholder="שם הרשימה (למשל: סופר פארם)"
              className="w-full bg-slate-50 p-5 rounded-[24px] outline-none mb-6 border border-slate-100 focus:border-indigo-500 transition-all font-bold text-slate-800"
            />
            <div className="flex gap-3">
              <button type="button" onClick={() => setShowAddMenu(false)} className="flex-1 p-5 rounded-[24px] font-black bg-slate-100 text-slate-500">ביטול</button>
              <button type="submit" className="flex-1 p-5 rounded-[24px] font-black bg-indigo-600 text-white shadow-lg shadow-indigo-200">צור רשימה</button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Confirmation */}
      {listToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-white rounded-[32px] p-8 shadow-2xl animate-in fade-in zoom-in-95">
            <h3 className="text-xl font-black text-center text-slate-800 mb-6 font-black">למחוק את הרשימה?</h3>
            <div className="flex gap-4">
              <button onClick={() => setListToDelete(null)} className="flex-1 py-4 bg-slate-50 text-slate-500 font-black rounded-2xl">ביטול</button>
              <button onClick={executeDeleteList} className="flex-1 py-4 bg-rose-600 text-white font-black rounded-2xl shadow-lg shadow-rose-200">מחק</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

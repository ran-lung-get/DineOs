import { useMemo } from "react";
import { supabase } from "../../lib/supabase";
import { getIngredients } from "../../lib/supabase.service";
import { MENU } from "../../constants/menu.data";
import { type MenuItem } from "../../types";
import {
  ChefHat,
  PlusCircle,
  Edit2,
  Trash2,
} from "lucide-react";

interface AdminInventoryViewProps {
  ingredients: any[];
  loading: boolean;
  menuItems: MenuItem[];
  loadingMenuItems: boolean;
  activeSubView: "menu" | "ingredients";
  setActiveSubView: (v: "menu" | "ingredients") => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedCategory: string;
  setSelectedCategory: (c: string) => void;
  showAddForm: boolean;
  setShowAddForm: (s: boolean) => void;
  outOfStockIds: string[];
  toggleStock: (id: string) => void;
  adjustIngredientQty: (id: string, delta: number) => void;
  handleAddIngredientSubmit: (e: React.FormEvent) => void;
  newIngName: string;
  setNewIngName: (n: string) => void;
  newIngQty: string;
  setNewIngQty: (q: string) => void;
  newIngUnit: string;
  setNewIngUnit: (u: string) => void;
  newIngThreshold: string;
  setNewIngThreshold: (t: string) => void;
  editingId: string | null;
  setEditingId: (id: string | null) => void;
  editName: string;
  setEditName: (n: string) => void;
  editQty: string;
  setEditQty: (q: string) => void;
  editUnit: string;
  setEditUnit: (u: string) => void;
  editThreshold: string;
  setEditThreshold: (t: string) => void;
  saveIngredientEdit: (id: string) => void;
  handleRemoveIngredient: (id: string, name: string) => void;
  formatUnitAndQty: (qty: number, unit: string) => string;
  groupedIngredients: {
    meat: any[];
    seafood: any[];
    toppings: any[];
    others: any[];
  };
  setIngredients: React.Dispatch<React.SetStateAction<any[]>>;
}

export function AdminInventoryView({
  ingredients,
  loading,
  menuItems,
  activeSubView,
  setActiveSubView,
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  showAddForm,
  setShowAddForm,
  outOfStockIds,
  toggleStock,
  adjustIngredientQty,
  handleAddIngredientSubmit,
  newIngName,
  setNewIngName,
  newIngQty,
  setNewIngQty,
  newIngUnit,
  setNewIngUnit,
  newIngThreshold,
  setNewIngThreshold,
  editingId,
  setEditingId,
  editName,
  setEditName,
  editQty,
  setEditQty,
  editUnit,
  setEditUnit,
  editThreshold,
  setEditThreshold,
  saveIngredientEdit,
  handleRemoveIngredient,
  formatUnitAndQty,
  groupedIngredients,
  setIngredients,
}: AdminInventoryViewProps) {
  const handleSeedDefaultData = async () => {
    if (!confirm("คุณต้องการนำเข้าวัตถุดิบตั้งต้นสำหรับสาขาหรือไม่?")) return;
    const defaults = [
      { name: "หมูสับ", quantity: 1000, unit: "g", min_threshold: 200 },
      { name: "หมูกรอบ", quantity: 1000, unit: "g", min_threshold: 200 },
      { name: "หมูชิ้น", quantity: 1000, unit: "g", min_threshold: 200 },
      { name: "ไก่สับ", quantity: 1000, unit: "g", min_threshold: 200 },
      { name: "ไก่ต้ม", quantity: 1000, unit: "g", min_threshold: 200 },
      { name: "เนื้อ", quantity: 1000, unit: "g", min_threshold: 200 },
      { name: "หมึก", quantity: 1000, unit: "g", min_threshold: 200 },
      { name: "กุ้ง", quantity: 1000, unit: "g", min_threshold: 200 },
      { name: "หอยลาย", quantity: 1000, unit: "g", min_threshold: 200 },
      { name: "ไข่ไก่", quantity: 100, unit: "pcs", min_threshold: 15 },
      { name: "ไส้กรอก", quantity: 50, unit: "pcs", min_threshold: 10 },
      { name: "กุนเชียง", quantity: 50, unit: "pcs", min_threshold: 10 },
    ];

    try {
      const { error } = await supabase.from("ingredients").insert(defaults);
      if (!error) {
        const fresh = await getIngredients();
        if (fresh) setIngredients(fresh);
      }
    } catch {
      setIngredients(defaults.map((d, idx) => ({ ...d, id: `mock-${idx}` })));
      localStorage.setItem("ran-lung-get-mock-ingredients", JSON.stringify(defaults));
    }
  };

  const toggleIngredientActive = async (id: string, current: boolean) => {
    const nextVal = !current;
    setIngredients((prev: any[]) =>
      prev.map((i) => (i.id === id ? { ...i, is_active: nextVal } : i)),
    );
    try {
      await supabase.from("ingredients").update({ is_active: nextVal }).eq("id", id);
    } catch {}
  };

  const categories = [
    { id: "all", label: "ทั้งหมด" },
    { id: "signature", label: "Signature" },
    { id: "main", label: "อาหารจานเดียว" },
    { id: "noodles", label: "เส้น" },
    { id: "rice", label: "ข้าวผัด" },
    { id: "vegetarian", label: "มังสวิรัติ" },
    { id: "drinks", label: "เครื่องดื่ม" },
    { id: "dessert", label: "ของหวาน" },
  ];

  const filteredMenuItems = useMemo(() => {
    const sourceMenuItems = menuItems.length > 0 ? menuItems : MENU;
    return sourceMenuItems.filter((item: MenuItem) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.desc.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [menuItems, searchQuery, selectedCategory]);

  const renderRow = (item: any) => {
    const isLowStock = Number(item.quantity) <= Number(item.min_threshold);
    const isEditing = editingId === item.id;

    return (
      <tr
        key={item.id}
        className={`hover:bg-slate-50/70 border-b border-slate-100 ${isLowStock ? "bg-red-50/10" : ""}`}
      >
        <td className="py-3 px-4 font-bold text-[#002e47]">
          {isEditing ? (
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded px-2 py-1 font-bold text-xs"
            />
          ) : (
            <span className="flex items-center gap-1.5">
              <span>{item.name}</span>
              {isLowStock && (
                <span className="bg-red-100 text-red-800 text-[8px] font-extrabold uppercase px-1 rounded">
                  เหลือน้อย
                </span>
              )}
            </span>
          )}
        </td>
        <td className="py-3 px-4">
          <button
            onClick={() => toggleIngredientActive(item.id, item.is_active !== false)}
            className={`px-2 py-0.5 rounded text-[10px] font-black tracking-wider ${
              item.is_active !== false
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-slate-100 text-slate-400 border border-slate-200"
            }`}
          >
            {item.is_active !== false ? "🟢 เปิดใช้งาน" : "⚪ ปิดใช้งาน"}
          </button>
        </td>
        <td className="py-3 px-4 font-extrabold">
          {isEditing ? (
            <div className="flex items-center gap-1">
              <input
                type="number"
                value={editQty}
                onChange={(e) => setEditQty(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded w-16 px-2 py-1 font-bold text-xs"
              />
              <select
                value={editUnit}
                onChange={(e) => setEditUnit(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded px-1 py-1 font-bold text-xs"
              >
                <option value="g">g</option>
                <option value="pcs">pcs</option>
                <option value="ml">ml</option>
              </select>
            </div>
          ) : (
            <span className={isLowStock ? "text-red-600 font-black" : "text-[#002e47]"}>
              {formatUnitAndQty(Number(item.quantity), item.unit)}
            </span>
          )}
        </td>
        <td className="py-3 px-4 text-slate-500 font-semibold">
          {isEditing ? (
            <input
              type="number"
              value={editThreshold}
              onChange={(e) => setEditThreshold(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded w-16 px-2 py-1 font-bold text-xs"
            />
          ) : (
            <span>{formatUnitAndQty(Number(item.min_threshold), item.unit)}</span>
          )}
        </td>
        <td className="py-3 px-4 text-right space-x-1.5">
          {isEditing ? (
            <div className="inline-flex gap-1">
              <button
                onClick={() => saveIngredientEdit(item.id)}
                className="px-2 py-1 rounded bg-emerald-600 text-white font-bold text-[10px]"
              >
                บันทึก
              </button>
              <button
                onClick={() => setEditingId(null)}
                className="px-2 py-1 rounded bg-slate-200 text-[#5a6e7a] font-bold text-[10px]"
              >
                ยกเลิก
              </button>
            </div>
          ) : (
            <div className="inline-flex gap-1 items-center justify-end">
              <button
                onClick={() => adjustIngredientQty(item.id, 500)}
                className="bg-slate-100 hover:bg-slate-200 text-[#002e47] border px-1.5 py-0.5 rounded text-[10px] font-black cursor-pointer"
                title="เติมสต็อก +500g"
              >
                +500
              </button>
              <button
                onClick={() => {
                  setEditingId(item.id);
                  setEditName(item.name);
                  setEditQty(item.quantity.toString());
                  setEditUnit(item.unit);
                  setEditThreshold(item.min_threshold.toString());
                }}
                className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-[#002e47] cursor-pointer"
              >
                <Edit2 size={12} />
              </button>
              <button
                onClick={() => handleRemoveIngredient(item.id, item.name)}
                className="p-1 hover:bg-red-50 rounded text-slate-400 hover:text-red-600 cursor-pointer"
              >
                <Trash2 size={12} />
              </button>
            </div>
          )}
        </td>
      </tr>
    );
  };

  return (
    <div className="space-y-6">
      {/* Filters Bar */}
      <div className="bg-white border border-[#ece4d6] rounded-3xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-black text-[#002e47]">จัดการคลังร้านค้า:</h2>
            <select
              value={activeSubView}
              onChange={(e) => setActiveSubView(e.target.value as any)}
              className="bg-white border border-[#ece4d6] rounded-xl px-3 py-1.5 text-sm font-bold text-[#002e47] focus:outline-none shadow-sm cursor-pointer"
            >
              <option value="menu">เปิด-ปิด เมนูอาหารขายหน้าร้าน</option>
              <option value="ingredients">จัดการคลังวัตถุดิบ (Ingredients)</option>
            </select>
          </div>

          {activeSubView === "menu" ? (
            <div className="relative max-w-md w-full">
              <input
                type="text"
                placeholder="ค้นหาเมนู..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#fcfbf9] border border-[#ece4d6] rounded-2xl px-4 py-2.5 text-sm font-bold text-[#002e47] placeholder-[#5a6e7a]/50 focus:outline-none transition shadow-inner"
              />
            </div>
          ) : (
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="inline-flex items-center gap-2 bg-[#002e47] text-white px-4 py-2.5 rounded-2xl font-bold text-xs tracking-wider transition hover:bg-[#004165] shadow-md cursor-pointer"
            >
              <PlusCircle size={15} />
              {showAddForm ? "ปิดฟอร์ม" : "เพิ่มวัตถุดิบใหม่"}
            </button>
          )}
        </div>

        {activeSubView === "menu" && (
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs tracking-wider transition cursor-pointer ${
                  selectedCategory === cat.id
                    ? "bg-[#002e47] text-white shadow-inner"
                    : "bg-slate-100 text-[#5a6e7a] hover:bg-slate-200"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Add Ingredient Form */}
      {activeSubView === "ingredients" && showAddForm && (
        <form
          onSubmit={handleAddIngredientSubmit}
          className="bg-white border border-[#ece4d6] rounded-3xl p-5 sm:p-6 shadow-sm space-y-4"
        >
          <h3 className="text-sm font-black text-[#002e47]">นำวัตถุดิบใหม่เข้าคลังสต็อก</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-[#5a6e7a] uppercase mb-1.5">
                ชื่อวัตถุดิบ
              </label>
              <input
                type="text"
                placeholder="เช่น หมูสับ, คะน้า"
                value={newIngName}
                onChange={(e) => setNewIngName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-[#002e47]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#5a6e7a] uppercase mb-1.5">
                จำนวนเริ่มต้น
              </label>
              <input
                type="number"
                placeholder="เช่น 1000"
                value={newIngQty}
                onChange={(e) => setNewIngQty(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-[#002e47]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#5a6e7a] uppercase mb-1.5">
                หน่วยนับ
              </label>
              <select
                value={newIngUnit}
                onChange={(e) => setNewIngUnit(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-[#002e47]"
              >
                <option value="g">กรัม (g)</option>
                <option value="pcs">ชิ้น/ฟอง (pcs)</option>
                <option value="ml">มิลลิลิตร (ml)</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#5a6e7a] uppercase mb-1.5">
                เตือนเมื่อเหลือน้อยกว่า
              </label>
              <input
                type="number"
                placeholder="เช่น 200"
                value={newIngThreshold}
                onChange={(e) => setNewIngThreshold(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-[#002e47]"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="bg-slate-100 text-[#5a6e7a] px-4 py-2 rounded-xl font-bold text-xs cursor-pointer hover:bg-slate-200"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="bg-[#002e47] text-white px-4 py-2 rounded-xl font-bold text-xs cursor-pointer hover:bg-[#004165]"
            >
              เพิ่มวัตถุดิบ
            </button>
          </div>
        </form>
      )}

      {/* Grid List */}
      {activeSubView === "ingredients" ? (
        <div className="w-full">
          {loading ? (
            <div className="bg-white border border-[#ece4d6] rounded-3xl p-16 text-center text-slate-400 font-bold">
              กำลังโหลดข้อมูลสต็อกวัตถุดิบ...
            </div>
          ) : ingredients.length === 0 ? (
            <div className="bg-white border border-[#ece4d6] rounded-3xl p-12 text-center shadow-sm">
              <div className="py-8 text-center max-w-sm mx-auto space-y-4">
                <ChefHat size={32} className="mx-auto text-slate-400" />
                <h3 className="font-black text-[#002e47] text-base">ไม่พบวัตถุดิบในฐานข้อมูล</h3>
                <button
                  onClick={handleSeedDefaultData}
                  className="bg-[#002e47] text-white px-5 py-2.5 rounded-2xl font-bold text-xs cursor-pointer"
                >
                  ⚡ นำเข้าวัตถุดิบเริ่มต้น
                </button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto bg-white border border-[#ece4d6] rounded-3xl p-4 shadow-sm">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-[#ece4d6] text-[#5a6e7a] font-bold">
                    <th className="py-3 px-4">ชื่อวัตถุดิบ</th>
                    <th className="py-3 px-4">การใช้งาน</th>
                    <th className="py-3 px-4">ปริมาณคงเหลือ</th>
                    <th className="py-3 px-4">จุดแจ้งเตือนขั้นต่ำ</th>
                    <th className="py-3 px-4 text-right">การจัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                  <tr className="bg-slate-50/50">
                    <td colSpan={5} className="py-2 px-4 font-black text-xs text-[#002e47]">
                      🥩 เนื้อสัตว์
                    </td>
                  </tr>
                  {groupedIngredients.meat.map(renderRow)}
                  <tr className="bg-slate-50/50">
                    <td colSpan={5} className="py-2 px-4 font-black text-xs text-[#002e47]">
                      🐙 อาหารทะเล
                    </td>
                  </tr>
                  {groupedIngredients.seafood.map(renderRow)}
                  <tr className="bg-slate-50/50">
                    <td colSpan={5} className="py-2 px-4 font-black text-xs text-[#002e47]">
                      🥚 ไข่ & เครื่องเคียง
                    </td>
                  </tr>
                  {[...groupedIngredients.toppings, ...groupedIngredients.others].map(renderRow)}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* Menu Items */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMenuItems.map((item: MenuItem) => {
            const isOutOfStock = outOfStockIds.includes(item.id);
            return (
              <div
                key={item.id}
                className={`bg-white border rounded-3xl p-4 flex gap-4 transition shadow-sm hover:shadow-md relative overflow-hidden ${
                  isOutOfStock ? "border-red-200 bg-red-50/20" : "border-[#ece4d6]"
                }`}
              >
                <div className="h-16 w-16 rounded-2xl overflow-hidden bg-slate-100 shrink-0 relative">
                  <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                  {isOutOfStock && (
                    <span className="absolute inset-0 bg-red-600/10 text-red-600 font-bold text-[9px] flex items-center justify-center">
                      หมด
                    </span>
                  )}
                </div>
                <div className="flex-1 flex flex-col justify-between min-w-0">
                  <div>
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-bold text-gray-400 uppercase">
                        {item.category}
                      </span>
                      <span className="text-xs font-black text-[#002e47]">฿{item.price}</span>
                    </div>
                    <h3 className="text-xs font-bold text-[#002e47] truncate">{item.name}</h3>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <span
                      className={`text-[10px] font-black ${isOutOfStock ? "text-red-500" : "text-emerald-600"}`}
                    >
                      {isOutOfStock ? "● ปิดชั่วคราว" : "● ขายปกติ"}
                    </span>
                    <button
                      onClick={() => toggleStock(item.id)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ${
                        isOutOfStock ? "bg-red-500" : "bg-emerald-500"
                      }`}
                    >
                      <span
                        className={`absolute left-[2px] top-[2px] h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ease-in-out ${
                          isOutOfStock ? "translate-x-4" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

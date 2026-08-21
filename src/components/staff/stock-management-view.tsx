import { useState, useEffect, useMemo } from "react";
import { supabase } from "../../lib/supabase";
import {
  PlusCircle,
  AlertTriangle,
  Edit2,
  Trash2,
  X,
} from "lucide-react";

interface StockManagementViewProps {
  handleLogout?: () => void;
}

export function StockManagementView({ handleLogout }: StockManagementViewProps) {
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterLowStock, setFilterLowStock] = useState(false);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingIng, setEditingIng] = useState<any | null>(null);

  // Form states
  const [formName, setFormName] = useState("");
  const [formQty, setFormQty] = useState(1000);
  const [formUnit, setFormUnit] = useState("g");
  const [formThreshold, setFormThreshold] = useState(200);

  const fetchIngredients = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("ingredients")
        .select("*")
        .order("name", { ascending: true });

      if (!error && data && data.length > 0) {
        setIngredients(data);
        localStorage.setItem("ran-lung-get-mock-ingredients", JSON.stringify(data));
      } else {
        const local = localStorage.getItem("ran-lung-get-mock-ingredients");
        if (local) {
          setIngredients(JSON.parse(local));
        } else {
          // If neither exists, use migration defaults
          const defaultIngs = [
            { id: "ing_1", name: "หมูสับ", quantity: 1000, unit: "g", min_threshold: 200 },
            { id: "ing_2", name: "หมูกรอบ", quantity: 1000, unit: "g", min_threshold: 200 },
            { id: "ing_3", name: "หมูชิ้น", quantity: 1000, unit: "g", min_threshold: 200 },
            { id: "ing_4", name: "ไก่สับ", quantity: 1000, unit: "g", min_threshold: 200 },
            { id: "ing_5", name: "ไก่ต้ม", quantity: 1000, unit: "g", min_threshold: 200 },
            { id: "ing_6", name: "เนื้อ", quantity: 1000, unit: "g", min_threshold: 200 },
            { id: "ing_7", name: "หมึก", quantity: 1000, unit: "g", min_threshold: 200 },
            { id: "ing_8", name: "กุ้ง", quantity: 1000, unit: "g", min_threshold: 200 },
            { id: "ing_9", name: "หอยลาย", quantity: 1000, unit: "g", min_threshold: 200 },
            { id: "ing_10", name: "ไข่ไก่", quantity: 100, unit: "pcs", min_threshold: 15 },
            { id: "ing_11", name: "ไส้กรอก", quantity: 50, unit: "pcs", min_threshold: 10 },
            { id: "ing_12", name: "กุนเชียง", quantity: 50, unit: "pcs", min_threshold: 10 },
          ];
          setIngredients(defaultIngs);
          localStorage.setItem("ran-lung-get-mock-ingredients", JSON.stringify(defaultIngs));
        }
      }
    } catch (e) {
      const local = localStorage.getItem("ran-lung-get-mock-ingredients");
      if (local) setIngredients(JSON.parse(local));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIngredients();

    const ch = supabase
      .channel("ingredients-staff-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "ingredients" }, () => {
        fetchIngredients();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

  const handleQuickAdd = async (id: string, amount: number) => {
    const target = ingredients.find((i) => i.id === id);
    if (!target) return;

    const nextQty = Number(target.quantity) + amount;
    const updated = ingredients.map((i) => (i.id === id ? { ...i, quantity: nextQty } : i));
    setIngredients(updated);
    localStorage.setItem("ran-lung-get-mock-ingredients", JSON.stringify(updated));

    try {
      await supabase
        .from("ingredients")
        .update({ quantity: nextQty, updated_at: new Date().toISOString() })
        .eq("id", id);
    } catch (e) {
      console.warn("Local quick add stock saved.");
    }
  };

  const openAddModal = () => {
    setFormName("");
    setFormQty(1000);
    setFormUnit("g");
    setFormThreshold(200);
    setIsAddModalOpen(true);
  };

  const openEditModal = (ing: any) => {
    setEditingIng(ing);
    setFormName(ing.name);
    setFormQty(Number(ing.quantity));
    setFormUnit(ing.unit);
    setFormThreshold(Number(ing.min_threshold));
    setIsEditModalOpen(true);
  };

  const handleSaveNew = async () => {
    if (!formName.trim()) {
      alert("กรุณากรอกชื่อวัตถุดิบ");
      return;
    }
    if (formQty < 0 || formThreshold < 0) {
      alert("กรุณากรอกปริมาณที่ถูกต้อง");
      return;
    }

    const newIng = {
      id: "ing_" + Math.random().toString(36).substring(2, 9),
      name: formName,
      quantity: Number(formQty),
      unit: formUnit,
      min_threshold: Number(formThreshold),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const updated = [...ingredients, newIng];
    setIngredients(updated);
    localStorage.setItem("ran-lung-get-mock-ingredients", JSON.stringify(updated));
    setIsAddModalOpen(false);

    try {
      const { error } = await supabase.from("ingredients").insert({
        name: newIng.name,
        quantity: newIng.quantity,
        unit: newIng.unit,
        min_threshold: newIng.min_threshold,
      });
      if (error) throw error;
      alert("เพิ่มวัตถุดิบใหม่เข้าสต็อกแล้ว!");
      fetchIngredients(); // reload to get real UUID from supabase
    } catch (e) {
      console.warn("Saved locally. Supabase error.");
      alert(
        "บันทึกข้อมูลวัตถุดิบในบราวเซอร์นี้สำเร็จ! (หมายเหตุ: มีปัญหาเชื่อมต่อกับฐานข้อมูลหลัก)",
      );
    }
  };

  const handleSaveEdit = async () => {
    if (!editingIng) return;
    if (!formName.trim()) {
      alert("กรุณากรอกชื่อวัตถุดิบ");
      return;
    }
    if (formQty < 0 || formThreshold < 0) {
      alert("กรุณากรอกปริมาณที่ถูกต้อง");
      return;
    }

    const updatedIng = {
      ...editingIng,
      name: formName,
      quantity: Number(formQty),
      unit: formUnit,
      min_threshold: Number(formThreshold),
      updated_at: new Date().toISOString(),
    };

    const updated = ingredients.map((i) => (i.id === editingIng.id ? updatedIng : i));
    setIngredients(updated);
    localStorage.setItem("ran-lung-get-mock-ingredients", JSON.stringify(updated));
    setIsEditModalOpen(false);

    try {
      const { error } = await supabase
        .from("ingredients")
        .update({
          name: updatedIng.name,
          quantity: updatedIng.quantity,
          unit: updatedIng.unit,
          min_threshold: updatedIng.min_threshold,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingIng.id);
      if (error) throw error;
      alert("แก้ไขข้อมูลวัตถุดิบสำเร็จ!");
    } catch (e) {
      console.warn("Updated locally.");
      alert(
        "อัปเดตข้อมูลในบราวเซอร์เครื่องนี้สำเร็จ! (หมายเหตุ: มีปัญหาเชื่อมต่อกับฐานข้อมูลหลัก)",
      );
    }
  };

  const handleDeleteIng = async (id: string) => {
    if (!confirm("คุณต้องการลบวัตถุดิบนี้ออกจากสต็อกใช่หรือไม่?")) return;

    const updated = ingredients.filter((i) => i.id !== id);
    setIngredients(updated);
    localStorage.setItem("ran-lung-get-mock-ingredients", JSON.stringify(updated));

    try {
      const { error } = await supabase.from("ingredients").delete().eq("id", id);
      if (error) throw error;
      alert("ลบวัตถุดิบเสร็จสิ้น");
    } catch (e) {
      console.warn("Deleted locally.");
      alert(
        "ลบข้อมูลออกจากบราวเซอร์เครื่องนี้สำเร็จ! (หมายเหตุ: มีปัญหาเชื่อมต่อกับฐานข้อมูลหลัก)",
      );
    }
  };

  const filteredIngredients = useMemo(() => {
    if (filterLowStock) {
      return ingredients.filter((i) => Number(i.quantity) <= Number(i.min_threshold));
    }
    return ingredients;
  }, [ingredients, filterLowStock]);

  const lowStockCount = useMemo(() => {
    return ingredients.filter((i) => Number(i.quantity) <= Number(i.min_threshold)).length;
  }, [ingredients]);

  return (
    <div className="space-y-6">
      {/* Title bar */}
      <div className="bg-white border border-[#ece4d6] rounded-3xl p-5 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div>
          <h2 className="text-base font-black text-[#002e47]">
            จัดการคลังวัตถุดิบ & สต็อก (Stock Management)
          </h2>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">
            รวมวัตถุดิบทั้งหมด {ingredients.length} ชนิด
          </p>
        </div>

        <div className="flex gap-2 w-full sm:w-auto shrink-0 justify-end">
          <button
            onClick={fetchIngredients}
            className="bg-[#002e47]/5 border hover:bg-[#002e47]/10 text-[#002e47] text-xs font-black px-3.5 py-2.5 rounded-xl transition cursor-pointer"
          >
            🔄 โหลดใหม่
          </button>
          <button
            onClick={openAddModal}
            className="bg-[#fcc14a] hover:bg-[#fcc14a]/90 text-[#002e47] text-xs font-black px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <PlusCircle size={15} />
            <span>เพิ่มวัตถุดิบ</span>
          </button>
        </div>
      </div>

      {/* Filter Stats Row */}
      <div className="flex gap-3 bg-white border border-[#ece4d6] p-4 rounded-3xl shrink-0 shadow-sm items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setFilterLowStock(false)}
            className={`px-4 py-2 rounded-xl font-bold text-xs tracking-wider transition-all cursor-pointer ${
              !filterLowStock
                ? "bg-[#002e47] text-white shadow-inner"
                : "text-[#5a6e7a] hover:text-[#002e47] hover:bg-slate-50"
            }`}
          >
            วัตถุดิบทั้งหมด ({ingredients.length})
          </button>
          <button
            onClick={() => setFilterLowStock(true)}
            className={`relative flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-xs tracking-wider transition-all cursor-pointer ${
              filterLowStock ? "bg-red-500 text-white shadow-inner" : "text-red-500 hover:bg-red-50"
            }`}
          >
            {lowStockCount > 0 && (
              <span className="h-2 w-2 rounded-full bg-current animate-pulse shrink-0" />
            )}
            <span>ของใกล้หมด / ต่ำกว่าเกณฑ์ ({lowStockCount})</span>
          </button>
        </div>
      </div>

      {/* Ingredients Grid/List */}
      {loading ? (
        <div className="bg-white border border-[#ece4d6] rounded-3xl p-16 text-center text-slate-400 font-bold shadow-sm">
          กำลังดึงข้อมูลคลังสต็อก...
        </div>
      ) : filteredIngredients.length === 0 ? (
        <div className="bg-white border border-[#ece4d6] rounded-3xl p-16 text-center text-slate-400 font-bold shadow-sm">
          {filterLowStock
            ? "🎉 เยี่ยมมาก! ไม่มีวัตถุดิบใดที่ต่ำกว่าเกณฑ์แจ้งเตือน"
            : "❌ ไม่พบรายการวัตถุดิบ"}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredIngredients.map((ing) => {
            const qty = Number(ing.quantity);
            const threshold = Number(ing.min_threshold);
            const isLow = qty <= threshold;
            const percentage = Math.min(100, Math.max(0, (qty / (threshold * 3)) * 100)); // Show relative level to 3x threshold

            let progressColor = "bg-emerald-500";
            if (isLow) progressColor = "bg-red-500 animate-pulse";
            else if (qty <= threshold * 1.5) progressColor = "bg-amber-500";

            return (
              <div
                key={ing.id}
                className={`bg-white border-2 rounded-3xl p-5 shadow-sm transition flex flex-col justify-between space-y-4 hover:shadow-md relative overflow-hidden border-[#ece4d6] ${isLow ? "border-red-200 bg-red-50/5" : ""}`}
              >
                <div>
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <h3 className="font-black text-[#002e47] text-sm flex items-center gap-1.5">
                        {ing.name}
                        {isLow && (
                          <span className="text-red-500" title="ของใกล้หมดสต็อก!">
                            <AlertTriangle size={15} className="fill-red-100" />
                          </span>
                        )}
                      </h3>
                      <p className="text-[10px] font-bold text-slate-400 mt-0.5">
                        สถานะ:{" "}
                        {isLow ? (
                          <span className="text-red-600 font-black">ต่ำกว่าเกณฑ์ (Low)</span>
                        ) : (
                          <span className="text-emerald-600 font-black">ปกติ (Good)</span>
                        )}
                      </p>
                    </div>

                    <div className="text-right">
                      <span
                        className={`text-base font-black ${isLow ? "text-red-600" : "text-[#002e47]"}`}
                      >
                        {qty.toLocaleString()}
                      </span>
                      <span className="text-[10px] font-bold text-slate-500 ml-1">{ing.unit}</span>
                    </div>
                  </div>

                  {/* Stock progress bar */}
                  <div className="mt-4 space-y-1">
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200/50">
                      <div
                        className={`h-full ${progressColor} transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[9px] text-slate-400 font-bold">
                      <span>เหลือน้อย</span>
                      <span>
                        เกณฑ์เตือน: {threshold} {ing.unit}
                      </span>
                      <span>พอดี</span>
                    </div>
                  </div>
                </div>

                {/* Quick actions & controls */}
                <div className="pt-4 border-t border-slate-100 flex flex-col gap-2.5">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[9px] font-bold text-slate-400">เติมด่วน:</span>
                    <div className="flex gap-1">
                      {ing.unit === "g" ? (
                        <>
                          <button
                            onClick={() => handleQuickAdd(ing.id, 500)}
                            className="px-2 py-1 bg-slate-50 hover:bg-[#002e47] hover:text-white border border-slate-200 text-slate-600 rounded-lg text-[9px] font-black transition cursor-pointer"
                          >
                            +500g
                          </button>
                          <button
                            onClick={() => handleQuickAdd(ing.id, 1000)}
                            className="px-2 py-1 bg-slate-50 hover:bg-[#002e47] hover:text-white border border-slate-200 text-slate-600 rounded-lg text-[9px] font-black transition cursor-pointer"
                          >
                            +1kg
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleQuickAdd(ing.id, 10)}
                            className="px-2 py-1 bg-slate-50 hover:bg-[#002e47] hover:text-white border border-slate-200 text-slate-600 rounded-lg text-[9px] font-black transition cursor-pointer"
                          >
                            +10 ชิ้น
                          </button>
                          <button
                            onClick={() => handleQuickAdd(ing.id, 50)}
                            className="px-2 py-1 bg-slate-50 hover:bg-[#002e47] hover:text-white border border-slate-200 text-slate-600 rounded-lg text-[9px] font-black transition cursor-pointer"
                          >
                            +50 ชิ้น
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end gap-1.5 pt-1">
                    <button
                      onClick={() => openEditModal(ing)}
                      className="flex-1 py-1.5 bg-slate-50 border border-slate-200 text-slate-600 font-bold text-[10px] rounded-xl hover:bg-slate-100 transition flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Edit2 size={11} />
                      <span>แก้ไข / เติมละเอียด</span>
                    </button>
                    <button
                      onClick={() => handleDeleteIng(ing.id)}
                      className="p-1.5 bg-red-50 border border-red-100 text-red-600 rounded-xl hover:bg-red-100 transition cursor-pointer"
                      title="ลบวัตถุดิบ"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Modals */}
      {(isAddModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => {
              setIsAddModalOpen(false);
              setIsEditModalOpen(false);
            }}
          />

          <div className="bg-white rounded-[28px] p-6 w-full max-w-sm z-10 border border-[#ece4d6] shadow-2xl relative text-[#002e47] flex flex-col">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 mb-4 shrink-0">
              <div>
                <h3 className="text-base font-black flex items-center gap-2">
                  {isAddModalOpen ? "➕ เพิ่มวัตถุดิบใหม่" : "📝 แก้ไขวัตถุดิบ"}
                </h3>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">
                  ระบุจำนวนหน่วยและเกณฑ์แจ้งเตือนคลังเหลือน้อย
                </p>
              </div>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setIsEditModalOpen(false);
                }}
                className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 cursor-pointer text-slate-500"
              >
                <X size={15} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1.5">
                  ชื่อวัตถุดิบ
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="เช่น พริกขี้หนูสวน, เนื้อปู"
                  className="w-full px-3 py-2 border border-[#ece4d6] rounded-xl text-xs font-bold text-[#002e47] focus:outline-none focus:ring-2 focus:ring-[#002e47]/10"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1.5">
                    ปริมาณสต็อก
                  </label>
                  <input
                    type="number"
                    value={formQty}
                    onChange={(e) => setFormQty(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-[#ece4d6] rounded-xl text-xs font-bold text-[#002e47] focus:outline-none focus:ring-2 focus:ring-[#002e47]/10"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1.5">
                    หน่วยนับ
                  </label>
                  <select
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    className="w-full px-3 py-2 border border-[#ece4d6] rounded-xl text-xs font-bold text-[#002e47] focus:outline-none focus:ring-2 focus:ring-[#002e47]/10 bg-white"
                  >
                    <option value="g">กรัม (g)</option>
                    <option value="pcs">ชิ้น/ฟอง (pcs)</option>
                    <option value="ml">มิลลิลิตร (ml)</option>
                    <option value="kg">กิโลกรัม (kg)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1.5">
                  ระดับแจ้งเตือนสต็อกต่ำสุด (Threshold)
                </label>
                <input
                  type="number"
                  value={formThreshold}
                  onChange={(e) => setFormThreshold(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-[#ece4d6] rounded-xl text-xs font-bold text-[#002e47] focus:outline-none focus:ring-2 focus:ring-[#002e47]/10"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 pt-4 border-t border-slate-100 shrink-0 flex justify-end gap-2">
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setIsEditModalOpen(false);
                }}
                className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 font-bold text-xs cursor-pointer transition"
              >
                ยกเลิก
              </button>
              <button
                onClick={isAddModalOpen ? handleSaveNew : handleSaveEdit}
                className="px-4 py-2 rounded-xl bg-[#002e47] hover:bg-[#002e47]/90 text-white font-black text-xs cursor-pointer transition shadow"
              >
                💾 บันทึกข้อมูล
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { type OrderHistory } from "../../types";
import {
  Plus,
  PlusCircle,
  Trash2,
  X,
  ChevronRight,
} from "lucide-react";

interface TableManagementViewProps {
  orders: OrderHistory[];
  onRefreshOrders: () => Promise<void>;
}

export function TableManagementView({ orders, onRefreshOrders }: TableManagementViewProps) {
  const [tables, setTables] = useState<any[]>([
    { id: "1", label: "โต๊ะ 1", status: "available", capacity: 4, table_type: "normal" },
    { id: "2", label: "โต๊ะ 2", status: "occupied", capacity: 4, table_type: "normal" },
    { id: "3", label: "โต๊ะ 3", status: "available", capacity: 4, table_type: "normal" },
    { id: "4", label: "โต๊ะ 4", status: "available", capacity: 4, table_type: "normal" },
    { id: "5", label: "โต๊ะ 5", status: "available", capacity: 4, table_type: "normal" },
    { id: "6", label: "โต๊ะ 6", status: "occupied", capacity: 4, table_type: "normal" },
    { id: "7", label: "โต๊ะ 7", status: "available", capacity: 4, table_type: "normal" },
    { id: "8", label: "โต๊ะ 8", status: "available", capacity: 4, table_type: "normal" },
    { id: "9", label: "โต๊ะ 9 (Walk-in)", status: "available", capacity: 4, table_type: "walkin" },
    { id: "10", label: "โต๊ะ 10 (Walk-in)", status: "available", capacity: 4, table_type: "walkin" },
  ]);
  const [selectedTable, setSelectedTable] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [isMoveSelectorOpen, setIsMoveSelectorOpen] = useState(false);
  const [isAddTableOpen, setIsAddTableOpen] = useState(false);
  const [newTableName, setNewTableName] = useState("");
  const [newTableCapacity, setNewTableCapacity] = useState(4);
  const [newTableType, setNewTableType] = useState<"normal" | "walkin">("normal");
  const [addingTable, setAddingTable] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean; title: string; message: string; onConfirm: () => void | Promise<void>;
  } | null>(null);

  const fetchTables = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("restaurant_tables")
        .select("id, label, status, capacity, table_type")
        .order("id");
      if (!error && data && data.length > 0) {
        const strData = data.map((t: any) => ({ ...t, id: String(t.id) }));
        setTables(strData as any);
        localStorage.setItem("ran-lung-get-tables", JSON.stringify(strData));
      } else {
        const local = localStorage.getItem("ran-lung-get-tables");
        if (local) setTables(JSON.parse(local));
      }
    } catch {
      const local = localStorage.getItem("ran-lung-get-tables");
      if (local) setTables(JSON.parse(local));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
    const ch = supabase
      .channel("tables-staff-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "restaurant_tables" }, (payload: any) => {
        if (payload.eventType === "DELETE") {
          const deletedId = String(payload.old?.id);
          setTables(prev => {
            const next = prev.filter(t => t.id !== deletedId);
            localStorage.setItem("ran-lung-get-tables", JSON.stringify(next));
            return next;
          });
          setSelectedTable((prev: any) => prev?.id === deletedId ? null : prev);
        } else if (payload.eventType === "UPDATE" || payload.eventType === "INSERT") {
          const updated = { ...payload.new, id: String(payload.new.id) } as any;
          setTables((prev) => {
            const exists = prev.some(t => t.id === updated.id);
            const next = exists
              ? prev.map(t => t.id === updated.id ? { ...t, ...updated } : t)
              : [...prev, updated];
            localStorage.setItem("ran-lung-get-tables", JSON.stringify(next));
            return next;
          });
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const getActiveOrdersForTable = (tableLabel: string) => {
    return orders.filter(o =>
      (o.status === "รอดำเนินการ" || o.status === "กำลังทำ" || o.status === "พร้อมเสิร์ฟ" || o.status === "รอรับออเดอร์") &&
      (o.tableNumber === tableLabel || o.tableNumber === tableLabel.replace("โต๊ะ ", ""))
    );
  };

  const updateTableStatus = async (tableId: string, nextStatus: string) => {
    const nextList = tables.map(t => t.id === tableId ? { ...t, status: nextStatus } : t);
    setTables(nextList);
    localStorage.setItem("ran-lung-get-tables", JSON.stringify(nextList));
    const currentSelected = nextList.find(t => t.id === tableId);
    if (currentSelected) setSelectedTable(currentSelected);
    try {
      await supabase.from("restaurant_tables").update({ status: nextStatus }).eq("id", tableId);
    } catch { console.warn("Offline update completed locally."); }
  };

  const addNewTable = async () => {
    if (!newTableName.trim()) return;
    setAddingTable(true);
    const label = newTableName.trim();
    const suffix = newTableType === "walkin" ? " (Walk-in)" : "";
    const fullLabel = label.includes("โต๊ะ") ? label + suffix : `โต๊ะ ${label}${suffix}`;
    try {
      const { data, error } = await supabase
        .from("restaurant_tables")
        .insert({ label: fullLabel, status: "available", capacity: newTableCapacity, table_type: newTableType })
        .select()
        .single();
      if (error) throw error;
      const newT = { ...data, id: String(data.id) };
      setTables(prev => {
        const next = [...prev, newT];
        localStorage.setItem("ran-lung-get-tables", JSON.stringify(next));
        return next;
      });
      setIsAddTableOpen(false);
      setNewTableName("");
      setNewTableCapacity(4);
      setNewTableType("normal");
    } catch (e: any) {
      alert("เกิดข้อผิดพลาด: " + (e?.message || "ไม่สามารถเพิ่มโต๊ะได้"));
    } finally {
      setAddingTable(false);
    }
  };

  const deleteTable = async (tableId: string, tableLabel: string) => {
    const activeOrders = getActiveOrdersForTable(tableLabel);
    if (activeOrders.length > 0) {
      alert(`ไม่สามารถลบโต๊ะได้ เนื่องจากมีออเดอร์ค้างอยู่ ${activeOrders.length} รายการ กรุณาเคลียร์โต๊ะก่อน`);
      return;
    }
    try {
      const { error } = await supabase.from("restaurant_tables").delete().eq("id", tableId);
      if (error) throw error;
      setTables(prev => {
        const next = prev.filter(t => t.id !== tableId);
        localStorage.setItem("ran-lung-get-tables", JSON.stringify(next));
        return next;
      });
      setSelectedTable(null);
    } catch (e: any) {
      alert("เกิดข้อผิดพลาด: " + (e?.message || "ไม่สามารถลบโต๊ะได้"));
    }
  };

  const moveAllOrders = async (fromTableLabel: string, toTableLabel: string) => {
    const activeFromOrders = getActiveOrdersForTable(fromTableLabel);
    if (activeFromOrders.length === 0) { alert("ไม่มีออเดอร์ให้ย้ายบนโต๊ะนี้"); return; }
    try {
      const orderIds = activeFromOrders.map(o => o.id);
      const { error: orderErr } = await (supabase as any).from("orders").update({ table_number: toTableLabel }).in("id", orderIds);
      if (orderErr) throw orderErr;
      const fromTable = tables.find(t => t.label === fromTableLabel);
      const toTable = tables.find(t => t.label === toTableLabel);
      if (fromTable) await (supabase as any).from("restaurant_tables").update({ status: "available" }).eq("id", fromTable.id);
      if (toTable) await (supabase as any).from("restaurant_tables").update({ status: "occupied" }).eq("id", toTable.id);
      await fetchTables();
      await onRefreshOrders();
      const updatedTablesList = tables.map(t =>
        t.label === fromTableLabel ? { ...t, status: "available" } : t.label === toTableLabel ? { ...t, status: "occupied" } : t
      );
      setSelectedTable(updatedTablesList.find(t => t.label === toTableLabel) || null);
      alert(`ย้ายออเดอร์จาก ${fromTableLabel} ไปยัง ${toTableLabel} สำเร็จ!`);
    } catch (err) {
      console.error("[Move Table] Error:", err);
      alert("เกิดข้อผิดพลาดในการย้ายโต๊ะ");
    }
  };

  const clearTableAndOrders = async (tableLabel: string) => {
    try {
      const activeOrders = getActiveOrdersForTable(tableLabel);
      if (activeOrders.length > 0) {
        const orderIds = activeOrders.map(o => o.id);
        await (supabase as any).from("orders").update({ status: "completed" }).in("id", orderIds);
      }
      const targetTable = tables.find(t => t.label === tableLabel);
      if (targetTable) {
        await (supabase as any).from("restaurant_tables").update({ status: "available" }).eq("id", targetTable.id);
      }
      await fetchTables();
      await onRefreshOrders();
      setSelectedTable(null);
      alert(`เคลียร์โต๊ะ ${tableLabel} เสร็จสิ้น!`);
    } catch (err) {
      console.error("[Clear Table] Error:", err);
      alert("เกิดข้อผิดพลาดในการเคลียร์โต๊ะ");
    }
  };

  // Auto-occupy tables
  useEffect(() => {
    if (tables.length === 0) return;
    const tablesToUpdate = tables.filter(t => getActiveOrdersForTable(t.label).length > 0 && t.status === "available");
    if (tablesToUpdate.length > 0) {
      tablesToUpdate.forEach(t => { void updateTableStatus(t.id, "occupied"); });
    }
  }, [orders, tables]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-[#ece4d6] rounded-3xl p-5 shadow-sm flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-base font-black text-[#002e47]">ผังที่นั่งร้านอาหาร (หน้าร้าน)</h2>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">รวมทั้งหมด {tables.length} โต๊ะอาหาร (รวมโต๊ะ Walk-in สีเทา)</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchTables} className="bg-[#002e47]/5 border hover:bg-[#002e47]/10 text-[#002e47] text-xs font-black px-3.5 py-2 rounded-xl transition cursor-pointer">
            🔄 โหลดใหม่
          </button>
          <button
            onClick={() => setIsAddTableOpen(true)}
            className="flex items-center gap-1.5 bg-[#002e47] hover:bg-[#003a5c] text-white text-xs font-black px-4 py-2 rounded-xl transition shadow-sm cursor-pointer"
          >
            <Plus size={14} />
            <span>เพิ่มโต๊ะ</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Table Grid */}
        <div className="flex-1 lg:max-w-[65%]">
          {loading ? (
            <div className="bg-white border border-[#ece4d6] rounded-3xl p-16 text-center text-slate-400 font-bold shadow-sm">
              กำลังโหลดผังโต๊ะ...
            </div>
          ) : (
            <div className="grid grid-cols-2 xl:grid-cols-3 gap-5">
              {[...tables]
                .sort((a, b) => parseInt(a.id, 10) - parseInt(b.id, 10))
                .map((table) => {
                  const activeOrders = getActiveOrdersForTable(table.label);
                  const isOccupied = table.status === "occupied";
                  const isWalkIn = table.table_type === "walkin" || table.label.toLowerCase().includes("walk-in");
                  const isSelected = selectedTable?.id === table.id;

                  let statusLabel = "ว่าง";
                  let statusColor = "bg-emerald-500 text-white border-emerald-600";
                  let boxBg = "bg-emerald-50/30 border-emerald-200 hover:bg-emerald-50/50";
                  if (isOccupied) {
                    statusLabel = "มีลูกค้า"; statusColor = "bg-red-500 text-white border-red-600"; boxBg = "bg-red-50/30 border-red-200 hover:bg-red-50/50";
                  } else if (isWalkIn) {
                    statusLabel = "Walk-in"; statusColor = "bg-slate-500 text-white border-slate-600"; boxBg = "bg-slate-50/40 border-slate-300 hover:bg-slate-50/60";
                  }

                  return (
                    <div
                      key={table.id}
                      onClick={() => setSelectedTable(table)}
                      className={`border-2 rounded-3xl p-5 text-left relative overflow-hidden transition cursor-pointer flex flex-col justify-between min-h-[160px] shadow-sm hover:shadow ${boxBg} ${isSelected ? "ring-4 ring-[#002e47]/30 border-[#002e47] scale-[1.01]" : ""}`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-black text-base text-[#002e47]">{table.label}</span>
                          <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${statusColor}`}>{statusLabel}</span>
                        </div>
                        <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-wider">
                          โต๊ะสำหรับ {table.capacity || 4} คน {isWalkIn && <span className="ml-1 text-slate-600 font-extrabold">(Walk-in)</span>}
                        </p>
                      </div>
                      {isOccupied && (
                        <div className="mt-4 pt-3 border-t border-red-100 text-xs">
                          {activeOrders.length > 0 ? (
                            <span className="font-bold text-red-700">มีออเดอร์ค้าง ({activeOrders.length})</span>
                          ) : (
                            <span className="text-slate-400 font-semibold italic text-[11px]">ไม่มีออเดอร์ค้าง</span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {/* Detail Panel */}
        <div className="w-full lg:w-[35%] bg-white border border-[#ece4d6] rounded-[28px] p-6 shadow-sm flex flex-col min-h-[500px]">
          {selectedTable ? (
            <div className="flex flex-col flex-1 h-full text-[#002e47]">
              <div className="flex justify-between items-start pb-4 border-b border-slate-100 mb-5">
                <div>
                  <h3 className="text-lg font-black">{selectedTable.label}</h3>
                  <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border inline-block mt-1 ${selectedTable.status === "occupied" ? "bg-red-500 text-white border-red-600" : "bg-emerald-500 text-white border-emerald-600"}`}>
                    {selectedTable.status === "occupied" ? "มีลูกค้า" : "ว่าง"}
                  </span>
                </div>
                <button onClick={() => { setSelectedTable(null); setIsMoveSelectorOpen(false); }} className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 cursor-pointer text-slate-500">
                  <X size={15} />
                </button>
              </div>

              {/* Status Selector */}
              <div className="mb-5">
                <span className="text-xs font-bold text-slate-500 block mb-2">อัปเดตสถานะโต๊ะ</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => updateTableStatus(selectedTable.id, "available")}
                    className={`py-2 rounded-md font-bold text-[10px] border transition cursor-pointer ${selectedTable.status === "available" ? "bg-emerald-500 text-white border-emerald-600" : "bg-white border-slate-200 hover:bg-slate-50"}`}
                  >
                    🟢 ว่าง
                  </button>
                  <button
                    onClick={() => updateTableStatus(selectedTable.id, "occupied")}
                    className={`py-2 rounded-md font-bold text-[10px] border transition cursor-pointer ${selectedTable.status === "occupied" ? "bg-red-500 text-white border-red-600" : "bg-white border-slate-200 hover:bg-slate-50"}`}
                  >
                    🔴 มีลูกค้า
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="mb-6 space-y-2">
                <span className="text-xs font-bold text-slate-500 block mb-1">เมนูการจัดการ</span>
                <button onClick={() => setIsMoveSelectorOpen(true)} className="w-full py-3 px-4 rounded-md border border-slate-200 hover:bg-slate-50 font-bold text-xs flex items-center justify-between transition cursor-pointer">
                  <span className="flex items-center gap-2">🔄 ย้าย / รวมออเดอร์ไปยังโต๊ะอื่น</span>
                  <ChevronRight size={14} className="text-slate-400" />
                </button>
                <a href="/customer" target="_blank" rel="noreferrer"
                  onClick={() => { localStorage.setItem("ran-lung-get-selected-table", selectedTable.id); }}
                  className="w-full py-3 px-4 rounded-md border border-slate-200 hover:bg-slate-50 font-bold text-xs flex items-center justify-between transition block text-left text-inherit no-underline cursor-pointer"
                >
                  <span className="flex items-center gap-2">🛍️ สั่งอาหาร Walk-in (ชำระเงินสด/โอนเงิน)</span>
                  <PlusCircle size={14} className="text-slate-400" />
                </a>
                <button
                  onClick={() => setConfirmDialog({ isOpen: true, title: "ยืนยันการเคลียร์โต๊ะ", message: `คุณต้องการเคลียร์โต๊ะและเปลี่ยนสถานะออเดอร์ค้างทั้งหมดของ ${selectedTable.label} ให้เสร็จสิ้นใช่หรือไม่?`, onConfirm: async () => { await clearTableAndOrders(selectedTable.label); } })}
                  className="w-full py-3 px-4 rounded-md border border-red-200 text-red-700 bg-red-50/30 hover:bg-red-50 font-bold text-xs flex items-center justify-between transition cursor-pointer"
                >
                  <span className="flex items-center gap-2">🧹 เคลียร์โต๊ะ & อ้างอิงออเดอร์เสร็จสิ้น</span>
                  <Trash2 size={14} className="text-red-400" />
                </button>

                {/* Delete Table */}
                <button
                  onClick={() => setConfirmDialog({
                    isOpen: true, title: "⚠️ ยืนยันการลบโต๊ะ",
                    message: `คุณต้องการลบ ${selectedTable.label} ออกจากระบบใช่หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้`,
                    onConfirm: async () => { await deleteTable(selectedTable.id, selectedTable.label); }
                  })}
                  className="w-full py-3 px-4 rounded-md border border-red-300 text-red-800 bg-red-100/50 hover:bg-red-100 font-bold text-xs flex items-center justify-between transition cursor-pointer"
                >
                  <span className="flex items-center gap-2">🗑️ ลบโต๊ะนี้ออกจากระบบ</span>
                  <Trash2 size={14} className="text-red-500" />
                </button>
              </div>

              {/* Active Orders */}
              <div className="flex-1 flex flex-col border-t border-slate-100 pt-4 overflow-hidden">
                <span className="text-xs font-bold text-slate-500 block mb-3">
                  บิลแยกและรายละเอียดอาหาร ({getActiveOrdersForTable(selectedTable.label).length} ออเดอร์)
                </span>
                <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 max-h-[280px] no-scrollbar">
                  {getActiveOrdersForTable(selectedTable.label).length > 0 ? (
                    getActiveOrdersForTable(selectedTable.label).map((order) => (
                      <div key={order.id} className="bg-slate-50/50 border border-[#ece4d6] rounded-md p-3.5 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-extrabold text-[11px] text-slate-700">{order.orderNumber}</span>
                          <span className="text-[10px] bg-slate-200/60 font-black px-2 py-0.5 rounded text-slate-600">{order.status}</span>
                        </div>
                        <div className="space-y-1 text-xs text-slate-600 font-bold">
                          {order.items.map((it, idx) => (
                            <div key={idx} className="flex justify-between">
                              <span>{it.name} x{it.qty}</span>
                              <span>฿{it.price * it.qty}</span>
                            </div>
                          ))}
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-dashed border-slate-200 text-xs">
                          <span className="font-black text-[#002e47]">ยอดรวม: ฿{order.total}</span>
                          <span className="text-[9px] bg-emerald-100 text-emerald-800 font-black px-1.5 py-0.5 rounded">จ่ายแล้ว</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-slate-400 py-8 text-xs italic font-bold">ไม่มีออเดอร์ค้างอยู่บนโต๊ะนี้</div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-12 text-center my-auto">
              <div className="text-5xl mb-3">🍽️</div>
              <p className="font-bold text-sm text-[#002e47]">เลือกโต๊ะอาหารเพื่อดำเนินการ</p>
              <p className="text-[11px] text-slate-500 mt-1.5 max-w-[200px] leading-relaxed">
                กดเลือกโต๊ะจากแผนผังที่นั่งฝั่งซ้าย เพื่อย้ายออเดอร์, ดูรายละเอียดบิลแยก หรือเคลียร์/ลบโต๊ะ
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Add Table Modal */}
      {isAddTableOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsAddTableOpen(false)} />
          <div className="bg-white rounded-[28px] p-6 w-full max-w-sm z-10 border border-[#ece4d6] shadow-2xl relative text-[#002e47]">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-black">➕ เพิ่มโต๊ะใหม่</h3>
              <button onClick={() => setIsAddTableOpen(false)} className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 cursor-pointer text-slate-500">
                <X size={15} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">ชื่อโต๊ะ / หมายเลขโต๊ะ</label>
                <input
                  type="text"
                  placeholder="เช่น 11, VIP, ห้องส่วนตัว"
                  value={newTableName}
                  onChange={e => setNewTableName(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#002e47]/20"
                  onKeyDown={e => e.key === "Enter" && addNewTable()}
                  autoFocus
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">จำนวนที่นั่ง</label>
                <select
                  value={newTableCapacity}
                  onChange={e => setNewTableCapacity(Number(e.target.value))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#002e47]/20 bg-white"
                >
                  {[2, 4, 6, 8, 10, 12].map(n => <option key={n} value={n}>{n} คน</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">ประเภทโต๊ะ</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setNewTableType("normal")}
                    className={`py-2.5 rounded-xl font-bold text-xs border transition cursor-pointer ${newTableType === "normal" ? "bg-[#002e47] text-white border-[#002e47]" : "bg-white border-slate-200 hover:bg-slate-50"}`}
                  >
                    🪑 ปกติ
                  </button>
                  <button
                    onClick={() => setNewTableType("walkin")}
                    className={`py-2.5 rounded-xl font-bold text-xs border transition cursor-pointer ${newTableType === "walkin" ? "bg-slate-600 text-white border-slate-600" : "bg-white border-slate-200 hover:bg-slate-50"}`}
                  >
                    🚶 Walk-in
                  </button>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setIsAddTableOpen(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition cursor-pointer">
                ยกเลิก
              </button>
              <button
                onClick={addNewTable}
                disabled={!newTableName.trim() || addingTable}
                className="flex-1 py-2.5 rounded-xl bg-[#002e47] text-white font-black text-xs hover:bg-[#003a5c] transition disabled:opacity-50 cursor-pointer"
              >
                {addingTable ? "กำลังเพิ่ม..." : "✅ เพิ่มโต๊ะ"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Move Table Modal */}
      {isMoveSelectorOpen && selectedTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsMoveSelectorOpen(false)} />
          <div className="bg-white rounded-[28px] p-6 w-full max-w-lg z-10 border border-[#ece4d6] shadow-2xl relative text-[#002e47] flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 mb-5 shrink-0">
              <div>
                <h3 className="text-lg font-black flex items-center gap-2">🔄 ย้าย / รวมออเดอร์</h3>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">เลือกโต๊ะปลายทางสำหรับ <span className="font-extrabold text-[#002e47] underline">{selectedTable.label}</span></p>
              </div>
              <button onClick={() => setIsMoveSelectorOpen(false)} className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 cursor-pointer text-slate-500">
                <X size={15} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto no-scrollbar py-2">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[...tables].sort((a, b) => parseInt(a.id, 10) - parseInt(b.id, 10)).filter(t => t.id !== selectedTable.id).map(t => {
                  const activeOrders = getActiveOrdersForTable(t.label);
                  const isOccupied = t.status === "occupied";
                  return (
                    <button
                      key={t.id}
                      onClick={() => {
                        const actionText = isOccupied ? `รวมออเดอร์กับ ${t.label}` : `ย้ายออเดอร์ทั้งหมดไปที่ ${t.label}`;
                        setConfirmDialog({
                          isOpen: true, title: isOccupied ? "ยืนยันการรวมออเดอร์" : "ยืนยันการย้ายโต๊ะ",
                          message: `คุณต้องการ${actionText} ใช่หรือไม่?`,
                          onConfirm: async () => { await moveAllOrders(selectedTable.label, t.label); setIsMoveSelectorOpen(false); }
                        });
                      }}
                      className={`border-2 rounded-md p-4 text-left transition flex flex-col justify-between min-h-[110px] cursor-pointer ${isOccupied ? "bg-red-50/10 border-red-100 hover:bg-red-50/50" : "bg-emerald-50/10 border-emerald-100 hover:bg-emerald-50/50"}`}
                    >
                      <div className="w-full flex items-center justify-between">
                        <span className="font-extrabold text-sm">{t.label}</span>
                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full border ${isOccupied ? "bg-red-500 text-white border-red-600" : "bg-emerald-500 text-white border-emerald-600"}`}>
                          {isOccupied ? "มีลูกค้า" : "ว่าง"}
                        </span>
                      </div>
                      {isOccupied && (
                        <div className="text-[10px] text-red-700 font-extrabold mt-2">
                          {activeOrders.length > 0 ? `ค้างอยู่ ${activeOrders.length} ออเดอร์` : "นั่งโต๊ะเปล่า"}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="mt-5 pt-4 border-t border-slate-100 shrink-0 flex justify-end">
              <button onClick={() => setIsMoveSelectorOpen(false)} className="px-5 py-2.5 rounded-md border border-slate-200 hover:bg-slate-50 font-bold text-xs cursor-pointer">ยกเลิก</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      {confirmDialog?.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setConfirmDialog(null)} />
          <div className="bg-white rounded-[28px] p-6 w-full max-w-sm z-10 border border-[#ece4d6] shadow-2xl relative text-[#002e47] flex flex-col">
            <h3 className="text-base font-black mb-2">{confirmDialog.title}</h3>
            <p className="text-xs text-slate-500 font-semibold leading-relaxed mb-6">{confirmDialog.message}</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirmDialog(null)} className="px-4 py-2 rounded-md border border-red-500 text-red-500 hover:bg-red-50 bg-white font-bold text-xs cursor-pointer transition">ยกเลิก</button>
              <button
                onClick={async () => { const onConf = confirmDialog.onConfirm; setConfirmDialog(null); await onConf(); }}
                className="px-4 py-2 rounded-md bg-[#002e47] hover:bg-[#002e47]/90 text-white font-bold text-xs cursor-pointer border border-transparent transition"
              >
                ยืนยัน
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

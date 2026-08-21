import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import {
  ChefHat,
  Volume2,
  VolumeX,
  Filter,
  Menu,
  Table,
  BookOpen,
  Inbox,
} from "lucide-react";
import { type OrderHistory } from "../../types";
import { playNotificationSound } from "../../lib/sound";
import { EmptyColumnMessage } from "../../components/staff/empty-column-message";
import { KitchenSidebar } from "../../components/staff/kitchen-sidebar";
import { KitchenOrderCard } from "../../components/staff/kitchen-order-card";
import { HistoryOrderRow } from "../../components/staff/history-order-row";
import { TableManagementView } from "../../components/staff/table-management-view";
import { MenuManagementView } from "../../components/staff/menu-management-view";
import { StockManagementView } from "../../components/staff/stock-management-view";
import { getMongoOrders, updateMongoOrderStatus } from "../../lib/api/mongo.functions";
import { getStoredUser, clearStoredUser } from "../../lib/auth";

export const Route = createFileRoute("/staff/")({
  component: KitchenMonitor,
});

// ── Kitchen Monitor Main Page Component ──
function KitchenMonitor() {
  const [orders, setOrders] = useState<OrderHistory[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("active");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [view, setView] = useState<"kitchen" | "tables" | "menu" | "stock">("kitchen");

  const handleLogout = () => {
    clearStoredUser();
    window.location.href = "/login";
  };

  useEffect(() => {
    const user = getStoredUser();
    if (!user) {
      window.location.href = "/login";
      return;
    }
    if (user.role !== "staff" && user.role !== "admin") {
      window.location.href = "/customer";
      return;
    }
  }, []);

  const fetchMongoOrders = async () => {
    try {
      const res = await getMongoOrders();
      if (res.success && res.data && res.data.length > 0) {
        const mappedOrders: OrderHistory[] = res.data.map((o: any) => {
          let localStatus = "รอดำเนินการ";
          if (o.status === "pending" || o.status === "รอรับออเดอร์") localStatus = "รอดำเนินการ";
          else if (o.status === "preparing" || o.status === "กำลังทำ") localStatus = "กำลังทำ";
          else if (o.status === "delivering" || o.status === "พร้อมเสิร์ฟ") localStatus = "พร้อมเสิร์ฟ";
          else if (o.status === "completed" || o.status === "สำเร็จ") localStatus = "สำเร็จ";
          else if (o.status === "cancelled" || o.status === "ยกเลิก") localStatus = "ยกเลิก";

          return {
            id: o._id || o.id || o.orderNumber,
            orderNumber: o.orderNumber || o.order_number,
            date:
              o.created_at
                ? new Date(o.created_at).toLocaleDateString("th-TH", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  }) +
                  " · " +
                  new Date(o.created_at).toLocaleTimeString("th-TH", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "เมื่อสักครู่",
            items: (o.items || []).map((i: any) => ({
              name: i.name,
              qty: i.qty || i.quantity || 1,
              price: i.price || i.unit_price || 0,
              image: i.image || "",
            })),
            subtotal: o.subtotal || 0,
            delivery: o.deliveryFee || o.delivery_fee || 0,
            total: o.total || 0,
            status: localStatus,
            orderType: o.orderType || o.order_type || "delivery",
            tableNumber: o.tableNumber || o.table_number || undefined,
            queueNumber: o.queueNumber || o.special_instructions || undefined,
            customerName: o.fullName || o.customerName || undefined,
            customerPhone: o.phone || o.customerPhone || undefined,
          };
        });

        setOrders(mappedOrders);
        localStorage.setItem("ran-lung-get-orders", JSON.stringify(mappedOrders));
      } else {
        const local = localStorage.getItem("ran-lung-get-orders");
        if (local) {
          try {
            setOrders(JSON.parse(local));
          } catch {}
        }
      }
    } catch {
      const local = localStorage.getItem("ran-lung-get-orders");
      if (local) {
        try {
          setOrders(JSON.parse(local));
        } catch {}
      }
    }
  };

  useEffect(() => {
    fetchMongoOrders();
    const interval = setInterval(fetchMongoOrders, 4000);
    return () => clearInterval(interval);
  }, []);

  const changeStatus = async (id: string, newStatus: string) => {
    const targetOrder = orders.find((o) => o.id === id);
    const updated = orders.map((o) => (o.id === id ? { ...o, status: newStatus } : o));
    setOrders(updated);
    localStorage.setItem("ran-lung-get-orders", JSON.stringify(updated));

    if (soundEnabled) {
      playNotificationSound();
    }

    if (targetOrder) {
      let dbStatus = "pending";
      if (newStatus === "กำลังทำ") dbStatus = "preparing";
      else if (newStatus === "พร้อมเสิร์ฟ") dbStatus = "delivering";
      else if (newStatus === "สำเร็จ") dbStatus = "completed";
      else if (newStatus === "ยกเลิก") dbStatus = "cancelled";

      await updateMongoOrderStatus({
        data: { orderNumber: targetOrder.orderNumber, status: dbStatus },
      });
    }
  };

  const advanceOrderStatus = (id: string) => {
    const order = orders.find((o) => o.id === id);
    if (!order) return;
    if (order.status === "รอดำเนินการ" || order.status === "รอรับออเดอร์") {
      changeStatus(id, "กำลังทำ");
    } else if (order.status === "กำลังทำ") {
      changeStatus(id, "พร้อมเสิร์ฟ");
    } else if (order.status === "พร้อมเสิร์ฟ") {
      changeStatus(id, "สำเร็จ");
    }
  };

  const regressOrderStatus = (id: string) => {
    const order = orders.find((o) => o.id === id);
    if (!order) return;
    if (order.status === "พร้อมเสิร์ฟ") {
      changeStatus(id, "กำลังทำ");
    } else if (order.status === "กำลังทำ") {
      changeStatus(id, "รอดำเนินการ");
    }
  };

  const cancelOrder = async (id: string) => {
    const targetOrder = orders.find((o) => o.id === id);
    const updated = orders.map((o) => (o.id === id ? { ...o, status: "ยกเลิก" } : o));
    setOrders(updated);
    localStorage.setItem("ran-lung-get-orders", JSON.stringify(updated));

    if (targetOrder) {
      await updateMongoOrderStatus({
        data: { orderNumber: targetOrder.orderNumber, status: "cancelled" },
      });
    }
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (typeFilter !== "all" && o.orderType !== typeFilter) return false;
      return true;
    });
  }, [orders, typeFilter]);

  const pendingOrders = filteredOrders.filter(
    (o) => o.status === "รอดำเนินการ" || o.status === "รอรับออเดอร์",
  );
  const cookingOrders = filteredOrders.filter((o) => o.status === "กำลังทำ");
  const readyOrders = filteredOrders.filter((o) => o.status === "พร้อมเสิร์ฟ");
  const completedOrders = filteredOrders.filter(
    (o) => o.status === "สำเร็จ" || o.status === "ยกเลิก",
  );

  return (
    <div className="flex h-screen w-full bg-[#fff8f2] text-slate-800 font-sans overflow-hidden" style={{ backgroundColor: "rgb(255, 248, 242)" }}>
      {/* Sidebar (Desktop / Drawer) */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 lg:static lg:block ${sidebarOpen ? "block" : "hidden"}`}>
        <KitchenSidebar
          view={view}
          setView={setView}
          onClose={() => setSidebarOpen(false)}
          handleLogout={handleLogout}
        />
      </div>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#fff8f2]" style={{ backgroundColor: "rgb(255, 248, 242)" }}>
        {/* Top Navbar */}
        <header className="h-16 border-b border-[#ece4d6] bg-[#002e47] text-white px-6 flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl bg-white/10 border border-white/15 text-white hover:bg-white/20"
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#fcc14a]/20 border border-[#fcc14a]/40 grid place-items-center">
                <ChefHat className="text-[#fcc14a]" size={20} />
              </div>
              <div>
                <h1 className="font-bold text-base leading-tight text-white flex items-center gap-2">
                  ระบบจัดการครัว Dineos
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-medium border border-emerald-500/30">
                    MongoDB Ready
                  </span>
                </h1>
                <p className="text-[11px] text-white/60">
                  {view === "kitchen"
                    ? "Kitchen KDS · กระดานออเดอร์สด"
                    : view === "tables"
                      ? "Table Layout · จัดการผังโต๊ะอาหาร"
                      : view === "menu"
                        ? "Menu Catalog · จัดการเมนูและราคา"
                        : "Inventory · สต็อกวัตถุดิบ"}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* View Switcher Quick Tabs */}
            <div className="hidden sm:flex items-center bg-black/20 p-1 rounded-xl border border-white/10">
              <button
                onClick={() => setView("kitchen")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  view === "kitchen"
                    ? "bg-[#fcc14a] text-[#002e47] shadow-sm font-bold"
                    : "text-white/70 hover:text-white"
                }`}
              >
                <ChefHat size={14} />
                <span>ครัว (KDS)</span>
              </button>
              <button
                onClick={() => setView("tables")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  view === "tables"
                    ? "bg-[#fcc14a] text-[#002e47] shadow-sm font-bold"
                    : "text-white/70 hover:text-white"
                }`}
              >
                <Table size={14} />
                <span>โต๊ะ</span>
              </button>
              <button
                onClick={() => setView("menu")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  view === "menu"
                    ? "bg-[#fcc14a] text-[#002e47] shadow-sm font-bold"
                    : "text-white/70 hover:text-white"
                }`}
              >
                <BookOpen size={14} />
                <span>เมนู</span>
              </button>
              <button
                onClick={() => setView("stock")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  view === "stock"
                    ? "bg-[#fcc14a] text-[#002e47] shadow-sm font-bold"
                    : "text-white/70 hover:text-white"
                }`}
              >
                <Inbox size={14} />
                <span>สต็อก</span>
              </button>
            </div>

            {/* Sound toggle button */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                soundEnabled
                  ? "bg-white/10 border-white/20 text-[#fcc14a] hover:bg-white/20"
                  : "bg-red-500/20 border-red-500/40 text-red-300 hover:bg-red-500/30"
              }`}
              title={soundEnabled ? "เปิดเสียงเตือนอยู่ (กดเพื่อปิด)" : "ปิดเสียงเตือน (กดเพื่อเปิด)"}
            >
              {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>
          </div>
        </header>

        {/* Dynamic Main Body Content based on active view */}
        <div className="flex-1 overflow-hidden bg-[#fff8f2]" style={{ backgroundColor: "rgb(255, 248, 242)" }}>
          {view === "tables" && (
            <TableManagementView orders={orders} onRefreshOrders={fetchMongoOrders} />
          )}

          {view === "menu" && <MenuManagementView />}

          {view === "stock" && <StockManagementView />}

          {view === "kitchen" && (
            <div className="h-full flex flex-col p-4 sm:p-6 overflow-hidden bg-[#fff8f2]" style={{ backgroundColor: "rgb(255, 248, 242)" }}>
              {/* Filter Tabs */}
              <div className="flex items-center justify-between gap-4 mb-4 shrink-0 flex-wrap">
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                  {["active", "history"].map((f) => (
                    <button
                      key={f}
                      onClick={() => setStatusFilter(f)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        statusFilter === f
                          ? "bg-[#002e47] text-white shadow-md border border-[#002e47]"
                          : "bg-white text-slate-600 hover:bg-slate-50 border border-[#ece4d6]"
                      }`}
                    >
                      {f === "active" ? `🔥 กำลังทำ (${pendingOrders.length + cookingOrders.length + readyOrders.length})` : `ประวัติออเดอร์ (${completedOrders.length})`}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 flex items-center gap-1 font-semibold">
                    <Filter size={13} /> ประเภท:
                  </span>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    aria-label="กรองประเภทออเดอร์"
                    className="bg-white border border-[#ece4d6] rounded-xl px-3 py-1.5 text-xs text-[#002e47] font-semibold outline-none shadow-sm cursor-pointer"
                  >
                    <option value="all">ทั้งหมด</option>
                    <option value="dine-in">ทานที่ร้าน (Dine-in)</option>
                    <option value="takeaway">รับกลับบ้าน (Takeaway)</option>
                    <option value="delivery">เดลิเวอรี (Delivery)</option>
                  </select>
                </div>
              </div>

              {/* Kanban Grid */}
              {statusFilter === "active" ? (
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 min-h-0 overflow-y-auto no-scrollbar">
                  {/* Column 1: รอทำ */}
                  <div className="flex flex-col rounded-2xl bg-white border border-[#ece4d6] shadow-sm overflow-hidden">
                    <div className="px-4 py-3 border-b border-amber-200 bg-amber-500/10 flex items-center justify-between">
                      <span className="font-bold text-sm text-amber-900 flex items-center gap-2">
                        <span>⏳ รอดำเนินการ</span>
                        <span className="px-2 py-0.5 text-xs rounded-full bg-amber-200 text-amber-900 font-black">
                          {pendingOrders.length}
                        </span>
                      </span>
                    </div>
                    <div className="flex-1 p-3 overflow-y-auto space-y-3 no-scrollbar bg-[#fff8f2]/40">
                      {pendingOrders.length === 0 ? (
                        <EmptyColumnMessage text="ไม่มีออเดอร์รอทำ" />
                      ) : (
                        pendingOrders.map((o) => (
                          <KitchenOrderCard
                            key={o.id}
                            order={o}
                            advanceOrderStatus={advanceOrderStatus}
                            regressOrderStatus={regressOrderStatus}
                            cancelOrder={cancelOrder}
                          />
                        ))
                      )}
                    </div>
                  </div>

                  {/* Column 2: กำลังทำ */}
                  <div className="flex flex-col rounded-2xl bg-white border border-[#ece4d6] shadow-sm overflow-hidden">
                    <div className="px-4 py-3 border-b border-sky-200 bg-sky-500/10 flex items-center justify-between">
                      <span className="font-bold text-sm text-sky-900 flex items-center gap-2">
                        <span>🍳 กำลังปรุงอาหาร</span>
                        <span className="px-2 py-0.5 text-xs rounded-full bg-sky-200 text-sky-900 font-black">
                          {cookingOrders.length}
                        </span>
                      </span>
                    </div>
                    <div className="flex-1 p-3 overflow-y-auto space-y-3 no-scrollbar bg-[#fff8f2]/40">
                      {cookingOrders.length === 0 ? (
                        <EmptyColumnMessage text="ไม่มีอาหารที่กำลังปรุง" />
                      ) : (
                        cookingOrders.map((o) => (
                          <KitchenOrderCard
                            key={o.id}
                            order={o}
                            advanceOrderStatus={advanceOrderStatus}
                            regressOrderStatus={regressOrderStatus}
                            cancelOrder={cancelOrder}
                          />
                        ))
                      )}
                    </div>
                  </div>

                  {/* Column 3: พร้อมเสิร์ฟ */}
                  <div className="flex flex-col rounded-2xl bg-white border border-[#ece4d6] shadow-sm overflow-hidden">
                    <div className="px-4 py-3 border-b border-emerald-200 bg-emerald-500/10 flex items-center justify-between">
                      <span className="font-bold text-sm text-emerald-900 flex items-center gap-2">
                        <span>🔔 พร้อมเสิร์ฟ / จัดส่ง</span>
                        <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-200 text-emerald-900 font-black">
                          {readyOrders.length}
                        </span>
                      </span>
                    </div>
                    <div className="flex-1 p-3 overflow-y-auto space-y-3 no-scrollbar bg-[#fff8f2]/40">
                      {readyOrders.length === 0 ? (
                        <EmptyColumnMessage text="ไม่มีออเดอร์รอเสิร์ฟ" />
                      ) : (
                        readyOrders.map((o) => (
                          <KitchenOrderCard
                            key={o.id}
                            order={o}
                            advanceOrderStatus={advanceOrderStatus}
                            regressOrderStatus={regressOrderStatus}
                            cancelOrder={cancelOrder}
                          />
                        ))
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                /* History List View */
                <div className="flex-1 bg-white border border-[#ece4d6] rounded-2xl p-4 overflow-y-auto no-scrollbar shadow-sm">
                  {completedOrders.length === 0 ? (
                    <EmptyColumnMessage text="ยังไม่มีประวัติออเดอร์" />
                  ) : (
                    <div className="space-y-2.5">
                      {completedOrders.map((o) => (
                        <HistoryOrderRow key={o.id} order={o} />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { supabase } from "../../lib/supabase";
import { adjustStockFromOrder } from "../../lib/supabase.service";
import {
  ChefHat,
  Volume2,
  VolumeX,
  PlusCircle,
  Filter,
  Trash2,
  Inbox,
  Menu,
  Table,
  BookOpen,
} from "lucide-react";
import {
  type OrderHistory,
} from "../../types";
import { BRAND, GOLD, INK_MUTED } from "../../constants/theme";
import { playNotificationSound } from "../../lib/sound";
import { EmptyColumnMessage } from "../../components/staff/empty-column-message";
import { KitchenSidebar } from "../../components/staff/kitchen-sidebar";
import { KitchenOrderCard } from "../../components/staff/kitchen-order-card";
import { HistoryOrderRow } from "../../components/staff/history-order-row";
import { TableManagementView } from "../../components/staff/table-management-view";
import { MenuManagementView } from "../../components/staff/menu-management-view";
import { StockManagementView } from "../../components/staff/stock-management-view";

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

  const handleLogout = async () => {
    document.body.style.display = "none";
    localStorage.removeItem("ran-lung-get-staff-token");
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  useEffect(() => {
    async function checkAuth() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) {
          window.location.href = "/login";
          return;
        }

        const { data, error } = await supabase
          .from("users")
          .select("*")
          .eq("auth_user_id", session.user.id)
          .maybeSingle();

        if (
          error ||
          !data ||
          (data.role !== "staff" && data.role !== "admin" && data.role !== "captain")
        ) {
          window.location.href = "/customer";
          return;
        }

        if (data.is_active === false) {
          alert("บัญชีของคุณอยู่ระหว่างรอการอนุมัติสิทธิ์ (Pending Approval)");
          await supabase.auth.signOut();
          window.location.href = "/login";
          return;
        }
      } catch (err) {
        window.location.href = "/login";
      }
    }
    checkAuth();
  }, []);

  const fetchSupabaseOrders = async () => {
    try {
      const { data: dbOrders, error: dbOrdersError } = await supabase
        .from("orders")
        .select(
          `
          *,
          customers (
            display_name,
            phone
          ),
          order_items (*)
        `,
        )
        .order("created_at", { ascending: false });

      if (!dbOrdersError && dbOrders) {
        const mappedOrders: OrderHistory[] = dbOrders.map((o: any) => {
          let localStatus = "รอดำเนินการ";
          if (o.status === "pending") localStatus = "รอดำเนินการ";
          else if (o.status === "preparing") localStatus = "กำลังทำ";
          else if (o.status === "delivering") localStatus = "พร้อมเสิร์ฟ";
          else if (o.status === "completed") localStatus = "สำเร็จ";
          else if (o.status === "cancelled") localStatus = "ยกเลิก";

          return {
            id: o.id,
            orderNumber: o.order_number,
            date:
              new Date(o.created_at).toLocaleDateString("th-TH", {
                day: "numeric",
                month: "short",
                year: "numeric",
              }) +
              " · " +
              new Date(o.created_at).toLocaleTimeString("th-TH", {
                hour: "2-digit",
                minute: "2-digit",
              }),
            items: (o.order_items || []).map((item: any) => ({
              name: item.name,
              qty: item.quantity,
              price: Number(item.unit_price),
              image: item.image || "",
            })),
            subtotal: Number(o.subtotal),
            delivery: Number(o.delivery_fee),
            total: Number(o.total),
            status: localStatus,
            orderType: o.order_type,
            customerName: o.customers?.display_name || "คุณลูกค้า",
            customerPhone: o.customers?.phone || "",
            deliveryAddress: o.delivery_address || "",
            tableNumber: o.table_number || "",
            queueNumber:
              o.queue_number ||
              (o.table_number?.startsWith("Q-")
                ? o.table_number
                : o.special_instructions?.match(/Q-\d+/)?.[0] || ""),
            note: o.special_instructions || "",
          };
        });

        setOrders((prev) => {
          const prevIds = new Set(prev.map((o) => o.id));
          const hasNew = mappedOrders.some((o) => !prevIds.has(o.id));
          if (hasNew && soundEnabled) playNotificationSound();

          const localOnly = prev.filter(
            (p) => !mappedOrders.some((m) => m.id === p.id || m.orderNumber === p.orderNumber),
          );
          const combined = [...mappedOrders, ...localOnly];
          localStorage.setItem("ran-lung-get-orders", JSON.stringify(combined));
          return combined;
        });
      }
    } catch (e) {
      console.error("Failed to fetch Supabase orders:", e);
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem("ran-lung-get-orders");
    if (saved) {
      try {
        setOrders(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
    fetchSupabaseOrders();

    const ordersCh = supabase
      .channel("staff-orders-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        fetchSupabaseOrders();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "order_items" }, () => {
        fetchSupabaseOrders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(ordersCh);
    };
  }, []);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "ran-lung-get-orders" && e.newValue) {
        try {
          const newOrders: OrderHistory[] = JSON.parse(e.newValue);
          setOrders((prev) => {
            const prevIds = new Set(prev.map((o) => o.id));
            const hasNew = newOrders.some((o) => !prevIds.has(o.id));
            if (hasNew && soundEnabled) playNotificationSound();
            return newOrders;
          });
        } catch (err) {
          console.error("Sync error:", err);
        }
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const triggerMockOrder = () => {
    const num = Math.floor(Math.random() * 9000) + 1000;
    const names = ["คุณ มานะ", "คุณ สมรัก", "คุณ ณเดช", "คุณ ญาญ่า", "คุณ กิ๊ฟ", "คุณ นิว"];
    const tbs = ["โต๊ะ 1", "โต๊ะ 2", "โต๊ะ 3", "โต๊ะ 4", "โต๊ะ 5"];
    const newOrder: OrderHistory = {
      id: "mock_" + Date.now(),
      orderNumber: "AK-" + num,
      date:
        new Date().toLocaleDateString("th-TH") +
        " · " +
        new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }),
      items: [
        { name: "กระเพราหมูกรอบ (ข้าวราด)", qty: 1, price: 70, image: "" },
        { name: "น้ำลำไย", qty: 2, price: 40, image: "" },
      ],
      subtotal: 150,
      delivery: 0,
      total: 150,
      status: "รอดำเนินการ",
      orderType: "dine-in",
      customerName: names[Math.floor(Math.random() * names.length)],
      tableNumber: tbs[Math.floor(Math.random() * tbs.length)],
      note: "เผ็ดปกติ",
    };
    setOrders((prev) => {
      const next = [newOrder, ...prev];
      localStorage.setItem("ran-lung-get-orders", JSON.stringify(next));
      return next;
    });
    if (soundEnabled) playNotificationSound();
  };

  const clearMockOrders = () => {
    setOrders((prev) => {
      const next = prev.filter((o) => !o.id.startsWith("mock_"));
      localStorage.setItem("ran-lung-get-orders", JSON.stringify(next));
      return next;
    });
  };

  const advanceOrderStatus = async (id: string) => {
    let nextStatus = "สำเร็จ";
    let dbStatus = "completed";
    const targetOrder = orders.find((o) => o.id === id);
    if (!targetOrder) return;
    if (targetOrder.status === "รอดำเนินการ") {
      nextStatus = "กำลังทำ";
      dbStatus = "preparing";
    } else if (targetOrder.status === "กำลังทำ") {
      nextStatus = "พร้อมเสิร์ฟ";
      dbStatus = "delivering";
    } else if (targetOrder.status === "พร้อมเสิร์ฟ") {
      nextStatus = "สำเร็จ";
      dbStatus = "completed";
    }
    const nextList = orders.map((o) => (o.id === id ? { ...o, status: nextStatus } : o));
    setOrders(nextList);
    localStorage.setItem("ran-lung-get-orders", JSON.stringify(nextList));
    try {
      const { error } = await supabase.from("orders").update({ status: dbStatus }).eq("id", id);
      if (error) throw error;
      if (dbStatus === "completed") {
        const itemsToAdjust = targetOrder.items.map((i) => ({ name: i.name, qty: i.qty }));
        await adjustStockFromOrder(itemsToAdjust, "deduct");
      }
    } catch {
      console.warn("Offline status update completed locally.");
    }
  };

  const regressOrderStatus = async (id: string) => {
    let nextStatus = "รอดำเนินการ";
    let dbStatus = "pending";
    const targetOrder = orders.find((o) => o.id === id);
    if (!targetOrder) return;
    if (targetOrder.status === "กำลังทำ") {
      nextStatus = "รอดำเนินการ";
      dbStatus = "pending";
    } else if (targetOrder.status === "พร้อมเสิร์ฟ") {
      nextStatus = "กำลังทำ";
      dbStatus = "preparing";
    } else if (targetOrder.status === "สำเร็จ") {
      nextStatus = "พร้อมเสิร์ฟ";
      dbStatus = "delivering";
    }
    const nextList = orders.map((o) => (o.id === id ? { ...o, status: nextStatus } : o));
    setOrders(nextList);
    localStorage.setItem("ran-lung-get-orders", JSON.stringify(nextList));
    try {
      await supabase.from("orders").update({ status: dbStatus }).eq("id", id);
    } catch {}
  };

  const cancelOrder = async (id: string) => {
    if (!confirm("คุณต้องการยกเลิกคำสั่งซื้อนี้ใช่หรือไม่?")) return;
    const nextList = orders.map((o) => (o.id === id ? { ...o, status: "ยกเลิก" } : o));
    setOrders(nextList);
    localStorage.setItem("ran-lung-get-orders", JSON.stringify(nextList));
    try {
      await supabase.from("orders").update({ status: "cancelled" }).eq("id", id);
    } catch {}
  };

  const stats = useMemo(() => {
    const active = orders.filter((o) => o.status !== "สำเร็จ" && o.status !== "ยกเลิก");
    return {
      totalActive: active.length,
      waiting: orders.filter((o) => o.status === "รอดำเนินการ").length,
      cooking: orders.filter((o) => o.status === "กำลังทำ").length,
      ready: orders.filter((o) => o.status === "พร้อมเสิร์ฟ").length,
      completed: orders.filter((o) => o.status === "สำเร็จ").length,
    };
  }, [orders]);

  const ordersByStatus = useMemo(() => {
    const list = orders.filter((o) => typeFilter === "all" || o.orderType === typeFilter);
    return {
      waiting: list.filter((o) => o.status === "รอดำเนินการ").reverse(),
      cooking: list.filter((o) => o.status === "กำลังทำ"),
      ready: list.filter((o) => o.status === "พร้อมเสิร์ฟ"),
    };
  }, [orders, typeFilter]);

  const filteredOrders = useMemo(() => {
    const list = orders.filter((o) => typeFilter === "all" || o.orderType === typeFilter);
    if (statusFilter === "active")
      return list.filter((o) => o.status !== "สำเร็จ" && o.status !== "ยกเลิก");
    return list.filter((o) => o.status === statusFilter);
  }, [orders, statusFilter, typeFilter]);

  const menuSummary = useMemo(() => {
    const activeCookingOrders = orders.filter(
      (o) => o.status === "กำลังทำ" || o.status === "รอดำเนินการ",
    );
    const counts: Record<string, number> = {};
    activeCookingOrders.forEach((o) => {
      o.items.forEach((item) => {
        const cleanName = item.name.split(" (")[0];
        counts[cleanName] = (counts[cleanName] || 0) + item.qty;
      });
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [orders]);

  const getViewTitle = () => {
    if (view === "kitchen") return "จอจัดการครัวลุงเกตุ";
    if (view === "tables") return "ผังที่นั่ง & จัดการโต๊ะ Walk-in";
    if (view === "menu") return "จัดการเมนูอาหาร";
    return "จัดการคลังวัตถุดิบ & สต็อก";
  };

  const getViewSubtitle = () => {
    if (view === "kitchen") return "ระบบจัดคิวอาหารและมอนิเตอร์หน้าเตา";
    if (view === "tables") return "เพิ่ม/ลบโต๊ะ และตรวจสอบสถานะโต๊ะอาหารเรียลไทม์";
    if (view === "menu") return "เพิ่ม แก้ไข ลบเมนูอาหาร พร้อมตัวเลือกและรูปภาพ";
    return "ตรวจสอบสต็อกวัตถุดิบ ปรับจำนวน และเกณฑ์แจ้งเตือนสต็อกต่ำ";
  };

  const getViewIcon = () => {
    if (view === "kitchen") return <ChefHat className="h-5 w-5" color={GOLD} />;
    if (view === "tables") return <Table className="h-5 w-5" color={GOLD} />;
    if (view === "menu") return <BookOpen className="h-5 w-5" color={GOLD} />;
    return <Inbox className="h-5 w-5" color={GOLD} />;
  };

  return (
    <div className="min-h-screen bg-[#fff8f2] text-gray-900 flex flex-col md:flex-row font-sans">
      {/* Mobile Drawer */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-black/60 z-40 md:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.25 }}
              className="fixed top-0 left-0 bottom-0 w-[280px] z-[55] flex flex-col md:hidden shadow-2xl"
            >
              <KitchenSidebar
                view={view}
                setView={setView}
                onClose={() => setSidebarOpen(false)}
                handleLogout={handleLogout}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-72 h-screen shrink-0 border-r border-[#ece4d6] shadow-soft z-20">
        <KitchenSidebar view={view} setView={setView} handleLogout={handleLogout} />
      </aside>

      {/* Workspace */}
      <div className="flex-1 flex flex-col h-screen overflow-y-auto min-w-0">
        {/* Desktop Header */}
        <header className="hidden md:block bg-white border-b border-[#ece4d6] p-4 sticky top-0 z-30 shadow-sm shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-[#002e47] text-white shadow-md">
                {getViewIcon()}
              </div>
              <div>
                <h1
                  className="text-base sm:text-lg font-black tracking-tight"
                  style={{ color: BRAND }}
                >
                  {getViewTitle()}
                </h1>
                <p className="text-xs font-semibold text-slate-500">{getViewSubtitle()}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs">
              {view === "kitchen" && (
                <div className="bg-[#fcfbf9] border border-[#ece4d6] px-3 py-1.5 rounded-xl flex items-center gap-1.5 font-bold">
                  <span className="text-[10px] text-slate-500">คิวรอดำเนินการ:</span>
                  <span className="text-xs sm:text-sm font-black" style={{ color: BRAND }}>
                    {stats.totalActive}
                  </span>
                </div>
              )}
              {(view === "kitchen" || view === "tables") && (
                <>
                  <button
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    className={`p-2 rounded-xl border transition active:scale-95 cursor-pointer ${
                      soundEnabled
                        ? "bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100"
                        : "bg-slate-100 border-slate-200 text-slate-400 hover:bg-slate-200"
                    }`}
                  >
                    {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
                  </button>
                  {view === "kitchen" && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={clearMockOrders}
                        className="flex items-center gap-1.5 hover:bg-red-100 active:scale-95 text-red-600 bg-red-50 px-3.5 py-2.5 rounded-xl font-bold text-xs tracking-wider transition shadow-sm cursor-pointer border border-red-200"
                      >
                        <Trash2 size={13} />
                        <span>ยกเลิกจำลองออเดอร์</span>
                      </button>
                      <button
                        onClick={triggerMockOrder}
                        className="flex items-center gap-1.5 hover:opacity-90 active:scale-95 text-[#002e47] px-3.5 py-2.5 rounded-xl font-bold text-xs tracking-wider transition shadow-sm cursor-pointer border border-[#002e47]/10"
                        style={{ background: GOLD }}
                      >
                        <PlusCircle size={13} />
                        <span>จำลองออเดอร์</span>
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </header>

        {/* Mobile Header */}
        <header className="block md:hidden bg-white border-b border-[#ece4d6] p-3 sticky top-0 z-30 shadow-sm shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-[#002e47] transition active:scale-95 cursor-pointer border border-[#ece4d6]"
              >
                <Menu size={18} />
              </button>
              <div>
                <h1 className="text-sm font-black tracking-tight" style={{ color: BRAND }}>
                  {view === "kitchen" && "ครัวลุงเกตุ"}
                  {view === "tables" && "ผังโต๊ะอาหาร"}
                  {view === "menu" && "จัดการเมนู"}
                  {view === "stock" && "คลังสต็อกวัตถุดิบ"}
                </h1>
                <p className="text-[9px] font-bold text-slate-500">
                  {view === "kitchen" && `คิวค้าง: ${stats.totalActive}`}
                  {view === "tables" && "จัดการผังโต๊ะเรียลไทม์"}
                  {view === "menu" && "จัดการรายการอาหาร"}
                  {view === "stock" && "ตรวจสอบสต็อก"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {(view === "kitchen" || view === "tables") && (
                <button
                  onClick={triggerMockOrder}
                  className="bg-[#fcc14a] text-[#002e47] text-[10px] px-2.5 py-1 rounded-xl font-bold"
                >
                  + จำลอง
                </button>
              )}
              <button
                onClick={handleLogout}
                className="bg-red-50 text-red-600 text-[10px] px-2.5 py-1 rounded-xl font-bold border border-red-100 active:scale-95 transition"
              >
                ออก
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="p-3 sm:p-4 lg:p-6 w-full mx-auto flex-1 flex flex-col">
          {view === "tables" ? (
            <TableManagementView orders={orders} onRefreshOrders={fetchSupabaseOrders} />
          ) : view === "menu" ? (
            <MenuManagementView />
          ) : view === "stock" ? (
            <StockManagementView handleLogout={handleLogout} />
          ) : (
            <>
              {/* Kitchen View Tabs */}
              <div className="hidden md:flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-white border border-[#ece4d6] p-3 rounded-2xl shrink-0 shadow-sm mb-6">
                <div className="flex flex-row overflow-x-auto no-scrollbar gap-1 w-full sm:w-auto shrink-0">
                  {[
                    { id: "active", label: "คิวปัจจุบัน (Kanban)", count: stats.totalActive },
                    {
                      id: "รอดำเนินการ",
                      label: "ออเดอร์ใหม่",
                      count: stats.waiting,
                      dotColor: "bg-amber-500",
                    },
                    {
                      id: "กำลังทำ",
                      label: "กำลังปรุง",
                      count: stats.cooking,
                      dotColor: "bg-blue-500",
                    },
                    {
                      id: "พร้อมเสิร์ฟ",
                      label: "พร้อมเสิร์ฟ",
                      count: stats.ready,
                      dotColor: "bg-emerald-500",
                    },
                    { id: "สำเร็จ", label: "เสร็จสิ้น", count: stats.completed },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setStatusFilter(tab.id)}
                      className={`relative flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold text-xs tracking-wider transition-all shrink-0 cursor-pointer ${
                        statusFilter === tab.id
                          ? "bg-[#002e47] text-white shadow-inner"
                          : "text-[#5a6e7a] hover:text-[#002e47] hover:bg-slate-50"
                      }`}
                    >
                      {(tab as any).dotColor && (
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${(tab as any).dotColor} animate-pulse`}
                        />
                      )}
                      <span>{tab.label}</span>
                      {tab.count !== undefined && (
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${statusFilter === tab.id ? "bg-slate-700 text-white" : "bg-slate-100 text-[#5a6e7a]"}`}
                        >
                          {tab.count}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                  <div
                    className="flex items-center gap-1 text-xs font-bold shrink-0 mr-1"
                    style={{ color: INK_MUTED }}
                  >
                    <Filter size={13} />
                    <span>ช่องทาง:</span>
                  </div>
                  {[
                    {
                      id: "all",
                      label: "ทั้งหมด",
                      icon: null,
                      count: orders.filter(
                        (o) => o.status !== "สำเร็จ" && o.status !== "ยกเลิก",
                      ).length,
                    },
                    {
                      id: "dine-in",
                      label: "ทานที่ร้าน",
                      icon: "🍽️",
                      count: orders.filter(
                        (o) =>
                          o.orderType === "dine-in" &&
                          o.status !== "สำเร็จ" &&
                          o.status !== "ยกเลิก",
                      ).length,
                    },
                    {
                      id: "takeaway",
                      label: "กลับบ้าน",
                      icon: "🛍️",
                      count: orders.filter(
                        (o) =>
                          o.orderType === "takeaway" &&
                          o.status !== "สำเร็จ" &&
                          o.status !== "ยกเลิก",
                      ).length,
                    },
                    {
                      id: "delivery",
                      label: "เดลิเวอรี่",
                      icon: "🛵",
                      count: orders.filter(
                        (o) =>
                          o.orderType === "delivery" &&
                          o.status !== "สำเร็จ" &&
                          o.status !== "ยกเลิก",
                      ).length,
                    },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTypeFilter(t.id)}
                      className={`px-2.5 py-1 rounded-xl text-xs font-black transition flex items-center gap-1 shrink-0 cursor-pointer border ${
                        typeFilter === t.id
                          ? "bg-[#002e47] text-[#fcc14a] border-[#002e47] shadow-sm"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {t.icon && <span>{t.icon}</span>}
                      <span>{t.label}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${typeFilter === t.id ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"}`}
                      >
                        {t.count}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Cooking Summary */}
              {menuSummary.length > 0 && (
                <div className="bg-white border border-[#ece4d6] p-3 rounded-2xl flex flex-col sm:flex-row sm:items-center gap-2.5 shrink-0 shadow-sm mb-6">
                  <div className="flex items-center gap-1.5 text-xs font-black text-[#002e47] shrink-0">
                    <ChefHat size={14} className="text-[#fcc14a]" />
                    <span>ยอดรวมเมนูเตาอาหาร:</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {menuSummary.map(([name, qty]) => (
                      <div
                        key={name}
                        className="flex items-center gap-1.5 bg-[#002e47]/5 border border-[#002e47]/10 rounded-xl px-3 py-1 text-xs shrink-0 font-bold"
                      >
                        <span className="text-[#002e47]">{name}</span>
                        <span className="bg-[#fcc14a] text-[#002e47] font-black px-1.5 py-0.2 rounded-md text-[10px]">
                          x{qty}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Order Area */}
              <div className="flex-1 overflow-y-auto no-scrollbar">
                {statusFilter === "active" ? (
                  <div className="hidden md:grid md:grid-cols-3 gap-6 min-w-[960px]">
                    <div className="flex flex-col bg-white rounded-3xl border border-[#ece4d6] shadow-soft">
                      <div className="p-4 bg-amber-500/10 border-b border-[#ece4d6] flex items-center justify-between shrink-0">
                        <span className="font-black text-sm text-[#002e47]">ออเดอร์ใหม่</span>
                        <span className="text-white text-xs font-black px-2 py-0.5 rounded-full bg-amber-500">
                          {ordersByStatus.waiting.length}
                        </span>
                      </div>
                      <div className="p-4 space-y-4 bg-[#f8fafc]/50 flex-1 overflow-y-auto max-h-[70vh]">
                        {ordersByStatus.waiting.length === 0 ? (
                          <EmptyColumnMessage text="ไม่มีออเดอร์ใหม่" />
                        ) : (
                          ordersByStatus.waiting.map((o) => (
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
                    <div className="flex flex-col bg-white rounded-3xl border border-[#ece4d6] shadow-soft">
                      <div className="p-4 bg-blue-50 border-b border-[#ece4d6] flex items-center justify-between shrink-0">
                        <span className="font-black text-sm text-[#002e47]">กำลังปรุง</span>
                        <span className="text-white text-xs font-black px-2 py-0.5 rounded-full bg-blue-600">
                          {ordersByStatus.cooking.length}
                        </span>
                      </div>
                      <div className="p-4 space-y-4 bg-[#f8fafc]/50 flex-1 overflow-y-auto max-h-[70vh]">
                        {ordersByStatus.cooking.length === 0 ? (
                          <EmptyColumnMessage text="ไม่มีรายการกำลังปรุง" />
                        ) : (
                          ordersByStatus.cooking.map((o) => (
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
                    <div className="flex flex-col bg-white rounded-3xl border border-[#ece4d6] shadow-soft">
                      <div className="p-4 bg-emerald-50 border-b border-[#ece4d6] flex items-center justify-between shrink-0">
                        <span className="font-black text-sm text-[#002e47]">
                          พร้อมเสิร์ฟ / รอส่ง
                        </span>
                        <span className="text-white text-xs font-black px-2 py-0.5 rounded-full bg-emerald-500">
                          {ordersByStatus.ready.length}
                        </span>
                      </div>
                      <div className="p-4 space-y-4 bg-[#f8fafc]/50 flex-1 overflow-y-auto max-h-[70vh]">
                        {ordersByStatus.ready.length === 0 ? (
                          <EmptyColumnMessage text="ไม่มีออเดอร์พร้อมเสิร์ฟ" />
                        ) : (
                          ordersByStatus.ready.map((o) => (
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
                  <div className="bg-white rounded-3xl border border-[#ece4d6] p-4">
                    <h2 className="text-sm font-black mb-4">ประวัติออเดอร์ ({statusFilter})</h2>
                    <div className="space-y-3">
                      {filteredOrders.length === 0 ? (
                        <p className="text-center text-slate-400 py-12">ไม่มีรายการ</p>
                      ) : (
                        filteredOrders.map((o) =>
                          statusFilter === "สำเร็จ" ? (
                            <HistoryOrderRow key={o.id} order={o} />
                          ) : (
                            <KitchenOrderCard
                              key={o.id}
                              order={o}
                              advanceOrderStatus={advanceOrderStatus}
                              regressOrderStatus={regressOrderStatus}
                              cancelOrder={cancelOrder}
                            />
                          ),
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
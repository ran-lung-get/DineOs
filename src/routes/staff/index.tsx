import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { supabase } from "../../lib/supabase";
import { adjustStockFromOrder } from "../../lib/supabase.service";
import { MENU } from "../customer/index";
import {
  ChefHat,
  CheckCircle,
  Clock,
  RotateCcw,
  Volume2,
  VolumeX,
  PlusCircle,
  Filter,
  Check,
  Utensils,
  Bike,
  ShoppingBag,
  Home,
  Trash2,
  Flame,
  Inbox,
  Trophy,
  ClipboardList,
  Menu,
  Table,
  X,
  ChevronRight,
  Edit2,
  Search,
  Eye,
  EyeOff,
  AlertTriangle,
  LogOut
} from "lucide-react";
import { type MenuItem } from "../customer/index";

export const Route = createFileRoute("/staff/")({
  component: KitchenMonitor,
});

type OrderType = "dine-in" | "takeaway" | "delivery";
type OrderHistory = {
  id: string;
  orderNumber: string;
  date: string;
  items: { name: string; qty: number; price: number; image: string }[];
  subtotal: number;
  delivery: number;
  total: number;
  status: string; // "รอดำเนินการ" | "กำลังทำ" | "พร้อมเสิร์ฟ" | "สำเร็จ" | "ยกเลิก"
  orderType?: OrderType;
  customerName?: string;
  tableNumber?: string;
  queueNumber?: string;
  note?: string;
};

const BRAND = "#002e47";
const GOLD = "#fcc14a";
const INK_MUTED = "#5a6e7a";

// Helper to play kitchen sound
function playNotificationSound() {
  try {
    const context = new (window.AudioContext || (window as any).webkitAudioContext)();

    // Play double high-pitched beep
    const playBeep = (time: number, freq: number) => {
      const osc = context.createOscillator();
      const gain = context.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, time);
      gain.gain.setValueAtTime(0.15, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);
      osc.connect(gain);
      gain.connect(context.destination);
      osc.start(time);
      osc.stop(time + 0.15);
    };

    const now = context.currentTime;
    playBeep(now, 880); // A5
    playBeep(now + 0.15, 1046.5); // C6
  } catch (err) {
    console.warn("Sound play failed:", err);
  }
}

const getTimestampFromOrderId = (id: string) => {
  if (id.startsWith("hist_")) {
    const tsString = id.replace("hist_", "");
    const ts = parseInt(tsString);
    if (!isNaN(ts) && ts > 1000000000000) return ts;
  }
  return Date.now();
};

function EmptyColumnMessage({ text }: { text: string }) {
  return (
    <div className="py-12 text-center text-slate-400 font-bold border-2 border-dashed border-slate-100 rounded-2xl">
      <ChefHat size={32} className="opacity-20 mx-auto mb-2 text-slate-500" />
      <span className="text-xs">{text}</span>
    </div>
  );
}

// Kitchen Sidebar Content
function KitchenSidebarContent({
  view,
  setView,
  onClose,
  handleLogout
}: {
  view: "kitchen" | "tables" | "menu" | "stock";
  setView: (v: "kitchen" | "tables" | "menu" | "stock") => void;
  onClose?: () => void;
  handleLogout: () => void;
}) {
  return (
    <div className="flex flex-col h-full bg-[#002e47] text-white">
      {/* Sidebar Brand Header */}
      <div className="p-5 border-b border-white/10 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 text-[#fcc14a] border border-white/15">
            <ChefHat size={22} className="stroke-[2.5]" />
          </div>
          <div>
            <h2 className="font-black text-sm tracking-tight text-white uppercase">ระบบจัดการครัว</h2>
            <p className="text-[9px] font-bold text-[#fcc14a] tracking-wider uppercase">KITCHEN MONITOR (STAFF)</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="md:hidden text-white/50 hover:text-white p-1">
            <X size={18} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest block px-2 mb-2">เมนูพนักงาน</span>

          <button
            onClick={() => {
              setView("kitchen");
              if (onClose) onClose();
            }}
            className={`w-full flex items-center gap-3 px-3 py-3.5 rounded-xl text-left transition duration-200 cursor-pointer ${view === "kitchen"
                ? "bg-white/10 text-white shadow-inner font-black border-l-4 border-[#fcc14a]"
                : "text-white/70 hover:text-white hover:bg-white/5 font-medium border-l-4 border-transparent"
              }`}
          >
            <ChefHat size={18} className={view === "kitchen" ? "text-[#fcc14a]" : "text-white/60"} />
            <span className="text-sm">จอจัดการครัว</span>
          </button>

          <button
            onClick={() => {
              setView("tables");
              if (onClose) onClose();
            }}
            className={`w-full flex items-center gap-3 px-3 py-3.5 rounded-xl text-left transition duration-200 cursor-pointer ${view === "tables"
                ? "bg-white/10 text-white shadow-inner font-black border-l-4 border-[#fcc14a]"
                : "text-white/70 hover:text-white hover:bg-white/5 font-medium border-l-4 border-transparent"
              }`}
          >
            <Table size={18} className={view === "tables" ? "text-[#fcc14a]" : "text-white/60"} />
            <span className="text-sm">ผังโต๊ะอาหาร</span>
          </button>

          <button
            onClick={() => {
              setView("menu");
              if (onClose) onClose();
            }}
            className={`w-full flex items-center gap-3 px-3 py-3.5 rounded-xl text-left transition duration-200 cursor-pointer ${view === "menu"
                ? "bg-white/10 text-white shadow-inner font-black border-l-4 border-[#fcc14a]"
                : "text-white/70 hover:text-white hover:bg-white/5 font-medium border-l-4 border-transparent"
              }`}
          >
            <ClipboardList size={18} className={view === "menu" ? "text-[#fcc14a]" : "text-white/60"} />
            <span className="text-sm">จัดการเมนูอาหาร</span>
          </button>

          <button
            onClick={() => {
              setView("stock");
              if (onClose) onClose();
            }}
            className={`w-full flex items-center gap-3 px-3 py-3.5 rounded-xl text-left transition duration-200 cursor-pointer ${view === "stock"
                ? "bg-white/10 text-white shadow-inner font-black border-l-4 border-[#fcc14a]"
                : "text-white/70 hover:text-white hover:bg-white/5 font-medium border-l-4 border-transparent"
              }`}
          >
            <Inbox size={18} className={view === "stock" ? "text-[#fcc14a]" : "text-white/60"} />
            <span className="text-sm">จัดการสต็อกวัตถุดิบ</span>
          </button>

          <a
            href="/customer"
            onClick={(e) => {
              e.preventDefault();
              localStorage.removeItem("ran-lung-get-staff-token");
              if (onClose) onClose();
              window.location.href = "/customer";
            }}
            className="w-full flex items-center gap-3 px-3 py-3.5 rounded-xl text-left text-white/70 hover:text-white hover:bg-white/5 font-medium transition duration-200 cursor-pointer border-l-4 border-transparent"
          >
            <Home size={18} className="text-white/60" />
            <span className="text-sm">สั่งอาหาร (หน้าลูกค้า)</span>
          </a>
        </div>
      </div>

      {/* Logout footer */}
      <div className="p-4 border-t border-white/10 bg-white/2 shrink-0 flex flex-col gap-2">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left text-red-200/70 hover:text-red-200 hover:bg-red-950/20 font-medium transition duration-200 cursor-pointer border border-red-500/10 hover:border-red-500/30"
        >
          <LogOut size={16} />
          <span className="text-xs">ออกจากระบบ</span>
        </button>
        <p className="text-[9px] text-white/40 text-center font-semibold mt-1">
          ระบบจัดการร้านค้า v1.2.0 · ครัวลุงเกตุ
        </p>
      </div>
    </div>
  );
}

// ── Kitchen Monitor Main Page Component ──
function KitchenMonitor() {
  const [orders, setOrders] = useState<OrderHistory[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("active");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [view, setView] = useState<"kitchen" | "tables" | "menu" | "stock">("kitchen");

  const handleLogout = async () => {
    localStorage.removeItem("ran-lung-get-staff-token");
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  // Auth Check for Staff — ใช้ Supabase session แทน localStorage token
  useEffect(() => {
    // ปิดระบบเช็คสิทธิ์ชั่วคราว เพื่อให้เข้าดูหน้า Staff ได้โดยไม่เด้งไปหน้าล็อกอิน
    /*
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        window.location.href = "/login";
        return;
      }
      
      const { data } = await supabase
        .from("users")
        .select("role")
        .eq("auth_user_id", session.user.id)
        .maybeSingle();
        
      const role = data?.role ?? "customer";
      if (role !== "staff" && role !== "admin") {
        window.location.href = "/customer";
      }
    }
    checkAuth();
    */
  }, []);

  const fetchSupabaseOrders = async () => {
    try {
      const { data: dbOrders, error: dbOrdersError } = await supabase
        .from("orders")
        .select(`
          *,
          customers (
            display_name
          ),
          order_items (*)
        `)
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
            date: new Date(o.created_at).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" }) + " · " + new Date(o.created_at).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }),
            items: (o.order_items || []).map((item: any) => ({
              name: item.name,
              qty: item.quantity,
              price: Number(item.unit_price),
              image: item.image || ""
            })),
            subtotal: Number(o.subtotal),
            delivery: Number(o.delivery_fee),
            total: Number(o.total),
            status: localStatus,
            orderType: o.order_type,
            customerName: o.customers?.display_name || "คุณลูกค้า",
            tableNumber: o.table_number || "",
            queueNumber: o.queue_number || "",
            note: o.special_instructions || ""
          };
        });

        setOrders((prev) => {
          const localOnly = prev.filter(p => !p.id.startsWith("hist_") && !p.id.includes("-") && !mappedOrders.some(m => m.id === p.id));
          const combined = [...mappedOrders, ...localOnly];
          localStorage.setItem("ran-lung-get-orders", JSON.stringify(combined));
          return combined;
        });
      }
    } catch (e) {
      console.error("Failed to fetch Supabase orders:", e);
    }
  };

  // Load orders from localStorage and Supabase
  useEffect(() => {
    const saved = localStorage.getItem("ran-lung-get-orders");
    if (saved) {
      try {
        setOrders(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse orders:", e);
      }
    }
    fetchSupabaseOrders();

    // Subscribe to realtime orders changes
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

  // Listen to storage sync events
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "ran-lung-get-orders" && e.newValue) {
        try {
          const newOrders: OrderHistory[] = JSON.parse(e.newValue);
          setOrders((prev) => {
            const prevIds = new Set(prev.map(o => o.id));
            const hasNew = newOrders.some(o => !prevIds.has(o.id));
            if (hasNew && soundEnabled) {
              playNotificationSound();
            }
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

  // Mock order generation for testing
  const triggerMockOrder = () => {
    const num = Math.floor(Math.random() * 9000) + 1000;
    const names = ["คุณ มานะ", "คุณ สมรัก", "คุณ ณเดช", "คุณ ญาญ่า", "คุณ กิ๊ฟ", "คุณ นิว"];
    const tbs = ["โต๊ะ 1", "โต๊ะ 2", "โต๊ะ 3", "โต๊ะ 4", "โต๊ะ 5", "โต๊ะ 6", "โต๊ะ 7", "โต๊ะ 8"];

    const itemsMock = [
      { name: "กระเพราหมูกรอบ (ข้าวราด)", qty: 1, price: 70, image: "" },
      { name: "ผัดคะน้าหมูกรอบ (ข้าวราด)", qty: 1, price: 70, image: "" },
      { name: "น้ำลำไย", qty: 2, price: 40, image: "" }
    ];

    const newOrder: OrderHistory = {
      id: "mock_" + Date.now(),
      orderNumber: "AK-" + num,
      date: new Date().toLocaleDateString("th-TH") + " · " + new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }),
      items: itemsMock,
      subtotal: 180,
      delivery: 0,
      total: 180,
      status: "รอดำเนินการ",
      orderType: "dine-in",
      customerName: names[Math.floor(Math.random() * names.length)],
      tableNumber: tbs[Math.floor(Math.random() * tbs.length)],
      note: "เผ็ดปกติ ขอไข่ดาวกรอบๆ"
    };

    setOrders(prev => {
      const next = [newOrder, ...prev];
      localStorage.setItem("ran-lung-get-orders", JSON.stringify(next));
      return next;
    });

    if (soundEnabled) {
      playNotificationSound();
    }
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

    // Update locally immediately
    const nextList = orders.map((o) => (o.id === id ? { ...o, status: nextStatus } : o));
    setOrders(nextList);
    localStorage.setItem("ran-lung-get-orders", JSON.stringify(nextList));

    // Supabase update
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: dbStatus })
        .eq("id", id);
      if (error) throw error;

      // Adjust raw stock levels when order completes
      if (dbStatus === "completed") {
        const itemsToAdjust = targetOrder.items.map((i) => ({ name: i.name, qty: i.qty }));
        await adjustStockFromOrder(itemsToAdjust, "deduct");
      }
    } catch (e) {
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
    } catch { }
  };

  const cancelOrder = async (id: string) => {
    if (!confirm("คุณต้องการยกเลิกคำสั่งซื้อนี้ใช่หรือไม่?")) return;

    const nextList = orders.map((o) => (o.id === id ? { ...o, status: "ยกเลิก" } : o));
    setOrders(nextList);
    localStorage.setItem("ran-lung-get-orders", JSON.stringify(nextList));

    try {
      await supabase.from("orders").update({ status: "cancelled" }).eq("id", id);
    } catch { }
  };

  const clearCompletedOrders = () => {
    if (!confirm("คุณต้องการล้างรายการออเดอร์ที่เสร็จสิ้นออกใช่หรือไม่? (ล้างจากหน้าจอของพนักงานเท่านั้น)")) return;
    const nextList = orders.filter(o => o.status !== "สำเร็จ" && o.status !== "ยกเลิก");
    setOrders(nextList);
    localStorage.setItem("ran-lung-get-orders", JSON.stringify(nextList));
  };

  // Status aggregation stats
  const stats = useMemo(() => {
    const active = orders.filter(o => o.status !== "สำเร็จ" && o.status !== "ยกเลิก");
    const waiting = orders.filter(o => o.status === "รอดำเนินการ");
    const cooking = orders.filter(o => o.status === "กำลังทำ");
    const ready = orders.filter(o => o.status === "พร้อมเสิร์ฟ");
    const completed = orders.filter(o => o.status === "สำเร็จ");

    return {
      totalActive: active.length,
      waiting: waiting.length,
      cooking: cooking.length,
      ready: ready.length,
      completed: completed.length
    };
  }, [orders]);

  // Kanban view grouped orders
  const ordersByStatus = useMemo(() => {
    const list = orders.filter(o => typeFilter === "all" || o.orderType === typeFilter);
    return {
      waiting: list.filter(o => o.status === "รอดำเนินการ").reverse(),
      cooking: list.filter(o => o.status === "กำลังทำ"),
      ready: list.filter(o => o.status === "พร้อมเสิร์ฟ")
    };
  }, [orders, typeFilter]);

  // Filtering for list view
  const filteredOrders = useMemo(() => {
    const list = orders.filter(o => typeFilter === "all" || o.orderType === typeFilter);
    if (statusFilter === "active") {
      return list.filter(o => o.status !== "สำเร็จ" && o.status !== "ยกเลิก");
    }
    return list.filter(o => o.status === statusFilter);
  }, [orders, statusFilter, typeFilter]);

  // Items Summary aggregates
  const menuSummary = useMemo(() => {
    const activeCookingOrders = orders.filter(o => o.status === "กำลังทำ" || o.status === "รอดำเนินการ");
    const counts: Record<string, number> = {};
    activeCookingOrders.forEach(o => {
      o.items.forEach(item => {
        const cleanName = item.name.split(" (")[0];
        counts[cleanName] = (counts[cleanName] || 0) + item.qty;
      });
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [orders]);

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
              <KitchenSidebarContent
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
        <KitchenSidebarContent view={view} setView={setView} handleLogout={handleLogout} />
      </aside>

      {/* Workspace */}
      <div className="flex-1 flex flex-col h-screen overflow-y-auto min-w-0">
        {/* Desktop Header */}
        <header className="hidden md:block bg-white border-b border-[#ece4d6] p-4 sticky top-0 z-30 shadow-sm shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-[#002e47] text-white shadow-md">
                {view === "kitchen" && <ChefHat className="h-5 w-5" color={GOLD} />}
                {view === "tables" && <Table className="h-5 w-5" color={GOLD} />}
                {view === "menu" && <ClipboardList className="h-5 w-5" color={GOLD} />}
                {view === "stock" && <Inbox className="h-5 w-5" color={GOLD} />}
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-black tracking-tight" style={{ color: BRAND }}>
                  {view === "kitchen" && "จอจัดการครัวลุงเกตุ"}
                  {view === "tables" && "ผังที่นั่ง & จัดการโต๊ะ Walk-in"}
                  {view === "menu" && "จัดการเมนูอาหาร"}
                  {view === "stock" && "จัดการคลังวัตถุดิบ & สต็อก"}
                </h1>
                <p className="text-xs font-semibold text-slate-500">
                  {view === "kitchen" && "ระบบจัดคิวอาหารและมอนิเตอร์หน้าเตา"}
                  {view === "tables" && "ตรวจสอบและเปลี่ยนสถานะโต๊ะอาหาร (ว่าง / มีลูกค้า) หน้าร้าน"}
                  {view === "menu" && "เพิ่ม ลบ และแก้ไขราคา รายละเอียด เมนูอาหาร"}
                  {view === "stock" && "ตรวจสอบสต็อกวัตถุดิบ ปรับจำนวน และเกณฑ์แจ้งเตือนสต็อกต่ำ"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              {view === "kitchen" && (
                <div className="bg-[#fcfbf9] border border-[#ece4d6] px-3 py-1.5 rounded-xl flex items-center gap-1.5 font-bold">
                  <span className="text-[10px] text-slate-500">คิวรอดำเนินการ:</span>
                  <span className="text-xs sm:text-sm font-black" style={{ color: BRAND }}>{stats.totalActive}</span>
                </div>
              )}
 
              {(view === "kitchen" || view === "tables") && (
                <>
                  <button
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    className={`p-2 rounded-xl border transition active:scale-95 cursor-pointer ${soundEnabled
                        ? "bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100"
                        : "bg-slate-100 border-slate-200 text-slate-400 hover:bg-slate-200"
                      }`}
                  >
                    {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
                  </button>
 
                  <button
                    onClick={triggerMockOrder}
                    className="flex items-center gap-1.5 hover:opacity-90 active:scale-95 text-[#002e47] px-3.5 py-2.5 rounded-xl font-bold text-xs tracking-wider transition shadow-sm cursor-pointer border border-[#002e47]/10"
                    style={{ background: GOLD }}
                  >
                    <PlusCircle size={13} />
                    <span>จำลองออเดอร์</span>
                  </button>
                </>
              )}

              
            </div>
          </div>
        </header>

        {/* Mobile Sticky Top Header */}
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

        {/* Main content view */}
        <main className="p-3 sm:p-4 lg:p-6 w-full mx-auto flex-1 flex flex-col">
          {view === "tables" ? (
            <TableManagementView orders={orders} onRefreshOrders={fetchSupabaseOrders} />
          ) : view === "menu" ? (
            <MenuManagementView />
          ) : view === "stock" ? (
            <StockManagementView handleLogout={handleLogout} />
          ) : (
            <>
              {/* Navigation Tabs and Channel Filters */}
              <div className="hidden md:flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-white border border-[#ece4d6] p-3 rounded-2xl shrink-0 shadow-sm mb-6">
                <div className="flex flex-row overflow-x-auto no-scrollbar gap-1 w-full sm:w-auto shrink-0">
                  {[
                    { id: "active", label: "คิวปัจจุบัน (Kanban)", count: stats.totalActive },
                    { id: "รอดำเนินการ", label: "ออเดอร์ใหม่", count: stats.waiting, dotColor: "bg-amber-500" },
                    { id: "กำลังทำ", label: "กำลังปรุง", count: stats.cooking, dotColor: "bg-blue-500" },
                    { id: "พร้อมเสิร์ฟ", label: "พร้อมเสิร์ฟ", count: stats.ready, dotColor: "bg-emerald-500" },
                    { id: "สำเร็จ", label: "เสร็จสิ้น", count: stats.completed },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setStatusFilter(tab.id)}
                      className={`relative flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold text-xs tracking-wider transition-all shrink-0 cursor-pointer ${statusFilter === tab.id
                          ? "bg-[#002e47] text-white shadow-inner"
                          : "text-[#5a6e7a] hover:text-[#002e47] hover:bg-slate-50"
                        }`}
                    >
                      {tab.dotColor && <span className={`h-1.5 w-1.5 rounded-full ${tab.dotColor} animate-pulse`} />}
                      <span>{tab.label}</span>
                      {tab.count !== undefined && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${statusFilter === tab.id ? "bg-slate-700 text-white" : "bg-slate-100 text-[#5a6e7a]"
                          }`}>
                          {tab.count}
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 justify-between sm:justify-start w-full sm:w-auto border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                  <div className="flex items-center gap-1.5 text-xs font-bold" style={{ color: INK_MUTED }}>
                    <Filter size={14} />
                    <span>ช่องทาง:</span>
                  </div>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="bg-white border border-[#ece4d6] rounded-xl px-2.5 py-1.5 text-xs font-bold text-[#002e47] focus:outline-none shadow-sm flex-1 sm:flex-initial max-w-[150px]"
                  >
                    <option value="all">ทั้งหมด</option>
                    <option value="dine-in">ทานที่ร้าน</option>
                    <option value="takeaway">กลับบ้าน</option>
                    <option value="delivery">เดลิเวอรี่</option>
                  </select>
                </div>
              </div>

              {/* Cooking Summary Header banner */}
              {menuSummary.length > 0 && (
                <div className="bg-white border border-[#ece4d6] p-3 rounded-2xl flex flex-col sm:flex-row sm:items-center gap-2.5 shrink-0 shadow-sm mb-6">
                  <div className="flex items-center gap-1.5 text-xs font-black text-[#002e47] shrink-0">
                    <ChefHat size={14} className="text-[#fcc14a]" />
                    <span>ยอดรวมเมนูเตาอาหาร:</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {menuSummary.map(([name, qty]) => (
                      <div key={name} className="flex items-center gap-1.5 bg-[#002e47]/5 border border-[#002e47]/10 rounded-xl px-3 py-1 text-xs shrink-0 font-bold">
                        <span className="text-[#002e47]">{name}</span>
                        <span className="bg-[#fcc14a] text-[#002e47] font-black px-1.5 py-0.2 rounded-md text-[10px]">x{qty}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Order display area */}
              <div className="flex-1 overflow-y-auto no-scrollbar">
                {statusFilter === "active" ? (
                  <div className="hidden md:grid md:grid-cols-3 gap-6 min-w-[960px]">
                    {/* Waiting */}
                    <div className="flex flex-col bg-white rounded-3xl border border-[#ece4d6] shadow-soft">
                      <div className="p-4 bg-amber-500/10 border-b border-[#ece4d6] flex items-center justify-between shrink-0">
                        <span className="font-black text-sm text-[#002e47]">ออเดอร์ใหม่</span>
                        <span className="text-white text-xs font-black px-2 py-0.5 rounded-full bg-amber-500">{ordersByStatus.waiting.length}</span>
                      </div>
                      <div className="p-4 space-y-4 bg-[#f8fafc]/50 flex-1 overflow-y-auto max-h-[70vh]">
                        {ordersByStatus.waiting.length === 0 ? <EmptyColumnMessage text="ไม่มีออเดอร์ใหม่" /> : ordersByStatus.waiting.map(o => (
                          <OrderCard key={o.id} order={o} advanceOrderStatus={advanceOrderStatus} regressOrderStatus={regressOrderStatus} cancelOrder={cancelOrder} />
                        ))}
                      </div>
                    </div>

                    {/* Cooking */}
                    <div className="flex flex-col bg-white rounded-3xl border border-[#ece4d6] shadow-soft">
                      <div className="p-4 bg-blue-50 border-b border-[#ece4d6] flex items-center justify-between shrink-0">
                        <span className="font-black text-sm text-[#002e47]">กำลังปรุง</span>
                        <span className="text-white text-xs font-black px-2 py-0.5 rounded-full bg-blue-600">{ordersByStatus.cooking.length}</span>
                      </div>
                      <div className="p-4 space-y-4 bg-[#f8fafc]/50 flex-1 overflow-y-auto max-h-[70vh]">
                        {ordersByStatus.cooking.length === 0 ? <EmptyColumnMessage text="ไม่มีรายการกำลังปรุง" /> : ordersByStatus.cooking.map(o => (
                          <OrderCard key={o.id} order={o} advanceOrderStatus={advanceOrderStatus} regressOrderStatus={regressOrderStatus} cancelOrder={cancelOrder} />
                        ))}
                      </div>
                    </div>

                    {/* Ready */}
                    <div className="flex flex-col bg-white rounded-3xl border border-[#ece4d6] shadow-soft">
                      <div className="p-4 bg-emerald-50 border-b border-[#ece4d6] flex items-center justify-between shrink-0">
                        <span className="font-black text-sm text-[#002e47]">พร้อมเสิร์ฟ</span>
                        <span className="text-white text-xs font-black px-2 py-0.5 rounded-full bg-emerald-500">{ordersByStatus.ready.length}</span>
                      </div>
                      <div className="p-4 space-y-4 bg-[#f8fafc]/50 flex-1 overflow-y-auto max-h-[70vh]">
                        {ordersByStatus.ready.length === 0 ? <EmptyColumnMessage text="ไม่มีออเดอร์พร้อมเสิร์ฟ" /> : ordersByStatus.ready.map(o => (
                          <OrderCard key={o.id} order={o} advanceOrderStatus={advanceOrderStatus} regressOrderStatus={regressOrderStatus} cancelOrder={cancelOrder} />
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-3xl border border-[#ece4d6] p-4">
                    <h2 className="text-sm font-black mb-4">ประวัติออเดอร์ ({statusFilter})</h2>
                    <div className="space-y-3">
                      {filteredOrders.length === 0 ? (
                        <p className="text-center text-slate-400 py-12">ไม่มีรายการ</p>
                      ) : filteredOrders.map(o => (
                        statusFilter === "สำเร็จ" ? (
                          <HistoryOrderRow key={o.id} order={o} />
                        ) : (
                          <OrderCard key={o.id} order={o} advanceOrderStatus={advanceOrderStatus} regressOrderStatus={regressOrderStatus} cancelOrder={cancelOrder} />
                        )
                      ))}
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

// ── Kanban Order Card Component ──
function OrderCard({
  order,
  advanceOrderStatus,
  regressOrderStatus,
  cancelOrder
}: {
  order: OrderHistory;
  advanceOrderStatus: (id: string) => void;
  regressOrderStatus: (id: string) => void;
  cancelOrder: (id: string) => void;
}) {
  const isDineIn = order.orderType === "dine-in";
  const isTakeaway = order.orderType === "takeaway";
  const isDelivery = order.orderType === "delivery";

  let typeBadge = "ทานที่ร้าน";
  let typeColor = "bg-emerald-50 text-emerald-800 border-emerald-200";
  let borderLeftColor = "border-l-[#fcc14a]"; // Dine-in: Gold
  if (isTakeaway) {
    typeBadge = "กลับบ้าน";
    typeColor = "bg-blue-50 text-blue-800 border-blue-200";
    borderLeftColor = "border-l-[#5a6e7a]"; // Takeaway: Ink/neutral gray
  } else if (isDelivery) {
    typeBadge = "เดลิเวอรี่";
    typeColor = "bg-amber-50 text-amber-800 border-amber-200";
    borderLeftColor = "border-l-[#002e47]"; // Delivery: Navy Blue
  }

  let nextBtnText = "เริ่มทำครัว";
  let nextBtnColor = "bg-[#002e47] text-white hover:bg-[#003957]";
  if (order.status === "กำลังทำ") {
    nextBtnText = "ปรุงสำเร็จ";
    nextBtnColor = "bg-blue-600 text-white hover:bg-blue-700";
  } else if (order.status === "พร้อมเสิร์ฟ") {
    nextBtnText = "ส่งเสิร์ฟสำเร็จ";
    nextBtnColor = "bg-emerald-600 text-white hover:bg-emerald-700";
  }

  return (
    <div className={`bg-white border-2 border-l-[6px] border-[#ece4d6] ${borderLeftColor} rounded-2xl p-4 shadow-sm hover:shadow transition relative space-y-3`}>
      <div className="flex items-center justify-between">
        <div>
          <span className="font-black text-[#002e47] text-sm">{order.orderNumber}</span>
          <span className="text-[10px] text-slate-400 ml-1.5 font-bold">{order.date.includes(" · ") ? order.date.split(" · ")[1] : order.date}</span>
        </div>
        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${typeColor}`}>{typeBadge}</span>
      </div>

      <div className="pt-2 border-t border-slate-100">
        <p className="text-[10px] font-bold text-slate-400">รายละเอียดลูกค้า:</p>
        <p className="text-xs font-black text-[#002e47] mt-0.5">
          {order.customerName || "คุณลูกค้า"} {isDineIn && order.tableNumber && `(โต๊ะ ${order.tableNumber})`}
        </p>
      </div>

      <div className="space-y-1.5">
        {order.items.map((i, idx) => (
          <div key={idx} className="flex justify-between items-center text-xs">
            <span className="font-semibold text-slate-700">{i.name}</span>
            <span className="font-black bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded">x{i.qty}</span>
          </div>
        ))}
      </div>

      {order.note && (
        <div className="p-2 bg-red-50/50 border border-red-100 rounded-xl text-[10px] font-black text-red-700">
          💡 หมายเหตุ: {order.note}
        </div>
      )}

      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-1.5">
        <button
          onClick={() => regressOrderStatus(order.id)}
          disabled={order.status === "รอดำเนินการ"}
          className="p-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl text-slate-600 transition disabled:opacity-50"
        >
          <RotateCcw size={13} />
        </button>

        <button
          onClick={() => advanceOrderStatus(order.id)}
          className={`flex-1 py-1.5 rounded-xl text-[11px] font-black tracking-wide shadow-sm transition flex items-center justify-center gap-1 cursor-pointer ${nextBtnColor}`}
        >
          <Check size={11} />
          <span>{nextBtnText}</span>
        </button>

        <button
          onClick={() => cancelOrder(order.id)}
          className="p-1.5 bg-red-50 hover:bg-red-100 border border-red-100 rounded-xl text-red-600 transition"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}

// ── Simple Row Component for History View ──
function HistoryOrderRow({ order }: { order: OrderHistory }) {
  return (
    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex justify-between items-center text-xs">
      <div>
        <span className="font-black text-[#002e47]">{order.orderNumber}</span>
        <span className="text-[10px] text-slate-400 ml-1.5">{order.date}</span>
        <p className="text-[11px] text-slate-500 mt-0.5 truncate max-w-sm">
          {order.items.map(i => `${i.name} x${i.qty}`).join(", ")}
        </p>
      </div>
      <div className="text-right shrink-0">
        <span className="font-black block text-[#002e47]">฿{order.total}</span>
        <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 rounded font-black">สำเร็จ</span>
      </div>
    </div>
  );
}

// ── Table Management Panel (Walk-in tables styled gray and disabled in customers but monitored here) ──
function TableManagementView({
  orders,
  onRefreshOrders
}: {
  orders: OrderHistory[];
  onRefreshOrders: () => Promise<void>;
}) {
  const [tables, setTables] = useState<any[]>([
    { id: "1", label: "โต๊ะ 1", status: "available" },
    { id: "2", label: "โต๊ะ 2", status: "occupied" },
    { id: "3", label: "โต๊ะ 3", status: "available" },
    { id: "4", label: "โต๊ะ 4", status: "available" },
    { id: "5", label: "โต๊ะ 5", status: "available" },
    { id: "6", label: "โต๊ะ 6", status: "occupied" },
    { id: "7", label: "โต๊ะ 7", status: "available" },
    { id: "8", label: "โต๊ะ 8", status: "available" },
    { id: "9", label: "โต๊ะ 9 (Walk-in)", status: "available" },
    { id: "10", label: "โต๊ะ 10 (Walk-in)", status: "available" },
  ]);
  const [selectedTable, setSelectedTable] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [isMoveSelectorOpen, setIsMoveSelectorOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void | Promise<void>;
  } | null>(null);

  const fetchTables = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("restaurant_tables")
        .select("id, label, status")
        .order("id");
      if (!error && data && data.length > 0) {
        const has9 = data.some((t: any) => t.id === "9" || t.label.includes("โต๊ะ 9"));
        const has10 = data.some((t: any) => t.id === "10" || t.label.includes("โต๊ะ 10"));
        const merged = [...data];
        if (!has9) {
          merged.push({ id: "9", label: "โต๊ะ 9 (Walk-in)", status: "available" });
        }
        if (!has10) {
          merged.push({ id: "10", label: "โต๊ะ 10 (Walk-in)", status: "available" });
        }
        setTables(merged as any);
        localStorage.setItem("ran-lung-get-tables", JSON.stringify(merged));
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

    // Subscribe to database changes
    const ch = supabase
      .channel("tables-staff-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "restaurant_tables" }, (payload: any) => {
        if (payload.eventType === "UPDATE" || payload.eventType === "INSERT") {
          const updated = payload.new as any;
          setTables((prev) => {
            const next = prev.map((t) => t.id === String(updated.id) ? { ...t, ...updated, id: String(updated.id) } : t);
            localStorage.setItem("ran-lung-get-tables", JSON.stringify(next));
            return next;
          });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

  const getActiveOrdersForTable = (tableLabel: string) => {
    return orders.filter(
      (o) =>
        (o.status === "รอดำเนินการ" || o.status === "กำลังทำ" || o.status === "พร้อมเสิร์ฟ" || o.status === "รอรับออเดอร์") &&
        (o.tableNumber === tableLabel || o.tableNumber === tableLabel.replace("โต๊ะ ", ""))
    );
  };

  const updateTableStatus = async (tableId: string, nextStatus: string) => {
    // Optimistic UI updates
    const nextList = tables.map((t) => (t.id === tableId ? { ...t, status: nextStatus } : t));
    setTables(nextList);
    localStorage.setItem("ran-lung-get-tables", JSON.stringify(nextList));

    // Update currently selected table reference
    const currentSelected = nextList.find(t => t.id === tableId);
    if (currentSelected) {
      setSelectedTable(currentSelected);
    }

    try {
      await supabase
        .from("restaurant_tables")
        .update({ status: nextStatus })
        .eq("id", tableId);
    } catch (e) {
      console.warn("Offline status update completed locally.");
    }
  };

  const moveAllOrders = async (fromTableLabel: string, toTableLabel: string) => {
    const activeFromOrders = getActiveOrdersForTable(fromTableLabel);
    if (activeFromOrders.length === 0) {
      alert("ไม่มีออเดอร์ให้ย้ายบนโต๊ะนี้");
      return;
    }

    try {
      const client = supabase as any;
      const orderIds = activeFromOrders.map((o) => o.id);

      // Update their table number in Supabase
      const { error: orderErr } = await client
        .from("orders")
        .update({ table_number: toTableLabel })
        .in("id", orderIds);

      if (orderErr) throw orderErr;

      // Find the source and destination table objects
      const fromTable = tables.find((t) => t.label === fromTableLabel);
      const toTable = tables.find((t) => t.label === toTableLabel);

      if (fromTable) {
        await client.from("restaurant_tables").update({ status: "available" }).eq("id", fromTable.id);
      }
      if (toTable) {
        await client.from("restaurant_tables").update({ status: "occupied" }).eq("id", toTable.id);
      }

      // Refresh data
      await fetchTables();
      await onRefreshOrders();

      // Set the destination table as selected
      const updatedTablesList = tables.map((t) =>
        t.label === fromTableLabel
          ? { ...t, status: "available" }
          : t.label === toTableLabel
            ? { ...t, status: "occupied" }
            : t
      );
      const newSel = updatedTablesList.find(t => t.label === toTableLabel);
      setSelectedTable(newSel || null);

      alert(`ย้าย/รวมออเดอร์ทั้งหมดจาก ${fromTableLabel} ไปยัง ${toTableLabel} สำเร็จ!`);
    } catch (err) {
      console.error("[Move Table] Error moving orders:", err);
      alert("เกิดข้อผิดพลาดในการย้ายโต๊ะ");
    }
  };

  const clearTableAndOrders = async (tableLabel: string) => {
    try {
      const client = supabase as any;
      const activeOrders = getActiveOrdersForTable(tableLabel);

      if (activeOrders.length > 0) {
        const orderIds = activeOrders.map((o) => o.id);
        // Update status of all active orders to Completed ('สำเร็จ')
        await client
          .from("orders")
          .update({ status: "สำเร็จ" })
          .in("id", orderIds);
      }

      // Update table status to 'available'
      const targetTable = tables.find((t) => t.label === tableLabel);
      if (targetTable) {
        await client
          .from("restaurant_tables")
          .update({ status: "available" })
          .eq("id", targetTable.id);
      }

      // Refresh
      await fetchTables();
      await onRefreshOrders();

      setSelectedTable(null);
      alert(`เคลียร์โต๊ะและอัปเดตสถานะออเดอร์ค้างของ ${tableLabel} เสร็จสิ้น!`);
    } catch (err) {
      console.error("[Clear Table] Error clearing table:", err);
      alert("เกิดข้อผิดพลาดในการเคลียร์โต๊ะ");
    }
  };

  // Auto-occupy tables if active orders exist
  useEffect(() => {
    if (tables.length === 0) return;

    const tablesToUpdate = tables.filter((t) => {
      const activeCount = getActiveOrdersForTable(t.label).length;
      return activeCount > 0 && t.status === "available";
    });

    if (tablesToUpdate.length > 0) {
      tablesToUpdate.forEach((t) => {
        console.log(`[Auto-Status] Table ${t.label} has active orders, updating status to occupied.`);
        void updateTableStatus(t.id, "occupied");
      });
    }
  }, [orders, tables]);

  return (
    <div className="space-y-6">
      <div className="bg-white border border-[#ece4d6] rounded-3xl p-5 shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-base font-black text-[#002e47]">ผังที่นั่งร้านอาหาร (หน้าร้าน)</h2>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">รวมทั้งหมด {tables.length} โต๊ะอาหาร (รวมโต๊ะ Walk-in สีเทา)</p>
        </div>
        <button
          onClick={fetchTables}
          className="bg-[#002e47]/5 border hover:bg-[#002e47]/10 text-[#002e47] text-xs font-black px-3.5 py-2 rounded-xl transition"
        >
          🔄 โหลดใหม่
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Side: Seating Chart Grid (Takes 65% width on desktop) */}
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
                  const isWalkIn = table.label.toLowerCase().includes("walk-in") || table.label.includes("หน้าร้าน");
                  const isSelected = selectedTable?.id === table.id;

                  let statusLabel = "ว่าง";
                  let statusColor = "bg-emerald-500 text-white border-emerald-600";
                  let boxBg = "bg-emerald-50/30 border-emerald-200 hover:bg-emerald-50/50";

                  if (isOccupied) {
                    statusLabel = "มีลูกค้า";
                    statusColor = "bg-red-500 text-white border-red-600";
                    boxBg = "bg-red-50/30 border-red-200 hover:bg-red-50/50";
                  } else if (isWalkIn) {
                    statusLabel = "Walk-in";
                    statusColor = "bg-slate-500 text-white border-slate-600";
                    boxBg = "bg-slate-50/40 border-slate-300 hover:bg-slate-50/60";
                  }

                  return (
                    <div
                      key={table.id}
                      onClick={() => setSelectedTable(table)}
                      className={`border-2 rounded-3xl p-5 text-left relative overflow-hidden transition cursor-pointer flex flex-col justify-between min-h-[160px] shadow-sm hover:shadow ${boxBg} ${isSelected ? "ring-4 ring-[#002e47]/30 border-[#002e47] scale-[1.01]" : ""
                        }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-black text-base text-[#002e47]">{table.label}</span>
                          <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${statusColor}`}>{statusLabel}</span>
                        </div>
                        <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-wider">
                          โต๊ะสำหรับ 2-4 คน {isWalkIn && <span className="ml-1 text-slate-600 font-extrabold">(Walk-in)</span>}
                        </p>
                      </div>

                      {isOccupied && (
                        <div className="mt-4 pt-3 border-t border-red-100 text-xs">
                          {activeOrders.length > 0 ? (
                            <div className="space-y-1">
                              <span className="font-bold text-red-700">มีออเดอร์ค้าง ({activeOrders.length})</span>
                            </div>
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

        {/* Right Side: Actions and Bill details Panel (Takes 35% width on desktop) */}
        <div className="w-full lg:w-[35%] bg-white border border-[#ece4d6] rounded-[28px] p-6 shadow-sm flex flex-col min-h-[500px]">
          {selectedTable ? (
            <div className="flex flex-col flex-1 h-full text-[#002e47]">
              {/* Header Info */}
              <div className="flex justify-between items-start pb-4 border-b border-slate-100 mb-5">
                <div>
                  <h3 className="text-lg font-black">{selectedTable.label}</h3>
                  <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border inline-block mt-1 ${selectedTable.status === "occupied"
                      ? "bg-red-500 text-white border-red-600"
                      : "bg-emerald-500 text-white border-emerald-600"
                    }`}>
                    {selectedTable.status === "occupied" ? "มีลูกค้า" : "ว่าง"}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setSelectedTable(null);
                    setIsMoveSelectorOpen(false);
                  }}
                  className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 cursor-pointer text-slate-500"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Status Selector */}
              <div className="mb-5">
                <span className="text-xs font-bold text-slate-500 block mb-2">อัปเดตสถานะโต๊ะ</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => updateTableStatus(selectedTable.id, "available")}
                    className={`py-2 rounded-md font-bold text-[10px] border transition ${selectedTable.status === "available"
                        ? "bg-emerald-500 text-white border-emerald-600"
                        : "bg-white border-slate-200 hover:bg-slate-50"
                      }`}
                  >
                    🟢 ว่าง
                  </button>
                  <button
                    onClick={() => updateTableStatus(selectedTable.id, "occupied")}
                    className={`py-2 rounded-md font-bold text-[10px] border transition ${selectedTable.status === "occupied"
                        ? "bg-red-500 text-white border-red-600"
                        : "bg-white border-slate-200 hover:bg-slate-50"
                      }`}
                  >
                    🔴 มีลูกค้า
                  </button>
                </div>
              </div>

              {/* Actions Menus */}
              <div className="mb-6 space-y-2">
                <span className="text-xs font-bold text-slate-500 block mb-1">เมนูการจัดการ</span>

                {/* Move / Merge */}
                <button
                  onClick={() => setIsMoveSelectorOpen(true)}
                  className="w-full py-3 px-4 rounded-md border border-slate-200 hover:bg-slate-50 font-bold text-xs flex items-center justify-between transition"
                >
                  <span className="flex items-center gap-2">🔄 ย้าย / รวมออเดอร์ไปยังโต๊ะอื่น</span>
                  <ChevronRight size={14} className="text-slate-400" />
                </button>

                {/* Walk-in Order */}
                <a
                  href="/customer"
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => {
                    localStorage.setItem("ran-lung-get-selected-table", selectedTable.id);
                  }}
                  className="w-full py-3 px-4 rounded-md border border-slate-200 hover:bg-slate-50 font-bold text-xs flex items-center justify-between transition block text-left text-inherit no-underline"
                >
                  <span className="flex items-center gap-2">🛍️ สั่งอาหาร Walk-in (ชำระเงินสด/โอนเงิน)</span>
                  <PlusCircle size={14} className="text-slate-400" />
                </a>

                {/* Clear Table and Orders */}
                <button
                  onClick={() => {
                    setConfirmDialog({
                      isOpen: true,
                      title: "ยืนยันการเคลียร์โต๊ะ",
                      message: `คุณต้องการเคลียร์โต๊ะและเปลี่ยนสถานะออเดอร์ค้างทั้งหมดของ ${selectedTable.label} ให้เสร็จสิ้นใช่หรือไม่?`,
                      onConfirm: async () => {
                        await clearTableAndOrders(selectedTable.label);
                      }
                    });
                  }}
                  className="w-full py-3 px-4 rounded-md border border-red-200 text-red-700 bg-red-50/30 hover:bg-red-50 font-bold text-xs flex items-center justify-between transition"
                >
                  <span className="flex items-center gap-2">🧹 เคลียร์โต๊ะ & อ้างอิงออเดอร์เสร็จสิ้น</span>
                  <Trash2 size={14} className="text-red-400" />
                </button>
              </div>

              {/* Active Orders details (Split bills concept) */}
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

                        {/* Items list */}
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

                        <div className="flex gap-2 pt-1">
                          <button
                            onClick={() => {
                              alert(`พิมพ์ใบเสิร์ฟสำหรับออเดอร์ ${order.orderNumber} สำเร็จ!`);
                            }}
                            className="flex-1 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 font-bold text-[9px] rounded-md transition"
                          >
                            🖨️ พิมพ์ใบเสิร์ฟ
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-slate-400 py-8 text-xs italic font-bold">
                      ไม่มีออเดอร์ค้างอยู่บนโต๊ะนี้
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-12 text-center my-auto">
              <div className="text-5xl mb-3">🍽️</div>
              <p className="font-bold text-sm text-[#002e47]">เลือกโต๊ะอาหารเพื่อดำเนินการ</p>
              <p className="text-[11px] text-slate-500 mt-1.5 max-w-[200px] leading-relaxed">
                กดเลือกโต๊ะจากแผนผังที่นั่งฝั่งซ้าย เพื่อย้ายออเดอร์, ดูรายละเอียดบิลแยก หรือเคลียร์โต๊ะ
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Move Table Modal overlay */}
      {isMoveSelectorOpen && selectedTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setIsMoveSelectorOpen(false)} />

          {/* Modal Container */}
          <div className="bg-white rounded-[28px] p-6 w-full max-w-lg z-10 border border-[#ece4d6] shadow-2xl relative text-[#002e47] flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 mb-5 shrink-0">
              <div>
                <h3 className="text-lg font-black flex items-center gap-2">🔄 ย้าย / รวมออเดอร์</h3>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">เลือกโต๊ะปลายทางที่คุณต้องการย้ายออเดอร์ของ <span className="font-extrabold text-[#002e47] underline">{selectedTable.label}</span> ไป</p>
              </div>
              <button
                onClick={() => setIsMoveSelectorOpen(false)}
                className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 cursor-pointer text-slate-500"
              >
                <X size={15} />
              </button>
            </div>

            {/* Grid of Other Tables */}
            <div className="flex-1 overflow-y-auto no-scrollbar py-2">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[...tables]
                  .sort((a, b) => parseInt(a.id, 10) - parseInt(b.id, 10))
                  .filter((t) => t.id !== selectedTable.id)
                  .map((t) => {
                    const activeOrders = getActiveOrdersForTable(t.label);
                    const isOccupied = t.status === "occupied";

                    let badgeColor = "bg-emerald-500 text-white border-emerald-600";
                    let badgeLabel = "ว่าง";
                    let btnBg = "bg-emerald-50/10 border-emerald-100 hover:bg-emerald-50/50";

                    if (isOccupied) {
                      badgeColor = "bg-red-500 text-white border-red-600";
                      badgeLabel = "มีลูกค้า";
                      btnBg = "bg-red-50/10 border-red-100 hover:bg-red-50/50";
                    }

                    return (
                      <button
                        key={t.id}
                        onClick={() => {
                          const actionText = isOccupied ? `รวมออเดอร์กับ ${t.label}` : `ย้ายออเดอร์ทั้งหมดไปที่ ${t.label}`;
                          setConfirmDialog({
                            isOpen: true,
                            title: isOccupied ? "ยืนยันการรวมออเดอร์" : "ยืนยันการย้ายโต๊ะ",
                            message: `คุณต้องการ${actionText} ใช่หรือไม่? การดำเนินการนี้จะอัปเดตข้อมูลโต๊ะและออเดอร์ในระบบทันที`,
                            onConfirm: async () => {
                              await moveAllOrders(selectedTable.label, t.label);
                              setIsMoveSelectorOpen(false);
                            }
                          });
                        }}
                        className={`border-2 rounded-md p-4 text-left transition flex flex-col justify-between min-h-[110px] cursor-pointer ${btnBg}`}
                      >
                        <div className="w-full flex items-center justify-between">
                          <span className="font-extrabold text-sm">{t.label}</span>
                          <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full border ${badgeColor}`}>
                            {badgeLabel}
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

            {/* Footer */}
            <div className="mt-5 pt-4 border-t border-slate-100 shrink-0 flex justify-end">
              <button
                onClick={() => setIsMoveSelectorOpen(false)}
                className="px-5 py-2.5 rounded-md border border-slate-200 hover:bg-slate-50 font-bold text-xs"
              >
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Dialog Modal Overlay */}
      {confirmDialog && confirmDialog.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setConfirmDialog(null)}
          />

          {/* Container */}
          <div className="bg-white rounded-[28px] p-6 w-full max-w-sm z-10 border border-[#ece4d6] shadow-2xl relative text-[#002e47] flex flex-col">
            <h3 className="text-base font-black mb-2">{confirmDialog.title}</h3>
            <p className="text-xs text-slate-500 font-semibold leading-relaxed mb-6">
              {confirmDialog.message}
            </p>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmDialog(null)}
                className="px-4 py-2 rounded-md border border-red-500 text-red-500 hover:bg-red-50 bg-white font-bold text-xs cursor-pointer transition"
              >
                ยกเลิก
              </button>
              <button
                onClick={async () => {
                  const onConf = confirmDialog.onConfirm;
                  setConfirmDialog(null);
                  await onConf();
                }}
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

// ─────────────────────────────────────────────────────────────
// Food Items Menu Management View
// ─────────────────────────────────────────────────────────────
function MenuManagementView() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCat, setActiveCat] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  
  // Form states
  const [formId, setFormId] = useState("");
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formPrice, setFormPrice] = useState(60);
  const [formImage, setFormImage] = useState("/meal/krapao.jpg");
  const [formCategory, setFormCategory] = useState("signature");
  const [formIsAvailable, setFormIsAvailable] = useState(true);
  const [formIsSpicy, setFormIsSpicy] = useState(false);
  
  // Preset images for template select
  const PRESET_IMAGES = [
    { label: "กระเพรา (Krapao)", value: "/meal/krapao.jpg" },
    { label: "ผัดซีอิ๊ว (Pad See Ew)", value: "/meal/pad_see_ew.jpg" },
    { label: "ข้าวผัด (Fried Rice)", value: "/meal/fried_rice.jpg" },
    { label: "แกงเผ็ด/แกงพริก (Curry)", value: "/meal/pad_tua_sea.jpg" },
    { label: "ผัดผักรวม (Stir-fried Veg)", value: "/meal/pad_pak.jpg" },
    { label: "กระเทียมพริกไทย (Garlic)", value: "/meal/khao_moo_garlic.jpg" },
    { label: "ผงกะหรี่ (Yellow Curry)", value: "/meal/pad_pong_gari.jpg" },
    { label: "เฉาก๊วย (Grass Jelly)", value: "/meal/grass_jelly.webp" },
    { label: "น้ำแข็งไส (Shaved Ice)", value: "/meal/shaved_ice.jpg" },
    { label: "น้ำลำไย (Longan Juice)", value: "/meal/longan_juice.jpg" },
    { label: "น้ำส้ม (Orange Juice)", value: "/meal/orange_juice.jpg" },
    { label: "โค้ก (Coke)", value: "/meal/coke.jpg" },
    { label: "น้ำเปล่า (Water)", value: "/meal/water.jpg" },
  ];

  const CATEGORIES = [
    { id: "all", label: "ทั้งหมด" },
    { id: "signature", label: "อาหารแนะนำ (Signature)" },
    { id: "main", label: "อาหารจานหลัก" },
    { id: "noodles", label: "เมนูเส้น" },
    { id: "rice", label: "เมนูข้าว" },
    { id: "drinks", label: "เครื่องดื่ม" },
    { id: "dessert", label: "ของหวาน" },
    { id: "vegetarian", label: "มังสวิรัติ" },
  ];

  const fetchMenu = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("menu_items")
        .select("*")
        .order("sort_order");
        
      if (!error && data && data.length > 0) {
        const mapped = data.map((item: any) => ({
          id: item.id,
          name: item.name,
          desc: item.description || "",
          price: Number(item.price),
          image: item.image || "",
          category: item.category,
          isAvailable: item.is_available ?? true,
          spicy: item.is_spicy ?? false,
          options: item.options || undefined,
          addons: item.addons || undefined
        }));
        setMenuItems(mapped);
        localStorage.setItem("ran-lung-get-menu-items", JSON.stringify(mapped));
      } else {
        const local = localStorage.getItem("ran-lung-get-menu-items");
        if (local) {
          setMenuItems(JSON.parse(local));
        } else {
          setMenuItems(MENU);
          localStorage.setItem("ran-lung-get-menu-items", JSON.stringify(MENU));
        }
      }
    } catch (e) {
      const local = localStorage.getItem("ran-lung-get-menu-items");
      if (local) setMenuItems(JSON.parse(local));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();

    const ch = supabase
      .channel("menu-items-staff-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "menu_items" }, () => {
        fetchMenu();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

  // Quick toggle isAvailable
  const toggleAvailable = async (item: MenuItem) => {
    const isAvailable = !(item.isAvailable ?? true);
    const updated = menuItems.map(m => m.id === item.id ? { ...m, isAvailable } : m);
    setMenuItems(updated);
    localStorage.setItem("ran-lung-get-menu-items", JSON.stringify(updated));

    try {
      await supabase
        .from("menu_items")
        .update({ is_available: isAvailable })
        .eq("id", item.id);
    } catch (e) {
      console.warn("Local toggle available saved.");
    }
  };

  // Quick toggle spicy
  const toggleSpicy = async (item: MenuItem) => {
    const spicy = !item.spicy;
    const updated = menuItems.map(m => m.id === item.id ? { ...m, spicy } : m);
    setMenuItems(updated);
    localStorage.setItem("ran-lung-get-menu-items", JSON.stringify(updated));

    try {
      await supabase
        .from("menu_items")
        .update({ is_spicy: spicy })
        .eq("id", item.id);
    } catch (e) {
      console.warn("Local toggle spicy saved.");
    }
  };

  const openAddModal = () => {
    setFormId("m_" + Math.random().toString(36).substring(2, 9));
    setFormName("");
    setFormDesc("");
    setFormPrice(60);
    setFormImage("/meal/krapao.jpg");
    setFormCategory("signature");
    setFormIsAvailable(true);
    setFormIsSpicy(false);
    setIsAddModalOpen(true);
  };

  const openEditModal = (item: MenuItem) => {
    setEditingItem(item);
    setFormId(item.id);
    setFormName(item.name);
    setFormDesc(item.desc || "");
    setFormPrice(item.price);
    setFormImage(item.image || "/meal/krapao.jpg");
    setFormCategory(item.category);
    setFormIsAvailable(item.isAvailable ?? true);
    setFormIsSpicy(item.spicy ?? false);
    setIsEditModalOpen(true);
  };

  const handleSaveNew = async () => {
    if (!formName.trim()) {
      alert("กรุณากรอกชื่อเมนูอาหาร");
      return;
    }
    if (formPrice <= 0) {
      alert("กรุณากรอกราคาที่ถูกต้อง");
      return;
    }

    const newItem: MenuItem = {
      id: formId,
      name: formName,
      desc: formDesc,
      price: Number(formPrice),
      image: formImage,
      category: formCategory,
      isAvailable: formIsAvailable,
      spicy: formIsSpicy
    };

    const updated = [...menuItems, newItem];
    setMenuItems(updated);
    localStorage.setItem("ran-lung-get-menu-items", JSON.stringify(updated));
    setIsAddModalOpen(false);

    try {
      const { error } = await supabase.from("menu_items").insert({
        id: newItem.id,
        name: newItem.name,
        description: newItem.desc,
        price: newItem.price,
        image: newItem.image,
        category: newItem.category,
        is_available: newItem.isAvailable,
        is_spicy: newItem.spicy,
        sort_order: updated.length
      });
      if (error) throw error;
      alert("เพิ่มเมนูใหม่สำเร็จ!");
    } catch (e) {
      console.warn("Saved locally. Supabase error: " + (e as any).message);
      alert("บันทึกข้อมูลในบราวเซอร์เครื่องนี้สำเร็จ! (หมายเหตุ: มีปัญหาเชื่อมต่อกับฐานข้อมูลหลัก)");
    }
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;
    if (!formName.trim()) {
      alert("กรุณากรอกชื่อเมนูอาหาร");
      return;
    }
    if (formPrice <= 0) {
      alert("กรุณากรอกราคาที่ถูกต้อง");
      return;
    }

    const updatedItem: MenuItem = {
      ...editingItem,
      name: formName,
      desc: formDesc,
      price: Number(formPrice),
      image: formImage,
      category: formCategory,
      isAvailable: formIsAvailable,
      spicy: formIsSpicy
    };

    const updated = menuItems.map(m => m.id === editingItem.id ? updatedItem : m);
    setMenuItems(updated);
    localStorage.setItem("ran-lung-get-menu-items", JSON.stringify(updated));
    setIsEditModalOpen(false);

    try {
      const { error } = await supabase.from("menu_items").update({
        name: updatedItem.name,
        description: updatedItem.desc,
        price: updatedItem.price,
        image: updatedItem.image,
        category: updatedItem.category,
        is_available: updatedItem.isAvailable,
        is_spicy: updatedItem.spicy
      }).eq("id", editingItem.id);
      if (error) throw error;
      alert("บันทึกข้อมูลเมนูสำเร็จ!");
    } catch (e) {
      console.warn("Updated locally. Supabase error.");
      alert("แก้ไขข้อมูลในบราวเซอร์เครื่องนี้สำเร็จ! (หมายเหตุ: มีปัญหาเชื่อมต่อกับฐานข้อมูลหลัก)");
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm("คุณต้องการลบเมนูนี้ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้")) return;

    const updated = menuItems.filter(m => m.id !== id);
    setMenuItems(updated);
    localStorage.setItem("ran-lung-get-menu-items", JSON.stringify(updated));

    try {
      const { error } = await supabase.from("menu_items").delete().eq("id", id);
      if (error) throw error;
      alert("ลบเมนูอาหารเสร็จสิ้น");
    } catch (e) {
      console.warn("Deleted locally.");
      alert("ลบเมนูออกจากบราวเซอร์เครื่องนี้สำเร็จ! (หมายเหตุ: มีปัญหาเชื่อมต่อกับฐานข้อมูลหลัก)");
    }
  };

  const filteredItems = useMemo(() => {
    let list = menuItems;
    if (activeCat !== "all") {
      list = list.filter(m => m.category === activeCat);
    }
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      list = list.filter(m => m.name.toLowerCase().includes(q) || (m.desc && m.desc.toLowerCase().includes(q)));
    }
    return list;
  }, [menuItems, activeCat, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Title bar */}
      <div className="bg-white border border-[#ece4d6] rounded-3xl p-5 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="w-full sm:w-auto">
          <h2 className="text-base font-black text-[#002e47]">จัดการเมนูอาหารในระบบ</h2>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">รวมทั้งหมด {menuItems.length} รายการอาหาร</p>
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto shrink-0 justify-end">
          <button
            onClick={fetchMenu}
            className="bg-[#002e47]/5 border hover:bg-[#002e47]/10 text-[#002e47] text-xs font-black px-3.5 py-2.5 rounded-xl transition cursor-pointer"
          >
            🔄 โหลดใหม่
          </button>
          <button
            onClick={openAddModal}
            className="bg-[#fcc14a] hover:bg-[#fcc14a]/90 text-[#002e47] text-xs font-black px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <PlusCircle size={15} />
            <span>เพิ่มเมนูอาหาร</span>
          </button>
        </div>
      </div>

      {/* Category Slider & Search Bar */}
      <div className="bg-white border border-[#ece4d6] p-4 rounded-3xl shrink-0 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="flex flex-row overflow-x-auto no-scrollbar gap-1.5 w-full md:w-auto shrink-0 pb-2 md:pb-0">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCat(cat.id)}
              className={`px-3 py-2 rounded-xl font-bold text-xs tracking-wider transition-all shrink-0 cursor-pointer ${activeCat === cat.id
                  ? "bg-[#002e47] text-white shadow-inner"
                  : "text-[#5a6e7a] hover:text-[#002e47] hover:bg-slate-50 border border-transparent"
                }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="ค้นหาชื่ออาหาร..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-[#ece4d6] rounded-xl text-xs font-bold text-[#002e47] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#002e47]/20 transition"
          />
        </div>
      </div>

      {/* Menu List Grid */}
      {loading ? (
        <div className="bg-white border border-[#ece4d6] rounded-3xl p-16 text-center text-slate-400 font-bold shadow-sm">
          กำลังดึงข้อมูลเมนูอาหาร...
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-white border border-[#ece4d6] rounded-3xl p-16 text-center text-slate-400 font-bold shadow-sm">
          ❌ ไม่พบรายการอาหารที่ตรงกับตัวกรอง
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredItems.map((item) => {
            const isAvail = item.isAvailable ?? true;
            return (
              <div
                key={item.id}
                className={`bg-white border border-[#ece4d6] rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition flex flex-col ${!isAvail ? "opacity-75" : ""}`}
              >
                {/* Image panel */}
                <div className="relative h-44 bg-slate-100 overflow-hidden shrink-0">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/thai_food_hero.jpg";
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold">
                      ไม่มีรูปภาพ
                    </div>
                  )}

                  {/* Unavailable overlay */}
                  {!isAvail && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-xs">
                      <span className="bg-red-500 text-white font-black text-xs px-3 py-1 rounded-full uppercase tracking-wider shadow">
                        หมดชั่วคราว
                      </span>
                    </div>
                  )}

                  {/* Category badge */}
                  <span className="absolute top-3 left-3 bg-[#002e47]/80 text-[#fcc14a] font-black text-[9px] px-2.5 py-1 rounded-lg backdrop-blur-xs uppercase border border-[#fcc14a]/30">
                    {CATEGORIES.find(c => c.id === item.category)?.label.split(" (")[0] || item.category}
                  </span>

                  {/* Spicy indicator */}
                  {item.spicy && (
                    <span className="absolute top-3 right-3 bg-red-600/90 text-white font-black text-[9px] px-2 py-1 rounded-lg flex items-center gap-0.5">
                      <Flame size={10} className="fill-white" />
                      <span>เผ็ด</span>
                    </span>
                  )}
                </div>

                {/* Body details */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="font-black text-sm text-[#002e47] leading-tight truncate">{item.name}</h3>
                      <span className="font-extrabold text-sm text-[#002e47] shrink-0">฿{item.price}</span>
                    </div>
                    <p className="text-[11px] font-semibold text-slate-500 line-clamp-2 leading-relaxed">
                      {item.desc || "ไม่มีคำอธิบายสำหรับเมนูนี้"}
                    </p>
                  </div>

                  {/* Buttons controls */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-1.5">
                    <button
                      onClick={() => toggleAvailable(item)}
                      className={`px-3 py-1.5 rounded-xl text-[10px] font-black tracking-wider transition border cursor-pointer ${isAvail
                          ? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                          : "bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
                        }`}
                    >
                      {isAvail ? "🟢 ขายปกติ" : "🔴 ปิดขายชั่วคราว"}
                    </button>

                    <button
                      onClick={() => toggleSpicy(item)}
                      className={`p-1.5 rounded-xl border transition cursor-pointer ${item.spicy
                          ? "bg-amber-50 border-amber-200 text-amber-600 hover:bg-amber-100"
                          : "bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100"
                        }`}
                      title={item.spicy ? "ปิดระดับความเผ็ด" : "เปิดระดับความเผ็ด"}
                    >
                      <Flame size={13} className={item.spicy ? "fill-current text-amber-600" : ""} />
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(item)}
                        className="p-1.5 bg-slate-50 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-100 transition cursor-pointer"
                        title="แก้ไขรายละเอียด"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-1.5 bg-red-50/50 border border-red-100 text-red-600 rounded-xl hover:bg-red-100/50 transition cursor-pointer"
                        title="ลบเมนู"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
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
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }} />
          
          <div className="bg-white rounded-[28px] p-6 w-full max-w-xl z-10 border border-[#ece4d6] shadow-2xl relative text-[#002e47] flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 mb-4 shrink-0">
              <div>
                <h3 className="text-base font-black flex items-center gap-2">
                  {isAddModalOpen ? "➕ เพิ่มเมนูอาหารใหม่" : "📝 แก้ไขเมนูอาหาร"}
                </h3>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">กรอกข้อมูลรายละเอียดของรายการอาหารด้านล่าง</p>
              </div>
              <button
                onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }}
                className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 cursor-pointer text-slate-500"
              >
                <X size={15} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 pr-1 py-1">
              {/* Form Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1.5">รหัสเมนู (ID)</label>
                  <input
                    type="text"
                    disabled={isEditModalOpen}
                    value={formId}
                    onChange={(e) => setFormId(e.target.value)}
                    placeholder="เช่น m_krapao_pork"
                    className="w-full px-3 py-2 border border-[#ece4d6] rounded-xl text-xs font-bold text-[#002e47] disabled:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#002e47]/10"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1.5">หมวดหมู่เมนู</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-[#ece4d6] rounded-xl text-xs font-bold text-[#002e47] focus:outline-none focus:ring-2 focus:ring-[#002e47]/10 bg-white"
                  >
                    {CATEGORIES.filter(c => c.id !== "all").map(c => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-slate-500 block mb-1.5">ชื่อเมนูอาหาร</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="เช่น ข้าวผัดต้มยำทะเลเดือด"
                    className="w-full px-3 py-2 border border-[#ece4d6] rounded-xl text-xs font-bold text-[#002e47] focus:outline-none focus:ring-2 focus:ring-[#002e47]/10"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-slate-500 block mb-1.5">คำอธิบายรายละเอียด</label>
                  <textarea
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    placeholder="รายละเอียดรสชาติ วัตถุดิบเด่น..."
                    rows={2}
                    className="w-full px-3 py-2 border border-[#ece4d6] rounded-xl text-xs font-bold text-[#002e47] focus:outline-none focus:ring-2 focus:ring-[#002e47]/10 resize-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1.5">ราคา (บาท)</label>
                  <input
                    type="number"
                    value={formPrice}
                    onChange={(e) => setFormPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-[#ece4d6] rounded-xl text-xs font-bold text-[#002e47] focus:outline-none focus:ring-2 focus:ring-[#002e47]/10"
                  />
                </div>

                <div className="flex gap-4 items-center pt-5">
                  <label className="flex items-center gap-2 text-xs font-bold text-[#002e47] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formIsAvailable}
                      onChange={(e) => setFormIsAvailable(e.target.checked)}
                      className="rounded border-[#ece4d6] text-[#002e47] focus:ring-0"
                    />
                    <span>พร้อมขายในระบบ</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-bold text-red-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formIsSpicy}
                      onChange={(e) => setFormIsSpicy(e.target.checked)}
                      className="rounded border-red-200 text-red-600 focus:ring-0"
                    />
                    <span className="flex items-center gap-0.5">
                      <Flame size={12} className="fill-current text-red-600" />
                      <span>มีรสชาติเผ็ด</span>
                    </span>
                  </label>
                </div>

                {/* Preset image templates */}
                <div className="sm:col-span-2 space-y-2">
                  <label className="text-xs font-bold text-slate-500 block mb-1">เลือกรูปภาพที่เหมาะสม (มีรูปจำลองสวยงาม)</label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-100 max-h-[140px] overflow-y-auto no-scrollbar">
                    {PRESET_IMAGES.map((img) => (
                      <button
                        key={img.value}
                        type="button"
                        onClick={() => setFormImage(img.value)}
                        className={`p-1 border rounded-lg overflow-hidden transition relative aspect-square bg-white flex flex-col items-center justify-between cursor-pointer ${formImage === img.value ? "border-[#002e47] ring-2 ring-[#002e47]/20" : "border-slate-200 hover:border-slate-400"}`}
                      >
                        <img src={img.value} alt={img.label} className="w-full h-[70%] object-cover rounded-md" />
                        <span className="text-[7px] font-black text-[#002e47] text-center w-full truncate mt-1">{img.label}</span>
                        {formImage === img.value && (
                          <div className="absolute top-1 right-1 h-3.5 w-3.5 bg-emerald-500 rounded-full flex items-center justify-center text-white border border-white">
                            <Check size={8} className="stroke-[3]" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Image input */}
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-slate-500 block mb-1.5">หรือระบุ URL รูปภาพเอง (Custom Image Path)</label>
                  <input
                    type="text"
                    value={formImage}
                    onChange={(e) => setFormImage(e.target.value)}
                    placeholder="/meal/krapao.jpg หรือ https://..."
                    className="w-full px-3 py-2 border border-[#ece4d6] rounded-xl text-xs font-bold text-[#002e47] focus:outline-none focus:ring-2 focus:ring-[#002e47]/10"
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-5 pt-4 border-t border-slate-100 shrink-0 flex justify-end gap-2.5">
              <button
                onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }}
                className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 font-bold text-xs cursor-pointer transition"
              >
                ยกเลิก
              </button>
              <button
                onClick={isAddModalOpen ? handleSaveNew : handleSaveEdit}
                className="px-5 py-2.5 rounded-xl bg-[#002e47] hover:bg-[#002e47]/90 text-white font-black text-xs cursor-pointer transition shadow"
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

// ─────────────────────────────────────────────────────────────
// Stock / Ingredients Management View
// ─────────────────────────────────────────────────────────────
function StockManagementView({ handleLogout }: { handleLogout: () => void }) {
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
            { id: "ing_12", name: "กุนเชียง", quantity: 50, unit: "pcs", min_threshold: 10 }
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
    const target = ingredients.find(i => i.id === id);
    if (!target) return;

    const nextQty = Number(target.quantity) + amount;
    const updated = ingredients.map(i => i.id === id ? { ...i, quantity: nextQty } : i);
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
      updated_at: new Date().toISOString()
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
        min_threshold: newIng.min_threshold
      });
      if (error) throw error;
      alert("เพิ่มวัตถุดิบใหม่เข้าสต็อกแล้ว!");
      fetchIngredients(); // reload to get real UUID from supabase
    } catch (e) {
      console.warn("Saved locally. Supabase error.");
      alert("บันทึกข้อมูลวัตถุดิบในบราวเซอร์นี้สำเร็จ! (หมายเหตุ: มีปัญหาเชื่อมต่อกับฐานข้อมูลหลัก)");
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
      updated_at: new Date().toISOString()
    };

    const updated = ingredients.map(i => i.id === editingIng.id ? updatedIng : i);
    setIngredients(updated);
    localStorage.setItem("ran-lung-get-mock-ingredients", JSON.stringify(updated));
    setIsEditModalOpen(false);

    try {
      const { error } = await supabase.from("ingredients").update({
        name: updatedIng.name,
        quantity: updatedIng.quantity,
        unit: updatedIng.unit,
        min_threshold: updatedIng.min_threshold,
        updated_at: new Date().toISOString()
      }).eq("id", editingIng.id);
      if (error) throw error;
      alert("แก้ไขข้อมูลวัตถุดิบสำเร็จ!");
    } catch (e) {
      console.warn("Updated locally.");
      alert("อัปเดตข้อมูลในบราวเซอร์เครื่องนี้สำเร็จ! (หมายเหตุ: มีปัญหาเชื่อมต่อกับฐานข้อมูลหลัก)");
    }
  };

  const handleDeleteIng = async (id: string) => {
    if (!confirm("คุณต้องการลบวัตถุดิบนี้ออกจากสต็อกใช่หรือไม่?")) return;

    const updated = ingredients.filter(i => i.id !== id);
    setIngredients(updated);
    localStorage.setItem("ran-lung-get-mock-ingredients", JSON.stringify(updated));

    try {
      const { error } = await supabase.from("ingredients").delete().eq("id", id);
      if (error) throw error;
      alert("ลบวัตถุดิบเสร็จสิ้น");
    } catch (e) {
      console.warn("Deleted locally.");
      alert("ลบข้อมูลออกจากบราวเซอร์เครื่องนี้สำเร็จ! (หมายเหตุ: มีปัญหาเชื่อมต่อกับฐานข้อมูลหลัก)");
    }
  };

  const filteredIngredients = useMemo(() => {
    if (filterLowStock) {
      return ingredients.filter(i => Number(i.quantity) <= Number(i.min_threshold));
    }
    return ingredients;
  }, [ingredients, filterLowStock]);

  const lowStockCount = useMemo(() => {
    return ingredients.filter(i => Number(i.quantity) <= Number(i.min_threshold)).length;
  }, [ingredients]);

  return (
    <div className="space-y-6">
      {/* Title bar */}
      <div className="bg-white border border-[#ece4d6] rounded-3xl p-5 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div>
          <h2 className="text-base font-black text-[#002e47]">จัดการคลังวัตถุดิบ & สต็อก (Stock Management)</h2>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">รวมวัตถุดิบทั้งหมด {ingredients.length} ชนิด</p>
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
            className={`px-4 py-2 rounded-xl font-bold text-xs tracking-wider transition-all cursor-pointer ${!filterLowStock
                ? "bg-[#002e47] text-white shadow-inner"
                : "text-[#5a6e7a] hover:text-[#002e47] hover:bg-slate-50"
              }`}
          >
            วัตถุดิบทั้งหมด ({ingredients.length})
          </button>
          <button
            onClick={() => setFilterLowStock(true)}
            className={`relative flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-xs tracking-wider transition-all cursor-pointer ${filterLowStock
                ? "bg-red-500 text-white shadow-inner"
                : "text-red-500 hover:bg-red-50"
              }`}
          >
            {lowStockCount > 0 && <span className="h-2 w-2 rounded-full bg-current animate-pulse shrink-0" />}
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
          {filterLowStock ? "🎉 เยี่ยมมาก! ไม่มีวัตถุดิบใดที่ต่ำกว่าเกณฑ์แจ้งเตือน" : "❌ ไม่พบรายการวัตถุดิบ"}
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
                        สถานะ: {isLow ? <span className="text-red-600 font-black">ต่ำกว่าเกณฑ์ (Low)</span> : <span className="text-emerald-600 font-black">ปกติ (Good)</span>}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className={`text-base font-black ${isLow ? "text-red-600" : "text-[#002e47]"}`}>
                        {qty.toLocaleString()}
                      </span>
                      <span className="text-[10px] font-bold text-slate-500 ml-1">{ing.unit}</span>
                    </div>
                  </div>

                  {/* Stock progress bar */}
                  <div className="mt-4 space-y-1">
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200/50">
                      <div className={`h-full ${progressColor} transition-all duration-500`} style={{ width: `${percentage}%` }} />
                    </div>
                    <div className="flex justify-between text-[9px] text-slate-400 font-bold">
                      <span>เหลือน้อย</span>
                      <span>เกณฑ์เตือน: {threshold} {ing.unit}</span>
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
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }} />
          
          <div className="bg-white rounded-[28px] p-6 w-full max-w-sm z-10 border border-[#ece4d6] shadow-2xl relative text-[#002e47] flex flex-col">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 mb-4 shrink-0">
              <div>
                <h3 className="text-base font-black flex items-center gap-2">
                  {isAddModalOpen ? "➕ เพิ่มวัตถุดิบใหม่" : "📝 แก้ไขวัตถุดิบ"}
                </h3>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">ระบุจำนวนหน่วยและเกณฑ์แจ้งเตือนคลังเหลือน้อย</p>
              </div>
              <button
                onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }}
                className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 cursor-pointer text-slate-500"
              >
                <X size={15} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1.5">ชื่อวัตถุดิบ</label>
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
                  <label className="text-xs font-bold text-slate-500 block mb-1.5">ปริมาณสต็อก</label>
                  <input
                    type="number"
                    value={formQty}
                    onChange={(e) => setFormQty(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-[#ece4d6] rounded-xl text-xs font-bold text-[#002e47] focus:outline-none focus:ring-2 focus:ring-[#002e47]/10"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1.5">หน่วยนับ</label>
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
                <label className="text-xs font-bold text-slate-500 block mb-1.5">ระดับแจ้งเตือนสต็อกต่ำสุด (Threshold)</label>
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
                onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }}
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

import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import { supabase } from "../../lib/supabase";
import { adjustStockFromOrder } from "../../lib/supabase.service";
import { type MenuItem, MENU } from "../customer/index";
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
  Plus,
  Edit2,
  Edit3,
  Image,
  Tag,
  DollarSign,
  FileText,
  Star,
  AlertCircle,
  AlertTriangle,
  Search,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  Grip,
  BookOpen,
  LogOut,
} from "lucide-react";

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
  status: string;
  orderType?: OrderType;
  customerName?: string;
  tableNumber?: string;
  queueNumber?: string;
  note?: string;
};

// Menu item type matching Supabase schema
type MenuItemDB = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image: string | null;
  image_url: string | null;
  category: string;
  is_available: boolean;
  is_spicy: boolean;
  sort_order: number;
  options: any[] | null;
  addons: any[] | null;
  staff_note: string | null;
};

type OptionGroup = {
  id: string;
  name: string;
  choices: { id: string; label: string; price?: number }[];
};

type AddonItem = {
  id: string;
  name: string;
  price: number;
};

const BRAND = "#002e47";
const GOLD = "#fcc14a";
const INK_MUTED = "#5a6e7a";

const MENU_CATEGORIES = [
  { id: "signature", label: "Signature", emoji: "⭐" },
  { id: "main", label: "จานหลัก", emoji: "🍽️" },
  { id: "noodles", label: "เส้น/ก๋วยเตี๋ยว", emoji: "🍜" },
  { id: "rice", label: "ข้าว", emoji: "🍚" },
  { id: "drinks", label: "เครื่องดื่ม", emoji: "🥤" },
  { id: "dessert", label: "ของหวาน", emoji: "🍮" },
  { id: "vegetarian", label: "มังสวิรัติ", emoji: "🥦" },
];

// Helper to play kitchen sound
function playNotificationSound() {
  try {
    const context = new (window.AudioContext || (window as any).webkitAudioContext)();
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
    playBeep(now, 880);
    playBeep(now + 0.15, 1046.5);
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

// Sidebar Content
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
      {/* Brand Header */}
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

          {/* จอจัดการครัว */}
          <button
            onClick={() => { setView("kitchen"); if (onClose) onClose(); }}
            className={`w-full flex items-center gap-3 px-3 py-3.5 rounded-xl text-left transition duration-200 cursor-pointer ${view === "kitchen"
              ? "bg-white/10 text-white shadow-inner font-black border-l-4 border-[#fcc14a]"
              : "text-white/70 hover:text-white hover:bg-white/5 font-medium border-l-4 border-transparent"
              }`}
          >
            <ChefHat size={18} className={view === "kitchen" ? "text-[#fcc14a]" : "text-white/60"} />
            <span className="text-sm">จอจัดการครัว</span>
          </button>

          {/* ผังโต๊ะอาหาร */}
          <button
            onClick={() => { setView("tables"); if (onClose) onClose(); }}
            className={`w-full flex items-center gap-3 px-3 py-3.5 rounded-xl text-left transition duration-200 cursor-pointer ${view === "tables"
              ? "bg-white/10 text-white shadow-inner font-black border-l-4 border-[#fcc14a]"
              : "text-white/70 hover:text-white hover:bg-white/5 font-medium border-l-4 border-transparent"
              }`}
          >
            <Table size={18} className={view === "tables" ? "text-[#fcc14a]" : "text-white/60"} />
            <span className="text-sm">ผังโต๊ะอาหาร</span>
          </button>

          {/* จัดการเมนูอาหาร */}
          <button
            onClick={() => { setView("menu"); if (onClose) onClose(); }}
            className={`w-full flex items-center gap-3 px-3 py-3.5 rounded-xl text-left transition duration-200 cursor-pointer ${view === "menu"
              ? "bg-white/10 text-white shadow-inner font-black border-l-4 border-[#fcc14a]"
              : "text-white/70 hover:text-white hover:bg-white/5 font-medium border-l-4 border-transparent"
              }`}
          >
            <BookOpen size={18} className={view === "menu" ? "text-[#fcc14a]" : "text-white/60"} />
            <span className="text-sm">จัดการเมนูอาหาร</span>
          </button>

          {/* จัดการสต็อกวัตถุดิบ */}
          <button
            onClick={() => { setView("stock"); if (onClose) onClose(); }}
            className={`w-full flex items-center gap-3 px-3 py-3.5 rounded-xl text-left transition duration-200 cursor-pointer ${view === "stock"
              ? "bg-white/10 text-white shadow-inner font-black border-l-4 border-[#fcc14a]"
              : "text-white/70 hover:text-white hover:bg-white/5 font-medium border-l-4 border-transparent"
              }`}
          >
            <Inbox size={18} className={view === "stock" ? "text-[#fcc14a]" : "text-white/60"} />
            <span className="text-sm">จัดการสต็อกวัตถุดิบ</span>
          </button>

          {/* สั่งอาหาร (หน้าลูกค้า) */}
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

      {/* Footer Info */}
      <div className="p-4 border-t border-white/10 bg-white/2 shrink-0 flex flex-col gap-2">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 p-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold rounded-xl transition duration-300 cursor-pointer border border-red-500/20"
        >
          <LogOut size={16} /> ออกจากระบบ
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
    document.body.style.display = 'none';
    localStorage.removeItem("ran-lung-get-staff-token");
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  useEffect(() => {
    async function checkAuth() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          window.location.href = "/login";
          return;
        }

        const { data, error } = await supabase
          .from("users")
          .select("*")
          .eq("auth_user_id", session.user.id)
          .maybeSingle();

        if (error || !data || (data.role !== "staff" && data.role !== "admin" && data.role !== "captain")) {
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

  useEffect(() => {
    const saved = localStorage.getItem("ran-lung-get-orders");
    if (saved) {
      try { setOrders(JSON.parse(saved)); } catch (e) { console.error(e); }
    }
    fetchSupabaseOrders();

    const ordersCh = supabase
      .channel("staff-orders-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => { fetchSupabaseOrders(); })
      .on("postgres_changes", { event: "*", schema: "public", table: "order_items" }, () => { fetchSupabaseOrders(); })
      .subscribe();

    return () => { supabase.removeChannel(ordersCh); };
  }, []);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "ran-lung-get-orders" && e.newValue) {
        try {
          const newOrders: OrderHistory[] = JSON.parse(e.newValue);
          setOrders((prev) => {
            const prevIds = new Set(prev.map(o => o.id));
            const hasNew = newOrders.some(o => !prevIds.has(o.id));
            if (hasNew && soundEnabled) playNotificationSound();
            return newOrders;
          });
        } catch (err) { console.error("Sync error:", err); }
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
      date: new Date().toLocaleDateString("th-TH") + " · " + new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }),
      items: [
        { name: "กระเพราหมูกรอบ (ข้าวราด)", qty: 1, price: 70, image: "" },
        { name: "น้ำลำไย", qty: 2, price: 40, image: "" }
      ],
      subtotal: 150, delivery: 0, total: 150,
      status: "รอดำเนินการ", orderType: "dine-in",
      customerName: names[Math.floor(Math.random() * names.length)],
      tableNumber: tbs[Math.floor(Math.random() * tbs.length)],
      note: "เผ็ดปกติ"
    };
    setOrders(prev => {
      const next = [newOrder, ...prev];
      localStorage.setItem("ran-lung-get-orders", JSON.stringify(next));
      return next;
    });
    if (soundEnabled) playNotificationSound();
  };

  const clearMockOrders = () => {
    setOrders(prev => {
      const next = prev.filter(o => !o.id.startsWith("mock_"));
      localStorage.setItem("ran-lung-get-orders", JSON.stringify(next));
      return next;
    });
  };

  const advanceOrderStatus = async (id: string) => {
    let nextStatus = "สำเร็จ";
    let dbStatus = "completed";
    const targetOrder = orders.find((o) => o.id === id);
    if (!targetOrder) return;
    if (targetOrder.status === "รอดำเนินการ") { nextStatus = "กำลังทำ"; dbStatus = "preparing"; }
    else if (targetOrder.status === "กำลังทำ") { nextStatus = "พร้อมเสิร์ฟ"; dbStatus = "delivering"; }
    else if (targetOrder.status === "พร้อมเสิร์ฟ") { nextStatus = "สำเร็จ"; dbStatus = "completed"; }
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
    } catch { console.warn("Offline status update completed locally."); }
  };

  const regressOrderStatus = async (id: string) => {
    let nextStatus = "รอดำเนินการ";
    let dbStatus = "pending";
    const targetOrder = orders.find((o) => o.id === id);
    if (!targetOrder) return;
    if (targetOrder.status === "กำลังทำ") { nextStatus = "รอดำเนินการ"; dbStatus = "pending"; }
    else if (targetOrder.status === "พร้อมเสิร์ฟ") { nextStatus = "กำลังทำ"; dbStatus = "preparing"; }
    else if (targetOrder.status === "สำเร็จ") { nextStatus = "พร้อมเสิร์ฟ"; dbStatus = "delivering"; }
    const nextList = orders.map((o) => (o.id === id ? { ...o, status: nextStatus } : o));
    setOrders(nextList);
    localStorage.setItem("ran-lung-get-orders", JSON.stringify(nextList));
    try { await supabase.from("orders").update({ status: dbStatus }).eq("id", id); } catch { }
  };

  const cancelOrder = async (id: string) => {
    if (!confirm("คุณต้องการยกเลิกคำสั่งซื้อนี้ใช่หรือไม่?")) return;
    const nextList = orders.map((o) => (o.id === id ? { ...o, status: "ยกเลิก" } : o));
    setOrders(nextList);
    localStorage.setItem("ran-lung-get-orders", JSON.stringify(nextList));
    try { await supabase.from("orders").update({ status: "cancelled" }).eq("id", id); } catch { }
  };

  const clearCompletedOrders = () => {
    if (!confirm("คุณต้องการล้างรายการออเดอร์ที่เสร็จสิ้นออกใช่หรือไม่?")) return;
    const nextList = orders.filter(o => o.status !== "สำเร็จ" && o.status !== "ยกเลิก");
    setOrders(nextList);
    localStorage.setItem("ran-lung-get-orders", JSON.stringify(nextList));
  };

  const stats = useMemo(() => {
    const active = orders.filter(o => o.status !== "สำเร็จ" && o.status !== "ยกเลิก");
    return {
      totalActive: active.length,
      waiting: orders.filter(o => o.status === "รอดำเนินการ").length,
      cooking: orders.filter(o => o.status === "กำลังทำ").length,
      ready: orders.filter(o => o.status === "พร้อมเสิร์ฟ").length,
      completed: orders.filter(o => o.status === "สำเร็จ").length,
    };
  }, [orders]);

  const ordersByStatus = useMemo(() => {
    const list = orders.filter(o => typeFilter === "all" || o.orderType === typeFilter);
    return {
      waiting: list.filter(o => o.status === "รอดำเนินการ").reverse(),
      cooking: list.filter(o => o.status === "กำลังทำ"),
      ready: list.filter(o => o.status === "พร้อมเสิร์ฟ"),
    };
  }, [orders, typeFilter]);

  const filteredOrders = useMemo(() => {
    const list = orders.filter(o => typeFilter === "all" || o.orderType === typeFilter);
    if (statusFilter === "active") return list.filter(o => o.status !== "สำเร็จ" && o.status !== "ยกเลิก");
    return list.filter(o => o.status === statusFilter);
  }, [orders, statusFilter, typeFilter]);

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
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-black/60 z-40 md:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.25 }}
              className="fixed top-0 left-0 bottom-0 w-[280px] z-[55] flex flex-col md:hidden shadow-2xl"
            >
              <KitchenSidebarContent view={view} setView={setView} onClose={() => setSidebarOpen(false)} handleLogout={handleLogout} />
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
                {getViewIcon()}
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-black tracking-tight" style={{ color: BRAND }}>
                  {getViewTitle()}
                </h1>
                <p className="text-xs font-semibold text-slate-500">{getViewSubtitle()}</p>
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
                      {(tab as any).dotColor && <span className={`h-1.5 w-1.5 rounded-full ${(tab as any).dotColor} animate-pulse`} />}
                      <span>{tab.label}</span>
                      {tab.count !== undefined && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${statusFilter === tab.id ? "bg-slate-700 text-white" : "bg-slate-100 text-[#5a6e7a]"}`}>
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

              {/* Cooking Summary */}
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

              {/* Order Area */}
              <div className="flex-1 overflow-y-auto no-scrollbar">
                {statusFilter === "active" ? (
                  <div className="hidden md:grid md:grid-cols-3 gap-6 min-w-[960px]">
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

// ── Kanban Order Card ──
function OrderCard({ order, advanceOrderStatus, regressOrderStatus, cancelOrder }: {
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
  let borderLeftColor = "border-l-[#fcc14a]";
  if (isTakeaway) { typeBadge = "กลับบ้าน"; typeColor = "bg-blue-50 text-blue-800 border-blue-200"; borderLeftColor = "border-l-[#5a6e7a]"; }
  else if (isDelivery) { typeBadge = "เดลิเวอรี่"; typeColor = "bg-amber-50 text-amber-800 border-amber-200"; borderLeftColor = "border-l-[#002e47]"; }
  let nextBtnText = "เริ่มทำครัว";
  let nextBtnColor = "bg-[#002e47] text-white hover:bg-[#003957]";
  if (order.status === "กำลังทำ") { nextBtnText = "ปรุงสำเร็จ"; nextBtnColor = "bg-blue-600 text-white hover:bg-blue-700"; }
  else if (order.status === "พร้อมเสิร์ฟ") { nextBtnText = "ส่งเสิร์ฟสำเร็จ"; nextBtnColor = "bg-emerald-600 text-white hover:bg-emerald-700"; }

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
        <button onClick={() => regressOrderStatus(order.id)} disabled={order.status === "รอดำเนินการ"} className="p-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl text-slate-600 transition disabled:opacity-50">
          <RotateCcw size={13} />
        </button>
        <button onClick={() => advanceOrderStatus(order.id)} className={`flex-1 py-1.5 rounded-xl text-[11px] font-black tracking-wide shadow-sm transition flex items-center justify-center gap-1 cursor-pointer ${nextBtnColor}`}>
          <Check size={11} />
          <span>{nextBtnText}</span>
        </button>
        <button onClick={() => cancelOrder(order.id)} className="p-1.5 bg-red-50 hover:bg-red-100 border border-red-100 rounded-xl text-red-600 transition">
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}

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

// ══════════════════════════════════════════════════════════════════════════════
// TABLE MANAGEMENT VIEW — with Add/Delete table
// ══════════════════════════════════════════════════════════════════════════════
function TableManagementView({ orders, onRefreshOrders }: { orders: OrderHistory[]; onRefreshOrders: () => Promise<void>; }) {
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
          <button onClick={fetchTables} className="bg-[#002e47]/5 border hover:bg-[#002e47]/10 text-[#002e47] text-xs font-black px-3.5 py-2 rounded-xl transition">
            🔄 โหลดใหม่
          </button>
          <button
            onClick={() => setIsAddTableOpen(true)}
            className="flex items-center gap-1.5 bg-[#002e47] hover:bg-[#003a5c] text-white text-xs font-black px-4 py-2 rounded-xl transition shadow-sm"
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
                    className={`py-2 rounded-md font-bold text-[10px] border transition ${selectedTable.status === "available" ? "bg-emerald-500 text-white border-emerald-600" : "bg-white border-slate-200 hover:bg-slate-50"}`}
                  >
                    🟢 ว่าง
                  </button>
                  <button
                    onClick={() => updateTableStatus(selectedTable.id, "occupied")}
                    className={`py-2 rounded-md font-bold text-[10px] border transition ${selectedTable.status === "occupied" ? "bg-red-500 text-white border-red-600" : "bg-white border-slate-200 hover:bg-slate-50"}`}
                  >
                    🔴 มีลูกค้า
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="mb-6 space-y-2">
                <span className="text-xs font-bold text-slate-500 block mb-1">เมนูการจัดการ</span>
                <button onClick={() => setIsMoveSelectorOpen(true)} className="w-full py-3 px-4 rounded-md border border-slate-200 hover:bg-slate-50 font-bold text-xs flex items-center justify-between transition">
                  <span className="flex items-center gap-2">🔄 ย้าย / รวมออเดอร์ไปยังโต๊ะอื่น</span>
                  <ChevronRight size={14} className="text-slate-400" />
                </button>
                <a href="/customer" target="_blank" rel="noreferrer"
                  onClick={() => { localStorage.setItem("ran-lung-get-selected-table", selectedTable.id); }}
                  className="w-full py-3 px-4 rounded-md border border-slate-200 hover:bg-slate-50 font-bold text-xs flex items-center justify-between transition block text-left text-inherit no-underline"
                >
                  <span className="flex items-center gap-2">🛍️ สั่งอาหาร Walk-in (ชำระเงินสด/โอนเงิน)</span>
                  <PlusCircle size={14} className="text-slate-400" />
                </a>
                <button
                  onClick={() => setConfirmDialog({ isOpen: true, title: "ยืนยันการเคลียร์โต๊ะ", message: `คุณต้องการเคลียร์โต๊ะและเปลี่ยนสถานะออเดอร์ค้างทั้งหมดของ ${selectedTable.label} ให้เสร็จสิ้นใช่หรือไม่?`, onConfirm: async () => { await clearTableAndOrders(selectedTable.label); } })}
                  className="w-full py-3 px-4 rounded-md border border-red-200 text-red-700 bg-red-50/30 hover:bg-red-50 font-bold text-xs flex items-center justify-between transition"
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
                  className="w-full py-3 px-4 rounded-md border border-red-300 text-red-800 bg-red-100/50 hover:bg-red-100 font-bold text-xs flex items-center justify-between transition"
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
                    className={`py-2.5 rounded-xl font-bold text-xs border transition ${newTableType === "normal" ? "bg-[#002e47] text-white border-[#002e47]" : "bg-white border-slate-200 hover:bg-slate-50"}`}
                  >
                    🪑 ปกติ
                  </button>
                  <button
                    onClick={() => setNewTableType("walkin")}
                    className={`py-2.5 rounded-xl font-bold text-xs border transition ${newTableType === "walkin" ? "bg-slate-600 text-white border-slate-600" : "bg-white border-slate-200 hover:bg-slate-50"}`}
                  >
                    🚶 Walk-in
                  </button>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setIsAddTableOpen(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition">
                ยกเลิก
              </button>
              <button
                onClick={addNewTable}
                disabled={!newTableName.trim() || addingTable}
                className="flex-1 py-2.5 rounded-xl bg-[#002e47] text-white font-black text-xs hover:bg-[#003a5c] transition disabled:opacity-50"
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
              <button onClick={() => setIsMoveSelectorOpen(false)} className="px-5 py-2.5 rounded-md border border-slate-200 hover:bg-slate-50 font-bold text-xs">ยกเลิก</button>
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

// ══════════════════════════════════════════════════════════════════════════════
// MENU MANAGEMENT VIEW — Full CRUD
// ══════════════════════════════════════════════════════════════════════════════
function MenuManagementView() {
  const [menuItems, setMenuItems] = useState<MenuItemDB[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [editItem, setEditItem] = useState<MenuItemDB | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formCategory, setFormCategory] = useState("signature");
  const [formIsSpicy, setFormIsSpicy] = useState(false);
  const [formImageUrl, setFormImageUrl] = useState("");
  const [formImagePath, setFormImagePath] = useState("");
  const [formOptions, setFormOptions] = useState<OptionGroup[]>([]);
  const [formAddons, setFormAddons] = useState<AddonItem[]>([]);
  const [formStaffNote, setFormStaffNote] = useState("");

  const fetchMenuItems = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("menu_items")
        .select("*")
        .order("sort_order", { ascending: true });
      if (!error && data) {
        setMenuItems(data as MenuItemDB[]);
      } else {
        // Fallback to local MENU constant
        const fallback: MenuItemDB[] = MENU.map((m, i) => ({
          id: m.id, name: m.name, description: m.desc, price: m.price,
          image: m.image, image_url: null, category: m.category,
          is_available: true, is_spicy: m.spicy || false, sort_order: i,
          options: m.options || null, addons: m.addons || null, staff_note: null
        }));
        setMenuItems(fallback);
      }
    } catch {
      const fallback: MenuItemDB[] = MENU.map((m, i) => ({
        id: m.id, name: m.name, description: m.desc, price: m.price,
        image: m.image, image_url: null, category: m.category,
        is_available: true, is_spicy: m.spicy || false, sort_order: i,
        options: m.options || null, addons: m.addons || null, staff_note: null
      }));
      setMenuItems(fallback);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenuItems();
    const ch = supabase
      .channel("menu-items-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "menu_items" }, (payload: any) => {
        if (payload.eventType === "DELETE") {
          setMenuItems(prev => prev.filter(m => m.id !== payload.old.id));
        } else if (payload.eventType === "INSERT") {
          setMenuItems(prev => {
            if (prev.some(m => m.id === payload.new.id)) return prev;
            return [...prev, payload.new as MenuItemDB].sort((a, b) => a.sort_order - b.sort_order);
          });
        } else if (payload.eventType === "UPDATE") {
          setMenuItems(prev => prev.map(m => m.id === payload.new.id ? { ...m, ...payload.new } : m));
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const openAddForm = () => {
    setEditItem(null);
    setFormName(""); setFormDesc(""); setFormPrice(""); setFormCategory("signature");
    setFormIsSpicy(false); setFormImageUrl(""); setFormImagePath("");
    setFormOptions([]); setFormAddons([]); setFormStaffNote("");
    setIsFormOpen(true);
  };

  const openEditForm = (item: MenuItemDB) => {
    setEditItem(item);
    setFormName(item.name);
    setFormDesc(item.description || "");
    setFormPrice(String(item.price));
    setFormCategory(item.category);
    setFormIsSpicy(item.is_spicy);
    setFormImageUrl(item.image_url || item.image || "");
    setFormImagePath(item.image || "");
    setFormOptions(Array.isArray(item.options) ? item.options.map((og: any) => ({
      id: og.id || String(Math.random()), name: og.name || "",
      choices: Array.isArray(og.choices) ? og.choices : []
    })) : []);
    setFormAddons(Array.isArray(item.addons) ? item.addons.map((a: any) => ({ id: a.id || String(Math.random()), name: a.name || "", price: Number(a.price) || 0 })) : []);
    setFormStaffNote(item.staff_note || "");
    setIsFormOpen(true);
  };

  const handleImageUpload = async (file: File) => {
    setUploadingImage(true);
    try {
      const ext = file.name.split(".").pop();
      const fileName = `menu_${Date.now()}.${ext}`;
      const { data, error } = await supabase.storage
        .from("menu-images")
        .upload(fileName, file, { upsert: true, contentType: file.type });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("menu-images").getPublicUrl(data.path);
      setFormImageUrl(urlData.publicUrl);
    } catch (e: any) {
      console.warn("Image upload failed:", e?.message);
      // Use local preview as fallback
      const reader = new FileReader();
      reader.onload = (ev) => setFormImageUrl(ev.target?.result as string);
      reader.readAsDataURL(file);
    } finally {
      setUploadingImage(false);
    }
  };

  const generateId = (name: string) => {
    return "m_" + name.replace(/[^a-zA-Z0-9ก-๙]/g, "_").toLowerCase().slice(0, 30) + "_" + Date.now();
  };

  const saveMenuItem = async () => {
    if (!formName.trim() || !formPrice) return;
    setSaving(true);
    const price = parseFloat(formPrice);
    const payload: any = {
      name: formName.trim(),
      description: formDesc.trim() || null,
      price,
      category: formCategory,
      is_spicy: formIsSpicy,
      is_available: editItem ? editItem.is_available : true,
      image: formImagePath || null,
      image_url: formImageUrl || null,
      options: formOptions.length > 0 ? formOptions : null,
      addons: formAddons.length > 0 ? formAddons : null,
      staff_note: formStaffNote.trim() || null,
      sort_order: editItem ? editItem.sort_order : menuItems.length,
    };

    try {
      if (editItem) {
        const { error } = await supabase.from("menu_items").update(payload).eq("id", editItem.id);
        if (error) throw error;
        setMenuItems(prev => prev.map(m => m.id === editItem.id ? { ...m, ...payload } : m));
      } else {
        const newId = generateId(formName);
        const { data, error } = await supabase.from("menu_items").insert({ ...payload, id: newId }).select().single();
        if (error) throw error;
        setMenuItems(prev => {
          if (prev.some(m => m.id === data.id)) return prev;
          return [...prev, data as MenuItemDB].sort((a, b) => a.sort_order - b.sort_order);
        });
      }
      setIsFormOpen(false);
    } catch (e: any) {
      alert("บันทึกไม่สำเร็จ: " + (e?.message || "เกิดข้อผิดพลาด"));
    } finally {
      setSaving(false);
    }
  };

  const deleteMenuItem = async (item: MenuItemDB) => {
    if (!confirm(`คุณต้องการลบเมนู "${item.name}" ออกจากระบบใช่หรือไม่?`)) return;
    try {
      const { error } = await supabase.from("menu_items").delete().eq("id", item.id);
      if (error) throw error;
      setMenuItems(prev => prev.filter(m => m.id !== item.id));
      if (isFormOpen && editItem?.id === item.id) setIsFormOpen(false);
    } catch (e: any) {
      alert("ลบไม่สำเร็จ: " + (e?.message || "เกิดข้อผิดพลาด"));
    }
  };

  const toggleAvailability = async (item: MenuItemDB) => {
    const next = !item.is_available;
    setMenuItems(prev => prev.map(m => m.id === item.id ? { ...m, is_available: next } : m));
    try {
      await supabase.from("menu_items").update({ is_available: next }).eq("id", item.id);
    } catch { }
  };

  // Option group helpers
  const addOptionGroup = () => {
    setFormOptions(prev => [...prev, { id: "og_" + Date.now(), name: "", choices: [] }]);
  };
  const removeOptionGroup = (idx: number) => {
    setFormOptions(prev => prev.filter((_, i) => i !== idx));
  };
  const updateOptionGroupName = (idx: number, name: string) => {
    setFormOptions(prev => prev.map((og, i) => i === idx ? { ...og, name } : og));
  };
  const addChoice = (ogIdx: number) => {
    setFormOptions(prev => prev.map((og, i) => i === ogIdx ? { ...og, choices: [...og.choices, { id: "c_" + Date.now(), label: "", price: undefined }] } : og));
  };
  const removeChoice = (ogIdx: number, cIdx: number) => {
    setFormOptions(prev => prev.map((og, i) => i === ogIdx ? { ...og, choices: og.choices.filter((_, ci) => ci !== cIdx) } : og));
  };
  const updateChoice = (ogIdx: number, cIdx: number, field: string, value: string) => {
    setFormOptions(prev => prev.map((og, i) => i === ogIdx ? {
      ...og, choices: og.choices.map((c, ci) => ci === cIdx ? { ...c, [field]: field === "price" ? (value === "" ? undefined : Number(value)) : value } : c)
    } : og));
  };

  // Addon helpers
  const addAddon = () => { setFormAddons(prev => [...prev, { id: "a_" + Date.now(), name: "", price: 0 }]); };
  const removeAddon = (idx: number) => { setFormAddons(prev => prev.filter((_, i) => i !== idx)); };
  const updateAddon = (idx: number, field: string, value: string) => {
    setFormAddons(prev => prev.map((a, i) => i === idx ? { ...a, [field]: field === "price" ? Number(value) : value } : a));
  };

  const filtered = menuItems.filter(m => {
    const matchSearch = search === "" || m.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === "all" || m.category === categoryFilter;
    return matchSearch && matchCat;
  });

  const getCatLabel = (catId: string) => MENU_CATEGORIES.find(c => c.id === catId)?.label || catId;
  const getCatEmoji = (catId: string) => MENU_CATEGORIES.find(c => c.id === catId)?.emoji || "🍽️";
  const getDisplayImage = (item: MenuItemDB) => item.image_url || item.image || "";

  return (
    <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
      {/* Left: Menu List */}
      <div className="flex-1 lg:max-w-[60%] flex flex-col gap-4 min-h-0">
        {/* Search + Filter + Add */}
        <div className="bg-white border border-[#ece4d6] rounded-3xl p-4 shadow-sm flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="flex-1 relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="ค้นหาเมนูอาหาร..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-xl text-sm font-bold text-[#002e47] focus:outline-none focus:ring-2 focus:ring-[#002e47]/20 bg-slate-50"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-[#002e47] focus:outline-none bg-white"
          >
            <option value="all">ทุกหมวดหมู่</option>
            {MENU_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>)}
          </select>
          <button
            onClick={openAddForm}
            className="flex items-center gap-1.5 bg-[#002e47] hover:bg-[#003a5c] text-white text-xs font-black px-4 py-2.5 rounded-xl transition shadow-sm shrink-0"
          >
            <Plus size={14} />
            <span>เพิ่มเมนู</span>
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white border border-[#ece4d6] rounded-2xl p-3 shadow-sm text-center">
            <p className="text-2xl font-black text-[#002e47]">{menuItems.length}</p>
            <p className="text-[10px] font-bold text-slate-500">รายการทั้งหมด</p>
          </div>
          <div className="bg-white border border-emerald-200 rounded-2xl p-3 shadow-sm text-center">
            <p className="text-2xl font-black text-emerald-600">{menuItems.filter(m => m.is_available).length}</p>
            <p className="text-[10px] font-bold text-slate-500">มีจำหน่าย</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-sm text-center">
            <p className="text-2xl font-black text-slate-400">{menuItems.filter(m => !m.is_available).length}</p>
            <p className="text-[10px] font-bold text-slate-500">หมดชั่วคราว</p>
          </div>
        </div>

        {/* Menu List */}
        <div className="bg-white border border-[#ece4d6] rounded-3xl shadow-sm flex-1 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-[#ece4d6] flex items-center justify-between">
            <h2 className="font-black text-[#002e47] text-sm">รายการเมนูอาหาร ({filtered.length})</h2>
            <button onClick={fetchMenuItems} className="text-xs font-bold text-slate-500 hover:text-[#002e47] transition">🔄 รีเฟรช</button>
          </div>
          <div className="flex-1 overflow-y-auto no-scrollbar divide-y divide-slate-50">
            {loading ? (
              <div className="p-12 text-center text-slate-400 font-bold">กำลังโหลดเมนู...</div>
            ) : filtered.length === 0 ? (
              <div className="p-12 text-center text-slate-400 font-bold">ไม่พบเมนูที่ค้นหา</div>
            ) : filtered.map(item => (
              <div key={item.id} className={`flex items-center gap-3 p-3 hover:bg-slate-50 transition group ${!item.is_available ? "opacity-60" : ""}`}>
                {/* Image */}
                <div className="h-14 w-14 rounded-xl overflow-hidden bg-slate-100 shrink-0 flex items-center justify-center">
                  {getDisplayImage(item) ? (
                    <img src={getDisplayImage(item)} alt={item.name} className="h-full w-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  ) : (
                    <span className="text-2xl">{getCatEmoji(item.category)}</span>
                  )}
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-black text-[#002e47] text-sm truncate">{item.name}</span>
                    {item.is_spicy && <Flame size={11} className="text-red-500 shrink-0" />}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] bg-[#002e47]/5 text-[#002e47] px-1.5 py-0.5 rounded font-bold">{getCatEmoji(item.category)} {getCatLabel(item.category)}</span>
                    <span className="font-black text-[#002e47] text-xs">฿{item.price}</span>
                    {!item.is_available && <span className="text-[9px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-black">หมดชั่วคราว</span>}
                  </div>
                  {item.staff_note && (
                    <p className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded mt-0.5 font-semibold truncate">📝 {item.staff_note}</p>
                  )}
                </div>
                {/* Actions */}
                <div className="flex items-center gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition">
                  <button onClick={() => toggleAvailability(item)} title={item.is_available ? "ซ่อนชั่วคราว" : "เปิดจำหน่าย"}
                    className={`p-1.5 rounded-lg border transition ${item.is_available ? "bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100" : "bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200"}`}>
                    {item.is_available ? <Eye size={13} /> : <EyeOff size={13} />}
                  </button>
                  <button onClick={() => openEditForm(item)} className="p-1.5 rounded-lg border bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100 transition">
                    <Edit3 size={13} />
                  </button>
                  <button onClick={() => deleteMenuItem(item)} className="p-1.5 rounded-lg border bg-red-50 border-red-200 text-red-500 hover:bg-red-100 transition">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Edit/Add Form Panel */}
      <div className={`w-full lg:w-[42%] ${isFormOpen ? "block" : "hidden lg:flex"} flex flex-col`}>
        {isFormOpen ? (
          <div className="bg-white border border-[#ece4d6] rounded-3xl shadow-sm flex flex-col h-full max-h-[calc(100vh-160px)] overflow-hidden">
            {/* Form Header */}
            <div className="p-5 border-b border-[#ece4d6] flex items-center justify-between shrink-0 bg-[#002e47] rounded-t-3xl">
              <div>
                <h3 className="font-black text-white text-base">{editItem ? "✏️ แก้ไขเมนู" : "➕ เพิ่มเมนูใหม่"}</h3>
                {editItem && <p className="text-[10px] text-white/60 font-bold mt-0.5">ID: {editItem.id}</p>}
              </div>
              <button onClick={() => setIsFormOpen(false)} className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 cursor-pointer text-white">
                <X size={15} />
              </button>
            </div>

            {/* Form Body */}
            <div className="flex-1 overflow-y-auto no-scrollbar p-5 space-y-5">
              {/* Image Upload */}
              <div>
                <label className="text-xs font-black text-slate-600 block mb-2 flex items-center gap-1.5">
                  <Image size={12} /> รูปภาพเมนู
                </label>
                <div
                  className="relative h-36 rounded-2xl border-2 border-dashed border-slate-200 overflow-hidden bg-slate-50 flex items-center justify-center cursor-pointer hover:border-[#002e47]/40 transition group"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {formImageUrl ? (
                    <>
                      <img src={formImageUrl} alt="preview" className="h-full w-full object-cover" onError={() => setFormImageUrl("")} />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                        <span className="text-white font-black text-xs">เปลี่ยนรูป</span>
                      </div>
                    </>
                  ) : (
                    <div className="text-center text-slate-400">
                      {uploadingImage ? (
                        <p className="text-xs font-bold">กำลังอัปโหลด...</p>
                      ) : (
                        <>
                          <Image size={28} className="mx-auto mb-2 opacity-30" />
                          <p className="text-xs font-bold">คลิกเพื่ออัปโหลดรูปอาหาร</p>
                          <p className="text-[10px] text-slate-400">JPG, PNG, WebP</p>
                        </>
                      )}
                    </div>
                  )}
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                  onChange={async e => { if (e.target.files?.[0]) { await handleImageUpload(e.target.files[0]); e.target.value = ""; } }} />
                {formImageUrl && (
                  <div className="mt-2 flex gap-2">
                    <input
                      type="text"
                      value={formImageUrl}
                      onChange={e => setFormImageUrl(e.target.value)}
                      placeholder="หรือวาง URL รูปภาพ"
                      className="flex-1 border border-slate-200 rounded-lg px-2.5 py-1.5 text-[11px] font-bold focus:outline-none focus:ring-1 focus:ring-[#002e47]/20"
                    />
                    <button onClick={() => setFormImageUrl("")} className="text-[10px] text-red-500 font-bold hover:text-red-700 px-2">ลบ</button>
                  </div>
                )}
                {!formImageUrl && (
                  <input
                    type="text"
                    value={formImageUrl}
                    onChange={e => setFormImageUrl(e.target.value)}
                    placeholder="หรือวาง URL รูปภาพ เช่น https://... หรือ /meal/..."
                    className="mt-2 w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-[11px] font-bold focus:outline-none focus:ring-1 focus:ring-[#002e47]/20"
                  />
                )}
              </div>

              {/* Name */}
              <div>
                <label className="text-xs font-black text-slate-600 block mb-1.5 flex items-center gap-1.5">
                  <Tag size={12} /> ชื่อเมนู <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="ชื่อเมนูอาหาร เช่น กระเพราหมูสับ"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold text-[#002e47] focus:outline-none focus:ring-2 focus:ring-[#002e47]/20"
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-black text-slate-600 block mb-1.5 flex items-center gap-1.5">
                  <FileText size={12} /> คำอธิบายเมนู
                </label>
                <textarea
                  placeholder="บรรยายส่วนประกอบ รสชาติ วัตถุดิบหลัก..."
                  value={formDesc}
                  onChange={e => setFormDesc(e.target.value)}
                  rows={2}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-[#002e47] focus:outline-none focus:ring-2 focus:ring-[#002e47]/20 resize-none"
                />
              </div>

              {/* Price + Category */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-black text-slate-600 block mb-1.5 flex items-center gap-1.5">
                    <DollarSign size={12} /> ราคา (บาท) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    min={0}
                    value={formPrice}
                    onChange={e => setFormPrice(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-black text-[#002e47] focus:outline-none focus:ring-2 focus:ring-[#002e47]/20"
                  />
                </div>
                <div>
                  <label className="text-xs font-black text-slate-600 block mb-1.5">หมวดหมู่</label>
                  <select
                    value={formCategory}
                    onChange={e => setFormCategory(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold text-[#002e47] focus:outline-none bg-white"
                  >
                    {MENU_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>)}
                  </select>
                </div>
              </div>

              {/* Spicy toggle */}
              <div className="flex items-center justify-between bg-slate-50 rounded-xl p-3 border border-slate-200">
                <div className="flex items-center gap-2">
                  <Flame size={16} className="text-red-500" />
                  <span className="text-sm font-bold text-[#002e47]">เมนูนี้มีรสเผ็ด</span>
                </div>
                <button
                  onClick={() => setFormIsSpicy(!formIsSpicy)}
                  className={`relative h-6 w-11 rounded-full transition-colors duration-200 ${formIsSpicy ? "bg-red-500" : "bg-slate-300"}`}
                >
                  <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${formIsSpicy ? "translate-x-[22px]" : "translate-x-0.5"}`} />
                </button>
              </div>

              {/* Options (ตัวเลือก) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-black text-slate-600 flex items-center gap-1.5">
                    <Grip size={12} /> ตัวเลือก (Options) — เช่น ระดับความเผ็ด
                  </label>
                  <button onClick={addOptionGroup} className="text-[10px] font-black text-[#002e47] bg-[#002e47]/10 hover:bg-[#002e47]/20 px-2.5 py-1 rounded-lg transition">
                    + เพิ่มกลุ่ม
                  </button>
                </div>
                {formOptions.length === 0 && (
                  <p className="text-[11px] text-slate-400 italic font-bold text-center py-3 bg-slate-50 rounded-xl border border-dashed border-slate-200">ยังไม่มีตัวเลือก กด "+ เพิ่มกลุ่ม" เพื่อเริ่ม</p>
                )}
                {formOptions.map((og, ogIdx) => (
                  <div key={og.id} className="border border-slate-200 rounded-xl p-3 mb-2 bg-slate-50/50">
                    <div className="flex items-center gap-2 mb-2">
                      <input
                        type="text" placeholder="ชื่อกลุ่มตัวเลือก เช่น ระดับความเผ็ด"
                        value={og.name}
                        onChange={e => updateOptionGroupName(ogIdx, e.target.value)}
                        className="flex-1 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-[#002e47]/20"
                      />
                      <button onClick={() => removeOptionGroup(ogIdx)} className="text-red-500 hover:text-red-700 p-1"><Trash2 size={12} /></button>
                    </div>
                    <div className="space-y-1.5">
                      {og.choices.map((c, cIdx) => (
                        <div key={c.id} className="flex items-center gap-1.5">
                          <input
                            type="text" placeholder="ชื่อตัวเลือก เช่น เผ็ดมาก"
                            value={c.label}
                            onChange={e => updateChoice(ogIdx, cIdx, "label", e.target.value)}
                            className="flex-1 border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold focus:outline-none"
                          />
                          <input
                            type="number" placeholder="บวก฿" min={0}
                            value={c.price ?? ""}
                            onChange={e => updateChoice(ogIdx, cIdx, "price", e.target.value)}
                            className="w-16 border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold focus:outline-none"
                          />
                          <button onClick={() => removeChoice(ogIdx, cIdx)} className="text-red-400 hover:text-red-600 p-1"><X size={11} /></button>
                        </div>
                      ))}
                      <button onClick={() => addChoice(ogIdx)} className="text-[10px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 mt-1">
                        <Plus size={10} /> เพิ่ม choice
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Addons (วัตถุดิบเพิ่ม) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-black text-slate-600 flex items-center gap-1.5">
                    <Plus size={12} /> วัตถุดิบเพิ่ม (Addons) — เช่น ไข่ดาว, หมูกรอบ
                  </label>
                  <button onClick={addAddon} className="text-[10px] font-black text-[#002e47] bg-[#002e47]/10 hover:bg-[#002e47]/20 px-2.5 py-1 rounded-lg transition">
                    + เพิ่ม
                  </button>
                </div>
                {formAddons.length === 0 && (
                  <p className="text-[11px] text-slate-400 italic font-bold text-center py-3 bg-slate-50 rounded-xl border border-dashed border-slate-200">ยังไม่มี addons</p>
                )}
                {formAddons.map((a, idx) => (
                  <div key={a.id} className="flex items-center gap-1.5 mb-1.5">
                    <input
                      type="text" placeholder="ชื่อ addon เช่น ไข่ดาว"
                      value={a.name}
                      onChange={e => updateAddon(idx, "name", e.target.value)}
                      className="flex-1 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold focus:outline-none"
                    />
                    <span className="text-xs font-bold text-slate-500">+฿</span>
                    <input
                      type="number" placeholder="0" min={0}
                      value={a.price}
                      onChange={e => updateAddon(idx, "price", e.target.value)}
                      className="w-16 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold focus:outline-none"
                    />
                    <button onClick={() => removeAddon(idx)} className="text-red-400 hover:text-red-600 p-1"><X size={12} /></button>
                  </div>
                ))}
              </div>

              {/* Staff Note */}
              <div>
                <label className="text-xs font-black text-slate-600 block mb-1.5 flex items-center gap-1.5">
                  <FileText size={12} /> หมายเหตุพนักงาน (Staff Note)
                </label>
                <textarea
                  placeholder="เช่น: วัตถุดิบในสต็อก: หมูสด, กระเพรา / แจ้งครัวแยกเสิร์ฟ..."
                  value={formStaffNote}
                  onChange={e => setFormStaffNote(e.target.value)}
                  rows={2}
                  className="w-full border border-amber-200 bg-amber-50 rounded-xl px-3 py-2.5 text-sm font-semibold text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-300/40 resize-none placeholder:text-amber-400"
                />
                <p className="text-[10px] text-amber-600 font-bold mt-1">📝 ข้อความนี้จะปรากฏบนรายการเมนูให้พนักงานเห็น</p>
              </div>
            </div>

            {/* Form Footer */}
            <div className="p-5 border-t border-[#ece4d6] shrink-0 flex gap-3 bg-slate-50 rounded-b-3xl">
              {editItem && (
                <button
                  onClick={() => deleteMenuItem(editItem)}
                  className="px-4 py-2.5 rounded-xl border border-red-300 text-red-600 bg-red-50 hover:bg-red-100 font-bold text-xs transition"
                >
                  🗑️ ลบเมนูนี้
                </button>
              )}
              <div className="flex-1" />
              <button onClick={() => setIsFormOpen(false)} className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-100 transition">
                ยกเลิก
              </button>
              <button
                onClick={saveMenuItem}
                disabled={!formName.trim() || !formPrice || saving}
                className="px-6 py-2.5 rounded-xl bg-[#002e47] hover:bg-[#003a5c] text-white font-black text-xs transition shadow-sm disabled:opacity-50"
              >
                {saving ? "กำลังบันทึก..." : editItem ? "💾 บันทึกการแก้ไข" : "✅ เพิ่มเมนู"}
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-[#ece4d6] rounded-3xl shadow-sm flex-1 flex flex-col items-center justify-center text-center p-12">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="font-black text-[#002e47] text-base mb-2">จัดการเมนูอาหาร</h3>
            <p className="text-xs text-slate-500 font-semibold max-w-[220px] leading-relaxed mb-6">
              เลือกเมนูจากรายการด้านซ้ายเพื่อแก้ไข หรือกด "+ เพิ่มเมนู" เพื่อสร้างเมนูใหม่
            </p>
            <button
              onClick={openAddForm}
              className="flex items-center gap-2 bg-[#002e47] hover:bg-[#003a5c] text-white font-black text-sm px-5 py-3 rounded-2xl transition shadow-md"
            >
              <Plus size={16} />
              <span>เพิ่มเมนูใหม่</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}


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
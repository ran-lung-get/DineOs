import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import { supabase } from "../../lib/supabase";
import {
  getIngredients,
  updateIngredientStock,
  addIngredient,
  deleteIngredient,
} from "../../lib/supabase.service";
import { MENU, type MenuItem } from "../customer/index";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as ChartTooltip,
  CartesianGrid,
} from "recharts";
import {
  ChefHat,
  LayoutDashboard,
  ClipboardList,
  Users,
  LogOut,
  ArrowLeft,
  Check,
  X,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  PlusCircle,
  Filter,
  CheckCircle,
  Menu,
  Trash2,
  Edit2,
  Shield,
  ShieldCheck,
  UserX,
  UserCheck,
  Flame,
  Search,
  UserPlus,
} from "lucide-react";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

const BRAND = "#002e47";
const GOLD = "#fcc14a";
const INK_MUTED = "#5a6e7a";
const LINEN = "#fff8f2";
const SURFACE = "#f8fafc";

// Helper to extract timestamp from order ID for sorting
const getTimestampFromOrderId = (id: string) => {
  if (id.startsWith("hist_")) {
    const tsString = id.replace("hist_", "");
    const ts = parseInt(tsString);
    if (!isNaN(ts) && ts > 1000000000000) {
      return ts;
    }
  }
  if (id === "hist_1") return Date.now() - 15 * 60 * 1000;
  if (id === "hist_2") return Date.now() - 30 * 60 * 1000;
  return Date.now();
};

function AdminDashboard() {
  const navigate = useNavigate();
  const [view, setView] = useState<"dashboard" | "inventory" | "staff" | "approvals">("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [soundEnabled] = useState(true);

  // Auth check state
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [adminUser, setAdminUser] = useState<any>(null);

  // Dashboard state
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Inventory state
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [loadingIngredients, setLoadingIngredients] = useState(false);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loadingMenuItems, setLoadingMenuItems] = useState(false);
  const [activeSubView, setActiveSubView] = useState<"menu" | "ingredients">("menu");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showAddForm, setShowAddForm] = useState(false);
  const [outOfStockIds, setOutOfStockIds] = useState<string[]>([]);

  // Add ingredient form states
  const [newIngName, setNewIngName] = useState("");
  const [newIngQty, setNewIngQty] = useState("");
  const [newIngUnit, setNewIngUnit] = useState("g");
  const [newIngThreshold, setNewIngThreshold] = useState("");

  // Edit ingredient states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editQty, setEditQty] = useState("");
  const [editUnit, setEditUnit] = useState("g");
  const [editThreshold, setEditThreshold] = useState("");

  // Staff management state
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // 1. Verify Admin Auth
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

        // Fetch role from users table
        const { data, error } = await supabase
          .from("users")
          .select("*")
          .eq("auth_user_id", session.user.id)
          .maybeSingle();

        if (error || !data || data.role !== "admin") {
          // If not admin, send to customer page (or warn them)
          console.warn("Unauthorized access: admin role required");
          window.location.href = "/customer";
          return;
        }

        if (data.is_active === false) {
          alert("บัญชีแอดมินของคุณอยู่ระหว่างรอการอนุมัติสิทธิ์ (Pending Approval)");
          await supabase.auth.signOut();
          window.location.href = "/login";
          return;
        }

        setAdminUser(data);
      } catch (err) {
        console.error("Auth check failed:", err);
        window.location.href = "/customer";
      } finally {
        setCheckingAuth(false);
      }
    }
    checkAuth();
  }, []);

  // 2. Fetch Orders (for Dashboard Stats)
  const fetchSupabaseOrders = async () => {
    setLoadingOrders(true);
    try {
      const { data: dbOrders, error } = await supabase
        .from("orders")
        .select(
          `
          *,
          customers (
            display_name
          ),
          order_items (*)
        `,
        )
        .order("created_at", { ascending: false });

      if (!error && dbOrders) {
        const mapped = dbOrders.map((o: any) => {
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
            })),
            subtotal: Number(o.subtotal),
            delivery: Number(o.delivery_fee),
            total: Number(o.total),
            status: localStatus,
            orderType: o.order_type,
            customerName: o.customers?.display_name || "คุณลูกค้า",
            tableNumber: o.table_number || "",
            queueNumber: o.queue_number || "",
            note: o.special_instructions || "",
            created_at: o.created_at,
          };
        });
        setOrders(mapped);
      }
    } catch (e) {
      console.error("Failed to load orders:", e);
    } finally {
      setLoadingOrders(false);
    }
  };

  // 3. Fetch Ingredients (for Stock view) — always reads directly from Supabase
  const fetchIngredients = async () => {
    setLoadingIngredients(true);
    try {
      const data = await getIngredients();
      setIngredients(data ?? []);
    } catch (err) {
      console.error("Load stock error:", err);
    } finally {
      setLoadingIngredients(false);
    }
  };

  const fetchMenuItems = async () => {
    setLoadingMenuItems(true);
    try {
      const { data, error } = await supabase
        .from("menu_items")
        .select("*")
        .order("sort_order", { ascending: true });

      if (!error && data) {
        const mapped = data.map((item: any) => ({
          id: item.id,
          name: item.name,
          desc: item.description || "",
          price: Number(item.price),
          image: item.image_url || item.image || "",
          category: item.category || "signature",
          isAvailable: item.is_available ?? true,
          isSpicy: item.is_spicy ?? false,
          options: item.options || undefined,
          addons: item.addons || undefined,
        }));
        setMenuItems(mapped);
      } else {
        setMenuItems([]);
      }
    } catch (err) {
      console.error("Load menu items error:", err);
      setMenuItems([]);
    } finally {
      setLoadingMenuItems(false);
    }
  };

  // 4. Fetch Users (for Staff role controller)
  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) {
        setUsers(data);
      } else {
        // Mock fallback if DB schema doesn't match or fails
        const mockUsers = [
          {
            id: "u-1",
            display_name: "แอดมินลุงเกตุ",
            email: "admin@lungget.com",
            role: "admin",
            is_active: true,
            picture_url: null,
          },
          {
            id: "u-2",
            display_name: "สมศรี แม่ครัว",
            email: "cook@lungget.com",
            role: "staff",
            is_active: true,
            picture_url: null,
          },
          {
            id: "u-3",
            display_name: "นายสมชาย (ลูกค้า)",
            email: "somchai@gmail.com",
            role: "customer",
            is_active: true,
            picture_url: null,
          },
        ];
        setUsers(mockUsers);
      }
    } catch (e) {
      console.error("Load users failed:", e);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Initialize data on view change
  useEffect(() => {
    if (checkingAuth) return;
    if (view === "dashboard") {
      fetchSupabaseOrders();
    } else if (view === "inventory") {
      fetchIngredients();
      fetchMenuItems();
      const savedOutOfStock = localStorage.getItem("ran-lung-get-out-of-stock-items");
      if (savedOutOfStock) {
        try {
          setOutOfStockIds(JSON.parse(savedOutOfStock));
        } catch {}
      }
    } else if (view === "staff" || view === "approvals") {
      fetchUsers();
    }
  }, [view, checkingAuth]);

  // Realtime subscription for users table
  useEffect(() => {
    fetchUsers(); // Fetch initially so badge is accurate on load regardless of view

    const channel = supabase
      .channel("admin-users-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "users" }, () => {
        fetchUsers();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Handle Logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  };

  // Role modification handlers
  const updateUserRole = async (userId: string, newRole: "admin" | "staff" | "customer") => {
    // Optimistic UI update
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
    try {
      const { error } = await supabase.from("users").update({ role: newRole }).eq("id", userId);
      if (error) throw error;
    } catch (err) {
      console.warn("Supabase role update failed, keeping optimistic local edit:", err);
    }
  };

  const toggleUserActiveStatus = async (userId: string, currentStatus: boolean) => {
    const nextStatus = !currentStatus;
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, is_active: nextStatus } : u)));
    try {
      const { error } = await supabase
        .from("users")
        .update({ is_active: nextStatus })
        .eq("id", userId);
      if (error) throw error;
    } catch (err) {
      console.warn("Supabase active toggle failed:", err);
    }
  };

  const deleteUser = async (userId: string, displayName: string) => {
    if (!confirm(`คุณต้องการลบผู้ใช้งาน "${displayName}" ใช่หรือไม่?`)) return;
    const previousUsers = [...users];
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    try {
      const { error } = await supabase.from("users").delete().eq("id", userId);
      if (error) throw error;
    } catch (err: any) {
      console.error("Supabase user deletion failed, rolling back:", err);
      alert(
        `ไม่สามารถลบผู้ใช้ได้: ${err?.message || "กรุณาตรวจสอบว่าผู้ใช้นี้มีประวัติคำสั่งซื้ออยู่หรือไม่"}`,
      );
      setUsers(previousUsers);
    }
  };

  // Inventory logic copy from staff
  const toggleStock = (itemId: string) => {
    let updated: string[];
    if (outOfStockIds.includes(itemId)) {
      updated = outOfStockIds.filter((id) => id !== itemId);
    } else {
      updated = [...outOfStockIds, itemId];
    }
    setOutOfStockIds(updated);
    localStorage.setItem("ran-lung-get-out-of-stock-items", JSON.stringify(updated));
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: "ran-lung-get-out-of-stock-items",
        newValue: JSON.stringify(updated),
      }),
    );
  };

  const adjustIngredientQty = async (id: string, amount: number) => {
    const item = ingredients.find((i) => i.id === id);
    if (!item) return;
    const newQty = Math.max(0, Number(item.quantity) + amount);

    // Optimistic update for instant UI feedback
    setIngredients((prev) => prev.map((i) => (i.id === id ? { ...i, quantity: newQty } : i)));

    try {
      await updateIngredientStock(id, newQty);
    } catch {
      console.warn("Supabase stock update failed — reverting.");
      // Revert optimistic update on failure
      setIngredients((prev) =>
        prev.map((i) => (i.id === id ? { ...i, quantity: item.quantity } : i)),
      );
    }
  };

  const handleAddIngredientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = parseFloat(newIngQty);
    const t = parseFloat(newIngThreshold);
    if (!newIngName.trim() || isNaN(q) || isNaN(t)) {
      alert("กรุณากรอกข้อมูลให้ครบถ้วนและถูกต้อง");
      return;
    }

    setNewIngName("");
    setNewIngQty("");
    setNewIngThreshold("");
    setShowAddForm(false);

    try {
      await addIngredient(newIngName.trim(), q, newIngUnit, t);
      // Re-fetch from DB so the real row (with the real UUID) is shown
      await fetchIngredients();
    } catch (err) {
      console.error("เพิ่มวัตถุดิบไม่สำเร็จ:", err);
      alert("ไม่สามารถเพิ่มวัตถุดิบได้ กรุณาลองใหม่");
    }
  };

  const saveIngredientEdit = async (id: string) => {
    const q = parseFloat(editQty);
    const t = parseFloat(editThreshold);
    if (!editName.trim() || isNaN(q) || isNaN(t)) {
      alert("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    // Optimistic update
    setIngredients((prev) =>
      prev.map((i) =>
        i.id === id
          ? {
              ...i,
              name: editName.trim(),
              quantity: q,
              unit: editUnit,
              min_threshold: t,
            }
          : i,
      ),
    );
    setEditingId(null);

    try {
      await updateIngredientStock(id, q, editName.trim(), editUnit, t);
      // Re-fetch to confirm DB state
      await fetchIngredients();
    } catch (err) {
      console.error("Supabase edit update failed:", err);
      alert("บันทึกข้อมูลไม่สำเร็จ กรุณาลองใหม่");
      // Revert by re-fetching
      await fetchIngredients();
    }
  };

  const handleRemoveIngredient = async (id: string, name: string) => {
    if (!confirm(`คุณต้องการลบวัตถุดิบ "${name}" ใช่หรือไม่?`)) return;
    setIngredients((prev) => prev.filter((i) => i.id !== id));
    try {
      await deleteIngredient(id);
    } catch {
      console.warn("Supabase delete failed.");
    }
  };

  // Rendering Helpers
  const formatUnitAndQty = (qty: number, unit: string) => {
    if (unit === "g" && qty >= 1000) {
      return `${Number((qty / 1000).toFixed(2))} kg`;
    }
    return `${qty} ${unit}`;
  };

  const groupedIngredients = useMemo(() => {
    const meat = ingredients.filter(
      (i) => i.name.includes("หมู") || i.name.includes("ไก่") || i.name === "เนื้อ",
    );
    const seafood = ingredients.filter(
      (i) => i.name.includes("หมึก") || i.name.includes("กุ้ง") || i.name.includes("หอย"),
    );
    const toppings = ingredients.filter(
      (i) => i.name.includes("ไข่") || i.name.includes("ไส้กรอก") || i.name.includes("กุนเชียง"),
    );
    const others = ingredients.filter(
      (i) =>
        !meat.some((m) => m.id === i.id) &&
        !seafood.some((s) => s.id === i.id) &&
        !toppings.some((t) => t.id === i.id),
    );
    return { meat, seafood, toppings, others };
  }, [ingredients]);

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center font-sans">
        <div className="text-center space-y-3">
          <div className="h-10 w-10 border-4 border-[#002e47] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-bold text-gray-500">กำลังตรวจสอบสิทธิ์ผู้ดูแลระบบ...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fff8f2] text-gray-900 flex flex-col md:flex-row font-sans">
      {/* ── Mobile Sidebar Header ── */}
      <header className="md:hidden bg-[#002e47] text-white p-4 flex items-center justify-between shadow-md sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 active:scale-95 transition"
          >
            <Menu size={20} />
          </button>
          <span className="font-black text-sm tracking-wide">หลังบ้านผู้ดูแลระบบ (Admin)</span>
        </div>
        <button onClick={handleLogout} className="text-red-300 font-bold text-xs">
          ออก
        </button>
      </header>

      {/* ── Mobile Navigation Drawer ── */}
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
              transition={{ type: "tween", duration: 0.2 }}
              className="fixed top-0 left-0 bottom-0 w-64 bg-[#002e47] text-white z-50 flex flex-col p-5 shadow-2xl"
            >
              <AdminSidebarContent
                view={view}
                setView={setView}
                setSidebarOpen={setSidebarOpen}
                handleLogout={handleLogout}
                pendingCount={users.filter((u) => u.is_active === false).length}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── Desktop Left Sidebar ── */}
      <aside className="hidden md:flex flex-col w-72 h-screen shrink-0 bg-[#002e47] text-white border-r border-[#ece4d6] shadow-md z-20">
        <AdminSidebarContent
          view={view}
          setView={setView}
          handleLogout={handleLogout}
          pendingCount={users.filter((u) => u.is_active === false).length}
        />
      </aside>

      {/* ── Main content view area ── */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto min-w-0 bg-[#fff8f2]">
        {/* Desktop Header */}
        <header className="hidden md:block bg-white border-b border-[#ece4d6] p-5 sticky top-0 z-10 shadow-sm shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-[#002e47] text-white shadow-md">
                {view === "dashboard" ? (
                  <LayoutDashboard size={18} className="text-[#fcc14a]" />
                ) : view === "inventory" ? (
                  <ClipboardList size={18} className="text-[#fcc14a]" />
                ) : (
                  <Users size={18} className="text-[#fcc14a]" />
                )}
              </div>
              <div>
                <h1 className="text-lg font-black text-[#002e47] tracking-tight">
                  {view === "dashboard"
                    ? "รายงานยอดขาย & ประวัติ"
                    : view === "inventory"
                      ? "จัดการคลังสต็อก & เมนู"
                      : view === "approvals"
                        ? "คำขออนุมัติสิทธิ์"
                        : "จัดการระดับพนักงาน"}
                </h1>
                <p className="text-xs text-slate-500 font-semibold">
                  {view === "dashboard"
                    ? "วิเคราะห์ยอดขายสะสม ยอดสั่งซื้อ และรายรับทั้งหมดของร้าน"
                    : view === "inventory"
                      ? "เปิดปิดเมนูอาหาร ปรับปรุงจำนวนสต็อกวัตถุดิบหน้าร้าน"
                      : view === "approvals"
                        ? "อนุมัติหรือปฏิเสธคำขอสิทธิ์การใช้งานจากพนักงาน"
                        : "จัดการและเปลี่ยนบทบาทสิทธิ์ (Admin / Staff / Customer) ในระบบ"}
                </p>
              </div>
            </div>

            <a
              href="/customer"
              className="flex items-center gap-1.5 text-xs font-bold text-[#002e47] bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl px-3.5 py-2 transition"
            >
              <ArrowLeft size={14} />
              <span>สั่งอาหาร (หน้าร้าน)</span>
            </a>
          </div>
        </header>

        {/* Dynamic Inner Panel View */}
        <div className="p-4 sm:p-6 flex-1 max-w-6xl w-full mx-auto">
          {view === "dashboard" && <AdminDashboardView orders={orders} loading={loadingOrders} />}
          {view === "inventory" && (
            <AdminInventoryView
              ingredients={ingredients}
              loading={loadingIngredients}
              activeSubView={activeSubView}
              setActiveSubView={setActiveSubView}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              showAddForm={showAddForm}
              setShowAddForm={setShowAddForm}
              outOfStockIds={outOfStockIds}
              toggleStock={toggleStock}
              adjustIngredientQty={adjustIngredientQty}
              handleAddIngredientSubmit={handleAddIngredientSubmit}
              newIngName={newIngName}
              setNewIngName={setNewIngName}
              newIngQty={newIngQty}
              setNewIngQty={setNewIngQty}
              newIngUnit={newIngUnit}
              setNewIngUnit={setNewIngUnit}
              newIngThreshold={newIngThreshold}
              setNewIngThreshold={setNewIngThreshold}
              editingId={editingId}
              setEditingId={setEditingId}
              editName={editName}
              setEditName={setEditName}
              editQty={editQty}
              setEditQty={setEditQty}
              editUnit={editUnit}
              setEditUnit={setEditUnit}
              editThreshold={editThreshold}
              menuItems={menuItems}
              loadingMenuItems={loadingMenuItems}
              setEditThreshold={setEditThreshold}
              saveIngredientEdit={saveIngredientEdit}
              handleRemoveIngredient={handleRemoveIngredient}
              formatUnitAndQty={formatUnitAndQty}
              groupedIngredients={groupedIngredients}
              setIngredients={setIngredients}
            />
          )}
          {(view === "staff" || view === "approvals") && (
            <AdminStaffView
              users={users}
              loading={loadingUsers}
              updateUserRole={updateUserRole}
              toggleUserActiveStatus={toggleUserActiveStatus}
              deleteUser={deleteUser}
              isApprovalsTab={view === "approvals"}
            />
          )}
        </div>
      </main>
    </div>
  );
}

// ── Sidebar Content Component ──
function AdminSidebarContent({
  view,
  setView,
  setSidebarOpen,
  handleLogout,
  pendingCount = 0,
}: {
  view: string;
  setView: (v: any) => void;
  setSidebarOpen?: (b: boolean) => void;
  handleLogout: () => void;
  pendingCount?: number;
}) {
  const selectTab = (v: any) => {
    setView(v);
    if (setSidebarOpen) setSidebarOpen(false);
  };

  return (
    <div className="flex flex-col h-full bg-[#002e47] text-white">
      {/* Brand Header */}
      <div className="p-5 border-b border-white/10 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 text-[#fcc14a] border border-white/15">
            <Shield size={22} className="stroke-[2.5]" />
          </div>
          <div>
            <h2 className="font-black text-sm tracking-tight text-white uppercase">
              แผงผู้ดูแลระบบ
            </h2>
            <p className="text-[9px] font-bold text-[#fcc14a] tracking-wider uppercase">
              ADMIN PANEL
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest block px-2 mb-2">
          เมนูเจ้าของร้าน
        </span>

        <button
          onClick={() => selectTab("dashboard")}
          className={`w-full flex items-center gap-3 px-3 py-3.5 rounded-xl text-left transition duration-200 cursor-pointer ${
            view === "dashboard"
              ? "bg-white/10 text-white font-black border-l-4 border-[#fcc14a]"
              : "text-white/70 hover:text-white hover:bg-white/5 border-l-4 border-transparent"
          }`}
        >
          <LayoutDashboard
            size={18}
            className={view === "dashboard" ? "text-[#fcc14a]" : "text-white/60"}
          />
          <span className="text-sm">แดชบอร์ดรายได้</span>
        </button>

        <button
          onClick={() => selectTab("inventory")}
          className={`w-full flex items-center gap-3 px-3 py-3.5 rounded-xl text-left transition duration-200 cursor-pointer ${
            view === "inventory"
              ? "bg-white/10 text-white font-black border-l-4 border-[#fcc14a]"
              : "text-white/70 hover:text-white hover:bg-white/5 border-l-4 border-transparent"
          }`}
        >
          <ClipboardList
            size={18}
            className={view === "inventory" ? "text-[#fcc14a]" : "text-white/60"}
          />
          <span className="text-sm">จัดการคลัง & สต็อก</span>
        </button>

        <button
          onClick={() => selectTab("staff")}
          className={`w-full flex items-center gap-3 px-3 py-3.5 rounded-xl text-left transition duration-200 cursor-pointer ${
            view === "staff"
              ? "bg-white/10 text-white font-black border-l-4 border-[#fcc14a]"
              : "text-white/70 hover:text-white hover:bg-white/5 border-l-4 border-transparent"
          }`}
        >
          <Users size={18} className={view === "staff" ? "text-[#fcc14a]" : "text-white/60"} />
          <span className="text-sm">จัดการสิทธิ์พนักงาน</span>
        </button>

        <button
          onClick={() => selectTab("approvals")}
          className={`w-full flex items-center justify-between px-3 py-3.5 rounded-xl text-left transition duration-200 cursor-pointer ${
            view === "approvals"
              ? "bg-white/10 text-white font-black border-l-4 border-[#fcc14a]"
              : "text-white/70 hover:text-white hover:bg-white/5 border-l-4 border-transparent"
          }`}
        >
          <div className="flex items-center gap-3">
            <UserPlus
              size={18}
              className={view === "approvals" ? "text-[#fcc14a]" : "text-white/60"}
            />
            <span className="text-sm">คำขออนุมัติสิทธิ์</span>
          </div>
          {pendingCount > 0 && (
            <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
              {pendingCount}
            </span>
          )}
        </button>
      </div>

      {/* Logout footer */}
      <div className="p-4 border-t border-white/10 bg-white/2 shrink-0">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left text-red-300 hover:text-red-200 hover:bg-white/5 transition duration-200 cursor-pointer text-sm font-semibold"
        >
          <LogOut size={16} />
          <span>ออกจากระบบ</span>
        </button>
      </div>
    </div>
  );
}

// ── 1. Dashboard View Component ──
function AdminDashboardView({ orders, loading }: { orders: any[]; loading: boolean }) {
  const [timeRange, setTimeRange] = useState<"today" | "7days" | "30days" | "all">("all");

  const filteredOrders = useMemo(() => {
    const now = new Date();
    return orders.filter((o) => {
      if (!o.created_at) return true;
      const orderDate = new Date(o.created_at);
      const diffTime = now.getTime() - orderDate.getTime();
      const diffDays = diffTime / (1000 * 60 * 60 * 24);

      if (timeRange === "today") {
        return orderDate.toDateString() === now.toDateString();
      }
      if (timeRange === "7days") {
        return diffDays <= 7;
      }
      if (timeRange === "30days") {
        return diffDays <= 30;
      }
      return true;
    });
  }, [orders, timeRange]);

  const stats = useMemo(() => {
    const totalOrders = filteredOrders.length;
    const totalRev = filteredOrders.reduce((sum, o) => sum + o.total, 0);
    const avgBill = totalOrders > 0 ? Math.round(totalRev / totalOrders) : 0;
    const uniqueCustomers = new Set(filteredOrders.map((o) => o.customerName || o.id)).size;

    // Popular products counter
    const itemsCount: Record<string, number> = {};
    filteredOrders.forEach((o) => {
      o.items?.forEach((item: any) => {
        const cleanName = item.name.split(" (")[0];
        itemsCount[cleanName] = (itemsCount[cleanName] || 0) + item.qty;
      });
    });

    const sortedProducts = Object.entries(itemsCount)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    return { totalOrders, totalRev, avgBill, uniqueCustomers, sortedProducts };
  }, [filteredOrders]);

  const chartData = useMemo(() => {
    const dataMap: Record<string, number> = {};
    const now = new Date();

    if (timeRange === "today") {
      // Group by hour
      for (let i = 8; i <= 21; i++) {
        const hourStr = `${String(i).padStart(2, "0")}:00`;
        dataMap[hourStr] = 0;
      }
      filteredOrders.forEach((o) => {
        if (!o.created_at) return;
        const d = new Date(o.created_at);
        const hourStr = `${String(d.getHours()).padStart(2, "0")}:00`;
        if (dataMap[hourStr] !== undefined) {
          dataMap[hourStr] = (dataMap[hourStr] || 0) + o.total;
        }
      });
    } else if (timeRange === "7days") {
      // Last 7 days
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        const dateStr = d.toLocaleDateString("th-TH", { day: "numeric", month: "short" });
        dataMap[dateStr] = 0;
      }
      filteredOrders.forEach((o) => {
        if (!o.created_at) return;
        const d = new Date(o.created_at);
        const dateStr = d.toLocaleDateString("th-TH", { day: "numeric", month: "short" });
        if (dataMap[dateStr] !== undefined) {
          dataMap[dateStr] = (dataMap[dateStr] || 0) + o.total;
        }
      });
    } else if (timeRange === "30days") {
      // Last 30 days
      for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        const dateStr = d.toLocaleDateString("th-TH", { day: "numeric", month: "short" });
        dataMap[dateStr] = 0;
      }
      filteredOrders.forEach((o) => {
        if (!o.created_at) return;
        const d = new Date(o.created_at);
        const dateStr = d.toLocaleDateString("th-TH", { day: "numeric", month: "short" });
        if (dataMap[dateStr] !== undefined) {
          dataMap[dateStr] = (dataMap[dateStr] || 0) + o.total;
        }
      });
    } else {
      // All - sort dates ascending
      filteredOrders
        .slice()
        .reverse()
        .forEach((o) => {
          if (!o.created_at) return;
          const d = new Date(o.created_at);
          const dateStr = d.toLocaleDateString("th-TH", { day: "numeric", month: "short" });
          dataMap[dateStr] = (dataMap[dateStr] || 0) + o.total;
        });
    }

    return Object.entries(dataMap).map(([name, value]) => ({ name, value }));
  }, [filteredOrders, timeRange]);

  if (loading) {
    return (
      <div className="text-center py-20 font-bold text-gray-500">กำลังดาวน์โหลดข้อมูลการขาย...</div>
    );
  }

  const rangeOptions: { id: typeof timeRange; label: string }[] = [
    { id: "all", label: "ทั้งหมด" },
    { id: "today", label: "วันนี้" },
    { id: "7days", label: "7 วันล่าสุด" },
    { id: "30days", label: "30 วันล่าสุด (1 เดือน)" },
  ];

  return (
    <div className="space-y-6">
      {/* Time Range Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white border border-[#ece4d6] p-3.5 rounded-[22px] gap-3 shadow-sm">
        <span className="text-xs font-black text-[#002e47]">
          📅 เลือกช่วงเวลาสรุปข้อมูลแดชบอร์ด:
        </span>
        <div className="flex flex-wrap gap-1">
          {rangeOptions.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setTimeRange(opt.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                timeRange === opt.id
                  ? "bg-[#002e47] text-white shadow-sm"
                  : "bg-slate-50 text-[#5a6e7a] hover:text-[#002e47] hover:bg-slate-100"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* 5 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Orders Card */}
        <div className="bg-white border border-[#ece4d6] rounded-[28px] p-5 shadow-sm flex flex-col justify-between min-h-[120px] transition hover:shadow-md">
          <div className="flex items-start justify-between">
            <span className="text-3xl font-black text-[#002e47] tracking-tight">
              {stats.totalOrders}
            </span>
            <div className="p-2.5 rounded-2xl bg-orange-50 text-orange-500">
              <ClipboardList size={22} className="stroke-[2.5]" />
            </div>
          </div>
          <span className="text-[11px] font-black text-slate-400 mt-4">
            ยอดสั่งซื้อสะสม (ออเดอร์)
          </span>
        </div>

        {/* Total Revenue Card */}
        <div className="bg-white border border-[#ece4d6] rounded-[28px] p-5 shadow-sm flex flex-col justify-between min-h-[120px] transition hover:shadow-md">
          <div className="flex items-start justify-between">
            <span className="text-3xl font-black text-[#002e47] tracking-tight">
              ฿{new Intl.NumberFormat("th-TH").format(stats.totalRev)}
            </span>
            <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-500">
              <DollarSign size={22} className="stroke-[2.5]" />
            </div>
          </div>
          <span className="text-[11px] font-black text-slate-400 mt-4">
            รายได้สะสมทั้งหมด (บาท)
          </span>
        </div>

        {/* Total Guests Card */}
        <div className="bg-white border border-[#ece4d6] rounded-[28px] p-5 shadow-sm flex flex-col justify-between min-h-[120px] transition hover:shadow-md">
          <div className="flex items-start justify-between">
            <span className="text-3xl font-black text-[#002e47] tracking-tight">
              {stats.uniqueCustomers}
            </span>
            <div className="p-2.5 rounded-2xl bg-blue-50 text-blue-500">
              <Users size={22} className="stroke-[2.5]" />
            </div>
          </div>
          <span className="text-[11px] font-black text-slate-400 mt-4">ลูกค้าสะสมทั้งหมด (คน)</span>
        </div>

        {/* Top Dish Name Card */}
        <div className="bg-white border border-[#ece4d6] rounded-[28px] p-5 shadow-sm flex flex-col justify-between min-h-[120px] transition hover:shadow-md">
          <div className="flex items-start justify-between gap-2">
            <span className="text-sm font-black text-[#002e47] tracking-tight line-clamp-2 max-w-[80%] leading-tight pt-1">
              {stats.sortedProducts[0]?.name || "ไม่มีข้อมูล"}
            </span>
            <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-500 shrink-0">
              <TrendingUp size={22} className="stroke-[2.5]" />
            </div>
          </div>
          <span className="text-[11px] font-black text-slate-400 mt-4">เมนูยอดนิยมอันดับ 1</span>
        </div>

        {/* Avg Bill Card */}
        <div className="bg-white border border-[#ece4d6] rounded-[28px] p-5 shadow-sm flex flex-col justify-between min-h-[120px] transition hover:shadow-md">
          <div className="flex items-start justify-between">
            <span className="text-3xl font-black text-[#002e47] tracking-tight">
              ฿{stats.avgBill}
            </span>
            <div className="p-2.5 rounded-2xl bg-purple-50 text-purple-500">
              <Flame size={22} className="stroke-[2.5]" />
            </div>
          </div>
          <span className="text-[11px] font-black text-slate-400 mt-4">ยอดเฉลี่ยต่อบิล (บาท)</span>
        </div>
      </div>

      {/* Main Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Columns (Chart + Table) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Revenue Trend Line Chart */}
          <div className="bg-white border border-[#ece4d6] rounded-[28px] p-5 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-sm text-[#002e47] flex items-center gap-1.5">
                <TrendingUp size={16} className="text-emerald-500" />
                <span>กราฟแนวโน้มรายได้การขาย</span>
              </h3>
              <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-lg font-bold">
                รวมรายได้: ฿{new Intl.NumberFormat("th-TH").format(stats.totalRev)}
              </span>
            </div>
            <div className="w-full">
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#002e47" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#002e47" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1ebe4" />
                  <XAxis
                    dataKey="name"
                    stroke="#5a6e7a"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis stroke="#5a6e7a" fontSize={10} tickLine={false} axisLine={false} />
                  <ChartTooltip
                    contentStyle={{
                      background: "#fff",
                      border: "1px solid #ece4d6",
                      borderRadius: "16px",
                      fontSize: "11px",
                      fontFamily: "sans-serif",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                    }}
                    formatter={(value) => [
                      `฿${new Intl.NumberFormat("th-TH").format(Number(value))}`,
                      "ยอดขาย",
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#002e47"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorValue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 5 Recent Orders (Table styled like screenshot) */}
          <div className="bg-white border border-[#ece4d6] rounded-[28px] p-5 shadow-sm">
            <h3 className="font-black text-sm text-[#002e47] mb-4">🧾 5 ออเดอร์ล่าสุด</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-semibold">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-black uppercase text-[10px] tracking-wider">
                    <th className="py-2.5 pb-3">ออเดอร์</th>
                    <th className="py-2.5 pb-3">เวลา</th>
                    <th className="py-2.5 pb-3">ประเภท</th>
                    <th className="py-2.5 pb-3 text-right">ยอดรวม</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-400 italic">
                        ไม่มีข้อมูลออเดอร์ในช่วงเวลานี้
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.slice(0, 5).map((o) => {
                      const isDineIn = o.orderType === "dine-in";
                      const isTakeaway = o.orderType === "takeaway";

                      let badgeLabel = "เดลิเวอรี่";
                      let badgeColor = "bg-blue-50 text-blue-800 border-blue-100";
                      if (isDineIn) {
                        badgeLabel = o.tableNumber ? `โต๊ะ ${o.tableNumber}` : "ทานที่ร้าน";
                        badgeColor = "bg-amber-50 text-amber-800 border-amber-100";
                      } else if (isTakeaway) {
                        badgeLabel = "กลับบ้าน";
                        badgeColor = "bg-emerald-50 text-emerald-800 border-emerald-100";
                      }

                      return (
                        <tr key={o.id} className="hover:bg-slate-50/40 transition">
                          <td className="py-3.5 font-black text-[#002e47]">{o.orderNumber}</td>
                          <td className="py-3.5 text-slate-400">
                            {o.date.includes(" · ") ? o.date.split(" · ")[1] : o.date}
                          </td>
                          <td className="py-3.5">
                            <span
                              className={`px-2 py-0.5 rounded-lg text-[9px] font-black border ${badgeColor}`}
                            >
                              {badgeLabel}
                            </span>
                          </td>
                          <td className="py-3.5 text-right font-black text-[#002e47]">
                            ฿{o.total}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 5 Recent Customers list */}
          <div className="bg-white border border-[#ece4d6] rounded-[28px] p-5 shadow-sm">
            <h3 className="font-black text-sm text-[#002e47] mb-4">👥 5 รายชื่อลูกค้าล่าสุด</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-semibold">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-black uppercase text-[10px] tracking-wider">
                    <th className="py-2.5 pb-3">ชื่อลูกค้า</th>
                    <th className="py-2.5 pb-3">ช่องทาง/โต๊ะ</th>
                    <th className="py-2.5 pb-3 text-right">เวลาเข้าใช้งาน</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-8 text-center text-slate-400 italic">
                        ไม่มีรายชื่อลูกค้าใหม่
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.slice(0, 5).map((o, idx) => {
                      const isDineIn = o.orderType === "dine-in";
                      return (
                        <tr key={idx} className="hover:bg-slate-50/40 transition">
                          <td className="py-3.5 font-black text-[#002e47]">
                            {o.customerName || "คุณลูกค้า"}
                          </td>
                          <td className="py-3.5 text-slate-500 font-bold">
                            {isDineIn
                              ? `ทานที่ร้าน (โต๊ะ ${o.tableNumber || "-"})`
                              : o.orderType === "takeaway"
                                ? "กลับบ้าน (Takeaway)"
                                : "จัดส่ง (Delivery)"}
                          </td>
                          <td className="py-3.5 text-right text-slate-400">
                            {o.date.includes(" · ") ? o.date.split(" · ")[1] : o.date}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column (Top 5 Popular Dishes with progress bars) */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-[#ece4d6] rounded-[28px] p-5 shadow-sm flex flex-col h-full">
            <h3 className="font-black text-sm text-[#002e47] mb-4 flex items-center gap-1.5">
              <span>📊 5 อันดับเมนูขายดีที่สุด</span>
            </h3>

            <div className="space-y-6 flex-1">
              {stats.sortedProducts.length === 0 ? (
                <p className="text-xs text-gray-400 italic py-16 text-center">
                  ไม่มีข้อมูลยอดขายเมนู
                </p>
              ) : (
                stats.sortedProducts.slice(0, 5).map((p, idx) => {
                  const maxCount = stats.sortedProducts[0]?.count || 1;
                  const ratio = Math.max(8, Math.round((p.count / maxCount) * 100));

                  return (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-black text-[#002e47]">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-amber-400 text-white flex items-center justify-center font-black text-[10px]">
                            {idx + 1}
                          </span>
                          <span className="truncate max-w-[140px]">{p.name}</span>
                        </div>
                        <span className="text-[#002e47]">{p.count} จาน</span>
                      </div>

                      {/* Dark Blue Progress bar */}
                      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                        <div
                          className="bg-[#002e47] h-full rounded-full transition-all duration-500"
                          style={{ width: `${ratio}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── 2. Inventory Management View Component ──
function AdminInventoryView({
  ingredients,
  loading,
  menuItems,
  loadingMenuItems,
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
}: any) {
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
                className="bg-slate-100 hover:bg-slate-200 text-[#002e47] border px-1.5 py-0.5 rounded text-[10px] font-black"
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
                className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-[#002e47]"
              >
                <Edit2 size={12} />
              </button>
              <button
                onClick={() => handleRemoveIngredient(item.id, item.name)}
                className="p-1 hover:bg-red-50 rounded text-slate-400 hover:text-red-600"
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
                  className="bg-[#002e47] text-white px-5 py-2.5 rounded-2xl font-bold text-xs"
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

// ── 3. Staff Role Management View Component ──
function AdminStaffView({
  users,
  loading,
  updateUserRole,
  toggleUserActiveStatus,
  deleteUser,
  isApprovalsTab = false,
}: {
  users: any[];
  loading: boolean;
  updateUserRole: (id: string, role: any) => void;
  toggleUserActiveStatus: (id: string, current: boolean) => void;
  deleteUser: (id: string, name: string) => void;
  isApprovalsTab?: boolean;
}) {
  const [search, setSearch] = useState("");

  if (loading) {
    return (
      <div className="text-center py-20 font-bold text-gray-500">
        กำลังดาวน์โหลดรายชื่อผู้ใช้งาน...
      </div>
    );
  }

  const filteredUsers = users.filter((u) => {
    const isTargetStatus = isApprovalsTab ? u.is_active === false : u.is_active !== false;
    if (!isTargetStatus) return false;

    const q = search.toLowerCase();
    return (
      (u.display_name && u.display_name.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.role && u.role.toLowerCase().includes(q))
    );
  });

  return (
    <div className="bg-white border border-[#ece4d6] rounded-3xl p-5 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-3">
        <h2 className="text-sm font-black text-[#002e47]">
          {isApprovalsTab
            ? "⏳ คำขออนุมัติสิทธิ์ (รอตรวจสอบ)"
            : "👥 รายชื่อผู้ใช้ระบบและสิทธิ์การเข้าถึง"}
        </h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="ค้นหาชื่อ, อีเมล, สิทธิ์..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all w-full sm:w-64"
          />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs sm:text-sm">
          <thead>
            <tr className="border-b border-[#ece4d6] text-[#5a6e7a] font-bold">
              <th className="py-3 px-4">ชื่อผู้ใช้ / อีเมล</th>
              <th className="py-3 px-4">ระดับสิทธิ์ (Role)</th>
              <th className="py-3 px-4">สถานะบัญชี</th>
              <th className="py-3 px-4 text-right">ปรับบทบาทสิทธิ์พนักงาน</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-slate-400 italic">
                  ไม่พบข้อมูลรายชื่อในระบบ
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => {
                const isActive = user.is_active !== false;
                return (
                  <tr key={user.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-slate-100 border overflow-hidden shrink-0 flex items-center justify-center font-bold text-[#002e47] text-xs">
                        {user.picture_url ? (
                          <img
                            src={user.picture_url}
                            alt={user.display_name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          user.display_name.substring(0, 2).toUpperCase()
                        )}
                      </div>
                      <div>
                        <p className="font-extrabold text-[#002e47]">{user.display_name}</p>
                        <p className="text-[10px] text-slate-400">
                          {user.email || "ล็อคอินผ่าน LINE/Guest"}
                        </p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full border ${
                          user.role === "admin"
                            ? "bg-purple-100 text-purple-800 border-purple-200"
                            : user.role === "staff"
                              ? "bg-blue-100 text-blue-800 border-blue-200"
                              : "bg-slate-100 text-slate-600 border-slate-200"
                        }`}
                      >
                        {user.role === "admin" ? (
                          <ShieldCheck size={11} />
                        ) : user.role === "staff" ? (
                          <Shield size={11} />
                        ) : null}
                        {user.role.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {user.role === "captain" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-xl text-[10px] font-bold border bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed">
                          <UserCheck size={11} /> ใช้งานได้ (Locked)
                        </span>
                      ) : (
                        <button
                          onClick={() => toggleUserActiveStatus(user.id, isActive)}
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-xl text-[10px] font-bold border transition cursor-pointer active:scale-95 ${
                            isActive
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-red-50 text-red-700 border-red-200"
                          }`}
                        >
                          {isActive ? <UserCheck size={11} /> : <UserX size={11} />}
                          {isActive
                            ? "ใช้งานได้"
                            : isApprovalsTab
                              ? "รออนุมัติ / ระงับชั่วคราว"
                              : "ระงับชั่วคราว"}
                        </button>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right space-x-1.5">
                      {user.role !== "captain" ? (
                        <div className="inline-flex gap-1.5 justify-end items-center">
                          <button
                            onClick={() => updateUserRole(user.id, "admin")}
                            className={`px-2 py-1 rounded text-[10px] font-bold border transition cursor-pointer ${
                              user.role === "admin"
                                ? "bg-purple-600 text-white border-purple-600"
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            }`}
                          >
                            Admin
                          </button>
                          <button
                            onClick={() => updateUserRole(user.id, "staff")}
                            className={`px-2 py-1 rounded text-[10px] font-bold border transition cursor-pointer ${
                              user.role === "staff"
                                ? "bg-blue-600 text-white border-blue-600"
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            }`}
                          >
                            Staff
                          </button>
                          <button
                            onClick={() => updateUserRole(user.id, "customer")}
                            className={`px-2 py-1 rounded text-[10px] font-bold border transition cursor-pointer ${
                              user.role === "customer"
                                ? "bg-slate-700 text-white border-slate-700"
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            }`}
                          >
                            Customer
                          </button>
                          <button
                            onClick={() => deleteUser(user.id, user.display_name)}
                            className="px-2.5 py-1 rounded text-[10px] font-bold border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 hover:border-red-300 transition cursor-pointer active:scale-95 flex items-center gap-1 shrink-0 ml-1"
                            title="ลบผู้ใช้งาน"
                          >
                            <Trash2 size={11} />
                            <span>ลบ</span>
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] font-bold italic text-rose-700">
                          เจ้าของระบบสูงสุด
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
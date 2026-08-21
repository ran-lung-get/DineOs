import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { MENU, type MenuItem } from "../customer/index";
import {
  ChefHat,
  Menu,
} from "lucide-react";

import { AdminSidebar, type AdminTab } from "../../components/admin/admin-sidebar";
import { AdminDashboardView } from "../../components/admin/admin-dashboard-view";
import { AdminInventoryView } from "../../components/admin/admin-inventory-view";
import { AdminStaffView } from "../../components/admin/admin-staff-view";
import {
  getMongoOrders,
  getMongoIngredients,
  getMongoMenuItems,
  saveMongoIngredient,
  deleteMongoIngredient,
  updateMongoIngredientStock,
} from "../../lib/api/mongo.functions";
import {
  getMongoStaffUsers,
  updateMongoUserStatus,
  updateMongoUserRole,
  deleteMongoUser,
} from "../../lib/api/auth.functions";
import { getStoredUser, clearStoredUser } from "../../lib/auth";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const navigate = useNavigate();
  const [view, setView] = useState<AdminTab>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Auth check state
  const [checkingAuth, setCheckingAuth] = useState(true);

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
    const user = getStoredUser();
    if (!user) {
      navigate({ to: "/login" });
      return;
    }
    if (user.role !== "admin") {
      navigate({ to: "/customer" });
      return;
    }
    setCheckingAuth(false);
  }, [navigate]);

  // 2. Fetch Orders from MongoDB
  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const res = await getMongoOrders();
      if (res.success && res.data && res.data.length > 0) {
        setOrders(res.data);
      } else {
        const local = localStorage.getItem("ran-lung-get-orders");
        if (local) {
          try {
            setOrders(JSON.parse(local));
          } catch {}
        }
      }
    } catch (err) {
      console.error("Error fetching orders:", err);
    } finally {
      setLoadingOrders(false);
    }
  };

  // 3. Fetch Ingredients from MongoDB
  const fetchIngredientsData = async () => {
    setLoadingIngredients(true);
    try {
      const res = await getMongoIngredients();
      if (res.success && res.data && res.data.length > 0) {
        setIngredients(res.data);
      } else {
        const local = localStorage.getItem("ran-lung-get-mock-ingredients");
        if (local) {
          try {
            setIngredients(JSON.parse(local));
          } catch {}
        }
      }
    } catch (err) {
      console.error("Error fetching ingredients:", err);
    } finally {
      setLoadingIngredients(false);
    }
  };

  // 4. Fetch Menu Items from MongoDB
  const fetchMenuItemsData = async () => {
    setLoadingMenuItems(true);
    try {
      const res = await getMongoMenuItems();
      if (res.success && res.data && res.data.length > 0) {
        setMenuItems(res.data as any);
      } else {
        setMenuItems(MENU);
      }
    } catch (err) {
      console.error("Error loading menu:", err);
      setMenuItems(MENU);
    } finally {
      setLoadingMenuItems(false);
    }
  };

  // 5. Fetch Staff Users from MongoDB
  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await getMongoStaffUsers();
      if (res.success && res.data) {
        setUsers(res.data);
      }
    } catch (err) {
      console.error("Error fetching staff users:", err);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (!checkingAuth) {
      fetchOrders();
      fetchIngredientsData();
      fetchMenuItemsData();
      fetchUsers();
    }
  }, [checkingAuth]);

  // Handle Logout
  const handleLogout = () => {
    clearStoredUser();
    navigate({ to: "/login" });
  };

  // Staff management actions
  const handleUpdateRole = async (userId: string, newRole: string) => {
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
    try {
      await updateMongoUserRole({ data: { userId, role: newRole as any } });
    } catch (err) {
      console.error("Error updating user role:", err);
    }
  };

  const handleToggleActive = async (userId: string, currentActive: boolean) => {
    const nextVal = !currentActive;
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, is_active: nextVal } : u)));
    try {
      await updateMongoUserStatus({ data: { userId, isActive: nextVal } });
    } catch (err) {
      console.error("Error updating user status:", err);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("คุณแน่ใจหรือไม่ว่าต้องการลบผู้ใช้นี้ออกจากระบบ?")) return;
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    try {
      await deleteMongoUser({ data: { userId } });
    } catch (err) {
      console.error("Error deleting user:", err);
    }
  };

  // Ingredients management handlers
  const handleAddIngredientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIngName || !newIngQty) {
      alert("กรุณากรอกชื่อและจำนวนวัตถุดิบ");
      return;
    }
    const newDoc = {
      id: "ing_" + Date.now(),
      name: newIngName.trim(),
      quantity: Number(newIngQty) || 0,
      unit: newIngUnit,
      min_threshold: Number(newIngThreshold) || 10,
      is_active: true,
      cost_per_unit: 0.2,
      status: "in_stock",
    };
    setIngredients((prev) => [...prev, newDoc]);
    try {
      await saveMongoIngredient({ data: newDoc });
    } catch {}
    setNewIngName("");
    setNewIngQty("");
    setNewIngThreshold("");
    setShowAddForm(false);
  };

  const handleSaveEdit = async (id: string) => {
    const target = ingredients.find((i) => i.id === id);
    if (!target) return;
    const updated = {
      ...target,
      name: editName.trim(),
      quantity: Number(editQty) || 0,
      unit: editUnit,
      min_threshold: Number(editThreshold) || 10,
    };
    setIngredients((prev) => prev.map((i) => (i.id === id ? updated : i)));
    try {
      await saveMongoIngredient({
        data: {
          id: updated.id,
          name: updated.name,
          quantity: updated.quantity,
          unit: updated.unit,
          min_threshold: updated.min_threshold,
          cost_per_unit: updated.cost_per_unit || 0.2,
          is_active: updated.is_active ?? true,
          status: updated.status || "in_stock",
        },
      });
    } catch {}
    setEditingId(null);
  };

  const handleDeleteIngredient = async (id: string, name: string) => {
    if (!confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบ ${name}?`)) return;
    setIngredients((prev) => prev.filter((i) => i.id !== id));
    try {
      await deleteMongoIngredient({ data: { ingredientId: id } });
    } catch {}
  };

  const handleQuickAddStock = async (id: string, delta: number) => {
    setIngredients((prev) =>
      prev.map((i) => (i.id === id ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i)),
    );
    try {
      await updateMongoIngredientStock({ data: { ingredientId: id, deltaQuantity: delta } });
    } catch {}
  };

  // Menu item stock toggle
  const toggleMenuItemStock = (itemId: string) => {
    setOutOfStockIds((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId],
    );
  };

  const formatUnitAndQty = (qty: number, unit: string) => {
    if (unit === "g" && qty >= 1000) {
      return `${(qty / 1000).toFixed(1)} กก.`;
    }
    return `${qty.toLocaleString()} ${unit}`;
  };

  const groupedIngredients = useMemo(() => {
    const meat = ingredients.filter(
      (i) => i.name.includes("หมู") || i.name.includes("ไก่") || i.name.includes("เนื้อ"),
    );
    const seafood = ingredients.filter(
      (i) => i.name.includes("กุ้ง") || i.name.includes("หมึก") || i.name.includes("หอย"),
    );
    const toppings = ingredients.filter(
      (i) => i.name.includes("ไข่") || i.name.includes("ไส้กรอก") || i.name.includes("กุนเชียง"),
    );
    const others = ingredients.filter(
      (i) =>
        !meat.includes(i) && !seafood.includes(i) && !toppings.includes(i),
    );
    return { meat, seafood, toppings, others };
  }, [ingredients]);

  if (checkingAuth) {
    return (
      <div className="h-screen w-full bg-[#fff8f2] flex items-center justify-center" style={{ backgroundColor: "rgb(255, 248, 242)" }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-[#002e47] border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-600 text-sm font-semibold">กำลังตรวจสอบสิทธิ์ Admin...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-[#fff8f2] text-slate-800 font-sans overflow-hidden" style={{ backgroundColor: "rgb(255, 248, 242)" }}>
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 lg:static lg:block ${sidebarOpen ? "block" : "hidden"}`}>
        <AdminSidebar
          view={view}
          setView={setView}
          setSidebarOpen={setSidebarOpen}
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
                  แผงควบคุมระบบ Dineos
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#fcc14a]/20 text-[#fcc14a] font-medium border border-[#fcc14a]/30">
                    MongoDB Master
                  </span>
                </h1>
                <p className="text-[11px] text-white/60">
                  {view === "dashboard"
                    ? "แดชบอร์ดภาพรวมและสรุปยอดขาย"
                    : view === "inventory"
                      ? "จัดการสต็อกวัตถุดิบและสถานะเมนู"
                      : "จัดการรายชื่อและอนุมัติสิทธิ์พนักงาน"}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic View Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 no-scrollbar bg-[#fff8f2]" style={{ backgroundColor: "rgb(255, 248, 242)" }}>
          {view === "dashboard" && (
            <AdminDashboardView
              orders={orders}
              loading={loadingOrders}
            />
          )}

          {view === "inventory" && (
            <AdminInventoryView
              ingredients={ingredients}
              loading={loadingIngredients}
              menuItems={menuItems}
              loadingMenuItems={loadingMenuItems}
              activeSubView={activeSubView}
              setActiveSubView={setActiveSubView}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              showAddForm={showAddForm}
              setShowAddForm={setShowAddForm}
              outOfStockIds={outOfStockIds}
              toggleStock={toggleMenuItemStock}
              adjustIngredientQty={handleQuickAddStock}
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
              setEditThreshold={setEditThreshold}
              saveIngredientEdit={handleSaveEdit}
              handleRemoveIngredient={handleDeleteIngredient}
              formatUnitAndQty={formatUnitAndQty}
              groupedIngredients={groupedIngredients}
              setIngredients={setIngredients}
            />
          )}

          {(view === "staff" || view === "approvals") && (
            <AdminStaffView
              users={users}
              loading={loadingUsers}
              updateUserRole={handleUpdateRole}
              toggleUserActiveStatus={handleToggleActive}
              deleteUser={handleDeleteUser}
              isApprovalsTab={view === "approvals"}
            />
          )}
        </div>
      </div>
    </div>
  );
}
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { supabase } from "../../lib/supabase";
import { 
  Users, LogOut, ArrowLeft, Trash2, Shield, Search, CheckCircle, ShieldAlert, UserPlus,
  LayoutDashboard, TrendingUp, DollarSign, BarChart3, Clock, Utensils
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import type { UserRow } from "../../lib/supabase.types";

export const Route = createFileRoute("/captain/")({
  component: CaptainDashboard,
});

const BRAND = "#002e47";
const GOLD = "#fcc14a";
const INK_MUTED = "#5a6e7a";
const LINEN = "#fff8f2";
const SURFACE = "#f8fafc";

function CaptainDashboard() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("dashboard"); // Dashboard is default

  // Dashboard states
  const [dateRange, setDateRange] = useState("today"); // "today", "week", "month"
  const [dashboardData, setDashboardData] = useState<{
    totalSales: number;
    totalOrders: number;
    avgOrderValue: number;
    bestSellers: { name: string; quantity: number }[];
    peakHours: { hour: string; orders: number }[];
  } | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);

  // Fetch Dashboard Data
  useEffect(() => {
    async function fetchDashboard() {
      if (activeTab !== "dashboard") return;
      setDashboardLoading(true);
      try {
        let startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
        
        if (dateRange === "week") {
          startDate.setDate(startDate.getDate() - 7);
        } else if (dateRange === "month") {
          startDate.setDate(startDate.getDate() - 30);
        }

        // Fetch completed orders
        const { data: ordersData, error: ordersError } = await supabase
          .from("orders")
          .select("id, total, created_at")
          .eq("status", "completed")
          .gte("created_at", startDate.toISOString());

        if (ordersError) throw ordersError;

        const safeOrders = ordersData || [];
        const totalSales = safeOrders.reduce((sum: number, o: { id: string; total: number; created_at: string }) => sum + (o.total || 0), 0);
        const totalOrders = safeOrders.length;
        const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

        const orderIds = safeOrders.map((o: { id: string; total: number; created_at: string }) => o.id);
        
        let bestSellers: { name: string; quantity: number }[] = [];
        if (orderIds.length > 0) {
          // Fetch order items (if many, we fetch all in the timeframe and filter)
          const { data: itemsData, error: itemsError } = await supabase
            .from("order_items")
            .select("name, quantity, order_id, created_at")
            .gte("created_at", startDate.toISOString());
            
          if (!itemsError && itemsData) {
            type ItemData = { name: string; quantity: number; order_id: string; created_at: string };
            const validItems = itemsData.filter((item: ItemData) => orderIds.includes(item.order_id));
            const itemCounts: Record<string, number> = {};
            validItems.forEach((item: ItemData) => {
              itemCounts[item.name] = (itemCounts[item.name] || 0) + item.quantity;
            });
            bestSellers = Object.entries(itemCounts)
              .map(([name, quantity]) => ({ name, quantity }))
              .sort((a, b) => b.quantity - a.quantity)
              .slice(0, 5); // top 5
          }
        }

        // Calculate peak hours
        const hourCounts: Record<string, number> = {};
        for (let i = 8; i <= 22; i++) {
          hourCounts[`${i}:00`] = 0;
        }

        safeOrders.forEach((o: { id: string; total: number; created_at: string }) => {
          const d = new Date(o.created_at);
          const h = d.getHours();
          const key = `${h}:00`;
          if (hourCounts[key] !== undefined) {
             hourCounts[key]++;
          } else {
             hourCounts[key] = 1;
          }
        });

        const peakHours = Object.entries(hourCounts)
          .map(([hour, orders]) => ({ hour, orders }))
          .sort((a, b) => parseInt(a.hour) - parseInt(b.hour));

        setDashboardData({
          totalSales,
          totalOrders,
          avgOrderValue,
          bestSellers,
          peakHours
        });
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
      } finally {
        setDashboardLoading(false);
      }
    }

    fetchDashboard();
  }, [dateRange, activeTab]);

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

        if (error || !data || data.role !== "captain") {
          window.location.href = "/customer";
          return;
        }

        if (data.is_active === false) {
          alert("บัญชี Captain ของคุณอยู่ระหว่างรอการอนุมัติสิทธิ์ (Pending Approval)");
          await supabase.auth.signOut();
          window.location.href = "/login";
          return;
        }

        fetchUsers();
      } catch (err) {
        window.location.href = "/login";
      }
    }
    checkAuth();
    
    // Subscribe to realtime updates for users table
    const channel = supabase
      .channel('captain-users-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'users' },
        () => {
          fetchUsers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchUsers() {
    setLoading(true);
    const { data, error } = await supabase.from("users").select("*").order("created_at", { ascending: false });
    if (error) {
      console.error("Error fetching users:", error);
    } else {
      setUsers(data as UserRow[]);
    }
    setLoading(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  }

  async function handleDeleteUser(userId: string, authUserId: string) {
    if (!confirm("คุณแน่ใจหรือไม่ว่าต้องการลบผู้ใช้งานนี้? การกระทำนี้ไม่สามารถกู้คืนได้")) return;
    
    try {
      const { error } = await supabase.rpc("delete_user_by_captain", { target_user_id: authUserId });
      if (error) throw error;
      alert("ลบผู้ใช้งานสำเร็จ");
      fetchUsers();
    } catch (err: any) {
      alert("เกิดข้อผิดพลาดในการลบ: " + err.message);
    }
  }

  const toggleUserActiveStatus = async (userId: string, currentStatus: boolean) => {
    const nextStatus = !currentStatus;
    // Optimistic Update
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_active: nextStatus } : u));
    
    try {
      const { error } = await supabase
        .from("users")
        .update({ is_active: nextStatus })
        .eq("id", userId);
      if (error) throw error;
    } catch (err: any) {
      alert("เกิดข้อผิดพลาดในการเปลี่ยนสถานะ: " + err.message);
      fetchUsers();
    }
  }

  async function handleChangeRole(authUserId: string, newRole: string) {
    // Optimistic UI update
    setUsers(prev => prev.map(u => u.auth_user_id === authUserId ? { ...u, role: newRole as UserRow["role"] } : u));

    try {
      const { error } = await supabase.rpc("update_user_role_by_captain", { 
        target_user_id: authUserId, 
        new_role: newRole 
      });
      if (error) throw error;
    } catch (err: any) {
      alert("เกิดข้อผิดพลาดในการเปลี่ยน Role: " + err.message);
      fetchUsers(); // Revert local state on error
    }
  }

  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      (u.display_name && u.display_name.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q))
    );
  });

  return (
    <div className="min-h-screen w-full flex bg-[#f1f5f9] text-[#0f1f2b] font-prompt">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0 shadow-sm z-20">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl grid place-items-center shadow-inner"
              style={{ background: `linear-gradient(135deg, ${BRAND}, #001a2c)` }}
            >
              <ShieldAlert className="text-[#fcc14a]" size={20} />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight" style={{ color: BRAND }}>
                Captain
              </h1>
              <p className="text-[10px] uppercase font-bold tracking-widest text-[#5a6e7a]">
                Supreme Panel
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${
              activeTab === "dashboard"
                ? "bg-[#002e47] text-white shadow-md shadow-blue-900/10"
                : "text-[#5a6e7a] hover:bg-slate-50 hover:text-[#002e47]"
            }`}
          >
            <LayoutDashboard size={18} />
            ภาพรวมยอดขาย
          </button>
          
          <button
            onClick={() => setActiveTab("users")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${
              activeTab === "users"
                ? "bg-[#002e47] text-white shadow-md shadow-blue-900/10"
                : "text-[#5a6e7a] hover:bg-slate-50 hover:text-[#002e47]"
            }`}
          >
            <Users size={18} />
            จัดการผู้ใช้งาน
          </button>
          
          <button
            onClick={() => setActiveTab("approvals")}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${
              activeTab === "approvals"
                ? "bg-[#002e47] text-white shadow-md shadow-blue-900/10"
                : "text-[#5a6e7a] hover:bg-slate-50 hover:text-[#002e47]"
            }`}
          >
            <div className="flex items-center gap-3">
              <UserPlus size={18} />
              คำขออนุมัติสิทธิ์
            </div>
            {users.filter(u => u.is_active === false && (u.role === 'staff' || u.role === 'admin' || u.role === 'captain')).length > 0 && (
              <span className="bg-rose-500 text-white text-[10px] px-2 py-0.5 rounded-full">
                {users.filter(u => u.is_active === false && (u.role === 'staff' || u.role === 'admin' || u.role === 'captain')).length}
              </span>
            )}
          </button>
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-sm font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors"
          >
            <LogOut size={16} />
            ออกจากระบบ
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0 sticky top-0 z-10">
          <h2 className="text-xl font-bold" style={{ color: BRAND }}>
            {activeTab === "dashboard" ? "ภาพรวมยอดขาย (Dashboard)" : "ระบบจัดการผู้ใช้งาน"}
          </h2>
          {activeTab !== "dashboard" && (
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="ค้นหาชื่อ, อีเมล..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#002e47]/20 transition-all"
              />
            </div>
          )}
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-5xl mx-auto">
            {activeTab === "dashboard" ? (
              <div className="space-y-6">
                {/* Dashboard Time Range Selector */}
                <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200 w-fit">
                  <button onClick={() => setDateRange("today")} className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${dateRange === "today" ? "bg-[#002e47] text-white" : "text-slate-500 hover:bg-slate-100"}`}>วันนี้</button>
                  <button onClick={() => setDateRange("week")} className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${dateRange === "week" ? "bg-[#002e47] text-white" : "text-slate-500 hover:bg-slate-100"}`}>7 วันล่าสุด</button>
                  <button onClick={() => setDateRange("month")} className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${dateRange === "month" ? "bg-[#002e47] text-white" : "text-slate-500 hover:bg-slate-100"}`}>30 วันล่าสุด</button>
                </div>

                {dashboardLoading ? (
                  <div className="py-20 text-center text-slate-400">กำลังโหลดข้อมูล...</div>
                ) : dashboardData ? (
                  <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                          <DollarSign size={24} />
                        </div>
                        <div>
                          <p className="text-sm text-slate-500 font-medium">ยอดขายรวม</p>
                          <p className="text-2xl font-bold" style={{ color: BRAND }}>฿{dashboardData.totalSales.toLocaleString()}</p>
                        </div>
                      </div>
                      
                      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center text-green-600">
                          <CheckCircle size={24} />
                        </div>
                        <div>
                          <p className="text-sm text-slate-500 font-medium">จำนวนออเดอร์สำเร็จ</p>
                          <p className="text-2xl font-bold" style={{ color: BRAND }}>{dashboardData.totalOrders.toLocaleString()}</p>
                        </div>
                      </div>
                      
                      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                          <TrendingUp size={24} />
                        </div>
                        <div>
                          <p className="text-sm text-slate-500 font-medium">ยอดเฉลี่ยต่อออเดอร์</p>
                          <p className="text-2xl font-bold" style={{ color: BRAND }}>฿{dashboardData.avgOrderValue.toFixed(2)}</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Peak Hours Chart */}
                      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm lg:col-span-2">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: BRAND }}>
                          <Clock size={18} className="text-blue-500" />
                          ช่วงเวลาออเดอร์ (Peak Hours)
                        </h3>
                        <div className="h-64 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={dashboardData.peakHours} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                              <defs>
                                <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#002e47" stopOpacity={0.3}/>
                                  <stop offset="95%" stopColor="#002e47" stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                              <RechartsTooltip 
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
                              />
                              <Area type="monotone" dataKey="orders" stroke="#002e47" strokeWidth={3} fillOpacity={1} fill="url(#colorOrders)" />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* Best Sellers */}
                      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: BRAND }}>
                          <Utensils size={18} className="text-orange-500" />
                          เมนูยอดฮิต
                        </h3>
                        <div className="space-y-4">
                          {dashboardData.bestSellers.length === 0 ? (
                            <p className="text-sm text-slate-400 text-center py-8">ไม่มีข้อมูล</p>
                          ) : (
                            dashboardData.bestSellers.map((item, idx) => (
                              <div key={idx} className="flex items-center justify-between">
                                <div className="flex items-center gap-3 overflow-hidden">
                                  <div className="w-8 h-8 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center font-bold text-sm shrink-0">
                                    {idx + 1}
                                  </div>
                                  <p className="text-sm font-medium text-slate-700 truncate">{item.name}</p>
                                </div>
                                <div className="text-sm font-bold bg-slate-50 px-2 py-1 rounded text-slate-600 shrink-0">
                                  {item.quantity} จาน
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                ) : null}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-500 font-medium">
                <tr>
                  <th className="px-6 py-4">ผู้ใช้งาน</th>
                  <th className="px-6 py-4">อีเมล</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">สถานะ</th>
                  <th className="px-6 py-4 text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                        กำลังโหลดข้อมูล...
                      </td>
                    </tr>
                  ) : filteredUsers.filter(u => {
                      if (activeTab === "approvals") return u.is_active === false;
                      return u.is_active !== false;
                    }).length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                        {activeTab === "approvals" ? "ไม่มีคำขออนุมัติที่รอดำเนินการ" : "ไม่พบผู้ใช้งาน"}
                      </td>
                    </tr>
                  ) : (
                    filteredUsers
                      .filter(u => {
                        if (activeTab === "approvals") return u.is_active === false;
                        return u.is_active !== false;
                      })
                      .map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-800">{u.display_name}</div>
                        </td>
                        <td className="px-6 py-4 text-slate-500">{u.email || "-"}</td>
                        <td className="px-6 py-4">
                          <select
                            value={u.role || "customer"}
                            onChange={(e) => handleChangeRole(u.auth_user_id!, e.target.value)}
                            className={`px-3 py-1 rounded-lg text-xs font-semibold outline-none border cursor-pointer ${
                              u.role === "captain"
                                ? "bg-purple-100 text-purple-700 border-purple-200"
                                : u.role === "admin"
                                ? "bg-blue-100 text-blue-700 border-blue-200"
                                : u.role === "staff"
                                ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                                : "bg-slate-100 text-slate-700 border-slate-200"
                            }`}
                          >
                            <option value="captain">Captain</option>
                            <option value="admin">Admin</option>
                            <option value="staff">Staff</option>
                            <option value="customer">Customer</option>
                          </select>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => toggleUserActiveStatus(u.id, u.is_active !== false)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                              u.is_active !== false
                                ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                                : "bg-rose-50 text-rose-600 hover:bg-rose-100"
                            }`}
                          >
                            {u.is_active !== false ? (
                              <>
                                <CheckCircle size={14} /> ใช้งาน
                              </>
                            ) : (
                              "รออนุมัติ / ถูกระงับ"
                            )}
                          </button>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {u.role !== 'captain' && (
                            <button
                              onClick={() => handleDeleteUser(u.id, u.auth_user_id!)}
                              className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                              title="ลบผู้ใช้"
                            >
                              <Trash2 size={18} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

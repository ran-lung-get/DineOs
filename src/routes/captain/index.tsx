import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { supabase } from "../../lib/supabase";
import { 
  Users, LogOut, ArrowLeft, Trash2, Shield, Search, CheckCircle, ShieldAlert
} from "lucide-react";
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
  const [activeTab, setActiveTab] = useState("users");

  useEffect(() => {
    fetchUsers();
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

  async function handleChangeRole(authUserId: string, newRole: string) {
    if (!confirm(`ยืนยันการเปลี่ยน Role เป็น ${newRole}?`)) return;

    try {
      const { error } = await supabase.rpc("update_user_role_by_captain", { 
        target_user_id: authUserId, 
        new_role: newRole 
      });
      if (error) throw error;
      alert("เปลี่ยน Role สำเร็จ");
      fetchUsers();
    } catch (err: any) {
      alert("เกิดข้อผิดพลาดในการเปลี่ยน Role: " + err.message);
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
            ระบบจัดการผู้ใช้งาน
          </h2>
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
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-5xl mx-auto">
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
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
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                        ไม่พบผู้ใช้งาน
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => (
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
                          {u.is_active ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 text-xs font-semibold">
                              <CheckCircle size={14} /> ใช้งาน
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 text-rose-600 text-xs font-semibold">
                              ถูกระงับ
                            </span>
                          )}
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
          </div>
        </div>
      </main>
    </div>
  );
}

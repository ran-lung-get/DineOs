import { useState } from "react";
import {
  Search,
  Shield,
  ShieldCheck,
  UserCheck,
  UserX,
  Trash2,
} from "lucide-react";

interface AdminStaffViewProps {
  users: any[];
  loading: boolean;
  updateUserRole: (id: string, role: any) => void;
  toggleUserActiveStatus: (id: string, current: boolean) => void;
  deleteUser: (id: string, name: string) => void;
  isApprovalsTab?: boolean;
}

export function AdminStaffView({
  users,
  loading,
  updateUserRole,
  toggleUserActiveStatus,
  deleteUser,
  isApprovalsTab = false,
}: AdminStaffViewProps) {
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

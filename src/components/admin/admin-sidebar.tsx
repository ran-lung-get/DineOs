import {
  Shield,
  LayoutDashboard,
  ClipboardList,
  Users,
  UserPlus,
  LogOut,
} from "lucide-react";

export type AdminTab = "dashboard" | "inventory" | "staff" | "approvals";

interface AdminSidebarProps {
  view: AdminTab;
  setView: (v: AdminTab) => void;
  setSidebarOpen?: (b: boolean) => void;
  handleLogout: () => void;
  pendingCount?: number;
}

export function AdminSidebar({
  view,
  setView,
  setSidebarOpen,
  handleLogout,
  pendingCount = 0,
}: AdminSidebarProps) {
  const selectTab = (v: AdminTab) => {
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

import { ChefHat, Table, BookOpen, Inbox, Home, LogOut, X } from "lucide-react";

export type StaffView = "kitchen" | "tables" | "menu" | "stock";

interface KitchenSidebarProps {
  view: StaffView;
  setView: (v: StaffView) => void;
  onClose?: () => void;
  handleLogout: () => void;
}

export function KitchenSidebar({
  view,
  setView,
  onClose,
  handleLogout,
}: KitchenSidebarProps) {
  return (
    <div className="flex flex-col h-full bg-[#002e47] text-white">
      {/* Brand Header */}
      <div className="p-5 border-b border-white/10 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 text-[#fcc14a] border border-white/15">
            <ChefHat size={22} className="stroke-[2.5]" />
          </div>
          <div>
            <h2 className="font-black text-sm tracking-tight text-white uppercase">
              ระบบจัดการครัว
            </h2>
            <p className="text-[9px] font-bold text-[#fcc14a] tracking-wider uppercase">
              KITCHEN MONITOR (STAFF)
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden text-white/50 hover:text-white p-1 cursor-pointer"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest block px-2 mb-2">
            เมนูพนักงาน
          </span>

          {/* จอจัดการครัว */}
          <button
            onClick={() => {
              setView("kitchen");
              if (onClose) onClose();
            }}
            className={`w-full flex items-center gap-3 px-3 py-3.5 rounded-xl text-left transition duration-200 cursor-pointer ${
              view === "kitchen"
                ? "bg-white/10 text-white shadow-inner font-black border-l-4 border-[#fcc14a]"
                : "text-white/70 hover:text-white hover:bg-white/5 font-medium border-l-4 border-transparent"
            }`}
          >
            <ChefHat
              size={18}
              className={view === "kitchen" ? "text-[#fcc14a]" : "text-white/60"}
            />
            <span className="text-sm">จอจัดการครัว</span>
          </button>

          {/* ผังโต๊ะอาหาร */}
          <button
            onClick={() => {
              setView("tables");
              if (onClose) onClose();
            }}
            className={`w-full flex items-center gap-3 px-3 py-3.5 rounded-xl text-left transition duration-200 cursor-pointer ${
              view === "tables"
                ? "bg-white/10 text-white shadow-inner font-black border-l-4 border-[#fcc14a]"
                : "text-white/70 hover:text-white hover:bg-white/5 font-medium border-l-4 border-transparent"
            }`}
          >
            <Table
              size={18}
              className={view === "tables" ? "text-[#fcc14a]" : "text-white/60"}
            />
            <span className="text-sm">ผังโต๊ะอาหาร</span>
          </button>

          {/* จัดการเมนูอาหาร */}
          <button
            onClick={() => {
              setView("menu");
              if (onClose) onClose();
            }}
            className={`w-full flex items-center gap-3 px-3 py-3.5 rounded-xl text-left transition duration-200 cursor-pointer ${
              view === "menu"
                ? "bg-white/10 text-white shadow-inner font-black border-l-4 border-[#fcc14a]"
                : "text-white/70 hover:text-white hover:bg-white/5 font-medium border-l-4 border-transparent"
            }`}
          >
            <BookOpen
              size={18}
              className={view === "menu" ? "text-[#fcc14a]" : "text-white/60"}
            />
            <span className="text-sm">จัดการเมนูอาหาร</span>
          </button>

          {/* จัดการสต็อกวัตถุดิบ */}
          <button
            onClick={() => {
              setView("stock");
              if (onClose) onClose();
            }}
            className={`w-full flex items-center gap-3 px-3 py-3.5 rounded-xl text-left transition duration-200 cursor-pointer ${
              view === "stock"
                ? "bg-white/10 text-white shadow-inner font-black border-l-4 border-[#fcc14a]"
                : "text-white/70 hover:text-white hover:bg-white/5 font-medium border-l-4 border-transparent"
            }`}
          >
            <Inbox
              size={18}
              className={view === "stock" ? "text-[#fcc14a]" : "text-white/60"}
            />
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

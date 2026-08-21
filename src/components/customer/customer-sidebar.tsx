import { motion } from "motion/react";
import {
  Home as HomeIcon,
  ClipboardList,
  History,
  MessageCircle,
  User,
  LogOut,
} from "lucide-react";
import { useLanguage } from "../../lib/i18n";
import { type LiffProfile } from "../../lib/liff";
import { type OrderHistory } from "../../types";
import { BRAND, GOLD } from "../../constants/theme";

interface CustomerSidebarProps {
  onClose: () => void;
  onNavigate: (view: string) => void;
  orderHistory: OrderHistory[];
  simulateClosed: boolean;
  setSimulateClosed: (s: boolean) => void;
  profile: LiffProfile | null;
  onLogout: () => void;
}

export function CustomerSidebar({
  onClose,
  onNavigate,
  orderHistory,
  simulateClosed,
  setSimulateClosed,
  profile,
  onLogout,
}: CustomerSidebarProps) {
  const { t } = useLanguage();
  const items = [
    { id: "home", label: t("หน้าแรก"), icon: HomeIcon },
    { id: "status", label: t("สถานะการสั่งซื้อ"), icon: ClipboardList },
    { id: "history", label: t("ประวัติการสั่งซื้อ"), icon: History },
    { id: "contact", label: t("ติดต่อเรา"), icon: MessageCircle },
  ];

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/55 z-[60]"
      />
      <motion.aside
        initial={{ x: "-100%" }}
        animate={{ x: 0 }}
        exit={{ x: "-100%" }}
        transition={{ type: "tween", duration: 0.28 }}
        className="absolute top-0 left-0 bottom-0 w-[78%] md:w-[320px] z-[70] flex flex-col"
        style={{ background: BRAND, color: "white" }}
      >
        <div className="p-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            {profile?.pictureUrl ? (
              <img
                src={profile.pictureUrl}
                alt={profile.displayName}
                className="h-12 w-12 rounded-full object-cover"
                style={{ border: "2px solid " + GOLD }}
              />
            ) : (
              <div
                className="grid h-12 w-12 place-items-center rounded-full"
                style={{ background: GOLD, color: BRAND }}
              >
                <User size={22} />
              </div>
            )}
            <div>
              <p className="font-bold">{profile?.displayName ?? t("ผู้ใช้งาน")}</p>
              <p className="text-xs text-white/60">{t("บัญชีผู้ใช้")}</p>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto no-scrollbar p-3">
          <nav className="space-y-1">
            {items.map((it) => (
              <button
                key={it.id}
                onClick={() => {
                  onNavigate(it.id);
                }}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left hover:bg-white/5 cursor-pointer"
              >
                <it.icon size={18} color={GOLD} />
                <span className="font-medium text-sm">{it.label}</span>
                {it.id === "history" && orderHistory.length > 0 && (
                  <span
                    className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: GOLD, color: BRAND }}
                  >
                    {orderHistory.length}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
        <div className="p-5 border-t border-white/10 space-y-4">
          {/* Simulator Panel */}
          <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
            <p className="text-[11px] font-bold text-white/50 uppercase tracking-wider mb-2.5">
              {t("โหมดผู้พัฒนา (Developer Mode)")}
            </p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/80">{t("จำลองสถานะร้านปิด")}</span>
              <button
                type="button"
                onClick={() => setSimulateClosed(!simulateClosed)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  simulateClosed ? "bg-amber-500" : "bg-white/15"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    simulateClosed ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium cursor-pointer"
            style={{ background: "rgba(255,255,255,0.08)", color: "white" }}
          >
            <LogOut size={16} /> {t("ออกจากระบบ")}
          </button>
        </div>
      </motion.aside>
    </>
  );
}

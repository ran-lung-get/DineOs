import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ChevronLeft,
  Trash2,
  Package,
  Receipt,
  CheckCircle,
  Bike,
  ChefHat,
} from "lucide-react";
import { useLanguage } from "../../lib/i18n";
import { type OrderHistory } from "../../types";
import { BRAND, GOLD, INK_MUTED } from "../../constants/theme";

interface HistoryOverlayProps {
  orderHistory: OrderHistory[];
  onClearHistory?: () => void;
  onBack: () => void;
}

export function HistoryOverlay({
  orderHistory,
  onClearHistory,
  onBack,
}: HistoryOverlayProps) {
  const { t } = useLanguage();
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "tween", duration: 0.3 }}
      className="absolute inset-0 z-30 bg-[var(--surface)] flex flex-col"
    >
      {/* Header */}
      <div className="w-full" style={{ background: BRAND, color: "white" }}>
        <div className="max-w-2xl mx-auto px-5 pt-5 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={onBack}
                className="grid h-10 w-10 place-items-center rounded-full bg-white/10 border border-white/15 cursor-pointer hover:bg-white/20 transition"
              >
                <ChevronLeft size={20} color={GOLD} />
              </button>
              <div>
                <h1 className="text-lg font-bold">{t("ประวัติการสั่งซื้อ")}</h1>
                <p className="text-xs text-white/60">
                  {orderHistory.length} {t("รายการ")}
                </p>
              </div>
            </div>

            {orderHistory.length > 0 && (
              <button
                type="button"
                onClick={() => setShowConfirmClear(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-red-500/20 hover:bg-red-500/30 text-red-200 hover:text-white border border-red-400/30 text-xs font-bold transition cursor-pointer active:scale-95"
              >
                <Trash2 size={13} />
                <span>{t("ล้างประวัติ")}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Clear Confirmation Modal */}
      <AnimatePresence>
        {showConfirmClear && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 text-center border border-slate-100"
            >
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-red-50 text-red-500">
                <Trash2 size={26} />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-black text-[#002e47]">
                  {t("คุณต้องการล้างประวัติการสั่งซื้อทั้งหมดใช่หรือไม่?")}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {t(
                    "การดำเนินการนี้ไม่สามารถยกเลิกได้ ข้อมูลประวัติในเครื่องของคุณจะถูกลบทั้งหมด",
                  )}
                </p>
              </div>
              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfirmClear(false)}
                  className="flex-1 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black transition cursor-pointer"
                >
                  {t("ยกเลิก")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClearHistory?.();
                    setShowConfirmClear(false);
                  }}
                  className="flex-1 py-2.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white text-xs font-black shadow-lg shadow-red-500/20 transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Trash2 size={13} />
                  <span>{t("ยืนยันล้างประวัติ")}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar w-full">
        <div className="max-w-2xl mx-auto px-5 pt-5 pb-8 space-y-4">
          {orderHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Package size={48} className="mb-4" style={{ color: INK_MUTED }} />
              <p className="text-sm font-medium" style={{ color: INK_MUTED }}>
                {t("ยังไม่มีประวัติการสั่งซื้อ")}
              </p>
              <p className="text-xs mt-1" style={{ color: INK_MUTED }}>
                {t("เริ่มสั่งอาหารเลย!")}
              </p>
            </div>
          ) : (
            orderHistory.map((order, idx) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.06 }}
                className="bg-white rounded-2xl shadow-soft overflow-hidden"
              >
                {/* Order header */}
                <div
                  className="px-4 py-3 flex items-center justify-between"
                  style={{
                    background: "rgba(0,46,71,0.03)",
                    borderBottom: "1px solid #f1ece4",
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="grid h-10 w-10 place-items-center rounded-xl"
                      style={{ background: BRAND, color: GOLD }}
                    >
                      <Receipt size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-bold" style={{ color: BRAND }}>
                        {order.orderNumber}
                      </p>
                      <p className="text-[10px]" style={{ color: INK_MUTED }}>
                        {order.date}
                      </p>
                    </div>
                  </div>
                  <span
                    className="px-3 py-1.5 rounded-full text-[11px] font-bold flex items-center gap-1.5"
                    style={{
                      background:
                        order.status === "สำเร็จ"
                          ? "#dcfce7"
                          : order.status === "กำลังจัดส่ง"
                            ? "#dbeafe"
                            : "#fef9c3",
                      color:
                        order.status === "สำเร็จ"
                          ? "#15803d"
                          : order.status === "กำลังจัดส่ง"
                            ? "#1d4ed8"
                            : "#a16207",
                    }}
                  >
                    {order.status === "สำเร็จ" && <CheckCircle size={12} />}
                    {order.status === "กำลังจัดส่ง" && <Bike size={12} />}
                    {order.status === "กำลังเตรียม" && <ChefHat size={12} />}
                    {t(order.status)}
                  </span>
                </div>

                {/* Order items */}
                <div className="px-4 py-3 space-y-2.5">
                  {order.items.map((item, itemIdx) => (
                    <div key={itemIdx} className="flex items-center gap-3">
                      <img
                        src={encodeURI(String(item.image))}
                        alt={item.name}
                        className="h-12 w-12 rounded-xl object-cover flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-sm font-medium truncate"
                          style={{ color: BRAND }}
                        >
                          {t(item.name)}
                        </p>
                        <p className="text-xs" style={{ color: INK_MUTED }}>
                          × {item.qty} · ฿{item.price}/{t("ชิ้น")}
                        </p>
                      </div>
                      <p className="text-sm font-bold" style={{ color: BRAND }}>
                        ฿{item.price * item.qty}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Order total */}
                <div
                  className="px-4 py-3 flex items-center justify-between"
                  style={{
                    background: "#fafbfc",
                    borderTop: "1px solid #f1ece4",
                  }}
                >
                  <div className="text-xs" style={{ color: INK_MUTED }}>
                    <span>
                      {t("อาหาร")} ฿{order.subtotal}
                    </span>
                    <span className="mx-1.5">·</span>
                    <span>
                      {t("จัดส่ง")} ฿{order.delivery}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs" style={{ color: INK_MUTED }}>
                      {t("รวม")}
                    </span>
                    <span className="text-lg font-bold" style={{ color: BRAND }}>
                      ฿{order.total}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </motion.div>
  );
}

import { motion } from "motion/react";
import { Pencil, Trash2 } from "lucide-react";
import { useLanguage } from "../../lib/i18n";
import { type CartLine } from "../../types";
import { BRAND, INK_MUTED } from "../../constants/theme";

interface CartDrawerProps {
  cart: CartLine[];
  subtotal: number;
  onClose: () => void;
  onRemove: (id: string) => void;
  onEdit: (line: CartLine) => void;
  onCheckout: () => void;
}

export function CartDrawer({
  cart,
  subtotal,
  onClose,
  onRemove,
  onEdit,
  onCheckout,
}: CartDrawerProps) {
  const { t } = useLanguage();
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/50 z-40"
      />
      <motion.aside
        aria-label="ตะกร้าสินค้าของคุณ"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 280 }}
        className="absolute inset-x-0 bottom-0 md:left-auto md:right-4 md:bottom-4 md:max-w-md md:w-full md:rounded-3xl md:shadow-2xl z-50 bg-white rounded-t-3xl max-h-[85%] flex flex-col"
      >
        <div className="px-5 pt-3 pb-4 border-b" style={{ borderColor: "#f1ece4" }}>
          <div className="mx-auto h-1.5 w-12 rounded-full bg-[#e5dccc] mb-3" />
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold" style={{ color: BRAND }}>
              {t("ตะกร้าของคุณ")}
            </h2>
            <button
              aria-label="ปิดตะกร้า"
              onClick={onClose}
              className="text-sm cursor-pointer"
              style={{ color: INK_MUTED }}
            >
              {t("ปิด")}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar px-5 py-4 space-y-3">
          {cart.length === 0 && (
            <p className="text-center py-10 text-sm" style={{ color: INK_MUTED }}>
              {t("ยังไม่มีรายการในตะกร้า")}
            </p>
          )}
          {cart.map((l) => (
            <div key={l.id} className="flex gap-3 bg-[var(--surface)] rounded-2xl p-3">
              <img
                src={encodeURI(String(l.image))}
                alt={l.name}
                className="h-16 w-16 rounded-xl object-cover"
              />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm" style={{ color: BRAND }}>
                  {l.name}
                </h3>
                <p className="text-xs" style={{ color: INK_MUTED }}>
                  × {l.qty}
                  {l.addons.length > 0 && ` · ${l.addons.map((a) => t(a.name)).join(", ")}`}
                </p>
                <p className="text-sm font-bold mt-1" style={{ color: BRAND }}>
                  ฿{l.price * l.qty}
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <button
                  aria-label={`แก้ไข ${l.name}`}
                  onClick={() => onEdit(l)}
                  className="grid h-8 w-8 place-items-center rounded-full transition active:scale-95 cursor-pointer"
                  style={{ background: "rgba(0,46,71,0.06)", color: BRAND }}
                >
                  <Pencil size={13} />
                </button>
                <button
                  aria-label={`ลบ ${l.name} ออกจากตะกร้า`}
                  onClick={() => onRemove(l.id)}
                  className="grid h-8 w-8 place-items-center rounded-full transition active:scale-95 cursor-pointer"
                  style={{ background: "#fee2e2", color: "#dc2626" }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
        {cart.length > 0 && (
          <div
            className="px-5 pt-3 pb-5 border-t space-y-3"
            style={{ borderColor: "#f1ece4" }}
          >
            <div className="flex items-center justify-between text-sm">
              <span style={{ color: INK_MUTED }}>{t("ยอดรวม")}</span>
              <span className="font-bold text-base" style={{ color: BRAND }}>
                ฿{subtotal}
              </span>
            </div>
            <button
              aria-label="ดำเนินการสั่งซื้อสินค้าในตะกร้า"
              onClick={onCheckout}
              className="w-full h-12 rounded-full font-semibold cursor-pointer active:scale-95 transition"
              style={{ background: BRAND, color: "white" }}
            >
              {t("ดำเนินการสั่งซื้อ")}
            </button>
          </div>
        )}
      </motion.aside>
    </>
  );
}

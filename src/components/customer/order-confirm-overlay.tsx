import { useState } from "react";
import { motion } from "motion/react";
import { ChevronLeft, Pencil, Trash2, Phone, CreditCard } from "lucide-react";
import { useLanguage } from "../../lib/i18n";
import { type CartLine } from "../../types";
import { BRAND, GOLD, INK_MUTED } from "../../constants/theme";

interface OrderConfirmOverlayProps {
  cart: CartLine[];
  subtotal: number;
  deliveryFee: number;
  onBack: () => void;
  onRemove: (id: string) => void;
  onEdit: (line: CartLine) => void;
  onProceed: () => void;
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span style={{ color: bold ? BRAND : INK_MUTED, fontWeight: bold ? 600 : 400 }}>
        {label}
      </span>
      <span
        className={bold ? "text-lg" : ""}
        style={{ color: BRAND, fontWeight: bold ? 700 : 500 }}
      >
        {value}
      </span>
    </div>
  );
}

export function OrderConfirmOverlay({
  cart,
  subtotal,
  deliveryFee,
  onBack,
  onRemove,
  onEdit,
  onProceed,
}: OrderConfirmOverlayProps) {
  const { t } = useLanguage();
  const [phone, setPhone] = useState("");
  const [err, setErr] = useState("");
  const grand = subtotal + deliveryFee;

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "tween", duration: 0.3 }}
      className="absolute inset-0 z-40 bg-[var(--surface)] overflow-y-auto no-scrollbar pb-12"
    >
      <div className="w-full" style={{ background: BRAND, color: "white" }}>
        <div className="max-w-2xl mx-auto px-5 pt-5 pb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="grid h-10 w-10 place-items-center rounded-full bg-white/10 border border-white/15 cursor-pointer"
            >
              <ChevronLeft size={20} color={GOLD} />
            </button>
            <h1 className="text-lg font-bold">{t("รายการสั่งซื้อในตะกร้า")}</h1>
          </div>
          <p className="text-sm mt-2 text-white/70">{t("ตรวจสอบรายการก่อนชำระเงิน")}</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-5 mt-4 space-y-3">
        {cart.map((l) => (
          <div key={l.id} className="bg-white rounded-2xl p-4 shadow-soft">
            <div className="flex gap-3">
              <img
                src={encodeURI(String(l.image))}
                alt={l.name}
                className="h-16 w-16 rounded-xl object-cover"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-sm" style={{ color: BRAND }}>
                    {l.name}
                  </h3>
                  <span className="font-bold text-sm" style={{ color: BRAND }}>
                    ฿{l.price * l.qty}
                  </span>
                </div>
                <p className="text-xs mt-1" style={{ color: INK_MUTED }}>
                  {t("จำนวน")} × {l.qty} · ฿{l.price}/{t("ชิ้น")}
                </p>
                {l.addons.length > 0 && (
                  <p className="text-xs mt-0.5" style={{ color: INK_MUTED }}>
                    + {l.addons.map((a) => t(a.name)).join(", ")}
                  </p>
                )}
                {l.note && (
                  <p className="text-xs mt-0.5 italic" style={{ color: INK_MUTED }}>
                    "{l.note}"
                  </p>
                )}
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => onEdit(l)}
                className="flex-1 py-2 rounded-xl text-sm font-medium flex items-center justify-center gap-1 transition active:scale-95 cursor-pointer"
                style={{ background: "rgba(0,46,71,0.06)", color: BRAND }}
              >
                <Pencil size={14} /> {t("แก้ไขรายการ")}
              </button>
              <button
                onClick={() => onRemove(l.id)}
                className="flex-1 py-2 rounded-xl text-sm font-medium flex items-center justify-center gap-1 transition active:scale-95 cursor-pointer"
                style={{ background: "#fee2e2", color: "#dc2626" }}
              >
                <Trash2 size={14} /> {t("ลบรายการ")}
              </button>
            </div>
          </div>
        ))}

        <div className="bg-white rounded-2xl p-4 shadow-soft space-y-2.5">
          <h3 className="font-semibold mb-2" style={{ color: BRAND }}>
            {t("สรุปคำสั่งซื้อ")}
          </h3>
          <Row label={t("ยอดรวมอาหาร")} value={`฿${subtotal}`} />
          <Row label={t("ค่าจัดส่ง")} value={`฿${deliveryFee}`} />
          <div
            className="border-t pt-2.5 mt-2.5"
            style={{ borderColor: "#f1ece4" }}
          >
            <Row label={t("รวมทั้งหมด")} value={`฿${grand}`} bold />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-soft">
          <label
            className="text-sm font-semibold flex items-center gap-2"
            style={{ color: BRAND }}
          >
            <Phone size={14} /> {t("เบอร์โทรสำหรับติดต่อ")}
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value.replace(/\D/g, "").slice(0, 10));
              setErr("");
            }}
            placeholder="0XX-XXX-XXXX"
            className="mt-2 w-full rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2"
            style={{ borderColor: err ? "#ef4444" : "#ece4d6", color: BRAND }}
          />
          {err && <p className="text-xs text-red-500 mt-1">{err}</p>}

          <div className="pb-8 mt-4">
            <button
              onClick={() => {
                if (phone.length < 10) {
                  setErr(t("กรุณากรอกเบอร์โทรให้ครบ 10 หลัก"));
                  return;
                }
                onProceed();
              }}
              className="w-full h-14 rounded-full font-bold text-white shadow-lift active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
              style={{
                background: "linear-gradient(135deg, #635bff 0%, #8073ea 100%)",
              }}
            >
              <CreditCard size={18} />
              <span>
                {t("ชำระผ่าน Stripe")} · ฿{grand.toLocaleString()}
              </span>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

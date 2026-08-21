import { useState } from "react";
import { motion } from "motion/react";
import { ChevronLeft, CreditCard, X, Check } from "lucide-react";
import { useLanguage } from "../../lib/i18n";
import { createStripeSession } from "../../lib/api/stripe.functions";
import { type CartLine } from "../../types";
import { BRAND, GOLD } from "../../constants/theme";

type OrderType = "dine-in" | "takeaway" | "delivery";

interface PaymentOverlayProps {
  total: number;
  cart: CartLine[];
  orderType: OrderType;
  deliveryFee: number;
  subtotal: number;
  selectedTable: string;
  address: string;
  onBack: () => void;
  onSuccess: () => void;
}

export function MockQR() {
  // simple deterministic SVG mock QR
  const cells = 25;
  const size = 200;
  const c = size / cells;
  const rand = (i: number, j: number) => ((i * 73 + j * 137 + i * j * 31) % 7) < 3;
  const dots = [];
  for (let i = 0; i < cells; i++)
    for (let j = 0; j < cells; j++) if (rand(i, j)) dots.push({ i, j });

  const Corner = ({ x, y }: { x: number; y: number }) => (
    <g>
      <rect x={x} y={y} width={c * 7} height={c * 7} fill={BRAND} rx={4} />
      <rect x={x + c} y={y + c} width={c * 5} height={c * 5} fill="white" rx={2} />
      <rect x={x + c * 2} y={y + c * 2} width={c * 3} height={c * 3} fill={BRAND} rx={1} />
    </g>
  );

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <rect width={size} height={size} fill="white" />
      {dots.map((d, k) => {
        // skip corners
        if (
          (d.i < 8 && d.j < 8) ||
          (d.i < 8 && d.j > cells - 9) ||
          (d.i > cells - 9 && d.j < 8)
        )
          return null;
        return <rect key={k} x={d.i * c} y={d.j * c} width={c} height={c} fill={BRAND} />;
      })}
      <Corner x={0} y={0} />
      <Corner x={size - c * 7} y={0} />
      <Corner x={0} y={size - c * 7} />
    </svg>
  );
}

export function StripeVerifyingFlash() {
  const { t } = useLanguage();
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-[60] flex items-center justify-center"
      style={{ background: BRAND }}
    >
      <div className="flex flex-col items-center gap-4">
        <div
          style={{
            width: 50,
            height: 50,
            borderRadius: "50%",
            border: "4px solid rgba(255,255,255,0.1)",
            borderTopColor: GOLD,
            animation: "spin 0.8s linear infinite",
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p className="text-white font-bold text-lg">
          {t("กำลังตรวจสอบการชำระเงินผ่าน Stripe...")}
        </p>
        <p className="text-white/60 text-sm">{t("กรุณาอย่าปิดหน้านี้")}</p>
      </div>
    </motion.div>
  );
}

export function StripeErrorOverlay({
  error,
  onClose,
}: {
  error: string;
  onClose: () => void;
}) {
  const { t } = useLanguage();
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-[60] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-white rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl border border-red-100"
      >
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-500 mb-4">
          <X size={32} />
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-2">
          {t("การชำระเงินไม่สำเร็จ")}
        </h3>
        <p className="text-sm text-slate-500 mb-6 leading-relaxed">{error}</p>
        <button
          onClick={onClose}
          className="w-full h-12 rounded-full font-semibold text-white transition-all shadow-md active:scale-[0.98] cursor-pointer"
          style={{ background: BRAND }}
        >
          {t("ตกลง")}
        </button>
      </motion.div>
    </motion.div>
  );
}

export function SuccessFlash() {
  const { t } = useLanguage();
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-[60] flex items-center justify-center"
      style={{ background: BRAND }}
    >
      <div className="flex flex-col items-center gap-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", damping: 12, stiffness: 200 }}
          className="grid h-24 w-24 place-items-center rounded-full"
          style={{ background: GOLD }}
        >
          <Check size={48} color={BRAND} strokeWidth={3} />
        </motion.div>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-white font-bold text-lg"
        >
          {t("ชำระเงินสำเร็จ")}
        </motion.p>
      </div>
    </motion.div>
  );
}

export function PaymentOverlay({
  total,
  cart,
  orderType,
  deliveryFee,
  subtotal,
  selectedTable,
  address,
  onBack,
}: PaymentOverlayProps) {
  const { t } = useLanguage();
  const [stripeLoading, setStripeLoading] = useState(false);
  const [stripeErrorMsg, setStripeErrorMsg] = useState<string | null>(null);

  const handleStripeCheckout = async () => {
    setStripeLoading(true);
    setStripeErrorMsg(null);
    try {
      // 1. Save state to localStorage so we can restore it on redirect back
      const pendingOrder = {
        cart,
        orderType,
        selectedTable,
        address,
      };
      localStorage.setItem("ran-lung-get-pending-stripe-order", JSON.stringify(pendingOrder));

      // 2. Call server function to create checkout session
      const origin = window.location.origin;
      const result = await createStripeSession({
        data: {
          cart: cart.map((l) => ({
            name: l.name,
            price: l.price,
            qty: l.qty,
            image: l.image || null,
          })),
          subtotal,
          deliveryFee,
          orderType,
          origin,
        },
      });

      if (result.url) {
        // 3. Redirect to Stripe Checkout or mock Sandbox page
        window.location.href = result.url;
      } else {
        throw new Error("ไม่สามารถสร้าง URL สำหรับการชำระเงินได้");
      }
    } catch (err: any) {
      console.error("[Stripe] Checkout error:", err);
      setStripeErrorMsg(err?.message || "เกิดข้อผิดพลาดในการเชื่อมต่อกับ Stripe");
      setStripeLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "tween", duration: 0.3 }}
      className="absolute inset-0 z-50 bg-[var(--surface)] overflow-y-auto no-scrollbar pb-12"
    >
      {/* Header */}
      <div className="w-full" style={{ background: BRAND, color: "white" }}>
        <div className="max-w-2xl mx-auto px-5 pt-5 pb-6 mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="grid h-10 w-10 place-items-center rounded-full bg-white/10 border border-white/15 cursor-pointer"
            >
              <ChevronLeft size={20} color={GOLD} />
            </button>
            <h1 className="text-lg font-bold">{t("ชำระเงินค่าอาหาร")}</h1>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-5 space-y-4">
        {/* Stripe Content */}
        <div className="bg-white rounded-3xl p-5 shadow-soft border border-slate-50 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <span className="text-sm font-bold text-slate-800">
              {t("สรุปรายการสั่งซื้อ")}
            </span>
            <span className="text-xs text-slate-400 font-medium">
              ({cart.length} {t("รายการ")})
            </span>
          </div>

          <div className="space-y-2 text-sm text-slate-600">
            <div className="flex justify-between">
              <span>{t("ค่าอาหาร (Subtotal)")}</span>
              <span>฿{subtotal.toLocaleString()}</span>
            </div>
            {deliveryFee > 0 && (
              <div className="flex justify-between">
                <span>{t("ค่าจัดส่ง (Delivery Fee)")}</span>
                <span>฿{deliveryFee.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between pt-3 border-t border-slate-100 font-bold text-slate-800 text-base">
              <span>{t("ยอดชำระทั้งหมด")}</span>
              <span style={{ color: BRAND }}>฿{total.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Information Card */}
        <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200/50 flex gap-3 text-xs text-amber-800 leading-relaxed shadow-sm">
          <span className="text-lg">💡</span>
          <div>
            <p className="font-bold mb-0.5">
              {t("ระบบชำระเงิน Stripe (โอนเงิน/บัตรเครดิต)")}
            </p>
            <p className="text-amber-700">
              {t(
                "ชำระได้ทั้ง PromptPay QR Code และ บัตรเครดิต ผ่านแพลตฟอร์ม Stripe ที่ปลอดภัยระดับมาตรฐานสากล",
              )}
            </p>
          </div>
        </div>

        {/* Stripe Badges */}
        <div className="flex flex-col items-center justify-center py-4 bg-white rounded-3xl border border-slate-100 shadow-soft gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold">
            <span>Secured by</span>
            <span className="text-[#635bff] font-extrabold tracking-tight text-sm">
              stripe
            </span>
          </div>
          <div className="flex items-center gap-3 opacity-60">
            <span className="text-[10px] bg-slate-100 px-2 py-1 rounded font-bold text-slate-500">
              VISA
            </span>
            <span className="text-[10px] bg-slate-100 px-2 py-1 rounded font-bold text-slate-500">
              MASTERCARD
            </span>
            <span className="text-[10px] bg-slate-100 px-2 py-1 rounded font-bold text-slate-500">
              JCB
            </span>
            <span className="text-[10px] bg-slate-100 px-2 py-1 rounded font-bold text-slate-500">
              PROMPTPAY
            </span>
          </div>
        </div>

        {stripeErrorMsg && (
          <div className="bg-red-50 rounded-xl p-3 border border-red-200 text-xs text-red-700 text-center">
            {stripeErrorMsg}
          </div>
        )}

        {/* Pay Button */}
        <div className="pb-8">
          <button
            onClick={handleStripeCheckout}
            disabled={stripeLoading}
            className="w-full h-14 rounded-full font-bold text-white shadow-lift active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
            style={{
              background: "linear-gradient(135deg, #635bff 0%, #8073ea 100%)",
            }}
          >
            {stripeLoading ? (
              <div
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  border: "2px solid rgba(255,255,255,0.2)",
                  borderTopColor: "white",
                  animation: "spin 0.8s linear infinite",
                }}
              />
            ) : (
              <>
                <CreditCard size={18} />
                <span>
                  {t("ชำระผ่าน Stripe")} ฿{total.toLocaleString()}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

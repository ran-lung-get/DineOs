import { useMemo } from "react";
import { motion } from "motion/react";
import { Menu, Store, Clock } from "lucide-react";
import { useLanguage } from "../../lib/i18n";
import { BRAND, GOLD } from "../../constants/theme";

interface StoreClosedOverlayProps {
  onBypass: () => void;
  onOpenSidebar: () => void;
}

export function StoreClosedOverlay({
  onBypass,
  onOpenSidebar,
}: StoreClosedOverlayProps) {
  const { t } = useLanguage();
  const todayDay = useMemo(() => {
    const now = new Date();
    const thTimeStr = now.toLocaleString("en-US", { timeZone: "Asia/Bangkok" });
    const thTime = new Date(thTimeStr);
    return thTime.getDay();
  }, []);

  const daysInfo = [
    { name: t("วันอาทิตย์"), label: "อา.", time: "08:00 - 21:00", open: true, dayIndex: 0 },
    { name: t("วันจันทร์"), label: "จ.", time: "08:00 - 21:00", open: true, dayIndex: 1 },
    { name: t("วันอังคาร"), label: "อ.", time: "08:00 - 21:00", open: true, dayIndex: 2 },
    { name: t("วันพุธ"), label: "พ.", time: "08:00 - 21:00", open: true, dayIndex: 3 },
    { name: t("วันพฤหัสบดี"), label: "พฤ.", time: "08:00 - 21:00", open: true, dayIndex: 4 },
    { name: t("วันศุกร์"), label: "ศ.", time: "08:00 - 21:00", open: true, dayIndex: 5 },
    { name: t("วันเสาร์"), label: "ส.", time: t("ปิดทำการ"), open: false, dayIndex: 6 },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 bg-[var(--surface)] flex flex-col"
    >
      {/* Header */}
      <div className="w-full shadow-sm" style={{ background: BRAND, color: "white" }}>
        <div className="max-w-2xl mx-auto px-5 pt-5 pb-4 flex items-center justify-between">
          <button
            onClick={onOpenSidebar}
            className="grid h-10 w-10 place-items-center rounded-full bg-white/10 border border-white/15 active:scale-95 transition-transform cursor-pointer"
          >
            <Menu size={20} color={GOLD} />
          </button>
          <span className="text-xs uppercase tracking-[0.25em] text-white/60 font-bold">
            EPICUREAN
          </span>
          <div className="w-10" />
        </div>
      </div>

      {/* Main Banner */}
      <div className="flex-1 overflow-y-auto no-scrollbar w-full">
        <div className="max-w-2xl mx-auto px-6 py-6 flex flex-col justify-between h-full min-h-[calc(100vh-80px)]">
          <div className="space-y-6">
            {/* Pulsing closed icon */}
            <div className="flex justify-center mt-2">
              <div className="relative">
                <div className="grid h-20 w-20 place-items-center rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 shadow-sm animate-pulse">
                  <Store size={38} className="stroke-[1.5]" />
                </div>
                <div className="absolute -bottom-2 -right-2 grid h-7 w-7 place-items-center rounded-full bg-red-500 text-white border border-white shadow-md">
                  <Clock
                    size={14}
                    className="animate-spin"
                    style={{ animationDuration: "6s" }}
                  />
                </div>
              </div>
            </div>

            {/* Main Closed Text Box */}
            <div className="text-center space-y-3">
              <h2 className="text-xl font-bold text-slate-800 leading-snug">
                {t("วันนี้ร้านปิดทำการ ขออภัยในความไม่สะดวก")}
              </h2>
              <div className="inline-block bg-amber-500/10 border border-amber-500/20 rounded-2xl px-6 py-4 mt-2 max-w-sm mx-auto">
                <p className="text-sm font-semibold text-amber-900 leading-relaxed">
                  {t("เราจะเปิดบริการอีกครั้งวันอาทิตย์-ศุกร์")}
                  <br />
                  {t("เวลา")}{" "}
                  <span className="font-extrabold text-amber-955 text-base">
                    8:00 - 21:00 น.
                  </span>
                </p>
              </div>
            </div>

            {/* Opening Schedule Grid */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
                {t("ตารางเวลาให้บริการ")}
              </h3>
              <div className="bg-white border border-slate-200/80 rounded-2xl shadow-soft divide-y divide-slate-100 overflow-hidden">
                {daysInfo.map((day) => {
                  const isToday = day.dayIndex === todayDay;
                  return (
                    <div
                      key={day.dayIndex}
                      className={`flex items-center justify-between px-4 py-3.5 transition-colors ${
                        isToday ? "bg-amber-500/5" : ""
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center ${
                            isToday
                              ? "bg-amber-500 text-white shadow-sm"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {day.label}
                        </span>
                        <span
                          className={`text-sm font-semibold ${isToday ? "text-slate-800" : "text-slate-600"}`}
                        >
                          {day.name}{" "}
                          {isToday && (
                            <span className="ml-1 text-[10px] font-bold text-amber-600 bg-amber-500/10 px-1.5 py-0.5 rounded-full">
                              {t("วันนี้")}
                            </span>
                          )}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-slate-700">
                          {day.time}
                        </span>
                        <span
                          className={`h-2.5 w-2.5 rounded-full ${day.open ? "bg-emerald-500" : "bg-red-500"}`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Demo Bypass Button */}
          <div className="mt-8 space-y-3">
            <button
              onClick={onBypass}
              className="w-full py-4 px-5 rounded-2xl text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 bg-slate-50 border border-slate-200/80 transition-all text-center flex items-center justify-center gap-2 active:scale-[0.98] cursor-pointer"
            >
              {t("เข้าสู่โหมดสาธิต (Bypass เพื่อสั่งอาหาร)")}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

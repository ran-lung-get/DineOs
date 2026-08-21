import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { X } from "lucide-react";
import { useLanguage } from "../../lib/i18n";
import { type OrderHistory } from "../../types";
import { BRAND, GOLD } from "../../constants/theme";

interface TablePickerBottomSheetProps {
  tables: { id: string; label: string; status: string }[];
  selectedTable: string;
  orderHistory?: OrderHistory[];
  onSelect: (id: string) => void;
  onClose: () => void;
}

export function TablePickerBottomSheet({
  tables,
  selectedTable,
  onSelect,
  onClose,
}: TablePickerBottomSheetProps) {
  const { t } = useLanguage();
  const [tableFilter, setTableFilter] = useState<"all" | "available" | "occupied">("all");

  const displayTables = useMemo(() => {
    const list = [...tables].sort((a, b) => Number(a.id) - Number(b.id));
    if (tableFilter === "available") return list.filter((t) => t.status === "available");
    if (tableFilter === "occupied") return list.filter((t) => t.status === "occupied");
    return list;
  }, [tables, tableFilter]);

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 z-40 bg-black/60 backdrop-blur-sm"
      />

      {/* Modal Container — perfectly centered */}
      <div className="absolute inset-0 z-50 flex items-center justify-center px-4 pointer-events-none">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: "spring", damping: 25, stiffness: 350 }}
          className="w-full max-w-[360px] rounded-[28px] bg-white shadow-2xl flex flex-col pointer-events-auto"
          style={{ maxHeight: "85vh" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-3 px-5 pt-5 pb-3 flex-shrink-0 border-b border-slate-100">
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400 font-semibold">
                {t("เลือกโต๊ะ")}
              </p>
              <h2 className="text-base font-bold text-slate-800">{t("ผังที่นั่ง")}</h2>
            </div>

            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors shrink-0 cursor-pointer"
            >
              <X size={15} />
            </motion.button>
          </div>

          {/* Filter */}
          <div className="px-4 py-3 flex gap-2 flex-shrink-0">
            {[
              { id: "all", label: t("ทั้งหมด"), dot: "#94a3b8" },
              { id: "available", label: t("ว่าง"), dot: "#15803d" },
              { id: "occupied", label: t("ไม่ว่าง"), dot: "#dc2626" },
            ].map((opt) => (
              <motion.button
                key={opt.id}
                whileTap={{ scale: 0.9 }}
                onClick={() => setTableFilter(opt.id as any)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold border transition-all flex-1 justify-center cursor-pointer"
                style={{
                  background: tableFilter === opt.id ? BRAND : "#f8fafc",
                  color: tableFilter === opt.id ? "white" : "#64748b",
                  borderColor: tableFilter === opt.id ? BRAND : "#e2e8f0",
                }}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full shrink-0"
                  style={{ background: tableFilter === opt.id ? "white" : opt.dot }}
                />
                {opt.label}
              </motion.button>
            ))}
          </div>

          {/* Scrollable table grid */}
          <div className="overflow-y-auto flex-1 px-4 pb-5">
            <div className="grid grid-cols-2 gap-3">
              {displayTables.length === 0 ? (
                <div className="col-span-2 text-center py-8">
                  <p className="text-sm font-semibold text-slate-400">{t("ไม่พบข้อมูลโต๊ะ")}</p>
                </div>
              ) : (
                displayTables.map((table) => {
                  const isOccupied = table.status === "occupied";
                  const isMyTable = String(selectedTable) === String(table.id);
                  const isWalkIn =
                    table.label.toLowerCase().includes("walk-in") ||
                    table.label.includes("หน้าร้าน");

                  let boxBg = "#dcfce7";
                  let boxBorder = "#15803d";
                  let boxText = "#14532d";
                  let boxSub = "#166534";
                  let badgeBg = "#bbf7d0";
                  let badgeText = "#14532d";
                  let badgeLabel = t("ว่าง");
                  let subText = t("ความจุ 2-4 คน");

                  if (isWalkIn) {
                    boxBg = "#f1f5f9";
                    boxBorder = "#cbd5e1";
                    boxText = "#475569";
                    boxSub = "#64748b";
                    badgeBg = "#e2e8f0";
                    badgeText = "#475569";
                    badgeLabel = "Walk-in";
                    subText = t("สำหรับหน้าร้าน");
                  } else if (isOccupied) {
                    boxBg = "#fee2e2";
                    boxBorder = "#dc2626";
                    boxText = "#7f1d1d";
                    boxSub = "#991b1b";
                    badgeBg = "#fecaca";
                    badgeText = "#7f1d1d";
                    badgeLabel = t("ไม่ว่าง");
                    subText = t("กำลังรับประทาน");
                  } else if (isMyTable) {
                    boxBg = BRAND;
                    boxBorder = BRAND;
                    boxText = GOLD;
                    boxSub = "rgba(252,193,74,0.7)";
                    badgeBg = "rgba(252,193,74,0.2)";
                    badgeText = GOLD;
                    badgeLabel = t("เลือกแล้ว");
                    subText = t("โต๊ะที่คุณเลือก");
                  } else {
                    boxBg = "#dcfce7";
                    boxBorder = "#15803d";
                    boxText = "#14532d";
                    boxSub = "#166534";
                    badgeBg = "#bbf7d0";
                    badgeText = "#14532d";
                    badgeLabel = t("ว่าง");
                    subText = t("ความจุ 2-4 คน");
                  }

                  return (
                    <motion.button
                      key={table.id}
                      aria-label={`เลือก ${table.label}`}
                      disabled={isWalkIn || isOccupied}
                      onClick={() => !isWalkIn && !isOccupied && onSelect(table.id)}
                      className="rounded-2xl p-4 text-left relative overflow-hidden transition-all cursor-pointer"
                      style={{
                        background: boxBg,
                        color: boxText,
                        border: `2px solid ${boxBorder}`,
                        opacity: isWalkIn ? 0.8 : isOccupied ? 0.85 : 1,
                        cursor: isWalkIn || isOccupied ? "not-allowed" : "pointer",
                      }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-xs truncate max-w-[85px]">
                          {table.label}
                        </span>
                        <span
                          className="text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0"
                          style={{ background: badgeBg, color: badgeText }}
                        >
                          {badgeLabel}
                        </span>
                      </div>
                      <p className="mt-1 text-[10px]" style={{ color: boxSub }}>
                        {subText}
                      </p>
                    </motion.button>
                  );
                })
              )}
            </div>

            {/* Legend */}
            <div className="mt-4 rounded-xl bg-slate-50 px-3 py-2.5 flex items-center gap-3">
              <p className="text-[11px] font-semibold text-slate-500">{t("สถานะโต๊ะ:")}</p>
              <div className="flex gap-2 flex-wrap">
                <span className="flex items-center gap-1 text-[10px] font-bold text-[#14532d] bg-[#dcfce7] px-2 py-0.5 rounded-full border border-[#15803d]">
                  {t("ว่าง")}
                </span>
                <span className="flex items-center gap-1 text-[10px] font-bold text-[#7f1d1d] bg-[#fee2e2] px-2 py-0.5 rounded-full border border-[#dc2626]">
                  {t("ไม่ว่าง")}
                </span>
                <span className="flex items-center gap-1 text-[10px] font-bold text-[#475569] bg-[#f1f5f9] px-2 py-0.5 rounded-full border border-[#cbd5e1]">
                  {t("สำหรับ Walk-in")}
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}

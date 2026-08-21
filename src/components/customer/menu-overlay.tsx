import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ChevronLeft,
  ShoppingBag,
  Search,
  SlidersHorizontal,
  X,
  Plus,
} from "lucide-react";
import { useLanguage } from "../../lib/i18n";
import { type MenuItem } from "../../types";
import { BRAND, GOLD, INK_MUTED } from "../../constants/theme";

interface MenuOverlayProps {
  onBack: () => void;
  onPickItem: (m: MenuItem) => void;
  onOpenCart: () => void;
  totalQty: number;
  subtotal: number;
  menuItems: MenuItem[];
}

export function MenuOverlay({
  onBack,
  onPickItem,
  onOpenCart,
  totalQty,
  subtotal,
  menuItems,
}: MenuOverlayProps) {
  const { t, tMenu } = useLanguage();
  const [activeCat, setActiveCat] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("default");
  const [showSortModal, setShowSortModal] = useState(false);

  const categories = [
    { id: "all", label: "ทั้งหมด" },
    { id: "signature", label: "Signature" },
    { id: "main", label: "ผัด & กับข้าว" },
    { id: "rice", label: "ข้าวผัด" },
    { id: "noodles", label: "เมนูเส้น" },
    { id: "vegetarian", label: "มังสวิรัติ" },
    { id: "drinks", label: "เครื่องดื่ม" },
    { id: "dessert", label: "ของหวาน" },
  ];

  // Filter and sort items dynamically
  const filteredAndSortedItems = useMemo(() => {
    let list =
      activeCat === "all" ? menuItems : menuItems.filter((m) => m.category === activeCat);

    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          (m.desc && m.desc.toLowerCase().includes(q)),
      );
    }

    if (sortBy === "price-low") {
      list = [...list].sort((a, b) => a.price - b.price);
    } else if (sortBy === "price-high") {
      list = [...list].sort((a, b) => b.price - a.price);
    }

    return list;
  }, [activeCat, searchQuery, sortBy, menuItems]);

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "tween", duration: 0.3 }}
      className="absolute inset-0 z-30 bg-[var(--linen)] flex flex-col"
    >
      <div className="z-20 bg-[var(--linen)] border-b border-slate-200/80 pt-5 pb-4 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-5 w-full">
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={onBack}
              className="grid h-10 w-10 place-items-center rounded-full bg-white cursor-pointer"
              style={{ color: BRAND, boxShadow: "0 2px 12px rgba(0,46,71,0.08)" }}
            >
              <ChevronLeft size={20} />
            </button>
            <h1 className="text-lg font-bold text-center flex-1" style={{ color: BRAND }}>
              {t("รายการเมนู")}
            </h1>
            <button
              onClick={onOpenCart}
              className="relative grid h-10 w-10 place-items-center rounded-full bg-white transition active:scale-95 cursor-pointer"
              style={{ color: BRAND, boxShadow: "0 2px 12px rgba(0,46,71,0.08)" }}
              aria-label="เปิดตะกร้าสินค้า"
            >
              <ShoppingBag size={20} />
              {totalQty > 0 && (
                <span
                  className="absolute -top-1 -right-1 grid h-5 min-w-5 px-1 place-items-center rounded-full text-[10px] font-bold border-2 border-white"
                  style={{ background: GOLD, color: BRAND }}
                >
                  {totalQty}
                </span>
              )}
            </button>
          </div>

          {/* Search input and Sort button */}
          <div className="mt-4 flex gap-2">
            <div className="flex-1 rounded-2xl bg-white px-4 py-3 shadow-sm border border-slate-200 flex items-center gap-3">
              <Search size={16} className="text-slate-400" />
              <input
                aria-label="ค้นหาเมนู"
                placeholder={t("ค้นหาเมนู...")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="text-slate-400 hover:text-slate-600 transition cursor-pointer"
                >
                  <X size={16} />
                </button>
              )}
            </div>
            <button
              onClick={() => setShowSortModal(true)}
              className="grid h-11 w-11 place-items-center rounded-2xl border shadow-sm transition active:scale-95 cursor-pointer relative"
              style={{
                background: sortBy !== "default" ? BRAND : "white",
                color: sortBy !== "default" ? GOLD : BRAND,
                borderColor: sortBy !== "default" ? BRAND : "#ece4d6",
              }}
              aria-label="เรียงลำดับเมนู"
            >
              <SlidersHorizontal size={18} />
              {sortBy !== "default" && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white shadow-sm border border-white">
                  1
                </span>
              )}
            </button>
          </div>

          <div className="mt-4 flex gap-2 overflow-x-auto no-scrollbar pb-2">
            {categories.map((cat) => {
              const active = cat.id === activeCat;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCat(cat.id)}
                  className="relative rounded-full px-4 py-2 text-sm font-medium transition cursor-pointer"
                  style={{ color: active ? "white" : BRAND }}
                >
                  {active && (
                    <motion.span
                      layoutId="menu-cat-pill"
                      className="absolute inset-0 rounded-full"
                      style={{ background: BRAND }}
                    />
                  )}
                  <span className="relative">{t(cat.label)}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar w-full">
        <div className="max-w-7xl mx-auto px-5 pt-5 pb-32">
          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 space-y-0">
            {filteredAndSortedItems.length === 0 ? (
              <div className="text-center py-16 flex flex-col items-center justify-center col-span-full">
                <Search size={32} className="text-slate-300 mb-2" />
                <p className="text-sm font-semibold text-slate-500">
                  {t("ไม่พบเมนูที่คุณค้นหา")}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {t("ลองใช้คำอื่น หรือรีเซ็ตการค้นหา")}
                </p>
                <button
                  onClick={() => setSearchQuery("")}
                  className="mt-4 px-4 py-2 bg-[#002e47] text-[#fcc14a] rounded-full text-xs font-bold shadow-soft cursor-pointer transition active:scale-95"
                >
                  {t("ล้างคำค้นหา")}
                </button>
              </div>
            ) : (
              filteredAndSortedItems.map((m) => (
                <div
                  key={m.id}
                  className="w-full bg-white rounded-2xl p-3 shadow-soft flex items-start gap-3"
                >
                  <img
                    src={encodeURI(String(m.image))}
                    alt={tMenu(m.name, "name")}
                    className="h-20 w-20 rounded-xl object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-sm truncate" style={{ color: BRAND }}>
                          {tMenu(m.name, "name")}
                        </h3>
                        <p className="text-xs mt-1 text-slate-500 whitespace-normal">
                          {tMenu(m.desc, "desc")}
                        </p>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="font-bold text-lg" style={{ color: "#a16207" }}>
                          ฿{m.price}
                        </span>
                        <div className="flex-shrink-0 grid place-items-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onPickItem(m);
                            }}
                            className="h-10 w-10 rounded-full bg-[#002e47] text-white grid place-items-center cursor-pointer transition active:scale-95 hover:opacity-90"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {totalQty > 0 && (
          <motion.div
            key="menu-cart-fixed"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="absolute z-40 w-[calc(100%-32px)] md:max-w-md md:left-1/2 md:-translate-x-1/2 bottom-6 left-4"
          >
            <button
              onClick={onOpenCart}
              className="w-full rounded-2xl px-5 py-4 flex items-center justify-between shadow-lift cursor-pointer"
              style={{ background: BRAND, color: "white" }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="relative grid h-9 w-9 place-items-center rounded-xl"
                  style={{ background: "rgba(252,193,74,0.15)" }}
                >
                  <ShoppingBag size={18} style={{ color: GOLD }} />
                  <span
                    className="absolute -top-1 -right-1 grid h-5 min-w-5 px-1 place-items-center rounded-full text-[10px] font-bold"
                    style={{ background: GOLD, color: BRAND }}
                  >
                    {totalQty}
                  </span>
                </div>
                <span className="font-medium">{t("ดูตะกร้าสินค้า")}</span>
              </div>
              <span className="font-bold text-lg" style={{ color: GOLD }}>
                ฿{subtotal}
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sorting Bottom Sheet */}
      <AnimatePresence>
        {showSortModal && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSortModal(false)}
              className="absolute inset-0 bg-black/50 z-50 cursor-pointer"
            />
            {/* Sheet */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 260 }}
              className="absolute inset-x-0 bottom-0 z-50 bg-white rounded-t-3xl pb-8"
            >
              <div className="px-5 pt-3 pb-4 border-b border-slate-100">
                <div className="mx-auto h-1.5 w-12 rounded-full bg-slate-200 mb-3" />
                <div className="flex items-center justify-between">
                  <h2
                    className="text-base font-bold flex items-center gap-1.5"
                    style={{ color: BRAND }}
                  >
                    <SlidersHorizontal size={16} />
                    <span>{t("เรียงลำดับตาม")}</span>
                  </h2>
                  <button
                    onClick={() => setShowSortModal(false)}
                    className="text-sm font-semibold cursor-pointer"
                    style={{ color: INK_MUTED }}
                  >
                    {t("เสร็จสิ้นการเลือก")}
                  </button>
                </div>
              </div>

              <div className="px-5 mt-4 space-y-2.5">
                {[
                  { id: "default", label: "🔥 ยอดนิยม (แนะนำ)", desc: "เมนูขายดีประจำสัปดาห์" },
                  {
                    id: "price-low",
                    label: "💵 ราคา: ต่ำ - สูง",
                    desc: "เมนูราคาประหยัด เรียงตามเงินบาท",
                  },
                  {
                    id: "price-high",
                    label: "💵 ราคา: สูง - ต่ำ",
                    desc: "เมนูระดับพรีเมียมคัดสรรพิเศษ",
                  },
                ].map((opt) => {
                  const active = sortBy === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => {
                        setSortBy(opt.id);
                        setShowSortModal(false);
                      }}
                      className="w-full flex items-center justify-between p-3.5 rounded-2xl border text-left transition duration-200 active:scale-[0.98] cursor-pointer"
                      style={{
                        background: active ? "rgba(0,46,71,0.02)" : "white",
                        borderColor: active ? BRAND : "#ece4d6",
                      }}
                    >
                      <div>
                        <p className="font-semibold text-sm" style={{ color: BRAND }}>
                          {t(opt.label)}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">{t(opt.desc)}</p>
                      </div>
                      <div
                        className="h-5 w-5 rounded-full border-2 flex items-center justify-center transition"
                        style={{
                          borderColor: active ? BRAND : "#cbd5e1",
                          background: active ? BRAND : "transparent",
                        }}
                      >
                        {active && <div className="h-2 w-2 rounded-full bg-[#fcc14a]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

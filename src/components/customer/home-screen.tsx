import { useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Home as HomeIcon,
  User,
  MapPin,
  Utensils,
  ShoppingBag,
  Bike,
  ChevronDown,
  Check,
  ChevronLeft,
  ChevronRight,
  Star,
  Plus,
  Menu,
} from "lucide-react";
import { useLanguage, type Language } from "../../lib/i18n";
import { type MenuItem } from "../../types";
import { BRAND, GOLD, INK_MUTED, LINEN } from "../../constants/theme";
import { HERO_IMG } from "../../constants/menu.data";
import { FlagIcon } from "./flag-icon";
import { MiniOrderTracker } from "./status-screen";

type OrderType = "dine-in" | "takeaway" | "delivery";

export function DeliveryBlock({
  onOpenMenu,
  address,
  setAddress,
  addressType,
  setAddressType,
  deliveryMethod,
  setDeliveryMethod,
  showAddressError,
  setShowAddressError,
}: {
  onOpenMenu: () => void;
  address: string;
  setAddress: (val: string) => void;
  addressType: "home" | "work" | "dorm";
  setAddressType: (val: "home" | "work" | "dorm") => void;
  deliveryMethod: "leave" | "pickup" | null;
  setDeliveryMethod: (val: "leave" | "pickup" | null) => void;
  showAddressError: boolean;
  setShowAddressError: (val: boolean) => void;
}) {
  const { t } = useLanguage();
  const [touched, setTouched] = useState(false);

  const DELIVERY_METHODS = [
    {
      id: "leave" as const,
      label: t("วางไว้ที่หน้าประตู"),
      sublabel: t("เราวางอาหารไว้ให้"),
      icon: <HomeIcon size={20} />,
    },
    {
      id: "pickup" as const,
      label: t("ลงมารับเอง"),
      sublabel: t("รับที่จุดรับอาหาร"),
      icon: <User size={20} />,
    },
  ];

  const handleAddressChange = (val: string) => {
    setAddress(val);
    setTouched(true);
    if (val.trim().length >= 5) {
      setShowAddressError(false);
    }
  };

  const handleDeliveryMethodChange = (method: "leave" | "pickup" | null) => {
    setDeliveryMethod(method);
    if (address.trim().length >= 5 && method) {
      setShowAddressError(false);
      setTimeout(() => {
        onOpenMenu();
      }, 200);
    } else {
      setShowAddressError(true);
      document.getElementById("delivery-address")?.focus();
    }
  };

  return (
    <div className="space-y-4">
      {/* Address */}
      <div className="flex items-start gap-3">
        <div
          className="grid h-10 w-10 place-items-center rounded-full shrink-0"
          style={{ background: LINEN, color: BRAND }}
        >
          <MapPin size={18} />
        </div>
        <div className="flex-1">
          <label
            htmlFor="delivery-address"
            className="text-[10px] uppercase tracking-[0.12em] mb-1 block"
            style={{ color: INK_MUTED }}
          >
            {t("ที่อยู่จัดส่ง")}
          </label>
          <input
            id="delivery-address"
            name="delivery-address"
            aria-label="ที่อยู่จัดส่ง"
            value={address}
            onChange={(e) => handleAddressChange(e.target.value)}
            onBlur={() => setTouched(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                if (address.trim().length >= 5 && deliveryMethod) {
                  setShowAddressError(false);
                  onOpenMenu();
                } else if (address.trim().length < 5) {
                  setShowAddressError(true);
                }
              }
            }}
            placeholder={t("กรอกที่อยู่ เช่น ถนนสุขุมวิท 31")}
            className="w-full rounded-xl border px-3 py-2.5 text-sm transition"
            style={{
              borderColor:
                showAddressError || (touched && address.trim().length < 5)
                  ? "#ef4444"
                  : address.trim().length >= 5
                    ? "#16a34a"
                    : "#ece4d6",
              outline: "none",
            }}
          />
          {(showAddressError || (touched && address.trim().length < 5)) && (
            <p className="mt-1 text-[11px] text-red-500">
              {t("กรุณากรอกที่อยู่ให้ครบถ้วน (อย่างน้อย 5 ตัวอักษร)")}
            </p>
          )}
          <div className="mt-2.5 flex gap-2">
            {(["home", "work", "dorm"] as const).map((id) => {
              const labels = { home: "บ้าน", work: "ที่ทำงาน", dorm: "หอพัก" };
              return (
                <button
                  key={id}
                  aria-label={`ประเภทที่อยู่ ${t(labels[id])}`}
                  onClick={() => setAddressType(id)}
                  className="px-3 py-1 rounded-full border text-xs font-medium transition cursor-pointer"
                  style={{
                    borderColor: addressType === id ? BRAND : "#ece4d6",
                    background: addressType === id ? BRAND : "white",
                    color: addressType === id ? GOLD : BRAND,
                  }}
                >
                  {t(labels[id])}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Delivery method */}
      <div>
        <p
          className="text-[10px] uppercase tracking-[0.12em] mb-2"
          style={{ color: INK_MUTED }}
        >
          {t("รูปแบบการรับอาหาร")}
        </p>
        {showAddressError && !deliveryMethod && (
          <p className="text-xs text-red-500 font-semibold mb-2">
            {t("* กรุณาเลือกรูปแบบการรับอาหาร")}
          </p>
        )}
        <div
          className="grid grid-cols-2 gap-2"
          style={{
            border: showAddressError && !deliveryMethod ? "1px solid #ef4444" : "none",
            padding: showAddressError && !deliveryMethod ? "4px" : "0px",
            borderRadius: "12px",
          }}
        >
          {DELIVERY_METHODS.map((m) => {
            const active = deliveryMethod === m.id;
            return (
              <button
                key={m.id}
                aria-label={`เลือกรูปแบบการรับอาหาร ${m.label}`}
                onClick={() => handleDeliveryMethodChange(m.id)}
                className="flex flex-col items-start gap-1.5 rounded-xl border-2 p-3 text-left transition cursor-pointer"
                style={{
                  borderColor: active ? BRAND : "#ece4d6",
                  background: active ? "#f0f6fa" : "white",
                }}
              >
                <div
                  className="grid h-9 w-9 place-items-center rounded-lg"
                  style={{
                    background: active ? BRAND : LINEN,
                    color: active ? GOLD : BRAND,
                  }}
                >
                  {m.icon}
                </div>
                <span
                  className="text-xs font-semibold leading-tight"
                  style={{ color: BRAND }}
                >
                  {m.label}
                </span>
                <span className="text-[10px]" style={{ color: INK_MUTED }}>
                  {m.sublabel}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function DineInBlock({
  selectedTable,
  onOpenPicker,
}: {
  selectedTable: string;
  onOpenPicker: () => void;
}) {
  const { t } = useLanguage();
  return (
    <div>
      <div className="flex items-start gap-3">
        <div
          className="grid h-10 w-10 place-items-center rounded-full shrink-0"
          style={{ background: LINEN, color: BRAND }}
        >
          <Utensils size={18} />
        </div>
        <div className="flex-1">
          <p
            className="text-[10px] uppercase tracking-[0.12em]"
            style={{ color: INK_MUTED }}
          >
            {t("ทานที่ร้าน")}
          </p>
          <div className="mt-2">
            <p className="text-sm text-slate-600">
              {t("เลือกโต๊ะจะทำผ่านผังที่นั่ง (เปิด modal)")}
            </p>
            <p className="mt-2 text-sm font-semibold" style={{ color: BRAND }}>
              {selectedTable
                ? `${t("โต๊ะที่เลือก:")} ${selectedTable}`
                : t("ยังไม่ได้เลือกโต๊ะ")}
            </p>
            <div className="mt-3">
              <button
                aria-label="เปิดผังที่นั่งเลือกโต๊ะ"
                onClick={onOpenPicker}
                className="px-4 py-2 rounded-full border cursor-pointer font-medium text-xs transition active:scale-95"
                style={{ borderColor: BRAND, color: BRAND }}
              >
                {t("เปิดผังที่นั่ง")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface HomeScreenProps {
  menuItems: MenuItem[];
  onOpenSidebar: () => void;
  orderType: OrderType | null;
  setOrderType: (m: OrderType | null) => void;
  onPickItem: (m: MenuItem) => void;
  onOpenCart: () => void;
  totalQty: number;
  subtotal: number;
  onOpenMenu: () => void;
  hasActiveOrder: boolean;
  activeOrderNumber: string;
  onGoToStatus: () => void;
  selectedTable: string;
  setSelectedTable: (t: string) => void;
  tables: { id: string; label: string; status: string }[];
  onOpenTablePicker: () => void;
  activeOrderType?: OrderType;
  activeOrderStatus?: string;
  address: string;
  setAddress: (val: string) => void;
  addressType: "home" | "work" | "dorm";
  setAddressType: (val: "home" | "work" | "dorm") => void;
  deliveryMethod: "leave" | "pickup" | null;
  setDeliveryMethod: (val: "leave" | "pickup" | null) => void;
  showAddressError: boolean;
  setShowAddressError: (val: boolean) => void;
  showTypeError: boolean;
  setShowTypeError: (val: boolean) => void;
  isCurrentlyClosed: boolean;
  bypassRealClosed: boolean;
}

export function HomeScreen({
  menuItems,
  onOpenSidebar,
  orderType,
  setOrderType,
  onPickItem,
  onOpenCart,
  totalQty,
  onOpenMenu,
  hasActiveOrder,
  activeOrderNumber,
  onGoToStatus,
  selectedTable,
  onOpenTablePicker,
  activeOrderType,
  activeOrderStatus,
  address,
  setAddress,
  addressType,
  setAddressType,
  deliveryMethod,
  setDeliveryMethod,
  showAddressError,
  setShowAddressError,
  showTypeError,
  setShowTypeError,
  isCurrentlyClosed,
  bypassRealClosed,
}: HomeScreenProps) {
  const { language, setLanguage, t, tMenu } = useLanguage();
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 240; // width of card (220px) + gap (16px)
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const orderTypeRef = useRef<HTMLDivElement>(null);

  return (
    <div className="pb-36" style={{ background: LINEN }}>
      {/* Hero */}
      <div className="relative h-72 md:h-96 w-full overflow-hidden">
        <img
          src={HERO_IMG}
          alt="restaurant"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(0,18,30,0.55) 0%, rgba(0,18,30,0.25) 40%, rgba(0,18,30,0.85) 100%)",
          }}
        />
        <div className="absolute inset-0 max-w-7xl mx-auto w-full h-full px-5 md:px-12 pointer-events-none">
          <div className="relative w-full h-full pointer-events-auto">
            <button
              aria-label="เปิดเมนูด้านข้าง"
              onClick={onOpenSidebar}
              className="absolute top-5 left-5 grid h-10 w-10 place-items-center rounded-full bg-white/15 backdrop-blur-md text-white border border-white/20 cursor-pointer"
            >
              <Menu size={20} />
            </button>

            {/* Language Selector */}
            <div className="absolute top-5 right-24 z-30">
              <button
                aria-label="เปลี่ยนภาษา"
                onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                className="flex items-center bg-black/35 hover:bg-black/45 backdrop-blur-md px-3.5 py-2.5 rounded-full border border-white/20 text-white shadow-md transition-all cursor-pointer min-w-[125px] justify-between h-10 select-none active:scale-95 border-box"
              >
                <div className="flex items-center gap-2">
                  <FlagIcon lang={language} />
                  <span className="font-extrabold text-[11px] tracking-wide whitespace-nowrap">
                    {language === "th"
                      ? "ภาษาไทย"
                      : language === "en"
                        ? "English"
                        : "中文"}
                  </span>
                </div>
                <ChevronDown
                  size={13}
                  className={`opacity-75 transition-transform duration-200 ${langDropdownOpen ? "rotate-180" : ""}`}
                />
              </button>

              {/* Invisible clickaway backdrop */}
              {langDropdownOpen && (
                <div
                  className="fixed inset-0 z-40 cursor-default"
                  onClick={() => setLangDropdownOpen(false)}
                />
              )}

              {/* Premium styled Dropdown Menu */}
              <AnimatePresence>
                {langDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 4, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-0 w-44 bg-black/80 backdrop-blur-lg border border-white/20 rounded-2xl shadow-2xl overflow-hidden z-50 p-1.5 flex flex-col gap-1"
                  >
                    {[
                      { code: "th", label: "ภาษาไทย", text: "Thai" },
                      { code: "en", label: "English", text: "English" },
                      { code: "zh", label: "中文", text: "Chinese" },
                    ].map((item) => {
                      const isActive = language === item.code;
                      return (
                        <button
                          key={item.code}
                          aria-label={`เลือกภาษา ${item.label}`}
                          onClick={() => {
                            setLanguage(item.code as Language);
                            setLangDropdownOpen(false);
                          }}
                          className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-xs font-semibold transition-all active:scale-[0.98] cursor-pointer"
                          style={{
                            background: isActive
                              ? "rgba(252,193,74,0.15)"
                              : "transparent",
                            color: isActive ? "#fcc14a" : "#ffffff",
                            fontWeight: isActive ? "800" : "600",
                          }}
                        >
                          <span className="flex items-center gap-2 tracking-wide">
                            <FlagIcon lang={item.code} />
                            {item.label}
                          </span>
                          {isActive && (
                            <Check
                              size={12}
                              className="text-[#fcc14a]"
                              strokeWidth={3}
                            />
                          )}
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button
              aria-label={`เปิดตะกร้าสินค้า มีสินค้าทั้งหมด ${totalQty} ชิ้น`}
              onClick={onOpenCart}
              className="absolute top-5 right-5 flex items-center gap-1 text-white/90 text-xs bg-white/10 backdrop-blur-md px-3 py-2 rounded-full border border-white/15 cursor-pointer"
            >
              <ShoppingBag size={14} />
              {totalQty > 0 && (
                <span
                  className="ml-1 inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full text-[10px] font-bold"
                  style={{ background: GOLD, color: BRAND }}
                >
                  {totalQty}
                </span>
              )}
            </button>

            <div className="absolute bottom-5 left-5 right-5 text-white">
              <p className="text-xs uppercase tracking-[0.2em] text-white/70">
                EPICUREAN
              </p>
              <h1 className="text-2xl font-bold mt-1">
                {t("สวัสดี, ยินดีต้อนรับ")}
              </h1>
              <p className="text-sm text-white/80 mt-1">
                {t("เลือกประสบการณ์การรับประทาน")}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold border backdrop-blur-sm ${
                    isCurrentlyClosed
                      ? "bg-red-500/20 text-red-400 border-red-500/35"
                      : "bg-emerald-500/20 text-emerald-400 border-emerald-500/35"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full shrink-0 ${isCurrentlyClosed ? "bg-red-400" : "bg-emerald-400"}`}
                  />
                  {isCurrentlyClosed ? t("ปิดบริการ") : t("เปิดบริการ")}
                </span>
                <span className="text-xs font-semibold text-white/90">
                  {isCurrentlyClosed
                    ? language === "th"
                      ? "อา. - ศ. 08:00 - 21:00"
                      : "Sun - Fri 08:00 - 21:00"
                    : "08:00 - 21:00"}
                </span>
                {bypassRealClosed && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/25 px-2 py-0.5 text-[9px] font-bold text-amber-300 border border-amber-500/30">
                    โหมดสาธิต
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mini order status tracker */}
      <AnimatePresence>
        {hasActiveOrder && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ type: "spring", damping: 20, stiffness: 260 }}
            className="px-5 md:px-12 mt-4 max-w-7xl mx-auto w-full"
          >
            <MiniOrderTracker
              orderNumber={activeOrderNumber}
              onGoToStatus={onGoToStatus}
              orderType={activeOrderType || "delivery"}
              status={activeOrderStatus}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Order type tiles */}
      <div ref={orderTypeRef} className="px-5 md:px-12 mt-4 max-w-7xl mx-auto w-full">
        <h3
          className="text-sm font-bold mb-3 flex flex-wrap items-center gap-x-1.5"
          style={{ color: BRAND }}
        >
          <span>
            {t("ช่องทางการรับอาหาร")} <span className="text-red-500">*</span>
          </span>
          {orderType === null && (
            <span className="text-xs text-slate-400 font-normal">
              {t("(กรุณาเลือกช่องทางการรับอาหารด้านบนเพื่อระบุรายละเอียด)")}
            </span>
          )}
        </h3>
        {showTypeError && (
          <p className="text-xs text-red-500 font-semibold mb-3">
            {t(
              "* กรุณาเลือกช่องทางการรับอาหาร (ทานที่ร้าน, จัดส่งถึงที่ หรือ รับกลับบ้าน) ก่อนเริ่มสั่งซื้อ",
            )}
          </p>
        )}
        <div
          className={`grid grid-cols-3 gap-2.5 p-1.5 rounded-2xl transition-all duration-300 ${showTypeError ? "border-2 border-red-500 bg-red-50/20" : "border-2 border-transparent"}`}
        >
          <button
            aria-label="เลือกทานที่ร้าน"
            onClick={() => {
              setOrderType("dine-in");
              setShowTypeError(false);
              onOpenTablePicker();
            }}
            className="rounded-2xl p-3 text-center flex flex-col items-center justify-center gap-2 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 active:scale-95 bg-white border shadow-sm"
            style={{
              background: orderType === "dine-in" ? BRAND : "white",
              color: orderType === "dine-in" ? GOLD : BRAND,
              borderColor: orderType === "dine-in" ? BRAND : "#ece4d6",
              boxShadow:
                orderType === "dine-in"
                  ? "0 6px 20px rgba(0,46,71,0.22)"
                  : "0 2px 8px rgba(0,0,0,0.03)",
            }}
          >
            <div
              className="grid h-9 w-9 place-items-center rounded-xl transition-colors"
              style={{
                background:
                  orderType === "dine-in" ? "rgba(252,193,74,0.18)" : LINEN,
                color: orderType === "dine-in" ? GOLD : BRAND,
              }}
            >
              <Utensils size={17} />
            </div>
            <div className="font-bold text-[12px]">{t("ทานที่ร้าน")}</div>
          </button>

          <button
            aria-label="เลือกรับกลับบ้าน"
            onClick={() => {
              setOrderType("takeaway");
              setShowTypeError(false);
            }}
            className="rounded-2xl p-3 text-center flex flex-col items-center justify-center gap-2 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 active:scale-95 bg-white border shadow-sm"
            style={{
              background: orderType === "takeaway" ? BRAND : "white",
              color: orderType === "takeaway" ? GOLD : BRAND,
              borderColor: orderType === "takeaway" ? BRAND : "#ece4d6",
              boxShadow:
                orderType === "takeaway"
                  ? "0 6px 20px rgba(0,46,71,0.22)"
                  : "0 2px 8px rgba(0,0,0,0.03)",
            }}
          >
            <div
              className="grid h-9 w-9 place-items-center rounded-xl transition-colors"
              style={{
                background:
                  orderType === "takeaway" ? "rgba(252,193,74,0.18)" : LINEN,
                color: orderType === "takeaway" ? GOLD : BRAND,
              }}
            >
              <ShoppingBag size={17} />
            </div>
            <div className="font-bold text-[12px]">{t("รับกลับบ้าน")}</div>
          </button>

          <button
            aria-label="เลือกจัดส่งถึงที่"
            onClick={() => {
              setOrderType("delivery");
              setShowTypeError(false);
            }}
            className="rounded-2xl p-3 text-center flex flex-col items-center justify-center gap-2 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 active:scale-95 bg-white border shadow-sm"
            style={{
              background: orderType === "delivery" ? BRAND : "white",
              color: orderType === "delivery" ? GOLD : BRAND,
              borderColor: orderType === "delivery" ? BRAND : "#ece4d6",
              boxShadow:
                orderType === "delivery"
                  ? "0 6px 20px rgba(0,46,71,0.22)"
                  : "0 2px 8px rgba(0,0,0,0.03)",
            }}
          >
            <div
              className="grid h-9 w-9 place-items-center rounded-xl transition-colors"
              style={{
                background:
                  orderType === "delivery" ? "rgba(252,193,74,0.18)" : LINEN,
                color: orderType === "delivery" ? GOLD : BRAND,
              }}
            >
              <Bike size={17} />
            </div>
            <div className="font-bold text-[12px]">{t("จัดส่งถึงที่")}</div>
          </button>
        </div>
      </div>

      {/* Conditional input for order type */}
      {orderType !== null && (
        <div className="px-5 md:px-12 mt-6 max-w-7xl mx-auto w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={orderType}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              className="w-full bg-white rounded-2xl px-4 py-4 shadow-soft border border-[#ece4d6]"
            >
              {orderType === "delivery" && (
                <DeliveryBlock
                  onOpenMenu={onOpenMenu}
                  address={address}
                  setAddress={setAddress}
                  addressType={addressType}
                  setAddressType={setAddressType}
                  deliveryMethod={deliveryMethod}
                  setDeliveryMethod={setDeliveryMethod}
                  showAddressError={showAddressError}
                  setShowAddressError={setShowAddressError}
                />
              )}
              {orderType === "dine-in" && (
                <DineInBlock
                  selectedTable={selectedTable}
                  onOpenPicker={onOpenTablePicker}
                />
              )}
              {orderType === "takeaway" && (
                <div className="space-y-3 p-1 text-center sm:text-left">
                  <div>
                    <h4 className="font-bold text-sm text-[#002e47] flex items-center justify-center sm:justify-start gap-1.5">
                      <ShoppingBag size={16} /> {t("รับกลับบ้าน")} (Take Away)
                    </h4>
                    <p className="text-xs text-slate-500 leading-normal font-semibold mt-1">
                      {t(
                        "ร้านจะจัดเตรียมแพ็กอาหารใส่กล่องให้อย่างดี คุณสามารถมารับอาหารได้ที่เคาน์เตอร์ร้านเมื่อสถานะเปลี่ยนเป็น",
                      )}
                      <strong className="text-[#059669] mx-1">
                        "{t("พร้อมเสิร์ฟ")}"
                      </strong>
                    </p>
                  </div>
                  <div className="flex items-center justify-center sm:justify-start gap-2.5 pt-1">
                    <button
                      type="button"
                      aria-label="ยอมรับและไปหน้าอาหารทั้งหมด"
                      onClick={() => onOpenMenu()}
                      className="px-5 py-2 rounded-full text-xs font-bold transition-all duration-200 hover:scale-[1.02] active:scale-95 shadow-sm cursor-pointer"
                      style={{ background: BRAND, color: GOLD }}
                    >
                      {t("ยอมรับ")}
                    </button>
                    <button
                      type="button"
                      aria-label="ไม่ยอมรับและยกเลิกการเลือกรับกลับบ้าน"
                      onClick={() => setOrderType(null)}
                      className="px-4 py-2 rounded-full text-xs font-bold border border-slate-300 text-slate-600 hover:bg-slate-50 transition-all duration-200 active:scale-95 cursor-pointer"
                    >
                      {t("ไม่ยอมรับ")}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {/* Menu list (horizontal slider) */}
      <div className="px-5 md:px-12 mt-6 max-w-7xl mx-auto w-full">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold" style={{ color: BRAND }}>
            {t("เมนูแนะนำ")}
          </h2>
        </div>
        <div className="relative">
          {/* Left arrow */}
          <button
            onClick={() => scroll("left")}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 grid h-9 w-9 place-items-center rounded-full bg-white/50 backdrop-blur-[2px] border border-[#ece4d6]/50 hover:bg-white/80 transition shadow-sm cursor-pointer"
            style={{ color: BRAND, marginLeft: -4 }}
            aria-label={t("เลื่อนซ้าย")}
          >
            <ChevronLeft size={18} />
          </button>
          <div
            ref={scrollRef}
            className="-mx-5 px-10 overflow-x-auto no-scrollbar scroll-smooth"
          >
            <div className="flex gap-4">
              {menuItems
                .filter((m) => m.category !== "drinks" && m.category !== "dessert")
                .map((m, i) => (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    onClick={() => {
                      if (!orderType) {
                        setShowTypeError(true);
                        orderTypeRef.current?.scrollIntoView({
                          behavior: "smooth",
                        });
                        return;
                      }
                      if (orderType === "dine-in" && !selectedTable) {
                        onOpenTablePicker();
                        return;
                      }
                      if (
                        orderType === "delivery" &&
                        (!address ||
                          address.trim().length < 5 ||
                          !deliveryMethod)
                      ) {
                        setShowAddressError(true);
                        orderTypeRef.current?.scrollIntoView({
                          behavior: "smooth",
                        });
                        return;
                      }
                      onPickItem(m);
                    }}
                    className="group bg-white rounded-2xl p-3.5 shadow-[0_4px_16px_rgba(0,0,0,0.04)] border border-[#ece4d6]/80 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_28px_rgba(0,46,71,0.12)] min-w-[220px] w-56 shrink-0 flex flex-col justify-between"
                  >
                    <div>
                      <div className="relative h-36 w-full overflow-hidden rounded-xl mb-3">
                        <img
                          src={encodeURI(String(m.image))}
                          alt={tMenu(m.name, "name")}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        {m.category === "signature" && (
                          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#002e47]/85 text-[#fcc14a] backdrop-blur-md border border-[#fcc14a]/30">
                            Signature
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col">
                        <div
                          className="flex items-center gap-1 text-[10px] uppercase tracking-wider"
                          style={{ color: GOLD }}
                        >
                          <Star size={10} fill={GOLD} stroke={GOLD} />
                          <span style={{ color: INK_MUTED }}>
                            {language === "th"
                              ? "Chef's pick"
                              : language === "zh"
                                ? "厨师推荐"
                                : "Chef's pick"}
                          </span>
                        </div>
                        <h3
                          className="font-bold text-[15px] truncate mt-1 group-hover:text-[#002e47] transition-colors"
                          style={{ color: BRAND }}
                        >
                          {tMenu(m.name, "name")}
                        </h3>
                        <p
                          className="text-xs mt-1 line-clamp-2 font-light"
                          style={{ color: INK_MUTED }}
                        >
                          {tMenu(m.desc, "desc")}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3.5 flex items-end justify-between pt-2 border-t border-slate-100">
                      <span
                        className="font-extrabold text-base"
                        style={{ color: BRAND }}
                      >
                        ฿{m.price}
                      </span>
                      <button
                        aria-label={`หยิบ ${tMenu(m.name, "name")} ใส่ตะกร้า`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!orderType) {
                            setShowTypeError(true);
                            orderTypeRef.current?.scrollIntoView({
                              behavior: "smooth",
                            });
                            return;
                          }
                          if (orderType === "dine-in" && !selectedTable) {
                            onOpenTablePicker();
                            return;
                          }
                          if (
                            orderType === "delivery" &&
                            (!address ||
                              address.trim().length < 5 ||
                              !deliveryMethod)
                          ) {
                            setShowAddressError(true);
                            orderTypeRef.current?.scrollIntoView({
                              behavior: "smooth",
                            });
                            return;
                          }
                          onPickItem(m);
                        }}
                        className="grid h-9 w-9 place-items-center rounded-full shadow-md cursor-pointer transition-transform duration-200 active:scale-90 hover:scale-105"
                        style={{ background: BRAND, color: GOLD }}
                      >
                        <Plus size={18} />
                      </button>
                    </div>
                  </motion.div>
                ))}
            </div>
          </div>
          {/* Right arrow */}
          <button
            onClick={() => scroll("right")}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 grid h-9 w-9 place-items-center rounded-full bg-white/50 backdrop-blur-[2px] border border-[#ece4d6]/50 hover:bg-white/80 transition shadow-sm cursor-pointer"
            style={{ color: BRAND, marginRight: -4 }}
            aria-label={t("เลื่อนขวา")}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

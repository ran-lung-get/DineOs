import fs from 'fs';
import path from 'path';

const filePath = path.resolve('src/routes/customer/index.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Helper to normalized newlines for matching
function normalizeText(text) {
  return text.replace(/\r\n/g, '\n').trim();
}

function replaceBlock(oldBlock, newBlock) {
  const normOld = normalizeText(oldBlock);
  const normContent = content.replace(/\r\n/g, '\n');

  if (normContent.includes(normOld)) {
    content = normContent.replace(normOld, newBlock.replace(/\r\n/g, '\n'));
    console.log("Successfully replaced block!");
  } else {
    console.warn("Could not find block to replace:", normOld.substring(0, 100) + "...");
  }
}

// 1. Main container
replaceBlock(
`  return (
    <div
      className="min-h-screen w-full flex items-center justify-center relative"
      style={{
        background:
          "radial-gradient(circle at 20% 20%, #0d2d42 0%, #050d15 65%, #020609 100%)",
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(252,193,74,0.05) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />
      <main
        aria-label="แอปพลิเคชันสั่งอาหาร ร้านลุงเก็ต"
        className="relative overflow-hidden bg-[var(--linen)] no-scrollbar z-10"
        style={{
          width: "min(430px, 100vw)",
          height: "min(932px, 100vh)",
          borderRadius: 28,
          boxShadow: "0 30px 80px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.04)",
        }}
      >`,
`  return (
    <div
      className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-[var(--linen)]"
    >
      <main
        aria-label="แอปพลิเคชันสั่งอาหาร ร้านลุงเก็ต"
        className="relative overflow-hidden bg-[var(--linen)] no-scrollbar z-10 w-full"
        style={{
          height: "100vh",
          height: "100dvh",
        }}
      >`
);

// 2. Fixed Cart Bar width
replaceBlock(
`style={{ left: 16, right: 16, bottom: 24, maxWidth: 430, marginLeft: "auto", marginRight: "auto" }}`,
`style={{ left: 16, right: 16, bottom: 24, maxWidth: 600, marginLeft: "auto", marginRight: "auto" }}`
);

// 3. Status bottom button
replaceBlock(
`        {tab === "status" && (
          <div className="absolute bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur-sm p-4">
            <button
              onClick={resetAll}
              className="w-full h-12 rounded-full font-semibold"
              style={{ background: BRAND, color: "white" }}
            >
              กลับไปยังหน้าหลัก
            </button>
          </div>
        )}`,
`        {tab === "status" && (
          <div className="absolute bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur-sm p-4 flex justify-center">
            <button
              onClick={resetAll}
              className="w-full max-w-md h-12 rounded-full font-semibold"
              style={{ background: BRAND, color: "white" }}
            >
              กลับไปยังหน้าหลัก
            </button>
          </div>
        )}`
);

// 4. Hero section start
replaceBlock(
`      {/* Hero */}
      <div className="relative h-72 w-full overflow-hidden">
        <img src={HERO_IMG} alt="restaurant" className="absolute inset-0 h-full w-full object-cover" />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(0,18,30,0.55) 0%, rgba(0,18,30,0.25) 40%, rgba(0,18,30,0.85) 100%)",
          }}
        />
        <button
          aria-label="เปิดเมนูด้านข้าง"`,
`      {/* Hero */}
      <div className="relative h-72 md:h-96 w-full overflow-hidden">
        <img src={HERO_IMG} alt="restaurant" className="absolute inset-0 h-full w-full object-cover" />
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
              aria-label="เปิดเมนูด้านข้าง"`
);

// 5. Hero section end
replaceBlock(
`            <button
              aria-label="สั่งอาหาร"
              onClick={() => {
                if (!orderType) {
                  setShowTypeError(true);
                  orderTypeRef.current?.scrollIntoView({ behavior: "smooth" });
                  return;
                }
                if (orderType === "dine-in" && !selectedTable) {
                  onOpenTablePicker();
                  return;
                }
                if (orderType === "delivery" && (!address || address.trim().length < 5 || !deliveryMethod)) {
                  setShowAddressError(true);
                  orderTypeRef.current?.scrollIntoView({ behavior: "smooth" });
                  return;
                }
                onOpenMenu();
              }}
              className="inline-flex items-center justify-center rounded-full bg-[#ffcb44] px-4 py-2 text-sm font-semibold shadow-sm cursor-pointer"
              style={{ color: BRAND }}
            >
              {t("สั่งอาหาร")} <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>`,
`            <button
              aria-label="สั่งอาหาร"
              onClick={() => {
                if (!orderType) {
                  setShowTypeError(true);
                  orderTypeRef.current?.scrollIntoView({ behavior: "smooth" });
                  return;
                }
                if (orderType === "dine-in" && !selectedTable) {
                  onOpenTablePicker();
                  return;
                }
                if (orderType === "delivery" && (!address || address.trim().length < 5 || !deliveryMethod)) {
                  setShowAddressError(true);
                  orderTypeRef.current?.scrollIntoView({ behavior: "smooth" });
                  return;
                }
                onOpenMenu();
              }}
              className="inline-flex items-center justify-center rounded-full bg-[#ffcb44] px-4 py-2 text-sm font-semibold shadow-sm cursor-pointer"
              style={{ color: BRAND }}
            >
              {t("สั่งอาหาร")} <ChevronRight size={14} />
            </button>
          </div>
        </div>
        </div>
        </div>
      </div>`
);

// 6. HomeScreen body wrappers
replaceBlock(
`      {/* Mini order status tracker */}
      <AnimatePresence>
        {hasActiveOrder && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ type: "spring", damping: 20, stiffness: 260 }}
            className="px-5 mt-4"
          >`,
`      {/* Mini order status tracker */}
      <AnimatePresence>
        {hasActiveOrder && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ type: "spring", damping: 20, stiffness: 260 }}
            className="px-5 md:px-12 mt-4 max-w-7xl mx-auto w-full"
          >`
);

replaceBlock(
`      {/* Order type tiles */}
      <div ref={orderTypeRef} className="px-5 mt-4">`,
`      {/* Order type tiles */}
      <div ref={orderTypeRef} className="px-5 md:px-12 mt-4 max-w-7xl mx-auto w-full">`
);

replaceBlock(
`      {/* Conditional input for order type */}
      {orderType !== null && (
        <div className="px-5 mt-6">`,
`      {/* Conditional input for order type */}
      {orderType !== null && (
        <div className="px-5 md:px-12 mt-6 max-w-7xl mx-auto w-full">`
);

replaceBlock(
`      {/* Menu list (horizontal slider) */}
      <div className="px-5 mt-6">`,
`      {/* Menu list (horizontal slider) */}
      <div className="px-5 md:px-12 mt-6 max-w-7xl mx-auto w-full">`
);

// 7. Sidebar width
replaceBlock(
`        className="absolute top-0 left-0 bottom-0 w-[78%] z-[70] flex flex-col"`,
`        className="absolute top-0 left-0 bottom-0 w-[78%] md:w-[320px] z-[70] flex flex-col"`
);

// 8. CartDrawer layout
replaceBlock(
`        className="absolute inset-x-0 bottom-0 z-50 bg-white rounded-t-3xl max-h-[85%] flex flex-col"`,
`        className="absolute inset-x-0 bottom-0 md:left-auto md:right-4 md:bottom-4 md:max-w-md md:w-full md:rounded-3xl md:shadow-2xl z-50 bg-white rounded-t-3xl max-h-[85%] flex flex-col"`
);

// 9. ItemModal layout
replaceBlock(
`        className="absolute inset-x-0 bottom-0 top-12 z-50 bg-white rounded-t-3xl overflow-hidden flex flex-col"`,
`        className="absolute inset-x-0 bottom-0 top-12 md:top-24 md:bottom-24 md:max-w-xl md:mx-auto md:rounded-3xl md:shadow-2xl z-50 bg-white overflow-hidden flex flex-col"`
);

// 10. MenuOverlay layout
replaceBlock(
`    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "tween", duration: 0.3 }}
      className="absolute inset-0 z-30 bg-[var(--linen)] flex flex-col"
    >
      <div className="z-20 bg-[var(--linen)] border-b border-slate-200/80 px-5 pt-5 pb-4 backdrop-blur-sm">
        <div className="flex items-center justify-between gap-3">`,
`    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "tween", duration: 0.3 }}
      className="absolute inset-0 z-30 bg-[var(--linen)] flex flex-col"
    >
      <div className="z-20 bg-[var(--linen)] border-b border-slate-200/80 pt-5 pb-4 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-5 w-full">
          <div className="flex items-center justify-between gap-3">`
);

replaceBlock(
`                <span className="relative">{t(cat.label)}</span>
              </button>
            );
          })}
        </div>
      </div>`,
`                <span className="relative">{t(cat.label)}</span>
              </button>
            );
          })}
        </div>
        </div>
      </div>`
);

replaceBlock(
`      <div className="flex-1 overflow-y-auto no-scrollbar px-5 pt-5 pb-32">
        <div className="mt-5 space-y-3">
          {filteredAndSortedItems.length === 0 ? (`,
`      <div className="flex-1 overflow-y-auto no-scrollbar w-full">
        <div className="max-w-7xl mx-auto px-5 pt-5 pb-32">
          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 space-y-0">
            {filteredAndSortedItems.length === 0 ? (`
);

replaceBlock(
`                  </div>
                </div>
              </div>
            ))
          )}
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
            className="absolute z-40"
            style={{ left: 16, right: 16, bottom: 24 }}`,
`                  </div>
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
            className="absolute z-40 w-[calc(100%-32px)] md:max-w-md md:left-1/2 md:-translate-x-1/2 bottom-6 left-4"`
);

// 11. OrderConfirmOverlay layout
replaceBlock(
`  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "tween", duration: 0.3 }}
      className="absolute inset-0 z-40 bg-[var(--surface)] overflow-y-auto no-scrollbar pb-32"
    >
      <div className="px-5 pt-5 pb-6" style={{ background: BRAND, color: "white" }}>
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="grid h-10 w-10 place-items-center rounded-full bg-white/10 border border-white/15"
          >
            <ChevronLeft size={20} color={GOLD} />
          </button>
          <h1 className="text-lg font-bold">รายการสั่งซื้อในตะกร้า</h1>
        </div>
        <p className="text-sm mt-2 text-white/70">ตรวจสอบรายการก่อนชำระเงิน</p>
      </div>

      <div className="px-5 mt-4 space-y-3">`,
`  return (
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
              className="grid h-10 w-10 place-items-center rounded-full bg-white/10 border border-white/15"
            >
              <ChevronLeft size={20} color={GOLD} />
            </button>
            <h1 className="text-lg font-bold">รายการสั่งซื้อในตะกร้า</h1>
          </div>
          <p className="text-sm mt-2 text-white/70">ตรวจสอบรายการก่อนชำระเงิน</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-5 mt-4 space-y-3">`
);

replaceBlock(
`          <input
            type="tel"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value.replace(/\\D/g, "").slice(0, 10));
              setErr("");
            }}
            placeholder="0XX-XXX-XXXX"
            className="mt-2 w-full rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2"
            style={{ borderColor: err ? "#ef4444" : "#ece4d6", color: BRAND }}
          />
          {err && <p className="text-xs text-red-500 mt-1">{err}</p>}
        </div>
      </div>

      <div className="px-5 pb-8 mt-4">
        <button
          onClick={() => {
            if (phone.length < 10) {
              setErr("กรุณากรอกเบอร์โทรให้ครบ 10 หลัก");
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
          <span>ชำระผ่าน Stripe · ฿{grand.toLocaleString()}</span>
        </button>
      </div>
    </motion.div>`,
`          <input
            type="tel"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value.replace(/\\D/g, "").slice(0, 10));
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
                  setErr("กรุณากรอกเบอร์โทรให้ครบ 10 หลัก");
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
              <span>ชำระผ่าน Stripe · ฿{grand.toLocaleString()}</span>
            </button>
          </div>
        </div>
      </div>
    </motion.div>`
);

// 12. PaymentOverlay layout
replaceBlock(
`    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "tween", duration: 0.3 }}
      className="absolute inset-0 z-50 bg-[var(--surface)] overflow-y-auto no-scrollbar pb-32"
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-6 mb-6" style={{ background: BRAND, color: "white" }}>
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="grid h-10 w-10 place-items-center rounded-full bg-white/10 border border-white/15 cursor-pointer"
          >
            <ChevronLeft size={20} color={GOLD} />
          </button>
          <h1 className="text-lg font-bold">ชำระเงินค่าอาหาร</h1>
        </div>
      </div>

      <div className="px-5 space-y-4">`,
`    <motion.div
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
            <h1 className="text-lg font-bold">ชำระเงินค่าอาหาร</h1>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-5 space-y-4">`
);

// 13. StatusScreen layout
replaceBlock(
`  return (
    <div className="min-h-full pb-28 relative" style={{ background: SURFACE }}>
      {/* Reassurance Banner */}
      {currentStatus === "ขอคืนเงิน" && (`,
`  return (
    <div className="min-h-full pb-28 relative w-full" style={{ background: SURFACE }}>
      <div className="max-w-2xl mx-auto w-full">
        {/* Reassurance Banner */}
        {currentStatus === "ขอคืนเงิน" && (`
);

replaceBlock(
`      {/* Cancellation Dialog Overlay */}
      <AnimatePresence>
        {showCancelDialog && (`,
`      </div>
      {/* Cancellation Dialog Overlay */}
      <AnimatePresence>
        {showCancelDialog && (`
);

// 14. HistoryOverlay layout
replaceBlock(
`    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "tween", duration: 0.3 }}
      className="absolute inset-0 z-30 bg-[var(--surface)] flex flex-col"
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-4" style={{ background: BRAND, color: "white" }}>
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="grid h-10 w-10 place-items-center rounded-full bg-white/10 border border-white/15"
          >
            <ChevronLeft size={20} color={GOLD} />
          </button>
          <div>
            <h1 className="text-lg font-bold">ประวัติการสั่งซื้อ</h1>
            <p className="text-xs text-white/60">{orderHistory.length} รายการ</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-5 pt-5 pb-8 space-y-4">`,
`    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "tween", duration: 0.3 }}
      className="absolute inset-0 z-30 bg-[var(--surface)] flex flex-col"
    >
      {/* Header */}
      <div className="w-full" style={{ background: BRAND, color: "white" }}>
        <div className="max-w-2xl mx-auto px-5 pt-5 pb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="grid h-10 w-10 place-items-center rounded-full bg-white/10 border border-white/15"
            >
              <ChevronLeft size={20} color={GOLD} />
            </button>
            <div>
              <h1 className="text-lg font-bold">ประวัติการสั่งซื้อ</h1>
              <p className="text-xs text-white/60">{orderHistory.length} รายการ</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar w-full">
        <div className="max-w-2xl mx-auto px-5 pt-5 pb-8 space-y-4">`
);

replaceBlock(
`        )}
      </div>
    </motion.div>`,
`        )}
      </div>
      </div>
    </motion.div>`
);

// 15. ContactOverlay layout
replaceBlock(
`    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "tween", duration: 0.3 }}
      className="absolute inset-0 z-30 bg-[var(--surface)] flex flex-col"
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-4 flex items-center justify-between" style={{ background: BRAND, color: "white" }}>
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="grid h-10 w-10 place-items-center rounded-full bg-white/10 border border-white/15"
          >
            <ChevronLeft size={20} color={GOLD} />
          </button>
          <h1 className="text-lg font-bold">ข้อมูลร้านค้า</h1>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar pb-10">`,
`    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "tween", duration: 0.3 }}
      className="absolute inset-0 z-30 bg-[var(--surface)] flex flex-col"
    >
      {/* Header */}
      <div className="w-full" style={{ background: BRAND, color: "white" }}>
        <div className="max-w-2xl mx-auto px-5 pt-5 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="grid h-10 w-10 place-items-center rounded-full bg-white/10 border border-white/15"
            >
              <ChevronLeft size={20} color={GOLD} />
            </button>
            <h1 className="text-lg font-bold">ข้อมูลร้านค้า</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar w-full pb-10">
        <div className="max-w-2xl mx-auto px-5">`
);

replaceBlock(
`            ))}
          </div>

        </div>

      </div>
    </motion.div>`,
`            ))}
          </div>

        </div>
        </div>

      </div>
    </motion.div>`
);

// 16. StoreClosedOverlay layout
replaceBlock(
`    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 bg-[var(--surface)] flex flex-col"
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-4 flex items-center justify-between shadow-sm" style={{ background: BRAND, color: "white" }}>
        <button
          onClick={onOpenSidebar}
          className="grid h-10 w-10 place-items-center rounded-full bg-white/10 border border-white/15 active:scale-95 transition-transform"
        >
          <Menu size={20} color={GOLD} />
        </button>
        <span className="text-xs uppercase tracking-[0.25em] text-white/60 font-bold">EPICUREAN</span>
        <div className="w-10" />
      </div>

      {/* Main Banner */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-6 py-6 flex flex-col justify-between">`,
`    <motion.div
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
            className="grid h-10 w-10 place-items-center rounded-full bg-white/10 border border-white/15 active:scale-95 transition-transform"
          >
            <Menu size={20} color={GOLD} />
          </button>
          <span className="text-xs uppercase tracking-[0.25em] text-white/60 font-bold">EPICUREAN</span>
          <div className="w-10" />
        </div>
      </div>

      {/* Main Banner */}
      <div className="flex-1 overflow-y-auto no-scrollbar w-full">
        <div className="max-w-2xl mx-auto px-6 py-6 flex flex-col justify-between h-full min-h-[calc(100vh-80px)]">`
);

replaceBlock(
`            เข้าสู่หน้าร้าน (โหมดสาธิตสำหรับทดสอบ)
          </button>
          <p className="text-[10px] text-slate-400 text-center">
            * ปุ่มด้านบนสำหรับผู้ตรวจสอบเพื่อทดสอบการใช้งานในวันหยุด/นอกเวลา
          </p>
        </div>
      </div>
    </motion.div>`,
`            เข้าสู่หน้าร้าน (โหมดสาธิตสำหรับทดสอบ)
          </button>
          <p className="text-[10px] text-slate-400 text-center">
            * ปุ่มด้านบนสำหรับผู้ตรวจสอบเพื่อทดสอบการใช้งาน in วันหยุด/นอกเวลา
          </p>
        </div>
        </div>
      </div>
    </motion.div>`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log("Completed applying responsive conversions!");

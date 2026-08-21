import { useMemo, useState, useEffect } from "react";
import { motion } from "motion/react";
import { X, Check, Minus, Plus } from "lucide-react";
import { useLanguage } from "../../lib/i18n";
import { type MenuItem, type CartLine } from "../../types";
import { PROTEINS, SIZES, TOPPINGS } from "../../constants/menu.data";
import { BRAND, GOLD, INK_MUTED } from "../../constants/theme";

interface ItemModalProps {
  item: MenuItem;
  onClose: () => void;
  onAdd: (line: CartLine) => void;
  checkOptionOutOfStock: (optionId: string) => boolean;
  cartLine?: CartLine;
}

export function ItemModal({
  item,
  onClose,
  onAdd,
  checkOptionOutOfStock,
  cartLine,
}: ItemModalProps) {
  const { t, tMenu } = useLanguage();
  const [qty, setQty] = useState(cartLine ? cartLine.qty : 1);
  const [options, setOptions] = useState<Record<string, string>>(() => {
    if (cartLine) {
      const { protein, size, ...rest } = cartLine.options;
      return rest;
    }
    const o: Record<string, string> = {};
    item.options?.forEach((g) => (o[g.id] = g.choices[0].id));
    return o;
  });
  const [selectedAddons, setSelectedAddons] = useState<string[]>(() => {
    if (cartLine && (item.category === "drinks" || item.category === "dessert")) {
      return cartLine.addons.map((a) => a.id);
    }
    return [];
  });
  const [note, setNote] = useState(cartLine ? cartLine.note : "");

  const isFood = item.category !== "drinks" && item.category !== "dessert";

  // Dynamic default protein selection based on item name
  const defaultProteinId = useMemo(() => {
    if (!isFood) return "";
    const found = PROTEINS.find(
      (p) => p.name !== "ไม่เอาเนื้อสัตว์" && item.name.includes(p.name),
    );
    return found ? found.id : "p_minced_pork";
  }, [item.name, isFood]);

  const [protein, setProtein] = useState(() => {
    if (cartLine && isFood && cartLine.options.protein) {
      const found = PROTEINS.find((p) => p.name === cartLine.options.protein);
      if (found) return found.id;
    }
    if (!isFood) return "";
    const found = PROTEINS.find(
      (p) => p.name !== "ไม่เอาเนื้อสัตว์" && item.name.includes(p.name),
    );
    return found ? found.id : "p_minced_pork";
  });
  const [size, setSize] = useState(() => {
    if (cartLine && isFood && cartLine.options.size) {
      const found = SIZES.find((s) => s.name === cartLine.options.size);
      if (found) return found.id;
    }
    return "s_regular";
  });
  const [selectedToppings, setSelectedToppings] = useState<string[]>(() => {
    if (cartLine && isFood) {
      return cartLine.addons.map((a) => a.id);
    }
    return [];
  });

  // Auto-switch to first available protein if selected protein is out of stock
  useEffect(() => {
    if (!isFood || !protein) return;
    const isCurrentOutOfStock = checkOptionOutOfStock(protein);
    if (isCurrentOutOfStock) {
      const firstAvailable = PROTEINS.find((p) => !checkOptionOutOfStock(p.id));
      if (firstAvailable) {
        setProtein(firstAvailable.id);
      } else {
        setProtein("p_no_meat"); // Fallback to no meat
      }
    }
  }, [protein, isFood, checkOptionOutOfStock]);

  // Calculate base price excluding default protein price
  const basePrice = useMemo(() => {
    if (!isFood) return item.price;
    const defaultProtein = PROTEINS.find((p) => p.id === defaultProteinId);
    const defaultProteinPrice = defaultProtein ? defaultProtein.price : 0;
    return Math.max(0, item.price - defaultProteinPrice);
  }, [item.price, defaultProteinId, isFood]);

  // Total unit price
  const unitPrice = useMemo(() => {
    if (!isFood) {
      const addonTotal = (item.addons ?? [])
        .filter((a) => selectedAddons.includes(a.id))
        .reduce((s, a) => s + a.price, 0);
      return item.price + addonTotal;
    }

    const proteinItem = PROTEINS.find((p) => p.id === protein);
    const proteinPrice = proteinItem ? proteinItem.price : 0;

    const sizeItem = SIZES.find((s) => s.id === size);
    const sizePrice = sizeItem ? sizeItem.price : 0;

    const toppingsPrice = TOPPINGS.filter((t) => selectedToppings.includes(t.id)).reduce(
      (sum, t) => sum + t.price,
      0,
    );

    return basePrice + proteinPrice + toppingsPrice + sizePrice;
  }, [isFood, item.price, selectedAddons, protein, size, selectedToppings, basePrice]);

  const total = unitPrice * qty;

  // Custom formatted dish name for cart
  const formattedName = useMemo(() => {
    if (!isFood) return tMenu(item.name, "name");

    let name = tMenu(item.name, "name");
    const defaultProtein = PROTEINS.find((p) => p.id === defaultProteinId);
    const proteinItem = PROTEINS.find((p) => p.id === protein);

    if (defaultProtein && proteinItem && defaultProtein.id !== proteinItem.id) {
      const newProteinName = proteinItem.name === "ไม่เอาเนื้อสัตว์" ? "" : t(proteinItem.name);
      const defaultProteinNameTranslated = t(defaultProtein.name);
      if (name.includes(defaultProteinNameTranslated)) {
        name = name.replace(defaultProteinNameTranslated, newProteinName);
      } else {
        name = name.trim() + " " + newProteinName;
      }
    }

    const sizeItem = SIZES.find((s) => s.id === size);
    if (sizeItem && sizeItem.id === "s_special") {
      const specialLabel = ` (${t("พิเศษ")})`;
      if (!name.includes(specialLabel)) {
        name += specialLabel;
      }
    }

    return name;
  }, [item.name, isFood, defaultProteinId, protein, size, t, tMenu]);

  const handleAdd = () => {
    if (!isFood) {
      const addons = (item.addons ?? [])
        .filter((a) => selectedAddons.includes(a.id))
        .map((a) => ({ id: a.id, name: a.name, price: a.price }));

      onAdd({
        id: cartLine ? cartLine.id : `${item.id}-${Date.now()}`,
        itemId: item.id,
        name: item.name,
        price: unitPrice,
        qty,
        addons,
        options,
        note,
        image: item.image,
      });
      return;
    }

    const toppingsList = TOPPINGS.filter((t) => selectedToppings.includes(t.id));
    const addons = toppingsList.map((t) => ({
      id: t.id,
      name: t.name,
      price: t.price,
    }));

    onAdd({
      id: cartLine ? cartLine.id : `${item.id}-${Date.now()}`,
      itemId: item.id,
      name: formattedName,
      price: unitPrice,
      qty,
      addons,
      options: {
        ...options,
        protein: PROTEINS.find((p) => p.id === protein)?.name || "",
        size: SIZES.find((s) => s.id === size)?.name || "",
      },
      note,
      image: item.image,
    });
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/50 z-50"
      />
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 280 }}
        className="absolute inset-x-0 bottom-0 top-12 md:top-24 md:bottom-24 md:max-w-xl md:mx-auto md:rounded-3xl md:shadow-2xl z-50 bg-white overflow-hidden flex flex-col"
      >
        <div className="px-5 pt-5 pb-4 border-b" style={{ borderColor: "#f1ece4" }}>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                {t("ระบุความต้องการพิเศษ")}
              </p>
              <h2 className="text-2xl font-bold truncate" style={{ color: BRAND }}>
                {formattedName}
              </h2>
              <p className="mt-2 text-sm text-slate-600">{tMenu(item.desc, "desc")}</p>
              <p className="mt-3 text-xl font-bold" style={{ color: BRAND }}>
                ฿{unitPrice}
              </p>
            </div>
            <button
              onClick={onClose}
              className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-slate-700 shadow-sm cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar px-5 pt-5 pb-32">
          {item.options?.map((g) => (
            <div key={g.id} className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold" style={{ color: BRAND }}>
                  {t(g.name)}
                </h3>
                <span
                  className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full"
                  style={{ background: "#fff2d6", color: BRAND }}
                >
                  {t("จำเป็น")}
                </span>
              </div>
              <div className="space-y-2">
                {g.choices.map((c) => {
                  const active = options[g.id] === c.id;
                  return (
                    <button
                      key={c.id}
                      aria-label={`เลือก ${t(c.label)}`}
                      onClick={() => setOptions({ ...options, [g.id]: c.id })}
                      className="w-full flex items-center justify-between rounded-xl border px-4 py-3 text-left cursor-pointer"
                      style={{
                        borderColor: active ? BRAND : "#ece4d6",
                        background: active ? "#fff8e6" : "white",
                      }}
                    >
                      <span className="text-sm font-medium" style={{ color: BRAND }}>
                        {t(c.label)}
                      </span>
                      <span
                        className="grid h-5 w-5 place-items-center rounded-full border-2"
                        style={{ borderColor: active ? BRAND : "#cbd5d8" }}
                      >
                        {active && (
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ background: BRAND }}
                          />
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {isFood ? (
            <>
              {/* Choose Protein */}
              <div className="mt-6">
                <div className="flex items-center justify-between mb-2.5">
                  <h3
                    className="font-semibold text-sm flex items-center gap-1.5"
                    style={{ color: BRAND }}
                  >
                    🥩 {t("เลือกเนื้อสัตว์")}
                  </h3>
                  <span
                    className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                    style={{ background: "#fff2d6", color: BRAND }}
                  >
                    {t("จำเป็น")}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {PROTEINS.map((p) => {
                    const active = protein === p.id;
                    const isOutOfStock = checkOptionOutOfStock(p.id);
                    return (
                      <button
                        key={p.id}
                        disabled={isOutOfStock}
                        aria-label={`เลือกวัตถุดิบ ${t(p.name)}`}
                        onClick={() => setProtein(p.id)}
                        className="flex items-center justify-between rounded-xl border p-3 text-left transition duration-150 relative overflow-hidden"
                        style={{
                          borderColor: active ? BRAND : isOutOfStock ? "#f1f5f9" : "#ece4d6",
                          background: active ? "#fffcf5" : isOutOfStock ? "#f8fafc" : "white",
                          opacity: isOutOfStock ? 0.5 : 1,
                          cursor: isOutOfStock ? "not-allowed" : "pointer",
                        }}
                      >
                        <span
                          className={`text-xs font-semibold ${isOutOfStock ? "line-through text-slate-400" : ""}`}
                          style={{ color: isOutOfStock ? undefined : BRAND }}
                        >
                          {t(p.name)} {isOutOfStock && `(${t("หมด")})`}
                        </span>
                        <span
                          className="text-[11px] font-bold"
                          style={{ color: active ? BRAND : INK_MUTED }}
                        >
                          {isOutOfStock ? "" : p.price > 0 ? `+${p.price} ฿` : t("ฟรี")}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Choose Size */}
              <div className="mt-6">
                <h3
                  className="font-semibold text-sm flex items-center gap-1.5 mb-2.5"
                  style={{ color: BRAND }}
                >
                  ⚖️ {t("ขนาด")}
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {SIZES.map((s) => {
                    const active = size === s.id;
                    return (
                      <button
                        key={s.id}
                        aria-label={`เลือกขนาด ${t(s.name)}`}
                        onClick={() => setSize(s.id)}
                        className="flex items-center justify-between rounded-xl border px-4 py-3 text-left transition duration-150 cursor-pointer"
                        style={{
                          borderColor: active ? BRAND : "#ece4d6",
                          background: active ? "#fffcf5" : "white",
                        }}
                      >
                        <span className="text-xs font-semibold" style={{ color: BRAND }}>
                          {t(s.name)}
                        </span>
                        <span className="text-[11px] font-bold" style={{ color: BRAND }}>
                          {s.price > 0 ? `+${s.price} ฿` : t("ฟรี")}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Choose Toppings */}
              <div className="mt-6">
                <h3
                  className="font-semibold text-sm flex items-center gap-1.5 mb-2.5"
                  style={{ color: BRAND }}
                >
                  🥚 {t("เลือกท็อปปิ้งเพิ่มเติม")}
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {TOPPINGS.map((topping) => {
                    const active = selectedToppings.includes(topping.id);
                    const isOutOfStock = checkOptionOutOfStock(topping.id);
                    return (
                      <button
                        key={topping.id}
                        disabled={isOutOfStock}
                        aria-label={`เลือกท็อปปิ้ง ${t(topping.name)}`}
                        onClick={() =>
                          setSelectedToppings((prev) =>
                            active ? prev.filter((id) => id !== topping.id) : [...prev, topping.id],
                          )
                        }
                        className="flex items-center justify-between rounded-xl border p-3 text-left transition duration-150 relative overflow-hidden"
                        style={{
                          borderColor: active ? BRAND : isOutOfStock ? "#f1f5f9" : "#ece4d6",
                          background: active ? "#fffcf5" : isOutOfStock ? "#f8fafc" : "white",
                          opacity: isOutOfStock ? 0.5 : 1,
                          cursor: isOutOfStock ? "not-allowed" : "pointer",
                        }}
                      >
                        <span className="flex items-center gap-2">
                          <span
                            className="grid h-4 w-4 place-items-center rounded border"
                            style={{
                              borderColor: active ? BRAND : "#cbd5d8",
                              background: active ? BRAND : "transparent",
                            }}
                          >
                            {active && <Check size={10} color={GOLD} strokeWidth={4} />}
                          </span>
                          <span
                            className={`text-xs font-medium ${isOutOfStock ? "line-through text-slate-400" : ""}`}
                            style={{ color: isOutOfStock ? undefined : BRAND }}
                          >
                            {t(topping.name)} {isOutOfStock && `(${t("หมด")})`}
                          </span>
                        </span>
                        <span className="text-[11px] font-bold" style={{ color: BRAND }}>
                          {isOutOfStock ? "" : `+${topping.price} ฿`}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            item.addons &&
            item.addons.length > 0 && (
              <div className="mt-6">
                <h3 className="font-semibold mb-2" style={{ color: BRAND }}>
                  {t("เพิ่มเติม")}
                </h3>
                <div className="space-y-2">
                  {item.addons.map((a) => {
                    const active = selectedAddons.includes(a.id);
                    return (
                      <button
                        key={a.id}
                        aria-label={`เลือกเพิ่มเติม ${a.name}`}
                        onClick={() =>
                          setSelectedAddons((s) =>
                            active ? s.filter((x) => x !== a.id) : [...s, a.id],
                          )
                        }
                        className="w-full flex items-center justify-between rounded-xl border px-4 py-3 text-left cursor-pointer"
                        style={{
                          borderColor: active ? BRAND : "#ece4d6",
                          background: active ? "#fff8e6" : "white",
                        }}
                      >
                        <span className="flex items-center gap-3">
                          <span
                            className="grid h-5 w-5 place-items-center rounded-md border-2"
                            style={{
                              borderColor: active ? BRAND : "#cbd5d8",
                              background: active ? BRAND : "transparent",
                            }}
                          >
                            {active && <Check size={12} color={GOLD} strokeWidth={3} />}
                          </span>
                          <span className="text-sm font-medium" style={{ color: BRAND }}>
                            + {t(a.name)}
                          </span>
                        </span>
                        <span className="text-sm font-semibold" style={{ color: BRAND }}>
                          {a.price} ฿
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )
          )}

          <div className="mt-6">
            <label
              htmlFor="special-instructions"
              className="font-semibold mb-2 block text-sm"
              style={{ color: BRAND }}
            >
              {t("ระบุความต้องการพิเศษ")}
            </label>
            <textarea
              id="special-instructions"
              name="special-instructions"
              aria-label={t("ระบุความต้องการพิเศษ")}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t("เช่น ไม่ใส่ผัก, รสจัดพิเศษ")}
              className="w-full rounded-xl border bg-white p-3 text-sm focus:outline-none focus:ring-2"
              style={{ borderColor: "#ece4d6", color: BRAND, minHeight: 80 }}
            />
          </div>
        </div>

        {/* sticky footer */}
        <div
          className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t"
          style={{ borderColor: "#f1ece4" }}
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-[var(--surface)] rounded-full p-1">
              <button
                aria-label={t("ลดจำนวนชิ้น")}
                onClick={() => setQty(Math.max(1, qty - 1))}
                className="grid h-9 w-9 place-items-center rounded-full cursor-pointer"
                style={{ background: "white", color: BRAND }}
              >
                <Minus size={16} />
              </button>
              <span className="w-7 text-center font-bold" style={{ color: BRAND }}>
                {qty}
              </span>
              <button
                aria-label={t("เพิ่มจำนวนชิ้น")}
                onClick={() => setQty(qty + 1)}
                className="grid h-9 w-9 place-items-center rounded-full cursor-pointer"
                style={{ background: BRAND, color: GOLD }}
              >
                <Plus size={16} />
              </button>
            </div>
            <button
              aria-label={
                cartLine
                  ? `บันทึกการแก้ไข ${formattedName} จำนวน ${qty} ชิ้น รวมราคา ${total} บาท`
                  : `เพิ่ม ${formattedName} ลงตะกร้า จำนวน ${qty} ชิ้น รวมราคา ${total} บาท`
              }
              onClick={handleAdd}
              className="flex-1 h-12 rounded-full font-semibold flex items-center justify-between px-5 transition active:scale-95 cursor-pointer"
              style={{ background: BRAND, color: "white" }}
            >
              <span>{cartLine ? t("บันทึกการแก้ไข") : t("เพิ่มลงตะกร้า")}</span>
              <span>฿{total}</span>
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}

import { useState, useEffect, useRef } from "react";
import { MENU } from "../../constants/menu.data";
import { type MenuItemDB, type OptionGroup, type Addon } from "../../types";
import {
  getMongoMenuItems,
  saveMongoMenuItem,
  deleteMongoMenuItem,
} from "../../lib/api/mongo.functions";
import {
  Search,
  Plus,
  Trash2,
  Edit3,
  Eye,
  EyeOff,
  Flame,
  Image,
  Tag,
  FileText,
  DollarSign,
  Grip,
  X,
} from "lucide-react";

export const MENU_CATEGORIES = [
  { id: "signature", label: "Signature", emoji: "⭐" },
  { id: "main", label: "อาหารจานเดียว", emoji: "🍛" },
  { id: "noodles", label: "เมนูเส้น", emoji: "🍜" },
  { id: "rice", label: "ข้าวผัด", emoji: "🍚" },
  { id: "vegetarian", label: "มังสวิรัติ", emoji: "🥗" },
  { id: "drinks", label: "เครื่องดื่ม", emoji: "🥤" },
  { id: "dessert", label: "ของหวาน", emoji: "🍨" },
];

export function MenuManagementView() {
  const [menuItems, setMenuItems] = useState<MenuItemDB[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [editItem, setEditItem] = useState<MenuItemDB | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formCategory, setFormCategory] = useState("signature");
  const [formIsSpicy, setFormIsSpicy] = useState(false);
  const [formImageUrl, setFormImageUrl] = useState("");
  const [formImagePath, setFormImagePath] = useState("");
  const [formOptions, setFormOptions] = useState<OptionGroup[]>([]);
  const [formAddons, setFormAddons] = useState<Addon[]>([]);
  const [formStaffNote, setFormStaffNote] = useState("");

  const fetchMenuItems = async () => {
    setLoading(true);
    try {
      const res = await getMongoMenuItems();
      if (res.success && res.data && res.data.length > 0) {
        const mapped: MenuItemDB[] = res.data.map((m: any, i: number) => ({
          id: m.id || `m_${i}`,
          name: m.name,
          description: m.desc || m.description || "",
          price: Number(m.price),
          image: m.image || "",
          image_url: m.image_url || m.image || null,
          category: m.category,
          is_available: m.isAvailable ?? m.is_available ?? true,
          is_spicy: m.isSpicy ?? m.is_spicy ?? false,
          sort_order: m.sort_order ?? i,
          options: m.options || null,
          addons: m.addons || null,
          staff_note: m.staff_note || null,
        }));
        setMenuItems(mapped);
      } else {
        const fallback: MenuItemDB[] = MENU.map((m, i) => ({
          id: m.id,
          name: m.name,
          description: m.desc,
          price: m.price,
          image: m.image,
          image_url: null,
          category: m.category,
          is_available: true,
          is_spicy: m.spicy || false,
          sort_order: i,
          options: m.options || null,
          addons: m.addons || null,
          staff_note: null,
        }));
        setMenuItems(fallback);
      }
    } catch {
      const fallback: MenuItemDB[] = MENU.map((m, i) => ({
        id: m.id,
        name: m.name,
        description: m.desc,
        price: m.price,
        image: m.image,
        image_url: null,
        category: m.category,
        is_available: true,
        is_spicy: m.spicy || false,
        sort_order: i,
        options: m.options || null,
        addons: m.addons || null,
        staff_note: null,
      }));
      setMenuItems(fallback);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const openAddForm = () => {
    setEditItem(null);
    setFormName("");
    setFormDesc("");
    setFormPrice("");
    setFormCategory("signature");
    setFormIsSpicy(false);
    setFormImageUrl("");
    setFormImagePath("");
    setFormOptions([]);
    setFormAddons([]);
    setFormStaffNote("");
    setIsFormOpen(true);
  };

  const openEditForm = (item: MenuItemDB) => {
    setEditItem(item);
    setFormName(item.name);
    setFormDesc(item.description || "");
    setFormPrice(String(item.price));
    setFormCategory(item.category);
    setFormIsSpicy(item.is_spicy);
    setFormImageUrl(item.image_url || item.image || "");
    setFormImagePath(item.image || "");
    setFormOptions(
      Array.isArray(item.options)
        ? item.options.map((og: any) => ({
            id: og.id || String(Math.random()),
            name: og.name || "",
            choices: Array.isArray(og.choices) ? og.choices : [],
          }))
        : [],
    );
    setFormAddons(
      Array.isArray(item.addons)
        ? item.addons.map((a: any) => ({
            id: a.id || String(Math.random()),
            name: a.name || "",
            price: Number(a.price) || 0,
          }))
        : [],
    );
    setFormStaffNote(item.staff_note || "");
    setIsFormOpen(true);
  };

  const handleImageUpload = async (file: File) => {
    setUploadingImage(true);
    try {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setFormImageUrl(ev.target?.result as string);
        setUploadingImage(false);
      };
      reader.readAsDataURL(file);
    } catch (e: any) {
      console.warn("Image preview failed:", e?.message);
      setUploadingImage(false);
    }
  };

  const generateId = (name: string) => {
    return (
      "m_" +
      name
        .replace(/[^a-zA-Z0-9ก-๙]/g, "_")
        .toLowerCase()
        .slice(0, 30) +
      "_" +
      Date.now()
    );
  };

  const saveMenuItem = async () => {
    if (!formName.trim() || !formPrice) return;
    setSaving(true);
    const price = parseFloat(formPrice);
    const id = editItem ? editItem.id : generateId(formName);
    const payload: any = {
      id,
      name: formName.trim(),
      desc: formDesc.trim() || undefined,
      price,
      category: formCategory,
      isSpicy: formIsSpicy,
      isAvailable: editItem ? editItem.is_available : true,
      image: formImageUrl || formImagePath || "/thai_food_hero.jpg",
      options: formOptions.length > 0 ? formOptions : undefined,
      addons: formAddons.length > 0 ? formAddons : undefined,
    };

    try {
      await saveMongoMenuItem({ data: payload });
      const updatedItem: MenuItemDB = {
        id,
        name: payload.name,
        description: payload.desc || "",
        price: payload.price,
        image: payload.image,
        image_url: payload.image,
        category: payload.category,
        is_available: payload.isAvailable,
        is_spicy: payload.isSpicy,
        sort_order: editItem ? editItem.sort_order : menuItems.length,
        options: payload.options || null,
        addons: payload.addons || null,
        staff_note: formStaffNote.trim() || null,
      };

      if (editItem) {
        setMenuItems((prev) => prev.map((m) => (m.id === id ? updatedItem : m)));
      } else {
        setMenuItems((prev) => [...prev, updatedItem]);
      }
      setIsFormOpen(false);
    } catch (e: any) {
      alert("บันทึกไม่สำเร็จ: " + (e?.message || "เกิดข้อผิดพลาด"));
    } finally {
      setSaving(false);
    }
  };

  const deleteMenuItem = async (item: MenuItemDB) => {
    if (!confirm(`คุณต้องการลบเมนู "${item.name}" ออกจากระบบใช่หรือไม่?`)) return;
    try {
      await deleteMongoMenuItem({ data: { id: item.id } });
      setMenuItems((prev) => prev.filter((m) => m.id !== item.id));
      if (isFormOpen && editItem?.id === item.id) setIsFormOpen(false);
    } catch (e: any) {
      alert("ลบไม่สำเร็จ: " + (e?.message || "เกิดข้อผิดพลาด"));
    }
  };

  const toggleAvailability = async (item: MenuItemDB) => {
    const next = !item.is_available;
    setMenuItems((prev) =>
      prev.map((m) => (m.id === item.id ? { ...m, is_available: next } : m)),
    );
    try {
      await saveMongoMenuItem({
        data: {
          id: item.id,
          name: item.name,
          desc: item.description || undefined,
          price: item.price,
          image: item.image || item.image_url || "/thai_food_hero.jpg",
          category: item.category,
          isAvailable: next,
          isSpicy: item.is_spicy,
        },
      });
    } catch {}
  };

  // Option group helpers
  const addOptionGroup = () => {
    setFormOptions((prev) => [...prev, { id: "og_" + Date.now(), name: "", choices: [] }]);
  };
  const removeOptionGroup = (idx: number) => {
    setFormOptions((prev) => prev.filter((_, i) => i !== idx));
  };
  const updateOptionGroupName = (idx: number, name: string) => {
    setFormOptions((prev) => prev.map((og, i) => (i === idx ? { ...og, name } : og)));
  };
  const addChoice = (ogIdx: number) => {
    setFormOptions((prev) =>
      prev.map((og, i) =>
        i === ogIdx
          ? {
              ...og,
              choices: [
                ...og.choices,
                { id: "c_" + Date.now(), label: "", price: undefined },
              ],
            }
          : og,
      ),
    );
  };
  const removeChoice = (ogIdx: number, cIdx: number) => {
    setFormOptions((prev) =>
      prev.map((og, i) =>
        i === ogIdx ? { ...og, choices: og.choices.filter((_, ci) => ci !== cIdx) } : og,
      ),
    );
  };
  const updateChoice = (ogIdx: number, cIdx: number, field: string, value: string) => {
    setFormOptions((prev) =>
      prev.map((og, i) =>
        i === ogIdx
          ? {
              ...og,
              choices: og.choices.map((c, ci) =>
                ci === cIdx
                  ? {
                      ...c,
                      [field]:
                        field === "price"
                          ? value === ""
                            ? undefined
                            : Number(value)
                          : value,
                    }
                  : c,
              ),
            }
          : og,
      ),
    );
  };

  // Addon helpers
  const addAddon = () => {
    setFormAddons((prev) => [...prev, { id: "a_" + Date.now(), name: "", price: 0 }]);
  };
  const removeAddon = (idx: number) => {
    setFormAddons((prev) => prev.filter((_, i) => i !== idx));
  };
  const updateAddon = (idx: number, field: string, value: string) => {
    setFormAddons((prev) =>
      prev.map((a, i) =>
        i === idx ? { ...a, [field]: field === "price" ? Number(value) : value } : a,
      ),
    );
  };

  const filtered = menuItems.filter((m) => {
    const matchSearch = search === "" || m.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === "all" || m.category === categoryFilter;
    return matchSearch && matchCat;
  });

  const getCatLabel = (catId: string) =>
    MENU_CATEGORIES.find((c) => c.id === catId)?.label || catId;
  const getCatEmoji = (catId: string) =>
    MENU_CATEGORIES.find((c) => c.id === catId)?.emoji || "🍽️";
  const getDisplayImage = (item: MenuItemDB) => item.image_url || item.image || "";

  return (
    <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
      {/* Left: Menu List */}
      <div className="flex-1 lg:max-w-[60%] flex flex-col gap-4 min-h-0">
        {/* Search + Filter + Add */}
        <div className="bg-white border border-[#ece4d6] rounded-3xl p-4 shadow-sm flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="flex-1 relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="ค้นหาเมนูอาหาร..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-xl text-sm font-bold text-[#002e47] focus:outline-none focus:ring-2 focus:ring-[#002e47]/20 bg-slate-50"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-[#002e47] focus:outline-none bg-white"
          >
            <option value="all">ทุกหมวดหมู่</option>
            {MENU_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.emoji} {c.label}
              </option>
            ))}
          </select>
          <button
            onClick={openAddForm}
            className="flex items-center gap-1.5 bg-[#002e47] hover:bg-[#003a5c] text-white text-xs font-black px-4 py-2.5 rounded-xl transition shadow-sm shrink-0 cursor-pointer"
          >
            <Plus size={14} />
            <span>เพิ่มเมนู</span>
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white border border-[#ece4d6] rounded-2xl p-3 shadow-sm text-center">
            <p className="text-2xl font-black text-[#002e47]">{menuItems.length}</p>
            <p className="text-[10px] font-bold text-slate-500">รายการทั้งหมด</p>
          </div>
          <div className="bg-white border border-emerald-200 rounded-2xl p-3 shadow-sm text-center">
            <p className="text-2xl font-black text-emerald-600">
              {menuItems.filter((m) => m.is_available).length}
            </p>
            <p className="text-[10px] font-bold text-slate-500">มีจำหน่าย</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-sm text-center">
            <p className="text-2xl font-black text-slate-400">
              {menuItems.filter((m) => !m.is_available).length}
            </p>
            <p className="text-[10px] font-bold text-slate-500">หมดชั่วคราว</p>
          </div>
        </div>

        {/* Menu List */}
        <div className="bg-white border border-[#ece4d6] rounded-3xl shadow-sm flex-1 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-[#ece4d6] flex items-center justify-between">
            <h2 className="font-black text-[#002e47] text-sm">
              รายการเมนูอาหาร ({filtered.length})
            </h2>
            <button
              onClick={fetchMenuItems}
              className="text-xs font-bold text-slate-500 hover:text-[#002e47] transition cursor-pointer"
            >
              🔄 รีเฟรช
            </button>
          </div>
          <div className="flex-1 overflow-y-auto no-scrollbar divide-y divide-slate-50">
            {loading ? (
              <div className="p-12 text-center text-slate-400 font-bold">กำลังโหลดเมนู...</div>
            ) : filtered.length === 0 ? (
              <div className="p-12 text-center text-slate-400 font-bold">ไม่พบเมนูที่ค้นหา</div>
            ) : (
              filtered.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-center gap-3 p-3 hover:bg-slate-50 transition group ${
                    !item.is_available ? "opacity-60" : ""
                  }`}
                >
                  {/* Image */}
                  <div className="h-14 w-14 rounded-xl overflow-hidden bg-slate-100 shrink-0 flex items-center justify-center">
                    {getDisplayImage(item) ? (
                      <img
                        src={getDisplayImage(item)}
                        alt={item.name}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <span className="text-2xl">{getCatEmoji(item.category)}</span>
                    )}
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-black text-[#002e47] text-sm truncate">
                        {item.name}
                      </span>
                      {item.is_spicy && (
                        <Flame size={11} className="text-red-500 shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] bg-[#002e47]/5 text-[#002e47] px-1.5 py-0.5 rounded font-bold">
                        {getCatEmoji(item.category)} {getCatLabel(item.category)}
                      </span>
                      <span className="font-black text-[#002e47] text-xs">฿{item.price}</span>
                      {!item.is_available && (
                        <span className="text-[9px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-black">
                          หมดชั่วคราว
                        </span>
                      )}
                    </div>
                    {item.staff_note && (
                      <p className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded mt-0.5 font-semibold truncate">
                        📝 {item.staff_note}
                      </p>
                    )}
                  </div>
                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition">
                    <button
                      onClick={() => toggleAvailability(item)}
                      title={item.is_available ? "ซ่อนชั่วคราว" : "เปิดจำหน่าย"}
                      className={`p-1.5 rounded-lg border transition cursor-pointer ${
                        item.is_available
                          ? "bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100"
                          : "bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200"
                      }`}
                    >
                      {item.is_available ? <Eye size={13} /> : <EyeOff size={13} />}
                    </button>
                    <button
                      onClick={() => openEditForm(item)}
                      className="p-1.5 rounded-lg border bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100 transition cursor-pointer"
                    >
                      <Edit3 size={13} />
                    </button>
                    <button
                      onClick={() => deleteMenuItem(item)}
                      className="p-1.5 rounded-lg border bg-red-50 border-red-200 text-red-500 hover:bg-red-100 transition cursor-pointer"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Right: Edit/Add Form Panel */}
      <div
        className={`w-full lg:w-[42%] ${isFormOpen ? "block" : "hidden lg:flex"} flex flex-col`}
      >
        {isFormOpen ? (
          <div className="bg-white border border-[#ece4d6] rounded-3xl shadow-sm flex flex-col h-full max-h-[calc(100vh-160px)] overflow-hidden">
            {/* Form Header */}
            <div className="p-5 border-b border-[#ece4d6] flex items-center justify-between shrink-0 bg-[#002e47] rounded-t-3xl">
              <div>
                <h3 className="font-black text-white text-base">
                  {editItem ? "✏️ แก้ไขเมนู" : "➕ เพิ่มเมนูใหม่"}
                </h3>
                {editItem && (
                  <p className="text-[10px] text-white/60 font-bold mt-0.5">
                    ID: {editItem.id}
                  </p>
                )}
              </div>
              <button
                onClick={() => setIsFormOpen(false)}
                className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 cursor-pointer text-white"
              >
                <X size={15} />
              </button>
            </div>

            {/* Form Body */}
            <div className="flex-1 overflow-y-auto no-scrollbar p-5 space-y-5">
              {/* Image Upload */}
              <div>
                <label className="text-xs font-black text-slate-600 block mb-2 flex items-center gap-1.5">
                  <Image size={12} /> รูปภาพเมนู
                </label>
                <div
                  className="relative h-36 rounded-2xl border-2 border-dashed border-slate-200 overflow-hidden bg-slate-50 flex items-center justify-center cursor-pointer hover:border-[#002e47]/40 transition group"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {formImageUrl ? (
                    <>
                      <img
                        src={formImageUrl}
                        alt="preview"
                        className="h-full w-full object-cover"
                        onError={() => setFormImageUrl("")}
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                        <span className="text-white font-black text-xs">เปลี่ยนรูป</span>
                      </div>
                    </>
                  ) : (
                    <div className="text-center text-slate-400">
                      {uploadingImage ? (
                        <p className="text-xs font-bold">กำลังอัปโหลด...</p>
                      ) : (
                        <>
                          <Image size={28} className="mx-auto mb-2 opacity-30" />
                          <p className="text-xs font-bold">คลิกเพื่ออัปโหลดรูปอาหาร</p>
                          <p className="text-[10px] text-slate-400">JPG, PNG, WebP</p>
                        </>
                      )}
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    if (e.target.files?.[0]) {
                      await handleImageUpload(e.target.files[0]);
                      e.target.value = "";
                    }
                  }}
                />
                {formImageUrl && (
                  <div className="mt-2 flex gap-2">
                    <input
                      type="text"
                      value={formImageUrl}
                      onChange={(e) => setFormImageUrl(e.target.value)}
                      placeholder="หรือวาง URL รูปภาพ"
                      className="flex-1 border border-slate-200 rounded-lg px-2.5 py-1.5 text-[11px] font-bold focus:outline-none focus:ring-1 focus:ring-[#002e47]/20"
                    />
                    <button
                      onClick={() => setFormImageUrl("")}
                      className="text-[10px] text-red-500 font-bold hover:text-red-700 px-2 cursor-pointer"
                    >
                      ลบ
                    </button>
                  </div>
                )}
                {!formImageUrl && (
                  <input
                    type="text"
                    value={formImageUrl}
                    onChange={(e) => setFormImageUrl(e.target.value)}
                    placeholder="หรือวาง URL รูปภาพ เช่น https://... หรือ /meal/..."
                    className="mt-2 w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-[11px] font-bold focus:outline-none focus:ring-1 focus:ring-[#002e47]/20"
                  />
                )}
              </div>

              {/* Name */}
              <div>
                <label className="text-xs font-black text-slate-600 block mb-1.5 flex items-center gap-1.5">
                  <Tag size={12} /> ชื่อเมนู <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="ชื่อเมนูอาหาร เช่น กระเพราหมูสับ"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold text-[#002e47] focus:outline-none focus:ring-2 focus:ring-[#002e47]/20"
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-black text-slate-600 block mb-1.5 flex items-center gap-1.5">
                  <FileText size={12} /> คำอธิบายเมนู
                </label>
                <textarea
                  placeholder="บรรยายส่วนประกอบ รสชาติ วัตถุดิบหลัก..."
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  rows={2}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-[#002e47] focus:outline-none focus:ring-2 focus:ring-[#002e47]/20 resize-none"
                />
              </div>

              {/* Price + Category */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-black text-slate-600 block mb-1.5 flex items-center gap-1.5">
                    <DollarSign size={12} /> ราคา (บาท) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    min={0}
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-black text-[#002e47] focus:outline-none focus:ring-2 focus:ring-[#002e47]/20"
                  />
                </div>
                <div>
                  <label className="text-xs font-black text-slate-600 block mb-1.5">
                    หมวดหมู่
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold text-[#002e47] focus:outline-none bg-white"
                  >
                    {MENU_CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.emoji} {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Spicy toggle */}
              <div className="flex items-center justify-between bg-slate-50 rounded-xl p-3 border border-slate-200">
                <div className="flex items-center gap-2">
                  <Flame size={16} className="text-red-500" />
                  <span className="text-sm font-bold text-[#002e47]">เมนูนี้มีรสเผ็ด</span>
                </div>
                <button
                  onClick={() => setFormIsSpicy(!formIsSpicy)}
                  className={`relative h-6 w-11 rounded-full transition-colors duration-200 cursor-pointer ${
                    formIsSpicy ? "bg-red-500" : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${
                      formIsSpicy ? "translate-x-[22px]" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>

              {/* Options (ตัวเลือก) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-black text-slate-600 flex items-center gap-1.5">
                    <Grip size={12} /> ตัวเลือก (Options) — เช่น ระดับความเผ็ด
                  </label>
                  <button
                    onClick={addOptionGroup}
                    className="text-[10px] font-black text-[#002e47] bg-[#002e47]/10 hover:bg-[#002e47]/20 px-2.5 py-1 rounded-lg transition cursor-pointer"
                  >
                    + เพิ่มกลุ่ม
                  </button>
                </div>
                {formOptions.length === 0 && (
                  <p className="text-[11px] text-slate-400 italic font-bold text-center py-3 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    ยังไม่มีตัวเลือก กด "+ เพิ่มกลุ่ม" เพื่อเริ่ม
                  </p>
                )}
                {formOptions.map((og, ogIdx) => (
                  <div
                    key={og.id}
                    className="border border-slate-200 rounded-xl p-3 mb-2 bg-slate-50/50"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <input
                        type="text"
                        placeholder="ชื่อกลุ่มตัวเลือก เช่น ระดับความเผ็ด"
                        value={og.name}
                        onChange={(e) => updateOptionGroupName(ogIdx, e.target.value)}
                        className="flex-1 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-[#002e47]/20"
                      />
                      <button
                        onClick={() => removeOptionGroup(ogIdx)}
                        className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                    <div className="space-y-1.5">
                      {og.choices.map((c, cIdx) => (
                        <div key={c.id} className="flex items-center gap-1.5">
                          <input
                            type="text"
                            placeholder="ชื่อตัวเลือก เช่น เผ็ดมาก"
                            value={c.label}
                            onChange={(e) => updateChoice(ogIdx, cIdx, "label", e.target.value)}
                            className="flex-1 border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold focus:outline-none"
                          />
                          <input
                            type="number"
                            placeholder="บวก฿"
                            min={0}
                            value={c.price ?? ""}
                            onChange={(e) => updateChoice(ogIdx, cIdx, "price", e.target.value)}
                            className="w-16 border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold focus:outline-none"
                          />
                          <button
                            onClick={() => removeChoice(ogIdx, cIdx)}
                            className="text-red-400 hover:text-red-600 p-1 cursor-pointer"
                          >
                            <X size={11} />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => addChoice(ogIdx)}
                        className="text-[10px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 mt-1 cursor-pointer"
                      >
                        <Plus size={10} /> เพิ่ม choice
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Addons (วัตถุดิบเพิ่ม) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-black text-slate-600 flex items-center gap-1.5">
                    <Plus size={12} /> วัตถุดิบเพิ่ม (Addons) — เช่น ไข่ดาว, หมูกรอบ
                  </label>
                  <button
                    onClick={addAddon}
                    className="text-[10px] font-black text-[#002e47] bg-[#002e47]/10 hover:bg-[#002e47]/20 px-2.5 py-1 rounded-lg transition cursor-pointer"
                  >
                    + เพิ่ม
                  </button>
                </div>
                {formAddons.length === 0 && (
                  <p className="text-[11px] text-slate-400 italic font-bold text-center py-3 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    ยังไม่มี addons
                  </p>
                )}
                {formAddons.map((a, idx) => (
                  <div key={a.id} className="flex items-center gap-1.5 mb-1.5">
                    <input
                      type="text"
                      placeholder="ชื่อ addon เช่น ไข่ดาว"
                      value={a.name}
                      onChange={(e) => updateAddon(idx, "name", e.target.value)}
                      className="flex-1 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold focus:outline-none"
                    />
                    <span className="text-xs font-bold text-slate-500">+฿</span>
                    <input
                      type="number"
                      placeholder="0"
                      min={0}
                      value={a.price}
                      onChange={(e) => updateAddon(idx, "price", e.target.value)}
                      className="w-16 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold focus:outline-none"
                    />
                    <button
                      onClick={() => removeAddon(idx)}
                      className="text-red-400 hover:text-red-600 p-1 cursor-pointer"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Staff Note */}
              <div>
                <label className="text-xs font-black text-slate-600 block mb-1.5 flex items-center gap-1.5">
                  <FileText size={12} /> หมายเหตุพนักงาน (Staff Note)
                </label>
                <textarea
                  placeholder="เช่น: วัตถุดิบในสต็อก: หมูสด, กระเพรา / แจ้งครัวแยกเสิร์ฟ..."
                  value={formStaffNote}
                  onChange={(e) => setFormStaffNote(e.target.value)}
                  rows={2}
                  className="w-full border border-amber-200 bg-amber-50 rounded-xl px-3 py-2.5 text-sm font-semibold text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-300/40 resize-none placeholder:text-amber-400"
                />
                <p className="text-[10px] text-amber-600 font-bold mt-1">
                  📝 ข้อความนี้จะปรากฏบนรายการเมนูให้พนักงานเห็น
                </p>
              </div>
            </div>

            {/* Form Footer */}
            <div className="p-5 border-t border-[#ece4d6] shrink-0 flex gap-3 bg-slate-50 rounded-b-3xl">
              {editItem && (
                <button
                  onClick={() => deleteMenuItem(editItem)}
                  className="px-4 py-2.5 rounded-xl border border-red-300 text-red-600 bg-red-50 hover:bg-red-100 font-bold text-xs transition cursor-pointer"
                >
                  🗑️ ลบเมนูนี้
                </button>
              )}
              <div className="flex-1" />
              <button
                onClick={() => setIsFormOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-100 transition cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                onClick={saveMenuItem}
                disabled={!formName.trim() || !formPrice || saving}
                className="px-6 py-2.5 rounded-xl bg-[#002e47] hover:bg-[#003a5c] text-white font-black text-xs transition shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {saving ? "กำลังบันทึก..." : editItem ? "💾 บันทึกการแก้ไข" : "✅ เพิ่มเมนู"}
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-[#ece4d6] rounded-3xl shadow-sm flex-1 flex flex-col items-center justify-center text-center p-12">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="font-black text-[#002e47] text-base mb-2">จัดการเมนูอาหาร</h3>
            <p className="text-xs text-slate-500 font-semibold max-w-[220px] leading-relaxed mb-6">
              เลือกเมนูจากรายการด้านซ้ายเพื่อแก้ไข หรือกด "+ เพิ่มเมนู" เพื่อสร้างเมนูใหม่
            </p>
            <button
              onClick={openAddForm}
              className="flex items-center gap-2 bg-[#002e47] hover:bg-[#003a5c] text-white font-black text-sm px-5 py-3 rounded-2xl transition shadow-md cursor-pointer"
            >
              <Plus size={16} />
              <span>เพิ่มเมนูใหม่</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

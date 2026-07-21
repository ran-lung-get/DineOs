import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useRef, useState, useEffect } from "react";
import { type LiffProfile, liffLogout } from "../../lib/liff";
import { supabase } from "../../lib/supabase";
import { syncAuthUserToSupabase } from "../../lib/supabase.service";
import { createStripeSession, verifyStripeSession } from "../../lib/api/stripe.functions";
import { AnimatePresence, motion } from "motion/react";
import { useLanguage, type Language } from "../../lib/i18n";
import {
  Globe,
  Menu,
  Plus,
  Minus,
  ShoppingBag,
  ChevronLeft,
  ChevronDown,
  Trash2,
  X,
  Copy,
  Check,
  Upload,
  CheckCircle,
  ChefHat,
  Bike,
  PartyPopper,
  Phone,
  MapPin,
  Wifi,
  LogOut,
  Home as HomeIcon,
  ClipboardList,
  MessageCircle,
  User,
  Star,
  Utensils,
  Clock,
  Search,
  Pencil,
  CreditCard,
  ChevronRight,
  History,
  Receipt,
  Package,
  ArrowUpDown,
  SlidersHorizontal,
  Store,
  QrCode,
} from "lucide-react";

// Images are served from /meal (public directory)

type OrderType = "dine-in" | "takeaway" | "delivery";

export const Route = createFileRoute("/customer/")({
  head: () => ({
    meta: [
      { title: "LINE LIFF · Epicurean Delivery" },
      { name: "description", content: "สั่งอาหารพรีเมียมผ่าน LINE LIFF" },
      { property: "og:title", content: "Epicurean Delivery" },
      { property: "og:description", content: "Premium food delivery on LINE" },
    ],
  }),
  component: LiffApp,
});

// ─────────────────────────────────────────────────────────────
// Data
// ─────────────────────────────────────────────────────────────
export type Addon = { id: string; name: string; price: number };
export type MenuItem = {
  id: string;
  name: string;
  desc: string;
  price: number;
  image: string;
  category: string;
  spicy?: boolean;
  options?: { id: string; name: string; choices: { id: string; label: string; price?: number }[] }[];
  addons?: Addon[];
  isAvailable?: boolean;
  isSpicy?: boolean;
};

const HERO_IMG = "/thai_food_hero.jpg";

export const MENU: MenuItem[] = [
  {
    id: "m_krapao_pork",
    name: "กระเพราหมูสับ (ข้าวราด)",
    desc: "กระเพราหมูสับผัดกับพริกและกระเทียม เสิร์ฟราดข้าวไทยร้อนๆ",
    price: 60,
    image: '/meal/krapao.jpg',
    category: "signature",
    options: [
      { id: "spicy", name: "ระดับความเผ็ด", choices: [{ id: "0", label: "ไม่เผ็ด" }, { id: "1", label: "เผ็ดน้อย" }, { id: "2", label: "เผ็ดกลาง" }, { id: "3", label: "เผ็ดมาก" }] }
    ],
    addons: [{ id: "egg", name: "ไข่ดาว", price: 10 }, { id: "bacon", name: "หมูกรอบ", price: 20 }],
  },
  {
    id: "m_pad_nam_prik_pao",
    name: "ผัดพริกเผา (ข้าวราด)",
    desc: "ผัดเครื่องพริกเผาเข้มข้น เคล้ากับเนื้อหรือไก่ตามสั่ง เสิร์ฟพร้อมข้าว",
    price: 65,
    image: '/meal/pad_tua_sea.jpg',
    category: "signature",
    addons: [{ id: "egg", name: "ไข่ดาว", price: 10 }],
  },
  {
    id: "m_pad_nam_oil",
    name: "ผัดน้ำมันหอย (ข้าว/เส้น)",
    desc: "ผัดด้วยน้ำมันหอยหอมหวาน เลือกเนื้อสัตว์และข้าว/เส้นได้ตามต้องการ",
    price: 65,
    image: '/meal/khao_moo_garlic.jpg',
    category: "main",
  },
  {
    id: "m_pad_see_ew",
    name: "ผัดซีอิ๊ว (เส้นใหญ่)",
    desc: "เส้นใหญ่ผัดซีอิ๊วแบบร้านตามสั่ง ปรุงรสกลมกล่อม เสิร์ฟร้อน",
    price: 70,
    image: '/meal/pad_see_ew.jpg',
    category: "noodles",
  },
  {
    id: "m_fried_rice",
    name: "ข้าวผัดกระเทียม (ข้าวผัด)",
    desc: "ข้าวผัดกลิ่นกระเทียม เจียวจนหอม พร้อมผักและเนื้อสัตว์เลือกได้",
    price: 70,
    image: '/meal/fried_rice.jpg',
    category: "rice",
  },
  {
    id: "m_pad_phong_kari",
    name: "ผัดผงกะหรี่ (ไก่/หมู)",
    desc: "ผัดผงกะหรี่รสกลมกล่อม เสิร์ฟพร้อมข้าวร้อนๆ",
    price: 75,
    image: '/meal/pad_pong_gari.jpg',
    category: "main",
  },
  {
    id: "m_pad_pak",
    name: "ผัดผักรวม (กับข้าว)",
    desc: "ผัดผักสดหลากหลาย ปรุงรสอ่อนๆ ทานคู่กับข้าวสวย",
    price: 55,
    image: '/meal/pad_pak.jpg',
    category: "vegetarian",
  },
  {
    id: "m_pad_prik_gaeng",
    name: "ผัดพริกแกง (ตามสั่ง)",
    desc: "ผัดพริกแกงกลมกล่อม สามารถเลือกเป็นหมู ไก่ หรือทะเลได้",
    price: 80,
    image: '/meal/pad_tua_sea.jpg',
    category: "signature",
  },
  {
    id: "d_water",
    name: "น้ำเปล่า",
    desc: "น้ำดื่มเย็นๆ ขวดเล็ก",
    price: 15,
    image: '/meal/water.jpg',
    category: "drinks",
  },
  {
    id: "d_coke",
    name: "โค้ก (ขวด)",
    desc: "น้ำอัดลม ซีโร่/ปกติ ตามสต็อก",
    price: 35,
    image: '/meal/coke.jpg',
    category: "drinks",
  },
  {
    id: "d_luangyai",
    name: "น้ำลำไย",
    desc: "น้ำลำไยหวานหอม เสิร์ฟเย็น",
    price: 45,
    image: '/meal/longan_juice.jpg',
    category: "drinks",
  },
  {
    id: "d_orange",
    name: "น้ำส้มคั้น",
    desc: "น้ำส้มคั้นสด หวานอมเปรี้ยว",
    price: 50,
    image: '/meal/orange_juice.jpg',
    category: "drinks",
  },
  {
    id: "dess_grass_jelly",
    name: "เฉาก๊วย",
    desc: "เฉาก๊วยเย็นหวานกำลังดี ท็อปด้วยน้ำเชื่อม",
    price: 40,
    image: '/meal/grass_jelly.webp',
    category: "dessert",
  },
  {
    id: "dess_shaved_ice",
    name: "น้ำแข็งไส",
    desc: "น้ำแข็งไสพร้อมท็อปปิ้งหลากหลาย",
    price: 55,
    image: '/meal/shaved_ice.jpg',
    category: "dessert",
  },
  {
    id: "m_krapao_crispy_pork",
    name: "กระเพราหมูกรอบ (ข้าวราด)",
    desc: "กระเพราหมูกรอบหนังสามชั้นกรอบนอกนุ่มใน ผัดใบกระเพราแท้รสจัดจ้าน เสิร์ฟราดข้าวหอมมะลิร้อนๆ",
    price: 70,
    image: '/meal/krapao.jpg',
    category: "signature",
    addons: [{ id: "egg", name: "ไข่ดาว", price: 10 }],
  },
  {
    id: "m_kana_crispy_pork",
    name: "ผัดคะน้าหมูกรอบ (ข้าวราด)",
    desc: "ผัดคะน้าใบเขียวสดกรอบกับหมูกรอบสามชั้น ปรุงรสกลมกล่อม ราดข้าวหอมมะลิร้อนๆ",
    price: 70,
    image: '/meal/pad_pak.jpg',
    category: "main",
    addons: [{ id: "egg", name: "ไข่ดาว", price: 10 }],
  },
  {
    id: "m_prik_gaeng_crispy_pork",
    name: "ผัดพริกแกงหมูกรอบ (ข้าวราด)",
    desc: "พริกแกงรสเข้มข้นผัดคลุกเคล้ากับหมูกรอบและถั่วฝักยาว ราดข้าวหอมมะลิร้อนๆ",
    price: 70,
    image: '/meal/pad_tua_sea.jpg',
    category: "main",
    addons: [{ id: "egg", name: "ไข่ดาว", price: 10 }],
  },
  {
    id: "m_garlic_sliced_pork",
    name: "กระเทียมพริกไทยหมูชิ้น (ข้าวราด)",
    desc: "หมูชิ้นนุ่มๆ ผัดซอสกระเทียมพริกไทยรสเข้มข้น หอมกระเทียมเจียว ราดข้าว",
    price: 60,
    image: '/meal/khao_moo_garlic.jpg',
    category: "main",
    addons: [{ id: "egg", name: "ไข่ดาว", price: 10 }],
  },
  {
    id: "m_pong_kari_sea",
    name: "ผัดผงกะหรี่ทะเล (ข้าวราด)",
    desc: "เนื้อกุ้งและปลาหมึกสดผัดผงกะหรี่เข้มข้น ไข่นุ่มละมุนลิ้น ราดข้าวหอมมะลิ",
    price: 70,
    image: '/meal/pad_pong_gari.jpg',
    category: "signature",
    addons: [{ id: "egg", name: "ไข่ดาว", price: 10 }],
  },
  {
    id: "m_khua_prik_beef",
    name: "คั่วพริกแกงเนื้อ (ข้าวราด)",
    desc: "เนื้อวัวเกรดดีผัดคั่วพริกแกงตำมือ รสจัดจ้านถึงใจ สมุนไพรไทยครบเครื่อง ราดข้าว",
    price: 60,
    image: '/meal/pad_tua_sea.jpg',
    category: "main",
    addons: [{ id: "egg", name: "ไข่ดาว", price: 10 }],
  },
  {
    id: "m_see_ew_crispy_pork",
    name: "ผัดซีอิ๊วเส้นใหญ่หมูกรอบ",
    desc: "เส้นใหญ่เหนียวนุ่มผัดซีอิ๊วดำหอมกลิ่นกระทะ คลุกเคล้ากับหมูกรอบและคะน้าสด",
    price: 75,
    image: '/meal/pad_see_ew.jpg',
    category: "noodles",
  },
  {
    id: "m_mama_prik_gaeng_shrimp",
    name: "มาม่าผัดคั่วพริกแกงกุ้ง",
    desc: "เส้นมาม่าเหนียวนุ่มผัดซอสพริกแกงเข้มข้นและกุ้งสดเด้งๆ สมุนไพรหอมกรุ่น",
    price: 65,
    image: '/meal/pad_tua_sea.jpg',
    category: "noodles",
  },
  {
    id: "m_prik_pao_clam",
    name: "ผัดพริกเผาหอยลาย (ข้าวราด)",
    desc: "หอยลายสดผัดน้ำพริกเผาสูตรเด็ด รสชาติหวานเค็มเผ็ดลงตัว หอมใบโหระพา ราดข้าว",
    price: 60,
    image: '/meal/pad_tua_sea.jpg',
    category: "main",
    addons: [{ id: "egg", name: "ไข่ดาว", price: 10 }],
  },
  {
    id: "m_pad_pak_no_meat",
    name: "ผัดผักรวมมิตร (ข้าวราด / มังสวิรัติ)",
    desc: "ผัดผักสดรวมมิตรรสชาติเบาๆ สุขภาพดี ปรุงด้วยซีอิ๊วขาวและน้ำมันหอยสูตรเจ ราดข้าว",
    price: 50,
    image: '/meal/pad_pak.jpg',
    category: "vegetarian",
  },
];

const PROTEINS = [
  { id: "p_minced_pork", name: "หมูสับ", price: 0 },
  { id: "p_crispy_pork", name: "หมูกรอบ", price: 20 },
  { id: "p_sliced_pork", name: "หมูชิ้น", price: 10 },
  { id: "p_minced_chicken", name: "ไก่สับ", price: 0 },
  { id: "p_boiled_chicken", name: "ไก่ต้ม", price: 0 },
  { id: "p_beef", name: "เนื้อ", price: 10 },
  { id: "p_squid", name: "หมึก", price: 10 },
  { id: "p_shrimp", name: "กุ้ง", price: 10 },
  { id: "p_clam", name: "หอยลาย", price: 10 },
  { id: "p_no_meat", name: "ไม่เอาเนื้อสัตว์", price: 0 }
];

const TOPPINGS = [
  { id: "t_sausage", name: "ไส้กรอก", price: 10 },
  { id: "t_chinese_sausage", name: "กุนเชียง", price: 10 },
  { id: "t_soft_boiled_egg", name: "ไข่ดาวไม่สุก", price: 10 },
  { id: "t_fried_egg", name: "ไข่ดาวสุก", price: 10 },
  { id: "t_boiled_egg", name: "ไข่ต้ม", price: 10 },
  { id: "t_omelet", name: "ไข่เจียว", price: 10 }
];

const SIZES = [
  { id: "s_regular", name: "ธรรมดา", price: 0 },
  { id: "s_special", name: "พิเศษ", price: 10 }
];


const CATEGORIES = [
  { id: "all", label: "ทั้งหมด" },
  { id: "signature", label: "Signature" },
  { id: "drinks", label: "เครื่องดื่ม" },
  { id: "dessert", label: "ของหวาน" },
];

type CartLine = {
  id: string; // unique line id
  itemId: string;
  name: string;
  price: number; // unit price w/ addons
  qty: number;
  addons: Addon[];
  options: Record<string, string>;
  note: string;
  image: string;
};

type OrderHistory = {
  id: string;
  orderNumber: string;
  date: string;
  items: { name: string; qty: number; price: number; image: string }[];
  subtotal: number;
  delivery: number;
  total: number;
  status: "สำเร็จ" | "กำลังจัดส่ง" | "กำลังเตรียม" | "รอรับออเดอร์" | "ขอคืนเงิน" | "ยกเลิกแล้ว" | "รอดำเนินการ";
  orderType?: OrderType;
  cancelReason?: string;
  cancelNote?: string;
  refundPromptPay?: string;
  queueNumber?: string;
  tableNumber?: string;
  note?: string;
};

const BRAND = "#002e47";
const GOLD = "#fcc14a";
const INK_MUTED = "#5a6e7a";
const LINEN = "#fff8f2";
const SURFACE = "#f8fafc";

// ─────────────────────────────────────────────────────────────
// Root
// ─────────────────────────────────────────────────────────────
function LiffApp() {
  const navigate = useNavigate();
  const [liffReady, setLiffReady] = useState(false);
  const [profile, setProfile] = useState<LiffProfile | null>(null);
  const { language, setLanguage, t, tMenu } = useLanguage();

  // Load WebAvatar widget for customer route only
  useEffect(() => {
    // Set up ChatWidgetConfig
    (window as any).ChatWidgetConfig = {
      mode: "realtime-widget",
      widgetId: "ran-lung-get",
      avatarUrl: "Botnoi",
      container: "#webavatar-container",
      greetingInstruction: "",
      enableBubble: "true",
      cameraOffset: "0,0,0"
    };

    // Load JSSDK script
    let scriptElement: HTMLScriptElement | null = null;
    if (!document.getElementById('webavatar-jssdk')) {
      const s = document.createElement('script');
      s.id = 'webavatar-jssdk';
      s.src = 'https://webavatar.didthat.cc/chat-widget.js';
      s.async = true;
      (document.head || document.body).appendChild(s);
      scriptElement = s;
    }

    // Handle JSSDK navigation event for SPA
    const handleNavigate = (e: any) => {
      e.preventDefault();
      const target = e.detail.target;
      navigate({ to: target });
    };

    window.addEventListener('webavatar-navigate', handleNavigate);

    return () => {
      window.removeEventListener('webavatar-navigate', handleNavigate);
      // Clean up script if we created it
      if (scriptElement && scriptElement.parentNode) {
        scriptElement.parentNode.removeChild(scriptElement);
      }
      const existingScript = document.getElementById('webavatar-jssdk');
      if (existingScript && existingScript.parentNode) {
        existingScript.parentNode.removeChild(existingScript);
      }
      // Disconnect WebAvatar on unmount to release resources
      if ((window as any).WebAvatar) {
        try {
          (window as any).WebAvatar.disconnect();
        } catch (err) {
          console.error("Error disconnecting WebAvatar on unmount:", err);
        }
      }
      // Remove config
      delete (window as any).ChatWidgetConfig;
    };
  }, [navigate]);


  // ── Auth Guard (Supabase Session OR LINE LIFF) ──────────────
  useEffect(() => {
    let cancelled = false;
    let authListener: any = null;

    async function bootstrap(sessionToCheck?: any) {
      try {
        // 0. ตรวจสอบ Guest mode
        if (localStorage.getItem("ran-lung-get-guest") === "true") {
          if (!cancelled) {
            setProfile({ userId: "guest", displayName: "ลูกค้าหน้าร้าน" } as LiffProfile);
            setLiffReady(true);
          }
          return;
        }

        // 1. ตรวจสอบ Supabase session (email/password login)
        const { data: { session } } = await supabase.auth.getSession();
        const finalSession = sessionToCheck || session;

        if (finalSession) {
          if (!cancelled) {
            // Profile จาก Supabase user
            const sbProfile: LiffProfile = {
              userId: finalSession.user.id,
              displayName: finalSession.user.email ?? "ผู้ใช้งาน",
              pictureUrl: undefined,
            };
            setProfile(sbProfile);
            setLiffReady(true);

            // Sync/fetch DB user and customer
            try {
              const res = await syncAuthUserToSupabase(finalSession.user);
              if (res) {
                setDbUser(res.user);
                setDbCustomer(res.customer);
              }
            } catch (e) {
              console.error("Failed to sync auth user:", e);
            }
          }
          return;
        }

        // 2. ไม่มี session ใดเลย → redirect ไป login
        if (!cancelled) navigate({ to: "/login" });
      } catch (err) {
        if (!cancelled) {
          console.error("[Auth Guard error]", err);
          navigate({ to: "/login" });
        }
      }
    }

    // Subscribe to auth changes immediately to catch race conditions
    const { data } = supabase.auth.onAuthStateChange((event: any, session: any) => {
      if (event === "SIGNED_IN" && session) {
        bootstrap(session);
      }
    });
    authListener = data.subscription;

    bootstrap();

    return () => {
      cancelled = true;
      if (authListener) authListener.unsubscribe();
    };
  }, [navigate]);

  // Load orders from localStorage and listen for changes (cross-tab sync)
  useEffect(() => {
    const saved = localStorage.getItem("ran-lung-get-orders");
    if (saved) {
      try {
        setOrderHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse orders from storage:", e);
      }
    }

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "ran-lung-get-orders" && e.newValue) {
        try {
          const updated: OrderHistory[] = JSON.parse(e.newValue);
          setOrderHistory(updated);
        } catch (err) {
          console.error("Failed to parse synced orders:", err);
        }
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const [tab, setTab] = useState<"home" | "status">("home");
  const [dbUser, setDbUser] = useState<any>(null);
  const [dbCustomer, setDbCustomer] = useState<any>(null);
  const [overlay, setOverlay] = useState<null | "menu" | "orderConfirm" | "payment" | "history" | "contact">(null);
  const [stripeVerifying, setStripeVerifying] = useState(false);
  const [stripeError, setStripeError] = useState<string | null>(null);

  // Stripe Redirect Handler Effect
  useEffect(() => {
    if (!liffReady || typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const isSuccess = params.get("payment_success") === "true";
    const sessionId = params.get("session_id");

    if (isSuccess && sessionId) {
      async function verifyAndSave() {
        setStripeVerifying(true);
        try {
          console.log("[Stripe Client] Verifying checkout session:", sessionId);
          const result = await verifyStripeSession({ data: { sessionId: sessionId as string } });

          if (result.success) {
            const pendingStr = localStorage.getItem("ran-lung-get-pending-stripe-order");
            if (pendingStr) {
              const pending = JSON.parse(pendingStr);
              console.log("[Stripe Client] Pending order restored:", pending);
              
              // Call saveOrderToHistory with override arguments
              saveOrderToHistory(
                pending.cart,
                pending.orderType,
                pending.selectedTable,
                pending.address
              );

              // Clear cart, remove pending order, show success flash
              setCart([]);
              localStorage.removeItem("ran-lung-get-pending-stripe-order");
              setShowSuccess(true);
              setOverlay(null);
              setTab("status");

              setTimeout(() => {
                setShowSuccess(false);
              }, 2000);
            } else {
              setStripeError("ไม่พบข้อมูลคำสั่งซื้อที่รอดำเนินการ กรุณาตรวจสอบประวัติการสั่งซื้อของคุณ (Pending order details not found)");
            }
          } else {
            setStripeError(result.message || "การชำระเงินไม่ผ่านการตรวจสอบความถูกต้อง (Stripe verification failed)");
          }
        } catch (err: any) {
          console.error("[Stripe Client] Error verifying Stripe session:", err);
          setStripeError(err?.message || "ระบบไม่สามารถตรวจสอบความถูกต้องของการชำระเงินได้");
        } finally {
          setStripeVerifying(false);
          // Clean parameters from URL
          const newUrl = window.location.pathname;
          window.history.replaceState({}, document.title, newUrl);
        }
      }
      verifyAndSave();
    } else if (params.get("payment_cancelled") === "true") {
      setStripeError("การชำระเงินผ่าน Stripe ถูกยกเลิก");
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, [liffReady]);
  const [sidebar, setSidebar] = useState(false);
  const [menuItems, setMenuItems] = useState<MenuItem[]>(MENU);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [editingCartLine, setEditingCartLine] = useState<CartLine | null>(null);
  const selectedItemToEdit = useMemo(() => {
    if (editingCartLine) {
      return menuItems.find((m) => m.id === editingCartLine.itemId) || null;
    }
    return null;
  }, [editingCartLine, menuItems]);
  const [cartDrawer, setCartDrawer] = useState(false);
  const [orderType, setOrderType] = useState<OrderType | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [hasActiveOrder, setHasActiveOrder] = useState(false);
  const [activeOrderNumber, setActiveOrderNumber] = useState("");
  const [selectedTable, setSelectedTable] = useState("");
  const [showTablePicker, setShowTablePicker] = useState(false);
  const [tables, setTables] = useState([
    { id: "1", label: "โต๊ะ 1", status: "available" },
    { id: "2", label: "โต๊ะ 2", status: "available" },
    { id: "3", label: "โต๊ะ 3", status: "available" },
    { id: "4", label: "โต๊ะ 4", status: "available" },
    { id: "5", label: "โต๊ะ 5", status: "available" },
    { id: "6", label: "โต๊ะ 6", status: "available" },
    { id: "7", label: "โต๊ะ 7", status: "available" },
    { id: "8", label: "โต๊ะ 8", status: "available" },
    { id: "9", label: "โต๊ะ 9 (Walk-in)", status: "available" },
    { id: "10", label: "โต๊ะ 10 (Walk-in)", status: "available" },
  ]);

  // Fetch tables from Supabase (fall back to local if table doesn't exist yet)
  useEffect(() => {
    async function fetchTables() {
      try {
        const { data, error } = await supabase
          .from("restaurant_tables")
          .select("id, label, status")
          .order("id");
        if (!error && data && data.length > 0) {
          const has9 = data.some((t: any) => t.id === "9" || t.label.includes("โต๊ะ 9"));
          const has10 = data.some((t: any) => t.id === "10" || t.label.includes("โต๊ะ 10"));
          const merged = [...data];
          if (!has9) {
            merged.push({ id: "9", label: "โต๊ะ 9 (Walk-in)", status: "available" });
          }
          if (!has10) {
            merged.push({ id: "10", label: "โต๊ะ 10 (Walk-in)", status: "available" });
          }
          setTables(merged as any);
        }
      } catch { /* use local fallback */ }
    }
    fetchTables();

    // Real-time: อัปเดตสถานะโต๊ะทันที
    const ch = supabase
      .channel("tables-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "restaurant_tables" }, (payload: any) => {
        if (payload.eventType === "UPDATE" || payload.eventType === "INSERT") {
          const updated = payload.new as any;
          setTables((prev) =>
            prev.map((t) => t.id === String(updated.id) ? { ...t, ...updated, id: String(updated.id) } : t)
          );
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(ch); };
  }, []);
  const [address, setAddress] = useState("");
  const [addressType, setAddressType] = useState<"home" | "work" | "dorm">("home");
  const [deliveryMethod, setDeliveryMethod] = useState<"leave" | "pickup" | null>(null);
  const [showAddressError, setShowAddressError] = useState(false);
  const [showTypeError, setShowTypeError] = useState(false);

  // Simulating store closed state (for prototype testing)
  const [simulateClosed, setSimulateClosed] = useState(false);
  const [bypassRealClosed, setBypassRealClosed] = useState(false);

  // States for stock management (proteins & toppings)
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [recipes, setRecipes] = useState<any[]>([]);

  // Fetch ingredients and recipes from Supabase with real-time sync
  useEffect(() => {
    async function loadMenu() {
      try {
        const { data: dbItems, error } = await supabase
          .from("menu_items")
          .select("*")
          .order("sort_order");
        if (!error && dbItems && dbItems.length > 0) {
          const mapped = dbItems.map((item: any) => ({
            id: item.id,
            name: item.name,
            desc: item.description || "",
            price: Number(item.price),
            image: item.image_url || item.image || "",
            category: item.category,
            isAvailable: item.is_available ?? true,
            isSpicy: item.is_spicy ?? false,
            options: item.options || undefined,
            addons: item.addons || undefined
          }));
          setMenuItems(mapped);
          localStorage.setItem("ran-lung-get-menu-items", JSON.stringify(mapped));
        } else {
          const localMenu = localStorage.getItem("ran-lung-get-menu-items");
          if (localMenu) {
            setMenuItems(JSON.parse(localMenu));
          }
        }
      } catch (err) {
        console.warn("Failed to load menu from Supabase:", err);
        const localMenu = localStorage.getItem("ran-lung-get-menu-items");
        if (localMenu) {
          setMenuItems(JSON.parse(localMenu));
        }
      }
    }

    async function loadStock() {
      try {
        const { data: ingData } = await supabase.from("ingredients").select("*");
        if (ingData && ingData.length > 0) {
          setIngredients(ingData);
        } else {
          const localIng = localStorage.getItem("ran-lung-get-mock-ingredients");
          if (localIng) {
            setIngredients(JSON.parse(localIng));
          }
        }

        const { data: recData } = await supabase.from("recipe_items").select("*");
        if (recData && recData.length > 0) {
          setRecipes(recData);
        } else {
          const fallbackRecipes = [
            { option_id: "opt-mu-sap", ingredient_id: "mock-1", quantity_required: 80 },
            { option_id: "opt-mu-krob", ingredient_id: "mock-2", quantity_required: 80 },
            { option_id: "opt-mu-chin", ingredient_id: "mock-3", quantity_required: 80 },
            { option_id: "opt-kai-sap", ingredient_id: "mock-4", quantity_required: 80 },
            { option_id: "opt-kai-tom", ingredient_id: "mock-5", quantity_required: 80 },
            { option_id: "opt-nua", ingredient_id: "mock-6", quantity_required: 80 },
            { option_id: "opt-muek", ingredient_id: "mock-7", quantity_required: 80 },
            { option_id: "opt-kung", ingredient_id: "mock-8", quantity_required: 80 },
            { option_id: "opt-hoi-lay", ingredient_id: "mock-9", quantity_required: 80 },
            { option_id: "opt-khai-kai", ingredient_id: "mock-10", quantity_required: 1 },
            { option_id: "opt-sai-krog", ingredient_id: "mock-11", quantity_required: 1 },
            { option_id: "opt-kun-chiang", ingredient_id: "mock-12", quantity_required: 1 }
          ];
          setRecipes(fallbackRecipes);
        }
      } catch (err) {
        console.warn("Error loading stock from database, using local fallback:", err);
        const localIng = localStorage.getItem("ran-lung-get-mock-ingredients");
        if (localIng) {
          setIngredients(JSON.parse(localIng));
        }
      }
    }
    loadMenu();
    loadStock();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "ran-lung-get-mock-ingredients" && e.newValue) {
        try {
          setIngredients(JSON.parse(e.newValue));
        } catch (err) {
          console.error("Storage sync parse error:", err);
        }
      }
      if (e.key === "ran-lung-get-menu-items" && e.newValue) {
        try {
          setMenuItems(JSON.parse(e.newValue));
        } catch (err) {
          console.error("Storage sync parse error:", err);
        }
      }
    };
    window.addEventListener("storage", handleStorageChange);

    // Subscribe to menu changes
    const chMenu = supabase
      .channel("menu-items-realtime-customer")
      .on("postgres_changes", { event: "*", schema: "public", table: "menu_items" }, () => {
        loadMenu();
      })
      .subscribe();

    // Subscribe to real-time changes on ingredients
    const chIng = supabase
      .channel("ingredients-realtime-customer")
      .on("postgres_changes", { event: "*", schema: "public", table: "ingredients" }, () => {
        loadStock();
      })
      .subscribe();

    // Subscribe to real-time changes on recipe items
    const chRec = supabase
      .channel("recipe_items-realtime-customer")
      .on("postgres_changes", { event: "*", schema: "public", table: "recipe_items" }, () => {
        loadStock();
      })
      .subscribe();

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      supabase.removeChannel(chMenu);
      supabase.removeChannel(chIng);
      supabase.removeChannel(chRec);
    };
  }, []);

  const checkOptionOutOfStock = (optionId: string) => {
    const optionRecipes = recipes.filter((r) => r.option_id === optionId);
    if (optionRecipes.length === 0) return false;

    return optionRecipes.some((recipe) => {
      const ingredient = ingredients.find((i) => {
        return i.id === recipe.ingredient_id ||
               i.name === recipe.ingredient_id ||
               (recipe.ingredient_id && recipe.ingredient_id.includes(i.name));
      });
      if (!ingredient) return true;
      if (ingredient.is_active === false || ingredient.status === "disabled") return true;
      return Number(ingredient.quantity) < Number(recipe.quantity_required);
    });
  };



  const isCurrentlyClosed = useMemo(() => {
    if (simulateClosed) return true;
    if (bypassRealClosed) return false;

    // Bangkok timezone (UTC+7)
    const now = new Date();
    const thTimeStr = now.toLocaleString("en-US", { timeZone: "Asia/Bangkok" });
    const thTime = new Date(thTimeStr);
    const day = thTime.getDay(); // 0 is Sunday, 6 is Saturday
    const hour = thTime.getHours();
    const minute = thTime.getMinutes();

    // Closed all day Saturday (6)
    if (day === 6) {
      return true;
    }

    // Open Sunday-Friday from 08:00 to 21:00
    const timeInMinutes = hour * 60 + minute;
    const openTime = 8 * 60; // 08:00
    const closeTime = 21 * 60; // 21:00

    if (timeInMinutes < openTime || timeInMinutes >= closeTime) {
      return true;
    }

    return false;
  }, [simulateClosed, bypassRealClosed]);

  const shouldShowClosedOverlay = isCurrentlyClosed &&
    tab === "home" &&
    (overlay === null || overlay === "menu" || overlay === "orderConfirm" || overlay === "payment");

  const [orderHistory, setOrderHistory] = useState<OrderHistory[]>([
    {
      id: "hist_1",
      orderNumber: "#AK-2841",
      date: "17 มิ.ย. 2026 · 18:30",
      items: [
        { name: "กระเพราหมูสับ (ข้าวราด)", qty: 2, price: 60, image: "/meal/krapao.jpg" },
        { name: "น้ำส้มคั้น", qty: 1, price: 50, image: "/meal/orange_juice.jpg" },
      ],
      subtotal: 170,
      delivery: 40,
      total: 210,
      status: "สำเร็จ",
      orderType: "delivery",
    },
    {
      id: "hist_2",
      orderNumber: "#AK-2835",
      date: "15 มิ.ย. 2026 · 12:15",
      items: [
        { name: "ผัดซีอิ๊ว (เส้นใหญ่)", qty: 1, price: 70, image: "/meal/pad_see_ew.jpg" },
        { name: "เฉาก๊วย", qty: 1, price: 40, image: "/meal/grass_jelly.webp" },
      ],
      subtotal: 110,
      delivery: 40,
      total: 150,
      status: "สำเร็จ",
      orderType: "delivery",
    },
  ]);

  const totalQty = cart.reduce((s, l) => s + l.qty, 0);
  const subtotal = cart.reduce((s, l) => s + l.price * l.qty, 0);
  const deliveryFee = orderType === "delivery" ? 40 : 0;

  const addToCart = (line: CartLine) => setCart((c) => [...c, line]);
  const removeLine = (id: string) => setCart((c) => c.filter((l) => l.id !== id));

  const saveOrderToHistory = (
    customCart?: CartLine[],
    customOrderType?: OrderType,
    customSelectedTable?: string | null,
    customAddress?: string
  ) => {
    const activeCart = customCart || cart;
    const activeOrderType = customOrderType || orderType;
    const activeSelectedTable = customSelectedTable !== undefined ? customSelectedTable : selectedTable;
    const activeAddress = customAddress !== undefined ? customAddress : address;

    if (activeCart.length === 0) return;
    const orderNum = `#AK-${Math.floor(2848 + Math.random() * 100)}`;
    const selectedTableObj = tables.find((t) => t.id === activeSelectedTable);
    const tableNumStr = activeOrderType === "dine-in" && selectedTableObj ? selectedTableObj.label : undefined;

    // Calculate queue number for takeaway
    let takeawayQueueNum: string | undefined = undefined;
    if (activeOrderType === "takeaway") {
      const currentQueueCounter = localStorage.getItem("ran-lung-get-takeaway-queue-counter");
      let nextQueue = 1;
      if (currentQueueCounter) {
        const parsed = parseInt(currentQueueCounter);
        if (!isNaN(parsed)) {
          nextQueue = parsed + 1;
        }
      }
      localStorage.setItem("ran-lung-get-takeaway-queue-counter", String(nextQueue));
      takeawayQueueNum = `Q-${String(nextQueue).padStart(2, "0")}`;
    }

    const activeSubtotal = activeCart.reduce((s, l) => s + l.price * l.qty, 0);
    const activeDeliveryFee = activeOrderType === "delivery" ? 40 : 0;

    const newOrder: OrderHistory = {
      id: `hist_${Date.now()}`,
      orderNumber: orderNum,
      date: new Date().toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" }) + " · " + new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }),
      items: activeCart.map((l) => ({ name: l.name, qty: l.qty, price: l.price, image: l.image })),
      subtotal: activeSubtotal,
      delivery: activeDeliveryFee,
      total: activeSubtotal + activeDeliveryFee,
      status: "รอรับออเดอร์",
      orderType: activeOrderType || "delivery",
      tableNumber: tableNumStr,
      queueNumber: takeawayQueueNum,
    };
    const updatedHistory = [newOrder, ...orderHistory];
    setOrderHistory(updatedHistory);
    localStorage.setItem("ran-lung-get-orders", JSON.stringify(updatedHistory));
    setActiveOrderNumber(orderNum);
    setHasActiveOrder(true);

    if (activeOrderType === "dine-in" && activeSelectedTable) {
      setTables((prev) =>
        prev.map((t) => (t.id === activeSelectedTable ? { ...t, status: "occupied" } : t))
      );
      // Update table status in Supabase to occupied
      void (supabase as any)
        .from("restaurant_tables")
        .update({ status: "occupied" })
        .eq("id", activeSelectedTable);
    }

    // Push order to Supabase for real-time Staff Dashboard
    const insertOrder = async () => {
      let finalUserId = dbUser?.id;
      let finalCustomerId = dbCustomer?.id;
      
      if (!finalUserId || !finalCustomerId) {
        try {
          const { data: users } = await supabase.from("users").select("id").limit(1);
          const { data: customers } = await supabase.from("customers").select("id").limit(1);
          if (users && users.length > 0) finalUserId = users[0].id;
          if (customers && customers.length > 0) finalCustomerId = customers[0].id;
        } catch {}
      }

      if (!finalUserId || !finalCustomerId) {
        console.warn("Could not find any user or customer in Supabase. Skipping Supabase insert.");
        return;
      }

      const orderId = typeof crypto?.randomUUID === 'function' 
        ? crypto.randomUUID() 
        : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { 
            const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8); 
            return v.toString(16); 
          });

      const { error: orderErr } = await supabase.from("orders").insert({
        id: orderId,
        order_number: orderNum,
        user_id: finalUserId,
        customer_id: finalCustomerId,
        line_user_id: profile?.userId || null,
        order_type: activeOrderType || "delivery",
        status: "pending",
        subtotal: activeSubtotal,
        delivery_fee: activeDeliveryFee,
        total: activeSubtotal + activeDeliveryFee,
        table_number: tableNumStr || null,
        delivery_address: activeOrderType === "delivery" ? activeAddress : null,
        special_instructions: null,
        created_at: new Date().toISOString()
      });

      if (orderErr) {
        console.error("Failed to insert order in Supabase:", orderErr);
        return;
      }

      const orderItems = newOrder.items.map((item) => ({
        order_id: orderId,
        item_id: item.name,
        name: item.name,
        image: item.image || null,
        unit_price: item.price,
        quantity: item.qty,
        line_total: item.price * item.qty,
        created_at: new Date().toISOString()
      }));

      const { error: itemsErr } = await supabase.from("order_items").insert(orderItems);
      if (itemsErr) {
        console.error("Failed to insert order items in Supabase:", itemsErr);
      }
    };

    void insertOrder();
  };

  const resetAll = () => {
    setCart([]);
    setOverlay(null);
    setCartDrawer(false);
    setSelectedItem(null);
    setTab("home");
    // Keep selectedTable, address, and deliveryMethod so the user can order more items without re-entering details.
    setShowAddressError(false);
    setShowTypeError(false);
  };
  if (!liffReady) {
    return (
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
        <div className="flex flex-col items-center gap-4 z-10">
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              border: "3px solid rgba(255,255,255,0.1)",
              borderTopColor: "#fcc14a",
              animation: "spin 0.8s linear infinite",
            }}
          />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

    return (
    <div
      className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-[var(--linen)]"
    >
      <main
        aria-label="แอปพลิเคชันสั่งอาหาร ร้านลุงเก็ต"
        className="relative overflow-hidden bg-[var(--linen)] no-scrollbar z-10 w-full"
        style={{
          height: "100dvh",
        }}
      >
        <div className="absolute inset-0 overflow-y-auto no-scrollbar">
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, x: tab === "status" ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: tab === "status" ? -20 : 20 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="h-full"
            >
              {tab === "home" && (
                <HomeScreen
                  menuItems={menuItems}
                  onOpenSidebar={() => setSidebar(true)}
                  orderType={orderType}
                  isCurrentlyClosed={isCurrentlyClosed}
                  bypassRealClosed={bypassRealClosed}
                  setOrderType={setOrderType}
                  onPickItem={(it) => setSelectedItem(it)}
                  onOpenCart={() => setCartDrawer(true)}
                  totalQty={totalQty}
                  subtotal={subtotal}
                  onOpenMenu={() => setOverlay("menu")}
                  hasActiveOrder={hasActiveOrder}
                  activeOrderNumber={activeOrderNumber}
                  onGoToStatus={() => setTab("status")}
                  selectedTable={selectedTable}
                  setSelectedTable={setSelectedTable}
                  tables={tables}
                  onOpenTablePicker={() => setShowTablePicker(true)}
                  activeOrderType={orderHistory.find((o) => o.orderNumber === activeOrderNumber)?.orderType}
                  activeOrderStatus={orderHistory.find((o) => o.orderNumber === activeOrderNumber)?.status}
                  address={address}
                  setAddress={setAddress}
                  addressType={addressType}
                  setAddressType={setAddressType}
                  deliveryMethod={deliveryMethod}
                  setDeliveryMethod={setDeliveryMethod}
                  showAddressError={showAddressError}
                  setShowAddressError={setShowAddressError}
                  showTypeError={showTypeError}
                  setShowTypeError={setShowTypeError}
                />
              )}
              {tab === "status" && (
                <StatusScreen
                  onOpenSidebar={() => setSidebar(true)}
                  activeOrder={orderHistory.find((o) => o.orderNumber === activeOrderNumber) || orderHistory[0]}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Overlays */}
        <AnimatePresence>
          {(selectedItem || editingCartLine) && (selectedItem || selectedItemToEdit) && (
            <ItemModal
              key="item"
              item={selectedItem || selectedItemToEdit!}
              cartLine={editingCartLine || undefined}
              onClose={() => {
                setSelectedItem(null);
                setEditingCartLine(null);
              }}
              onAdd={(line) => {
                if (editingCartLine) {
                  setCart((c) => c.map((l) => (l.id === line.id ? line : l)));
                } else {
                  addToCart(line);
                }
                setSelectedItem(null);
                setEditingCartLine(null);
              }}
              checkOptionOutOfStock={checkOptionOutOfStock}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {overlay === "menu" && (
            <MenuOverlay
              key="menu"
              menuItems={menuItems}
              onBack={() => setOverlay(null)}
              onPickItem={(it) => setSelectedItem(it)}
              onOpenCart={() => setCartDrawer(true)}
              totalQty={totalQty}
              subtotal={subtotal}
            />
          )}
          {overlay === "orderConfirm" && (
            <OrderConfirmOverlay
              key="confirm"
              cart={cart}
              subtotal={subtotal}
              deliveryFee={deliveryFee}
              onBack={() => setOverlay("menu")}
              onRemove={removeLine}
              onEdit={(line) => setEditingCartLine(line)}
              onProceed={() => setOverlay("payment")}
            />
          )}
          {overlay === "payment" && (
            <PaymentOverlay
              key="pay"
              total={subtotal + deliveryFee}
              cart={cart}
              orderType={orderType || "delivery"}
              deliveryFee={deliveryFee}
              subtotal={subtotal}
              selectedTable={selectedTable}
              address={address}
              onBack={() => setOverlay("orderConfirm")}
              onSuccess={() => {
                saveOrderToHistory();
                setShowSuccess(true);
                setTimeout(() => {
                  setShowSuccess(false);
                  setOverlay(null);
                  setTab("status");
                }, 1500);
              }}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {overlay === "history" && (
            <HistoryOverlay
              key="history"
              orderHistory={orderHistory}
              onBack={() => setOverlay(null)}
            />
          )}
          {overlay === "contact" && (
            <ContactOverlay
              key="contact"
              onBack={() => setOverlay(null)}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {cartDrawer && (
            <CartDrawer
              key="cd"
              cart={cart}
              subtotal={subtotal}
              onClose={() => setCartDrawer(false)}
              onRemove={removeLine}
              onEdit={(line) => {
                setEditingCartLine(line);
                setCartDrawer(false);
              }}
              onCheckout={() => {
                setCartDrawer(false);
                setOverlay("orderConfirm");
              }}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {sidebar && (
            <Sidebar
              key="sb"
              onClose={() => setSidebar(false)}
              onNavigate={(t) => {
                setSidebar(false);
                if (t === "home" || t === "status") setTab(t);
                if (t === "history") setOverlay("history");
                if (t === "contact") setOverlay("contact");
              }}
              orderHistory={orderHistory}
              simulateClosed={simulateClosed}
              setSimulateClosed={(val) => {
                setSimulateClosed(val);
                if (val) {
                  setBypassRealClosed(false);
                }
              }}
              profile={profile}
              onLogout={async () => {
                // Prevent flash during logout
                setLiffReady(false);
                // Remove guest token
                localStorage.removeItem("ran-lung-get-guest");
                // Sign out จาก Supabase Auth
                await supabase.auth.signOut().catch(() => { });
                // Sign out จาก LIFF (ถ้า login อยู่)
                try { liffLogout(); } catch { /* ignore */ }
                navigate({ to: "/login" });
              }}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {shouldShowClosedOverlay && (
            <StoreClosedOverlay
              key="closed"
              onBypass={() => {
                setBypassRealClosed(true);
                setSimulateClosed(false);
              }}
              onOpenSidebar={() => setSidebar(true)}
            />
          )}
        </AnimatePresence>

        {/* Table Picker — rendered at root overlay level so it always covers everything */}
        <AnimatePresence>
          {showTablePicker && (
            <TablePickerBottomSheet
              key="table-picker"
              tables={tables}
              selectedTable={selectedTable}
              onSelect={(tableId) => {
                const prevTable = selectedTable;
                setSelectedTable(tableId);
                // Update local state immediately for both old and new tables
                setTables((prev) =>
                  prev.map((t) => {
                    if (t.id === tableId) return { ...t, status: "occupied" };
                    if (prevTable && t.id === prevTable) return { ...t, status: "available" };
                    return t;
                  })
                );
                // Update in Supabase (best-effort)
                if (prevTable && prevTable !== tableId) {
                  void (supabase as any)
                    .from("restaurant_tables")
                    .update({ status: "available" })
                    .eq("id", prevTable);
                }
                void (supabase as any)
                  .from("restaurant_tables")
                  .update({ status: "occupied" })
                  .eq("id", tableId);

                setTimeout(() => setShowTablePicker(false), 200);
              }}
              onClose={() => setShowTablePicker(false)}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showSuccess && <SuccessFlash key="sf" />}
        </AnimatePresence>

        {/* fixed cart bar inside app frame (constrained and centered) */}
        <AnimatePresence>
          {totalQty > 0 && tab !== "status" && (
            <motion.div
              key="fixed-cart-bar"
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              className="absolute z-20"
              style={{ left: 16, right: 16, bottom: 24, maxWidth: 600, marginLeft: "auto", marginRight: "auto" }}
            >
              <button
                onClick={() => setCartDrawer(true)}
                className="w-full rounded-2xl px-5 py-4 flex items-center justify-between shadow-[0_12px_32px_rgba(0,46,71,0.38)] transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] cursor-pointer border border-[#fcc14a]/20"
                style={{ background: `linear-gradient(135deg, ${BRAND} 0%, #001f30 100%)`, color: "white" }}
              >
                <div className="flex items-center gap-3">
                  <div className="relative grid h-10 w-10 place-items-center rounded-xl backdrop-blur-md" style={{ background: "rgba(252,193,74,0.18)" }}>
                    <ShoppingBag size={20} style={{ color: GOLD }} />
                    <span className="absolute -top-1.5 -right-1.5 grid h-5 min-w-5 px-1 place-items-center rounded-full text-[10px] font-extrabold shadow-sm border border-white" style={{ background: GOLD, color: BRAND }}>
                      {totalQty}
                    </span>
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="font-bold text-sm leading-tight">ตะกร้าสินค้า</span>
                    <span className="text-[11px] text-white/60 font-light">กดเพื่อดูและสั่งซื้อ</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-lg" style={{ color: GOLD }}>
                    ฿{subtotal}
                  </span>
                  <ChevronRight size={18} className="text-[#fcc14a]" />
                </div>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

                {tab === "status" && (
          <div className="absolute bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur-sm p-4 flex justify-center">
            <button
              onClick={resetAll}
              className="w-full max-w-md h-12 rounded-full font-semibold"
              style={{ background: BRAND, color: "white" }}
            >
              กลับไปยังหน้าหลัก
            </button>
          </div>
        )}

        {/* WebAvatar container positioned in the bottom-right corner of the main app frame */}
        <div
          id="webavatar-container"
          className={`absolute bottom-6 right-4 z-40 transition-opacity duration-300 ${tab === "home" ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
          style={{
            width: "100px",
            height: "100px",
          }}
        />
      </main>
    </div>
  );
}

function DeliveryBlock({
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
  const [touched, setTouched] = useState(false);
  const isReady = address.trim().length >= 5 && deliveryMethod !== null;

  const DELIVERY_METHODS = [
    {
      id: "leave" as const,
      label: "วางไว้ที่หน้าประตู",
      sublabel: "เราวางอาหารไว้ให้",
      icon: <HomeIcon size={20} />,
    },
    {
      id: "pickup" as const,
      label: "ลงมารับเอง",
      sublabel: "รับที่จุดรับอาหาร",
      icon: <User size={20} />,
    },
  ];

  const handleAddressChange = (val: string) => {
    setAddress(val);
    setTouched(true);
    if (val.trim().length >= 5 && deliveryMethod) {
      setShowAddressError(false);
    }
  };

  const handleDeliveryMethodChange = (method: "leave" | "pickup" | null) => {
    setDeliveryMethod(method);
    if (address.trim().length >= 5 && method) {
      setShowAddressError(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Address */}
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-full shrink-0" style={{ background: LINEN, color: BRAND }}>
          <MapPin size={18} />
        </div>
        <div className="flex-1">
          <label htmlFor="delivery-address" className="text-[10px] uppercase tracking-[0.12em] mb-1 block" style={{ color: INK_MUTED }}>
            ที่อยู่จัดส่ง
          </label>
          <input
            id="delivery-address"
            name="delivery-address"
            aria-label="ที่อยู่จัดส่ง"
            value={address}
            onChange={(e) => handleAddressChange(e.target.value)}
            onBlur={() => setTouched(true)}
            placeholder="กรอกที่อยู่ เช่น ถนนสุขุมวิท 31"
            className="w-full rounded-xl border px-3 py-2.5 text-sm transition"
            style={{
              borderColor: showAddressError || (touched && address.trim().length < 5) ? "#ef4444" : address.trim().length >= 5 ? "#16a34a" : "#ece4d6",
              outline: "none",
            }}
          />
          {(showAddressError || (touched && address.trim().length < 5)) && (
            <p className="mt-1 text-[11px] text-red-500">กรุณากรอกที่อยู่ให้ครบถ้วน (อย่างน้อย 5 ตัวอักษร)</p>
          )}
          <div className="mt-2.5 flex gap-2">
            {(["home", "work", "dorm"] as const).map((id) => {
              const labels = { home: "บ้าน", work: "ที่ทำงาน", dorm: "หอพัก" };
              return (
                <button
                  key={id}
                  aria-label={`ประเภทที่อยู่ ${labels[id]}`}
                  onClick={() => setAddressType(id)}
                  className="px-3 py-1 rounded-full border text-xs font-medium transition"
                  style={{
                    borderColor: addressType === id ? BRAND : "#ece4d6",
                    background: addressType === id ? BRAND : "white",
                    color: addressType === id ? GOLD : BRAND,
                  }}
                >
                  {labels[id]}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Delivery method */}
      <div>
        <p className="text-[10px] uppercase tracking-[0.12em] mb-2" style={{ color: INK_MUTED }}>
          รูปแบบการรับอาหาร
        </p>
        {showAddressError && !deliveryMethod && (
          <p className="text-xs text-red-500 font-semibold mb-2">* กรุณาเลือกรูปแบบการรับอาหาร</p>
        )}
        <div className="grid grid-cols-2 gap-2" style={{ border: showAddressError && !deliveryMethod ? "1px solid #ef4444" : "none", padding: showAddressError && !deliveryMethod ? "4px" : "0px", borderRadius: "12px" }}>
          {DELIVERY_METHODS.map((m) => {
            const active = deliveryMethod === m.id;
            return (
              <button
                key={m.id}
                aria-label={`เลือกรูปแบบการรับอาหาร ${m.label}`}
                onClick={() => handleDeliveryMethodChange(m.id)}
                className="flex flex-col items-start gap-1.5 rounded-xl border-2 p-3 text-left transition"
                style={{
                  borderColor: active ? BRAND : "#ece4d6",
                  background: active ? "#f0f6fa" : "white",
                }}
              >
                <div
                  className="grid h-9 w-9 place-items-center rounded-lg"
                  style={{ background: active ? BRAND : LINEN, color: active ? GOLD : BRAND }}
                >
                  {m.icon}
                </div>
                <span className="text-xs font-semibold leading-tight" style={{ color: BRAND }}>{m.label}</span>
                <span className="text-[10px]" style={{ color: INK_MUTED }}>{m.sublabel}</span>
              </button>
            );
          })}
        </div>
      </div>



    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Home
// ─────────────────────────────────────────────────────────────
function DineInBlock({ selectedTable, onOpenPicker }: { selectedTable: string; onOpenPicker: () => void }) {
  return (
    <div>
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-full shrink-0" style={{ background: LINEN, color: BRAND }}>
          <Utensils size={18} />
        </div>
        <div className="flex-1">
          <p className="text-[10px] uppercase tracking-[0.12em]" style={{ color: INK_MUTED }}>
            ทานที่ร้าน
          </p>
          <div className="mt-2">
            <p className="text-sm text-slate-600">เลือกโต๊ะจะทำผ่านผังที่นั่ง (เปิด modal)</p>
            <p className="mt-2 text-sm font-semibold" style={{ color: BRAND }}>
              {selectedTable ? `โต๊ะที่เลือก: ${selectedTable}` : "ยังไม่ได้เลือกโต๊ะ"}
            </p>
            <div className="mt-3">
              <button
                aria-label="เปิดผังที่นั่งเลือกโต๊ะ"
                onClick={onOpenPicker}
                className="px-4 py-2 rounded-full border"
                style={{ borderColor: BRAND, color: BRAND }}
              >
                เปิดผังที่นั่ง
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FlagIcon({ lang }: { lang: string }) {
  if (lang === "th") {
    return (
      <svg viewBox="0 0 9 6" className="w-5 h-3.5 rounded-sm shrink-0 shadow-sm border border-white/10">
        <rect width="9" height="6" fill="#A51931"/>
        <rect y="1" width="9" height="4" fill="#F4F5F8"/>
        <rect y="2" width="9" height="2" fill="#2D2A4A"/>
      </svg>
    );
  }
  if (lang === "en") {
    return (
      <svg viewBox="0 0 19 10" className="w-5 h-3.5 rounded-sm shrink-0 shadow-sm border border-white/10">
        <rect width="19" height="10" fill="#B22234"/>
        <path d="M0,1 h19 M0,3 h19 M0,5 h19 M0,7 h19 M0,9 h19" stroke="#FFF" strokeWidth="1"/>
        <rect width="7.6" height="5.38" fill="#3C3B6E"/>
        <circle cx="1.5" cy="1" r="0.2" fill="#fff" />
        <circle cx="3.0" cy="1" r="0.2" fill="#fff" />
        <circle cx="4.5" cy="1" r="0.2" fill="#fff" />
        <circle cx="6.0" cy="1" r="0.2" fill="#fff" />
        <circle cx="2.2" cy="1.8" r="0.2" fill="#fff" />
        <circle cx="3.7" cy="1.8" r="0.2" fill="#fff" />
        <circle cx="5.2" cy="1.8" r="0.2" fill="#fff" />
        <circle cx="1.5" cy="2.6" r="0.2" fill="#fff" />
        <circle cx="3.0" cy="2.6" r="0.2" fill="#fff" />
        <circle cx="4.5" cy="2.6" r="0.2" fill="#fff" />
        <circle cx="6.0" cy="2.6" r="0.2" fill="#fff" />
        <circle cx="2.2" cy="3.4" r="0.2" fill="#fff" />
        <circle cx="3.7" cy="3.4" r="0.2" fill="#fff" />
        <circle cx="5.2" cy="3.4" r="0.2" fill="#fff" />
        <circle cx="1.5" cy="4.2" r="0.2" fill="#fff" />
        <circle cx="3.0" cy="4.2" r="0.2" fill="#fff" />
        <circle cx="4.5" cy="4.2" r="0.2" fill="#fff" />
        <circle cx="6.0" cy="4.2" r="0.2" fill="#fff" />
      </svg>
    );
  }
  if (lang === "zh") {
    return (
      <svg viewBox="0 0 30 20" className="w-5 h-3.5 rounded-sm shrink-0 shadow-sm border border-white/10">
        <rect width="30" height="20" fill="#DE2910"/>
        <polygon points="5,2 6.17,5.61 9.33,5.61 6.78,7.47 7.76,11.08 5,8.89 2.24,11.08 3.22,7.47 0.67,5.61 3.83,5.61" fill="#FFDE00"/>
        <circle cx="10" cy="2" r="0.5" fill="#FFDE00" />
        <circle cx="12" cy="4" r="0.5" fill="#FFDE00" />
        <circle cx="12" cy="7" r="0.5" fill="#FFDE00" />
        <circle cx="10" cy="9" r="0.5" fill="#FFDE00" />
      </svg>
    );
  }
  return null;
}

function HomeScreen({
  menuItems,
  onOpenSidebar,
  orderType,
  setOrderType,
  onPickItem,
  onOpenCart,
  totalQty,
  subtotal,
  onOpenMenu,
  hasActiveOrder,
  activeOrderNumber,
  onGoToStatus,
  selectedTable,
  setSelectedTable,
  tables,
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
}: {
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
}) {
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
  const [homeSelectedCat, setHomeSelectedCat] = useState("all");

  const homeFilteredItems = useMemo(() => {
    if (homeSelectedCat === "all") return menuItems;
    return menuItems.filter((m) => m.category === homeSelectedCat);
  }, [homeSelectedCat, menuItems]);

  return (
    <div className="pb-36" style={{ background: LINEN }}>
            {/* Hero */}
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
              aria-label="เปิดเมนูด้านข้าง"
          onClick={onOpenSidebar}
          className="absolute top-5 left-5 grid h-10 w-10 place-items-center rounded-full bg-white/15 backdrop-blur-md text-white border border-white/20"
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
                {language === "th" ? "ภาษาไทย" : language === "en" ? "English" : "中文"}
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
                  { code: "zh", label: "中文", text: "Chinese" }
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
                        background: isActive ? "rgba(252,193,74,0.15)" : "transparent",
                        color: isActive ? "#fcc14a" : "#ffffff",
                        fontWeight: isActive ? "800" : "600"
                      }}
                    >
                      <span className="flex items-center gap-2 tracking-wide">
                        <FlagIcon lang={item.code} />
                        {item.label}
                      </span>
                      {isActive && (
                        <Check size={12} className="text-[#fcc14a]" strokeWidth={3} />
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
          className="absolute top-5 right-5 flex items-center gap-1 text-white/90 text-xs bg-white/10 backdrop-blur-md px-3 py-2 rounded-full border border-white/15"
        >
          <ShoppingBag size={14} />
          {totalQty > 0 && (
            <span className="ml-1 inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full text-[10px] font-bold" style={{ background: GOLD, color: BRAND }}>
              {totalQty}
            </span>
          )}
        </button>

        <div className="absolute bottom-5 left-5 right-5 text-white">
          <p className="text-xs uppercase tracking-[0.2em] text-white/70">EPICUREAN</p>
          <h1 className="text-2xl font-bold mt-1">{t("สวัสดี, ยินดีต้อนรับ")}</h1>
          <p className="text-sm text-white/80 mt-1">{t("เลือกประสบการณ์การรับประทาน")}</p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold border backdrop-blur-sm ${isCurrentlyClosed
                  ? "bg-red-500/20 text-red-400 border-red-500/35"
                  : "bg-emerald-500/20 text-emerald-400 border-emerald-500/35"
                }`}>
                <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${isCurrentlyClosed ? "bg-red-400" : "bg-emerald-400"}`} />
                {isCurrentlyClosed ? t("ปิดบริการ") : t("เปิดบริการ")}
              </span>
              <span className="text-xs font-semibold text-white/90">
                {isCurrentlyClosed ? (language === "th" ? "อา. - ศ. 08:00 - 21:00" : "Sun - Fri 08:00 - 21:00") : "08:00 - 21:00"}
              </span>
              {bypassRealClosed && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/25 px-2 py-0.5 text-[9px] font-bold text-amber-300 border border-amber-500/30">
                  โหมดสาธิต
                </span>
              )}
            </div>
            <button
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
              className="inline-flex items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-[#ffcb44] to-[#fcc14a] px-5 py-2.5 text-sm font-bold shadow-[0_6px_20px_rgba(252,193,74,0.35)] transition-all duration-200 hover:scale-[1.03] active:scale-95 cursor-pointer"
              style={{ color: BRAND }}
            >
              {t("สั่งอาหาร")} <ChevronRight size={16} strokeWidth={2.5} />
            </button>
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
        <h3 className="text-sm font-bold mb-3 flex flex-wrap items-center gap-x-1.5" style={{ color: BRAND }}>
          <span>{t("ช่องทางการรับอาหาร")} <span className="text-red-500">*</span></span>
          {orderType === null && (
            <span className="text-xs text-slate-400 font-normal">
              {t("(กรุณาเลือกช่องทางการรับอาหารด้านบนเพื่อระบุรายละเอียด)")}
            </span>
          )}
        </h3>
        {showTypeError && (
          <p className="text-xs text-red-500 font-semibold mb-3">
            {t("* กรุณาเลือกช่องทางการรับอาหาร (ทานที่ร้าน, จัดส่งถึงที่ หรือ รับกลับบ้าน) ก่อนเริ่มสั่งซื้อ")}
          </p>
        )}
        <div className={`grid grid-cols-3 gap-2.5 p-1.5 rounded-2xl transition-all duration-300 ${showTypeError ? "border-2 border-red-500 bg-red-50/20" : "border-2 border-transparent"}`}>
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
              boxShadow: orderType === "dine-in" ? "0 6px 20px rgba(0,46,71,0.22)" : "0 2px 8px rgba(0,0,0,0.03)",
            }}
          >
            <div className="grid h-9 w-9 place-items-center rounded-xl transition-colors" style={{ background: orderType === "dine-in" ? "rgba(252,193,74,0.18)" : LINEN, color: orderType === "dine-in" ? GOLD : BRAND }}>
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
              boxShadow: orderType === "takeaway" ? "0 6px 20px rgba(0,46,71,0.22)" : "0 2px 8px rgba(0,0,0,0.03)",
            }}
          >
            <div className="grid h-9 w-9 place-items-center rounded-xl transition-colors" style={{ background: orderType === "takeaway" ? "rgba(252,193,74,0.18)" : LINEN, color: orderType === "takeaway" ? GOLD : BRAND }}>
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
              boxShadow: orderType === "delivery" ? "0 6px 20px rgba(0,46,71,0.22)" : "0 2px 8px rgba(0,0,0,0.03)",
            }}
          >
            <div className="grid h-9 w-9 place-items-center rounded-xl transition-colors" style={{ background: orderType === "delivery" ? "rgba(252,193,74,0.18)" : LINEN, color: orderType === "delivery" ? GOLD : BRAND }}>
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
                <DineInBlock selectedTable={selectedTable} onOpenPicker={onOpenTablePicker} />
              )}
              {orderType === "takeaway" && (
                <div className="space-y-1.5 p-1 text-center sm:text-left">
                  <h4 className="font-bold text-sm text-[#002e47] flex items-center justify-center sm:justify-start gap-1.5">
                    <ShoppingBag size={16} /> {t("รับกลับบ้าน")} (Take Away)
                  </h4>
                  <p className="text-xs text-slate-500 leading-normal font-semibold">
                    {t("ร้านจะจัดเตรียมแพ็กอาหารใส่กล่องให้อย่างดี คุณสามารถมารับอาหารได้ที่เคาน์เตอร์ร้านเมื่อสถานะเปลี่ยนเป็น")}
                    <strong className="text-[#059669] mx-1">"{t("พร้อมเสิร์ฟ")}"</strong>
                  </p>
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
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 grid h-9 w-9 place-items-center rounded-full bg-white/50 backdrop-blur-[2px] border border-[#ece4d6]/50 hover:bg-white/80 transition shadow-sm"
            style={{ color: BRAND, marginLeft: -4 }}
            aria-label={t("เลื่อนซ้าย")}
          >
            <ChevronLeft size={18} />
          </button>
          <div ref={scrollRef} className="-mx-5 px-10 overflow-x-auto no-scrollbar scroll-smooth">
            <div className="flex gap-4">
              {menuItems.filter((m) => m.category !== "drinks" && m.category !== "dessert").map((m, i) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
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
                    onPickItem(m);
                  }}
                  className="group bg-white rounded-2xl p-3.5 shadow-[0_4px_16px_rgba(0,0,0,0.04)] border border-[#ece4d6]/80 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_28px_rgba(0,46,71,0.12)] min-w-[220px] w-56 shrink-0 flex flex-col justify-between"
                >
                  <div>
                    <div className="relative h-36 w-full overflow-hidden rounded-xl mb-3">
                      <img src={encodeURI(String(m.image))} alt={tMenu(m.name, "name")} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      {m.category === "signature" && (
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#002e47]/85 text-[#fcc14a] backdrop-blur-md border border-[#fcc14a]/30">
                          Signature
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col">
                      <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider" style={{ color: GOLD }}>
                        <Star size={10} fill={GOLD} stroke={GOLD} />
                        <span style={{ color: INK_MUTED }}>{language === "th" ? "Chef's pick" : language === "zh" ? "厨师推荐" : "Chef's pick"}</span>
                      </div>
                      <h3 className="font-bold text-[15px] truncate mt-1 group-hover:text-[#002e47] transition-colors" style={{ color: BRAND }}>
                        {tMenu(m.name, "name")}
                      </h3>
                      <p className="text-xs mt-1 line-clamp-2 font-light" style={{ color: INK_MUTED }}>
                        {tMenu(m.desc, "desc")}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3.5 flex items-end justify-between pt-2 border-t border-slate-100">
                    <span className="font-extrabold text-base" style={{ color: BRAND }}>
                      ฿{m.price}
                    </span>
                    <button
                      aria-label={`หยิบ ${tMenu(m.name, "name")} ใส่ตะกร้า`}
                      onClick={(e) => {
                        e.stopPropagation();
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
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 grid h-9 w-9 place-items-center rounded-full bg-white/50 backdrop-blur-[2px] border border-[#ece4d6]/50 hover:bg-white/80 transition shadow-sm"
            style={{ color: BRAND, marginRight: -4 }}
            aria-label={t("เลื่อนขวา")}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Full Menu by Food Type Section */}
      <div className="px-5 md:px-12 mt-10 max-w-7xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-xl font-extrabold" style={{ color: BRAND }}>
              {t("รายการอาหารทั้งหมด")}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 font-light">
              เลือกดูตามประเภทอาหารและเครื่องดื่ม
            </p>
          </div>
          <button
            onClick={onOpenMenu}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#002e47] bg-[#fcc14a]/20 hover:bg-[#fcc14a]/30 px-3.5 py-1.5 rounded-full border border-[#fcc14a]/40 transition active:scale-95 cursor-pointer self-start sm:self-auto"
          >
            <Search size={14} /> ค้นหาเมนู <ChevronRight size={14} />
          </button>
        </div>

        {/* Food Type Pill Tabs */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-3 pt-1">
          {[
            { id: "all", label: "ทั้งหมด", icon: "🍽️" },
            { id: "signature", label: "Signature", icon: "⭐" },
            { id: "main", label: "ผัด & กับข้าว", icon: "🍳" },
            { id: "rice", label: "ข้าวผัด", icon: "🍚" },
            { id: "noodles", label: "เมนูเส้น", icon: "🍜" },
            { id: "vegetarian", label: "มังสวิรัติ", icon: "🥬" },
            { id: "drinks", label: "เครื่องดื่ม", icon: "🥤" },
            { id: "dessert", label: "ของหวาน", icon: "🍧" },
          ].map((cat) => {
            const active = homeSelectedCat === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setHomeSelectedCat(cat.id)}
                className="flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition-all duration-200 shrink-0 cursor-pointer shadow-sm border"
                style={{
                  background: active ? BRAND : "white",
                  color: active ? GOLD : BRAND,
                  borderColor: active ? BRAND : "#ece4d6",
                  boxShadow: active ? "0 4px 14px rgba(0,46,71,0.2)" : "0 2px 6px rgba(0,0,0,0.02)",
                }}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Full Menu Grid */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {homeFilteredItems.map((m) => (
            <div
              key={m.id}
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
                onPickItem(m);
              }}
              className="bg-white rounded-2xl p-3.5 shadow-sm border border-[#ece4d6]/80 flex items-start gap-3.5 cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 group"
            >
              <div className="relative h-20 w-20 rounded-xl overflow-hidden flex-shrink-0">
                <img
                  src={encodeURI(String(m.image))}
                  alt={tMenu(m.name, "name")}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch">
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-[#002e47] border border-slate-200/80">
                      {m.category === "signature" ? "⭐ Signature" :
                       m.category === "main" ? "🍳 ผัด/กับข้าว" :
                       m.category === "rice" ? "🍚 ข้าวผัด" :
                       m.category === "noodles" ? "🍜 เมนูเส้น" :
                       m.category === "vegetarian" ? "🥬 มังสวิรัติ" :
                       m.category === "drinks" ? "🥤 เครื่องดื่ม" :
                       m.category === "dessert" ? "🍧 ของหวาน" : m.category}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm truncate group-hover:text-[#002e47] transition-colors" style={{ color: BRAND }}>
                    {tMenu(m.name, "name")}
                  </h3>
                  <p className="text-xs mt-0.5 text-slate-500 line-clamp-1 font-light">
                    {tMenu(m.desc, "desc")}
                  </p>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="font-extrabold text-base" style={{ color: BRAND }}>
                    ฿{m.price}
                  </span>
                  <button
                    aria-label={`หยิบ ${tMenu(m.name, "name")} ใส่ตะกร้า`}
                    onClick={(e) => {
                      e.stopPropagation();
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
                      onPickItem(m);
                    }}
                    className="grid h-8 w-8 place-items-center rounded-full shadow-sm cursor-pointer transition-transform duration-200 active:scale-90 hover:scale-105"
                    style={{ background: BRAND, color: GOLD }}
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>


      {/* Inline cart removed — using fixed cart bar inside app frame */}
      {/* Persistent CTA when cart empty */}

      {/* Table picker moved to LiffApp overlay layer */}
    </div>
  );
}

function TablePickerBottomSheet({
  tables,
  selectedTable,
  onSelect,
  onClose,
}: {
  tables: { id: string; label: string; status: string }[];
  selectedTable: string;
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
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
              <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400 font-semibold">เลือกโต๊ะ</p>
              <h2 className="text-base font-bold text-slate-800">ผังที่นั่ง</h2>
            </div>

            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors shrink-0"
            >
              <X size={15} />
            </motion.button>
          </div>

          {/* Filter */}
          <div className="px-4 py-3 flex gap-2 flex-shrink-0">
            {[
              { id: "all", label: "ทั้งหมด", dot: "#94a3b8" },
              { id: "available", label: "ว่าง", dot: "#15803d" },
              { id: "occupied", label: "ไม่ว่าง", dot: "#dc2626" },
            ].map((opt) => (
              <motion.button
                key={opt.id}
                whileTap={{ scale: 0.9 }}
                onClick={() => setTableFilter(opt.id as any)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold border transition-all flex-1 justify-center"
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
                  <p className="text-sm font-semibold text-slate-400">ไม่พบข้อมูลโต๊ะ</p>
                </div>
              ) : (
                displayTables.map((table) => {
                  const available = table.status === "available";
                  const isSelected = selectedTable === table.id;
                  const isWalkIn = table.label.toLowerCase().includes("walk-in") || table.label.includes("หน้าร้าน");

                  const boxBg = isWalkIn ? "#f1f5f9" : isSelected ? BRAND : available ? "#dcfce7" : "#fee2e2";
                  const boxBorder = isWalkIn ? "#cbd5e1" : isSelected ? BRAND : available ? "#15803d" : "#dc2626";
                  const boxText = isWalkIn ? "#475569" : isSelected ? GOLD : available ? "#14532d" : "#7f1d1d";
                  const boxSub = isWalkIn ? "#64748b" : isSelected ? "rgba(252,193,74,0.7)" : available ? "#166534" : "#991b1b";
                  const badgeBg = isWalkIn ? "#e2e8f0" : isSelected ? "rgba(252,193,74,0.2)" : available ? "#bbf7d0" : "#fecaca";
                  const badgeText = isWalkIn ? "#475569" : isSelected ? GOLD : available ? "#14532d" : "#7f1d1d";

                  return (
                    <motion.button
                      key={table.id}
                      aria-label={`เลือก ${table.label}`}
                      disabled={isWalkIn || (!available && !isSelected)}
                      onClick={() => !isWalkIn && available && onSelect(table.id)}
                      className="rounded-2xl p-4 text-left relative overflow-hidden"
                      style={{
                        background: boxBg,
                        color: boxText,
                        border: `2px solid ${boxBorder}`,
                        opacity: isWalkIn ? 0.8 : (!available && !isSelected ? 0.8 : 1),
                        cursor: isWalkIn ? "not-allowed" : (available ? "pointer" : "not-allowed"),
                      }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-xs truncate max-w-[85px]">{table.label}</span>
                        <span
                          className="text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0"
                          style={{ background: badgeBg, color: badgeText }}
                        >
                          {isWalkIn ? "Walk-in" : isSelected ? "เลือกแล้ว" : available ? "ว่าง" : "ไม่ว่าง"}
                        </span>
                      </div>
                      <p className="mt-1 text-[10px]" style={{ color: boxSub }}>
                        {isWalkIn ? "สำหรับหน้าร้าน" : "ความจุ 2-4 คน"}
                      </p>
                    </motion.button>
                  );
                })
              )}
            </div>

            {/* Legend */}
            <div className="mt-4 rounded-xl bg-slate-50 px-3 py-2.5 flex items-center gap-3">
              <p className="text-[11px] font-semibold text-slate-500">สถานะโต๊ะ:</p>
              <div className="flex gap-2 flex-wrap">
                <span className="flex items-center gap-1 text-[10px] font-bold text-[#14532d] bg-[#dcfce7] px-2 py-0.5 rounded-full border border-[#15803d]">
                  ว่าง
                </span>
                <span className="flex items-center gap-1 text-[10px] font-bold text-[#7f1d1d] bg-[#fee2e2] px-2 py-0.5 rounded-full border border-[#dc2626]">
                  ไม่ว่าง
                </span>
                <span className="flex items-center gap-1 text-[10px] font-bold text-[#475569] bg-[#f1f5f9] px-2 py-0.5 rounded-full border border-[#cbd5e1]">
                  สำหรับ Walk-in
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// Item Modal
// ─────────────────────────────────────────────────────────────
function ItemModal({
  item,
  onClose,
  onAdd,
  checkOptionOutOfStock,
  cartLine,
}: {
  item: MenuItem;
  onClose: () => void;
  onAdd: (line: CartLine) => void;
  checkOptionOutOfStock: (optionId: string) => boolean;
  cartLine?: CartLine;
}) {
  const { language, t, tMenu } = useLanguage();
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
    const found = PROTEINS.find((p) => p.name !== "ไม่เอาเนื้อสัตว์" && item.name.includes(p.name));
    return found ? found.id : "p_minced_pork";
  }, [item.name, isFood]);

  const [protein, setProtein] = useState(() => {
    if (cartLine && isFood && cartLine.options.protein) {
      const found = PROTEINS.find((p) => p.name === cartLine.options.protein);
      if (found) return found.id;
    }
    if (!isFood) return "";
    const found = PROTEINS.find((p) => p.name !== "ไม่เอาเนื้อสัตว์" && item.name.includes(p.name));
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

    const toppingsPrice = TOPPINGS
      .filter((t) => selectedToppings.includes(t.id))
      .reduce((sum, t) => sum + t.price, 0);

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
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{t("ระบุความต้องการพิเศษ")}</p>
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
              className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-slate-700 shadow-sm"
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
                <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ background: "#fff2d6", color: BRAND }}>
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
                      className="w-full flex items-center justify-between rounded-xl border px-4 py-3 text-left"
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
                        {active && <span className="h-2.5 w-2.5 rounded-full" style={{ background: BRAND }} />}
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
                  <h3 className="font-semibold text-sm flex items-center gap-1.5" style={{ color: BRAND }}>
                    🥩 {t("เลือกเนื้อสัตว์")}
                  </h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: "#fff2d6", color: BRAND }}>
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
                          cursor: isOutOfStock ? "not-allowed" : "pointer"
                        }}
                      >
                        <span className={`text-xs font-semibold ${isOutOfStock ? "line-through text-slate-400" : ""}`} style={{ color: isOutOfStock ? undefined : BRAND }}>
                          {t(p.name)} {isOutOfStock && `(${t("หมด")})`}
                        </span>
                        <span className="text-[11px] font-bold" style={{ color: active ? BRAND : INK_MUTED }}>
                          {isOutOfStock ? "" : p.price > 0 ? `+${p.price} ฿` : t("ฟรี")}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Choose Size */}
              <div className="mt-6">
                <h3 className="font-semibold text-sm flex items-center gap-1.5 mb-2.5" style={{ color: BRAND }}>
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
                        className="flex items-center justify-between rounded-xl border px-4 py-3 text-left transition duration-150"
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
                <h3 className="font-semibold text-sm flex items-center gap-1.5 mb-2.5" style={{ color: BRAND }}>
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
                            active ? prev.filter((id) => id !== topping.id) : [...prev, topping.id]
                          )
                        }
                        className="flex items-center justify-between rounded-xl border p-3 text-left transition duration-150 relative overflow-hidden"
                        style={{
                          borderColor: active ? BRAND : isOutOfStock ? "#f1f5f9" : "#ece4d6",
                          background: active ? "#fffcf5" : isOutOfStock ? "#f8fafc" : "white",
                          opacity: isOutOfStock ? 0.5 : 1,
                          cursor: isOutOfStock ? "not-allowed" : "pointer"
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
                          <span className={`text-xs font-medium ${isOutOfStock ? "line-through text-slate-400" : ""}`} style={{ color: isOutOfStock ? undefined : BRAND }}>
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
            item.addons && item.addons.length > 0 && (
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
                            active ? s.filter((x) => x !== a.id) : [...s, a.id]
                          )
                        }
                        className="w-full flex items-center justify-between rounded-xl border px-4 py-3 text-left"
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
                            + {a.name}
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
            <label htmlFor="special-instructions" className="font-semibold mb-2 block" style={{ color: BRAND }}>
              ระบุความต้องการพิเศษ
            </label>
            <textarea
              id="special-instructions"
              name="special-instructions"
              aria-label="ระบุความต้องการพิเศษ"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="เช่น ไม่ใส่ผัก, รสจัดพิเศษ"
              className="w-full rounded-xl border bg-white p-3 text-sm focus:outline-none focus:ring-2"
              style={{ borderColor: "#ece4d6", color: BRAND, minHeight: 80 }}
            />
          </div>
        </div>

        {/* sticky footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t" style={{ borderColor: "#f1ece4" }}>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-[var(--surface)] rounded-full p-1">
              <button
                aria-label="ลดจำนวนชิ้น"
                onClick={() => setQty(Math.max(1, qty - 1))}
                className="grid h-9 w-9 place-items-center rounded-full"
                style={{ background: "white", color: BRAND }}
              >
                <Minus size={16} />
              </button>
              <span className="w-7 text-center font-bold" style={{ color: BRAND }}>
                {qty}
              </span>
              <button
                aria-label="เพิ่มจำนวนชิ้น"
                onClick={() => setQty(qty + 1)}
                className="grid h-9 w-9 place-items-center rounded-full"
                style={{ background: BRAND, color: GOLD }}
              >
                <Plus size={16} />
              </button>
            </div>
            <button
              aria-label={cartLine ? `บันทึกการแก้ไข ${formattedName} จำนวน ${qty} ชิ้น รวมราคา ${total} บาท` : `เพิ่ม ${formattedName} ลงตะกร้า จำนวน ${qty} ชิ้น รวมราคา ${total} บาท`}
              onClick={handleAdd}
              className="flex-1 h-12 rounded-full font-semibold flex items-center justify-between px-5 transition active:scale-95 cursor-pointer"
              style={{ background: BRAND, color: "white" }}
            >
              <span>{cartLine ? "บันทึกการแก้ไข" : "เพิ่มลงตะกร้า"}</span>
              <span>฿{total}</span>
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// Menu Overlay
// ─────────────────────────────────────────────────────────────
function MenuOverlay({
  onBack,
  onPickItem,
  onOpenCart,
  totalQty,
  subtotal,
  menuItems,
}: {
  onBack: () => void;
  onPickItem: (m: MenuItem) => void;
  onOpenCart: () => void;
  totalQty: number;
  subtotal: number;
  menuItems: MenuItem[];
}) {
  const { language, t, tMenu } = useLanguage();
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
    let list = activeCat === "all"
      ? menuItems
      : menuItems.filter((m) => m.category === activeCat);

    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          (m.desc && m.desc.toLowerCase().includes(q))
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
            className="grid h-10 w-10 place-items-center rounded-full bg-white"
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
              <span className="absolute -top-1 -right-1 grid h-5 min-w-5 px-1 place-items-center rounded-full text-[10px] font-bold border-2 border-white" style={{ background: GOLD, color: BRAND }}>
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
                className="text-slate-400 hover:text-slate-600 transition"
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
                className="relative rounded-full px-4 py-2 text-sm font-medium transition"
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
            <div className="text-center py-16 flex flex-col items-center justify-center">
              <Search size={32} className="text-slate-300 mb-2" />
              <p className="text-sm font-semibold text-slate-500">ไม่พบเมนูที่คุณค้นหา</p>
              <p className="text-xs text-slate-400 mt-1">ลองใช้คำอื่น หรือรีเซ็ตการค้นหา</p>
              <button
                onClick={() => setSearchQuery("")}
                className="mt-4 px-4 py-2 bg-[#002e47] text-[#fcc14a] rounded-full text-xs font-bold shadow-soft cursor-pointer transition active:scale-95"
              >
                ล้างคำค้นหา
              </button>
            </div>
          ) : (
            filteredAndSortedItems.map((m) => (
              <div key={m.id} className="w-full bg-white rounded-2xl p-3 shadow-soft flex items-start gap-3">
                <img src={encodeURI(String(m.image))} alt={tMenu(m.name, "name")} className="h-20 w-20 rounded-xl object-cover flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-sm truncate" style={{ color: BRAND }}>{tMenu(m.name, "name")}</h3>
                      <p className="text-xs mt-1 text-slate-500 whitespace-normal">{tMenu(m.desc, "desc")}</p>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="font-bold text-lg" style={{ color: "#a16207" }}>฿{m.price}</span>
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
              className="w-full rounded-2xl px-5 py-4 flex items-center justify-between shadow-lift"
              style={{ background: BRAND, color: "white" }}
            >
              <div className="flex items-center gap-3">
                <div className="relative grid h-9 w-9 place-items-center rounded-xl" style={{ background: "rgba(252,193,74,0.15)" }}>
                  <ShoppingBag size={18} style={{ color: GOLD }} />
                  <span className="absolute -top-1 -right-1 grid h-5 min-w-5 px-1 place-items-center rounded-full text-[10px] font-bold" style={{ background: GOLD, color: BRAND }}>
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
                  <h2 className="text-base font-bold flex items-center gap-1.5" style={{ color: BRAND }}>
                    <SlidersHorizontal size={16} />
                    <span>{t("เรียงลำดับตาม")}</span>
                  </h2>
                  <button onClick={() => setShowSortModal(false)} className="text-sm font-semibold" style={{ color: INK_MUTED }}>
                    {t("เสร็จสิ้นการเลือก")}
                  </button>
                </div>
              </div>

              <div className="px-5 mt-4 space-y-2.5">
                {[
                  { id: "default", label: "🔥 ยอดนิยม (แนะนำ)", desc: "เมนูขายดีประจำสัปดาห์" },
                  { id: "price-low", label: "💵 ราคา: ต่ำ - สูง", desc: "เมนูราคาประหยัด เรียงตามเงินบาท" },
                  { id: "price-high", label: "💵 ราคา: สูง - ต่ำ", desc: "เมนูระดับพรีเมียมคัดสรรพิเศษ" },
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
                        <p className="font-semibold text-sm" style={{ color: BRAND }}>{t(opt.label)}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{t(opt.desc)}</p>
                      </div>
                      <div
                        className="h-5 w-5 rounded-full border-2 flex items-center justify-center transition"
                        style={{
                          borderColor: active ? BRAND : "#cbd5e1",
                          background: active ? BRAND : "transparent"
                        }}
                      >
                        {active && (
                          <div className="h-2 w-2 rounded-full bg-[#fcc14a]" />
                        )}
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

// ─────────────────────────────────────────────────────────────
// Cart Drawer
// ─────────────────────────────────────────────────────────────
function CartDrawer({
  cart,
  subtotal,
  onClose,
  onRemove,
  onEdit,
  onCheckout,
}: {
  cart: CartLine[];
  subtotal: number;
  onClose: () => void;
  onRemove: (id: string) => void;
  onEdit: (line: CartLine) => void;
  onCheckout: () => void;
}) {
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
              ตะกร้าของคุณ
            </h2>
            <button aria-label="ปิดตะกร้า" onClick={onClose} className="text-sm" style={{ color: INK_MUTED }}>
              ปิด
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar px-5 py-4 space-y-3">
          {cart.length === 0 && (
            <p className="text-center py-10 text-sm" style={{ color: INK_MUTED }}>
              ยังไม่มีรายการในตะกร้า
            </p>
          )}
          {cart.map((l) => (
            <div key={l.id} className="flex gap-3 bg-[var(--surface)] rounded-2xl p-3">
              <img src={encodeURI(String(l.image))} alt={l.name} className="h-16 w-16 rounded-xl object-cover" />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm" style={{ color: BRAND }}>
                  {l.name}
                </h3>
                <p className="text-xs" style={{ color: INK_MUTED }}>
                  × {l.qty}
                  {l.addons.length > 0 && ` · ${l.addons.map((a) => a.name).join(", ")}`}
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
          <div className="px-5 pt-3 pb-5 border-t space-y-3" style={{ borderColor: "#f1ece4" }}>
            <div className="flex items-center justify-between text-sm">
              <span style={{ color: INK_MUTED }}>ยอดรวม</span>
              <span className="font-bold text-base" style={{ color: BRAND }}>
                ฿{subtotal}
              </span>
            </div>
            <button
              aria-label="ดำเนินการสั่งซื้อสินค้าในตะกร้า"
              onClick={onCheckout}
              className="w-full h-12 rounded-full font-semibold"
              style={{ background: BRAND, color: "white" }}
            >
              ดำเนินการสั่งซื้อ
            </button>
          </div>
        )}
      </motion.aside>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// Order Confirm
// ─────────────────────────────────────────────────────────────
function OrderConfirmOverlay({
  cart,
  subtotal,
  deliveryFee,
  onBack,
  onRemove,
  onEdit,
  onProceed,
}: {
  cart: CartLine[];
  subtotal: number;
  deliveryFee: number;
  onBack: () => void;
  onRemove: (id: string) => void;
  onEdit: (line: CartLine) => void;
  onProceed: () => void;
}) {
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
              className="grid h-10 w-10 place-items-center rounded-full bg-white/10 border border-white/15"
            >
              <ChevronLeft size={20} color={GOLD} />
            </button>
            <h1 className="text-lg font-bold">รายการสั่งซื้อในตะกร้า</h1>
          </div>
          <p className="text-sm mt-2 text-white/70">ตรวจสอบรายการก่อนชำระเงิน</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-5 mt-4 space-y-3">
        {cart.map((l) => (
          <div key={l.id} className="bg-white rounded-2xl p-4 shadow-soft">
            <div className="flex gap-3">
              <img src={encodeURI(String(l.image))} alt={l.name} className="h-16 w-16 rounded-xl object-cover" />
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
                  จำนวน × {l.qty} · ฿{l.price}/ชิ้น
                </p>
                {l.addons.length > 0 && (
                  <p className="text-xs mt-0.5" style={{ color: INK_MUTED }}>
                    + {l.addons.map((a) => a.name).join(", ")}
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
                <Pencil size={14} /> แก้ไขรายการ
              </button>
              <button
                onClick={() => onRemove(l.id)}
                className="flex-1 py-2 rounded-xl text-sm font-medium flex items-center justify-center gap-1 transition active:scale-95 cursor-pointer"
                style={{ background: "#fee2e2", color: "#dc2626" }}
              >
                <Trash2 size={14} /> ลบรายการ
              </button>
            </div>
          </div>
        ))}

        <div className="bg-white rounded-2xl p-4 shadow-soft space-y-2.5">
          <h3 className="font-semibold mb-2" style={{ color: BRAND }}>
            สรุปคำสั่งซื้อ
          </h3>
          <Row label="ยอดรวมอาหาร" value={`฿${subtotal}`} />
          <Row label="ค่าจัดส่ง" value={`฿${deliveryFee}`} />
          <div className="border-t pt-2.5 mt-2.5" style={{ borderColor: "#f1ece4" }}>
            <Row label="รวมทั้งหมด" value={`฿${grand}`} bold />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-soft">
          <label className="text-sm font-semibold flex items-center gap-2" style={{ color: BRAND }}>
            <Phone size={14} /> เบอร์โทรสำหรับติดต่อ
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
    </motion.div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span style={{ color: bold ? BRAND : INK_MUTED, fontWeight: bold ? 600 : 400 }}>{label}</span>
      <span className={bold ? "text-lg" : ""} style={{ color: BRAND, fontWeight: bold ? 700 : 500 }}>
        {value}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Payment
// ─────────────────────────────────────────────────────────────
function PaymentOverlay({
  total,
  cart,
  orderType,
  deliveryFee,
  subtotal,
  selectedTable,
  address,
  onBack,
  onSuccess,
}: {
  total: number;
  cart: CartLine[];
  orderType: OrderType;
  deliveryFee: number;
  subtotal: number;
  selectedTable: string;
  address: string;
  onBack: () => void;
  onSuccess: () => void;
}) {
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
          cart: cart.map(l => ({
            name: l.name,
            price: l.price,
            qty: l.qty,
            image: l.image || null,
          })),
          subtotal,
          deliveryFee,
          orderType,
          origin,
        }
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
            <h1 className="text-lg font-bold">ชำระเงินค่าอาหาร</h1>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-5 space-y-4">
        {/* Stripe Content */}
        <div className="bg-white rounded-3xl p-5 shadow-soft border border-slate-50 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <span className="text-sm font-bold text-slate-800">สรุปรายการสั่งซื้อ</span>
            <span className="text-xs text-slate-400 font-medium">({cart.length} รายการ)</span>
          </div>
          
          <div className="space-y-2 text-sm text-slate-600">
            <div className="flex justify-between">
              <span>ค่าอาหาร (Subtotal)</span>
              <span>฿{subtotal.toLocaleString()}</span>
            </div>
            {deliveryFee > 0 && (
              <div className="flex justify-between">
                <span>ค่าจัดส่ง (Delivery Fee)</span>
                <span>฿{deliveryFee.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between pt-3 border-t border-slate-100 font-bold text-slate-800 text-base">
              <span>ยอดชำระทั้งหมด</span>
              <span style={{ color: BRAND }}>฿{total.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Information Card */}
        <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200/50 flex gap-3 text-xs text-amber-800 leading-relaxed shadow-sm">
          <span className="text-lg">💡</span>
          <div>
            <p className="font-bold mb-0.5">ระบบชำระเงิน Stripe (โอนเงิน/บัตรเครดิต)</p>
            <p className="text-amber-700">ชำระได้ทั้ง PromptPay QR Code และ บัตรเครดิต ผ่านแพลตฟอร์ม Stripe ที่ปลอดภัยระดับมาตรฐานสากล</p>
            <p className="mt-1.5 text-[10px] text-amber-600 italic">หมายเหตุ: หากผู้พัฒนายังไม่ได้ใส่กุญแจ Stripe ลับในระบบ ระบบจะทำงานใน sandbox mode อัตโนมัติ เพื่อให้จำลองความสำเร็จได้ทันที</p>
          </div>
        </div>

        {/* Stripe Badges */}
        <div className="flex flex-col items-center justify-center py-4 bg-white rounded-3xl border border-slate-100 shadow-soft gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold">
            <span>Secured by</span>
            <span className="text-[#635bff] font-extrabold tracking-tight text-sm">stripe</span>
          </div>
          <div className="flex items-center gap-3 opacity-60">
            <span className="text-[10px] bg-slate-100 px-2 py-1 rounded font-bold text-slate-500">VISA</span>
            <span className="text-[10px] bg-slate-100 px-2 py-1 rounded font-bold text-slate-500">MASTERCARD</span>
            <span className="text-[10px] bg-slate-100 px-2 py-1 rounded font-bold text-slate-500">JCB</span>
            <span className="text-[10px] bg-slate-100 px-2 py-1 rounded font-bold text-slate-500">PROMPTPAY</span>
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
                <span>ชำระผ่าน Stripe ฿{total.toLocaleString()}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function MockQR() {
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
        if ((d.i < 8 && d.j < 8) || (d.i < 8 && d.j > cells - 9) || (d.i > cells - 9 && d.j < 8))
          return null;
        return <rect key={k} x={d.i * c} y={d.j * c} width={c} height={c} fill={BRAND} />;
      })}
      <Corner x={0} y={0} />
      <Corner x={size - c * 7} y={0} />
      <Corner x={0} y={size - c * 7} />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────
// Stripe Helpers
// ─────────────────────────────────────────────────────────────
function StripeVerifyingFlash() {
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
          กำลังตรวจสอบการชำระเงินผ่าน Stripe...
        </p>
        <p className="text-white/60 text-sm">
          กรุณาอย่าปิดหน้านี้
        </p>
      </div>
    </motion.div>
  );
}

function StripeErrorOverlay({ error, onClose }: { error: string; onClose: () => void }) {
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
        <h3 className="text-lg font-bold text-slate-900 mb-2">การชำระเงินไม่สำเร็จ</h3>
        <p className="text-sm text-slate-500 mb-6 leading-relaxed">{error}</p>
        <button
          onClick={onClose}
          className="w-full h-12 rounded-full font-semibold text-white transition-all shadow-md active:scale-[0.98]"
          style={{ background: BRAND }}
        >
          ตกลง
        </button>
      </motion.div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// Success flash
// ─────────────────────────────────────────────────────────────
function SuccessFlash() {
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
          ชำระเงินสำเร็จ
        </motion.p>
      </div>
    </motion.div>
  );
}

// Status Screen
// ─────────────────────────────────────────────────────────────
function StatusScreen({
  onOpenSidebar,
  activeOrder,
}: {
  onOpenSidebar: () => void;
  activeOrder?: OrderHistory;
}) {
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [selectedReason, setSelectedReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [promptPayNumber, setPromptPayNumber] = useState("");
  const [errorText, setErrorText] = useState("");

  const orderType = activeOrder?.orderType || "delivery";
  const currentStatus = activeOrder?.status || "รอรับออเดอร์";

  const steps = orderType === "dine-in"
    ? [
      { id: 1, label: "รับออเดอร์", icon: Check, done: currentStatus !== "รอรับออเดอร์", active: currentStatus === "รอรับออเดอร์" },
      { id: 2, label: "กำลังทำอาหาร", icon: ChefHat, done: currentStatus === "สำเร็จ", active: currentStatus === "กำลังเตรียม" },
      { id: 3, label: "เสร็จสิ้น", icon: PartyPopper, done: currentStatus === "สำเร็จ", active: false },
    ]
    : orderType === "takeaway"
      ? [
        { id: 1, label: "รับออเดอร์", icon: Check, done: currentStatus !== "รอรับออเดอร์", active: currentStatus === "รอรับออเดอร์" },
        { id: 2, label: "กำลังเตรียมอาหาร", icon: ChefHat, done: currentStatus === "สำเร็จ", active: currentStatus === "กำลังเตรียม" },
        { id: 3, label: "พร้อมรับอาหาร", icon: ShoppingBag, done: currentStatus === "สำเร็จ", active: false },
      ]
      : [
        { id: 1, label: "รับออเดอร์", icon: Check, done: currentStatus !== "รอรับออเดอร์", active: currentStatus === "รอรับออเดอร์" },
        { id: 2, label: "กำลังเตรียมอาหาร", icon: ChefHat, done: currentStatus === "กำลังจัดส่ง" || currentStatus === "สำเร็จ", active: currentStatus === "กำลังเตรียม" },
        { id: 3, label: "คนรับอาหาร/กำลังขับไป", icon: Bike, done: currentStatus === "สำเร็จ", active: currentStatus === "กำลังจัดส่ง" },
        { id: 4, label: "เสร็จสิ้น", icon: PartyPopper, done: currentStatus === "สำเร็จ", active: false },
      ];

  const orderItems = activeOrder
    ? activeOrder.items
    : ([
      { name: "Premium Wagyu Don", qty: 1, price: 420 },
      { name: "Matcha Latte", qty: 2, price: 120 },
    ] as { name: string; qty: number; price: number }[]);
  const total = activeOrder ? activeOrder.total : 420 + 240 + 40;

  // Dynamic status text & theme based on order state
  const statusTheme = useMemo(() => {
    if (currentStatus === "ขอคืนเงิน") {
      return {
        title: "ยื่นขอคืนเงินแล้ว",
        subtitle: "ร้านค้ากำลังตรวจสอบและโอนเงินคืนตามพร้อมเพย์ที่ท่านระบุ",
        color: "#f59e0b", // Amber
        bg: "rgba(245, 158, 11, 0.08)",
        iconColor: "#f59e0b"
      };
    }
    if (currentStatus === "ยกเลิกแล้ว") {
      return {
        title: "ออเดอร์ถูกยกเลิกแล้ว",
        subtitle: "การคืนเงินสำเร็จหรือยกเลิกคำสั่งซื้อเรียบร้อยแล้ว",
        color: "#ef4444", // Red
        bg: "rgba(239, 68, 68, 0.08)",
        iconColor: "#ef4444"
      };
    }
    if (currentStatus === "รอรับออเดอร์") {
      return {
        title: "กำลังรอรับออเดอร์",
        subtitle: "ร้านค้ากำลังตรวจสอบสลิปและเตรียมเข้าครัว",
        color: "#3b82f6", // Blue
        bg: "rgba(59, 130, 246, 0.08)",
        iconColor: "#3b82f6"
      };
    }
    // สำหรับสถานะเตรียมอาหาร หรือจัดส่งสำเร็จ
    return {
      title: currentStatus === "สำเร็จ" ? "รายการสำเร็จ" : "กำลังดำเนินการ",
      subtitle: currentStatus === "สำเร็จ"
        ? ""
        : (orderType === "dine-in" ? "รอเสิร์ฟอาหารในอีก 10 นาที" : "รอรับอาหารในอีก 14 นาที"),
      color: "#10b981", // Emerald
      bg: "rgba(16, 185, 129, 0.08)",
      iconColor: "#10b981"
    };
  }, [currentStatus, orderType]);

  const cancelReasonsList = [
    "สั่งอาหารผิดเมนู / ลืมเพิ่มบางรายการ",
    "ต้องการเปลี่ยนที่อยู่จัดส่ง / วิธีรับอาหาร",
    "รอนานเกินไป / เปลี่ยนใจไม่ทานแล้ว",
    "อื่น ๆ (ระบุด้านล่าง)"
  ];

  const handleRequestCancel = () => {
    if (!selectedReason) {
      setErrorText("กรุณาเลือกเหตุผลในการยกเลิก");
      return;
    }
    if (selectedReason === "อื่น ๆ (ระบุด้านล่าง)" && !customReason.trim()) {
      setErrorText("กรุณาระบุรายละเอียดเหตุผลเพิ่มเติม");
      return;
    }
    if (!promptPayNumber.trim()) {
      setErrorText("กรุณากรอกเบอร์พร้อมเพย์ หรือเลขบัญชีธนาคารสำหรับรับเงินคืน");
      return;
    }

    // Save cancellation state to localStorage
    const saved = localStorage.getItem("ran-lung-get-orders");
    if (saved && activeOrder) {
      try {
        const history: OrderHistory[] = JSON.parse(saved);
        const updated = history.map(o => {
          if (o.orderNumber === activeOrder.orderNumber) {
            return {
              ...o,
              status: "ขอคืนเงิน" as const,
              cancelReason: selectedReason,
              cancelNote: customReason,
              refundPromptPay: promptPayNumber
            };
          }
          return o;
        });
        localStorage.setItem("ran-lung-get-orders", JSON.stringify(updated));
        // dispatch storage event manually for same-page listeners if needed
        window.dispatchEvent(new StorageEvent("storage", {
          key: "ran-lung-get-orders",
          newValue: JSON.stringify(updated)
        }));
      } catch (e) {
        console.error("Cancel failed:", e);
      }
    }

    setShowCancelDialog(false);
    setErrorText("");
  };

    return (
    <div className="min-h-full pb-28 relative w-full" style={{ background: SURFACE }}>
      <div className="max-w-2xl mx-auto w-full">
        {/* Reassurance Banner */}
        {currentStatus === "ขอคืนเงิน" && (
        <div className="mx-5 mt-4 p-4 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col gap-1.5 shadow-sm">
          <div className="flex items-center gap-2 text-amber-800 font-bold text-sm">
            <span className="animate-pulse">●</span>
            <span>กำลังดำเนินการคืนเงิน</span>
          </div>
          <p className="text-xs text-amber-700 leading-relaxed font-medium">
            ทางครัวได้รับคำขอแล้ว และกำลังดำเนินการโอนเงินคืนจำนวน
            <strong className="text-amber-900 mx-1">฿{total.toLocaleString()}</strong>
            ไปที่พร้อมเพย์: <strong className="text-amber-900">{activeOrder?.refundPromptPay}</strong>
          </p>
          <p className="text-[10px] text-amber-600">
            หากต้องการสอบถามเพิ่มเติม โทรหาร้านค้าได้โดยตรงที่ด้านล่าง
          </p>
        </div>
      )}

      {currentStatus === "ยกเลิกแล้ว" && (
        <div className="mx-5 mt-4 p-4 rounded-2xl bg-red-50 border border-red-200 flex flex-col gap-1 shadow-sm">
          <div className="flex items-center gap-2 text-red-800 font-bold text-sm">
            <span>●</span>
            <span>ยกเลิกออเดอร์สำเร็จ</span>
          </div>
          <p className="text-xs text-red-700 font-medium">
            ออเดอร์นี้ได้ทำการยกเลิกและคืนเงินเรียบร้อยแล้ว
          </p>
        </div>
      )}

      <div className="px-5 py-4 bg-white border-b flex items-center gap-3" style={{ borderColor: "#eef2f6" }}>
        <button
          onClick={onOpenSidebar}
          className="grid h-10 w-10 place-items-center rounded-full"
          style={{ background: SURFACE, color: BRAND }}
        >
          <Menu size={20} />
        </button>
        <h1 className="text-lg font-bold" style={{ color: BRAND }}>
          สถานะการสั่งซื้อ
        </h1>
      </div>

      <div className="flex flex-col items-center pt-8 pb-6 px-5 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", damping: 12, stiffness: 180 }}
          className="grid h-24 w-24 place-items-center rounded-full"
          style={{ background: statusTheme.bg, color: statusTheme.color }}
        >
          <CheckCircle size={56} color={statusTheme.iconColor} strokeWidth={2} />
        </motion.div>
        <h2 className="mt-5 text-2xl font-bold" style={{ color: BRAND }}>
          {statusTheme.title}
        </h2>
        {statusTheme.subtitle && (
          <p className="mt-1 text-sm max-w-xs mx-auto leading-relaxed" style={{ color: INK_MUTED }}>
            {statusTheme.subtitle}
          </p>
        )}

        {activeOrder?.orderType === "takeaway" && activeOrder?.queueNumber && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-4 px-6 py-2.5 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center bg-purple-50 border-purple-200 w-[90%] mx-auto"
          >
            <span className="text-[10px] uppercase font-black tracking-widest text-purple-600">
              คิวรับอาหารกลับบ้าน (Takeaway Queue)
            </span>
            <span className="text-3xl font-black mt-0.5" style={{ color: BRAND }}>
              {activeOrder.queueNumber}
            </span>
            <span className="text-[10px] text-slate-400 mt-1 text-center leading-normal font-bold">
              * โปรดแสดงหมายเลขคิวนี้ต่อพนักงานที่เคาน์เตอร์เพื่อรับอาหาร
            </span>
          </motion.div>
        )}
      </div>

      <div className="px-5 space-y-4">
        <div className="bg-white rounded-2xl p-4 shadow-soft">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs" style={{ color: INK_MUTED }}>
              หมายเลขออเดอร์
            </p>
            <p className="text-sm font-bold" style={{ color: BRAND }}>
              {activeOrder ? activeOrder.orderNumber : "#AK-2847"}
            </p>
          </div>
          <div className="space-y-2">
            {orderItems.map((o, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span style={{ color: BRAND }}>
                  {o.name} <span style={{ color: INK_MUTED }}>× {o.qty}</span>
                </span>
                <span className="font-medium" style={{ color: BRAND }}>
                  ฿{o.price * o.qty}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t flex items-center justify-between" style={{ borderColor: "#f1ece4" }}>
            <span className="text-sm" style={{ color: INK_MUTED }}>
              รวมทั้งหมด
            </span>
            <span className="text-lg font-bold" style={{ color: BRAND }}>
              ฿{total.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Dynamic Tracking Status Block */}
        {currentStatus !== "ขอคืนเงิน" && currentStatus !== "ยกเลิกแล้ว" && (
          <div className="bg-white rounded-2xl p-5 shadow-soft">
            <h3 className="font-bold mb-4" style={{ color: BRAND }}>
              ติดตามสถานะ
            </h3>
            <div className="relative">
              <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-[#eef2f6]" />
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: orderType === "dine-in" ? "50%" : "66%" }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                className="absolute left-[19px] top-2 w-0.5"
                style={{ background: BRAND }}
              />
              <div className="space-y-5">
                {steps.map((s, i) => {
                  const Icon = s.icon;
                  const isCurrent = s.active;
                  const isDone = s.done;
                  return (
                    <div key={s.id} className="relative flex items-center gap-3">
                      <div
                        className="relative z-10 grid h-10 w-10 place-items-center rounded-full"
                        style={{
                          background: isDone ? BRAND : isCurrent ? GOLD : "#eef2f6",
                          color: isDone ? GOLD : isCurrent ? BRAND : INK_MUTED,
                        }}
                      >
                        <Icon size={18} />
                        {isCurrent && (
                          <motion.span
                            className="absolute inset-0 rounded-full"
                            style={{ background: GOLD }}
                            animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0, 0.4] }}
                            transition={{ duration: 1.8, repeat: Infinity }}
                          />
                        )}
                      </div>
                      <div className="flex-1">
                        <p
                          className="text-sm font-semibold"
                          style={{ color: isDone || isCurrent ? BRAND : INK_MUTED }}
                        >
                          {s.label}
                        </p>
                        <p className="text-xs" style={{ color: INK_MUTED }}>
                          {isDone ? "เสร็จสมบูรณ์" : isCurrent ? "กำลังดำเนินการ" : "รอดำเนินการ"}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Cancellation Actions */}
        <div className="mt-6 space-y-3">
          {currentStatus === "รอรับออเดอร์" && (
            <button
              onClick={() => setShowCancelDialog(true)}
              className="w-full py-3.5 rounded-full font-bold text-sm transition-all hover:bg-red-50 border border-red-200 text-red-500 cursor-pointer active:scale-95 flex items-center justify-center gap-2"
            >
              <span>ยกเลิกและขอคืนเงิน</span>
            </button>
          )}

          {/* Contact Support button (Always active as fallback) */}
          <a
            href="tel:0891234567"
            className="w-full py-3.5 rounded-full font-bold text-sm bg-white border border-[#ece4d6] text-[#002e47] cursor-pointer active:scale-95 flex items-center justify-center gap-2 hover:bg-slate-50 transition"
          >
            <span>📞 ติดต่อร้านลุงเกตุ (ด่วน)</span>
          </a>
        </div>
      </div>

            </div>
      {/* Cancellation Dialog Overlay */}
      <AnimatePresence>
        {showCancelDialog && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCancelDialog(false)}
              className="absolute inset-0 bg-black"
            />

            {/* Dialog Content */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "tween", duration: 0.25 }}
              className="relative w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl overflow-y-auto max-h-[85vh] z-10 text-[#002e47]"
            >
              <h3 className="text-lg font-black tracking-tight mb-2">ยกเลิกคำสั่งซื้อและขอคืนเงิน</h3>
              <p className="text-xs text-slate-500 mb-4">
                กรุณาระบุเหตุผลและข้อมูลพร้อมเพย์สำหรับรับเงินคืนจำนวน <strong>฿{total.toLocaleString()}</strong>
              </p>

              {errorText && (
                <div className="mb-3 px-3 py-2 rounded-xl bg-red-50 border border-red-155 text-red-600 text-xs font-bold">
                  {errorText}
                </div>
              )}

              {/* Reasons list */}
              <div className="space-y-2 mb-4">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">เหตุผลในการยกเลิก</p>
                {cancelReasonsList.map((reason) => (
                  <label
                    key={reason}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition cursor-pointer text-sm font-semibold ${selectedReason === reason
                        ? "border-[#002e47] bg-[#fffcf5]"
                        : "border-[#ece4d6] hover:bg-slate-50"
                      }`}
                  >
                    <input
                      type="radio"
                      name="cancel_reason"
                      value={reason}
                      checked={selectedReason === reason}
                      onChange={() => {
                        setSelectedReason(reason);
                        setErrorText("");
                      }}
                      className="accent-[#002e47]"
                    />
                    <span>{reason}</span>
                  </label>
                ))}
              </div>

              {/* Textarea for custom reason */}
              {selectedReason === "อื่น ๆ (ระบุด้านล่าง)" && (
                <div className="mb-4">
                  <textarea
                    placeholder="พิมพ์ระบุเหตุผลการยกเลิกที่นี่..."
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    rows={3}
                    className="w-full bg-[#fcfbf9] border border-[#ece4d6] rounded-2xl px-4 py-2.5 text-sm font-bold text-[#002e47] focus:outline-none focus:border-[#002e47]/30 transition"
                  />
                </div>
              )}

              {/* PromptPay account details */}
              <div className="mb-6">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">ข้อมูลการรับเงินคืน</p>
                <input
                  type="text"
                  placeholder="เบอร์พร้อมเพย์ หรือ บัญชีธนาคาร + ชื่อบัญชี"
                  value={promptPayNumber}
                  onChange={(e) => {
                    setPromptPayNumber(e.target.value);
                    setErrorText("");
                  }}
                  className="w-full bg-[#fcfbf9] border border-[#ece4d6] rounded-2xl px-4 py-2.5 text-sm font-bold text-[#002e47] placeholder-slate-400 focus:outline-none focus:border-[#002e47]/30 transition shadow-inner"
                />
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setShowCancelDialog(false)}
                  className="w-full py-3.5 rounded-full font-bold text-xs bg-slate-100 text-slate-500 cursor-pointer hover:bg-slate-200 transition"
                >
                  ย้อนกลับ
                </button>
                <button
                  type="button"
                  onClick={handleRequestCancel}
                  className="w-full py-3.5 rounded-full font-bold text-xs text-white cursor-pointer hover:opacity-95 transition"
                  style={{ background: BRAND }}
                >
                  ยืนยันขอยกเลิก
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Mini Order Tracker (Home Page)
// ─────────────────────────────────────────────────────────────
function MiniOrderTracker({
  orderNumber,
  onGoToStatus,
  orderType,
  status,
}: {
  orderNumber: string;
  onGoToStatus: () => void;
  orderType: OrderType;
  status?: string;
}) {
  const { t } = useLanguage();

  const isCompleted = status === "สำเร็จ" || status === "completed" || status === "เสร็จสิ้น";
  const isCooking   = status === "กำลังทำ" || status === "กำลังเตรียม" || status === "preparing";
  const isReady     = status === "พร้อมเสิร์ฟ" || status === "delivering" || status === "พร้อมรับอาหาร" || status === "กำลังจัดส่ง";
  const isReceived  = !isCooking && !isReady && !isCompleted;

  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    let timerId: any = null;
    if (isCompleted) {
      timerId = setTimeout(() => {
        setIsVisible(false);
      }, 10000);
    } else {
      setIsVisible(true);
    }
    return () => {
      if (timerId) {
        clearTimeout(timerId);
      }
    };
  }, [isCompleted]);

  if (!isVisible) return null;

  const steps = orderType === "dine-in"
    ? [
      { id: 1, label: t("รับออเดอร์"),      icon: Check,        done: isCooking || isReady || isCompleted, active: isReceived },
      { id: 2, label: t("กำลังทำอาหาร"),    icon: ChefHat,      done: isReady || isCompleted,              active: isCooking },
      { id: 3, label: t("เสร็จสิ้น"),       icon: PartyPopper,  done: false,                               active: isCompleted },
    ]
    : orderType === "takeaway"
      ? [
        { id: 1, label: t("รับออเดอร์"),       icon: Check,       done: isCooking || isReady || isCompleted, active: isReceived },
        { id: 2, label: t("กำลังเตรียมอาหาร"), icon: ChefHat,     done: isReady || isCompleted,              active: isCooking },
        { id: 3, label: t("พร้อมรับอาหาร"),    icon: ShoppingBag, done: false,                               active: isReady || isCompleted },
      ]
      : [
        { id: 1, label: t("รับออเดอร์"),               icon: Check,        done: isCooking || isReady || isCompleted, active: isReceived },
        { id: 2, label: t("กำลังเตรียมอาหาร"),         icon: ChefHat,      done: isReady || isCompleted,              active: isCooking },
        { id: 3, label: t("คนรับอาหาร/กำลังขับไป"),   icon: Bike,         done: isCompleted,                         active: isReady },
        { id: 4, label: t("เสร็จสิ้น"),                icon: PartyPopper,  done: false,                               active: isCompleted },
      ];

  const activeIndex = steps.findIndex((s) => s.active);
  const doneCount   = steps.filter((s) => s.done).length;

  // Progress bar: jump to 100% on completion, otherwise sit halfway through the active step
  const progressPercent = isCompleted
    ? 100
    : activeIndex !== -1
      ? ((activeIndex + 0.5) / steps.length) * 100
      : ((doneCount + 0.5) / steps.length) * 100;

  // Yellow connecting line fraction (0–1)
  const lineFraction = isCompleted
    ? 1
    : activeIndex > 0
      ? activeIndex / (steps.length - 1)
      : 0;

  return (
    <div
      className="bg-white rounded-2xl p-3 shadow-soft border overflow-hidden"
      style={{ borderColor: "#ece4d6" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <div
            className="grid h-7 w-7 place-items-center rounded-lg"
            style={{ background: "rgba(255, 203, 68, 0.15)" }}
          >
            <ClipboardList size={14} style={{ color: "#ffcb44" }} />
          </div>
          <div>
            <p className="text-xs font-bold" style={{ color: BRAND }}>
              สถานะ Order ของคุณ
            </p>
            <p className="text-[10px]" style={{ color: INK_MUTED }}>
              {orderNumber}
            </p>
          </div>
        </div>
        <motion.span
          animate={!isCompleted ? { scale: [1, 1.03, 1] } : undefined}
          transition={!isCompleted ? { duration: 2, repeat: Infinity } : undefined}
          className="px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1"
          style={{
            background: isCompleted ? "rgba(16,185,129,0.08)" : "rgba(59,130,246,0.08)",
            color:      isCompleted ? "#10b981"               : "#2563eb",
          }}
        >
          <span className={`h-1.5 w-1.5 rounded-full animate-pulse ${isCompleted ? "bg-emerald-500" : "bg-blue-500"}`} />
          {isCompleted ? t("เสร็จสิ้น") : t("กำลังดำเนินการ")}
        </motion.span>
      </div>

      {/* Progress bar */}
      <div className="relative h-1.5 rounded-full bg-slate-100 mb-3 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ background: "#ffcb44" }}
        />
      </div>

      {/* Step icons row with connection line behind them */}
      <div className="relative flex items-center justify-between mb-3">
        {/* Gray connecting line */}
        <div
          className="absolute top-4 h-[2px] -translate-y-1/2"
          style={{ background: "#eef2f6", left: 16, right: 16 }}
        />
        {/* Yellow active connecting line — stretches to each step as status advances */}
        <div
          className="absolute top-4 h-[2px] -translate-y-1/2 transition-all duration-700"
          style={{
            background: "#ffcb44",
            left: 16,
            width: `calc(${lineFraction} * (100% - 32px))`,
          }}
        />
        {steps.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={s.id} className="flex flex-col items-center gap-1 flex-1 relative z-10">
              <div className="relative">
                <div
                  className="grid h-8 w-8 place-items-center rounded-full transition-all relative z-10"
                  style={{
                    background: s.done ? BRAND : s.active ? "#ffcb44" : "#eef2f6",
                    color: s.done ? "#ffcb44" : s.active ? BRAND : INK_MUTED,
                    boxShadow: s.active ? "0 0 0 3px rgba(255, 203, 68, 0.3)" : "none",
                  }}
                >
                  <Icon size={14} />
                </div>
                {s.active && (
                  <motion.span
                    className="absolute inset-0 rounded-full z-0"
                    style={{ border: `2px solid #ffcb44` }}
                    animate={{ scale: [1, 1.3, 1], opacity: [0.6, 0, 0.6] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}
              </div>
              <span
                className="text-[10px] font-semibold text-center leading-tight mt-1"
                style={{ color: s.done || s.active ? BRAND : INK_MUTED }}
              >
                {s.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Underlined text link to status screen */}
      <div className="text-center mt-2.5">
        <button
          onClick={onGoToStatus}
          className="text-xs font-semibold underline transition hover:opacity-80"
          style={{ color: BRAND }}
        >
          ดูรายละเอียดสถานะทั้งหมด
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// History Overlay (Full Page)
// ─────────────────────────────────────────────────────────────
function HistoryOverlay({
  orderHistory,
  onBack,
}: {
  orderHistory: OrderHistory[];
  onBack: () => void;
}) {
  return (
        <motion.div
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
        <div className="max-w-2xl mx-auto px-5 pt-5 pb-8 space-y-4">
        {orderHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Package size={48} className="mb-4" style={{ color: INK_MUTED }} />
            <p className="text-sm font-medium" style={{ color: INK_MUTED }}>
              ยังไม่มีประวัติการสั่งซื้อ
            </p>
            <p className="text-xs mt-1" style={{ color: INK_MUTED }}>
              เริ่มสั่งอาหารเลย!
            </p>
          </div>
        ) : (
          orderHistory.map((order, idx) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.06 }}
              className="bg-white rounded-2xl shadow-soft overflow-hidden"
            >
              {/* Order header */}
              <div
                className="px-4 py-3 flex items-center justify-between"
                style={{ background: "rgba(0,46,71,0.03)", borderBottom: "1px solid #f1ece4" }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="grid h-10 w-10 place-items-center rounded-xl"
                    style={{ background: BRAND, color: GOLD }}
                  >
                    <Receipt size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold" style={{ color: BRAND }}>
                      {order.orderNumber}
                    </p>
                    <p className="text-[10px]" style={{ color: INK_MUTED }}>
                      {order.date}
                    </p>
                  </div>
                </div>
                <span
                  className="px-3 py-1.5 rounded-full text-[11px] font-bold flex items-center gap-1.5"
                  style={{
                    background:
                      order.status === "สำเร็จ"
                        ? "#dcfce7"
                        : order.status === "กำลังจัดส่ง"
                          ? "#dbeafe"
                          : "#fef9c3",
                    color:
                      order.status === "สำเร็จ"
                        ? "#15803d"
                        : order.status === "กำลังจัดส่ง"
                          ? "#1d4ed8"
                          : "#a16207",
                  }}
                >
                  {order.status === "สำเร็จ" && <CheckCircle size={12} />}
                  {order.status === "กำลังจัดส่ง" && <Bike size={12} />}
                  {order.status === "กำลังเตรียม" && <ChefHat size={12} />}
                  {order.status}
                </span>
              </div>

              {/* Order items */}
              <div className="px-4 py-3 space-y-2.5">
                {order.items.map((item, itemIdx) => (
                  <div key={itemIdx} className="flex items-center gap-3">
                    <img
                      src={encodeURI(String(item.image))}
                      alt={item.name}
                      className="h-12 w-12 rounded-xl object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: BRAND }}>
                        {item.name}
                      </p>
                      <p className="text-xs" style={{ color: INK_MUTED }}>
                        × {item.qty} · ฿{item.price}/ชิ้น
                      </p>
                    </div>
                    <p className="text-sm font-bold" style={{ color: BRAND }}>
                      ฿{item.price * item.qty}
                    </p>
                  </div>
                ))}
              </div>

              {/* Order total */}
              <div
                className="px-4 py-3 flex items-center justify-between"
                style={{ background: "#fafbfc", borderTop: "1px solid #f1ece4" }}
              >
                <div className="text-xs" style={{ color: INK_MUTED }}>
                  <span>อาหาร ฿{order.subtotal}</span>
                  <span className="mx-1.5">·</span>
                  <span>จัดส่ง ฿{order.delivery}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs" style={{ color: INK_MUTED }}>
                    รวม
                  </span>
                  <span className="text-lg font-bold" style={{ color: BRAND }}>
                    ฿{order.total}
                  </span>
                </div>
              </div>
            </motion.div>
          ))
                )}
      </div>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// Contact Overlay (Full Page)
// ─────────────────────────────────────────────────────────────
function ContactOverlay({ onBack }: { onBack: () => void }) {
  const reviews = [
    {
      id: 1,
      name: "Panisa T.",
      initials: "PT",
      stars: 5,
      date: "5 มิ.ย. 2026",
      text: "อร่อยสุดยอดมากครับ กระเพราหมูกรอบคือที่สุด! หนังหมูกรอบกรุบกรอบกำลังดี รสชาติเผ็ดจัดจ้านสะใจ แนะนำเลยครับ",
    },
    {
      id: 2,
      name: "Chawalit R.",
      initials: "CR",
      stars: 5,
      date: "2 มิ.ย. 2026",
      text: "ชอบผัดพริกแกงหมูกรอบมากครับ รสชาติเข้มข้นถึงเครื่องแกง ไข่ดาวทอดมาแบบกึ่งสุกกึ่งดิบกำลังดี บริการส่งรวดเร็วทันใจมากครับ",
    },
    {
      id: 3,
      name: "Somsri K.",
      initials: "SK",
      stars: 4,
      date: "28 พ.ค. 2026",
      text: "น้ำลำไยหวานชื่นใจ หอมกลิ่นลำไยสด ดื่มคู่กับผัดซีอิ๊วอร่อยลงตัวมากๆ ค่ะ ร้านสะอาดและใช้วัตถุดิบคุณภาพดีจริงๆ",
    },
  ];

  return (
        <motion.div
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
        <div className="max-w-2xl mx-auto px-5">

        {/* Google Maps Container */}
        <div className="relative h-64 w-full bg-slate-200 overflow-hidden">
          <iframe
            title="Google Maps"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3875.6416801968853!2d100.5670868153347!3d13.737152990356773!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x30e29f03b57e7939%3A0xe5a3637e163b7e80!2sSukhumvit%2031%2C%20Khlong%20Toei%20Nuea%2C%20Watthana%2C%20Bangkok%2010110!5e0!3m2!1sen!2sth!4v1655610000000!5m2!1sen!2sth"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
          ></iframe>

          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent pointer-events-none" />

          {/* Shop info overlay on Map */}
          <div className="absolute bottom-4 left-5 right-5 flex items-end justify-between pointer-events-none">
            <div className="text-white">
              <h2 className="text-xl font-bold">ร้านลุงเก็ต</h2>
              <p className="text-xs text-white/80 mt-1">อาหารตามสั่ง · Street Food</p>
            </div>

            {/* Rating badge */}
            <div className="bg-[#ffcb44] rounded-2xl px-3 py-2 flex flex-col items-center shadow-lg shrink-0" style={{ color: BRAND }}>
              <span className="text-base font-extrabold leading-none">4.8</span>
              <div className="flex gap-0.5 my-0.5" style={{ color: BRAND }}>
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={8} fill="currentColor" stroke="none" />
                ))}
              </div>
              <span className="text-[9px] font-semibold leading-none opacity-85">214 รีวิว</span>
            </div>
          </div>
        </div>

        {/* Contact info details list */}
        <div className="mx-5 mt-5 bg-white rounded-2xl border border-slate-200/80 shadow-soft divide-y divide-slate-100">
          {/* Address */}
          <div className="p-4 flex items-start gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl shrink-0" style={{ background: "rgba(0,46,71,0.06)", color: BRAND }}>
              <MapPin size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-400">Address</p>
              <p className="text-sm font-medium text-slate-700 mt-0.5 leading-relaxed">
                88/12 ซอยสุขุมวิท 31 แขวงคลองเตยเหนือ เขตวัฒนา กรุงเทพฯ 10110
              </p>
            </div>
            <a
              href="https://maps.app.goo.gl/yS3EHz9n2H4Hkpxu7"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-full border text-xs font-bold shrink-0 flex items-center gap-1 transition hover:bg-slate-50 mt-1"
              style={{ borderColor: BRAND, color: BRAND }}
            >
              <MapPin size={12} /> นำทาง
            </a>
          </div>

          {/* Opening Hours */}
          <div className="p-4 flex items-start gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl shrink-0" style={{ background: "rgba(0,46,71,0.06)", color: BRAND }}>
              <Clock size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-400">Opening Hours</p>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-slate-700 font-medium">อาทิตย์ - ศุกร์</span>
                <span className="text-slate-800 font-semibold">08:00 - 21:00</span>
              </div>
              <div className="flex justify-between text-sm mt-0.5">
                <span className="text-red-500 font-medium">วันเสาร์</span>
                <span className="text-red-500 font-semibold">ปิดทำการ</span>
              </div>
            </div>
          </div>

          {/* Phone */}
          <a
            href="tel:02-123-4567"
            className="p-4 flex items-center gap-3 transition hover:bg-slate-50"
          >
            <div className="grid h-10 w-10 place-items-center rounded-xl shrink-0" style={{ background: "rgba(0,46,71,0.06)", color: BRAND }}>
              <Phone size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-400">Phone</p>
              <p className="text-sm font-bold mt-0.5" style={{ color: GOLD }}>
                02-123-4567
              </p>
            </div>
            <ChevronRight size={18} className="text-slate-400" />
          </a>
        </div>

        {/* Reviews Section */}
        <div className="px-5 mt-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base" style={{ color: BRAND }}>Reviews</h3>
            <button className="text-xs font-semibold hover:underline" style={{ color: BRAND }}>
              See all
            </button>
          </div>

          {/* Rating Summary Box */}
          <div className="bg-[#002e47] text-white rounded-2xl p-5 mt-3 flex items-center justify-between shadow-soft">
            <div className="flex flex-col">
              <span className="text-4xl font-extrabold leading-none">4.8</span>
              <div className="flex gap-0.5 text-[#ffcb44] my-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={14} fill="currentColor" stroke="none" />
                ))}
              </div>
              <span className="text-xs text-white/70">214 รีวิว</span>
            </div>

            {/* Progress Bars */}
            <div className="flex-1 max-w-[160px] space-y-1.5">
              {[
                { star: 5, pct: 85 },
                { star: 4, pct: 10 },
                { star: 3, pct: 3 },
                { star: 2, pct: 1 },
                { star: 1, pct: 1 },
              ].map((item) => (
                <div key={item.star} className="flex items-center gap-2">
                  <span className="text-[10px] text-white/80 font-medium w-2 leading-none">{item.star}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full rounded-full bg-[#ffcb44]" style={{ width: `${item.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Review List */}
          <div className="mt-4 space-y-3">
            {reviews.map((r) => (
              <div key={r.id} className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-soft">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-full text-white font-bold text-sm bg-[#002e47]">
                    {r.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-slate-800 truncate">{r.name}</h4>
                      <span className="text-[10px] text-slate-400">{r.date}</span>
                    </div>
                    <div className="flex gap-0.5 mt-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={10}
                          fill={i < r.stars ? "#ffcb44" : "none"}
                          stroke={i < r.stars ? "none" : "#cbd5e1"}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-xs mt-3 leading-relaxed" style={{ color: BRAND }}>
                  {r.text}
                </p>
              </div>
                        ))}
          </div>

        </div>
        </div>

      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// Store Closed Overlay
// ─────────────────────────────────────────────────────────────
function StoreClosedOverlay({
  onBypass,
  onOpenSidebar,
}: {
  onBypass: () => void;
  onOpenSidebar: () => void;
}) {
  const todayDay = useMemo(() => {
    const now = new Date();
    const thTimeStr = now.toLocaleString("en-US", { timeZone: "Asia/Bangkok" });
    const thTime = new Date(thTimeStr);
    return thTime.getDay();
  }, []);

  const daysInfo = [
    { name: "วันอาทิตย์", label: "อา.", time: "08:00 - 21:00", open: true, dayIndex: 0 },
    { name: "วันจันทร์", label: "จ.", time: "08:00 - 21:00", open: true, dayIndex: 1 },
    { name: "วันอังคาร", label: "อ.", time: "08:00 - 21:00", open: true, dayIndex: 2 },
    { name: "วันพุธ", label: "พ.", time: "08:00 - 21:00", open: true, dayIndex: 3 },
    { name: "วันพฤหัสบดี", label: "พฤ.", time: "08:00 - 21:00", open: true, dayIndex: 4 },
    { name: "วันศุกร์", label: "ศ.", time: "08:00 - 21:00", open: true, dayIndex: 5 },
    { name: "วันเสาร์", label: "ส.", time: "ปิดทำการ", open: false, dayIndex: 6 },
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
        <div className="max-w-2xl mx-auto px-6 py-6 flex flex-col justify-between h-full min-h-[calc(100vh-80px)]">
        <div className="space-y-6">
          {/* Pulsing closed icon */}
          <div className="flex justify-center mt-2">
            <div className="relative">
              <div className="grid h-20 w-20 place-items-center rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 shadow-sm animate-pulse">
                <Store size={38} className="stroke-[1.5]" />
              </div>
              <div className="absolute -bottom-2 -right-2 grid h-7 w-7 place-items-center rounded-full bg-red-500 text-white border border-white shadow-md">
                <Clock size={14} className="animate-spin" style={{ animationDuration: '6s' }} />
              </div>
            </div>
          </div>

          {/* Main Closed Text Box */}
          <div className="text-center space-y-3">
            <h2 className="text-xl font-bold text-slate-800 leading-snug">
              วันนี้ร้านปิดทำการ ขออภัยในความไม่สะดวก
            </h2>
            <div className="inline-block bg-amber-500/10 border border-amber-500/20 rounded-2xl px-6 py-4 mt-2 max-w-sm mx-auto">
              <p className="text-sm font-semibold text-amber-900 leading-relaxed">
                เราจะเปิดบริการอีกครั้งวันอาทิตย์-ศุกร์<br />
                เวลา <span className="font-extrabold text-amber-950 text-base">8:00 - 21:00 น.</span>
              </p>
            </div>
          </div>

          {/* Opening Schedule Grid */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">ตารางเวลาให้บริการ</h3>
            <div className="bg-white border border-slate-200/80 rounded-2xl shadow-soft divide-y divide-slate-100 overflow-hidden">
              {daysInfo.map((day) => {
                const isToday = day.dayIndex === todayDay;
                return (
                  <div
                    key={day.dayIndex}
                    className={`flex items-center justify-between px-4 py-3.5 transition-colors ${isToday ? "bg-amber-500/5" : ""
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center ${isToday
                          ? "bg-amber-500 text-white shadow-sm"
                          : "bg-slate-100 text-slate-500"
                        }`}>
                        {day.label}
                      </span>
                      <span className={`text-sm font-semibold ${isToday ? "text-slate-800" : "text-slate-600"}`}>
                        {day.name} {isToday && <span className="ml-1 text-[10px] font-bold text-amber-600 bg-amber-500/10 px-1.5 py-0.5 rounded-full">วันนี้</span>}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-700">{day.time}</span>
                      <span className={`h-2.5 w-2.5 rounded-full ${day.open ? "bg-emerald-500" : "bg-red-500"}`} />
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
            className="w-full py-4 px-5 rounded-2xl text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 bg-slate-50 border border-slate-200/80 transition-all text-center flex items-center justify-center gap-2 active:scale-[0.98]"
          >
                        เข้าสู่หน้าร้าน (โหมดสาธิตสำหรับทดสอบ)
          </button>
          <p className="text-[10px] text-slate-400 text-center">
            * ปุ่มด้านบนสำหรับผู้ตรวจสอบเพื่อทดสอบการใช้งาน in วันหยุด/นอกเวลา
          </p>
        </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// Sidebar
// ─────────────────────────────────────────────────────────────
function Sidebar({
  onClose,
  onNavigate,
  orderHistory,
  simulateClosed,
  setSimulateClosed,
  profile,
  onLogout,
}: {
  onClose: () => void;
  onNavigate: (t: string) => void;
  orderHistory: OrderHistory[];
  simulateClosed: boolean;
  setSimulateClosed: (s: boolean) => void;
  profile: LiffProfile | null;
  onLogout: () => void;
}) {
  const items = [
    { id: "home", label: "หน้าแรก", icon: HomeIcon },
    { id: "status", label: "สถานะการสั่งซื้อ", icon: ClipboardList },
    { id: "history", label: "ประวัติการสั่งซื้อ", icon: History },
    { id: "contact", label: "ติดต่อเรา", icon: MessageCircle },
  ];

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/55 z-[60]"
      />
      <motion.aside
        initial={{ x: "-100%" }}
        animate={{ x: 0 }}
        exit={{ x: "-100%" }}
        transition={{ type: "tween", duration: 0.28 }}
                className="absolute top-0 left-0 bottom-0 w-[78%] md:w-[320px] z-[70] flex flex-col"
        style={{ background: BRAND, color: "white" }}
      >
        <div className="p-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            {profile?.pictureUrl ? (
              <img
                src={profile.pictureUrl}
                alt={profile.displayName}
                className="h-12 w-12 rounded-full object-cover"
                style={{ border: "2px solid " + GOLD }}
              />
            ) : (
              <div className="grid h-12 w-12 place-items-center rounded-full" style={{ background: GOLD, color: BRAND }}>
                <User size={22} />
              </div>
            )}
            <div>
              <p className="font-bold">{profile?.displayName ?? "ผู้ใช้งาน"}</p>
              <p className="text-xs text-white/60">บัญชีผู้ใช้</p>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto no-scrollbar p-3">
          <nav className="space-y-1">
            {items.map((it) => (
              <button
                key={it.id}
                onClick={() => {
                  onNavigate(it.id);
                }}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left hover:bg-white/5"
              >
                <it.icon size={18} color={GOLD} />
                <span className="font-medium text-sm">{it.label}</span>
                {it.id === "history" && orderHistory.length > 0 && (
                  <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: GOLD, color: BRAND }}>
                    {orderHistory.length}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
        <div className="p-5 border-t border-white/10 space-y-4">
          {/* Simulator Panel */}
          <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
            <p className="text-[11px] font-bold text-white/50 uppercase tracking-wider mb-2.5">
              โหมดผู้พัฒนา (Developer Mode)
            </p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/80">จำลองสถานะร้านปิด</span>
              <button
                type="button"
                onClick={() => setSimulateClosed(!simulateClosed)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${simulateClosed ? "bg-amber-500" : "bg-white/15"
                  }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${simulateClosed ? "translate-x-5" : "translate-x-0"
                    }`}
                />
              </button>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium"
            style={{ background: "rgba(255,255,255,0.08)", color: "white" }}
          >
            <LogOut size={16} /> ออกจากระบบ
          </button>
        </div>

      </motion.aside>
    </>
  );
}
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { type LiffProfile, liffLogout } from "../../lib/liff";
import { supabase } from "../../lib/supabase";
import { syncAuthUserToSupabase, getOrCreateGuestUserAndCustomer } from "../../lib/supabase.service";
import { verifyStripeSession } from "../../lib/api/stripe.functions";
import { AnimatePresence, motion } from "motion/react";
import { useLanguage } from "../../lib/i18n";
import { ShoppingBag, ChevronRight } from "lucide-react";

import {
  type Addon,
  type MenuItem,
  type CartLine,
  type OrderHistory,
} from "../../types";
import { MENU } from "../../constants/menu.data";
import { BRAND, GOLD } from "../../constants/theme";

import {
  HomeScreen,
  StatusScreen,
  ItemModal,
  MenuOverlay,
  CartDrawer,
  OrderConfirmOverlay,
  PaymentOverlay,
  SuccessFlash,
  HistoryOverlay,
  ContactOverlay,
  StoreClosedOverlay,
  CustomerSidebar as Sidebar,
  TablePickerBottomSheet,
} from "../../components/customer";

export type { Addon, MenuItem };
export { MENU };

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
// Root Customer App Component
// ─────────────────────────────────────────────────────────────
function LiffApp() {
  const navigate = useNavigate();
  const [liffReady, setLiffReady] = useState(false);
  const [profile, setProfile] = useState<LiffProfile | null>(null);
  const { t } = useLanguage();

  // ── WebAvatar Widget Integration (Open/Close Toggle & Animation Manager) ──
  useEffect(() => {
    // Initial hidden state
    document.body.classList.add("avatar-hidden");

    (window as any).ChatWidgetConfig = {
      mode: "realtime-widget",
      avatarUrl: "Botnoi",
      widgetId: "ran-lung-get",
      greetingInstruction: "",
      enableBubble: "false",
      cameraOffset: "0,0,0.5",
      animationUrl: "Greeting",
      defaultAnimationUrl: "Idleloop, idle_breatheloop, Idle_Swayloop",
      randomGeneric: "false",
    };

    // Load JSSDK script if not present
    let scriptElement: HTMLScriptElement | null = null;
    if (!document.getElementById("webavatar-jssdk")) {
      const s = document.createElement("script");
      s.id = "webavatar-jssdk";
      s.src = "https://webavatar.didthat.cc/chat-widget.js";
      s.async = true;
      (document.head || document.body).appendChild(s);
      scriptElement = s;
    }

    // State & Timers for Random Idle Animation and Show/Hide Manager
    let isConnected = false;
    let animationTimeout: any = null;
    const minInterval = 30;
    const maxInterval = 50;
    const maxLoopTime = 10;
    const animationReset = ["Idleloop", "idle_breatheloop", "Idle_Swayloop"];
    const animations = [
      "GangnamStyle",
      "fusionL",
      "fusionR",
      "Generic_HandFan",
      "Generic_Lazy",
      "Generic_look_around",
      "Generic_Squat",
      "GenericLookAround",
      "Generic_Happy",
      "funnypose",
      "Excited_dance",
      "Emote_OrangeJusticeLoop",
      "Emote_KpopLoop",
      "Emote_InfiniDab_loop",
      "angelTaisou",
      "ArmWaveDanceloop",
      "Bellydancing",
      "chunibyou",
      "Dance_INTERNET_YAMEROloop",
      "Dance_Loli_Kami_Requiem",
      "Dance_monkeyloop",
      "Dance_washing",
      "graceful_dance",
      "HandpumpDanceloop",
      "HipHopDanceloop",
      "Humming",
      "LookAround",
      "LookingBehind",
      "ModelPose",
      "NervouslyLookAround",
      "pose_peace1",
      "Relax",
      "RumbaDanceloop",
      "SalsaDanceloop",
      "SambaDance1loop",
      "SambaDanceloop",
      "ShowFullBody",
      "ToothlessLoop",
    ];
    let resetTimeout: any = null;

    function showAvatar() {
      document.body.classList.remove("avatar-hidden");
      document.body.classList.add("avatar-visible");
    }

    function hideAvatar() {
      document.body.classList.remove("avatar-visible");
      document.body.classList.add("avatar-hidden");
    }

    // Delegate click event to reveal avatar ONLY when the widget's call button is clicked
    const handleWidgetClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // If the click originated inside #root (React app), ignore it completely.
      const root = document.getElementById("root");
      if (root && root.contains(target)) return;

      // Walk up from click target looking for widget call button markers
      let el: HTMLElement | null = target;
      while (el && el !== document.body) {
        const cls = el.className && typeof el.className === "string" ? el.className : "";
        const id = el.id ? el.id : "";
        if (
          cls.indexOf("bcw") !== -1 ||
          cls.indexOf("fab") !== -1 ||
          cls.indexOf("widget-call") !== -1 ||
          cls.indexOf("widget-connect") !== -1 ||
          cls.indexOf("chat-widget") !== -1 ||
          id.indexOf("bcw") !== -1 ||
          id.indexOf("widget") !== -1
        ) {
          showAvatar();
          break;
        }
        el = el.parentElement;
      }
    };
    document.addEventListener("click", handleWidgetClick, true);

    function clearResetTimeout() {
      if (resetTimeout) {
        clearTimeout(resetTimeout);
        resetTimeout = null;
      }
    }

    function stopAnimations() {
      if (animationTimeout) {
        clearTimeout(animationTimeout);
        animationTimeout = null;
      }
      clearResetTimeout();
    }

    function triggerRandomAnimation() {
      if (isConnected) return;
      clearResetTimeout();

      if (
        (window as any).WebAvatar &&
        typeof (window as any).WebAvatar.loadAnimation === "function"
      ) {
        const anim = animations[Math.floor(Math.random() * animations.length)];
        console.log("[Demo] Loading random idle animation in disconnected state:", anim);
        (window as any).WebAvatar.loadAnimation(anim);
        (window as any).WebAvatar.setEmotion("happy", 10);

        if (anim.toLowerCase().indexOf("loop") !== -1) {
          resetTimeout = setTimeout(() => {
            if (isConnected) return;
            const resetList = Array.isArray(animationReset)
              ? animationReset
              : typeof animationReset === "string"
                ? (animationReset as string)
                    .split(",")
                    .map((item: string) => item.trim())
                    .filter(Boolean)
                : [];
            const resetAnim = resetList[Math.floor(Math.random() * resetList.length)];
            console.log("[Demo] Max loop time reached. Resetting animation to:", resetAnim);
            (window as any).WebAvatar.loadAnimation(resetAnim);
            (window as any).WebAvatar.setEmotion("idle", 10);
          }, maxLoopTime * 1000);
        }
      }
      scheduleNext();
    }

    function scheduleNext() {
      if (animationTimeout) clearTimeout(animationTimeout);
      const nextInterval =
        (minInterval + Math.random() * (maxInterval - minInterval)) * 1000;
      animationTimeout = setTimeout(triggerRandomAnimation, nextInterval);
    }

    function startAnimations() {
      scheduleNext();
    }

    const handleAvatarReady = () => {
      console.log("[Demo] Avatar widget ready.");
      if (!isConnected) {
        hideAvatar();
        startAnimations();
      } else {
        showAvatar();
      }
    };

    const handleConnect = () => {
      console.log("[Demo] Connected. Showing avatar.");
      isConnected = true;
      showAvatar();
      stopAnimations();
    };

    const handleDisconnect = () => {
      console.log("[Demo] Disconnected. Hiding avatar.");
      isConnected = false;
      hideAvatar();
      startAnimations();
    };

    window.addEventListener("avatar-widget-ready", handleAvatarReady);
    window.addEventListener("onConnect", handleConnect);
    window.addEventListener("onDisconnect", handleDisconnect);

    // Handle JSSDK navigation event for SPA
    const handleNavigate = (e: any) => {
      e.preventDefault();
      const target = e.detail.target;
      navigate({ to: target });
    };

    window.addEventListener("webavatar-navigate", handleNavigate);

    return () => {
      document.body.classList.remove("avatar-hidden", "avatar-visible");
      document.removeEventListener("click", handleWidgetClick, true);
      window.removeEventListener("avatar-widget-ready", handleAvatarReady);
      window.removeEventListener("onConnect", handleConnect);
      window.removeEventListener("onDisconnect", handleDisconnect);
      window.removeEventListener("webavatar-navigate", handleNavigate);
      stopAnimations();

      // Clean up script if we created it
      if (scriptElement && scriptElement.parentNode) {
        scriptElement.parentNode.removeChild(scriptElement);
      }
      const existingScript = document.getElementById("webavatar-jssdk");
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
        const {
          data: { session },
        } = await supabase.auth.getSession();
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
  const [overlay, setOverlay] = useState<
    null | "menu" | "orderConfirm" | "payment" | "history" | "contact"
  >(null);
  const [, setStripeVerifying] = useState(false);
  const [, setStripeError] = useState<string | null>(null);

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
          const result = await verifyStripeSession({
            data: { sessionId: sessionId as string },
          });

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
                pending.address,
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
              setStripeError(
                "ไม่พบข้อมูลคำสั่งซื้อที่รอดำเนินการ กรุณาตรวจสอบประวัติการสั่งซื้อของคุณ (Pending order details not found)",
              );
            }
          } else {
            setStripeError(
              result.message ||
                "การชำระเงินไม่ผ่านการตรวจสอบความถูกต้อง (Stripe verification failed)",
            );
          }
        } catch (err: any) {
          console.error("[Stripe Client] Error verifying Stripe session:", err);
          setStripeError(
            err?.message || "ระบบไม่สามารถตรวจสอบความถูกต้องของการชำระเงินได้",
          );
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
          .select("id, label, status, capacity, table_type")
          .order("id");
        if (!error && data && data.length > 0) {
          const strData = data.map((t: any) => ({
            ...t,
            id: String(t.id),
            label: String(t.label || `โต๊ะ ${t.id}`),
            status: String(t.status || "available"),
          }));
          const has9 = strData.some(
            (t: any) => t.id === "9" || t.label.includes("โต๊ะ 9"),
          );
          const has10 = strData.some(
            (t: any) => t.id === "10" || t.label.includes("โต๊ะ 10"),
          );
          const merged = [...strData];
          if (!has9) {
            merged.push({ id: "9", label: "โต๊ะ 9 (Walk-in)", status: "available" });
          }
          if (!has10) {
            merged.push({ id: "10", label: "โต๊ะ 10 (Walk-in)", status: "available" });
          }

          setTables(merged as any);
          localStorage.setItem("ran-lung-get-tables", JSON.stringify(merged));
        } else {
          const local = localStorage.getItem("ran-lung-get-tables");
          if (local) {
            try {
              const parsed = JSON.parse(local);
              if (Array.isArray(parsed))
                setTables(parsed.map((t: any) => ({ ...t, id: String(t.id) })));
            } catch {}
          }
        }
      } catch {
        const local = localStorage.getItem("ran-lung-get-tables");
        if (local) {
          try {
            const parsed = JSON.parse(local);
            if (Array.isArray(parsed))
              setTables(parsed.map((t: any) => ({ ...t, id: String(t.id) })));
          } catch {}
        }
      }
    }
    fetchTables();

    // Real-time: อัปเดตสถานะโต๊ะทันที
    const ch = supabase
      .channel("tables-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "restaurant_tables" },
        (payload: any) => {
          if (payload.eventType === "UPDATE" || payload.eventType === "INSERT") {
            const updated = payload.new as any;
            const updatedIdStr = String(updated.id);
            setTables((prev) => {
              const next = prev.map((t) =>
                String(t.id) === updatedIdStr
                  ? { ...t, ...updated, id: updatedIdStr }
                  : t,
              );
              localStorage.setItem("ran-lung-get-tables", JSON.stringify(next));
              return next;
            });
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
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
            addons: item.addons || undefined,
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
            { option_id: "opt-kun-chiang", ingredient_id: "mock-12", quantity_required: 1 },
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
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "menu_items" },
        () => {
          loadMenu();
        },
      )
      .subscribe();

    // Subscribe to real-time changes on ingredients
    const chIng = supabase
      .channel("ingredients-realtime-customer")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ingredients" },
        () => {
          loadStock();
        },
      )
      .subscribe();

    // Subscribe to real-time changes on recipe items
    const chRec = supabase
      .channel("recipe_items-realtime-customer")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "recipe_items" },
        () => {
          loadStock();
        },
      )
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
        return (
          i.id === recipe.ingredient_id ||
          i.name === recipe.ingredient_id ||
          (recipe.ingredient_id && recipe.ingredient_id.includes(i.name))
        );
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

  const shouldShowClosedOverlay =
    isCurrentlyClosed &&
    tab === "home" &&
    (overlay === null ||
      overlay === "menu" ||
      overlay === "orderConfirm" ||
      overlay === "payment");

  const [orderHistory, setOrderHistory] = useState<OrderHistory[]>([
    {
      id: "hist_1",
      orderNumber: "#AK-2841",
      date: "17 มิ.ย. 2026 · 18:30",
      items: [
        {
          name: "กระเพราหมูสับ (ข้าวราด)",
          qty: 2,
          price: 60,
          image: "/meal/krapao.jpg",
        },
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
        {
          name: "ผัดซีอิ๊ว (เส้นใหญ่)",
          qty: 1,
          price: 70,
          image: "/meal/pad_see_ew.jpg",
        },
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
    customAddress?: string,
  ) => {
    const activeCart = customCart || cart;
    const activeOrderType = customOrderType || orderType;
    const activeSelectedTable =
      customSelectedTable !== undefined ? customSelectedTable : selectedTable;
    const activeAddress = customAddress !== undefined ? customAddress : address;

    if (activeCart.length === 0) return;
    // Unique order number with timestamp + random digits (avoids unique constraint violation in Postgres)
    const timeCode = Date.now().toString().slice(-4);
    const randCode = Math.floor(1000 + Math.random() * 9000);
    const orderNum = `#AK-${timeCode}${randCode}`;

    const selectedTableObj = tables.find(
      (t) =>
        String(t.id) === String(activeSelectedTable) ||
        t.label === String(activeSelectedTable),
    );
    const tableNumStr =
      activeOrderType === "dine-in" && selectedTableObj
        ? selectedTableObj.label
        : undefined;

    // Calculate queue number for takeaway
    let takeawayQueueNum: string | undefined = undefined;
    if (activeOrderType === "takeaway") {
      const currentQueueCounter = localStorage.getItem(
        "ran-lung-get-takeaway-queue-counter",
      );
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

    // Valid UUID for both local state and Supabase record
    const orderId =
      typeof crypto?.randomUUID === "function"
        ? crypto.randomUUID()
        : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
            const r = (Math.random() * 16) | 0;
            const v = c === "x" ? r : (r & 0x3) | 0x8;
            return v.toString(16);
          });

    const newOrder: OrderHistory = {
      id: orderId,
      orderNumber: orderNum,
      date:
        new Date().toLocaleDateString("th-TH", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }) +
        " · " +
        new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }),
      items: activeCart.map((l) => ({
        name: l.name,
        qty: l.qty,
        price: l.price,
        image: l.image,
      })),
      subtotal: activeSubtotal,
      delivery: activeDeliveryFee,
      total: activeSubtotal + activeDeliveryFee,
      status: "รอรับออเดอร์",
      orderType: activeOrderType || "delivery",
      tableNumber:
        tableNumStr || (activeOrderType === "takeaway" ? takeawayQueueNum : undefined),
      queueNumber: takeawayQueueNum,
    };
    const updatedHistory = [newOrder, ...orderHistory];
    setOrderHistory(updatedHistory);
    localStorage.setItem("ran-lung-get-orders", JSON.stringify(updatedHistory));
    setActiveOrderNumber(orderNum);
    setHasActiveOrder(true);

    if (activeOrderType === "dine-in" && activeSelectedTable) {
      const targetTableIdStr = String(activeSelectedTable);
      setTables((prev) => {
        const next = prev.map((t) =>
          String(t.id) === targetTableIdStr ||
          (selectedTableObj && t.label === selectedTableObj.label)
            ? { ...t, status: "occupied" }
            : t,
        );
        localStorage.setItem("ran-lung-get-tables", JSON.stringify(next));
        return next;
      });
      // Update table status in Supabase to occupied
      void (supabase as any)
        .from("restaurant_tables")
        .update({ status: "occupied" })
        .eq("id", targetTableIdStr);

      if (selectedTableObj?.label) {
        void (supabase as any)
          .from("restaurant_tables")
          .update({ status: "occupied" })
          .eq("label", selectedTableObj.label);
      }
    }

    // Push order to Supabase for real-time Staff Dashboard
    const insertOrder = async () => {
      let finalUserId = dbUser?.id;
      let finalCustomerId = dbCustomer?.id;

      if (!finalUserId || !finalCustomerId) {
        try {
          const guestPair = await getOrCreateGuestUserAndCustomer();
          finalUserId = guestPair.user.id;
          finalCustomerId = guestPair.customer.id;
        } catch (err) {
          console.error(
            "Failed to resolve guest user/customer for Supabase order:",
            err,
          );
        }
      }

      if (!finalUserId || !finalCustomerId) {
        console.warn(
          "Could not find any user or customer in Supabase. Order saved locally.",
        );
        return;
      }

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
        table_number:
          tableNumStr || (activeOrderType === "takeaway" ? takeawayQueueNum : null),
        delivery_address: activeOrderType === "delivery" ? activeAddress : null,
        special_instructions: takeawayQueueNum
          ? `คิวรับอาหาร: ${takeawayQueueNum}`
          : null,
        created_at: new Date().toISOString(),
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
        created_at: new Date().toISOString(),
      }));

      const { error: itemsErr } = await supabase
        .from("order_items")
        .insert(orderItems);
      if (itemsErr) {
        console.error("Failed to insert order items in Supabase:", itemsErr);
      } else {
        console.log(
          "Order and order items successfully pushed to Supabase:",
          orderNum,
        );
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
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-[var(--linen)]">
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
                  activeOrderType={
                    orderHistory.find((o) => o.orderNumber === activeOrderNumber)
                      ?.orderType
                  }
                  activeOrderStatus={
                    orderHistory.find((o) => o.orderNumber === activeOrderNumber)?.status
                  }
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
                  activeOrder={
                    orderHistory.find((o) => o.orderNumber === activeOrderNumber) ||
                    orderHistory[0]
                  }
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Overlays */}
        <AnimatePresence>
          {(selectedItem || editingCartLine) &&
            (selectedItem || selectedItemToEdit) && (
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
              onClearHistory={() => {
                setOrderHistory([]);
                localStorage.removeItem("ran-lung-get-orders");
              }}
              onBack={() => setOverlay(null)}
            />
          )}
          {overlay === "contact" && (
            <ContactOverlay key="contact" onBack={() => setOverlay(null)} />
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
                await supabase.auth.signOut().catch(() => {});
                // Sign out จาก LIFF (ถ้า login อยู่)
                try {
                  liffLogout();
                } catch {
                  /* ignore */
                }
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
              orderHistory={orderHistory}
              onSelect={(tableId) => {
                const prevTable = selectedTable;
                setSelectedTable(tableId);
                const tableIdStr = String(tableId);
                const prevTableStr = prevTable ? String(prevTable) : null;

                // Update local state immediately for both old and new tables
                setTables((prev) => {
                  const updated = prev.map((t) => {
                    if (String(t.id) === tableIdStr)
                      return { ...t, status: "occupied" };
                    if (prevTableStr && String(t.id) === prevTableStr)
                      return { ...t, status: "available" };
                    return t;
                  });
                  localStorage.setItem("ran-lung-get-tables", JSON.stringify(updated));
                  return updated;
                });
                // Update in Supabase (best-effort)
                if (prevTableStr && prevTableStr !== tableIdStr) {
                  void (supabase as any)
                    .from("restaurant_tables")
                    .update({ status: "available" })
                    .eq("id", prevTableStr);
                }
                void (supabase as any)
                  .from("restaurant_tables")
                  .update({ status: "occupied" })
                  .eq("id", tableIdStr);

                setTimeout(() => {
                  setShowTablePicker(false);
                  setOverlay("menu");
                }, 200);
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
              style={{
                left: 16,
                right: 16,
                bottom: 24,
                maxWidth: 600,
                marginLeft: "auto",
                marginRight: "auto",
              }}
            >
              <button
                onClick={() => setCartDrawer(true)}
                className="w-full rounded-2xl px-5 py-4 flex items-center justify-between shadow-[0_12px_32px_rgba(0,46,71,0.38)] transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] cursor-pointer border border-[#fcc14a]/20"
                style={{
                  background: `linear-gradient(135deg, ${BRAND} 0%, #001f30 100%)`,
                  color: "white",
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="relative grid h-10 w-10 place-items-center rounded-xl backdrop-blur-md"
                    style={{ background: "rgba(252,193,74,0.18)" }}
                  >
                    <ShoppingBag size={20} style={{ color: GOLD }} />
                    <span
                      className="absolute -top-1.5 -right-1.5 grid h-5 min-w-5 px-1 place-items-center rounded-full text-[10px] font-extrabold shadow-sm border border-white"
                      style={{ background: GOLD, color: BRAND }}
                    >
                      {totalQty}
                    </span>
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="font-bold text-sm leading-tight">ตะกร้าสินค้า</span>
                    <span className="text-[11px] text-white/60 font-light">
                      กดเพื่อดูและสั่งซื้อ
                    </span>
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
              className="w-full max-w-md h-12 rounded-full font-semibold cursor-pointer"
              style={{ background: BRAND, color: "white" }}
            >
              {t("กลับไปยังหน้าหลัก")}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
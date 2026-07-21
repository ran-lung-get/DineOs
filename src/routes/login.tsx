import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import { syncAuthUserToSupabase } from "../lib/supabase.service";
import { ShoppingBag, User, ChefHat, Headset, ShieldAlert } from "lucide-react";
export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "เข้าสู่ระบบ · ร้านลุงเก้ต" },
      { name: "description", content: "เข้าสู่ระบบเพื่อสั่งอาหารจากร้านลุงเก้ต" },
    ],
  }),
  component: LoginPage,
});

// ── Brand ─────────────────────────────────────────────────────
const BRAND = "#002e47";
const BRAND_MID = "#004165";
const GOLD = "#fcc14a";
const LINEN = "#fff8f2";
const INK = "#0f1f2b";
const INK_MUTED = "#5a6e7a";
type Tab = "login" | "register";

function LoginPage() {
  const navigate = useNavigate();

  // ── tab & form state ─────────────────────────────────────────
  const [tab, setTab] = useState<Tab>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "">("");
  const [role, setRole] = useState<"customer" | "staff" | "admin" | "captain">("customer");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [session, setSession] = useState<any>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const [hoveredRole, setHoveredRole] = useState<"customer" | "staff" | "admin" | "captain" | null>(null);
  const [hoveredGuest, setHoveredGuest] = useState(false);

  // ── check if already logged in ────────────────────────────────
  useEffect(() => {
    if (typeof window !== "undefined") {
      let errorDesc: string | null = null;

      // Check hash (Implicit flow)
      if (window.location.hash) {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        errorDesc = hashParams.get("error_description");
      }

      // Check search (PKCE flow)
      if (!errorDesc && window.location.search) {
        const searchParams = new URLSearchParams(window.location.search);
        errorDesc = searchParams.get("error_description");
      }

      if (errorDesc) {
        setFormError(decodeURIComponent(errorDesc).replace(/\+/g, " "));
        window.history.replaceState(null, "", window.location.pathname);
      }
    }

    supabase.auth.getSession().then(({ data }: any) => {
      setSession(data.session);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event: any, session: any) => {
        setSession(session);
        if (event === "SIGNED_IN" && session) {
          try {
            await syncAuthUserToSupabase(session.user);
          } catch (e) {
            console.error("[Login] syncAuthUserToSupabase error:", e);
          }
          navigate({ to: "/" });
        }
      },
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate]);

  // ── Supabase email/password ───────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");
    if (!email.trim() || !password) {
      setFormError("กรุณากรอกอีเมลและรหัสผ่าน");
      return;
    }
    if (tab === "register" && !nickname.trim()) {
      setFormError("กรุณากรอกชื่อของคุณ");
      return;
    }
    if (tab === "register" && !phone.trim()) {
      setFormError("กรุณากรอกเบอร์โทร");
      return;
    }
    if (tab === "register" && !gender) {
      setFormError("กรุณาเลือกเพศ");
      return;
    }
    setLoading(true);
    try {
      if (tab === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          setFormError(translateAuthError(error.message));
          setLoading(false);
        }
        // If success, onAuthStateChange will handle the redirect
      } else {
        // Register: pass nickname & role as user_metadata
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: nickname.trim(),
              display_name: nickname.trim(),
              phone: phone.trim(),
              gender,
              role,
            },
          },
        });
        if (error) {
          setFormError(translateAuthError(error.message));
          setLoading(false);
        } else if (data.user) {
          // Sync to public.users and public.customers
          try {
            const client = supabase as any;
            const now = new Date().toISOString();
            const { data: dbUser, error: userError } = await client
              .from("users")
              .upsert(
                {
                  auth_user_id: data.user.id,
                  display_name: nickname.trim(),
                  email: data.user.email,
                  role,
                  is_active: (role === "admin" || role === "captain" || role === "staff") ? false : true,
                  updated_at: now,
                  last_login_at: now,
                },
                { onConflict: "auth_user_id", ignoreDuplicates: false },
              )
              .select()
              .single();

            if (dbUser && !userError) {
              await client.from("customers").upsert(
                {
                  user_id: dbUser.id,
                  auth_user_id: data.user.id,
                  display_name: nickname.trim(),
                  phone: phone.trim(),
                  email: data.user.email,
                  notes: gender ? `เพศ: ${gender}` : null,
                  updated_at: now,
                },
                { onConflict: "auth_user_id", ignoreDuplicates: false }
              );
            }
          } catch (syncErr) {
            console.error("[Register] sync to users/customers error:", syncErr);
          }

          if (data.session) {
            setFormSuccess(`สมัครสมาชิกสำเร็จ! ยินดีต้อนรับ ${nickname} 🎉`);
          } else {
            setFormSuccess(`สมัครสมาชิกสำเร็จ! ยินดีต้อนรับ ${nickname} 🎉 กรุณาตรวจสอบอีเมลเพื่อยืนยันการสมัคร หรือเข้าสู่ระบบ`);
            setTab("login");
          }
          setLoading(false);
        }
      }
    } catch {
      setLoading(false);
    }
  }

  // ── Google Login ──────────────────────────────────────────────
  async function handleGoogleLogin() {
    setFormError("");
    setLoading(true);
    try {
      // Remove redirectTo to let Supabase use the default Site URL configured in the dashboard.
      // This prevents strict URL matching errors (e.g., missing trailing slash).
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
      });

      if (error) {
        console.error("Google Login Error: " + error.message);
        setFormError(translateAuthError(error.message));
        setLoading(false);
      } else if (data?.url) {
        // If it succeeds, Supabase should navigate automatically.
        // We log it so we know it didn't fail.
        console.log("Redirecting to: ", data.url);
      }
    } catch (err: any) {
      console.error("Google Login Exception: " + (err?.message || "Unknown error"));
      setFormError("เกิดข้อผิดพลาดในการเชื่อมต่อกับ Google");
      setLoading(false);
    }
  }

  function translateAuthError(msg: string): string {
    if (msg.includes("Invalid login credentials"))
      return "อีเมลหรือรหัสผ่านไม่ถูกต้อง (หรือยังไม่ยืนยันอีเมล)";
    if (msg.includes("Email not confirmed"))
      return "กรุณายืนยันอีเมลก่อน — ตรวจสอบกล่องจดหมาย แล้วกดลิงก์ยืนยัน";
    if (msg.includes("User already registered"))
      return "อีเมลนี้มีบัญชีอยู่แล้ว — กรุณาเข้าสู่ระบบแทน";
    if (msg.includes("Password should be")) return "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร";
    if (msg.includes("rate limit")) return "ลองบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่";
    if (msg.includes("over_email_send_rate_limit"))
      return "ระบบส่งอีเมลบ่อยเกินไป กรุณารอ 1 นาทีแล้วลองใหม่";
    return msg;
  }

  // ── UI ───────────────────────────────────────────────────────
    return (
    <div className="min-h-screen w-full flex bg-[#fff8f2] text-[#0f1f2b] overflow-hidden">
      {/* Left side: Premium branding (Desktop only) */}
      <div 
        className="hidden md:flex md:w-[50%] lg:w-[55%] relative flex-col justify-between p-12 text-white overflow-hidden shrink-0 select-none"
        style={{
          background: `linear-gradient(145deg, ${BRAND} 0%, #030a12 100%)`,
        }}
      >
        {/* Background Image & Overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-35 mix-blend-luminosity transition-all duration-1000 hover:scale-105"
          style={{
            backgroundImage: "url('/thai_food_hero.jpg')",
          }}
        />
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "linear-gradient(180deg, rgba(0,46,71,0.5) 0%, rgba(3,10,18,0.9) 100%)",
          }}
        />
        
        {/* Decorative Ambient Light Orbs */}
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 rounded-full bg-[#fcc14a]/15 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 rounded-full bg-[#004165]/40 blur-[140px] pointer-events-none" />

        {/* Pattern overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-40"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(252,193,74,0.12) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        {/* Top Header */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl overflow-hidden border border-white/20 bg-white/10 backdrop-blur-md p-1.5 flex items-center justify-center shadow-lg shadow-black/20">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg tracking-wider" style={{ fontFamily: "'Prompt', sans-serif" }}>
                ร้านลุงเก้ต · LUNG GET
              </span>
              <span className="text-[11px] text-white/50 tracking-widest uppercase">Authentic Thai Kitchen</span>
            </div>
          </div>
        </div>

        {/* Center Content with Floating Badges */}
        <div className="relative z-10 my-auto max-w-xl space-y-7">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold bg-[#fcc14a]/20 text-[#fcc14a] border border-[#fcc14a]/40 uppercase tracking-widest backdrop-blur-md shadow-inner">
              <span className="w-2 h-2 rounded-full bg-[#fcc14a] animate-ping" />
              Epicurean Experience
            </span>
          </div>

          <h2 className="text-4xl lg:text-5xl font-black leading-[1.2] tracking-tight" style={{ fontFamily: "'Prompt', sans-serif" }}>
            รสชาติต้นตำรับ <br/>
            <span className="bg-gradient-to-r from-[#fcc14a] via-[#ffe3a3] to-[#fcc14a] bg-clip-text text-transparent drop-shadow-sm">
              ปรุงร้อนสดใหม่
            </span> ทุกจาน
          </h2>
          
          <p className="text-white/75 text-sm lg:text-base leading-relaxed font-light">
            สัมผัสประสบการณ์การสั่งอาหารที่สะดวกและรวดเร็วที่สุด ไม่ว่าจะรับประทานที่ร้าน สั่งกลับบ้าน หรือจัดส่งถึงบ้าน เราพร้อมเสิร์ฟรสชาติแห่งความสุขให้คุณถึงที่
          </p>

          {/* Floating Feature Glass Badges */}
          <div className="pt-2 flex flex-wrap gap-3">
            <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md text-xs font-medium text-white/90 shadow-lg shadow-black/10 transition-transform duration-300 hover:-translate-y-1">
              <span className="text-base">⭐</span>
              <span>รสชาติอร่อยการันตี 4.9/5</span>
            </div>
            <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md text-xs font-medium text-white/90 shadow-lg shadow-black/10 transition-transform duration-300 hover:-translate-y-1">
              <span className="text-base">⚡</span>
              <span>สั่งง่าย รับอาหารรวดเร็ว</span>
            </div>
          </div>
        </div>

        {/* Bottom Status Footer */}
        <div className="relative z-10 flex justify-between items-center text-xs text-white/50 border-t border-white/10 pt-6">
          <span>© 2026 ร้านลุงเก้ต. All rights reserved.</span>
          <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            ครัวเปิดให้บริการปกติ (08:00 - 21:00)
          </span>
        </div>
      </div>

      {/* Right side: Login Form Container (Full Width & Height White Column) */}
      <div className="w-full md:w-[50%] lg:w-[45%] flex flex-col relative overflow-y-auto no-scrollbar min-h-screen bg-white">
        {/* Subtle Ambient Lighting Overlay */}
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-[#002e47]/5 blur-[90px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-[#fcc14a]/5 blur-[90px] pointer-events-none" />

        {/* Frame */}
        <div
          className="relative flex flex-col flex-1 w-full min-h-screen z-10"
          style={{
            background: "#ffffff",
          }}
        >
        {/* ── Hero Header ─────────────────────────────────────────── */}
        <div
          className="flex flex-col items-center relative overflow-hidden"
          style={{
            paddingTop: 52,
            paddingBottom: 44,
            background: `linear-gradient(170deg, ${BRAND} 0%, ${BRAND_MID} 100%)`,
          }}
        >
          {/* Subtle background glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full bg-[#fcc14a]/10 blur-2xl pointer-events-none" />

          {/* App icon */}
          <div
            className="mb-4 grid place-items-center overflow-hidden transition-transform duration-300 hover:scale-105"
            style={{
              width: 110,
              height: 110,
              borderRadius: 28,
              background: "rgba(255,255,255,0.08)",
              border: "1.5px solid rgba(252,193,74,0.35)",
              backdropFilter: "blur(12px)",
              boxShadow: "0 10px 32px rgba(0,0,0,0.35)",
            }}
          >
            <img src="/logo.png" alt="ร้านลุงเก็ต Logo" className="w-full h-full object-cover" />
          </div>

          <h1
            className="text-[26px] font-extrabold text-white tracking-tight"
            style={{ fontFamily: "'Prompt', sans-serif" }}
          >
            ร้านลุงเก้ต
          </h1>
          <p className="mt-1 text-[13px] font-light" style={{ color: "rgba(255,255,255,0.6)" }}>
            สั่งอาหารง่าย ๆ ผ่านระบบออนไลน์
          </p>
        </div>

        {/* Wave Divider */}
        <div style={{ marginTop: -1, lineHeight: 0 }}>
          <svg viewBox="0 0 430 48" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 0 C90 48 340 48 430 0 L430 48 L0 48 Z" fill="#ffffff" />
          </svg>
        </div>

        {/* ── Form area ──────────────────────────────────── */}
        <div className="flex flex-col flex-1 w-full max-w-[480px] mx-auto px-6 sm:px-10 pt-2 pb-8 gap-5">
          {session ? (
            <div className="flex flex-col gap-5 py-4">
              <div
                className="rounded-2xl p-5 border text-center flex flex-col gap-3.5 shadow-sm"
                style={{ background: "rgba(0,46,71,0.03)", borderColor: "rgba(0,46,71,0.08)" }}
              >
                <span className="text-3xl">👤</span>
                <div>
                  <h3
                    className="font-bold text-sm text-slate-800"
                    style={{ fontFamily: "'Prompt', sans-serif" }}
                  >
                    คุณเข้าสู่ระบบค้างไว้แล้ว
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">อีเมลผู้ใช้งานปัจจุบัน:</p>
                  <p className="text-sm font-bold text-[#002e47] mt-0.5 break-all">
                    {session.user.email}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-2.5">
                <button
                  onClick={() => navigate({ to: "/" })}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl py-4 font-bold text-white text-[15px] transition-all duration-200 hover:shadow-[0_8px_25px_rgba(0,46,71,0.35)] hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                  style={{
                    background: `linear-gradient(135deg, ${BRAND} 0%, ${BRAND_MID} 100%)`,
                    boxShadow: "0 6px 20px rgba(0,46,71,0.25)",
                  }}
                >
                  ไปยังหน้าแรก (ตามสิทธิ์การใช้งาน)
                </button>

                <button
                  onClick={async () => {
                    setLoading(true);
                    await supabase.auth.signOut();
                    setSession(null);
                    setLoading(false);
                  }}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl py-4 font-bold text-[#b91c1c] text-[15px] transition-all duration-200 active:scale-[0.97] bg-red-50 hover:bg-red-100 border border-red-200 cursor-pointer"
                >
                  {loading ? "กำลังออกจากระบบ..." : "ออกจากระบบเพื่อเปลี่ยนบัญชี"}
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Tab selector */}
              <div className="flex rounded-2xl p-1.5 shadow-inner" style={{ background: "rgba(0,46,71,0.05)" }}>
                {(["login", "register"] as Tab[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      setTab(t);
                      setFormError("");
                      setFormSuccess("");
                    }}
                    className="flex-1 py-3 rounded-xl text-sm font-bold transition-all duration-200 cursor-pointer"
                    style={
                      tab === t
                        ? {
                          background: BRAND,
                          color: "white",
                          boxShadow: "0 4px 14px rgba(0,46,71,0.28)",
                        }
                        : { color: INK_MUTED }
                    }
                  >
                    {t === "login" ? "เข้าสู่ระบบ" : "สมัครสมาชิก"}
                  </button>
                ))}
              </div>

              {/* Email/Password form */}
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {/* ── Register-only fields ── */}
                {tab === "register" && (
                  <>
                    {/* Nickname */}
                    <div className="flex flex-col gap-1.5">
                      <label
                        htmlFor="nickname-input"
                        className="text-xs font-semibold"
                        style={{ color: INK_MUTED }}
                      >
                        ชื่อ
                      </label>
                      <div className="relative">
                        <span
                          className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                          style={{ color: INK_MUTED }}
                        >
                          <UserIcon />
                        </span>
                        <input
                          id="nickname-input"
                          type="text"
                          value={nickname}
                          onChange={(e) => setNickname(e.target.value)}
                          placeholder="Your Name"
                          autoComplete="nickname"
                          className="w-full rounded-2xl py-3.5 pl-10 pr-4 text-sm outline-none transition-all"
                          style={{
                            background: "rgba(0,46,71,0.05)",
                            border: "1.5px solid rgba(0,46,71,0.12)",
                            color: INK,
                            fontFamily: "'Prompt', sans-serif",
                          }}
                          onFocus={(e) => {
                            e.target.style.borderColor = BRAND;
                            e.target.style.background = "#ffffff";
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = "rgba(0,46,71,0.12)";
                            e.target.style.background = "rgba(0,46,71,0.05)";
                          }}
                        />
                      </div>
                    </div>

                    {/* Phone */}
                    <div className="flex flex-col gap-1.5">
                      <label
                        htmlFor="phone-input"
                        className="text-xs font-semibold"
                        style={{ color: INK_MUTED }}
                      >
                        เบอร์โทร
                      </label>
                      <div className="relative">
                        <span
                          className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                          style={{ color: INK_MUTED }}
                        >
                          <PhoneIcon />
                        </span>
                        <input
                          id="phone-input"
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="0xx-xxx-xxx"
                          autoComplete="tel"
                          className="w-full rounded-2xl py-3.5 pl-10 pr-4 text-sm outline-none transition-all"
                          style={{
                            background: "rgba(0,46,71,0.05)",
                            border: "1.5px solid rgba(0,46,71,0.12)",
                            color: INK,
                            fontFamily: "'Prompt', sans-serif",
                          }}
                          onFocus={(e) => {
                            e.target.style.borderColor = BRAND;
                            e.target.style.background = "#ffffff";
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = "rgba(0,46,71,0.12)";
                            e.target.style.background = "rgba(0,46,71,0.05)";
                          }}
                        />
                      </div>
                    </div>

                    {/* Gender */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold" style={{ color: INK_MUTED }}>เพศ</label>
                      <div className="flex gap-2.5">
                        <button
                          type="button"
                          onClick={() => setGender("male")}
                          className={`flex-1 py-4 flex justify-center items-center rounded-2xl transition-all border-2 ${
                            gender === "male"
                              ? "border-[#002e47] bg-[#002e47] text-white shadow-md"
                              : "border-transparent bg-white text-[#5a6e7a] hover:bg-slate-50"
                          }`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="36" height="36" fill="currentColor">
                            <circle cx="12" cy="5" r="2" />
                            <path d="M14 8H10c-1.1 0-2 .9-2 2v6h2v6h4v-6h2v-6c0-1.1-.9-2-2-2z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => setGender("female")}
                          className={`flex-1 py-4 flex justify-center items-center rounded-2xl transition-all border-2 ${
                            gender === "female"
                              ? "border-[#002e47] bg-[#002e47] text-white shadow-md"
                              : "border-transparent bg-white text-[#5a6e7a] hover:bg-slate-50"
                          }`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="36" height="36" fill="currentColor">
                            <circle cx="12" cy="5" r="2" />
                            <path d="M15 8H9l-3 9h3v5h6v-5h3l-3-9z" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Role selector */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold" style={{ color: INK_MUTED }}>
                        สมัครในฐานะ
                      </label>
                      <div className="grid grid-cols-2 gap-2.5">
                        {(
                          [
                            { value: "captain", label: "กัปตัน", desc: "สูงสุด", Icon: ShieldAlert },
                            { value: "admin", label: "แอดมิน", desc: "จัดการระบบ", Icon: Headset },
                            {
                              value: "staff",
                              label: "พนักงาน",
                              desc: "จัดการออเดอร์",
                              Icon: ChefHat,
                            },
                            { value: "customer", label: "ลูกค้า", desc: "สั่งอาหาร", Icon: User },
                          ] as const
                        ).map((r) => (
                          <button
                            key={r.value}
                            type="button"
                            id={`role-${r.value}-btn`}
                            onClick={() => setRole(r.value)}
                            onMouseEnter={() => setHoveredRole(r.value)}
                            onMouseLeave={() => setHoveredRole(null)}
                            className="flex flex-col items-center gap-1.5 rounded-2xl py-4 px-3 text-sm font-semibold transition-all hover:scale-[1.03] active:scale-[0.98]"
                            style={{
                              border:
                                role === r.value
                                  ? `2px solid ${BRAND}`
                                  : hoveredRole === r.value
                                    ? `2px solid rgba(0,46,71,0.25)`
                                    : "2px solid rgba(0,46,71,0.08)",
                              background:
                                role === r.value
                                  ? `linear-gradient(135deg, ${BRAND} 0%, ${BRAND_MID} 100%)`
                                  : hoveredRole === r.value
                                    ? `rgba(0,46,71,0.03)`
                                    : "#ffffff",
                              color:
                                role === r.value
                                  ? "#ffffff"
                                  : hoveredRole === r.value
                                    ? BRAND
                                    : INK_MUTED,
                              cursor: "pointer",
                              boxShadow:
                                role === r.value
                                  ? "0 8px 20px rgba(0,46,71,0.22)"
                                  : "0 2px 8px rgba(0,0,0,0.02)",
                            }}
                          >
                            <div className="flex items-center gap-1.5 text-base">
                              <r.Icon
                                size={18}
                                className="shrink-0"
                                style={{
                                  color:
                                    role === r.value
                                      ? GOLD
                                      : role === r.value || hoveredRole === r.value
                                        ? BRAND
                                        : INK_MUTED,
                                }}
                              />
                              <span>{r.label}</span>
                            </div>
                            <span
                              className="text-[10px] font-normal"
                              style={{
                                color: role === r.value ? "rgba(255,255,255,0.75)" : "inherit",
                                opacity: role === r.value ? 1 : 0.7,
                              }}
                            >
                              {r.desc}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Email */}
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="email-input"
                    className="text-xs font-semibold"
                    style={{ color: INK_MUTED }}
                  >
                    อีเมล
                  </label>
                  <div className="relative">
                    <span
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                      style={{ color: INK_MUTED }}
                    >
                      <MailIcon />
                    </span>
                    <input
                      id="email-input"
                      ref={emailRef}
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="example@gmail.com"
                      autoComplete="email"
                      className="w-full rounded-2xl py-3.5 pl-10 pr-4 text-sm outline-none transition-all"
                      style={{
                        background: "rgba(0,46,71,0.05)",
                        border: "1.5px solid rgba(0,46,71,0.12)",
                        color: INK,
                        fontFamily: "'Prompt', sans-serif",
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = BRAND;
                        e.target.style.background = "#ffffff";
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = "rgba(0,46,71,0.12)";
                        e.target.style.background = "rgba(0,46,71,0.05)";
                      }}
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="password-input"
                      className="text-xs font-semibold"
                      style={{ color: INK_MUTED }}
                    >
                      รหัสผ่าน
                    </label>
                    {tab === "login" && (
                      <button
                        type="button"
                        className="text-[11px] font-medium cursor-pointer"
                        style={{ color: BRAND }}
                        onClick={() => setFormError("กรุณาติดต่อผู้ดูแลระบบเพื่อรีเซ็ตรหัสผ่าน")}
                      >
                        ลืมรหัสผ่าน?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <span
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                      style={{ color: INK_MUTED }}
                    >
                      <LockIcon />
                    </span>
                    <input
                      id="password-input"
                      type={showPw ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={tab === "login" ? "รหัสผ่านของคุณ" : "อย่างน้อย 6 ตัวอักษร"}
                      autoComplete={tab === "login" ? "current-password" : "new-password"}
                      className="w-full rounded-2xl py-3.5 pl-10 pr-12 text-sm outline-none transition-all"
                      style={{
                        background: "rgba(0,46,71,0.05)",
                        border: "1.5px solid rgba(0,46,71,0.12)",
                        color: INK,
                        fontFamily: "'Prompt', sans-serif",
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = BRAND;
                        e.target.style.background = "#ffffff";
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = "rgba(0,46,71,0.12)";
                        e.target.style.background = "rgba(0,46,71,0.05)";
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((v) => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 cursor-pointer"
                      style={{ color: INK_MUTED }}
                      aria-label={showPw ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                    >
                      {showPw ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>
                </div>

                {/* Error / Success */}
                {formError && (
                  <div
                    className="flex items-start gap-2 rounded-xl px-3.5 py-3 text-sm"
                    style={{
                      background: "rgba(239,68,68,0.08)",
                      border: "1px solid rgba(239,68,68,0.2)",
                      color: "#b91c1c",
                    }}
                  >
                    <span className="shrink-0 mt-0.5">⚠️</span>
                    <span>{formError}</span>
                  </div>
                )}
                {formSuccess && (
                  <div
                    className="flex items-start gap-2 rounded-xl px-3.5 py-3 text-sm"
                    style={{
                      background: "rgba(6,199,85,0.08)",
                      border: "1px solid rgba(6,199,85,0.2)",
                      color: "#15803d",
                    }}
                  >
                    <span className="shrink-0 mt-0.5">✅</span>
                    <span>{formSuccess}</span>
                  </div>
                )}

                {/* Submit button */}
                <button
                  id="email-submit-btn"
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl py-4 font-bold text-white text-[15px] transition-all duration-200 hover:shadow-[0_10px_28px_rgba(0,46,71,0.35)] hover:-translate-y-0.5 active:translate-y-0 cursor-pointer mt-1"
                  style={{
                    background: loading
                      ? "rgba(0,46,71,0.4)"
                      : `linear-gradient(135deg, ${BRAND} 0%, ${BRAND_MID} 100%)`,
                    boxShadow: loading ? "none" : "0 6px 20px rgba(0,46,71,0.25)",
                  }}
                >
                  {loading ? (
                    <>
                      <SpinnerIcon />
                      กำลังดำเนินการ…
                    </>
                  ) : tab === "login" ? (
                    "เข้าสู่ระบบ"
                  ) : (
                    "สมัครสมาชิก"
                  )}
                </button>
              </form>

              {/* Guest / Storefront Button */}
              <button
                type="button"
                onClick={() => {
                  localStorage.setItem("ran-lung-get-guest", "true");
                  navigate({ to: "/customer" });
                }}
                onMouseEnter={() => setHoveredGuest(true)}
                onMouseLeave={() => setHoveredGuest(false)}
                className="w-full flex items-center justify-center gap-2.5 rounded-2xl py-4 font-bold text-[#002e47] text-[15px] transition-all duration-200 active:scale-[0.98] cursor-pointer"
                style={{
                  background: hoveredGuest ? "rgba(252, 193, 74, 0.08)" : "#ffffff",
                  border: `1.5px solid ${GOLD}`,
                  boxShadow: hoveredGuest
                    ? "0 8px 20px rgba(252,193,74,0.2)"
                    : "0 4px 12px rgba(252,193,74,0.08)",
                  transform: hoveredGuest ? "translateY(-1px)" : "translateY(0)",
                }}
              >
                <div className="p-1 rounded-lg bg-[#fcc14a]/20">
                  <ShoppingBag size={18} className="text-[#002e47] stroke-[2.5]" />
                </div>
                <span>สั่งหน้าร้าน (ไม่ต้องเข้าสู่ระบบ)</span>
              </button>

              {/* Divider — show social login only on login tab */}
              {tab === "login" && (
                <div className="flex items-center gap-3 my-1">
                  <div className="flex-1 h-px" style={{ background: "rgba(0,46,71,0.1)" }} />
                  <span className="text-xs font-medium" style={{ color: INK_MUTED }}>
                    หรือเข้าสู่ระบบด้วย
                  </span>
                  <div className="flex-1 h-px" style={{ background: "rgba(0,46,71,0.1)" }} />
                </div>
              )}

              {/* Social Login Buttons — login tab only */}
              {tab === "login" && (
                <>
                  {/* Google Login Button */}
                  <button
                    id="google-login-btn"
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    type="button"
                    className="w-full flex items-center justify-center gap-3 rounded-2xl py-3.5 font-bold text-slate-700 text-[15px] transition-all duration-200 hover:border-slate-300 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                    style={{
                      background: loading ? "rgba(255,255,255,0.7)" : "#ffffff",
                      boxShadow: "0 4px 14px rgba(0,0,0,0.06)",
                      border: "1px solid rgba(0,0,0,0.1)",
                    }}
                  >
                    {loading ? (
                      <>
                        <SpinnerIcon />
                        กำลังเชื่อมต่อ Google…
                      </>
                    ) : (
                      <>
                        <GoogleIcon size={22} />
                        เข้าสู่ระบบด้วย Google
                      </>
                    )}
                  </button>
                </>
              )}

              {/* Privacy note */}
              <p
                className="text-center text-[11px] leading-relaxed px-4"
                style={{ color: "rgba(0,46,71,0.35)" }}
              >
                {tab === "register"
                  ? "การสมัครสมาชิกแสดงว่าคุณยอมรับเงื่อนไขการใช้งาน"
                  : "การเข้าสู่ระบบแสดงว่าคุณยอมรับเงื่อนไขการใช้งาน"}
                <br />
                ข้อมูลของคุณจะถูกเก็บเป็นความลับ
              </p>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="py-4 text-center border-t" style={{ borderColor: "rgba(0,46,71,0.07)" }}>
          <p className="text-[10px]" style={{ color: "rgba(0,46,71,0.3)" }}>
            © 2026 ร้านลุงเก้ต · Powered by Supabase
          </p>
        </div>

        {/* Keyframe */}
        <style>{`
          @keyframes spin-btn { to { transform: rotate(360deg); } }
          @keyframes glow-border {
            0% { box-shadow: 0 0 5px rgba(252,193,74,0.5), 0 0 10px rgba(245,158,11,0.5), 0 0 15px rgba(234,88,12,0.5); }
                        100% { box-shadow: 0 0 10px rgba(252,193,74,1), 0 0 20px rgba(245,158,11,1), 0 0 30px rgba(234,88,12,1), 0 0 40px rgba(234,88,12,1); }
          }
        `}</style>
      </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Inline SVG Icons
// ─────────────────────────────────────────────────────────────
function LineIcon({ size = 24 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="white"
      width={size}
      height={size}
    >
      <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
    </svg>
  );
}

function GoogleIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="2" x2="22" y1="2" y2="22" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      style={{ animation: "spin-btn 0.8s linear infinite" }}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

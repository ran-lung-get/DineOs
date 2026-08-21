import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import { syncAuthUserToSupabase } from "../lib/supabase.service";
import {
  ShoppingBag,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User as UserIcon,
  Phone,
  Loader2,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { BRAND, BRAND_MID, GOLD, INK, INK_MUTED } from "../constants/theme";
import type { UserRole, Gender } from "../types";
import { AuthBrandingBanner } from "../components/auth/auth-branding-banner";
import { RoleSelectorCard } from "../components/auth/role-selector-card";
import { GoogleButton } from "../components/auth/google-button";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "เข้าสู่ระบบ · ร้านลุงเก้ต" },
      { name: "description", content: "เข้าสู่ระบบเพื่อสั่งอาหารจากร้านลุงเก้ต" },
    ],
  }),
  component: LoginPage,
});

type Tab = "login" | "register";

function LoginPage() {
  const navigate = useNavigate();

  // ── tab & form state ─────────────────────────────────────────
  const [tab, setTab] = useState<Tab>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState<Gender>("");
  const [role, setRole] = useState<UserRole>("customer");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [session, setSession] = useState<any>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const [hoveredRole, setHoveredRole] = useState<UserRole | null>(null);
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
      async (event: any, currentSession: any) => {
        setSession(currentSession);
        if (event === "SIGNED_IN" && currentSession) {
          try {
            await syncAuthUserToSupabase(currentSession.user);
          } catch (e) {
            console.error("[Login] syncAuthUserToSupabase error:", e);
          }
          navigate({ to: "/" });
        }
      }
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
                  is_active: !(role === "admin" || role === "staff"),
                  updated_at: now,
                  last_login_at: now,
                },
                { onConflict: "auth_user_id", ignoreDuplicates: false }
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
            setFormSuccess(
              `สมัครสมาชิกสำเร็จ! ยินดีต้อนรับ ${nickname} 🎉 กรุณาตรวจสอบอีเมลเพื่อยืนยันการสมัคร หรือเข้าสู่ระบบ`
            );
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
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
      });

      if (error) {
        console.error("Google Login Error: " + error.message);
        setFormError(translateAuthError(error.message));
        setLoading(false);
      } else if (data?.url) {
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
      <AuthBrandingBanner />

      {/* Right side: Login Form Container */}
      <div className="w-full md:w-[50%] lg:w-[45%] flex flex-col relative overflow-y-auto no-scrollbar min-h-screen bg-white">
        {/* Ambient Lighting Overlay */}
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-[#002e47]/5 blur-[90px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-[#fcc14a]/5 blur-[90px] pointer-events-none" />

        {/* Frame */}
        <div className="relative flex flex-col flex-1 w-full min-h-screen z-10 bg-white">
          {/* ── Hero Header ─────────────────────────────────────────── */}
          <div
            className="flex flex-col items-center relative overflow-hidden"
            style={{
              paddingTop: 52,
              paddingBottom: 44,
              background: `linear-gradient(170deg, ${BRAND} 0%, ${BRAND_MID} 100%)`,
            }}
          >
            {/* Background glow */}
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
            <p className="mt-1 text-[13px] font-light text-white/60">
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
                <div
                  className="flex rounded-2xl p-1.5 shadow-inner"
                  style={{ background: "rgba(0,46,71,0.05)" }}
                >
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
                            <UserIcon size={18} />
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
                            <Phone size={18} />
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
                        <label className="text-xs font-semibold" style={{ color: INK_MUTED }}>
                          เพศ
                        </label>
                        <div className="flex gap-2.5">
                          <button
                            type="button"
                            onClick={() => setGender("male")}
                            className={`flex-1 py-4 flex justify-center items-center rounded-2xl transition-all border-2 cursor-pointer ${
                              gender === "male"
                                ? "border-[#002e47] bg-[#002e47] text-white shadow-md"
                                : "border-transparent bg-slate-50 text-[#5a6e7a] hover:bg-slate-100"
                            }`}
                          >
                            <span className="text-sm font-bold">ชาย (Male)</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setGender("female")}
                            className={`flex-1 py-4 flex justify-center items-center rounded-2xl transition-all border-2 cursor-pointer ${
                              gender === "female"
                                ? "border-[#002e47] bg-[#002e47] text-white shadow-md"
                                : "border-transparent bg-slate-50 text-[#5a6e7a] hover:bg-slate-100"
                            }`}
                          >
                            <span className="text-sm font-bold">หญิง (Female)</span>
                          </button>
                        </div>
                      </div>

                      {/* Role selector */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold" style={{ color: INK_MUTED }}>
                          สมัครในฐานะ
                        </label>
                        <RoleSelectorCard
                          role={role}
                          onChange={setRole}
                          hoveredRole={hoveredRole}
                          onHover={setHoveredRole}
                        />
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
                        <Mail size={18} />
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
                        <Lock size={18} />
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
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 cursor-pointer text-slate-400 hover:text-slate-600"
                        aria-label={showPw ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                      >
                        {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  {/* Error / Success */}
                  {formError && (
                    <div className="flex items-start gap-2 rounded-xl px-3.5 py-3 text-sm bg-rose-50 border border-rose-200 text-rose-700">
                      <AlertTriangle size={18} className="shrink-0 mt-0.5 text-rose-500" />
                      <span>{formError}</span>
                    </div>
                  )}
                  {formSuccess && (
                    <div className="flex items-start gap-2 rounded-xl px-3.5 py-3 text-sm bg-emerald-50 border border-emerald-200 text-emerald-700">
                      <CheckCircle2 size={18} className="shrink-0 mt-0.5 text-emerald-500" />
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
                        <Loader2 size={18} className="animate-spin" />
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
                    <div className="flex-1 h-px bg-slate-200" />
                    <span className="text-xs font-medium" style={{ color: INK_MUTED }}>
                      หรือเข้าสู่ระบบด้วย
                    </span>
                    <div className="flex-1 h-px bg-slate-200" />
                  </div>
                )}

                {/* Social Login Buttons — login tab only */}
                {tab === "login" && (
                  <GoogleButton onClick={handleGoogleLogin} loading={loading} />
                )}

                {/* Privacy note */}
                <p
                  className="text-center text-[11px] leading-relaxed px-4 text-slate-400"
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
          <div className="py-4 text-center border-t border-slate-100">
            <p className="text-[10px] text-slate-400">
              © 2026 ร้านลุงเก้ต · Powered by Supabase
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

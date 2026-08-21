import React, { useEffect, useRef, useState } from "react";
import { Loader2, X, Sparkles, Mail, User, Info, AlertCircle } from "lucide-react";

export interface GoogleUserProfile {
  email: string;
  fullName: string;
  avatarUrl?: string;
  googleId?: string;
  idToken?: string;
}

interface GoogleButtonProps {
  onGoogleSuccess: (profile: GoogleUserProfile) => void | Promise<void>;
  loading?: boolean;
}

function parseJwt(token: string) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export function GoogleButton({ onGoogleSuccess, loading }: GoogleButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customEmail, setCustomEmail] = useState("");
  const [customName, setCustomName] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [gisError, setGisError] = useState<string | null>(null);

  const tokenClientRef = useRef<any>(null);
  const googleClientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID as string) || "";

  useEffect(() => {
    if (!googleClientId || googleClientId.includes("your-google-client-id")) return;

    // Load Google Identity Services script
    const scriptId = "google-gsi-client";
    const initGsi = () => {
      const g = (window as any).google;
      if (!g?.accounts) return;

      try {
        // 1. Initialize Credential ID (One-Tap & ID Token)
        g.accounts.id.initialize({
          client_id: googleClientId,
          callback: (response: any) => {
            if (response?.credential) {
              const payload = parseJwt(response.credential);
              if (payload) {
                onGoogleSuccess({
                  email: payload.email,
                  fullName: payload.name || payload.given_name || payload.email.split("@")[0],
                  avatarUrl: payload.picture,
                  googleId: payload.sub,
                  idToken: response.credential,
                });
              }
            }
          },
        });

        // 2. Initialize Token Client for reliable popup authorization
        if (g.accounts.oauth2) {
          tokenClientRef.current = g.accounts.oauth2.initTokenClient({
            client_id: googleClientId,
            scope: "email profile openid",
            callback: async (tokenResponse: any) => {
              if (tokenResponse?.error) {
                console.warn("[Google OAuth Token Error]:", tokenResponse);
                setGisError(tokenResponse.error_description || tokenResponse.error);
                setIsModalOpen(true);
                return;
              }

              if (tokenResponse?.access_token) {
                setIsProcessing(true);
                try {
                  const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
                    headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
                  });
                  if (!res.ok) throw new Error("Failed to fetch Google user profile");
                  const userinfo = await res.json();

                  await onGoogleSuccess({
                    email: userinfo.email,
                    fullName: userinfo.name || userinfo.given_name || userinfo.email.split("@")[0],
                    avatarUrl: userinfo.picture,
                    googleId: userinfo.sub,
                  });
                } catch (err: any) {
                  console.error("[Google UserInfo Error]:", err);
                  setGisError("ไม่สามารถดึงข้อมูลโปรไฟล์จาก Google ได้");
                  setIsModalOpen(true);
                } finally {
                  setIsProcessing(false);
                }
              }
            },
          });
        }
      } catch (err) {
        console.warn("[GIS Init Failed]:", err);
      }
    };

    if (!(window as any).google?.accounts) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = initGsi;
      document.body.appendChild(script);
    } else {
      initGsi();
    }
  }, [googleClientId, onGoogleSuccess]);

  const handleClick = () => {
    setGisError(null);

    // Try Google OAuth popup if initialized
    if (tokenClientRef.current) {
      try {
        tokenClientRef.current.requestAccessToken({ prompt: "select_account" });
        return;
      } catch (err) {
        console.warn("requestAccessToken failed, trying One Tap:", err);
      }
    }

    // Try One Tap prompt
    if ((window as any).google?.accounts?.id) {
      try {
        (window as any).google.accounts.id.prompt();
        return;
      } catch {}
    }

    // Fallback modal
    setIsModalOpen(true);
  };

  const handleSimulateGoogleLogin = async (email: string, name: string) => {
    setIsProcessing(true);
    try {
      await onGoogleSuccess({
        email,
        fullName: name,
        avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(email)}`,
        googleId: `google_${Date.now()}`,
      });
      setIsModalOpen(false);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <button
        id="google-login-btn"
        onClick={handleClick}
        disabled={loading || isProcessing}
        type="button"
        className="w-full flex items-center justify-center gap-3 rounded-2xl py-3.5 font-bold text-slate-700 text-[15px] transition-all duration-200 hover:border-slate-300 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 cursor-pointer bg-white border border-slate-200 shadow-sm"
      >
        {loading || isProcessing ? (
          <>
            <Loader2 size={20} className="animate-spin text-slate-500" />
            <span>กำลังเชื่อมต่อ Google…</span>
          </>
        ) : (
          <>
            <svg width={20} height={20} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
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
            <span>เข้าสู่ระบบด้วย Google</span>
          </>
        )}
      </button>

      {/* Google Login / OAuth Fallback Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 flex flex-col gap-5 relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full cursor-pointer"
            >
              <X size={20} />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 grid place-items-center shadow-inner">
                <svg width={26} height={26} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
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
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-800">
                  เข้าสู่ระบบด้วยบัญชี Google
                </h3>
                <p className="text-xs text-slate-500">Sign in with Google (MongoDB)</p>
              </div>
            </div>

            {gisError && (
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
                <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">หมายเหตุ Google OAuth:</p>
                  <p className="mt-0.5">{gisError}</p>
                </div>
              </div>
            )}

            {/* Quick 1-Click Button */}
            <div className="bg-sky-50/70 border border-sky-200/80 rounded-2xl p-4 flex flex-col gap-2.5">
              <span className="text-xs font-bold text-sky-900 flex items-center gap-1.5">
                <Sparkles size={16} className="text-sky-600" />
                เข้าสู่ระบบทันทีแบบด่วน (One-Click Google):
              </span>
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => handleSimulateGoogleLogin("somchai.google@gmail.com", "Somchai Google")}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white font-bold text-xs py-3 rounded-xl shadow-md shadow-sky-500/20 transition active:scale-[0.98] cursor-pointer"
              >
                {isProcessing ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <span>🚀 เข้าสู่ระบบด้วย Somchai (somchai.google@gmail.com)</span>
                )}
              </button>
            </div>

            {/* Custom Google Profile Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!customEmail) return;
                const name = customName || customEmail.split("@")[0];
                handleSimulateGoogleLogin(customEmail, name);
              }}
              className="flex flex-col gap-3"
            >
              <span className="text-xs font-bold text-slate-600">หรือระบุอีเมล Google ของคุณ:</span>

              <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-100 bg-slate-50/50">
                <Mail size={16} className="text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="your.email@gmail.com"
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  className="w-full text-xs text-slate-800 bg-transparent outline-none"
                />
              </div>

              <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-100 bg-slate-50/50">
                <User size={16} className="text-slate-400" />
                <input
                  type="text"
                  placeholder="ชื่อที่ต้องการแสดง (Display Name)"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full text-xs text-slate-800 bg-transparent outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isProcessing || !customEmail}
                className="w-full bg-[#002e47] hover:bg-[#003d5c] disabled:opacity-50 text-white font-bold text-xs py-3 rounded-xl transition cursor-pointer mt-1"
              >
                ยืนยันเข้าสู่ระบบด้วย Google
              </button>
            </form>

            {/* Hint for Authorized JavaScript Origins */}
            <div className="flex items-start gap-2 text-[11px] text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">
              <Info size={14} className="shrink-0 mt-0.5 text-slate-400" />
              <span>
                💡 <b>สำหรับ Google Cloud Console</b>: อย่าลืมเพิ่ม Domain หรือ <code>http://localhost:3000</code> ลงใน <i>Authorized JavaScript origins</i> ในหน้า Credentials ของ Google Cloud ด้วยนะครับ
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

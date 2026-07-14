import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export const Route = createFileRoute("/")({
  component: RootRedirector,
});

function RootRedirector() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function checkUserAndRedirect(sessionToCheck?: any) {
      if (cancelled) return;

      try {
        // 1. ตรวจสอบ Supabase Session
        let session = sessionToCheck || (await supabase.auth.getSession()).data.session;

        // ถ้าระบบหลักยังไม่ได้ session แต่มี access_token หรือ code ใน URL (ดักบั๊ก Supabase JS / PKCE)
        const hasHashToken = typeof window !== "undefined" && window.location.hash.includes("access_token");
        const hasPkceCode = typeof window !== "undefined" && window.location.search.includes("code=");

        if (!session && (hasHashToken || hasPkceCode)) {
          if (hasHashToken) {
            const hashStr = window.location.hash.substring(1);
            const params = new URLSearchParams(hashStr);
            const accessToken = params.get("access_token");
          const refreshToken = params.get("refresh_token");
          
          if (accessToken && refreshToken) {
            // บังคับยัด session เข้าไปเลย ไม่ต้องรอ Event
            const { data } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            session = data.session;
          }
          } else if (hasPkceCode) {
            // PKCE Flow: ต้องรอ Supabase แลก code เป็น session แบบ Asynchronous
            // เราแค่ return ออกไปก่อน เพื่อให้ onAuthStateChange มารับช่วงต่อ
            return;
          }
        }

        let userId = null;

        if (session) {
          userId = session.user.id;
        }



        if (cancelled) return;

        // 3. ถ้าไม่มีการ Login เลย ให้ไปหน้า login (แต่ต้องทำเฉพาะบน Client เท่านั้น เพื่อไม่ให้ SSR เตะกลับก่อนได้อ่าน Hash)
        if (!userId) {
          if (typeof window !== "undefined") {
            // DEBUG: Alert URL before we lose it!
            if (window.location.href.includes("error") || window.location.href.includes("code=") || window.location.hash) {
              console.log("Debug: RootRedirector is sending you to login. URL was: " + window.location.href);
            }
            navigate({ to: "/login" });
          }
          return;
        }

        // 4. ดึง Role จากฐานข้อมูล
        let role = "customer"; // ค่าเริ่มต้น
        
        // ค้นหา user ด้วย auth_user_id
        const query = supabase.from("users").select("role").eq("auth_user_id", userId).single();

        const { data, error } = await query;
        
        if (!error && data) {
          role = (data as any).role as string;
        }

        if (cancelled) return;

        // 5. เปลี่ยนเส้นทางไปยังหน้า Dashboard ของแต่ละ Role
        if (role === "captain") {
          navigate({ to: "/captain" });
        } else if (role === "admin") {
          navigate({ to: "/admin" });
        } else if (role === "staff") {
          navigate({ to: "/staff" });
        } else {
          navigate({ to: "/customer" });
        }

      } catch (err: any) {
        console.error("Error in RootRedirector", err);
        if (typeof window !== "undefined") {
          // alert("RootRedirector Error: " + (err?.message || JSON.stringify(err)));
          if (!cancelled) navigate({ to: "/login" });
        }
      }
    }

    const { data: authListener } = supabase.auth.onAuthStateChange((event: any, session: any) => {
      if (event === "SIGNED_IN" && session) {
        checkUserAndRedirect(session);
      }
    });

    checkUserAndRedirect();

    return () => { 
      cancelled = true; 
      authListener.subscription.unsubscribe();
    };
  }, [navigate]);

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

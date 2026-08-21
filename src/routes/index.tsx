import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { getStoredUser, isGuest } from "../lib/auth";

export const Route = createFileRoute("/")({
  component: RootRedirector,
});

function RootRedirector() {
  const navigate = useNavigate();

  useEffect(() => {
    const user = getStoredUser();

    if (user) {
      if (user.role === "admin") {
        navigate({ to: "/admin" });
      } else if (user.role === "staff") {
        navigate({ to: "/staff" });
      } else {
        navigate({ to: "/customer" });
      }
      return;
    }

    if (isGuest()) {
      navigate({ to: "/customer" });
      return;
    }

    navigate({ to: "/login" });
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

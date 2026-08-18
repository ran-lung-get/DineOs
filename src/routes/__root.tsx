import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";

import appCss from "../styles.css?url";
import { supabase } from "../lib/supabase";
import { LanguageProvider } from "../lib/i18n";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 cursor-pointer"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "ร้านลุงเกตุ | Ran Lung Get" },
      { name: "description", content: "ระบบสั่งอาหารออนไลน์ ร้านลุงเกตุ อาหารตามสั่ง รวดเร็ว สดใหม่ รสชาติเข้มข้นถึงเครื่อง" },
      { name: "author", content: "ร้านลุงเกตุ" },
      { property: "og:title", content: "ร้านลุงเกตุ | Ran Lung Get" },
      { property: "og:description", content: "ระบบสั่งอาหารออนไลน์ ร้านลุงเกตุ อาหารตามสั่ง รวดเร็ว สดใหม่ รสชาติเข้มข้นถึงเครื่อง" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "ร้านลุงเกตุ | Ran Lung Get" },
      { name: "twitter:description", content: "ระบบสั่งอาหารออนไลน์ ร้านลุงเกตุ อาหารตามสั่ง รวดเร็ว สดใหม่ รสชาติเข้มข้นถึงเครื่อง" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;500;600;700;800&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  const routerState = useRouterState();

  useEffect(() => {
    // 🚀 ทำให้ทั้งเว็บเป็น Real-Time: คอยดักจับการเปลี่ยนแปลงของทุกตารางในฐานข้อมูล
    const channel = supabase
      .channel("global-db-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public" },
        (payload: any) => {
          console.log("🔄 Database Changed:", payload);
          // ทันทีที่มีอะไรเปลี่ยน ให้ดึงข้อมูลใหม่ทั้งหมด (ทำให้ UI อัปเดตทันที)
          queryClient.invalidateQueries();

          // Force logout in real-time if the user's role or active status changed
          if (payload.table === "users" && payload.eventType === "UPDATE") {
            supabase.auth.getUser().then(({ data: { user } }: { data: { user: any } }) => {
              if (user && payload.new && payload.new.auth_user_id === user.id) {
                if (payload.new.is_active === false) {
                  alert("สิทธิ์การใช้งานของคุณถูกระงับ (Account Suspended)");
                  supabase.auth.signOut().then(() => {
                    window.location.href = "/login";
                  });
                } else if (payload.old && payload.new.role !== payload.old.role) {
                  alert("บทบาทของคุณถูกเปลี่ยนแปลง กรุณาเข้าสู่ระบบใหม่ (Role Changed)");
                  supabase.auth.signOut().then(() => {
                    window.location.href = "/login";
                  });
                }
              }
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const isNavigating = routerState.status === "pending";

  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        {/* Top Progress Bar when navigating */}
        <AnimatePresence>
          {isNavigating && (
            <motion.div
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed top-0 left-0 right-0 h-1 z-[9999] bg-[#fcc14a] origin-left"
            />
          )}
        </AnimatePresence>

        <div className="min-h-screen w-full">
          {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
          <Outlet />
        </div>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

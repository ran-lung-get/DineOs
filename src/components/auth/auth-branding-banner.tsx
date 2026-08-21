import { BRAND } from "../../constants/theme";

export function AuthBrandingBanner() {
  return (
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
          background:
            "linear-gradient(180deg, rgba(0,46,71,0.5) 0%, rgba(3,10,18,0.9) 100%)",
        }}
      />

      {/* Decorative Ambient Light Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 rounded-full bg-[#fcc14a]/15 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 rounded-full bg-[#004165]/40 blur-[140px] pointer-events-none" />

      {/* Pattern overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(252,193,74,0.12) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      {/* Top Header */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl overflow-hidden border border-white/20 bg-white/10 backdrop-blur-md p-1.5 flex items-center justify-center shadow-lg shadow-black/20">
            <img
              src="/logo.png"
              alt="Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="flex flex-col">
            <span
              className="font-bold text-lg tracking-wider"
              style={{ fontFamily: "'Prompt', sans-serif" }}
            >
              ร้านลุงเก้ต · LUNG GET
            </span>
            <span className="text-[11px] text-white/50 tracking-widest uppercase">
              Authentic Thai Kitchen
            </span>
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

        <h2
          className="text-4xl lg:text-5xl font-black leading-[1.2] tracking-tight"
          style={{ fontFamily: "'Prompt', sans-serif" }}
        >
          รสชาติต้นตำรับ <br />
          <span className="bg-gradient-to-r from-[#fcc14a] via-[#ffe3a3] to-[#fcc14a] bg-clip-text text-transparent drop-shadow-sm">
            ปรุงร้อนสดใหม่
          </span>{" "}
          ทุกจาน
        </h2>

        <p className="text-white/75 text-sm lg:text-base leading-relaxed font-light">
          สัมผัสประสบการณ์การสั่งอาหารที่สะดวกและรวดเร็วที่สุด
          ไม่ว่าจะรับประทานที่ร้าน สั่งกลับบ้าน หรือจัดส่งถึงบ้าน
          เราพร้อมเสิร์ฟรสชาติแห่งความสุขให้คุณถึงที่
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
  );
}

import { motion } from "motion/react";
import {
  ChevronLeft,
  Star,
  MapPin,
  Clock,
  Phone,
  ChevronRight,
} from "lucide-react";
import { useLanguage } from "../../lib/i18n";
import { BRAND, GOLD } from "../../constants/theme";

interface ContactOverlayProps {
  onBack: () => void;
}

export function ContactOverlay({ onBack }: ContactOverlayProps) {
  const { t } = useLanguage();
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
              className="grid h-10 w-10 place-items-center rounded-full bg-white/10 border border-white/15 cursor-pointer"
            >
              <ChevronLeft size={20} color={GOLD} />
            </button>
            <h1 className="text-lg font-bold">{t("ข้อมูลร้านค้า")}</h1>
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
                <h2 className="text-xl font-bold">{t("ร้านลุงเกตุ")}</h2>
                <p className="text-xs text-white/80 mt-1">
                  {t("อาหารตามสั่ง · Street Food")}
                </p>
              </div>

              {/* Rating badge */}
              <div
                className="bg-[#ffcb44] rounded-2xl px-3 py-2 flex flex-col items-center shadow-lg shrink-0"
                style={{ color: BRAND }}
              >
                <span className="text-base font-extrabold leading-none">4.8</span>
                <div className="flex gap-0.5 my-0.5" style={{ color: BRAND }}>
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={8} fill="currentColor" stroke="none" />
                  ))}
                </div>
                <span className="text-[9px] font-semibold leading-none opacity-85">
                  214 {t("รีวิว")}
                </span>
              </div>
            </div>
          </div>

          {/* Contact info details list */}
          <div className="mx-5 mt-5 bg-white rounded-2xl border border-slate-200/80 shadow-soft divide-y divide-slate-100">
            {/* Address */}
            <div className="p-4 flex items-start gap-3">
              <div
                className="grid h-10 w-10 place-items-center rounded-xl shrink-0"
                style={{ background: "rgba(0,46,71,0.06)", color: BRAND }}
              >
                <MapPin size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-400">{t("ที่อยู่")}</p>
                <p className="text-sm font-medium text-slate-700 mt-0.5 leading-relaxed">
                  {t("88/12 ซอยสุขุมวิท 31 แขวงคลองเตยเหนือ เขตวัฒนา กรุงเทพฯ 10110")}
                </p>
              </div>
              <a
                href="https://maps.app.goo.gl/yS3EHz9n2H4Hkpxu7"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-full border text-xs font-bold shrink-0 flex items-center gap-1 transition hover:bg-slate-50 mt-1"
                style={{ borderColor: BRAND, color: BRAND }}
              >
                <MapPin size={12} /> {t("นำทาง")}
              </a>
            </div>

            {/* Opening Hours */}
            <div className="p-4 flex items-start gap-3">
              <div
                className="grid h-10 w-10 place-items-center rounded-xl shrink-0"
                style={{ background: "rgba(0,46,71,0.06)", color: BRAND }}
              >
                <Clock size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-400">
                  {t("เวลาทำการ")}
                </p>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-slate-700 font-medium">
                    {t("อาทิตย์ - ศุกร์")}
                  </span>
                  <span className="text-slate-800 font-semibold">08:00 - 21:00</span>
                </div>
                <div className="flex justify-between text-sm mt-0.5">
                  <span className="text-red-500 font-medium">{t("วันเสาร์")}</span>
                  <span className="text-red-500 font-semibold">{t("ปิดทำการ")}</span>
                </div>
              </div>
            </div>

            {/* Phone */}
            <a
              href="tel:02-123-4567"
              className="p-4 flex items-center gap-3 transition hover:bg-slate-50"
            >
              <div
                className="grid h-10 w-10 place-items-center rounded-xl shrink-0"
                style={{ background: "rgba(0,46,71,0.06)", color: BRAND }}
              >
                <Phone size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-400">
                  {t("เบอร์โทรศัพท์")}
                </p>
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
              <h3 className="font-bold text-base" style={{ color: BRAND }}>
                {t("รีวิวจากลูกค้า")}
              </h3>
              <button
                className="text-xs font-semibold hover:underline cursor-pointer"
                style={{ color: BRAND }}
              >
                {t("ความคิดเห็นทั้งหมด")}
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
                <span className="text-xs text-white/70">214 {t("รีวิว")}</span>
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
                    <span className="text-[10px] text-white/80 font-medium w-2 leading-none">
                      {item.star}
                    </span>
                    <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#ffcb44]"
                        style={{ width: `${item.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Review List */}
            <div className="mt-4 space-y-3">
              {reviews.map((r) => (
                <div
                  key={r.id}
                  className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-soft"
                >
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-full text-white font-bold text-sm bg-[#002e47]">
                      {r.initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-slate-800 truncate">
                          {r.name}
                        </h4>
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

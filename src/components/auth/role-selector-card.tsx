import { User, ChefHat, Headset } from "lucide-react";
import { BRAND, BRAND_MID, GOLD, INK_MUTED } from "../../constants/theme";
import type { UserRole } from "../../types";

interface RoleSelectorCardProps {
  role: UserRole;
  onChange: (role: UserRole) => void;
  hoveredRole: UserRole | null;
  onHover: (role: UserRole | null) => void;
}

export function RoleSelectorCard({
  role,
  onChange,
  hoveredRole,
  onHover,
}: RoleSelectorCardProps) {
  const roles = [
    { value: "customer" as UserRole, label: "ลูกค้า", desc: "สั่งอาหาร", Icon: User },
    { value: "staff" as UserRole, label: "พนักงาน", desc: "จัดการออเดอร์", Icon: ChefHat },
    { value: "admin" as UserRole, label: "แอดมิน", desc: "จัดการระบบ", Icon: Headset },
  ];

  return (
    <div className="grid grid-cols-3 gap-2">
      {roles.map((r) => {
        const isSelected = role === r.value;
        const isHovered = hoveredRole === r.value;

        return (
          <button
            key={r.value}
            type="button"
            id={`role-${r.value}-btn`}
            onClick={() => onChange(r.value)}
            onMouseEnter={() => onHover(r.value)}
            onMouseLeave={() => onHover(null)}
            className="flex flex-col items-center gap-1.5 rounded-2xl py-4 px-3 text-sm font-semibold transition-all hover:scale-[1.03] active:scale-[0.98] cursor-pointer"
            style={{
              border: isSelected
                ? `2px solid ${BRAND}`
                : isHovered
                ? `2px solid rgba(0,46,71,0.25)`
                : "2px solid rgba(0,46,71,0.08)",
              background: isSelected
                ? `linear-gradient(135deg, ${BRAND} 0%, ${BRAND_MID} 100%)`
                : isHovered
                ? `rgba(0,46,71,0.03)`
                : "#ffffff",
              color: isSelected ? "#ffffff" : isHovered ? BRAND : INK_MUTED,
              boxShadow: isSelected
                ? "0 8px 20px rgba(0,46,71,0.22)"
                : "0 2px 8px rgba(0,0,0,0.02)",
            }}
          >
            <div className="flex items-center gap-1.5 text-base">
              <r.Icon
                size={18}
                className="shrink-0"
                style={{
                  color: isSelected ? GOLD : isHovered ? BRAND : INK_MUTED,
                }}
              />
              <span>{r.label}</span>
            </div>
            <span
              className="text-[10px] font-normal"
              style={{
                color: isSelected ? "rgba(255,255,255,0.75)" : "inherit",
                opacity: isSelected ? 1 : 0.7,
              }}
            >
              {r.desc}
            </span>
          </button>
        );
      })}
    </div>
  );
}

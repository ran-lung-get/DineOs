import { Volume2, VolumeX } from "lucide-react";
import { cn } from "../../lib/utils";

interface SoundToggleProps {
  enabled: boolean;
  onToggle: () => void;
  className?: string;
}

export function SoundToggle({ enabled, onToggle, className }: SoundToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer",
        enabled
          ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
          : "bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200",
        className
      )}
      title={enabled ? "ปิดเสียงแจ้งเตือน" : "เปิดเสียงแจ้งเตือน"}
    >
      {enabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
      <span>{enabled ? "เปิดเสียง" : "ปิดเสียง"}</span>
    </button>
  );
}

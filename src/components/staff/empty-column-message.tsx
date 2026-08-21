import { ChefHat } from "lucide-react";

export function EmptyColumnMessage({ text }: { text: string }) {
  return (
    <div className="py-12 text-center text-slate-400 font-bold border-2 border-dashed border-[#ece4d6] bg-white/60 rounded-2xl">
      <ChefHat size={32} className="opacity-30 mx-auto mb-2 text-[#002e47]" />
      <span className="text-xs text-slate-500">{text}</span>
    </div>
  );
}

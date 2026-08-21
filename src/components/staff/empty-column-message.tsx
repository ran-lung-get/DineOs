import { ChefHat } from "lucide-react";

export function EmptyColumnMessage({ text }: { text: string }) {
  return (
    <div className="py-12 text-center text-slate-400 font-bold border-2 border-dashed border-slate-100 rounded-2xl">
      <ChefHat size={32} className="opacity-20 mx-auto mb-2 text-slate-500" />
      <span className="text-xs">{text}</span>
    </div>
  );
}

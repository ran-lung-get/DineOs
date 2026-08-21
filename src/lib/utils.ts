import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * ฟอร์แมตตัวเลขเป็นราคาเงินบาท เช่น 60 -> ฿60
 */
export function formatTHB(amount: number): string {
  return `฿${amount.toLocaleString("th-TH")}`;
}

/**
 * สกัด timestamp จาก Order ID หรือคืนค่าปัจจุบัน
 */
export function getTimestampFromOrderId(id: string): number {
  if (id.startsWith("hist_")) {
    const tsString = id.replace("hist_", "");
    const ts = parseInt(tsString, 10);
    if (!isNaN(ts) && ts > 1000000000000) return ts;
  }
  return Date.now();
}

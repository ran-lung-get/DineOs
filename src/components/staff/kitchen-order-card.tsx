import { useState } from "react";
import { Phone, MapPin, Check, Copy, RotateCcw, Trash2 } from "lucide-react";
import type { OrderHistory } from "../../types";

interface KitchenOrderCardProps {
  order: OrderHistory;
  advanceOrderStatus: (id: string) => void;
  regressOrderStatus: (id: string) => void;
  cancelOrder: (id: string) => void;
}

export function KitchenOrderCard({
  order,
  advanceOrderStatus,
  regressOrderStatus,
  cancelOrder,
}: KitchenOrderCardProps) {
  const [copied, setCopied] = useState(false);
  const isDineIn = order.orderType === "dine-in";
  const isTakeaway = order.orderType === "takeaway";
  const isDelivery = order.orderType === "delivery";

  let typeBadge = "ทานที่ร้าน";
  let typeColor = "bg-emerald-50 text-emerald-800 border-emerald-200";
  let borderLeftColor = "border-l-[#fcc14a]";

  if (isTakeaway) {
    typeBadge = `กลับบ้าน ${order.queueNumber ? `(${order.queueNumber})` : ""}`;
    typeColor = "bg-blue-50 text-blue-800 border-blue-200";
    borderLeftColor = "border-l-[#5a6e7a]";
  } else if (isDelivery) {
    typeBadge = "🛵 เดลิเวอรี่";
    typeColor = "bg-amber-50 text-amber-900 border-amber-300 font-black";
    borderLeftColor = "border-l-[#f59e0b]";
  }

  let nextBtnText = "เริ่มทำครัว";
  let nextBtnColor = "bg-[#002e47] text-white hover:bg-[#003957]";

  if (order.status === "กำลังทำ") {
    if (isDelivery) {
      nextBtnText = "ปรุงเสร็จ / รอไรเดอร์";
      nextBtnColor = "bg-amber-600 text-white hover:bg-amber-700";
    } else if (isTakeaway) {
      nextBtnText = "ปรุงเสร็จ / เรียกลูกค้า";
      nextBtnColor = "bg-blue-600 text-white hover:bg-blue-700";
    } else {
      nextBtnText = "ปรุงเสร็จ / พร้อมเสิร์ฟ";
      nextBtnColor = "bg-blue-600 text-white hover:bg-blue-700";
    }
  } else if (order.status === "พร้อมเสิร์ฟ") {
    if (isDelivery) {
      nextBtnText = "ไรเดอร์รับ / ส่งแล้ว";
      nextBtnColor = "bg-emerald-600 text-white hover:bg-emerald-700";
    } else if (isTakeaway) {
      nextBtnText = "ส่งมอบให้ลูกค้าแล้ว";
      nextBtnColor = "bg-emerald-600 text-white hover:bg-emerald-700";
    } else {
      nextBtnText = "เสิร์ฟถึงโต๊ะแล้ว";
      nextBtnColor = "bg-emerald-600 text-white hover:bg-emerald-700";
    }
  }

  const handleCopyAddress = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`bg-white border-2 border-l-[6px] border-[#ece4d6] ${borderLeftColor} rounded-2xl p-4 shadow-sm hover:shadow transition relative space-y-3`}
    >
      <div className="flex items-center justify-between">
        <div>
          <span className="font-black text-[#002e47] text-sm">{order.orderNumber}</span>
          <span className="text-[10px] text-slate-400 ml-1.5 font-bold">
            {order.date.includes(" · ") ? order.date.split(" · ")[1] : order.date}
          </span>
        </div>
        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${typeColor}`}>
          {typeBadge}
        </span>
      </div>

      {/* Customer Info & Contact */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
        <div>
          <p className="text-[10px] font-bold text-slate-400">ลูกค้า:</p>
          <p className="text-xs font-black text-[#002e47] mt-0.5">
            {order.customerName || "คุณลูกค้า"}{" "}
            {isDineIn && order.tableNumber && `(โต๊ะ ${order.tableNumber})`}
          </p>
        </div>
        {order.customerPhone && (
          <a
            href={`tel:${order.customerPhone}`}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-xl text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition shrink-0"
          >
            <Phone size={10} />
            <span>{order.customerPhone}</span>
          </a>
        )}
      </div>

      {/* Delivery Address Box */}
      {isDelivery && order.deliveryAddress && (
        <div className="p-2.5 bg-amber-50/70 border border-amber-200/80 rounded-xl space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-amber-900 flex items-center gap-1">
              <MapPin size={11} className="text-amber-600 shrink-0" />
              <span>ที่อยู่จัดส่ง:</span>
            </span>
            <button
              onClick={() => handleCopyAddress(order.deliveryAddress!)}
              className="text-[9px] font-bold text-amber-800 hover:text-amber-950 flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-100/80 hover:bg-amber-200 transition cursor-pointer"
            >
              {copied ? <Check size={10} className="text-emerald-600" /> : <Copy size={10} />}
              <span>{copied ? "คัดลอกแล้ว" : "คัดลอก"}</span>
            </button>
          </div>
          <p className="text-[11px] font-bold text-[#002e47] leading-tight break-words">
            {order.deliveryAddress}
          </p>
        </div>
      )}

      {/* Item list */}
      <div className="space-y-1.5">
        {order.items.map((i, idx) => (
          <div key={idx} className="flex justify-between items-center text-xs">
            <span className="font-semibold text-slate-700">{i.name}</span>
            <span className="font-black bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded">
              x{i.qty}
            </span>
          </div>
        ))}
      </div>

      {order.note && (
        <div className="p-2 bg-red-50/50 border border-red-100 rounded-xl text-[10px] font-black text-red-700">
          💡 หมายเหตุ: {order.note}
        </div>
      )}

      {/* Total Amount */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
        <span className="text-[10px] font-bold text-slate-400">ยอดรวม:</span>
        <span className="font-black text-[#002e47]">
          ฿{order.total}{" "}
          {isDelivery && order.delivery > 0 && (
            <span className="text-[10px] text-slate-400 font-normal">
              (ค่าส่ง ฿{order.delivery})
            </span>
          )}
        </span>
      </div>

      {/* Actions */}
      <div className="pt-2 flex items-center justify-between gap-1.5">
        <button
          onClick={() => regressOrderStatus(order.id)}
          disabled={order.status === "รอดำเนินการ"}
          className="p-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl text-slate-600 transition disabled:opacity-50 cursor-pointer"
          title="ย้อนสถานะ"
        >
          <RotateCcw size={13} />
        </button>
        <button
          onClick={() => advanceOrderStatus(order.id)}
          className={`flex-1 py-1.5 rounded-xl text-[11px] font-black tracking-wide shadow-sm transition flex items-center justify-center gap-1 cursor-pointer ${nextBtnColor}`}
        >
          <Check size={11} />
          <span>{nextBtnText}</span>
        </button>
        <button
          onClick={() => cancelOrder(order.id)}
          className="p-1.5 bg-red-50 hover:bg-red-100 border border-red-100 rounded-xl text-red-600 transition cursor-pointer"
          title="ยกเลิกออเดอร์"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}

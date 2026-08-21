export type OrderType = "dine-in" | "takeaway" | "delivery";

export type OrderStatus =
  | "สำเร็จ"
  | "กำลังจัดส่ง"
  | "กำลังเตรียม"
  | "รอรับออเดอร์"
  | "ขอคืนเงิน"
  | "ยกเลิกแล้ว"
  | "รอดำเนินการ"
  | "pending"
  | "preparing"
  | "ready"
  | "completed"
  | "cancelled";

export type OrderHistoryItem = {
  name: string;
  qty: number;
  price: number;
  image: string;
  addons?: { id: string; name: string; price: number }[];
  options?: Record<string, string>;
  note?: string;
};

export type OrderHistory = {
  id: string;
  orderNumber: string;
  date: string;
  items: OrderHistoryItem[];
  subtotal: number;
  delivery: number;
  total: number;
  status: OrderStatus | string;
  orderType?: OrderType;
  customerName?: string;
  customerPhone?: string;
  deliveryAddress?: string;
  tableNumber?: string;
  queueNumber?: string;
  note?: string;
  cancelReason?: string;
  cancelNote?: string;
  refundPromptPay?: string;
  created_at?: string;
  payment_method?: string;
  payment_status?: string;
  is_paid?: boolean;
};

export type CartLine = {
  id: string; // unique line id
  itemId: string;
  name: string;
  price: number; // unit price w/ addons
  qty: number;
  addons: { id: string; name: string; price: number }[];
  options: Record<string, string>;
  note: string;
  image: string;
};

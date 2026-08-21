import { Badge } from "../ui/badge";
import { Clock, ChefHat, Bike, CheckCircle, RotateCcw, XCircle } from "lucide-react";

interface OrderStatusBadgeProps {
  status: string;
  className?: string;
}

export function OrderStatusBadge({ status, className }: OrderStatusBadgeProps) {
  switch (status) {
    case "รอรับออเดอร์":
    case "pending":
      return (
        <Badge variant="warning" className={className}>
          <Clock size={12} className="animate-pulse" />
          <span>รอรับออเดอร์</span>
        </Badge>
      );
    case "กำลังเตรียม":
    case "preparing":
      return (
        <Badge variant="info" className={className}>
          <ChefHat size={12} className="animate-bounce" />
          <span>กำลังเตรียมอาหาร</span>
        </Badge>
      );
    case "กำลังจัดส่ง":
    case "ready":
      return (
        <Badge variant="secondary" className={className}>
          <Bike size={12} />
          <span>กำลังจัดส่ง / พร้อมเสิร์ฟ</span>
        </Badge>
      );
    case "สำเร็จ":
    case "completed":
      return (
        <Badge variant="success" className={className}>
          <CheckCircle size={12} />
          <span>สำเร็จ</span>
        </Badge>
      );
    case "ขอคืนเงิน":
      return (
        <Badge variant="danger" className={className}>
          <RotateCcw size={12} />
          <span>ขอคืนเงิน</span>
        </Badge>
      );
    case "ยกเลิกแล้ว":
    case "cancelled":
      return (
        <Badge variant="danger" className={className}>
          <XCircle size={12} />
          <span>ยกเลิกแล้ว</span>
        </Badge>
      );
    default:
      return (
        <Badge variant="default" className={className}>
          <span>{status}</span>
        </Badge>
      );
  }
}

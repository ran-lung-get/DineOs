# 📋 แผนการจัดระเบียบโค้ดและลดความซับซ้อน (Refactoring Architecture Guide)
**โปรเจกต์:** ร้านลุงเก้ต (Ran Lung Get - TanStack Start / React 19 / Supabase / Tailwind CSS)  
**เป้าหมาย:** จัดระเบียบโค้ดให้อ่านง่าย ลดความยาวของไฟล์หลัก (จาก 5,000+ บรรทัด เหลือ < 200 บรรทัดต่อไฟล์) **โดยไม่ลบฟังก์ชันการทำงานใดๆ (Preserve 100% Functionality & Logic)**

---

## 📑 สารบัญ
1. [วิเคราะห์ปัญหาปัจจุบันของ Codebase (Current State Analysis)](#1-วิเคราะห์ปัญหาปัจจุบันของ-codebase)
2. [หลักการและเทคนิคการลดโค้ดโดยไม่ลบฟังก์ชัน (Core Refactoring Principles)](#2-หลักการและเทคนิคการลดโค้ดโดยไม่ลบฟังก์ชัน)
3. [โครงสร้างไดเรกทอรีเป้าหมาย (Target Directory Structure)](#3-โครงสร้างไดเรกทอรีเป้าหมาย)
4. [ตารางจัดสรรย้ายโค้ด (Feature & Logic Migration Matrix)](#4-ตารางจัดสรรย้ายโค้ด)
5. [ตัวอย่างเปรียบเทียบ ก่อน-หลัง (Before vs. After Code Examples)](#5-ตัวอย่างเปรียบเทียบ-ก่อน-หลัง)
   - 5.1 การรวม Types และ Constants กลาง
   - 5.2 การแยก WebAvatar & Sound Effect ออกเป็น Custom Hooks
   - 5.3 การแยก Business Logic ด้วย Custom Hook (`useCart`, `useCustomerOrders`)
   - 5.4 โครงสร้างหน้า Route ใหม่ที่สั้นและคลีน (`customer/index.tsx`)
6. [ขั้นตอนการ Refactor แบบเป็นลำดับขั้น (Step-by-Step Implementation Roadmap)](#6-ขั้นตอนการ-refactor-แบบเป็นลำดับขั้น)
7. [Checklist การตรวจสอบความถูกต้อง (Safety & Verification Checklist)](#7-checklist-การตรวจสอบความถูกต้อง)

---

## 1. วิเคราะห์ปัญหาปัจจุบันของ Codebase

จากการตรวจสอบโครงสร้างโปรเจกต์ ปัญหาหลักที่ทำให้โค้ดยาวและดูแลรักษายากเกิดจาก **Monolithic Component Pattern (การยัดโค้ดทุกอย่างไว้ในไฟล์เดียว)**:

| ไฟล์ปัจจุบัน | จำนวนบรรทัดปัจจุบัน | ปัญหาที่พบ |
|---|---|---|
| `src/routes/customer/index.tsx` | **5,290 บรรทัด** | รวมทั้ง WebAvatar script injection, Web Audio synthesis, ข้อมูลเมนู Hardcode, จัดการ Cart, ฟอร์มส่งที่อยู่/GPS, Payment Stripe/PromptPay, การติดตามออเดอร์, ประวัติ, รีวิว, ขอคืนเงิน ไว้ในคอมโพเนนต์เดียว |
| `src/routes/staff/index.tsx` | **2,664 บรรทัด** | รวมเสียงแจ้งเตือน, Kanban Board, ตั๋วออเดอร์ครัว, พิมพ์ใบเสร็จ, จัดการแก้ไขเมนู/ตัวเลือก/แอดออน, Supabase Realtime ไว้ในไฟล์เดียว |
| `src/routes/admin/index.tsx` | **1,948 บรรทัด** | รวมกราฟ Recharts, สต็อกวัตถุดิบ, จัดการพนักงาน/อนุมัติสิทธิ์, จัดการเมนู และการดึงข้อมูลจาก Supabase |
| `src/routes/login.tsx` | **1,099 บรรทัด** | รวม SVG Icons แบบ Inline, ฟอร์ม Login/Register/Google Auth, จัดการ State ซ้ำซ้อน |

### ปัญหาที่ตามมา (Impact):
1. **โค้ดซ้ำซ้อน (Code Duplication):** Types (`MenuItem`, `OrderHistory`, `OrderType`) และค่าสีธีม (`BRAND`, `GOLD`, `INK_MUTED`) ถูกประกาศซ้ำในทุกไฟล์
2. **State Explosion:** มี `useState` มากกว่า 30-40 ตัวในหน้าเดียว ทำให้เกิด Re-render ที่ไม่จำเป็น และยากต่อการหา Bug
3. **ขาด Reusable UI Components:** กล่อง Modal, Drawer, Badge, Button, Input ถูกเขียนสไตล์ Tailwind ซ้ำไปซ้ำมา
4. **Logic ปะปนกับ UI:** งานด้าน DOM (WebAvatar script), Web Audio API, Supabase Query ถูกแทรกอยู่ร่วมกับ JSX

---

## 2. หลักการและเทคนิคการลดโค้ดโดยไม่ลบฟังก์ชัน

การลดโค้ดให้สั้นลง **ไม่ใช่การลบ Logic ทิ้ง** แต่เป็นการ **"แยกส่วน (Decomposition)"** และ **"นำกลับมาใช้ซ้ำ (DRY - Don't Repeat Yourself)"** ผ่าน 5 เสาหลัก:

```
┌────────────────────────────────────────────────────────────────────────┐
│                   5 กลยุทธ์ลดโค้ดโดยไม่ลบฟังก์ชัน                      │
├───────────────────┬────────────────────────────────────────────────────┤
│ 1. Centralize     │ ย้าย Types, Constants, Mock Data ไปไว้ไฟล์กลาง     │
│ 2. Custom Hooks   │ ย้าย state, useEffect, Supabase logic ออกจาก JSX   │
│ 3. Atomic UI      │ แยก UI ซ้ำๆ เช่น Modal, Drawer, Badge, Button      │
│ 4. Sub-components │ หั่น Modal และ Section แต่ละอันออกเป็นไฟล์เดี่ยว   │
│ 5. Utility Layer  │ รวบรวมฟังก์ชันคำนวณเงิน, จัดฟอร์แมตวัน, เสียงเตือน │
└───────────────────┴────────────────────────────────────────────────────┘
```

---

## 3. โครงสร้างไดเรกทอรีเป้าหมาย

ออกแบบโครงสร้างโฟลเดอร์ให้เป็นสัดส่วนตาม Feature และ Responsibility:

```text
src/
├── types/                      # 📌 รวม TypeScript Types ทั้งหมดของระบบ (ไม่ซ้ำซ้อน)
│   ├── index.ts                # Export รวม
│   ├── order.types.ts          # OrderHistory, OrderType, CartLine, OrderStatus
│   ├── menu.types.ts           # MenuItem, Addon, OptionGroup, Protein, Topping, Size
│   ├── user.types.ts           # UserProfile, Role, StaffUser, CustomerProfile
│   └── inventory.types.ts      # Ingredient, StockAdjustment
│
├── constants/                  # 📌 รวมค่าคงที่ ข้อมูลเริ่มต้น และ ธีม
│   ├── theme.ts                # BRAND, BRAND_MID, GOLD, LINEN, INK, INK_MUTED, SURFACE
│   ├── menu.data.ts            # MENU, PROTEINS, TOPPINGS, SIZES, CATEGORIES
│   └── avatar-animations.ts    # รายชื่อ Animation และ Config ของ WebAvatar
│
├── lib/                        # 📌 Core libraries & Service Layer
│   ├── supabase.ts             # Supabase Client
│   ├── supabase.service.ts     # Supabase CRUD & Realtime Query functions
│   ├── sound.ts                # Web Audio API Sound Synthesizer (Singleton)
│   ├── liff.ts                 # LINE LIFF Helper
│   ├── i18n.tsx                # Multi-language translation
│   ├── utils.ts                # cn(), formatPrice(), formatDate(), getTimestamp()
│   └── api/                    # Stripe & Server Functions
│
├── hooks/                      # 📌 Custom React Hooks แยก Business Logic & State
│   ├── use-cart.ts             # จัดการตะกร้าสินค้า (เพิ่ม, ลด, คำนวณยอดเงิน, โน้ต)
│   ├── use-web-avatar.ts       # จัดการโหลด Script, Event Listener, Animation WebAvatar
│   ├── use-sound-effects.ts    # Hook สำหรับเรียกเสียงเตือน (Beep, Chime, Success, Bell)
│   ├── use-customer-orders.ts  # จัดการดึงประวัติออเดอร์ลูกค้า & Realtime status
│   ├── use-kitchen-orders.ts   # จัดการกระดานครัว การเปลี่ยนสถานะอาหาร & Realtime
│   └── use-admin-dashboard.ts  # จัดการข้อมูลหลังบ้าน รายงานยอดขาย และสต็อก
│
├── components/                 # 📌 ส่วนประกอบ UI แยกตามระดับและหน้าการใช้งาน
│   ├── ui/                     # Atomic UI Reusable (สร้างด้วย Radix/Tailwind)
│   │   ├── modal.tsx           # Reusable Modal Container พร้อม AnimatePresence
│   │   ├── drawer.tsx          # Reusable Bottom Sheet / Side Drawer
│   │   ├── badge.tsx           # Reusable Status Badge
│   │   ├── button.tsx          # Reusable Styled Buttons
│   │   ├── input.tsx           # Reusable Input & Form Field
│   │   └── loading-spinner.tsx # Component แสดงสถานะโหลด
│   │
│   ├── common/                 # Component ที่ใช้ร่วมกันหลายหน้า
│   │   ├── web-avatar.tsx      # Widget แสดงผล Avatar
│   │   ├── sound-toggle.tsx    # ปุ่มเปิด/ปิดเสียง
│   │   ├── receipt-modal.tsx   # ป็อปอัปแสดงใบเสร็จรับเงิน
│   │   └── language-selector.tsx # ปุ่มเลือกภาษา TH/EN/CN/JP/RU
│   │
│   ├── customer/               # 🛍️ Component เฉพาะหน้าลูกค้า
│   │   ├── customer-header.tsx         # แถบหัวด้านบน พร้อมโลโก้, ค้นหา, ปุ่มภาษา
│   │   ├── category-tabs.tsx           # แถบเลือกหมวดหมู่อาหาร
│   │   ├── menu-grid.tsx               # ตารางแสดงรายการอาหาร
│   │   ├── menu-item-card.tsx          # การ์ดอาหารแต่ละรายการ
│   │   ├── menu-detail-modal.tsx       # ป็อปอัปปรับแต่งอาหาร (เผ็ด, แอดออน, ตัวเลือก)
│   │   ├── cart-drawer.tsx             # ตะกร้าสินค้าด้านข้าง/ล่าง
│   │   ├── checkout-modal.tsx          # ฟอร์มสั่งซื้อ (เลือกประเภท ทานที่ร้าน/กลับบ้าน/เดลิเวอรี)
│   │   ├── payment-stripe-modal.tsx    # หน้าชำระเงินบัตรเครดิตผ่าน Stripe
│   │   ├── payment-promptpay-modal.tsx # หน้าโอนพร้อมเพย์ & อัปโหลดสลิป
│   │   ├── order-tracking-sheet.tsx    # แถบติดตามสถานะออเดอร์ Realtime
│   │   ├── order-history-drawer.tsx    # หน้ารายการประวัติคำสั่งซื้อ
│   │   ├── review-modal.tsx            # ป็อปอัปให้คะแนนและรีวิว
│   │   └── refund-modal.tsx            # ป็อปอัปแจ้งขอเงินคืน
│   │
│   ├── staff/                  # 🍳 Component เฉพาะหน้าครัว/พนักงาน
│   │   ├── kitchen-header.tsx          # หัวหน้าจอครัว, สถิติออเดอร์, ตัวกรอง
│   │   ├── kitchen-column.tsx          # คอลัมน์สถานะ (รอทำ / กำลังทำ / เสร็จแล้ว)
│   │   ├── kitchen-order-card.tsx      # ตั๋วคำสั่งซื้อสำหรับพ่อครัว
│   │   ├── menu-manager-modal.tsx      # ป็อปอัปจัดการเปิด/ปิดเมนู และแก้ไขราคา
│   │   └── menu-edit-modal.tsx         # ป็อปอัปเพิ่ม/แก้ไขรายละเอียดเมนู
│   │
│   ├── admin/                  # 📊 Component เฉพาะหน้าแอดมิน
│   │   ├── admin-sidebar.tsx           # แถบเมนูด้านข้าง
│   │   ├── admin-metrics-grid.tsx      # การ์ดสรุปยอดขาย, ออเดอร์, รายได้
│   │   ├── admin-revenue-chart.tsx     # กราฟแสดงสถิติยอดขาย (Recharts)
│   │   ├── ingredient-inventory.tsx    # ตารางสต็อกวัตถุดิบ & ฟอร์มเติมของ
│   │   ├── staff-approval-table.tsx    # ตารางอนุมัติสิทธิ์ผู้ใช้งาน/พนักงาน
│   │   └── admin-menu-editor.tsx       # ส่วนจัดการเมนูอาหารระดับแอดมิน
│   │
│   └── auth/                   # 🔐 Component เฉพาะหน้า Login/Register
│       ├── auth-branding-banner.tsx    # ฝั่งซ้ายแบนเนอร์รูปภาพ & Brand Info
│       ├── login-form.tsx              # ฟอร์มเข้าสู่ระบบ
│       ├── register-form.tsx           # ฟอร์มลงทะเบียนพร้อมเลือกบทบาท
│       └── role-selector-card.tsx      # กล่องเลือกบทบาท ลูกค้า/พนักงาน/แอดมิน
│
└── routes/                     # 🚀 Route Containers (แต่ละไฟล์จะเหลือเพียง 80 - 150 บรรทัด!)
    ├── customer/index.tsx      # เรียกใช้ useCart + Customer Components
    ├── staff/index.tsx         # เรียกใช้ useKitchenOrders + Staff Components
    ├── admin/index.tsx         # เรียกใช้ useAdminDashboard + Admin Components
    └── login.tsx               # เรียกใช้ LoginForm + RegisterForm
```

---

## 4. ตารางจัดสรรย้ายโค้ด (Feature & Logic Migration Matrix)

ตารางนี้เป็นหลักประกันว่า **ทุกบล็อกโค้ดในไฟล์เดิมจะมีที่อยู่ใหม่อย่างชัดเจน ไม่ตกหล่น และไม่ถูกลบ**:

| โค้ดเดิมในไฟล์ต้นทาง | ตำแหน่งไฟล์ใหม่ที่ต้องย้ายไป | วัตถุประสงค์ |
|---|---|---|
| **Types ซ้ำซ้อน:** `MenuItem`, `OrderHistory`, `CartLine`, `Addon` | `src/types/order.types.ts`<br/>`src/types/menu.types.ts` | รวมจุดเดียว ใช้ Typescript import ป้องกันข้อผิดพลาด |
| **Theme Colors:** `BRAND`, `GOLD`, `INK_MUTED`, `LINEN`, `SURFACE` | `src/constants/theme.ts` | แก้ไขสีที่เดียว มีผลทั้งแอป |
| **Mock / Default Menu Data:** `MENU`, `PROTEINS`, `TOPPINGS`, `SIZES` | `src/constants/menu.data.ts` | ลดความยาวหน้า customer ลงทันที ~300 บรรทัด |
| **WebAvatar Script & Idle Animation Logic** (บรรทัด 374-500 ใน customer) | `src/hooks/use-web-avatar.ts`<br/>`src/components/common/web-avatar.tsx` | แยก DOM Script Loader และ Animation Timer ออกเป็น Custom Hook |
| **Web Audio Beep/Bell Synthesis** (มีใน customer, staff, admin) | `src/lib/sound.ts`<br/>`src/hooks/use-sound-effects.ts` | รวมเป็น Audio Engine เดียว เรียกใช้ `playSound('newOrder')` ได้ทุกหน้า |
| **Cart State Management** (addToCart, updateQty, total, discount) | `src/hooks/use-cart.ts` | จัดการ State ตะกร้าให้แยกอิสระ พร้อมบันทึก LocalStorage อัตโนมัติ |
| **Customer Modal Dialogs** (Stripe, PromptPay, Review, Tracking) | `src/components/customer/*.tsx` | หั่น Modal ขนาดใหญ่แยกเป็นไฟล์เดี่ยว ไฟล์ละ 100-250 บรรทัด |
| **Kitchen Realtime Channel & Ticket Actions** | `src/hooks/use-kitchen-orders.ts` | ย้าย Supabase Subscription และ Action เปลี่ยนสถานะไปไว้ใน Hook |
| **Kitchen Tickets & Printing Logic** | `src/components/staff/kitchen-order-card.tsx` | แยกการเรนเดอร์การ์ดออเดอร์ออกจากหน้าจอหลัก |
| **Admin Charts & Inventory CRUD** | `src/components/admin/admin-revenue-chart.tsx`<br/>`src/components/admin/ingredient-inventory.tsx` | แยก Recharts และตารางสต็อกออกเป็นคอมโพเนนต์เฉพาะ |
| **Inline SVGs ใน Login Page** (UserIcon, MailIcon, LockIcon) | ใช้ไอคอนจาก `lucide-react` แทน หรือย้ายไป `src/components/ui/icons.tsx` | ลดโค้ดดิบในหน้า Login ลงได้มากกว่า 200 บรรทัด |

---

## 5. ตัวอย่างเปรียบเทียบ ก่อน-หลัง (Before vs. After Code Examples)

### 5.1 การรวม Types และ Constants กลาง

#### ❌ ก่อน Refactor (ประกาศซ้ำในทุกไฟล์):
```typescript
// เขียนซ้ำใน customer/index.tsx, staff/index.tsx, admin/index.tsx
type OrderType = "dine-in" | "takeaway" | "delivery";
type OrderHistory = {
  id: string;
  orderNumber: string;
  items: { name: string; qty: number; price: number; image: string }[];
  total: number;
  status: string;
};
const BRAND = "#002e47";
const GOLD = "#fcc14a";
```

#### ✅ หลัง Refactor:
```typescript
// ใน src/types/order.types.ts
export type OrderType = "dine-in" | "takeaway" | "delivery";

export type OrderItem = {
  name: string;
  qty: number;
  price: number;
  image: string;
};

export type OrderHistory = {
  id: string;
  orderNumber: string;
  date: string;
  items: OrderItem[];
  subtotal: number;
  delivery: number;
  total: number;
  status: "สำเร็จ" | "กำลังจัดส่ง" | "กำลังเตรียม" | "รอรับออเดอร์" | "ขอคืนเงิน" | "ยกเลิกแล้ว" | "รอดำเนินการ";
  orderType?: OrderType;
  tableNumber?: string;
  queueNumber?: string;
  note?: string;
};

// ใน src/constants/theme.ts
export const THEME_COLORS = {
  brand: "#002e47",
  brandMid: "#004165",
  gold: "#fcc14a",
  linen: "#fff8f2",
  ink: "#0f1f2b",
  inkMuted: "#5a6e7a",
  surface: "#f8fafc",
} as const;
```

---

### 5.2 การแยก WebAvatar & Sound Effect ออกเป็น Custom Hooks

#### ❌ ก่อน Refactor:
โค้ด script tag injection, window event listener, และ Web Audio Context ถูกเขียนปนอยู่ใน `useEffect` ขนาดยาว 200+ บรรทัด ในหน้า `customer/index.tsx`

#### ✅ หลัง Refactor:
สร้าง Hook `src/hooks/use-web-avatar.ts` เพื่อจัดการ Logic นี้อย่างเป็นระบบ:

```typescript
// src/hooks/use-web-avatar.ts
import { useEffect, useState } from "react";
import { AVATAR_ANIMATIONS } from "../constants/avatar-animations";

export function useWebAvatar() {
  const [isVisible, setIsVisible] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    document.body.classList.add("avatar-hidden");

    (window as any).ChatWidgetConfig = {
      mode: "realtime-widget",
      avatarUrl: "Botnoi",
      widgetId: "ran-lung-get",
      greetingInstruction: "",
      enableBubble: "false",
      cameraOffset: "0,0,0.5",
      animationUrl: "Greeting",
      defaultAnimationUrl: "Idleloop, idle_breatheloop, Idle_Swayloop",
      randomGeneric: "false",
    };

    if (!document.getElementById("webavatar-jssdk")) {
      const script = document.createElement("script");
      script.id = "webavatar-jssdk";
      script.src = "https://webavatar.didthat.cc/chat-widget.js";
      script.async = true;
      document.head.appendChild(script);
    }

    const handleWidgetClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const root = document.getElementById("root");
      if (root && root.contains(target)) return;

      // ตรวจจับปุ่ม Widget เพื่อเปิด/ปิด Avatar ตาม logic เดิมครบถ้วน
      let el: HTMLElement | null = target;
      while (el && el !== document.body) {
        const cls = typeof el.className === "string" ? el.className : "";
        if (cls.includes("bcw") || cls.includes("fab") || cls.includes("widget")) {
          document.body.classList.remove("avatar-hidden");
          document.body.classList.add("avatar-visible");
          setIsVisible(true);
          break;
        }
        el = el.parentElement;
      }
    };

    window.addEventListener("click", handleWidgetClick, true);
    return () => {
      window.removeEventListener("click", handleWidgetClick, true);
    };
  }, []);

  return { isVisible, isConnected };
}
```

---

### 5.3 การแยก Business Logic ด้วย Custom Hook (`useCart`)

#### ✅ `src/hooks/use-cart.ts`:
```typescript
import { useState, useMemo } from "react";
import type { CartLine, MenuItem, Addon } from "../types";

export function useCart() {
  const [items, setItems] = useState<CartLine[]>([]);
  const [orderType, setOrderType] = useState<"dine-in" | "takeaway" | "delivery">("dine-in");
  const [tableNumber, setTableNumber] = useState<string>("");
  const [note, setNote] = useState<string>("");

  const addItem = (item: MenuItem, addons: Addon[], options: Record<string, string>, itemNote: string) => {
    const linePrice = item.price + addons.reduce((sum, a) => sum + a.price, 0);
    const newLineId = `${item.id}-${Date.now()}`;

    setItems((prev) => [
      ...prev,
      {
        id: newLineId,
        itemId: item.id,
        name: item.name,
        price: linePrice,
        qty: 1,
        addons,
        options,
        note: itemNote,
        image: item.image,
      },
    ]);
  };

  const updateQty = (lineId: string, delta: number) => {
    setItems((prev) =>
      prev
        .map((line) => (line.id === lineId ? { ...line, qty: line.qty + delta } : line))
        .filter((line) => line.qty > 0)
    );
  };

  const clearCart = () => setItems([]);

  const subtotal = useMemo(() => items.reduce((sum, line) => sum + line.price * line.qty, 0), [items]);
  const deliveryFee = orderType === "delivery" ? 25 : 0;
  const total = subtotal + deliveryFee;
  const totalItemCount = useMemo(() => items.reduce((sum, line) => sum + line.qty, 0), [items]);

  return {
    items,
    addItem,
    updateQty,
    clearCart,
    subtotal,
    deliveryFee,
    total,
    totalItemCount,
    orderType,
    setOrderType,
    tableNumber,
    setTableNumber,
    note,
    setNote,
  };
}
```

---

### 5.4 โครงสร้างหน้า Route ใหม่ที่สั้นและคลีน (`src/routes/customer/index.tsx`)

เมื่อย้ายส่วน Logic และ Sub-components ออกไปครบถ้วน ไฟล์ `src/routes/customer/index.tsx` จะลดลงจาก **5,290 บรรทัด เหลือเพียงประมาณ 120 บรรทัด** โดยยังคงการทำงานเหมือนเดิม 100%:

```tsx
// src/routes/customer/index.tsx
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useLanguage } from "../../lib/i18n";
import { useCart } from "../../hooks/use-cart";
import { useWebAvatar } from "../../hooks/use-web-avatar";
import { useCustomerOrders } from "../../hooks/use-customer-orders";
import { MENU, CATEGORIES } from "../../constants/menu.data";
import type { MenuItem } from "../../types";

// Import Components ที่แยกไว้
import { CustomerHeader } from "../../components/customer/customer-header";
import { CategoryTabs } from "../../components/customer/category-tabs";
import { MenuGrid } from "../../components/customer/menu-grid";
import { MenuDetailModal } from "../../components/customer/menu-detail-modal";
import { CartDrawer } from "../../components/customer/cart-drawer";
import { CheckoutModal } from "../../components/customer/checkout-modal";
import { OrderTrackingSheet } from "../../components/customer/order-tracking-sheet";
import { OrderHistoryDrawer } from "../../components/customer/order-history-drawer";

export const Route = createFileRoute("/customer/")({
  head: () => ({
    meta: [
      { title: "LINE LIFF · ร้านลุงเก้ต Epicurean Delivery" },
      { name: "description", content: "สั่งอาหารพรีเมียมผ่าน LINE LIFF ร้านลุงเก้ต" },
    ],
  }),
  component: CustomerApp,
});

function CustomerApp() {
  const { language, setLanguage, t, tMenu } = useLanguage();
  useWebAvatar(); // จัดการ WebAvatar อัตโนมัติ

  const cart = useCart();
  const orders = useCustomerOrders();

  // State สำหรับควบคุมการเปิด/ปิด Modals
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [customizingItem, setCustomizingItem] = useState<MenuItem | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#fff8f2] text-[#0f1f2b] pb-24 font-prompt">
      {/* ส่วนหัวแอป */}
      <CustomerHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        language={language}
        onLanguageChange={setLanguage}
        onOpenHistory={() => setIsHistoryOpen(true)}
      />

      {/* หมวดหมู่ & รายการอาหาร */}
      <main className="max-w-4xl mx-auto px-4 py-3">
        <CategoryTabs
          categories={CATEGORIES}
          selected={selectedCategory}
          onSelect={setSelectedCategory}
        />
        <MenuGrid
          menu={MENU}
          category={selectedCategory}
          searchQuery={searchQuery}
          onSelectItem={(item) => setCustomizingItem(item)}
          onQuickAdd={(item) => cart.addItem(item, [], {}, "")}
        />
      </main>

      {/* แถบแจ้งเตือนสถานะออเดอร์ปัจจุบัน (ถ้ามี) */}
      {orders.activeOrder && (
        <OrderTrackingSheet order={orders.activeOrder} />
      )}

      {/* Modals & Drawers ทั้งหมด */}
      {customizingItem && (
        <MenuDetailModal
          item={customizingItem}
          onClose={() => setCustomizingItem(null)}
          onAddToCart={cart.addItem}
        />
      )}

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onProceedCheckout={() => {
          setIsCartOpen(false);
          setIsCheckoutOpen(true);
        }}
      />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cart={cart}
        onOrderCreated={orders.handleNewOrderCreated}
      />

      <OrderHistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        orders={orders.history}
      />
    </div>
  );
}
```

---

## 6. ขั้นตอนการ Refactor แบบเป็นลำดับขั้น (Step-by-Step Implementation Roadmap)

เพื่อความปลอดภัยสูงสุดและไม่กระทบการทำงานของระบบ ให้ดำเนินการตามลำดับ 5 เฟสดังนี้:

```
[Phase 1: รากฐาน] ──> [Phase 2: Hooks & State] ──> [Phase 3: Shared UI] ──> [Phase 4: Route Decomposition] ──> [Phase 5: ทดสอบ]
```

### 🔹 Phase 1: สร้างโฟลเดอร์และย้าย Types & Constants (ไม่กระทบ Logic)
1. สร้างโฟลเดอร์ `src/types/` และ `src/constants/`
2. สร้าง `src/types/order.types.ts`, `src/types/menu.types.ts`, `src/types/user.types.ts`
3. ย้ายค่าสีธีมไปที่ `src/constants/theme.ts`
4. ย้ายข้อมูลเมนูเริ่มต้น `MENU`, `PROTEINS`, `TOPPINGS`, `SIZES` ไปที่ `src/constants/menu.data.ts`
5. เปลี่ยนการ import ในไฟล์เดิมให้ชี้มาที่ Types และ Constants กลาง

### 🔹 Phase 2: แยก Custom Hooks & Service Layer
1. สร้าง `src/lib/sound.ts` เป็น Audio Synthesizer กลาง
2. สร้าง `src/hooks/use-sound-effects.ts`
3. สร้าง `src/hooks/use-web-avatar.ts` ดึง DOM script loader ออกจากหน้า Customer
4. สร้าง `src/hooks/use-cart.ts` สำหรับคำนวณราคาและจัดการสินค้าในตะกร้า
5. สร้าง `src/hooks/use-customer-orders.ts` สำหรับดึงประวัติและจัดการ Realtime Listener

### 🔹 Phase 3: สร้าง Shared UI Components
1. สร้าง `src/components/ui/modal.tsx` (Container สำหรับ Modal ที่มี Backdrop & Animation)
2. สร้าง `src/components/ui/drawer.tsx` (Bottom sheet สำหรับ Mobile)
3. สร้าง `src/components/ui/badge.tsx` (Status Chip แสดงสถานะออเดอร์)

### 🔹 Phase 4: แตกไฟล์ Route หลัก (Decomposition)
1. **Refactor `src/routes/customer/index.tsx`:**
   - แตกไฟล์ `MenuDetailModal.tsx`, `CartDrawer.tsx`, `CheckoutModal.tsx`, `PaymentStripeModal.tsx`, `PaymentPromptPayModal.tsx`, `OrderTrackingSheet.tsx`, `OrderHistoryDrawer.tsx`
   - รวมหน้าหลักให้เหลือเพียง Container และ State ประสานงาน
2. **Refactor `src/routes/staff/index.tsx`:**
   - สร้าง `src/hooks/use-kitchen-orders.ts`
   - แตกไฟล์ `KitchenHeader.tsx`, `KitchenColumn.tsx`, `KitchenOrderCard.tsx`, `MenuManagerModal.tsx`, `MenuEditModal.tsx`
3. **Refactor `src/routes/admin/index.tsx`:**
   - สร้าง `src/hooks/use-admin-dashboard.ts`
   - แตกไฟล์ `AdminMetricsGrid.tsx`, `AdminRevenueChart.tsx`, `IngredientInventory.tsx`, `StaffApprovalTable.tsx`
4. **Refactor `src/routes/login.tsx`:**
   - แตกไฟล์ `AuthBrandingBanner.tsx`, `LoginForm.tsx`, `RegisterForm.tsx`, `RoleSelectorCard.tsx`

### 🔹 Phase 5: ตรวจสอบและทดสอบระบบ (Verification)
1. รัน TypeScript Compiler Check: `npm run build` หรือ `npx tsc --noEmit` เพื่อเช็ค Type Error
2. รัน Linter: `npm run lint`
3. ทดสอบ Manual Test ทุก Flow:
   - การสั่งอาหาร -> เลือก Option -> ใส่ตะกร้า -> คำนวณราคา
   - การชำระเงิน -> Stripe Webhook -> แนบสลิป PromptPay
   - หน้าครัว -> ได้ยินเสียงแจ้งเตือน -> ลาก/เปลี่ยนสถานะอาหาร -> Realtime อัปเดตฝั่งลูกค้า
   - หน้าแอดมิน -> ดูกราฟ -> ปรับสต็อกวัตถุดิบ -> อนุมัติผู้ใช้

---

## 7. Checklist การตรวจสอบความถูกต้อง (Safety & Verification Checklist)

| รายการที่ต้องตรวจสอบ | ผลการตรวจสอบ |
|---|:---:|
| 1. ไม่มี Business Logic ใดๆ หายไป (การคำนวณเงิน, ส่วนลด, ค่าส่ง 25 บาทถูกต้อง) | [ ] |
| 2. WebAvatar Widget แสดงผลและเรียกท่าทาง Animation ได้ครบถ้วนเหมือนเดิม | [ ] |
| 3. เสียงแจ้งเตือนครัว (New Order Sound, Beep, Chime) ทำงานถูกต้อง | [ ] |
| 4. Realtime Subscription บน Supabase ทำงานเมื่อมีการอัปเดตออเดอร์ | [ ] |
| 5. ระบบสลับภาษา (TH / EN / CN / JP / RU) แสดงผลได้ถูกต้องทุกจุด | [ ] |
| 6. ฟอร์ม Login / Register / OAuth Google และการ Sync User ไป Supabase ทำงานปกติ | [ ] |
| 7. ทุกไฟล์ในโปรเจกต์มีความยาวไม่เกิน 250 บรรทัด | [ ] |
| 8. ไม่มี Type Error ใน TypeScript (`tsc --noEmit` ผ่าน 100%) | [ ] |

---

> 💡 **สรุป:** การปรับปรุงโค้ดตามแนวทางนี้จะช่วยให้ Source Code มีระเบียบระดับ Production-Grade ลดความซับซ้อนของไฟล์จาก 5,000+ บรรทัดเหลือ < 200 บรรทัดต่อไฟล์ ค้นหาและแก้ไขโค้ดได้รวดเร็วขึ้นหลายเท่าตัว **โดยที่ระบบยังคงทำงานได้สมบูรณ์ครบถ้วน 100%**

# 🍽️ Dineos · Smart Restaurant & Kitchen Management System

<div align="center">

![Dineos Banner](https://raw.githubusercontent.com/ran-lung-get/ran-lung-get/refactor/public/logo.png)

### **ระบบสั่งอาหาร จัดการครัว (KDS) และแผงควบคุมร้านอาหารครบวงจร**
*ขับเคลื่อนด้วยสถาปัตยกรรมยุคใหม่ **TanStack Start (React 19)** และ **MongoDB Atlas***

[![Framework](https://img.shields.io/badge/Framework-TanStack%20Start%20(React%2019)-002e47?style=for-the-badge&logo=react)](https://tanstack.com/start)
[![Database](https://img.shields.io/badge/Database-MongoDB%20Atlas-47A248?style=for-the-badge&logo=mongodb)](https://www.mongodb.com/)
[![Auth](https://img.shields.io/badge/Auth-Google%20OAuth%202.0%20%2B%20MongoDB-4285F4?style=for-the-badge&logo=google)](https://developers.google.com/identity)
[![Payments](https://img.shields.io/badge/Payment-Stripe%20%2B%20PromptPay-635BFF?style=for-the-badge&logo=stripe)](https://stripe.com/)
[![LINE LIFF](https://img.shields.io/badge/Integration-LINE%20LIFF%20v2-00C300?style=for-the-badge&logo=line)](https://developers.line.biz/en/docs/liff/)

</div>

---

## 🌟 จุดเด่นของระบบ (Core Features)

### 1. 📱 ฝั่งลูกค้า (Customer & LINE LIFF Portal - `/customer`)
- **ช่องทางสั่งอาหารแบบ 3-in-1 (Hybrid Ordering)**:
  - 🪑 **ทานที่ร้าน (Dine-in)**: เลือกผังโต๊ะอาหารแบบเรียลไทม์ ตรวจสอบโต๊ะว่าง/ไม่ว่าง
  - 🥡 **สั่งกลับบ้าน (Takeaway)**: ระบบคิวรับอาหารหน้าร้าน
  - 🛵 **จัดส่งเดลิเวอรี่ (Delivery)**: ระบุพิกัด ที่อยู่จัดส่ง และข้อความถึงไรเดอร์
- **ระบบติดตามสถานะสด (Live Order Tracker)**: ติดตามสถานะออเดอร์ตามไทม์ไลน์ (รอดำเนินการ ⏳ ➔ กำลังปรุง 🍳 ➔ พร้อมเสิร์ฟ/จัดส่ง 🔔 ➔ เสร็จสมบูรณ์ ✅)
- **ระบบหลายภาษา (i18n Multilingual)**: สลับเปลี่ยนภาษาได้ทันที 3 ภาษา (**ไทย 🇹🇭 | อังกฤษ 🇬🇧 | จีน 🇨🇳**)
- **การชำระเงินหลายช่องทาง (Multi-Payment Gateway)**:
  - สแกนจ่ายผ่าน **PromptPay QR Code** พร้อมระบบอัปโหลดและตรวจสอบสลิป
  - ชำระเงินผ่านบัตรเครดิต/เดบิตระดับโลกด้วย **Stripe Payment Gateway**
- **ช่องทางติดต่อและแผนที่**: แสดงข้อมูลร้าน เวลาเปิด-ปิด เบอร์โทรด่วน และแผนที่ Google Maps แบบ Interactive

---

### 2. 🍳 ฝั่งครัวและพนักงาน (Staff Kitchen KDS Portal - `/staff`)
- **กระดานจัดการครัวอัจฉริยะ (Kitchen Display System - Kanban)**:
  - แยกหมวดหมู่สถานะชัดเจน: *รอดำเนินการ*, *กำลังปรุงอาหาร*, *พร้อมเสิร์ฟ/จัดส่ง*
  - ปุ่มย้อนกลับสถานะ (Regress) และส่งต่อสถานะ (Advance) ได้ในคลิกเดียว
  - ปุ่มคัดลอกที่อยู่จัดส่งและโทรหาลูกค้าได้โดยตรง
- **ระบบเสียงแจ้งเตือนออเดอร์เข้า (Real-time Audio Alert)**: ส่งเสียงเตือนทันทีที่มีออเดอร์ใหม่เข้ามา
- **ระบบจัดการผังโต๊ะ (Table Layout Management)**: จัดการ ย้ายโต๊ะ เคลียร์โต๊ะ และเพิ่มโต๊ะอาหาร
- **ระบบจัดการเมนูและสต็อกวัตถุดิบ (Menu & Stock Quick Manager)**: สลับสถานะเปิด-ปิดขายเมนูอาหาร และปรับเพิ่ม-ลดปริมาณสต็อก

---

### 3. 👑 ฝั่งผู้ดูแลระบบ (Admin Console - `/admin`)
- **แดชบอร์ดภาพรวมและสถิติการขาย (Real-time Sales Analytics)**:
  - กราฟแนวโน้มรายได้ (Area Chart) สรุปยอดขายตามช่วงเวลา (วันนี้, 7 วัน, 30 วัน, ทั้งหมด)
  - ตัวชี้วัดสำคัญ 5 ด้าน: ยอดสั่งซื้อ, รายได้รวม, จำนวนลูกค้า, เมนูยอดนิยมอันดับ 1, ยอดเฉลี่ยต่อบิล
  - 5 อันดับเมนูขายดีที่สุดพร้อมแถบสัดส่วน
  - ตาราง 5 ออเดอร์และลูกค้าล่าสุด
- **ระบบจัดการคลังวัตถุดิบ & ต้นทุน (Inventory & Cost Control)**:
  - ติดตามวัตถุดิบแบ่งตามหมวดหมู่ (เนื้อสัตว์, อาหารทะเล, เครื่องเคียง/ท็อปปิ้ง)
  - ระบบแจ้งเตือนเมื่อวัตถุดิบเหลือน้อยกว่าเกณฑ์ขั้นต่ำ (Low Stock Alert)
  - เพิ่ม/แก้ไข/ลบวัตถุดิบและปรับราคาต้นทุนต่อหน่วย
- **ระบบจัดการผู้ใช้และสิทธิ์การเข้าถึง (RBAC User Management)**:
  - รายชื่อผู้ใช้งานในระบบ พร้อมแบ่งระดับสิทธิ์ (**Admin, Staff, Customer**)
  - สลับเปิด/ปิดสถานะการใช้งานบัญชี (Active/Inactive)
  - ปรับระดับสิทธิ์และลบผู้ใช้งานแบบเรียลไทม์

---

### 4. 🔐 ระบบยืนยันตัวตน (Authentication & Security - `/login`)
- **Google OAuth 2.0 (Google Identity Services - GIS)**: เข้าสู่ระบบด้วยบัญชี Google ได้ในคลิกเดียว พร้อมซิงค์ข้อมูลโปรไฟล์ลง MongoDB
- **ระบบสมัครสมาชิกและเข้าสู่ระบบด้วยรหัสผ่าน**: ตรวจสอบและบันทึกลงคอลเลกชัน `users` ใน MongoDB
- **สั่งอาหารหน้าร้านแบบ Guest Mode**: ลูกค้าหน้าร้านสามารถสั่งอาหารได้ทันทีโดยไม่ต้องเข้าสู่ระบบ

---

## 🛠️ เทคโนโลยีที่ใช้ (Tech Stack)

| หมวดหมู่ | เทคโนโลยี |
| :--- | :--- |
| **Framework** | [TanStack Start](https://tanstack.com/start) (Full-Stack React 19 + Vinxi + Nitro Server) |
| **Routing** | [@tanstack/react-router](https://tanstack.com/router) (Type-Safe Routing) |
| **Database** | [MongoDB Atlas](https://www.mongodb.com/) (Node.js Official `mongodb` Driver) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) + Custom Dineos Design Tokens |
| **Animations** | [Framer Motion](https://motion.dev/) (`framer-motion`) |
| **Icons** | [Lucide React](https://lucide.dev/) |
| **Charts** | [Recharts](https://recharts.org/) |
| **Payments** | [Stripe](https://stripe.com/) (`@stripe/stripe-js`, `stripe`) + PromptPay QR |
| **LINE LIFF** | [@line/liff](https://developers.line.biz/en/docs/liff/) |
| **Validation** | [Zod](https://zod.dev/) |

---

## 🚀 การติดตั้งและเริ่มใช้งาน (Getting Started)

### ข้อกำหนดเบื้องต้น (Prerequisites)
- **Node.js** เวอร์ชัน 18.0 ขึ้นไป
- **MongoDB Atlas** หรือ MongoDB Local Instance

---

### 1. โคลนโปรเจกต์และติดตั้ง Dependencies
```bash
git clone https://github.com/ran-lung-get/ran-lung-get.git
cd ran-lung-get
npm install
```

---

### 2. ตั้งค่าไฟล์ Environment Variables (`.env`)
คัดลอกไฟล์ `.env.example` ไปเป็น `.env`:
```bash
cp .env.example .env
```

แก้ไขค่าใน `.env` ให้ตรงกับระบบของคุณ:
```env
# ฐานข้อมูล MongoDB Atlas
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB_NAME=dineos_db

# เข้าสู่ระบบด้วย Google OAuth 2.0
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# LINE LIFF
VITE_LIFF_ID=2010518546-xxxxxxxx

# การชำระเงิน Stripe
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxx
STRIPE_SECRET_KEY=sk_test_xxxxxxxx
VITE_STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxx
```

---

### 3. รัน Seed ข้อมูลเริ่มต้นเข้าสู่ MongoDB
สคริปต์นี้จะสร้างผังโต๊ะอาหารและสต็อกวัตถุดิบเริ่มต้นให้อัตโนมัติ:
```bash
npm run db:seed:mongo
```

---

### 4. รันแอปพลิเคชันในโหมดพัฒนา (Development)
```bash
npm run dev
```
เปิดเบราว์เซอร์ไปที่ `http://localhost:3000`

---

### 5. การ Build สำหรับ Production
```bash
npm run build
npm run preview
```

---

## 📁 โครงสร้างโปรเจกต์ (Project Structure)

```text
dineos/
├── public/                     # Static assets (logo, audio alerts, images)
├── scripts/
│   └── seed-mongodb.mjs        # สคริปต์ Seed ฐานข้อมูล MongoDB Atlas
├── src/
│   ├── components/             # UI Components แบ่งตามโมดูล
│   │   ├── admin/              # แผง Dashboard, จัดการสต็อก, จัดการสิทธิ์
│   │   ├── auth/               # Google Button, การ์ดเลือกบทบาท, แบนเนอร์
│   │   ├── customer/           # หน้าสั่งอาหาร, ตะกร้า, ติดตามสถานะ, แผนที่
│   │   ├── staff/              # กระดานครัว KDS, จัดการผังโต๊ะ, สต็อก
│   │   └── ui/                 # Reusable UI primitives
│   ├── constants/              # ค่าคงที่, ธีมสีแบรนด์, ข้อมูลเมนู
│   ├── lib/
│   │   ├── api/
│   │   │   ├── auth.functions.ts     # TanStack Server Functions สำหรับระบบ Auth & Users
│   │   │   ├── mongo.functions.ts    # TanStack Server Functions สำหรับ Orders, Menu, Tables, Stock
│   │   │   ├── stripe.functions.ts   # TanStack Server Functions สำหรับ Stripe Checkout
│   │   │   └── translation.server.ts # ฟังก์ชันแปลภาษา
│   │   ├── auth.ts             # Session & LocalStorage auth helpers
│   │   ├── i18n.tsx            # ระบบสลับภาษา ไทย-อังกฤษ-จีน
│   │   └── mongodb.ts          # MongoDB Singleton Client Connection
│   ├── routes/                 # TanStack Router File-based Routes
│   │   ├── __root.tsx          # Root Layout & Contexts
│   │   ├── index.tsx           # Redirect route
│   │   ├── login.tsx           # หน้าเข้าสู่ระบบและลงทะเบียน
│   │   ├── customer/index.tsx  # หน้าระบบสั่งอาหารสำหรับลูกค้า
│   │   ├── staff/index.tsx     # หน้าระบบจัดการครัว (Kitchen KDS)
│   │   └── admin/index.tsx     # หน้าระบบแผงควบคุมผู้ดูแลระบบ
│   ├── styles/
│   │   └── app.css             # Tailwind CSS v4 Global Styles
│   └── router.tsx              # Router configuration
├── .env.example                # ตัวอย่างการตั้งค่า Environment Variables
├── package.json
└── vite.config.ts
```

---

## 🔑 บัญชีทดสอบระบบ (Test Accounts)

| บทบาท (Role) | อีเมล | รหัสผ่าน | สิทธิ์การเข้าถึง |
| :--- | :--- | :--- | :--- |
| **Admin (ผู้ดูแลระบบ)** | `testadmin12345@example.com` | `123456` | เข้าถึงทุกหน้า `/admin`, `/staff`, `/customer` |
| **Staff (พนักงาน)** | `staff@dineos.app` | `123456` | เข้าถึงหน้าจอครัว `/staff` และ `/customer` |
| **Customer (ลูกค้า)** | เข้าสู่ระบบด้วย Google หรือกด **"สั่งหน้าร้าน (ไม่ต้องเข้าสู่ระบบ)"** | - | เข้าถึงหน้าสั่งอาหาร `/customer` |

---

## 📄 License

ลิขสิทธิ์ © 2026 **Dineos**. สงวนลิขสิทธิ์ทุกประการ.

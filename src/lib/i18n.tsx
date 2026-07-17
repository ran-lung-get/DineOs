import React, { createContext, useContext, useState, useEffect } from "react";
import { translateApi } from "./api/translation.functions";

export type Language = "th" | "en" | "zh";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  tMenu: (text: string, field?: "name" | "desc") => string;
  loadingLanguages: Record<string, boolean>;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Local memory and localStorage cache for dynamic translations
const dynamicCacheKey = "ran-lung-get-dynamic-translations";
let dynamicCache: Record<string, string> = {};

if (typeof window !== "undefined") {
  try {
    const saved = localStorage.getItem(dynamicCacheKey);
    if (saved) {
      dynamicCache = JSON.parse(saved);
    }
  } catch (e) {
    console.error("Failed to load dynamic translation cache:", e);
  }
}

// ─────────────────────────────────────────────────────────────
// STATIC DICTIONARY FOR UI TEXTS
// ─────────────────────────────────────────────────────────────
const uiDictionary: Record<string, Record<Language, string>> = {
  // Navigation / Headers
  "ร้านลุงเกตุ": { th: "ร้านลุงเกตุ", en: "Ran Lung Get", zh: "龙葛特餐馆" },
  "สั่งอาหารพรีเมียมผ่าน LINE LIFF": {
    th: "สั่งอาหารพรีเมียมผ่าน LINE LIFF",
    en: "Order premium food via LINE LIFF",
    zh: "通过 LINE LIFF 订购优质美食",
  },
  "ระบบแปลภาษาเรียลไทม์": { th: "ระบบแปลภาษาเรียลไทม์", en: "Real-time Translation", zh: "实时翻译系统" },
  "Translate Engine": { th: "Translate Engine", en: "Translate Engine", zh: "翻译引擎" },
  "สวัสดี, ยินดีต้อนรับ": { th: "สวัสดี, ยินดีต้อนรับ", en: "Hello, Welcome", zh: "您好，欢迎光临" },
  "เลือกประสบการณ์การรับประทาน": { th: "เลือกประสบการณ์การรับประทาน", en: "Choose your dining experience", zh: "选择您的用餐体验" },
  "เปิดบริการ": { th: "เปิดบริการ", en: "Open", zh: "营业中" },
  "ปิดบริการ": { th: "ปิดบริการ", en: "Closed", zh: "已关店" },
  "สั่งอาหาร": { th: "สั่งอาหาร", en: "Order Now", zh: "开始点餐" },
  "ช่องทางการรับอาหาร": { th: "ช่องทางการรับอาหาร", en: "Dining Option", zh: "用餐方式" },
  "(กรุณาเลือกช่องทางการรับอาหารด้านบนเพื่อระบุรายละเอียด)": { th: "(กรุณาเลือกช่องทางการรับอาหารด้านบนเพื่อระบุรายละเอียด)", en: "(Please select dining option above to specify details)", zh: "(请在上方选择用餐方式以填写详情)" },
  "* กรุณาเลือกช่องทางการรับอาหาร (ทานที่ร้าน, จัดส่งถึงที่ หรือ รับกลับบ้าน) ก่อนเริ่มสั่งซื้อ": { th: "* กรุณาเลือกช่องทางการรับอาหาร (ทานที่ร้าน, จัดส่งถึงที่ หรือ รับกลับบ้าน) ก่อนเริ่มสั่งซื้อ", en: "* Please select dining channel (dine-in, delivery, or takeaway) before ordering", zh: "* 下单前请选择用餐方式（堂食、外送或外带）" },
  "ร้านจะจัดเตรียมแพ็กอาหารใส่กล่องให้อย่างดี คุณสามารถมารับอาหารได้ที่เคาน์เตอร์ร้านเมื่อสถานะเปลี่ยนเป็น": { th: "ร้านจะจัดเตรียมแพ็กอาหารใส่กล่องให้อย่างดี คุณสามารถมารับอาหารได้ที่เคาน์เตอร์ร้านเมื่อสถานะเปลี่ยนเป็น", en: "The restaurant will package your food nicely. You can pick it up at the counter when the status changes to", zh: "餐厅将为您妥善打包食物。当状态变为时，您可以在柜台取餐" },
  "พร้อมเสิร์ฟ": { th: "พร้อมเสิร์ฟ", en: "Ready to Serve", zh: "准备就绪" },
  "เลื่อนซ้าย": { th: "เลื่อนซ้าย", en: "Scroll Left", zh: "向左滚动" },
  "เลื่อนขวา": { th: "เลื่อนขวา", en: "Scroll Right", zh: "向右滚动" },
  "ค้นหาเมนู...": { th: "ค้นหาเมนู...", en: "Search menu...", zh: "搜索菜单..." },
  "เลือกประเภทอาหาร": { th: "เลือกประเภทอาหาร", en: "Select category", zh: "选择食物类别" },
  "เมนูแนะนำ": { th: "เมนูแนะนำ", en: "Recommended Menus", zh: "推荐菜单" },
  "ทั้งหมด": { th: "ทั้งหมด", en: "All", zh: "全部" },
  "Signature": { th: "Signature", en: "Signature", zh: "招牌" },
  "อาหารจานเดียว": { th: "อาหารจานเดียว", en: "Main Dish", zh: "单人餐" },
  "เส้น": { th: "เส้น", en: "Noodles", zh: "面类" },
  "ข้าวผัด": { th: "ข้าวผัด", en: "Fried Rice", zh: "炒饭类" },
  "มังสวิรัติ": { th: "มังสวิรัติ", en: "Vegetarian", zh: "素食" },
  "เครื่องดื่ม": { th: "เครื่องดื่ม", en: "Drinks", zh: "饮料" },
  "ของหวาน": { th: "ของหวาน", en: "Dessert", zh: "甜点" },

  // Cart & Orders
  "รถเข็น": { th: "รถเข็น", en: "Cart", zh: "购物车" },
  "รถเข็นของคุณ": { th: "รถเข็นของคุณ", en: "Your Cart", zh: "您的购物车" },
  "ไม่มีสินค้าในรถเข็น": { th: "ไม่มีสินค้าในรถเข็น", en: "Your cart is empty", zh: "购物车空空如也" },
  "เลือกประเภทการสั่ง": { th: "เลือกประเภทการสั่ง", en: "Select Order Type", zh: "选择用餐方式" },
  "ทานที่ร้าน": { th: "ทานที่ร้าน", en: "Dine-in", zh: "堂食" },
  "รับกลับบ้าน": { th: "รับกลับบ้าน", en: "Takeaway", zh: "外带" },
  "จัดส่งถึงที่": { th: "จัดส่งถึงที่", en: "Delivery", zh: "外送" },
  "ระบุเลขโต๊ะ": { th: "ระบุเลขโต๊ะ", en: "Enter Table Number", zh: "输入桌号" },
  "ชื่อผู้รับ": { th: "ชื่อผู้รับ", en: "Recipient Name", zh: "收件人姓名" },
  "เบอร์โทรศัพท์": { th: "เบอร์โทรศัพท์", en: "Phone Number", zh: "电话号码" },
  "ที่อยู่สำหรับจัดส่ง": { th: "ที่อยู่สำหรับจัดส่ง", en: "Delivery Address", zh: "送货地址" },
  "ประเภทที่อยู่": { th: "ประเภทที่อยู่", en: "Address Type", zh: "地址类型" },
  "บ้าน": { th: "บ้าน", en: "Home", zh: "住宅" },
  "ที่ทำงาน": { th: "ที่ทำงาน", en: "Work", zh: "办公室" },
  "หอพัก": { th: "หอพัก", en: "Dorm", zh: "宿舍" },
  "บันทึกเพิ่มเติม (ตัวอย่าง: เผ็ดน้อย, ไม่ใส่ผัก)": {
    th: "บันทึกเพิ่มเติม (ตัวอย่าง: เผ็ดน้อย, ไม่ใส่ผัก)",
    en: "Additional notes (e.g., mild spicy, no veggies)",
    zh: "备注（例如：微辣、不要葱）",
  },
  "รายละเอียดเพิ่มเติม": { th: "รายละเอียดเพิ่มเติม", en: "Additional Notes", zh: "备注详情" },
  "สรุปรายการสั่งซื้อ": { th: "สรุปรายการสั่งซื้อ", en: "Order Summary", zh: "订单汇总" },
  "ค่าอาหาร": { th: "ค่าอาหาร", en: "Subtotal", zh: "小计" },
  "ค่าส่ง": { th: "ค่าส่ง", en: "Delivery Fee", zh: "配送费" },
  "ยอดรวมทั้งหมด": { th: "ยอดรวมทั้งหมด", en: "Total", zh: "总计" },
  "สั่งซื้อสินค้า": { th: "สั่งซื้อสินค้า", en: "Place Order", zh: "下单" },
  "กำลังสั่งซื้อ...": { th: "กำลังสั่งซื้อ...", en: "Ordering...", zh: "正在下单..." },
  "ดำเนินการสั่งซื้อ": { th: "ดำเนินการสั่งซื้อ", en: "Proceed to Checkout", zh: "去结算" },
  "เลือกช่องทางการชำระเงิน": { th: "เลือกช่องทางการชำระเงิน", en: "Select Payment Method", zh: "选择支付方式" },
  "โอนเงิน (พร้อมเพย์)": { th: "โอนเงิน (พร้อมเพย์)", en: "PromptPay Transfer", zh: "PromptPay转账" },
  "เงินสด": { th: "เงินสด", en: "Cash", zh: "现金支付" },
  "ชำระเงิน": { th: "ชำระเงิน", en: "Pay Now", zh: "立即支付" },
  "ยกเลิก": { th: "ยกเลิก", en: "Cancel", zh: "取消" },

  // Order Details / Status
  "รายละเอียดออเดอร์": { th: "รายละเอียดออเดอร์", en: "Order Details", zh: "订单详情" },
  "สถานะออเดอร์": { th: "สถานะออเดอร์", en: "Order Status", zh: "订单状态" },
  "รอดำเนินการ": { th: "รอดำเนินการ", en: "Pending", zh: "等待确认" },
  "กำลังเตรียม": { th: "กำลังเตรียม", en: "Preparing", zh: "正在配餐" },
  "กำลังจัดส่ง": { th: "กำลังจัดส่ง", en: "Out for Delivery", zh: "配送中" },
  "สำเร็จ": { th: "สำเร็จ", en: "Completed", zh: "已完成" },
  "เสร็จสิ้น": { th: "เสร็จสิ้น", en: "Completed", zh: "已完成" },
  "กำลังดำเนินการ": { th: "กำลังดำเนินการ", en: "In Progress", zh: "进行中" },
  "ยกเลิกแล้ว": { th: "ยกเลิกแล้ว", en: "Cancelled", zh: "已取消" },
  "ขอคืนเงิน": { th: "ขอคืนเงิน", en: "Refund Requested", zh: "申请退款" },
  "รอรับออเดอร์": { th: "รอรับออเดอร์", en: "Awaiting Confirmation", zh: "等待接单" },
  "คิว": { th: "คิว", en: "Queue", zh: "排队号" },
  "โต๊ะ": { th: "โต๊ะ", en: "Table", zh: "桌号" },
  "วันเวลาที่สั่ง": { th: "วันเวลาที่สั่ง", en: "Order Date/Time", zh: "下单时间" },
  "หมายเลขออเดอร์": { th: "หมายเลขออเดอร์", en: "Order Number", zh: "订单编号" },
  "ติดตามออเดอร์": { th: "ติดตามออเดอร์", en: "Track Order", zh: "追踪订单" },
  "ประวัติการสั่งซื้อ": { th: "ประวัติการสั่งซื้อ", en: "Order History", zh: "历史订单" },
  "ยังไม่มีประวัติการสั่งซื้อ": { th: "ยังไม่มีประวัติการสั่งซื้อ", en: "No order history yet", zh: "暂无历史订单" },
  "สั่งซื้ออีกครั้ง": { th: "สั่งซื้ออีกครั้ง", en: "Order Again", zh: "再次购买" },

  // Special Requirements Modal
  "ระบุความต้องการพิเศษ": { th: "ระบุความต้องการพิเศษ", en: "Customize Order", zh: "定制要求" },
  "ขนาด": { th: "ขนาด", en: "Size", zh: "分量" },
  "ธรรมดา": { th: "ธรรมดา", en: "Regular", zh: "普通" },
  "พิเศษ": { th: "พิเศษ", en: "Large", zh: "加大" },
  "ระดับความเผ็ด": { th: "ระดับความเผ็ด", en: "Spiciness Level", zh: "辣度选择" },
  "ไม่เผ็ด": { th: "ไม่เผ็ด", en: "Non-spicy", zh: "不辣" },
  "เผ็ดน้อย": { th: "เผ็ดน้อย", en: "Mild", zh: "微辣" },
  "เผ็ดกลาง": { th: "เผ็ดกลาง", en: "Medium", zh: "中辣" },
  "เผ็ดมาก": { th: "เผ็ดมาก", en: "Hot", zh: "特辣" },
  "เลือกเนื้อสัตว์": { th: "เลือกเนื้อสัตว์", en: "Select Protein", zh: "选择肉类" },
  "เลือกท็อปปิ้งเพิ่มเติม": { th: "เลือกท็อปปิ้งเพิ่มเติม", en: "Select Toppings", zh: "加配料" },
  "เพิ่มลงรถเข็น": { th: "เพิ่มลงรถเข็น", en: "Add to Cart", zh: "加入购物车" },
  "อัปเดตรถเข็น": { th: "อัปเดตรถเข็น", en: "Update Cart", zh: "更新购物车" },

  // Toast / Alerts
  "เพิ่มลงในรถเข็นสำเร็จ": { th: "เพิ่มลงในรถเข็นสำเร็จ", en: "Added to cart successfully", zh: "已成功加入购物车" },
  "อัปเดตรายการเรียบร้อย": { th: "อัปเดตรายการเรียบร้อย", en: "Cart updated successfully", zh: "购物车已成功更新" },
  "ลบรายการเรียบร้อย": { th: "ลบรายการเรียบร้อย", en: "Item removed from cart", zh: "已从购物车删除商品" },
  "กรุณากรอกเลขโต๊ะ": { th: "กรุณากรอกเลขโต๊ะ", en: "Please enter table number", zh: "请输入您的桌号" },
  "กรุณากรอกเบอร์โทรศัพท์": { th: "กรุณากรอกเบอร์โทรศัพท์", en: "Please enter phone number", zh: "请输入您的电话号码" },
  "กรุณากรอกที่อยู่สำหรับจัดส่ง": {
    th: "กรุณากรอกที่อยู่สำหรับจัดส่ง",
    en: "Please enter delivery address",
    zh: "请输入您的配送地址",
  },
  "กรุณากรอกชื่อผู้รับ": { th: "กรุณากรอกชื่อผู้รับ", en: "Please enter recipient name", zh: "请输入收件人姓名" },

  // Proteins
  "หมูสับ": { th: "หมูสับ", en: "Minced Pork", zh: "猪肉碎" },
  "หมูกรอบ": { th: "หมูกรอบ", en: "Crispy Pork", zh: "脆皮五花肉" },
  "หมูชิ้น": { th: "หมูชิ้น", en: "Sliced Pork", zh: "猪肉片" },
  "ไก่สับ": { th: "ไก่สับ", en: "Minced Chicken", zh: "鸡肉碎" },
  "ไก่ต้ม": { th: "ไก่ต้ม", en: "Boiled Chicken", zh: "白斩鸡" },
  "เนื้อ": { th: "เนื้อ", en: "Beef", zh: "牛肉" },
  "หมึก": { th: "หมึก", en: "Squid", zh: "鱿鱼" },
  "กุ้ง": { th: "กุ้ง", en: "Shrimp", zh: "鲜虾" },
  "หอยลาย": { th: "หอยลาย", en: "Clams", zh: "蛤蜊" },
  "ไม่เอาเนื้อสัตว์": { th: "ไม่เอาเนื้อสัตว์", en: "No Meat (Vegetarian)", zh: "不要肉（素食）" },

  // Toppings
  "ไส้กรอก": { th: "ไส้กรอก", en: "Sausage", zh: "热狗/香肠" },
  "กุนเชียง": { th: "กุนเชียง", en: "Chinese Sausage", zh: "中式腊肠" },
  "ไข่ดาวไม่สุก": { th: "ไข่ดาวไม่สุก", en: "Sunny-side Up Egg", zh: "溏心荷包蛋" },
  "ไข่ดาวสุก": { th: "ไข่ดาวสุก", en: "Fried Egg (Well Done)", zh: "全熟荷包蛋" },
  "ไข่ต้ม": { th: "ไข่ต้ม", en: "Boiled Egg", zh: "水煮蛋" },
  "ไข่เจียว": { th: "ไข่เจียว", en: "Omelet", zh: "煎蛋卷" },
  "ไข่ดาว": { th: "ไข่ดาว", en: "Fried Egg", zh: "荷包蛋" },
  "แนะนำ": { th: "แนะนำ", en: "Recommend", zh: "推荐" },
  "จำเป็น": { th: "จำเป็น", en: "Required", zh: "必选" },
  "อาหารจานหลัก": { th: "อาหารจานหลัก", en: "Main Dish", zh: "主食" },
  "รายการเมนู": { th: "รายการเมนู", en: "Menu List", zh: "菜单列表" },
  "ดูตะกร้าสินค้า": { th: "ดูตะกร้าสินค้า", en: "View Cart", zh: "查看购物车" },
  "เรียงลำดับตาม": { th: "เรียงลำดับตาม", en: "Sort by", zh: "排序方式" },
  "เสร็จสิ้นการเลือก": { th: "เสร็จสิ้นการเลือก", en: "Done", zh: "完成" },
  "🔥 ยอดนิยม (แนะนำ)": { th: "🔥 ยอดนิยม (แนะนำ)", en: "🔥 Popular (Recommend)", zh: "🔥 最受欢迎 (推荐)" },
  "เมนูขายดีประจำสัปดาห์": { th: "เมนูขายดีประจำสัปดาห์", en: "Weekly best sellers", zh: "本周畅销菜单" },
  "💵 ราคา: ต่ำ - สูง": { th: "💵 ราคา: ต่ำ - สูง", en: "💵 Price: Low - High", zh: "💵 价格：低 - 高" },
  "เมนูราคาประหยัด เรียงตามเงินบาท": { th: "เมนูราคาประหยัด เรียงตามเงินบาท", en: "Budget menus, sorted by price", zh: "经济实惠菜单，按价格排序" },
  "💵 ราคา: สูง - ต่ำ": { th: "💵 ราคา: สูง - ต่ำ", en: "💵 Price: High - Low", zh: "💵 价格：高 - 低" },
  "เมนูระดับพรีเมียมคัดสรรพิเศษ": { th: "เมนูระดับพรีเมียมคัดสรรพิเศษ", en: "Premium selection menus", zh: "特别精选优质菜单" },
  "หมด": { th: "หมด", en: "Out of stock", zh: "售罄" },
  "ฟรี": { th: "ฟรี", en: "Free", zh: "免费" },
  "เพิ่มเติม": { th: "เพิ่มเติม", en: "Addons", zh: "加料" },
};

// ─────────────────────────────────────────────────────────────
// STATIC DICTIONARY FOR MENUS (NAMES AND DESCRIPTIONS)
// ─────────────────────────────────────────────────────────────
const menuDictionary: Record<string, Record<Language, { name: string; desc: string }>> = {
  "กระเพราหมูสับ (ข้าวราด)": {
    th: { name: "กระเพราหมูสับ (ข้าวราด)", desc: "กระเพราหมูสับผัดกับพริกและกระเทียม เสิร์ฟราดข้าวไทยร้อนๆ" },
    en: {
      name: "Minced Pork Basil (with Rice)",
      desc: "Stir-fried minced pork with chili and holy basil, served over hot Jasmine rice",
    },
    zh: { name: "泰式罗勒猪肉碎盖饭", desc: "猪肉碎与新鲜辣椒和罗勒叶大火翻炒，浇在热腾腾的米饭上" },
  },
  "ผัดพริกเผา (ข้าวราด)": {
    th: { name: "ผัดพริกเผา (ข้าวราด)", desc: "ผัดเครื่องพริกเผาเข้มข้น เคล้ากับเนื้อหรือไก่ตามสั่ง เสิร์ฟพร้อมข้าว" },
    en: {
      name: "Stir-fried Sweet Chili Paste (with Rice)",
      desc: "Stir-fried rich chili paste mixed with your choice of protein, served with Jasmine rice",
    },
    zh: { name: "泰式辣椒膏炒肉盖饭", desc: "浓郁的泰式辣椒膏翻炒，可自选肉类，配米饭" },
  },
  "ผัดน้ำมันหอย (ข้าว/เส้น)": {
    th: { name: "ผัดน้ำมันหอย (ข้าว/เส้น)", desc: "ผัดด้วยน้ำมันหอยหอมหวาน เลือกเนื้อสัตว์และข้าว/เส้นได้ตามต้องการ" },
    en: {
      name: "Stir-fried with Oyster Sauce (with Rice/Noodles)",
      desc: "Stir-fried with sweet and savory oyster sauce, choose your protein and rice/noodles",
    },
    zh: { name: "蚝油炒肉盖饭/面", desc: "蚝油配以大蒜翻炒，可自选肉类并搭配米饭或面条" },
  },
  "ผัดซีอิ๊ว (เส้นใหญ่)": {
    th: { name: "ผัดซีอิ๊ว (เส้นใหญ่)", desc: "เส้นใหญ่ผัดซีอิ๊วแบบร้านตามสั่ง ปรุงรสกลมกล่อม เสิร์ฟร้อน" },
    en: {
      name: "Stir-fried Soy Sauce Noodles (Wide Noodles)",
      desc: "Stir-fried wide rice noodles with soy sauce and vegetables, seasoned to perfection",
    },
    zh: { name: "泰式酱油炒宽粉", desc: "宽粉与黑酱油和新鲜芥兰大火翻炒，经典街头风味" },
  },
  "ข้าวผัดกระเทียม (ข้าวผัด)": {
    th: { name: "ข้าวผัดกระเทียม (ข้าวผัด)", desc: "ข้าวผัดกลิ่นกระเทียม เจียวจนหอม พร้อมผักและเนื้อสัตว์เลือกได้" },
    en: {
      name: "Garlic Fried Rice",
      desc: "Fried rice infused with garlic aroma, cooked with vegetables and your choice of protein",
    },
    zh: { name: "蒜香炒饭", desc: "充满浓郁蒜香的黄金炒饭，搭配蔬菜和自选肉类" },
  },
  "ผัดผงกะหรี่ (ไก่/หมู)": {
    th: { name: "ผัดผงกะหรี่ (ไก่/หมู)", desc: "ผัดผงกะหรี่รสกลมกล่อม เสิร์ฟพร้อมข้าวร้อนๆ" },
    en: {
      name: "Stir-fried Curry Powder (Chicken/Pork)",
      desc: "Savory stir-fried chicken or pork in a mild yellow curry powder sauce, served with rice",
    },
    zh: { name: "咖喱粉炒肉盖饭（鸡/猪）", desc: "滑蛋咖喱粉翻炒肉类，味道香浓温和，配米饭" },
  },
  "ผัดผักรวม (กับข้าว)": {
    th: { name: "ผัดผักรวม (กับข้าว)", desc: "ผัดผักสดหลากหลาย ปรุงรสอ่อนๆ ทานคู่กับข้าวสวย" },
    en: {
      name: "Stir-fried Mixed Vegetables (A La Carte)",
      desc: "Stir-fried variety of fresh vegetables with mild seasoning, perfect to share",
    },
    zh: { name: "清炒什锦蔬菜（单盘）", desc: "多种新鲜时蔬快火清炒，清淡健康，适合分享" },
  },
  "ผัดพริกแกง (ตามสั่ง)": {
    th: { name: "ผัดพริกแกง (ตามสั่ง)", desc: "ผัดพริกแกงกลมกล่อม สามารถเลือกเป็นหมู ไก่ หรือทะเลได้" },
    en: {
      name: "Stir-fried Chili Curry (Custom)",
      desc: "Savory stir-fried red curry paste, choose from pork, chicken, or seafood, served with rice",
    },
    zh: { name: "红咖喱炒肉盖饭（自选）", desc: "泰式红咖喱与豆角爆炒，口感香辣入味，配米饭" },
  },
  "น้ำเปล่า": {
    th: { name: "น้ำเปล่า", desc: "น้ำดื่มเย็นๆ ขวดเล็ก" },
    en: { name: "Drinking Water", desc: "Cold drinking water, small bottle" },
    zh: { name: "矿泉水", desc: "清凉小瓶装饮用水" },
  },
  "โค้ก (ขวด)": {
    th: { name: "โค้ก (ขวด)", desc: "น้ำอัดลม ซีโร่/ปกติ ตามสต็อก" },
    en: { name: "Coke (Bottle)", desc: "Carbonated soft drink, Sugar Free or Original based on stock" },
    zh: { name: "可口可乐（瓶装）", desc: "冰镇可乐，根据当前库存提供无糖或普通版" },
  },
  "น้ำลำไย": {
    th: { name: "น้ำลำไย", desc: "น้ำลำไยหวานหอม เสิร์ฟเย็น" },
    en: { name: "Longan Juice", desc: "Sweet and fragrant traditional longan juice, served cold" },
    zh: { name: "清甜龙眼水", desc: "传统甜美龙眼果汁，冰凉解暑" },
  },
  "น้ำส้มคั้น": {
    th: { name: "น้ำส้มคั้น", desc: "น้ำส้มคั้นสด หวานอมเปรี้ยว" },
    en: { name: "Orange Juice", desc: "Freshly squeezed orange juice, sweet and tangy" },
    zh: { name: "鲜榨橙汁", desc: "新鲜橙子榨汁，酸甜可口" },
  },
  "เฉาก๊วย": {
    th: { name: "เฉาก๊วย", desc: "เฉาก๊วยเย็นหวานกำลังดี ท็อปด้วยน้ำเชื่อม" },
    en: { name: "Grass Jelly", desc: "Refreshing grass jelly in a perfectly sweet syrup, served cold" },
    zh: { name: "冰镇仙草冻", desc: "口感Q弹的黑色仙草，淋上微甜糖浆" },
  },
  "น้ำแข็งไส": {
    th: { name: "น้ำแข็งไส", desc: "น้ำแข็งไสพร้อมท็อปปิ้งหลากหลาย" },
    en: { name: "Thai Shaved Ice", desc: "Traditional shaved ice served with various sweet toppings and syrup" },
    zh: { name: "泰式刨冰", desc: "细碎的冰沙淋上红绿糖浆和炼乳，搭配各种甜料" },
  },
  "กระเพราหมูกรอบ (ข้าวราด)": {
    th: {
      name: "กระเพราหมูกรอบ (ข้าวราด)",
      desc: "กระเพราหมูกรอบหนังสามชั้นกรอบนอกนุ่มใน ผัดใบกระเพราแท้รสจัดจ้าน เสิร์ฟราดข้าวหอมมะลิร้อนๆ",
    },
    en: {
      name: "Crispy Pork Basil (with Rice)",
      desc: "Crispy pork belly stir-fried with authentic spicy basil leaves, served over hot Jasmine rice",
    },
    zh: { name: "罗勒脆皮猪肉盖饭", desc: "金黄酥脆的五花肉与辣椒和罗勒叶爆炒，香辣诱人" },
  },
  "ผัดคะน้าหมูกรอบ (ข้าวราด)": {
    th: {
      name: "ผัดคะน้าหมูกรอบ (ข้าวราด)",
      desc: "ผัดคะน้าใบเขียวสดกรอบกับหมูกรอบสามชั้น ปรุงรสกลมกล่อม ราดข้าวหอมมะลิร้อนๆ",
    },
    en: {
      name: "Stir-fried Chinese Broccoli with Crispy Pork",
      desc: "Stir-fried crisp Chinese broccoli and crispy pork belly, served over Jasmine rice",
    },
    zh: { name: "芥兰炒脆皮猪肉盖饭", desc: "爽脆的芥兰与肥美多汁的脆皮五花肉大火翻炒，咸香下饭" },
  },
  "ผัดพริกแกงหมูกรอบ (ข้าวราด)": {
    th: {
      name: "ผัดพริกแกงหมูกรอบ (ข้าวราด)",
      desc: "พริกแกงรสเข้มข้นผัดคลุกเคล้ากับหมูกรอบและถั่วฝักยาว ราดข้าวหอมมะลิร้อนๆ",
    },
    en: {
      name: "Stir-fried Red Curry with Crispy Pork",
      desc: "Rich and intense red curry paste stir-fried with crispy pork belly and long green beans, served over Jasmine rice",
    },
    zh: { name: "红咖喱脆皮猪肉盖饭", desc: "香浓的红咖喱酱爆炒脆皮猪肉与爽口豇豆，辣劲十足" },
  },
  "กระเทียมพริกไทยหมูชิ้น (ข้าวราด)": {
    th: { name: "กระเทียมพริกไทยหมูชิ้น (ข้าวราด)", desc: "หมูชิ้นนุ่มๆ ผัดซอสกระเทียมพริกไทยรสเข้มข้น หอมกระเทียมเจียว ราดข้าว" },
    en: {
      name: "Garlic Pepper Sliced Pork",
      desc: "Tender sliced pork stir-fried with rich garlic pepper sauce, topped with fragrant fried garlic",
    },
    zh: { name: "蒜香胡椒猪肉片盖饭", desc: "滑嫩的猪肉片融入浓郁的蒜香胡椒酱翻炒，洒上金黄蒜末" },
  },
  "ผัดผงกะหรี่ทะเล (ข้าวราด)": {
    th: { name: "ผัดผงกะหรี่ทะเล (ข้าวราด)", desc: "เนื้อกุ้งและปลาหมึกสดผัดผงกะหรี่เข้มข้น ไข่นุ่มละมุนลิ้น ราดข้าวหอมมะลิ" },
    en: {
      name: "Stir-fried Curry Powder Seafood",
      desc: "Fresh shrimp and squid stir-fried in rich curry powder with smooth, soft eggs, served over Jasmine rice",
    },
    zh: { name: "咖喱粉炒海鲜盖饭", desc: "新鲜大虾和鱿鱼与滑嫩滑蛋、洋葱翻炒在金黄咖喱粉中" },
  },
  "คั่วพริกแกงเนื้อ (ข้าวราด)": {
    th: {
      name: "คั่วพริกแกงเนื้อ (ข้าวราด)",
      desc: "เนื้อวัวเกรดดีผัดคั่วพริกแกงตำมือ รสจัดจ้านถึงใจ สมุนไพรไทยครบเครื่อง ราดข้าว",
    },
    en: {
      name: "Stir-fried Beef Red Curry",
      desc: "Premium grade beef stir-fried with hand-ground red curry paste, spicy and aromatic with Thai herbs",
    },
    zh: { name: "干炒红咖喱牛肉盖饭", desc: "优质牛肉片与手捣红咖喱干煸，带有浓郁泰国香草气味" },
  },
  "ผัดซีอิ๊วเส้นใหญ่หมูกรอบ": {
    th: { name: "ผัดซีอิ๊วเส้นใหญ่หมูกรอบ", desc: "เส้นใหญ่เหนียวนุ่มผัดซีอิ๊วดำหอมกลิ่นกระทะ คลุกเคล้ากับหมูกรอบและคะน้าสด" },
    en: {
      name: "Stir-fried Wide Noodles with Crispy Pork",
      desc: "Soft and chewy wide rice noodles stir-fried with dark soy sauce, crispy pork belly, and fresh Chinese broccoli",
    },
    zh: { name: "脆皮五花肉炒宽粉", desc: "宽大面条快火爆炒，裹满黑酱油酱汁，搭配香脆猪肉" },
  },
  "มาม่าผัดคั่วพริกแกงกุ้ง": {
    th: { name: "มาม่าผัดคั่วพริกแกงกุ้ง", desc: "เส้นมาม่าเหนียวนุ่มผัดซอสพริกแกงเข้มข้นและกุ้งสดเด้งๆ สมุนไพรหอมกรุ่น" },
    en: {
      name: "Stir-fried Instant Noodles with Red Curry and Shrimp",
      desc: "Soft chewy instant noodles stir-fried with rich red curry sauce, bouncy fresh shrimp, and fragrant herbs",
    },
    zh: { name: "红咖喱鲜虾炒方便面", desc: "方便面与香辣红咖喱、Q弹鲜虾以及柠檬叶等香草热辣爆炒" },
  },
  "ผัดพริกเผาหอยลาย (ข้าวราด)": {
    th: { name: "ผัดพริกเผาหอยลาย (ข้าวราด)", desc: "หอยลายสดผัดน้ำพริกเผาสูตรเด็ด รสชาติหวานเค็มเผ็ดลงตัว หอมใบโหระพา ราดข้าว" },
    en: {
      name: "Stir-fried Chili Paste Clams",
      desc: "Fresh clams stir-fried with special sweet chili paste, sweet and savory with fragrant basil leaves, served over rice",
    },
    zh: { name: "辣椒膏炒蛤蜊盖饭", desc: "鲜活蛤蜊搭配秘制甜辣酱及九层塔快炒，鲜美多汁，配米饭" },
  },
  "ผัดผักรวมมิตร (ข้าวราด / มังสวิรัติ)": {
    th: {
      name: "ผัดผักรวมมิตร (ข้าวราด / มังสวิรัติ)",
      desc: "ผัดผักสดรวมมิตรรสชาติเบาๆ สุขภาพดี ปรุงด้วยซีอิ๊วขาวและน้ำมันหอยสูตรเจ ราดข้าว",
    },
    en: {
      name: "Stir-fried Mixed Vegetables (Vegetarian)",
      desc: "Healthy, light-flavored stir-fried fresh mixed vegetables, seasoned with light soy sauce and vegetarian sauce, served with rice",
    },
    zh: { name: "清炒什锦蔬菜盖饭（素食）", desc: "清脆蔬菜快炒，少油低脂，采用素食酱油调味，配米饭" },
  },
  "ข้าวต้ม": {
    th: { name: "ข้าวต้ม", desc: "ข้าวต้มร้อนๆ ปรุงรสกลมกล่อม ทานง่ายสบายท้อง" },
    en: { name: "Thai Rice Soup", desc: "Hot and comforting Thai style rice soup, gently seasoned" },
    zh: { name: "泰式泡饭", desc: "热气腾腾的泰式泡饭，清淡开胃" },
  },
  "ข้าวมันไก่": {
    th: { name: "ข้าวมันไก่", desc: "ข้าวมันไก่ต้มเนื้อนุ่ม เสิร์ฟพร้อมข้าวมันหอมๆ และน้ำจิ้มสูตรเด็ด" },
    en: { name: "Hainanese Chicken Rice", desc: "Tender boiled chicken served with fragrant seasoned rice and savory dipping sauce" },
    zh: { name: "海南鸡饭", desc: "鲜嫩白斩鸡配以香气四溢的鸡油饭和秘制蘸酱" },
  },
  "ข้าวซอย": {
    th: { name: "ข้าวซอย", desc: "ข้าวซอยเส้นนุ่มในน้ำแกงกะหรี่เข้มข้น ท็อปด้วยหมี่กรอบรสชาติเหนือแท้ๆ" },
    en: { name: "Khao Soi (Northern Curry Noodles)", desc: "Soft egg noodles in rich yellow curry broth, topped with crispy noodles" },
    zh: { name: "泰北金面", desc: "浓郁黄咖喱椰奶汤底配以软面条，上覆香脆炸面" },
  },
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLangState] = useState<Language>("th");
  const [loadingLanguages, setLoadingLanguages] = useState<Record<string, boolean>>({});
  const [localCache, setLocalCache] = useState<Record<string, string>>(dynamicCache);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedLang = localStorage.getItem("ran-lung-get-lang") as Language;
      if (savedLang === "th" || savedLang === "en" || savedLang === "zh") {
        setLangState(savedLang);
      }
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLangState(lang);
    if (typeof window !== "undefined") {
      localStorage.setItem("ran-lung-get-lang", lang);
    }
  };

  // Base translation helper for general UI elements
  const t = (key: string): string => {
    if (language === "th") return key;
    const entry = uiDictionary[key];
    if (entry && entry[language]) {
      return entry[language];
    }

    // Try dynamic translation cache (UI keys use format "<lang>:<key>")
    const cacheKey = `${language}:${key}`;
    if (localCache[cacheKey]) {
      return localCache[cacheKey];
    }

    // Attempt dynamic translation in background
    triggerAsyncTranslation(key, "ui");

    return key;
  };

  // Translation helper for Menus (returns name or description)
  // Uses field-qualified cache keys: "<lang>:name:<text>" and "<lang>:desc:<text>"
  // so that name and description for new items never collide in the cache.
  const tMenu = (text: string, field: "name" | "desc" = "name"): string => {
    if (language === "th") return text;

    // 1. Look up by exact Thai name key in the static dictionary
    let foundEntry = menuDictionary[text];

    // 2. For "desc" lookups, find the entry whose Thai desc matches
    if (!foundEntry && field === "desc") {
      const matchedName = Object.keys(menuDictionary).find(
        (k) => menuDictionary[k].th.desc === text
      );
      if (matchedName) foundEntry = menuDictionary[matchedName];
    }

    if (foundEntry && foundEntry[language]) {
      return foundEntry[language][field];
    }

    // 3. Not in static dictionary — use field-qualified dynamic cache
    const cacheKey = `${language}:${field}:${text}`;
    if (localCache[cacheKey]) {
      return localCache[cacheKey];
    }

    // 4. Fire async translation (returns original text until done, then re-renders)
    triggerAsyncTranslation(text, field);

    return text;
  };

  // Triggers API translation in background and stores result in state (causing re-render)
  const triggerAsyncTranslation = async (text: string, field: "name" | "desc" | "ui" = "ui") => {
    if (!text.trim() || language === "th") return;
    const cacheKey = field === "ui" ? `${language}:${text}` : `${language}:${field}:${text}`;

    if (localCache[cacheKey] || loadingLanguages[cacheKey]) return;

    setLoadingLanguages((prev) => ({ ...prev, [cacheKey]: true }));

    try {
      console.log(`[i18n] Translating (${field}) to ${language}:`, text);
      const res = await translateApi({
        data: {
          text,
          sourceLang: "auto",
          targetLang: language,
        },
      });

      if (res && res.translatedText) {
        const updatedCache = { ...dynamicCache, ...localCache, [cacheKey]: res.translatedText };
        dynamicCache = updatedCache;
        setLocalCache(updatedCache);
        if (typeof window !== "undefined") {
          localStorage.setItem(dynamicCacheKey, JSON.stringify(updatedCache));
        }
      }
    } catch (err) {
      console.warn(`[i18n] Dynamic translation failed for: ${text}`, err);
    } finally {
      setLoadingLanguages((prev) => ({ ...prev, [cacheKey]: false }));
    }
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, tMenu, loadingLanguages }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};

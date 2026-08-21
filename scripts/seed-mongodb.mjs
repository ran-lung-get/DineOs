import { MongoClient } from "mongodb";
import fs from "fs";
import path from "path";
import dns from "node:dns";

// Fix Windows SRV DNS resolution for MongoDB Atlas
try {
  dns.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4"]);
} catch (e) {
  // ignore
}

// Load .env manually without extra dependencies
const envPath = path.resolve(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const idx = trimmed.indexOf("=");
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim();
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME || "dineos_db";

if (!uri || uri.includes("<password>") || uri.includes("YOUR_MONGODB_URI") || uri.includes("cluster0.xxxxx")) {
  console.log("ℹ️ MONGODB_URI ยังไม่ได้ตั้งค่าจริงใน .env (กำลังรอ Connection String จากผู้ใช้)");
  console.log("💡 หลังจากสร้าง MongoDB Cluster และนำ URI มาใส่ใน .env แล้ว ให้รันคำสั่ง 'npm run db:seed:mongo' อีกครั้ง");
  process.exit(0);
}

const defaultTables = [
  { id: "1", label: "โต๊ะ 1", status: "available", capacity: 4, table_type: "dine-in" },
  { id: "2", label: "โต๊ะ 2", status: "available", capacity: 4, table_type: "dine-in" },
  { id: "3", label: "โต๊ะ 3", status: "available", capacity: 4, table_type: "dine-in" },
  { id: "4", label: "โต๊ะ 4", status: "available", capacity: 4, table_type: "dine-in" },
  { id: "5", label: "โต๊ะ 5", status: "available", capacity: 4, table_type: "dine-in" },
  { id: "6", label: "โต๊ะ 6", status: "available", capacity: 4, table_type: "dine-in" },
  { id: "7", label: "โต๊ะ 7", status: "available", capacity: 4, table_type: "dine-in" },
  { id: "8", label: "โต๊ะ 8", status: "available", capacity: 4, table_type: "dine-in" },
  { id: "9", label: "โต๊ะ 9 (Walk-in)", status: "available", capacity: 2, table_type: "walk-in" },
  { id: "10", label: "โต๊ะ 10 (Walk-in)", status: "available", capacity: 2, table_type: "walk-in" },
];

const defaultIngredients = [
  { id: "mock-1", name: "หมูสับ", quantity: 5000, unit: "กรัม", min_threshold: 500, cost_per_unit: 0.18, is_active: true, status: "in_stock" },
  { id: "mock-2", name: "หมูกรอบ", quantity: 3000, unit: "กรัม", min_threshold: 400, cost_per_unit: 0.35, is_active: true, status: "in_stock" },
  { id: "mock-3", name: "หมูชิ้น", quantity: 4000, unit: "กรัม", min_threshold: 500, cost_per_unit: 0.20, is_active: true, status: "in_stock" },
  { id: "mock-4", name: "ไก่สับ", quantity: 3500, unit: "กรัม", min_threshold: 400, cost_per_unit: 0.15, is_active: true, status: "in_stock" },
  { id: "mock-5", name: "ไก่ต้ม", quantity: 2500, unit: "กรัม", min_threshold: 300, cost_per_unit: 0.16, is_active: true, status: "in_stock" },
  { id: "mock-6", name: "เนื้อวัว", quantity: 2000, unit: "กรัม", min_threshold: 300, cost_per_unit: 0.45, is_active: true, status: "in_stock" },
  { id: "mock-7", name: "ปลาหมึก", quantity: 2500, unit: "กรัม", min_threshold: 300, cost_per_unit: 0.38, is_active: true, status: "in_stock" },
  { id: "mock-8", name: "กุ้งสด", quantity: 3000, unit: "กรัม", min_threshold: 400, cost_per_unit: 0.40, is_active: true, status: "in_stock" },
  { id: "mock-9", name: "หอยลาย", quantity: 2000, unit: "กรัม", min_threshold: 300, cost_per_unit: 0.25, is_active: true, status: "in_stock" },
  { id: "mock-10", name: "ไข่ไก่", quantity: 150, unit: "ฟอง", min_threshold: 20, cost_per_unit: 4.5, is_active: true, status: "in_stock" },
  { id: "mock-11", name: "ไส้กรอก", quantity: 80, unit: "ชิ้น", min_threshold: 15, cost_per_unit: 8.0, is_active: true, status: "in_stock" },
  { id: "mock-12", name: "กุนเชียง", quantity: 70, unit: "ชิ้น", min_threshold: 15, cost_per_unit: 10.0, is_active: true, status: "in_stock" },
];

async function main() {
  console.log(`🔌 กำลังเชื่อมต่อไปยัง MongoDB: ${dbName}...`);
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("✅ เชื่อมต่อ MongoDB สำเร็จ!");
    const db = client.db(dbName);

    // 1. Tables
    console.log("📦 กำลังเตรียม Collections: restaurant_tables...");
    for (const tbl of defaultTables) {
      await db.collection("restaurant_tables").updateOne(
        { id: tbl.id },
        { $set: { ...tbl, updated_at: new Date().toISOString() } },
        { upsert: true }
      );
    }

    // 2. Ingredients
    console.log("📦 กำลังเตรียม Collections: ingredients...");
    for (const ing of defaultIngredients) {
      await db.collection("ingredients").updateOne(
        { id: ing.id },
        { $set: { ...ing, updated_at: new Date().toISOString() } },
        { upsert: true }
      );
    }

    console.log("\n🎉 เริ่มต้นฐานข้อมูล MongoDB สำหรับ Dineos เสร็จสมบูรณ์!");
  } catch (error) {
    console.error("❌ เกิดข้อผิดพลาด:", error);
  } finally {
    await client.close();
  }
}

main();

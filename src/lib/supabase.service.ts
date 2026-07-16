import { supabase } from "./supabase";
import type { UserRow, CustomerRow } from "./supabase.types";
import type { LiffProfile } from "./liff";
import type { User as SupabaseAuthUser } from "@supabase/supabase-js";

// ─────────────────────────────────────────────────────────────
// User Service — จัดการข้อมูล users table
// ─────────────────────────────────────────────────────────────

/**
 * Upsert ข้อมูลผู้ใช้จาก LINE profile
 * ถ้ามีอยู่แล้ว → อัปเดต display_name, picture_url, last_login_at
 * ถ้าใหม่ → สร้าง record ใหม่
 */
export async function upsertUser(profile: LiffProfile): Promise<UserRow> {
  const now = new Date().toISOString();

  // ใช้ any cast เพราะ Supabase SDK ต้องการ typed schema generation
  // ซึ่งในโปรเจกต์นี้ใช้ manual type ผ่าน supabase.types.ts แทน
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client = supabase as any;

  const { data, error } = await client
    .from("users")
    .upsert(
      {
        line_user_id: profile.userId,
        display_name: profile.displayName,
        picture_url: profile.pictureUrl ?? null,
        status_message: profile.statusMessage ?? null,
        is_active: true,
        updated_at: now,
        last_login_at: now,
      },
      {
        onConflict: "line_user_id",
        ignoreDuplicates: false,
      }
    )
    .select()
    .single();

  if (error) {
    console.error("[Supabase] upsertUser error:", error);
    throw error;
  }

  return data as UserRow;
}

/**
 * ดึงข้อมูล user จาก line_user_id
 */
export async function getUserByLineId(lineUserId: string): Promise<UserRow | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client = supabase as any;

  const { data, error } = await client
    .from("users")
    .select("*")
    .eq("line_user_id", lineUserId)
    .maybeSingle();

  if (error) {
    console.error("[Supabase] getUserByLineId error:", error);
    throw error;
  }

  return data as UserRow | null;
}

// ─────────────────────────────────────────────────────────────
// Customer Service — จัดการข้อมูล customers table
// ─────────────────────────────────────────────────────────────

/**
 * Upsert ข้อมูลลูกค้า — สร้าง/อัปเดต customer profile ที่ผูกกับ user
 */
export async function upsertCustomer(
  user: UserRow,
  extra?: {
    phone?: string;
    email?: string;
    default_address?: string;
    default_address_type?: "home" | "work" | "dorm";
    notes?: string;
  }
): Promise<CustomerRow> {
  const now = new Date().toISOString();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client = supabase as any;

  const { data, error } = await client
    .from("customers")
    .upsert(
      {
        user_id: user.id,
        line_user_id: user.line_user_id,
        display_name: user.display_name,
        updated_at: now,
        ...(extra?.phone !== undefined && { phone: extra.phone }),
        ...(extra?.email !== undefined && { email: extra.email }),
        ...(extra?.default_address !== undefined && { default_address: extra.default_address }),
        ...(extra?.default_address_type !== undefined && { default_address_type: extra.default_address_type }),
        ...(extra?.notes !== undefined && { notes: extra.notes }),
      },
      {
        onConflict: "line_user_id",
        ignoreDuplicates: false,
      }
    )
    .select()
    .single();

  if (error) {
    console.error("[Supabase] upsertCustomer error:", error);
    throw error;
  }

  return data as CustomerRow;
}

/**
 * ดึงข้อมูลลูกค้าจาก line_user_id
 */
export async function getCustomerByLineId(lineUserId: string): Promise<CustomerRow | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client = supabase as any;

  const { data, error } = await client
    .from("customers")
    .select("*")
    .eq("line_user_id", lineUserId)
    .maybeSingle();

  if (error) {
    console.error("[Supabase] getCustomerByLineId error:", error);
    throw error;
  }

  return data as CustomerRow | null;
}

/**
 * อัปเดตยอดซื้อสะสมของลูกค้าหลังจากสั่งอาหาร
 */
export async function incrementCustomerStats(
  lineUserId: string,
  orderTotal: number
): Promise<void> {
  const customer = await getCustomerByLineId(lineUserId);
  if (!customer) return;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client = supabase as any;

  const { error } = await client
    .from("customers")
    .update({
      total_orders: customer.total_orders + 1,
      total_spent: customer.total_spent + orderTotal,
      updated_at: new Date().toISOString(),
    })
    .eq("line_user_id", lineUserId);

  if (error) {
    console.error("[Supabase] incrementCustomerStats error:", error);
    throw error;
  }
}

// ─────────────────────────────────────────────────────────────
// Login Flow — เรียกทั้งสองพร้อมกัน
// ─────────────────────────────────────────────────────────────

/**
 * เรียกใช้หลังจาก LINE login สำเร็จ:
 * 1. Upsert user record
 * 2. Upsert customer record
 * คืนค่า { user, customer }
 */
export async function syncLineUserToSupabase(profile: LiffProfile): Promise<{
  user: UserRow;
  customer: CustomerRow;
}> {
  const user = await upsertUser(profile);
  const customer = await upsertCustomer(user);
  return { user, customer };
}

/**
 * เรียกใช้หลังจาก Email/Password หรือ Google login สำเร็จ:
 * 1. Upsert user record โดยใช้ auth_user_id
 * 2. Upsert customer record
 * คืนค่า { user, customer }
 */
export async function syncAuthUserToSupabase(authUser: SupabaseAuthUser): Promise<{
  user: UserRow;
  customer: CustomerRow;
}> {
  const now = new Date().toISOString();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client = supabase as any;

  // 1. Check if user already exists to preserve their role
  const { data: existingUser } = await client
    .from("users")
    .select("role, is_active")
    .eq("auth_user_id", authUser.id)
    .maybeSingle();

  const userRole = existingUser?.role || authUser.user_metadata?.role || "customer";

  let isActive = true;
  if (existingUser) {
    isActive = existingUser.is_active !== false;
  } else {
    isActive = (userRole === "admin" || userRole === "captain" || userRole === "staff") ? false : true;
  }

  // 2. Upsert User
  const displayName = authUser.user_metadata?.full_name || authUser.email?.split("@")[0] || "User";
  const { data: dbUser, error: userError } = await client
    .from("users")
    .upsert(
      {
        auth_user_id: authUser.id,
        display_name: displayName,
        email: authUser.email,
        picture_url: authUser.user_metadata?.avatar_url ?? null,
        role: userRole,
        is_active: isActive,
        updated_at: now,
        last_login_at: now,
      },
      {
        onConflict: "auth_user_id",
        ignoreDuplicates: false,
      }
    )
    .select()
    .single();

  if (userError) {
    console.error("[Supabase] syncAuthUserToSupabase (users) error:", userError);
    throw userError;
  }

  // 2. Upsert Customer
  const { data: dbCustomer, error: custError } = await client
    .from("customers")
    .upsert(
      {
        user_id: dbUser.id,
        auth_user_id: authUser.id,
        display_name: dbUser.display_name,
        email: dbUser.email,
        updated_at: now,
      },
      {
        onConflict: "auth_user_id",
        ignoreDuplicates: false,
      }
    )
    .select()
    .single();

  if (custError) {
    console.error("[Supabase] syncAuthUserToSupabase (customers) error:", custError);
    throw custError;
  }

  return { user: dbUser as UserRow, customer: dbCustomer as CustomerRow };
}

/**
 * ดึงรายการวัตถุดิบทั้งหมดจาก Supabase
 */
export async function getIngredients() {
  const client = supabase as any;
  const { data, error } = await client
    .from("ingredients")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    console.error("[Supabase] getIngredients error:", error);
    throw error;
  }
  return data;
}

/**
 * อัปเดตปริมาณวัตถุดิบในสต็อก
 */
export async function updateIngredientStock(id: string, quantity: number, name?: string, unit?: string, minThreshold?: number) {
  const client = supabase as any;
  const updates: any = { quantity, updated_at: new Date().toISOString() };
  if (name !== undefined) updates.name = name;
  if (unit !== undefined) updates.unit = unit;
  if (minThreshold !== undefined) updates.min_threshold = minThreshold;

  const { data, error } = await client
    .from("ingredients")
    .update(updates)
    .eq("id", id)
    .select();

  if (error) {
    console.error("[Supabase] updateIngredientStock error:", error);
    throw error;
  }
  return data;
}

/**
 * เพิ่มวัตถุดิบใหม่เข้าระบบ
 */
export async function addIngredient(name: string, quantity: number, unit: string, minThreshold: number) {
  const client = supabase as any;
  const { data, error } = await client
    .from("ingredients")
    .insert({
      name,
      quantity,
      unit,
      min_threshold: minThreshold,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select();

  if (error) {
    console.error("[Supabase] addIngredient error:", error);
    throw error;
  }
  return data;
}

/**
 * ลบวัตถุดิบออกจากระบบ
 */
export async function deleteIngredient(id: string) {
  const client = supabase as any;
  const { error } = await client
    .from("ingredients")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("[Supabase] deleteIngredient error:", error);
    throw error;
  }
}

/**
 * ปรับปรุงสต็อกวัตถุดิบอัตโนมัติตามเมนูและตัวเลือกในออเดอร์
 */
export async function adjustStockFromOrder(
  orderItems: { name: string; qty: number }[],
  direction: "deduct" | "add"
) {
  try {
    const client = supabase as any;
    
    // ดึงวัตถุดิบทั้งหมดที่มีอยู่ในระบบ
    const { data: ingredients, error: ingError } = await client
      .from("ingredients")
      .select("*");
      
    if (ingError || !ingredients) {
      console.error("[adjustStockFromOrder] failed to fetch ingredients:", ingError);
      return;
    }

    const coefficient = direction === "deduct" ? -1 : 1;

    for (const item of orderItems) {
      const name = item.name;
      const qty = item.qty;
      const updates: { id: string; newQty: number }[] = [];

      // 1. ตรวจสอบเนื้อสัตว์ / วัตถุดิบหลักในชื่อเมนู
      const proteins = [
        { key: "หมูสับ", name: "หมูสับ", req: 120 },
        { key: "หมูกรอบ", name: "หมูกรอบ", req: 100 },
        { key: "หมูชิ้น", name: "หมูชิ้น", req: 120 },
        { key: "ไก่สับ", name: "ไก่สับ", req: 120 },
        { key: "ไก่ต้ม", name: "ไก่ต้ม", req: 100 },
        { key: "เนื้อ", name: "เนื้อ", req: 120 },
        { key: "หมึก", name: "หมึก", req: 120 },
        { key: "กุ้ง", name: "กุ้ง", req: 120 },
        { key: "หอยลาย", name: "หอยลาย", req: 120 }
      ];

      for (const p of proteins) {
        if (name.includes(p.key)) {
          const ing = ingredients.find((i: any) => i.name === p.name);
          if (ing) {
            const change = p.req * qty * coefficient;
            updates.push({ id: ing.id, newQty: Math.max(0, Number(ing.quantity) + change) });
          }
        }
      }

      // 2. ตรวจสอบท็อปปิ้งไข่ (ไข่ดาว ไข่เจียว ไข่ต้ม)
      if (name.includes("ไข่ดาว") || name.includes("ไข่เจียว") || name.includes("ไข่ต้ม")) {
        const ing = ingredients.find((i: any) => i.name === "ไข่ไก่");
        if (ing) {
          const change = 1 * qty * coefficient;
          updates.push({ id: ing.id, newQty: Math.max(0, Number(ing.quantity) + change) });
        }
      }

      // 3. ตรวจสอบไส้กรอก
      if (name.includes("ไส้กรอก")) {
        const ing = ingredients.find((i: any) => i.name === "ไส้กรอก");
        if (ing) {
          const change = 1 * qty * coefficient;
          updates.push({ id: ing.id, newQty: Math.max(0, Number(ing.quantity) + change) });
        }
      }

      // 4. ตรวจสอบกุนเชียง
      if (name.includes("กุนเชียง")) {
        const ing = ingredients.find((i: any) => i.name === "กุนเชียง");
        if (ing) {
          const change = 1 * qty * coefficient;
          updates.push({ id: ing.id, newQty: Math.max(0, Number(ing.quantity) + change) });
        }
      }

      // ทำการอัปเดตค่ากลับลงฐานข้อมูล
      for (const update of updates) {
        await client
          .from("ingredients")
          .update({ quantity: update.newQty, updated_at: new Date().toISOString() })
          .eq("id", update.id);
      }
    }
  } catch (err) {
    console.error("[adjustStockFromOrder] Exception:", err);
  }
}


// ─────────────────────────────────────────────────────────────
// Store Settings
// ─────────────────────────────────────────────────────────────

export async function getNextQueueNumber(): Promise<number> {
  try {
    // get current
    const { data } = await supabase.from("store_settings").select("value").eq("id", "takeaway_queue").single();
    let current = 1;
    if (data && data.value && data.value.counter) {
      current = data.value.counter;
    }
    const nextQueue = current + 1;
    await supabase.from("store_settings").upsert({ 
      id: "takeaway_queue", 
      value: { counter: nextQueue },
      updated_at: new Date().toISOString()
    });
    return current;
  } catch (err) {
    console.error("Queue counter failed:", err);
    return Date.now() % 1000;
  }
}

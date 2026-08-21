import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getMongoDb } from "../mongodb";

// ─────────────────────────────────────────────────────────────
// MongoDB Authentication & User Functions
// ─────────────────────────────────────────────────────────────

export const mongoLogin = createServerFn({ method: "POST" })
  .validator(
    z.object({
      email: z.string().email(),
      password: z.string(),
    }),
  )
  .handler(async ({ data }) => {
    const db = await getMongoDb();
    if (!db) {
      // Offline / Local fallback: allow admin/staff test credentials
      if (
        data.email === "admin@dineos.app" ||
        data.email === "staff@dineos.app" ||
        data.email === "customer@dineos.app" ||
        data.email === "admin@epicurean.com" ||
        data.email === "staff@epicurean.com" ||
        data.email === "customer@epicurean.com"
      ) {
        const role = data.email.split("@")[0].includes("admin")
          ? "admin"
          : data.email.split("@")[0].includes("staff")
            ? "staff"
            : "customer";
        return {
          success: true,
          user: {
            id: `local-${role}-1`,
            email: data.email,
            role,
            fullName: role.toUpperCase(),
            isActive: true,
          },
          message: "Login successful (local fallback)",
        };
      }
      return { success: false, message: "MongoDB not connected" };
    }

    try {
      const user = await db.collection("users").findOne({ email: data.email.toLowerCase() });
      if (!user) {
        return { success: false, message: "ไม่พบบัญชีผู้ใช้งานนี้ในระบบ" };
      }

      if (user.password !== data.password) {
        return { success: false, message: "รหัสผ่านไม่ถูกต้อง" };
      }

      // Admin is always active by default
      const isAdmin = user.role === "admin";
      if (!isAdmin && user.is_active === false) {
        return { success: false, message: "บัญชีนี้ยังไม่ได้รับการอนุมัติจากผู้ดูแลระบบ" };
      }

      if (isAdmin && user.is_active === false) {
        // Auto-fix status for admin
        await db.collection("users").updateOne(
          { _id: user._id },
          { $set: { is_active: true, updated_at: new Date().toISOString() } }
        );
      }

      return {
        success: true,
        user: {
          id: user._id.toString(),
          email: user.email,
          role: user.role || "customer",
          fullName: user.full_name || user.fullName || user.email.split("@")[0],
          isActive: true,
        },
      };
    } catch (err: any) {
      console.error("[MongoDB Auth] Login error:", err);
      return { success: false, message: err?.message || "เกิดข้อผิดพลาดในการเข้าสู่ระบบ" };
    }
  });

export const mongoRegister = createServerFn({ method: "POST" })
  .validator(
    z.object({
      email: z.string().email(),
      password: z.string().min(6),
      fullName: z.string().min(1),
      phone: z.string().optional(),
      role: z.enum(["customer", "staff", "admin"]).default("customer"),
    }),
  )
  .handler(async ({ data }) => {
    const db = await getMongoDb();
    if (!db) {
      return {
        success: true,
        user: {
          id: `local-${Date.now()}`,
          email: data.email,
          role: data.role,
          fullName: data.fullName,
          isActive: true,
        },
        message: "Registered (local mode)",
      };
    }

    try {
      const existing = await db.collection("users").findOne({ email: data.email.toLowerCase() });
      if (existing) {
        return { success: false, message: "อีเมลนี้มีอยู่ในระบบแล้ว" };
      }

      const now = new Date().toISOString();
      // Admin and Customer are active immediately. Only Staff needs approval.
      const isActive = data.role === "admin" || data.role === "customer";

      const newUserDoc = {
        email: data.email.toLowerCase(),
        password: data.password,
        full_name: data.fullName,
        phone: data.phone || "",
        role: data.role,
        is_active: isActive,
        created_at: now,
        updated_at: now,
      };

      const result = await db.collection("users").insertOne(newUserDoc);
      const userId = result.insertedId.toString();

      // Create customer profile if role is customer
      if (data.role === "customer") {
        await db.collection("customers").insertOne({
          user_id: userId,
          full_name: data.fullName,
          phone: data.phone || "",
          total_orders: 0,
          created_at: now,
        });
      }

      return {
        success: true,
        user: {
          id: userId,
          email: data.email,
          role: data.role,
          fullName: data.fullName,
          isActive,
        },
        message: isActive
          ? "สมัครสมาชิกสำเร็จ"
          : "ลงทะเบียนสำเร็จ กรุณารอผู้ดูแลระบบอนุมัติการใช้งาน",
      };
    } catch (err: any) {
      console.error("[MongoDB Auth] Register error:", err);
      return { success: false, message: err?.message || "เกิดข้อผิดพลาดในการลงทะเบียน" };
    }
  });

// ─────────────────────────────────────────────────────────────
// Google Authentication in MongoDB
// ─────────────────────────────────────────────────────────────
export const mongoGoogleAuth = createServerFn({ method: "POST" })
  .validator(
    z.object({
      email: z.string().email(),
      fullName: z.string(),
      avatarUrl: z.string().optional().nullable(),
      googleId: z.string().optional().nullable(),
      idToken: z.string().optional().nullable(),
    }),
  )
  .handler(async ({ data }) => {
    const db = await getMongoDb();
    const now = new Date().toISOString();

    if (!db) {
      return {
        success: true,
        user: {
          id: `google-${Date.now()}`,
          email: data.email,
          fullName: data.fullName,
          role: "customer" as const,
          avatarUrl: data.avatarUrl || null,
          isActive: true,
        },
        message: "เข้าสู่ระบบด้วย Google สำเร็จ (Local Mode)",
      };
    }

    try {
      // Find user by email or google_id
      const query = data.googleId
        ? { $or: [{ email: data.email.toLowerCase() }, { google_id: data.googleId }] }
        : { email: data.email.toLowerCase() };

      const existingUser = await db.collection("users").findOne(query);

      if (existingUser) {
        if (existingUser.is_active === false) {
          return {
            success: false,
            message: "บัญชีของคุณถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลระบบ",
          };
        }

        // Update latest Google profile information
        await db.collection("users").updateOne(
          { _id: existingUser._id },
          {
            $set: {
              avatar_url: data.avatarUrl || existingUser.avatar_url,
              google_id: data.googleId || existingUser.google_id,
              last_login_at: now,
              updated_at: now,
            },
          },
        );

        return {
          success: true,
          user: {
            id: existingUser._id.toString(),
            email: existingUser.email,
            role: existingUser.role || "customer",
            fullName: existingUser.full_name || existingUser.fullName || data.fullName,
            avatarUrl: data.avatarUrl || existingUser.avatar_url,
            isActive: existingUser.is_active ?? true,
          },
          message: `ยินดีต้อนรับกลับ, ${existingUser.full_name || data.fullName}!`,
        };
      }

      // New Google User Registration
      const newUserDoc = {
        email: data.email.toLowerCase(),
        full_name: data.fullName,
        avatar_url: data.avatarUrl || null,
        google_id: data.googleId || null,
        role: "customer",
        auth_provider: "google",
        is_active: true,
        created_at: now,
        updated_at: now,
        last_login_at: now,
      };

      const result = await db.collection("users").insertOne(newUserDoc);
      const newUserId = result.insertedId.toString();

      // Create matching customer document
      await db.collection("customers").insertOne({
        user_id: newUserId,
        full_name: data.fullName,
        avatar_url: data.avatarUrl || null,
        email: data.email.toLowerCase(),
        total_orders: 0,
        created_at: now,
      });

      return {
        success: true,
        user: {
          id: newUserId,
          email: data.email,
          role: "customer" as const,
          fullName: data.fullName,
          avatarUrl: data.avatarUrl || null,
          isActive: true,
        },
        message: `ยินดีต้อนรับ ${data.fullName}! เข้าสู่ระบบด้วย Google สำเร็จ`,
      };
    } catch (err: any) {
      console.error("[MongoDB Google Auth] Error:", err);
      return { success: false, message: err?.message || "เกิดข้อผิดพลาดในการยืนยันตัวตนกับ Google" };
    }
  });

export const getMongoStaffUsers = createServerFn({ method: "GET" }).handler(async () => {
  const db = await getMongoDb();
  if (!db) {
    return { success: false, data: [] };
  }

  try {
    const users = await db
      .collection("users")
      .find({})
      .sort({ created_at: -1 })
      .toArray();

    return {
      success: true,
      data: users.map((u) => {
        const name = u.full_name || u.fullName || u.display_name || u.name || u.email?.split("@")[0] || "ผู้ใช้";
        return {
          id: u._id.toString(),
          email: u.email || "",
          full_name: name,
          display_name: name,
          role: u.role || "customer",
          is_active: u.is_active ?? true,
          picture_url: u.avatar_url || u.picture_url || u.picture || null,
          avatar_url: u.avatar_url || u.picture_url || u.picture || null,
          created_at: u.created_at || new Date().toISOString(),
        };
      }),
    };
  } catch (err: any) {
    console.error("[MongoDB Server] Error getting staff users:", err);
    return { success: false, data: [] };
  }
});

export const updateMongoUserStatus = createServerFn({ method: "POST" })
  .validator(
    z.object({
      userId: z.string(),
      isActive: z.boolean(),
    }),
  )
  .handler(async ({ data }) => {
    const db = await getMongoDb();
    if (!db) return { success: false, message: "MongoDB not connected" };

    try {
      const { ObjectId } = await import("mongodb");
      let filter: any;
      try {
        filter = { _id: new ObjectId(data.userId) };
      } catch {
        filter = { id: data.userId };
      }

      await db.collection("users").updateOne(filter, {
        $set: { is_active: data.isActive, updated_at: new Date().toISOString() },
      });
      return { success: true };
    } catch (err: any) {
      console.error("[MongoDB Server] Error updating user status:", err);
      return { success: false, error: err.message };
    }
  });

export const updateMongoUserRole = createServerFn({ method: "POST" })
  .validator(
    z.object({
      userId: z.string(),
      role: z.enum(["admin", "staff", "customer"]),
    }),
  )
  .handler(async ({ data }) => {
    const db = await getMongoDb();
    if (!db) return { success: false, message: "MongoDB not connected" };

    try {
      const { ObjectId } = await import("mongodb");
      let filter: any;
      try {
        filter = { _id: new ObjectId(data.userId) };
      } catch {
        filter = { id: data.userId };
      }

      await db.collection("users").updateOne(filter, {
        $set: { role: data.role, updated_at: new Date().toISOString() },
      });
      return { success: true };
    } catch (err: any) {
      console.error("[MongoDB Server] Error updating user role:", err);
      return { success: false, error: err.message };
    }
  });

export const deleteMongoUser = createServerFn({ method: "POST" })
  .validator(
    z.object({
      userId: z.string(),
    }),
  )
  .handler(async ({ data }) => {
    const db = await getMongoDb();
    if (!db) return { success: false, message: "MongoDB not connected" };

    try {
      const { ObjectId } = await import("mongodb");
      let filter: any;
      try {
        filter = { _id: new ObjectId(data.userId) };
      } catch {
        filter = { id: data.userId };
      }

      await db.collection("users").deleteOne(filter);
      return { success: true };
    } catch (err: any) {
      console.error("[MongoDB Server] Error deleting user:", err);
      return { success: false, error: err.message };
    }
  });

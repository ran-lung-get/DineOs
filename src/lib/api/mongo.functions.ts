import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getMongoDb, isMongoConfigured } from "../mongodb";
import { MENU } from "../../constants/menu.data";

// ─────────────────────────────────────────────────────────────
// 1. Check MongoDB Status
// ─────────────────────────────────────────────────────────────
export const checkMongoConnection = createServerFn({ method: "GET" }).handler(async () => {
  if (!isMongoConfigured()) {
    return {
      connected: false,
      configured: false,
      message: "MONGODB_URI not configured in environment variables",
    };
  }

  try {
    const db = await getMongoDb();
    if (!db) {
      return { connected: false, configured: true, message: "Could not obtain database instance" };
    }
    await db.command({ ping: 1 });
    return { connected: true, configured: true, message: "MongoDB connection successful" };
  } catch (err: any) {
    return { connected: false, configured: true, message: err?.message || "Ping failed" };
  }
});

// ─────────────────────────────────────────────────────────────
// 2. Orders Operations
// ─────────────────────────────────────────────────────────────
export const getMongoOrders = createServerFn({ method: "GET" }).handler(async () => {
  const db = await getMongoDb();
  if (!db) {
    return { success: false, data: [], isFallback: true };
  }

  try {
    const orders = await db
      .collection("orders")
      .find({})
      .sort({ created_at: -1 })
      .limit(100)
      .toArray();

    return {
      success: true,
      data: orders.map((o) => ({
        ...o,
        _id: o._id.toString(),
      })),
      isFallback: false,
    };
  } catch (err: any) {
    console.error("[MongoDB Server] Error fetching orders:", err);
    return { success: false, data: [], error: err.message, isFallback: true };
  }
});

export const createMongoOrder = createServerFn({ method: "POST" })
  .validator(
    z.object({
      orderNumber: z.string(),
      orderType: z.enum(["dine-in", "takeaway", "delivery"]),
      tableNumber: z.string().optional().nullable(),
      queueNumber: z.string().optional().nullable(),
      deliveryAddress: z.string().optional().nullable(),
      specialInstructions: z.string().optional().nullable(),
      items: z.array(
        z.object({
          name: z.string(),
          qty: z.number(),
          price: z.number(),
          image: z.string().optional().nullable(),
        }),
      ),
      subtotal: z.number(),
      deliveryFee: z.number(),
      total: z.number(),
      status: z.string().default("pending"),
      userId: z.string().optional().nullable(),
      customerId: z.string().optional().nullable(),
      lineUserId: z.string().optional().nullable(),
    }),
  )
  .handler(async ({ data }) => {
    const db = await getMongoDb();
    if (!db) {
      return { success: false, message: "MongoDB not connected. Saved in local storage." };
    }

    try {
      const orderDoc = {
        ...data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const result = await db.collection("orders").insertOne(orderDoc);

      // If dine-in, mark table as occupied in MongoDB
      if (data.orderType === "dine-in" && data.tableNumber) {
        await db.collection("restaurant_tables").updateOne(
          { label: data.tableNumber },
          { $set: { status: "occupied", updated_at: new Date().toISOString() } },
          { upsert: true },
        );
      }

      return {
        success: true,
        insertedId: result.insertedId.toString(),
        orderNumber: data.orderNumber,
      };
    } catch (err: any) {
      console.error("[MongoDB Server] Error inserting order:", err);
      return { success: false, error: err.message };
    }
  });

export const updateMongoOrderStatus = createServerFn({ method: "POST" })
  .validator(
    z.object({
      orderNumber: z.string(),
      status: z.string(),
    }),
  )
  .handler(async ({ data }) => {
    const db = await getMongoDb();
    if (!db) {
      return { success: false, message: "MongoDB not connected" };
    }

    try {
      const result = await db.collection("orders").updateOne(
        { orderNumber: data.orderNumber },
        { $set: { status: data.status, updated_at: new Date().toISOString() } },
      );

      return { success: true, modifiedCount: result.modifiedCount };
    } catch (err: any) {
      console.error("[MongoDB Server] Error updating order status:", err);
      return { success: false, error: err.message };
    }
  });

// ─────────────────────────────────────────────────────────────
// 3. Menu Items Operations
// ─────────────────────────────────────────────────────────────
export const getMongoMenuItems = createServerFn({ method: "GET" }).handler(async () => {
  const db = await getMongoDb();
  if (!db) {
    return { success: true, data: MENU, isFallback: true };
  }

  try {
    const items = await db.collection("menu_items").find({}).sort({ sort_order: 1 }).toArray();

    if (items.length === 0) {
      const seedDocs = MENU.map((m, idx) => ({
        ...m,
        sort_order: idx + 1,
        created_at: new Date().toISOString(),
      }));
      await db.collection("menu_items").insertMany(seedDocs);
      return { success: true, data: MENU, isSeeded: true };
    }

    return {
      success: true,
      data: items.map((i) => ({
        ...i,
        _id: i._id.toString(),
      })),
      isFallback: false,
    };
  } catch (err: any) {
    console.error("[MongoDB Server] Error loading menu items:", err);
    return { success: true, data: MENU, error: err.message, isFallback: true };
  }
});

export const saveMongoMenuItem = createServerFn({ method: "POST" })
  .validator(
    z.object({
      id: z.string(),
      name: z.string(),
      desc: z.string().optional(),
      price: z.number(),
      image: z.string(),
      category: z.string(),
      isAvailable: z.boolean().default(true),
      isSpicy: z.boolean().default(false),
      options: z.any().optional(),
      addons: z.any().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const db = await getMongoDb();
    if (!db) return { success: false, message: "MongoDB not connected" };

    try {
      await db.collection("menu_items").updateOne(
        { id: data.id },
        {
          $set: {
            ...data,
            updated_at: new Date().toISOString(),
          },
        },
        { upsert: true },
      );
      return { success: true };
    } catch (err: any) {
      console.error("[MongoDB Server] Error saving menu item:", err);
      return { success: false, error: err.message };
    }
  });

export const deleteMongoMenuItem = createServerFn({ method: "POST" })
  .validator(
    z.object({
      id: z.string(),
    }),
  )
  .handler(async ({ data }) => {
    const db = await getMongoDb();
    if (!db) return { success: false, message: "MongoDB not connected" };

    try {
      await db.collection("menu_items").deleteOne({ id: data.id });
      return { success: true };
    } catch (err: any) {
      console.error("[MongoDB Server] Error deleting menu item:", err);
      return { success: false, error: err.message };
    }
  });

// ─────────────────────────────────────────────────────────────
// 4. Restaurant Tables Operations
// ─────────────────────────────────────────────────────────────
export const getMongoTables = createServerFn({ method: "GET" }).handler(async () => {
  const db = await getMongoDb();
  if (!db) {
    return { success: false, data: [] };
  }

  try {
    const tables = await db.collection("restaurant_tables").find({}).sort({ id: 1 }).toArray();
    return {
      success: true,
      data: tables.map((t) => ({
        ...t,
        _id: t._id.toString(),
      })),
    };
  } catch (err: any) {
    console.error("[MongoDB Server] Error fetching tables:", err);
    return { success: false, error: err.message };
  }
});

export const updateMongoTableStatus = createServerFn({ method: "POST" })
  .validator(
    z.object({
      tableId: z.string(),
      status: z.enum(["available", "occupied", "reserved", "cleaning"]),
    }),
  )
  .handler(async ({ data }) => {
    const db = await getMongoDb();
    if (!db) {
      return { success: false, message: "MongoDB not connected" };
    }

    try {
      await db.collection("restaurant_tables").updateOne(
        { id: data.tableId },
        { $set: { status: data.status, updated_at: new Date().toISOString() } },
        { upsert: true },
      );
      return { success: true };
    } catch (err: any) {
      console.error("[MongoDB Server] Error updating table status:", err);
      return { success: false, error: err.message };
    }
  });

export const createMongoTable = createServerFn({ method: "POST" })
  .validator(
    z.object({
      id: z.string(),
      label: z.string(),
      capacity: z.number().default(4),
      table_type: z.string().default("normal"),
      status: z.string().default("available"),
    }),
  )
  .handler(async ({ data }) => {
    const db = await getMongoDb();
    if (!db) return { success: false, message: "MongoDB not connected" };

    try {
      await db.collection("restaurant_tables").updateOne(
        { id: data.id },
        { $set: { ...data, updated_at: new Date().toISOString() } },
        { upsert: true },
      );
      return { success: true };
    } catch (err: any) {
      console.error("[MongoDB Server] Error creating table:", err);
      return { success: false, error: err.message };
    }
  });

export const deleteMongoTable = createServerFn({ method: "POST" })
  .validator(
    z.object({
      tableId: z.string(),
    }),
  )
  .handler(async ({ data }) => {
    const db = await getMongoDb();
    if (!db) return { success: false, message: "MongoDB not connected" };

    try {
      await db.collection("restaurant_tables").deleteOne({ id: data.tableId });
      return { success: true };
    } catch (err: any) {
      console.error("[MongoDB Server] Error deleting table:", err);
      return { success: false, error: err.message };
    }
  });

// ─────────────────────────────────────────────────────────────
// 5. Stock & Inventory Operations
// ─────────────────────────────────────────────────────────────
export const getMongoIngredients = createServerFn({ method: "GET" }).handler(async () => {
  const db = await getMongoDb();
  if (!db) {
    return { success: false, data: [] };
  }

  try {
    const ingredients = await db.collection("ingredients").find({}).toArray();
    return {
      success: true,
      data: ingredients.map((i) => ({
        ...i,
        _id: i._id.toString(),
      })),
    };
  } catch (err: any) {
    console.error("[MongoDB Server] Error fetching ingredients:", err);
    return { success: false, error: err.message };
  }
});

export const saveMongoIngredient = createServerFn({ method: "POST" })
  .validator(
    z.object({
      id: z.string(),
      name: z.string(),
      quantity: z.number(),
      unit: z.string(),
      min_threshold: z.number(),
      cost_per_unit: z.number(),
      is_active: z.boolean().default(true),
      status: z.string().default("in_stock"),
    }),
  )
  .handler(async ({ data }) => {
    const db = await getMongoDb();
    if (!db) return { success: false, message: "MongoDB not connected" };

    try {
      await db.collection("ingredients").updateOne(
        { id: data.id },
        { $set: { ...data, updated_at: new Date().toISOString() } },
        { upsert: true },
      );
      return { success: true };
    } catch (err: any) {
      console.error("[MongoDB Server] Error saving ingredient:", err);
      return { success: false, error: err.message };
    }
  });

export const updateMongoIngredientStock = createServerFn({ method: "POST" })
  .validator(
    z.object({
      ingredientId: z.string(),
      deltaQuantity: z.number(),
    }),
  )
  .handler(async ({ data }) => {
    const db = await getMongoDb();
    if (!db) {
      return { success: false, message: "MongoDB not connected" };
    }

    try {
      const result = await db.collection("ingredients").updateOne(
        { id: data.ingredientId },
        {
          $inc: { quantity: data.deltaQuantity },
          $set: { updated_at: new Date().toISOString() },
        },
      );
      return { success: true, modifiedCount: result.modifiedCount };
    } catch (err: any) {
      console.error("[MongoDB Server] Error updating ingredient stock:", err);
      return { success: false, error: err.message };
    }
  });

export const deleteMongoIngredient = createServerFn({ method: "POST" })
  .validator(
    z.object({
      ingredientId: z.string(),
    }),
  )
  .handler(async ({ data }) => {
    const db = await getMongoDb();
    if (!db) return { success: false, message: "MongoDB not connected" };

    try {
      await db.collection("ingredients").deleteOne({ id: data.ingredientId });
      return { success: true };
    } catch (err: any) {
      console.error("[MongoDB Server] Error deleting ingredient:", err);
      return { success: false, error: err.message };
    }
  });

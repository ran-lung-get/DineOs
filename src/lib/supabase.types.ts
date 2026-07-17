// ─────────────────────────────────────────────────────────────
// Supabase Database Types
// Auto-generated-friendly — ใช้ match กับ schema ที่สร้างใน Supabase
// ─────────────────────────────────────────────────────────────

export type Database = {
  public: {
    Tables: {
      users: {
        Row: UserRow;
        Insert: UserInsert;
        Update: UserUpdate;
      };
      customers: {
        Row: CustomerRow;
        Insert: CustomerInsert;
        Update: CustomerUpdate;
      };
      tables: {
        Row: TableRow;
        Insert: TableInsert;
        Update: TableUpdate;
      };
      orders: {
        Row: OrderRow;
        Insert: OrderInsert;
        Update: OrderUpdate;
      };
      order_items: {
        Row: OrderItemRow;
        Insert: OrderItemInsert;
        Update: OrderItemUpdate;
      };
      ingredients: {
        Row: IngredientRow;
        Insert: IngredientInsert;
        Update: IngredientUpdate;
      };
      recipe_items: {
        Row: RecipeItemRow;
        Insert: RecipeItemInsert;
        Update: RecipeItemUpdate;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      order_status: "pending" | "preparing" | "delivering" | "completed" | "cancelled";
      order_type: "dine-in" | "takeaway" | "delivery";
      user_role: "admin" | "staff" | "customer" | "captain";
    };
  };
};

// ── Tables (โต๊ะในร้าน) ──────────────────────────────────────
export type TableRow = {
  id: string;
  label: string;
  status: "available" | "occupied";
  capacity: number | null;
  created_at: string;
  updated_at: string;
};

export type TableInsert = {
  id?: string;
  label: string;
  status?: "available" | "occupied";
  capacity?: number | null;
  created_at?: string;
  updated_at?: string;
};

export type TableUpdate = Partial<TableInsert>;

// ── Users (ผู้ใช้งาน LINE) ──────────────────────────────────────
export type UserRow = {
  id: string;
  auth_user_id: string | null;
  line_user_id: string;
  display_name: string;
  email: string | null;
  picture_url: string | null;
  status_message: string | null;
  is_active: boolean;
  role: "admin" | "staff" | "customer" | "captain";
  created_at: string;
  updated_at: string;
  last_login_at: string;
};

export type UserInsert = {
  id?: string;
  auth_user_id?: string | null;
  line_user_id: string;
  display_name: string;
  email?: string | null;
  picture_url?: string | null;
  status_message?: string | null;
  is_active?: boolean;
  role?: "admin" | "staff" | "customer" | "captain";
  created_at?: string;
  updated_at?: string;
  last_login_at?: string;
};

export type UserUpdate = Partial<UserInsert>;

// ── Customers (ข้อมูลลูกค้า/โปรไฟล์เพิ่มเติม) ────────────────
export type CustomerRow = {
  id: string;
  user_id: string;
  line_user_id: string;
  display_name: string;
  phone: string | null;
  email: string | null;
  default_address: string | null;
  default_address_type: "home" | "work" | "dorm" | null;
  notes: string | null;
  total_orders: number;
  total_spent: number;
  is_blocked: boolean;
  created_at: string;
  updated_at: string;
};

export type CustomerInsert = {
  id?: string;
  user_id: string;
  line_user_id: string;
  display_name: string;
  phone?: string | null;
  email?: string | null;
  default_address?: string | null;
  default_address_type?: "home" | "work" | "dorm" | null;
  notes?: string | null;
  total_orders?: number;
  total_spent?: number;
  is_blocked?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type CustomerUpdate = Partial<CustomerInsert>;

// ── Orders (ออเดอร์) ─────────────────────────────────────────
export type OrderRow = {
  id: string;
  order_number: string;
  user_id: string;
  customer_id: string;
  line_user_id: string;
  order_type: "dine-in" | "takeaway" | "delivery";
  status: "pending" | "preparing" | "delivering" | "completed" | "cancelled";
  subtotal: number;
  delivery_fee: number;
  total: number;
  table_number: string | null;
  delivery_address: string | null;
  special_instructions: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
};

export type OrderInsert = {
  id?: string;
  order_number?: string;
  user_id: string;
  customer_id: string;
  line_user_id: string;
  order_type: "dine-in" | "takeaway" | "delivery";
  status?: "pending" | "preparing" | "delivering" | "completed" | "cancelled";
  subtotal: number;
  delivery_fee?: number;
  total: number;
  table_number?: string | null;
  delivery_address?: string | null;
  special_instructions?: string | null;
  created_at?: string;
  updated_at?: string;
  completed_at?: string | null;
};

export type OrderUpdate = Partial<OrderInsert>;

// ── Order Items (รายการอาหารในออเดอร์) ───────────────────────
export type OrderItemRow = {
  id: string;
  order_id: string;
  item_id: string;
  name: string;
  image: string | null;
  unit_price: number;
  quantity: number;
  addons: Record<string, unknown> | null;
  options: Record<string, string> | null;
  note: string | null;
  line_total: number;
  created_at: string;
};

export type OrderItemInsert = {
  id?: string;
  order_id: string;
  item_id: string;
  name: string;
  image?: string | null;
  unit_price: number;
  quantity: number;
  addons?: Record<string, unknown> | null;
  options?: Record<string, string> | null;
  note?: string | null;
  line_total: number;
  created_at?: string;
};

export type OrderItemUpdate = Partial<OrderItemInsert>;

// ── Ingredients (วัตถุดิบ) ───────────────────────────────────
export type IngredientRow = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  min_threshold: number;
  created_at: string;
  updated_at: string;
};

export type IngredientInsert = {
  id?: string;
  name: string;
  quantity?: number;
  unit: string;
  min_threshold?: number;
  created_at?: string;
  updated_at?: string;
};

export type IngredientUpdate = Partial<IngredientInsert>;

// ── Recipe Items (รายการในสูตรอาหาร) ─────────────────────────
export type RecipeItemRow = {
  id: string;
  menu_item_id: string | null;
  option_id: string | null;
  ingredient_id: string;
  quantity_required: number;
  created_at: string;
};

export type RecipeItemInsert = {
  id?: string;
  menu_item_id?: string | null;
  option_id?: string | null;
  ingredient_id: string;
  quantity_required: number;
  created_at?: string;
};

export type RecipeItemUpdate = Partial<RecipeItemInsert>;


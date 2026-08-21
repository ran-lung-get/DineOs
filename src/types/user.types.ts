export type UserRole = "customer" | "staff" | "admin";

export type Gender = "male" | "female" | "";

export type AppUser = {
  id: string;
  auth_user_id?: string | null;
  line_user_id?: string | null;
  display_name: string;
  email?: string | null;
  role: UserRole;
  is_active: boolean;
  picture_url?: string | null;
  status_message?: string | null;
  created_at?: string;
  updated_at?: string;
  last_login_at?: string | null;
};

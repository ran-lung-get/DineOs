export interface StoredUser {
  id: string;
  email: string;
  role: "admin" | "staff" | "customer";
  fullName?: string;
  isActive?: boolean;
}

const AUTH_STORAGE_KEY = "dineos-auth-user";
const GUEST_STORAGE_KEY = "dineos-guest";
const LEGACY_AUTH_STORAGE_KEY = "ran-lung-get-auth-user";

export function getStoredUser(): StoredUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY) || localStorage.getItem(LEGACY_AUTH_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setStoredUser(user: StoredUser): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
  localStorage.removeItem(GUEST_STORAGE_KEY);
  localStorage.removeItem("ran-lung-get-guest");
}

export function clearStoredUser(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AUTH_STORAGE_KEY);
  localStorage.removeItem(GUEST_STORAGE_KEY);
  localStorage.removeItem(LEGACY_AUTH_STORAGE_KEY);
  localStorage.removeItem("ran-lung-get-guest");
}

export function isGuest(): boolean {
  if (typeof window === "undefined") return false;
  return (
    localStorage.getItem(GUEST_STORAGE_KEY) === "true" ||
    localStorage.getItem("ran-lung-get-guest") === "true"
  );
}

export function setGuestUser(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(GUEST_STORAGE_KEY, "true");
  setStoredUser({
    id: "guest-user",
    email: "guest@dineos.app",
    role: "customer",
    fullName: "ลูกค้าหน้าร้าน (Dineos Guest)",
    isActive: true,
  });
}

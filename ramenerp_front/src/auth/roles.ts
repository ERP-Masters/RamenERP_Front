import { get_auth_user } from "@/auth/auth_session";

export type Role = "ADMIN" | "CEO" | "STAFF";

export function get_role(): Role | undefined {
  return get_auth_user()?.role;
}

export function has_role(allowed: Role[]): boolean {
  const role = get_role();
  if (!role) return true; // 백엔드 role 미제공 기간엔 막지 않음(개발 편의)
  return allowed.includes(role);
}

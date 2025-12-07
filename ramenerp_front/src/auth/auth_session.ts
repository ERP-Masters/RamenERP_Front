// src/auth/auth_session.ts

export const auth_key = {
  access_token: "ramenerp_access_token",
  user: "ramenerp_user",
} as const;

export type AuthUser = {
  id: number;
  userId: string;
};

export function set_auth_session(access_token: string, user: AuthUser) {
  sessionStorage.setItem(auth_key.access_token, access_token);
  sessionStorage.setItem(auth_key.user, JSON.stringify(user));
}

export function clear_auth_session() {
  sessionStorage.removeItem(auth_key.access_token);
  sessionStorage.removeItem(auth_key.user);
}

export function get_access_token(): string | null {
  return sessionStorage.getItem(auth_key.access_token);
}

export function get_auth_user(): AuthUser | null {
  const raw = sessionStorage.getItem(auth_key.user);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function is_logged_in(): boolean {
  return Boolean(get_access_token());
}

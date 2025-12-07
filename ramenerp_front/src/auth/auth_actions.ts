// src/auth/auth_actions.ts
import { clear_auth_session } from "@/auth/auth_session";

export function logout_and_move() {
  clear_auth_session();
  window.location.replace("/login");
}

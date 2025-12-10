// src/auth/auth_actions.ts

import { clear_auth_session } from "./auth_session";

export function logout_and_move() {
  const is_ok = window.confirm("로그아웃 하시겠습니까?");

  if (!is_ok) return;

  clear_auth_session();
  window.location.replace("/login");
}

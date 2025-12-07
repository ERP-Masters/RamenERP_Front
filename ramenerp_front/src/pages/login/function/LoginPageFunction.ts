// src/pages/LoginPageFunction.ts
// 로그인 로직 훅 - 백엔드 연동 버전

import { useState, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { set_auth_session, type AuthUser } from "@/auth/auth_session";

const api_base_url = import.meta.env.VITE_API_BASE_URL ?? "/api";

type LoginResponse = {
  accessToken: string;
  user: AuthUser;
};

export type UseLoginFormReturn = {
  user_id: string;
  password: string;
  is_submitting: boolean;
  error_msg: string;
  handle_change_id: (e: ChangeEvent<HTMLInputElement>) => void;
  handle_change_password: (e: ChangeEvent<HTMLInputElement>) => void;
  handle_submit: () => Promise<void>;
};

/** ✅ LoginPageUi 에서 사용하는 훅 (named export 필수) */
export function useLoginForm(): UseLoginFormReturn {
  const [user_id, set_user_id] = useState("");
  const [password, set_password] = useState("");
  const [is_submitting, set_is_submitting] = useState(false);
  const [error_msg, set_error_msg] = useState("");

  const navigate = useNavigate();

  const handle_change_id = (e: ChangeEvent<HTMLInputElement>) => {
    set_user_id(e.target.value);
  };

  const handle_change_password = (e: ChangeEvent<HTMLInputElement>) => {
    set_password(e.target.value);
  };

  const extract_error_message = async (res: Response) => {
    try {
      const data = (await res.json()) as any;
      if (typeof data?.message === "string") return data.message;
      if (Array.isArray(data?.message)) return data.message[0] ?? "로그인에 실패했습니다.";
      return "로그인에 실패했습니다.";
    } catch {
      return "로그인에 실패했습니다.";
    }
  };

  const handle_submit = async () => {
    set_error_msg("");

    if (!user_id || !password) {
      set_error_msg("아이디와 비밀번호를 모두 입력해 주세요.");
      return;
    }

    set_is_submitting(true);

    try {
      const res = await fetch(`${api_base_url}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user_id,
          userPw: password,
        }),
      });

      if (!res.ok) {
        const msg = await extract_error_message(res);
        set_error_msg(msg);
        return;
      }

      const data = (await res.json()) as LoginResponse;

      if (!data?.accessToken || !data?.user) {
        set_error_msg("로그인 응답 형식이 올바르지 않습니다.");
        return;
      }

      set_auth_session(data.accessToken, data.user);

      // ✅ 성공 시 이동은 훅에서만 책임
      navigate("/dashboard", { replace: true });
    } catch {
      set_error_msg("서버와 통신 중 오류가 발생했습니다.");
    } finally {
      set_is_submitting(false);
    }
  };

  return {
    user_id,
    password,
    is_submitting,
    error_msg,
    handle_change_id,
    handle_change_password,
    handle_submit,
  };
}

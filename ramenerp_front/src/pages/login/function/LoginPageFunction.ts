// src/pages/LoginPageFunction.ts
// 로그인 로직 훅 - 백엔드 연동 버전

import { useState, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { http } from "@/api/_http";
import { set_auth_session, type AuthUser } from "@/auth/auth_session";

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

  const handle_submit = async () => {
    set_error_msg("");

    if (!user_id || !password) {
      set_error_msg("아이디와 비밀번호를 모두 입력해 주세요.");
      return;
    }

    set_is_submitting(true);

    try {
      const data = await http<LoginResponse>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          userId: user_id,
          userPw: password,
        }),
      });

      if (!data?.accessToken || !data?.user) {
        set_error_msg("로그인 응답 형식이 올바르지 않습니다.");
        return;
      }

      set_auth_session(data.accessToken, data.user);

      navigate("/dashboard", { replace: true });
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "서버와 통신 중 오류가 발생했습니다.";
      set_error_msg(msg);
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

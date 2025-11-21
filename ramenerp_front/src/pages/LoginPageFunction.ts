// src/pages/LoginPageFunction.ts
// 로그인 로직 & 더미 계정 검증 전용 훅

import { useState, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";  // ✅ 추가

const DUMMY_USER_ID = "admin";       // 임시 더미 아이디
const DUMMY_PASSWORD = "ramen1234";  // 임시 더미 비밀번호

export type UseLoginFormReturn = {
  user_id: string;
  password: string;
  is_submitting: boolean;
  error_msg: string;
  handle_change_id: (e: ChangeEvent<HTMLInputElement>) => void;
  handle_change_password: (e: ChangeEvent<HTMLInputElement>) => void;
  handle_submit: (opts?: { on_success?: () => void }) => Promise<void>;
};

/** ✅ LoginPageUi 에서 사용하는 훅 (named export 필수) */
export function useLoginForm(): UseLoginFormReturn {
  const [user_id, set_user_id] = useState("");
  const [password, set_password] = useState("");
  const [is_submitting, set_is_submitting] = useState(false);
  const [error_msg, set_error_msg] = useState("");

  const navigate = useNavigate();  // ✅ 추가

  const handle_change_id = (e: ChangeEvent<HTMLInputElement>) => {
    set_user_id(e.target.value);
  };

  const handle_change_password = (e: ChangeEvent<HTMLInputElement>) => {
    set_password(e.target.value);
  };

  const handle_submit = async (opts: { on_success?: () => void } = {}) => {
    set_error_msg("");

    if (!user_id || !password) {
      set_error_msg("아이디와 비밀번호를 모두 입력해 주세요.");
      return;
    }

    set_is_submitting(true);
    try {
      // 🔐 백엔드 연동 전까지는 더미 계정으로만 체크
      if (user_id === DUMMY_USER_ID && password === DUMMY_PASSWORD) {
        // 간단 세션 플래그 (필요하면 나중에 교체)
        sessionStorage.setItem("ramenerp_login_ok", "1");

        // ✅ 여기서 바로 대시보드로 이동
        navigate("/dashboard", { replace: true });

        // 필요하면 추가 콜백도 그대로 호출
        if (opts.on_success) {
          opts.on_success();
        }
      } else {
        set_error_msg("아이디 또는 비밀번호가 올바르지 않습니다.");
      }
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

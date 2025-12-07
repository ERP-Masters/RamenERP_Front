// src/pages/LoginPageUi.tsx
import React from "react";
import { useLoginForm } from "../function/LoginPageFunction";

const ui_tok = {
  bg_page: "#f6f7f9",
  surface: "#ffffff",
  border: "#e5e7eb",
  header_bg: "#f8fafc",
  text: "#111827",
  label: "#6b7280",
  primary_bg: "#0ea5e9",
  primary_text: "#ffffff",
  danger: "#b91c1c",
  radius: 16,
} as const;

const page_wrap_style: React.CSSProperties = {
  minHeight: "120vh",
  background: ui_tok.bg_page,
  display: "flex",
  justifyContent: "center",
  alignItems: "flex-start",
  padding: "170px 16px 32px",
};

const card_style: React.CSSProperties = {
  width: "min(440px, 100%)",
  background: ui_tok.surface,
  borderRadius: ui_tok.radius,
  border: `1px solid ${ui_tok.border}`,
  boxShadow: "0 18px 40px rgba(15,23,42,0.18)",
  padding: "28px 28px 24px",
  display: "grid",
  rowGap: 18,
};

const title_style: React.CSSProperties = {
  fontSize: 22,
  fontWeight: 800,
  color: ui_tok.text,
};

const form_style: React.CSSProperties = {
  display: "grid",
  rowGap: 14,
};

const form_inner_style: React.CSSProperties = {
  width: "100%",
  maxWidth: 360,
  margin: "0 auto",
};

const field_style: React.CSSProperties = {
  display: "grid",
  rowGap: 6,
};

const label_style: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: ui_tok.label,
};

const input_style: React.CSSProperties = {
  width: "100%",
  height: 40,
  borderRadius: 10,
  border: `1px solid ${ui_tok.border}`,
  padding: "0 12px",
  fontSize: 13,
};

const btn_style_primary: React.CSSProperties = {
  width: "100%",
  height: 40,
  borderRadius: 999,
  border: "none",
  background: ui_tok.primary_bg,
  color: ui_tok.primary_text,
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
};

const error_style: React.CSSProperties = {
  marginTop: 4,
  fontSize: 12,
  color: ui_tok.danger,
};

const LoginPageUi: React.FC = () => {
  const {
    user_id,
    password,
    is_submitting,
    error_msg,
    handle_change_id,
    handle_change_password,
    handle_submit,
  } = useLoginForm();

  const handle_form_submit: React.FormEventHandler = (e) => {
    e.preventDefault();
    void handle_submit();
  };

  return (
    <div style={page_wrap_style}>
      <div style={card_style}>
        <div>
          <div style={title_style}>Ramen ERP</div>
        </div>

        <form
          style={{ ...form_style, ...form_inner_style }}
          onSubmit={handle_form_submit}
        >
          <div style={field_style}>
            <label style={label_style} htmlFor="login-user-id">
              아이디
            </label>
            <input
              id="login-user-id"
              type="text"
              value={user_id}
              onChange={handle_change_id}
              placeholder="아이디를 입력하세요"
              style={input_style}
              autoComplete="username"
            />
          </div>

          <div style={field_style}>
            <label style={label_style} htmlFor="login-password">
              비밀번호
            </label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={handle_change_password}
              placeholder="비밀번호를 입력하세요"
              style={input_style}
              autoComplete="current-password"
            />
          </div>

          {error_msg && <div style={error_style}>{error_msg}</div>}

          <button type="submit" style={btn_style_primary} disabled={is_submitting}>
            {is_submitting ? "확인 중..." : "로그인"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPageUi;

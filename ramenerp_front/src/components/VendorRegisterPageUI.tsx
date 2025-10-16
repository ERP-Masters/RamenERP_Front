import React from "react";

export interface VendorFormViewState {
  name: string;
  contact_name: string;
  address_road: string;
  address_detail: string;
}

export interface VendorRegisterFormUIProps {
  form_data: VendorFormViewState;
  on_change: (e: React.ChangeEvent<HTMLInputElement>) => void;

  contact_email: string;
  on_contact_email_change: (e: React.ChangeEvent<HTMLInputElement>) => void;

  open_address_search: () => void;
  detail_ref: React.RefObject<HTMLInputElement>;
  on_submit: (e: React.FormEvent) => void;
}

/* ===== UI 토큰(리스트와 동일 톤) ===== */
const ui_tok = {
  border: "#e6e8ec",
  label: "#6b7280",
  text: "#111827",
  radius: 12,
  focus: "0 0 0 3px rgba(14,165,233,0.25)",
  primary_bg: "#2563eb",
  primary_text: "#fff",
} as const;

const form_style: React.CSSProperties = { fontSize: "clamp(12px, 1.05vw, 16px)" };
const label_style: React.CSSProperties = { whiteSpace: "nowrap", color: ui_tok.label, fontWeight: 600 };

/* 컨트롤 공통 높이 40px */
const input_base: React.CSSProperties = {
  width: "100%",
  minWidth: 0,
  height: 40,
  padding: "10px 12px",
  borderRadius: ui_tok.radius,
  border: `1px solid ${ui_tok.border}`,
  boxSizing: "border-box",
  outline: "none",
  background: "#fff",
};

const input_style: React.CSSProperties = { ...input_base };
const readonly_style: React.CSSProperties = { ...input_base, background: "#f4f6f8" };

const row_top_style: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(240px, 1fr))",
  gap: 12,
  alignItems: "center",
  marginBottom: 10,
};
const field_style: React.CSSProperties = {
  display: "grid",
  gridTemplateRows: "auto 1fr",
  rowGap: 6,
  minWidth: 0,
};

const row_addr_style: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "auto 160px minmax(320px, 1fr) minmax(260px, 1fr)",
  columnGap: 12,
  rowGap: 8,
  alignItems: "center",
  margin: "8px 0 12px",
};

const small_btn_style: React.CSSProperties = {
  height: 40,
  padding: "0 12px",
  borderRadius: ui_tok.radius,
  border: `1px solid ${ui_tok.border}`,
  background: "#fff",
  cursor: "pointer",
};

const submit_btn_style: React.CSSProperties = {
  height: 42,
  padding: "0 14px",
  borderRadius: ui_tok.radius,
  border: "none",
  background: ui_tok.primary_bg,
  color: ui_tok.primary_text,
  fontWeight: 700,
  cursor: "pointer",
};

const VendorRegisterPageUI: React.FC<VendorRegisterFormUIProps> = (props) => {
  const {
    form_data,
    on_change,
    contact_email,
    on_contact_email_change,
    open_address_search,
    detail_ref,
    on_submit,
  } = props;

  // 이메일 입력: 공백만 제거해서 전달 (로직 그대로)
  const handle_contact_change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\s/g, "");
    on_contact_email_change({
      ...e,
      target: { ...e.target, value, name: "contact_email" },
    } as any);
  };

  return (
    <form onSubmit={on_submit} style={form_style}>
      {/* 1줄: 거래처명 / 담당자명 / 담당자 이메일 */}
      <div style={row_top_style}>
        <div style={field_style}>
          <label style={label_style}>거래처명</label>
          <input
            type="text"
            name="name"
            value={form_data.name}
            onChange={on_change}
            placeholder="예) OO식자재"
            style={input_style}
            onFocus={(e)=> (e.currentTarget.style.boxShadow = ui_tok.focus)}
            onBlur={(e)=> (e.currentTarget.style.boxShadow = "none")}
          />
        </div>

        <div style={field_style}>
          <label style={label_style}>담당자명</label>
          <input
            type="text"
            name="contact_name"
            value={form_data.contact_name}
            onChange={on_change}
            placeholder="예) 홍길동"
            style={input_style}
            onFocus={(e)=> (e.currentTarget.style.boxShadow = ui_tok.focus)}
            onBlur={(e)=> (e.currentTarget.style.boxShadow = "none")}
          />
        </div>

        <div style={field_style}>
          <label style={label_style}>담당자 이메일</label>
          <input
            type="email"
            name="contact_email"
            value={contact_email}
            onChange={handle_contact_change}
            inputMode="email"
            placeholder="예: ramen@company.com"
            autoComplete="email"
            style={input_style}
            maxLength={254}
            required
            onFocus={(e)=> (e.currentTarget.style.boxShadow = ui_tok.focus)}
            onBlur={(e)=> (e.currentTarget.style.boxShadow = "none")}
          />
        </div>
      </div>

      {/* 2줄: 도로명 주소 라벨/버튼/입력/상세주소 */}
      <div style={row_addr_style}>
        <label style={label_style}>도로명 주소</label>

        <button
          type="button"
          onClick={open_address_search}
          style={small_btn_style}
          title="도로명 주소 검색"
        >
          도로명 주소 검색
        </button>

        <input
          type="text"
          name="address_road"
          value={form_data.address_road}
          onChange={on_change}
          placeholder="예) 서울특별시 강서구 방화대로50길 7"
          style={readonly_style}
          title="검색 버튼으로 자동 입력됩니다"
        />

        <input
          ref={detail_ref}
          type="text"
          name="address_detail"
          value={form_data.address_detail}
          onChange={on_change}
          placeholder="예) 12층 1201호"
          style={input_style}
          onFocus={(e)=> (e.currentTarget.style.boxShadow = ui_tok.focus)}
          onBlur={(e)=> (e.currentTarget.style.boxShadow = "none")}
        />
      </div>

      <button type="submit" style={submit_btn_style}>등록</button>
    </form>
  );
};

export default VendorRegisterPageUI;

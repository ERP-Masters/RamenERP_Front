// src/pages/VendorRegisterPage.tsx
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { submitVendor } from "./VendorRegisterCheck";

type VendorFormViewState = {
  name: string;
  contact_name: string;
  address_road: string;
  address_detail: string;
};

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
  gridTemplateColumns: "repeat(3, minmax(270px, 1fr))",
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
const cancel_btn_style: React.CSSProperties = {
  height: 42,
  padding: "0 14px",
  borderRadius: ui_tok.radius,
  border: `1px solid ${ui_tok.border}`,
  background: "#fff",
  color: ui_tok.text,
  fontWeight: 700,
  cursor: "pointer",
  marginLeft: 8,
};

const VendorRegisterPage: React.FC = () => {
  const navigate = useNavigate();

  const [form_data, set_form_data] = useState<VendorFormViewState>({
    name: "",
    contact_name: "",
    address_road: "",
    address_detail: "",
  });
  const [contact_email, set_contact_email] = useState("");
  const detail_ref = useRef<HTMLInputElement>(null);

  // 다음 우편번호 스크립트 로드(선택)
  useEffect(() => {
    if ((window as any).daum?.Postcode) return;
    const s = document.createElement("script");
    s.src = "https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
    s.async = true;
    document.body.appendChild(s);
  }, []);

  const on_change: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const { name, value } = e.target;
    set_form_data((prev) => ({ ...prev, [name as keyof VendorFormViewState]: value }));
  };
  const on_contact_email_change: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    set_contact_email(e.target.value.replace(/\s/g, ""));
  };

  const open_address_search = () => {
    const d: any = (window as any).daum;
    if (d?.Postcode) {
      new d.Postcode({
        oncomplete: (data: any) => {
          const road = data.roadAddress || "";
          set_form_data((prev) => ({ ...prev, address_road: road }));
          setTimeout(() => detail_ref.current?.focus(), 0);
        },
      }).open();
    } else {
      alert("주소 검색 로딩 중입니다. 잠시 후 다시 시도해 주세요.");
    }
  };

  const on_submit: React.FormEventHandler = async (e) => {
    e.preventDefault();
    const res = await submitVendor({
      name: form_data.name,
      contact_name: form_data.contact_name,
      contact_email,
      address_road: form_data.address_road,
      address_detail: form_data.address_detail,
    });
    if (res.ok) {
      // 리스트 페이지가 듣는 이벤트는 submitVendor에서 이미 발생(vendor:created)
      // 라우팅으로 열린 경우엔 뒤로가기 시도
      window.dispatchEvent(new Event("vendor:register:cancel"));
    }
  };

  const on_cancel_click = (e: React.MouseEvent) => {
    e.preventDefault();
    // 리스트 페이지의 모달 닫기용 신호
    window.dispatchEvent(new Event("vendor:register:cancel"));
    // 라우팅으로 열렸다면 뒤로가기 시도(옵션)
    if (window.history.length > 1) {
      try { navigate(-1); } catch {}
    }
  };

  return (
    <form onSubmit={on_submit} style={form_style}>
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
            onChange={on_contact_email_change}
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

      <div style={row_addr_style}>
        <label style={label_style}>도로명 주소</label>

        <button type="button" onClick={open_address_search} style={small_btn_style} title="도로명 주소 검색">
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

      <div>
        <button type="submit" style={submit_btn_style}>등록</button>
      </div>
    </form>
  );
};

export default VendorRegisterPage;

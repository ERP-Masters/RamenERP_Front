import React, { useState } from "react";
import VendorListPage from "../pages/VendorListPage";

export interface VendorFormViewState {
  name: string;
  contact_name: string;
  address_road: string;
  address_detail: string;
}

export interface VendorRegisterPageUIProps {
  formData: VendorFormViewState;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;

  contactEmail: string;
  onContactEmailChange: (e: React.ChangeEvent<HTMLInputElement>) => void;

  openAddressSearch: () => void;
  detailRef: React.RefObject<HTMLInputElement | null>;
  onSubmit: (e: React.FormEvent) => void;
}

const VendorRegisterPageUI: React.FC<VendorRegisterPageUIProps> = (props) => {
  const {
    formData,
    onChange,
    contactEmail,
    onContactEmailChange,
    openAddressSearch,
    detailRef,
    onSubmit,
  } = props;

  const form_data = formData;

  const handle_contact_change = (e: React.ChangeEvent<HTMLInputElement>) => {
  // 공백만 제거하고 그대로 전달 (이메일 문자는 모두 허용)
  const value = e.target.value.replace(/\s/g, "");
  onContactEmailChange({
    ...e,
    target: { ...e.target, value, name: "contact_email" },
  } as any);
};


  const [outerQuery, set_outerQuery] = useState("");

  // ── 스타일 ─────────────────────────
  const form_style: React.CSSProperties = {
    fontSize: "clamp(12px, 1.05vw, 16px)",
  };
  const label_style: React.CSSProperties = { whiteSpace: "nowrap" };
  const input_style: React.CSSProperties = {
    width: "100%",
    minWidth: 0,
    padding: "6px 8px",
    boxSizing: "border-box",
  };

  const row_top_style: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(180px, 1fr))",
    gap: 12,
    alignItems: "center",
    marginBottom: 8,
  };
  const field_style: React.CSSProperties = {
    display: "grid",
    gridTemplateRows: "auto 1fr",
    rowGap: 4,
    minWidth: 0,
  };

  const row_addr_style: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "auto 140px minmax(260px, 1fr) minmax(220px, 1fr)",
    columnGap: 12,
    rowGap: 6,
    alignItems: "center",
    margin: "8px 0",
  };

  // 네모박스 외부 오른쪽 상단 컨트롤바
  const outer_bar: React.CSSProperties = {
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 8,
    marginTop: 18,
    marginBottom: 6,
  };
  const outer_input: React.CSSProperties = {
    padding: "6px 8px",
    minWidth: 180,
    boxSizing: "border-box",
  };
  const btn: React.CSSProperties = {
    padding: "6px 10px",
    borderRadius: 6,
    border: "1px solid #d1d5db",
    background: "#111827",
    color: "#fff",
    cursor: "pointer",
    whiteSpace: "nowrap",
  };
  const gray_btn: React.CSSProperties = { ...btn, background: "#6b7280" };

  // 네모박스
  const list_panel_style: React.CSSProperties = {
    border: "1px solid #e5e7eb",
    borderRadius: 8,
    padding: 12,
    marginTop: 6,
    height: "45vh",
    overflowY: "auto",
    overflowX: "hidden",
    background: "#fafafa",
    boxSizing: "border-box",
  };

  return (
    <>
      <form onSubmit={onSubmit} style={form_style}>
        {/* 1줄: 거래처명 / 담당자명 / 담당자 연락처 */}
        <div style={row_top_style}>
          <div style={field_style}>
            <label style={label_style}>거래처명</label>
            <input
              type="text"
              name="name"
              value={form_data.name}
              onChange={onChange}
              placeholder="예) OO식자재"
              style={input_style}
            />
          </div>

          <div style={field_style}>
            <label style={label_style}>담당자명</label>
            <input
              type="text"
              name="contact_name"
              value={form_data.contact_name}
              onChange={onChange}
              placeholder="예) 홍길동"
              style={input_style}
            />
          </div>

          <div style={field_style}>
            <label style={label_style}>담당자 이메일</label>
            <input
              type="email"
              name="contact_email"
              value={contactEmail}
              onChange={handle_contact_change}
              inputMode="email"
              placeholder="예: ramen@company.com"
              autoComplete="email"
              style={{ ...input_style, width: "100%" }}
              maxLength={254}   // RFC 권장 상한(선택)
              required
            />
          </div>
        </div>

        {/* 2줄: 도로명 주소(라벨) · 검색버튼 · 도로명주소 입력 · 상세주소 입력 */}
        <div style={row_addr_style}>
          <label style={label_style}>도로명 주소</label>

          <button
            type="button"
            onClick={openAddressSearch}
            style={{
              width: 140,
              height: 28,
              fontSize: "clamp(12px, 1vw, 14px)",
              boxSizing: "border-box",
              cursor: "pointer",
            }}
          >
            도로명 주소 검색
          </button>

          <input
            type="text"
            name="address_road"
            value={form_data.address_road}
            onChange={onChange}
            placeholder="예) 서울특별시 강서구 방화대로50길 7"
            readOnly
            style={{ ...input_style, background: "#f4f4f4" }}
            title="검색 버튼으로 자동 입력됩니다"
          />

          <input
            ref={detailRef}
            type="text"
            name="address_detail"
            value={form_data.address_detail}
            onChange={onChange}
            placeholder="예) 12층 1201호"
            style={input_style}
          />
        </div>

        <button type="submit">등록</button>
      </form>

      {/* ▶ 네모박스 바깥, 오른쪽 상단 컨트롤바 */}
      <div style={outer_bar}>
        <button
          type="button"
          style={btn}
          onClick={() => window.dispatchEvent(new CustomEvent("vendor:summary-open"))}
        >
          거래처명 빠른 조회
        </button>

        <input
          type="text"
          value={outerQuery}
          onChange={(e) => set_outerQuery(e.target.value)}
          placeholder="거래처명/담당자명"
          style={outer_input}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              window.dispatchEvent(new CustomEvent("vendor:filter", { detail: { q: outerQuery } }));
            }
          }}
        />
        <button
          type="button"
          style={btn}
          onClick={() => window.dispatchEvent(new CustomEvent("vendor:filter", { detail: { q: outerQuery } }))}
        >
          검색
        </button>
        <button
          type="button"
          style={gray_btn}
          onClick={() => {
            set_outerQuery("");
            window.dispatchEvent(new CustomEvent("vendor:filter-reset"));
          }}
        >
          초기화
        </button>
      </div>

      {/* ▼ 네모박스(조회 결과) */}
      <div style={list_panel_style}>
        <VendorListPage />
      </div>
    </>
  );
};

export default VendorRegisterPageUI;

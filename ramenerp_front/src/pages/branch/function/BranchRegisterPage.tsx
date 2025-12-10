import React, { useEffect, useRef, useState } from "react";
import { submitBranch } from "./BranchRegisterCheck";

const ui_tok = {
  border: "#e6e8ec",
  label: "#6b7280",
  text: "#111827",
  radius: 12,
  primary_bg: "#0ea5e9", // 창고/단위와 동일 하늘색
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

const row_style: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(260px, 1fr))",
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

const submit_btn_style: React.CSSProperties = {
  height: 42,
  padding: "0 16px",
  borderRadius: ui_tok.radius,
  border: "none",
  background: ui_tok.primary_bg,
  color: ui_tok.primary_text,
  fontWeight: 800,
  cursor: "pointer",
};

/* ⬇ 작은 ‘도로명 주소 검색’ 버튼 */
// 기존 tiny_btn_style 교체
const tiny_btn_style: React.CSSProperties = {
  height: 26,
  padding: "0 10px",
  borderRadius: 8,
  border: "1px solid #d1d5db",   // 회색 테두리
  background: "#f3f4f6",          // 연한 회색 배경
  color: "#374151",               // 진회색 텍스트
  cursor: "pointer",
  fontSize: 12,
  lineHeight: "24px",
};

const BranchRegisterPage: React.FC = () => {
  const [form, set_form] = useState({
    name: "",
    location: "",
    detail_address: "",
    store_owner: "",
    contact: "",
  });
  const [is_submitting, set_is_submitting] = useState(false);

  const detailRef = useRef<HTMLInputElement>(null);

  /* ✅ 다음 우편번호 스크립트 로드(필요 시 1회만) */
  useEffect(() => {
    if ((window as any).daum?.Postcode) return;
    const s = document.createElement("script");
    s.src = "https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
    s.async = true;
    document.body.appendChild(s);
  }, []);

  const on_change: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const { name, value } = e.target;
    set_form((prev) => ({ ...prev, [name]: value }));
  };

  /* ✅ 도로명 주소 검색 → 선택하면 location 자동 입력, detail_address로 포커스 */
  const openAddressSearch = () => {
    const d: any = (window as any).daum;
    if (!d?.Postcode) {
      alert("주소 검색 로딩 중입니다. 잠시 후 다시 시도해 주세요.");
      return;
    }
    new d.Postcode({
      oncomplete: (data: any) => {
        const road = data.roadAddress || "";
        set_form((prev) => ({ ...prev, location: road }));
        setTimeout(() => detailRef.current?.focus(), 0);
      },
    }).open();
  };

  const on_submit: React.FormEventHandler = async (e) => {
    e.preventDefault();
    if (is_submitting) return;

    try {
      set_is_submitting(true);
      const ok = await submitBranch({
        name: form.name.trim(),
        location: form.location.trim(),
        detail_address: form.detail_address.trim(),
        store_owner: form.store_owner.trim(),
        contact: form.contact.trim(),
      });
      if (ok) {
        // 성공 시 입력값 초기화 (모달은 submitBranch 내부 이벤트로 닫힘)
        set_form({ name: "", location: "", detail_address: "", store_owner: "", contact: "" });
      }
    } finally {
      set_is_submitting(false);
    }
  };

  return (
    <form onSubmit={on_submit} style={form_style}>
      <div style={row_style}>
        <div style={field_style}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <label style={label_style}>지점명</label>
          </div>
          <input
            name="name"
            value={form.name}
            onChange={on_change}
            placeholder="예) 강서방화사거리점"
            style={input_base}
            required
          />
        </div>

        <div style={field_style}>
          {/* ⬇ 라벨 오른쪽에 작은 버튼을 ‘살짝’ 띄워 배치 */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <label style={label_style}>지점 위치</label>
            <button type="button" style={tiny_btn_style} onClick={openAddressSearch} title="도로명 주소 검색">
              도로명 주소 검색
            </button>
          </div>
          <input
            name="location"
            value={form.location}
            onChange={on_change}
            placeholder="예) 서울특별시 강서구"
            style={input_base}
            required
          />
        </div>

        <div style={field_style}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <label style={label_style}>상세 주소</label>
          </div>
          <input
            ref={detailRef}
            name="detail_address"
            value={form.detail_address}
            onChange={on_change}
            placeholder="예) 몰라요"
            style={input_base}
          />
        </div>
      </div>

      <div style={row_style}>
        <div style={field_style}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <label style={label_style}>지점장</label>
          </div>
          <input
            name="store_owner"
            value={form.store_owner}
            onChange={on_change}
            placeholder="예) 한승훈"
            style={input_base}
          />
        </div>

        <div style={field_style}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <label style={label_style}>연락처</label>
          </div>
          <input
            name="contact"
            value={form.contact}
            onChange={on_change}
            placeholder="예) 010-1234-5678"
            style={input_base}
          />
        </div>

        <div style={{ display: "flex", alignItems: "end" }}>
          <button type="submit" style={submit_btn_style} disabled={is_submitting}>
            {is_submitting ? "등록 중…" : "등록"}
          </button>
        </div>
      </div>
    </form>
  );
};

export default BranchRegisterPage;

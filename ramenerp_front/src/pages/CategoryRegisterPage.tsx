// src/pages/CategoryRegisterPage.tsx
import React, { useMemo, useState } from "react";

// 대분류 Enum (기존 유지)
export enum MajorCategory {
  MEAT = "MEAT",
  SEAFOOD = "SEAFOOD",
  NOODLES = "NOODLES",
  VEGETABLES = "VEGETABLES",
  DAIRY = "DAIRY",
  EGGS = "EGGS",
  PROCESSED = "PROCESSED",
  SAUCE = "SAUCE",
  BROTH_SOUP = "BROTH_SOUP",
}

const NAME_MAX_BYTES = 20;

const ui_tok = {
  border: "#e6e8ec",
  label: "#6b7280",
  radius: 12,
  primary_bg: "#0ea5e9",
  primary_text: "#fff",
  danger: "#ef4444",
} as const;

const form_wrap_style: React.CSSProperties = { fontSize: "clamp(12px, 1.05vw, 16px)" };

const row_style: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(160px, 1fr) minmax(260px, 2fr) auto",
  gap: 12,
  alignItems: "center",
  marginBottom: 10,
};

const group_style: React.CSSProperties = {
  display: "grid",
  gridTemplateRows: "auto 1fr",
  rowGap: 6,
  minWidth: 0,
};

const label_style: React.CSSProperties = { whiteSpace: "nowrap", color: ui_tok.label, fontWeight: 600 };

const input_style: React.CSSProperties = {
  width: "100%",
  minWidth: 0,
  height: 40,
  padding: "10px 12px",
  borderRadius: 10,
  border: `1px solid ${ui_tok.border}`,
  boxSizing: "border-box",
  outline: "none",
  background: "#fff",
};

const select_style: React.CSSProperties = { ...input_style, height: 40 };

const submit_btn_style: React.CSSProperties = {
  height: 42,
  padding: "0 14px",
  borderRadius: 10,
  border: "1px solid #0284c7",
  background: "#0ea5e9",
  color: "#fff",
  fontWeight: 800,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const helper_row_style: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  marginTop: 4,
  fontSize: 12,
};
const byte_text_style: React.CSSProperties = { color: ui_tok.label };
const byte_text_over_style: React.CSSProperties = { color: ui_tok.danger, fontWeight: 700 };

const byteLen = (s: string) => new TextEncoder().encode(s).length;

const CategoryRegisterPage: React.FC = () => {
  const [major_category, set_major_category] = useState<MajorCategory>(MajorCategory.MEAT);
  const [category_name, set_category_name] = useState<string>("");
  const [is_submitting, set_is_submitting] = useState(false);

  const nameBytes = useMemo(() => byteLen(category_name), [category_name]);
  const nameTooLong = nameBytes > NAME_MAX_BYTES;

  const handle_submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (is_submitting) return;

    const trimmed = category_name.trim();
    if (!trimmed) {
      alert("등록에 실패하였습니다. (카테고리명을 입력해 주세요)");
      return;
    }
    if (byteLen(trimmed) > NAME_MAX_BYTES) {
      alert(`카테고리명은 최대 ${NAME_MAX_BYTES}바이트까지 입력 가능합니다.\n(현재: ${byteLen(trimmed)}바이트)`);
      return;
    }

    // 서버 스키마: group + category_name
    const payload = {
      group: String(major_category),
      category_name: trimmed,
    };

    try {
      set_is_submitting(true);

      const res = await fetch("/api/category", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      if (!res.ok) {
        let msg = `HTTP ${res.status}`;
        try {
          const j = text ? JSON.parse(text) : null;
          msg = j?.message || msg;
        } catch {}
        throw new Error(msg);
      }

      alert("등록이 완료되었습니다.");
      set_category_name("");

      // ✅ 리스트 패널이 듣는 이벤트만 발행(모달 닫기 + 목록 새로고침)
      window.dispatchEvent(new Event("category:created"));
      window.dispatchEvent(new Event("category:register:cancel"));

      // ❌ 라우팅/뒤로가기 호출 없음 (메인 화면 유지)
    } catch (e: any) {
      alert(`등록에 실패하였습니다. ${e?.message || ""}`);
    } finally {
      set_is_submitting(false);
    }
  };

  return (
    <form onSubmit={handle_submit} style={form_wrap_style}>
      <div style={row_style}>
        <div style={group_style}>
          <label style={label_style}>group</label>
          <select
            value={major_category}
            onChange={(e) => set_major_category(e.target.value as MajorCategory)}
            style={select_style}
          >
            {Object.values(MajorCategory).map((label) => (
              <option key={label} value={label}>{label}</option>
            ))}
          </select>
        </div>

        <div style={group_style}>
          <label style={label_style}>category_name</label>
          <input
            type="text"
            value={category_name}
            onChange={(e) => set_category_name(e.target.value)}
            placeholder="예) 우삼겹, 냉장육, 건면 등"
            style={{
              ...input_style,
              border: nameTooLong ? `1px solid ${ui_tok.danger}` : (input_style.border as string),
            }}
            required
          />
          <div style={helper_row_style}>
            <span style={nameTooLong ? byte_text_over_style : byte_text_style}>
              바이트: {nameBytes} / {NAME_MAX_BYTES}
            </span>
            {nameTooLong && <span style={byte_text_over_style}>최대 바이트를 초과했습니다.</span>}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center" }}>
          <button
            type="submit"
            style={{
              ...submit_btn_style,
              opacity: nameTooLong ? 0.6 : 1,
              cursor: nameTooLong ? "not-allowed" : "pointer",
            }}
            disabled={is_submitting || nameTooLong}
          >
            {is_submitting ? "등록 중…" : "등록"}
          </button>
        </div>
      </div>
    </form>
  );
};

export default CategoryRegisterPage;

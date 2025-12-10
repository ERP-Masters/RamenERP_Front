// src/pages/UnitRegisterPage.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const ui_tok = {
  border: "#e6e8ec",
  label: "#6b7280",
  text: "#111827",
  radius: 12,
  focus: "0 0 0 3px rgba(14,165,233,0.25)",
  primary_bg: "#0ea5e9",   // ✅ 창고 등록과 동일
  primary_border: "#0284c7",
  primary_text: "#fff",
} as const;

const container_style: React.CSSProperties = {
  maxWidth: 1200,
  margin: "0 auto",
  padding: "12px 8px",
  fontSize: "clamp(12px, 1.1vw, 16px)",
  boxSizing: "border-box",
};

const row_style: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  flexWrap: "nowrap",
  overflowX: "auto",
  paddingBottom: 8,
};

const group_style: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  flex: "1 1 0",
  minWidth: 0,
};

const label_style: React.CSSProperties = {
  whiteSpace: "nowrap",
  color: ui_tok.label,
  fontWeight: 700,
  flex: "0 0 auto",
};

const input_style: React.CSSProperties = {
  width: "100%",
  minWidth: 0,
  padding: "10px 12px",
  borderRadius: 10,
  border: `1px solid ${ui_tok.border}`,
  outline: "none",
  boxSizing: "border-box",
};

const submit_btn_style: React.CSSProperties = {
  flex: "0 0 auto",
  height: 42,
  padding: "0 16px",
  borderRadius: 10,
  border: `1px solid ${ui_tok.primary_border}`,
  background: ui_tok.primary_bg,    // ✅ 창고와 동일
  color: ui_tok.primary_text,
  cursor: "pointer",
  fontWeight: 800,
  whiteSpace: "nowrap",
};

const UnitRegisterPage: React.FC = () => {
  const [unit_code, set_unit_code] = useState<string>("");
  const [unit_name, set_unit_name] = useState<string>("");
  const [is_submitting, set_is_submitting] = useState(false); // ✅ 창고 등록과 동일 UX
  const navigate_fn = useNavigate();

  const handle_change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === "unit_code") set_unit_code(value);
    if (name === "unit_name") set_unit_name(value);
  };

  const fallback_navigate_flow = () => {
    // ✅ 기존 네비게이션 흐름을 유지한 폴백
    navigate_fn("/unit/register/check", {
      state: {
        unit: {
          code: unit_code.trim(),
          name: unit_name.trim(),
        },
      },
      replace: true,
    });
    set_unit_code("");
    set_unit_name("");
  };

  const handle_submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (is_submitting) return;

    const payload = {
      code: unit_code.trim(),
      name: unit_name.trim(),
      isused: "USED" as const,
    };
    if (!payload.code || !payload.name) {
      alert("코드/이름을 입력해 주세요.");
      return;
    }

    // ✅ 창고 등록과 동일한 흐름(직접 POST) 시도
    try {
      set_is_submitting(true);

      const res = await fetch("/api/units", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      });

      // 백엔드가 아직 없거나 다른 라우팅을 쓰는 프로젝트일 수도 있으니,
      // 404/405 등으로 실패하면 기존 라우팅 흐름으로 폴백
      if (!res.ok) {
        // 404/405/501 등은 폴백
        if (res.status === 404 || res.status === 405 || res.status === 501) {
          set_is_submitting(false);
          return fallback_navigate_flow();
        }
        const txt = await res.text().catch(() => "");
        let msg = `HTTP ${res.status}`;
        try { msg = (txt ? JSON.parse(txt) : null)?.message || msg; } catch {}
        throw new Error(msg);
      }

      // 성공: 창고 등록과 동일 UX
      alert("등록이 완료되었습니다.");
      set_unit_code("");
      set_unit_name("");

      // 목록 갱신 + 모달 닫기(리스트 패널이 듣도록)
      window.dispatchEvent(new Event("unit:created"));
      window.dispatchEvent(new Event("unit:register:cancel"));
    } catch (err: any) {
      // 다른 에러는 안내만 하고 화면 유지
      alert(err?.message || "등록에 실패했습니다.");
    } finally {
      set_is_submitting(false);
    }
  };

  return (
    <div style={container_style}>
      {/* 제목/기타 영역 없이 폼만 표시 (요청사항) */}
      <form onSubmit={handle_submit}>
        <div style={row_style}>
          <div style={group_style}>
            <label htmlFor="unit_code" style={label_style}>단위 분류</label>
            <input
              id="unit_code"
              type="text"
              name="unit_code"
              value={unit_code}
              onChange={handle_change}
              placeholder="예) KG"
              style={input_style}
              required
            />
          </div>

          <div style={group_style}>
            <label htmlFor="unit_name" style={label_style}>단위명</label>
            <input
              id="unit_name"
              type="text"
              name="unit_name"
              value={unit_name}
              onChange={handle_change}
              placeholder="예) 킬로그램"
              style={input_style}
              required
            />
          </div>

          <button
            type="submit"
            style={{ ...submit_btn_style, opacity: is_submitting ? 0.85 : 1, pointerEvents: is_submitting ? "none" : "auto" }}
            disabled={is_submitting}
          >
            {is_submitting ? "등록 중…" : "등록"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UnitRegisterPage;

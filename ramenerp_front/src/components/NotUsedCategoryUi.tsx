// src/components/NotUsedCategoryUi.tsx
import React, { useEffect, useState } from "react";
import { markCategoryNotUsed } from "../pages/CategoryNotUsedFunction";

type Props = {
  open: boolean;
  target: { id: number; category_name: string } | null; // ✅ DB PK 사용
  onClose: () => void;
  /** 미사용 전환 성공 후 목록 리로드 + 모달 닫기용 */
  onDone: () => void;
};

const overlay_style: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.35)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 9998,
};

const modal_style: React.CSSProperties = {
  width: "min(480px, 94vw)",
  maxWidth: 520,
  background: "#ffffff",
  borderRadius: 12,
  padding: 20,
  boxShadow: "0 14px 40px rgba(15,23,42,0.35)",
  display: "flex",
  flexDirection: "column",
  gap: 12,
};

const title_row_style: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8,
};

const title_style: React.CSSProperties = {
  margin: 0,
  fontSize: 18,
  fontWeight: 800,
  color: "#111827",
};

const badge_style: React.CSSProperties = {
  fontSize: 11,
  padding: "2px 8px",
  borderRadius: 999,
  border: "1px solid #f97316",
  color: "#9a3412",
  background: "#fffbeb",
};

const desc_style: React.CSSProperties = {
  margin: 0,
  fontSize: 13,
  color: "#4b5563",
  lineHeight: 1.6,
};

const highlight_style: React.CSSProperties = {
  fontWeight: 700,
  color: "#111827",
};

const label_style: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: "#6b7280",
  marginBottom: 4,
};

const input_style: React.CSSProperties = {
  width: "100%",
  padding: "8px 10px",
  borderRadius: 8,
  border: "1px solid #d1d5db",
  fontSize: 13,
  outline: "none",
};

const input_wrap_style: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
};

const error_style: React.CSSProperties = {
  marginTop: 4,
  fontSize: 12,
  color: "#dc2626",
};

const btn_row_style: React.CSSProperties = {
  marginTop: 14,
  display: "flex",
  justifyContent: "flex-end",
  gap: 8,
};

const cancel_btn_style: React.CSSProperties = {
  padding: "8px 14px",
  borderRadius: 999,
  border: "1px solid #e5e7eb",
  background: "#ffffff",
  cursor: "pointer",
  fontSize: 13,
  color: "#374151",
};

const delete_btn_style: React.CSSProperties = {
  padding: "8px 16px",
  borderRadius: 999,
  border: "1px solid #b91c1c",
  background: "#ef4444",
  color: "#ffffff",
  cursor: "pointer",
  fontSize: 13,
  fontWeight: 700,
};

const NotUsedCategoryUi: React.FC<Props> = ({
  open,
  target,
  onClose,
  onDone,
}) => {
  const [input_name, set_input_name] = useState("");
  const [is_saving, set_is_saving] = useState(false);
  const [error_message, set_error_message] = useState("");

  // 모달 열릴 때마다 초기화 (⚙️ 기능 로직 그대로 유지)
  useEffect(() => {
    if (open) {
      set_input_name("");
      set_is_saving(false);
      set_error_message("");
    }
  }, [open, target]);

  if (!open || !target) return null;

  // ⚙️ 실제 미사용 전환 로직 (그대로 유지)
  const handle_confirm = async () => {
    if (is_saving) return;
    set_is_saving(true);
    set_error_message("");

    try {
      await markCategoryNotUsed(target.id); // ✅ DB PK 사용
      onDone(); // 상위에서 load() + 모달 닫기
    } catch (e: any) {
      set_error_message(
        e?.message || "미사용 전환 중 오류가 발생했습니다.",
      );
      set_is_saving(false);
    }
  };

  // ⚙️ 이름 정확히 입력해야 버튼 활성화 (그대로 유지)
  const can_confirm =
    !is_saving && input_name.trim() === target.category_name.trim();

  return (
    <div style={overlay_style} onClick={onClose}>
      <div style={modal_style} onClick={(e) => e.stopPropagation()}>
        <div style={title_row_style}>
          <h2 style={title_style}>카테고리 미사용 전환</h2>
          <span style={badge_style}>주의</span>
        </div>

        <p style={desc_style}>
          <span style={highlight_style}>{target.category_name}</span> 카테고리를{" "}
          <span style={highlight_style}>미사용 상태</span>로 전환합니다.
          <br />
          이후에는 일반 카테고리 목록에서 보이지 않을 수 있으며,
          <br />
          이미 연결된 데이터에는 영향을 줄 수 있습니다.
        </p>

        <div style={input_wrap_style}>
          <div style={label_style}>
            확인을 위해 아래에{" "}
            <span style={highlight_style}>{target.category_name}</span> 을(를)
            정확히 입력하세요.
          </div>
          <input
            style={input_style}
            value={input_name}
            onChange={(e) => set_input_name(e.target.value)}
            placeholder={target.category_name}
          />
          {error_message && <div style={error_style}>{error_message}</div>}
        </div>

        <div style={btn_row_style}>
          <button
            type="button"
            style={cancel_btn_style}
            onClick={onClose}
            disabled={is_saving}
          >
            취소
          </button>
          <button
            type="button"
            style={{
              ...delete_btn_style,
              opacity: can_confirm ? 1 : 0.5,
              cursor: can_confirm ? "pointer" : "not-allowed",
            }}
            disabled={!can_confirm}
            onClick={handle_confirm}
          >
            미사용으로 전환
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotUsedCategoryUi;

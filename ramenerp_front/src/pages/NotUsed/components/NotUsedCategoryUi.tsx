// src/components/NotUsedCategoryUi.tsx
import React, { useEffect, useState } from "react";
import { markCategoryNotUsed } from "../function/CategoryNotUsedFunction";

type Props = {
  open: boolean;
  target: { id: number; category_name: string } | null; // ✅ DB PK 사용
  onClose: () => void;
  /** 미사용 전환 성공 후 목록 리로드 + 모달 닫기용 */
  onDone: () => void;
};

/** ====== 스타일: 단위 미사용 모달과 동일 느낌으로 조정 ====== */

const overlay_style: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.35)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
};

const modal_style: React.CSSProperties = {
  width: 420,
  maxWidth: "90vw",
  background: "#ffffff",
  borderRadius: 8,
  boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
  padding: 16,
  boxSizing: "border-box",
};

const row_style: React.CSSProperties = { marginBottom: 10 };

const input_style: React.CSSProperties = {
  width: "100%",
  padding: "6px 8px",
  boxSizing: "border-box",
  borderRadius: 6,
  border: "1px solid #d1d5db",
  fontSize: 13,
};

const error_style: React.CSSProperties = {
  marginTop: 4,
  fontSize: 12,
  color: "#dc2626",
};

const cancel_btn_style: React.CSSProperties = {
  padding: "6px 12px",
  borderRadius: 6,
  border: "1px solid #e5e7eb",
  background: "#ffffff",
  cursor: "pointer",
  fontSize: 13,
  color: "#374151",
};

const delete_btn_base_style: React.CSSProperties = {
  padding: "6px 12px",
  borderRadius: 6,
  border: "none",
  color: "#ffffff",
  fontSize: 13,
  cursor: "pointer",
};

/** ======================================================== */

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

  const need = target.category_name;

  return (
    <div style={overlay_style} onClick={onClose}>
      <div style={modal_style} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ margin: "0 0 10px 0", color: "#b91c1c" }}>
          카테고리 미사용 등록
        </h3>

        <div style={row_style}>
          정말로 <b>{need}</b> 카테고리를 미사용으로 등록하시겠습니까?
        </div>

        <div style={{ ...row_style, fontSize: 12, color: "#6b7280" }}>
          계속하려면 아래 입력란에 <b>{need}</b> 을(를) 정확히 입력하세요.
        </div>

        <input
          style={input_style}
          value={input_name}
          onChange={(e) => set_input_name(e.target.value)}
          placeholder={need}
        />

        {error_message && <div style={error_style}>{error_message}</div>}

        <div
          style={{
            display: "flex",
            gap: 8,
            justifyContent: "flex-end",
            marginTop: 12,
          }}
        >
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
            onClick={handle_confirm}
            disabled={!can_confirm}
            style={{
              ...delete_btn_base_style,
              background: can_confirm ? "#ef4444" : "#fca5a5",
              cursor: can_confirm ? "pointer" : "not-allowed",
            }}
          >
            미사용
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotUsedCategoryUi;

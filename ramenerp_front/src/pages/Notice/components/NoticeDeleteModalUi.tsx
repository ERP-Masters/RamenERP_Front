// src/pages/Notice/components/NoticeDeleteModalUi.tsx
import React, { useEffect, useState } from "react";
import { delete_notice } from "../function/NoticeDeleteFunction";

type NoticeDeleteModalProps = {
  open: boolean;
  target: { id: number; title: string } | null;
  on_close: () => void;
  on_done: () => void; // 삭제 후 리스트 갱신 + 모달 닫기
};

/* ===== 스타일 (NotUsedCategoryUi 참고) ===== */

const overlay_style: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.35)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1200,
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

const button_row_style: React.CSSProperties = {
  display: "flex",
  gap: 8,
  justifyContent: "flex-end",
  marginTop: 12,
};

/* ===== 컴포넌트 ===== */

const NoticeDeleteModalUi: React.FC<NoticeDeleteModalProps> = ({
  open,
  target,
  on_close,
  on_done,
}) => {
  const [input_title, set_input_title] = useState("");
  const [is_deleting, set_is_deleting] = useState(false);
  const [error_message, set_error_message] = useState("");

  // 모달 열릴 때마다 초기화
  useEffect(() => {
    if (open) {
      set_input_title("");
      set_is_deleting(false);
      set_error_message("");
    }
  }, [open, target]);

  if (!open || !target) return null;

  const need = target.title;

  const can_confirm =
    !is_deleting && input_title.trim() === (need ?? "").trim();

  const handle_confirm = async () => {
    if (!can_confirm || is_deleting) return;
    set_is_deleting(true);
    set_error_message("");

    try {
      await delete_notice(target.id);
      on_done(); // 부모에서 리스트 제거 + 모달 닫기
    } catch (e: any) {
      set_error_message(
        e?.message || "공지 삭제 중 오류가 발생했습니다.",
      );
      set_is_deleting(false);
    }
  };

  const handle_overlay_click = () => {
    if (!is_deleting) {
      on_close();
    }
  };

  return (
    <div style={overlay_style} onClick={handle_overlay_click}>
      <div
        style={modal_style}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ margin: "0 0 10px 0", color: "#b91c1c" }}>공지 삭제</h3>

        <div style={row_style}>
          정말로 <b>{need}</b> 공지사항을 삭제하시겠습니까?
        </div>

        <div style={{ ...row_style, fontSize: 12, color: "#6b7280" }}>
          계속하려면 아래 입력란에 <b>{need}</b> 을(를) 정확히 입력하세요.
        </div>

        <input
          style={input_style}
          value={input_title}
          onChange={(e) => set_input_title(e.target.value)}
          placeholder={need}
        />

        {error_message && <div style={error_style}>{error_message}</div>}

        <div style={button_row_style}>
          <button
            type="button"
            style={cancel_btn_style}
            onClick={on_close}
            disabled={is_deleting}
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
            삭제
          </button>
        </div>
      </div>
    </div>
  );
};

export default NoticeDeleteModalUi;

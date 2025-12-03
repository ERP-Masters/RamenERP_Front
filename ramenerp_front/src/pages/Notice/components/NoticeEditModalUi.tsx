// src/pages/Notice/components/NoticeEditModalUi.tsx
import React from "react";
import {
  useNoticeEditForm,
  type NoticeForEdit,
} from "../function/NoticeEditModalFunction";

/* ===== 모달 스타일 (NoticePageUi 와 동일 계열) ===== */

const modal_backdrop_style: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  backgroundColor: "rgba(15,23,42,0.45)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1300,
};

const modal_card_style: React.CSSProperties = {
  width: "min(720px, 100% - 32px)",
  maxHeight: "80vh",
  borderRadius: 16,
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  boxShadow: "0 18px 40px rgba(15,23,42,0.35)",
  padding: 20,
  display: "flex",
  flexDirection: "column",
};

const modal_header_style: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: 12,
};

const modal_title_style: React.CSSProperties = {
  margin: 0,
  fontSize: 18,
  fontWeight: 700,
  color: "#111827",
};

const modal_close_btn_style: React.CSSProperties = {
  width: 28,
  height: 28,
  borderRadius: 999,
  border: "1px solid #e5e7eb",
  background: "#f9fafb",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 16,
  lineHeight: 1,
};

const modal_form_style: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 16,
};

const modal_field_style: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
};

const modal_label_style: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: "#374151",
};

const modal_helper_style: React.CSSProperties = {
  fontSize: 11,
  color: "#9ca3af",
};

const modal_input_style: React.CSSProperties = {
  height: 36,
  borderRadius: 10,
  border: "1px solid #e5e7eb",
  padding: "0 10px",
  fontSize: 13,
  background: "#ffffff",
};

const modal_textarea_style: React.CSSProperties = {
  minHeight: 180,
  borderRadius: 10,
  border: "1px solid #e5e7eb",
  padding: "10px 10px",
  fontSize: 13,
  background: "#ffffff",
  resize: "vertical",
};

const modal_footer_style: React.CSSProperties = {
  marginTop: 4,
  display: "flex",
  justifyContent: "flex-end",
  gap: 8,
};

const modal_primary_btn_style: React.CSSProperties = {
  minWidth: 90,
  height: 34,
  borderRadius: 999,
  border: "none",
  background: "#111827",
  color: "#ffffff",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
  padding: "0 18px",
};

const modal_secondary_btn_style: React.CSSProperties = {
  minWidth: 80,
  height: 34,
  borderRadius: 999,
  border: "1px solid #e5e7eb",
  background: "#ffffff",
  color: "#374151",
  fontSize: 13,
  fontWeight: 500,
  cursor: "pointer",
  padding: "0 16px",
};

const modal_error_style: React.CSSProperties = {
  fontSize: 12,
  color: "#b91c1c",
};

/* ===== 컴포넌트 ===== */

type NoticeEditModalUiProps = {
  notice: NoticeForEdit;
  on_close: () => void;
  on_success: (updated: NoticeForEdit) => void;
};

const NoticeEditModalUi: React.FC<NoticeEditModalUiProps> = ({
  notice,
  on_close,
  on_success,
}) => {
  const {
    title,
    set_title,
    content,
    set_content,
    is_submitting,
    error,
    handle_submit,
    handle_cancel,
  } = useNoticeEditForm({ notice, on_success, on_close });

  const handle_backdrop_click = (
    e: React.MouseEvent<HTMLDivElement, MouseEvent>,
  ) => {
    if (e.target === e.currentTarget && !is_submitting) {
      handle_cancel();
    }
  };

  return (
    <div style={modal_backdrop_style} onClick={handle_backdrop_click}>
      <div style={modal_card_style} onClick={(e) => e.stopPropagation()}>
        <div style={modal_header_style}>
          <h2 style={modal_title_style}>공지 수정</h2>
          <button
            type="button"
            style={modal_close_btn_style}
            onClick={() => !is_submitting && handle_cancel()}
            aria-label="닫기"
          >
            ×
          </button>
        </div>

        <form
          onSubmit={handle_submit}
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <div style={modal_form_style}>
            {/* 제목 */}
            <div style={modal_field_style}>
              <label style={modal_label_style}>제목</label>
              <input
                style={modal_input_style}
                type="text"
                maxLength={200}
                value={title}
                onChange={(e) => set_title(e.target.value)}
                placeholder="공지 제목을 수정하세요."
              />
              <span style={modal_helper_style}>
                최대 200자까지 입력할 수 있습니다.
              </span>
            </div>

            {/* 내용 */}
            <div style={modal_field_style}>
              <label style={modal_label_style}>내용</label>
              <textarea
                style={modal_textarea_style}
                value={content}
                onChange={(e) => set_content(e.target.value)}
                placeholder="공지 내용을 수정하세요."
              />
              <span style={modal_helper_style}>
                라멘 ERP 전 지점에 공유될 내용을 수정합니다.
              </span>
            </div>

            {/* 에러 메시지 */}
            {error && <div style={modal_error_style}>{error}</div>}
          </div>

          <div style={modal_footer_style}>
            <button
              type="button"
              style={modal_secondary_btn_style}
              onClick={handle_cancel}
              disabled={is_submitting}
            >
              취소
            </button>
            <button
              type="submit"
              style={{
                ...modal_primary_btn_style,
                opacity: is_submitting ? 0.7 : 1,
                cursor: is_submitting ? "default" : "pointer",
              }}
              disabled={is_submitting}
            >
              {is_submitting ? "수정 중..." : "수정"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NoticeEditModalUi;

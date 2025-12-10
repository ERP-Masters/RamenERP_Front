// src/pages/NoticeRegisterPageUi.tsx
import React from "react";
import Sidebar from "@/menu/Sidebar";
import { useNoticeForm } from "../function/NoticeRegisterPageFunction";

/* ===== 스타일 ===== */

const outer_shell_style: React.CSSProperties = {
  position: "relative",
  minHeight: "100vh",
  background: "#f6f7f9",
};

const page_wrap_style: React.CSSProperties = {
  background: "#f6f7f9",
  minHeight: "100vh",
  padding: "24px 16px",
};

const page_style: React.CSSProperties = {
  padding: 16,
  maxWidth: 800,
  margin: "0 auto",
};

const header_row_style: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "space-between",
  gap: 12,
  marginBottom: 16,
};

const title_box_style: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
};

const title_style: React.CSSProperties = {
  margin: 0,
  fontSize: 20,
  fontWeight: 800,
  color: "#111827",
};

const subtitle_style: React.CSSProperties = {
  fontSize: 12,
  color: "#6b7280",
};

const card_style: React.CSSProperties = {
  borderRadius: 16,
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  padding: 20,
  boxShadow: "0 10px 24px rgba(15,23,42,0.06)",
};

const form_grid_style: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 16,
};

const field_style: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
};

const label_style: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: "#374151",
};

const helper_style: React.CSSProperties = {
  fontSize: 11,
  color: "#9ca3af",
};

const input_style: React.CSSProperties = {
  height: 36,
  borderRadius: 10,
  border: "1px solid #e5e7eb",
  padding: "0 10px",
  fontSize: 13,
  background: "#ffffff",
};

const textarea_style: React.CSSProperties = {
  minHeight: 180,
  borderRadius: 10,
  border: "1px solid #e5e7eb",
  padding: "10px 10px",
  fontSize: 13,
  background: "#ffffff",
  resize: "vertical",
};

const footer_style: React.CSSProperties = {
  marginTop: 20,
  display: "flex",
  justifyContent: "flex-end",
  gap: 8,
};

const primary_btn_style: React.CSSProperties = {
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

const secondary_btn_style: React.CSSProperties = {
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

const error_text_style: React.CSSProperties = {
  marginTop: 8,
  fontSize: 12,
  color: "#b91c1c",
};

const hamburger_btn_style: React.CSSProperties = {
  position: "fixed",
  top: 14,
  left: 60,
  width: 44,
  height: 44,
  borderRadius: 14,
  border: "1px solid #e5e7eb",
  background: "#ffffff",
  boxShadow: "0 8px 20px rgba(15,23,42,0.18)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  zIndex: 998,
};

const hamburger_stack_style: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
};

const hamburger_bar_style: React.CSSProperties = {
  width: 18,
  height: 2,
  borderRadius: 999,
  background: "#111827",
};

/* ===== 컴포넌트 ===== */

const NoticeRegisterPageUi: React.FC = () => {
  const {
    title,
    set_title,
    content,
    set_content,
    author_id_text,
    set_author_id_text,
    is_submitting,
    error,
    handle_submit,
    handle_cancel,
  } = useNoticeForm();

  const [is_sidebar_open, set_is_sidebar_open] = React.useState(false);

  return (
    <div style={outer_shell_style}>
      {/* 햄버거 버튼: 사이드바가 열려 있을 때는 숨김 */}
      {!is_sidebar_open && (
        <button
          type="button"
          style={hamburger_btn_style}
          onClick={() => set_is_sidebar_open(true)}
          aria-label="메뉴 열기"
        >
          <div style={hamburger_stack_style}>
            <span style={hamburger_bar_style} />
            <span style={hamburger_bar_style} />
            <span style={hamburger_bar_style} />
          </div>
        </button>
      )}

      {/* 오버레이 사이드바 */}
      <Sidebar
        is_open={is_sidebar_open}
        set_is_open={set_is_sidebar_open}
        mode="overlay"
      />

      {/* 본문 */}
      <div
        style={{
          ...page_wrap_style,
          opacity: is_sidebar_open ? 0.45 : 1,
          pointerEvents: is_sidebar_open ? "none" : "auto",
          transition: "opacity 200ms ease",
        }}
      >
        <div style={page_style}>
          <div style={header_row_style}>
            <div style={title_box_style}>
              <h1 style={title_style}>공지 등록</h1>
              <div style={subtitle_style}>
                라멘 ERP 전 지점에서 공유되는 공지사항을 등록합니다.
              </div>
            </div>
          </div>

          <div style={card_style}>
            <form onSubmit={handle_submit}>
              <div style={form_grid_style}>
                {/* 제목 */}
                <div style={field_style}>
                  <label style={label_style}>제목</label>
                  <input
                    style={input_style}
                    type="text"
                    maxLength={200}
                    value={title}
                    onChange={(e) => set_title(e.target.value)}
                    placeholder="공지 제목을 입력하세요."
                  />
                  <span style={helper_style}>
                    최대 200자까지 입력할 수 있습니다.
                  </span>
                </div>

                {/* 내용 */}
                <div style={field_style}>
                  <label style={label_style}>내용</label>
                  <textarea
                    style={textarea_style}
                    value={content}
                    onChange={(e) => set_content(e.target.value)}
                    placeholder="공지 내용을 입력하세요."
                  />
                  <span style={helper_style}>
                    라멘 ERP 전 지점에 공유될 내용을 입력해주세요.
                  </span>
                </div>

                {/* 작성자 ID */}
                <div style={field_style}>
                  <label style={label_style}>작성자 ID</label>
                  <input
                    style={input_style}
                    type="number"
                    value={author_id_text}
                    onChange={(e) => set_author_id_text(e.target.value)}
                    placeholder="작성자 ID(정수)를 입력하세요."
                  />
                  <span style={helper_style}>
                    로그인 사용자의 내부 식별자(정수 값)를 입력합니다.
                  </span>
                </div>

                {/* 에러 메시지 */}
                {error && <div style={error_text_style}>{error}</div>}
              </div>

              <div style={footer_style}>
                <button
                  type="button"
                  style={secondary_btn_style}
                  onClick={handle_cancel}
                  disabled={is_submitting}
                >
                  취소
                </button>
                <button
                  type="submit"
                  style={{
                    ...primary_btn_style,
                    opacity: is_submitting ? 0.7 : 1,
                    cursor: is_submitting ? "default" : "pointer",
                  }}
                  disabled={is_submitting}
                >
                  {is_submitting ? "등록 중..." : "등록"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoticeRegisterPageUi;

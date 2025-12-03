// src/pages/Notice/components/NoticePageUi.tsx
import React, { useEffect, useState } from "react";
import Sidebar from "@/menu/Sidebar";
import { useNoticeForm } from "../function/NoticeRegisterPageFunction";
import NoticeEditModalUi from "./NoticeEditModalUi"; // 수정 모달
import type { NoticeForEdit } from "../function/NoticeEditModalFunction";
import NoticeDeleteModalUi from "./NoticeDeleteModalUi"; // ✅ 삭제 모달 추가

type Notice = {
  id: number;
  title: string;
  content: string;
  author_id: number;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
};

const page_size = 8;

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
  maxWidth: 1200,
  margin: "0 auto",
};

const header_row_style: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "space-between",
  gap: 12,
  marginBottom: 12,
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

/* 필터 바: 좌측 필터 / 우측 버튼 */
const filter_bar_style: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "space-between",
  gap: 12,
  marginTop: 8,
};

const filter_fields_row_style: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  alignItems: "flex-end",
  gap: 12,
  flex: "1 1 auto",
};

const filter_field_style: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
  minWidth: 160,
};

const filter_label_style: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: "#6b7280",
};

const filter_select_style: React.CSSProperties = {
  height: 32,
  borderRadius: 8,
  border: "1px solid #e6e8ec",
  padding: "0 10px",
  fontSize: 13,
  background: "#ffffff",
};

const filter_input_style: React.CSSProperties = {
  height: 32,
  borderRadius: 8,
  border: "1px solid #e6e8ec",
  padding: "0 10px",
  fontSize: 13,
  background: "#ffffff",
};

const filter_actions_style: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  flexShrink: 0,
};

const filter_btn_style: React.CSSProperties = {
  height: 32,
  padding: "0 16px",
  borderRadius: 999,
  border: "none",
  background: "#111827",
  color: "#ffffff",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const btn_notice_style: React.CSSProperties = {
  height: 32,
  padding: "0 16px",
  borderRadius: 999,
  border: "1px solid #fb923c",
  background: "#fed7aa", // 연한 주황
  color: "#9a3412",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const table_card_style: React.CSSProperties = {
  border: "1px solid #e6e8ec",
  borderRadius: 12,
  background: "#ffffff",
  display: "flex",
  flexDirection: "column",
  maxHeight: "none",
  overflow: "visible",
  marginTop: 16,
};

const table_scroll_style: React.CSSProperties = {
  flex: 1,
  overflowY: "visible",
  overflowX: "auto",
};

const table_style: React.CSSProperties = {
  width: "100%",
  borderCollapse: "separate",
  borderSpacing: 0,
};

const th_style: React.CSSProperties = {
  padding: "10px 8px",
  textAlign: "left",
  background: "#f8fafc",
  borderBottom: "1px solid #e6e8ec",
  fontSize: 13,
  fontWeight: 700,
  position: "sticky",
  top: 0,
  zIndex: 1,
  whiteSpace: "nowrap",
};

const td_style: React.CSSProperties = {
  borderBottom: "1px solid #e6e8ec",
  padding: "10px 8px",
  textAlign: "left",
  whiteSpace: "nowrap",
  fontSize: 13,
};

const empty_row_style: React.CSSProperties = {
  padding: 14,
  textAlign: "left",
  color: "#b91c1c",
  fontSize: 12, // 작게 + 빨간색
};

const pagination_bar_style: React.CSSProperties = {
  borderTop: "1px solid #e6e8ec",
  padding: "8px 12px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8,
};

const meta_text_style: React.CSSProperties = {
  fontSize: 11,
  color: "#6b7280",
};

const pagination_buttons_style: React.CSSProperties = {
  display: "flex",
  gap: 4,
  alignItems: "center",
};

const page_btn_style: React.CSSProperties = {
  minWidth: 28,
  height: 28,
  borderRadius: 999,
  border: "1px solid #e6e8ec",
  background: "#ffffff",
  fontSize: 12,
  cursor: "pointer",
  padding: "0 8px",
  whiteSpace: "nowrap",
};

const page_btn_active_style: React.CSSProperties = {
  minWidth: 28,
  height: 28,
  borderRadius: 999,
  border: "1px solid #111827",
  background: "#111827",
  fontSize: 12,
  cursor: "pointer",
  color: "#ffffff",
  padding: "0 8px",
  whiteSpace: "nowrap",
};

const page_btn_side_style: React.CSSProperties = {
  minWidth: 28,
  height: 28,
  borderRadius: 999,
  border: "1px solid #e6e8ec",
  background: "#ffffff",
  fontSize: 12,
  cursor: "pointer",
  padding: "0 8px",
  whiteSpace: "nowrap",
};

/* 햄버거 버튼 전용 스타일 */
const hamburger_btn_style: React.CSSProperties = {
  position: "fixed",
  top: 14,
  left: 60, // 기존보다 살짝 오른쪽
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
  zIndex: 998, // 내용 위, 사이드바(backdrop 1000, panel 1001)보다 아래
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

/* ===== 모달 스타일 ===== */

const modal_backdrop_style: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  backgroundColor: "rgba(15,23,42,0.45)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1200, // 사이드바보다 위
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

/* 🔧 행 관리 컬럼용 스타일 */

const actions_cell_style: React.CSSProperties = {
  ...td_style,
  textAlign: "center",
  whiteSpace: "nowrap",
};

const icon_btn_base_style: React.CSSProperties = {
  width: 28,
  height: 28,
  borderRadius: 999,
  border: "1px solid transparent",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 0,
  marginLeft: 4,
  cursor: "pointer",
};

const icon_btn_edit_style: React.CSSProperties = {
  ...icon_btn_base_style,
  border: "1px solid #d1d5db",
  background: "#f3f4f6",
};

const icon_btn_delete_style: React.CSSProperties = {
  ...icon_btn_base_style,
  border: "1px solid #fecaca",
  background: "#fef2f2",
};

const icon_svg_style: React.CSSProperties = {
  display: "block",
};

/* 날짜 문자열에서 YYYY-MM-DD 부분만 추출 */
const get_date_part = (value: string): string =>
  value ? value.slice(0, 10) : "";

/* ===== 공지 등록 모달 컴포넌트 (등록) ===== */

type NoticeRegisterModalProps = {
  on_close: () => void;
};

const NoticeRegisterModal: React.FC<NoticeRegisterModalProps> = ({
  on_close,
}) => {
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
  } = useNoticeForm();

  const handle_backdrop_click = (
    e: React.MouseEvent<HTMLDivElement, MouseEvent>,
  ) => {
    if (e.target === e.currentTarget && !is_submitting) {
      on_close();
    }
  };

  return (
    <div style={modal_backdrop_style} onClick={handle_backdrop_click}>
      <div style={modal_card_style} onClick={(e) => e.stopPropagation()}>
        <div style={modal_header_style}>
          <h2 style={modal_title_style}>공지 등록</h2>
          <button
            type="button"
            style={modal_close_btn_style}
            onClick={() => !is_submitting && on_close()}
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
                placeholder="공지 제목을 입력하세요."
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
                placeholder="공지 내용을 입력하세요."
              />
              <span style={modal_helper_style}>
                라멘 ERP 전 지점에 공유될 내용을 입력해주세요.
              </span>
            </div>

            {/* 작성자 ID */}
            <div style={modal_field_style}>
              <label style={modal_label_style}>작성자 ID</label>
              <input
                style={modal_input_style}
                type="number"
                value={author_id_text}
                onChange={(e) => set_author_id_text(e.target.value)}
                placeholder="작성자 ID(정수)를 입력하세요."
              />
              <span style={modal_helper_style}>
                로그인 사용자의 내부 식별자(정수 값)를 입력합니다.
              </span>
            </div>

            {/* 에러 메시지 */}
            {error && <div style={modal_error_style}>{error}</div>}
          </div>

          <div style={modal_footer_style}>
            <button
              type="button"
              style={modal_secondary_btn_style}
              onClick={() => !is_submitting && on_close()}
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
              {is_submitting ? "등록 중..." : "등록"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ===== 공지 리스트 페이지 ===== */

const NoticePageUi: React.FC = () => {
  const [notices, set_notices] = useState<Notice[]>([]);
  const [current_page, set_current_page] = useState(1);
  const [loading, set_loading] = useState(false);
  const [error, set_error] = useState("");
  const [is_sidebar_open, set_is_sidebar_open] = useState(false);
  const [is_register_open, set_is_register_open] = useState(false);

  // 🔍 필터 상태
  const [filter_title, set_filter_title] = useState("");
  const [filter_created_date, set_filter_created_date] = useState("");
  const [filter_updated_date, set_filter_updated_date] = useState("");

  // ✏ 수정 대상 공지
  const [edit_target_notice, set_edit_target_notice] =
    useState<NoticeForEdit | null>(null);

  // 🗑 삭제 모달 상태
  const [is_delete_open, set_is_delete_open] = useState(false);
  const [delete_target, set_delete_target] = useState<{
    id: number;
    title: string;
  } | null>(null);

  // 🔄 공지 데이터 불러오기
  useEffect(() => {
    const fetch_notices = async () => {
      set_loading(true);
      set_error("");

      try {
        const res = await fetch("/api/notice", {
          method: "GET",
          headers: { Accept: "application/json" },
        });

        const text = await res.text();
        if (!res.ok) {
          throw new Error(text || `HTTP ${res.status}`);
        }

        const json = text ? JSON.parse(text) : null;

        const raw_list: any[] = Array.isArray(json) ? json : json ? [json] : [];

        const normalized: Notice[] = raw_list
          .map((n) => ({
            id: Number(n.id),
            title: String(n.title ?? "").trim(),
            content: String(n.content ?? "").trim(),
            author_id: Number(n.author_id),
            is_pinned: Boolean(n.is_pinned),
            created_at: String(n.created_at ?? "").trim(),
            updated_at: String(n.updated_at ?? "").trim(),
          }))
          // 최신(created_at) → 오래된 순
          .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));

        set_notices(normalized);
        set_current_page(1);
      } catch (e: any) {
        set_error(e?.message || "공지사항을 불러오지 못했습니다.");
      } finally {
        set_loading(false);
      }
    };

    void fetch_notices();
  }, []);

  // 🔍 필터링 적용
  const filtered_notices = notices.filter((n) => {
    const title_keyword = filter_title.trim().toLowerCase();
    const matches_title =
      title_keyword === ""
        ? true
        : n.title.toLowerCase().includes(title_keyword);

    const created_date = get_date_part(n.created_at);
    const updated_date = get_date_part(n.updated_at);

    const matches_created =
      filter_created_date === "" ? true : created_date === filter_created_date;

    const matches_updated =
      filter_updated_date === "" ? true : updated_date === filter_updated_date;

    return matches_title && matches_created && matches_updated;
  });

  const total = filtered_notices.length;
  const page_count = Math.max(1, Math.ceil(total / page_size));

  const start_index = (current_page - 1) * page_size;
  const end_index = start_index + page_size;
  const page_items = filtered_notices.slice(start_index, end_index);

  const go_to_page = (page: number) => {
    if (page < 1 || page > page_count) return;
    set_current_page(page);
  };

  const page_numbers = Array.from({ length: page_count }, (_, idx) => idx + 1);

  const handle_filter_search = () => {
    set_current_page(1);
  };

  // 🗑 삭제 모달 열기
  const handle_open_delete = (notice: Notice) => {
    set_delete_target({ id: notice.id, title: notice.title });
    set_is_delete_open(true);
  };

  // ✏ 수정 모달 열기
  const handle_open_edit = (notice: Notice) => {
    const as_edit: NoticeForEdit = { ...notice };
    set_edit_target_notice(as_edit);
  };

  const handle_edit_success = (updated: NoticeForEdit) => {
    set_notices((prev) =>
      prev.map((n) => (n.id === updated.id ? { ...n, ...updated } : n)),
    );
  };

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

      {/* 본문: 사이드바 열릴 때만 살짝 어둡고 비활성화 */}
      <div
        style={{
          ...page_wrap_style,
          opacity: is_sidebar_open ? 0.45 : 1,
          pointerEvents: is_sidebar_open ? "none" : "auto",
          transition: "opacity 200ms ease",
        }}
      >
        <div style={page_style}>
          {/* 상단 제목 */}
          <div style={header_row_style}>
            <div style={title_box_style}>
              <h1 style={title_style}>공지사항</h1>
              <div style={subtitle_style}>
                지점별 · 날짜별 공지사항 기록을 조회하고 신규 공지를 등록합니다.
              </div>
            </div>
          </div>

          {/* 필터 바: 좌측 필터 / 우측 버튼 */}
          <div style={filter_bar_style}>
            <div style={filter_fields_row_style}>
              {/* 1. 제목 */}
              <div style={filter_field_style}>
                <label style={filter_label_style}>제목</label>
                <input
                  style={filter_input_style}
                  type="text"
                  placeholder="공지 제목"
                  value={filter_title}
                  onChange={(e) => set_filter_title(e.target.value)}
                />
              </div>

              {/* 2. 작성 일시 */}
              <div style={filter_field_style}>
                <label style={filter_label_style}>작성 일시</label>
                <input
                  style={filter_input_style}
                  type="date"
                  placeholder="작성 일시"
                  value={filter_created_date}
                  onChange={(e) => set_filter_created_date(e.target.value)}
                />
              </div>

              {/* 3. 수정 일시 */}
              <div style={filter_field_style}>
                <label style={filter_label_style}>수정 일시</label>
                <input
                  style={filter_input_style}
                  type="date"
                  placeholder="수정 일시"
                  value={filter_updated_date}
                  onChange={(e) => set_filter_updated_date(e.target.value)}
                />
              </div>
            </div>

            <div style={filter_actions_style}>
              <button
                type="button"
                style={filter_btn_style}
                onClick={handle_filter_search}
              >
                조회
              </button>
              <button
                type="button"
                style={btn_notice_style}
                onClick={() => set_is_register_open(true)}
              >
                공지 등록
              </button>
            </div>
          </div>

          {/* 공지 리스트 + 페이지네이션 */}
          <div style={table_card_style}>
            <div style={table_scroll_style}>
              <table style={table_style}>
                <thead>
                  <tr>
                    <th style={th_style}>No</th>
                    <th style={th_style}>제목</th>
                    <th style={th_style}>작성자 ID</th>
                    <th style={th_style}>생성시간</th>
                    <th style={{ ...th_style, textAlign: "center" }}>관리</th>
                  </tr>
                </thead>
                <tbody>
                  {/* 에러 메시지 */}
                  {error && (
                    <tr>
                      <td style={empty_row_style} colSpan={5}>
                        {error}
                      </td>
                    </tr>
                  )}

                  {/* 공지가 하나도 없는 경우 */}
                  {!error && !loading && total === 0 && (
                    <tr>
                      <td style={empty_row_style} colSpan={5}>
                        등록되어 있는 공지가 없습니다.
                      </td>
                    </tr>
                  )}

                  {/* 공지 목록 */}
                  {page_items.map((n, idx) => {
                    const row_no = start_index + idx + 1;
                    const row_style: React.CSSProperties =
                      row_no % 2 === 0 ? { background: "#fafafa" } : {};

                    return (
                      <tr key={n.id} style={row_style} title={n.content}>
                        <td style={td_style}>{row_no}</td>
                        <td style={{ ...td_style, whiteSpace: "normal" }}>
                          {n.title}
                        </td>
                        <td style={td_style}>{n.author_id}</td>
                        <td style={td_style}>{n.created_at}</td>
                        <td style={actions_cell_style}>
                          {/* 연필 아이콘 버튼 */}
                          <button
                            type="button"
                            style={icon_btn_edit_style}
                            onClick={() => handle_open_edit(n)}
                            aria-label="공지 수정"
                          >
                            <svg
                              style={icon_svg_style}
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              aria-hidden="true"
                            >
                              <path
                                d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1.003 1.003 0 0 0 0-1.42l-2.34-2.34a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z"
                                fill="#4b5563"
                              />
                            </svg>
                          </button>

                          {/* 휴지통 아이콘 버튼 */}
                          <button
                            type="button"
                            style={icon_btn_delete_style}
                            onClick={() => handle_open_delete(n)}
                            aria-label="공지 삭제"
                          >
                            <svg
                              style={icon_svg_style}
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              aria-hidden="true"
                            >
                              <path
                                d="M6 7h12v13a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V7zm3 3v9h2v-9H9zm4 0v9h2v-9h-2z"
                                fill="#b91c1c"
                              />
                              <path
                                d="M9 4V3a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1h4v2H5V4h4zm2-1v1h2V3h-2z"
                                fill="#b91c1c"
                              />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* 페이지네이션 바 */}
            <div style={pagination_bar_style}>
              <div style={meta_text_style}>
                {loading
                  ? "불러오는 중..."
                  : `전체 ${total}건 · ${current_page} / ${page_count}페이지`}
              </div>
              <div style={pagination_buttons_style}>
                {/* 이전 */}
                <button
                  type="button"
                  disabled={current_page === 1}
                  style={
                    current_page === 1
                      ? {
                          ...page_btn_side_style,
                          opacity: 0.5,
                          cursor: "default",
                        }
                      : page_btn_side_style
                  }
                  onClick={() =>
                    current_page > 1 && go_to_page(current_page - 1)
                  }
                >
                  이전
                </button>

                {/* 페이지 번호들 */}
                {page_numbers.map((p) => (
                  <button
                    key={p}
                    type="button"
                    style={
                      p === current_page ? page_btn_active_style : page_btn_style
                    }
                    onClick={() => go_to_page(p)}
                  >
                    {p}
                  </button>
                ))}

                {/* 다음 */}
                <button
                  type="button"
                  disabled={current_page === page_count}
                  style={
                    current_page === page_count
                      ? {
                          ...page_btn_side_style,
                          opacity: 0.5,
                          cursor: "default",
                        }
                      : page_btn_side_style
                  }
                  onClick={() =>
                    current_page < page_count && go_to_page(current_page + 1)
                  }
                >
                  다음
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 🔹 공지 등록 모달 */}
      {is_register_open && (
        <NoticeRegisterModal on_close={() => set_is_register_open(false)} />
      )}

      {/* 🔹 공지 수정 모달 */}
      {edit_target_notice && (
        <NoticeEditModalUi
          notice={edit_target_notice}
          on_close={() => set_edit_target_notice(null)}
          on_success={handle_edit_success}
        />
      )}

      {/* 🔹 공지 삭제 모달 */}
      {delete_target && (
        <NoticeDeleteModalUi
          open={is_delete_open}
          target={delete_target}
          on_close={() => {
            set_is_delete_open(false);
            set_delete_target(null);
          }}
          on_done={() => {
            if (delete_target) {
              set_notices((prev) =>
                prev.filter((n) => n.id !== delete_target.id),
              );
            }
            set_is_delete_open(false);
            set_delete_target(null);
          }}
        />
      )}
    </div>
  );
};

export default NoticePageUi;

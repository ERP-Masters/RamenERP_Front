// src/components/CategoryListPanel.tsx
import React, { useEffect, useState } from "react";
import CategoryEditPage, { CategoryEditTarget } from "./CategoryEditPage";

// 삭제 모달 UI & 서비스 (기존)
import CategoryDeleteUI from "../components/CategoryDeleteUi";
import { deleteCategoryWithAlerts } from "../pages/CategoryDeleteFunction";

// ✅ 모달로 띄울 등록 페이지 (기존 페이지 그대로 사용)
import CategoryRegisterPage from "../pages/CategoryRegisterPage";

type ApiCategory = {
  category_id: number;
  group: string;
  category_name: string;
  is_active?: boolean | null;
};

type CategoryRow = {
  category_id: number;
  group: string;
  category_name: string;
  is_active?: boolean;
};

/* ===== 화면 공통 토큰(유닛/창고와 동일) ===== */
const ui_tok = {
  bg_page: "#f6f7f9",
  surface: "#ffffff",
  border: "#e6e8ec",
  header_bg: "#f8fafc",
  zebra: "#fafafa",
  text: "#111827",
  label: "#6b7280",
  radius: 12,
  focus: "0 0 0 3px rgba(14,165,233,0.25)",
  primary_bg: "#0ea5e9",
  primary_border: "#0284c7",
  primary_text: "#ffffff",
} as const;

/* ===== 페이지 레이아웃 ===== */
const page_wrap_style: React.CSSProperties = { background: ui_tok.bg_page, minHeight: "100%", padding: "24px 16px" };
const page_style = { padding: 16, maxWidth: 1200, margin: "0 auto" } as const;

/* ===== 제목/컨트롤 라인 (박스 밖) ===== */
const controls_block_style: React.CSSProperties = { marginTop: 4, marginBottom: 6 };
const controls_title_style: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 800,
  color: ui_tok.text,
  margin: "0 0 6px 0",
  transform: "translateY(-20px)",
};
const top_row_style: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  marginTop: -10,
};
const top_controls_style: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
};

const create_btn_style: React.CSSProperties = {
  height: 40,
  padding: "0 16px",
  borderRadius: 999,
  border: `1px solid ${ui_tok.primary_border}`,
  background: ui_tok.primary_bg,
  color: ui_tok.primary_text,
  fontWeight: 800,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

/* ===== 네모 박스(카드): 고정 높이 + 내부 스크롤 ===== */
const table_card_style: React.CSSProperties = {
  border: `1px solid ${ui_tok.border}`,
  borderRadius: ui_tok.radius,
  background: ui_tok.surface,
  display: "flex",
  flexDirection: "column",
  maxHeight: "60vh",
  overflow: "hidden",
  marginTop: -4,
};
const table_scroll_style = { flex: 1, overflowY: "auto", overflowX: "auto" } as const;

const table_style = { width: "100%", borderCollapse: "separate" as const, borderSpacing: 0 } as const;
const th_style = {
  padding: "12px 10px",
  textAlign: "left" as const,
  background: ui_tok.header_bg,
  borderBottom: `1px solid ${ui_tok.border}`,
  fontSize: 13,
  fontWeight: 700,
  position: "sticky" as const,
  top: 0,
  zIndex: 1,
} as const;
const td_style = { borderBottom: `1px solid ${ui_tok.border}`, padding: 12, textAlign: "left" as const, whiteSpace: "nowrap" as const } as const;
const empty_style = { padding: 24, textAlign: "center", color: ui_tok.label } as const;

/* 이름 셀 좌/우 배치 + 액션 아이콘 */
const name_cell_style: React.CSSProperties = {
  ...td_style,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8,
};
const icon_btn_style: React.CSSProperties = { background: "transparent", border: "none", padding: 4, cursor: "pointer", lineHeight: 0 };

const to_row = (c: ApiCategory): CategoryRow => ({
  category_id: c.category_id,
  group: String(c.group ?? "").trim(),
  category_name: String(c.category_name ?? "").trim(),
  is_active: c.is_active ?? true,
});

const CategoryListPanel: React.FC = () => {
  const [rows, set_rows] = useState<CategoryRow[]>([]);
  const [is_loading, set_is_loading] = useState(false);
  const [error_message, set_error_message] = useState("");

  // 수정 모달(기존)
  const [edit_open, set_edit_open] = useState<boolean>(false);
  const [edit_target, set_edit_target] = useState<CategoryEditTarget | null>(null);

  // 삭제 모달(추가)
  const [del_open, set_del_open] = useState<boolean>(false);
  const [del_target, set_del_target] = useState<{ category_id: number; category_name: string } | null>(null);

  // ✅ 등록 모달
  const [reg_open, set_reg_open] = useState(false);

  const load = async (signal?: AbortSignal) => {
    set_is_loading(true);
    set_error_message("");
    try {
      const res = await fetch("/api/category", { method: "GET", headers: { Accept: "application/json" }, signal });
      const raw = await res.text();
      if (!res.ok) {
        let msg = `HTTP ${res.status}`;
        try { msg = (raw ? JSON.parse(raw) : null)?.message || msg; } catch {}
        throw new Error(msg);
      }
      const list: ApiCategory[] = raw ? JSON.parse(raw) : [];
      set_rows(Array.isArray(list) ? list.map(to_row) : []);
    } catch (e: any) {
      if (e?.name !== "AbortError") set_error_message(e?.message || "카테고리 목록을 불러오는 중 오류가 발생했습니다.");
    } finally {
      set_is_loading(false);
    }
  };

  useEffect(() => {
    const ac = new AbortController();
    load(ac.signal);
    return () => ac.abort();
  }, []);

  // (선택) 생성/취소 이벤트 받아서 모달 닫고 새로고침 – CategoryRegisterPage가 해당 이벤트를 쏘면 동작
  useEffect(() => {
    const onCreated = () => { set_reg_open(false); load(); };
    const onCancel = () => { set_reg_open(false); };
    window.addEventListener("category:created", onCreated);
    window.addEventListener("category:register:cancel", onCancel);
    return () => {
      window.removeEventListener("category:created", onCreated);
      window.removeEventListener("category:register:cancel", onCancel);
    };
  }, []);

  const open_edit = (r: CategoryRow) => {
    set_edit_target({ category_id: r.category_id, group: r.group, category_name: r.category_name });
    set_edit_open(true);
  };
  const close_edit = () => set_edit_open(false);

  const handle_saved = (updated: ApiCategory) => {
    set_rows((prev) =>
      prev.map((row) =>
        row.category_id === updated.category_id
          ? { ...row, group: updated.group, category_name: updated.category_name }
          : row
      )
    );
  };

  const open_delete = (r: CategoryRow) => {
    set_del_target({ category_id: r.category_id, category_name: r.category_name });
    set_del_open(true);
  };
  const close_delete = () => set_del_open(false);

  return (
    <div style={page_wrap_style}>
      <div style={page_style}>
        {/* 상단 타이틀 & 우측 ‘신규 카테고리 등록’ 버튼 */}
        <div style={controls_block_style}>
          <div style={controls_title_style}>카테고리 조회</div>
          <div style={top_row_style}>
            <div style={top_controls_style} />
            <button type="button" style={create_btn_style} onClick={() => set_reg_open(true)}>
              신규 카테고리 등록
            </button>
          </div>
        </div>

        {/* 네모 박스(고정 높이 + 내부 스크롤) */}
        <div style={table_card_style}>
          {is_loading && <div style={{ margin: "8px 12px", color: ui_tok.label }}>불러오는 중…</div>}
          {error_message && <div style={{ color: "#c62828", margin: "8px 12px" }}>{error_message}</div>}

          <div style={table_scroll_style}>
            <table style={table_style}>
              <thead>
                <tr>
                  <th style={th_style}>category_id</th>
                  <th style={th_style}>group</th>
                  <th style={th_style}>category_name</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, idx) => (
                  <tr
                    key={r.category_id}
                    title={`${r.group} · ${r.category_name}`}
                    style={idx % 2 === 1 ? { background: ui_tok.zebra } : undefined}
                  >
                    <td style={td_style}>{r.category_id}</td>
                    <td style={td_style}>{r.group}</td>
                    <td style={name_cell_style}>
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{r.category_name}</span>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        {/* 수정: 회색 연필 아이콘 */}
                        <button
                          type="button"
                          style={icon_btn_style}
                          onClick={() => open_edit(r)}
                          title="수정"
                          aria-label="수정"
                        >
                          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                            <path
                              d="M13.585 3.586a2 2 0 0 1 2.828 2.828l-8.486 8.486-3.414.586.586-3.414 8.486-8.486Z"
                              stroke="#374151"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            <path d="M12 5l3 3" stroke="#374151" strokeWidth="1.5" strokeLinecap="round" />
                          </svg>
                        </button>

                        {/* 삭제: 빨간 휴지통 아이콘 */}
                        <button
                          type="button"
                          style={icon_btn_style}
                          onClick={() => open_delete(r)}
                          title="삭제"
                          aria-label="삭제"
                        >
                          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                            <path d="M6 7h8l-.7 9.1a2 2 0 0 1-2 1.9H8.7a2 2 0 0 1-2-1.9L6 7Z" stroke="#ef4444" strokeWidth="1.5" />
                            <path d="M4 7h12M8 7V4h4v3" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && !is_loading && !error_message && (
                  <tr>
                    <td colSpan={3} style={empty_style}>등록된 카테고리가 없습니다.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 수정 모달 (기존 유지) */}
        <CategoryEditPage open={edit_open} target={edit_target} onClose={close_edit} onSaved={handle_saved} />

        {/* 삭제 모달 */}
        <CategoryDeleteUI
          open={del_open}
          target={del_target}
          onClose={close_delete}
          onConfirm={async () => {
            if (!del_target) return;
            await deleteCategoryWithAlerts(del_target, (deletedId) => {
              set_rows((prev) => prev.filter((c) => c.category_id !== deletedId));
            });
            set_del_open(false);
          }}
        />

        {/* ✅ 등록 모달: CategoryRegisterPage 그대로 사용 */}
        {reg_open && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.35)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 9998,
            }}
            onClick={() => set_reg_open(false)}
          >
            <div
              style={{
                width: "min(900px, 94vw)",
                maxHeight: "90vh",
                overflowY: "auto",
                background: "#fff",
                border: `1px solid ${ui_tok.border}`,
                borderRadius: 12,
                boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
                padding: 16,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>카테고리 등록</h2>
                <button
                  type="button"
                  style={{ padding: "6px 10px", borderRadius: 8, border: `1px solid ${ui_tok.border}`, background: "#fff", cursor: "pointer" }}
                  onClick={() => set_reg_open(false)}
                >
                  닫기
                </button>
              </div>
              <CategoryRegisterPage />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryListPanel;

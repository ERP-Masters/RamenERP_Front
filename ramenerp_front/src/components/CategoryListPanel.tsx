// src/components/CategoryListPanel.tsx
import React, { useEffect, useState } from "react";
import CategoryEditPage, { CategoryEditTarget } from "./CategoryEditPage"; // ✅ 추가

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

const panel_style = {
  border: "1px solid #e5e7eb",
  borderRadius: 8,
  padding: 12,
  // ⬇️ 박스를 더 아래로 내리기 (위 여백 증가)
  marginTop: 37,
  // ⬇️ 고정 높이 + 내부 스크롤
  height: 375,
  overflowY: "auto",
  overflowX: "hidden",
  background: "#fafafa",
} as const;

const table_style = { width: "100%", borderCollapse: "collapse" } as const;
const th_style = { borderBottom: "1px solid #ddd", padding: 8, textAlign: "left", background: "#f3f4f6" } as const;
const td_style = { borderBottom: "1px solid #eee", padding: 8, textAlign: "left", whiteSpace: "nowrap" } as const;
const empty_style = { padding: 16, textAlign: "center", color: "#6b7280" } as const;

const to_row = (c: ApiCategory): CategoryRow => ({
  category_id: c.category_id,
  group: String(c.group ?? "").trim(),
  category_name: String(c.category_name ?? "").trim(),
  is_active: c.is_active ?? true,
});

// ✅ '수정' 버튼 스타일(추가)
const edit_btn_style: React.CSSProperties = {
  marginLeft: 8,
  fontSize: 12,
  padding: "4px 8px",
};

// ✅ 이름 셀을 좌우 분할해 버튼 붙이기(추가)
const name_cell_style: React.CSSProperties = {
  ...td_style,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8,
};

const CategoryListPanel: React.FC = () => {
  const [rows, set_rows] = useState<CategoryRow[]>([]);
  const [is_loading, set_is_loading] = useState(false);
  const [error_message, set_error_message] = useState("");

  // ✅ 수정 모달 상태(추가)
  const [edit_open, set_edit_open] = useState<boolean>(false);
  const [edit_target, set_edit_target] = useState<CategoryEditTarget | null>(null);

  useEffect(() => {
    const ac = new AbortController();
    const load = async () => {
      set_is_loading(true);
      set_error_message("");
      try {
        const res = await fetch("/api/category", {
          method: "GET",
          headers: { Accept: "application/json" },
          signal: ac.signal,
        });

        const raw = await res.text();
        if (!res.ok) {
          let msg = `HTTP ${res.status}`;
          try {
            const err = raw ? JSON.parse(raw) : null;
            msg = err?.message || msg;
          } catch {}
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

    load();
    return () => ac.abort();
  }, []);

  // ✅ 수정 열기/닫기/저장 핸들러(추가)
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

  return (
    <div style={panel_style}>
      {/* 제목 문구 제거 */}
      {is_loading && <div style={{ margin: "6px 0" }}>불러오는 중…</div>}
      {error_message && <div style={{ color: "crimson", margin: "6px 0" }}>{error_message}</div>}

      <table style={table_style}>
        <thead>
          <tr>
            <th style={th_style}>category_id</th>
            <th style={th_style}>group</th>
            <th style={th_style}>category_name</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.category_id} title={`${r.group} · ${r.category_name}`}>
              <td style={td_style}>{r.category_id}</td>
              <td style={td_style}>{r.group}</td>
              {/* ✅ 이름 + '수정' 버튼을 한 셀에 배치 */}
              <td style={name_cell_style}>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{r.category_name}</span>
                <button type="button" style={edit_btn_style} onClick={() => open_edit(r)}>
                  수정
                </button>
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

      {/* ✅ 모달 렌더링(추가) */}
      <CategoryEditPage open={edit_open} target={edit_target} onClose={close_edit} onSaved={handle_saved} />
    </div>
  );
};

export default CategoryListPanel;

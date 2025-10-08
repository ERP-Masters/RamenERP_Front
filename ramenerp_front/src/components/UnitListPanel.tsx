// src/components/UnitListPanel.tsx
import React, { useEffect, useState } from "react";

// 수정 UI/기능 (기존)
import UnitEditUI from "../components/UnitEditUi";
import { putUnit, type UnitEditTarget } from "../pages/UnitEditFunction";

// ✅ 추가: 삭제 UI/기능
import UnitDeleteUI from "../components/UnitDeleteUi";
import { deleteUnitWithAlerts, type UnitDeleteTarget } from "../pages/UnitDeleteFuncion";

type ApiUnit = {
  unit_id: number;
  code: string;
  name: string;
  is_active?: boolean | null;
};

type UnitRow = {
  unit_id: number;
  code: string;
  name: string;
  is_active?: boolean;
};

const panel_style = {
  border: "1px solid #e5e7eb",
  borderRadius: 8,
  padding: 12,
  marginTop: 35,
  height: "53vh",
  overflowY: "auto",
  overflowX: "hidden",
  background: "#fafafa",
  boxSizing: "border-box",
} as const;

const table_style = { width: "100%", borderCollapse: "collapse" } as const;
const th_style = { borderBottom: "1px solid #ddd", padding: 8, textAlign: "left", background: "#f3f4f6" } as const;
const td_style = { borderBottom: "1px solid #eee", padding: 8, textAlign: "left", whiteSpace: "nowrap" } as const;
const empty_style = { padding: 16, textAlign: "center", color: "#6b7280" } as const;

const to_row = (u: ApiUnit): UnitRow => ({
  unit_id: u.unit_id,
  code: String(u.code ?? "").trim(),
  name: String(u.name ?? "").trim(),
  is_active: u.is_active ?? true,
});

// name 셀 레이아웃 (기존)
const name_cell_style: React.CSSProperties = {
  ...td_style,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8,
};

// 수정 버튼 스타일 (기존)
const edit_btn_style: React.CSSProperties = {
  marginLeft: 8,
  fontSize: 12,
  padding: "4px 8px",
  borderRadius: 6,
};

// ✅ 추가: 삭제 버튼 스타일
const delete_btn_style: React.CSSProperties = {
  marginLeft: 8,
  fontSize: 12,
  padding: "4px 8px",
  borderRadius: 6,
  background: "#ef4444",
  color: "#fff",
  border: "none",
  cursor: "pointer",
};

const UnitListPanel: React.FC = () => {
  const [rows, set_rows] = useState<UnitRow[]>([]);
  const [is_loading, set_is_loading] = useState(false);
  const [error_message, set_error_message] = useState("");

  // 수정 모달(기존)
  const [edit_open, set_edit_open] = useState(false);
  const [edit_target, set_edit_target] = useState<UnitEditTarget | null>(null);

  // ✅ 추가: 삭제 모달
  const [del_open, set_del_open] = useState(false);
  const [del_target, set_del_target] = useState<UnitDeleteTarget | null>(null);

  useEffect(() => {
    const ac = new AbortController();

    const load = async () => {
      set_is_loading(true);
      set_error_message("");
      try {
        const res = await fetch("/api/units", {
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

        const list: ApiUnit[] = raw ? JSON.parse(raw) : [];
        set_rows(Array.isArray(list) ? list.map(to_row) : []);
      } catch (e: any) {
        if (e?.name !== "AbortError") {
          set_error_message(e?.message || "단위 목록을 불러오는 중 오류가 발생했습니다.");
        }
      } finally {
        set_is_loading(false);
      }
    };

    load();
    return () => ac.abort();
  }, []);

  // 수정 열기/닫기/반영 (기존)
  const open_edit = (row: UnitRow) => {
    set_edit_target({ unit_id: row.unit_id, code: row.code, name: row.name });
    set_edit_open(true);
  };
  const close_edit = () => set_edit_open(false);

  const handle_saved = (updated: ApiUnit) => {
    set_rows(prev =>
      prev.map(r => (r.unit_id === updated.unit_id ? { ...r, code: updated.code, name: updated.name } : r))
    );
  };

  // ✅ 추가: 삭제 열기/닫기
  const open_delete = (row: UnitRow) => {
    set_del_target({ unit_id: row.unit_id, name: row.name });
    set_del_open(true);
  };
  const close_delete = () => set_del_open(false);

  return (
    <div style={panel_style}>
      {is_loading && <div style={{ margin: "6px 0" }}>불러오는 중…</div>}
      {error_message && <div style={{ color: "crimson", margin: "6px 0" }}>{error_message}</div>}

      <table style={table_style}>
        <thead>
          <tr>
            <th style={th_style}>unit_id</th>
            <th style={th_style}>code</th>
            <th style={th_style}>name</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.unit_id} title={`${r.code} · ${r.name}`}>
              <td style={td_style}>{r.unit_id}</td>
              <td style={td_style}>{r.code}</td>

              {/* name + 수정 + 삭제 */}
              <td style={name_cell_style}>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{r.name}</span>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <button type="button" style={edit_btn_style} onClick={() => open_edit(r)}>
                    수정
                  </button>
                  {/* ✅ 추가: 삭제 버튼 */}
                  <button
                    type="button"
                    style={delete_btn_style}
                    onClick={() => open_delete(r)}
                    title="삭제"
                  >
                    삭제
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {rows.length === 0 && !is_loading && !error_message && (
            <tr>
              <td colSpan={3} style={empty_style}>등록된 단위가 없습니다.</td>
            </tr>
          )}
        </tbody>
      </table>

      {/* 수정 모달 (기존) */}
      <UnitEditUI
        open={edit_open}
        target={edit_target}
        onClose={close_edit}
        onSubmit={async (data) => {
          try {
            const updated = await putUnit(data);
            handle_saved(updated);
            close_edit();
            alert("단위가 수정되었습니다.");
          } catch (e: any) {
            alert(e?.message || "단위 수정에 실패했습니다.");
          }
        }}
      />

      {/* ✅ 추가: 삭제 모달 */}
      <UnitDeleteUI
        open={del_open}
        target={del_target}
        onClose={close_delete}
        onConfirm={async () => {
          if (!del_target) return;
          await deleteUnitWithAlerts(del_target, (deletedId) => {
            set_rows(prev => prev.filter(u => u.unit_id !== deletedId));
          });
          set_del_open(false);
        }}
      />
    </div>
  );
};

export default UnitListPanel;

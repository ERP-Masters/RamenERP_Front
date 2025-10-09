// src/components/WarehouseListPanel.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
// ⬇️ (기존) 수정 UI & 기능
import WarehouseEditUi from "../components/WarehouseEditUi";
import { putWarehouse, type WarehouseEditTarget } from "../pages/WarehouseEditFunction";
// ⬇️ (추가) 삭제 UI & 기능
import WarehouseDeleteUi from "../components/WarehouseDeleteUi";
import { deleteWarehouseWithAlerts, type WarehouseDeleteTarget } from "../pages/WarehouseDeleteFunction";

type ApiWarehouse = {
  warehouse_id: number;
  name: string;
  location: string;
  created_at: string; // ISO 문자열
};

type Row = {
  warehouse_id: number;
  name: string;
  location: string;
  created_at: string;
};

export interface WarehouseListPanelProps {
  /** 선택: 최초 필터 초기값. 이후에는 패널 내부 검색창이 우선합니다. */
  filterLocation?: string;
}

const panel_style: React.CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: 8,
  padding: 12,
  marginTop: 14,
  height: "48vh",
  overflowY: "auto",
  overflowX: "hidden",
  background: "#fafafa",
  boxSizing: "border-box",
};

const head_row_style: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8,
  marginBottom: 8,
};

const search_box_style: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  flexWrap: "nowrap",
};

const input_style: React.CSSProperties = {
  padding: "6px 8px",
  minWidth: 180,
  boxSizing: "border-box",
} as const;

const btn_style: React.CSSProperties = {
  padding: "6px 10px",
  borderRadius: 6,
  border: "1px solid #d1d5db",
  background: "#111827",
  color: "#fff",
  cursor: "pointer",
  whiteSpace: "nowrap",
} as const;

const reset_btn_style: React.CSSProperties = {
  ...btn_style,
  background: "#6b7280",
} as const;

const table_style = { width: "100%", borderCollapse: "collapse" } as const;
const th_style = { borderBottom: "1px solid #ddd", padding: 8, textAlign: "left", background: "#f3f4f6" } as const;
const td_style = { borderBottom: "1px solid #eee", padding: 8, textAlign: "left", whiteSpace: "nowrap" } as const;
const empty_style = { padding: 16, textAlign: "center", color: "#6b7280" } as const;

// ⬇️ created_at 셀 안에 텍스트와 버튼을 좌우 배치
const created_cell_style: React.CSSProperties = {
  ...td_style,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8,
};
const edit_btn_style: React.CSSProperties = {
  fontSize: 12,
  padding: "4px 8px",
  borderRadius: 6,
};
const delete_btn_style: React.CSSProperties = {
  ...edit_btn_style,
  marginLeft: 8,
  background: "#ef4444",
  color: "#fff",
  border: "none",
};

const to_row = (w: ApiWarehouse): Row => ({
  warehouse_id: Number(w.warehouse_id),
  name: String(w.name ?? "").trim(),
  location: String(w.location ?? "").trim(),
  created_at: String(w.created_at ?? "").trim(),
});

// 화면표시용 날짜 포맷(간단하게)
const fmtDate = (iso: string) => {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return (
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ` +
      `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
    );
  } catch {
    return iso;
  }
};

const WarehouseListPanel: React.FC<WarehouseListPanelProps> = ({ filterLocation }) => {
  const [rows, set_rows] = useState<Row[]>([]);
  const [is_loading, set_is_loading] = useState(false);
  const [error_message, set_error_message] = useState("");

  // ⬇️ (기존) 수정 모달 상태
  const [editOpen, set_editOpen] = useState(false);
  const [editTarget, set_editTarget] = useState<WarehouseEditTarget | null>(null);

  // ⬇️ (추가) 삭제 모달 상태
  const [delOpen, set_delOpen] = useState(false);
  const [delTarget, set_delTarget] = useState<WarehouseDeleteTarget | null>(null);

  // 내부 검색 상태 (초기에만 prop 반영)
  const [query, set_query] = useState<string>(filterLocation ?? "");
  const firstPropApplied = useRef(false);

  // 실제 fetch에 쓰일 필터(빈문자열은 전체 조회로 처리)
  const effectiveFilter = useMemo(() => (query.trim() ? query.trim() : undefined), [query]);

  useEffect(() => {
    // 마운트 직후 한 번만 prop을 입력창에 반영
    if (!firstPropApplied.current && typeof filterLocation === "string") {
      set_query(filterLocation);
      firstPropApplied.current = true;
    }
  }, [filterLocation]);

  // 목록 로더
  const load = async (signal?: AbortSignal) => {
    set_is_loading(true);
    set_error_message("");
    try {
      const url = effectiveFilter
        ? `/api/warehouses/location/${encodeURIComponent(effectiveFilter)}`
        : `/api/warehouses`;

      const res = await fetch(url, { method: "GET", headers: { Accept: "application/json" }, signal });
      const raw = await res.text();

      if (!res.ok) {
        let msg = `HTTP ${res.status}`;
        try {
          const err = raw ? JSON.parse(raw) : null;
          msg = err?.message || msg;
        } catch {}
        throw new Error(msg);
      }

      const list: ApiWarehouse[] = raw ? JSON.parse(raw) : [];
      set_rows(Array.isArray(list) ? list.map(to_row) : []);
    } catch (e: any) {
      if (e?.name !== "AbortError") set_error_message(e?.message || "창고 목록을 불러오는 중 오류가 발생했습니다.");
    } finally {
      set_is_loading(false);
    }
  };

  // 필터가 바뀔 때마다 재조회
  useEffect(() => {
    const ac = new AbortController();
    load(ac.signal);
    return () => ac.abort();
  }, [effectiveFilter]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
    }
  };

  // ⬇️ (기존) 수정 핸들러
  const openEdit = (row: Row) => {
    set_editTarget({ warehouse_id: row.warehouse_id, name: row.name, location: row.location });
    set_editOpen(true);
  };
  const closeEdit = () => set_editOpen(false);
  const handleSaved = (updated: ApiWarehouse) => {
    set_rows(prev =>
      prev.map(r =>
        r.warehouse_id === updated.warehouse_id
          ? { ...r, name: updated.name, location: updated.location, created_at: updated.created_at }
          : r
      )
    );
  };

  // ⬇️ (추가) 삭제 핸들러
  const openDelete = (row: Row) => {
    set_delTarget({ warehouse_id: row.warehouse_id, name: row.name });
    set_delOpen(true);
  };
  const closeDelete = () => set_delOpen(false);

  return (
    <div style={panel_style}>
      {/* 헤더 + 내장 검색창 */}
      <div style={head_row_style}>
        <strong>창고 목록</strong>
        <div style={search_box_style}>
          <label style={{ whiteSpace: "nowrap" }}>위치검색</label>
          <input
            type="text"
            value={query}
            onChange={(e) => set_query(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="예) 서울특별시 강남구"
            style={input_style}
          />
          <button type="button" style={btn_style} onClick={() => set_query(query.trim())}>
            검색
          </button>
          <button type="button" style={reset_btn_style} onClick={() => set_query("")}>
            초기화
          </button>
        </div>
      </div>

      {is_loading && <div style={{ margin: "6px 0" }}>불러오는 중…</div>}
      {error_message && <div style={{ color: "crimson", margin: "6px 0" }}>{error_message}</div>}

      <table style={table_style}>
        <thead>
          <tr>
            <th style={th_style}>warehouse_id</th>
            <th style={th_style}>name</th>
            <th style={th_style}>location</th>
            <th style={th_style}>created_at</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.warehouse_id} title={`${r.name} · ${r.location}`}>
              <td style={td_style}>{r.warehouse_id}</td>
              <td style={td_style}>{r.name}</td>
              <td style={td_style}>{r.location}</td>

              {/* created_at 텍스트 + [수정][삭제] 버튼(오른쪽 정렬) */}
              <td style={created_cell_style}>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{fmtDate(r.created_at)}</span>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <button type="button" style={edit_btn_style} onClick={() => openEdit(r)}>
                    수정
                  </button>
                  <button type="button" style={delete_btn_style} onClick={() => openDelete(r)} title="삭제">
                    삭제
                  </button>
                </div>
              </td>
            </tr>
          ))}

          {!rows.length && !is_loading && !error_message && (
            <tr>
              <td colSpan={4} style={empty_style}>
                등록된 창고가 없습니다.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* (기존) 수정 모달 */}
      <WarehouseEditUi
        open={editOpen}
        target={editTarget}
        onClose={closeEdit}
        onSubmit={async (data) => {
          try {
            const updated = await putWarehouse(data);
            handleSaved(updated);
            closeEdit();
            alert("창고 정보가 업데이트 되었습니다.");
          } catch (e: any) {
            alert(e?.message || "수정에 실패했습니다.");
          }
        }}
      />

      {/* (추가) 삭제 모달 */}
      <WarehouseDeleteUi
        open={delOpen}
        target={delTarget}
        onClose={closeDelete}
        onConfirm={async () => {
          if (!delTarget) return;
          await deleteWarehouseWithAlerts(delTarget, (deletedId) => {
            set_rows(prev => prev.filter(r => r.warehouse_id !== deletedId));
          });
          set_delOpen(false);
        }}
      />
    </div>
  );
};

export default WarehouseListPanel;

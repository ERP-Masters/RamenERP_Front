// src/components/NotUsedWarehousePageUi.tsx
import React, { useEffect, useState } from "react";
import { fetchNotUsedWarehouses, type ApiWarehouse } from "../pages/WarehouseNotUsedFunction";
import { markManyWarehousesUsed } from "../pages/WarehouseUsedFunction";
import { ui_tok } from "@/ui/ui_tok";
import { SectionCard } from "./common/SectionCard";
import { UsedIconButton } from "./common/IconButtons";

/** 화면 표시에만 쓰는 행 타입
 *  - id: 내부 DB PK
 *  - warehouse_id: 화면에 표시되는 문자열 ID
 */
type Row = {
  id?: number;            // 서버 PK (PUT 에 쓸 값은 나중에 warehouse_id -> id 매핑에서 얻음)
  warehouse_id: string;   // 화면 표시용 문자열 ID
  name: string;
  location: string;
  created_at: string;
};

const page_wrap_style: React.CSSProperties = {
  background: ui_tok.bg_page,
  minHeight: "100vh",
  padding: "24px 16px",
};

const page_inner_style: React.CSSProperties = {
  maxWidth: 960,
  margin: "0 auto",
};

const title_style: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 800,
  marginBottom: 4,
};

const description_style: React.CSSProperties = {
  fontSize: 13,
  color: ui_tok.label,
  marginBottom: 12,
};

const top_bar_style: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8,
  marginBottom: 8,
};

const select_btn_style: React.CSSProperties = {
  padding: "6px 10px",
  borderRadius: 999,
  border: `1px solid ${ui_tok.border}`,
  background: ui_tok.surface,
  fontSize: 12,
};

const table_wrap_style: React.CSSProperties = {
  width: "100%",
  overflowX: "auto",
};

const table_style: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: 13,
};

const thead_style: React.CSSProperties = {
  background: ui_tok.header_bg,
};

const th_style: React.CSSProperties = {
  borderBottom: `1px solid ${ui_tok.border}`,
  padding: "10px 8px",
  textAlign: "left" as const,
  whiteSpace: "nowrap" as const,
  fontSize: 13,
  fontWeight: 700,
  position: "sticky" as const,
  top: 0,
  zIndex: 1,
};

const td_style = {
  borderBottom: `1px solid ${ui_tok.border}`,
  padding: "10px 8px",
  textAlign: "left" as const,
  whiteSpace: "nowrap" as const,
  fontSize: 14,
} as const;

const empty_style = { padding: 24, textAlign: "center", color: ui_tok.label } as const;

function mapApiWarehouseToRow(list: ApiWarehouse[]): Row[] {
  return list.map((w) => ({
    id: w.id,
    warehouse_id: String(w.warehouse_id), 
    name: w.name,
    location: w.location,
    created_at: w.created_at,
  }));
}

const NotUsedWarehousePageUi: React.FC = () => {
  const [rows, set_rows] = useState<Row[]>([]);
  const [loading, set_loading] = useState(false);
  const [error, set_error] = useState<string | null>(null);

  const [select_mode, set_select_mode] = useState(false);
  const [selected_ids, set_selected_ids] = useState<Set<string>>(new Set());

  const load = async () => {
    try {
      set_loading(true);
      set_error(null);
      const api_list = await fetchNotUsedWarehouses();
      const mapped = mapApiWarehouseToRow(api_list);
      set_rows(mapped);
      set_selected_ids(new Set());
    } catch (e: any) {
      set_error(e?.message || "불러오는 중 오류가 발생했습니다.");
    } finally {
      set_loading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const toggle_select_mode = () => {
    set_select_mode((prev) => !prev);
    set_selected_ids(new Set());
  };

  const handle_toggle_row = (warehouse_id: string) => {
    set_selected_ids((prev) => {
      const next = new Set(prev);
      if (next.has(warehouse_id)) {
        next.delete(warehouse_id);
      } else {
        next.add(warehouse_id);
      }
      return next;
    });
  };

  const is_checked = (warehouse_id: string) => {
    return selected_ids.has(warehouse_id);
  };

  const handle_restore_use = async () => {
    if (selected_ids.size === 0) {
      alert("사용으로 전환할 창고를 선택하세요.");
      return;
    }

    const target_ids = Array.from(selected_ids);
    const id_map: Record<string, number> = {};

    for (const row of rows) {
      if (!row.id) continue;
      if (target_ids.includes(row.warehouse_id)) {
        id_map[row.warehouse_id] = row.id;
      }
    }

    const ids = target_ids
      .map((code) => id_map[code])
      .filter((pk) => Number.isFinite(pk)) as number[];

    if (ids.length === 0) {
      alert("유효한 PK를 찾지 못했습니다.");
      return;
    }

    try {
      set_loading(true);
      await markManyWarehousesUsed(ids);
      await load();
      set_select_mode(false);
      alert("사용으로 전환되었습니다.");
    } catch (e: any) {
      alert(e?.message || "전환 중 오류가 발생했습니다.");
      await load();
    } finally {
      set_loading(false);
    }
  };

  const is_empty = rows.length === 0;

  return (
    <div style={page_wrap_style}>
      <div style={page_inner_style}>
        <h1 style={title_style}>미사용 창고 관리</h1>
        <p style={description_style}>
          현재 사용하지 않는 창고 목록입니다. 선택한 창고를 다시 사용 상태로 전환할 수 있습니다.
        </p>

        <SectionCard
          title="미사용 창고 목록"
          subtitle={`총 ${rows.length.toLocaleString()}개`}
          right_slot={
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button
                type="button"
                style={select_btn_style}
                onClick={toggle_select_mode}
                title="선택 모드"
              >
                {select_mode ? "선택 해제" : "선택"}
              </button>
              {select_mode && (
                <UsedIconButton
                  onClick={handle_restore_use}
                />
              )}
            </div>
          }
        >
          <div style={table_wrap_style}>
            <table style={table_style}>
              <thead style={thead_style}>
                <tr>
                  {select_mode && <th style={th_style}>선택</th>}
                  <th style={th_style}>창고 ID</th>
                  <th style={th_style}>창고명</th>
                  <th style={th_style}>위치</th>
                  <th style={th_style}>생성일</th>
                </tr>
              </thead>
              <tbody>
                {is_empty ? (
                  <tr>
                    <td
                      style={empty_style}
                      colSpan={select_mode ? 5 : 4}
                    >
                      미사용 창고가 없습니다.
                    </td>
                  </tr>
                ) : (
                  rows.map((row, idx) => (
                    <tr
                      key={row.warehouse_id}
                      style={idx % 2 === 1 ? { background: ui_tok.zebra } : undefined}
                    >
                      {select_mode && (
                        <td style={td_style}>
                          <input
                            type="checkbox"
                            checked={is_checked(row.warehouse_id)}
                            onChange={() => handle_toggle_row(row.warehouse_id)}
                          />
                        </td>
                      )}
                      <td style={td_style}>{row.warehouse_id}</td>
                      <td style={td_style}>{row.name}</td>
                      <td style={td_style}>{row.location}</td>
                      <td style={td_style}>{row.created_at}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {loading && <div style={{ padding: 12, color: ui_tok.label }}>불러오는 중…</div>}
          {error && <div style={{ padding: 12, color: "#c62828" }}>{error}</div>}
        </SectionCard>
      </div>
    </div>
  );
};

export default NotUsedWarehousePageUi;

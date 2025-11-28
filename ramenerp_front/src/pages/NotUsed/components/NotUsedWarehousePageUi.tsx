// src/pages/NotUsedWarehousePageUi.tsx
import React, { useEffect, useState } from "react";
import { fetchNotUsedWarehouses, type ApiWarehouse } from "../function/WarehouseNotUsedFunction";
import { markManyWarehousesUsed } from "../../warehouse/function/WarehouseUsedFunction";

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

const ui_tok = {
  bg_page: "#f6f7f9",
  surface: "#ffffff",
  border: "#e6e8ec",
  header_bg: "#f8fafc",
  zebra: "#fafafa",
  text: "#111827",
  label: "#6b7280",
  radius: 12,
} as const;

const page_wrap_style: React.CSSProperties = {
  background: ui_tok.bg_page,
  minHeight: "100%",
  padding: "24px 16px",
};
const page_style = { padding: 16, maxWidth: 1200, margin: "0 auto" } as const;

const title_style: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 800,
  color: ui_tok.text,
  margin: "0 0 12px 0",
};

const table_card_style: React.CSSProperties = {
  border: `1px solid ${ui_tok.border}`,
  borderRadius: ui_tok.radius,
  background: ui_tok.surface,
  display: "flex",
  flexDirection: "column",
  maxHeight: "60vh",
  overflow: "hidden",
  marginTop: 12,
};

const table_scroll_style = { flex: 1, overflowY: "auto", overflowX: "auto" } as const;

const table_style = { width: "100%", borderCollapse: "separate" as const, borderSpacing: 0 } as const;
const th_style = {
  padding: "10px 8px",
  textAlign: "left" as const,
  background: ui_tok.header_bg,
  borderBottom: `1px solid ${ui_tok.border}`,
  fontSize: 13,
  fontWeight: 700,
  position: "sticky" as const,
  top: 0,
  zIndex: 1,
} as const;
const td_style = {
  borderBottom: `1px solid ${ui_tok.border}`,
  padding: "10px 8px",
  textAlign: "left" as const,
  whiteSpace: "nowrap" as const,
  fontSize: 14,
} as const;

const empty_style = { padding: 24, textAlign: "center", color: ui_tok.label } as const;

const top_bar_style: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-start",
  gap: 8,
  marginBottom: 8,
  transform: "translateY(4px)",
};

const select_btn_style: React.CSSProperties = {
  height: 32,
  padding: "0 12px",
  borderRadius: 8,
  border: `1px solid ${ui_tok.border}`,
  background: "#9ca3af",
  color: "#fff",
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const use_btn_style: React.CSSProperties = {
  height: 32,
  padding: "0 12px",
  borderRadius: 8,
  border: `1px solid ${ui_tok.border}`,
  background: "#111827",
  color: "#fff",
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const NotUsedWarehousePageUi: React.FC = () => {
  const [rows, set_rows] = useState<Row[]>([]);
  const [loading, set_loading] = useState(false);
  const [error, set_error] = useState("");
  const [select_mode, set_select_mode] = useState(false);

  /** 체크박스 상태를 'warehouse_id 문자열' 키로 관리 */
  const [checked, set_checked] = useState<Record<string, boolean>>({});

  // 각 행의 고유 키: 화면용 warehouse_id 그대로 사용
  const row_key = (r: Row) => r.warehouse_id;

  /** ApiWarehouse → Row 변환 */
  const to_row = (w: ApiWarehouse): Row => {
    const anyW = w as any;

    // 내부 PK (있으면 저장)
    let pk: number | undefined;
    if (typeof anyW.id === "number") pk = anyW.id;
    else if (typeof anyW.id === "string" && /^\d+$/.test(anyW.id)) pk = Number(anyW.id);

    const code =
      (typeof anyW.warehouse_id === "string" && anyW.warehouse_id) ||
      (typeof anyW.display_warehouse_id === "string" && anyW.display_warehouse_id) ||
      String(anyW.warehouse_id ?? anyW.id ?? "");

    return {
      id: pk,
      warehouse_id: code,
      name: String(anyW.name ?? "").trim(),
      location: String(anyW.location ?? "").trim(),
      created_at: String(anyW.created_at ?? "").trim(),
    };
  };

  const load = async () => {
    set_loading(true);
    set_error("");
    try {
      const list = await fetchNotUsedWarehouses();
      set_rows((Array.isArray(list) ? list : []).map(to_row));
      set_checked({});
    } catch (e: any) {
      set_error(e?.message || "미사용 창고 목록을 불러오지 못했습니다.");
    } finally {
      set_loading(false);
    }
  };

  /** warehouse_id(문자열 코드) 배열 → 실제 PK id 배열
   *    여기서 /api/warehouses/state 를 사용해서 매핑한다.
   */
  const resolvePkIds = async (codes: string[]): Promise<number[]> => {
    const res = await fetch("/api/warehouses/state", {
      method: "GET",
      headers: { Accept: "application/json" },
    });
    const text = await res.text();
    if (!res.ok) {
      throw new Error(text || `HTTP ${res.status}`);
    }
    const data = text ? JSON.parse(text) : null;

    const raw: any[] = Array.isArray(data)
      ? data
      : data && Array.isArray((data as any).items)
      ? (data as any).items
      : [];

    // 코드 → PK(id) 매핑
    const map: Record<string, number> = {};
    for (const w of raw) {
      const anyW = w as any;

      const code =
        (typeof anyW.warehouse_id === "string" && anyW.warehouse_id) ||
        (typeof anyW.display_warehouse_id === "string" && anyW.display_warehouse_id) ||
        String(anyW.warehouse_id ?? anyW.id ?? "");

      let pk: number | null = null;
      if (typeof anyW.id === "number") pk = anyW.id;
      else if (typeof anyW.id === "string" && /^\d+$/.test(anyW.id)) pk = Number(anyW.id);
      else if (typeof anyW.warehouse_id === "number") pk = anyW.warehouse_id;
      else if (typeof anyW.warehouse_id === "string" && /^\d+$/.test(anyW.warehouse_id)) {
        pk = Number(anyW.warehouse_id);
      }

      if (code && pk !== null && Number.isFinite(pk)) {
        map[code] = pk;
      }
    }

    const result: number[] = [];
    for (const c of codes) {
      const pk = map[c];
      if (Number.isFinite(pk)) result.push(pk);
    }
    return result;
  };

  /** 선택된 행들의 warehouse_id(문자열 코드) 배열 */
  const selected_codes = () =>
    rows.filter((r) => checked[row_key(r)]).map((r) => r.warehouse_id);

  // “사용” — 낙관적 제거 + 서버 반영 + 재동기화
  const handle_restore_use = async () => {
    const codes = selected_codes();
    if (codes.length === 0) {
      alert("선택된 창고가 없습니다. 선택을 확인해주세요.");
      return;
    }

    // 1) /api/warehouses/state 에서 같은 warehouse_id 가진 레코드의 PK id 찾기
    let ids: number[];
    try {
      ids = await resolvePkIds(codes);
    } catch (e: any) {
      alert(e?.message || "창고 ID 해석 중 오류가 발생했습니다.");
      return;
    }

    if (ids.length === 0) {
      alert("숫자형 id 를 찾을 수 없습니다. (state 기준 매핑 실패)");
      return;
    }

    const msg =
      ids.length === 1
        ? "1개 창고를 사용 등록하시겠습니까?"
        : `${ids.length}개 창고를 사용 등록하시겠습니까?`;
    if (!window.confirm(msg)) return;

    // 2) 화면 즉시 제거 — 체크된 행 전부 삭제 (warehouse_id 기준)
    const remove_keys = new Set<string>(codes);
    set_rows((prev) => prev.filter((r) => !remove_keys.has(r.warehouse_id)));
    set_checked((prev) => {
      const next = { ...prev };
      remove_keys.forEach((k) => delete next[k]);
      return next;
    });

    try {
      set_loading(true);
      // 3) 서버 반영(USED) — PK id 로만 호출
      await markManyWarehousesUsed(ids);
      // 4) 재동기화
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

  useEffect(() => {
    load();
    const onNotUsed = () => load();
    const onRestored = () => load();
    window.addEventListener("warehouse:notused:updated", onNotUsed);
    window.addEventListener("warehouse:used:restored", onRestored);
    return () => {
      window.removeEventListener("warehouse:notused:updated", onNotUsed);
      window.removeEventListener("warehouse:used:restored", onRestored);
    };
  }, []);

  // 선택 모드 토글 시 체크 초기화
  const toggle_select_mode = () => {
    set_select_mode((v) => {
      const next = !v;
      if (!next) set_checked({});
      return next;
    });
  };

  return (
    <div style={page_wrap_style}>
      <div style={page_style}>
        <div style={title_style}>미사용 창고 조회</div>

        <div style={top_bar_style}>
          <button
            type="button"
            style={select_btn_style}
            onClick={toggle_select_mode}
            title="선택 모드"
          >
            {select_mode ? "선택 해제" : "선택"}
          </button>

          {select_mode && (
            <button
              type="button"
              style={use_btn_style}
              onClick={handle_restore_use}
              title="사용으로 전환"
            >
              사용
            </button>
          )}
        </div>

        <div style={table_card_style}>
          <div style={table_scroll_style}>
            <table style={table_style}>
              <thead>
                <tr>
                  {select_mode && <th style={th_style} />}
                  <th style={th_style}>warehouse_id</th>
                  <th style={th_style}>name</th>
                  <th style={th_style}>location</th>
                  <th style={th_style}>created_at</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, idx) => {
                  const key = row_key(r);
                  return (
                    <tr
                      key={key}
                      style={idx % 2 === 1 ? { background: ui_tok.zebra } : undefined}
                      title={`${r.name} · ${r.location}`}
                    >
                      {select_mode && (
                        <td style={{ ...td_style, position: "relative" }}>
                          <input
                            type="checkbox"
                            checked={!!checked[key]}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) =>
                              set_checked((prev) => ({ ...prev, [key]: e.target.checked }))
                            }
                          />
                        </td>
                      )}
                      <td style={td_style}>{r.warehouse_id}</td>
                      <td style={td_style}>{r.name}</td>
                      <td style={td_style}>{r.location}</td>
                      <td style={td_style}>{r.created_at}</td>
                    </tr>
                  );
                })}

                {rows.length === 0 && !loading && !error && (
                  <tr>
                    {/* 열 개수: 선택모드 5, 기본 4 */}
                    <td style={empty_style} colSpan={select_mode ? 5 : 4}>
                      미사용으로 등록된 창고가 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {loading && <div style={{ padding: 12, color: ui_tok.label }}>불러오는 중…</div>}
          {error && <div style={{ padding: 12, color: "#c62828" }}>{error}</div>}
        </div>
      </div>
    </div>
  );
};

export default NotUsedWarehousePageUi;

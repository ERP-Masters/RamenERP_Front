// src/components/WarehouseListPanel.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
// (기존) 수정 UI & 기능
import WarehouseEditUi from "../components/WarehouseEditUi";
import { putWarehouse, type WarehouseEditTarget } from "../pages/WarehouseEditFunction";
// (추가) 삭제 UI & 기능
import WarehouseDeleteUi from "../components/WarehouseDeleteUi";
import { deleteWarehouseWithAlerts, type WarehouseDeleteTarget } from "../pages/WarehouseDeleteFunction";
// (추가) 모달로 띄울 등록 폼(프로펠스 없이 사용)
import WareHouseRegister from "../pages/WarehouseRegister";
// ✅ 추가: 창고 ID 상세 검색 모달
import WarehouseSummarySearch from "../components/WarehouseSummarySearch";

type ApiWarehouse = { warehouse_id: number | string; name: string; location: string; created_at: string; };
type Row = { warehouse_id: number; name: string; location: string; created_at: string; };
export interface WarehouseListPanelProps { filterLocation?: string; }

/* ===== 거래처 화면과 동일 토큰 ===== */
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

/* ===== 페이지 여백/레이아웃(거래처와 동일) ===== */
const page_wrap_style: React.CSSProperties = {
  background: ui_tok.bg_page,
  minHeight: "100%",
  padding: "24px 16px",
};
const page_style = { padding: 16, maxWidth: 1200, margin: "0 auto" } as const;

/* ===== 제목/컨트롤 라인 (박스 밖) ===== */
const controls_block_style: React.CSSProperties = { marginTop: 4, marginBottom: 12 };
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
};
const top_controls_style: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  marginTop: 0,
  marginBottom: 0,
  justifyContent: "flex-start",
};

const label_style: React.CSSProperties = { whiteSpace: "nowrap", color: ui_tok.label, fontWeight: 700 };
const input_style: React.CSSProperties = {
  height: 40,
  padding: "0 12px",
  minWidth: 260,
  borderRadius: 10,
  border: `1px solid ${ui_tok.border}`,
  outline: "none",
  background: "#fff",
  boxSizing: "border-box",
};

const search_btn_style: React.CSSProperties = {
  height: 40,
  padding: "0 14px",
  borderRadius: 10,
  border: `1px solid ${ui_tok.border}`,
  background: "#111827",
  color: "#fff",
  cursor: "pointer",
  whiteSpace: "nowrap",
  fontWeight: 700,
};
const reset_btn_style: React.CSSProperties = {
  ...search_btn_style,
  background: "#6b7280",
  border: `1px solid ${ui_tok.border}`,
};

/* ✅ 추가: 거래처 화면의 ‘거래처 ID 조회’ 버튼과 동일한 스타일 */
const quick_btn_style: React.CSSProperties = {
  height: 40,
  padding: "0 12px",
  borderRadius: 10,
  border: `1px solid ${ui_tok.border}`,
  background: "#111827",
  color: "#fff",
  cursor: "pointer",
  whiteSpace: "nowrap",
  transform: "translateY(-0.8px)",
  marginLeft: 12, // 초기화 버튼 오른쪽으로 약간 띄우기
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

/* ===== 네모 박스(카드): 높이 고정 + 내부 스크롤 / 헤더 스타일 동일 ===== */
const table_card_style: React.CSSProperties = {
  border: `1px solid ${ui_tok.border}`,
  borderRadius: ui_tok.radius,
  background: ui_tok.surface,
  display: "flex",
  flexDirection: "column",
  maxHeight: "60vh",
  overflow: "hidden",
};
const table_scroll_style = { flex: 1, overflowY: "auto", overflowX: "auto" } as const;

const table_style = { width: "100%", borderCollapse: "separate" as const, borderSpacing: 0 } as const;
const th_td_base = {
  padding: "12px 10px",
  textAlign: "left" as const,
  whiteSpace: "nowrap" as const,
  color: ui_tok.text,
} as const;
const th_style = {
  ...th_td_base,
  fontSize: 13,
  fontWeight: 700,
  background: ui_tok.header_bg,
  borderBottom: `1px solid ${ui_tok.border}`,
  position: "sticky" as const,
  top: 0,
  zIndex: 1,
} as const;
const td_style = { ...th_td_base, fontSize: 14, borderBottom: `1px solid ${ui_tok.border}` } as const;

/* 행 오른쪽 아이콘 영역 */
const created_cell_style: React.CSSProperties = {
  ...td_style,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8,
};
const small_btn: React.CSSProperties = {
  fontSize: 12,
  padding: "4px 8px",
  borderRadius: 6,
  border: `1px solid ${ui_tok.border}`,
  background: "#fff",
  cursor: "pointer",
};
const delete_btn_style: React.CSSProperties = {
  ...small_btn,
  marginLeft: 8,
  background: "#ef4444",
  color: "#fff",
  border: "none",
};
const icon_btn_style: React.CSSProperties = {
  background: "transparent",
  border: "none",
  padding: 4,
  cursor: "pointer",
  lineHeight: 0,
};

const empty_style = { textAlign: "center", padding: 24, color: ui_tok.label } as const;

/* ===== 유틸 ===== */
const to_row = (w: ApiWarehouse): Row => {
  const toIdNum = (v: any): number => {
    if (typeof v === "number") return v;
    const m = String(v ?? "").match(/\d+$/);
    return m ? Number(m[0]) : NaN;
  };

  const display =
    (typeof (w as any)?.display_warehouse_id === "string" && (w as any).display_warehouse_id) ||
    (typeof (w as any)?.warehouse_id === "string" && String((w as any).warehouse_id)) ||
    (typeof (w as any)?.id === "string" && String((w as any).id)) ||
    String((w as any)?.warehouse_id ?? "");

  return {
    warehouse_id: toIdNum((w as any).warehouse_id),
    name: String(w.name ?? "").trim(),
    location: String(w.location ?? "").trim(),
    created_at: String(w.created_at ?? "").trim(),
    ...(display ? { display_warehouse_id: display } : {}),
  } as Row & { display_warehouse_id?: string };
};

const fmtDate = (iso: string) => {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(
      d.getHours()
    ).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  } catch { return iso; }
};

const WarehouseListPanel: React.FC<WarehouseListPanelProps> = ({ filterLocation }) => {
  const [rows, set_rows] = useState<Row[]>([]);
  const [is_loading, set_is_loading] = useState(false);
  const [error_message, set_error_message] = useState("");

  const [editOpen, set_editOpen] = useState(false);
  const [editTarget, set_editTarget] = useState<WarehouseEditTarget | null>(null);

  const [delOpen, set_delOpen] = useState(false);
  const [delTarget, set_delTarget] = useState<WarehouseDeleteTarget | null>(null);

  const [regOpen, set_regOpen] = useState(false);

  // ✅ 추가: 창고 ID 조회 모달 오픈 상태
  const [summaryOpen, set_summaryOpen] = useState(false);

  const [query, set_query] = useState<string>(filterLocation ?? "");
  const firstPropApplied = useRef(false);
  const effectiveFilter = useMemo(() => (query.trim() ? query.trim() : undefined), [query]);

  useEffect(() => {
    if (!firstPropApplied.current && typeof filterLocation === "string") {
      set_query(filterLocation);
      firstPropApplied.current = true;
    }
  }, [filterLocation]);

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
        try { msg = (raw ? JSON.parse(raw) : null)?.message || msg; } catch {}
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

  useEffect(() => {
    const ac = new AbortController();
    load(ac.signal);
    return () => ac.abort();
  }, [effectiveFilter]);

  useEffect(() => {
    const onRefresh = () => load();
    window.addEventListener("warehouse:created", onRefresh);
    return () => window.removeEventListener("warehouse:created", onRefresh);
  }, []);

  // ✅ 추가: 등록 성공/취소 시 모달 닫기
  useEffect(() => {
    const closeModal = () => set_regOpen(false);
    window.addEventListener("warehouse:register:cancel", closeModal);
    window.addEventListener("warehouse:created", closeModal);
    return () => {
      window.removeEventListener("warehouse:register:cancel", closeModal);
      window.removeEventListener("warehouse:created", closeModal);
    };
  }, []);

  // ✅ 추가: 외부 이벤트로 요약 모달 열기
  useEffect(() => {
    const openSummary = () => set_summaryOpen(true);
    window.addEventListener("warehouse:summary-open", openSummary as EventListener);
    return () => window.removeEventListener("warehouse:summary-open", openSummary as EventListener);
  }, []);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === "Enter") e.preventDefault(); };

  const openEdit = (row: Row) => {
    set_editTarget({ warehouse_id: row.warehouse_id, name: row.name, location: row.location });
    set_editOpen(true);
  };
  const closeEdit = () => set_editOpen(false);

  // 숫자 ID/표시용 ID 둘 다 매칭
  const handleSaved = (updated: ApiWarehouse) => {
    set_rows(prev =>
      prev.map((r: any) => {
        const uidNum = Number((updated as any).warehouse_id);
        const sameNum = Number(r.warehouse_id) === uidNum && !Number.isNaN(uidNum);
        const sameDisplay =
          String((r as any).display_warehouse_id ?? "") === String((updated as any).warehouse_id ?? "");

        if (sameNum || sameDisplay) {
          return {
            ...r,
            name: updated.name,
            location: updated.location,
            created_at: updated.created_at,
          };
        }
        return r;
      })
    );
  };

  const openDelete = (row: Row) => { set_delTarget({ warehouse_id: row.warehouse_id, name: row.name }); set_delOpen(true); };
  const closeDelete = () => set_delOpen(false);

  return (
    <div style={page_wrap_style}>
      <div style={page_style}>
        {/* ===== 제목/컨트롤(박스 밖) : 거래처 화면과 동일 배치 ===== */}
        <div style={controls_block_style}>
          <div style={controls_title_style}>창고 조회</div>

          <div style={top_row_style}>
            <div style={top_controls_style}>
              <span style={label_style}>위치검색</span>
              <input
                type="text"
                value={query}
                onChange={(e) => set_query(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="예) 서울특별시 강남구"
                style={input_style}
              />
              <button type="button" style={search_btn_style} onClick={() => set_query(query.trim())}>검색</button>
              <button type="button" style={reset_btn_style} onClick={() => set_query("")}>초기화</button>

              {/* ✅ 추가 버튼: 초기화 오른쪽에 배치, 동일 디자인 */}
              <button
                type="button"
                style={quick_btn_style}
                onClick={() => window.dispatchEvent(new Event("warehouse:summary-open"))}
              >
                창고 ID 조회
              </button>
            </div>

            <button type="button" style={create_btn_style} onClick={() => set_regOpen(true)}>
              신규 창고 등록
            </button>
          </div>
        </div>

        {/* ===== 네모 박스(고정 높이 + 내부 스크롤) ===== */}
        <div style={table_card_style}>
          {is_loading && <div style={{ margin: "8px 12px", color: ui_tok.label }}>불러오는 중…</div>}
          {error_message && <div style={{ color: "#c62828", margin: "8px 12px" }}>{error_message}</div>}

          <div style={table_scroll_style}>
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
                {rows.map((r: any, idx) => (
                  <tr key={`${r.warehouse_id}-${(r as any).display_warehouse_id ?? ""}`}
                      title={`${r.name} · ${r.location}`}
                      style={idx % 2 === 1 ? { background: ui_tok.zebra } : undefined}>
                    {/* 화면에는 문자열 ID를 우선 표시 */}
                    <td style={td_style}>{(r as any).display_warehouse_id ?? r.warehouse_id}</td>
                    <td style={td_style}>{r.name}</td>
                    <td style={td_style}>{r.location}</td>
                    <td style={created_cell_style}>
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{fmtDate(r.created_at)}</span>
                      <div style={{ display: "flex", alignItems: "center" }}>
                        <button
                          type="button"
                          style={icon_btn_style}
                          onClick={() => openEdit(r)}
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

                        <button
                          type="button"
                          style={icon_btn_style}
                          onClick={() => openDelete(r)}
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
                {!rows.length && !is_loading && !error_message && (
                  <tr><td colSpan={4} style={empty_style}>등록된 창고가 없습니다.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ===== 기존 모달 동작 그대로 ===== */}
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

        {regOpen && (
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
            onClick={() => set_regOpen(false)}
          >
            <div
              style={{
                width: "min(1000px, 96vw)",
                maxHeight: "92vh",
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
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>신규 창고 등록</h3>
                <button
                  type="button"
                  style={{ padding: "6px 10px", borderRadius: 8, border: `1px solid ${ui_tok.border}`, background: "#fff", cursor: "pointer" }}
                  onClick={() => set_regOpen(false)}
                >
                  닫기
                </button>
              </div>
              <WareHouseRegister />
            </div>
          </div>
        )}

        {/* ✅ 추가: 창고 ID 상세 검색 모달 마운트 */}
        <WarehouseSummarySearch open={summaryOpen} onClose={() => set_summaryOpen(false)} />
      </div>
    </div>
  );
};

export default WarehouseListPanel;

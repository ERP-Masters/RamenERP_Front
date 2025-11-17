// src/components/InventoryListUi.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  fetchAllInventories,
  type InventoryRow,
  type LotRow,
} from "../pages/InventoryListFunction";

type Tab = "ALL" | "WAREHOUSE";

/* ===== 공통 UI 토큰 ===== */
const ui_tok = {
  bg_page: "#f6f7f9",
  surface: "#ffffff",
  border: "#e5e7eb",
  header_bg: "#f8fafc",
  zebra: "#fafafa",
  text: "#111827",
  label: "#6b7280",
  primary_bg: "#111827",
  primary_text: "#ffffff",
  radius: 12,
} as const;

/* 레이아웃/테이블 공용 스타일 */
const page_wrap: React.CSSProperties = { background: ui_tok.bg_page, minHeight: "100vh", padding: "24px 16px" };
const page_inner: React.CSSProperties = { maxWidth: 1200, margin: "0 auto" };
const title_style: React.CSSProperties = { fontSize: 20, fontWeight: 800, color: ui_tok.text, marginBottom: 12 };
const card: React.CSSProperties = { border: `1px solid ${ui_tok.border}`, borderRadius: ui_tok.radius, background: ui_tok.surface, display: "flex", flexDirection: "column", maxHeight: "70vh", overflow: "hidden" };
const card_head: React.CSSProperties = { padding: "10px 14px", borderBottom: `1px solid ${ui_tok.border}`, background: ui_tok.header_bg, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 };
const tabs_row: React.CSSProperties = { display: "flex", gap: 6, flexWrap: "wrap" };
const tab_btn_base: React.CSSProperties = { padding: "6px 10px", borderRadius: 999, border: `1px solid ${ui_tok.border}`, background: "#fff", fontSize: 12, cursor: "pointer", whiteSpace: "nowrap" };
const search_row: React.CSSProperties = { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" };
const table_wrap: React.CSSProperties = { flex: 1, overflowY: "auto", overflowX: "auto" };
const table_style = { width: "100%", borderCollapse: "separate" as const, borderSpacing: 0 };
const th_style: React.CSSProperties = { padding: "10px 8px", textAlign: "left", background: ui_tok.header_bg, borderBottom: `1px solid ${ui_tok.border}`, fontSize: 13, fontWeight: 700, position: "sticky", top: 0, zIndex: 1 };
const td_style: React.CSSProperties = { borderBottom: `1px solid ${ui_tok.border}`, padding: "10px 8px", textAlign: "left", whiteSpace: "nowrap", fontSize: 13 };
const empty_style: React.CSSProperties = { padding: 18, textAlign: "center", color: ui_tok.label };

/* 날짜 포맷 */
const fmtDate = (iso?: string | null) => {
  if (!iso) return "-";
  try {
    const d = new Date(iso);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const da = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${y}-${m}-${da} ${hh}:${mm}`;
  } catch {
    return String(iso);
  }
};

const InventoryListUi: React.FC = () => {
  const [tab, set_tab] = useState<Tab>("ALL");

  // ── 전체 재고 상태 (기존 그대로) ──
  const [inventoryRows, set_inventoryRows] = useState<InventoryRow[]>([]);
  const [lotRows] = useState<LotRow[]>([]); // 구조 유지용
  const [lotFilter, set_lotFilter] = useState("");

  // ── 창고 조회: 동일 경로(/api/inventory)에서 가져온 데이터만 사용 ──
  const [warehouse_source_rows, set_warehouse_source_rows] = useState<InventoryRow[]>([]);
  const [warehouse_name_filter, set_warehouse_name_filter] = useState("");

  const [isLoading, set_isLoading] = useState(false);
  const [errorMsg, set_errorMsg] = useState("");

  /* 전체 재고: 탭 진입 시 로드 */
  useEffect(() => {
    if (tab !== "ALL") return;
    void handleLoadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  /* 창고 조회: 탭 진입 시에도 동일 경로 호출 */
  useEffect(() => {
    if (tab !== "WAREHOUSE") return;
    set_errorMsg("");
    set_isLoading(true);
    (async () => {
      try {
        const data = await fetchAllInventories(); // ✅ 동일 경로 사용
        set_warehouse_source_rows(data);
      } catch (e: any) {
        set_warehouse_source_rows([]);
        set_errorMsg(e?.message || "인벤토리(창고 조회) 로드 중 오류가 발생했습니다.");
      } finally {
        set_isLoading(false);
      }
    })();
  }, [tab]);

  /* 핸들러 */
  const handleLoadAll = async () => {
    set_isLoading(true);
    set_errorMsg("");
    try {
      const data = await fetchAllInventories();
      set_inventoryRows(data);
    } catch (e: any) {
      set_errorMsg(e?.message || "인벤토리를 불러오는 중 오류가 발생했습니다.");
      set_inventoryRows([]);
    } finally {
      set_isLoading(false);
    }
  };

  const changeTab = (next: Tab) => {
    set_tab(next);
    set_errorMsg("");
    set_isLoading(false);
    set_lotFilter("");
    set_warehouse_name_filter("");
  };

  /* LOT 부분일치 필터 (ALL 탭) */
  const filteredAllRows = useMemo(() => {
    const q = lotFilter.trim();
    if (!q) return inventoryRows;
    return inventoryRows.filter((r) =>
      String(r.lot_id ?? "").toLowerCase().includes(q.toLowerCase())
    );
  }, [inventoryRows, lotFilter]);

  /* 창고 이름 목록(중복 제거) & 부분 일치 필터 (WAREHOUSE 탭) */
  const uniqueWarehouseNames = useMemo(() => {
    const names = warehouse_source_rows
      .map((row) => {
        const name = (row as any)?.warehouse?.name;
        if (typeof name === "string" && name.trim()) return name.trim();
        return String((row as any)?.warehouse_id ?? "");
      })
      .filter((v) => v) as string[];

    const uniq = Array.from(new Set(names));
    const q = warehouse_name_filter.trim().toLowerCase();
    if (!q) return uniq.sort((a, b) => a.localeCompare(b, "ko"));
    return uniq
      .filter((n) => n.toLowerCase().includes(q))
      .sort((a, b) => a.localeCompare(b, "ko"));
  }, [warehouse_source_rows, warehouse_name_filter]);

  /* 상세 보기 버튼 클릭 (지금은 콘솔만) */
  const handle_open_warehouse_detail = (warehouse_name: string) => {
    // TODO: 여기서 모달/라우팅/필터 상세표 구현 가능
    console.log("[상세 보기] 창고:", warehouse_name);
  };

  return (
    <div style={page_wrap}>
      <div style={page_inner}>
        <div style={title_style}>인벤토리 조회</div>

        <div style={card}>
          <div style={card_head}>
            {/* 탭 */}
            <div style={tabs_row}>
              {([
                ["ALL", "전체 재고 현황"],
                ["WAREHOUSE", "창고 조회"],
              ] as [Tab, string][]).map(([key, label]) => {
                const active = tab === key;
                return (
                  <button
                    key={key}
                    type="button"
                    style={{
                      ...tab_btn_base,
                      background: active ? ui_tok.primary_bg : "#fff",
                      color: active ? ui_tok.primary_text : ui_tok.text,
                      borderColor: active ? "#020617" : ui_tok.border,
                    }}
                    onClick={() => changeTab(key)}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {/* 우측 컨트롤 */}
            <div style={search_row}>
              {tab === "ALL" && (
                <>
                  {/* LOT 코드 부분일치 필터 */}
                  <input
                    value={lotFilter}
                    onChange={(e) => set_lotFilter(e.target.value)}
                    placeholder="LOT 코드 필터 (부분 일치)"
                    style={{
                      height: 36,
                      borderRadius: 10,
                      border: `1px solid ${ui_tok.border}`,
                      padding: "0 10px",
                      fontSize: 13,
                      minWidth: 220,
                    }}
                  />
                  <button
                    type="button"
                    style={{
                      padding: "0 14px",
                      height: 36,
                      borderRadius: 10,
                      border: "1px solid #020617",
                      background: ui_tok.primary_bg,
                      color: ui_tok.primary_text,
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      fontSize: 13,
                    }}
                    onClick={handleLoadAll}
                  >
                    새로고침
                  </button>
                </>
              )}

              {tab === "WAREHOUSE" && (
                <>
                  {/* 창고 이름 부분일치 필터 */}
                  <input
                    value={warehouse_name_filter}
                    onChange={(e) => set_warehouse_name_filter(e.target.value)}
                    placeholder="창고 이름 필터 (부분 일치)"
                    style={{
                      height: 36,
                      borderRadius: 10,
                      border: `1px solid ${ui_tok.border}`,
                      padding: "0 10px",
                      fontSize: 13,
                      minWidth: 260,
                    }}
                  />
                </>
              )}
            </div>
          </div>

          {/* 상태 */}
          {isLoading && <div style={{ padding: "6px 14px", color: ui_tok.label }}>불러오는 중…</div>}
          {errorMsg && <div style={{ padding: "6px 14px", color: "#b91c1c" }}>{errorMsg}</div>}

          {/* 리스트 */}
          <div style={table_wrap}>
            {tab === "ALL" ? (
              <table style={table_style}>
                <thead>
                  <tr>
                    <th style={th_style}>LOT 코드</th>
                    <th style={th_style}>재고 품목 코드</th>
                    <th style={th_style}>창고</th>
                    <th style={th_style}>품목</th>
                    <th style={th_style}>수량</th>
                    <th style={th_style}>안전 재고</th>
                    <th style={th_style}>창고 입고 일시</th>
                    <th style={th_style}>만료 기일</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAllRows.map((row, idx) => (
                    <tr key={row.id} style={idx % 2 === 1 ? { background: ui_tok.zebra } : undefined}>
                      <td style={td_style}>{row.lot_id ?? <span style={{ color: ui_tok.label }}>-</span>}</td>
                      <td style={td_style}>{row.inventory_id}</td>
                      <td style={td_style}>
                        {(row as any)?.warehouse?.name ?? String((row as any)?.warehouse_id ?? "")}
                      </td>
                      <td style={td_style}>
                        {(row as any)?.item?.name ?? String((row as any)?.item_id ?? "")}
                      </td>
                      <td style={td_style}>{row.quantity}</td>
                      <td style={td_style}>{row.safety_stock}</td>
                      <td style={td_style}>{fmtDate(row.store_date)}</td>
                      <td style={td_style}>{fmtDate(row.expiry_date)}</td>
                    </tr>
                  ))}
                  {!filteredAllRows.length && !isLoading && !errorMsg && (
                    <tr>
                      <td colSpan={8} style={empty_style}>조회된 인벤토리가 없습니다.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            ) : (
              // ── 창고 조회: "창고 이름" + 행 우측 끝 "상세 보기" 버튼 ──
              <table style={table_style}>
                <thead>
                  <tr>
                    <th style={th_style}>창고 이름</th>
                    <th style={th_style}></th>{/* 버튼 열 */}
                  </tr>
                </thead>
                <tbody>
                  {uniqueWarehouseNames.map((name, idx) => (
                    <tr key={`${name}-${idx}`} style={idx % 2 === 1 ? { background: ui_tok.zebra } : undefined}>
                      <td style={td_style}>{name}</td>
                      <td style={{ ...td_style, textAlign: "right" }}>
                        <button
                          type="button"
                          onClick={() => handle_open_warehouse_detail(name)}
                          style={{
                            padding: "4px 10px",
                            borderRadius: 999,
                            border: `1px solid ${ui_tok.border}`,
                            background: "#fff",
                            cursor: "pointer",
                            fontSize: 12,
                          }}
                        >
                          상세 보기
                        </button>
                      </td>
                    </tr>
                  ))}
                  {!uniqueWarehouseNames.length && !isLoading && !errorMsg && (
                    <tr>
                      <td colSpan={2} style={empty_style}>창고 이름이 없습니다.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryListUi;

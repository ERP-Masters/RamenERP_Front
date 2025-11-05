// src/components/InventoryListUi.tsx
import React, { useEffect, useState } from "react";
import {
  fetchAllInventories,
  fetchInventoriesByWarehouseId,
  fetchInventoriesByWarehouseName,
  fetchLotsByItemId,
  InventoryRow,
  LotRow,
} from "../pages/InventoryListFunction";

import InventoryWarehouseIdSearch from "./InventoryWarehouseIdSearch";
import InventoryWarehouseNameSearch from "./InventoryWarehouseNameSearch";
import InventoryLotSearch from "./InventoryLOTSearch";

type Tab = "ALL" | "WAREHOUSE_ID" | "WAREHOUSE_NAME" | "LOT";

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

/* 레이아웃 */
const page_wrap: React.CSSProperties = {
  background: ui_tok.bg_page,
  minHeight: "100vh",
  padding: "24px 16px",
};
const page_inner: React.CSSProperties = {
  maxWidth: 1200,
  margin: "0 auto",
};

const title_style: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 800,
  color: ui_tok.text,
  marginBottom: 12,
};

/* 카드 & 상단 탭/컨트롤 */
const card: React.CSSProperties = {
  border: `1px solid ${ui_tok.border}`,
  borderRadius: ui_tok.radius,
  background: ui_tok.surface,
  display: "flex",
  flexDirection: "column",
  maxHeight: "70vh",
  overflow: "hidden",
};

const card_head: React.CSSProperties = {
  padding: "10px 14px",
  borderBottom: `1px solid ${ui_tok.border}`,
  background: ui_tok.header_bg,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
};

const tabs_row: React.CSSProperties = {
  display: "flex",
  gap: 6,
  flexWrap: "wrap",
};

const tab_btn_base: React.CSSProperties = {
  padding: "6px 10px",
  borderRadius: 999,
  border: `1px solid ${ui_tok.border}`,
  background: "#fff",
  fontSize: 12,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const search_row: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
};

/* 테이블 */
const table_wrap: React.CSSProperties = {
  flex: 1,
  overflowY: "auto",
  overflowX: "auto",
};
const table_style = {
  width: "100%",
  borderCollapse: "separate" as const,
  borderSpacing: 0,
};
const th_style: React.CSSProperties = {
  padding: "10px 8px",
  textAlign: "left",
  background: ui_tok.header_bg,
  borderBottom: `1px solid ${ui_tok.border}`,
  fontSize: 13,
  fontWeight: 700,
  position: "sticky",
  top: 0,
  zIndex: 1,
};
const td_style: React.CSSProperties = {
  borderBottom: `1px solid ${ui_tok.border}`,
  padding: "10px 8px",
  textAlign: "left",
  whiteSpace: "nowrap",
  fontSize: 13,
};
const empty_style: React.CSSProperties = {
  padding: 18,
  textAlign: "center",
  color: ui_tok.label,
};

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

  const [inventoryRows, set_inventoryRows] = useState<InventoryRow[]>([]);
  const [lotRows, set_lotRows] = useState<LotRow[]>([]);

  const [warehouseIdInput, set_warehouseIdInput] = useState("");
  const [warehouseNameInput, set_warehouseNameInput] = useState("");
  const [itemIdInput, set_itemIdInput] = useState("");

  const [isLoading, set_isLoading] = useState(false);
  const [errorMsg, set_errorMsg] = useState("");

  // ALL 탭일 때 전체 재고 자동 로드
  useEffect(() => {
    if (tab !== "ALL") return;
    void handleLoadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const resetResults = () => {
    set_inventoryRows([]);
    set_lotRows([]);
    set_errorMsg("");
  };

  const handleLoadAll = async () => {
    set_isLoading(true);
    set_errorMsg("");
    set_lotRows([]);
    try {
      const data = await fetchAllInventories();
      set_inventoryRows(data);
    } catch (e: any) {
      set_errorMsg(
        e?.message || "인벤토리를 불러오는 중 오류가 발생했습니다."
      );
      set_inventoryRows([]);
    } finally {
      set_isLoading(false);
    }
  };

  const handleSearchWarehouseId = async () => {
    if (!warehouseIdInput.trim()) return;
    set_isLoading(true);
    set_errorMsg("");
    set_lotRows([]);
    try {
      const data = await fetchInventoriesByWarehouseId(
        warehouseIdInput.trim()
      );
      set_inventoryRows(data);
    } catch (e: any) {
      set_errorMsg(
        e?.message || "창고별 인벤토리를 불러오는 중 오류가 발생했습니다."
      );
      set_inventoryRows([]);
    } finally {
      set_isLoading(false);
    }
  };

  const handleSearchWarehouseName = async () => {
    if (!warehouseNameInput.trim()) return;
    set_isLoading(true);
    set_errorMsg("");
    set_lotRows([]);
    try {
      const data = await fetchInventoriesByWarehouseName(
        warehouseNameInput.trim()
      );
      set_inventoryRows(data);
    } catch (e: any) {
      set_errorMsg(
        e?.message || "창고 이름 기준 인벤토리 조회 중 오류가 발생했습니다."
      );
      set_inventoryRows([]);
    } finally {
      set_isLoading(false);
    }
  };

  const handleSearchLot = async () => {
    if (!itemIdInput.trim()) return;
    set_isLoading(true);
    set_errorMsg("");
    set_inventoryRows([]);
    try {
      const data = await fetchLotsByItemId(itemIdInput.trim());
      set_lotRows(data);
    } catch (e: any) {
      set_errorMsg(e?.message || "LOT 조회 중 오류가 발생했습니다.");
      set_lotRows([]);
    } finally {
      set_isLoading(false);
    }
  };

  const changeTab = (next: Tab) => {
    set_tab(next);
    set_errorMsg("");
    set_isLoading(false);
    set_inventoryRows([]);
    set_lotRows([]);
  };

  return (
    <div style={page_wrap}>
      <div style={page_inner}>
        <div style={title_style}>인벤토리 조회</div>

        <div style={card}>
          <div style={card_head}>
            {/* 탭 버튼 */}
            <div style={tabs_row}>
              {([
                ["ALL", "전체 재고"],
                ["WAREHOUSE_ID", "창고 ID별"],
                ["WAREHOUSE_NAME", "창고 이름별"],
                ["LOT", "LOT(아이템) 조회"],
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

            {/* 검색/입력 라인 (버튼별 UI 컴포넌트 사용) */}
            <div style={search_row}>
              {tab === "ALL" && (
                <>
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

              {tab === "WAREHOUSE_ID" && (
                <InventoryWarehouseIdSearch
                  value={warehouseIdInput}
                  loading={isLoading}
                  onChange={set_warehouseIdInput}
                  onSearch={handleSearchWarehouseId}
                  onReset={() => {
                    set_warehouseIdInput("");
                    resetResults();
                  }}
                />
              )}

              {tab === "WAREHOUSE_NAME" && (
                <InventoryWarehouseNameSearch
                  value={warehouseNameInput}
                  loading={isLoading}
                  onChange={set_warehouseNameInput}
                  onSearch={handleSearchWarehouseName}
                  onReset={() => {
                    set_warehouseNameInput("");
                    resetResults();
                  }}
                />
              )}

              {tab === "LOT" && (
                <InventoryLotSearch
                  value={itemIdInput}
                  loading={isLoading}
                  onChange={set_itemIdInput}
                  onSearch={handleSearchLot}
                  onReset={() => {
                    set_itemIdInput("");
                    resetResults();
                  }}
                />
              )}
            </div>
          </div>

          {/* 상태 표시 */}
          {isLoading && (
            <div style={{ padding: "6px 14px", color: ui_tok.label }}>
              불러오는 중…
            </div>
          )}
          {errorMsg && (
            <div style={{ padding: "6px 14px", color: "#b91c1c" }}>
              {errorMsg}
            </div>
          )}

          {/* 리스트 영역 */}
          <div style={table_wrap}>
            {tab === "LOT" ? (
              <table style={table_style}>
                <thead>
                  <tr>
                    <th style={th_style}>lot_id</th>
                    <th style={th_style}>item_id</th>
                    <th style={th_style}>warehouse_id</th>
                    <th style={th_style}>inventory_id</th>
                    <th style={th_style}>manufacture_date</th>
                    <th style={th_style}>expiry_date</th>
                    <th style={th_style}>received_date</th>
                    <th style={th_style}>shipment_id</th>
                  </tr>
                </thead>
                <tbody>
                  {lotRows.map((row, idx) => (
                    <tr
                      key={row.id}
                      style={
                        idx % 2 === 1 ? { background: ui_tok.zebra } : undefined
                      }
                    >
                      <td style={td_style}>{row.lot_id}</td>
                      <td style={td_style}>{row.item_id}</td>
                      <td style={td_style}>{row.warehouse_id}</td>
                      <td style={td_style}>{row.inventory_id}</td>
                      <td style={td_style}>{fmtDate(row.manufacture_date)}</td>
                      <td style={td_style}>{fmtDate(row.expiry_date)}</td>
                      <td style={td_style}>{fmtDate(row.received_date)}</td>
                      <td style={td_style}>
                        {row.shipment_id ?? (
                          <span style={{ color: ui_tok.label }}>-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {!lotRows.length && !isLoading && !errorMsg && (
                    <tr>
                      <td colSpan={8} style={empty_style}>
                        조회된 LOT 정보가 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            ) : (
              <table style={table_style}>
                <thead>
                  <tr>
                    <th style={th_style}>inventory_id</th>
                    <th style={th_style}>warehouse_id</th>
                    <th style={th_style}>item_id</th>
                    <th style={th_style}>quantity</th>
                    <th style={th_style}>safety_stock</th>
                    <th style={th_style}>store_date</th>
                    <th style={th_style}>expiry_date</th>
                  </tr>
                </thead>
                <tbody>
                  {inventoryRows.map((row, idx) => (
                    <tr
                      key={row.id}
                      style={
                        idx % 2 === 1 ? { background: ui_tok.zebra } : undefined
                      }
                    >
                      <td style={td_style}>{row.inventory_id}</td>
                      <td style={td_style}>{row.warehouse_id}</td>
                      <td style={td_style}>{row.item_id}</td>
                      <td style={td_style}>{row.quantity}</td>
                      <td style={td_style}>{row.safety_stock}</td>
                      <td style={td_style}>{fmtDate(row.store_date)}</td>
                      <td style={td_style}>{fmtDate(row.expiry_date)}</td>
                    </tr>
                  ))}
                  {!inventoryRows.length && !isLoading && !errorMsg && (
                    <tr>
                      <td colSpan={7} style={empty_style}>
                        조회된 인벤토리가 없습니다.
                      </td>
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

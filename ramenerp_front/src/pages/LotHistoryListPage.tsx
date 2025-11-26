// src/pages/LotHistoryListPage.tsx
// LOT 내역 조회 전용 페이지 UI

import React, { useState, useEffect } from "react";
import {
  fetch_all_lots,
  fetch_lots_by_lot_id,
  fetch_lots_by_item_id,
  fetch_lots_by_warehouse_id,
  fetch_available_by_item,
  fetch_available_by_warehouse,
  fetch_available_by_item_and_warehouse,
  fetch_lots_by_period,
  type LotRow,
} from "../components/LotHistoryListFunction";

const ui_tok = {
  bg_page: "#f7f8fa",
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
const page_wrap_style: React.CSSProperties = {
  background: ui_tok.bg_page,
  minHeight: "100vh",
  padding: "24px 24px",
};

const page_inner_style: React.CSSProperties = {
  maxWidth: 1280,
  margin: "0 auto",
};

const title_style: React.CSSProperties = {
  fontSize: 24,
  fontWeight: 800,
  color: ui_tok.text,
  marginBottom: 18,
};

const card_style: React.CSSProperties = {
  border: `1px solid ${ui_tok.border}`,
  borderRadius: ui_tok.radius,
  background: ui_tok.surface,
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
};

/** 상단 필터 전체 래퍼 */
const filters_wrap_style: React.CSSProperties = {
  padding: "16px 18px 2px",
  borderBottom: `1px solid ${ui_tok.border}`,
  background: ui_tok.surface,
  display: "flex",
  flexDirection: "column",
  gap: 10,
};

/** 1행: 입력칸들을 일렬로 + 오른쪽 검색 버튼 */
const filter_top_row_style: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(5, minmax(0, 1fr)) auto", // LOT, Item, 창고, 시작, 종료 + 검색버튼
  columnGap: 12,
  rowGap: 8,
  alignItems: "end",
};

const filter_field_wrap_style: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
};

const filter_field_label_style: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: ui_tok.label,
};

const filter_button_cell_style: React.CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
};

/** 2행: 가용 자원 버튼 + 입력 초기화 */
const filter_button_row_style: React.CSSProperties = {
  marginTop: 6,
  display: "flex",
  flexWrap: "wrap",
  gap: 8,
  alignItems: "center",
};

/** 3행: (지금은 내용 없는) 안내 영역 */
const filter_hint_row_style: React.CSSProperties = {
  marginTop: 2,
  display: "flex",
  flexWrap: "wrap",
  gap: 8,
};

const input_style: React.CSSProperties = {
  height: 34,
  borderRadius: 8,
  border: `1px solid ${ui_tok.border}`,
  padding: "0 10px",
  fontSize: 13,
  width: "100%",
  boxSizing: "border-box",
};

const date_input_style: React.CSSProperties = {
  ...input_style,
};

const button_style: React.CSSProperties = {
  padding: "0 16px",
  height: 34,
  borderRadius: 8,
  border: "1px solid #020617",
  background: ui_tok.primary_bg,
  color: ui_tok.primary_text,
  cursor: "pointer",
  whiteSpace: "nowrap",
  fontSize: 13,
};

const ghost_button_style: React.CSSProperties = {
  padding: "0 12px",
  height: 32,
  borderRadius: 8,
  border: `1px solid ${ui_tok.border}`,
  background: "#ffffff",
  color: ui_tok.text,
  cursor: "pointer",
  whiteSpace: "nowrap",
  fontSize: 12,
};

/** 가용 자원 버튼(연한 주황) */
const availability_button_style: React.CSSProperties = {
  ...ghost_button_style,
  background: "#fff7ed",
  borderColor: "#fed7aa",
  color: "#c2410c",
  fontWeight: 500,
};

/** 입력값 초기화 버튼 (연한 회색) */
const reset_button_style: React.CSSProperties = {
  ...ghost_button_style,
  background: "#f9fafb",
  borderColor: "#e5e7eb",
};

/** 상태바 오른쪽에 붙는 새로고침 버튼 */
const refresh_button_style: React.CSSProperties = {
  width: 30,
  height: 30,
  borderRadius: 999,
  border: `1px solid ${ui_tok.border}`,
  background: "#ffffff",
  cursor: "pointer",
  fontSize: 16,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const hint_style: React.CSSProperties = {
  fontSize: 11,
  color: ui_tok.label,
};

const table_wrap_style: React.CSSProperties = {
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
  padding: "9px 8px",
  textAlign: "left",
  background: ui_tok.header_bg,
  borderBottom: `1px solid ${ui_tok.border}`,
  fontSize: 12,
  fontWeight: 700,
  position: "sticky",
  top: 0,
  zIndex: 1,
  whiteSpace: "nowrap",
};

const td_style: React.CSSProperties = {
  borderBottom: `1px solid ${ui_tok.border}`,
  padding: "9px 8px",
  textAlign: "left",
  whiteSpace: "nowrap",
  fontSize: 12,
};

const status_bar_style: React.CSSProperties = {
  padding: "7px 18px",
  borderBottom: `1px solid ${ui_tok.border}`,
  fontSize: 12,
  color: ui_tok.label,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 8,
};

const status_label_style: React.CSSProperties = {
  fontWeight: 500,
};

const status_count_style: React.CSSProperties = {
  fontSize: 11,
};

const error_style: React.CSSProperties = {
  ...status_bar_style,
  color: "#b91c1c",
};

const empty_style: React.CSSProperties = {
  padding: 16,
  textAlign: "center",
  color: ui_tok.label,
};

/* 날짜 포맷 */
const fmt_date = (iso?: string | null): string => {
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

const LotHistoryListPage: React.FC = () => {
  const [lot_rows, set_lot_rows] = useState<LotRow[]>([]);
  const [is_loading, set_is_loading] = useState<boolean>(false);
  const [error_msg, set_error_msg] = useState<string>("");

  const [current_filter_label, set_current_filter_label] =
    useState<string>("LOT 전체 조회 (/lot)");

  // 입력 상태
  const [lot_id_input, set_lot_id_input] = useState<string>("");
  const [item_id_input, set_item_id_input] = useState<string>("");
  const [warehouse_id_input, set_warehouse_id_input] =
    useState<string>("");
  const [period_start, set_period_start] = useState<string>("");
  const [period_end, set_period_end] = useState<string>("");

  // 🔹 에러 메시지 자동 숨김 (2초 후에 사라지게)
  useEffect(() => {
    if (!error_msg) return;
    const timer = setTimeout(() => {
      set_error_msg("");
    }, 2000);
    return () => clearTimeout(timer);
  }, [error_msg]);

  const reset_state = () => {
    set_error_msg("");
    set_is_loading(false);
  };

  const handle_load_all = async () => {
    reset_state();
    set_is_loading(true);
    try {
      const data = await fetch_all_lots();
      set_lot_rows(data);
      set_current_filter_label("LOT 전체 조회 (/lot)");
    } catch (e: any) {
      set_lot_rows([]);
      set_error_msg(e?.message || "LOT 전체 조회 중 오류가 발생했습니다.");
    } finally {
      set_is_loading(false);
    }
  };

  const handle_search_by_lot_id = async () => {
    if (!lot_id_input.trim()) {
      set_error_msg("LOT ID(문자형)를 입력해 주세요.");
      return;
    }
    reset_state();
    set_is_loading(true);
    try {
      const data = await fetch_lots_by_lot_id(lot_id_input.trim());
      set_lot_rows(data);
      set_current_filter_label(
        `LOT ID 조회 (/lot/:lotid, lotid="${lot_id_input.trim()}")`,
      );
    } catch (e: any) {
      set_lot_rows([]);
      set_error_msg(e?.message || "LOT ID 조회 중 오류가 발생했습니다.");
    } finally {
      set_is_loading(false);
    }
  };

  const handle_search_by_item_id = async () => {
    const num = Number(item_id_input);
    if (!item_id_input || Number.isNaN(num)) {
      set_error_msg("Item ID(숫자)를 올바르게 입력해 주세요.");
      return;
    }
    reset_state();
    set_is_loading(true);
    try {
      const data = await fetch_lots_by_item_id(num);
      set_lot_rows(data);
      set_current_filter_label(
        `Item ID 조회 (/lot/:itemid, itemid=${num})`,
      );
    } catch (e: any) {
      set_lot_rows([]);
      set_error_msg(e?.message || "Item ID 조회 중 오류가 발생했습니다.");
    } finally {
      set_is_loading(false);
    }
  };

  const handle_search_by_warehouse_id = async () => {
    const num = Number(warehouse_id_input);
    if (!warehouse_id_input || Number.isNaN(num)) {
      set_error_msg("창고 ID(숫자)를 올바르게 입력해 주세요.");
      return;
    }
    reset_state();
    set_is_loading(true);
    try {
      const data = await fetch_lots_by_warehouse_id(num);
      set_lot_rows(data);
      set_current_filter_label(
        `창고 ID 조회 (/lot/warehouseid?warehouseid=${num})`,
      );
    } catch (e: any) {
      set_lot_rows([]);
      set_error_msg(e?.message || "창고 ID 조회 중 오류가 발생했습니다.");
    } finally {
      set_is_loading(false);
    }
  };

  const handle_available_by_item = async () => {
    const num = Number(item_id_input);
    if (!item_id_input || Number.isNaN(num)) {
      set_error_msg("Item ID(숫자)를 올바르게 입력해 주세요.");
      return;
    }
    reset_state();
    set_is_loading(true);
    try {
      const data = await fetch_available_by_item(num);
      set_lot_rows(data);
      set_current_filter_label(
        `가용 자원 (Item 기준) (/lot/available?itemid=${num})`,
      );
    } catch (e: any) {
      set_lot_rows([]);
      set_error_msg(
        e?.message ||
          "가용 자원(Item 기준) 조회 중 오류가 발생했습니다.",
      );
    } finally {
      set_is_loading(false);
    }
  };

  const handle_available_by_warehouse = async () => {
    const num = Number(warehouse_id_input);
    if (!warehouse_id_input || Number.isNaN(num)) {
      set_error_msg("창고 ID(숫자)를 올바르게 입력해 주세요.");
      return;
    }
    reset_state();
    set_is_loading(true);
    try {
      const data = await fetch_available_by_warehouse(num);
      set_lot_rows(data);
      set_current_filter_label(
        `가용 자원 (창고 기준) (/lot/available?warehouseid=${num})`,
      );
    } catch (e: any) {
      set_lot_rows([]);
      set_error_msg(
        e?.message ||
          "가용 자원(창고 기준) 조회 중 오류가 발생했습니다.",
      );
    } finally {
      set_is_loading(false);
    }
  };

  const handle_available_by_item_and_warehouse = async () => {
    const item_num = Number(item_id_input);
    const wh_num = Number(warehouse_id_input);

    if (!item_id_input || Number.isNaN(item_num)) {
      set_error_msg("Item ID(숫자)를 올바르게 입력해 주세요.");
      return;
    }
    if (!warehouse_id_input || Number.isNaN(wh_num)) {
      set_error_msg("창고 ID(숫자)를 올바르게 입력해 주세요.");
      return;
    }

    reset_state();
    set_is_loading(true);
    try {
      const data = await fetch_available_by_item_and_warehouse(
        item_num,
        wh_num,
      );
      set_lot_rows(data);
      set_current_filter_label(
        `가용 자원 (Item+창고 기준) (/lot/available?itemid=${item_num}&warehouseid=${wh_num})`,
      );
    } catch (e: any) {
      set_lot_rows([]);
      set_error_msg(
        e?.message ||
          "가용 자원(Item+창고 기준) 조회 중 오류가 발생했습니다.",
      );
    } finally {
      set_is_loading(false);
    }
  };

  const handle_search_by_period = async () => {
    if (!period_start || !period_end) {
      set_error_msg("기간 조회를 위해 시작일과 종료일을 모두 선택해 주세요.");
      return;
    }
    reset_state();
    set_is_loading(true);
    try {
      const data = await fetch_lots_by_period(period_start, period_end);
      set_lot_rows(data);
      set_current_filter_label(
        `기간별 조회 (/lot/period?start=${period_start}&end=${period_end})`,
      );
    } catch (e: any) {
      set_lot_rows([]);
      set_error_msg(e?.message || "기간별 조회 중 오류가 발생했습니다.");
    } finally {
      set_is_loading(false);
    }
  };

  /** 맨 오른쪽 "검색" 버튼에서 쓰는 통합 검색 로직 */
  const handle_search_main = async () => {
    if (period_start && period_end) {
      await handle_search_by_period();
      return;
    }
    if (lot_id_input.trim()) {
      await handle_search_by_lot_id();
      return;
    }
    if (item_id_input.trim()) {
      await handle_search_by_item_id();
      return;
    }
    if (warehouse_id_input.trim()) {
      await handle_search_by_warehouse_id();
      return;
    }
    // 아무 것도 없으면 전체 조회
    await handle_load_all();
  };

  const handle_reset_inputs = () => {
    set_lot_id_input("");
    set_item_id_input("");
    set_warehouse_id_input("");
    set_period_start("");
    set_period_end("");
    set_error_msg("");
  };

  return (
    <div style={page_wrap_style}>
      <div style={page_inner_style}>
        <div style={title_style}>LOT 내역 조회</div>

        <div style={card_style}>
          {/* 🔹 필터 영역 */}
          <div style={filters_wrap_style}>
            {/* 1행: LOT / Item / 창고 / 기간 시작 / 기간 종료 / 검색 버튼 */}
            <div style={filter_top_row_style}>
              {/* LOT ID */}
              <div style={filter_field_wrap_style}>
                <div style={filter_field_label_style}>LOT ID</div>
                <input
                  style={input_style}
                  placeholder='예: LOT_IT_0001_251105_0001'
                  value={lot_id_input}
                  onChange={(e) => set_lot_id_input(e.target.value)}
                />
              </div>

              {/* Item ID */}
              <div style={filter_field_wrap_style}>
                <div style={filter_field_label_style}>Item ID</div>
                <input
                  style={input_style}
                  placeholder="숫자형 Item ID"
                  value={item_id_input}
                  onChange={(e) => set_item_id_input(e.target.value)}
                />
              </div>

              {/* 창고 ID */}
              <div style={filter_field_wrap_style}>
                <div style={filter_field_label_style}>창고 ID</div>
                <input
                  style={input_style}
                  placeholder="숫자형 창고 ID"
                  value={warehouse_id_input}
                  onChange={(e) =>
                    set_warehouse_id_input(e.target.value)
                  }
                />
              </div>

              {/* 기간 시작 */}
              <div style={filter_field_wrap_style}>
                <div style={filter_field_label_style}>기간 시작</div>
                <input
                  type="date"
                  style={date_input_style}
                  value={period_start}
                  onChange={(e) => set_period_start(e.target.value)}
                />
              </div>

              {/* 기간 종료 */}
              <div style={filter_field_wrap_style}>
                <div style={filter_field_label_style}>기간 종료</div>
                <input
                  type="date"
                  style={date_input_style}
                  value={period_end}
                  onChange={(e) => set_period_end(e.target.value)}
                />
              </div>

              {/* 검색 버튼 (맨 오른쪽) */}
              <div style={filter_button_cell_style}>
                <button
                  type="button"
                  style={button_style}
                  onClick={handle_search_main}
                >
                  검색
                </button>
              </div>
            </div>

            {/* 2행: 가용 자원 버튼 + 입력 초기화 */}
            <div style={filter_button_row_style}>
              <button
                type="button"
                style={availability_button_style}
                onClick={handle_available_by_item}
              >
                Item 기준 가용 자원
              </button>
              <button
                type="button"
                style={availability_button_style}
                onClick={handle_available_by_warehouse}
              >
                창고 기준 가용 자원
              </button>
              <button
                type="button"
                style={availability_button_style}
                onClick={handle_available_by_item_and_warehouse}
              >
                Item+창고 기준 가용 자원
              </button>

              <button
                type="button"
                style={reset_button_style}
                onClick={handle_reset_inputs}
              >
                입력값 초기화
              </button>
            </div>

            {/* 3행: (지금은 내용 없는) 안내 영역 – span 내용만 제거 */}
            <div style={filter_hint_row_style}>
              <span style={hint_style} />
            </div>
            <div style={filter_hint_row_style}>
              <span style={hint_style} />
            </div>
            <div style={filter_hint_row_style}>
              <span style={hint_style} />
            </div>
          </div>

          {/* 상태 바 + 오른쪽 새로고침(전체조회) 버튼 */}
          {error_msg ? (
            <div style={error_style}>{error_msg}</div>
          ) : (
            <div style={status_bar_style}>
              <span style={status_label_style}>
                현재 필터: {current_filter_label}
              </span>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span style={status_count_style}>
                  {is_loading
                    ? "불러오는 중…"
                    : `조회 결과: ${lot_rows.length}건`}
                </span>
                <button
                  type="button"
                  style={refresh_button_style}
                  onClick={handle_load_all}
                  title="전체 조회 / 새로고침"
                >
                  ↻
                </button>
              </div>
            </div>
          )}

          {/* 리스트 영역 */}
          <div style={table_wrap_style}>
            <table style={table_style}>
              <thead>
                <tr>
                  <th style={th_style}>LOT 코드</th>
                  <th style={th_style}>Item ID</th>
                  <th style={th_style}>창고 ID</th>
                  <th style={th_style}>제조 일시</th>
                  <th style={th_style}>입고 일시</th>
                  <th style={th_style}>유통기한</th>
                  <th style={th_style}>Inventory ID</th>
                  <th style={th_style}>Shipment ID</th>
                  <th style={th_style}>구분</th>
                </tr>
              </thead>
              <tbody>
                {lot_rows.map((row, idx) => {
                  const inbound_date =
                    row.received_date ??
                    row.store_date ??
                    row.manufacture_date ??
                    null;

                  return (
                    <tr
                      key={row.id ?? `${row.lot_id ?? ""}-${idx}`}
                      style={
                        idx % 2 === 1
                          ? { background: ui_tok.zebra }
                          : undefined
                      }
                    >
                      <td style={td_style}>{row.lot_id ?? "-"}</td>
                      <td style={td_style}>{row.item_id ?? "-"}</td>
                      <td style={td_style}>{row.warehouse_id ?? "-"}</td>
                      <td style={td_style}>
                        {fmt_date(row.manufacture_date)}
                      </td>
                      <td style={td_style}>{fmt_date(inbound_date)}</td>
                      <td style={td_style}>{fmt_date(row.expiry_date)}</td>
                      <td style={td_style}>
                        {row.inventory_id ?? (
                          <span style={{ color: ui_tok.label }}>-</span>
                        )}
                      </td>
                      <td style={td_style}>
                        {row.shipment_id ?? (
                          <span style={{ color: ui_tok.label }}>-</span>
                        )}
                      </td>
                      <td style={td_style}>
                        {row.action_type ?? (
                          <span style={{ color: ui_tok.label }}>-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {!lot_rows.length && !is_loading && !error_msg && (
                  <tr>
                    <td colSpan={9} style={empty_style}>
                      조회된 LOT 내역이 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LotHistoryListPage;

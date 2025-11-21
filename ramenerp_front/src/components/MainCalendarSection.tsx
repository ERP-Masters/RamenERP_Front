// src/components/MainCalendarSection.tsx
import React, { JSX } from "react";
import { useNavigate } from "react-router-dom";
import { use_main_calendar } from "../pages/MainDashBoardFunction";

const ui_tok = {
  bg_page: "#f5f7fb",
  surface: "#ffffff",
  border: "#e5e7eb",
  header_bg: "#f8fafc",
  text: "#111827",
  label: "#6b7280",
  primary_bg: "#111827",
  primary_text: "#f9fafb",
  radius: 18,
} as const;

const card_style: React.CSSProperties = {
  background: ui_tok.surface,
  borderRadius: ui_tok.radius,
  padding: "14px 18px 16px",
  boxShadow: "0 10px 26px rgba(15,23,42,0.07)",
  border: `1px solid ${ui_tok.border}`,
  display: "flex",
  flexDirection: "column",
};

const main_header_style: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  marginBottom: 10,
};

const title_block_style: React.CSSProperties = {};

const title_style: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 600,
};

const subtitle_style: React.CSSProperties = {
  fontSize: 11,
  color: ui_tok.label,
  marginTop: 2,
};

const nav_btn_wrap_style: React.CSSProperties = {
  display: "flex",
  gap: 4,
};

const nav_btn_style: React.CSSProperties = {
  border: "none",
  background: "#e5e7eb",
  padding: "4px 10px",
  borderRadius: 999,
  fontSize: 11,
  cursor: "pointer",
};

const body_grid_style: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "2.5fr 1.2fr",
  columnGap: 20,
  alignItems: "stretch",
  flex: 1,
  minHeight: 0,
};

const calendar_table_style: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  tableLayout: "fixed",
  fontSize: 12,
};

const calendar_th_style: React.CSSProperties = {
  padding: "4px 0",
  fontWeight: 600,
  color: ui_tok.label,
  textAlign: "center",
};

const calendar_td_style: React.CSSProperties = {
  height: 70,
  verticalAlign: "top",
  padding: "4px 6px",
};

const day_cell_base_style: React.CSSProperties = {
  borderRadius: 12,
  cursor: "pointer",
  padding: "3px 5px",
  transition: "background 0.12s, box-shadow 0.12s, transform 0.05s",
};

const day_cell_today_style: React.CSSProperties = {
  outline: "2px solid #0ea5e9",
  outlineOffset: 0,
};

const day_cell_selected_style: React.CSSProperties = {
  background: "#111827",
  color: "#f9fafb",
  boxShadow: "0 0 0 1px #0f172a, 0 10px 20px rgba(15,23,42,0.4)",
  transform: "translateY(-1px)",
};

const day_number_style: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  marginBottom: 3,
};

const day_counts_style: React.CSSProperties = {
  fontSize: 10,
  lineHeight: 1.3,
};

const day_counts_span_style: React.CSSProperties = {
  display: "block",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  color: "#4b5563",
};

const right_panel_wrap_style: React.CSSProperties = {
  height: "100%",
  display: "flex",
  flexDirection: "column",
  minHeight: 0,
};

const schedule_header_style: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 8,
};

const schedule_title_style: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 600,
};

const schedule_summary_style: React.CSSProperties = {
  fontSize: 12,
  color: "#4b5563",
  marginTop: 2,
};

const badge_style: React.CSSProperties = {
  fontSize: 11,
  padding: "3px 10px",
  borderRadius: 999,
  background: "#eff6ff",
  color: "#1d4ed8",
};

const tabs_wrap_style: React.CSSProperties = {
  display: "inline-flex",
  borderRadius: 999,
  background: "#f3f4f6",
  padding: 3,
  marginBottom: 8,
  gap: 2,
};

const tab_btn_style: React.CSSProperties = {
  border: "none",
  fontSize: 12,
  padding: "4px 12px",
  borderRadius: 999,
  background: "transparent",
  cursor: "pointer",
  color: "#4b5563",
};

const tab_btn_active_style: React.CSSProperties = {
  background: ui_tok.primary_bg,
  color: ui_tok.primary_text,
};

const tab_panel_style: React.CSSProperties = {
  marginTop: 4,
  flex: 1,
  minHeight: 0,
  overflow: "auto",
};

const schedule_table_style: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: 12,
};

const schedule_th_style: React.CSSProperties = {
  padding: "6px 4px",
  textAlign: "left",
  borderBottom: `1px solid ${ui_tok.border}`,
  color: ui_tok.label,
  fontSize: 11,
  whiteSpace: "nowrap",
};

const schedule_td_style: React.CSSProperties = {
  padding: "6px 4px",
  textAlign: "left",
  fontSize: 12,
};

const schedule_row_odd_style: React.CSSProperties = {
  background: "#f9fafb",
};

// 발주/수주 리스트 하단 '더 보기' 영역 스타일
const more_link_row_style: React.CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  marginTop: 8,
  fontSize: 11,
};

const more_link_style: React.CSSProperties = {
  color: ui_tok.label,
  textDecoration: "none",
  cursor: "pointer",
};

const MainCalendarSection: React.FC = () => {
  const calendar = use_main_calendar();
  const navigate = useNavigate();

  const is_purchase_tab = calendar.active_tab === "purchase";

  const handle_click_more_purchase = (
    e: React.MouseEvent<HTMLAnchorElement>,
  ) => {
    e.preventDefault();
    navigate("/vendor-order");
  };

  const handle_click_more_sales = (
    e: React.MouseEvent<HTMLAnchorElement>,
  ) => {
    e.preventDefault();
    navigate("/branch-order");
  };

  const rows: JSX.Element[] = [];
  for (let row_index = 0; row_index < 6; row_index++) {
    const slice = calendar.cells.slice(row_index * 7, row_index * 7 + 7);
    rows.push(
      <tr key={row_index}>
        {slice.map((cell, col_index) => (
          <td key={col_index} style={calendar_td_style}>
            {cell.date_str && cell.day_num != null ? (
              <div
                style={{
                  ...day_cell_base_style,
                  ...(cell.is_today ? day_cell_today_style : {}),
                  ...(cell.is_selected ? day_cell_selected_style : {}),
                }}
                onClick={() => calendar.handle_select_date(cell.date_str!)}
              >
                <div style={day_number_style}>{cell.day_num}</div>
                <div style={day_counts_style}>
                  <span style={day_counts_span_style}>
                    발주 {cell.purchase_count}건
                  </span>
                  <span style={day_counts_span_style}>
                    수주 {cell.sales_count}건
                  </span>
                </div>
              </div>
            ) : null}
          </td>
        ))}
      </tr>,
    );
  }

  return (
    <section style={card_style}>
      <div style={main_header_style}>
        <div style={title_block_style}>
          <div style={title_style}>{calendar.month_title}</div>
          <div style={subtitle_style}>발주·수주 등록/만기 일자 확인</div>
        </div>
        <div style={nav_btn_wrap_style}>
          <button
            type="button"
            style={nav_btn_style}
            onClick={calendar.go_prev_month}
          >
            &lt; 이전
          </button>
          <button
            type="button"
            style={nav_btn_style}
            onClick={calendar.go_today}
          >
            오늘
          </button>
          <button
            type="button"
            style={nav_btn_style}
            onClick={calendar.go_next_month}
          >
            다음 &gt;
          </button>
        </div>
      </div>

      <div style={body_grid_style}>
        {/* 왼쪽: 달력 */}
        <div>
          <table style={calendar_table_style}>
            <thead>
              <tr>
                {calendar.weekday_labels.map((label) => (
                  <th key={label} style={calendar_th_style}>
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>{rows}</tbody>
          </table>
        </div>

        {/* 오른쪽: 일정 패널 */}
        <div style={right_panel_wrap_style}>
          <div style={schedule_header_style}>
            <div>
              <div style={schedule_title_style}>
                {calendar.selected_date_str} 일정
              </div>
              <div style={schedule_summary_style}>
                {calendar.selected_summary_text}
              </div>
            </div>
            <span style={badge_style}></span>
          </div>

          <div style={tabs_wrap_style}>
            <button
              type="button"
              style={{
                ...tab_btn_style,
                ...(is_purchase_tab ? tab_btn_active_style : {}),
              }}
              onClick={() => calendar.set_active_tab("purchase")}
            >
              발주
            </button>
            <button
              type="button"
              style={{
                ...tab_btn_style,
                ...(!is_purchase_tab ? tab_btn_active_style : {}),
              }}
              onClick={() => calendar.set_active_tab("sales")}
            >
              수주
            </button>
          </div>

          {/* 발주 리스트 */}
          {is_purchase_tab && (
            <div style={tab_panel_style}>
              <table style={schedule_table_style}>
                <thead>
                  <tr>
                    <th style={schedule_th_style}>발주 ID</th>
                    <th style={schedule_th_style}>거래처</th>
                    <th style={schedule_th_style}>담당자</th>
                    <th style={schedule_th_style}>발주일자</th>
                    <th style={schedule_th_style}>입고 예정일</th>
                    <th style={schedule_th_style}>상태</th>
                  </tr>
                </thead>
                <tbody>
                  {calendar.selected_purchase_rows.map((row, index) => (
                    <tr
                      key={row.id}
                      style={index % 2 === 0 ? undefined : schedule_row_odd_style}
                    >
                      <td style={schedule_td_style}>{row.id}</td>
                      <td style={schedule_td_style}>{row.vendor}</td>
                      <td style={schedule_td_style}>{row.manager}</td>
                      <td style={schedule_td_style}>{row.order_date}</td>
                      <td style={schedule_td_style}>{row.inbound_date}</td>
                      <td style={schedule_td_style}>{row.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {/* 발주 리스트 하단 '더 보기' */}
              <div style={more_link_row_style}>
                <a
                  href="#"
                  style={more_link_style}
                  onClick={handle_click_more_purchase}
                >
                  더 보기
                </a>
              </div>
            </div>
          )}

          {/* 수주 리스트 */}
          {!is_purchase_tab && (
            <div style={tab_panel_style}>
              <table style={schedule_table_style}>
                <thead>
                  <tr>
                    <th style={schedule_th_style}>수주 ID</th>
                    <th style={schedule_th_style}>지점명</th>
                    <th style={schedule_th_style}>수주일자</th>
                    <th style={schedule_th_style}>출고 예정일</th>
                    <th style={schedule_th_style}>상태</th>
                  </tr>
                </thead>
                <tbody>
                  {calendar.selected_sales_rows.map((row, index) => (
                    <tr
                      key={row.id}
                      style={index % 2 === 0 ? undefined : schedule_row_odd_style}
                    >
                      <td style={schedule_td_style}>{row.id}</td>
                      <td style={schedule_td_style}>{row.branch}</td>
                      <td style={schedule_td_style}>{row.order_date}</td>
                      <td style={schedule_td_style}>{row.ship_date}</td>
                      <td style={schedule_td_style}>{row.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {/* 수주 리스트 하단 '더 보기' */}
              <div style={more_link_row_style}>
                <a
                  href="#"
                  style={more_link_style}
                  onClick={handle_click_more_sales}
                >
                  더 보기
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default MainCalendarSection;

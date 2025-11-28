// src/components/StockDangerSideSection.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { stock_alert_list } from "../function/MainDashBoardFunction";

const ui_tok = {
  surface: "#ffffff",
  border: "#e5e7eb",
  text: "#111827",
  label: "#6b7280",
  danger: "#b91c1c",
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
  minHeight: 0,
};

const header_style: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 6,
};

const title_style: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 600,
};

const badge_style: React.CSSProperties = {
  fontSize: 11,
  padding: "3px 10px",
  borderRadius: 999,
  background: "#eff6ff",
  color: "#1d4ed8",
};

const more_link_style: React.CSSProperties = {
  fontSize: 11,
  color: ui_tok.label,
  textDecoration: "none",
};

const list_style: React.CSSProperties = {
  listStyle: "none",
  padding: 0,
  margin: 0,
  fontSize: 12,
  flex: 1,
  minHeight: 0,
  overflow: "auto",
};

const row_style: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0,1.6fr) minmax(0,1.1fr) minmax(0,1.1fr)",
  columnGap: 6,
  rowGap: 2,
  marginTop: 6,
};

const name_style: React.CSSProperties = {
  fontWeight: 500,
};

const qty_style: React.CSSProperties = {
  fontSize: 11,
  color: ui_tok.label,
};

const level_style: React.CSSProperties = {
  fontSize: 11,
  color: ui_tok.danger,
  justifySelf: "end",
  fontWeight: 600,
};

const StockDangerSideSection: React.FC = () => {
  const navigate = useNavigate();

  const handle_click_more = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    // ✅ 실제 재고 관리 페이지 경로로 수정해서 사용하면 됨
    navigate("/inventory/list");
  };

  return (
    <div style={card_style}>
      <div style={header_style}>
        <div style={title_style}>안전 재고 위험 알림</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={badge_style}>LOW STOCK</span>
          <a href="#" style={more_link_style} onClick={handle_click_more}>
            더 보기
          </a>
        </div>
      </div>
      <ul style={list_style}>
        {stock_alert_list.map((s) => (
          <li key={s.id}>
            <div style={row_style}>
              <div>
                <div style={name_style}>{s.name}</div>
                <div style={qty_style}>{s.qty_text}</div>
              </div>
              <div />
              <div style={level_style}>{s.level_text}</div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default StockDangerSideSection;

// src/components/NoticeSideSection.tsx
import React from "react";
import { notice_list } from "../pages/MainDashBoardFunction";

const ui_tok = {
  surface: "#ffffff",
  border: "#e5e7eb",
  text: "#111827",
  label: "#6b7280",
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

const item_style: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginTop: 6,
};

const item_title_style: React.CSSProperties = {
  fontWeight: 500,
  marginRight: 4,
};

const date_style: React.CSSProperties = {
  fontSize: 11,
  color: ui_tok.label,
};

const date_emergency_style: React.CSSProperties = {
  fontSize: 11,
  color: "#b91c1c",
};

const NoticeSideSection: React.FC = () => {
  return (
    <div style={card_style}>
      <div style={header_style}>
        <div style={title_style}>공지사항</div>
        <a href="#" style={more_link_style}>
          더 보기
        </a>
      </div>
      <ul style={list_style}>
        {notice_list.map((n, index) => (
          <li key={n.id} style={index === 0 ? undefined : item_style}>
            <span style={item_title_style}>{n.title}</span>
            <span style={n.is_emergency ? date_emergency_style : date_style}>
              {n.date_text}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default NoticeSideSection;

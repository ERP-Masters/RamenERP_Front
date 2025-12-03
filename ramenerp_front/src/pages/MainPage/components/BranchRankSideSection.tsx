// src/components/BranchRankSideSection.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { use_branch_rank_list } from "../function/MainDashBoardFunction";

const ui_tok = {
  surface: "#ffffff",
  border: "#e5e7eb",
  label: "#6b7280",
  text: "#111827",
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

const more_btn_style: React.CSSProperties = {
  fontSize: 11,
  color: ui_tok.label,
  textDecoration: "none",
  border: "none",
  background: "transparent",
  padding: 0,
  cursor: "pointer",
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
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginTop: 6,
};

const rank_style: React.CSSProperties = {
  width: 26,
  fontWeight: 600,
  color: ui_tok.label,
};

const branch_name_style: React.CSSProperties = {
  flex: 1,
};

const sales_style: React.CSSProperties = {
  whiteSpace: "nowrap",
  fontWeight: 500,
};

const BranchRankSideSection: React.FC = () => {
  // 🔹 매출 현황에서 계산한 이 달의 지점 TOP5 훅
  const branch_rank_list = use_branch_rank_list();

  // 🔹 더 보기 클릭 시 매출 현황 대시보드로 이동
  const navigate = useNavigate();
  const handle_click_more = () => {
    navigate("/sales");
  };

  return (
    <div style={card_style}>
      <div style={header_style}>
        <div style={title_style}>이 달의 지점 TOP 5</div>
        <button
          type="button"
          style={more_btn_style}
          onClick={handle_click_more}
        >
          더 보기
        </button>
      </div>
      <ul style={list_style}>
        {branch_rank_list.map((b) => (
          <li key={b.id}>
            <div style={row_style}>
              <span style={rank_style}>{b.rank_label}</span>
              <span style={branch_name_style}>{b.name}</span>
              <span style={sales_style}>{b.sales_text}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default BranchRankSideSection;

// src/components/StockDangerSideSection.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  use_stock_danger_ai,
  use_branch_stock_ai_for_side_tab,
} from "../function/StockDangerAiFunction";

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

type Stock_tab = "WAREHOUSE" | "BRANCH";

const StockDangerSideSection: React.FC = () => {
  const navigate = useNavigate();
  const [active_tab, set_active_tab] = useState<Stock_tab>("WAREHOUSE");

  const handle_click_more = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    // ✅ 재고 알림 리스트 페이지로 이동
    navigate("/inventory/stock-alerts");
  };

  // ✅ 기존 창고 알림 훅 (그대로 둠)
  const {
    ai_alert_list,
    is_loading,
    error_msg,
    has_ai_data,
  } = use_stock_danger_ai(30000);

  // ✅ 직영점용 훅 추가 (캐시에서만 읽어옴)
  const {
    branch_alert_list,
    is_loading: is_branch_loading,
    error_msg: branch_error_msg,
    has_ai_data: has_branch_ai_data,
  } = use_branch_stock_ai_for_side_tab(30000);

  // 창고 / 직영점 각각 Top3 계산
  const warehouse_top3_list = has_ai_data
    ? ai_alert_list.slice(0, 3)
    : [];

  const branch_top3_list = has_branch_ai_data
    ? branch_alert_list.slice(0, 3)
    : [];

  // 활성 탭에 따라 화면에 보여줄 데이터/상태 선택
  const view_is_loading =
    active_tab === "WAREHOUSE" ? is_loading : is_branch_loading;
  const view_error_msg =
    active_tab === "WAREHOUSE" ? error_msg : branch_error_msg;
  const view_has_data =
    active_tab === "WAREHOUSE" ? has_ai_data : has_branch_ai_data;
  const view_top3_list =
    active_tab === "WAREHOUSE" ? warehouse_top3_list : branch_top3_list;

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

      {/* 🔹 사이드 탭 안의 작은 탭 (창고 / 직영점) */}
      <div
        style={{
          display: "flex",
          gap: 6,
          marginBottom: 4,
          marginTop: 2,
          fontSize: 11,
        }}
      >
        <button
          type="button"
          onClick={() => set_active_tab("WAREHOUSE")}
          style={{
            flex: 1,
            padding: "4px 0",
            borderRadius: 999,
            border:
              active_tab === "WAREHOUSE"
                ? "1px solid #111827"
                : "1px solid #d1d5db",
            background:
              active_tab === "WAREHOUSE" ? "#111827" : "#ffffff",
            color: active_tab === "WAREHOUSE" ? "#ffffff" : "#111827",
            fontSize: 11,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          창고 재고
        </button>
        <button
          type="button"
          onClick={() => set_active_tab("BRANCH")}
          style={{
            flex: 1,
            padding: "4px 0",
            borderRadius: 999,
            border:
              active_tab === "BRANCH"
                ? "1px solid #111827"
                : "1px solid #d1d5db",
            background:
              active_tab === "BRANCH" ? "#111827" : "#ffffff",
            color: active_tab === "BRANCH" ? "#ffffff" : "#111827",
            fontSize: 11,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          직영점 재고
        </button>
      </div>

      <ul style={list_style}>
        {/* 1) 아직 캐시도 없고, 리스트도 비었는데 로딩 중인 경우 → 간단 로딩 문구 */}
        {view_is_loading && !view_has_data && (
          <li>
            <div style={{ fontSize: 11, color: ui_tok.label, marginTop: 6 }}>
              AI 재고 예측 데이터를 불러오는 중입니다...
            </div>
          </li>
        )}

        {/* 2) 캐시도 없고, 로딩도 끝났는데 에러만 있는 경우 */}
        {!view_is_loading && !view_has_data && view_error_msg && (
          <li>
            <div style={{ fontSize: 11, color: ui_tok.danger, marginTop: 6 }}>
              {view_error_msg}
            </div>
          </li>
        )}

        {/* 3) 캐시가 있지만 Top3가 없는 경우 */}
        {!view_is_loading && view_has_data && view_top3_list.length === 0 && (
          <li>
            <div style={{ fontSize: 11, color: ui_tok.label, marginTop: 6 }}>
              현재 긴급한 안전재고 알림이 없습니다.
            </div>
          </li>
        )}

        {/* 4) 실제 알림 리스트 표시 (Top3) */}
        {view_top3_list.map((s) => (
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

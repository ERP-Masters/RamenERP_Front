// src/pages/MainDashboardPageUi.tsx
// 달력 + 공지 + 지점 + 안전재고를 한 화면에 모은 메인 페이지 UI

import React from "react";
import Sidebar from "@/components/Sidebar";
import MainCalendarSection from "../components/MainCalendarSection";
import NoticeSideSection from "../components/NoticeSideSection";
import BranchRankSideSection from "../components/BranchRankSideSection";
import StockDangerSideSection from "../components/StockDangerSideSection";
// ✅ 사이드바에서 사용 중인 액션 훅 재사용 (로그아웃용)
import { useSidebarHeaderActions } from "../pages/SideabarHeaderActionsFunction";

const ui_tok = {
  bg_page: "#f5f7fb",
} as const;

const page_wrap_style: React.CSSProperties = {
  padding: "8px 16px",
  minHeight: "100vh",
  display: "flex",
  flexDirection: "column",
  background: ui_tok.bg_page,
};

const page_title_style: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 700,
};

// 🔹 상단: 왼쪽(햄버거+타이틀) / 오른쪽(로그아웃)
const header_row_style: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between", // ✅ 오른쪽에 로그아웃 버튼 배치
  marginBottom: 6,
};

// 🔹 왼쪽 영역(햄버거 + 타이틀) 래퍼
const header_left_wrap_style: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
};

const hamburger_btn_style: React.CSSProperties = {
  width: 40,
  height: 36,
  borderRadius: 10,
  border: "1px solid #e5e7eb",
  background: "#ffffff",
  cursor: "pointer",
  fontSize: 18,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

// 🔹 상단 오른쪽 로그아웃 버튼 (사이드바 헤더 버튼과 동일 스타일)
const logout_btn_style: React.CSSProperties = {
  width: 30,
  height: 28,
  borderRadius: 999,
  border: "1px solid #e5e7eb",
  background: "#ffffff",
  color: "#374151",
  cursor: "pointer",
  fontSize: 12,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 0,
};

const layout_style: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "3fr 1.35fr",
  gap: 20,
  alignItems: "stretch",
  flex: 1,
  minHeight: 0,
};

const aside_style: React.CSSProperties = {
  height: "100%",
  display: "flex",
  flexDirection: "column",
  gap: 14,
  minHeight: 0,
};

// 🔹 왼쪽 달력 영역만 살짝 축소해서 전체 높이 줄이기
const left_col_wrap_style: React.CSSProperties = {
  transform: "scale(0.98)",      // 크기 살짝 축소
  transformOrigin: "top left",    // 위쪽 기준으로 줄어들게
};

const MainDashboardPageUi: React.FC = () => {
  const [is_sidebar_open, set_is_sidebar_open] = React.useState<boolean>(false);

  // ✅ 사이드바에서 쓰는 것과 동일한 로그아웃 로직 재사용
  const { handle_logout } = useSidebarHeaderActions();

  // ✅ 이 페이지에 있는 동안만 전역 스크롤 막기
  React.useEffect(() => {
    const prev_body_overflow = document.body.style.overflow;
    const prev_html_overflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = prev_body_overflow;
      document.documentElement.style.overflow = prev_html_overflow;
    };
  }, []);

  return (
    <>
      {/* 이 페이지에서만 쓰는 오버레이 사이드바 */}
      <Sidebar
        is_open={is_sidebar_open}
        set_is_open={set_is_sidebar_open}
        mode="overlay"
      />

      <div style={page_wrap_style}>
        {/* 🔹 상단: 왼쪽(햄버거+타이틀) / 오른쪽(로그아웃 버튼) */}
        <div style={header_row_style}>
          <div style={header_left_wrap_style}>
            <button
              type="button"
              style={hamburger_btn_style}
              onClick={() => set_is_sidebar_open(true)}
              aria-label="open sidebar"
              title="메뉴 열기"
            >
              ☰
            </button>
            <div style={page_title_style}>라멘 ERP</div>
          </div>

          {/* 🔹 메인 대시보드 상단 오른쪽 로그아웃 버튼 */}
          <button
            type="button"
            style={logout_btn_style}
            onClick={handle_logout}
            title="로그아웃"
          >
            ⏻
          </button>
        </div>

        <div style={layout_style}>
          {/* 왼쪽: 달력 영역 (살짝 축소) */}
          <div style={left_col_wrap_style}>
            <MainCalendarSection />
          </div>

          {/* 오른쪽: 공지 / 지점 / 안전재고 */}
          <aside style={aside_style}>
            <NoticeSideSection />
            <BranchRankSideSection />
            <StockDangerSideSection />
          </aside>
        </div>
      </div>
    </>
  );
};

export default MainDashboardPageUi;

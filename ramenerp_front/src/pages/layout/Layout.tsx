// src/components/Layout.tsx
import React from "react";
import { Outlet, Link } from "react-router-dom";
import Sidebar from "../../menu/Sidebar";

const layout_grid_desktop: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "290px 1fr", // 좌측 고정폭 + 본문
  minHeight: "100vh",
  background: "#f7f8fa",
  color: "#111",
};

const layout_grid_mobile: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr",
  minHeight: "100vh",
  background: "#f7f8fa",
  color: "#111",
};

const topbar_style: React.CSSProperties = {
  position: "sticky",
  top: 0,
  zIndex: 998,
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "10px 14px",
  borderBottom: "1px solid #e5e7eb",
  background: "#ffffff",
};

const burger_btn_style: React.CSSProperties = {
  width: 38,
  height: 34,
  borderRadius: 8,
  border: "1px solid #e5e7eb",
  background: "#ffffff",
  color: "#111",
  cursor: "pointer",
  fontSize: 16,
};

const brand_link_style: React.CSSProperties = {
  color: "#111827",
  fontWeight: 800,
  textDecoration: "none",
  marginRight: 8,
  letterSpacing: 0.2,
  cursor: "pointer",
};

const main_style: React.CSSProperties = {
  padding: 16,
  maxWidth: 1200,
  width: "100%",
  margin: "0 auto",
};

const Layout: React.FC = () => {
  const [is_sidebar_open, set_is_sidebar_open] = React.useState<boolean>(false);
  const [is_desktop, set_is_desktop] = React.useState<boolean>(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(min-width: 1024px)").matches
      : true
  );

  React.useEffect(() => {
    const mql = window.matchMedia("(min-width: 1024px)");
    const handler = (e: MediaQueryListEvent) => set_is_desktop(e.matches);
    // 초기 동기화
    set_is_desktop(mql.matches);
    // 리스너
    if (mql.addEventListener) mql.addEventListener("change", handler);
    else mql.addListener(handler); // Safari 구버전 대비
    return () => {
      if (mql.removeEventListener) mql.removeEventListener("change", handler);
      else mql.removeListener(handler);
    };
  }, []);

  // 데스크톱: 좌측 고정(항상 보임), 모바일: 오버레이(버거로 열고 닫기)
  return (
    <div style={is_desktop ? layout_grid_desktop : layout_grid_mobile}>
      {is_desktop ? (
        // 데스크톱: 고정(docked) 사이드바
        <Sidebar is_open={true} set_is_open={() => {}} mode="docked" />
      ) : (
        // 모바일: 상단 바 + 오버레이 사이드바
        <>
          <header style={topbar_style}>
            <button
              type="button"
              style={burger_btn_style}
              onClick={() => set_is_sidebar_open((v) => !v)}
              aria-label="toggle sidebar"
              title="메뉴 열기"
            >
              ☰
            </button>
            {/* ✅ 좌측 상단 로고 클릭 시 메인(/)으로 이동 */}
            <Link to="/" style={brand_link_style}>
              라멘 ERP
            </Link>
          </header>
          <Sidebar
            is_open={is_sidebar_open}
            set_is_open={set_is_sidebar_open}
            mode="overlay"
          />
        </>
      )}

      {/* 본문 */}
      <main style={main_style}>
        <Outlet />
      </main>
    </div>
  );
};

export default React.memo(Layout);

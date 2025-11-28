// src/components/Sidebar.tsx
import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import type { MenuGroup } from "@/menu/sidebar_data";
import { sidebar_menu } from "@/menu/sidebar_data";
import { useSidebarHeaderActions } from "../pages/MainPage/function/SideabarHeaderActionsFunction";

type SidebarMode = "overlay" | "docked";

type SidebarProps = {
  is_open: boolean;
  set_is_open: (v: boolean) => void;
  mode?: SidebarMode;
};

/* ====== light theme styles ====== */
const base_panel: React.CSSProperties = {
  height: "100vh",
  width: 290,
  background: "#ffffff",
  color: "#1f2937",
  boxShadow: "2px 0 16px rgba(0, 0, 0, 0.06)",
  borderRight: "1px solid #e5e7eb",
  overflowY: "auto",
  zIndex: 1001,
};

const overlay_panel_visible: React.CSSProperties = {
  ...base_panel,
  position: "fixed",
  top: 0,
  left: 0,
  transform: "translateX(0)",
  transition: "transform 220ms ease",
};

const overlay_panel_hidden: React.CSSProperties = {
  ...overlay_panel_visible,
  transform: "translateX(-100%)",
};

const docked_panel: React.CSSProperties = {
  ...base_panel,
  position: "sticky",
  top: 0,
  left: 0,
  boxShadow: "none",
};

const header_style: React.CSSProperties = {
  padding: "14px 16px",
  borderBottom: "1px solid #f1f5f9",
  fontWeight: 800,
  fontSize: 16,
  color: "#111827",
  position: "relative", // 아이콘 absolute 배치용
};

/** 헤더 오른쪽 아이콘들 래핑용 컨테이너 */
const header_actions_wrap_style: React.CSSProperties = {
  position: "absolute",
  right: 8,
  top: 8,
  display: "flex",
  gap: 6,
  alignItems: "center",
};

/** 집 / 전원 공통 버튼 스타일 */
const header_icon_btn_style: React.CSSProperties = {
  width: 30,
  height: 28,
  borderRadius: 999,
  border: "1px solid #e5e7eb",
  background: "#ffffff",
  color: "#374151",
  cursor: "pointer",
  fontSize: 14,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 0,
};

const close_btn_style: React.CSSProperties = {
  width: 30,
  height: 28,
  borderRadius: 999,
  border: "1px solid #e5e7eb",
  background: "#ffffff",
  color: "#374151",
  cursor: "pointer",
  fontSize: 16,
  lineHeight: 1,
};

const group_header_style: React.CSSProperties = {
  padding: "12px 16px",
  fontSize: 13,
  fontWeight: 700,
  letterSpacing: 0.2,
  color: "#4b5563",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  cursor: "pointer",
  userSelect: "none",
};

const children_wrap_base: React.CSSProperties = {
  padding: "6px 0 10px 0",
  overflow: "hidden",
  transition: "max-height 200ms ease",
};

/**
 * NOTE: padding을 shorthand로 쓰지 않는다.
 * paddingTop / paddingRight / paddingBottom / paddingLeft 를 명시적으로 쓴다.
 */
const link_style: React.CSSProperties = {
  display: "block",
  textDecoration: "none",
  fontSize: 14,
  color: "#374151",

  // padding: "9px 18px 9px 28px",
  paddingTop: 9,
  paddingRight: 18,
  paddingBottom: 9,
  paddingLeft: 28,
};

const link_active_style: React.CSSProperties = {
  ...link_style,
  background: "#eef2ff",
  color: "#1f2937",
  fontWeight: 700,
  borderLeft: "3px solid #2563eb",

  // override ONLY left padding
  paddingLeft: 25,
};

const divider_style: React.CSSProperties = {
  height: 1,
  background: "#f1f5f9",
  margin: "8px 0",
};

const backdrop_style = (is_open: boolean): React.CSSProperties => ({
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.15)",
  opacity: is_open ? 1 : 0,
  pointerEvents: is_open ? "auto" : "none",
  transition: "opacity 200ms ease",
  zIndex: 1000,
});

/* ====== 선으로만 그린 집 아이콘 ====== */
const IconHomeLine: React.FC<{ size?: number }> = ({ size = 14 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    aria-hidden="true"
    focusable="false"
  >
    <path
      d="M4 10.5L12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
/* ================================= */

const Sidebar: React.FC<SidebarProps> = ({
  is_open,
  set_is_open,
  mode = "overlay",
}) => {
  const { pathname } = useLocation();
  const [expanded_id, set_expanded_id] = React.useState<string>("items");

  // ✅ 헤더 액션 훅 (집 / 로그아웃)
  const { go_home, handle_logout } = useSidebarHeaderActions();

  // ✅ 메인 대쉬보드에서 햄버거로 연 "오버레이" 사이드바인지 여부
  const is_dashboard_overlay = mode === "overlay" && pathname === "/dashboard";

  const handle_toggle_group = (id: string) => {
    set_expanded_id((prev) => (prev === id ? "" : id));
  };

  const render_group = (group: MenuGroup) => {
    const is_expanded: boolean = expanded_id === group.id;

    return (
      <div key={group.id}>
        <div
          style={group_header_style}
          onClick={() => handle_toggle_group(group.id)}
          aria-expanded={is_expanded}
          aria-controls={`group-${group.id}`}
          role="button"
        >
          <span>{group.label}</span>
          <span style={{ opacity: 0.7 }}>{is_expanded ? "▾" : "▸"}</span>
        </div>

        <div
          id={`group-${group.id}`}
          style={{
            ...children_wrap_base,
            maxHeight: is_expanded ? 500 : 0,
          }}
        >
          {group.children.map((item) => {
            // 현재 경로와 메뉴 path 비교해서 active 여부 판단
            const is_active =
              pathname === item.path || pathname.startsWith(item.path + "/");

            return (
              <NavLink
                key={item.id}
                to={item.path}
                style={is_active ? link_active_style : link_style}
                onClick={() => {
                  if (mode === "overlay") set_is_open(false);
                }}
              >
                {item.label}
              </NavLink>
            );
          })}
        </div>

        <div style={divider_style} aria-hidden />
      </div>
    );
  };

  const panel =
    mode === "docked" ? (
      // ✅ 데스크톱: 항상 열려 있는 사이드바
      <nav style={docked_panel} aria-label="sidebar">
        <div style={header_style}>
          라멘 ERP
          <div style={header_actions_wrap_style}>
            {/* 집 아이콘 → 메인 대시보드 */}
            <button
              type="button"
              style={header_icon_btn_style}
              onClick={go_home}
              title="메인 대시보드"
            >
              <IconHomeLine size={14} />
            </button>
            {/* 전원 아이콘 → 로그아웃 */}
            <button
              type="button"
              style={header_icon_btn_style}
              onClick={handle_logout}
              title="로그아웃"
            >
              ⏻
            </button>
          </div>
        </div>
        <div>{sidebar_menu.map(render_group)}</div>
      </nav>
    ) : (
      // ✅ 모바일 / 메인 대쉬보드에서 쓰는 오버레이 사이드바
      <>
        <div onClick={() => set_is_open(false)} style={backdrop_style(is_open)} />
        <nav
          style={is_open ? overlay_panel_visible : overlay_panel_hidden}
          aria-label="sidebar"
        >
          <div style={header_style}>
            라멘 ERP
            <div style={header_actions_wrap_style}>
              {/* ✅ 대시보드 오버레이일 때는 집 아이콘 숨기기 */}
              {!is_dashboard_overlay && (
                <button
                  type="button"
                  style={header_icon_btn_style}
                  onClick={() => {
                    go_home();
                    set_is_open(false);
                  }}
                  title="메인 대시보드"
                >
                  <IconHomeLine size={14} />
                </button>
              )}

              <button
                type="button"
                style={header_icon_btn_style}
                onClick={() => {
                  handle_logout();
                  set_is_open(false);
                }}
                title="로그아웃"
              >
                ⏻
              </button>
              {/* 기존 닫기 버튼도 유지 */}
              <button
                type="button"
                onClick={() => set_is_open(false)}
                style={close_btn_style}
                aria-label="close sidebar"
                title="메뉴 닫기"
              >
                ×
              </button>
            </div>
          </div>
          <div>{sidebar_menu.map(render_group)}</div>
        </nav>
      </>
    );

  return panel;
};

export default React.memo(Sidebar);

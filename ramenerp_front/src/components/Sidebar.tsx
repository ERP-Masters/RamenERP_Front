// src/components/Sidebar.tsx
import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import type { MenuGroup } from "@/menu/sidebar_data";
import { sidebar_menu } from "@/menu/sidebar_data";

type SidebarMode = "overlay" | "docked";

type SidebarProps = {
  is_open: boolean;                 // overlay 모드에서만 의미 있음
  set_is_open: (v: boolean) => void;
  mode?: SidebarMode;               // "overlay" | "docked"
};

/* ====== light theme styles ====== */
const base_panel: React.CSSProperties = {
  height: "100vh",
  width: 290,
  background: "#ffffff",
  color: "#1f2937",
  boxShadow: "2px 0 16px rgba(0,0,0,0.06)",
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
};

const close_btn_style: React.CSSProperties = {
  position: "absolute",
  right: 8,
  top: 8,
  fontSize: 18,
  lineHeight: "18px",
  width: 32,
  height: 32,
  borderRadius: 6,
  border: "1px solid #e5e7eb",
  background: "#ffffff",
  color: "#374151",
  cursor: "pointer",
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

const link_style: React.CSSProperties = {
  display: "block",
  padding: "9px 18px 9px 28px",
  fontSize: 14,
  color: "#374151",
  textDecoration: "none",
};

const link_active_style: React.CSSProperties = {
  ...link_style,
  background: "#eef2ff",
  color: "#1f2937",
  fontWeight: 700,
  borderLeft: "3px solid #2563eb",
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
/* ================================= */

const Sidebar: React.FC<SidebarProps> = ({ is_open, set_is_open, mode = "overlay" }) => {
  const { pathname } = useLocation();
  const [expanded_id, set_expanded_id] = React.useState<string>("items");

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
            const is_active = pathname === item.path;
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
      <nav style={docked_panel} aria-label="sidebar">
        <div style={header_style}>라멘 ERP</div>
        <div>{sidebar_menu.map(render_group)}</div>
      </nav>
    ) : (
      <>
        <div onClick={() => set_is_open(false)} style={backdrop_style(is_open)} />
        <nav
          style={is_open ? overlay_panel_visible : overlay_panel_hidden}
          aria-label="sidebar"
        >
          <div style={header_style}>라멘 ERP</div>
          <button
            type="button"
            onClick={() => set_is_open(false)}
            style={close_btn_style}
            aria-label="close sidebar"
          >
            ×
          </button>
          <div>{sidebar_menu.map(render_group)}</div>
        </nav>
      </>
    );

  return panel;
};

export default React.memo(Sidebar);

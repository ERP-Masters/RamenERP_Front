// src/components/Layout.tsx
import React from "react";
import { Outlet, NavLink } from "react-router-dom";

// 규칙: 변수/상수는 snake_case
const header_style = { padding: "10px", borderBottom: "1px solid #ccc" };
const main_style = { padding: "20px" };
const link_style = { marginRight: "10px", textDecoration: "none" } as const;
const active_style = { fontWeight: 700 } as const;

const Layout: React.FC = React.memo(() => {
  return (
    <div>
      <header style={header_style} role="navigation" aria-label="Global">
        <NavLink
          to="/"
          style={({ isActive }) => (isActive ? { ...link_style, ...active_style } : link_style)}
          end
        >
          홈
        </NavLink>
        <NavLink
          to="/product"
          style={({ isActive }) => (isActive ? active_style : undefined)}
        >
          품목관리
        </NavLink>
        {/* <NavLink to="/order">발주관리</NavLink> 추후 추가 */}
      </header>

      <main style={main_style}>
        <Outlet />
      </main>
    </div>
  );
});

export default Layout;

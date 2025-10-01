// src/components/Layout.tsx
import React from "react";
import { Outlet, Link } from "react-router-dom";

const header_style: React.CSSProperties = {
  padding: "10px",
  borderBottom: "1px solid #ccc",
};

const link_style: React.CSSProperties = {
  marginRight: "10px",
};

const main_style: React.CSSProperties = {
  padding: "20px",
};

const Layout: React.FC = React.memo(() => {
  return (
    <div>
      <header style={header_style}>
        <Link to="/" style={link_style}>홈</Link>
        <Link to="/product" style={link_style}>품목관리</Link>
        <Link to="/vendor" style={link_style}>거래처 관리</Link>
        <Link to="/unit/register" style={link_style}>단위 등록</Link>
        <Link to="/category/register" style={link_style}>카테고리 등록</Link>
        {/* <Link to="/order">발주관리</Link> 나중에 추가 */}
      </header>

      <main style={main_style}>
        <Outlet />
      </main>
    </div>
  );
});

export default Layout;

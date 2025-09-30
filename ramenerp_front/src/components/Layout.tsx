// src/components/Layout.tsx
import React from "react";
import { Outlet, Link } from "react-router-dom";

const Layout: React.FC = () => {
  return (
    <div>
      <header style={{ padding: "10px", borderBottom: "1px solid #ccc" }}>
        <Link to="/" style={{ marginRight: "10px" }}>홈</Link>
        <Link to="/product">품목관리</Link>
        {/* <Link to="/order">발주관리</Link> 나중에 추가 */}
      </header>

      <main style={{ padding: "20px" }}>
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;

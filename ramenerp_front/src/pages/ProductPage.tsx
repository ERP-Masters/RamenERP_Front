// src/pages/ProductPage.tsx
import React from "react";
import ItemListPage from "./ItemListPage";

const page_wrap_style = { padding: 16, maxWidth: 1200, margin: "0 auto" } as const;
const title_style = { fontSize: 22, fontWeight: 800, marginBottom: 8 } as const;

const ProductPage: React.FC = () => {
  return (
    <div>
      <div style={page_wrap_style}>
        <h1 style={title_style}>품목 관리</h1>
      </div>
      {/* 리스트는 바로 표시 + 내부 제목은 숨김 */}
      <ItemListPage hide_title />
    </div>
  );
};

export default ProductPage;

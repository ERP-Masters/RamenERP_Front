// src/pages/ItemListPage.tsx
import React, { useEffect, useState } from "react";
import { ProductData } from "./ItemRegisterForm";

const ItemListPage: React.FC = () => {
  const [products, setProducts] = useState<(ProductData & { id: number; vendor_name?: string; category_name?: string })[]>([]);

  useEffect(() => {
    // 예시 더미 데이터
    setProducts([
      {
        id: 1,
        category_id: "C001",
        category_name: "육류",
        name: "소고기",
        unit: "Kg",
        unit_price: "25000",
        expiry_date: "2025-10-30",
        vendor_id: "V001",
        vendor_name: "CJ 제일제당",
      },
    ]);
  }, []);

  return (
    <div>
      <h1>품목 조회 페이지</h1>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>품목ID</th>
            <th>카테고리ID</th>
            <th>품목명</th>
            <th>단위</th>
            <th>단가</th>
            <th>유통기한</th>
            <th>거래처명</th>
          </tr>
        </thead>
        <tbody>
          {products.map(p => (
            <tr key={p.id}>
              <td>{p.id}</td>
              <td>{p.category_id}</td>
              <td>{p.name}</td>
              <td>{p.unit}</td>
              <td>{p.unit_price}</td>
              <td>{p.expiry_date}</td>
              <td>{p.vendor_name}</td>
            </tr>
          ))}
          {products.length === 0 && (
            <tr>
              <td colSpan={7} style={{ textAlign: "center" }}>등록된 품목이 없습니다.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ItemListPage;

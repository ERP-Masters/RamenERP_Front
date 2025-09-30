// src/pages/ProductPage.tsx
import React from "react";
import { useNavigate } from "react-router-dom";

const ProductPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div>
      <h1>품목 관리</h1>
      <button onClick={() => navigate("/product/register")} style={{ marginRight: "10px" }}>
        품목 등록
      </button>
      <button onClick={() => navigate("/product/list")}>
        품목 조회
      </button>
    </div>
  );
};

export default ProductPage;

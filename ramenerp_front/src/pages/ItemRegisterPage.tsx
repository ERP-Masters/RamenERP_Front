// src/pages/ItemRegisterPage.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import ItemRegisterForm from "./ItemRegisterForm";

const ItemRegisterPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div>
      <h1>품목 등록 페이지</h1>

      {/* 폼 내부에서 옵션 API 로딩 + POST /api/items 수행 */}
      <ItemRegisterForm />

      <button
        type="button"
        onClick={() => navigate("/product/list")}
        style={{ marginTop: 12 }}
      >
        목록으로
      </button>
    </div>
  );
};

export default ItemRegisterPage;

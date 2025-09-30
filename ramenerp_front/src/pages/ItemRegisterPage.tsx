// src/pages/ItemRegisterPage.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import ItemRegisterForm, { ProductData } from "./ItemRegisterForm";

const ItemRegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<ProductData[]>([]);

  const handleSubmit = (data: ProductData) => {
    setProducts([...products, data]);
    alert("품목 등록이 완료되었습니다.");
    navigate("/product/list");
  };

  return (
    <div>
      <h1>품목 등록 페이지</h1>
      <ItemRegisterForm onSubmit={handleSubmit} />
    </div>
  );
};

export default ItemRegisterPage;

// src/pages/ProductPage.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const button_style = { marginRight: "10px" } as const;

const ProductPage: React.FC = () => {
  const navigate = useNavigate();
  const [is_navigating, set_is_navigating] = useState<boolean>(false);

  const go_register = () => {
    if (is_navigating) return;
    set_is_navigating(true);
    navigate("/product/register");
  };

  const go_list = () => {
    if (is_navigating) return;
    set_is_navigating(true);
    navigate("/product/list");
  };

  return (
    <div>
      <h1>품목 관리</h1>
      <button onClick={go_register} style={button_style} disabled={is_navigating}>
        품목 등록
      </button>
      <button onClick={go_list} disabled={is_navigating}>
        품목 조회
      </button>
    </div>
  );
};

export default ProductPage;

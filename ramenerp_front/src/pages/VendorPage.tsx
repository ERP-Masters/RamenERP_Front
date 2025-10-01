// src/pages/VendorPage.tsx
import React from "react";
import { useNavigate } from "react-router-dom";

const VendorPage: React.FC = () => {
  const navigate_fn = useNavigate();

  return (
    <div>
      <h1>거래처 관리</h1>
      <button
        onClick={() => navigate_fn("/vendor/register")}
        style={{ marginRight: "10px" }}
      >
        거래처 등록
      </button>
      <button onClick={() => navigate_fn("/vendor")}>
        거래처 관리
      </button>
    </div>
  );
};

export default VendorPage;

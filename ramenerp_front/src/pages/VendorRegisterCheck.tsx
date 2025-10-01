// src/pages/VendorRegisterCheck.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import VendorRegisterForm, { VendorData } from "./VendorRegisterForm";

const VendorRegisterCheck: React.FC = () => {
  const navigate_fn = useNavigate();
  const [vendors, set_vendors] = useState<VendorData[]>([]);

  const handle_submit = (data: VendorData) => {
    set_vendors(prev => [...prev, data]);
    alert("거래처 등록이 완료되었습니다.");
    navigate_fn("/vendor"); // 소문자 경로 유지
  };

  return (
    <div>
      <h1>거래처 등록 페이지</h1>
      <VendorRegisterForm onSubmit={handle_submit} />
    </div>
  );
};

export default VendorRegisterCheck;

// src/pages/ShipmentListPage.tsx
import React from "react";
import BranchOrderListPage from "./BranchOrderListPage";

const ShipmentListPage: React.FC = () => {
  return (
    <BranchOrderListPage
      title="출고 내역 조회"
      initialStatus="COMPLETED"
      fixedStatus="COMPLETED"
      hideCompleted={false}
      showShipButton={false}  // 출고 내역 화면에서는 배송 버튼 숨김
    />
  );
};

export default ShipmentListPage;

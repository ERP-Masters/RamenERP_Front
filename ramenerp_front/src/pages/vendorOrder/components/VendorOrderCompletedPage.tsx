// src/pages/VendorOrderCompletedPage.tsx
import React from "react";
import VendorOrderListPage from "./VendorOrderListPage";

const VendorOrderCompletedPage: React.FC = () => {
  return (
    <VendorOrderListPage
      title="입고 내역 조회"
      initialStatus="COMPLETED"
      fixedStatus="COMPLETED"
      showCompleteButton={false}
      hideCompleted={false}
    />
  );
};

export default VendorOrderCompletedPage;

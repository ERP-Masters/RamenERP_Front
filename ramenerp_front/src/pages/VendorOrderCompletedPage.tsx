// src/pages/VendorOrderCompletedPage.tsx
import React from "react";
import VendorOrderListPage from "./VendorOrderListPage";

/**
 * 상태가 COMPLETED 인 발주만 보는 "입고 내역" 페이지
 * - 기존 리스트 디자인 그대로 재사용
 * - 상태 필터는 COMPLETED로 고정, 수정 불가
 * - 입고 완료 버튼은 숨김
 */
const VendorOrderListPageAny = VendorOrderListPage as any;

const VendorOrderCompletedPage: React.FC = () => {
  return (
    <VendorOrderListPageAny
      title="입고 내역 조회"
      initialStatus="COMPLETED"
      fixedStatus="COMPLETED"
      showCompleteButton={false}
    />
  );
};

export default VendorOrderCompletedPage;

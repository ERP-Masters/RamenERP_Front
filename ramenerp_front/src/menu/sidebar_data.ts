// src/menu/sidebar_data.ts
import type React from "react";

export type MenuChild = {
  id: string;
  label: string;
  path: string;
  icon?: React.ReactNode;
  required_permissions?: string[];
};

export type MenuGroup = {
  id: string;
  label: string;
  icon?: React.ReactNode;
  children: MenuChild[];
  required_permissions?: string[];
};

export const sidebar_menu: MenuGroup[] = [
  {
    id: "items",
    label: "품목관리",
    children: [
      {
        id: "items-list",
        label: "품목 리스트",
        path: "/product/list",
      },
      {
        id: "units",
        label: "단위 관리",
        path: "/unit/list",
      },
      {
        id: "categories",
        label: "카테고리 관리",
        path: "/category/list",
      },
    ],
  },

  {
    id: "vendors",
    label: "거래처/발주",
    children: [
      {
        id: "vendors-list",
        label: "거래처 리스트",
        path: "/vendor/list",
      },

      // ✅ 발주 내역 조회 페이지 (목록)
      {
        id: "vendors-orders",
        label: "발주 내역 조회",
        path: "/vendor-order",
      },

      // ✅ (선택사항) 신규 발주 등록 페이지 (풀스크린 작성 화면)
      {
        id: "vendors-orders-new",
        label: "신규 발주 등록",
        path: "/vendor-order/new",
      },
      { id: "vendors-inbound",
        label: "입고 내역",  
        path: "/vendor-order/completed",
     },
    ],
  },

  {
    id: "warehouses",
    label: "창고/재고",
    children: [
      {
        id: "warehouse-reg",
        label: "창고 리스트",
        path: "/warehouse/list",
      },
       {
        id: "inventory-list",
        label: "재고 관리",
        path: "/inventory/list",
      },
      {
        id: "sales-order-management",
        label: "수주 관리",
        path: "/",
      },
    ],
  },

  {
    id: "branches",
    label: "직영점 관리",
    children: [
      {
        id: "branches",
        label: "지점 리스트",
        path: "/branch/list",
      },
      {
        id: "sales",
        label: "매출 관리",
        path: "/",
      },
    ],
  },

  // 미사용 목록 관리
  {
    id: "notused",
    label: "미사용 목록 관리",
    children: [
      {
        id: "items-notused",
        label: "미사용 품목 리스트",
        path: "/items/notused",
      },
      {
        id: "warehouse-notused",
        label: "미사용 창고 리스트",
        // TODO: 실제 '미사용 창고' 라우트가 따로 생기면 그걸로 바꿔
        path: "/warehouse/state",
      },
      {
        id: "branch-notused",
        label: "미사용 지점 리스트",
        path: "/branch/state",
      },
      {
        id: "vendor-notused",
        label: "미사용 거래처 리스트",
        path: "/vendor/state",
      },
      {
        id: "unit-notused",
        label: "미사용 단위 리스트",
        path: "/unit/state",
      },
      {
        id: "category-notused",
        label: "미사용 카테고리 리스트",
        path: "/category/state",
      },
    ],
  },
];

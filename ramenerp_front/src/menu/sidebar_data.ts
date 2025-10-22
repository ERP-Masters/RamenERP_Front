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
      { id: "items-list", label: "품목 리스트", path: "/product/list" },
      { id: "units", label: "단위 관리", path: "/unit/list" },
      { id: "categories", label: "카테고리 관리", path: "/category/list" },
    ],
  },
  {
    id: "vendors",
    label: "거래처/발주",
    children: [
      { id: "vendors-list", label: "거래처 리스트", path: "/vendor/list" },
      { id: "vendors-orders", label: "발주 관리", path: "/vendor/orders" },
    ],
  },
  {
    id: "warehouses",
    label: "창고/재고",
    children: [
      { id: "warehouse-reg", label: "창고 리스트", path: "/warehouse/list" },
    ],
  },
  {
    id: "branches",
    label: "직영점 관리",
    children: [
      { id: "branches", label: "지점 리스트", path: "/branch/list" },
    ],
  },
  // ✅ 여기: 미사용 목록 관리
  {
    id: "notused",
    label: "미사용 목록 관리",
    children: [
      { id: "items-notused",    label: "미사용 품목 리스트", path: "/items/notused" },
      { id: "warehouse-notused", label: "미사용 창고 리스트", path: "/branch/list" },   // TODO: 실제 경로로 바꿔도 됨
      { id: "branch-notused",   label: "미사용 지점 리스트", path: "/branch/state" },  // TODO
      { id: "vendor-notused",   label: "미사용 거래처 리스트", path: "/vendor/list" },  // TODO
      { id: "unit-notused",     label: "미사용 단위 리스트", path: "/unit/list" },     // TODO
      { id: "category-notused", label: "미사용 카테고리 리스트", path: "/category/list" }, // TODO
      // 핵심
    ],
  },
];

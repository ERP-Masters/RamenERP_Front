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
      // 필요 시: { id: "items-exp", label: "만료임박(7일)", path: "/items/expiring/7" },
    ],
  },
  // src/menu/sidebar_data.ts
{
  id: "vendors",
  label: "거래처관리",
  children: [
    { id: "vendors-list",   label: "거래처 리스트", path: "/vendor/list" },
    { id: "vendors-orders", label: "발주 내역",     path: "/vendor-orders" },
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
    ],   // 자식이 없으므로 클릭할 대상이 없어 동작하지 않음
  }
];

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
      { id: "units", label: "단위 관리", path: "/unit/register" },
      { id: "categories", label: "카테고리 관리", path: "/category/register" },
      // 필요 시: { id: "items-exp", label: "만료임박(7일)", path: "/items/expiring/7" },
    ],
  },
  {
    id: "vendors",
    label: "거래처관리",
    children: [
      { id: "vendors-list", label: "거래처 리스트", path: "/vendor/list" },
      // 필요 시: { id: "vendors-inactive", label: "미사용 거래처", path: "/vendors/inactive" },
    ],
  },
  {
    id: "warehouses",
    label: "창고/재고",
    children: [
      { id: "warehouse-reg", label: "창고 등록", path: "/warehouse/register" },
    ],
  },
];

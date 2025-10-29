// src/App.tsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";

import ProductPage from "./pages/ProductPage";
import ItemListPage from "./pages/ItemListPage";
import ItemNotUsedListPage from "./pages/ItemNotUsedListPage";

import VendorRegisterPage from "./pages/VendorRegisterPage";
import VendorListPage from "./pages/VendorListPage";
import NotUsedVendorPageUi from "./pages/NotUsedVendorPageUi";

import VendorOrderListPage from "./pages/VendorOrderListPage";
import VendorOrderNewPage from "./pages/VendorOrderNewPage";

import CategoryRegisterPage from "./pages/CategoryRegisterPage";
import CategoryListPanel from "./components/CategoryListPanel";

import UnitRegisterPage from "./pages/UnitRegisterPage";
import UnitListPanel from "./components/UnitListPanel";

import WarehouseRegister from "./pages/WarehouseRegister";
import WarehouseListPanel from "./components/WarehouseListPanel";

import BranchRegisterPage from "./pages/BranchRegisterPage";
import BranchListPage from "./pages/BranchListPage";
import NotUsedBranchUi from "./components/NotUsedBranchPageUi";

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        {/* index를 product로 보내고 싶으면 이거 활성화해도 됨 */}
        {/* <Route index element={<Navigate to="product" replace />} /> */}

        {/* 품목/재고 */}
        <Route path="product" element={<ProductPage />} />
        <Route path="product/list" element={<ItemListPage />} />
        <Route path="items/notused" element={<ItemNotUsedListPage />} />

        {/* 거래처 */}
        <Route path="vendor/register" element={<VendorRegisterPage />} />
        <Route path="vendor/list" element={<VendorListPage />} />
        <Route path="vendor/state" element={<NotUsedVendorPageUi />} />

        {/* ✅ 발주 */}
        <Route path="vendor-order" element={<VendorOrderListPage />} />
        <Route path="vendor-order/new" element={<VendorOrderNewPage />} />

        {/* 카테고리 */}
        <Route path="category/register" element={<CategoryRegisterPage />} />
        <Route path="category/list" element={<CategoryListPanel />} />

        {/* 단위 */}
        <Route path="unit/register" element={<UnitRegisterPage />} />
        <Route path="unit/list" element={<UnitListPanel />} />

        {/* 창고 */}
        <Route path="warehouse/register" element={<WarehouseRegister />} />
        <Route path="warehouse/list" element={<WarehouseListPanel />} />

        {/* 지점 */}
        <Route path="branch/register" element={<BranchRegisterPage />} />
        <Route path="branch/list" element={<BranchListPage />} />
        <Route path="branch/state" element={<NotUsedBranchUi />} />

        {/* fallback */}
        <Route path="*" element={<Navigate to="product" replace />} />
      </Route>
    </Routes>
  );
};

export default App;

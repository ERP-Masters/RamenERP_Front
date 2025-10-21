// src/App.tsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";

// 페이지들
import ProductPage from "./pages/ProductPage";
import ItemListPage from "./pages/ItemListPage";
// ✅ 유틸을 써야 할 때만 (경로: utils)
import VendorRegisterPage from "./pages/VendorRegisterPage";
import CategoryRegisterPage from "./pages/CategoryRegisterPage";
import CategoryListPanel from "./components/CategoryListPanel";
import UnitRegisterPage from "./pages/UnitRegisterPage";
import UnitListPanel from "./components/UnitListPanel";
import VendorListPage from "./pages/VendorListPage";
import VendorOrderListPage from "@/pages/VendorOrderListPage";
import WarehouseRegister from "./pages/WarehouseRegister";
import WarehouseListPanel from "./components/WarehouseListPanel";
import BranchListPage from "./pages/BranchListPage";
import BranchRegisterPage from "./pages/BranchRegisterPage";

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        {/* 메인 진입 시 특정 페이지로 보내고 싶으면 아래 주석 해제
        <Route index element={<Navigate to="/product" replace />} />
        */}
        <Route path="product" element={<ProductPage />} />
        {/* 기존 ItemRegisterPage 제거: 안전하게 리다이렉트 */}
        <Route path="product/register" element={<Navigate to="/product" replace />} />
        <Route path="product/list" element={<ItemListPage />} />

        {/* 등록/체크 페이지 라우트 */}
        <Route path="vendor/register" element={<VendorRegisterPage />} />
        <Route path="vendor/list" element={<VendorListPage />} />
        <Route path="/vendor-orders" element={<VendorOrderListPage />} />


        <Route path="category/register" element={<CategoryRegisterPage />} />
        <Route path="category/list" element={<CategoryListPanel />} />

        <Route path="unit/register" element={<UnitRegisterPage />} />
        <Route path="unit/list/" element={<UnitListPanel />} />

        <Route path="warehouse/register" element={<WarehouseRegister />} />
        <Route path="warehouse/list" element={<WarehouseListPanel />} />

        <Route path="branch/register" element={<BranchRegisterPage />} />
        <Route path="branch/list" element={<BranchListPage />} />


        {/* 404 → /product (선택) */}
        <Route path="*" element={<Navigate to="/product" replace />} />
      </Route>
    </Routes>
  );
};

export default App;

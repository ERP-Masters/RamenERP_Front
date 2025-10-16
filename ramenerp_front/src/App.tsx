// src/App.tsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import ProductPage from "./pages/ProductPage";
import ItemListPage from "./pages/ItemListPage";
import VendorRegisterCheck from "./pages/VendorRegisterCheck";
import CategoryRegisterPage from "./pages/CategoryRegisterPage";
import CategoryRegisterCheck from "./pages/CategoryRegisterCheck";
import UnitRegisterPage from "./pages/UnitRegisterPage";
import UnitRegisterCheck from "./pages/UnitRegisterCheck";
import VendorListPage from "./pages/VendorListPage";
import WareHouseRegister from "./pages/WarehouseRegister";

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        {/* 메인 진입 시 품목 관리로 바로 가고 싶으면 아래 주석 해제
        <Route index element={<Navigate to="/product" replace />} />
        */}
        <Route path="product" element={<ProductPage />} />
        {/* ⛔️ 삭제된 파일 참조 제거: ItemRegisterPage 라우트 제거
            대신 안전하게 /product 로 리다이렉트 */}
        <Route path="product/register" element={<Navigate to="/product" replace />} />
        <Route path="product/list" element={<ItemListPage />} />

        {/* 폼 직접 렌더링 금지, 페이지(체크) 컴포넌트로 연결 */}
        <Route path="vendor/register" element={<VendorRegisterCheck />} />
        <Route path="category/register" element={<CategoryRegisterPage />} />
        <Route path="category/register/check" element={<CategoryRegisterCheck />} />
        <Route path="unit/register" element={<UnitRegisterPage />} />
        <Route path="unit/register/check" element={<UnitRegisterCheck />} />
        <Route path="vendor/list" element={<VendorListPage />} />
        <Route path="warehouse/register" element={<WareHouseRegister />} />
      </Route>
    </Routes>
  );
};

export default App;

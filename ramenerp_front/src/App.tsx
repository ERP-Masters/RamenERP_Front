// src/App.tsx
import React from "react";
import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import ProductPage from "./pages/ProductPage";
import ItemRegisterPage from "./pages/ItemRegisterPage";
import ItemListPage from "./pages/ItemListPage";
import VendorPage from "./pages/VendorPage";
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
        {/* <Route index element={<HomePage />} /> */}
        <Route path="product" element={<ProductPage />} />
        <Route path="product/register" element={<ItemRegisterPage />} />
        <Route path="product/list" element={<ItemListPage />} />
        <Route path="vendor" element={<VendorPage />} />
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
}

export default App;

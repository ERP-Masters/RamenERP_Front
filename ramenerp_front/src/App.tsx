// src/App.tsx
import React from "react";
import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import ProductPage from "./pages/ProductPage";
import ItemRegisterPage from "./pages/ItemRegisterPage";
import ItemListPage from "./pages/ItemListPage";
import VendorPage from "./pages/VendorPage";
import VendorRegisterCheck from "./pages/VendorRegisterCheck";

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
      </Route>
    </Routes>
  );
};

export default App;

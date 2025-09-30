// src/App.tsx
import React from "react";
import {Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
//import HomePage from "./pages/HomePage";
import ProductPage from "./pages/ProductPage";
import ItemRegisterPage from "./pages/ItemRegisterPage";
import ItemListPage from "./pages/ItemListPage";

const App: React.FC = () =>  {
  return (
      <Routes>
        <Route path="/" element={<Layout />}>
          {/*<Route index element={<HomePage />} />*/}
          <Route path="product" element={<ProductPage />} />
          <Route path="product/register" element={<ItemRegisterPage />} />
          <Route path="product/list" element={<ItemListPage />} />
        </Route>
      </Routes>
  );
};

export default App;

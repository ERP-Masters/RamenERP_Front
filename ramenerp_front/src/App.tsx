// src/App.tsx
import React, { Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";

// 규칙: 변수는 snake_case
const product_page = React.lazy(() => import("./pages/ProductPage"));
const item_register_page = React.lazy(() => import("./pages/ItemRegisterPage"));
const item_list_page = React.lazy(() => import("./pages/ItemListPage"));

const route_paths = {
  product: "/product",
  product_register: "/product/register",
  product_list: "/product/list",
} as const;

// 규칙: 컴포넌트는 PascalCase
export default function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route path={route_paths.product} element={React.createElement(product_page)} />
          <Route path={route_paths.product_register} element={React.createElement(item_register_page)} />
          <Route path={route_paths.product_list} element={React.createElement(item_list_page)} />
        </Route>
      </Routes>
    </Suspense>
  );
}

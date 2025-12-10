// src/App.tsx

import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import Layout from "./pages/layout/Layout";

import ProductPage from "./pages/Item/components/ProductPage";
import ItemListPage from "./pages/Item/components/ItemListPage";
import ItemNotUsedListPage from "./pages/NotUsed/components/ItemNotUsedListPage";

import VendorRegisterPage from "./pages/vendor/components/VendorRegisterPage";
import VendorListPage from "./pages/vendor/components/VendorListPage";
import NotUsedVendorPageUi from "./pages/NotUsed/components/NotUsedVendorPageUi";

import VendorOrderListPage from "./pages/vendorOrder/components/VendorOrderListPage";
import VendorOrderNewPage from "./pages/vendorOrder/components/VendorOrderNewPage";
import VendorOrderCompletedPage from "./pages/vendorOrder/components/VendorOrderCompletedPage";

import CategoryRegisterPage from "./pages/category/components/CategoryRegisterPage";
import CategoryListPanel from "./pages/category/components/CategoryListPanel";
import NotUsedCategoryPageUi from "./pages/NotUsed/components/NotUsedCategoryPageUi";

import UnitRegisterPage from "./pages/unit/components/UnitRegisterPage";
import UnitListPanel from "./pages/unit/components/UnitListPanel";
import NotUsedUnitPageUi from "./pages/NotUsed/components/NotUsedUnitPageUi";

import WarehouseRegister from "./pages/warehouse/components/WarehouseRegister";
import WarehouseListPanel from "./pages/warehouse/components/WarehouseListPanel";
import NotUsedWarehousePageUi from "./pages/NotUsed/components/NotUsedWarehousePageUi";

import BranchRegisterPage from "./pages/branch/function/BranchRegisterPage";
import BranchListPage from "./pages/branch/components/BranchListPage";
import NotUsedBranchUi from "./pages/NotUsed/components/NotUsedBranchPageUi";

import InventoryListUi from "./pages/Inventory/components/InventoryListUi";

import BranchOrderListPage from "./pages/branchOrder/components/BranchOrderListPage";
import BranchOrderNewPage from "./pages/branchOrder/components/BranchOrderNewPage";

import LoginPageUi from "./pages/login/components/LoginPageUi";
import MainDashboardPageUi from "./pages/MainPage/components/MainDashBoardPageUi";
import LotHistoryListPage from "./pages/Lot/components/LotHistoryListPage";
import ShipmentListPage from "./pages/shipment/components/ShipmentListPage";
import NoticePageUi from "./pages/Notice/components/NoticePageUi";
import NoticeRegisterPageUi from "./pages/Notice/components/NoticeRegisterPageUi"; // ✅ 추가
import SalesDashboardPage from "./pages/sales/components/SalesDashboardPage";

import RequireAuth from "@/auth/RequireAuth";
import { is_logged_in } from "@/auth/auth_session";

/** ✅ 루트 진입 시 분기 */
const RootRedirect: React.FC = () => {
  const is_ok = is_logged_in();
  return <Navigate to={is_ok ? "/dashboard" : "/login"} replace />;
};

const App: React.FC = () => {
  return (
    <Routes>
      {/* 1) 로그인 화면: 레이아웃 없이 단독 */}
      <Route path="/login" element={<LoginPageUi />} />

      {/* 2) 메인 대시보드: 로그인 보호 */}
      <Route path="/dashboard" element={<RequireAuth> <MainDashboardPageUi /> </RequireAuth>} />

      {/* 3) 나머지는 Layout 아래에서 동작 + 전부 로그인 보호 */}
      <Route
        path="/"
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        {/* ✅ 프로그램 처음 들어올 때(/)는 로그인 상태에 따라 분기 */}
        <Route index element={<RootRedirect />} />

        {/* 품목/재고 */}
        <Route path="product" element={<ProductPage />} />
        <Route path="product/list" element={<ItemListPage />} />
        <Route path="items/notused" element={<ItemNotUsedListPage />} />

        {/* 거래처 */}
        <Route path="vendor/register" element={<VendorRegisterPage />} />
        <Route path="vendor/list" element={<VendorListPage />} />
        <Route path="vendor/state" element={<NotUsedVendorPageUi />} />

        {/* 발주 */}
        <Route path="vendor-order" element={<VendorOrderListPage />} />
        <Route path="vendor-order/new" element={<VendorOrderNewPage />} />
        <Route
          path="vendor-order/completed"
          element={<VendorOrderCompletedPage />}
        />
        <Route path="lot/list" element={<LotHistoryListPage />} />

        {/* 수주 */}
        <Route path="branch-order" element={<BranchOrderListPage />} />
        <Route path="branch-order/new" element={<BranchOrderNewPage />} />
        <Route path="branch-order/completed" element={<ShipmentListPage />} />

        {/* 매출 */}
        <Route path="sales" element={<SalesDashboardPage />} />

        {/* 카테고리 */}
        <Route path="category/register" element={<CategoryRegisterPage />} />
        <Route path="category/list" element={<CategoryListPanel />} />
        <Route path="category/state" element={<NotUsedCategoryPageUi />} />

        {/* 단위 */}
        <Route path="unit/register" element={<UnitRegisterPage />} />
        <Route path="unit/list" element={<UnitListPanel />} />
        <Route path="unit/state" element={<NotUsedUnitPageUi />} />

        {/* 창고 */}
        <Route path="warehouse/register" element={<WarehouseRegister />} />
        <Route path="warehouse/list" element={<WarehouseListPanel />} />
        <Route path="warehouse/state" element={<NotUsedWarehousePageUi />} />
        <Route path="inventory/list" element={<InventoryListUi />} />

        {/* 지점 */}
        <Route path="branch/register" element={<BranchRegisterPage />} />
        <Route path="branch/list" element={<BranchListPage />} />
        <Route path="branch/state" element={<NotUsedBranchUi />} />

        {/* fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>

      {/* 최상위 fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;

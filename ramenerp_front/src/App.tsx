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
import UnitRegisterPage from "./pages/unit/components/UnitRegisterPage";
import UnitListPanel from "./pages/unit/components/UnitListPanel";
import WarehouseRegister from "./pages/warehouse/components/WarehouseRegister";
import WarehouseListPanel from "./pages/warehouse/components/WarehouseListPanel";
import BranchRegisterPage from "./pages/branch/function/BranchRegisterPage";
import BranchListPage from "./pages/branch/components/BranchListPage";
import NotUsedBranchUi from "./pages/NotUsed/components/NotUsedBranchPageUi";
import NotUsedWarehousePageUi from "./pages/NotUsed/components/NotUsedWarehousePageUi";
import NotUsedUnitPageUi from "./pages/NotUsed/components/NotUsedUnitPageUi";
import NotUsedCategoryPageUi from "./pages/NotUsed/components/NotUsedCategoryPageUi";
import InventoryListUi from "./pages/Inventory/components/InventoryListUi";
import BranchOrderListPage from "./pages/branchOrder/components/BranchOrderListPage";
import BranchOrderNewPage from "./pages/branchOrder/components/BranchOrderNewPage";
import LoginPageUi from "./pages/login/components/LoginPageUi";
import MainDashboardPageUi from "./pages/MainPage/components/MainDashBoardPageUi";
import LotHistoryListPage from "./pages/Lot/components/LotHistoryListPage";
import ShipmentListPage from "./pages/shipment/components/ShipmentListPage";
import SalesDashboardPage from "./pages/SalesDashboardPage";

const App: React.FC = () => {
  return (
    <Routes>
      {/* 1) 로그인 화면: 레이아웃 없이 단독 */}
      <Route path="/login" element={<LoginPageUi />} />

      {/* 2) 메인 대시보드: 레이아웃 없이 전체 화면 + 오버레이 사이드바 */}
      <Route path="/dashboard" element={<MainDashboardPageUi />} />

      {/* 3) 나머지는 예전처럼 Layout 아래에서 동작 */}
      <Route path="/" element={<Layout />}>
        {/* ✅ 프로그램 처음 들어올 때(/)는 무조건 로그인으로 보냄 */}
        <Route index element={<Navigate to="/login" replace />} />

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
        <Route path="vendor-order/completed" element={<VendorOrderCompletedPage />} />
        <Route path="lot/list" element={<LotHistoryListPage />} />

        {/* 수주 */}
        <Route path="branch-order" element={<BranchOrderListPage />} />
        <Route path="branch-order/new" element={<BranchOrderNewPage />} />
        <Route path="branch-order/completed" element={<ShipmentListPage />} />

        {/* 매출 */}
        <Route path="/sales" element={<SalesDashboardPage/>} />


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

        {/* fallback (예전 그대로) */}
        <Route path="*" element={<Navigate to="product" replace />} />
      </Route>
    </Routes>
  );
};

export default App;

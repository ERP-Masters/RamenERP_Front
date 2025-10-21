// 변수: snake_case, boolean: is_ 접두어
export type VendorOrderStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "APPROVED"
  | "PARTIALLY_RECEIVED"
  | "RECEIVED"
  | "CANCELED";

export type VendorOption = { id: number; name: string };
export type WarehouseOption = { id: number; name: string };
export type ItemOption = { id: number; name: string; unit_id: number; unit_name?: string };

export type VendorOrder = {
  id: number;
  po_code: string;           // 백엔드가 po_code 사용하면 그대로 두는 게 맞음
  vendor_id: number;
  vendor_name?: string;
  warehouse_id: number;
  warehouse_name?: string;
  status: VendorOrderStatus;
  expected_date?: string;    // ISO
  note?: string;
  is_active?: boolean;
  created_at: string;
};

export type VendorOrderItemInput = {
  item_id: number;
  unit_id: number;
  qty_ordered: number;
  unit_price: number;
};

export type CreateVendorOrderPayload = {
  po_code?: string;          // 서버에서 생성될 수도 있음
  vendor_id: number;
  warehouse_id: number;
  expected_date?: string;
  note?: string;
  items: VendorOrderItemInput[];
};

/** --- (선택) 이전 이름과의 호환을 위해 임시 별칭 제공 --- */
export type PoStatus = VendorOrderStatus;
export type PurchaseOrder = VendorOrder;
export type PurchaseOrderItemInput = VendorOrderItemInput;
export type CreatePoPayload = CreateVendorOrderPayload;

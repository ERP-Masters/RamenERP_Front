// src/api/vendor_orders.ts
import { http } from "@/api/_http";

// 서버에서 내려오는(또는 우리가 화면에 쓰는) 발주 한 줄
export type VendorOrder = {
  id: number;               // DB PK
  vendor_order_id: string;  // 예: "VO_VD_SEOUL_0001_251027_001"
  vendor_id: number;        // 거래처 PK (숫자)
  item_id: number;          // 품목 PK (숫자)
  wh_id: number;            // 창고 PK (숫자)
  quantity: number;         // 발주 수량
  received_quantity: number; // 누적 입고 수량
  status: string;           // "PENDING" | ...

  created_at?: string;      // ISO 문자열

  // display용
  vendor_name?: string;
  item_name?: string;
  wh_name?: string;
};

// 발주 등록 시 서버에 보낼 한 줄
export type CreateVendorOrderLine = {
  vendor_id: number;
  wh_id: number;
  item_id: number;
  quantity: number;
  status?: string;
};

/**
 * 서버 응답을 VendorOrder[]로 정규화한다.
 */
function normalizeListPayload(j: any): VendorOrder[] {
  if (!j) return [];

  const toOne = (row: any): VendorOrder => ({
    id: Number(row.id ?? 0),
    vendor_order_id: String(row.vendor_order_id ?? row.vendorOrderId ?? row.id ?? ""),
    vendor_id: Number(row.vendor_id ?? row.vendorId ?? 0),
    item_id: Number(row.item_id ?? row.itemId ?? 0),
    wh_id: Number(row.wh_id ?? row.warehouse_id ?? row.whId ?? 0),
    quantity: Number(row.quantity ?? row.qty ?? 0),
    received_quantity: Number(row.received_quantity ?? row.receivedQuantity ?? 0),
    status: String(row.status ?? ""),

    created_at:
      row.created_at ??
      row.createdAt ??
      row.created_at_ts ??
      undefined,

    vendor_name: row.vendor_name ?? row.vendorName ?? undefined,
    item_name: row.item_name ?? row.itemName ?? undefined,
    wh_name:
      row.wh_name ??
      row.whName ??
      row.warehouse_name ??
      undefined,
  });

  if (Array.isArray(j)) return j.map(toOne);
  if (Array.isArray(j.items)) return j.items.map(toOne);
  if (Array.isArray(j.data)) return j.data.map(toOne);
  return [toOne(j)];
}

/* ========================
   조회 API
   ======================== */

// 전체 발주 조회
// GET /api/vendor-order
export async function fetch_vendor_orders_all(): Promise<VendorOrder[]> {
  const j = await http<any>("/api/vendor-order", { method: "GET" });
  return normalizeListPayload(j);
}

// 거래처별 조회
// GET /api/vendor-order/vendor/:vendorId
export async function fetch_vendor_orders_by_vendor(
  vendorId: number,
): Promise<VendorOrder[]> {
  const j = await http<any>(
    `/api/vendor-order/vendor/${encodeURIComponent(String(vendorId))}`,
    { method: "GET" },
  );
  return normalizeListPayload(j);
}

// 상태별 조회
// GET /api/vendor-order/status/:status
export async function fetch_vendor_orders_by_status(
  status: string,
): Promise<VendorOrder[]> {
  const j = await http<any>(
    `/api/vendor-order/status/${encodeURIComponent(status)}`,
    { method: "GET" },
  );
  return normalizeListPayload(j);
}

// 기간별 조회
// GET /api/vendor-order/period?start=YYYY-MM-DD&end=YYYY-MM-DD
export async function fetch_vendor_orders_by_period(
  startDate: string,
  endDate: string,
): Promise<VendorOrder[]> {
  const params = new URLSearchParams();
  params.set("start", startDate);
  params.set("end", endDate);

  const j = await http<any>(
    `/api/vendor-order/period?${params.toString()}`,
    { method: "GET" },
  );
  return normalizeListPayload(j);
}

/* ========================
   생성 API
   ======================== */

// 신규 발주 등록
// POST /api/vendor-order
export async function create_vendor_orders(
  lines: CreateVendorOrderLine[],
): Promise<VendorOrder[] | VendorOrder> {
  const body = JSON.stringify(lines.length === 1 ? lines[0] : lines);

  const j = await http<any>("/api/vendor-order", {
    method: "POST",
    body,
  });

  const normalized = normalizeListPayload(j);
  return Array.isArray(j) || Array.isArray(j?.items) || Array.isArray(j?.data)
    ? normalized
    : normalized[0];
}

/* ========================
   상태 변경(입고/부분입고)
   ======================== */

// 전체 입고 완료(COMPLETED)
export async function complete_vendor_order(id: number): Promise<VendorOrder> {
  const j = await http<any>(`/api/vendor-order/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status: "COMPLETED" }),
  });
  return normalizeListPayload(j)[0];
}

// 부분 입고(PARTIALLY)
export async function partial_vendor_order(
  id: number,
  quantity: number,
): Promise<VendorOrder> {
  const j = await http<any>(`/api/vendor-order/${id}/partial`, {
    method: "PATCH",
    body: JSON.stringify({ quantity }),
  });
  return normalizeListPayload(j)[0];
}

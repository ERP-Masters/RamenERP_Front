// src/api/shipments.ts
import { http } from "@/api/_http";
import type { BranchOrderStatus } from "@/api/branch_orders";

/* ================= 타입 정의 ================= */

export type ShipmentItemSummary = {
  item_id: number;
  requested: number;
  shipped: number;
  remaining: number;
};

export type Shipment = {
  id?: number;
  shipment_id: string;
  order_id: number;
  warehouse_id: number;
  branch_id: number;
  shipped_date?: string;
  due_date?: string;
  delivery_status?: string;
};

export type ShipmentResponse = {
  shipment: Shipment;
  orderStatus: BranchOrderStatus;
  items: ShipmentItemSummary[];
};

export type ShipmentRow = Shipment;

/* ================= 공통 유틸 ================= */

function to_array(j: any): any[] {
  if (!j) return [];
  if (Array.isArray(j)) return j;
  if (Array.isArray(j.items)) return j.items;
  if (Array.isArray(j.data)) return j.data;
  return [];
}

/* ================= API ================= */

/**
 * 특정 수주 ID 기준 출고 생성
 * - POST /api/shipment/order/:orderId
 * - body: { warehouse_id }
 */
export async function create_shipment_for_order(
  order_id: number,
  warehouse_id = 1,
): Promise<ShipmentResponse> {
  const j = await http<ShipmentResponse>(`/api/shipment/order/${order_id}`, {
    method: "POST",
    body: JSON.stringify({ warehouse_id }),
  });
  return j;
}

/**
 * 출고 내역 전체 조회
 * - GET /api/shipment
 */
export async function fetch_shipments_all(): Promise<ShipmentRow[]> {
  const j = await http<any>("/api/shipment", { method: "GET" });
  const arr = to_array(j);

  const rows: ShipmentRow[] = arr
    .map((row: any): ShipmentRow | null => {
      if (!row) return null;

      const order_id = Number(row.order_id ?? row.orderId);
      const warehouse_id = Number(row.warehouse_id ?? row.warehouseId);
      const branch_id = Number(row.branch_id ?? row.branchId);

      if (
        !Number.isFinite(order_id) ||
        !Number.isFinite(warehouse_id) ||
        !Number.isFinite(branch_id)
      ) {
        return null;
      }

      const id_num = row.id !== undefined ? Number(row.id) : undefined;

      return {
        id: Number.isFinite(Number(id_num)) ? Number(id_num) : undefined,
        shipment_id: String(row.shipment_id ?? row.shipmentId ?? row.id ?? ""),
        order_id,
        warehouse_id,
        branch_id,
        shipped_date: row.shipped_date ? String(row.shipped_date) : undefined,
        due_date: row.due_date ? String(row.due_date) : undefined,
        delivery_status: row.delivery_status ? String(row.delivery_status) : undefined,
      };
    })
    .filter((r): r is ShipmentRow => !!r);

  return rows;
}

export default {
  create_shipment_for_order,
  fetch_shipments_all,
};

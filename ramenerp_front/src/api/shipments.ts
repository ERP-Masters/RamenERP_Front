// src/api/shipments.ts
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

/**
 * POST /shipment/order/:orderId 응답 형태
 * {
 *   "shipment": { ... },
 *   "orderStatus": "COMPLETED",
 *   "items": [
 *     { "item_id": 2, "requested": 10, "shipped": 10, "remaining": 0 },
 *     ...
 *   ]
 * }
 */
export type ShipmentResponse = {
  shipment: Shipment;
  orderStatus: BranchOrderStatus;
  items: ShipmentItemSummary[];
};

/** 출고 목록 한 줄 타입 (GET /shipment 응답용) */
export type ShipmentRow = Shipment;

/* ================= 공통 유틸 ================= */

async function safe_json(res: Response): Promise<any | null> {
  try {
    const text = await res.text();
    if (!text) return null;
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function to_array(j: any): any[] {
  if (!j) return [];
  if (Array.isArray(j)) return j;
  if (Array.isArray(j.items)) return j.items;
  if (Array.isArray(j.data)) return j.data;
  return [];
}

/* ================= API 함수 ================= */

/**
 * 특정 수주(주문) ID 기준 배송 생성
 * - POST /api/shipment/order/:orderId
 * - 백엔드 요구사항: body 에 { "warehouse_id": 1 } 포함
 */
export async function create_shipment_for_order(
  order_id: number,
): Promise<ShipmentResponse> {
  const payload = {
    warehouse_id: 1, // 현재는 1번 창고로 고정
  };

  const res = await fetch(`/api/shipment/order/${order_id}`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const j = await safe_json(res);

  if (!res.ok) {
    const msg =
      (j && (j.message || j.error)) ||
      `배송 요청 실패 (HTTP ${res.status})`;
    throw new Error(msg);
  }

  return j as ShipmentResponse;
}

/**
 * 출고 내역 전체 조회
 * - GET /api/shipment
 */
export async function fetch_shipments_all(): Promise<ShipmentRow[]> {
  const res = await fetch("/api/shipment", {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  const j = await safe_json(res);

  if (!res.ok) {
    const msg =
      (j && (j.message || j.error)) ||
      `출고 내역 조회 실패 (HTTP ${res.status})`;
    throw new Error(msg);
  }

  const arr = to_array(j);

  const rows: ShipmentRow[] = arr
    .map((row: any): ShipmentRow | null => {
      if (!row) return null;

      const id = Number(row.id);
      const order_id = Number(row.order_id);
      const warehouse_id = Number(row.warehouse_id);
      const branch_id = Number(row.branch_id);

      if (
        !Number.isFinite(id) ||
        !Number.isFinite(order_id) ||
        !Number.isFinite(warehouse_id) ||
        !Number.isFinite(branch_id)
      ) {
        return null;
      }

      const shipped_date =
        (row.shipped_date && String(row.shipped_date)) || undefined;
      const due_date =
        (row.due_date && String(row.due_date)) || undefined;
      const delivery_status =
        (row.delivery_status && String(row.delivery_status)) ||
        undefined;

      return {
        id,
        shipment_id: String(row.shipment_id ?? row.id ?? ""),
        order_id,
        warehouse_id,
        branch_id,
        shipped_date,
        due_date,
        delivery_status,
      };
    })
    .filter((r): r is ShipmentRow => !!r);

  return rows;
}

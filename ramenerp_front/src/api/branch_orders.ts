// src/api/branch_orders.ts
import { http } from "@/api/_http";

/* ================= 타입 정의 ================= */

export type BranchOrderStatus =
  | "PENDING"
  | "INPROGRESS"
  | "PARTIALLY"
  | "SHIPPING"
  | "CANCELED"
  | "COMPLETED";

type RawBranchOrderItem = {
  id: number;
  request_id: number;
  item_id: number;
  quantity: number;
  unit_price: number;
  amount: number;
};

type RawBranchOrder = {
  id: number;
  order_id: string;
  branch_id: number;

  warehouse_id?: number | string;
  warehouse_name?: string;
  warehouse?: {
    id?: number | string;
    warehouse_id?: number | string;
    name?: string;
  };

  items: RawBranchOrderItem[];
  request_note?: string;
  status: BranchOrderStatus;
  created_at?: string;
  desired_due_date?: string;
};

export type BranchOrder = {
  id?: number;
  order_id: string;

  branch_id: number;
  branch_name?: string;

  warehouse_id?: number | string;
  warehouse_name?: string;

  item_id: number;
  item_name?: string;

  quantity?: number;
  unit_price?: number;
  amount?: number;

  status: BranchOrderStatus;
  created_at?: string;
  desired_due_date?: string;
};

export type CreateBranchOrderItem = {
  item_id: number;
  quantity: number;
  unit_price: number;
  amount: number;
};

export type CreateBranchOrderPayload = {
  branch_id: number;
  items: CreateBranchOrderItem[];
  request_note: string;
  status: BranchOrderStatus;
  desired_due_date: string;
};

/* ================= 공통 유틸 ================= */

const BRANCH_ORDER_API = "/api/branch-order";

function to_array(j: any): any[] {
  if (!j) return [];
  if (Array.isArray(j)) return j;
  if (Array.isArray(j.items)) return j.items;
  if (Array.isArray(j.data)) return j.data;
  return [];
}

function flatten_raw_orders(rows: RawBranchOrder[]): BranchOrder[] {
  const line_rows: BranchOrder[] = [];

  rows.forEach((raw) => {
    const warehouse_id =
      raw.warehouse_id ??
      raw.warehouse?.id ??
      raw.warehouse?.warehouse_id;

    const warehouse_name =
      raw.warehouse_name ?? raw.warehouse?.name;

    const base = {
      id: raw.id,
      order_id: raw.order_id,
      branch_id: raw.branch_id,
      status: raw.status,
      created_at: raw.created_at,
      desired_due_date: raw.desired_due_date,
      warehouse_id,
      warehouse_name,
    } as const;

    if (!Array.isArray(raw.items) || raw.items.length === 0) {
      line_rows.push({
        ...base,
        item_id: 0,
        quantity: 0,
        unit_price: 0,
        amount: 0,
      });
      return;
    }

    raw.items.forEach((it) => {
      line_rows.push({
        ...base,
        item_id: it.item_id,
        quantity: it.quantity,
        unit_price: it.unit_price,
        amount: it.amount,
      });
    });
  });

  return line_rows;
}

/* ================= 조회 API ================= */

async function fetch_raw(path: string): Promise<RawBranchOrder[]> {
  const j = await http<any>(`${BRANCH_ORDER_API}${path}`, { method: "GET" });
  const arr = to_array(j);
  return arr as RawBranchOrder[];
}

export async function fetch_branch_orders_all(): Promise<BranchOrder[]> {
  const rows = await fetch_raw("");
  return flatten_raw_orders(rows);
}

export async function fetch_branch_orders_by_branch(
  branch_id: number,
): Promise<BranchOrder[]> {
  const rows = await fetch_raw(`/branch/${branch_id}`);
  return flatten_raw_orders(rows);
}

export async function fetch_branch_orders_by_status(
  status: BranchOrderStatus,
): Promise<BranchOrder[]> {
  const rows = await fetch_raw(`/status/${status}`);
  return flatten_raw_orders(rows);
}

export async function fetch_branch_orders_by_period(
  start: string,
  end: string,
): Promise<BranchOrder[]> {
  const params = new URLSearchParams({ start, end }).toString();
  const rows = await fetch_raw(`/period?${params}`);
  return flatten_raw_orders(rows);
}

/* ================= 등록 API ================= */

export async function create_branch_order(
  payload: CreateBranchOrderPayload,
): Promise<void> {
  await http<any>(BRANCH_ORDER_API, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

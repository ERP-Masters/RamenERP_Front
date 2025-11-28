/* ================= 타입 정의 ================= */

export type BranchOrderStatus =
  | "PENDING"
  | "INPROGRESS"
  | "PARTIALLY"
  | "SHIPPING"
  | "CANCELED"
  | "COMPLETED";

/** 백엔드에서 오는 items 원본 타입 */
type RawBranchOrderItem = {
  id: number;
  request_id: number;
  item_id: number;
  quantity: number;
  unit_price: number;
  amount: number;
};

/** 백엔드에서 오는 수주 한 건 원본 타입 (items 배열 포함) */
type RawBranchOrder = {
  id: number;
  order_id: string;
  branch_id: number;

  // ✅ 출고 창고 정보(백엔드가 내려주는 경우 사용)
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

/** 프론트에서 라인 단위로 쓰는 타입 (리스트 페이지에서 사용) */
export type BranchOrder = {
  id?: number;
  order_id: string;

  branch_id: number;
  branch_name?: string;

  // ✅ 출고 창고 정보(옵셔널)
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

/** 수주 등록 시 items 배열의 한 줄 */
export type CreateBranchOrderItem = {
  item_id: number;
  quantity: number;
  unit_price: number;
  amount: number;
};

/** 수주 등록 payload (백엔드 DTO 구조에 맞춘 것) */
export type CreateBranchOrderPayload = {
  branch_id: number;
  items: CreateBranchOrderItem[];
  request_note: string;
  status: BranchOrderStatus;
  desired_due_date: string; // ISO 문자열 또는 "YYYY-MM-DD"
};

/* ================= 공통 유틸 ================= */

const BRANCH_ORDER_API = "/api/branch-order";

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

/** RawBranchOrder[] → BranchOrder[] (라인 단위로 평탄화) */
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

    // items 가 아예 없는 경우 방어적으로 한 줄이라도 만들어 줌
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

/** 공통: 원본 수주들 가져오기 */
async function fetch_raw(path: string): Promise<RawBranchOrder[]> {
  const res = await fetch(`${BRANCH_ORDER_API}${path}`, {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  const j = await safe_json(res);

  if (!res.ok) {
    const msg =
      (j && (j.message || j.error)) ||
      `수주 조회 실패 (HTTP ${res.status})`;
    throw new Error(msg);
  }

  const arr = to_array(j);
  return arr as RawBranchOrder[];
}

/** 수주 전체 조회: GET /branch-order */
export async function fetch_branch_orders_all(): Promise<BranchOrder[]> {
  const rows = await fetch_raw("");
  return flatten_raw_orders(rows);
}

/** 지점 ID 기준 조회: GET /branch-order/branch/:branchId */
export async function fetch_branch_orders_by_branch(
  branch_id: number,
): Promise<BranchOrder[]> {
  const rows = await fetch_raw(`/branch/${branch_id}`);
  return flatten_raw_orders(rows);
}

/** 상태 기준 조회: GET /branch-order/status/:status */
export async function fetch_branch_orders_by_status(
  status: BranchOrderStatus,
): Promise<BranchOrder[]> {
  const rows = await fetch_raw(`/status/${status}`);
  return flatten_raw_orders(rows);
}

/** 기간 기준 조회: GET /branch-order/period?start=YYYY-MM-DD&end=YYYY-MM-DD */
export async function fetch_branch_orders_by_period(
  start: string,
  end: string,
): Promise<BranchOrder[]> {
  const params = new URLSearchParams({
    start,
    end,
  }).toString();

  const rows = await fetch_raw(`/period?${params}`);
  return flatten_raw_orders(rows);
}

/* ================= 등록 API ================= */

/**
 * 수주 등록
 * - POST /api/branch-order
 * - payload 구조:
 *   {
 *     branch_id,
 *     request_note,
 *     status,
 *     desired_due_date,
 *     items: [{ item_id, quantity, unit_price, amount }, ...]
 *   }
 */
export async function create_branch_order(
  payload: CreateBranchOrderPayload,
): Promise<void> {
  const res = await fetch(BRANCH_ORDER_API, {
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
      `수주 등록 실패 (HTTP ${res.status})`;
    throw new Error(msg);
  }
}

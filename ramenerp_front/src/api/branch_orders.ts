// src/api/branch_orders.ts

// ─────────────────────────────
// 공통 타입
// ─────────────────────────────

export type BranchOrderStatus =
  | "PENDING"
  | "INPROGRESS"
  | "CANCELED"
  | "SHIPPING"
  | "PARTIALLY"
  | "COMPLETED";

export const BRANCH_ORDER_STATUS_OPTIONS: BranchOrderStatus[] = [
  "PENDING",
  "INPROGRESS",
  "CANCELED",
  "SHIPPING",
  "PARTIALLY",
  "COMPLETED",
];

export type ApiBranchOrder = {
  id?: number;
  order_id: string;
  branch_id: number;
  item_id: number;
  quantity: number;
  unit_price?: number;
  amount?: number;
  request_note?: string | null;
  status: BranchOrderStatus;
  created_at?: string;
  desired_due_date?: string;

  /** ⬇️ 프론트에서 master_data로 채워 넣는 표시용 필드 */
  branch_name?: string;
  item_name?: string;
};

// 프론트에서 사용하는 생성용/수정용 타입
export type CreateBranchOrderInput = {
  branch_id: number;
  item_id: number;
  quantity: number;
  unit_price: number;
  amount: number;
  request_note?: string;
  /** 안 넘기면 PENDING 으로 기본값 처리 */
  status?: BranchOrderStatus;
  /** "YYYY-MM-DD" 혹은 ISO 문자열 */
  desired_due_date: string;
};

export type UpdateBranchOrderInput = {
  quantity?: number;
  unit_price?: number;
  amount?: number;
  request_note?: string;
  status?: BranchOrderStatus;
  desired_due_date?: string;
};

// ─────────────────────────────
// 내부 유틸
// ─────────────────────────────

const BRANCH_ORDER_API_BASE = "/api/branch-order";

function build_headers(method: string = "GET"): Headers {
  const headers = new Headers();
  headers.set("Accept", "application/json");
  if (method !== "GET" && method !== "HEAD") {
    headers.set("Content-Type", "application/json");
  }
  return headers;
}

async function parse_json<T>(res: Response): Promise<T> {
  const text = await res.text().catch(() => "");
  if (!res.ok) {
    const msg = text || res.statusText || "";
    throw new Error(`${res.status} ${msg}`.trim());
  }
  if (!text) {
    // 응답이 비어 있는 경우 (예: 204)
    return null as T;
  }
  return JSON.parse(text) as T;
}

// ─────────────────────────────
// API 함수들
// ─────────────────────────────

/** 수주 전체 조회: GET /api/branch-order */
export async function fetch_branch_orders_all(): Promise<ApiBranchOrder[]> {
  const url = BRANCH_ORDER_API_BASE;
  const res = await fetch(url, {
    method: "GET",
    headers: build_headers("GET"),
  });
  return await parse_json<ApiBranchOrder[]>(res);
}

/** 기간별 조회: GET /api/branch-order/period?start=YYYY-MM-DD&end=YYYY-MM-DD */
export async function fetch_branch_orders_by_period(
  start_date: string,
  end_date: string,
): Promise<ApiBranchOrder[]> {
  const url = `${BRANCH_ORDER_API_BASE}/period?start=${encodeURIComponent(
    start_date,
  )}&end=${encodeURIComponent(end_date)}`;

  const res = await fetch(url, {
    method: "GET",
    headers: build_headers("GET"),
  });
  return await parse_json<ApiBranchOrder[]>(res);
}

/** 단일 수주 조회: GET /api/branch-order/:id */
export async function fetch_branch_order_by_id(
  id: number,
): Promise<ApiBranchOrder> {
  const url = `${BRANCH_ORDER_API_BASE}/${id}`;
  const res = await fetch(url, {
    method: "GET",
    headers: build_headers("GET"),
  });
  return await parse_json<ApiBranchOrder>(res);
}

/** 지점 ID 기준 조회: GET /api/branch-order/branch/:branchId */
export async function fetch_branch_orders_by_branch_id(
  branch_id: number,
): Promise<ApiBranchOrder[]> {
  const url = `${BRANCH_ORDER_API_BASE}/branch/${branch_id}`;
  const res = await fetch(url, {
    method: "GET",
    headers: build_headers("GET"),
  });
  return await parse_json<ApiBranchOrder[]>(res);
}

/** 지점 이름 기준 조회: GET /api/branch-order/branch/name/:name */
export async function fetch_branch_orders_by_branch_name(
  branch_name: string,
): Promise<ApiBranchOrder[]> {
  const url = `${BRANCH_ORDER_API_BASE}/branch/name/${encodeURIComponent(
    branch_name,
  )}`;
  const res = await fetch(url, {
    method: "GET",
    headers: build_headers("GET"),
  });
  return await parse_json<ApiBranchOrder[]>(res);
}

/** 상태별 조회: GET /api/branch-order/status/:status */
export async function fetch_branch_orders_by_status(
  status: BranchOrderStatus,
): Promise<ApiBranchOrder[]> {
  const url = `${BRANCH_ORDER_API_BASE}/status/${status}`;
  const res = await fetch(url, {
    method: "GET",
    headers: build_headers("GET"),
  });
  return await parse_json<ApiBranchOrder[]>(res);
}

/** 수주 생성: POST /api/branch-order */
export async function create_branch_order(
  input: CreateBranchOrderInput,
): Promise<ApiBranchOrder> {
  const body = {
    branch_id: input.branch_id,
    item_id: input.item_id,
    quantity: input.quantity,
    unit_price: input.unit_price,
    amount: input.amount,
    request_note: input.request_note ?? "",
    status: input.status ?? "PENDING", // 백엔드 DTO에서 필수이므로 기본값 강제
    desired_due_date: input.desired_due_date,
  };

  const res = await fetch(BRANCH_ORDER_API_BASE, {
    method: "POST",
    headers: build_headers("POST"),
    body: JSON.stringify(body),
  });

  return await parse_json<ApiBranchOrder>(res);
}

/** 수주 수정: PATCH /api/branch-order/:id */
export async function update_branch_order(
  id: number,
  input: UpdateBranchOrderInput,
): Promise<ApiBranchOrder> {
  const url = `${BRANCH_ORDER_API_BASE}/${id}`;

  const res = await fetch(url, {
    method: "PATCH",
    headers: build_headers("PATCH"),
    body: JSON.stringify(input),
  });

  return await parse_json<ApiBranchOrder>(res);
}

/** 수주 취소(상태 CANCELED): PATCH /api/branch-order/:id/cancel */
export async function cancel_branch_order(
  id: number,
): Promise<ApiBranchOrder> {
  const url = `${BRANCH_ORDER_API_BASE}/${id}/cancel`;

  const res = await fetch(url, {
    method: "PATCH",
    headers: build_headers("PATCH"),
  });

  return await parse_json<ApiBranchOrder>(res);
}

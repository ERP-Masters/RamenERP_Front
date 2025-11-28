// src/pages/LotHistoryListFunction.ts
// LOT 내역 조회 전용 기능/타입 모듈 (조회만 수행)

export type LotRow = {
  id: number;                      // 내부 PK
  lot_id?: string | null;          // LOT 코드 (문자열)
  item_id?: number | null;         // 품목 ID
  warehouse_id?: number | null;    // 창고 ID

  // ✅ 백엔드 JSON에 실제로 존재하는 필드들
  inventory_id?: number | null;     // 재고(Inventory) ID
  manufacture_date?: string | null; // 제조 일시
  received_date?: string | null;    // 입고 일시(새 필드)
  store_date?: string | null;       // 입고 일시(구/기타 필드, 있으면 같이 사용)
  expiry_date?: string | null;      // 만료/유통기한
  shipment_id?: number | null;      // 출고 ID (없으면 null)
  action_type?: string | null;      // INBOUND / OUTBOUND 등

  quantity?: number | null;             // 총 수량
  available_quantity?: number | null;   // 가용 수량(있다면)

  // 백엔드에서 내려주는 다른 필드가 있어도 함께 들어올 수 있도록 any 허용
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
};

const LOT_API_BASE = "/api/lot";

/* 공통: 안전 JSON GET */
async function safe_fetch_json<T = unknown>(url: string): Promise<T> {
  const res = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    throw new Error(`LOT 조회 실패 (HTTP ${res.status})`);
  }

  const data = (await res.json()) as T;
  return data;
}

/** 응답이 단일 객체이든 배열이든 항상 배열로 정규화 */
function normalize_array<T>(data: T | T[]): T[] {
  return Array.isArray(data) ? data : [data];
}

/** LOT 전체 조회: GET /api/lot */
export async function fetch_all_lots(): Promise<LotRow[]> {
  const data = await safe_fetch_json<LotRow[] | LotRow>(LOT_API_BASE);
  return normalize_array<LotRow>(data);
}

/** LOT ID(문자형)로 조회: GET /api/lot/lot/:string_id */
export async function fetch_lots_by_lot_id(lot_id: string): Promise<LotRow[]> {
  const encoded = encodeURIComponent(lot_id);
  // 🔹 여기만 너가 말한 경로로 변경: /lot/lot/:string_id
  const url = `${LOT_API_BASE}/lot/${encoded}`;
  const data = await safe_fetch_json<LotRow[] | LotRow>(url);
  return normalize_array<LotRow>(data);
}

/** Item ID(숫자)로 조회: GET /api/lot/item/:item_id */
export async function fetch_lots_by_item_id(
  item_id: number,
): Promise<LotRow[]> {
  // ✅ 네가 말한 /lot/item/정수형 item_id 경로에 맞춰서 수정
  //    → 프론트 기준: /api/lot/item/:item_id
  const url = `${LOT_API_BASE}/item/${item_id}`;
  const data = await safe_fetch_json<LotRow[] | LotRow>(url);
  return normalize_array<LotRow>(data);
}

/** 창고 ID로 조회: GET /api/lot/warehouse/:warehouse_id */
export async function fetch_lots_by_warehouse_id(
  warehouse_id: number,
): Promise<LotRow[]> {
  // ✅ 네가 말한 경로: /lot/warehouse/숫자형 warehouse_id
  //    프론트 기준: /api/lot/warehouse/:warehouse_id
  const url = `${LOT_API_BASE}/warehouse/${warehouse_id}`;
  const data = await safe_fetch_json<LotRow[] | LotRow>(url);
  return normalize_array<LotRow>(data);
}

/** 가용 자원: item 기준
 *  ✅ GET /api/lot/available?itemId={item_id}
 */
export async function fetch_available_by_item(
  item_id: number,
): Promise<LotRow[]> {
  const url = `${LOT_API_BASE}/available?itemId=${encodeURIComponent(
    String(item_id),
  )}`;
  const data = await safe_fetch_json<LotRow[] | LotRow>(url);
  return normalize_array<LotRow>(data);
}

/** 가용 자원: 창고 기준
 *  ✅ GET /api/lot/available?warehouseId={warehouse_id}
 */
export async function fetch_available_by_warehouse(
  warehouse_id: number,
): Promise<LotRow[]> {
  const url = `${LOT_API_BASE}/available?warehouseId=${encodeURIComponent(
    String(warehouse_id),
  )}`;
  const data = await safe_fetch_json<LotRow[] | LotRow>(url);
  return normalize_array<LotRow>(data);
}

/** 가용 자원: item + 창고 기준
 *  ✅ GET /api/lot/available?itemId={item_id}&warehouseId={warehouse_id}
 */
export async function fetch_available_by_item_and_warehouse(
  item_id: number,
  warehouse_id: number,
): Promise<LotRow[]> {
  const qs = new URLSearchParams();
  qs.set("itemId", String(item_id));
  qs.set("warehouseId", String(warehouse_id));
  const url = `${LOT_API_BASE}/available?${qs.toString()}`;

  const data = await safe_fetch_json<LotRow[] | LotRow>(url);
  return normalize_array<LotRow>(data);
}

/** 기간별 LOT 조회
 *  GET /api/lot/period?start=YYYY-MM-DD&end=YYYY-MM-DD
 */
export async function fetch_lots_by_period(
  start_date: string,
  end_date: string,
): Promise<LotRow[]> {
  const qs = new URLSearchParams();
  qs.set("start", start_date);
  qs.set("end", end_date);

  const url = `${LOT_API_BASE}/period?${qs.toString()}`;
  const data = await safe_fetch_json<LotRow[] | LotRow>(url);
  return normalize_array<LotRow>(data);
}

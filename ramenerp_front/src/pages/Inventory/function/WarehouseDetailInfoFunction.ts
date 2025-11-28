// src/components/WarehouseDetailInfoFunction.ts
// 창고 상세 조회 기능 코드 (GET /api/inventory/warehouse/:id)

export type WarehouseDetailItem = {
  id: number;                 // 내부 PK (숫자)
  inventory_id: string;       // 화면 표시용 재고 코드 (예: "INV_0001")
  warehouse_id: string;       // 창고 이름 (백엔드 응답이 문자열 이름으로 온다고 가정)
  item_id: string;            // 품목 이름 (백엔드 응답이 문자열 이름으로 온다고 가정)
  lot_id: string;             // LOT 코드
  quantity: number;
  safety_stock: number;
  store_date: string;         // ISO
  expiry_date: string;        // ISO
};

const INV_API = "/api/inventory";

/** 공통: 안전 JSON 파싱 */
async function safe_json<T = any>(res: Response): Promise<T | null> {
  const txt = await res.text();
  return txt ? (JSON.parse(txt) as T) : null;
}

/** 창고 상세: GET /inventory/warehouse/:id */
export async function fetchWarehouseDetailById(
  warehouse_id: number
): Promise<WarehouseDetailItem[]> {
  const url = `${INV_API}/warehouse/${encodeURIComponent(warehouse_id)}`;
  const res = await fetch(url, { method: "GET", headers: { Accept: "application/json" } });
  const data = await safe_json<any[]>(res);

  if (!res.ok) {
    const msg = (data as any)?.message || `HTTP ${res.status}`;
    throw new Error(msg);
  }

  const raw: any[] = Array.isArray(data) ? data : [];
  // 백엔드 샘플 응답 형식에 맞춰 안전 매핑
  return raw.map((r) => ({
    id: Number(r.id),
    inventory_id: String(r.inventory_id ?? ""),
    warehouse_id: String(r.warehouse_id ?? ""), // 이름 문자열
    item_id: String(r.item_id ?? ""),           // 이름 문자열
    lot_id: String(r.lot_id ?? ""),
    quantity: Number(r.quantity ?? 0),
    safety_stock: Number(r.safety_stock ?? 0),
    store_date: String(r.store_date ?? ""),
    expiry_date: String(r.expiry_date ?? ""),
  }));
}

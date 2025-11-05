// src/pages/InventoryListFunction.tsx
// 인벤토리 + LOT 조회 전용 유틸 (기능 코드)

export type InventoryRow = {
  id: number;
  inventory_id: string;
  warehouse_id: number;
  item_id: number;
  quantity: number;
  safety_stock: number;
  store_date: string;
  expiry_date: string;
  lot_id?: string; // 인벤토리 전체 조회에 lot_id 가 있으면 같이 보여주기용
};

export type LotRow = {
  id: number;
  lot_id: string;
  item_id: number;
  warehouse_id: number;
  inventory_id: number;
  manufacture_date: string;
  expiry_date: string;
  received_date: string;
  shipment_id: number | null;
};

// 인벤토리 관련 라우터 공통 prefix
const INV_API = "/api/inventory"; // GET /inventory, /inventory/warehouse/..., /inventory/lot/...

/** 공통: 안전 JSON 파싱 */
async function safeJson<T = any>(res: Response): Promise<T | null> {
  const txt = await res.text();
  return txt ? (JSON.parse(txt) as T) : null;
}

/** 전체 인벤토리 조회: GET /inventory */
export async function fetchAllInventories(): Promise<InventoryRow[]> {
  const res = await fetch(`${INV_API}`, {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  const data = await safeJson<InventoryRow[]>(res);
  if (!res.ok) {
    const msg = (data as any)?.message || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return Array.isArray(data) ? data : [];
}

/** 창고 ID 기준 인벤토리 조회: GET /inventory/warehouse/:id */
export async function fetchInventoriesByWarehouseId(
  warehouseId: number | string
): Promise<InventoryRow[]> {
  const res = await fetch(
    `${INV_API}/warehouse/${encodeURIComponent(warehouseId)}`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
    }
  );

  const data = await safeJson<InventoryRow[]>(res);
  if (!res.ok) {
    const msg = (data as any)?.message || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return Array.isArray(data) ? data : [];
}

/** 창고 이름 기준 인벤토리 조회: GET /inventory/warehouse/name/:warehouseName */
export async function fetchInventoriesByWarehouseName(
  warehouseName: string
): Promise<InventoryRow[]> {
  const res = await fetch(
    `${INV_API}/warehouse/name/${encodeURIComponent(warehouseName)}`, // 예: /api/inventory/warehouse/name/서울%201창고
    {
      method: "GET",
      headers: { Accept: "application/json" },
    }
  );

  const data = await safeJson<InventoryRow[]>(res);
  if (!res.ok) {
    const msg = (data as any)?.message || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return Array.isArray(data) ? data : [];
}

/**
 * LOT 조회: GET /inventory/lot/:lotId
 * - lotId 는 숫자형 LOT ID (우리가 입력창에 치는 값)
 */
export async function fetchLotsByItemId( // 기존 호출부 그대로 쓰려고 함수명은 유지
  lotId: number | string
): Promise<LotRow[]> {
  const res = await fetch(
    `${INV_API}/lot/${encodeURIComponent(lotId)}`, // ✅ /api/inventory/lot/1 이런 형태
    {
      method: "GET",
      headers: { Accept: "application/json" },
    }
  );

  const data = await safeJson<any[]>(res);
  if (!res.ok) {
    const msg = (data as any)?.message || `HTTP ${res.status}`;
    throw new Error(msg);
  }

  const raw: any[] = Array.isArray(data) ? data : [];

  const list: LotRow[] = raw.map((l) => ({
    id: Number(l.id),
    lot_id: String(l.lot_id ?? ""),
    item_id: Number(l.item_id),
    warehouse_id: Number(l.warehouse_id),
    inventory_id: Number(l.inventory_id),
    manufacture_date: String(l.manufacture_date ?? ""),
    expiry_date: String(l.expiry_date ?? ""),
    received_date: String(l.received_date ?? ""),
    shipment_id: typeof l.shipment_id === "number" ? l.shipment_id : null,
  }));

  return list;
}

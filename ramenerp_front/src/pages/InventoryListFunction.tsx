// src/pages/InventoryListFunction.tsx
// 인벤토리 + LOT 조회 전용 유틸

export type InventoryRow = {
  id: number;
  inventory_id: string;
  warehouse_id: number;
  item_id: number;
  quantity: number;
  safety_stock: number;
  store_date: string;
  expiry_date: string;
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
const INV_API = "/api/inventory"; // GET /inventory, /inventory/warehouse/...

// LOT 전용 prefix (스웨거 URL: /lot/:itemId)
const LOT_API = "/api/lot";       // GET /lot/:itemId

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

/** 창고 이름 기준 인벤토리 조회: GET /inventory/warehouse/:name */
export async function fetchInventoriesByWarehouseName(
  name: string
): Promise<InventoryRow[]> {
  const res = await fetch(
    `${INV_API}/warehouse/${encodeURIComponent(name)}`, // /api/inventory/warehouse/창고이름
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

/** LOT 조회: GET /lot/:itemId */
export async function fetchLotsByItemId(
  itemId: number | string
): Promise<LotRow[]> {
  const res = await fetch(
    `${LOT_API}/${encodeURIComponent(itemId)}`, // /api/lot/2 이런 식으로 호출
    {
      method: "GET",
      headers: { Accept: "application/json" },
    }
  );

  const data = await safeJson<LotRow[]>(res);
  if (!res.ok) {
    const msg = (data as any)?.message || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return Array.isArray(data) ? data : [];
}

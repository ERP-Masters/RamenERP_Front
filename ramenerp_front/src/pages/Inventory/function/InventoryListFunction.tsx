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

// ✅ LOT 응답은 이제 item_name / warehouse_name 이라서
//    화면용으로 문자열 필드로 받도록 타입을 조정
export type LotRow = {
  id: number;
  lot_id: string;

  /** 품목 코드/이름 표시용 (백엔드의 item_name 또는 item_id 문자열) */
  item_id: string;

  /** 창고 이름 표시용 (백엔드의 warehouse_name 또는 warehouse_id 문자열) */
  warehouse_id: string;

  /** 재고 품목 코드가 따로 없으면 빈 문자열로 둠 */
  inventory_id: string;

  manufacture_date: string;
  expiry_date: string;
  received_date: string;

  /** 현재 응답에 없으면 null 로 처리 (화면에서는 - 로 보임) */
  shipment_id: string | null;
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
 * - lotId 는 숫자형 품목 PK (우리가 입력창에 치는 값)
 */
export async function fetchLotsByItemId( // 기존 호출부 그대로 쓰려고 함수명은 유지
  lotId: number | string
): Promise<LotRow[]> {
  // ✅ 백엔드가 Int itemId 를 기대하므로 여기서 숫자로 확실히 변환
  const numericId =
    typeof lotId === "number" ? lotId : Number(String(lotId).trim());

  if (!Number.isFinite(numericId)) {
    throw new Error("LOT 조회는 숫자형 품목 ID로만 가능합니다.");
  }

  const res = await fetch(
    `${INV_API}/lot/${encodeURIComponent(numericId)}`, // /api/inventory/lot/1
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

  // ✅ 백엔드 응답 필드(item_name, warehouse_name ...)을
  //    화면용 문자열로 안전하게 매핑
  const list: LotRow[] = raw.map((l) => ({
    id: Number(l.id),
    lot_id: String(l.lot_id ?? ""),

    // 품목 이름 또는 코드 (응답에 item_name만 있으면 그걸 사용)
    item_id:
      typeof l.item_name === "string"
        ? l.item_name
        : l.item_id != null
        ? String(l.item_id)
        : "",

    // 창고 이름 또는 ID
    warehouse_id:
      typeof l.warehouse_name === "string"
        ? l.warehouse_name
        : l.warehouse_id != null
        ? String(l.warehouse_id)
        : "",

    // 재고 품목 코드가 별도 필드로 오면 사용, 아니면 빈 문자열
    inventory_id:
      l.inventory_item_code != null
        ? String(l.inventory_item_code)
        : l.inventory_id != null
        ? String(l.inventory_id)
        : "",

    manufacture_date: String(l.manufacture_date ?? ""),
    expiry_date: String(l.expiry_date ?? ""),
    received_date: String(l.received_date ?? ""),

    shipment_id:
      l.shipment_id != null && l.shipment_id !== ""
        ? String(l.shipment_id)
        : null,
  }));

  return list;
}

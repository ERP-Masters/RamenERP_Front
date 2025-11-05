// src/pages/WarehouseEditFunction.tsx
export type WarehouseEditTarget = {
  /** 실제 PK(id) */
  warehouse_id: number;
  name: string;
  location: string;
};

export type ApiWarehouse = {
  id?: number;
  warehouse_id: number | string;
  name: string;
  location: string;
  created_at: string; // ISO
};

export async function putWarehouse(data: WarehouseEditTarget): Promise<ApiWarehouse> {
  const { warehouse_id: pk_id, name, location } = data;

  const id_num = Number(pk_id);
  if (!Number.isFinite(id_num)) {
    throw new Error("잘못된 창고 PK(id) 입니다.");
  }

  const url = `/api/warehouses/${id_num}`;
  const res = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    // ✅ 요구사항: 수정 시에도 기본 isused는 "USED"로 전송
    body: JSON.stringify({ name, location, isused: "USED" }),
  });

  const text = await res.text().catch(() => "");
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const j = text ? JSON.parse(text) : null;
      msg = j?.message || msg;
    } catch {}
    if (res.status === 404) throw new Error(`창고(id=${id_num})를 찾을 수 없습니다.`);
    throw new Error(msg);
  }

  return text
    ? (JSON.parse(text) as ApiWarehouse)
    : ({ warehouse_id: pk_id, name, location, created_at: "" } as ApiWarehouse);
}

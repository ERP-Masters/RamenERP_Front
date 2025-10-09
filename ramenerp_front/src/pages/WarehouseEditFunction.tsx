export type WarehouseEditTarget = {
  warehouse_id: number;
  name: string;
  location: string;
};

export type ApiWarehouse = {
  warehouse_id: number;
  name: string;
  location: string;
  created_at: string; // ISO
};

export async function putWarehouse(data: WarehouseEditTarget): Promise<ApiWarehouse> {
  const { warehouse_id, name, location } = data;

  const res = await fetch(`/api/warehouses/${warehouse_id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ name, location }),
  });

  const text = await res.text();
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const j = text ? JSON.parse(text) : null;
      msg = j?.message || msg;
    } catch {}
    throw new Error(msg);
  }

  return text ? (JSON.parse(text) as ApiWarehouse) : { warehouse_id, name, location, created_at: "" };
}

// src/api/lookups.ts

export type VendorSummary = { id: number; name: string; code?: string };
export type ItemSummary = { id: number; name?: string; item_id?: string };
export type WarehouseSummary = { id: number; name: string };

type RawVendor = {
  id?: number | string;
  name?: string;
  vendor_id?: string;
};

type RawItem = {
  id?: number | string;
  name?: string;
  item_id?: string;
};

type RawWarehouse = {
  id?: number | string;
  wh_id?: number | string;
  name?: string;
  warehouse_name?: string;
};

function build_headers(method = "GET"): Headers {
  const h = new Headers();
  h.set("Accept", "application/json");
  if (method !== "GET" && method !== "HEAD") h.set("Content-Type", "application/json");
  return h;
}

async function parse_json_or_throw(res: Response): Promise<any> {
  const text = await res.text().catch(() => "");
  if (!res.ok) throw new Error(`HTTP ${res.status} ${text || res.statusText}`.trim());
  return text ? JSON.parse(text) : null;
}

/** ✅ 거래처: 내부 PK(id) + 표시용 코드(vendor_id) */
export async function fetch_vendors_options(): Promise<VendorSummary[]> {
  const res = await fetch(`/api/vendors`, { headers: build_headers("GET") });
  const data = await parse_json_or_throw(res);

  const rows: RawVendor[] = Array.isArray(data) ? data : [];

  return rows
    .map((v: RawVendor): VendorSummary | null => {
      const id = Number(v.id);
      const name = String(v.name ?? "").trim();
      const code = v.vendor_id ? String(v.vendor_id) : undefined;

      if (!Number.isFinite(id) || !name) return null;
      return { id, name, code };
    })
    .filter((v): v is VendorSummary => v !== null);
}

export async function fetch_items_summary(): Promise<ItemSummary[]> {
  const res = await fetch(`/api/items`, { headers: build_headers("GET") });
  const data = await parse_json_or_throw(res);

  const rows: RawItem[] = Array.isArray(data) ? data : [];

  return rows
    .map((u: RawItem): ItemSummary | null => {
      const id = Number(u.id);
      if (!Number.isFinite(id)) return null;

      return {
        id,
        name: u.name ? String(u.name) : undefined,
        item_id: u.item_id ? String(u.item_id) : undefined,
      };
    })
    .filter((u): u is ItemSummary => u !== null);
}

export async function fetch_warehouses_summary(): Promise<WarehouseSummary[]> {
  const res = await fetch(`/api/warehouses`, { headers: build_headers("GET") });
  const data = await parse_json_or_throw(res);

  const rows: RawWarehouse[] = Array.isArray(data) ? data : [];

  return rows
    .map((u: RawWarehouse): WarehouseSummary | null => {
      const id = Number(u.id ?? u.wh_id);
      const name = String(u.name ?? u.warehouse_name ?? "").trim();

      if (!Number.isFinite(id) || !name) return null;
      return { id, name };
    })
    .filter((u): u is WarehouseSummary => u !== null);
}

export type VendorSummary = { id: number; name: string };
export type ItemSummary = { id: number; name?: string; item_id?: string };
export type WarehouseSummary = { id: number; name: string };

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

/** 거래처 요약: [{id, name}] */
export async function fetch_vendors_summary(): Promise<VendorSummary[]> {
  const res = await fetch(`/api/vendors/summary`, { headers: build_headers("GET") });
  const data = await parse_json_or_throw(res);
  return (Array.isArray(data) ? data : []).map((u: any) => ({
    id: Number(u.id ?? u.vendor_id ?? u.vendorId),
    name: String(u.name ?? u.vendor_name ?? u.vendorName ?? ""),
  })).filter((u) => Number.isFinite(u.id) && u.name);
}

/** 품목 요약: [{id, name?, item_id?}] */
export async function fetch_items_summary(): Promise<ItemSummary[]> {
  const res = await fetch(`/api/items`, { headers: build_headers("GET") });
  const data = await parse_json_or_throw(res);
  return (Array.isArray(data) ? data : []).map((u: any) => ({
    id: Number(u.id ?? u.item_pk ?? u.itemId),
    name: u.name ? String(u.name) : undefined,
    item_id: u.item_id ? String(u.item_id) : undefined,
  })).filter((u) => Number.isFinite(u.id));
}

/** 창고 요약: [{id, name}] */
export async function fetch_warehouses_summary(): Promise<WarehouseSummary[]> {
  const res = await fetch(`/api/warehouses`, { headers: build_headers("GET") });
  const data = await parse_json_or_throw(res);
  return (Array.isArray(data) ? data : []).map((u: any) => ({
    id: Number(u.id ?? u.warehouse_id ?? u.wh_id),
    name: String(u.name ?? u.warehouse_name ?? ""),
  })).filter((u) => Number.isFinite(u.id) && u.name);
}

export type VendorSummary = { id: number; name: string; code?: string };

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

/** ✅ 거래처: 내부 PK(id) + 표시용 코드(vendor_id)까지 함께 */
export async function fetch_vendors_options(): Promise<VendorSummary[]> {
  const res = await fetch(`/api/vendors`, { headers: build_headers("GET") });
  const data = await parse_json_or_throw(res);
  return (Array.isArray(data) ? data : []).map((u: any) => {
    const id = Number(u.id);
    const name = String(u.name ?? "");
    const code = u.vendor_id ? String(u.vendor_id) : undefined; // "VD_SEOUL_0001"
    return Number.isFinite(id) && name ? { id, name, code } : null;
  }).filter(Boolean) as VendorSummary[];
}

/** 기존: 품목/창고 요약은 그대로 사용 */
export async function fetch_items_summary(): Promise<{ id: number; name?: string; item_id?: string }[]> {
  const res = await fetch(`/api/items`, { headers: build_headers("GET") });
  const data = await parse_json_or_throw(res);
  return (Array.isArray(data) ? data : []).map((u: any) => ({
    id: Number(u.id),
    name: u.name ? String(u.name) : undefined,
    item_id: u.item_id ? String(u.item_id) : undefined,
  })).filter((u) => Number.isFinite(u.id));
}

export async function fetch_warehouses_summary(): Promise<{ id: number; name: string }[]> {
  const res = await fetch(`/api/warehouses`, { headers: build_headers("GET") });
  const data = await parse_json_or_throw(res);
  return (Array.isArray(data) ? data : []).map((u: any) => ({
    id: Number(u.id ?? u.wh_id),
    name: String(u.name ?? u.warehouse_name ?? ""),
  })).filter((u) => Number.isFinite(u.id) && u.name);
}

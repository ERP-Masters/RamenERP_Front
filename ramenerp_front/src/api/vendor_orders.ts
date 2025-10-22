// src/api/vendor_orders.ts
import type {
  CreateVendorOrderPayload,
  VendorOrderRow,
  VendorOption,
  WarehouseOption,
  ItemOption,
} from "@/types/vendor_order";

const base = "/api";

/* ===== 공통 HTTP 유틸 ===== */
function headers(method = "GET"): Headers {
  const h = new Headers();
  h.set("Accept", "application/json");
  if (method !== "GET" && method !== "HEAD") h.set("Content-Type", "application/json");
  return h;
}

async function http<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, headers: headers(init?.method || "GET") });
  const text = await res.text().catch(() => "");
  if (!res.ok) {
    try {
      const j = text ? JSON.parse(text) : null;
      throw new Error(j?.message || j?.error || text || `HTTP ${res.status}`);
    } catch {
      throw new Error(text || `HTTP ${res.status}`);
    }
  }
  if (!text) return undefined as unknown as T;
  return JSON.parse(text) as T;
}

/* ===== 발주 API ===== */
export const create_vendor_order = (payload: CreateVendorOrderPayload) =>
  http<VendorOrderRow>(`${base}/vendorOrder`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const fetch_vendor_orders = (params?: {
  status?: string;
  vendor_id?: number;
  wh_id?: number;
  item_id?: number;
}) => {
  const q = new URLSearchParams();
  if (params?.status) q.set("status", params.status);
  if (params?.vendor_id) q.set("vendor_id", String(params.vendor_id));
  if (params?.wh_id) q.set("wh_id", String(params.wh_id));
  if (params?.item_id) q.set("item_id", String(params.item_id));
  const qs = q.toString();
  return http<VendorOrderRow[]>(
    `${base}/vendorOrder${qs ? `?${qs}` : ""}`,
    { method: "GET" }
  );
};

/* ===== 옵션 API (필요 시 경로 조정) ===== */
export const fetch_vendors = () =>
  http<VendorOption[]>(`${base}/vendors/options`, { method: "GET" });

export const fetch_warehouses = () =>
  http<WarehouseOption[]>(`${base}/warehouses/options`, { method: "GET" });

export const fetch_items = () =>
  http<any[]>(`${base}/items`, { method: "GET" }).then((arr: any[]) =>
    (arr ?? [])
      .map((r) => ({
        id: Number(r.id ?? r.item_pk ?? r.itemId),
        name: String(r.name ?? r.item_name ?? r.title ?? ""),
        ext_item_id: String(r.item_id ?? r.code ?? r.sku ?? ""),
      }))
      .filter((x) => x.id && x.name)
  );

/* ===== 기본(default) 집합 export 추가 — 런타임 임포트 이슈 우회용 ===== */
export default {
  create_vendor_order,
  fetch_vendor_orders,
  fetch_vendors,
  fetch_warehouses,
  fetch_items,
};

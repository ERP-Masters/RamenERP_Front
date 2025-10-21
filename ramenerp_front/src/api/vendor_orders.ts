// src/api/vendor_orders.ts
import {
  CreateVendorOrderPayload,
  VendorOrder,
  VendorOption,
  WarehouseOption,
  ItemOption,
} from "@/types/vendor_order";

const base = "/api";

/** 공통 HTTP 래퍼 */
async function http<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, {
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    ...init,
  });

  if (!res.ok) {
    const t = await res.text().catch(() => "");
    let msg = `HTTP ${res.status}`;
    try {
      const j = t ? JSON.parse(t) : null;
      msg = j?.message || msg;
    } catch {
      if (t) msg = t;
    }
    throw new Error(msg);
  }

  // 204(No Content) 방어
  if (res.status === 204) return undefined as unknown as T;
  return (await res.json()) as T;
}

/** 쿼리스트링 유틸 */
function build_query(obj?: Record<string, unknown>): string {
  if (!obj) return "";
  const params = new URLSearchParams();
  Object.entries(obj).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    params.append(k, String(v));
  });
  const q = params.toString();
  return q ? `?${q}` : "";
}

/** ====== VendorOrder endpoints ====== */

/** [POST] 거래처 발주 등록  → POST /api/vendorOrder */
export const create_vendor_order = (payload: CreateVendorOrderPayload) =>
  http<VendorOrder>(`${base}/vendorOrder`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

/** [GET] 발주 목록(검색)  → GET /api/vendorOrder?status=&vendor_id= */
export const fetch_vendor_order_list = (params?: { status?: string; vendor_id?: number }) =>
  http<VendorOrder[]>(`${base}/vendorOrder${build_query(params)}`);

/** [GET] 단건 조회 → GET /api/vendorOrder/:id */
export const fetch_vendor_order_by_id = (id: number) =>
  http<VendorOrder>(`${base}/vendorOrder/${id}`);

/** [GET] 거래처별 목록 → GET /api/vendorOrder/vendor/:id */
export const fetch_vendor_order_by_vendor = (vendor_id: number) =>
  http<VendorOrder[]>(`${base}/vendorOrder/vendor/${vendor_id}`);

/** [GET] 상태별 목록 → GET /api/vendorOrder/status/:status */
export const fetch_vendor_order_by_status = (status: string) =>
  http<VendorOrder[]>(`${base}/vendorOrder/status/${encodeURIComponent(status)}`);

/** (옵션) 위치 검색 → GET /api/search/location/:loc */
export const search_vendor_order_by_location = (loc: string) =>
  http<VendorOrder[]>(`${base}/search/location/${encodeURIComponent(loc)}`);

/** ====== 공통 옵션 API (프로젝트 내 존재 가정) ====== */
export const fetch_vendors = () => http<VendorOption[]>(`${base}/vendors/options`);
export const fetch_warehouses = () => http<WarehouseOption[]>(`${base}/warehouses/options`);
export const fetch_items = (q?: string) =>
  http<ItemOption[]>(`${base}/items/options${build_query(q ? { q } : undefined)}`);

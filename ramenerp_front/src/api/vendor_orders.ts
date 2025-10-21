// src/api/vendor_orders.ts
import type {
  CreateVendorOrderPayload,
  VendorOrder,
  VendorOption,
  WarehouseOption,
  ItemOption,
} from "@/types/vendor_order";

const base = "/api";

/** 공통 JSON 파서 */
async function parse_json<T>(res: Response): Promise<T> {
  const text = await res.text().catch(() => "");
  if (!res.ok) {
    // 서버가 텍스트로 "Cannot GET ..."만 주는 경우를 그대로 에러 메시지로 표시
    try {
      const j = text ? JSON.parse(text) : null;
      const msg = j?.message || j?.error || text || `HTTP ${res.status}`;
      throw new Error(msg);
    } catch {
      throw new Error(text || `HTTP ${res.status}`);
    }
  }
  if (!text) return undefined as unknown as T; // 204 방어
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error("서버가 JSON이 아닌 응답을 반환했습니다.");
  }
}

/** GET/HEAD에는 Content-Type을 넣지 않음 */
function build_headers(method: string, extra?: HeadersInit): HeadersInit {
  const m = method.toUpperCase();
  const h = new Headers();

  // 기본 헤더
  h.set("Accept", "application/json");
  if (m !== "GET" && m !== "HEAD") {
    h.set("Content-Type", "application/json");
  }

  // 덮어쓰기(추가 헤더가 있으면)
  if (extra) {
    new Headers(extra).forEach((v, k) => {
      if (v != null) h.set(k, v); // undefined 방지
    });
  }
  return h;
}
/** 404일 때 경로 변형하여 재시도 (trailing slash / 대소문자 차이 보정) */
async function get_with_fallbacks<T>(candidates: string[], init?: RequestInit): Promise<T> {
  let last_err: unknown = null;
  for (const url of candidates) {
    try {
      const res = await fetch(url, {
        ...init,
        headers: build_headers(init?.method || "GET", init?.headers),
      });
      if (res.ok) {
        return await parse_json<T>(res);
      }
      // 404면 다음 후보로
      if (res.status === 404) {
        last_err = new Error(await res.text());
        continue;
      }
      // 그 외 상태코드는 즉시 throw
      return await parse_json<T>(res);
    } catch (e) {
      last_err = e;
      // 다음 후보 시도
    }
  }
  throw last_err instanceof Error ? last_err : new Error(String(last_err));
}

/** ====== VendorOrder endpoints ====== */

// [POST] /api/vendorOrder
export const create_vendor_order = (payload: CreateVendorOrderPayload) =>
  get_with_fallbacks<VendorOrder>(
    [`${base}/vendorOrder`, `${base}/vendorOrder/`, `${base}/vendororder`],
    { method: "POST", body: JSON.stringify(payload) }
  );

// [GET] /api/vendorOrder?status=&vendor_id=
export const fetch_vendor_order_list = (params?: { status?: string; vendor_id?: number }) => {
  const q = build_query(params);
  // 후보들을 순차 시도: no-slash → slash → 소문자
  const candidates = [
    `${base}/vendorOrder${q}`,
    `${base}/vendorOrder/${q ? q : ""}`,
    `${base}/vendororder${q}`,
  ];
  return get_with_fallbacks<VendorOrder[]>(candidates, { method: "GET" });
};

// [GET] /api/vendorOrder/:id
export const fetch_vendor_order_by_id = (id: number) =>
  get_with_fallbacks<VendorOrder>(
    [`${base}/vendorOrder/${id}`, `${base}/vendorOrder/${id}/`, `${base}/vendororder/${id}`],
    { method: "GET" }
  );

// [GET] /api/vendorOrder/vendor/:id
export const fetch_vendor_order_by_vendor = (vendor_id: number) =>
  get_with_fallbacks<VendorOrder[]>(
    [
      `${base}/vendorOrder/vendor/${vendor_id}`,
      `${base}/vendorOrder/vendor/${vendor_id}/`,
      `${base}/vendororder/vendor/${vendor_id}`,
    ],
    { method: "GET" }
  );

// [GET] /api/vendorOrder/status/:status
export const fetch_vendor_order_by_status = (status: string) =>
  get_with_fallbacks<VendorOrder[]>(
    [
      `${base}/vendorOrder/status/${encodeURIComponent(status)}`,
      `${base}/vendorOrder/status/${encodeURIComponent(status)}/`,
      `${base}/vendororder/status/${encodeURIComponent(status)}`,
    ],
    { method: "GET" }
  );

/** ====== 공통 옵션 API (프로젝트 내 존재 가정) ====== */
export const fetch_vendors = () =>
  get_with_fallbacks<VendorOption[]>(
    [`${base}/vendors/options`, `${base}/vendors/options/`],
    { method: "GET" }
  );

export const fetch_warehouses = () =>
  get_with_fallbacks<WarehouseOption[]>(
    [`${base}/warehouses/options`, `${base}/warehouses/options/`],
    { method: "GET" }
  );

export const fetch_items = (q?: string) => {
  const qs = build_query(q ? { q } : undefined);
  return get_with_fallbacks<ItemOption[]>(
    [`${base}/items/options${qs}`, `${base}/items/options/${qs ? qs : ""}`],
    { method: "GET" }
  );
};

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

// src/api/vendor_orders.ts

// 서버에서 내려오는 단일 발주 레코드 형태
export type VendorOrder = {
  vendor_order_id: string; // ex: "VO_VD_SEOUL_0001_251027_001"
  vendor_id: number;       // 숫자 (거래처 PK)
  item_id: number;         // 숫자 (품목 PK)
  wh_id: number;           // 숫자 (창고 PK)
  quantity: number;
  status: string;          // "PENDING" | "INPROGRESS" | "CANCELED" ...
};

// 발주 등록 시 보낼 라인
export type CreateVendorOrderLine = {
  vendor_id: number;
  wh_id: number;
  item_id: number;
  quantity: number;
  status?: string; // 안 보내면 서버에서 기본값 PENDING
};

/** 공통 fetch(JSON) */
async function reqJSON(url: string, opts?: RequestInit): Promise<any> {
  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    ...opts,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`[${res.status}] ${text || "요청 실패"}`);
  }

  try {
    return await res.json();
  } catch {
    return null;
  }
}

// 서버가 단일 객체/배열/ items[] 이렇게 줄 수도 있으니까 안전하게 배열화
function normalizeListPayload(j: any): VendorOrder[] {
  if (!j) return [];
  if (Array.isArray(j)) return j as VendorOrder[];
  if (Array.isArray(j.items)) return j.items as VendorOrder[];
  return [j as VendorOrder];
}

/* ========================
   조회
   ======================== */

// 전체 발주 조회
// GET /api/vendor-order  -> proxy -> Nest /vendor-order
export async function fetch_vendor_orders_all(): Promise<VendorOrder[]> {
  const j = await reqJSON("/api/vendor-order", { method: "GET" });
  return normalizeListPayload(j);
}

// 거래처별 조회
// GET /api/vendor-order/vendor/:vendorId
export async function fetch_vendor_orders_by_vendor(
  vendorId: number,
): Promise<VendorOrder[]> {
  const j = await reqJSON(
    `/api/vendor-order/vendor/${encodeURIComponent(vendorId)}`,
    { method: "GET" },
  );
  return normalizeListPayload(j);
}

// 상태별 조회
// GET /api/vendor-order/status/:status
export async function fetch_vendor_orders_by_status(
  status: string,
): Promise<VendorOrder[]> {
  const j = await reqJSON(
    `/api/vendor-order/status/${encodeURIComponent(status)}`,
    { method: "GET" },
  );
  return normalizeListPayload(j);
}

// 기간별 조회
// GET /api/vendor-order/period?start=YYYY-MM-DD&end=YYYY-MM-DD
export async function fetch_vendor_orders_by_period(
  startDate: string,
  endDate: string,
): Promise<VendorOrder[]> {
  const params = new URLSearchParams();
  params.set("start", startDate);
  params.set("end", endDate);

  const j = await reqJSON(
    `/api/vendor-order/period?${params.toString()}`,
    { method: "GET" },
  );
  return normalizeListPayload(j);
}

/* ========================
   생성
   ======================== */

// 신규 발주 등록
// POST /api/vendor-order
// 백엔드 컨트롤러는 단일 DTO 또는 DTO 배열 둘 다 처리하니까
// 여기서도 라인 1개면 객체로, 2개 이상이면 배열로 보낸다.
export async function create_vendor_orders(
  lines: CreateVendorOrderLine[],
): Promise<VendorOrder[] | VendorOrder> {
  const body = JSON.stringify(lines.length === 1 ? lines[0] : lines);

  const j = await reqJSON("/api/vendor-order", {
    method: "POST",
    body,
  });

  // 서버가 배열 줄 수도, 단일 줄 수도 있으므로 그대로 반환
  return j as VendorOrder[] | VendorOrder;
}

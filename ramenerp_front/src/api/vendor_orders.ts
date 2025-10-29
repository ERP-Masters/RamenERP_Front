// src/api/vendor_orders.ts

// 서버에서 내려오는(또는 우리가 화면에 쓰는) 발주 한 줄
export type VendorOrder = {
  vendor_order_id: string; // 예: "VO_VD_SEOUL_0001_251027_001"
  vendor_id: number;       // 거래처 PK (숫자)
  item_id: number;         // 품목 PK (숫자)
  wh_id: number;           // 창고 PK (숫자)
  quantity: number;
  status: string;          // "PENDING" | "INPROGRESS" | ...

  created_at?: string;     // ISO 문자열로 오는 생성시각(발주일자). 없으면 undefined

  // 아래 세 개는 화면에서 붙여서 쓰는 display용 필드라 optional
  vendor_name?: string;
  item_name?: string;
  wh_name?: string;
};

// 발주 등록 시 서버에 보낼 한 줄
export type CreateVendorOrderLine = {
  vendor_id: number;
  wh_id: number;
  item_id: number;
  quantity: number;
  status?: string; // 안 보내면 서버가 기본 "PENDING" 줄 수도 있음
};

/** 공통 fetch(JSON) 헬퍼 */
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

  // 비어 있는 응답일 수도 있으니 try/catch
  try {
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * 서버 응답을 VendorOrder[]로 정규화한다.
 * 서버가 단일 객체 / 배열 / {items:[...]} 등 어떤 형태로 줄지 몰라서
 * 안전하게 처리.
 */
function normalizeListPayload(j: any): VendorOrder[] {
  if (!j) return [];

  // 개별 row -> VendorOrder
  const toOne = (row: any): VendorOrder => {
    return {
      vendor_order_id: row.vendor_order_id ?? row.id ?? "",
      vendor_id: Number(row.vendor_id ?? row.vendorId ?? 0),
      item_id: Number(row.item_id ?? row.itemId ?? 0),
      wh_id: Number(row.wh_id ?? row.warehouse_id ?? row.whId ?? 0),
      quantity: Number(row.quantity ?? row.qty ?? 0),
      status: String(row.status ?? ""),

      // 발주일자(생성 시각). 백엔드에서 created_at / createdAt 정도로 내려올 거라 가정
      created_at:
        row.created_at ??
        row.createdAt ??
        row.created_at_ts ??
        undefined,

      // 이름 필드는 백엔드에서 주면 받고, 안 주면 나중에 화면단에서 붙임
      vendor_name: row.vendor_name ?? row.vendorName ?? undefined,
      item_name:   row.item_name   ?? row.itemName   ?? undefined,
      wh_name:     row.wh_name     ?? row.whName     ?? row.warehouse_name ?? undefined,
    };
  };

  if (Array.isArray(j)) {
    return j.map(toOne);
  }
  if (Array.isArray(j.items)) {
    return j.items.map(toOne);
  }
  // 단일 객체인 경우도 배열로 감싸서 리턴
  return [toOne(j)];
}

/* ========================
   조회 API
   ======================== */

// 전체 발주 조회
// GET /api/vendor-order  (프론트 dev서버에서 /api -> Nest /vendor-order 로 프록시된다고 가정)
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
   생성 API
   ======================== */

// 신규 발주 등록
// POST /api/vendor-order
// 백엔드 컨트롤러는 단일 DTO 또는 DTO 배열 둘 다 받도록 되어 있으므로
// 여기서도 라인 1개면 객체, 여러 개면 배열로 보냄.
export async function create_vendor_orders(
  lines: CreateVendorOrderLine[],
): Promise<VendorOrder[] | VendorOrder> {
  const body = JSON.stringify(lines.length === 1 ? lines[0] : lines);
  const j = await reqJSON("/api/vendor-order", {
    method: "POST",
    body,
  });
  // 서버가 단일 or 배열 줄 수 있으니 그대로 반환
  return j as VendorOrder[] | VendorOrder;
}

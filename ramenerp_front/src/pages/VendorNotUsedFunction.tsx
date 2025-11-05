// src/pages/VendorNotUsedFunction.tsx
// 거래처 isused 상태 변경 및 NOTUSED 목록 조회 전용 유틸

export type VendorState = "USED" | "NOTUSED";

export type ApiVendor = {
  id: number;                 // ← 요청/내부 로직은 숫자형 유지 (PK)
  /** 화면표시용 문자열 ID (백엔드가 주지 않으면 fetch에서 파생 생성) */
  vendor_id: string;
  name: string;
  manager: string;
  contact: string;
  address: string;
  isused?: string | null;
  created_at: string;
};

const VD_API = "/api/vendors";

/** 공통: 안전 JSON 파싱 */
async function safeJson<T = any>(res: Response): Promise<T | null> {
  const txt = await res.text();
  return txt ? (JSON.parse(txt) as T) : null;
}

/**
 * 지정 거래처를 미사용으로 전환
 * - 요청은 항상 숫자형 id(PK) 사용
 * - { isused: "NOTUSED" } 로 전송
 * - 성공 시 'vendor:notused:updated' 이벤트 브로드캐스트
 */
export async function markVendorNotUsed(id: number): Promise<void> {
  const payload = { isused: "NOTUSED" as VendorState };

  const res = await fetch(`${VD_API}/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await safeJson(res);
  if (!res.ok) {
    const msg = (data as any)?.message || `HTTP ${res.status}`;
    throw new Error(msg);
  }

  // 화면 갱신용 신호
  window.dispatchEvent(new Event("vendor:notused:updated"));
}

/**
 * 미사용(NOTUSED) 상태의 거래처 목록 조회
 * - GET /vendors/state
 * - 화면 표시를 위해 vendor_id(문자열) 보강
 */
export async function fetchNotUsedVendors(): Promise<ApiVendor[]> {
  const res = await fetch(`${VD_API}/state`, {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  const data = await safeJson<ApiVendor[] | { items?: any[] }>(res);
  if (!res.ok) {
    const msg = (data as any)?.message || `HTTP ${res.status}`;
    throw new Error(msg);
  }

  const raw: any[] =
    Array.isArray(data) ? (data as any[]) :
    (data && Array.isArray((data as any).items) ? (data as any).items : []);

  // ✅ vendor_id(표시용 문자열) 보강 + id는 숫자형으로 정규화
  const list: ApiVendor[] = raw.map((v: any) => {
    const display =
      (typeof v?.vendor_id === "string" && v.vendor_id) ||
      (typeof v?.display_vendor_id === "string" && v.display_vendor_id) ||
      (typeof v?.id === "string" && v.id) ||
      String(v?.vendor_id ?? "");

    return {
      id: Number(v?.id),                 // 숫자형 고정(PK)
      vendor_id: display,                // 화면 표시용 문자열 ID
      name: String(v?.name ?? "").trim(),
      manager: String(v?.manager ?? "").trim(),
      contact: String(v?.contact ?? "").trim(),
      address: String(v?.address ?? "").trim(),
      isused: v?.isused ?? null,
      created_at: String(v?.created_at ?? "").trim(),
    } as ApiVendor;
  });

  return list;
}

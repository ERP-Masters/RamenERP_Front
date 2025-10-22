// src/pages/VendorNotUsedFunction.tsx
// 거래처 isused 상태 변경 및 NOTUSED 목록 조회 전용 유틸

export type VendorState = "USED" | "NOTUSED";

export type ApiVendor = {
  vendor_id: number;
  name: string;
  manager: string;
  contact: string;
  address: string;
  isused?: string | null;
  /** 화면표시용 문자열 ID (백엔드가 주지 않으면 아래 fetch에서 파생 생성) */
  display_vendor_id: string;
};

const VD_API = "/api/vendors";

async function safeJson<T = any>(res: Response): Promise<T | null> {
  const txt = await res.text();
  return txt ? (JSON.parse(txt) as T) : null;
}

/** ✅ 지정 거래처를 미사용으로 전환(요청은 항상 숫자 vendor_id 사용) */
export async function markVendorNotUsed(vendor_id: number | string): Promise<void> {
  // 1) 숫자 id 정규화: "VD_SEOUL_0002" -> 2
  const idNum =
    typeof vendor_id === "number"
      ? vendor_id
      : Number(((vendor_id as string).match(/\d+$/) || [])[0]);

  if (!Number.isFinite(idNum)) {
    throw new Error("유효하지 않은 vendor_id 입니다.");
  }

  const payload = { isused: "NOTUSED" as VendorState };

  const res = await fetch(`/api/vendors/${encodeURIComponent(idNum)}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await (async () => {
    const t = await res.text();
    return t ? JSON.parse(t) : null;
  })();

  if (!res.ok) throw new Error((data as any)?.message || `HTTP ${res.status}`);

  // 화면 갱신 신호 (기존 흐름 그대로)
  window.dispatchEvent(new Event("vendor:notused:updated"));
}

/** ✅ 미사용(NOTUSED) 거래처 목록 조회(표시는 문자열 ID) */
export async function fetchNotUsedVendors(): Promise<ApiVendor[]> {
  const res = await fetch(`${VD_API}/state`, {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  const data = await safeJson<ApiVendor[] | { items?: ApiVendor[] }>(res);
  if (!res.ok) throw new Error((data as any)?.message || `HTTP ${res.status}`);

  const raw =
    Array.isArray(data) ? data :
    (data && Array.isArray((data as any).items) ? (data as any).items : []);

  // 화면 표시를 위해 display_vendor_id 보강
  return raw.map((v: any) => ({
    ...v,
    display_vendor_id:
      typeof v?.display_vendor_id === "string" && v.display_vendor_id
        ? v.display_vendor_id
        : typeof v?.vendor_id === "string"
        ? v.vendor_id
        : typeof v?.id === "string"
        ? v.id
        : String(v?.vendor_id ?? ""),
  }));
}

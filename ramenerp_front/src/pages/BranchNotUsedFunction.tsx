// src/pages/BranchNotUsedFunction.tsx
// 지점 isused 상태 변경 및 NOTUSED 목록 조회 전용 유틸

export type BranchState = "USED" | "NOTUSED";

export type ApiBranch = {
  branch_id: number;            // ← 요청/내부 로직은 숫자형 유지
  /** 화면표시용 문자열 ID (백엔드가 주지 않으면 fetch에서 파생 생성) */
  display_branch_id: string;
  name: string;
  location: string;
  detail_address: string;
  store_owner: string;
  contact: string;
  isused?: string | null;
  created_at: string;
};

const BR_API = "/api/branches";

/** 공통: 안전 JSON 파싱 */
async function safeJson<T = any>(res: Response): Promise<T | null> {
  const txt = await res.text();
  return txt ? (JSON.parse(txt) as T) : null;
}

/**
 * 지정 지점을 미사용으로 전환
 * - 요청은 항상 숫자형 branch_id 사용
 * - { isused: "NOTUSED" } 로 전송
 * - 성공 시 'branch:notused:updated' 이벤트 브로드캐스트
 */
export async function markBranchNotUsed(branch_id: number): Promise<void> {
  const payload = { isused: "NOTUSED" as BranchState };

  const res = await fetch(`${BR_API}/${encodeURIComponent(branch_id)}`, {
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
  window.dispatchEvent(new Event("branch:notused:updated"));
}

/**
 * 미사용(NOTUSED) 상태의 지점 목록 조회
 * - GET /branches/state
 * - 화면 표시를 위해 display_branch_id(문자열) 보강
 */
export async function fetchNotUsedBranches(): Promise<ApiBranch[]> {
  const res = await fetch(`${BR_API}/state`, {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  const data = await safeJson<ApiBranch[] | { items?: any[] }>(res);
  if (!res.ok) {
    const msg = (data as any)?.message || `HTTP ${res.status}`;
    throw new Error(msg);
  }

  const raw: any[] =
    Array.isArray(data) ? (data as any[]) :
    (data && Array.isArray((data as any).items) ? (data as any).items : []);

  // ✅ display_branch_id 보강 + branch_id는 숫자형으로 정규화
  const list: ApiBranch[] = raw.map((b: any) => {
    const display =
      (typeof b?.display_branch_id === "string" && b.display_branch_id) ||
      (typeof b?.branch_id === "string" && b.branch_id) ||
      (typeof b?.id === "string" && b.id) ||
      String(b?.branch_id ?? "");

    return {
      branch_id: Number(b?.branch_id),           // 숫자형 고정
      display_branch_id: display,                // 화면 표시용 문자열 ID
      name: String(b?.name ?? "").trim(),
      location: String(b?.location ?? "").trim(),
      detail_address: String(b?.detail_address ?? "").trim(),
      store_owner: String(b?.store_owner ?? "").trim(),
      contact: String(b?.contact ?? "").trim(),
      isused: b?.isused ?? null,
      created_at: String(b?.created_at ?? "").trim(),
    } as ApiBranch;
  });

  return list;
}

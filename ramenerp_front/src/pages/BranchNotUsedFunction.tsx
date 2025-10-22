// src/pages/BranchNotUsedFunction.tsx
// 지점 isused 상태 변경 및 NOTUSED 목록 조회 전용 유틸

export type BranchState = "USED" | "NOTUSED";

export type ApiBranch = {
  branch_id: number;
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
 * - 백엔드 명세상 필드는 isused가 아닌 `issued` 를 요구(예전 에러 메시지 기준)
 * - { issued: "NOTUSED" } 로 전송
 * - 성공 시 'branch:notused:updated' 이벤트를 쏨(필요시 화면에서 듣고 새로고침)
 */
export async function markBranchNotUsed(branch_id: number): Promise<void> {
  const payload = { isused: "NOTUSED" as BranchState };

  const res = await fetch(`${BR_API}/${encodeURIComponent(branch_id)}`, {
    method: "PUT",                 // 서버가 PATCH가 아니라 PUT만 받는 경우가 많아 PUT 사용
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

  // 화면 갱신용 신호 (필요한 쪽에서 addEventListener로 수신)
  window.dispatchEvent(new Event("branch:notused:updated"));
}

/**
 * 미사용( NOTUSED ) 상태의 지점 목록 조회
 * - 명세: /branches/state 로 GET 요청 시 NOTUSED 집합을 반환한다고 가정
 * - (만약 서버가 쿼리 파라미터를 요구하면 아래 주석처럼 쓰면 됨)
 *     fetch(`${BR_API}/state?issued=NOTUSED`)
 */
export async function fetchNotUsedBranches(): Promise<ApiBranch[]> {
  const res = await fetch(`${BR_API}/state`, {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  const data = await safeJson<ApiBranch[] | { items?: ApiBranch[] }>(res);
  if (!res.ok) {
    const msg = (data as any)?.message || `HTTP ${res.status}`;
    throw new Error(msg);
  }

  // 서버가 배열 그대로 주는 경우/객체 래핑해 주는 경우 모두 대응
  const list =
    Array.isArray(data) ? data :
    (data && Array.isArray((data as any).items) ? (data as any).items : []);

  return list;
}

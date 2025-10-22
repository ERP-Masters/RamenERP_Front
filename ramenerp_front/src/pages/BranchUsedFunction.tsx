// src/pages/BranchUsedFunction.tsx
// 미사용 상태(=NOTUSED) 지점을 사용(=USED)으로 복구하는 전용 유틸

export type BranchState = "USED" | "NOTUSED";

const BR_API = "/api/branches";

/** 공통: 안전 JSON 파싱 */
async function safeJson<T = any>(res: Response): Promise<T | null> {
  const txt = await res.text();
  return txt ? (JSON.parse(txt) as T) : null;
}

/**
 * 지정 지점을 사용으로 전환
 * - 미사용 전환과 동일한 패턴: PUT /api/branches/:id  +  body: { isused: "USED" }
 * - 성공 시 'branch:used:restored' 이벤트를 쏨(미사용 화면은 이를 듣고 자동 갱신)
 */
export async function markBranchUsed(branch_id: number): Promise<void> {
  const payload = { isused: "USED" as BranchState };

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

  // 화면 갱신용 신호 (미사용 목록은 이 이벤트를 듣고 즉시 사라짐)
  window.dispatchEvent(new Event("branch:used:restored"));
}

/** 여러 지점을 한 번에 사용으로 전환 */
export async function markManyBranchesUsed(ids: number[]): Promise<void> {
  // 병렬 처리
  await Promise.all(ids.map((id) => markBranchUsed(id)));
}

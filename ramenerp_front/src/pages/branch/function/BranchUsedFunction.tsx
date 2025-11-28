// src/pages/BranchUsedFunction.tsx
// 지점 isused 상태(USED / NOTUSED) 변경 전용 유틸

export type BranchState = "USED" | "NOTUSED";

/** 요청에 사용할 타입: PK id + 바꿀 상태값 */
export type BranchStateTarget = {
  /** 내부 DB PK (숫자) */
  id: number;
  isused: BranchState;
};

export type ApiBranch = {
  /** 내부 DB PK */
  id?: number;
  /** 화면에 표시되는 ID 문자열 (예: "BR_GYEONGGI_0001") */
  branch_id: number | string;
  name: string;
  location: string;
  detail_address: string;
  store_owner: string;
  contact: string;
  created_at?: string;
  isused?: BranchState | null;
};

/* ─────────────────────────────
 * 공통: 안전 JSON 파싱
 * ───────────────────────────── */
async function safeJson<T = any>(res: Response): Promise<T | null> {
  const txt = await res.text();
  return txt ? (JSON.parse(txt) as T) : null;
}

/* ─────────────────────────────
 * PUT /api/branches/:id
 *  - pk id 로만 요청
 *  - isused 상태값만 변경
 * ───────────────────────────── */
export async function putBranchState(
  data: BranchStateTarget
): Promise<ApiBranch> {
  const { id, isused } = data;

  const pk_id = Number(id);
  if (!Number.isFinite(pk_id)) {
    throw new Error("잘못된 지점 PK(id) 입니다. (숫자형 id 필요)");
  }

  const res = await fetch(`/api/branches/${pk_id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ isused }),
  });

  const text = await res.text().catch(() => "");
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const j = text ? JSON.parse(text) : null;
      msg = j?.message || msg;
    } catch {}
    if (res.status === 404) {
      throw new Error(`지점(id=${pk_id})을 찾을 수 없습니다.`);
    }
    throw new Error(msg);
  }

  // 204(No Content) 대응
  return text
    ? (JSON.parse(text) as ApiBranch)
    : ({
        id: pk_id,
        branch_id: "", // 화면용 ID는 응답이 있을 때 사용
        name: "",
        location: "",
        detail_address: "",
        store_owner: "",
        contact: "",
        isused,
      } as ApiBranch);
}

/* ─────────────────────────────
 * 단일 지점을 USED 로 전환
 *  - 호출부는 항상 숫자형 id 를 넘긴다.
 * ───────────────────────────── */
export async function markBranchUsed(id: number): Promise<void> {
  await putBranchState({ id, isused: "USED" });
  // 메인/미사용 화면 동기화용 이벤트
  window.dispatchEvent(new Event("branch:used:restored"));
}

/* ─────────────────────────────
 * 여러 지점을 한 번에 USED 전환
 *  - ids: 1,2,3 같은 숫자형 PK 배열
 * ───────────────────────────── */
export async function markManyBranchesUsed(ids: number[]): Promise<void> {
  const normalized = ids
    .map((v) => Number(v))
    .filter((n) => Number.isFinite(n));

  if (normalized.length === 0) {
    throw new Error("선택된 지점이 없습니다. (숫자형 id 필요)");
  }

  await Promise.all(normalized.map((id) => markBranchUsed(id)));
}

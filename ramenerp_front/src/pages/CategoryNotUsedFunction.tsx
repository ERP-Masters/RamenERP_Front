// src/pages/CategoryNotUsedFunction.tsx
// 카테고리 isused 상태 변경 및 NOTUSED 목록 조회 전용 유틸

export type CategoryState = "USED" | "NOTUSED";

export type ApiCategory = {
  /** 화면표시용(문자열 가능) */
  category_id: number | string;
  /** DB PK (숫자) — 서버가 내려주는 값 */
  id?: number;
  group: string;
  category_name: string;
  isused?: string | null;
  /** 화면표시용 문자열 ID (백엔드가 주지 않으면 아래 fetch에서 파생 생성) */
  display_category_id: string;
};

const CATEGORY_API = "/api/category";

/** 공통: 안전 JSON 파싱 */
async function safeJson<T = any>(res: Response): Promise<T | null> {
  const txt = await res.text();
  return txt ? (JSON.parse(txt) as T) : null;
}

/**
 * 지정 카테고리를 미사용으로 전환
 * - 요청은 항상 숫자형 PK id 사용
 * - PUT /api/category/changestate/:id
 * - body: { state: "NOTUSED" }
 * - 성공 시 'category:notused:updated' 이벤트 브로드캐스트
 */
export async function markCategoryNotUsed(id: number): Promise<void> {
  const pk = Number(id);
  if (!Number.isFinite(pk)) {
    throw new Error("잘못된 카테고리 PK(id) 입니다.");
  }

  const res = await fetch(
    `${CATEGORY_API}/changestate/${encodeURIComponent(pk)}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ state: "NOTUSED" as CategoryState }),
    }
  );

  const data = await safeJson(res);
  if (!res.ok) {
    const msg = (data as any)?.message || `HTTP ${res.status}`;
    throw new Error(msg);
  }

  // 화면 갱신용 신호
  window.dispatchEvent(new Event("category:notused:updated"));
}

/**
 * 미사용(NOTUSED) 상태의 카테고리 목록 조회
 * - GET /category/state
 * - 화면 표시를 위해 display_category_id(문자열) 보강
 */
export async function fetchNotUsedCategories(): Promise<ApiCategory[]> {
  const res = await fetch(`${CATEGORY_API}/state`, {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  const data = await safeJson<ApiCategory[] | { items?: any[] }>(res);
  if (!res.ok) {
    const msg = (data as any)?.message || `HTTP ${res.status}`;
    throw new Error(msg);
  }

  const raw: any[] =
    Array.isArray(data)
      ? (data as any[])
      : data && Array.isArray((data as any).items)
      ? (data as any).items
      : [];

  // display_category_id 보강 (문자열 ID)
  const list: ApiCategory[] = raw.map((c: any) => {
    const display =
      (typeof c?.display_category_id === "string" && c.display_category_id) ||
      (typeof c?.category_id === "string" && c.category_id) ||
      (typeof c?.id === "string" && c.id) ||
      String(c?.category_id ?? "");

    return {
      category_id: c?.category_id as any,
      id: typeof c?.id === "number" ? c.id : undefined,
      display_category_id: display,
      group: String(c?.group ?? "").trim(),
      category_name: String(c?.category_name ?? "").trim(),
      isused: c?.isused ?? null,
    } as ApiCategory;
  });

  return list;
}

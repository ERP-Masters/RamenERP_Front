// src/pages/UnitEditFunction.tsx
// 기능 전용: JSX는 사용하지 않지만 .tsx여도 문제 없습니다.

export type ApiUnit = {
  unit_id: number;
  code: string;
  name: string;
  is_active?: boolean | null;
};

export type UnitEditTarget = {
  unit_id: number;
  code: string;
  name: string;
};

/** PUT /api/units/:id  (Vite devServer proxy: /api → 백엔드) */
export async function putUnit(payload: UnitEditTarget): Promise<ApiUnit> {
  const { unit_id, code, name } = payload;

  if (!unit_id || !code?.trim() || !name?.trim()) {
    throw new Error("단위 수정 데이터가 올바르지 않습니다.");
  }

  const res = await fetch(`/api/units/${unit_id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ code: code.trim(), name: name.trim() }),
  });

  const raw = await res.text();
  if (!res.ok) {
    try {
      const err = raw ? JSON.parse(raw) : null;
      throw new Error(err?.message || `HTTP ${res.status}`);
    } catch {
      throw new Error(raw || `HTTP ${res.status}`);
    }
  }

  return raw ? (JSON.parse(raw) as ApiUnit) : ({ unit_id, code, name } as ApiUnit);
}

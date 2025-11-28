// src/pages/UnitEditFunction.tsx

export type UnitEditTarget = {
  /** 실제 PK(id) */
  unit_id: number;
  code: string;
  name: string;
};

export type ApiUnit = {
  id?: number;
  unit_id: number | string;
  code: string;
  name: string;
  created_at: string; // ISO
};

export async function putUnit(data: UnitEditTarget): Promise<ApiUnit> {
  const { unit_id: pk_id, code, name } = data;

  const id_num = Number(pk_id);
  if (!Number.isFinite(id_num)) {
    throw new Error("잘못된 단위 PK(id) 입니다.");
  }

  const url = `/api/units/${id_num}`;
  const res = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    // ✅ 요구사항: 수정 시에도 기본 isused는 "USED"로 전송
    body: JSON.stringify({ code, name, isused: "USED" }),
  });

  const text = await res.text().catch(() => "");
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const j = text ? JSON.parse(text) : null;
      msg = j?.message || msg;
    } catch {}
    if (res.status === 404) throw new Error(`단위(id=${id_num})를 찾을 수 없습니다.`);
    throw new Error(msg);
  }

  return text
    ? (JSON.parse(text) as ApiUnit)
    : ({ unit_id: pk_id, code, name, created_at: "" } as ApiUnit);
}

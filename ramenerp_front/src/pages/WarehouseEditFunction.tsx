export type WarehouseEditTarget = {
  warehouse_id: number;
  name: string;
  location: string;
};

export type ApiWarehouse = {
  warehouse_id: number | string;
  name: string;
  location: string;
  created_at: string; // ISO
};

/**
 * 창고 수정 요청
 * - 서버가 isused 필드를 필수로 요구하므로 "USED"를 함께 전송
 */
export async function putWarehouse(data: WarehouseEditTarget): Promise<ApiWarehouse> {
  const { warehouse_id, name, location } = data;

  const res = await fetch(`/api/warehouses/${warehouse_id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      name,
      location,
      // ✅ 서버 검증 충족: 수정 시 상태 유지 용도로 기본 "USED" 전송
      isused: "USED",
    }),
  });

  const text = await res.text();
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const j = text ? JSON.parse(text) : null;
      msg = j?.message || msg;
    } catch {}
    throw new Error(msg);
  }

  // 서버가 문자열 ID를 돌려줄 수도 있어 Number 비교가 필요할 수 있어요(호출측에서 이미 처리 중).
  return text
    ? (JSON.parse(text) as ApiWarehouse)
    : { warehouse_id, name, location, created_at: "" };
}

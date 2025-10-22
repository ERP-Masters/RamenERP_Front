// src/pages/VendorUsedFunction.tsx
// 거래처 "사용 등록(USED)" 전용 유틸

export type VendorState = "USED" | "NOTUSED";

const VD_API = "/api/vendors";

const safeJson = async (res: Response) => {
  const t = await res.text();
  return t ? JSON.parse(t) : null;
};

/** ✅ 단일 거래처를 '사용(USED)' 으로 전환
 * - 인자는 숫자형 또는 문자열(ID 문자열 가능)
 * - 문자열이 오면 끝자리 숫자를 추출해 숫자형 id로 정규화
 * - PUT /api/vendors/:id  { isused: "USED" }
 * - 성공 시 'vendor:used:restored' 이벤트 발행
 */
export async function markVendorUsed(vendor_id: number | string): Promise<void> {
  // 1) 숫자 id 정규화: "VD_SEOUL_0002" -> 2
  const idNum =
    typeof vendor_id === "number"
      ? vendor_id
      : Number(((vendor_id as string).match(/\d+$/) || [])[0]);

  if (!Number.isFinite(idNum)) {
    throw new Error("유효하지 않은 vendor_id 입니다. (숫자 ID 필요)");
  }

  // 2) USED 로 상태 변경
  const res = await fetch(`${VD_API}/${encodeURIComponent(idNum)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ isused: "USED" as VendorState }),
  });

  const j = await safeJson(res);
  if (!res.ok) throw new Error(j?.message || `HTTP ${res.status}`);

  // 3) 화면 갱신 신호(미사용 목록은 이 이벤트를 듣고 새로고침/제거)
  window.dispatchEvent(new Event("vendor:used:restored"));
}

/** ✅ 여러 거래처를 한 번에 USED 전환 */
export async function markManyVendorsUsed(ids: Array<number | string>): Promise<void> {
  // 숫자화 + 유효성 체크
  const normalized = ids.map((v) =>
    typeof v === "number" ? v : Number(((v as string).match(/\d+$/) || [])[0])
  );
  if (!normalized.every((n) => Number.isFinite(n))) {
    throw new Error("선택된 항목 중 숫자형 vendor_id 가 아닌 값이 있습니다.");
  }

  await Promise.all(normalized.map((id) => markVendorUsed(id)));
}

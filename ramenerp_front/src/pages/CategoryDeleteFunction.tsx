// src/pages/CategoryDeleteService.ts
export type CategoryDeleteTarget = { category_id: number; category_name: string };

export async function deleteCategoryById(id: number): Promise<void> {
  const res = await fetch(`/api/category/${id}`, {
    method: "DELETE",
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const t = await res.text();
      if (t) {
        try {
          const j = JSON.parse(t);
          msg = (j as any)?.message || msg;
        } catch {
          msg = t || msg;
        }
      }
    } catch {}
    throw new Error(msg);
  }
}

/** UI에서 쓰기 쉬운 헬퍼: 성공/실패 알림 + 목록 갱신 콜백 */
export async function deleteCategoryWithAlerts(
  target: CategoryDeleteTarget,
  onDeleted: (deletedId: number) => void
) {
  try {
    await deleteCategoryById(target.category_id);
    onDeleted(target.category_id);
    alert("삭제되었습니다.");
  } catch (e: any) {
    alert(`삭제에 실패했습니다. ${e?.message || ""}`);
  }
}

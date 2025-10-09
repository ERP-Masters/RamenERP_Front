// src/pages/WarehouseDeleteFunction.tsx
export type WarehouseDeleteTarget = { warehouse_id: number; name: string };

export async function deleteWarehouseById(id: number): Promise<void> {
  const res = await fetch(`/api/warehouses/${id}`, {
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

export async function deleteWarehouseWithAlerts(
  target: WarehouseDeleteTarget,
  onDeleted: (deletedId: number) => void
) {
  try {
    await deleteWarehouseById(target.warehouse_id);
    onDeleted(target.warehouse_id);
    alert("삭제되었습니다.");
  } catch (e: any) {
    alert(`삭제에 실패했습니다. ${e?.message || ""}`);
  }
}

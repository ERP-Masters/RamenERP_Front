// 기능 전용: 삭제 API만 보유
export type VendorDeleteTarget = { vendor_id: number; name: string };

export async function deleteVendorById(id: number): Promise<void> {
  const res = await fetch(`/api/vendors/${id}`, {
    method: "DELETE",
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    const t = await res.text().catch(() => "");
    let msg = `HTTP ${res.status}`;
    try {
      const j = t ? JSON.parse(t) : null;
      msg = j?.message || msg;
    } catch {
      if (t) msg = t;
    }
    throw new Error(msg);
  }
}

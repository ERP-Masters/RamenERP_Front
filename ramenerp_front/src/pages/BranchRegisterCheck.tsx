// src/pages/BranchRegisterCheck.tsx
export type BranchCreateDto = {
  name: string;
  location: string;
  detail_address?: string;
  store_owner?: string;
  contact?: string;
};

export async function submitBranch(payload: BranchCreateDto): Promise<boolean> {
  // 간단 검증
  if (!payload.name || !payload.location) {
    alert("등록에 실패하였습니다. (지점명/위치를 입력해 주세요)");
    return false;
  }

  try {
    const res = await fetch("/api/branches", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        name: payload.name,
        location: payload.location,
        detail_address: payload.detail_address ?? "",
        store_owner: payload.store_owner ?? "",
        contact: (payload.contact ?? "").replace(/\D/g, ""), // 숫자만 저장하고 싶으면 유지
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

    alert("등록이 완료되었습니다.");

    // 리스트 페이지에게: 모달 닫기 + 목록 새로고침
    window.dispatchEvent(new Event("branch:created"));
    window.dispatchEvent(new Event("branch:register:cancel"));

    return true;
  } catch (e: any) {
    alert(`등록에 실패하였습니다. ${e?.message || ""}`);
    return false;
  }
}

// src/utils/VendorRegisterCheck.tsx
export interface VendorSubmitInput {
  name: string;           // 거래처명
  contact_name: string;   // 담당자명
  contact_email: string;  // 담당자 이메일
  address_road: string;   // 도로명
  address_detail: string; // 상세주소
  isused?: "USED" | "NOTUSED";
}

export interface VendorSubmitOptions {
  /** 기본: '/api/vendors' */
  endpoint?: string;
  /** 기본: true (성공/실패 alert 팝업 표시) */
  showAlert?: boolean;
  /** 성공 시 후속 동작(모달 닫기 등) */
  onSuccess?: (responseJson: any) => void;
  /** 실패 시 후속 동작(로그 등) */
  onError?: (error: Error) => void;
}

/**
 * 벤더 등록 POST + (옵션) 팝업 표시
 * - 성공 시 'vendor:created' 커스텀 이벤트를 디스패치하여 기존 목록 갱신 흐름을 그대로 사용.
 */
export async function submitVendor(
  input: VendorSubmitInput,
  opts: VendorSubmitOptions = {}
): Promise<{ ok: true; data: any } | { ok: false; error: Error }> {
  const {
    endpoint = "/api/vendors",
    showAlert = true,
    onSuccess,
    onError,
  } = opts;

  // 백엔드 명세에 맞춘 payload
  const payload = {
    name: (input.name || "").trim(),
    manager: (input.contact_name || "").trim(),
    contact: (input.contact_email || "").trim(),
    address: `${(input.address_road || "").trim()} ${(input.address_detail || "").trim()}`.trim(),
    isused: (input.isused ?? "USED") as "USED" | "NOTUSED",  // ✅ 기본값: USED
  };

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
    });

    const raw = await res.text();
    if (!res.ok) {
      let msg = `HTTP ${res.status}`;
      try { msg = JSON.parse(raw)?.message || msg; } catch {}
      throw new Error(msg);
    }

    const json = raw ? JSON.parse(raw) : null;

    // ✅ 기존 리스트 페이지가 듣고 있는 이벤트(목록 재조회) 유지
    window.dispatchEvent(new CustomEvent("vendor:created"));

    if (showAlert) alert("등록이 완료되었습니다!");

    onSuccess?.(json);
    return { ok: true, data: json };
  } catch (err: any) {
    if (showAlert) alert("등록이 실패하였습니다.");
    const error = err instanceof Error ? err : new Error(String(err));
    onError?.(error);
    return { ok: false, error };
  }
}

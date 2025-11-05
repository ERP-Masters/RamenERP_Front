// src/pages/VendorEditFunction.tsx
import React from "react";

export type VendorEditTarget = {
  // 호출부는 여전히 vendor_id를 넘깁니다(숫자 PK거나, 화면용 문자열 ID 둘 다 가능).
  vendor_id: number | string;
  name: string;
  manager: string;
  contact: string;
  address: string;
};

export type ApiVendor = {
  id?: number;                    // 실제 PK
  vendor_id: number | string;     // 화면표시용(문자열/숫자)
  name: string;
  manager: string;
  contact: string;
  address: string;
  created_at?: string;
};

/* ─────────────────────────────
 * 내부 PK(id) 해석기
 * 1) 숫자면 그대로
 * 2) 숫자 형태의 문자열이면 Number()
 * 3) 그 외(예: "VD_SEOUL_0001")면 /api/vendors 를 조회하여
 *    동일한 vendor_id(문자열) 레코드의 id를 찾음
 * ───────────────────────────── */
async function resolvePkId(input: number | string): Promise<number> {
  // 1) number
  if (typeof input === "number" && Number.isFinite(input)) return input;

  // 2) "123" 같은 순수 숫자 문자열
  if (typeof input === "string" && /^\d+$/.test(input)) return Number(input);

  // 3) 화면용 문자열 ID → 목록에서 매칭해 실제 PK(id) 찾기
  //    (다른 파일은 수정하지 않기 위해 여기서만 보조 조회 수행)
  const res = await fetch("/api/vendors", { headers: { Accept: "application/json" } });
  const txt = await res.text();
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} (vendor 목록 조회 실패)`);
  }
  const list = txt ? (JSON.parse(txt) as any[]) : [];
  // 백엔드가 제공하는 필드 예시: { id: number, vendor_id: "VD_SEOUL_0001", ... }
  const hit = list.find(
    (v: any) => typeof v?.vendor_id === "string" && v.vendor_id === String(input)
  );
  const pk = hit?.id;
  if (!Number.isFinite(pk)) {
    throw new Error("잘못된 거래처 PK(id) 입니다. (화면 ID를 실제 id로 해석할 수 없음)");
  }
  return pk as number;
}

/* ─────────────────────────────
 * PUT /api/vendors/:id
 * (창고 수정 흐름과 동일한 에러 처리/204 대응)
 * ───────────────────────────── */
export async function putVendor(data: VendorEditTarget): Promise<ApiVendor> {
  const { vendor_id, name, manager, contact, address } = data;

  // 화면용 문자열이 와도 내부에서 실제 PK(id)로 해석
  const pk_id = await resolvePkId(vendor_id);

  const url = `/api/vendors/${pk_id}`;
  const res = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      name,
      manager,
      contact,
      address,
    }),
  });

  const text = await res.text().catch(() => "");
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const j = text ? JSON.parse(text) : null;
      msg = j?.message || msg;
    } catch {}
    if (res.status === 404) throw new Error(`거래처(id=${pk_id})를 찾을 수 없습니다.`);
    throw new Error(msg);
  }

  // 204(No Content) 대응
  return text
    ? (JSON.parse(text) as ApiVendor)
    : ({
        id: pk_id,
        vendor_id, // 화면표시용은 호출 입력값 유지
        name,
        manager,
        contact,
        address,
      } as ApiVendor);
}

/* ───────── 기존 UI는 그대로 ───────── */
type EditUiProps = {
  open: boolean;
  target: VendorEditTarget | null;
  onClose: () => void;
  onSubmit: (data: VendorEditTarget) => void;
};

const overlay_style: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.35)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
};
const modal_style: React.CSSProperties = {
  width: 420,
  maxWidth: "90vw",
  background: "#fff",
  borderRadius: 8,
  boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
  padding: 16,
  boxSizing: "border-box",
};
const row_style: React.CSSProperties = { marginBottom: 10 };
const input_style: React.CSSProperties = { width: "100%", padding: "6px 8px", boxSizing: "border-box" };

export const VendorEditUi: React.FC<EditUiProps> = ({ open, target, onClose, onSubmit }) => {
  const [local, set_local] = React.useState<VendorEditTarget | null>(target);
  React.useEffect(() => { set_local(target); }, [target, open]);
  if (!open || !local) return null;

  return (
    <div style={overlay_style} onClick={onClose}>
      <div style={modal_style} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ margin: "0 0 10px 0" }}>거래처 수정</h3>

        <div style={row_style}>
          <label>거래처명</label>
          <input
            style={input_style}
            type="text"
            value={local.name}
            onChange={(e) => set_local({ ...local, name: e.target.value })}
          />
        </div>

        <div style={row_style}>
          <label>담당자명</label>
          <input
            style={input_style}
            type="text"
            value={local.manager}
            onChange={(e) => set_local({ ...local, manager: e.target.value })}
          />
        </div>

        <div style={row_style}>
          <label>연락처</label>
          <input
            style={input_style}
            type="text"
            value={local.contact}
            onChange={(e) => set_local({ ...local, contact: e.target.value })}
          />
        </div>

        <div style={row_style}>
          <label>주소</label>
          <input
            style={input_style}
            type="text"
            value={local.address}
            onChange={(e) => set_local({ ...local, address: e.target.value })}
          />
        </div>

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 12 }}>
          <button type="button" onClick={onClose}>취소</button>
          <button
            type="button"
            onClick={() => onSubmit(local)}
            style={{ background: "#111827", color: "#fff", padding: "6px 12px", borderRadius: 6, border: "1px solid #111827" }}
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
};

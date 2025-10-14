// src/pages/VendorEditFunction.tsx
import React from "react";

export type VendorEditTarget = {
  vendor_id: number;
  name: string;
  manager: string;
  contact: string;
  address: string;
};

// 서버에 PUT 요청: 수정 후 갱신된 벤더를 반환
export async function putVendor(data: VendorEditTarget) {
  const res = await fetch(`/api/vendors/${data.vendor_id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      name: data.name?.trim() ?? "",
      manager: data.manager?.trim() ?? "",
      contact: String(data.contact ?? "").trim(),
      address: data.address?.trim() ?? "",
    }),
  });

  const raw = await res.text();
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const j = raw ? JSON.parse(raw) : null;
      msg = j?.message || msg;
    } catch {}
    throw new Error(msg);
  }
  return raw ? JSON.parse(raw) : { ...data };
}

// ===== 수정 모달 UI =====
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

  React.useEffect(() => {
    set_local(target);
  }, [target, open]);

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
          <button type="button" onClick={onClose}>
            취소
          </button>
          <button
            type="button"
            onClick={() => onSubmit(local)}
            style={{
              background: "#111827",
              color: "#fff",
              padding: "6px 12px",
              borderRadius: 6,
              border: "1px solid #111827",
            }}
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
};

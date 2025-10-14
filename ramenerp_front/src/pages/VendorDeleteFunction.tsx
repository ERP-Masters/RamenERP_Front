// src/pages/VendorDeleteFunction.tsx
import React from "react";

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

// ===== 삭제 모달 UI (이름 한번 더 입력해야 버튼 활성화) =====
type DeleteUiProps = {
  open: boolean;
  target: VendorDeleteTarget | null;
  onClose: () => void;
  onConfirm: () => void;
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

export const VendorDeleteUi: React.FC<DeleteUiProps> = ({ open, target, onClose, onConfirm }) => {
  const [typing, set_typing] = React.useState("");
  React.useEffect(() => {
    if (open) set_typing("");
  }, [open]);

  if (!open || !target) return null;
  const need = (target.name || "").trim();
  const can = typing.trim() === need;

  return (
    <div style={overlay_style} onClick={onClose}>
      <div style={modal_style} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ margin: "0 0 10px 0", color: "#b91c1c" }}>거래처 삭제</h3>
        <div style={row_style}>
          정말로 <b>{need}</b> 을(를) 삭제하시겠습니까?
        </div>
        <div style={{ ...row_style, fontSize: 12, color: "#6b7280" }}>
          계속하려면 아래 입력란에 <b>{need}</b> 을(를) 정확히 입력하세요.
        </div>
        <input
          type="text"
          value={typing}
          onChange={(e) => set_typing(e.target.value)}
          placeholder={need}
          style={input_style}
        />

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 12 }}>
          <button type="button" onClick={onClose}>
            취소
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!can}
            style={{
              background: can ? "#ef4444" : "#fca5a5",
              color: "#fff",
              padding: "6px 12px",
              borderRadius: 6,
              border: "none",
              cursor: can ? "pointer" : "not-allowed",
            }}
          >
            삭제
          </button>
        </div>
      </div>
    </div>
  );
};

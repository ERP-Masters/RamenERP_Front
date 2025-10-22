// src/pages/BranchEditFunction.tsx
/* @refresh reload */
import React from "react";

/* ===== 타입 ===== */
export type BranchEditTarget = {
  branch_id: number;            // ← 전달/식별용(화면에는 표시하지 않음)
  name: string;
  location: string;
  detail_address: string;
  store_owner: string;
  contact: string;
  // 읽기 전용(서버가 관리) — 화면에 표시하지 않음
  issued?: string | null;
  created_at?: string;
};

/* ===== 서버에 PUT 요청 ===== */
export async function putBranch(data: BranchEditTarget) {
  const res = await fetch(`/api/branches/${data.branch_id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      // 수정 가능한 필드만 보냄
      name: data.name?.trim() ?? "",
      location: data.location?.trim() ?? "",
      detail_address: data.detail_address?.trim() ?? "",
      store_owner: data.store_owner?.trim() ?? "",
      contact: String(data.contact ?? "").trim(),
      // issued/created_at 은 서버에서 관리하므로 전송하지 않음
    }),
  });

  const raw = await res.text().catch(() => "");
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const j = raw ? JSON.parse(raw) : null;
      msg = j?.message || msg;
    } catch {}
    throw new Error(msg);
  }

  // ✅ 응답 파싱 (204 대비)
  let updated: BranchEditTarget;
  if (raw) {
    try {
      updated = JSON.parse(raw);
    } catch {
      // 예외적으로 잘못된 JSON이 오면 기존 값으로 대체
      updated = { ...data };
    }
  } else {
    // 204(No Content) → 기존 값으로 구성
    updated = { ...data };
  }

  // ✅ branch_id 를 숫자로 ‘반드시’ 정규화 (문자열로 오면 리스트 갱신이 안 보일 수 있음)
  const uid = Number((updated as any)?.branch_id ?? data.branch_id);
  (updated as any).branch_id = uid;

  // ✅ issued/created_at 이 응답에 없으면 기존 값 유지(선택)
  if (updated.issued === undefined) updated.issued = data.issued ?? null;
  if (!updated.created_at) updated.created_at = data.created_at;

  /* ✅ 저장 즉시 리스트가 갱신되도록 브로드캐스트 */
  window.dispatchEvent(new CustomEvent("branch:edited", { detail: updated }));

  return updated;
}

/* ===== 수정 모달 UI ===== */
type EditUiProps = {
  open: boolean;
  target: BranchEditTarget | null;
  onClose: () => void;
  onSubmit: (data: BranchEditTarget) => void;
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
  width: 520,
  maxWidth: "94vw",
  background: "#fff",
  borderRadius: 8,
  boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
  padding: 16,
  boxSizing: "border-box",
  fontSize: "clamp(12px, 1.05vw, 16px)",
};

const row_style: React.CSSProperties = { display: "grid", gap: 6, marginBottom: 10 };
const label_style: React.CSSProperties = { color: "#6b7280", fontWeight: 600 };
const input_style: React.CSSProperties = {
  width: "100%",
  height: 40,
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid #e6e8ec",
  outline: "none",
  boxSizing: "border-box",
  background: "#fff",
};
const select_style: React.CSSProperties = { ...input_style, height: 40 };

const foot_style: React.CSSProperties = {
  display: "flex",
  gap: 8,
  justifyContent: "flex-end",
  marginTop: 12,
};
const dark_btn: React.CSSProperties = {
  background: "#111827",
  color: "#fff",
  padding: "10px 14px",
  borderRadius: 10,
  border: "1px solid #111827",
  cursor: "pointer",
  height: 42,
};
const ghost_btn: React.CSSProperties = {
  background: "#fff",
  color: "#111827",
  padding: "10px 14px",
  borderRadius: 10,
  border: "1px solid #e6e8ec",
  cursor: "pointer",
  height: 42,
};

/* 작은 회색 ‘도로명 주소 검색’ 버튼 */
const addr_btn: React.CSSProperties = {
  height: 34,
  padding: "0 10px",
  borderRadius: 8,
  border: "1px solid #e5e7eb",
  background: "#f3f4f6",
  color: "#374151",
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const two_col: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 10,
};

const addr_row: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "auto 120px",
  gap: 8,
  alignItems: "center",
};

const ensurePostcodeScript = () => {
  const w = window as any;
  if (w?.daum?.Postcode) return;
  const s = document.createElement("script");
  s.src = "https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
  s.async = true;
  document.body.appendChild(s);
};

const BranchEditUi: React.FC<EditUiProps> = ({ open, target, onClose, onSubmit }) => {
  const [local, set_local] = React.useState<BranchEditTarget | null>(target);
  const [submitting, set_submitting] = React.useState(false);
  const detailRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    set_local(target);
  }, [target, open]);

  React.useEffect(() => {
    if (open) ensurePostcodeScript();
  }, [open]);

  if (!open || !local) return null;

  const open_address_search = () => {
    const d: any = (window as any).daum;
    if (!d?.Postcode) {
      alert("주소 검색 로딩 중입니다. 잠시 후 다시 시도해 주세요.");
      return;
    }
    new d.Postcode({
      oncomplete: (data: any) => {
        const road = data.roadAddress || "";
        set_local({ ...local, location: road });
        setTimeout(() => detailRef.current?.focus(), 0);
      },
    }).open();
  };

  const save = async () => {
    if (submitting) return;
    const trimmed: BranchEditTarget = {
      ...local,
      name: local.name.trim(),
      location: local.location.trim(),
      detail_address: local.detail_address.trim(),
      store_owner: local.store_owner.trim(),
      contact: String(local.contact ?? "").trim(),
    };
    if (!trimmed.name || !trimmed.location || !trimmed.detail_address || !trimmed.store_owner || !trimmed.contact) {
      alert("필수 항목을 모두 입력해 주세요.");
      return;
    }
    try {
      set_submitting(true);
      await onSubmit(trimmed);
    } finally {
      set_submitting(false);
    }
  };

  return (
    <div style={overlay_style} onClick={onClose}>
      <div style={modal_style} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ margin: "0 0 12px 0", fontWeight: 800 }}>지점 정보 수정</h3>

        {/* ※ 브랜치 ID / issued / created_at은 화면에서 표시하지 않음 */}

        <div style={row_style}>
          <label style={label_style}>지점명</label>
          <input
            style={input_style}
            type="text"
            value={local.name}
            onChange={(e) => set_local({ ...local, name: e.target.value })}
            placeholder="예) 강서방화사거리점"
          />
        </div>

        <div style={row_style}>
          <label style={label_style}>도로명 주소</label>
          <div style={addr_row}>
            <input
              style={input_style}
              type="text"
              value={local.location}
              onChange={(e) => set_local({ ...local, location: e.target.value })}
              placeholder="예) 서울특별시 강서구 ..."
            />
            <button type="button" style={addr_btn} onClick={open_address_search}>
              도로명 주소 검색
            </button>
          </div>
        </div>

        <div style={row_style}>
          <label style={label_style}>상세 주소</label>
          <input
            ref={detailRef}
            style={input_style}
            type="text"
            value={local.detail_address}
            onChange={(e) => set_local({ ...local, detail_address: e.target.value })}
            placeholder="예) 10길 32, 3층"
          />
        </div>

        <div style={two_col}>
          <div style={row_style}>
            <label style={label_style}>점장명</label>
            <input
              style={input_style}
              type="text"
              value={local.store_owner}
              onChange={(e) => set_local({ ...local, store_owner: e.target.value })}
              placeholder="예) 한승훈"
            />
          </div>

          <div style={row_style}>
            <label style={label_style}>연락처</label>
            <input
              style={input_style}
              type="text"
              value={local.contact}
              onChange={(e) => set_local({ ...local, contact: e.target.value })}
              placeholder="예) 010-1234-5678"
            />
          </div>
        </div>

        <div style={foot_style}>
          <button type="button" style={ghost_btn} onClick={onClose}>취소</button>
          <button
            type="button"
            style={{ ...dark_btn, opacity: submitting ? 0.7 : 1 }}
            onClick={save}
            disabled={submitting}
          >
            {submitting ? "저장 중…" : "저장"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BranchEditUi;

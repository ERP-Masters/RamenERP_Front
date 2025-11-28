// src/pages/BranchEditFunction.tsx
/* @refresh reload */
import React from "react";

/* ===== 타입 (직영점용) ===== */
export type BranchEditTarget = {
  /** 실제 PK(id) */
  branch_id: number;            // ← 내부 PK 용
  name: string;
  location: string;
  detail_address: string;
  store_owner: string;
  contact: string;
  // 읽기 전용(서버가 관리) — 화면에 표시하지 않음
  issued?: string | null;
  created_at?: string;
};

export type ApiBranch = {
  id?: number;                  // 내부 DB PK(id)
  branch_id: number | string;   // 화면에 표시되는 ID
  name: string;
  location: string;
  detail_address: string;
  store_owner: string;
  contact: string;
  created_at: string;           // ISO
  isused?: string | null;
};

/* ===== 서버에 PUT 요청 (창고 로직 그대로 변형) ===== */
export async function putBranch(data: BranchEditTarget): Promise<ApiBranch> {
  const {
    branch_id: pk_id,
    name,
    location,
    detail_address,
    store_owner,
    contact,
  } = data;

  const id_num = Number(pk_id);
  if (!Number.isFinite(id_num)) {
    throw new Error("잘못된 지점 PK(id) 입니다.");
  }

  const url = `/api/branches/${id_num}`;
  const res = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    // ✅ 창고와 동일: 수정 시에도 기본 isused는 "USED"로 전송
    body: JSON.stringify({
      name,
      location,
      detail_address,
      store_owner,
      contact,
      isused: "USED",
    }),
  });

  const text = await res.text().catch(() => "");
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const j = text ? JSON.parse(text) : null;
      msg = j?.message || msg;
    } catch {}
    if (res.status === 404) throw new Error(`지점(id=${id_num})을 찾을 수 없습니다.`);
    throw new Error(msg);
  }

  // ✅ 창고 코드 패턴 그대로: 응답이 없으면 기본값으로 구성
  return text
    ? (JSON.parse(text) as ApiBranch)
    : ({
        branch_id: pk_id,
        name,
        location,
        detail_address,
        store_owner,
        contact,
        created_at: "",
        isused: "USED",
      } as ApiBranch);
}

/* ===== 수정 모달 UI (기존 코드 그대로) ===== */
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

const BranchEditFunction: React.FC<EditUiProps> = ({ open, target, onClose, onSubmit }) => {
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
    if (
      !trimmed.name ||
      !trimmed.location ||
      !trimmed.detail_address ||
      !trimmed.store_owner ||
      !trimmed.contact
    ) {
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
            onChange={(e) =>
              set_local({ ...local, detail_address: e.target.value })
            }
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
              onChange={(e) =>
                set_local({ ...local, store_owner: e.target.value })
              }
              placeholder="예) 한승훈"
            />
          </div>

          <div style={row_style}>
            <label style={label_style}>연락처</label>
            <input
              style={input_style}
              type="text"
              value={local.contact}
              onChange={(e) =>
                set_local({ ...local, contact: e.target.value })
              }
              placeholder="예) 010-1234-5678"
            />
          </div>
        </div>

        <div style={foot_style}>
          <button type="button" style={ghost_btn} onClick={onClose}>
            취소</button>
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

export default BranchEditFunction;

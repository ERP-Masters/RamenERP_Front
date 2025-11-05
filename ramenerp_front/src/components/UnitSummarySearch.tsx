// src/components/UnitSummarySearch.tsx
import React, { useEffect, useMemo, useState } from "react";

type ApiUnit = { unit_id: number | string; code: string; name: string; is_active?: boolean | null };

const ui_tok = {
  bg_page: "#f6f7f9",
  surface: "#ffffff",
  border: "#e6e8ec",
  header_bg: "#f8fafc",
  text: "#111827",
  label: "#6b7280",
  radius: 12,
} as const;

const overlay_style: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.35)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 9999,
};

const modal_style: React.CSSProperties = {
  width: "min(720px, 94vw)",
  maxHeight: "90vh",
  overflow: "hidden",
  background: "#fff",
  border: `1px solid ${ui_tok.border}`,
  borderRadius: ui_tok.radius,
  boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
  display: "flex",
  flexDirection: "column",
};

const header_style: React.CSSProperties = {
  padding: "12px 16px",
  borderBottom: `1px solid ${ui_tok.border}`,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
};

const body_style: React.CSSProperties = { padding: 16, display: "grid", gap: 12 };
const row_style: React.CSSProperties = { display: "flex", alignItems: "center", gap: 8 };
const label_style: React.CSSProperties = { color: ui_tok.label, fontWeight: 700, whiteSpace: "nowrap" };

const input_style: React.CSSProperties = {
  height: 40,
  padding: "0 12px",
  minWidth: 260,
  borderRadius: 10,
  border: `1px solid ${ui_tok.border}`,
  outline: "none",
  background: "#fff",
  flex: "1 1 auto",
};

const btn_base: React.CSSProperties = {
  height: 40,
  padding: "0 14px",
  borderRadius: 10,
  border: `1px solid ${ui_tok.border}`,
  cursor: "pointer",
  whiteSpace: "nowrap",
};
const primary_btn: React.CSSProperties = { ...btn_base, background: "#111827", color: "#fff" };
const gray_btn: React.CSSProperties = { ...btn_base, background: "#6b7280", color: "#fff" };

const table_wrap_style: React.CSSProperties = { borderTop: `1px solid ${ui_tok.border}`, overflow: "auto", maxHeight: "52vh" };
const table_style = { width: "100%", borderCollapse: "separate" as const, borderSpacing: 0 } as const;
const th_style: React.CSSProperties = {
  padding: "10px 8px",
  textAlign: "left",
  background: ui_tok.header_bg,
  borderBottom: `1px solid ${ui_tok.border}`,
  fontSize: 13,
  fontWeight: 700,
  position: "sticky",
  top: 0,
  zIndex: 1,
};
const td_style: React.CSSProperties = {
  borderBottom: `1px solid ${ui_tok.border}`,
  padding: "10px 8px",
  textAlign: "left",
  whiteSpace: "nowrap",
  fontSize: 14,
};
const empty_style = { padding: 16, color: ui_tok.label, textAlign: "center" } as const;

function toDisplayId(u: ApiUnit): string {
  const any = u as any;
  return (typeof any.unit_id === "string" && any.unit_id) || (typeof any.id === "string" && any.id) || String(any.unit_id ?? "");
}
function toNumericTail(disp: string): string {
  return (disp.match(/\d+$/)?.[0] ?? "");
}
function toNumericId(v: any): number {
  if (typeof v === "number") return v;
  const m = String(v ?? "").match(/\d+$/);
  return m ? Number(m[0]) : NaN;
}

export default function UnitSummarySearch({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [query, set_query] = useState("");
  const [is_loading, set_is_loading] = useState(false);
  const [error_message, set_error_message] = useState("");
  const [all, set_all] = useState<ApiUnit[]>([]);         // 전체 목록
  const [serverFetched, set_serverFetched] = useState(false);

  // 모달 열릴 때 1회 전체 목록 로드 → 라이브 필터링
  useEffect(() => {
    if (!open) {
      set_query("");
      set_error_message("");
      set_is_loading(false);
      return;
    }
    let aborted = false;
    (async () => {
      set_is_loading(true);
      set_error_message("");
      try {
        const res = await fetch(`/api/units`, { headers: { Accept: "application/json" } });
        const text = await res.text();
        if (!res.ok) {
          let msg = `HTTP ${res.status}`;
          try { msg = (text ? JSON.parse(text) : null)?.message || msg; } catch {}
          throw new Error(msg);
        }
        if (!aborted) {
          const list: ApiUnit[] = text ? JSON.parse(text) : [];
          set_all(Array.isArray(list) ? list : []);
          set_serverFetched(true);
        }
      } catch (e: any) {
        if (!aborted) set_error_message(e?.message || "목록을 불러오지 못했습니다.");
      } finally {
        if (!aborted) set_is_loading(false);
      }
    })();
    return () => { aborted = true; };
  }, [open]);

  // 필터링 규칙:
  // - query가 숫자만: 끝자리 숫자 == query 이거나 숫자형 ID == Number(query)
  // - 그 외(문자 포함): 표시용 ID가 query로 시작(대소문자 무시)
  const filtered = useMemo(() => {
    const q = query.trim();
    if (!q) return [] as ApiUnit[];
    const list = all;
    const isDigits = /^\d+$/.test(q);

    if (isDigits) {
      return list.filter((u) => {
        const disp = toDisplayId(u);
        const tail = toNumericTail(disp);
        const numId = toNumericId(u.unit_id);
        return tail === q || (Number.isFinite(numId) && String(numId) === q);
      });
    } else {
      const lower = q.toLowerCase();
      return list.filter((u) => toDisplayId(u).toLowerCase().startsWith(lower));
    }
  }, [all, query]);

  // 🔽🔽🔽 단위 이름(name)으로도 검색되는 결과 추가 (기존 로직 유지 + 추가만) 🔽🔽🔽
  const filteredByName = useMemo(() => {
    const q = query.trim();
    if (!q) return [] as ApiUnit[];

    const lower = q.toLowerCase();

    // 이름에 query 포함되는 항목 (문자/숫자 상관없이)
    return all.filter((u) => (u.name ?? "").toLowerCase().includes(lower));
  }, [all, query]);
  // 🔼🔼🔼 여기까지 추가 코드 🔼🔼🔼

  // 숫자만 입력했을 때 Enter를 치면 서버 단건 조회도 병행 (정확도 보강)
  const preciseFetch = async () => {
    const q = query.trim();
    if (!q || !/^\d+$/.test(q)) return;
    try {
      set_is_loading(true);
      const res = await fetch(`/api/units/${encodeURIComponent(q)}`, { headers: { Accept: "application/json" } });
      const text = await res.text();
      if (res.ok && text) {
        const data = JSON.parse(text);
        const arr: ApiUnit[] = Array.isArray(data) ? data : data ? [data] : [];
        // 동일 항목 중복 제거
        const dispSet = new Set(arr.map(toDisplayId));
        const merged = [...arr, ...filtered.filter((u) => !dispSet.has(toDisplayId(u)))];
        set_all((prev) => {
          const prevDisp = new Set(prev.map(toDisplayId));
          const next = [...prev];
          for (const u of merged) if (!prevDisp.has(toDisplayId(u))) next.push(u);
          return next;
        });
      }
    } finally {
      set_is_loading(false);
    }
  };

  if (!open) return null;

  return (
    <div style={overlay_style} onClick={onClose}>
      <div style={modal_style} onClick={(e) => e.stopPropagation()}>
        <div style={header_style}>
          <strong>단위 ID 조회</strong>
          <button type="button" style={gray_btn} onClick={onClose}>닫기</button>
        </div>

        <div style={body_style}>
          <div style={row_style}>
            <span style={label_style}>단위 ID</span>
            <input
              type="text"
              value={query}
              onChange={(e) => set_query(e.target.value)}
              placeholder="예) U / UNIT_ / 0001"
              style={input_style}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); preciseFetch(); } }}
            />
            <button type="button" style={primary_btn} onClick={preciseFetch} disabled={!query.trim()}>
              검색
            </button>
          </div>

          {is_loading && <div style={{ color: ui_tok.label }}>불러오는 중…</div>}
          {error_message && <div style={{ color: "#c62828" }}>{error_message}</div>}
          {!serverFetched && !is_loading && <div style={{ color: ui_tok.label }}>목록 초기 로딩 전입니다…</div>}

          <div style={table_wrap_style}>
            <table style={table_style}>
              <thead>
                <tr>
                  <th style={th_style}>unit_id</th>
                  <th style={th_style}>code</th>
                  <th style={th_style}>name</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u, idx) => (
                  <tr key={`${toDisplayId(u)}-${idx}`} style={idx % 2 === 1 ? { background: "#fafafa" } : undefined}>
                    <td style={td_style}>{toDisplayId(u)}</td>
                    <td style={td_style}>{u.code}</td>
                    <td style={td_style}>{u.name}</td>
                  </tr>
                ))}
                {/* 🔽 이름으로만 매칭되는 항목 추가 렌더링 (기존 코드 아래에 추가) */}
                {filteredByName.map((u, idx) => (
                  <tr
                    key={`name-${toDisplayId(u)}-${idx}`}
                    style={{ background: "#fdf2f8" }} // 살짝 구분되게 해도 되고, 지워도 됨
                  >
                    <td style={td_style}>{toDisplayId(u)}</td>
                    <td style={td_style}>{u.code}</td>
                    <td style={td_style}>{u.name}</td>
                  </tr>
                ))}
                {!filtered.length && serverFetched && !is_loading && !error_message && (
                  <tr><td colSpan={3} style={empty_style}>조회된 결과가 없습니다.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// src/components/CategorySummarySearch.tsx
import React, { useEffect, useMemo, useState } from "react";

type ApiCategory = {
  category_id: number | string;
  group: string;
  category_name: string;
  is_active?: boolean | null;
};

type Row = {
  category_id: number;
  group: string;
  category_name: string;
  display_category_id?: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
};

const ui_tok = {
  border: "#e6e8ec",
  header_bg: "#f8fafc",
  label: "#6b7280",
  text: "#111827",
  surface: "#ffffff",
};

const overlay_style: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.35)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 9999,
};

const panel_style: React.CSSProperties = {
  width: "min(900px, 94vw)",
  maxHeight: "90vh",
  overflow: "hidden",
  background: "#fff",
  border: `1px solid ${ui_tok.border}`,
  borderRadius: 12,
  boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
  display: "flex",
  flexDirection: "column",
};

const head_style: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "12px 14px",
  background: ui_tok.header_bg,
  borderBottom: `1px solid ${ui_tok.border}`,
};

const input_row_style: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "12px 14px",
};

const input_style: React.CSSProperties = {
  height: 40,
  padding: "0 12px",
  minWidth: 260,
  borderRadius: 10,
  border: `1px solid ${ui_tok.border}`,
  outline: "none",
  background: "#fff",
  boxSizing: "border-box",
};

const table_wrap_style = { flex: 1, overflowY: "auto", overflowX: "auto" } as const;
const table_style = { width: "100%", borderCollapse: "separate" as const, borderSpacing: 0 } as const;
const th_style = {
  padding: "12px 10px",
  textAlign: "left" as const,
  background: ui_tok.header_bg,
  borderBottom: `1px solid ${ui_tok.border}`,
  fontSize: 13,
  fontWeight: 700,
} as const;
const td_style = {
  borderBottom: `1px solid ${ui_tok.border}`,
  padding: 12,
  textAlign: "left" as const,
  whiteSpace: "nowrap" as const,
} as const;
const empty_style = { padding: 16, color: ui_tok.label } as const;

const to_num_id = (v: any): number => {
  if (typeof v === "number") return v;
  const m = String(v ?? "").match(/\d+$/);
  return m ? Number(m[0]) : NaN;
};

const to_row = (c: ApiCategory): Row => {
  const display =
    (typeof (c as any)?.display_category_id === "string" && (c as any).display_category_id) ||
    (typeof c.category_id === "string" && String(c.category_id)) ||
    (typeof (c as any)?.id === "string" && String((c as any).id)) ||
    String(c.category_id ?? "");
  return {
    category_id: to_num_id((c as any).category_id),
    group: String(c.group ?? "").trim(),
    category_name: String(c.category_name ?? "").trim(),
    ...(display ? { display_category_id: display } : {}),
  };
};

const CategorySummarySearch: React.FC<Props> = ({ open, onClose }) => {
  const [query, set_query] = useState("");
  const [list, set_list] = useState<Row[]>([]);
  const [is_loading, set_is_loading] = useState(false);
  const [error_message, set_error_message] = useState("");

  // 모달 열릴 때 1회 전체 목록 로드(클라이언트 필터링)
  useEffect(() => {
    if (!open) return;
    let aborted = false;
    (async () => {
      set_is_loading(true);
      set_error_message("");
      try {
        const res = await fetch("/api/category", { headers: { Accept: "application/json" } });
        const raw = await res.text();
        if (!res.ok) {
          let msg = `HTTP ${res.status}`;
          try { msg = (raw ? JSON.parse(raw) : null)?.message || msg; } catch {}
          throw new Error(msg);
        }
        const arr: ApiCategory[] = raw ? JSON.parse(raw) : [];
        if (!aborted) set_list((Array.isArray(arr) ? arr : []).map(to_row));
      } catch (e: any) {
        if (!aborted) set_error_message(e?.message || "카테고리 목록을 불러오는 중 오류가 발생했습니다.");
      } finally {
        if (!aborted) set_is_loading(false);
      }
    })();
    return () => { aborted = true; };
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim();
    if (!q) return [];
    // 숫자만 → ID 끝 4자리(또는 입력 숫자)와 정확히 일치하는 항목만
    if (/^\d+$/.test(q)) {
      const re = new RegExp(`${q}$`);
      return list.filter((r) => {
        const id_str = (r as any).display_category_id ?? String(r.category_id);
        return re.test(String(id_str));
      });
    }
    // 그 외 → ID가 해당 문자열로 시작
    const up = q.toUpperCase();
    return list.filter((r) => {
      const id_str = ((r as any).display_category_id ?? String(r.category_id)).toUpperCase();
      return id_str.startsWith(up);
    });
  }, [list, query]);

  // 🔽🔽🔽 추가: 카테고리 이름으로도 검색되는 목록 (기존 filtered는 그대로 둠) 🔽🔽🔽
  const filteredByName = useMemo(() => {
    const q = query.trim();
    if (!q) return [] as Row[];
    const lower = q.toLowerCase();
    return list.filter((r) => r.category_name.toLowerCase().includes(lower));
  }, [list, query]);

  // ID 중복 방지용 Set (기존 filtered 기반)
  const filteredKeySet = useMemo(() => {
    const s = new Set<string>();
    filtered.forEach((r) => {
      const key = (r as any).display_category_id ?? String(r.category_id);
      s.add(String(key));
    });
    return s;
  }, [filtered]);
  // 🔼🔼🔼 여기까지 "추가된" 코드, 기존 로직은 그대로 🔼🔼🔼

  if (!open) return null;

  return (
    <div style={overlay_style} onClick={onClose}>
      <div style={panel_style} onClick={(e) => e.stopPropagation()}>
        <div style={head_style}>
          <strong style={{ color: ui_tok.text }}>카테고리 ID 조회</strong>
          <button
            type="button"
            onClick={onClose}
            style={{ padding: "6px 10px", borderRadius: 8, border: `1px solid ${ui_tok.border}`, background: "#fff", cursor: "pointer" }}
          >
            닫기
          </button>
        </div>

        <div style={input_row_style}>
          <input
            style={input_style}
            placeholder="예) C / CT_ / CT_0001 / 0001 / 카테고리명"
            value={query}
            onChange={(e) => set_query(e.target.value)}
          />
          <span style={{ color: ui_tok.label, fontSize: 12 }}>
            숫자만 입력하면 끝자리 숫자와 정확히 일치하는 항목만 표시
          </span>
        </div>

        {is_loading && <div style={{ padding: 12, color: ui_tok.label }}>불러오는 중…</div>}
        {error_message && <div style={{ padding: 12, color: "#c62828" }}>{error_message}</div>}

        <div style={table_wrap_style}>
          <table style={table_style}>
            <thead>
              <tr>
                <th style={th_style}>category_id</th>
                <th style={th_style}>group</th>
                <th style={th_style}>category_name</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, idx) => (
                <tr key={`${(r as any).display_category_id ?? r.category_id}-${idx}`}>
                  <td style={td_style}>{(r as any).display_category_id ?? r.category_id}</td>
                  <td style={td_style}>{r.group}</td>
                  <td style={td_style}>{r.category_name}</td>
                </tr>
              ))}
              {/* 🔽 추가: 이름으로만 매칭되는 행들 (ID 중복은 제외) */}
              {filteredByName.map((r, idx) => {
                const key = (r as any).display_category_id ?? r.category_id;
                if (filteredKeySet.has(String(key))) return null;
                return (
                  <tr key={`name-${key}-${idx}`} style={{ background: "#fdf2ff" }}>
                    <td style={td_style}>{(r as any).display_category_id ?? r.category_id}</td>
                    <td style={td_style}>{r.group}</td>
                    <td style={td_style}>{r.category_name}</td>
                  </tr>
                );
              })}
              {!filtered.length && !is_loading && !error_message && (
                <tr>
                  <td colSpan={3} style={empty_style}>검색 결과가 없습니다.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CategorySummarySearch;

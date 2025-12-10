// src/pages/NotUsedBranchPageUi.tsx
import React, { useEffect, useState } from "react";
import { fetchNotUsedBranches, type ApiBranch } from "../function/BranchNotUsedFunction";
import { markManyBranchesUsed } from "../../branch/function/BranchUsedFunction";

/** 화면 표시에만 쓰는 행 타입
 *  - id: 내부 DB PK
 *  - branch_id: 화면 표시되는 문자열 ID
 */
type Row = {
  id?: number;            // 서버 PK (PUT 에 쓸 값은 나중에 branch_id -> id 매핑에서 얻음)
  branch_id: string;      // 화면 표시용 문자열 ID
  name: string;
  location: string;
  detail_address: string;
  store_owner: string;
  contact: string;
  created_at: string;
};

const ui_tok = {
  bg_page: "#f6f7f9",
  surface: "#ffffff",
  border: "#e6e8ec",
  header_bg: "#f8fafc",
  zebra: "#fafafa",
  text: "#111827",
  label: "#6b7280",
  radius: 12,
} as const;

const page_wrap_style: React.CSSProperties = {
  background: ui_tok.bg_page,
  minHeight: "100%",
  padding: "24px 16px",
};
const page_style = { padding: 16, maxWidth: 1200, margin: "0 auto" } as const;

const title_style: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 800,
  color: ui_tok.text,
  margin: "0 0 12px 0",
};

const table_card_style: React.CSSProperties = {
  border: `1px solid ${ui_tok.border}`,
  borderRadius: ui_tok.radius,
  background: ui_tok.surface,
  display: "flex",
  flexDirection: "column",
  maxHeight: "60vh",
  overflow: "hidden",
  marginTop: 12,
};

const table_scroll_style = { flex: 1, overflowY: "auto", overflowX: "auto" } as const;

const table_style = { width: "100%", borderCollapse: "separate" as const, borderSpacing: 0 } as const;
const th_style = {
  padding: "10px 8px",
  textAlign: "left" as const,
  background: ui_tok.header_bg,
  borderBottom: `1px solid ${ui_tok.border}`,
  fontSize: 13,
  fontWeight: 700,
  position: "sticky" as const,
  top: 0,
  zIndex: 1,
} as const;
const td_style = {
  borderBottom: `1px solid ${ui_tok.border}`,
  padding: "10px 8px",
  textAlign: "left" as const,
  whiteSpace: "nowrap" as const,
  fontSize: 14,
} as const;

const empty_style = { padding: 24, textAlign: "center", color: ui_tok.label } as const;

const top_bar_style: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-start",
  gap: 8,
  marginBottom: 8,
  transform: "translateY(4px)",
};

const select_btn_style: React.CSSProperties = {
  height: 32,
  padding: "0 12px",
  borderRadius: 8,
  border: `1px solid ${ui_tok.border}`,
  background: "#9ca3af",
  color: "#fff",
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const use_btn_style: React.CSSProperties = {
  height: 32,
  padding: "0 12px",
  borderRadius: 8,
  border: `1px solid ${ui_tok.border}`,
  background: "#111827",
  color: "#fff",
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const NotUsedBranchPageUi: React.FC = () => {
  const [rows, set_rows] = useState<Row[]>([]);
  const [loading, set_loading] = useState(false);
  const [error, set_error] = useState("");
  const [select_mode, set_select_mode] = useState(false);

  /** 체크박스 상태를 'branch_id 문자열' 키로 관리 */
  const [checked, set_checked] = useState<Record<string, boolean>>({});

  // 각 행의 고유 키: 화면용 branch_id 그대로 사용
  const row_key = (r: Row) => r.branch_id;

  /** ApiBranch → Row 변환
   *  - id: 응답 JSON 의 id (PK) 있으면 보관
   *  - branch_id: 화면에 보이는 문자열 코드
   */
  const to_row = (b: ApiBranch): Row => {
    const anyB = b as any;

    // 내부 PK (있으면 저장)
    let pk: number | undefined;
    if (typeof anyB.id === "number") pk = anyB.id;
    else if (typeof anyB.id === "string" && /^\d+$/.test(anyB.id)) pk = Number(anyB.id);

    const code =
      (typeof anyB.branch_id === "string" && anyB.branch_id) ||
      (typeof anyB.display_branch_id === "string" && anyB.display_branch_id) ||
      String(anyB.branch_id ?? anyB.id ?? "");

    return {
      id: pk,
      branch_id: code,
      name: String(anyB.name ?? "").trim(),
      location: String(anyB.location ?? "").trim(),
      detail_address: String(anyB.detail_address ?? "").trim(),
      store_owner: String(anyB.store_owner ?? "").trim(),
      contact: String(anyB.contact ?? "").trim(),
      created_at: String(anyB.created_at ?? "").trim(),
    };
  };

  const load = async () => {
    set_loading(true);
    set_error("");
    try {
      const list = await fetchNotUsedBranches();
      set_rows((Array.isArray(list) ? list : []).map(to_row));
      set_checked({});
    } catch (e: any) {
      set_error(e?.message || "미사용 직영점 목록을 불러오지 못했습니다.");
    } finally {
      set_loading(false);
    }
  };

  /** ✅ branch_id(문자열 코드) 배열 → 실제 PK id 배열
   *    여기서 /api/branches/state 를 사용해서 매핑한다.
   */
  const resolvePkIds = async (codes: string[]): Promise<number[]> => {
    const res = await fetch("/api/branches/state", {
      method: "GET",
      headers: { Accept: "application/json" },
    });
    const text = await res.text();
    if (!res.ok) {
      throw new Error(text || `HTTP ${res.status}`);
    }
    const data = text ? JSON.parse(text) : null;

    const raw: any[] = Array.isArray(data)
      ? data
      : data && Array.isArray((data as any).items)
      ? (data as any).items
      : [];

    // 코드 → PK(id) 매핑 (state 에서만 가져옴)
    const map: Record<string, number> = {};
    for (const b of raw) {
      const anyB = b as any;

      const code =
        (typeof anyB.branch_id === "string" && anyB.branch_id) ||
        (typeof anyB.display_branch_id === "string" && anyB.display_branch_id) ||
        String(anyB.branch_id ?? anyB.id ?? "");

      let pk: number | null = null;
      if (typeof anyB.id === "number") pk = anyB.id;
      else if (typeof anyB.id === "string" && /^\d+$/.test(anyB.id)) pk = Number(anyB.id);
      else if (typeof anyB.branch_id === "number") pk = anyB.branch_id;
      else if (typeof anyB.branch_id === "string" && /^\d+$/.test(anyB.branch_id)) {
        pk = Number(anyB.branch_id);
      }

      if (code && pk !== null && Number.isFinite(pk)) {
        map[code] = pk;
      }
    }

    const result: number[] = [];
    for (const c of codes) {
      const pk = map[c];
      if (Number.isFinite(pk)) result.push(pk);
    }
    return result;
  };

  /** 선택된 행들의 branch_id(문자열 코드) 배열 */
  const selected_codes = () =>
    rows.filter((r) => checked[row_key(r)]).map((r) => r.branch_id);

  // “사용” — 낙관적 제거 + 서버 반영 + 재동기화
  const handle_restore_use = async () => {
    const codes = selected_codes();
    if (codes.length === 0) {
      alert("선택된 지점이 없습니다. 선택을 확인해주세요.");
      return;
    }

    // 1) /api/branches/state 에서 같은 branch_id 가진 레코드의 PK id 찾기
    let ids: number[];
    try {
      ids = await resolvePkIds(codes);
    } catch (e: any) {
      alert(e?.message || "지점 ID 해석 중 오류가 발생했습니다.");
      return;
    }

    if (ids.length === 0) {
      alert("숫자형 id 를 찾을 수 없습니다. (state 기준 매핑 실패)");
      return;
    }

    const msg =
      ids.length === 1
        ? "1개 지점을 사용 등록하시겠습니까?"
        : `${ids.length}개 지점을 사용 등록하시겠습니까?`;
    if (!window.confirm(msg)) return;

    // 2) 화면 즉시 제거 — 체크된 행 전부 삭제 (branch_id 기준)
    const remove_keys = new Set<string>(codes);
    set_rows((prev) => prev.filter((r) => !remove_keys.has(r.branch_id)));
    set_checked((prev) => {
      const next = { ...prev };
      remove_keys.forEach((k) => delete next[k]);
      return next;
    });

    try {
      set_loading(true);
      // 3) 서버 반영(USED) — PK id 로만 호출 (PUT /api/branches/:id { isused: "USED" })
      await markManyBranchesUsed(ids);
      // 4) 재동기화
      await load();
      set_select_mode(false);
      alert("사용으로 전환되었습니다.");
    } catch (e: any) {
      alert(e?.message || "전환 중 오류가 발생했습니다.");
      await load();
    } finally {
      set_loading(false);
    }
  };

  useEffect(() => {
    load();
    const onNotUsed = () => load();
    const onRestored = () => load();
    window.addEventListener("branch:notused:updated", onNotUsed);
    window.addEventListener("branch:used:restored", onRestored);
    return () => {
      window.removeEventListener("branch:notused:updated", onNotUsed);
      window.removeEventListener("branch:used:restored", onRestored);
    };
  }, []);

  // 선택 모드 토글 시 체크 초기화 (UX 개선)
  const toggle_select_mode = () => {
    set_select_mode((v) => {
      const next = !v;
      if (!next) set_checked({});
      return next;
    });
  };

  return (
    <div style={page_wrap_style}>
      <div style={page_style}>
        <div style={title_style}>미사용 직영점 리스트</div>

        <div style={top_bar_style}>
          <button
            type="button"
            style={select_btn_style}
            onClick={toggle_select_mode}
            title="선택 모드"
          >
            {select_mode ? "선택 해제" : "선택"}
          </button>

          {select_mode && (
            <button
              type="button"
              style={use_btn_style}
              onClick={handle_restore_use}
              title="사용으로 전환"
            >
              사용
            </button>
          )}
        </div>

        <div style={table_card_style}>
          <div style={table_scroll_style}>
            <table style={table_style}>
              <thead>
                <tr>
                  {select_mode && <th style={th_style} />}
                  <th style={th_style}>지점 ID</th>
                  <th style={th_style}>지점명</th>
                  <th style={th_style}>위치</th>
                  <th style={th_style}>상세주소</th>
                  <th style={th_style}>지점장</th>
                  <th style={th_style}>연락처</th>
                  <th style={th_style}>개점 일시</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, idx) => {
                  const key = row_key(r);
                  return (
                    <tr
                      key={key}
                      style={idx % 2 === 1 ? { background: ui_tok.zebra } : undefined}
                      title={`${r.name} · ${r.location} · ${r.detail_address}`}
                    >
                      {select_mode && (
                        <td style={{ ...td_style, position: "relative" }}>
                          <input
                            type="checkbox"
                            checked={!!checked[key]}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) =>
                              set_checked((prev) => ({ ...prev, [key]: e.target.checked }))
                            }
                          />
                        </td>
                      )}
                      <td style={td_style}>{r.branch_id}</td>
                      <td style={td_style}>{r.name}</td>
                      <td style={td_style}>{r.location}</td>
                      <td style={td_style}>{r.detail_address}</td>
                      <td style={td_style}>{r.store_owner}</td>
                      <td style={td_style}>{r.contact}</td>
                      <td style={td_style}>{r.created_at}</td>
                    </tr>
                  );
                })}

                {rows.length === 0 && !loading && !error && (
                  <tr>
                    {/* 열 개수: 선택모드 8, 기본 7 */}
                    <td
                      style={{
                        ...empty_style,
                        padding: "6px 8px",
                      }}
                      colSpan={select_mode ? 8 : 7}
                    >
                      현재 사용되지 않는 지점이 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {loading && <div style={{ padding: 12, color: ui_tok.label }}>불러오는 중…</div>}
          {error && <div style={{ padding: 12, color: "#c62828" }}>{error}</div>}
        </div>
      </div>
    </div>
  );
};

export default NotUsedBranchPageUi;

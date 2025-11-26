// src/pages/BranchListPage.tsx
import React, { useEffect, useState } from "react";
import BranchRegisterPage from "./BranchRegisterPage";
import BranchEditUi, {
  putBranch,
  type BranchEditTarget,
} from "./BranchEditFunction";
import BranchNoutUsedUi from "../components/BranchNotUsedUi";
import { markBranchNotUsed } from "./BranchNotUsedFunction";
import BranchSummarySearch from "../components/BranchSummarySearch";
const BR_API = "/api/branches";
import { ui_tok } from "@/ui/ui_tok";

/* ===== 타입 ===== */
// ⚠️ 내부 DB PK는 id, 화면 표시용 ID는 branch_id
type ApiBranch = {
  branch_id: number | string;
  /** 백엔드가 내려줄 수 있는 실제 PK */
  id?: number;
  name: string;
  location: string;
  detail_address: string;
  store_owner: string;
  contact: string;
  isused?: string | null;
  created_at: string;
};

type Row = {
  /** ✅ 항상 DB PK(id)를 숫자로 보관 (즉시 반영용 기준 키) */
  branch_id: number;
  /** 화면 표시용 문자열 ID(코드) */
  display_branch_id: string;
  name: string;
  location: string;
  detail_address: string;
  store_owner: string;
  contact: string;
  isused?: string | null;
  created_at: string;
};

/* ===== 레이아웃 ===== */
const page_wrap_style: React.CSSProperties = {
  background: ui_tok.bg_page,
  minHeight: "100%",
  padding: "24px 16px",
};
const page_style = { padding: 16, maxWidth: 1200, margin: "0 auto" } as const;

/* 상단 */
const controls_block_style: React.CSSProperties = { marginTop: 4, marginBottom: 12 };
const controls_title_style: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 800,
  color: ui_tok.text,
  margin: "0 0 6px 0",
  transform: "translateY(-20px)",
};
const top_row_style: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
};
const top_controls_style: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
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
const search_btn_style: React.CSSProperties = {
  height: 40,
  padding: "0 14px",
  borderRadius: 10,
  border: `1px solid ${ui_tok.border}`,
  background: "#111827",
  color: "#fff",
  cursor: "pointer",
  whiteSpace: "nowrap",
  fontWeight: 700,
};
const reset_btn_style: React.CSSProperties = {
  ...search_btn_style,
  background: "#6b7280",
};

/* ✅ 창고와 동일 quick 버튼 스타일 */
const id_btn_style: React.CSSProperties = {
  height: 40,
  padding: "0 12px",
  borderRadius: 10,
  border: `1px solid ${ui_tok.border}`,
  background: "#111827",
  color: "#fff",
  cursor: "pointer",
  whiteSpace: "nowrap",
  transform: "translateY(-0.8px)",
  marginLeft: 12,
};

const create_btn_style: React.CSSProperties = {
  height: 40,
  padding: "0 16px",
  borderRadius: 999,
  border: `1px solid ${ui_tok.primary_border}`,
  background: ui_tok.primary_bg,
  color: ui_tok.primary_text,
  fontWeight: 800,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

/* 테이블 카드(높이 고정 + 내부 스크롤) */
const table_card_style: React.CSSProperties = {
  border: `1px solid ${ui_tok.border}`,
  borderRadius: ui_tok.radius,
  background: ui_tok.surface,
  display: "flex",
  flexDirection: "column",
  maxHeight: "60vh",
  overflow: "hidden",
  marginTop: -4,
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
const actions_cell_style: React.CSSProperties = {
  ...td_style,
  display: "flex",
  alignItems: "center",
  gap: 6,
};
const icon_btn_style: React.CSSProperties = {
  background: "transparent",
  border: "none",
  padding: 4,
  cursor: "pointer",
  lineHeight: 0,
};
const empty_style = { padding: 24, textAlign: "center", color: ui_tok.label } as const;

/* ===== 유틸 ===== */
/** ✅ 거래처 리스트와 동일한 개념:
 *  - row.branch_id: 항상 DB PK(id)
 *  - row.display_branch_id: 화면에 보이는 코드(branch_id)
 */
const to_row = (b: ApiBranch): Row => {
  const apiAny = b as any;

  const pk = Number(apiAny.id ?? apiAny.branch_id); // id 우선, 없으면 숫자로 해석 가능한 branch_id
  const stringId =
    (typeof apiAny.branch_id === "string" && apiAny.branch_id) ||
    (typeof apiAny.id === "string" && apiAny.id) ||
    String(apiAny.branch_id ?? apiAny.id ?? "");

  return {
    branch_id: pk,
    display_branch_id: stringId,
    name: String(b.name ?? "").trim(),
    location: String(b.location ?? "").trim(),
    detail_address: String(b.detail_address ?? "").trim(),
    store_owner: String(b.store_owner ?? "").trim(),
    contact: String(b.contact ?? "").trim(),
    isused: b.isused ?? null,
    created_at: String(b.created_at ?? "").trim(),
  };
};

const safeJson = async (res: Response) => {
  const text = await res.text();
  return text ? JSON.parse(text) : null;
};

/* ===== 페이지 ===== */
const BranchListPage: React.FC = () => {
  const [rows, set_rows] = useState<Row[]>([]);
  const [is_loading, set_is_loading] = useState(false);
  const [error_message, set_error_message] = useState("");

  const [query, set_query] = useState("");
  const [regOpen, set_regOpen] = useState(false);
  const [editOpen, set_editOpen] = useState(false);
  const [editTarget, set_editTarget] = useState<BranchEditTarget | null>(null);

  // ✅ 미사용 등록 모달 상태
  const [notUsedOpen, set_notUsedOpen] = useState(false);
  const [notUsedTarget, set_notUsedTarget] = useState<{ branch_id: number; name: string } | null>(null);

  // ✅ 추가: 지점 ID 상세 검색 모달 상태
  const [summaryOpen, set_summaryOpen] = useState(false);

  const load = async (signal?: AbortSignal) => {
    set_is_loading(true);
    set_error_message("");
    try {
      const res = await fetch(`${BR_API}`, {
        method: "GET",
        headers: { Accept: "application/json" },
        signal,
      });
      const j: ApiBranch[] = (await safeJson(res)) ?? [];
      if (!res.ok) throw new Error((j as any)?.message || `HTTP ${res.status}`);
      set_rows((Array.isArray(j) ? j.map(to_row) : []).filter((r) => r.isused !== "NOTUSED"));
    } catch (e: any) {
      if (e?.name !== "AbortError") set_error_message(e?.message || "지점 목록을 불러오는 중 오류가 발생했습니다.");
    } finally {
      set_is_loading(false);
    }
  };

  useEffect(() => {
    const ac = new AbortController();
    load(ac.signal);
    return () => ac.abort();
  }, []);

  useEffect(() => {
    const onCreated = () => {
      set_regOpen(false);
      load();
    };
    const onCancel = () => set_regOpen(false);
    window.addEventListener("branch:created", onCreated);
    window.addEventListener("branch:register:cancel", onCancel);
    return () => {
      window.removeEventListener("branch:created", onCreated);
      window.removeEventListener("branch:register:cancel", onCancel);
    };
  }, []);

  useEffect(() => {
    const onChanged = () => load();
    window.addEventListener("branch:notused:updated", onChanged);
    window.addEventListener("branch:used:restored", onChanged);
    return () => {
      window.removeEventListener("branch:notused:updated", onChanged);
      window.removeEventListener("branch:used:restored", onChanged);
    };
  }, []);

  // ✅ 다른 페이지에서 branch:edited 이벤트를 쏠 수도 있으니 그대로 유지
  useEffect(() => {
    const onEdited = (e: Event) => {
      const v = (e as CustomEvent).detail as Partial<BranchEditTarget> | undefined;
      if (!v || typeof v !== "object") return;
      const vid = (v as any).branch_id;
      if (vid == null) return;

      set_rows((prev) =>
        prev
          .map((r) =>
            Number(r.branch_id) === Number(vid)
              ? {
                  ...r,
                  name: (v as any).name ?? r.name,
                  location: (v as any).location ?? r.location,
                  detail_address: (v as any).detail_address ?? r.detail_address,
                  store_owner: (v as any).store_owner ?? r.store_owner,
                  contact: (v as any).contact ?? r.contact,
                  isused: (v as any).issued ?? r.isused,
                  created_at: (v as any).created_at ?? r.created_at,
                }
              : r
          )
          .filter((r) => r.isused !== "NOTUSED")
      );
    };

    window.addEventListener("branch:edited", onEdited as EventListener);
    return () => window.removeEventListener("branch:edited", onEdited as EventListener);
  }, []);

  const handle_search = async () => {
    const q = query.trim();
    if (!q) {
      load();
      return;
    }

    set_is_loading(true);
    set_error_message("");
    try {
      let res = await fetch(`${BR_API}/search/name/${encodeURIComponent(q)}`, {
        headers: { Accept: "application/json" },
      });
      if (!res.ok) {
        res = await fetch(`${BR_API}/search/location/${encodeURIComponent(q)}`, {
          headers: { Accept: "application/json" },
        });
      }
      if (res.status === 404) {
        set_rows([]);
      } else {
        const data = await safeJson(res);
        if (!res.ok) throw new Error((data as any)?.message || `HTTP ${res.status}`);
        const list: ApiBranch[] = Array.isArray(data) ? data : (data ? [data] : []);
        set_rows(list.map(to_row).filter((r) => r.isused !== "NOTUSED"));
      }
    } catch (e: any) {
      set_error_message(e?.message || "검색 중 오류가 발생했습니다.");
    } finally {
      set_is_loading(false);
    }
  };

  const handle_reset = () => {
    set_query("");
    load();
  };

  // (유지) 프롬프트 기반 단건 검색 함수 — 버튼에서는 사용하지 않지만 남겨둠
  const handle_id_search = async () => {
    const id = window.prompt("검색할 지점 ID를 입력하세요");
    if (!id) return;
    if (!/^\d+$/.test(id)) {
      alert("숫자 ID만 입력할 수 있습니다.");
      return;
    }
    set_is_loading(true);
    set_error_message("");
    try {
      const res = await fetch(`${BR_API}/${encodeURIComponent(id)}`, {
        headers: { Accept: "application/json" },
      });
      if (res.status === 404) {
        set_rows([]);
      } else {
        const item: ApiBranch | ApiBranch[] | null = await safeJson(res);
        if (!res.ok) throw new Error((item as any)?.message || `HTTP ${res.status}`);
        const list: ApiBranch[] = Array.isArray(item) ? item : (item ? [item] : []);
        set_rows(list.map(to_row).filter((r) => r.isused !== "NOTUSED"));
      }
    } catch (e: any) {
      set_error_message(e?.message || "ID 검색 중 오류가 발생했습니다.");
    } finally {
      set_is_loading(false);
    }
  };

  /* ===== 수정 아이콘 동작 ===== */
  const openEdit = (r: Row) => {
    // ✅ target.branch_id는 PK(id)를 그대로 넘김
    const tgt: BranchEditTarget = {
      branch_id: r.branch_id,
      name: r.name,
      location: r.location,
      detail_address: r.detail_address,
      store_owner: r.store_owner,
      contact: r.contact,
      issued: r.isused ?? undefined,
      created_at: r.created_at,
    };
    set_editTarget(tgt);
    set_editOpen(true);
  };
  const closeEdit = () => set_editOpen(false);

  /** ✅ 거래처 리스트의 handleSaved 패턴을 브랜치에 맞게 적용
   *  - 먼저 PK(id) 기준으로 찾고
   *  - 필요하면 표시 ID(branch_id) suffix로 보조 매칭
   */
  const handleSaved = (updated: Partial<ApiBranch> & { id?: number; branch_id?: number | string }) => {
    const pk = Number((updated as any).id ?? (updated as any).branch_id);
    const display = String(
      (updated as any).display_branch_id ??
        (updated as any).branch_id ??
        ""
    );
    const suffix = (display.match(/\d+$/) || [])[0] || "";

    set_rows((prev) =>
      prev
        .map((r) => {
          const matchByPk = Number.isFinite(pk) && r.branch_id === pk;
          const matchBySuffix =
            !Number.isFinite(pk) &&
            suffix &&
            String(r.display_branch_id).endsWith(suffix);

          if (matchByPk || matchBySuffix) {
            return {
              ...r,
              name: updated.name ?? r.name,
              location: updated.location ?? r.location,
              detail_address: updated.detail_address ?? r.detail_address,
              store_owner: updated.store_owner ?? r.store_owner,
              contact: updated.contact ?? r.contact,
              isused: updated.isused ?? r.isused ?? null,
              created_at: updated.created_at ?? r.created_at,
              display_branch_id:
                updated.branch_id !== undefined
                  ? String(updated.branch_id)
                  : r.display_branch_id,
            };
          }
          return r;
        })
        .filter((r) => r.isused !== "NOTUSED")
    );
  };

  return (
    <div style={page_wrap_style}>
      <div style={page_style}>
        {/* 상단 타이틀/버튼 */}
        <div style={controls_block_style}>
          <div style={controls_title_style}>지점 조회</div>
          <div style={top_row_style}>
            <div style={top_controls_style}>
              <input
                type="text"
                value={query}
                onChange={(e) => set_query(e.target.value)}
                placeholder="예) 마포구 / 강서방화사거리점"
                style={input_style}
              />
              <button type="button" style={search_btn_style} onClick={handle_search}>
                검색
              </button>
              <button type="button" style={reset_btn_style} onClick={handle_reset}>
                초기화
              </button>

              {/* ✅ 창고와 동일한 디자인/배치의 ID 조회 버튼 → 모달 오픈 */}
              <button
                type="button"
                style={id_btn_style}
                onClick={() => set_summaryOpen(true)}
              >
                지점 ID 검색
              </button>
            </div>

            <button
              type="button"
              style={create_btn_style}
              onClick={() => set_regOpen(true)}
            >
              신규 지점 등록
            </button>
          </div>
        </div>

        {/* 에러/로딩 */}
        {is_loading && (
          <div style={{ margin: "8px 12px", color: ui_tok.label }}>
            불러오는 중…
          </div>
        )}
        {error_message && (
          <div style={{ color: "#c62828", margin: "8px 12px" }}>
            {error_message}
          </div>
        )}

        {/* 네모 박스 테이블 */}
        <div style={table_card_style}>
          <div style={table_scroll_style}>
            <table style={table_style}>
              <thead>
                <tr>
                  <th style={th_style}>branch_id</th>
                  <th style={th_style}>name</th>
                  <th style={th_style}>location</th>
                  <th style={th_style}>detail_address</th>
                  <th style={th_style}>store_owner</th>
                  <th style={th_style}>contact</th>
                  <th style={th_style}>created_at</th>
                  <th style={th_style}>actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, idx) => (
                  <tr
                    key={r.branch_id}
                    title={`${r.name} · ${r.location} · ${r.detail_address}`}
                    style={idx % 2 === 1 ? { background: ui_tok.zebra } : undefined}
                  >
                    <td style={td_style}>{r.display_branch_id}</td>
                    <td style={td_style}>{r.name}</td>
                    <td style={td_style}>{r.location}</td>
                    <td style={td_style}>{r.detail_address}</td>
                    <td style={td_style}>{r.store_owner}</td>
                    <td style={td_style}>{r.contact}</td>
                    <td style={td_style}>{r.created_at}</td>
                    <td style={actions_cell_style}>
                      <button
                        type="button"
                        style={icon_btn_style}
                        onClick={() => openEdit(r)}
                        title="수정"
                        aria-label="수정"
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 20 20"
                          fill="none"
                          aria-hidden="true"
                        >
                          <path
                            d="M13.585 3.586a2 2 0 0 1 2.828 2.828l-8.486 8.486-3.414.586.586-3.414 8.486-8.486Z"
                            stroke="#374151"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M12 5l3 3"
                            stroke="#374151"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                          />
                        </svg>
                      </button>

                      <button
                        type="button"
                        style={icon_btn_style}
                        title="미사용 등록"
                        aria-label="미사용 등록"
                        onClick={() => {
                          set_notUsedTarget({
                            branch_id: r.branch_id,
                            name: r.name,
                          });
                          set_notUsedOpen(true);
                        }}
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 20 20"
                          fill="none"
                          aria-hidden="true"
                        >
                          <path
                            d="M6 7h8l-.7 9.1a2 2 0 0 1-2 1.9H8.7a2 2 0 0 1-2-1.9L6 7Z"
                            stroke="#ef4444"
                            strokeWidth="1.5"
                          />
                          <path
                            d="M4 7h12M8 7V4h4v3"
                            stroke="#ef4444"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                          />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}

                {rows.length === 0 && !is_loading && !error_message && (
                  <tr>
                    <td colSpan={8} style={empty_style}>
                      등록된 지점이 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ===== 수정 모달 ===== */}
        <BranchEditUi
          open={editOpen}
          target={editTarget}
          onClose={closeEdit}
          onSubmit={async (data) => {
            // ✅ 1단계: 즉시 낙관적 갱신 (PK = data.branch_id)
            handleSaved({
              id: Number(data.branch_id),
              branch_id: data.branch_id,
              name: data.name,
              location: data.location,
              detail_address: data.detail_address,
              store_owner: data.store_owner,
              contact: String(data.contact ?? ""),
              isused: "USED",
              created_at: data.created_at ?? "",
            });

            try {
              // ✅ 2단계: 서버 응답으로 한 번 더 확정 반영
              const raw = await putBranch(data); // ApiBranch
              handleSaved(raw);
              set_editOpen(false);
              alert("지점 정보가 수정되었습니다.");
            } catch (e: any) {
              alert(e?.message || "수정에 실패했습니다.");
            }
          }}
        />

        {/* ✅ 미사용 등록 모달 */}
        <BranchNoutUsedUi
          open={notUsedOpen}
          target={notUsedTarget}
          onClose={() => set_notUsedOpen(false)}
          onConfirm={async () => {
            if (!notUsedTarget) return;
            try {
              await markBranchNotUsed(notUsedTarget.branch_id);
              set_notUsedOpen(false);
              alert("미사용으로 등록되었습니다.");
              load();
            } catch (e: any) {
              alert(e?.message || "미사용 등록에 실패했습니다.");
            }
          }}
        />

        {/* ✅ 추가: 지점 ID 상세 검색 모달 */}
        <BranchSummarySearch open={summaryOpen} onClose={() => set_summaryOpen(false)} />

        {/* ===== 등록 모달 ===== */}
        {regOpen && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.35)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 9998,
            }}
            onClick={() => set_regOpen(false)}
          >
            <div
              style={{
                width: "min(900px, 94vw)",
                maxHeight: "90vh",
                overflowY: "auto",
                background: "#fff",
                border: `1px solid ${ui_tok.border}`,
                borderRadius: 12,
                boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
                padding: 16,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 8,
                }}
              >
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>
                  신규 지점 등록
                </h2>
                <button
                  type="button"
                  style={{
                    padding: "6px 10px",
                    borderRadius: 8,
                    border: `1px solid ${ui_tok.border}`,
                    background: "#fff",
                    cursor: "pointer",
                  }}
                  onClick={() => set_regOpen(false)}
                >
                  닫기
                </button>
              </div>
              <BranchRegisterPage />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BranchListPage;

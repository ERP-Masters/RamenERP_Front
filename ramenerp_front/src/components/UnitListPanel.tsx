// src/components/UnitListPanel.tsx
import React, { useEffect, useState } from "react";

// 수정 UI/기능 (기존)
import UnitEditUI from "../components/UnitEditUi";
import { putUnit, type UnitEditTarget } from "../pages/UnitEditFunction";

// 삭제 UI/기능 (기존)
import UnitDeleteUI from "../components/UnitDeleteUi";
import { deleteUnitWithAlerts, type UnitDeleteTarget } from "../pages/UnitDeleteFuncion";

// ✅ 모달로 띄울 등록 페이지 (기존 페이지를 그대로 사용)
import UnitRegisterPage from "../pages/UnitRegisterPage";

type ApiUnit = { unit_id: number | string; code: string; name: string; is_active?: boolean | null; };

// 👉 내부 로우: 요청/로직용은 숫자 ID 유지
type UnitRow = {
  unit_id: number;
  code: string;
  name: string;
  is_active?: boolean;
  // 화면 표시용 문자열 ID (런타임 속성으로만 보강)
  display_unit_id?: string;
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
  focus: "0 0 0 3px rgba(14,165,233,0.25)",
  primary_bg: "#0ea5e9",
  primary_border: "#0284c7",
  primary_text: "#ffffff",
} as const;

const page_wrap_style: React.CSSProperties = { background: ui_tok.bg_page, minHeight: "100%", padding: "24px 16px" };
const page_style = { padding: 16, maxWidth: 1200, margin: "0 auto" } as const;

// ⬇️ 여백만 살짝 조정
const controls_block_style: React.CSSProperties = { marginTop: 4, marginBottom: 6 };
const controls_title_style: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 800,
  color: ui_tok.text,
  margin: "0 0 6px 0",
  transform: "translateY(-4px)",
};
const top_row_style: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  marginTop: -8,
};
const top_controls_style: React.CSSProperties = { display: "flex", alignItems: "center", gap: 8 };

const create_btn_style: React.CSSProperties = {
  height: 40, padding: "0 16px", borderRadius: 999,
  border: `1px solid ${ui_tok.primary_border}`, background: ui_tok.primary_bg,
  color: ui_tok.primary_text, fontWeight: 800, cursor: "pointer", whiteSpace: "nowrap",
};

const table_card_style: React.CSSProperties = {
  border: `1px solid ${ui_tok.border}`, borderRadius: ui_tok.radius, background: ui_tok.surface,
  display: "flex", flexDirection: "column", maxHeight: "60vh", overflow: "hidden",
};
const table_scroll_style = { flex: 1, overflowY: "auto", overflowX: "auto" } as const;

const table_style = { width: "100%", borderCollapse: "separate" as const, borderSpacing: 0 } as const;
const th_style = {
  padding: "12px 10px", textAlign: "left" as const, background: ui_tok.header_bg, borderBottom: `1px solid ${ui_tok.border}`,
  fontSize: 13, fontWeight: 700, position: "sticky" as const, top: 0, zIndex: 1,
} as const;
const td_style = { borderBottom: `1px solid ${ui_tok.border}`, padding: 12, textAlign: "left" as const, whiteSpace: "nowrap" as const } as const;
const empty_style = { padding: 24, textAlign: "center", color: ui_tok.label } as const;

const name_cell_style: React.CSSProperties = {
  ...td_style, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
};

const icon_btn_style: React.CSSProperties = { background: "transparent", border: "none", padding: 4, cursor: "pointer", lineHeight: 0 };

/* ===== 숫자/문자 혼용 ID 대응 =====
   - 요청/로직: 숫자 ID (문자열이면 끝자리 숫자 추출)
   - 화면표시: 문자열 ID를 우선 표시
*/
const to_row = (u: ApiUnit): UnitRow => {
  const toIdNum = (v: any): number => {
    if (typeof v === "number") return v;
    const m = String(v ?? "").match(/\d+$/);
    return m ? Number(m[0]) : NaN;
  };

  const display =
    (typeof (u as any)?.display_unit_id === "string" && (u as any).display_unit_id) ||
    (typeof (u as any)?.unit_id === "string" && String((u as any).unit_id)) ||
    (typeof (u as any)?.id === "string" && String((u as any).id)) ||
    String((u as any)?.unit_id ?? "");

  return {
    unit_id: toIdNum((u as any).unit_id),         // ← PUT/DELETE 등 요청용은 항상 숫자
    code: String(u.code ?? "").trim(),
    name: String(u.name ?? "").trim(),
    is_active: u.is_active ?? true,
    ...(display ? { display_unit_id: display } : {}),
  };
};

const UnitListPanel: React.FC = () => {
  const [rows, set_rows] = useState<UnitRow[]>([]);
  const [is_loading, set_is_loading] = useState(false);
  const [error_message, set_error_message] = useState("");

  const [edit_open, set_edit_open] = useState(false);
  const [edit_target, set_edit_target] = useState<UnitEditTarget | null>(null);

  const [del_open, set_del_open] = useState(false);
  const [del_target, set_del_target] = useState<UnitDeleteTarget | null>(null);

  // ✅ 등록 모달
  const [reg_open, set_reg_open] = useState(false);

  const load = async (signal?: AbortSignal) => {
    set_is_loading(true);
    set_error_message("");
    try {
      const res = await fetch("/api/units", { method: "GET", headers: { Accept: "application/json" }, signal });
      const raw = await res.text();
      if (!res.ok) {
        let msg = `HTTP ${res.status}`;
        try { msg = (raw ? JSON.parse(raw) : null)?.message || msg; } catch {}
        throw new Error(msg);
      }
      const list: ApiUnit[] = raw ? JSON.parse(raw) : [];
      set_rows(Array.isArray(list) ? list.map(to_row) : []);
    } catch (e: any) {
      if (e?.name !== "AbortError") set_error_message(e?.message || "단위 목록을 불러오는 중 오류가 발생했습니다.");
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
    const onCreated = () => { set_reg_open(false); load(); };
    const onCancel = () => { set_reg_open(false); };
    window.addEventListener("unit:created", onCreated);
    window.addEventListener("unit:register:cancel", onCancel);
    return () => {
      window.removeEventListener("unit:created", onCreated);
      window.removeEventListener("unit:register:cancel", onCancel);
    };
  }, []);

  const open_edit = (row: UnitRow) => {
    // 요청용 숫자 ID 유지
    set_edit_target({ unit_id: row.unit_id, code: row.code, name: row.name });
    set_edit_open(true);
  };
  const close_edit = () => set_edit_open(false);

  const handle_saved = (updated: ApiUnit) => {
    // 응답의 unit_id가 문자열일 수도 있으니 숫자로 비교
    const uid = Number((updated as any).unit_id);
    set_rows(prev =>
      prev.map(r =>
        Number(r.unit_id) === uid
          ? {
              ...r,
              code: String(updated.code ?? r.code),
              name: String(updated.name ?? r.name),
              // 화면 표시는 문자열 ID 우선
              display_unit_id:
                (typeof (updated as any)?.unit_id === "string" && String((updated as any).unit_id)) ||
                r.display_unit_id ||
                String(uid),
            }
          : r
      )
    );
  };

  const open_delete = (row: UnitRow) => { set_del_target({ unit_id: row.unit_id, name: row.name }); set_del_open(true); };
  const close_delete = () => set_del_open(false);

  return (
    <div style={page_wrap_style}>
      <div style={page_style}>
        {/* 상단 타이틀 & 우측 ‘신규 단위 등록’ 버튼 (박스 밖) */}
        <div style={controls_block_style}>
          <div style={controls_title_style}>단위 조회</div>
          <div style={top_row_style}>
            <div style={top_controls_style} />
            <button type="button" style={create_btn_style} onClick={() => set_reg_open(true)}>
              신규 단위 등록
            </button>
          </div>
        </div>

        {/* 네모 박스(고정 높이 + 내부 스크롤) */}
        <div style={table_card_style}>
          {is_loading && <div style={{ margin: "8px 12px", color: ui_tok.label }}>불러오는 중…</div>}
          {error_message && <div style={{ color: "#c62828", margin: "8px 12px" }}>{error_message}</div>}

          <div style={table_scroll_style}>
            <table style={table_style}>
              <thead>
                <tr>
                  <th style={th_style}>unit_id</th>
                  <th style={th_style}>code</th>
                  <th style={th_style}>name</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, idx) => (
                  <tr
                    key={Number.isFinite(r.unit_id) ? `n-${r.unit_id}` : `s-${(r as any).display_unit_id || "unknown"}`}
                    title={`${r.code} · ${r.name}`}
                    style={idx % 2 === 1 ? { background: ui_tok.zebra } : undefined}
                  >
                    {/* ✅ 화면에는 문자열 ID 우선 표시, 없으면 숫자 fallback */}
                    <td style={td_style}>{(r as any).display_unit_id ?? r.unit_id}</td>
                    <td style={td_style}>{r.code}</td>
                    <td style={name_cell_style}>
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{r.name}</span>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        {/* 수정 아이콘 */}
                        <button type="button" style={icon_btn_style} onClick={() => open_edit(r)} title="수정" aria-label="수정">
                          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                            <path d="M13.585 3.586a2 2 0 0 1 2.828 2.828l-8.486 8.486-3.414.586.586-3.414 8.486-8.486Z"
                              stroke="#374151" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M12 5l3 3" stroke="#374151" strokeWidth="1.5" strokeLinecap="round" />
                          </svg>
                        </button>
                        {/* 삭제 아이콘 */}
                        <button type="button" style={icon_btn_style} onClick={() => open_delete(r)} title="삭제" aria-label="삭제">
                          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                            <path d="M6 7h8l-.7 9.1a2 2 0 0 1-2 1.9H8.7a2 2 0 0 1-2-1.9L6 7Z"
                              stroke="#ef4444" strokeWidth="1.5" />
                            <path d="M4 7h12M8 7V4h4v3" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && !is_loading && !error_message && (
                  <tr><td colSpan={3} style={empty_style}>등록된 단위가 없습니다.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 수정 모달 (기존) */}
        <UnitEditUI
          open={edit_open}
          target={edit_target}
          onClose={close_edit}
          onSubmit={async (data) => {
            try {
              // ✅ 추가: 낙관적 갱신 — 서버 응답을 기다리지 않고 즉시 화면 반영
              handle_saved({ unit_id: data.unit_id, code: data.code, name: data.name } as ApiUnit);

              const updated = await putUnit(data);
              handle_saved(updated); // 서버가 문자열 ID 등 보냈으면 한 번 더 정합성 보정
              close_edit();
              alert("단위가 수정되었습니다.");
            } catch (e: any) {
              // ✅ 추가: 실패 시 목록을 서버와 재동기화(낙관적 갱신 롤백)
              await load();
              alert(e?.message || "단위 수정에 실패했습니다.");
            }
          }}
        />

        {/* 삭제 모달 (기존) */}
        <UnitDeleteUI
          open={del_open}
          target={del_target}
          onClose={close_delete}
          onConfirm={async () => {
            if (!del_target) return;
            await deleteUnitWithAlerts(del_target, (deletedId) => {
              set_rows(prev => prev.filter(u => u.unit_id !== deletedId));
            });
            set_del_open(false);
          }}
        />

        {/* ✅ 등록 모달: UnitRegisterPage 그대로 사용 */}
        {reg_open && (
          <div
            style={{
              position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)",
              display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9998,
            }}
            onClick={() => set_reg_open(false)}
          >
            <div
              style={{
                width: "min(900px, 94vw)", maxHeight: "90vh", overflowY: "auto",
                background: "#fff", border: `1px solid ${ui_tok.border}`, borderRadius: 12,
                boxShadow: "0 10px 30px rgba(0,0,0,0.2)", padding: 16,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>단위 등록</h2>
                <button
                  type="button"
                  style={{ padding: "6px 10px", borderRadius: 8, border: `1px solid ${ui_tok.border}`, background: "#fff", cursor: "pointer" }}
                  onClick={() => set_reg_open(false)}
                >
                  닫기
                </button>
              </div>
              <UnitRegisterPage />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UnitListPanel;

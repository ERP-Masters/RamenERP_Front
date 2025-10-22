// src/pages/NotUsedBranchPageUi.tsx
import React, { useEffect, useState } from "react";
import { fetchNotUsedBranches, type ApiBranch } from "../pages/BranchNotUsedFunction";
// ✅ 사용 등록 기능
import { markManyBranchesUsed } from "../pages/BranchUsedFunction";

/** 화면 표시에만 쓰는 행 타입 */
type Row = {
  branch_id: number;
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
  background: "#9ca3af", // 회색
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
  const [selectMode, set_selectMode] = useState(false);
  const [checked, set_checked] = useState<Record<number, boolean>>({});

  const to_row = (b: ApiBranch): Row => ({
    branch_id: Number(b.branch_id),
    name: String(b.name ?? "").trim(),
    location: String(b.location ?? "").trim(),
    detail_address: String(b.detail_address ?? "").trim(),
    store_owner: String(b.store_owner ?? "").trim(),
    contact: String(b.contact ?? "").trim(),
    created_at: String(b.created_at ?? "").trim(),
  });

  const load = async () => {
    set_loading(true);
    set_error("");
    try {
      const list = await fetchNotUsedBranches(); // GET /api/branches/state
      set_rows(Array.isArray(list) ? list.map(to_row) : []);
      set_checked({});
    } catch (e: any) {
      set_error(e?.message || "미사용 목록을 불러오지 못했습니다.");
    } finally {
      set_loading(false);
    }
  };

  // ✅ 체크된 ID 뽑기
  const selectedIds = () =>
    Object.entries(checked)
      .filter(([, v]) => v)
      .map(([k]) => Number(k));

  // ✅ “사용” 버튼(복구) — 기능만 연결 (문구: “1개 지점을 사용 등록하시겠습니까?”)
  const handleRestoreUse = async () => {
    const ids = selectedIds();
    if (ids.length === 0) {
      alert("사용으로 전환할 지점을 선택하세요.");
      return;
    }
    const msg =
      ids.length === 1
        ? "1개 지점을 사용 등록하시겠습니까?"
        : `${ids.length}개 지점을 사용 등록하시겠습니까?`;
    if (!window.confirm(msg)) return;

    try {
      set_loading(true);
      await markManyBranchesUsed(ids); // 서버가 /state → /branches 이동 처리
      await load();                    // 미사용 목록에서 즉시 사라짐
      set_selectMode(false);
      alert("사용으로 전환되었습니다.");
      // 메인 리스트는 BranchUsedFunction에서 쏜 이벤트로 자동 새로고침됨
    } catch (e: any) {
      alert(e?.message || "전환 중 오류가 발생했습니다.");
    } finally {
      set_loading(false);
    }
  };

  useEffect(() => {
    load();
    const onNotUsed = () => load();   // 미사용 전환 후 자동 갱신
    const onRestored = () => load();  // 사용 복구 후 자동 갱신
    window.addEventListener("branch:notused:updated", onNotUsed);
    window.addEventListener("branch:used:restored", onRestored);
    return () => {
      window.removeEventListener("branch:notused:updated", onNotUsed);
      window.removeEventListener("branch:used:restored", onRestored);
    };
  }, []);

  return (
    <div style={page_wrap_style}>
      <div style={page_style}>
        <div style={title_style}>미사용 직영점 조회</div>

        {/* 상단 선택/사용 버튼 영역 (UI 동일) */}
        <div style={top_bar_style}>
          <button
            type="button"
            style={select_btn_style}
            onClick={() => set_selectMode((v) => !v)}
            title="선택 모드"
          >
            {selectMode ? "선택 해제" : "선택"}
          </button>

          {selectMode && (
            <button
              type="button"
              style={use_btn_style}
              onClick={handleRestoreUse}   // ✅ 기능 연결
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
                  {selectMode && <th style={th_style} />}
                  <th style={th_style}>branch_id</th>
                  <th style={th_style}>name</th>
                  <th style={th_style}>location</th>
                  <th style={th_style}>detail_address</th>
                  <th style={th_style}>store_owner</th>
                  <th style={th_style}>contact</th>
                  <th style={th_style}>created_at</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, idx) => (
                  <tr
                    key={r.branch_id}
                    style={idx % 2 === 1 ? { background: ui_tok.zebra } : undefined}
                    title={`${r.name} · ${r.location} · ${r.detail_address}`}
                  >
                    {selectMode && (
                      <td style={td_style}>
                        <input
                          type="checkbox"
                          checked={!!checked[r.branch_id]}
                          onChange={(e) =>
                            set_checked((prev) => ({ ...prev, [r.branch_id]: e.target.checked }))
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
                ))}

                {rows.length === 0 && !loading && !error && (
                  <tr>
                    <td style={empty_style} colSpan={selectMode ? 8 : 7}>
                      미사용으로 등록된 지점이 없습니다.
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

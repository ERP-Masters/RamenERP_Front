// src/pages/NotUsedVendorPageUi.tsx
import React, { useEffect, useState } from "react";
import { fetchNotUsedVendors, type ApiVendor } from "../pages/VendorNotUsedFunction";
import { markManyVendorsUsed } from "../pages/VendorUsedFunction";

/** 화면 표시에만 쓰는 행 타입 */
type Row = {
  /** 서버 요청/체크박스용 숫자형 ID (문자형이면 끝자리 숫자 추출) */
  id_num: number;
  /** 화면 표시용 문자열 ID */
  display_vendor_id: string;

  name: string;
  manager: string;
  contact: string;
  address: string;
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

const NotUsedVendorPageUi: React.FC = () => {
  const [rows, set_rows] = useState<Row[]>([]);
  const [loading, set_loading] = useState(false);
  const [error, set_error] = useState("");
  const [selectMode, set_selectMode] = useState(false);

  /** ✅ 체크박스 상태를 '문자열 키'로 관리해서 NaN 충돌 제거 */
  const [checked, set_checked] = useState<Record<string, boolean>>({});

  // 숫자/문자 어떤 값이 와도 숫자 id 추출
  const toIdNum = (v: any): number => {
    if (typeof v === "number") return v;
    const m = String(v ?? "").match(/\d+$/);
    return m ? Number(m[0]) : NaN;
  };

  // ✅ 각 행의 고유 키 (숫자면 n-숫자, 아니면 s-문자ID)
  const rowKey = (r: Row) =>
    Number.isFinite(r.id_num) ? `n-${r.id_num}` : `s-${r.display_vendor_id}`;

  const to_row = (v: ApiVendor): Row => {
    const id_num = toIdNum((v as any).vendor_id);
    const display =
      typeof (v as any).display_vendor_id === "string" && (v as any).display_vendor_id
        ? (v as any).display_vendor_id
        : typeof (v as any).vendor_id === "string"
        ? (v as any).vendor_id
        : typeof (v as any).id === "string"
        ? (v as any).id
        : String((v as any).vendor_id ?? "");

    return {
      id_num,
      display_vendor_id: display,
      name: String(v.name ?? "").trim(),
      manager: String(v.manager ?? "").trim(),
      contact: String(v.contact ?? "").trim(),
      address: String(v.address ?? "").trim(),
    };
  };

  const load = async () => {
    set_loading(true);
    set_error("");
    try {
      const list = await fetchNotUsedVendors();
      set_rows((Array.isArray(list) ? list : []).map(to_row));
      set_checked({});
    } catch (e: any) {
      set_error(e?.message || "미사용 거래처 목록을 불러오지 못했습니다.");
    } finally {
      set_loading(false);
    }
  };

  /** ✅ 선택된(숫자 ID가 있는) 행들의 숫자 ID 배열 */
  const selectedIds = () =>
    rows
      .filter((r) => checked[rowKey(r)] && Number.isFinite(r.id_num))
      .map((r) => r.id_num);

  // ✅ “사용” — 낙관적 제거 + 서버 반영 + 재동기화
  const handleRestoreUse = async () => {
    const ids = selectedIds();
    if (ids.length === 0) {
      alert("사용으로 전환할 거래처를 선택하세요.");
      return;
    }
    const msg =
      ids.length === 1
        ? "1개 거래처를 사용 등록하시겠습니까?"
        : `${ids.length}개 거래처를 사용 등록하시겠습니까?`;
    if (!window.confirm(msg)) return;

    // 1) 화면 즉시 제거 (키 기반으로 안전하게 제거)
    const removeKeys = new Set(ids.map((id) => `n-${id}`));
    set_rows((prev) => prev.filter((r) => !removeKeys.has(rowKey(r))));
    set_checked((prev) => {
      const next = { ...prev };
      [...removeKeys].forEach((k) => delete next[k]);
      return next;
    });

    try {
      set_loading(true);
      // 2) 서버 반영(USED) — 숫자형 ID로 전송
      await markManyVendorsUsed(ids);
      // 3) 후행 동기화
      void load();
      set_selectMode(false);
      alert("사용으로 전환되었습니다.");
    } catch (e: any) {
      alert(e?.message || "전환 중 오류가 발생했습니다.");
      void load();
    } finally {
      set_loading(false);
    }
  };

  useEffect(() => {
    load();
    const onNotUsed = () => load();
    const onRestored = () => load();
    window.addEventListener("vendor:notused:updated", onNotUsed);
    window.addEventListener("vendor:used:restored", onRestored);
    return () => {
      window.removeEventListener("vendor:notused:updated", onNotUsed);
      window.removeEventListener("vendor:used:restored", onRestored);
    };
  }, []);

  return (
    <div style={page_wrap_style}>
      <div style={page_style}>
        <div style={title_style}>미사용 거래처 조회</div>

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
            onClick={handleRestoreUse}
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
                  <th style={th_style}>vendor_id</th>
                  <th style={th_style}>name</th>
                  <th style={th_style}>manager</th>
                  <th style={th_style}>contact</th>
                  <th style={th_style}>address</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, idx) => {
                  const key = rowKey(r);
                  const validId = Number.isFinite(r.id_num);
                  return (
                    <tr
                      key={key}
                      style={idx % 2 === 1 ? { background: ui_tok.zebra } : undefined}
                      title={`${r.name} · ${r.manager} · ${r.contact} · ${r.address}`}
                    >
                      {selectMode && (
                        <td style={td_style}>
                          <input
                            type="checkbox"
                            disabled={!validId}
                            checked={!!checked[key]}
                            onChange={(e) =>
                              set_checked((prev) => ({ ...prev, [key]: e.target.checked }))
                            }
                          />
                        </td>
                      )}
                      <td style={td_style}>{r.display_vendor_id}</td>
                      <td style={td_style}>{r.name}</td>
                      <td style={td_style}>{r.manager}</td>
                      <td style={td_style}>{r.contact}</td>
                      <td style={td_style}>{r.address}</td>
                    </tr>
                  );
                })}

                {rows.length === 0 && !loading && !error && (
                  <tr>
                    {/* 열 개수: 선택모드 6, 기본 5 */}
                    <td style={empty_style} colSpan={selectMode ? 6 : 5}>
                      미사용으로 등록된 거래처가 없습니다.
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

export default NotUsedVendorPageUi;

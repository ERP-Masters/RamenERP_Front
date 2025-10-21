import React, { useEffect, useMemo, useState } from "react";

/** 백엔드 응답 타입(숫자형 내부 id는 유지) */
type ApiVendor = {
  vendor_id: number;     // 내부 로직용 숫자 id
  name: string;
  manager: string;
  contact: string;
  address: string;
  is_active?: boolean | null;
  // 서버가 문자열 ID를 추가로 내려줄 수도 있으므로 any 키 대응
  [k: string]: any;
};

type Row = {
  vendor_id: number;          // 내부 로직용
  display_vendor_id: string;  // 화면 표시용 문자열 ID
  name: string;
  manager: string;
  contact: string;
  address: string;
  is_active?: boolean;
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
  gap: 10,
  primary_bg: "#0ea5e9",
  primary_border: "#0284c7",
  primary_text: "#ffffff",
} as const;

const page_wrap_style: React.CSSProperties = {
  background: ui_tok.bg_page,
  padding: "24px 16px",
};

const page_style: React.CSSProperties = { padding: 16, maxWidth: 1200, margin: "0 auto" };

const controls_title_style: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 800,
  color: ui_tok.text,
  margin: "0 0 6px 0",
  transform: "translateY(-20px)",
};

/* 테이블 카드(높이 고정 + 내부 스크롤) */
const card_wrap_style: React.CSSProperties = { position: "relative" };
const table_card_style: React.CSSProperties = {
  border: `1px solid ${ui_tok.border}`,
  borderRadius: ui_tok.radius,
  background: ui_tok.surface,
  overflowX: "hidden",
  overflowY: "auto",
  maxHeight: "60vh",
  marginTop: -4,
};

const float_btns_style: React.CSSProperties = {
  position: "absolute",
  top: -14,     // 카드의 윗 라인 살짝 위
  right: -2,    // 카드의 오른쪽 바깥쪽 살짝
  display: "flex",
  alignItems: "center",
  gap: 8,
};

const select_btn_style: React.CSSProperties = {
  height: 32,
  padding: "0 12px",
  borderRadius: 10,
  border: `1px solid ${ui_tok.border}`,
  background: "#fff",
  color: ui_tok.text,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const use_btn_style: React.CSSProperties = {
  height: 32,
  padding: "0 12px",
  borderRadius: 10,
  border: `1px solid ${ui_tok.primary_border}`,
  background: ui_tok.primary_bg,
  color: ui_tok.primary_text,
  fontWeight: 800,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const table_wrap_style = { overflowX: "auto" } as const;
const table_style = { width: "100%", borderCollapse: "separate" as const, borderSpacing: 0 } as const;

const th_td_base = {
  padding: "12px 10px",
  textAlign: "left" as const,
  whiteSpace: "nowrap" as const,
  color: ui_tok.text,
} as const;
const th_style = {
  ...th_td_base,
  fontSize: 13,
  fontWeight: 700,
  background: ui_tok.header_bg,
  borderBottom: `1px solid ${ui_tok.border}`,
  position: "sticky" as const,
  top: 0,
  zIndex: 1,
} as const;
const td_style = { ...th_td_base, fontSize: 14, borderBottom: `1px solid ${ui_tok.border}` } as const;
const td_addr_flex_style: React.CSSProperties = {
  ...td_style,
  padding: "12px 2px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8,
  minWidth: 0,
};
const addr_text_style: React.CSSProperties = { overflow: "hidden", textOverflow: "ellipsis", minWidth: 0 };

const empty_cell_style = { textAlign: "center", padding: 24, color: ui_tok.label } as const;

/* 안전 JSON 파서 */
const safeJson = async (res: Response) => {
  const txt = await res.text().catch(() => "");
  try { return txt ? JSON.parse(txt) : null; } catch { return null; }
};

/* API → Row 매핑(문자열 ID가 없으면 숫자 id를 문자열로 fallback) */
const to_row = (v: ApiVendor): Row => {
  const any = v as Record<string, any>;
  const stringId =
    (typeof any.vendor_id === "string" && any.vendor_id) ||
    (typeof any.vendor_code === "string" && any.vendor_code) ||
    (typeof any.id === "string" && any.id) ||
    String(v.vendor_id);

  return {
    vendor_id: v.vendor_id,
    display_vendor_id: stringId,
    name: v.name?.trim() ?? "",
    manager: v.manager?.trim() ?? "",
    contact: String(v.contact ?? "").trim(),
    address: v.address?.trim() ?? "",
    is_active: v.is_active ?? false,
  };
};

/** 미사용 거래처 UI 전용 컴포넌트 (검색/필터/기능 X, UI만) */
const NotUsedVendorUi: React.FC = () => {
  const [rows, set_rows] = useState<Row[]>([]);
  const [is_loading, set_is_loading] = useState(false);
  const [error_message, set_error_message] = useState("");

  // 선택 모드/선택 상태
  const [selectMode, set_selectMode] = useState(false);
  const [checked, set_checked] = useState<Record<number, boolean>>({});

  const selectedCount = useMemo(
    () => Object.values(checked).filter(Boolean).length,
    [checked]
  );

  // 데이터 조회(여러 엔드포인트 시도 → 첫 성공 사용)
  useEffect(() => {
    let ignore = false;
    const load = async () => {
      set_is_loading(true);
      set_error_message("");
      try {
        const candidates = [
          "/api/vendors?isused=NOTUSED",
          "/api/vendors/notused",
          "/api/vendors?is_active=false",
        ];
        let okData: ApiVendor[] | null = null;
        for (const url of candidates) {
          try {
            const res = await fetch(url, { headers: { Accept: "application/json" } });
            const data = (await safeJson(res)) as ApiVendor[] | null;
            if (res.ok && Array.isArray(data)) {
              okData = data;
              break;
            }
          } catch { /* next */ }
        }
        if (!ignore) set_rows((okData ?? []).map(to_row));
      } catch (e: any) {
        if (!ignore) set_error_message(e?.message || "목록을 불러오지 못했습니다.");
      } finally {
        if (!ignore) set_is_loading(false);
      }
    };
    load();
    return () => { ignore = true; };
  }, []);

  // 선택 모드 토글
  const toggleSelectMode = () => {
    set_selectMode((prev) => {
      const next = !prev;
      if (!next) set_checked({});
      return next;
    });
  };

  // 체크 토글
  const toggleRow = (id: number) => {
    set_checked((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div style={page_wrap_style}>
      <div style={page_style}>
        <div style={controls_title_style}>미사용 거래처</div>

        <div style={card_wrap_style}>
          {/* 카드 우측 바깥 윗부분 떠 있는 버튼들 */}
          <div style={float_btns_style}>
            <button type="button" style={select_btn_style} onClick={toggleSelectMode}>
              {selectMode ? "선택 해제" : "선택"}
            </button>
            {selectMode && (
              <button
                type="button"
                style={{ ...use_btn_style, opacity: selectedCount ? 1 : 0.6, cursor: selectedCount ? "pointer" : "not-allowed" }}
                disabled={!selectedCount}
                onClick={() => alert(`선택된 ${selectedCount}개 항목을 '사용'으로 전환 (UI만)`)}
              >
                사용
              </button>
            )}
          </div>

          <div style={table_card_style}>
            <div style={table_wrap_style}>
              <table style={table_style}>
                <thead>
                  <tr>
                    {selectMode && <th style={{ ...th_style, width: 42 }}>선택</th>}
                    <th style={th_style}>거래처ID</th>
                    <th style={th_style}>거래처명</th>
                    <th style={th_style}>담당자명</th>
                    <th style={th_style}>연락처</th>
                    <th style={{ ...th_style, padding: "12px 2px" }}>주소</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, idx) => (
                    <tr key={r.vendor_id} style={idx % 2 === 1 ? { background: ui_tok.zebra } : undefined}>
                      {selectMode && (
                        <td style={{ ...td_style, width: 42 }}>
                          <input
                            type="checkbox"
                            checked={!!checked[r.vendor_id]}
                            onChange={() => toggleRow(r.vendor_id)}
                            style={{ transform: "translateY(1px)" }}
                          />
                        </td>
                      )}
                      <td style={td_style}>{r.display_vendor_id}</td>
                      <td style={td_style}>{r.name}</td>
                      <td style={td_style}>{r.manager}</td>
                      <td style={td_style}>{r.contact}</td>
                      <td style={td_addr_flex_style}>
                        <span style={addr_text_style}>{r.address}</span>
                      </td>
                    </tr>
                  ))}

                  {rows.length === 0 && !is_loading && !error_message && (
                    <tr>
                      <td colSpan={selectMode ? 6 : 5} style={empty_cell_style}>
                        등록된 미사용 거래처가 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 로딩/에러 메시지 */}
          {is_loading && <div style={{ margin: "8px 12px", color: ui_tok.label }}>불러오는 중…</div>}
          {error_message && <div style={{ margin: "8px 12px", color: "#c62828" }}>{error_message}</div>}
        </div>
      </div>
    </div>
  );
};

export default NotUsedVendorUi;

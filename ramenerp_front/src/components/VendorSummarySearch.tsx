import React, { useEffect, useMemo, useState } from "react";

type SummaryItem = { vendor_id: string; name: string };
type VendorFull = {
  vendor_id: number | string;
  name: string;
  manager?: string | null;
  contact?: string | null;
  address?: string | null;
  identification_number?: string | null; // 있을 때만 표시
};

type Props = {
  open: boolean;
  onClose: () => void;
};

const overlay: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.35)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
};

const box: React.CSSProperties = {
  width: 420,
  maxWidth: "90vw",
  background: "#fff",
  borderRadius: 8,
  boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
  padding: 14,
  boxSizing: "border-box",
};

const list_wrap: React.CSSProperties = {
  marginTop: 8,
  maxHeight: 260,
  overflowY: "auto",
  border: "1px solid #e5e7eb",
  borderRadius: 6,
};

const row: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 8,
  padding: "6px 10px",
  borderBottom: "1px solid #f1f5f9",
  fontSize: 14,
};

const head: React.CSSProperties = { display: "flex", gap: 8, alignItems: "center" };

const input_style: React.CSSProperties = { padding: "6px 8px", flex: "1 1 auto" };
const btn: React.CSSProperties = {
  padding: "6px 10px",
  borderRadius: 6,
  border: "1px solid #d1d5db",
  background: "#111827",
  color: "#fff",
  cursor: "pointer",
  whiteSpace: "nowrap",
};
const gray_btn: React.CSSProperties = { ...btn, background: "#6b7280" };

// 목록행 안의 “상세” 작은 버튼
const tiny_btn: React.CSSProperties = {
  padding: "4px 6px",
  borderRadius: 6,
  border: "1px solid #d1d5db",
  background: "#f9fafb",
  color: "#111827",
  cursor: "pointer",
  fontSize: 12,
  whiteSpace: "nowrap",
};

// 상세 뷰(작은 화면 안) 스타일
const detail_wrap: React.CSSProperties = {
  marginTop: 10,
  border: "1px solid #e5e7eb",
  borderRadius: 8,
  padding: 10,
};
const detail_header: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: 6,
};
const detail_row: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "90px 1fr",
  gap: 8,
  fontSize: 14,
  padding: "6px 0",
  borderBottom: "1px solid #f3f4f6",
};
const detail_label: React.CSSProperties = { color: "#6b7280", whiteSpace: "nowrap" };
const detail_value: React.CSSProperties = { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" };

const VendorSummarySearch: React.FC<Props> = ({ open, onClose }) => {
  const [query, set_query] = useState("");
  const [items, set_items] = useState<SummaryItem[]>([]);
  const [vendors, set_vendors] = useState<VendorFull[]>([]);
  const [loading, set_loading] = useState(false);
  const [error, set_error] = useState("");

  // 선택된 상세 대상
  const [selectedId, set_selectedId] = useState<string>("");

  // 열릴 때 데이터 로드: 요약 + 전체 목록
  useEffect(() => {
    if (!open) return;
    set_error("");
    set_loading(true);
    set_selectedId("");
    set_query("");

    (async () => {
      try {
        // 1) 요약 (선택)
        const resSum = await fetch("/api/vendors/summary", {
          headers: { Accept: "application/json" },
          credentials: "include",
        });
        const textSum = await resSum.text();
        if (resSum.ok) {
          const arr = textSum ? JSON.parse(textSum) : [];
          const list: SummaryItem[] = Array.isArray(arr)
            ? arr.map((x: any) => ({
                vendor_id: String(x?.vendor_id ?? x?.id ?? ""),
                name: String(x?.name ?? ""),
              }))
            : [];
          set_items(list);
        }

        // 2) 전체 목록(상세 표시용)
        const resAll = await fetch("/api/vendors", {
          headers: { Accept: "application/json" },
          credentials: "include",
        });
        const textAll = await resAll.text();
        if (!resAll.ok) {
          let msg = `HTTP ${resAll.status}`;
          try {
            msg = (JSON.parse(textAll)?.message as string) || msg;
          } catch {}
          throw new Error(msg);
        }
        const arrAll = textAll ? JSON.parse(textAll) : [];
        const listAll: VendorFull[] = Array.isArray(arrAll)
          ? arrAll.map((v: any) => ({
              vendor_id: v?.vendor_id ?? v?.id ?? "",
              name: String(v?.name ?? ""),
              manager: v?.manager ?? "",
              contact: v?.contact ?? "",
              address: v?.address ?? "",
              identification_number: v?.identification_number ?? v?.biz_no ?? null,
            }))
          : [];

        set_vendors(listAll);
      } catch (e: any) {
        set_error(e?.message || "목록을 불러오지 못했습니다.");
      } finally {
        set_loading(false);
      }
    })();
  }, [open]);

  // 후보(접두 일치)
  const candidates = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return vendors
      .filter((v) => String(v.vendor_id).toLowerCase().startsWith(q))
      .slice(0, 50);
  }, [query, vendors]);

  // 정확히 일치하면 자동으로 상세 표시
  useEffect(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      set_selectedId("");
      return;
    }
    const exact = vendors.find((v) => String(v.vendor_id).toLowerCase() === q);
    if (exact) set_selectedId(String(exact.vendor_id));
    else set_selectedId("");
  }, [query, vendors]);

  const selectAndShow = (id: string) => {
    set_selectedId(id);
    set_query(id); // 입력창에도 반영
  };

  const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (candidates.length === 1) {
        selectAndShow(String(candidates[0].vendor_id));
      }
    }
  };

  const selected = useMemo(
    () => vendors.find((v) => String(v.vendor_id) === selectedId),
    [vendors, selectedId]
  );

  if (!open) return null;

  return (
    <div style={overlay} onClick={onClose}>
      <div style={box} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ margin: "0 0 8px 0" }}>거래처 ID 조회</h3>

        <div style={head}>
          <input
            value={query}
            onChange={(e) => set_query(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="거래처 ID 입력 (예: 102, V-00102)"
            style={input_style}
          />
          <button
            type="button"
            style={btn}
            onClick={() => {
              if (candidates.length === 1) selectAndShow(String(candidates[0].vendor_id));
            }}
          >
            검색
          </button>
          <button
            type="button"
            style={gray_btn}
            onClick={() => {
              set_query("");
              set_selectedId("");
            }}
          >
            초기화
          </button>
        </div>

        {loading && <div style={{ marginTop: 8 }}>불러오는 중…</div>}
        {error && <div style={{ marginTop: 8, color: "crimson" }}>{error}</div>}

        {/* 상세(정확 일치 or 선택 시) */}
        {selected ? (
          <div style={detail_wrap}>
            <div style={detail_header}>
              <strong>상세 정보</strong>
              {/* ⬇️ 작은 닫기 버튼: 상세 → 목록으로 복귀 */}
              <button
                type="button"
                style={tiny_btn}
                onClick={() => set_selectedId("")}
                title="작게 닫기"
                aria-label="작게 닫기"
              >
                이전으로
              </button>
            </div>

            <div style={detail_row}>
              <span style={detail_label}>거래처ID</span>
              <span style={detail_value}>#{String(selected.vendor_id)}</span>
            </div>
            <div style={detail_row}>
              <span style={detail_label}>거래처명</span>
              <span style={detail_value}>{selected.name}</span>
            </div>
            <div style={detail_row}>
              <span style={detail_label}>담당자명</span>
              <span style={detail_value}>{selected.manager || "-"}</span>
            </div>
            <div style={detail_row}>
              <span style={detail_label}>연락처</span>
              <span style={detail_value}>{selected.contact || "-"}</span>
            </div>
            <div style={detail_row}>
              <span style={detail_label}>주소</span>
              <span style={detail_value}>{selected.address || "-"}</span>
            </div>
            {selected.identification_number ? (
              <div style={detail_row}>
                <span style={detail_label}>사업자번호</span>
                <span style={detail_value}>{selected.identification_number}</span>
              </div>
            ) : null}
          </div>
        ) : (
          // 상세가 없을 때: 접두 일치 후보 목록 + 각 행의 “상세” 작은 버튼
          <div style={list_wrap}>
            {query.trim() ? (
              candidates.length ? (
                candidates.map((it) => {
                  const idStr = String(it.vendor_id);
                  return (
                    <div
                      key={`${idStr}-${it.name}`}
                      style={row}
                      title={`${idStr} · ${it.name}`}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, flex: "1 1 auto" }}>
                        <span>#{idStr}</span>
                        <strong style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{it.name}</strong>
                      </div>
                      {/* ⬇️ 작게 상세 보기 버튼 */}
                      <button
                        type="button"
                        style={tiny_btn}
                        onClick={() => selectAndShow(idStr)}
                        title="상세 보기"
                        aria-label="상세 보기"
                      >
                        상세
                      </button>
                    </div>
                  );
                })
              ) : (
                <div style={{ padding: 10, textAlign: "center", color: "#6b7280" }}>결과가 없습니다.</div>
              )
            ) : (
              <div style={{ padding: 10, textAlign: "center", color: "#6b7280" }}>
                ID를 입력하면 결과가 표시됩니다.
              </div>
            )}
          </div>
        )}

        <div style={{ marginTop: 10, textAlign: "right" }}>
          <button type="button" style={gray_btn} onClick={onClose}>
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

export default VendorSummarySearch;

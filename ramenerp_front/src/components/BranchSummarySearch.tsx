import React, { useEffect, useMemo, useState } from "react";

type BranchFull = {
  branch_id: number | string;
  name: string;
  location: string;
  detail_address: string;
  store_owner: string;
  contact: string;
  created_at?: string | null;
};

type Props = { open: boolean; onClose: () => void };

/* ====== (창고 ID 조회와 동일한 디자인 토큰) ====== */
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
  width: 520, // 지점 필드가 많아 살짝 넓힘
  maxWidth: "92vw",
  background: "#fff",
  borderRadius: 8,
  boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
  padding: 14,
  boxSizing: "border-box",
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

/* 목록행의 작은 버튼 */
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

/* 상세 영역 */
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
  gridTemplateColumns: "140px 1fr",
  gap: 8,
  fontSize: 14,
  padding: "6px 0",
  borderBottom: "1px solid #f3f4f6",
};
const detail_label: React.CSSProperties = { color: "#6b7280", whiteSpace: "nowrap" };
const detail_value: React.CSSProperties = { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" };

const BranchSummarySearch: React.FC<Props> = ({ open, onClose }) => {
  const [query, set_query] = useState("");
  const [branches, set_branches] = useState<BranchFull[]>([]);
  const [loading, set_loading] = useState(false);
  const [error, set_error] = useState("");

  // 현재 상세로 펼쳐진 대상 ID(문자열로 관리)
  const [selectedId, set_selectedId] = useState<string>("");

  /* 모달 열릴 때 한 번 전체 목록 로드 → 클라측 필터 */
  useEffect(() => {
    if (!open) return;
    set_error("");
    set_loading(true);
    set_selectedId("");
    set_query("");

    (async () => {
      try {
        const res = await fetch("/api/branches", {
          headers: { Accept: "application/json" },
          credentials: "include",
        });
        const txt = await res.text();
        if (!res.ok) {
          let msg = `HTTP ${res.status}`;
          try {
            msg = (JSON.parse(txt)?.message as string) || msg;
          } catch {}
          throw new Error(msg);
        }
        const arr = txt ? JSON.parse(txt) : [];
        const list: BranchFull[] = Array.isArray(arr)
          ? arr.map((b: any) => ({
              branch_id: b?.branch_id ?? b?.id ?? "",
              name: String(b?.name ?? ""),
              location: String(b?.location ?? ""),
              detail_address: String(b?.detail_address ?? ""),
              store_owner: String(b?.store_owner ?? ""),
              contact: String(b?.contact ?? ""),
              created_at: b?.created_at ?? "",
            }))
          : [];
        set_branches(list);
      } catch (e: any) {
        set_error(e?.message || "목록을 불러오지 못했습니다.");
      } finally {
        set_loading(false);
      }
    })();
  }, [open]);

  /* 접두 일치 후보 목록 (ID 기반) */
  const candidates = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return branches
      .filter((b) => String(b.branch_id).toLowerCase().startsWith(q))
      .slice(0, 50);
  }, [query, branches]);

  /* 🔽 추가: 점주(store_owner) 이름으로도 검색되는 후보 목록 */
  const ownerCandidates = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [] as BranchFull[];
    return branches
      .filter((b) => (b.store_owner || "").toLowerCase().includes(q))
      .slice(0, 50);
  }, [query, branches]);

  /* 🔽 추가: ID 중복 방지용 Set (기존 candidates 기준) */
  const candidateIdSet = useMemo(() => {
    const set = new Set<string>();
    candidates.forEach((b) => set.add(String(b.branch_id)));
    return set;
  }, [candidates]);

  /* 입력이 정확히 일치하면 자동 상세 표시 */
  useEffect(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      set_selectedId("");
      return;
    }
    const exact = branches.find((b) => String(b.branch_id).toLowerCase() === q);
    if (exact) set_selectedId(String(exact.branch_id));
    else set_selectedId("");
  }, [query, branches]);

  const selectAndShow = (id: string) => {
    set_selectedId(id);
    set_query(id);
  };

  const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (candidates.length === 1) selectAndShow(String(candidates[0].branch_id));
    }
  };

  const selected = useMemo(
    () => branches.find((b) => String(b.branch_id) === selectedId),
    [branches, selectedId]
  );

  if (!open) return null;

  return (
    <div style={overlay} onClick={onClose}>
      <div style={box} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ margin: "0 0 8px 0" }}>지점 ID 조회</h3>

        <div style={head}>
          <input
            value={query}
            onChange={(e) => set_query(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="지점 ID 입력 (예: BR_SEOUL_0001 또는 점주명)"
            style={input_style}
          />
          <button
            type="button"
            style={btn}
            onClick={() => {
              if (candidates.length === 1) selectAndShow(String(candidates[0].branch_id));
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

        {/* 상세 보기 (정확 일치/선택 시) */}
        {selected ? (
          <div style={detail_wrap}>
            <div style={detail_header}>
              <strong>상세 정보</strong>
              <button type="button" style={tiny_btn} onClick={() => set_selectedId("")}>
                이전으로
              </button>
            </div>

            <div style={detail_row}>
              <span style={detail_label}>branch_id</span>
              <span style={detail_value}>{String(selected.branch_id)}</span>
            </div>
            <div style={detail_row}>
              <span style={detail_label}>name</span>
              <span style={detail_value}>{selected.name}</span>
            </div>
            <div style={detail_row}>
              <span style={detail_label}>location</span>
              <span style={detail_value}>{selected.location}</span>
            </div>
            <div style={detail_row}>
              <span style={detail_label}>detail_address</span>
              <span style={detail_value}>{selected.detail_address}</span>
            </div>
            <div style={detail_row}>
              <span style={detail_label}>store_owner</span>
              <span style={detail_value}>{selected.store_owner}</span>
            </div>
            <div style={detail_row}>
              <span style={detail_label}>contact</span>
              <span style={detail_value}>{selected.contact}</span>
            </div>
            {/* 스샷처럼 ISO 문자열 그대로 노출 */}
            {selected.created_at ? (
              <div style={detail_row}>
                <span style={detail_label}>created_at</span>
                <span style={detail_value}>{selected.created_at}</span>
              </div>
            ) : null}
          </div>
        ) : (
          // 상세가 없을 때: 접두 일치 후보 목록 + “상세” 버튼
          <div style={list_wrap}>
            {query.trim() ? (
              candidates.length ? (
                candidates.map((it) => {
                  const idStr = String(it.branch_id);
                  return (
                    <div key={`${idStr}-${it.name}`} style={row} title={`${idStr} · ${it.name}`}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          minWidth: 0,
                          flex: "1 1 auto",
                        }}
                      >
                        <span>#{idStr}</span>
                        <strong style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{it.name}</strong>
                      </div>
                      <button type="button" style={tiny_btn} onClick={() => selectAndShow(idStr)}>
                        상세
                      </button>
                    </div>
                  );
                })
              ) : !ownerCandidates.length ? ( // 🔸 ownerCandidates도 없을 때만 "결과가 없습니다."
                <div style={{ padding: 10, textAlign: "center", color: "#6b7280" }}>결과가 없습니다.</div>
              ) : null
            ) : (
              <div style={{ padding: 10, textAlign: "center", color: "#6b7280" }}>
                ID를 입력하면 결과가 표시됩니다.
              </div>
            )}

            {/* 🔽 추가: 점주(store_owner) 이름으로만 매칭되는 후보들 (ID 중복 제외) */}
            {query.trim() &&
              ownerCandidates
                .filter((b) => !candidateIdSet.has(String(b.branch_id)))
                .map((it) => {
                  const idStr = String(it.branch_id);
                  return (
                    <div
                      key={`owner-${idStr}-${it.store_owner}`}
                      style={{ ...row, background: "#f9fafb" }}
                      title={`${idStr} · ${it.name} · ${it.store_owner}`}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          minWidth: 0,
                          flex: "1 1 auto",
                        }}
                      >
                        <span>#{idStr}</span>
                        <strong style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{it.name}</strong>
                        <span style={{ fontSize: 12, color: "#6b7280" }}>({it.store_owner})</span>
                      </div>
                      <button type="button" style={tiny_btn} onClick={() => selectAndShow(idStr)}>
                        상세
                      </button>
                    </div>
                  );
                })}
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

export default BranchSummarySearch;

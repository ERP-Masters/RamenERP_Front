// src/components/WarehouseSummarySearch.tsx
import React, { useEffect, useMemo, useState } from "react";

type SummaryItem = { warehouse_id: string; name: string };
type WarehouseFull = {
  warehouse_id: number | string;
  name: string;
  location?: string | null;
  created_at?: string | null;
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
  gridTemplateColumns: "110px 1fr",
  gap: 8,
  fontSize: 14,
  padding: "6px 0",
  borderBottom: "1px solid #f3f4f6",
};
const detail_label: React.CSSProperties = { color: "#6b7280", whiteSpace: "nowrap" };
const detail_value: React.CSSProperties = { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" };

const fmt_date = (iso?: string | null) => {
  if (!iso) return "-";
  try {
    const d = new Date(iso);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const da = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${y}-${m}-${da} ${hh}:${mm}`;
  } catch {
    return String(iso);
  }
};

const WarehouseSummarySearch: React.FC<Props> = ({ open, onClose }) => {
  const [query, set_query] = useState("");
  const [items, set_items] = useState<SummaryItem[]>([]);
  const [warehouses, set_warehouses] = useState<WarehouseFull[]>([]);
  const [loading, set_loading] = useState(false);
  const [error, set_error] = useState("");

  const [selected_id, set_selected_id] = useState<string>("");

  useEffect(() => {
    if (!open) return;
    set_error("");
    set_loading(true);
    set_selected_id("");
    set_query("");

    (async () => {
      try {
        // 1) 요약(있으면 사용) — 없더라도 무시
        try {
          const res_sum = await fetch("/api/warehouses/summary", {
            headers: { Accept: "application/json" },
            credentials: "include",
          });
          const text_sum = await res_sum.text();
          if (res_sum.ok && text_sum) {
            const arr = JSON.parse(text_sum);
            const list: SummaryItem[] = Array.isArray(arr)
              ? arr.map((x: any) => ({
                  warehouse_id: String(x?.warehouse_id ?? x?.id ?? ""),
                  name: String(x?.name ?? ""),
                }))
              : [];
            set_items(list);
          }
        } catch {
          // 요약 엔드포인트가 없어도 조용히 패스
          set_items([]);
        }

        // 2) 전체 목록(상세용)
        const res_all = await fetch("/api/warehouses", {
          headers: { Accept: "application/json" },
          credentials: "include",
        });
        const text_all = await res_all.text();
        if (!res_all.ok) {
          let msg = `HTTP ${res_all.status}`;
          try {
            msg = (JSON.parse(text_all)?.message as string) || msg;
          } catch {}
          throw new Error(msg);
        }
        const arr_all = text_all ? JSON.parse(text_all) : [];
        const list_all: WarehouseFull[] = Array.isArray(arr_all)
          ? arr_all.map((w: any) => ({
              warehouse_id: w?.warehouse_id ?? w?.id ?? "",
              name: String(w?.name ?? ""),
              location: w?.location ?? "",
              created_at: w?.created_at ?? "",
            }))
          : [];
        set_warehouses(list_all);
      } catch (e: any) {
        set_error(e?.message || "목록을 불러오지 못했습니다.");
      } finally {
        set_loading(false);
      }
    })();
  }, [open]);

  const candidates = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    // 요약이 비어있어도 전체목록에서 접두 일치
    const source: SummaryItem[] =
      items.length > 0
        ? items
        : warehouses.map((w) => ({ warehouse_id: String(w.warehouse_id), name: String(w.name) }));
    return source.filter((i) => i.warehouse_id.toLowerCase().startsWith(q)).slice(0, 50);
  }, [query, items, warehouses]);

  useEffect(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      set_selected_id("");
      return;
    }
    const exact = warehouses.find((w) => String(w.warehouse_id).toLowerCase() === q);
    if (exact) set_selected_id(String(exact.warehouse_id));
    else set_selected_id("");
  }, [query, warehouses]);

  const select_and_show = (id: string) => {
    set_selected_id(id);
    set_query(id);
  };

  const on_key_down: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (candidates.length === 1) select_and_show(String(candidates[0].warehouse_id));
    }
  };

  const selected = useMemo(
    () => warehouses.find((w) => String(w.warehouse_id) === selected_id),
    [warehouses, selected_id]
  );

  if (!open) return null;

  return (
    <div style={overlay} onClick={onClose}>
      <div style={box} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ margin: "0 0 8px 0" }}>창고 ID 조회</h3>

        <div style={head}>
          <input
            value={query}
            onChange={(e) => set_query(e.target.value)}
            onKeyDown={on_key_down}
            placeholder="창고 ID 입력 (예: WH_SEOUL_0001)"
            style={input_style}
          />
          <button
            type="button"
            style={btn}
            onClick={() => {
              if (candidates.length === 1) select_and_show(String(candidates[0].warehouse_id));
            }}
          >
            검색
          </button>
          <button
            type="button"
            style={gray_btn}
            onClick={() => {
              set_query("");
              set_selected_id("");
            }}
          >
            초기화
          </button>
        </div>

        {loading && <div style={{ marginTop: 8 }}>불러오는 중…</div>}
        {error && <div style={{ marginTop: 8, color: "crimson" }}>{error}</div>}

        {selected ? (
          <div style={detail_wrap}>
            <div style={detail_header}>
              <strong>상세 정보</strong>
              <button
                type="button"
                style={tiny_btn}
                onClick={() => set_selected_id("")}
                title="작게 닫기"
                aria-label="작게 닫기"
              >
                이전으로
              </button>
            </div>

            <div style={detail_row}>
              <span style={detail_label}>warehouse_id</span>
              <span style={detail_value}>{String(selected.warehouse_id)}</span>
            </div>
            <div style={detail_row}>
              <span style={detail_label}>name</span>
              <span style={detail_value}>{selected.name}</span>
            </div>
            <div style={detail_row}>
              <span style={detail_label}>location</span>
              <span style={detail_value}>{selected.location || "-"}</span>
            </div>
            <div style={detail_row}>
              <span style={detail_label}>created_at</span>
              <span style={detail_value}>{fmt_date(selected.created_at)}</span>
            </div>
          </div>
        ) : (
          <div style={list_wrap}>
            {query.trim() ? (
              candidates.length ? (
                candidates.map((it) => {
                  const id_str = String(it.warehouse_id);
                  return (
                    <div key={`${id_str}-${it.name}`} style={row} title={`${id_str} · ${it.name}`}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          minWidth: 0,
                          flex: "1 1 auto",
                        }}
                      >
                        <span>#{id_str}</span>
                        <strong style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{it.name}</strong>
                      </div>
                      <button
                        type="button"
                        style={tiny_btn}
                        onClick={() => select_and_show(id_str)}
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

export default WarehouseSummarySearch;

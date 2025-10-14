import React, { useEffect, useState } from "react";

type SummaryItem = { vendor_id: number; name: string };

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

const VendorSummarySearch: React.FC<Props> = ({ open, onClose }) => {
  const [query, set_query] = useState("");
  const [items, set_items] = useState<SummaryItem[]>([]);
  const [filtered, set_filtered] = useState<SummaryItem[]>([]);
  const [loading, set_loading] = useState(false);
  const [error, set_error] = useState("");

  // 열릴 때 요약 데이터 1회 로드
  useEffect(() => {
    if (!open) return;
    set_error("");
    set_loading(true);
    (async () => {
      try {
        const res = await fetch("/api/vendors/summary", { headers: { Accept: "application/json" } });
        const text = await res.text();
        if (!res.ok) {
          let msg = `HTTP ${res.status}`;
          try {
            msg = (JSON.parse(text)?.message as string) || msg;
          } catch {}
          throw new Error(msg);
        }
        const list: SummaryItem[] = text ? JSON.parse(text) : [];
        set_items(Array.isArray(list) ? list : []);
        set_filtered(Array.isArray(list) ? list : []);
      } catch (e: any) {
        set_error(e?.message || "요약 목록을 불러오지 못했습니다.");
      } finally {
        set_loading(false);
      }
    })();
  }, [open]);

  // 입력값으로 클라측 필터
  const doFilter = () => {
    const q = query.trim().toLowerCase();
    set_filtered(!q ? items : items.filter((i) => i.name.toLowerCase().includes(q)));
  };

  const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      doFilter();
    }
  };

  if (!open) return null;

  return (
    <div style={overlay} onClick={onClose}>
      <div style={box} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ margin: "0 0 8px 0" }}>거래처명 빠른 조회</h3>

        <div style={head}>
          <input
            value={query}
            onChange={(e) => set_query(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="거래처명 입력"
            style={input_style}
          />
          <button type="button" style={btn} onClick={doFilter}>검색</button>
          <button type="button" style={gray_btn} onClick={() => { set_query(""); set_filtered(items); }}>
            초기화
          </button>
        </div>

        {loading && <div style={{ marginTop: 8 }}>불러오는 중…</div>}
        {error && <div style={{ marginTop: 8, color: "crimson" }}>{error}</div>}

        <div style={list_wrap}>
          {filtered.map((it) => (
            <div key={it.vendor_id} style={row} title={`${it.vendor_id} · ${it.name}`}>
              <span>#{it.vendor_id}</span>
              <strong style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{it.name}</strong>
            </div>
          ))}
          {!filtered.length && !loading && !error && (
            <div style={{ padding: 10, textAlign: "center", color: "#6b7280" }}>결과가 없습니다.</div>
          )}
        </div>

        <div style={{ marginTop: 10, textAlign: "right" }}>
          <button type="button" style={gray_btn} onClick={onClose}>닫기</button>
        </div>
      </div>
    </div>
  );
};

export default VendorSummarySearch;

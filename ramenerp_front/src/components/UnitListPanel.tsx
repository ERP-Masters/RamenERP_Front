import React, { useEffect, useState } from "react";

type ApiUnit = {
  unit_id: number;
  code: string;
  name: string;
  is_active?: boolean | null;
};

type UnitRow = {
  unit_id: number;
  code: string;
  name: string;
  is_active?: boolean;
};

const panel_style = {
  border: "1px solid #e5e7eb",
  borderRadius: 8,
  padding: 12,
  marginTop: 35,        // 폼 아래 적당히 띄우기
  height: "53vh",       // 화면 비율 기반 높이 (적당히 조절 가능)
  overflowY: "auto",    // 내용 많아지면 박스 내부 스크롤
  overflowX: "hidden",
  background: "#fafafa",
  boxSizing: "border-box",
} as const;

const table_style = { width: "100%", borderCollapse: "collapse" } as const;
const th_style = { borderBottom: "1px solid #ddd", padding: 8, textAlign: "left", background: "#f3f4f6" } as const;
const td_style = { borderBottom: "1px solid #eee", padding: 8, textAlign: "left", whiteSpace: "nowrap" } as const;
const empty_style = { padding: 16, textAlign: "center", color: "#6b7280" } as const;

const to_row = (u: ApiUnit): UnitRow => ({
  unit_id: u.unit_id,
  code: String(u.code ?? "").trim(),
  name: String(u.name ?? "").trim(),
  is_active: u.is_active ?? true,
});

const UnitListPanel: React.FC = () => {
  const [rows, set_rows] = useState<UnitRow[]>([]);
  const [is_loading, set_is_loading] = useState(false);
  const [error_message, set_error_message] = useState("");

  useEffect(() => {
    const ac = new AbortController();

    const load = async () => {
      set_is_loading(true);
      set_error_message("");
      try {
        // Vite proxy 사용: /api -> vite.config.ts의 target
        const res = await fetch("/api/units", {
          method: "GET",
          headers: { Accept: "application/json" },
          signal: ac.signal,
        });

        const raw = await res.text();
        if (!res.ok) {
          let msg = `HTTP ${res.status}`;
          try {
            const err = raw ? JSON.parse(raw) : null;
            msg = err?.message || msg;
          } catch {}
          throw new Error(msg);
        }

        const list: ApiUnit[] = raw ? JSON.parse(raw) : [];
        set_rows(Array.isArray(list) ? list.map(to_row) : []);
      } catch (e: any) {
        if (e?.name !== "AbortError") {
          set_error_message(e?.message || "단위 목록을 불러오는 중 오류가 발생했습니다.");
        }
      } finally {
        set_is_loading(false);
      }
    };

    load();
    return () => ac.abort();
  }, []);

  return (
    <div style={panel_style}>
      {is_loading && <div style={{ margin: "6px 0" }}>불러오는 중…</div>}
      {error_message && <div style={{ color: "crimson", margin: "6px 0" }}>{error_message}</div>}

      <table style={table_style}>
        <thead>
          <tr>
            <th style={th_style}>unit_id</th>
            <th style={th_style}>code</th>
            <th style={th_style}>name</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.unit_id} title={`${r.code} · ${r.name}`}>
              <td style={td_style}>{r.unit_id}</td>
              <td style={td_style}>{r.code}</td>
              <td style={td_style}>{r.name}</td>
            </tr>
          ))}
          {rows.length === 0 && !is_loading && !error_message && (
            <tr>
              <td colSpan={3} style={empty_style}>등록된 단위가 없습니다.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default UnitListPanel;

// src/pages/BranchOrderListPage.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  fetch_branch_orders_all,
  fetch_branch_orders_by_branch_id,
  fetch_branch_orders_by_status,
  fetch_branch_orders_by_period,
  type ApiBranchOrder,
  type BranchOrderStatus,
} from "@/api/branch_orders";

import {
  fetch_branches,
  fetch_items,
  fetch_item_name_by_id,
  prime_item_name_cache,
  type BranchOption,
  type ItemOption,
} from "@/api/master_data";

/* ===== UI 공통 (발주 리스트와 동일 톤) ===== */
const ui = {
  border: "#e5e7eb",
  zebra: "#fafafa",
  muted: "#6b7280",
  danger: "#dc2626",
  badgeBg: "#fff7ed",
  badgeBd: "#fdba74",
  badgeTx: "#c2410c",
  primaryBg: "#0ea5e9",
  primaryBd: "#0284c7",
  primaryTx: "#fff",
  radius: 10,
} as const;

const page_wrap: React.CSSProperties = {
  maxWidth: 1200,
  margin: "0 auto",
  padding: 16,
  display: "flex",
  flexDirection: "column",
  gap: 16,
  color: "#0f172a",
  background: "#f8fafc",
};

const header_row: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "minmax(160px,1fr) minmax(140px,1fr) minmax(160px,1fr) minmax(160px,1fr) minmax(240px,2fr) auto auto",
  gap: 12,
  alignItems: "end",
  border: `1px solid ${ui.border}`,
  borderRadius: ui.radius,
  background: "#fff",
  padding: 16,
};

const sub_row: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 12,
  alignItems: "center",
  fontSize: 14,
  color: ui.muted,
};

const card_table_wrap: React.CSSProperties = {
  border: `1px solid ${ui.border}`,
  borderRadius: ui.radius,
  background: "#fff",
  overflow: "hidden",
};

const table_scroll: React.CSSProperties = {
  maxHeight: 520,
  overflow: "auto",
};

const table_style: React.CSSProperties = {
  width: "100%",
  borderCollapse: "separate",
  borderSpacing: 0,
  fontSize: 14,
};

const th_style: React.CSSProperties = {
  position: "sticky",
  top: 0,
  background: "#f8fafc",
  borderBottom: `1px solid ${ui.border}`,
  padding: "10px 8px",
  textAlign: "left",
  whiteSpace: "nowrap",
  fontSize: 13,
  fontWeight: 700,
};

const td_style: React.CSSProperties = {
  borderBottom: `1px solid ${ui.border}`,
  padding: "10px 8px",
  whiteSpace: "nowrap",
  verticalAlign: "middle",
  fontSize: 14,
};

const select_style: React.CSSProperties = {
  border: `1px solid ${ui.border}`,
  borderRadius: 8,
  padding: "10px 12px",
  fontSize: 14,
  minWidth: 140,
  background: "#fff",
  color: "#0f172a",
};

const input_style: React.CSSProperties = {
  border: `1px solid ${ui.border}`,
  borderRadius: 8,
  padding: "10px 12px",
  fontSize: 14,
  minWidth: 140,
  background: "#fff",
  color: "#0f172a",
};

const search_btn: React.CSSProperties = {
  border: `1px solid ${ui.border}`,
  borderRadius: 8,
  background: "#fff",
  padding: "10px 16px",
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
  lineHeight: 1,
  height: 40,
};

const primary_btn: React.CSSProperties = {
  border: `1px solid ${ui.primaryBd}`,
  borderRadius: 8,
  background: ui.primaryBg,
  color: ui.primaryTx,
  padding: "10px 16px",
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
  lineHeight: 1,
  height: 40,
};

const small_btn: React.CSSProperties = {
  border: `1px solid ${ui.border}`,
  borderRadius: 8,
  background: "#fff",
  padding: "8px 12px",
  cursor: "pointer",
  fontSize: 14,
};

const csv_btn: React.CSSProperties = { ...small_btn };

const badge_style = (): React.CSSProperties => ({
  display: "inline-block",
  borderRadius: 6,
  border: `1px solid ${ui.badgeBd}`,
  background: ui.badgeBg,
  color: ui.badgeTx,
  fontSize: 12,
  fontWeight: 700,
  lineHeight: 1,
  padding: "6px 10px",
});

/* ===== 유틸 ===== */
function money(n: number) {
  return new Intl.NumberFormat("ko-KR").format(n);
}

// "BR_{branchId}_{YYMMDD}_SEQ" 에서 날짜 추출 → YYYY-MM-DD
function infer_date_from_order_id(order_id?: string): string {
  if (!order_id) return "";
  const parts = order_id.split("_");
  const cand = parts.find((p) => /^\d{6}$/.test(p));
  if (!cand) return "";
  const yy = cand.slice(0, 2);
  const mm = cand.slice(2, 4);
  const dd = cand.slice(4, 6);
  return `20${yy}-${mm}-${dd}`;
}

function display_date(o: { created_at?: string; order_id?: string }): string {
  if (o.created_at) {
    const d = new Date(o.created_at);
    if (!Number.isNaN(d.getTime())) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    }
  }
  return infer_date_from_order_id(o.order_id);
}

// 헤더뷰용 집계
type HeaderRow = {
  order_id: string;
  created_at?: string;
  branch_name?: string;
  total_qty: number;
  status: BranchOrderStatus;
};

function build_header_rows(lines: ApiBranchOrder[]): HeaderRow[] {
  const m = new Map<string, HeaderRow>();
  for (const r of lines) {
    const k = r.order_id;
    const prev = m.get(k);
    if (!prev) {
      m.set(k, {
        order_id: r.order_id,
        created_at: r.created_at,
        branch_name: r.branch_name,
        total_qty: r.quantity ?? 0,
        status: r.status,
      });
    } else {
      prev.total_qty += r.quantity ?? 0;
    }
  }
  return Array.from(m.values());
}

/* ===== 컴포넌트 ===== */

const status_options: BranchOrderStatus[] = [
  "PENDING",
  "INPROGRESS",
  "PARTIALLY",
  "CANCELED",
  "SHIPPING",
  "COMPLETED",
];

const BranchOrderListPage: React.FC = () => {
  const navigate = useNavigate();

  // 필터
  const [branch_filter, set_branch_filter] = useState<string>("");
  const [status_filter, set_status_filter] = useState<string>("");
  const [start_date, set_start_date] = useState<string>("");
  const [end_date, set_end_date] = useState<string>("");
  const [order_id_search, set_order_id_search] = useState<string>("");

  // 자동완성
  const [order_id_suggestions, set_order_id_suggestions] = useState<string[]>([]);
  const [is_show_suggest, set_is_show_suggest] = useState<boolean>(false);
  const suggest_wrap_ref = useRef<HTMLDivElement | null>(null);

  // 상태
  const [is_loading, set_is_loading] = useState<boolean>(false);
  const [error_msg, set_error_msg] = useState<string>("");

  // 데이터
  const [orders, set_orders] = useState<ApiBranchOrder[]>([]);
  const [branches, set_branches] = useState<BranchOption[]>([]);
  const [items, set_items] = useState<ItemOption[]>([]);

  // 이름 맵
  const branch_name_by_id = useMemo(() => {
    const m = new Map<number, string>();
    branches.forEach((b) => m.set(b.id, b.name));
    return m;
  }, [branches]);

  const item_name_by_id = useMemo(() => {
    const m = new Map<number, string>();
    items.forEach((it) => m.set(it.id, it.name));
    return m;
  }, [items]);

  // 아이템명 보강 캐시
  const [item_name_patch, set_item_name_patch] = useState<Map<number, string>>(
    () => new Map(),
  );

  // 라인뷰 렌더용 (표시용 branch_name, item_name 채우기)
  const line_rows: ApiBranchOrder[] = useMemo(() => {
    return orders.map((o) => ({
      ...o,
      branch_name: o.branch_name ?? branch_name_by_id.get(o.branch_id) ?? "",
      item_name:
        o.item_name ??
        item_name_patch.get(o.item_id) ??
        item_name_by_id.get(o.item_id) ??
        "",
    }));
  }, [orders, branch_name_by_id, item_name_by_id, item_name_patch]);

  // 헤더뷰
  const header_rows: HeaderRow[] = useMemo(
    () => build_header_rows(line_rows),
    [line_rows],
  );

  // 마스터 로드
  useEffect(() => {
    let is_cancelled = false;
    (async () => {
      try {
        const [br, it] = await Promise.all([fetch_branches(), fetch_items()]);
        if (is_cancelled) return;
        set_branches(br);
        set_items(it);
        prime_item_name_cache(it);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      is_cancelled = true;
    };
  }, []);

  // 목록 로더
  const load_orders = async () => {
    set_is_loading(true);
    set_error_msg("");
    try {
      let data: ApiBranchOrder[] = [];

      if (start_date && end_date) {
        data = await fetch_branch_orders_by_period(start_date, end_date);
      } else if (branch_filter && !status_filter) {
        data = await fetch_branch_orders_by_branch_id(Number(branch_filter));
      } else if (!branch_filter && status_filter) {
        data = await fetch_branch_orders_by_status(
          status_filter as BranchOrderStatus,
        );
      } else if (branch_filter && status_filter) {
        const tmp = await fetch_branch_orders_by_branch_id(Number(branch_filter));
        data = tmp.filter((r) => r.status === status_filter);
      } else {
        data = await fetch_branch_orders_all();
      }

      // 수주번호 부분검색 (프론트 필터)
      if (order_id_search.trim()) {
        const kw = order_id_search.trim().toLowerCase();
        data = data.filter((r) => r.order_id.toLowerCase().includes(kw));
      }

      set_orders(data);

      const uniq = Array.from(new Set(data.map((r) => r.order_id))).sort();
      set_order_id_suggestions(uniq);
    } catch (e: any) {
      set_error_msg(e?.message || "수주 목록 조회 실패");
    } finally {
      set_is_loading(false);
    }
  };

  // 초기 로드
  useEffect(() => {
    load_orders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 아이템명 보강
  useEffect(() => {
    const need_ids = Array.from(
      new Set(
        orders
          .filter((o) => {
            const in_master = !!item_name_by_id.get(o.item_id);
            const in_patch = !!item_name_patch.get(o.item_id);
            const empty = !o.item_name || !String(o.item_name).trim();
            return empty && !in_master && !in_patch;
          })
          .map((o) => o.item_id),
      ),
    );
    if (need_ids.length === 0) return;

    let is_cancelled = false;
    (async () => {
      for (const id of need_ids) {
        const nm = await fetch_item_name_by_id(id).catch(() => undefined);
        if (is_cancelled || !nm) continue;
        set_item_name_patch((prev) => {
          const next = new Map(prev);
          next.set(id, nm);
          return next;
        });
      }
    })();

    return () => {
      is_cancelled = true;
    };
  }, [orders, item_name_by_id, item_name_patch]);

  const on_click_search = () => {
    load_orders();
  };

  // CSV 다운로드
  const on_download_csv = () => {
    const rows = line_rows;
    if (!rows.length) {
      alert("다운로드할 데이터가 없습니다.");
      return;
    }

    const cols = [
      "수주번호",
      "수주일자",
      "지점명",
      "품목명",
      "수량",
      "희망 입고일",
      "상태",
    ];

    let csv = cols.join(",") + "\n";

    rows.forEach((r) => {
      const lineValues = [
        r.order_id,
        display_date({ created_at: r.created_at, order_id: r.order_id }),
        r.branch_name ?? "",
        r.item_name ?? "",
        String(r.quantity ?? 0),
        r.desired_due_date
          ? display_date({ created_at: r.desired_due_date, order_id: r.order_id })
          : "",
        r.status ?? "",
      ];

      const line = lineValues
        .map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`)
        .join(",");
      csv += line + "\n";
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "branch_orders.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const go_new_order = () => navigate("/branch-order/new");

  // 자동완성 필터
  const filtered_suggests = useMemo(() => {
    const kw = order_id_search.trim().toLowerCase();
    if (!kw) return [];
    return order_id_suggestions
      .filter((s) => s.toLowerCase().includes(kw))
      .slice(0, 10);
  }, [order_id_search, order_id_suggestions]);

  // 바깥 클릭 시 자동완성 닫기
  useEffect(() => {
    const on_doc_click = (e: MouseEvent) => {
      if (!suggest_wrap_ref.current) return;
      if (!suggest_wrap_ref.current.contains(e.target as Node)) {
        set_is_show_suggest(false);
      }
    };
    document.addEventListener("mousedown", on_doc_click);
    return () => document.removeEventListener("mousedown", on_doc_click);
  }, []);

  /* ===== 테이블 헤더/바디 ===== */

  const thead = (
    <tr>
      <th style={th_style}>수주번호</th>
      <th style={th_style}>수주일자</th>
      <th style={th_style}>지점명</th>
      <th style={th_style}>품목명</th>
      <th style={th_style}>수량</th>
      <th style={th_style}>희망 입고일</th>
      <th style={th_style}>상태</th>
    </tr>
  );

  const tbody = line_rows.map((o, idx) => {
    const bg = idx % 2 === 1 ? { background: ui.zebra } : undefined;
    return (
      <tr key={`${o.order_id}_${idx}`} style={bg}>
        <td style={td_style}>{o.order_id}</td>
        <td style={td_style}>
          {display_date({ created_at: o.created_at, order_id: o.order_id })}
        </td>
        <td style={td_style}>{o.branch_name}</td>
        <td style={td_style}>{o.item_name}</td>
        <td style={td_style}>{money(o.quantity ?? 0)}</td>
        <td style={td_style}>
          {o.desired_due_date
            ? display_date({
                created_at: o.desired_due_date,
                order_id: o.order_id,
              })
            : ""}
        </td>
        <td style={td_style}>
          <span style={badge_style()}>{o.status}</span>
        </td>
      </tr>
    );
  });

  return (
    <div style={page_wrap}>
      <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>수주 내역 조회</h1>

      {/* 필터 영역 */}
      <div style={header_row}>
        {/* 지점 */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <label
            style={{
              color: ui.muted,
              fontSize: 13,
              fontWeight: 600,
              marginBottom: 4,
            }}
          >
            지점
          </label>
          <select
            style={select_style}
            value={branch_filter}
            onChange={(e) => set_branch_filter(e.target.value)}
          >
            <option value="">전체</option>
            {branches.map((b) => (
              <option key={b.id} value={String(b.id)}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        {/* 상태 */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <label
            style={{
              color: ui.muted,
              fontSize: 13,
              fontWeight: 600,
              marginBottom: 4,
            }}
          >
            상태
          </label>
          <select
            style={select_style}
            value={status_filter}
            onChange={(e) => set_status_filter(e.target.value)}
          >
            <option value="">전체</option>
            {status_options.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* 기간 시작 */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <label
            style={{
              color: ui.muted,
              fontSize: 13,
              fontWeight: 600,
              marginBottom: 4,
            }}
          >
            기간 시작
          </label>
          <input
            type="date"
            style={input_style}
            value={start_date}
            onChange={(e) => set_start_date(e.target.value)}
          />
        </div>

        {/* 기간 종료 */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <label
            style={{
              color: ui.muted,
              fontSize: 13,
              fontWeight: 600,
              marginBottom: 4,
            }}
          >
            기간 종료
          </label>
          <input
            type="date"
            style={input_style}
            value={end_date}
            onChange={(e) => set_end_date(e.target.value)}
          />
        </div>

        {/* 수주번호 + 자동완성 */}
        <div
          style={{ display: "flex", flexDirection: "column", position: "relative" }}
          ref={suggest_wrap_ref}
        >
          <label
            style={{
              color: ui.muted,
              fontSize: 13,
              fontWeight: 600,
              marginBottom: 4,
            }}
          >
            수주번호
          </label>
          <input
            style={{ ...input_style, width: "100%" }}
            placeholder="예: BR_1"
            value={order_id_search}
            onChange={(e) => {
              set_order_id_search(e.target.value);
              set_is_show_suggest(true);
            }}
            onFocus={() => set_is_show_suggest(true)}
          />
          {is_show_suggest && filtered_suggests.length > 0 && (
            <div
              style={{
                position: "absolute",
                top: 68,
                left: 0,
                right: 0,
                border: `1px solid ${ui.border}`,
                background: "#fff",
                borderRadius: 8,
                boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
                zIndex: 20,
                maxHeight: 220,
                overflowY: "auto",
              }}
            >
              {filtered_suggests.map((s) => (
                <div
                  key={s}
                  onMouseDown={() => {
                    set_order_id_search(s);
                    set_is_show_suggest(false);
                  }}
                  style={{
                    padding: "10px 12px",
                    cursor: "pointer",
                    borderBottom: `1px solid ${ui.border}`,
                  }}
                >
                  {s}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 검색 버튼 */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <label
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "transparent",
            }}
          >
            검색
          </label>
          <button
            type="button"
            style={search_btn}
            onClick={on_click_search}
            disabled={is_loading}
          >
            검색
          </button>
        </div>

        {/* 등록 버튼 */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <label
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "transparent",
            }}
          >
            등록
          </label>
          <button
            type="button"
            style={primary_btn}
            onClick={go_new_order}
          >
            수주 등록
          </button>
        </div>

        {/* 2행: CSV / 에러 */}
        <div style={{ gridColumn: "1 / -1" }}>
          <div style={sub_row}>
            <div style={{ fontWeight: 600, color: "#0f172a" }}>
              내보내기
            </div>
            <button
              type="button"
              style={csv_btn}
              onClick={on_download_csv}
            >
              CSV 다운로드
            </button>
            {error_msg && (
              <div
                style={{
                  color: ui.danger,
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                {error_msg}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 테이블 */}
      <div style={card_table_wrap}>
        <div style={table_scroll}>
          <table style={table_style}>
            <thead>{thead}</thead>
            <tbody>
              {is_loading ? (
                <tr>
                  <td
                    style={{
                      ...td_style,
                      textAlign: "center",
                      color: ui.muted,
                    }}
                    colSpan={7}
                  >
                    불러오는 중…
                  </td>
                </tr>
              ) : line_rows.length === 0 ? (
                <tr>
                  <td
                    style={{
                      ...td_style,
                      textAlign: "center",
                      color: ui.muted,
                    }}
                    colSpan={7}
                  >
                    데이터 없음
                  </td>
                </tr>
              ) : (
                tbody
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BranchOrderListPage;

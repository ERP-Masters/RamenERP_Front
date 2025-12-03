// src/pages/SalesDashboardPage.tsx
import React, { useEffect, useMemo, useState } from "react";

import {
  fetch_branch_orders_all,
  type BranchOrder,
} from "@/api/branch_orders";

import {
  fetch_branches,
  fetch_items,
  fetch_item_name_by_id,
  prime_item_name_cache,
  type BranchOption,
  type ItemOption,
} from "@/api/master_data";

/* ================= 공통 UI 토큰 ================= */
const ui = {
  border: "#e5e7eb",
  zebra: "#f9fafb",
  muted: "#6b7280",
  danger: "#dc2626",
  primaryBg: "#0ea5e9",
  primaryBd: "#0284c7",
  primaryTx: "#ffffff",
  cardBg: "#ffffff",
  pageBg: "#f3f4f6",
  radius: 10,
} as const;

const page_wrap: React.CSSProperties = {
  maxWidth: 1280,
  margin: "0 auto",
  padding: 16,
  display: "flex",
  flexDirection: "column",
  gap: 16,
  background: ui.pageBg,
  color: "#0f172a",
};

const card: React.CSSProperties = {
  borderRadius: ui.radius,
  border: `1px solid ${ui.border}`,
  background: ui.cardBg,
  padding: 16,
};

const card_header_row: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: 8,
};

const card_title: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 700,
};

const small_btn: React.CSSProperties = {
  borderRadius: 6,
  border: `1px solid ${ui.border}`,
  background: "#ffffff",
  padding: "6px 10px",
  fontSize: 12,
  cursor: "pointer",
};

const table_style: React.CSSProperties = {
  width: "100%",
  borderCollapse: "separate",
  borderSpacing: 0,
  fontSize: 13,
};

const th_style: React.CSSProperties = {
  textAlign: "left",
  padding: "8px 6px",
  borderBottom: `1px solid ${ui.border}`,
  whiteSpace: "nowrap",
  background: "#f9fafb",
};

const td_style: React.CSSProperties = {
  padding: "8px 6px",
  borderBottom: `1px solid ${ui.border}`,
  whiteSpace: "nowrap",
};

/* ===== 모달 스타일 ===== */
const modal_overlay: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(15,23,42,0.45)",
  zIndex: 999,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const modal_card: React.CSSProperties = {
  background: "#ffffff",
  borderRadius: 10,
  border: `1px solid ${ui.border}`,
  width: "90%",
  maxWidth: 900,
  maxHeight: "80vh",
  display: "flex",
  flexDirection: "column",
  boxShadow: "0 18px 45px rgba(15,23,42,0.35)",
};

const modal_header: React.CSSProperties = {
  padding: "10px 16px",
  borderBottom: `1px solid ${ui.border}`,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
};

const modal_body: React.CSSProperties = {
  padding: 16,
  overflow: "auto",
};

const modal_search_wrap: React.CSSProperties = {
  marginBottom: 12,
  display: "flex",
  gap: 8,
  alignItems: "center",
  flexWrap: "wrap",
};

const modal_search_input_wrap: React.CSSProperties = {
  position: "relative",
  maxWidth: 260,
  width: "100%",
};

const modal_search_input: React.CSSProperties = {
  width: "100%",
  borderRadius: 8,
  border: `1px solid ${ui.border}`,
  padding: "6px 10px",
  fontSize: 13,
};

const suggest_box: React.CSSProperties = {
  position: "absolute",
  top: 32,
  left: 0,
  right: 0,
  background: "#ffffff",
  borderRadius: 8,
  border: `1px solid ${ui.border}`,
  boxShadow: "0 8px 20px rgba(15,23,42,0.15)",
  zIndex: 10,
  maxHeight: 200,
  overflowY: "auto",
  fontSize: 12,
};

/* ================= 유틸 함수 ================= */

function money(n: number | undefined | null): string {
  const v = Number(n ?? 0);
  return new Intl.NumberFormat("ko-KR").format(
    Number.isFinite(v) ? v : 0,
  );
}

function get_date_parts(iso?: string | null): {
  year: number | null;
  month: number | null;
  day: number | null;
} {
  if (!iso) return { year: null, month: null, day: null };
  const d = new Date(iso);
  if (Number.isNaN(d.getTime()))
    return { year: null, month: null, day: null };
  return {
    year: d.getFullYear(),
    month: d.getMonth() + 1,
    day: d.getDate(),
  };
}

function to_ym(iso?: string | null): string | null {
  const { year, month } = get_date_parts(iso);
  if (!year || !month) return null;
  return `${year}-${String(month).padStart(2, "0")}`;
}

function format_ym_kor(ym: string): string {
  const [y, m] = ym.split("-");
  const mm = Number(m || "0");
  if (!y || !mm) return ym;
  return `${y}년 ${mm}월`;
}

/* 금액 결정: amount 우선, 없으면 quantity * unit_price */
function calc_amount(o: BranchOrder): number {
  if (typeof o.amount === "number" && Number.isFinite(o.amount)) {
    return o.amount;
  }
  const q = Number(o.quantity ?? 0);
  const up = Number(o.unit_price ?? 0);
  const v = q * up;
  return Number.isFinite(v) ? v : 0;
}

/* 파이차트용 타입 */
type PieSegment = {
  label: string;
  value: number;
  color: string;
};

/* conic-gradient 문자열 생성 */
function make_conic_gradient(segments: PieSegment[]): string {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  if (total <= 0) {
    return "conic-gradient(#e5e7eb 0deg 360deg)";
  }

  let acc = 0;
  const parts: string[] = [];

  segments.forEach((seg) => {
    const start_deg = (acc / total) * 360;
    const end_deg = ((acc + seg.value) / total) * 360;
    parts.push(`${seg.color} ${start_deg}deg ${end_deg}deg`);
    acc += seg.value;
  });

  return `conic-gradient(${parts.join(",")})`;
}

/* 간단 파이차트 컴포넌트 */
type SimplePieProps = {
  segments: PieSegment[];
};

const SimplePie: React.FC<SimplePieProps> = ({ segments }) => {
  const gradient = make_conic_gradient(segments);
  return (
    <div
      style={{
        width: 140,
        height: 140,
        borderRadius: "50%",
        border: `1px solid ${ui.border}`,
        backgroundImage: gradient,
      }}
    />
  );
};

/* ================= 타입 정의 ================= */

type BranchTotalRow = {
  branch_id: number;
  branch_name: string;
  total_amount: number;
  order_count: number;
};

type BranchMonthlyRow = {
  branch_id: number;
  branch_name: string;
  ym: string; // YYYY-MM
  amount: number;
};

type ItemSalesRow = {
  item_id: number;
  amount: number;
};

/* ================= 메인 페이지 ================= */

const SalesDashboardPage: React.FC = () => {
  // 원본 데이터
  const [orders, set_orders] = useState<BranchOrder[]>([]);
  const [branches, set_branches] = useState<BranchOption[]>([]);
  const [items, set_items] = useState<ItemOption[]>([]);

  const [is_loading, set_is_loading] = useState<boolean>(false);
  const [error_msg, set_error_msg] = useState<string>("");

  // 상단 필터: 연도만 사용
  const [selected_year, set_selected_year] = useState<string>("");

  // 캘린더용 월 선택 + 뷰 모드
  const [calendar_month, set_calendar_month] = useState<string>("");
  const [calendar_view_mode, set_calendar_view_mode] =
    useState<"calendar" | "table">("calendar");

  // 지점/품목 이름 맵
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

  // 품목명 보강용 캐시 (NOTUSED 품목 등)
  const [item_name_patch, set_item_name_patch] = useState<Map<number, string>>(
    () => new Map(),
  );

  // 모달 표시 여부
  const [is_show_total_modal, set_is_show_total_modal] =
    useState<boolean>(false);
  const [is_show_monthly_modal, set_is_show_monthly_modal] =
    useState<boolean>(false);
  const [is_show_item_modal, set_is_show_item_modal] =
    useState<boolean>(false);

  // 모달 검색 상태 + 월 필터
  const [total_modal_keyword, set_total_modal_keyword] =
    useState<string>("");
  const [monthly_modal_keyword, set_monthly_modal_keyword] =
    useState<string>("");
  const [item_modal_keyword, set_item_modal_keyword] =
    useState<string>("");

  const [monthly_modal_month, set_monthly_modal_month] =
    useState<string>(""); // YYYY-MM

  /* ===== 데이터 로드 ===== */
  useEffect(() => {
    let is_cancelled = false;

    (async () => {
      set_is_loading(true);
      set_error_msg("");
      try {
        const [bo, br, its] = await Promise.all([
          fetch_branch_orders_all(),
          fetch_branches(),
          fetch_items(),
        ]);
        if (is_cancelled) return;

        // 수주 중 COMPLETED만 사용
        const completed = (bo ?? []).filter(
          (o: BranchOrder) => o.status === "COMPLETED",
        );

        set_orders(completed);
        set_branches(br ?? []);
        set_items(its ?? []);
        prime_item_name_cache(its ?? []);

        // 기본 연도: 데이터 중 가장 최근 연도
        const years = Array.from(
          new Set(
            completed
              .map((o) => get_date_parts(o.created_at).year)
              .filter((y): y is number => !!y),
          ),
        ).sort((a, b) => a - b);
        if (years.length && !selected_year) {
          const latest_year = String(years[years.length - 1]);
          set_selected_year(latest_year);

          // 기본 캘린더 월: 해당 연도 중 가장 최근 월
          const months_for_latest = Array.from(
            new Set(
              completed
                .filter((o) => {
                  const { year } = get_date_parts(o.created_at);
                  return year && String(year) === latest_year;
                })
                .map((o) => get_date_parts(o.created_at).month)
                .filter((m): m is number => !!m),
            ),
          ).sort((a, b) => a - b);
          if (months_for_latest.length) {
            set_calendar_month(
              String(
                months_for_latest[months_for_latest.length - 1],
              ).padStart(2, "0"),
            );
          }
        }
      } catch (e: any) {
        if (!is_cancelled) {
          set_error_msg(e?.message || "매출 데이터 로드 실패");
        }
      } finally {
        if (!is_cancelled) {
          set_is_loading(false);
        }
      }
    })();

    return () => {
      is_cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ===== 품목명 보강 (NOTUSED 품목 등) ===== */
  useEffect(() => {
    const need_ids = Array.from(
      new Set(
        orders
          .map((o) => o.item_id)
          .filter((id) => typeof id === "number"),
      ),
    ).filter((id) => {
      if (!id) return false;
      const in_master = !!item_name_by_id.get(id);
      const in_patch = !!item_name_patch.get(id);
      return !in_master && !in_patch;
    });

    if (need_ids.length === 0) return;

    let is_cancelled = false;
    (async () => {
      for (const id of need_ids) {
        try {
          const nm = await fetch_item_name_by_id(id);
          if (is_cancelled || !nm) continue;
          set_item_name_patch((prev) => {
            const next = new Map(prev);
            next.set(id, nm);
            return next;
          });
        } catch {
          // ignore
        }
      }
    })();

    return () => {
      is_cancelled = true;
    };
  }, [orders, item_name_by_id, item_name_patch]);

  /* ===== 연도 옵션 ===== */
  const year_options = useMemo(() => {
    const ys = Array.from(
      new Set(
        orders
          .map((o) => get_date_parts(o.created_at).year)
          .filter((y): y is number => !!y),
      ),
    ).sort((a, b) => a - b);
    return ys;
  }, [orders]);

  /* ===== 캘린더 월 옵션 (선택 연도 기준) ===== */
  const calendar_month_options = useMemo(() => {
    if (!selected_year) return [];
    const ms = Array.from(
      new Set(
        orders
          .filter((o) => {
            const { year } = get_date_parts(o.created_at);
            return year && String(year) === selected_year;
          })
          .map((o) => get_date_parts(o.created_at).month)
          .filter((m): m is number => !!m),
      ),
    ).sort((a, b) => a - b);
    return ms;
  }, [orders, selected_year]);

  // 연도 변경 시 기본 월 세팅
  useEffect(() => {
    if (!selected_year) {
      set_calendar_month("");
      return;
    }
    if (!calendar_month_options.length) {
      set_calendar_month("");
      return;
    }
    if (!calendar_month) {
      const latest = calendar_month_options[calendar_month_options.length - 1];
      set_calendar_month(String(latest).padStart(2, "0"));
    }
  }, [selected_year, calendar_month_options, calendar_month]);

  /* ===== 연도 필터 적용된 주문 ===== */
  const filtered_orders = useMemo(() => {
    let base = orders;
    if (selected_year) {
      base = base.filter((o) => {
        const { year } = get_date_parts(o.created_at);
        return year && String(year) === selected_year;
      });
    }
    return base;
  }, [orders, selected_year]);

  /* ===== 상단 요약 카드 (연간) ===== */
  const summary = useMemo(() => {
    const total = filtered_orders.reduce(
      (sum, o) => sum + calc_amount(o),
      0,
    );
    const count = filtered_orders.length;
    const avg = count ? total / count : 0;

    return {
      total_amount: total,
      order_count: count,
      avg_amount: avg,
    };
  }, [filtered_orders]);

  /* ===== 지점별 총 매출 (전체 기간 / 연도 기준) ===== */
  const branch_total_rows_all: BranchTotalRow[] = useMemo(() => {
    const map = new Map<number, BranchTotalRow>();

    filtered_orders.forEach((o) => {
      if (!o.branch_id) return;
      const id = o.branch_id;
      const base_name =
        o.branch_name ??
        branch_name_by_id.get(id) ??
        `지점 ${id}`;
      const prev = map.get(id);
      const amt = calc_amount(o);

      if (!prev) {
        map.set(id, {
          branch_id: id,
          branch_name: base_name,
          total_amount: amt,
          order_count: 1,
        });
      } else {
        prev.total_amount += amt;
        prev.order_count += 1;
      }
    });

    return Array.from(map.values()).sort(
      (a, b) => b.total_amount - a.total_amount,
    );
  }, [filtered_orders, branch_name_by_id]);

  const branch_total_rows_top5 = useMemo(
    () => branch_total_rows_all.slice(0, 5),
    [branch_total_rows_all],
  );

  const branch_total_pie_segments: PieSegment[] = useMemo(() => {
    const top5 = branch_total_rows_all.slice(0, 5);
    const others_sum = branch_total_rows_all
      .slice(5)
      .reduce((sum, r) => sum + r.total_amount, 0);

    const base_colors = [
      "#0ea5e9",
      "#22c55e",
      "#f97316",
      "#a855f7",
      "#ec4899",
      "#9ca3af",
    ];

    const segs: PieSegment[] = top5.map((row, idx) => ({
      label: row.branch_name,
      value: row.total_amount,
      color: base_colors[idx] ?? "#0ea5e9",
    }));

    if (others_sum > 0) {
      segs.push({
        label: "기타",
        value: others_sum,
        color: base_colors[5],
      });
    }

    return segs;
  }, [branch_total_rows_all]);

  /* ===== 지점별 월간 매출 (연도 기준, 월 제한 없음) ===== */
  const monthly_filtered_orders = useMemo(() => {
    let base = orders.filter(
      (o) => o.status === "COMPLETED",
    );
    if (selected_year) {
      base = base.filter((o) => {
        const { year } = get_date_parts(o.created_at);
        return year && String(year) === selected_year;
      });
    }
    return base;
  }, [orders, selected_year]);

  const branch_monthly_rows_all: BranchMonthlyRow[] = useMemo(() => {
    const map = new Map<string, BranchMonthlyRow>();
    monthly_filtered_orders.forEach((o) => {
      if (!o.branch_id) return;
      const ym = to_ym(o.created_at);
      if (!ym) return;

      const key = `${o.branch_id}-${ym}`;
      const name =
        o.branch_name ??
        branch_name_by_id.get(o.branch_id) ??
        `지점 ${o.branch_id}`;
      const amt = calc_amount(o);

      const prev = map.get(key);
      if (!prev) {
        map.set(key, {
          branch_id: o.branch_id,
          branch_name: name,
          ym,
          amount: amt,
        });
      } else {
        prev.amount += amt;
      }
    });

    return Array.from(map.values()).sort(
      (a, b) => b.amount - a.amount,
    );
  }, [monthly_filtered_orders, branch_name_by_id]);

  // 모달에서 사용할 월 옵션 (YYYY-MM 리스트)
  const monthly_modal_ym_options = useMemo(
    () =>
      Array.from(
        new Set(branch_monthly_rows_all.map((r) => r.ym)),
      ).sort(),
    [branch_monthly_rows_all],
  );

  // "현재 월" 기준으로 사용할 YM 결정
  const monthly_current_ym = useMemo(() => {
    // 1) 연도 + 월이 선택되어 있고, 해당 YM 데이터가 있으면 그걸 사용
    if (selected_year && calendar_month) {
      const ym = `${selected_year}-${calendar_month}`;
      const exists = branch_monthly_rows_all.some(
        (r) => r.ym === ym,
      );
      if (exists) return ym;
    }

    // 2) 아니면 데이터 전체 중 가장 최신 YM 사용
    if (!branch_monthly_rows_all.length) return "";
    const yms = Array.from(
      new Set(branch_monthly_rows_all.map((r) => r.ym)),
    ).sort();
    return yms[yms.length - 1] ?? "";
  }, [selected_year, calendar_month, branch_monthly_rows_all]);

  // 현재 월에 해당하는 지점-월 매출
  const branch_monthly_rows_current: BranchMonthlyRow[] =
    useMemo(() => {
      if (!monthly_current_ym) return [];
      return branch_monthly_rows_all.filter(
        (r) => r.ym === monthly_current_ym,
      );
    }, [branch_monthly_rows_all, monthly_current_ym]);

  const branch_monthly_rows_top5 = useMemo(
    () => branch_monthly_rows_current.slice(0, 5),
    [branch_monthly_rows_current],
  );

  const branch_monthly_pie_segments: PieSegment[] = useMemo(() => {
    const top5 = branch_monthly_rows_current.slice(0, 5);
    const others_sum = branch_monthly_rows_current
      .slice(5)
      .reduce((sum, r) => sum + r.amount, 0);

    const base_colors = [
      "#0ea5e9",
      "#22c55e",
      "#f97316",
      "#a855f7",
      "#ec4899",
      "#9ca3af",
    ];

    const segs: PieSegment[] = top5.map((row, idx) => ({
      label: row.branch_name,
      value: row.amount,
      color: base_colors[idx] ?? "#0ea5e9",
    }));

    if (others_sum > 0) {
      segs.push({
        label: "기타",
        value: others_sum,
        color: base_colors[5],
      });
    }

    return segs;
  }, [branch_monthly_rows_current]);

  /* ===== 캘린더용: 선택 연도 + 월 기준 일별 매출 ===== */
  const calendar_daily_rows = useMemo(() => {
    if (!selected_year || !calendar_month) return [];
    const year_num = Number(selected_year);
    const month_num = Number(calendar_month);

    if (!Number.isFinite(year_num) || !Number.isFinite(month_num)) {
      return [];
    }

    const map = new Map<string, number>();
    orders.forEach((o) => {
      const { year, month, day } = get_date_parts(o.created_at);
      if (!year || !month || !day) return;
      if (year !== year_num || month !== month_num) return;
      const key = `${year}-${String(month).padStart(
        2,
        "0",
      )}-${String(day).padStart(2, "0")}`;
      const prev = map.get(key) ?? 0;
      map.set(key, prev + calc_amount(o));
    });

    return Array.from(map.entries())
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => (a.date < b.date ? -1 : 1));
  }, [orders, selected_year, calendar_month]);

  const calendar_month_total = useMemo(
    () =>
      calendar_daily_rows.reduce(
        (sum, r) => sum + r.amount,
        0,
      ),
    [calendar_daily_rows],
  );

  const calendar_amount_by_day = useMemo(() => {
    const m = new Map<number, number>();
    calendar_daily_rows.forEach((r) => {
      const parts = r.date.split("-");
      const day = Number(parts[2] ?? "0");
      if (!Number.isFinite(day)) return;
      m.set(day, r.amount);
    });
    return m;
  }, [calendar_daily_rows]);

  /* ===== 품목별 매출 (집계) ===== */
  const item_sales_rows: ItemSalesRow[] = useMemo(() => {
    const map = new Map<number, ItemSalesRow>();
    filtered_orders.forEach((o) => {
      if (!o.item_id) return;
      const prev = map.get(o.item_id) ?? {
        item_id: o.item_id,
        amount: 0,
      };
      prev.amount += calc_amount(o);
      map.set(o.item_id, prev);
    });

    const arr = Array.from(map.values()).sort(
      (a, b) => b.amount - a.amount,
    );
    return arr;
  }, [filtered_orders]);

  const item_sales_top5 = useMemo(
    () => item_sales_rows.slice(0, 5),
    [item_sales_rows],
  );

  const item_pie_segments: PieSegment[] = useMemo(() => {
    const top5 = item_sales_top5;
    const others_sum = item_sales_rows
      .slice(5)
      .reduce((sum, r) => sum + r.amount, 0);

    const base_colors = [
      "#0ea5e9",
      "#22c55e",
      "#f97316",
      "#a855f7",
      "#ec4899",
      "#9ca3af",
    ];

    const segs: PieSegment[] = top5.map((row, idx) => {
      const name =
        item_name_by_id.get(row.item_id) ??
        item_name_patch.get(row.item_id) ??
        `품목 ${row.item_id}`;
      return {
        label: name,
        value: row.amount,
        color: base_colors[idx] ?? "#0ea5e9",
      };
    });

    if (others_sum > 0) {
      segs.push({
        label: "기타",
        value: others_sum,
        color: base_colors[5],
      });
    }

    return segs;
  }, [item_sales_top5, item_sales_rows, item_name_by_id, item_name_patch]);

  /* ===== 모달용 검색 + 필터링 ===== */
  const total_modal_filtered_rows = useMemo(() => {
    const kw = total_modal_keyword.trim().toLowerCase();
    if (!kw) return branch_total_rows_all;
    return branch_total_rows_all.filter((r) =>
      r.branch_name.toLowerCase().includes(kw),
    );
  }, [branch_total_rows_all, total_modal_keyword]);

  const monthly_modal_filtered_rows = useMemo(() => {
    const kw = monthly_modal_keyword.trim().toLowerCase();
    const base = monthly_modal_month
      ? branch_monthly_rows_all.filter(
          (r) => r.ym === monthly_modal_month,
        )
      : branch_monthly_rows_all;
    if (!kw) return base;
    return base.filter((r) =>
      r.branch_name.toLowerCase().includes(kw),
    );
  }, [
    branch_monthly_rows_all,
    monthly_modal_keyword,
    monthly_modal_month,
  ]);

  const item_modal_filtered_rows = useMemo(() => {
    const kw = item_modal_keyword.trim().toLowerCase();
    if (!kw) return item_sales_rows;
    return item_sales_rows.filter((r) => {
      const name =
        item_name_by_id.get(r.item_id) ??
        item_name_patch.get(r.item_id) ??
        `품목 ${r.item_id}`;
      return name.toLowerCase().includes(kw);
    });
  }, [item_sales_rows, item_modal_keyword, item_name_by_id, item_name_patch]);

  /* ===== 자동완성 리스트 ===== */
  const total_modal_suggests = useMemo(() => {
    const kw = total_modal_keyword.trim().toLowerCase();
    if (!kw) return [];
    const names = Array.from(
      new Set(
        branch_total_rows_all.map((r) => r.branch_name),
      ),
    );
    return names
      .filter((n) => n.toLowerCase().includes(kw))
      .slice(0, 8);
  }, [branch_total_rows_all, total_modal_keyword]);

  const monthly_modal_suggests = useMemo(() => {
    const kw = monthly_modal_keyword.trim().toLowerCase();
    if (!kw) return [];
    const names = Array.from(
      new Set(
        branch_monthly_rows_all.map((r) => r.branch_name),
      ),
    );
    return names
      .filter((n) => n.toLowerCase().includes(kw))
      .slice(0, 8);
  }, [branch_monthly_rows_all, monthly_modal_keyword]);

  const item_modal_suggests = useMemo(() => {
    const kw = item_modal_keyword.trim().toLowerCase();
    if (!kw) return [];
    const names = Array.from(
      new Set(
        item_sales_rows.map((r) => {
          return (
            item_name_by_id.get(r.item_id) ??
            item_name_patch.get(r.item_id) ??
            `품목 ${r.item_id}`
          );
        }),
      ),
    );
    return names
      .filter((n) => n.toLowerCase().includes(kw))
      .slice(0, 8);
  }, [item_sales_rows, item_modal_keyword, item_name_by_id, item_name_patch]);

  /* ===== 캘린더 뷰 렌더 ===== */
  const render_calendar_view = () => {
    if (!selected_year || !calendar_month) {
      return (
        <div
          style={{
            padding: 12,
            fontSize: 13,
            color: ui.muted,
          }}
        >
          연도와 월 데이터를 먼저 선택해주세요.
        </div>
      );
    }

    const year_num = Number(selected_year);
    const month_num = Number(calendar_month);
    if (
      !Number.isFinite(year_num) ||
      !Number.isFinite(month_num)
    ) {
      return (
        <div
          style={{
            padding: 12,
            fontSize: 13,
            color: ui.muted,
          }}
        >
          잘못된 연도/월입니다.
        </div>
      );
    }

    const first_date = new Date(year_num, month_num - 1, 1);
    const first_weekday = first_date.getDay(); // 0: 일요일
    const days_in_month = new Date(
      year_num,
      month_num,
      0,
    ).getDate();

    const cells: { day?: number }[] = [];
    for (let i = 0; i < first_weekday; i += 1) {
      cells.push({});
    }
    for (let d = 1; d <= days_in_month; d += 1) {
      cells.push({ day: d });
    }

    const weeks: { day?: number }[][] = [];
    for (let i = 0; i < cells.length; i += 7) {
      weeks.push(cells.slice(i, i + 7));
    }

    const week_header = ["일", "월", "화", "수", "목", "금", "토"];

    return (
      <div>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            tableLayout: "fixed",
            fontSize: 12,
          }}
        >
          <thead>
            <tr>
              {week_header.map((w) => (
                <th
                  key={w}
                  style={{
                    padding: "6px 4px",
                    borderBottom: `1px solid ${ui.border}`,
                    textAlign: "center",
                    background: "#f9fafb",
                  }}
                >
                  {w}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {weeks.map((week, idx) => (
              <tr key={idx}>
                {week.map((cell, i2) => {
                  const day = cell.day;
                  const amount =
                    typeof day === "number"
                      ? calendar_amount_by_day.get(day) ?? 0
                      : 0;
                  const has_value = amount > 0;

                  return (
                    <td
                      key={`${idx}_${i2}`}
                      style={{
                        borderBottom: `1px solid ${ui.border}`,
                        borderRight:
                          i2 === 6
                            ? undefined
                            : `1px solid ${ui.border}`,
                        verticalAlign: "top",
                        padding: 4,
                        height: 70,
                        background: has_value
                          ? "#eff6ff"
                          : "#ffffff",
                      }}
                    >
                      {typeof day === "number" && (
                        <>
                          <div
                            style={{
                              fontWeight: 600,
                              marginBottom: 4,
                            }}
                          >
                            {day}
                          </div>
                          <div
                            style={{
                              fontSize: 11,
                              color: has_value
                                ? "#111827"
                                : ui.muted,
                              wordBreak: "keep-all",
                            }}
                          >
                            ₩ {money(amount)}
                          </div>
                        </>
                      )}
                    </td>
                  );
                })}
                {/* 마지막 주에서 셀 부족하면 채우기 */}
                {week.length < 7 &&
                  Array.from({
                    length: 7 - week.length,
                  }).map((_, k) => (
                    <td
                      key={`empty_${idx}_${k}`}
                      style={{
                        borderBottom: `1px solid ${ui.border}`,
                        padding: 4,
                        height: 70,
                      }}
                    />
                  ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  /* ================= 렌더 ================= */
  return (
    <div style={page_wrap}>
      <h1
        style={{
          margin: 0,
          fontSize: 22,
          fontWeight: 800,
        }}
      >
        매출 현황 대시보드
      </h1>

      {/* 상단 필터: 연도만 사용 */}
      <div style={card}>
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: ui.muted,
            marginBottom: 4,
          }}
        >
          연도
        </div>
        <select
          style={{
            width: "200px",
            maxWidth: "100%",
            borderRadius: 8,
            border: `1px solid ${ui.border}`,
            padding: "8px 10px",
            fontSize: 13,
          }}
          value={selected_year}
          onChange={(e) =>
            set_selected_year(e.target.value)
          }
        >
          <option value="">전체</option>
          {year_options.map((y) => (
            <option key={y} value={String(y)}>
              {y}년
            </option>
          ))}
        </select>
        {is_loading && (
          <div
            style={{
              marginTop: 6,
              fontSize: 12,
              color: ui.muted,
            }}
          >
            매출 데이터를 불러오는 중입니다…
          </div>
        )}
      </div>

      {/* 상단 요약 카드 (연간 기준) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(3, minmax(0, 1fr))",
          gap: 12,
        }}
      >
        <div style={card}>
          <div
            style={{
              fontSize: 12,
              color: ui.muted,
            }}
          >
            연간 총 매출
          </div>
          <div
            style={{
              marginTop: 6,
              fontSize: 22,
              fontWeight: 800,
            }}
          >
            ₩ {money(summary.total_amount)}
          </div>
        </div>
        <div style={card}>
          <div
            style={{
              fontSize: 12,
              color: ui.muted,
            }}
          >
            완료 수주 건수
          </div>
          <div
            style={{
              marginTop: 6,
              fontSize: 22,
              fontWeight: 800,
            }}
          >
            {summary.order_count.toLocaleString("ko-KR")}
            건
          </div>
        </div>
        <div style={card}>
          <div
            style={{
              fontSize: 12,
              color: ui.muted,
            }}
          >
            평균 주문 금액
          </div>
          <div
            style={{
              marginTop: 6,
              fontSize: 22,
              fontWeight: 800,
            }}
          >
            ₩ {money(summary.avg_amount)}
          </div>
        </div>
      </div>

      {/* 지점별 매출 카드 2개 (총 매출 + 월간 매출) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(2, minmax(0, 1fr))",
          gap: 12,
        }}
      >
        {/* 지점별 총 매출 (TOP5 + 모달) */}
        <div style={card}>
          <div style={card_header_row}>
            <div style={card_title}>
              지점별 총 매출 (TOP 5)
            </div>
            <button
              type="button"
              style={small_btn}
              onClick={() => set_is_show_total_modal(true)}
            >
              자세히 보기
            </button>
          </div>
          <div
            style={{
              fontSize: 12,
              color: ui.muted,
              marginBottom: 8,
            }}
          >
            선택한 연도 기준으로 지점별 전체
            매출 랭킹을 집계합니다.
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "minmax(0, 1.2fr) minmax(0, 1fr)",
              gap: 12,
            }}
          >
            {/* TOP5 표 */}
            <div
              style={{
                maxHeight: 260,
                overflow: "auto",
              }}
            >
              <table style={table_style}>
                <thead>
                  <tr>
                    <th style={th_style}>순위</th>
                    <th style={th_style}>지점</th>
                    <th style={th_style}>총 매출</th>
                    <th style={th_style}>건수</th>
                  </tr>
                </thead>
                <tbody>
                  {branch_total_rows_top5.length === 0 ? (
                    <tr>
                      <td
                        style={{
                          ...td_style,
                          textAlign: "center",
                          color: ui.muted,
                        }}
                        colSpan={4}
                      >
                        데이터 없음
                      </td>
                    </tr>
                  ) : (
                    branch_total_rows_top5.map(
                      (r, idx) => (
                        <tr
                          key={r.branch_id}
                          style={
                            idx % 2 === 1
                              ? {
                                  background:
                                    ui.zebra,
                                }
                              : undefined
                          }
                        >
                          <td style={td_style}>
                            {idx + 1}
                          </td>
                          <td style={td_style}>
                            {r.branch_name}
                          </td>
                          <td style={td_style}>
                            ₩ {money(r.total_amount)}
                          </td>
                          <td style={td_style}>
                            {r.order_count.toLocaleString(
                              "ko-KR",
                            )}
                          </td>
                        </tr>
                      ),
                    )
                  )}
                </tbody>
              </table>
            </div>

            {/* 파이차트 + 범례 */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 12,
              }}
            >
              <SimplePie segments={branch_total_pie_segments} />
              <div
                style={{
                  fontSize: 11,
                  color: ui.muted,
                }}
              >
                상위 5개 지점은 개별 항목, 그
                외는 &quot;기타&quot;로
                묶어서 표시합니다.
              </div>
              <div
                style={{
                  width: "100%",
                  maxHeight: 140,
                  overflow: "auto",
                  fontSize: 12,
                }}
              >
                {branch_total_pie_segments.map((s) => {
                  const total =
                    branch_total_pie_segments.reduce(
                      (sum, v) => sum + v.value,
                      0,
                    ) || 1;
                  const pct =
                    (s.value / total) * 100;
                  return (
                    <div
                      key={s.label}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        marginBottom: 4,
                      }}
                    >
                      <span
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: 999,
                          background: s.color,
                        }}
                      />
                      <span
                        style={{
                          flex: 1,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {s.label}
                      </span>
                      <span>
                        {pct.toFixed(1)}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* 지점별 월간 매출 (현재 월 기준 TOP5 + 모달) */}
        <div style={card}>
          <div style={card_header_row}>
            <div style={card_title}>
              지점별 월간 매출 (TOP 5)
              {monthly_current_ym && (
                <span
                  style={{
                    marginLeft: 6,
                    fontSize: 12,
                    color: ui.muted,
                    fontWeight: 500,
                  }}
                >
                  {` - ${format_ym_kor(monthly_current_ym)}`}
                </span>
              )}
            </div>
            <button
              type="button"
              style={small_btn}
              onClick={() => {
                set_monthly_modal_month(
                  monthly_current_ym || "",
                );
                set_is_show_monthly_modal(true);
              }}
            >
              자세히 보기
            </button>
          </div>
          <div
            style={{
              fontSize: 12,
              color: ui.muted,
              marginBottom: 8,
            }}
          >
            현재 기준 월(
            {monthly_current_ym
              ? format_ym_kor(monthly_current_ym)
              : "데이터 없음"}
            )의 지점별 매출 TOP5를
            집계합니다. 다른 월 매출은 자세히
            보기에서 선택할 수 있습니다.
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "minmax(0, 1.2fr) minmax(0, 1fr)",
              gap: 12,
            }}
          >
            {/* 현재 월 TOP5 표 */}
            <div
              style={{
                maxHeight: 260,
                overflow: "auto",
              }}
            >
              <table style={table_style}>
                <thead>
                  <tr>
                    <th style={th_style}>순위</th>
                    <th style={th_style}>지점</th>
                    <th style={th_style}>월</th>
                    <th style={th_style}>매출</th>
                  </tr>
                </thead>
                <tbody>
                  {branch_monthly_rows_top5.length === 0 ? (
                    <tr>
                      <td
                        style={{
                          ...td_style,
                          textAlign: "center",
                          color: ui.muted,
                        }}
                        colSpan={4}
                      >
                        데이터 없음
                      </td>
                    </tr>
                  ) : (
                    branch_monthly_rows_top5.map(
                      (r, idx) => (
                        <tr
                          key={`${r.branch_id}_${r.ym}`}
                          style={
                            idx % 2 === 1
                              ? {
                                  background:
                                    ui.zebra,
                                }
                              : undefined
                          }
                        >
                          <td style={td_style}>
                            {idx + 1}
                          </td>
                          <td style={td_style}>
                            {r.branch_name}
                          </td>
                          <td style={td_style}>
                            {r.ym}
                          </td>
                          <td style={td_style}>
                            ₩ {money(r.amount)}
                          </td>
                        </tr>
                      ),
                    )
                  )}
                </tbody>
              </table>
            </div>

            {/* 현재 월 파이차트 + 범례 */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 12,
              }}
            >
              <SimplePie
                segments={branch_monthly_pie_segments}
              />
              <div
                style={{
                  fontSize: 11,
                  color: ui.muted,
                  textAlign: "center",
                }}
              >
                선택된 월의 상위 5개 지점은
                개별 항목, 그 외는
                &quot;기타&quot;로 묶어서
                표시합니다.
              </div>
              <div
                style={{
                  width: "100%",
                  maxHeight: 140,
                  overflow: "auto",
                  fontSize: 12,
                }}
              >
                {branch_monthly_pie_segments.map(
                  (s) => {
                    const total =
                      branch_monthly_pie_segments.reduce(
                        (sum, v) => sum + v.value,
                        0,
                      ) || 1;
                    const pct =
                      (s.value / total) * 100;
                    return (
                      <div
                        key={s.label}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          marginBottom: 4,
                        }}
                      >
                        <span
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: 999,
                            background: s.color,
                          }}
                        />
                        <span
                          style={{
                            flex: 1,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {s.label}
                        </span>
                        <span>
                          {pct.toFixed(1)}%
                        </span>
                      </div>
                    );
                  },
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 기간별 매출 (캘린더 / 표 토글) */}
      <div style={card}>
        <div style={card_header_row}>
          <div style={card_title}>기간별 매출</div>
          <div
            style={{
              display: "flex",
              gap: 6,
            }}
          >
            <button
              type="button"
              style={{
                ...small_btn,
                ...(calendar_view_mode === "calendar"
                  ? {
                      background: ui.primaryBg,
                      color: ui.primaryTx,
                      border: `1px solid ${ui.primaryBd}`,
                    }
                  : {}),
              }}
              onClick={() =>
                set_calendar_view_mode("calendar")
              }
            >
              캘린더
            </button>
            <button
              type="button"
              style={{
                ...small_btn,
                ...(calendar_view_mode === "table"
                  ? {
                      background: ui.primaryBg,
                      color: ui.primaryTx,
                      border: `1px solid ${ui.primaryBd}`,
                    }
                  : {}),
              }}
              onClick={() =>
                set_calendar_view_mode("table")
              }
            >
              표
            </button>
          </div>
        </div>

        {/* 월 선택 + 선택 월 총 매출 */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span
              style={{
                fontSize: 12,
                color: ui.muted,
              }}
            >
              월 선택
            </span>
            <select
              style={{
                minWidth: 120,
                borderRadius: 8,
                border: `1px solid ${ui.border}`,
                padding: "6px 10px",
                fontSize: 13,
              }}
              value={calendar_month}
              onChange={(e) =>
                set_calendar_month(e.target.value)
              }
            >
              <option value="">선택</option>
              {calendar_month_options.map((m) => (
                <option
                  key={m}
                  value={String(m).padStart(2, "0")}
                >
                  {m}월
                </option>
              ))}
            </select>
          </div>

          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            선택 월 매출:{" "}
            <span
              style={{
                fontSize: 16,
                fontWeight: 800,
              }}
            >
              ₩ {money(calendar_month_total)}
            </span>
          </div>
        </div>

        {calendar_view_mode === "calendar" ? (
          render_calendar_view()
        ) : (
          <div
            style={{
              maxHeight: 260,
              overflow: "auto",
            }}
          >
            <table style={table_style}>
              <thead>
                <tr>
                  <th style={th_style}>일자</th>
                  <th style={th_style}>매출</th>
                </tr>
              </thead>
              <tbody>
                {calendar_daily_rows.length === 0 ? (
                  <tr>
                    <td
                      style={{
                        ...td_style,
                        textAlign: "center",
                        color: ui.muted,
                      }}
                      colSpan={2}
                    >
                      데이터 없음
                    </td>
                  </tr>
                ) : (
                  calendar_daily_rows.map((r) => (
                    <tr key={r.date}>
                      <td style={td_style}>{r.date}</td>
                      <td style={td_style}>
                        ₩ {money(r.amount)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 품목 TOP5 매출 (표 + 파이차트 + 모달 버튼) */}
      <div style={card}>
        <div style={card_header_row}>
          <div style={card_title}>
            품목별 매출 TOP 5
          </div>
          <button
            type="button"
            style={small_btn}
            onClick={() => set_is_show_item_modal(true)}
          >
            자세히 보기
          </button>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "minmax(0, 1.2fr) minmax(0, 1fr)",
            gap: 12,
          }}
        >
          {/* 표 */}
          <div
            style={{
              maxHeight: 260,
              overflow: "auto",
            }}
          >
            <table style={table_style}>
              <thead>
                <tr>
                  <th style={th_style}>순위</th>
                  <th style={th_style}>품목명</th>
                  <th style={th_style}>매출</th>
                </tr>
              </thead>
              <tbody>
                {item_sales_top5.length === 0 ? (
                  <tr>
                    <td
                      style={{
                        ...td_style,
                        textAlign: "center",
                        color: ui.muted,
                      }}
                      colSpan={3}
                    >
                      데이터 없음
                    </td>
                  </tr>
                ) : (
                  item_sales_top5.map((r, idx) => {
                    const name =
                      item_name_by_id.get(r.item_id) ??
                      item_name_patch.get(
                        r.item_id,
                      ) ??
                      `품목 ${r.item_id}`;
                    return (
                      <tr key={r.item_id}>
                        <td style={td_style}>
                          {idx + 1}
                        </td>
                        <td style={td_style}>{name}</td>
                        <td style={td_style}>
                          ₩ {money(r.amount)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* 파이차트 + 품목명/퍼센트 범례 */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
            }}
          >
            <SimplePie segments={item_pie_segments} />
            <div
              style={{
                fontSize: 11,
                color: ui.muted,
              }}
            >
              상위 5개 품목은 개별 항목, 그 외는
              &quot;기타&quot;로 묶어서
              표시합니다.
            </div>
            <div
              style={{
                width: "100%",
                maxHeight: 140,
                overflow: "auto",
                fontSize: 12,
              }}
            >
              {item_pie_segments.map((s) => {
                const total =
                  item_pie_segments.reduce(
                    (sum, v) => sum + v.value,
                    0,
                  ) || 1;
                const pct =
                  (s.value / total) * 100;
                return (
                  <div
                    key={s.label}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      marginBottom: 4,
                    }}
                  >
                    <span
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 999,
                        background: s.color,
                      }}
                    />
                    <span
                      style={{
                        flex: 1,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {s.label}
                    </span>
                    <span>
                      {pct.toFixed(1)}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {error_msg && (
        <div
          style={{
            color: ui.danger,
            fontSize: 13,
            marginTop: 4,
          }}
        >
          {error_msg}
        </div>
      )}

      {/* ===== 모달: 지점별 총 매출 전체 보기 ===== */}
      {is_show_total_modal && (
        <div
          style={modal_overlay}
          onClick={() => set_is_show_total_modal(false)}
        >
          <div
            style={modal_card}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={modal_header}>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: 15,
                }}
              >
                지점별 총 매출 전체 보기
              </div>
              <button
                type="button"
                style={small_btn}
                onClick={() =>
                  set_is_show_total_modal(false)
                }
              >
                닫기
              </button>
            </div>
            <div style={modal_body}>
              {/* 검색 + 자동완성 */}
              <div style={modal_search_wrap}>
                <span
                  style={{
                    fontSize: 12,
                    color: ui.muted,
                  }}
                >
                  지점 검색
                </span>
                <div style={modal_search_input_wrap}>
                  <input
                    style={modal_search_input}
                    placeholder="지점명 입력"
                    value={total_modal_keyword}
                    onChange={(e) =>
                      set_total_modal_keyword(
                        e.target.value,
                      )
                    }
                  />
                  {total_modal_suggests.length > 0 && (
                    <div style={suggest_box}>
                      {total_modal_suggests.map((name) => (
                        <div
                          key={name}
                          onMouseDown={() =>
                            set_total_modal_keyword(name)
                          }
                          style={{
                            padding: "6px 10px",
                            cursor: "pointer",
                            borderBottom: `1px solid ${ui.border}`,
                          }}
                        >
                          {name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <table style={table_style}>
                <thead>
                  <tr>
                    <th style={th_style}>순위</th>
                    <th style={th_style}>지점</th>
                    <th style={th_style}>총 매출</th>
                    <th style={th_style}>수주 건수</th>
                  </tr>
                </thead>
                <tbody>
                  {total_modal_filtered_rows.length === 0 ? (
                    <tr>
                      <td
                        style={{
                          ...td_style,
                          textAlign: "center",
                          color: ui.muted,
                        }}
                        colSpan={4}
                      >
                        데이터 없음
                      </td>
                    </tr>
                  ) : (
                    total_modal_filtered_rows.map(
                      (r, idx) => (
                        <tr
                          key={r.branch_id}
                          style={
                            idx % 2 === 1
                              ? {
                                  background:
                                    ui.zebra,
                                }
                              : undefined
                          }
                        >
                          <td style={td_style}>
                            {idx + 1}
                          </td>
                          <td style={td_style}>
                            {r.branch_name}
                          </td>
                          <td style={td_style}>
                            ₩ {money(r.total_amount)}
                          </td>
                          <td style={td_style}>
                            {r.order_count.toLocaleString(
                              "ko-KR",
                            )}
                          </td>
                        </tr>
                      ),
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===== 모달: 지점별 월간 매출 전체 보기 + 월 선택 ===== */}
      {is_show_monthly_modal && (
        <div
          style={modal_overlay}
          onClick={() => set_is_show_monthly_modal(false)}
        >
          <div
            style={modal_card}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={modal_header}>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: 15,
                }}
              >
                지점별 월간 매출 전체 보기
              </div>
              <button
                type="button"
                style={small_btn}
                onClick={() =>
                  set_is_show_monthly_modal(false)
                }
              >
                닫기
              </button>
            </div>
            <div style={modal_body}>
              {/* 월 선택 + 검색 + 자동완성 */}
              <div style={modal_search_wrap}>
                <span
                  style={{
                    fontSize: 12,
                    color: ui.muted,
                  }}
                >
                  월 선택
                </span>
                <select
                  style={{
                    borderRadius: 8,
                    border: `1px solid ${ui.border}`,
                    padding: "6px 10px",
                    fontSize: 13,
                  }}
                  value={monthly_modal_month}
                  onChange={(e) =>
                    set_monthly_modal_month(
                      e.target.value,
                    )
                  }
                >
                  <option value="">전체</option>
                  {monthly_modal_ym_options.map((ym) => (
                    <option key={ym} value={ym}>
                      {format_ym_kor(ym)}
                    </option>
                  ))}
                </select>

                <span
                  style={{
                    fontSize: 12,
                    color: ui.muted,
                  }}
                >
                  지점 검색
                </span>
                <div style={modal_search_input_wrap}>
                  <input
                    style={modal_search_input}
                    placeholder="지점명 입력"
                    value={monthly_modal_keyword}
                    onChange={(e) =>
                      set_monthly_modal_keyword(
                        e.target.value,
                      )
                    }
                  />
                  {monthly_modal_suggests.length > 0 && (
                    <div style={suggest_box}>
                      {monthly_modal_suggests.map(
                        (name) => (
                          <div
                            key={name}
                            onMouseDown={() =>
                              set_monthly_modal_keyword(
                                name,
                              )
                            }
                            style={{
                              padding: "6px 10px",
                              cursor: "pointer",
                              borderBottom: `1px solid ${ui.border}`,
                            }}
                          >
                            {name}
                          </div>
                        ),
                      )}
                    </div>
                  )}
                </div>
              </div>

              <table style={table_style}>
                <thead>
                  <tr>
                    <th style={th_style}>순위</th>
                    <th style={th_style}>지점</th>
                    <th style={th_style}>월</th>
                    <th style={th_style}>매출</th>
                  </tr>
                </thead>
                <tbody>
                  {monthly_modal_filtered_rows.length === 0 ? (
                    <tr>
                      <td
                        style={{
                          ...td_style,
                          textAlign: "center",
                          color: ui.muted,
                        }}
                        colSpan={4}
                      >
                        데이터 없음
                      </td>
                    </tr>
                  ) : (
                    monthly_modal_filtered_rows.map(
                      (r, idx) => (
                        <tr
                          key={`${r.branch_id}_${r.ym}_${idx}`}
                          style={
                            idx % 2 === 1
                              ? {
                                  background:
                                    ui.zebra,
                                }
                              : undefined
                          }
                        >
                          <td style={td_style}>
                            {idx + 1}
                          </td>
                          <td style={td_style}>
                            {r.branch_name}
                          </td>
                          <td style={td_style}>
                            {r.ym}
                          </td>
                          <td style={td_style}>
                            ₩ {money(r.amount)}
                          </td>
                        </tr>
                      ),
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===== 모달: 품목별 매출 전체 보기 ===== */}
      {is_show_item_modal && (
        <div
          style={modal_overlay}
          onClick={() => set_is_show_item_modal(false)}
        >
          <div
            style={modal_card}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={modal_header}>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: 15,
                }}
              >
                품목별 매출 전체 보기
              </div>
              <button
                type="button"
                style={small_btn}
                onClick={() =>
                  set_is_show_item_modal(false)
                }
              >
                닫기
              </button>
            </div>
            <div style={modal_body}>
              {/* 검색 + 자동완성 */}
              <div style={modal_search_wrap}>
                <span
                  style={{
                    fontSize: 12,
                    color: ui.muted,
                  }}
                >
                  품목 검색
                </span>
                <div style={modal_search_input_wrap}>
                  <input
                    style={modal_search_input}
                    placeholder="품목명 입력"
                    value={item_modal_keyword}
                    onChange={(e) =>
                      set_item_modal_keyword(
                        e.target.value,
                      )
                    }
                  />
                  {item_modal_suggests.length > 0 && (
                    <div style={suggest_box}>
                      {item_modal_suggests.map((name) => (
                        <div
                          key={name}
                          onMouseDown={() =>
                            set_item_modal_keyword(name)
                          }
                          style={{
                            padding: "6px 10px",
                            cursor: "pointer",
                            borderBottom: `1px solid ${ui.border}`,
                          }}
                        >
                          {name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <table style={table_style}>
                <thead>
                  <tr>
                    <th style={th_style}>순위</th>
                    <th style={th_style}>품목명</th>
                    <th style={th_style}>매출</th>
                  </tr>
                </thead>
                <tbody>
                  {item_modal_filtered_rows.length === 0 ? (
                    <tr>
                      <td
                        style={{
                          ...td_style,
                          textAlign: "center",
                          color: ui.muted,
                        }}
                        colSpan={3}
                      >
                        데이터 없음
                      </td>
                    </tr>
                  ) : (
                    item_modal_filtered_rows.map(
                      (r, idx) => {
                        const name =
                          item_name_by_id.get(r.item_id) ??
                          item_name_patch.get(
                            r.item_id,
                          ) ??
                          `품목 ${r.item_id}`;
                        return (
                          <tr
                            key={`${r.item_id}_${idx}`}
                            style={
                              idx % 2 === 1
                                ? {
                                    background:
                                      ui.zebra,
                                  }
                                : undefined
                            }
                          >
                            <td style={td_style}>
                              {idx + 1}
                            </td>
                            <td style={td_style}>
                              {name}
                            </td>
                            <td style={td_style}>
                              ₩ {money(r.amount)}
                            </td>
                          </tr>
                        );
                      },
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesDashboardPage;

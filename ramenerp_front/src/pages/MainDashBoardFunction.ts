// src/pages/MainDashboardFunction.ts
// 메인 대시보드(달력/공지/지점/안전재고) 공통 기능 + 더미 데이터

import { useMemo, useState } from "react";

/* ===================== 타입 정의 ===================== */

export type PurchaseScheduleRow = {
  id: string;
  vendor: string;
  manager: string;
  order_date: string;
  inbound_date: string;
  status: string;
};

export type SalesScheduleRow = {
  id: string;
  branch: string;
  order_date: string;
  ship_date: string;
  status: string;
};

export type DaySchedule = {
  purchase: PurchaseScheduleRow[];
  sales: SalesScheduleRow[];
};

export type ScheduleMap = Record<string, DaySchedule>;

export type CalendarCell = {
  key: string;
  date_str: string | null;
  day_num: number | null;
  is_today: boolean;
  is_selected: boolean;
  purchase_count: number;
  sales_count: number;
};

export type ActiveTab = "purchase" | "sales";

/* ===================== 더미 스케줄 데이터 ===================== */

export const schedule_data: ScheduleMap = {
  "2025-11-16": {
    purchase: [
      {
        id: "VO-20251116-01",
        vendor: "서울 식자재",
        manager: "김영희",
        order_date: "2025-11-16",
        inbound_date: "2025-11-18",
        status: "대기 중 (Pending)",
      },
      {
        id: "VO-20251116-02",
        vendor: "라멘육수 코리아",
        manager: "이철수",
        order_date: "2025-11-16",
        inbound_date: "2025-11-19",
        status: "진행 중 (In progress)",
      },
      {
        id: "VO-20251116-03",
        vendor: "야채마트",
        manager: "박지훈",
        order_date: "2025-11-16",
        inbound_date: "2025-11-17",
        status: "완료 (Completed)",
      },
    ],
    sales: [
      {
        id: "SO-20251116-01",
        branch: "서울 1지점",
        order_date: "2025-11-16",
        ship_date: "2025-11-17",
        status: "출고 예정 (Pending)",
      },
      {
        id: "SO-20251116-02",
        branch: "부산 센터",
        order_date: "2025-11-16",
        ship_date: "2025-11-18",
        status: "출고 완료 (Completed)",
      },
    ],
  },
  "2025-11-04": {
    purchase: [
      {
        id: "VO-20251104-01",
        vendor: "서울 식자재",
        manager: "김영희",
        order_date: "2025-11-04",
        inbound_date: "2025-11-06",
        status: "완료 (Completed)",
      },
      {
        id: "VO-20251104-02",
        vendor: "면 전문업체",
        manager: "홍길동",
        order_date: "2025-11-04",
        inbound_date: "2025-11-07",
        status: "진행 중 (In progress)",
      },
    ],
    sales: [
      {
        id: "SO-20251104-01",
        branch: "대구 지점",
        order_date: "2025-11-04",
        ship_date: "2025-11-05",
        status: "출고 완료 (Completed)",
      },
    ],
  },
  "2025-11-05": {
    purchase: [
      {
        id: "VO-20251105-01",
        vendor: "육류도매상",
        manager: "정우성",
        order_date: "2025-11-05",
        inbound_date: "2025-11-07",
        status: "대기 중 (Pending)",
      },
    ],
    sales: [],
  },
  "2025-11-06": {
    purchase: [],
    sales: [
      {
        id: "SO-20251106-01",
        branch: "서울 1지점",
        order_date: "2025-11-06",
        ship_date: "2025-11-07",
        status: "출고 예정 (Pending)",
      },
      {
        id: "SO-20251106-02",
        branch: "부산 센터",
        order_date: "2025-11-06",
        ship_date: "2025-11-08",
        status: "출고 예정 (Pending)",
      },
      {
        id: "SO-20251106-03",
        branch: "광주 지점",
        order_date: "2025-11-06",
        ship_date: "2025-11-09",
        status: "출고 완료 (Completed)",
      },
    ],
  },
  "2025-11-17": {
    purchase: [
      {
        id: "VO-20251117-01",
        vendor: "스프 토핑",
        manager: "유재석",
        order_date: "2025-11-17",
        inbound_date: "2025-11-19",
        status: "대기 중 (Pending)",
      },
    ],
    sales: [
      {
        id: "SO-20251117-01",
        branch: "인천 지점",
        order_date: "2025-11-17",
        ship_date: "2025-11-18",
        status: "출고 예정 (Pending)",
      },
    ],
  },
};

/* ===================== 공지 / 지점 / 재고 더미 데이터 ===================== */

export type Notice = {
  id: number;
  title: string;
  date_text: string;
  is_emergency?: boolean;
};

export const notice_list: Notice[] = [
  {
    id: 1,
    title: "[공지] 11월 정기 점검 안내",
    date_text: "2025-11-05",
  },
  {
    id: 2,
    title: "[공지] 연말 재고 실사 일정",
    date_text: "2025-11-01",
  },
  {
    id: 3,
    title: "[긴급] 일부 품목 가격 인상",
    date_text: "NEW",
    is_emergency: true,
  },
];

export type BranchRank = {
  id: number;
  rank_label: string;
  name: string;
  sales_text: string;
};

export const branch_rank_list: BranchRank[] = [
  { id: 1, rank_label: "1위", name: "서울 1지점", sales_text: "₩ 38,520,000" },
  { id: 2, rank_label: "2위", name: "부산 센터", sales_text: "₩ 27,430,000" },
  { id: 3, rank_label: "3위", name: "대구 지점", sales_text: "₩ 24,100,000" },
  { id: 4, rank_label: "4위", name: "인천 지점", sales_text: "₩ 21,980,000" },
  { id: 5, rank_label: "5위", name: "광주 지점", sales_text: "₩ 19,420,000" },
];

export type StockAlert = {
  id: number;
  name: string;
  qty_text: string;
  level_text: string; // "위험" / "주의"
};

export const stock_alert_list: StockAlert[] = [
  {
    id: 1,
    name: "생면(돈코츠용)",
    qty_text: "현재 45개 / 안전재고 80개",
    level_text: "위험",
  },
  {
    id: 2,
    name: "차슈(슬라이스)",
    qty_text: "현재 18kg / 안전재고 30kg",
    level_text: "위험",
  },
  {
    id: 3,
    name: "멘마 토핑",
    qty_text: "현재 6박스 / 안전재고 10박스",
    level_text: "주의",
  },
];

/* ===================== 달력용 유틸 함수 ===================== */

function build_month_cells(
  year: number,
  month: number, // 0-based
  selected_date_str: string,
  schedule_map: ScheduleMap,
  today_date: Date,
): CalendarCell[] {
  const first_day = new Date(year, month, 1).getDay(); // 0=일요일
  const days_in_month = new Date(year, month + 1, 0).getDate();
  const month_str = String(month + 1).padStart(2, "0");

  const cells: CalendarCell[] = Array.from({ length: 42 }, (_, index) => ({
    key: `empty-${index}`,
    date_str: null,
    day_num: null,
    is_today: false,
    is_selected: false,
    purchase_count: 0,
    sales_count: 0,
  }));

  for (let day = 1; day <= days_in_month; day++) {
    const index = first_day + (day - 1);
    if (index < 0 || index >= cells.length) continue;

    const day_str = String(day).padStart(2, "0");
    const date_str = `${year}-${month_str}-${day_str}`;
    const schedule = schedule_map[date_str] ?? { purchase: [], sales: [] };

    const is_today =
      year === today_date.getFullYear() &&
      month === today_date.getMonth() &&
      day === today_date.getDate();

    const is_selected = date_str === selected_date_str;

    cells[index] = {
      key: date_str,
      date_str,
      day_num: day,
      is_today,
      is_selected,
      purchase_count: schedule.purchase.length,
      sales_count: schedule.sales.length,
    };
  }

  return cells;
}

/* ===================== 달력용 커스텀 훅 ===================== */

export type UseMainCalendarResult = {
  current_year: number;
  current_month: number; // 0-based
  month_title: string;
  weekday_labels: string[];
  cells: CalendarCell[];
  selected_date_str: string;
  selected_summary_text: string;
  selected_purchase_rows: PurchaseScheduleRow[];
  selected_sales_rows: SalesScheduleRow[];
  active_tab: ActiveTab;
  set_active_tab: (tab: ActiveTab) => void;
  go_prev_month: () => void;
  go_next_month: () => void;
  go_today: () => void;
  handle_select_date: (date_str: string) => void;
};

export function use_main_calendar(initial_year = 2025, initial_month = 10): UseMainCalendarResult {
  const [current_year, set_current_year] = useState(initial_year);
  const [current_month, set_current_month] = useState(initial_month); // 0-based
  const [selected_date_str, set_selected_date_str] = useState<string>("2025-11-16");
  const [active_tab, set_active_tab] = useState<ActiveTab>("purchase");

  const today = useMemo(() => new Date(), []);

  // 월 제목
  const month_title = `${current_year}년 ${current_month + 1}월`;

  // 요일 레이블
  const weekday_labels = ["일", "월", "화", "수", "목", "금", "토"];

  // 선택된 날짜 스케줄
  const selected_schedule = schedule_data[selected_date_str] ?? {
    purchase: [],
    sales: [],
  };

  const selected_summary_text = `발주 ${selected_schedule.purchase.length}건 · 수주 ${selected_schedule.sales.length}건`;

  // 달력 셀
  const cells = useMemo(
    () =>
      build_month_cells(
        current_year,
        current_month,
        selected_date_str,
        schedule_data,
        today,
      ),
    [current_year, current_month, selected_date_str, today],
  );

  const go_prev_month = () => {
    set_current_month((prev) => {
      if (prev === 0) {
        set_current_year((y) => y - 1);
        const next_month = 11;
        set_selected_date_str(`${current_year - 1}-${String(next_month + 1).padStart(2, "0")}-01`);
        return next_month;
      }
      const next_month = prev - 1;
      set_selected_date_str(
        `${current_year}-${String(next_month + 1).padStart(2, "0")}-01`,
      );
      return next_month;
    });
  };

  const go_next_month = () => {
    set_current_month((prev) => {
      if (prev === 11) {
        set_current_year((y) => y + 1);
        const next_month = 0;
        set_selected_date_str(`${current_year + 1}-${String(next_month + 1).padStart(2, "0")}-01`);
        return next_month;
      }
      const next_month = prev + 1;
      set_selected_date_str(
        `${current_year}-${String(next_month + 1).padStart(2, "0")}-01`,
      );
      return next_month;
    });
  };

  const go_today = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const day_str = String(now.getDate()).padStart(2, "0");
    const month_str = String(month + 1).padStart(2, "0");

    set_current_year(year);
    set_current_month(month);
    set_selected_date_str(`${year}-${month_str}-${day_str}`);
  };

  const handle_select_date = (date_str: string) => {
    set_selected_date_str(date_str);
  };

  return {
    current_year,
    current_month,
    month_title,
    weekday_labels,
    cells,
    selected_date_str,
    selected_summary_text,
    selected_purchase_rows: selected_schedule.purchase,
    selected_sales_rows: selected_schedule.sales,
    active_tab,
    set_active_tab,
    go_prev_month,
    go_next_month,
    go_today,
    handle_select_date,
  };
}

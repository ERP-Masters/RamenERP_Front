// src/function/StockDangerAiFunction.ts
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const api_base_url = import.meta.env.VITE_API_BASE_URL ?? "/api";

/* ========= 응답 타입 정의 ========= */

export type BranchForecastRow = {
  branch_id: number;
  item_name: string;
  avg_future_demand: number;
  mae?: number;
  rmse?: number;
};

export type WarehousePlanRow = {
  warehouse_id: string;
  item_name: string;
  avg_daily_demand_total: number;
  safety_stock: number;
  lead_time: number;
  recommended_stock: number;
};

type ForecastApiResponse = {
  branch_forecast?: BranchForecastRow[];
  warehouse_plan?: WarehousePlanRow[];
};

/* ========= 공통 알림 타입 ========= */

export type Stock_alert_row = {
  id: string;
  name: string;
  qty_text: string;
  level_text: string;
};

/* ========= 캐시 타입 & 유틸 ========= */

type Forecast_cache = {
  branch_forecast: BranchForecastRow[];
  warehouse_plan: WarehousePlanRow[];
  saved_at: string;
};

const ai_cache_key = "stock_ai_forecast_cache";

function load_forecast_cache(): Forecast_cache | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(ai_cache_key);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;

    const branch_forecast = Array.isArray(parsed.branch_forecast)
      ? (parsed.branch_forecast as BranchForecastRow[])
      : [];
    const warehouse_plan = Array.isArray(parsed.warehouse_plan)
      ? (parsed.warehouse_plan as WarehousePlanRow[])
      : [];
    const saved_at =
      typeof parsed.saved_at === "string" ? parsed.saved_at : "";

    return { branch_forecast, warehouse_plan, saved_at };
  } catch {
    return null;
  }
}

function save_forecast_cache(cache: Forecast_cache): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(ai_cache_key, JSON.stringify(cache));
  } catch {
    // 캐시 저장 실패는 그냥 무시
  }
}

/* ========= 매핑 유틸 ========= */

// 창고 재고 → 알림 리스트
function map_warehouse_plan_to_alerts(
  plan_list: WarehousePlanRow[],
): Stock_alert_row[] {
  const filtered = plan_list.filter((p) => {
    const safety_stock_num = Number(p.safety_stock ?? 0);
    const recommended_stock_num = Number(p.recommended_stock ?? 0);
    return recommended_stock_num > safety_stock_num;
  });

  filtered.sort((a, b) => {
    const gap_a =
      Number(a.recommended_stock ?? 0) - Number(a.safety_stock ?? 0);
    const gap_b =
      Number(b.recommended_stock ?? 0) - Number(b.safety_stock ?? 0);
    return gap_b - gap_a;
  });

  return filtered.map((p) => {
    const safety_stock_num = Number(p.safety_stock ?? 0);
    const recommended_stock_num = Number(p.recommended_stock ?? 0);

    const name = `${p.item_name} (${p.warehouse_id})`;
    const qty_text = `권장 재고 ${recommended_stock_num} / 안전 재고 ${safety_stock_num}`;

    const is_severe = recommended_stock_num >= safety_stock_num * 1.5;
    const level_text = is_severe ? "심각" : "입고 필요";

    return {
      id: `${p.warehouse_id}_${p.item_name}`,
      name,
      qty_text,
      level_text,
    };
  });
}

// 직영점 수요 → 알림 리스트
function map_branch_forecast_to_alerts(
  branch_list: BranchForecastRow[],
): Stock_alert_row[] {
  const copied = [...branch_list];
  copied.sort(
    (a, b) =>
      Number(b.avg_future_demand ?? 0) -
      Number(a.avg_future_demand ?? 0),
  );

  return copied.map((row) => {
    const demand = Number(row.avg_future_demand ?? 0);
    const name = `지점 ${row.branch_id} - ${row.item_name}`;
    const qty_text = `예상 수요 ${demand.toFixed(1)}`;
    const is_hot = demand >= 50;
    const level_text = is_hot ? "수요 많음" : "일반";

    return {
      id: `${row.branch_id}_${row.item_name}`,
      name,
      qty_text,
      level_text,
    };
  });
}

/* ========= 1) 재고 알림 리스트 페이지 전용 훅 ========= */

type Use_stock_ai_loader_return = {
  warehouse_alert_list: Stock_alert_row[]; // 창고 기준 전체 알림
  branch_alert_list: Stock_alert_row[]; // 직영점 기준 전체 알림
  is_loading: boolean;
  error_msg: string;
  has_data: boolean;
  refetch: () => Promise<void>;
};

/**
 * 재고 알림 리스트 페이지에서만 사용:
 * - /forecast/run 을 실제로 호출해서
 * - 창고/직영점 전체 알림 리스트 생성
 * - localStorage 캐시에 raw 데이터를 저장
 */
export function use_stock_ai_loader_for_list_page(
  poll_interval_ms = 0,
): Use_stock_ai_loader_return {
  const [warehouse_alert_list, set_warehouse_alert_list] = useState<
    Stock_alert_row[]
  >([]);
  const [branch_alert_list, set_branch_alert_list] = useState<
    Stock_alert_row[]
  >([]);
  const [is_loading, set_is_loading] = useState(false);
  const [error_msg, set_error_msg] = useState("");

  const is_fetching_ref = useRef(false);

  const refetch = useCallback(async () => {
    if (is_fetching_ref.current) return;

    is_fetching_ref.current = true;
    set_error_msg("");

    try {
      set_is_loading(true);

      const base = api_base_url.endsWith("/")
        ? api_base_url.slice(0, -1)
        : api_base_url;
      const request_url = `${base}/forecast/run`;

      const res = await fetch(request_url, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }

      const data = (await res.json()) as ForecastApiResponse;

      const branch_list: BranchForecastRow[] = Array.isArray(
        data.branch_forecast,
      )
        ? data.branch_forecast
        : [];

      const plan_list: WarehousePlanRow[] = Array.isArray(
        data.warehouse_plan,
      )
        ? data.warehouse_plan
        : [];

      // 캐시 저장 (사이드 탭에서 사용)
      save_forecast_cache({
        branch_forecast: branch_list,
        warehouse_plan: plan_list,
        saved_at: new Date().toISOString(),
      });

      const mapped_warehouse = map_warehouse_plan_to_alerts(plan_list);
      const mapped_branch = map_branch_forecast_to_alerts(branch_list);

      set_warehouse_alert_list(mapped_warehouse);
      set_branch_alert_list(mapped_branch);
    } catch (e: any) {
      set_error_msg(e?.message || "AI 재고 예측 정보를 불러오지 못했습니다.");
      set_warehouse_alert_list([]);
      set_branch_alert_list([]);
    } finally {
      set_is_loading(false);
      is_fetching_ref.current = false;
    }
  }, []);

  useEffect(() => {
    // 리스트 화면 진입 시 1회 실행
    void refetch();

    const interval_id =
      poll_interval_ms > 0
        ? window.setInterval(() => {
            void refetch();
          }, poll_interval_ms)
        : undefined;

    return () => {
      if (interval_id !== undefined) {
        window.clearInterval(interval_id);
      }
    };
  }, [poll_interval_ms, refetch]);

  const has_data = useMemo(
    () =>
      warehouse_alert_list.length > 0 || branch_alert_list.length > 0,
    [warehouse_alert_list, branch_alert_list],
  );

  return {
    warehouse_alert_list,
    branch_alert_list,
    is_loading,
    error_msg,
    has_data,
    refetch,
  };
}

/* ========= 2) 기존 훅: 사이드 탭 전용 (캐시만 읽음) ========= */

type Use_stock_danger_ai_return = {
  ai_alert_list: Stock_alert_row[]; // 창고 기준 알림 리스트
  is_loading: boolean;
  error_msg: string;
  has_ai_data: boolean;
  refetch: () => Promise<void>;
};

/**
 * 기존 이름 유지:
 * - 더 이상 /forecast/run 을 직접 호출하지 않고
 * - 재고 알림 리스트 페이지에서 캐시해 둔 데이터를 localStorage에서 읽어서
 *   창고 기준 알림 리스트만 만들어서 반환
 * => 메인 화면 "안전 재고 위험 알림" 사이드 탭 전용
 */
export function use_stock_danger_ai(
  poll_interval_ms = 30000,
): Use_stock_danger_ai_return {
  const [ai_alert_list, set_ai_alert_list] = useState<Stock_alert_row[]>([]);
  const [is_loading, set_is_loading] = useState(false);
  const [error_msg, set_error_msg] = useState("");

  const is_fetching_ref = useRef(false);

  const refetch = useCallback(async () => {
    if (is_fetching_ref.current) return;

    is_fetching_ref.current = true;
    set_error_msg("");

    try {
      set_is_loading(true);

      const cache = load_forecast_cache();
      if (!cache) {
        set_ai_alert_list([]);
        set_error_msg(
          "AI 재고 예측 데이터가 아직 없습니다. 재고 알림 리스트 화면에서 먼저 예측을 실행해 주세요.",
        );
        return;
      }

      const mapped_warehouse = map_warehouse_plan_to_alerts(
        cache.warehouse_plan,
      );

      set_ai_alert_list(mapped_warehouse);
    } catch (e: any) {
      set_error_msg(
        e?.message || "AI 재고 예측 데이터를 불러오지 못했습니다.",
      );
      set_ai_alert_list([]);
    } finally {
      set_is_loading(false);
      is_fetching_ref.current = false;
    }
  }, []);

  useEffect(() => {
    void refetch();

    const interval_id = window.setInterval(() => {
      void refetch();
    }, poll_interval_ms);

    return () => window.clearInterval(interval_id);
  }, [poll_interval_ms, refetch]);

  const has_ai_data = useMemo(
    () => ai_alert_list.length > 0,
    [ai_alert_list],
  );

  return {
    ai_alert_list,
    is_loading,
    error_msg,
    has_ai_data,
    refetch,
  };
}

/* ========= 3) 직영점 사이드 탭 전용 훅 ========= */

type Use_branch_stock_ai_for_side_tab_return = {
  branch_alert_list: Stock_alert_row[];
  is_loading: boolean;
  error_msg: string;
  has_ai_data: boolean;
  refetch: () => Promise<void>;
};

export function use_branch_stock_ai_for_side_tab(
  poll_interval_ms = 30000,
): Use_branch_stock_ai_for_side_tab_return {
  const [branch_alert_list, set_branch_alert_list] = useState<Stock_alert_row[]>(
    [],
  );
  const [is_loading, set_is_loading] = useState(false);
  const [error_msg, set_error_msg] = useState("");

  const is_fetching_ref = useRef(false);

  const refetch = useCallback(async () => {
    if (is_fetching_ref.current) return;

    is_fetching_ref.current = true;
    set_error_msg("");

    try {
      set_is_loading(true);

      const cache = load_forecast_cache();
      if (!cache) {
        // 아직 리스트 페이지에서 예측을 한 번도 안 돌린 경우
        set_branch_alert_list([]);
        set_error_msg(
          "AI 재고 예측 데이터(직영점)가 아직 없습니다. 재고 알림 리스트 화면에서 먼저 예측을 실행해 주세요.",
        );
        return;
      }

      const mapped_branch = map_branch_forecast_to_alerts(
        cache.branch_forecast,
      );

      set_branch_alert_list(mapped_branch);
    } catch (e: any) {
      set_error_msg(
        e?.message ||
          "AI 재고 예측 데이터(직영점)를 불러오지 못했습니다.",
      );
      set_branch_alert_list([]);
    } finally {
      set_is_loading(false);
      is_fetching_ref.current = false;
    }
  }, []);

  useEffect(() => {
    void refetch();

    const interval_id = window.setInterval(() => {
      void refetch();
    }, poll_interval_ms);

    return () => window.clearInterval(interval_id);
  }, [poll_interval_ms, refetch]);

  const has_ai_data = useMemo(
    () => branch_alert_list.length > 0,
    [branch_alert_list],
  );

  return {
    branch_alert_list,
    is_loading,
    error_msg,
    has_ai_data,
    refetch,
  };
}

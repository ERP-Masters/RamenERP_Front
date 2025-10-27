// src/pages/VendorOrderListPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  fetch_vendor_orders_all,
  fetch_vendor_orders_by_vendor,
  fetch_vendor_orders_by_status,
  fetch_vendor_orders_by_period,
  type VendorOrder,
} from "../api/vendor_orders";

import {
  fetch_vendors,
  fetch_warehouses,
  fetch_items,
  type VendorOption,
  type WarehouseOption,
  type ItemOption,
} from "../api/master_data";

import VendorOrderCreateModal from "../components/VendorOrderCreateModal";

// 공통 UI 토큰
const ui = {
  bg_page: "#f6f7f9",
  surface: "#ffffff",
  border: "#e6e8ec",
  header_bg: "#f8fafc",
  zebra: "#fafafa",
  text: "#111827",
  label: "#6b7280",
  radius: 12,
} as const;

const page_wrap: React.CSSProperties = {
  background: ui.bg_page,
  minHeight: "100%",
  padding: 16,
  boxSizing: "border-box",
  fontSize: "clamp(12px,1.05vw,16px)",
};

const section_card: React.CSSProperties = {
  background: ui.surface,
  border: `1px solid ${ui.border}`,
  borderRadius: ui.radius,
  padding: 16,
  boxShadow: "0 2px 4px rgba(0,0,0,0.04)",
};

const table_style: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: "0.9em",
};

const th_style: React.CSSProperties = {
  textAlign: "left",
  padding: "8px 10px",
  background: ui.header_bg,
  color: ui.label,
  fontWeight: 600,
  borderBottom: `1px solid ${ui.border}`,
  whiteSpace: "nowrap",
};

const td_style: React.CSSProperties = {
  textAlign: "left",
  padding: "8px 10px",
  borderBottom: `1px solid ${ui.border}`,
  color: ui.text,
  verticalAlign: "top",
  whiteSpace: "nowrap",
};

const label_small: React.CSSProperties = {
  fontSize: "0.8em",
  color: ui.label,
  fontWeight: 600,
  marginBottom: 4,
};

const input_style: React.CSSProperties = {
  width: "100%",
  border: `1px solid ${ui.border}`,
  borderRadius: 8,
  padding: "8px 10px",
  fontSize: "0.9em",
  color: ui.text,
  backgroundColor: "#fff",
};

const button_style: React.CSSProperties = {
  border: `1px solid ${ui.border}`,
  background: "#fff",
  borderRadius: 8,
  padding: "8px 10px",
  fontSize: "0.8em",
  fontWeight: 600,
  cursor: "pointer",
  textAlign: "center",
  whiteSpace: "nowrap",
  lineHeight: 1.2,
};

// VendorOrder + 사람이 읽을 이름들
type VendorOrderView = VendorOrder & {
  vendor_name?: string;
  wh_name?: string;
  item_name?: string;
};

function VendorOrderListPage() {
  // 원본 데이터
  const [vendor_orders_raw, set_vendor_orders_raw] = useState<VendorOrder[]>([]);
  // 마스터 데이터
  const [vendors, set_vendors] = useState<VendorOption[]>([]);
  const [warehouses, set_warehouses] = useState<WarehouseOption[]>([]);
  const [items, set_items] = useState<ItemOption[]>([]);

  // 검색 상태
  const [filter_vendor_id, set_filter_vendor_id] = useState(""); // 거래처 드롭다운 (id)
  const [filter_status, set_filter_status] = useState("");
  const [filter_start_date, set_filter_start_date] = useState("");
  const [filter_end_date, set_filter_end_date] = useState("");
  const [filter_order_code, set_filter_order_code] = useState(""); // 발주번호 검색어

  // 자동완성 관련
  const [order_suggestions, set_order_suggestions] = useState<string[]>([]);
  const [all_orders_cache, set_all_orders_cache] = useState<VendorOrder[]>([]);
  const [suggest_open, set_suggest_open] = useState(false);

  // 기타 상태
  const [is_loading, set_is_loading] = useState(false);
  const [error_msg, set_error_msg] = useState("");

  // 등록 모달
  const [is_create_open, set_is_create_open] = useState(false);

  // id -> name 매핑
  const vendorNameById = useMemo(() => {
    const m = new Map<number, string>();
    vendors.forEach((v) => m.set(Number(v.id), v.name));
    return m;
  }, [vendors]);

  const whNameById = useMemo(() => {
    const m = new Map<number, string>();
    warehouses.forEach((w) => m.set(Number(w.id), w.name));
    return m;
  }, [warehouses]);

  const itemNameById = useMemo(() => {
    const m = new Map<number, string>();
    items.forEach((it) => m.set(Number(it.id), it.name));
    return m;
  }, [items]);

  // vendor_orders_raw + 매핑 → 화면용
  const vendor_orders_view: VendorOrderView[] = useMemo(() => {
    return vendor_orders_raw.map((o) => ({
      ...o,
      vendor_name: vendorNameById.get(o.vendor_id),
      wh_name: whNameById.get(o.wh_id),
      item_name: itemNameById.get(o.item_id),
    }));
  }, [vendor_orders_raw, vendorNameById, whNameById, itemNameById]);

  // 전체 로드 (목록)
  async function load_all_orders() {
    try {
      set_is_loading(true);
      set_error_msg("");
      const data = await fetch_vendor_orders_all();
      set_vendor_orders_raw(data);
    } catch (err: any) {
      set_error_msg(err.message ?? "목록 불러오기 실패");
    } finally {
      set_is_loading(false);
    }
  }

  // 마스터 데이터 로드 (거래처/창고/품목 이름)
  async function load_master_data() {
    try {
      const [vList, wList, iList] = await Promise.all([
        fetch_vendors(),
        fetch_warehouses(),
        fetch_items(),
      ]);
      set_vendors(
        vList.map((v) => ({ id: v.id, name: v.name ?? `거래처#${v.id}` })),
      );
      set_warehouses(
        wList.map((w) => ({ id: w.id, name: w.name ?? `창고#${w.id}` })),
      );
      set_items(
        iList.map((it) => ({ id: it.id, name: it.name ?? `품목#${it.id}` })),
      );
    } catch (err: any) {
      // 마스터 데이터 실패해도 목록 자체는 보여줄 수 있으므로 에러만 기록
      console.warn("master data load error:", err);
    }
  }

  // 검색 실행
  async function apply_filters() {
    try {
      set_is_loading(true);
      set_error_msg("");

      // 1) 발주번호 검색(프론트 필터)
      if (filter_order_code.trim()) {
        // 캐시 없으면 전체 한 번 가져옴
        let source = all_orders_cache;
        if (!source.length) {
          source = await fetch_vendor_orders_all();
          set_all_orders_cache(source);
        }

        const keyword = filter_order_code.trim().toLowerCase();
        const filtered = source.filter((o) =>
          o.vendor_order_id.toLowerCase().includes(keyword),
        );
        set_vendor_orders_raw(filtered);
        return;
      }

      // 2) 기간 조회 (우선순위 높음)
      if (filter_start_date && filter_end_date) {
        const data = await fetch_vendor_orders_by_period(
          filter_start_date,
          filter_end_date,
        );
        set_vendor_orders_raw(data);
        return;
      }

      // 3) 거래처별
      if (filter_vendor_id) {
        const data = await fetch_vendor_orders_by_vendor(
          Number(filter_vendor_id),
        );
        set_vendor_orders_raw(data);
        return;
      }

      // 4) 상태별
      if (filter_status) {
        const data = await fetch_vendor_orders_by_status(filter_status);
        set_vendor_orders_raw(data);
        return;
      }

      // 5) 기본 전체
      const all_data = await fetch_vendor_orders_all();
      set_vendor_orders_raw(all_data);
    } catch (err: any) {
      set_error_msg(err.message ?? "검색 실패");
    } finally {
      set_is_loading(false);
    }
  }

  // 자동완성: 발주번호 입력할 때 호출
  async function handleOrderCodeChange(val: string) {
    set_filter_order_code(val);

    // 빈 문자열이면 닫기
    if (!val.trim()) {
      set_order_suggestions([]);
      set_suggest_open(false);
      return;
    }

    // 캐시 없으면 전체 한번 로드
    let source = all_orders_cache;
    if (!source.length) {
      try {
        source = await fetch_vendor_orders_all();
        set_all_orders_cache(source);
      } catch {
        // 실패해도 그냥 제안 안 띄움
        return;
      }
    }

    const key = val.toLowerCase();
    // 중복 없는 발주번호 목록
    const allCodes = Array.from(
      new Set(source.map((o) => o.vendor_order_id)),
    );

    const matched = allCodes
      .filter((code) => code.toLowerCase().includes(key))
      .slice(0, 5);

    set_order_suggestions(matched);
    set_suggest_open(true);
  }

  function selectSuggestion(code: string) {
    set_filter_order_code(code);
    set_suggest_open(false);
    set_order_suggestions([]);
  }

  // 최초 로드
  useEffect(() => {
    load_master_data();
    load_all_orders();
  }, []);

  // 모달에서 발주 생성 후 콜백
  function handle_created() {
    set_is_create_open(false);
    load_all_orders();
  }

  // 레이아웃 스타일
  const topBarGrid: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(min(180px,100%), 1fr))",
    gap: 12,
    alignItems: "end",
  };

  // 자동완성 박스 스타일
  const suggestWrap: React.CSSProperties = {
    position: "relative",
  };
  const suggestList: React.CSSProperties = {
    position: "absolute",
    left: 0,
    right: 0,
    top: "100%",
    zIndex: 10,
    background: "#fff",
    border: `1px solid ${ui.border}`,
    borderRadius: 8,
    boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
    fontSize: "0.8em",
    maxHeight: 150,
    overflowY: "auto",
  };
  const suggestItem: React.CSSProperties = {
    padding: "8px 10px",
    cursor: "pointer",
    borderBottom: `1px solid ${ui.border}`,
    lineHeight: 1.4,
  };

  return (
    <div style={page_wrap}>
      {/* 페이지 타이틀 */}
      <h1
        style={{
          fontSize: "1.2rem",
          fontWeight: 800,
          color: ui.text,
          marginBottom: 12,
        }}
      >
        발주 내역 조회
      </h1>

      {/* 검색/등록 섹션 */}
      <div style={{ ...section_card, marginBottom: 16 }}>
        <div style={topBarGrid}>
          {/* 거래처 선택 */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={label_small}>거래처</div>
            <select
              style={input_style}
              value={filter_vendor_id}
              onChange={(e) => set_filter_vendor_id(e.target.value)}
            >
              <option value="">전체</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>

          {/* 상태 선택 */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={label_small}>상태</div>
            <select
              style={input_style}
              value={filter_status}
              onChange={(e) => set_filter_status(e.target.value)}
            >
              <option value="">전체</option>
              <option value="PENDING">PENDING</option>
              <option value="INPROGRESS">INPROGRESS</option>
              <option value="CANCELED">CANCELED</option>
            </select>
          </div>

          {/* 기간 - 시작일 */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={label_small}>기간 시작</div>
            <input
              type="date"
              style={input_style}
              value={filter_start_date}
              onChange={(e) => set_filter_start_date(e.target.value)}
            />
          </div>

          {/* 기간 - 종료일 */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={label_small}>기간 종료</div>
            <input
              type="date"
              style={input_style}
              value={filter_end_date}
              onChange={(e) => set_filter_end_date(e.target.value)}
            />
          </div>

          {/* 발주번호 검색 + 자동완성 */}
          <div style={{ display: "flex", flexDirection: "column", position: "relative" }}>
            <div style={label_small}>발주번호</div>
            <div style={suggestWrap}>
              <input
                style={input_style}
                placeholder="예: VO_VD_SEOUL..."
                value={filter_order_code}
                onChange={(e) => handleOrderCodeChange(e.target.value)}
                onFocus={() => {
                  if (order_suggestions.length > 0) set_suggest_open(true);
                }}
                onBlur={() => {
                  // 살짝 딜레이 안 주면 클릭 전에 blur돼서 못 고르는 경우가 있음
                  setTimeout(() => set_suggest_open(false), 150);
                }}
              />
              {suggest_open && order_suggestions.length > 0 && (
                <div style={suggestList}>
                  {order_suggestions.map((code) => (
                    <div
                      key={code}
                      style={suggestItem}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        selectSuggestion(code);
                      }}
                    >
                      {code}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 검색 버튼 */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={label_small}>&nbsp;</div>
            <button
              style={button_style}
              onClick={apply_filters}
              disabled={is_loading}
            >
              검색
            </button>
          </div>

          {/* 신규 발주 등록 버튼 */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={label_small}>&nbsp;</div>
            <button
              style={button_style}
              onClick={() => set_is_create_open(true)}
            >
              신규 발주 등록
            </button>
          </div>
        </div>

        {error_msg && (
          <div
            style={{
              color: "red",
              marginTop: 8,
              fontSize: "0.8em",
              fontWeight: 400,
            }}
          >
            {error_msg}
          </div>
        )}
      </div>

      {/* 발주 목록 섹션 */}
      <div style={section_card}>
        <div
          style={{
            fontWeight: 600,
            color: ui.text,
            marginBottom: 12,
            fontSize: "1rem",
          }}
        >
          발주 목록
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={table_style}>
            <thead>
              <tr>
                <th style={th_style}>발주번호</th>
                <th style={th_style}>거래처명</th>
                <th style={th_style}>품목명</th>
                <th style={th_style}>창고명</th>
                <th style={th_style}>수량</th>
                <th style={th_style}>상태</th>
              </tr>
            </thead>
            <tbody>
              {vendor_orders_view.map((o, idx) => (
                <tr
                  key={o.vendor_order_id ?? idx}
                  style={{
                    background: idx % 2 === 1 ? ui.zebra : "#fff",
                  }}
                >
                  <td style={td_style}>{o.vendor_order_id}</td>
                  <td style={td_style}>{o.vendor_name ?? o.vendor_id}</td>
                  <td style={td_style}>{o.item_name ?? o.item_id}</td>
                  <td style={td_style}>{o.wh_name ?? o.wh_id}</td>
                  <td style={td_style}>{o.quantity}</td>
                  <td style={td_style}>{o.status}</td>
                </tr>
              ))}

              {vendor_orders_view.length === 0 && !is_loading && (
                <tr>
                  <td style={td_style} colSpan={6}>
                    데이터 없음
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {is_loading && (
          <div
            style={{
              marginTop: 8,
              fontSize: "0.8em",
              color: ui.label,
            }}
          >
            로딩 중...
          </div>
        )}
      </div>

      {/* 발주 등록 모달 */}
      <VendorOrderCreateModal
        open={is_create_open}
        on_close={() => set_is_create_open(false)}
        on_created={handle_created}
      />
    </div>
  );
}

export default VendorOrderListPage;

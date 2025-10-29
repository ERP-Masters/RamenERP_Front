// src/pages/VendorOrderListPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  fetch_vendor_orders_all,
  fetch_vendor_orders_by_vendor,
  fetch_vendor_orders_by_status,
  fetch_vendor_orders_by_period,
  type VendorOrder,
} from "@/api/vendor_orders";

import {
  fetch_vendors,
  fetch_items,
  fetch_warehouses,
  type VendorOption,
  type ItemOption,
  type WarehouseOption,
} from "@/api/master_data";

/* ================= 스타일 공통 ================= */
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

const pageWrap: React.CSSProperties = {
  maxWidth: 1200,
  margin: "0 auto",
  padding: 16,
  display: "flex",
  flexDirection: "column",
  gap: 16,
  color: "#0f172a",
  background: "#f8fafc",
};

const headerRow: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 16,
  alignItems: "flex-end",
  border: `1px solid ${ui.border}`,
  borderRadius: ui.radius,
  background: "#fff",
  padding: 16,
};

const subRow: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 12,
  alignItems: "center",
  fontSize: 14,
  color: ui.muted,
  marginTop: -8,
  marginBottom: -4,
};

/* ✅ 리스트 스크롤 영역: maxHeight + overflowY */
const cardTableWrap: React.CSSProperties = {
  border: `1px solid ${ui.border}`,
  borderRadius: ui.radius,
  background: "#fff",
  overflowX: "auto",
  maxHeight: "400px",
  overflowY: "auto",
};

const tableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "separate",
  borderSpacing: 0,
  fontSize: 14,
};

const thStyle: React.CSSProperties = {
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

const tdStyle: React.CSSProperties = {
  borderBottom: `1px solid ${ui.border}`,
  padding: "10px 8px",
  whiteSpace: "nowrap",
  verticalAlign: "middle",
  fontSize: 14,
};

const selectStyle: React.CSSProperties = {
  border: `1px solid ${ui.border}`,
  borderRadius: 8,
  padding: "10px 12px",
  fontSize: 14,
  minWidth: 140,
  background: "#fff",
  color: "#0f172a",
};

const inputStyle: React.CSSProperties = {
  border: `1px solid ${ui.border}`,
  borderRadius: 8,
  padding: "10px 12px",
  fontSize: 14,
  minWidth: 140,
  background: "#fff",
  color: "#0f172a",
};

const dateWrapStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 4,
};

const searchBtnStyle: React.CSSProperties = {
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

const primaryBtnStyle: React.CSSProperties = {
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

const viewBtnStyle: React.CSSProperties = {
  border: `1px solid ${ui.border}`,
  borderRadius: 8,
  background: "#fff",
  padding: "8px 12px",
  cursor: "pointer",
  fontSize: 14,
};

const csvBtnStyle: React.CSSProperties = {
  border: `1px solid ${ui.border}`,
  borderRadius: 8,
  background: "#fff",
  padding: "8px 12px",
  cursor: "pointer",
  fontSize: 14,
};

/* 🔽 자동완성 드롭다운 스타일 */
const suggestBoxStyle: React.CSSProperties = {
  position: "absolute",
  top: "100%",
  left: 0,
  right: 0,
  background: "#fff",
  border: `1px solid ${ui.border}`,
  borderRadius: 8,
  boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
  zIndex: 1000,
  maxHeight: "200px",
  overflowY: "auto",
  fontSize: 13,
  color: "#0f172a",
};

const suggestRowStyle: React.CSSProperties = {
  padding: "8px 10px",
  cursor: "pointer",
  borderBottom: `1px solid ${ui.border}`,
  whiteSpace: "nowrap",
  background: "#fff",
};

function statusBadgeStyle(): React.CSSProperties {
  return {
    display: "inline-block",
    borderRadius: 6,
    border: `1px solid ${ui.badgeBd}`,
    background: ui.badgeBg,
    color: ui.badgeTx,
    fontSize: 12,
    fontWeight: 700,
    lineHeight: 1,
    padding: "6px 10px",
  };
}

/* ================= 유틸 ================= */

// 발주번호에서 YYMMDD 뽑아서 YYYY-MM-DD 추론
function inferDateFromOrderId(vendor_order_id?: string): string {
  if (!vendor_order_id) return "";
  const parts = vendor_order_id.split("_");
  const candidate = parts.find((p) => /^\d{6}$/.test(p));
  if (!candidate) return "";
  const yy = candidate.slice(0, 2);
  const mm = candidate.slice(2, 4);
  const dd = candidate.slice(4, 6);
  const fullYear = `20${yy}`;
  return `${fullYear}-${mm}-${dd}`;
}

// created_at(ISO) -> YYYY-MM-DD, 없으면 vendor_order_id에서 추론
function getDisplayDate(o: { created_at?: string; vendor_order_id?: string }): string {
  if (o.created_at) {
    const d = new Date(o.created_at);
    if (!Number.isNaN(d.getTime())) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    }
  }
  return inferDateFromOrderId(o.vendor_order_id);
}

// 숫자 포맷
function money(n: number) {
  return new Intl.NumberFormat("ko-KR").format(n);
}

// 헤더뷰용 타입
type HeaderViewRow = {
  vendor_order_id: string;
  created_at?: string;
  vendor_name?: string;
  wh_name?: string;
  total_qty: number;
  status: string;
};

// 라인들을 발주번호 기준으로 묶어서 요약행 만들기
function buildHeaderViewRows(lineRows: VendorOrder[]): HeaderViewRow[] {
  const map = new Map<string, HeaderViewRow>();

  for (const row of lineRows) {
    const key = row.vendor_order_id;
    const prev = map.get(key);

    if (!prev) {
      map.set(key, {
        vendor_order_id: row.vendor_order_id,
        created_at: row.created_at,
        vendor_name: row.vendor_name,
        wh_name: row.wh_name,
        total_qty: row.quantity ?? 0,
        status: row.status,
      });
    } else {
      prev.total_qty += row.quantity ?? 0;
    }
  }

  return Array.from(map.values());
}

/* ================= 컴포넌트 ================= */
const VendorOrderListPage: React.FC = () => {
  const navigate = useNavigate();

  // 필터 상태
  const [vendorFilter, setVendorFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [orderIdSearch, setOrderIdSearch] = useState<string>("");

  // 보기 모드
  const [viewMode, setViewMode] = useState<"line" | "header">("line");

  // 로딩/에러
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  // 서버 데이터
  const [orders, setOrders] = useState<VendorOrder[]>([]);
  const [vendors, setVendors] = useState<VendorOption[]>([]);
  const [items, setItems] = useState<ItemOption[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseOption[]>([]);

  // 이름 맵
  const vendorNameById = useMemo(() => {
    const m = new Map<number, string>();
    vendors.forEach((v) => m.set(v.id, v.name));
    return m;
  }, [vendors]);

  const itemNameById = useMemo(() => {
    const m = new Map<number, string>();
    items.forEach((it) => m.set(it.id, it.name));
    return m;
  }, [items]);

  const whNameById = useMemo(() => {
    const m = new Map<number, string>();
    warehouses.forEach((w) => m.set(w.id, w.name));
    return m;
  }, [warehouses]);

  // 라인뷰용 행 (이름 보강)
  const lineRows: VendorOrder[] = useMemo(() => {
    return orders.map((o) => ({
      ...o,
      vendor_name: o.vendor_name ?? vendorNameById.get(o.vendor_id) ?? "",
      item_name:   o.item_name   ?? itemNameById.get(o.item_id)    ?? "",
      wh_name:     o.wh_name     ?? whNameById.get(o.wh_id)        ?? "",
    }));
  }, [orders, vendorNameById, itemNameById, whNameById]);

  // 헤더뷰용 행
  const headerRows: HeaderViewRow[] = useMemo(() => {
    return buildHeaderViewRows(lineRows);
  }, [lineRows]);

  // 상태 셀렉트 옵션
  const statusOptions = ["", "PENDING", "INPROGRESS", "CANCELED"];

  // 🔽 자동완성용: 현재 orders에서 발주번호만 뽑아서 unique화
  const uniqueOrderIds = useMemo(() => {
    const setIds = new Set<string>();
    for (const o of orders) {
      if (o.vendor_order_id) setIds.add(o.vendor_order_id);
    }
    return Array.from(setIds);
  }, [orders]);

  // 🔽 사용자가 타이핑한 문자열 포함하는 발주번호만 추천
  const orderIdSuggestions = useMemo(() => {
    const kw = orderIdSearch.trim().toLowerCase();
    if (!kw) return [];
    return uniqueOrderIds
      .filter((oid) => oid.toLowerCase().includes(kw))
      .slice(0, 10);
  }, [orderIdSearch, uniqueOrderIds]);

  // 마스터 데이터 로드
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [ven, it, wh] = await Promise.all([
          fetch_vendors(),
          fetch_items(),
          fetch_warehouses(),
        ]);
        if (cancelled) return;
        setVendors(ven);
        setItems(it);
        setWarehouses(wh);
      } catch {
        // 마스터 실패해도 목록은 볼 수 있으니 강하게 막진 않음
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // 실제 발주 목록 로드
  const loadOrders = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      let data: VendorOrder[] = [];

      // 필터 우선순위
      if (startDate && endDate) {
        data = await fetch_vendor_orders_by_period(startDate, endDate);
      } else if (vendorFilter && !statusFilter) {
        data = await fetch_vendor_orders_by_vendor(Number(vendorFilter));
      } else if (!vendorFilter && statusFilter) {
        data = await fetch_vendor_orders_by_status(statusFilter);
      } else if (vendorFilter && statusFilter) {
        const tmp = await fetch_vendor_orders_by_vendor(Number(vendorFilter));
        data = tmp.filter((r) => r.status === statusFilter);
      } else {
        data = await fetch_vendor_orders_all();
      }

      // 발주번호 부분검색(프론트 필터)
      if (orderIdSearch.trim()) {
        const kw = orderIdSearch.trim().toLowerCase();
        data = data.filter((row) =>
          row.vendor_order_id.toLowerCase().includes(kw),
        );
      }

      setOrders(data);
    } catch (err: any) {
      setErrorMsg(err?.message || "목록 조회 실패");
    } finally {
      setLoading(false);
    }
  };

  // 첫 로드
  useEffect(() => {
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 검색 버튼
  const handleSearchClick = () => {
    loadOrders();
  };

  // CSV 다운로드
  const handleDownloadCSV = () => {
    const rowsForCSV = viewMode === "header" ? headerRows : lineRows;

    if (!rowsForCSV.length) {
      alert("다운로드할 데이터가 없습니다.");
      return;
    }

    const cols_line = [
      "발주번호",
      "발주일자",
      "거래처명",
      "품목명",
      "창고명",
      "수량",
      "상태",
    ];
    const cols_header = [
      "발주번호",
      "발주일자",
      "거래처명",
      "창고명",
      "총 수량",
      "상태",
    ];

    let csv = "";

    if (viewMode === "header") {
      csv += cols_header.join(",") + "\n";
      headerRows.forEach((r) => {
        const line = [
          r.vendor_order_id,
          getDisplayDate({
            created_at: r.created_at,
            vendor_order_id: r.vendor_order_id,
          }),
          r.vendor_name ?? "",
          r.wh_name ?? "",
          String(r.total_qty),
          r.status ?? "",
        ]
          .map((v) => `"${(v ?? "").replace(/"/g, '""')}"`)
          .join(",");
        csv += line + "\n";
      });
    } else {
      csv += cols_line.join(",") + "\n";
      lineRows.forEach((r) => {
        const line = [
          r.vendor_order_id,
          getDisplayDate(r),
          r.vendor_name ?? "",
          r.item_name ?? "",
          r.wh_name ?? "",
          String(r.quantity ?? 0),
          r.status ?? "",
        ]
          .map((v) => `"${(v ?? "").replace(/"/g, '""')}"`)
          .join(",");
        csv += line + "\n";
      });
    }

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "vendor_orders.csv";
    a.click();

    URL.revokeObjectURL(url);
  };

  // 신규 발주 등록
  const goNewOrder = () => {
    navigate("/vendor-order/new");
  };

  // 테이블 헤더
  const tableHead =
    viewMode === "header" ? (
      <tr>
        <th style={thStyle}>발주번호</th>
        <th style={thStyle}>발주일자</th>
        <th style={thStyle}>거래처명</th>
        <th style={thStyle}>창고명</th>
        <th style={thStyle}>총 수량</th>
        <th style={thStyle}>상태</th>
      </tr>
    ) : (
      <tr>
        <th style={thStyle}>발주번호</th>
        <th style={thStyle}>발주일자</th>
        <th style={thStyle}>거래처명</th>
        <th style={thStyle}>품목명</th>
        <th style={thStyle}>창고명</th>
        <th style={thStyle}>수량</th>
        <th style={thStyle}>상태</th>
      </tr>
    );

  // 테이블 바디
  const tableBody =
    viewMode === "header"
      ? headerRows.map((r, idx) => {
          const zebraBg = idx % 2 === 1 ? { background: ui.zebra } : undefined;
          return (
            <tr key={r.vendor_order_id} style={zebraBg}>
              <td style={tdStyle}>{r.vendor_order_id}</td>
              <td style={tdStyle}>
                {getDisplayDate({
                  created_at: r.created_at,
                  vendor_order_id: r.vendor_order_id,
                })}
              </td>
              <td style={tdStyle}>{r.vendor_name ?? ""}</td>
              <td style={tdStyle}>{r.wh_name ?? ""}</td>
              <td style={tdStyle}>{money(r.total_qty)}</td>
              <td style={tdStyle}>
                <span style={statusBadgeStyle()}>{r.status}</span>
              </td>
            </tr>
          );
        })
      : lineRows.map((o, idx) => {
          const zebraBg = idx % 2 === 1 ? { background: ui.zebra } : undefined;
          return (
            <tr key={`${o.vendor_order_id}_${idx}`} style={zebraBg}>
              <td style={tdStyle}>{o.vendor_order_id}</td>
              <td style={tdStyle}>{getDisplayDate(o)}</td>
              <td style={tdStyle}>{o.vendor_name}</td>
              <td style={tdStyle}>{o.item_name}</td>
              <td style={tdStyle}>{o.wh_name}</td>
              <td style={tdStyle}>{money(o.quantity ?? 0)}</td>
              <td style={tdStyle}>
                <span style={statusBadgeStyle()}>{o.status}</span>
              </td>
            </tr>
          );
        });

  return (
    <div style={pageWrap}>
      <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>발주 내역 조회</h1>

      {/* 필터 / 검색 영역 */}
      <div style={headerRow}>
        {/* 거래처 */}
        <div style={{ display: "flex", flexDirection: "column", minWidth: 140 }}>
          <label
            style={{
              color: ui.muted,
              fontSize: 13,
              fontWeight: 600,
              marginBottom: 4,
            }}
          >
            거래처
          </label>
          <select
            style={selectStyle}
            value={vendorFilter}
            onChange={(e) => setVendorFilter(e.target.value)}
          >
            <option value="">전체</option>
            {vendors.map((v) => (
              <option key={v.id} value={String(v.id)}>
                {v.name}
              </option>
            ))}
          </select>
        </div>

        {/* 상태 */}
        <div style={{ display: "flex", flexDirection: "column", minWidth: 140 }}>
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
            style={selectStyle}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">전체</option>
            {statusOptions
              .filter((s) => s !== "")
              .map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
          </select>
        </div>

        {/* 기간 시작 */}
        <div style={{ display: "flex", flexDirection: "column", minWidth: 160 }}>
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
          <div style={dateWrapStyle}>
            <input
              type="date"
              style={inputStyle}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
        </div>

        {/* 기간 종료 */}
        <div style={{ display: "flex", flexDirection: "column", minWidth: 160 }}>
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
          <div style={dateWrapStyle}>
            <input
              type="date"
              style={inputStyle}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        {/* 발주번호 부분검색 + 자동완성 드롭다운 */}
        <div
          style={{
            position: "relative", // 드롭다운 absolute 기준
            display: "flex",
            flexDirection: "column",
            minWidth: 200,
            flexGrow: 1,
          }}
        >
          <label
            style={{
              color: ui.muted,
              fontSize: 13,
              fontWeight: 600,
              marginBottom: 4,
            }}
          >
            발주번호
          </label>
          <input
            style={{ ...inputStyle, width: "100%" }}
            placeholder={`예: "VO_VD_SEOUL"`}
            value={orderIdSearch}
            onChange={(e) => setOrderIdSearch(e.target.value)}
          />

          {/* 🔽 자동완성 목록 */}
          {orderIdSearch.trim() !== "" && orderIdSuggestions.length > 0 && (
            <div style={suggestBoxStyle}>
              {orderIdSuggestions.map((oid) => (
                <div
                  key={oid}
                  style={suggestRowStyle}
                  onClick={() => {
                    setOrderIdSearch(oid);
                  }}
                >
                  {oid}
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
            style={searchBtnStyle}
            onClick={handleSearchClick}
            disabled={loading}
          >
            검색
          </button>
        </div>

        {/* 신규 발주 등록 */}
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
            style={primaryBtnStyle}
            onClick={goNewOrder}
          >
            신규 발주 등록
          </button>
        </div>

        {/* 2줄 차지하는 하단행: 보기/CSV */}
        <div style={{ flexBasis: "100%" }} />

        <div style={subRow}>
          <div style={{ fontWeight: 600, color: "#0f172a" }}>
            보기 / 내보내기
          </div>

          <button
            type="button"
            style={viewBtnStyle}
            onClick={() =>
              setViewMode(viewMode === "line" ? "header" : "line")
            }
          >
            {viewMode === "line" ? "헤더 뷰" : "라인 뷰"}
          </button>

          <button
            type="button"
            style={csvBtnStyle}
            onClick={handleDownloadCSV}
          >
            CSV 다운로드
          </button>
        </div>

        {errorMsg && (
          <div
            style={{
              flexBasis: "100%",
              color: ui.danger,
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            {errorMsg}
          </div>
        )}
      </div>

      {/* 테이블 (고정 높이 + 내부 스크롤) */}
      <div style={cardTableWrap}>
        <table style={tableStyle}>
          <thead>{tableHead}</thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  style={{
                    ...tdStyle,
                    textAlign: "center",
                    color: ui.muted,
                  }}
                  colSpan={7}
                >
                  불러오는 중…
                </td>
              </tr>
            ) : viewMode === "header" && headerRows.length === 0 ? (
              <tr>
                <td
                  style={{
                    ...tdStyle,
                    textAlign: "center",
                    color: ui.muted,
                  }}
                  colSpan={7}
                >
                  데이터 없음
                </td>
              </tr>
            ) : viewMode === "line" && lineRows.length === 0 ? (
              <tr>
                <td
                  style={{
                    ...tdStyle,
                    textAlign: "center",
                    color: ui.muted,
                  }}
                  colSpan={7}
                >
                  데이터 없음
                </td>
              </tr>
            ) : (
              (viewMode === "header"
                ? headerRows.map((r, idx) => {
                    const zebraBg =
                      idx % 2 === 1 ? { background: ui.zebra } : undefined;
                    return (
                      <tr key={r.vendor_order_id} style={zebraBg}>
                        <td style={tdStyle}>{r.vendor_order_id}</td>
                        <td style={tdStyle}>
                          {getDisplayDate({
                            created_at: r.created_at,
                            vendor_order_id: r.vendor_order_id,
                          })}
                        </td>
                        <td style={tdStyle}>{r.vendor_name ?? ""}</td>
                        <td style={tdStyle}>{r.wh_name ?? ""}</td>
                        <td style={tdStyle}>{money(r.total_qty)}</td>
                        <td style={tdStyle}>
                          <span style={statusBadgeStyle()}>{r.status}</span>
                        </td>
                      </tr>
                    );
                  })
                : lineRows.map((o, idx) => {
                    const zebraBg =
                      idx % 2 === 1 ? { background: ui.zebra } : undefined;
                    return (
                      <tr
                        key={`${o.vendor_order_id}_${idx}`}
                        style={zebraBg}
                      >
                        <td style={tdStyle}>{o.vendor_order_id}</td>
                        <td style={tdStyle}>{getDisplayDate(o)}</td>
                        <td style={tdStyle}>{o.vendor_name}</td>
                        <td style={tdStyle}>{o.item_name}</td>
                        <td style={tdStyle}>{o.wh_name}</td>
                        <td style={tdStyle}>{money(o.quantity ?? 0)}</td>
                        <td style={tdStyle}>
                          <span style={statusBadgeStyle()}>
                            {o.status}
                          </span>
                        </td>
                      </tr>
                    );
                  }))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default VendorOrderListPage;

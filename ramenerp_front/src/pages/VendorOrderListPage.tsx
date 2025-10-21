import React, { useEffect, useMemo, useState } from "react";
import {
  fetch_vendor_order_list,
  fetch_vendor_order_by_vendor,
  fetch_vendor_order_by_status,
} from "@/api/vendor_orders";
import type { VendorOrder } from "@/types/vendor_order";

const container_style: React.CSSProperties = { padding: 24 };
const toolbar_style: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 12, marginBottom: 14,
};
const btn_style: React.CSSProperties = {
  padding: "8px 12px", border: "1px solid #d0d7de", borderRadius: 8, background: "#fff", cursor: "pointer",
};
const btn_primary_style: React.CSSProperties = {
  ...btn_style, background: "#1976d2", color: "#fff", borderColor: "#1976d2",
};
const input_style: React.CSSProperties = {
  width: 260, padding: "8px 10px", border: "1px solid #d0d7de", borderRadius: 8, background: "#fff",
};
const select_style = input_style;

const panel_style: React.CSSProperties = {
  border: "1px solid #e6e6e6", borderRadius: 12, background: "#fff",
};
const table_style: React.CSSProperties = {
  width: "100%", borderCollapse: "collapse",
};
const th_style: React.CSSProperties = {
  textAlign: "left", padding: "12px", borderBottom: "1px solid #eee", color: "#4b5563",
  fontWeight: 600, background: "#fafafa",
};
const td_style: React.CSSProperties = { padding: "12px", borderBottom: "1px solid #f2f2f2" };

const VendorOrderListPage: React.FC = () => {
  const [rows, set_rows] = useState<VendorOrder[]>([]);
  const [is_loading, set_is_loading] = useState<boolean>(false);
  const [error_message, set_error_message] = useState<string>("");

  // 검색/필터
  const [vendor_keyword, set_vendor_keyword] = useState<string>("");
  const [status, set_status] = useState<string>("");
  const [po_code, set_po_code] = useState<string>("");

  // 목록 로드
  const load_list = async () => {
    set_is_loading(true);
    set_error_message("");
    try {
      let data: VendorOrder[] = [];
      // 백엔드 라우터에 맞춰 우선순위 분기 (status 단독, vendor_id 단독, 그 외엔 query)
      if (status && !vendor_keyword) {
        data = await fetch_vendor_order_by_status(status);
      } else {
        // 간단히 /vendorOrder?status=&vendor_id=&po_code= 로 합치는 방식(백엔드가 지원 안 하면 무시됨)
        data = await fetch_vendor_order_list({
          status: status || undefined,
          // vendor_keyword는 실제로는 이름 검색이므로, 우선 전체를 받아 테이블에서 클라이언트 필터링
          vendor_id: undefined,
        });
      }
      // 클라이언트 사이드 보조 필터(이름·코드)
      const filtered = data.filter((r) => {
        const ok_name = vendor_keyword
          ? (r.vendor_name ?? "").toLowerCase().includes(vendor_keyword.toLowerCase())
          : true;
        const ok_code = po_code ? (r.po_code ?? "").includes(po_code) : true;
        return ok_name && ok_code;
      });
      set_rows(filtered);
    } catch (e: unknown) {
      set_error_message((e as Error).message || "목록 조회 실패");
    } finally {
      set_is_loading(false);
    }
  };

  useEffect(() => {
    void load_list();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const has_filter = useMemo(
    () => !!vendor_keyword || !!status || !!po_code,
    [vendor_keyword, status, po_code]
  );

  return (
    <div style={container_style}>
      <h2 style={{ marginTop: 0, marginBottom: 16 }}>발주 조회</h2>

      {/* 상단 툴바: “거래처명 빠른 조회” 느낌을 맞춤 */}
      <div style={toolbar_style}>
        <button
          style={btn_style}
          onClick={() => {
            const elem = document.getElementById("vendor_kw") as HTMLInputElement | null;
            elem?.focus();
          }}
        >
          거래처명 빠른 조회
        </button>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <label style={{ color: "#374151" }}>거래처명</label>
          <input
            id="vendor_kw"
            style={input_style}
            placeholder="예) CJ 식품"
            value={vendor_keyword}
            onChange={(e) => set_vendor_keyword(e.target.value)}
          />
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <label style={{ color: "#374151" }}>상태</label>
          <select
            style={select_style}
            value={status}
            onChange={(e) => set_status(e.target.value)}
          >
            <option value="">전체</option>
            <option value="DRAFT">DRAFT</option>
            <option value="SUBMITTED">SUBMITTED</option>
            <option value="APPROVED">APPROVED</option>
            <option value="PARTIALLY_RECEIVED">PARTIALLY_RECEIVED</option>
            <option value="RECEIVED">RECEIVED</option>
            <option value="CANCELED">CANCELED</option>
          </select>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <label style={{ color: "#374151" }}>발주코드</label>
          <input
            style={input_style}
            placeholder="예) PO-2025-001"
            value={po_code}
            onChange={(e) => set_po_code(e.target.value)}
          />
        </div>

        <button style={btn_primary_style} onClick={() => void load_list()} disabled={is_loading}>
          검색
        </button>
        <button
          style={btn_style}
          onClick={() => {
            set_vendor_keyword("");
            set_status("");
            set_po_code("");
            void load_list();
          }}
          disabled={is_loading || !has_filter}
        >
          초기화
        </button>

        <div style={{ marginLeft: "auto" }}>
          <a href="/vendor-orders/new" style={{ ...btn_primary_style, textDecoration: "none" }}>
            신규 발주 등록
          </a>
        </div>
      </div>

      {/* 결과 테이블 */}
      <div style={panel_style}>
        <table style={table_style}>
          <thead>
            <tr>
              <th style={th_style}>발주ID</th>
              <th style={th_style}>발주코드</th>
              <th style={th_style}>거래처명</th>
              <th style={th_style}>상태</th>
              <th style={th_style}>입고 예정일</th>
              <th style={th_style}>작성일</th>
              <th style={th_style}>비고</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td style={td_style} colSpan={7}>
                  {is_loading ? "불러오는 중..." : "데이터 없음"}
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id}>
                  <td style={td_style}>{r.id}</td>
                  <td style={td_style}>{r.po_code}</td>
                  <td style={td_style}>{r.vendor_name ?? r.vendor_id}</td>
                  <td style={td_style}>{r.status}</td>
                  <td style={td_style}>{r.expected_date ? new Date(r.expected_date).toLocaleDateString() : "-"}</td>
                  <td style={td_style}>{new Date(r.created_at).toLocaleString()}</td>
                  <td style={td_style}>
                    {/* 아이콘 자리(편집/삭제 등) — 필요시 연결 */}
                    <span style={{ opacity: 0.6 }}>—</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {error_message && (
        <div style={{ color: "#d00", marginTop: 10, fontSize: 13 }}>{error_message}</div>
      )}
    </div>
  );
};

export default VendorOrderListPage;

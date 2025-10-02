// src/pages/VendorListPage.tsx
import React, { useEffect, useState } from "react";

interface ApiVendor {
  vendor_id: number;
  name: string;
  manager: string;
  contact: string; // 전화번호 또는 이메일
  address: string;
  is_active?: boolean | null;
}

interface VendorRow {
  vendor_id: number;
  name: string;
  manager: string;
  contact: string;
  address: string;
  is_active?: boolean;
}

const table_style = { width: "100%", borderCollapse: "collapse" } as const;
const th_td_style = { borderBottom: "1px solid #ddd", padding: "8px", textAlign: "left", whiteSpace: "nowrap" } as const;
const empty_cell_style = { textAlign: "center", padding: "16px" } as const;

const to_vendor_row = (v: ApiVendor): VendorRow => ({
  vendor_id: v.vendor_id,
  name: v.name?.trim() ?? "",
  manager: v.manager?.trim() ?? "",
  contact: String(v.contact ?? "").trim(),
  address: v.address?.trim() ?? "",
  is_active: v.is_active ?? true,
});

const VendorListPage: React.FC = () => {
  const [vendors, set_vendors] = useState<VendorRow[]>([]);
  const [is_loading, set_is_loading] = useState<boolean>(false);
  const [error_message, set_error_message] = useState<string>("");

  useEffect(() => {
    const controller = new AbortController();

    const fetch_vendors = async () => {
      set_is_loading(true);
      set_error_message("");
      try {
        // Vite proxy: /api -> http://<서버>:3000
        const res = await fetch("/api/vendors", {
          method: "GET",
          headers: { Accept: "application/json" },
          signal: controller.signal,
        });

        const raw = await res.text();
        if (!res.ok) {
          let msg = `HTTP ${res.status}`;
          try {
            const err = JSON.parse(raw);
            msg = err?.message || msg;
          } catch {}
          throw new Error(msg);
        }

        const list: ApiVendor[] = raw ? JSON.parse(raw) : [];
        set_vendors(Array.isArray(list) ? list.map(to_vendor_row) : []);
      } catch (e: any) {
        if (e?.name !== "AbortError") set_error_message(e?.message || "목록 조회 중 오류가 발생했습니다.");
      } finally {
        set_is_loading(false);
      }
    };

    fetch_vendors();
    return () => controller.abort();
  }, []);

  return (
    <div>
      <h1>거래처 조회 페이지</h1>

      {is_loading && <div style={{ margin: "8px 0" }}>불러오는 중…</div>}
      {error_message && <div style={{ color: "crimson", margin: "8px 0" }}>{error_message}</div>}

      <table style={table_style}>
        <thead>
          <tr>
            <th style={th_td_style}>거래처ID</th>
            <th style={th_td_style}>거래처명</th>
            <th style={th_td_style}>담당자명</th>
            <th style={th_td_style}>연락처</th>
            <th style={th_td_style}>주소</th>
          </tr>
        </thead>
        <tbody>
          {vendors.map((v) => (
            <tr key={v.vendor_id} title={`${v.name} · ${v.manager} · ${v.contact} · ${v.address}`}>
              <td style={th_td_style}>{v.vendor_id}</td>
              <td style={th_td_style}>{v.name}</td>
              <td style={th_td_style}>{v.manager}</td>
              <td style={th_td_style}>{v.contact}</td>
              <td style={th_td_style}>{v.address}</td>
            </tr>
          ))}

          {vendors.length === 0 && !is_loading && !error_message && (
            <tr>
              <td colSpan={5} style={empty_cell_style}>등록된 거래처가 없습니다.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default VendorListPage;

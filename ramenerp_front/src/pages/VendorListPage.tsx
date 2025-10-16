// src/pages/VendorListPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import VendorSummarySearch from "../components/VendorSummarySearch";
import {
  VendorEditUi,
  putVendor,
  type VendorEditTarget,
} from "./VendorEditFunction";
import {
  VendorDeleteUi,
  deleteVendorById,
  type VendorDeleteTarget,
} from "./VendorDeleteFunction";

interface ApiVendor {
  vendor_id: number;
  name: string;
  manager: string;
  contact: string;
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
const th_td_style = {
  borderBottom: "1px solid #ddd",
  padding: "8px",
  textAlign: "left",
  whiteSpace: "nowrap",
} as const;
const empty_cell_style = { textAlign: "center", padding: "16px" } as const;

const th_contact_style = { ...th_td_style, padding: "8px 4px 8px 8px" } as const;
const td_contact_style = { ...th_td_style, padding: "8px 4px 8px 8px" } as const;
const th_addr_style = { ...th_td_style, padding: "8px 0px 8px 2px" } as const;

const td_addr_flex_style: React.CSSProperties = {
  ...th_td_style,
  padding: "8px 0px 8px 2px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8,
  minWidth: 0,
};
const addr_text_style: React.CSSProperties = {
  overflow: "hidden",
  textOverflow: "ellipsis",
  minWidth: 0,
};
const icon_bar_style: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  flex: "0 0 auto",
};
const icon_btn_style: React.CSSProperties = {
  background: "transparent",
  border: "none",
  padding: 4,
  cursor: "pointer",
  lineHeight: 0,
};

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

  const [nameQuery, set_nameQuery] = useState("");
  const [managerQuery, set_managerQuery] = useState("");
  const [submitted, set_submitted] = useState<{ name: string; manager: string }>({
    name: "",
    manager: "",
  });

  const [summaryOpen, set_summaryOpen] = useState(false);

  // 모달 상태 (외부 파일 사용)
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<VendorEditTarget | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<VendorDeleteTarget | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const fetch_vendors = async () => {
      set_is_loading(true);
      set_error_message("");
      try {
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

    const onCreated = () => fetch_vendors();
    window.addEventListener("vendor:created", onCreated);

    const onSummaryOpen = () => set_summaryOpen(true);
    const onFilter = (e: Event) => {
      const q = (e as CustomEvent).detail?.q ?? "";
      set_nameQuery(q);
      set_managerQuery(q);
      set_submitted({ name: q, manager: q });
    };
    const onFilterReset = () => {
      set_nameQuery("");
      set_managerQuery("");
      set_submitted({ name: "", manager: "" });
    };

    window.addEventListener("vendor:summary-open", onSummaryOpen as EventListener);
    window.addEventListener("vendor:filter", onFilter as EventListener);
    window.addEventListener("vendor:filter-reset", onFilterReset as EventListener);

    return () => {
      controller.abort();
      window.removeEventListener("vendor:created", onCreated);
      window.removeEventListener("vendor:summary-open", onSummaryOpen as EventListener);
      window.removeEventListener("vendor:filter", onFilter as EventListener);
      window.removeEventListener("vendor:filter-reset", onFilterReset as EventListener);
    };
  }, []);

  const filtered = useMemo(() => {
    const q = (submitted.name || submitted.manager || "").trim().toLowerCase();
    if (!q) return vendors;

    const idNum = /^\d+$/.test(q) ? parseInt(q, 10) : null;

    return vendors.filter((v) => {
      const byName = v.name.toLowerCase().includes(q);
      const byManager = v.manager.toLowerCase().includes(q);
      const byId = idNum !== null && v.vendor_id === idNum;
      return byName || byManager || byId;
    });
  }, [vendors, submitted]);

  // 수정 열기/닫기/저장 (외부 모듈 사용)
  const openEdit = (row: VendorRow) => {
    setEditTarget({
      vendor_id: row.vendor_id,
      name: row.name,
      manager: row.manager,
      contact: row.contact,
      address: row.address,
    });
    setEditOpen(true);
  };
  const closeEdit = () => setEditOpen(false);

  const handleSaved = (updated: ApiVendor) => {
    set_vendors((prev) =>
      prev.map((v) =>
        v.vendor_id === updated.vendor_id
          ? { ...v, name: updated.name, manager: updated.manager, contact: updated.contact, address: updated.address }
          : v
      )
    );
  };

  // 삭제 열기/닫기/확정 (외부 모듈 사용)
  const openDelete = (row: VendorRow) => {
    setDeleteTarget({ vendor_id: row.vendor_id, name: row.name });
    setDeleteOpen(true);
  };
  const closeDelete = () => setDeleteOpen(false);

  return (
    <div>
      {is_loading && <div style={{ margin: "8px 0" }}>불러오는 중…</div>}
      {error_message && <div style={{ color: "crimson", margin: "8px 0" }}>{error_message}</div>}

      <table style={table_style}>
        <thead>
          <tr>
            <th style={th_td_style}>거래처ID</th>
            <th style={th_td_style}>거래처명</th>
            <th style={th_td_style}>담당자명</th>
            <th style={th_contact_style}>연락처</th>
            <th style={th_addr_style}>주소</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((v) => (
            <tr key={v.vendor_id} title={`${v.name} · ${v.manager} · ${v.contact} · ${v.address}`}>
              <td style={th_td_style}>{v.vendor_id}</td>
              <td style={th_td_style}>{v.name}</td>
              <td style={th_td_style}>{v.manager}</td>
              <td style={td_contact_style}>{v.contact}</td>
              <td style={td_addr_flex_style}>
                <span style={addr_text_style}>{v.address}</span>
                <span style={icon_bar_style}>
                  {/* 연필(수정) */}
                  <button
                    type="button"
                    style={icon_btn_style}
                    onClick={() => openEdit(v)}
                    title="수정"
                    aria-label="수정"
                  >
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                      <path
                        d="M13.585 3.586a2 2 0 0 1 2.828 2.828l-8.486 8.486-3.414.586.586-3.414 8.486-8.486Z"
                        stroke="#374151"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path d="M12 5l3 3" stroke="#374151" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </button>

                  {/* 휴지통(삭제) */}
                  <button
                    type="button"
                    style={icon_btn_style}
                    onClick={() => openDelete(v)}
                    title="삭제"
                    aria-label="미사용"
                  >
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                      <path d="M6 7h8l-.7 9.1a2 2 0 0 1-2 1.9H8.7a2 2 0 0 1-2-1.9L6 7Z" stroke="#ef4444" strokeWidth="1.5" />
                      <path d="M4 7h12M8 7V4h4v3" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </button>
                </span>
              </td>
            </tr>
          ))}

          {filtered.length === 0 && !is_loading && !error_message && (
            <tr>
              <td colSpan={5} style={empty_cell_style}>
                검색 결과가 없습니다.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <VendorSummarySearch open={summaryOpen} onClose={() => set_summaryOpen(false)} />

      {/* 수정 모달 (외부 파일) */}
      <VendorEditUi
        open={editOpen}
        target={editTarget}
        onClose={closeEdit}
        onSubmit={async (data) => {
          try {
            const updated = await putVendor(data);
            handleSaved(updated);
            closeEdit();
            alert("수정이 완료되었습니다.");
          } catch (e: any) {
            alert(e?.message || "수정에 실패했습니다.");
          }
        }}
      />

      {/* 삭제 모달 (외부 파일) */}
      <VendorDeleteUi
        open={deleteOpen}
        target={deleteTarget}
        onClose={closeDelete}
        onConfirm={async () => {
          if (!deleteTarget) return;
          try {
            await deleteVendorById(deleteTarget.vendor_id);
            set_vendors((prev) => prev.filter((v) => v.vendor_id !== deleteTarget.vendor_id));
            alert("삭제가 완료되었습니다.");
            closeDelete();
          } catch (e: any) {
            alert(e?.message || "삭제에 실패했습니다.");
          }
        }}
      />
    </div>
  );
};

export default VendorListPage;

// src/pages/VendorListPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import VendorSummarySearch from "../components/VendorSummarySearch";
import VendorSearchBar from "../components/VendorSearchBar";
import {
  VendorEditUi,
  putVendor,
  type VendorEditTarget,
} from "../function/VendorEditFunction";

import VendorNotUsedUi from "../../NotUsed/components/VendorNotUsedUi";
import { markVendorNotUsed } from "../../NotUsed/function/VendorNotUsedFunction";
import VendorRegisterPage from "./VendorRegisterPage";

interface ApiVendor {
  vendor_id: number | string;
  /** 백엔드가 내려줄 수 있는 실제 PK */
  id?: number;
  name: string;
  manager: string;
  contact: string;
  address: string;
  is_active?: boolean | null;
  identification_number?: string | null;
}

interface VendorRow {
  /** ✅ 항상 DB PK를 보관 (즉시 반영용 키) */
  vendor_id: number;
  /** 화면 표시용 문자열 ID(코드) */
  display_vendor_id: string;
  name: string;
  manager: string;
  contact: string;
  address: string;
  is_active?: boolean;
  identification_number?: string;
}

type VendorDeleteTarget = { vendor_id: number; name: string };

const ui_tok = {
  bg_page: "#f6f7f9",
  surface: "#ffffff",
  border: "#e6e8ec",
  header_bg: "#f8fafc",
  zebra: "#fafafa",
  text: "#111827",
  label: "#6b7280",
  radius: 12,
  gap: 10,
  focus: "0 0 0 3px rgba(14,165,233,0.25)",
  primary_bg: "#0ea5e9",
  primary_border: "#0284c7",
  primary_text: "#ffffff",
} as const;

const page_wrap_style: React.CSSProperties = {
  background: ui_tok.bg_page,
  minHeight: "100%",
  padding: "24px 16px",
};
const page_style = { padding: 16, maxWidth: 1200, margin: "0 auto" } as const;

const controls_block_style: React.CSSProperties = { marginTop: 4, marginBottom: 12 };
const controls_title_style: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 800,
  color: ui_tok.text,
  margin: "0 0 6px 0",
  transform: "translateY(-20px)",
};

const top_row_style: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
};
const top_controls_style: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  marginTop: 0,
  marginBottom: 0,
  justifyContent: "flex-start",
};

const quick_btn_style: React.CSSProperties = {
  height: 40,
  padding: "0 12px",
  borderRadius: 10,
  border: `1px solid ${ui_tok.border}`,
  background: "#111827",
  color: "#fff",
  cursor: "pointer",
  whiteSpace: "nowrap",
  transform: "translateY(-0.8px)",
  marginLeft: 12,
};

const create_btn_style: React.CSSProperties = {
  height: 40,
  padding: "0 16px",
  borderRadius: 999,
  border: `1px solid ${ui_tok.primary_border}`,
  background: ui_tok.primary_bg,
  color: ui_tok.primary_text,
  fontWeight: 800,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const table_card_style: React.CSSProperties = {
  border: `1px solid ${ui_tok.border}`,
  borderRadius: ui_tok.radius,
  background: ui_tok.surface,
  overflowX: "hidden",
  overflowY: "auto",
  maxHeight: "60vh",
};

const table_wrap_style = { overflowX: "auto" } as const;
const table_style = { width: "100%", borderCollapse: "separate" as const, borderSpacing: 0 } as const;

const th_td_base = {
  padding: "12px 10px",
  textAlign: "left" as const,
  whiteSpace: "nowrap" as const,
  color: ui_tok.text,
} as const;
const th_style = {
  ...th_td_base,
  fontSize: 13,
  fontWeight: 700,
  background: ui_tok.header_bg,
  borderBottom: `1px solid ${ui_tok.border}`,
} as const;
const td_style = { ...th_td_base, fontSize: 14, borderBottom: `1px solid ${ui_tok.border}` } as const;
const td_contact_style = { ...td_style, padding: "12px 8px 12px 10px" } as const;
const th_addr_style = { ...th_style, padding: "12px 2px 12px 2px" } as const;
const td_addr_flex_style: React.CSSProperties = {
  ...td_style,
  padding: "12px 2px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8,
  minWidth: 0,
};
const addr_text_style: React.CSSProperties = { overflow: "hidden", textOverflow: "ellipsis", minWidth: 0 };
const icon_bar_style: React.CSSProperties = { display: "inline-flex", alignItems: "center", gap: 6, flex: "0 0 auto" };
const icon_btn_style: React.CSSProperties = { background: "transparent", border: "none", padding: 4, cursor: "pointer", lineHeight: 0 };
const empty_cell_style = { textAlign: "center", padding: 24, color: ui_tok.label } as const;

const name_cell_wrap_style: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 4, minWidth: 0 };
const name_text_style: React.CSSProperties = { overflow: "hidden", textOverflow: "ellipsis" };
const id_badge_style: React.CSSProperties = {
  display: "inline-block",
  fontSize: 12,
  lineHeight: 1,
  padding: "4px 6px",
  borderRadius: 6,
  background: "#f3f4f6",
  border: "1px solid #e5e7eb",
  color: "#374151",
  maxWidth: "100%",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

/** ✅ 핵심 수정: vendor_id는 항상 DB PK(id)로 저장하고,
 *  display_vendor_id는 화면에만 사용 */
const to_vendor_row = (v: ApiVendor): VendorRow => {
  const apiAny = v as Record<string, any>;
  const pk = Number(apiAny.id ?? apiAny.vendor_id); // ← id 우선, 없으면 숫자로 해석 가능한 케이스 보조
  const stringId =
    (typeof apiAny.vendor_id === "string" && apiAny.vendor_id) ||
    (typeof apiAny.id === "string" && apiAny.id) ||
    String(apiAny.vendor_id ?? apiAny.id ?? "");

  return {
    vendor_id: pk,                 // ✅ 리스트의 기준키 = PK
    display_vendor_id: stringId,   // ✅ 표시는 코드 유지
    name: String(v.name ?? "").trim(),
    manager: String(v.manager ?? "").trim(),
    contact: String(v.contact ?? "").trim(),
    address: String(v.address ?? "").trim(),
    is_active: v.is_active ?? true,
    identification_number: (v.identification_number ?? undefined) || undefined,
  };
};

const VendorListPage: React.FC = () => {
  const navigate = useNavigate();

  const [vendors, set_vendors] = useState<VendorRow[]>([]);
  const [is_loading, set_is_loading] = useState(false);
  const [error_message, set_error_message] = useState("");

  const [nameQuery, set_nameQuery] = useState("");
  const [managerQuery, set_managerQuery] = useState("");
  const [submitted, set_submitted] = useState<{ name: string; manager: string }>({ name: "", manager: "" });

  const [summaryOpen, set_summaryOpen] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<VendorEditTarget | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<VendorDeleteTarget | null>(null);

  const [is_register_open, set_is_register_open] = useState(false);

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
          try { msg = JSON.parse(raw)?.message || msg; } catch {}
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

    window.addEventListener("vendor:created", onCreated);
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

  useEffect(() => {
    const closeOnCreated = () => set_is_register_open(false);
    const closeOnCancel = () => set_is_register_open(false);
    window.addEventListener("vendor:created", closeOnCreated);
    window.addEventListener("vendor:register:cancel", closeOnCancel);
    return () => {
      window.removeEventListener("vendor:created", closeOnCreated);
      window.removeEventListener("vendor:register:cancel", closeOnCancel);
    };
  }, []);

  const filtered = useMemo(() => {
    const nq = (submitted.name || "").trim().toLowerCase();
    const mq = (submitted.manager || "").trim().toLowerCase();
    if (!nq && !mq) return vendors;

    const idNum = /^\d+$/.test(nq) ? parseInt(nq, 10) : null;
    return vendors.filter((v) => {
      const byId = idNum !== null && v.vendor_id === idNum;
      const byName = nq ? v.name.toLowerCase().includes(nq) : false;
      const byManager = mq ? v.manager.toLowerCase().includes(mq) : false;
      return byId || byName || byManager || (!nq && !mq);
    });
  }, [vendors, submitted]);

  const openEdit = (row: VendorRow) => {
    // target.vendor_id는 PK를 그대로 넘김
    setEditTarget({ vendor_id: row.vendor_id, name: row.name, manager: row.manager, contact: row.contact, address: row.address });
    setEditOpen(true);
  };
  const closeEdit = () => setEditOpen(false);

  // 낙관적/확정 반영 공용
  const handleSaved = (updated: Partial<ApiVendor> & { id?: number; vendor_id?: number | string }) => {
    // 우선순위: 응답 id(숫자 PK) → 현재 target의 vendor_id(숫자 PK) → 표시용 숫자 suffix
    const pk = Number((updated as any).id ?? (updated as any).vendor_id);
    const display = String((updated as any).display_vendor_id ?? (updated as any).vendor_id ?? "");
    const suffix = (display.match(/\d+$/) || [])[0] || "";

    set_vendors(prev =>
      prev.map(v => {
        const matchByPk = Number.isFinite(pk) && v.vendor_id === pk;
        const matchBySuffix = !Number.isFinite(pk) && suffix && String(v.display_vendor_id).endsWith(suffix);
        if (matchByPk || matchBySuffix) {
          return {
            ...v,
            name: updated.name ?? v.name,
            manager: updated.manager ?? v.manager,
            contact: updated.contact ?? v.contact,
            address: updated.address ?? v.address,
          };
        }
        return v;
      })
    );
  };

  const openDelete = (row: VendorRow) => {
    setDeleteTarget({ vendor_id: row.vendor_id, name: row.name });
    setDeleteOpen(true);
  };
  const closeDelete = () => setDeleteOpen(false);

  const handle_search_click = () => set_submitted({ name: nameQuery, manager: managerQuery });
  const handle_reset_click = () => {
    set_nameQuery("");
    set_managerQuery("");
    set_submitted({ name: "", manager: "" });
  };

  const open_summary_modal = () => set_summaryOpen(true);

  return (
    <div style={page_wrap_style}>
      <div style={page_style}>
        <div style={controls_block_style}>
          <div style={controls_title_style}>거래처 조회</div>

          <div style={top_row_style}>
            <div style={top_controls_style}>
              <VendorSearchBar
                nameValue={nameQuery}
                managerValue={managerQuery}
                onChangeName={set_nameQuery}
                onChangeManager={set_managerQuery}
                onSearch={handle_search_click}
                onReset={handle_reset_click}
              />
              <button type="button" style={quick_btn_style} onClick={open_summary_modal}>
                거래처 ID 조회
              </button>
            </div>

            <button
              type="button"
              style={create_btn_style}
              onClick={() => set_is_register_open(true)}
            >
              신규 거래처 등록
            </button>
          </div>
        </div>

        {is_loading && <div style={{ margin: "8px 0", color: ui_tok.label }}>불러오는 중…</div>}
        {error_message && <div style={{ color: "#c62828", margin: "8px 0" }}>{error_message}</div>}

        <div style={table_card_style}>
          <div style={table_wrap_style}>
            <table style={table_style}>
              <thead>
                <tr>
                  <th style={th_style}>거래처ID</th>
                  <th style={th_style}>거래처명</th>
                  <th style={th_style}>담당자명</th>
                  <th style={th_style}>연락처</th>
                  <th style={th_addr_style}>주소</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((v, idx) => (
                  <tr
                    key={v.vendor_id}
                    title={`${v.name} · ${v.manager} · ${v.contact} · ${v.address}`}
                    style={idx % 2 === 1 ? { background: ui_tok.zebra } : undefined}
                  >
                    <td style={td_style}>{v.display_vendor_id}</td>
                    <td style={td_style}>
                      <div style={name_cell_wrap_style}>
                        <span style={name_text_style}>{v.name}</span>
                        {v.identification_number && (
                          <span style={id_badge_style} title={`사업자등록번호 ${v.identification_number}`}>
                            사업자번호 {v.identification_number}
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={td_style}>{v.manager}</td>
                    <td style={td_contact_style}>{v.contact}</td>
                    <td style={td_addr_flex_style}>
                      <span style={addr_text_style}>{v.address}</span>
                      <span style={icon_bar_style}>
                        <button
                          type="button"
                          style={icon_btn_style}
                          onClick={() => openEdit(v)}
                          title="수정"
                          aria-label="수정"
                        >
                          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                            <path d="M13.585 3.586a2 2 0 0 1 2.828 2.828l-8.486 8.486-3.414.586.586-3.414 8.486-8.486Z"
                              stroke="#374151" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M12 5l3 3" stroke="#374151" strokeWidth="1.5" strokeLinecap="round" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          style={icon_btn_style}
                          onClick={() => openDelete(v)}
                          title="미사용 등록"
                          aria-label="미사용"
                        >
                          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                            <path d="M6 7h8l-.7 9.1a2 2 0 0 1-2 1.9H8.7a2 2 0 0 1-2-1.9L6 7Z"
                              stroke="#ef4444" strokeWidth="1.5" />
                            <path d="M4 7h12M8 7V4h4v3" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
                          </svg>
                        </button>
                      </span>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && !is_loading && !error_message && (
                  <tr>
                    <td colSpan={5} style={empty_cell_style}>검색 결과가 없습니다.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <VendorSummarySearch open={summaryOpen} onClose={() => set_summaryOpen(false)} />

        <VendorEditUi
          open={editOpen}
          target={editTarget}
          onClose={closeEdit}
          onSubmit={async (data) => {
            // 1) 즉시 낙관적 갱신 (PK = data.vendor_id)
            handleSaved({
              id: Number(data.vendor_id),
              name: data.name,
              manager: data.manager,
              contact: String(data.contact ?? ""),
              address: data.address,
            });

            try {
              const raw = await putVendor(data);
              // 2) 확정 갱신: 응답의 id(또는 vendor_id)로 다시 한 번 보강
              handleSaved({
                id: Number((raw as any).id ?? (raw as any).vendor_id ?? data.vendor_id),
                name: String((raw as any).name ?? data.name),
                manager: String((raw as any).manager ?? data.manager),
                contact: String((raw as any).contact ?? data.contact),
                address: String((raw as any).address ?? data.address),
                vendor_id: String((raw as any).vendor_id ?? ""), // 표시용 코드가 응답에 있으면 보조 매칭 가능
              });
              closeEdit();
              alert("수정이 완료되었습니다.");
            } catch (e: any) {
              alert(e?.message || "수정에 실패했습니다.");
            }
          }}
        />

        <VendorNotUsedUi
          open={deleteOpen}
          target={deleteTarget}
          onClose={closeDelete}
          onConfirm={async () => {
            if (!deleteTarget) return;
            try {
              await markVendorNotUsed(deleteTarget.vendor_id);
              // 상태만 NOTUSED로 바뀌므로 메인 목록에서는 즉시 제거
              set_vendors(prev => prev.filter(v => v.vendor_id !== deleteTarget.vendor_id));
              alert("미사용으로 등록되었습니다.");
              closeDelete();
            } catch (e: any) {
              alert(e?.message || "미사용 등록에 실패했습니다.");
            }
          }}
        />

        {is_register_open && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.35)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 9998,
            }}
            onClick={() => set_is_register_open(false)}
          >
            <div
              style={{
                width: "min(900px, 94vw)",
                maxHeight: "90vh",
                overflowY: "auto",
                background: "#fff",
                border: `1px solid ${ui_tok.border}`,
                borderRadius: 12,
                boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
                padding: 16,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>거래처 등록</h2>
                <button
                  type="button"
                  style={{ padding: "6px 10px", borderRadius: 8, border: `1px solid ${ui_tok.border}`, background: "#fff", cursor: "pointer" }}
                  onClick={() => set_is_register_open(false)}
                >
                  닫기
                </button>
              </div>
              <VendorRegisterPage />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorListPage;

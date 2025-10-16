// src/pages/VendorListPage.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import VendorSummarySearch from "../components/VendorSummarySearch";
import VendorSearchBar from "../components/VendorSearchBar";
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
import VendorRegisterPageUI, {
  type VendorFormViewState,
} from "../components/VendorRegisterPageUI";

// ✅ 추가: 등록 POST + 팝업 유틸
import { submitVendor } from "./VendorRegisterCheck";

/* ===== 타입 ===== */
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

/* ===== UI 토큰 ===== */
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

/* ===== 레이아웃 스타일 ===== */
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

/* 버튼들 */
const quick_btn_style: React.CSSProperties = {
  height: 35,
  padding: "0 12px",
  borderRadius: 10,
  border: `1px solid ${ui_tok.border}`,
  background: "#111827",
  color: "#fff",
  cursor: "pointer",
  whiteSpace: "nowrap",
  transform: "translateY(-5px)",
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

/* 테이블 */
const table_card_style: React.CSSProperties = {
  border: `1px solid ${ui_tok.border}`,
  borderRadius: ui_tok.radius,
  background: ui_tok.surface,
  overflow: "hidden",
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

/* ===== 유틸 ===== */
const to_vendor_row = (v: ApiVendor): VendorRow => ({
  vendor_id: v.vendor_id,
  name: v.name?.trim() ?? "",
  manager: v.manager?.trim() ?? "",
  contact: String(v.contact ?? "").trim(),
  address: v.address?.trim() ?? "",
  is_active: v.is_active ?? true,
});

/* ===== 컴포넌트 ===== */
const VendorListPage: React.FC = () => {
  const [vendors, set_vendors] = useState<VendorRow[]>([]);
  const [is_loading, set_is_loading] = useState(false);
  const [error_message, set_error_message] = useState("");

  // 검색바 입력값
  const [nameQuery, set_nameQuery] = useState("");
  const [managerQuery, set_managerQuery] = useState("");
  // 실제 필터링용 값
  const [submitted, set_submitted] = useState<{ name: string; manager: string }>({ name: "", manager: "" });

  const [summaryOpen, set_summaryOpen] = useState(false);

  // 수정/삭제 모달
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<VendorEditTarget | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<VendorDeleteTarget | null>(null);

  /* ===== 신규 등록 모달 (UI만 추가) ===== */
  const [is_register_open, set_is_register_open] = useState(false);
  const [form_data, set_form_data] = useState<VendorFormViewState>({
    name: "",
    contact_name: "",
    address_road: "",
    address_detail: "",
  });
  const [contact_email, set_contact_email] = useState("");
  const detail_ref = useRef<HTMLInputElement>(null!); // 상세주소 포커스

  const on_change: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const { name, value } = e.target;
    set_form_data((prev: any) => ({ ...prev, [name as keyof VendorFormViewState]: value }));
  };
  const on_contact_email_change: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    set_contact_email(e.target.value);
  };
  const open_address_search = () => {
    // 주소 검색 UI 트리거(프로젝트 기존 흐름 유지)
    window.dispatchEvent(new CustomEvent("address:open"));
    setTimeout(() => detail_ref.current?.focus(), 0);
  };

  // ✅ 등록 버튼 클릭 시: 유틸을 사용해 POST + 팝업 + 목록갱신
  const on_submit: React.FormEventHandler = async (e) => {
    e.preventDefault();
    await submitVendor(
      {
        name: form_data.name,
        contact_name: form_data.contact_name,
        contact_email,
        address_road: form_data.address_road,
        address_detail: form_data.address_detail,
      },
      {
        onSuccess: () => {
          // 모달 닫고 폼 리셋 (기존 흐름 보존 + 후처리만 추가)
          set_is_register_open(false);
          set_form_data({ name: "", contact_name: "", address_road: "", address_detail: "" });
          set_contact_email("");
        },
        onError: () => {
          // 추가적으로 할 게 있으면 여기에 (로깅 등)
        },
      }
    );
  };

  /* ===== 데이터 로딩 & 이벤트 바인딩 ===== */
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

  // 수정/삭제
  const openEdit = (row: VendorRow) => {
    setEditTarget({ vendor_id: row.vendor_id, name: row.name, manager: row.manager, contact: row.contact, address: row.address });
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
  const openDelete = (row: VendorRow) => {
    setDeleteTarget({ vendor_id: row.vendor_id, name: row.name });
    setDeleteOpen(true);
  };
  const closeDelete = () => setDeleteOpen(false);

  // 검색바 버튼
  const handle_search_click = () => set_submitted({ name: nameQuery, manager: managerQuery });
  const handle_reset_click = () => {
    set_nameQuery("");
    set_managerQuery("");
    set_submitted({ name: "", manager: "" });
  };

  const open_summary_modal = () => set_summaryOpen(true);

  /* ===== 모달 스타일 (등록) ===== */
  const overlay_style: React.CSSProperties = {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.35)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9998,
  };
  const modal_style: React.CSSProperties = {
    width: "min(720px, 94vw)",
    maxHeight: "90vh",
    overflowY: "auto",
    background: "#fff",
    border: `1px solid ${ui_tok.border}`,
    borderRadius: 12,
    boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
    padding: 16,
  };
  const topbar_style: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  };
  const close_btn_style: React.CSSProperties = {
    padding: "6px 10px",
    borderRadius: 8,
    border: `1px solid ${ui_tok.border}`,
    background: "#fff",
    cursor: "pointer",
  };

  return (
    <div style={page_wrap_style}>
      <div style={page_style}>
        {/* 상단: 제목 + 좌우 나뉜 컨트롤바 */}
        <div style={controls_block_style}>
          <div style={controls_title_style}>거래처 조회</div>

          <div style={top_row_style}>
            {/* 왼쪽: 빠른 조회 + 검색바 */}
            <div style={top_controls_style}>
              <button type="button" style={quick_btn_style} onClick={open_summary_modal}>
                거래처명 빠른 조회
              </button>

              <VendorSearchBar
                nameValue={nameQuery}
                managerValue={managerQuery}
                onChangeName={set_nameQuery}
                onChangeManager={set_managerQuery}
                onSearch={handle_search_click}
                onReset={handle_reset_click}
              />
            </div>

            {/* 오른쪽: 신규 거래처 등록 버튼 */}
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

        {/* 목록 */}
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
                    <td style={td_style}>{v.vendor_id}</td>
                    <td style={td_style}>{v.name}</td>
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
                    <td colSpan={5} style={empty_cell_style}>검색 결과가 없습니다.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* (기존) 모달들 */}
        <VendorSummarySearch open={summaryOpen} onClose={() => set_summaryOpen(false)} />
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

        {/* 신규 거래처 등록 모달 (UI만 추가, 기존 흐름 보존) */}
        {is_register_open && (
          <div style={overlay_style} onClick={() => set_is_register_open(false)}>
            <div style={modal_style} onClick={(e) => e.stopPropagation()}>
              <div style={topbar_style}>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>거래처 등록</h2>
                <button type="button" style={close_btn_style} onClick={() => set_is_register_open(false)}>닫기</button>
              </div>

              <VendorRegisterPageUI
                form_data={form_data}
                on_change={on_change}
                contact_email={contact_email}
                on_contact_email_change={on_contact_email_change}
                open_address_search={open_address_search}
                detail_ref={detail_ref}
                on_submit={on_submit}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorListPage;

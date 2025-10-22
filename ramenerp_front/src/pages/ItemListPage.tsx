// src/pages/ItemListPage.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import ItemRegisterForm from "./ItemRegisterForm";
import { change_item_use_state } from "@/api/items";
import {
  fetch_vendor_options,
  fetch_vendor_name_by_id,
  type VendorOpt as VOpt,
} from "@/api/vendor_summary";

/* ===================== 타입 ===================== */
export interface ProductRow {
  id?: number;
  item_id: string;
  category_id: string;
  category_name?: string;
  name: string;
  unit_id: string;
  unit_name?: string;
  unit_price: number;
  expiry_date?: string;
  vendor_id?: string;
  vendor_name?: string;
  is_active?: boolean;
  days_left?: number | null;
}

type ItemListPageProps = { hide_title?: boolean };

type CategoryOpt = { id: string; code?: string; name: string };
type VendorOpt = VOpt;
type UnitOpt = { id: string; code: string; name: string };

/* ===================== UI/유틸 ===================== */
const ui = { border:"#e5e7eb", zebra:"#fafafa", radius:10, gap:8, muted:"#6b7280", danger:"#c62828", warn:"#ef6c00", p_bg:"#0ea5e9", p_bd:"#0284c7", p_tx:"#fff" } as const;
const page = { padding:16, maxWidth:1200, margin:"0 auto" } as const;
const title = { fontSize:22, fontWeight:800, marginBottom:8 } as const;
const bar = { display:"flex", gap:ui.gap, alignItems:"center", marginBottom:12, flexWrap:"wrap" as const } as const;
const sel = { padding:8, minWidth:160, borderRadius:8, border:`1px solid ${ui.border}` } as const;
const ipt = { padding:8, width:120, borderRadius:8, border:`1px solid ${ui.border}` } as const;
const ghost = { padding:"8px 12px", borderRadius:8, border:`1px solid ${ui.border}`, background:"#fff", cursor:"pointer" } as const;
const twrap = { overflowX:"auto", border:`1px solid ${ui.border}`, borderRadius:ui.radius } as const;
const table = { width:"100%", borderCollapse:"separate" as const, borderSpacing:0 } as const;
const th = { position:"sticky" as const, top:0, background:"#f8fafc", borderBottom:`1px solid ${ui.border}`, padding:"10px 8px", textAlign:"left" as const, whiteSpace:"nowrap" as const, fontSize:13, fontWeight:700 } as const;
const td = { borderBottom:`1px solid ${ui.border}`, padding:"9px 8px", textAlign:"left" as const, whiteSpace:"nowrap" as const, fontSize:14 } as const;
const act = { padding:"6px 10px", borderRadius:8, border:`1px solid ${ui.border}`, background:"#fff", cursor:"pointer" } as const;
const overlay: React.CSSProperties = { position:"fixed", inset:0, background:"rgba(0,0,0,0.35)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:50 };
const modal: React.CSSProperties = { width:"min(720px, 94vw)", maxHeight:"90vh", overflowY:"auto", background:"#fff", border:`1px solid ${ui.border}`, borderRadius:12, boxShadow:"0 10px 30px rgba(0,0,0,0.2)", padding:16 };

const norm_id = (v: unknown): string => {
  const s = String(v ?? "").trim();
  const n = Number(s);
  return Number.isFinite(n) ? String(n) : s;
};
function yyyy_mm_dd(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function money(n: number) { return new Intl.NumberFormat("ko-KR").format(n); }

/** 원본 -> 화면 모델 */
function normalize_item(raw: any): ProductRow {
  const id = raw.id ?? raw.item_pk ?? undefined;
  const item_id = String(raw.item_id ?? raw.code ?? raw.sku ?? (id ?? ""));
  const cat_id = raw.category_id ?? raw.category?.id ?? raw.category?.category_id ?? raw.categoryId;
  const ven_raw = raw.vendor_id ?? raw.vendor?.id ?? raw.vendor?.vendor_id ?? raw.vendorId;
  const unit_id = raw.unit_id ?? raw.unit?.id ?? raw.unit?.unit_id ?? raw.unitId;
  const unit_price_num = Number(raw.unit_price ?? raw.price);
  const expiry_iso = raw.expiry_date ?? raw.expiration_date ?? raw.expireDate;

  return {
    id,
    item_id,
    name: String(raw.name ?? raw.item_name ?? "").trim(),
    category_id: cat_id !== undefined ? norm_id(cat_id) : "",
    category_name: raw.category_name ?? raw.category?.category_name ?? raw.category?.name,
    unit_id: unit_id !== undefined ? norm_id(unit_id) : "",
    unit_name: raw.unit_name ?? raw.unit?.unit_name ?? raw.unit?.name ?? raw.unit?.code,
    unit_price: Number.isFinite(unit_price_num) ? unit_price_num : 0,
    expiry_date: yyyy_mm_dd(expiry_iso),
    vendor_id: ven_raw !== undefined ? norm_id(ven_raw) : undefined,
    vendor_name: raw.vendor_name ?? raw.vendor?.vendor_name ?? raw.vendor?.name,
  };
}

const DAY = 24 * 60 * 60 * 1000;
function days_left(iso?: string): number | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const today = new Date();
  d.setHours(0,0,0,0); today.setHours(0,0,0,0);
  return Math.ceil((d.getTime() - today.getTime()) / DAY);
}
function DaysCell({ d, warn }: { d: number | null | undefined; warn: number }) {
  if (d === null || d === undefined) return <span>-</span>;
  if (d < 0) return <span style={{ color:"#555", fontWeight:700 }}>D+{Math.abs(d)}</span>;
  if (d <= warn) return <span style={{ color:ui.danger, fontWeight:800 }}>D-{d}</span>;
  return <span style={{ color:ui.warn, fontWeight:700 }}>D-{d}</span>;
}

/* 정렬 함수 */
const by_name_cat = (a: CategoryOpt, b: CategoryOpt) => a.name.localeCompare(b.name, "ko");
const by_name_vendor = (a: VendorOpt, b: VendorOpt) => a.name.localeCompare(b.name, "ko");

/* ===================== 페이지 ===================== */
const ItemListPage: React.FC<ItemListPageProps> = ({ hide_title = false }) => {
  const [rows, set_rows] = useState<ProductRow[]>([]);
  const [loading, set_loading] = useState(false);
  const [error, set_error] = useState("");

  const [cat_opt, set_cat_opt] = useState<CategoryOpt[]>([]);
  const [ven_opt, set_ven_opt] = useState<VendorOpt[]>([]);
  const [unit_opt, set_unit_opt] = useState<UnitOpt[]>([]);

  const [cat_f, set_cat_f] = useState<string>("");
  const [ven_f, set_ven_f] = useState<string>("");
  const [exp_f, set_exp_f] = useState<string>("");

  const [editing_id, set_editing_id] = useState<string | null>(null);
  const [acting_id, set_acting_id] = useState<string | null>(null);
  const [is_saving, set_is_saving] = useState(false);

  const [draft, set_draft] = useState<Partial<ProductRow> & { unit_code?: string }>({});
  const [open, set_open] = useState(false);
  const [reload, set_reload] = useState(0);

  const vendor_fetching = useRef<Set<string>>(new Set());

  const unit_code_by_id = useMemo(() => {
    const m = new Map<string, string>();
    unit_opt.forEach((u: UnitOpt) => m.set(u.id, u.code));
    return m;
  }, [unit_opt]);
  const cat_name_by_id = useMemo(() => {
    const m = new Map<string, string>();
    cat_opt.forEach((c: CategoryOpt) => m.set(c.id, c.name));
    return m;
  }, [cat_opt]);
  const ven_name_by_id = useMemo(() => {
    const m = new Map<string, string>();
    ven_opt.forEach((v: VendorOpt) => m.set(v.id, v.name));
    return m;
  }, [ven_opt]);

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      set_loading(true); set_error("");
      try {
        const params = new URLSearchParams();
        if (cat_f) params.set("category", cat_f);
        // ✅ 서버에 vendor 파라미터는 보내지 않음 (500 방지)
        if (exp_f && Number(exp_f) > 0) params.set("expiring", String(Number(exp_f)));

        const [catsRes, vendorOpts, unitsRes] = await Promise.all([
          fetch("/api/category", { signal: controller.signal, headers: { Accept: "application/json" } }).then(r => r.ok ? r.json() : []),
          fetch_vendor_options(),
          fetch("/api/units", { signal: controller.signal, headers: { Accept: "application/json" } }).then(r => r.ok ? r.json() : []),
        ]);

        const catsArr: CategoryOpt[] = (Array.isArray(catsRes) ? catsRes : (catsRes as any)?.items ?? [])
          .map((c: any): CategoryOpt => ({
            id: norm_id(c?.id ?? c?.category_id ?? ""),
            code: String(c?.code ?? c?.category_code ?? c?.group ?? "").trim(),
            name: String(c?.name ?? c?.category_name ?? c?.title ?? "").trim(),
          }))
          .filter((c: CategoryOpt) => c.id && c.name)
          .sort(by_name_cat);

        const unitsArr: UnitOpt[] = (Array.isArray(unitsRes) ? unitsRes : (unitsRes as any)?.items ?? [])
          .map((u: any): UnitOpt => ({
            id: norm_id(u?.id ?? u?.unit_id ?? ""),
            code: String(u?.code ?? u?.unit_code ?? u?.name ?? "").trim(),
            name: String(u?.name ?? u?.unit_name ?? u?.code ?? "").trim(),
          }))
          .filter((u: UnitOpt) => u.id && u.code);

        const cat_map = new Map<string, string>(catsArr.map((c: CategoryOpt) => [c.id, c.name]));
        const ven_map = new Map<string, string>(vendorOpts.map((v: VendorOpt) => [v.id, v.name]));

        const listRes = await fetch(`/api/items${params.toString() ? `?${params}` : ""}`, {
          signal: controller.signal, headers: { Accept: "application/json" },
        });
        if (!listRes.ok) throw new Error(`HTTP ${listRes.status}: ${await listRes.text()}`);
        const raw = await listRes.json();
        const arr: any[] = Array.isArray(raw) ? raw : raw?.items ?? [];
        const normalized: ProductRow[] = arr.map((r: any) => normalize_item(r));

        let hydrated: ProductRow[] = normalized
          .map((it: ProductRow) => ({
            ...it,
            category_name: it.category_name ?? (it.category_id ? cat_map.get(it.category_id) : undefined),
            vendor_name:   it.vendor_name   ?? (it.vendor_id   ? ven_map.get(it.vendor_id) : undefined),
            expiry_date:   yyyy_mm_dd(it.expiry_date),
          }))
          .map((it: ProductRow) => ({ ...it, days_left: days_left(it.expiry_date) }));

        set_rows(hydrated);
        set_cat_opt(catsArr);
        set_ven_opt(vendorOpts.sort(by_name_vendor));
        set_unit_opt(unitsArr);

        // 보강: 요약에 없는 vendor_name은 단건 조회로 채움(조용히 실패 허용)
        const need_ids = Array.from(
          new Set(
            hydrated
              .filter((r: ProductRow) => !r.vendor_name && r.vendor_id && !ven_map.get(r.vendor_id))
              .map((r: ProductRow) => r.vendor_id as string)
          )
        );
        for (const id of need_ids) {
          if (!id || vendor_fetching.current.has(id)) continue;
          vendor_fetching.current.add(id);
          fetch_vendor_name_by_id(id).then((name) => {
            if (!name) return;
            set_rows((prev: ProductRow[]) =>
              prev.map((r: ProductRow) => (r.vendor_id === id && !r.vendor_name) ? { ...r, vendor_name: name } : r)
            );
          }).finally(() => vendor_fetching.current.delete(id));
        }
      } catch (e: any) {
        if (e?.name !== "AbortError") set_error(e?.message || "목록 조회 중 오류가 발생했습니다.");
      } finally {
        set_loading(false);
      }
    })();
    return () => controller.abort();
  }, [cat_f, exp_f, reload]); // ✅ ven_f 제거(프론트 필터로 처리)

/* ===== 목록 가시성(프론트 필터) ===== */
  const visible = useMemo(() => {
  const n = Number(exp_f);
  const selectedVendorName = ven_f ? (ven_name_by_id.get(ven_f) ?? "") : "";

  return rows.filter((r: ProductRow) => {
    // 거래처 필터
    if (ven_f) {
      const rowVendorName =
        r.vendor_name ?? (r.vendor_id ? ven_name_by_id.get(r.vendor_id) : "");
      const idMatches = r.vendor_id === ven_f;
      const nameMatches = selectedVendorName && rowVendorName === selectedVendorName;
      if (!idMatches && !nameMatches) return false;
    }

    // 유통기한 필터(≤ n)
    if (Number.isFinite(n) && n > 0) {
      const d = r.days_left ?? days_left(r.expiry_date);
      if (d === null || d > n) return false;
    }
    return true;
  });
}, [rows, exp_f, ven_f, ven_name_by_id]);

  /* ===== 편집/미사용 ===== */
  const start_edit = (r: ProductRow) => {
    const code = r.unit_id ? unit_code_by_id.get(r.unit_id) ?? "" : "";
    set_editing_id(r.item_id);
    set_draft({
      item_id: r.item_id,
      name: r.name,
      category_id: r.category_id,
      unit_id: r.unit_id,
      unit_code: code,
      unit_price: r.unit_price,
      expiry_date: r.expiry_date || "",
      vendor_id: r.vendor_id ?? "",
    });
  };
  const cancel_edit = () => { set_editing_id(null); set_draft({}); };
  const on_change = (k: keyof typeof draft, v: string | number) => set_draft((prev) => ({ ...prev, [k]: v }));
  const on_change_unit_code = (code: string) => {
    const found = unit_opt.find((u: UnitOpt) => u.code === code);
    set_draft((prev) => ({ ...prev, unit_code: code, unit_id: found ? found.id : "" }));
  };

  const save_edit = async () => {
    if (!editing_id) return;
    const payload: Record<string, unknown> = {
      item_id: editing_id,
      name: String(draft.name ?? ""),
      category_id: draft.category_id ? Number(draft.category_id) : undefined,
      unit_id:     draft.unit_id     ? Number(draft.unit_id)     : undefined,
      unit_price:  typeof draft.unit_price === "number" ? draft.unit_price : Number(draft.unit_price ?? 0),
      expiry_date: draft.expiry_date || null,
      vendor_id:   draft.vendor_id   ? Number(draft.vendor_id)   : undefined,
    };
    set_is_saving(true);
    try {
      const res = await fetch(`/api/items/${encodeURIComponent(editing_id)}`, {
        method: "PUT",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`수정 실패 (HTTP ${res.status}) ${await res.text().catch(()=>"")}`);
      await res.json().catch(() => null);

      set_rows((prev: ProductRow[]) =>
        prev.map((p: ProductRow) => {
          if (p.item_id !== editing_id) return p;
          const next: ProductRow = {
            ...p,
            name: String(payload.name ?? p.name),
            category_id: payload.category_id !== undefined ? String(payload.category_id as number) : p.category_id,
            unit_id:     payload.unit_id     !== undefined ? String(payload.unit_id as number)     : p.unit_id,
            unit_price:  Number.isFinite(payload.unit_price as number) ? (payload.unit_price as number) : p.unit_price,
            expiry_date: (payload.expiry_date as string | null) ? yyyy_mm_dd(payload.expiry_date as string) : p.expiry_date,
            vendor_id:   payload.vendor_id   !== undefined ? String(payload.vendor_id as number)   : p.vendor_id,
          };
          next.category_name = next.category_id ? (cat_name_by_id.get(next.category_id) ?? p.category_name) : p.category_name;
          next.vendor_name   = next.vendor_id   ? (ven_name_by_id.get(next.vendor_id!)  ?? p.vendor_name)   : p.vendor_name;
          next.days_left     = days_left(next.expiry_date);
          return next;
        })
      );
      set_editing_id(null); set_draft({});
    } catch (e: any) {
      alert(e?.message || "수정 중 오류가 발생했습니다.");
    } finally {
      set_is_saving(false);
    }
  };

  const mark_notused = async (r: ProductRow) => {
    if (!r?.id) { alert("내부 ID가 없어 처리할 수 없습니다."); return; }
    if (!window.confirm(`품목 '${r.name}'을(를) 미사용 처리할까요?`)) return;
    set_acting_id(r.item_id);
    try {
      await change_item_use_state(Number(r.id), "NOTUSED");
      set_rows((prev: ProductRow[]) => prev.filter((x: ProductRow) => x.item_id !== r.item_id));
      if (editing_id === r.item_id) { set_editing_id(null); set_draft({}); }
    } catch (e: any) {
      alert(e?.message || "미사용 처리 중 오류가 발생했습니다.");
    } finally {
      set_acting_id(null);
    }
  };

  const warn_threshold = Number(exp_f) > 0 ? Number(exp_f) : 7;

  /* ===================== 렌더 ===================== */
  return (
    <div style={page}>
      {!hide_title && <h1 style={title}>품목 조회</h1>}

      <div style={bar}>
        <label style={{ display:"flex", alignItems:"center", gap:6 }}>
          <span style={{ color:ui.muted }}>카테고리</span>
          <select value={cat_f} onChange={(e) => set_cat_f(e.target.value)} style={sel}>
            <option value="">전체</option>
            {cat_opt.map((c: CategoryOpt) => (
              <option key={c.id} value={c.id}>{c.code ? `${c.code}` : c.id}</option>
            ))}
          </select>
        </label>

        <label style={{ display:"flex", alignItems:"center", gap:6 }}>
          <span style={{ color:ui.muted }}>거래처</span>
          <select value={ven_f} onChange={(e) => set_ven_f(e.target.value)} style={sel}>
            <option value="">전체</option>
            {ven_opt.map((v: VendorOpt) => (
              <option key={v.id} value={v.id}>{v.name}</option>
            ))}
          </select>
        </label>

        <label style={{ display:"flex", alignItems:"center", gap:6 }}>
          <span style={{ color:ui.muted }}>유통기한 ≤ (일)</span>
          <input type="number" min={1} placeholder="예: 7" value={exp_f} onChange={(e) => set_exp_f(e.target.value)} style={ipt} />
        </label>

        {(cat_f || ven_f || exp_f) && (
          <button onClick={() => { set_cat_f(""); set_ven_f(""); set_exp_f(""); }} style={ghost}>필터 초기화</button>
        )}

        <div style={{ marginLeft: "auto" }} />
        {/* 상단에만 '신규 품목 등록' 버튼 유지 */}
        <button onClick={() => set_open(true)} style={{ ...ghost, background: ui.p_bg, color: ui.p_tx, borderColor: ui.p_bd }}>
          신규 품목 등록
        </button>
      </div>

      {loading && <div style={{ color: ui.muted, marginBottom: 8 }}>불러오는 중…</div>}
      {error &&   <div style={{ color: ui.danger, marginBottom: 8 }}>{error}</div>}

      <div style={twrap}>
        <table style={table}>
          <thead>
            <tr>
              <th style={th}>품목ID</th>
              <th style={th}>카테고리명</th>
              <th style={th}>품목명</th>
              <th style={th}>단위</th>
              <th style={th}>단가(원)</th>
              <th style={th}>유통기한</th>
              <th style={th}>남은일수</th>
              <th style={th}>거래처명</th>
              <th style={th}>관리</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((r: ProductRow, idx: number) => {
              const is_edit = editing_id === r.item_id;
              const bg = idx % 2 === 1 ? { background: ui.zebra } : undefined;

              if (!is_edit) {
                return (
                  <tr key={r.id ?? r.item_id} style={bg}>
                    <td style={td}>{r.item_id}</td>
                    <td style={td}>{r.category_name ?? (r.category_id ? cat_name_by_id.get(r.category_id) : "")}</td>
                    <td style={td}>{r.name}</td>
                    <td style={td}>{(r.unit_id && unit_code_by_id.get(r.unit_id)) ?? r.unit_name ?? r.unit_id}</td>
                    <td style={td}>{money(r.unit_price)}</td>
                    <td style={td}>{r.expiry_date ?? ""}</td>
                    <td style={td}><DaysCell d={r.days_left ?? days_left(r.expiry_date)} warn={warn_threshold} /></td>
                    <td style={td}>{r.vendor_name ?? (r.vendor_id ? ven_name_by_id.get(r.vendor_id) : "")}</td>
                    <td style={td}>
                      <button onClick={() => start_edit(r)} disabled={Boolean(acting_id)} style={{ ...act, marginRight: 6 }}>수정</button>
                      <button onClick={() => void mark_notused(r)} disabled={acting_id === r.item_id} style={act}>
                        {acting_id === r.item_id ? "처리 중..." : "미사용"}
                      </button>
                    </td>
                  </tr>
                );
              }

              const draft_days = days_left(String(draft.expiry_date ?? ""));
              return (
                <tr key={r.id ?? r.item_id} style={bg}>
                  <td style={td}>{r.item_id}</td>
                  <td style={td}>
                    <select
                      value={String(draft.category_id ?? "")}
                      onChange={(e) => on_change("category_id", e.target.value)}
                      style={{ padding: 6, minWidth: 160, borderRadius: 8, border: `1px solid ${ui.border}` }}
                    >
                      <option value="">선택</option>
                      {cat_opt.sort(by_name_cat).map((c: CategoryOpt) => (
                        <option key={c.id} value={c.id}>
                          {c.code ? `${c.code} · ${c.name}` : c.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td style={td}>
                    <input
                      type="text"
                      value={String(draft.name ?? "")}
                      onChange={(e) => on_change("name", e.target.value)}
                      style={{ padding: 6, minWidth: 160, width: 220, borderRadius: 8, border: `1px solid ${ui.border}` }}
                    />
                  </td>
                  <td style={td}>
                    <select
                      value={String(draft.unit_code ?? "")}
                      onChange={(e) => on_change_unit_code(e.target.value)}
                      style={{ padding: 6, minWidth: 120, borderRadius: 8, border: `1px solid ${ui.border}` }}
                    >
                      <option value="">선택</option>
                      {unit_opt.map((u: UnitOpt) => (
                        <option key={u.id} value={u.code}>{u.code} ({u.name})</option>
                      ))}
                    </select>
                  </td>
                  <td style={td}>
                    <input
                      type="number"
                      value={String(draft.unit_price ?? 0)}
                      onChange={(e) => on_change("unit_price", e.target.value)}
                      style={{ padding: 6, width: 120, textAlign: "right", borderRadius: 8, border: `1px solid ${ui.border}` }}
                      min={0}
                    />
                  </td>
                  <td style={td}>
                    <input
                      type="date"
                      value={String(draft.expiry_date ?? "")}
                      onChange={(e) => on_change("expiry_date", e.target.value)}
                      style={{ padding: 6, borderRadius: 8, border: `1px solid ${ui.border}` }}
                    />
                  </td>
                  <td style={td}><DaysCell d={draft_days} warn={warn_threshold} /></td>
                  <td style={td}>
                    <select
                      value={String(draft.vendor_id ?? "")}
                      onChange={(e) => on_change("vendor_id", e.target.value)}
                      style={{ padding: 6, minWidth: 140, borderRadius: 8, border: `1px solid ${ui.border}` }}
                    >
                      <option value="">선택</option>
                      {ven_opt.sort(by_name_vendor).map((v: VendorOpt) => (
                        <option key={v.id} value={v.id}>{v.name}</option>
                      ))}
                    </select>
                  </td>
                  <td style={td}>
                    <button onClick={save_edit} disabled={is_saving} style={{ ...act, marginRight: 6 }}>
                      {is_saving ? "저장 중..." : "저장"}
                    </button>
                    <button onClick={cancel_edit} disabled={is_saving} style={act}>취소</button>
                  </td>
                </tr>
              );
            })}

            {visible.length === 0 && !loading && !error && (
              <tr><td colSpan={9} style={{ textAlign: "center", padding: 18, color: ui.muted }}>등록된 품목이 없습니다.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 하단 FAB 제거됨 */}

      {open && (
        <div style={overlay} onClick={() => set_open(false)}>
          <div style={modal} onClick={(e) => e.stopPropagation()}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
              <h2 style={{ margin:0, fontSize:18, fontWeight:800 }}>품목 등록</h2>
              <button type="button" onClick={() => set_open(false)} style={ghost} aria-label="close">×</button>
            </div>
            <ItemRegisterForm
              on_success={() => { set_open(false); set_reload((k) => k + 1); }}
              on_cancel={() => set_open(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ItemListPage;

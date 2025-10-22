// src/pages/ItemNotUsedListPage.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { change_item_use_state } from "@/api/items";
import {
  fetch_vendor_options,
  fetch_vendor_name_by_id,
  type VendorOpt as VOpt,
} from "@/api/vendor_summary";

/* ===== 타입 ===== */
type Row = {
  id: number;                 // 내부 PK (표시 X)
  item_id: string;            // 품목 ID(=코드)
  name: string;
  category_id: string;
  unit_id: string;
  unit_price: number;
  expiry_date?: string | null;
  isused?: string | boolean | null;

  vendor_id?: string;         // 거래처 ID(숫자/코드 혼재 가능)
  vendor_name?: string;       // 표시용
};
type CategoryOpt = { id: string; code?: string; name: string };
type UnitOpt     = { id: string; code: string; name: string };
type VendorOpt   = VOpt;

/* ===== UI ===== */
const ui = { border:"#e5e7eb", zebra:"#fafafa", muted:"#6b7280" } as const;
const page  = { padding:16, maxWidth:1200, margin:"0 auto" } as const;
const title = { fontSize:22, fontWeight:800, marginBottom:12 } as const;
const twrap = { overflowX:"auto", border:`1px solid ${ui.border}`, borderRadius:10 } as const;
const table = { width:"100%", borderCollapse:"separate" as const, borderSpacing:0 } as const;
const th    = { position:"sticky" as const, top:0, background:"#f8fafc", borderBottom:`1px solid ${ui.border}`, padding:"10px 8px", textAlign:"left" as const, whiteSpace:"nowrap" as const, fontSize:13, fontWeight:700 } as const;
const td    = { borderBottom:`1px solid ${ui.border}`, padding:"9px 8px", textAlign:"left" as const, whiteSpace:"nowrap" as const, fontSize:14 } as const;
const act   = { padding:"6px 10px", borderRadius:8, border:`1px solid ${ui.border}`, background:"#fff", cursor:"pointer" } as const;

/* ===== 유틸 ===== */
const norm = (v: unknown): string => {
  const s = String(v ?? "").trim();
  const n = Number(s);
  return Number.isFinite(n) ? String(n) : s;
};
const yyyy_mm_dd = (iso?: string | null): string => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};
const money = (n: number) => new Intl.NumberFormat("ko-KR").format(n);

async function safeJson(url: string) {
  try {
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) return null;
    return await res.json().catch(() => null);
  } catch { return null; }
}
const toArray = (j: any): any[] => Array.isArray(j) ? j : (j?.items ?? j?.data ?? []);

/* ===== 페이지 ===== */
const ItemNotUsedListPage: React.FC = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [catOpt, setCatOpt]   = useState<CategoryOpt[]>([]);
  const [unitOpt, setUnitOpt] = useState<UnitOpt[]>([]);
  const [venOpt,  setVenOpt]  = useState<VendorOpt[]>([]);

  // 개별 벤더 조회 중복 방지
  const vendorFetching = useRef<Set<string>>(new Set());

  const catNameById = useMemo(() => {
    const m = new Map<string, string>();
    catOpt.forEach((c: CategoryOpt) => m.set(c.id, c.name));
    return m;
  }, [catOpt]);
  const unitCodeById = useMemo(() => {
    const m = new Map<string, string>();
    unitOpt.forEach((u: UnitOpt) => m.set(u.id, u.code));
    return m;
  }, [unitOpt]);
  const venNameById = useMemo(() => {
    const m = new Map<string, string>();
    venOpt.forEach((v: VendorOpt) => m.set(v.id, v.name));
    return m;
  }, [venOpt]);

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      setLoading(true); setError("");
      try {
        // 1) 미사용 목록(확인된 경로 우선)
        const srcJ =
          (await safeJson("/items/state?isused=NOTUSED")) ??
          (await safeJson("/api/items/state?isused=NOTUSED"));
        if (srcJ === null) throw new Error("미사용 목록 호출 실패");

        const src = toArray(srcJ);
        const normalized: Row[] = src.map((r: any): Row => ({
          id: Number(r.id ?? r.item_pk ?? 0),
          item_id: String(r.item_id ?? r.code ?? r.sku ?? r.erp_code ?? r.itemCode ?? ""),
          name: String(r.name ?? r.item_name ?? ""),
          category_id: norm(r.category_id ?? r.category?.id ?? r.category?.category_id ?? r.categoryId),
          unit_id: norm(r.unit_id ?? r.unit?.id ?? r.unit?.unit_id ?? r.unitId),
          unit_price: Number(r.unit_price ?? r.price ?? 0) || 0,
          expiry_date: r.expiry_date ?? r.expiration_date ?? r.expireDate ?? null,
          isused: r.isused ?? null,
          vendor_id: r.vendor_id !== undefined
            ? norm(r.vendor_id ?? r.vendor?.id ?? r.vendor?.vendor_id)
            : (r.vendor?.id ? norm(r.vendor.id) : undefined),
          vendor_name: r.vendor_name ?? r.vendor?.vendor_name ?? r.vendor?.name ?? undefined,
        }));

        // 2) 옵션(카테고리/단위/거래처)
        const [catsJ, unitsJ, vendors] = await Promise.all([
          safeJson("/api/category") ?? safeJson("/category"),
          safeJson("/api/units")    ?? safeJson("/units"),
          fetch_vendor_options(), // 요약 기반
        ]);

        const cats: CategoryOpt[] = toArray(catsJ)
          .map((c: any): CategoryOpt => ({
            id: norm(c?.id ?? c?.category_id ?? ""),
            code: String(c?.code ?? c?.category_code ?? c?.group ?? "").trim(),
            name: String(c?.name ?? c?.category_name ?? c?.title ?? "").trim(),
          }))
          .filter((c: CategoryOpt) => c.id && c.name);

        const units: UnitOpt[] = toArray(unitsJ)
          .map((u: any): UnitOpt => ({
            id: norm(u?.id ?? u?.unit_id ?? ""),
            code: String(u?.code ?? u?.unit_code ?? u?.name ?? "").trim(),
            name: String(u?.name ?? u?.unit_name ?? u?.code ?? "").trim(),
          }))
          .filter((u: UnitOpt) => u.id && u.code);

        // 3) 1차 하이드레이트(요약 매핑)
        const venMap = new Map<string, string>(vendors.map((v: VendorOpt) => [v.id, v.name]));
        let hydrated: Row[] = normalized.map((it: Row) => ({
          ...it,
          vendor_name: it.vendor_name ?? (it.vendor_id ? venMap.get(it.vendor_id) : undefined),
        }));

        setRows(hydrated);
        setCatOpt(cats);
        setUnitOpt(units);
        setVenOpt(vendors);

        // 4) 보강: 요약에 없는 거래처는 개별 조회(조용히 실패 허용)
        const needIds = Array.from(new Set(
          hydrated
            .filter((r: Row) => !r.vendor_name && r.vendor_id && !venMap.get(r.vendor_id))
            .map((r: Row) => r.vendor_id as string)
        ));
        for (const id of needIds) {
          if (!id || vendorFetching.current.has(id)) continue;
          vendorFetching.current.add(id);
          fetch_vendor_name_by_id(id).then((name) => {
            if (!name) return;
            setRows((prev: Row[]) =>
              prev.map((r: Row) => (r.vendor_id === id && !r.vendor_name) ? { ...r, vendor_name: name } : r)
            );
          }).finally(() => vendorFetching.current.delete(id));
        }
      } catch (e: any) {
        setError(e?.message || "목록 조회 실패");
      } finally {
        setLoading(false);
      }
    })();
    return () => controller.abort();
  }, []);

  const onUse = async (r: Row) => {
    if (!r?.id) return alert("내부 ID가 없습니다.");
    if (!window.confirm(`'${r.item_id} - ${r.name}'을(를) 사용 전환할까요?`)) return;
    try {
      await change_item_use_state(Number(r.id), "USED");
      setRows((prev: Row[]) => prev.filter((x: Row) => x.id !== r.id));
    } catch (e: any) {
      alert(e?.message || "사용 전환 실패");
    }
  };

  return (
    <div style={page}>
      <h1 style={title}>미사용 품목 리스트</h1>

      {loading && <div style={{ color: ui.muted, marginBottom: 8 }}>불러오는 중…</div>}
      {error   && <div style={{ color: "#c62828", marginBottom: 8 }}>{error}</div>}

      <div style={twrap}>
        <table style={table}>
          <thead>
            <tr>
              {/* 내부 PK 열 없음 */}
              <th style={th}>품목 ID</th>
              <th style={th}>품목명</th>
              <th style={th}>카테고리명</th>
              <th style={th}>단위</th>
              <th style={th}>단가(원)</th>    {/* 왼쪽 정렬 */}
              <th style={th}>유통기한</th>
              <th style={th}>거래처명</th>    {/* ✅ 추가 */}
              <th style={{ ...th, textAlign: "right" as const }}>관리</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r: Row, idx: number) => {
              const bg = idx % 2 === 1 ? { background: ui.zebra } : undefined;
              return (
                <tr key={r.id} style={bg}>
                  <td style={td}>{r.item_id}</td>
                  <td style={td}>{r.name}</td>
                  <td style={td}>{catNameById.get(r.category_id) ?? ""}</td>
                  <td style={td}>{unitCodeById.get(r.unit_id) ?? ""}</td>
                  <td style={td}>{money(r.unit_price)}</td> {/* 왼쪽 정렬 */}
                  <td style={td}>{yyyy_mm_dd(r.expiry_date)}</td>
                  <td style={td}>{r.vendor_name ?? (r.vendor_id ? venNameById.get(r.vendor_id) : "")}</td>
                  <td style={{ ...td, textAlign: "right" }}>
                    <button type="button" style={act} onClick={() => onUse(r)}>사용 전환</button>
                  </td>
                </tr>
              );
            })}

            {rows.length === 0 && !loading && !error && (
              <tr>
                <td colSpan={8} style={{ textAlign: "center", padding: 18, color: ui.muted }}>
                  등록된 품목이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ItemNotUsedListPage;
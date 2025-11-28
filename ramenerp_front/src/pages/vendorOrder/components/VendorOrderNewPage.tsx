// src/pages/VendorOrderNewPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  fetch_vendors,
  fetch_warehouses,
  fetch_items,
  type VendorOption,
  type WarehouseOption,
  type ItemOption,
} from "@/api/master_data";

import {
  create_vendor_orders,
  type CreateVendorOrderLine,
} from "@/api/vendor_orders";

/* ================= UI 스타일 공통 ================= */
const ui = {
  border: "#e5e7eb",
  zebra: "#fafafa",
  muted: "#6b7280",
  danger: "#dc2626",
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
};

const card: React.CSSProperties = {
  border: `1px solid ${ui.border}`,
  borderRadius: ui.radius,
  background: "#fff",
  padding: 16,
};

const rowGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 16,
};

const labelStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: ui.muted,
  marginBottom: 6,
  display: "block",
};

const selectStyle: React.CSSProperties = {
  width: "100%",
  border: `1px solid ${ui.border}`,
  borderRadius: 8,
  padding: "10px 12px",
  fontSize: 14,
  background: "#fff",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  border: `1px solid ${ui.border}`,
  borderRadius: 8,
  padding: "10px 12px",
  fontSize: 14,
  background: "#fff",
};

const tableWrap: React.CSSProperties = {
  overflowX: "auto",
  border: `1px solid ${ui.border}`,
  borderRadius: ui.radius,
  maxHeight: "360px",
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
  padding: "9px 8px",
  whiteSpace: "nowrap",
  verticalAlign: "middle",
  fontSize: 14,
};

const ghostBtn: React.CSSProperties = {
  border: `1px solid ${ui.border}`,
  borderRadius: 8,
  background: "#fff",
  padding: "8px 12px",
  fontSize: 14,
  cursor: "pointer",
};

const dangerBtn: React.CSSProperties = {
  border: `1px solid ${ui.border}`,
  borderRadius: 8,
  background: "#fff",
  color: ui.danger,
  padding: "6px 10px",
  cursor: "pointer",
  fontSize: 13,
};

const primaryBtn: React.CSSProperties = {
  border: `1px solid ${ui.primaryBd}`,
  borderRadius: 8,
  background: ui.primaryBg,
  color: ui.primaryTx,
  padding: "8px 12px",
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
};

/* ================= 유틸 ================= */

const money = (n: number) =>
  new Intl.NumberFormat("ko-KR").format(Number.isFinite(n) ? n : 0);

type DraftLine = {
  item_id: string; // 품목 PK (문자열로 관리 후 Number 변환)
  qty: string;     // 수량 (문자열로 관리 후 Number 변환)
};

const emptyLine = (): DraftLine => ({
  item_id: "",
  qty: "",
});

/**
 * 기본 유효성 검사:
 * - vendorId/whId 필수
 * - 최소 한 줄 있어야 함
 * - 각 줄 item, qty>0
 */
function validateBeforeSubmit(
  vendorId: string,
  whId: string,
  lines: DraftLine[],
): string | null {
  if (!vendorId) return "거래처를 선택하세요.";
  if (!whId) return "창고를 선택하세요.";

  if (!lines.length) return "발주 품목을 추가하세요.";

  for (let i = 0; i < lines.length; i++) {
    const L = lines[i];
    if (!L.item_id) {
      return `${i + 1}행: 품목을 선택하세요.`;
    }
    const q = Number(L.qty);
    if (!Number.isFinite(q) || q <= 0) {
      return `${i + 1}행: 수량을 올바르게 입력하세요.`;
    }
  }

  return null;
}

/* ================= 메인 컴포넌트 ================= */
const VendorOrderNewPage: React.FC = () => {
  const navigate = useNavigate();

  // 마스터 데이터
  const [vendors, setVendors] = useState<VendorOption[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseOption[]>([]);
  const [items, setItems] = useState<ItemOption[]>([]);

  // 선택 상태
  const [vendorId, setVendorId] = useState<string>(""); // 실제로는 number지만 문자열로 관리
  const [whId, setWhId] = useState<string>("");

  // 발주 라인
  const [lines, setLines] = useState<DraftLine[]>([emptyLine()]);

  // 상태
  const [submitting, setSubmitting] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [submitError, setSubmitError] = useState("");

  // 아이템 정보를 빠르게 lookup 하기 위한 맵
  // items: [{id, name, unit_price?, vendor_id?}, ...]
  const itemById = useMemo(() => {
    const m = new Map<number, ItemOption>();
    items.forEach((it) => {
      m.set(it.id, it);
    });
    return m;
  }, [items]);

  // 거래처별 품목 필터링:
  // vendorId 가 선택된 경우 => items 중 vendor_id === vendorId 인 것만
  // vendorId 아직 없으면 전체
  const filteredItems = useMemo(() => {
    const vidNum = Number(vendorId);
    if (!Number.isFinite(vidNum) || vidNum <= 0) {
      return items;
    }
    return items.filter((it) => {
      // it.vendor_id 가 없을 수도 있으니까 일단 일치하는 경우만 우선
      if (it.vendor_id === undefined || it.vendor_id === null) return false;
      return it.vendor_id === vidNum;
    });
  }, [items, vendorId]);

  // 라인 단가 계산 + 금액(=단가*수량)
  const enrichedLines = useMemo(() => {
    return lines.map((ln) => {
      const itemIdNum = Number(ln.item_id);
      const qNum = Number(ln.qty);
      const itemInfo = Number.isFinite(itemIdNum) ? itemById.get(itemIdNum) : undefined;

      const unitPrice = itemInfo?.unit_price ?? 0;
      const lineTotal =
        Number.isFinite(unitPrice) && Number.isFinite(qNum) && qNum > 0
          ? unitPrice * qNum
          : 0;

      return {
        ...ln,
        unitPrice,
        lineTotal,
      };
    });
  }, [lines, itemById]);

  // 총합 금액
  const totalAmount = useMemo(() => {
    return enrichedLines.reduce((acc, ln) => acc + (ln.lineTotal ?? 0), 0);
  }, [enrichedLines]);

  // 마스터 데이터 로딩
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoadError("");

        const [vs, ws, its] = await Promise.all([
          fetch_vendors(),
          fetch_warehouses(),
          fetch_items(),
        ]);

        if (cancelled) return;

        setVendors(vs);
        setWarehouses(ws);
        setItems(its);
      } catch (err: any) {
        if (!cancelled) {
          setLoadError(err?.message || "데이터 로딩 중 오류가 발생했습니다.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // 라인 조작
  const updateLineItem = (idx: number, newItemId: string) => {
    setLines((prev) =>
      prev.map((ln, i) => (i === idx ? { ...ln, item_id: newItemId } : ln)),
    );
  };

  const updateLineQty = (idx: number, newQty: string) => {
    // 문자열 그대로 보관 -> 제출 시 Number 변환
    setLines((prev) =>
      prev.map((ln, i) => (i === idx ? { ...ln, qty: newQty } : ln)),
    );
  };

  const addLine = () => {
    setLines((prev) => [...prev, emptyLine()]);
  };

  const removeLine = (idx: number) => {
    setLines((prev) => prev.filter((_, i) => i !== idx));
  };

  // 제출
  const onSubmit = async () => {
    // 1) 기본 유효성
    const errMsg = validateBeforeSubmit(vendorId, whId, lines);
    if (errMsg) {
      setSubmitError(errMsg);
      return;
    }

    // 2) 확인 모달
    const ok = window.confirm("발주를 등록하시겠습니까?");
    if (!ok) {
      return; // 사용자가 '아니오' 선택
    }

    // 3) payload 변환
    const payload: CreateVendorOrderLine[] = lines.map((ln) => ({
      vendor_id: Number(vendorId),
      wh_id: Number(whId),
      item_id: Number(ln.item_id),
      quantity: Number(ln.qty),
      status: "PENDING", // 서버 기본값이 PENDING이라면 생략 가능
    }));

    setSubmitting(true);
    setSubmitError("");
    try {
      await create_vendor_orders(payload);

      alert("발주가 등록되었습니다.");
      navigate("/vendor-order");
    } catch (err: any) {
      setSubmitError(err?.message || "등록 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const cancelAndBack = () => {
    // 뭔가 작성된 게 있으면 확인 받고 나감
    const dirty =
      vendorId ||
      whId ||
      lines.length > 1 ||
      (lines.length === 1 && (lines[0].item_id || lines[0].qty));

    if (dirty) {
      const go = window.confirm(
        "작성 중인 내용이 사라집니다. 나가시겠습니까?",
      );
      if (!go) return;
    }
    navigate("/vendor-order");
  };

  return (
    <div style={pageWrap}>
      {/* 상단 헤더 */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>
            발주서 작성
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: ui.muted }}>
            거래처와 창고를 선택하고, 발주할 품목과 수량을 입력하세요.
          </p>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            onClick={cancelAndBack}
            style={ghostBtn}
            disabled={submitting}
          >
            취소
          </button>
          <button
            type="button"
            onClick={onSubmit}
            style={primaryBtn}
            disabled={submitting}
          >
            {submitting ? "등록 중..." : "등록"}
          </button>
        </div>
      </div>

      {/* 거래처 / 창고 선택 카드 */}
      <div style={card}>
        <div style={rowGrid}>
          <div>
            <label style={labelStyle}>거래처</label>
            <select
              style={selectStyle}
              value={vendorId}
              onChange={(e) => setVendorId(e.target.value)}
              disabled={submitting}
            >
              <option value="">선택하세요</option>
              {vendors.map((v) => (
                <option key={v.id} value={String(v.id)}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>창고</label>
            <select
              style={selectStyle}
              value={whId}
              onChange={(e) => setWhId(e.target.value)}
              disabled={submitting}
            >
              <option value="">선택하세요</option>
              {warehouses.map((w) => (
                <option key={w.id} value={String(w.id)}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loadError && (
          <div style={{ marginTop: 12, fontSize: 13, color: ui.danger }}>
            {loadError}
          </div>
        )}
      </div>

      {/* 발주 품목 테이블 */}
      <div style={card}>
        <div
          style={{
            marginBottom: 8,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            rowGap: 8,
          }}
        >
          <div style={{ fontSize: 15, fontWeight: 700 }}>발주 품목 / 수량</div>

          <button
            type="button"
            onClick={addLine}
            style={ghostBtn}
            disabled={submitting}
          >
            + 품목 추가
          </button>
        </div>

        <div style={tableWrap}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>품목</th>
                <th style={thStyle}>수량</th>
                <th style={thStyle}>단가</th>
                <th style={thStyle}>금액</th>
                <th style={thStyle}></th>
              </tr>
            </thead>
            <tbody>
              {enrichedLines.map((ln, idx) => {
                const zebraBg =
                  idx % 2 === 1 ? { background: ui.zebra } : undefined;
                const itemIdNum = Number(ln.item_id);
                const itemInfo = Number.isFinite(itemIdNum)
                  ? itemById.get(itemIdNum)
                  : undefined;

                return (
                  <tr key={idx} style={zebraBg}>
                    {/* 품목 선택: 거래처에 맞게 필터된 목록만 표시 */}
                    <td style={tdStyle}>
                      <select
                        style={selectStyle}
                        value={ln.item_id}
                        onChange={(e) => updateLineItem(idx, e.target.value)}
                        disabled={submitting}
                      >
                        <option value="">품목 선택</option>
                        {filteredItems.map((it) => (
                          <option key={it.id} value={String(it.id)}>
                            {it.name}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* 수량 입력 (직접 입력 가능) */}
                    <td style={tdStyle}>
                      <input
                        type="number"
                        min={1}
                        step={1}
                        style={inputStyle}
                        value={ln.qty}
                        onChange={(e) => updateLineQty(idx, e.target.value)}
                        disabled={submitting}
                      />
                    </td>

                    {/* 단가 */}
                    <td style={{ ...tdStyle, textAlign: "right" }}>
                      {money(itemInfo?.unit_price ?? 0)}
                    </td>

                    {/* 금액 (단가 * 수량) */}
                    <td style={{ ...tdStyle, textAlign: "right" }}>
                      {money(ln.lineTotal ?? 0)}
                    </td>

                    {/* 삭제 버튼 */}
                    <td style={tdStyle}>
                      {lines.length > 1 ? (
                        <button
                          type="button"
                          style={dangerBtn}
                          disabled={submitting}
                          onClick={() => removeLine(idx)}
                        >
                          삭제
                        </button>
                      ) : (
                        <span style={{ fontSize: 13, color: ui.muted }}>-</span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {lines.length === 0 && (
                <tr>
                  <td
                    style={{
                      ...tdStyle,
                      textAlign: "center",
                      color: ui.muted,
                      fontStyle: "italic",
                    }}
                    colSpan={5}
                  >
                    품목을 추가하세요.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 에러 메시지 */}
        {submitError && (
          <div style={{ marginTop: 12, fontSize: 13, color: ui.danger }}>
            {submitError}
          </div>
        )}

        {/* 선택 라인 요약 & 총합계 */}
        <div style={{ marginTop: 16, fontSize: 14, color: "#111" }}>
          {enrichedLines.map((ln, i) => {
            if (!ln.item_id || !ln.qty) return null;
            const itemIdNum = Number(ln.item_id);
            const nm = Number.isFinite(itemIdNum)
              ? itemById.get(itemIdNum)?.name
              : undefined;
            const q = Number(ln.qty);
            if (!nm || !Number.isFinite(q) || q <= 0) return null;
            return (
              <div key={i} style={{ fontSize: 13, color: ui.muted }}>
                • {nm} × {q} → {money(ln.lineTotal ?? 0)}원
              </div>
            );
          })}

          <div
            style={{
              marginTop: 8,
              fontWeight: 700,
              fontSize: 14,
              textAlign: "right",
            }}
          >
            총 금액: {money(totalAmount)}원
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorOrderNewPage;

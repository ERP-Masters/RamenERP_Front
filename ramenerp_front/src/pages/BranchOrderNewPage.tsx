// src/pages/BranchOrderNewPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  fetch_branches,
  fetch_items,
  type BranchOption,
  type ItemOption,
} from "@/api/master_data";

import {
  create_branch_order,
  type CreateBranchOrderInput,
} from "@/api/branch_orders";

/* ================= UI 스타일 (발주 등록과 동일 톤) ================= */
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

const page_wrap: React.CSSProperties = {
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

const row_grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 16,
};

const label_style: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: ui.muted,
  marginBottom: 6,
  display: "block",
};

const select_style: React.CSSProperties = {
  width: "100%",
  border: `1px solid ${ui.border}`,
  borderRadius: 8,
  padding: "10px 12px",
  fontSize: 14,
  background: "#fff",
};

const input_style: React.CSSProperties = {
  width: "100%",
  border: `1px solid ${ui.border}`,
  borderRadius: 8,
  padding: "10px 12px",
  fontSize: 14,
  background: "#fff",
};

const textarea_style: React.CSSProperties = {
  ...input_style,
  minHeight: 72,
  resize: "vertical",
};

const ghost_btn: React.CSSProperties = {
  border: `1px solid ${ui.border}`,
  borderRadius: 8,
  background: "#fff",
  padding: "8px 12px",
  fontSize: 14,
  cursor: "pointer",
};

const primary_btn: React.CSSProperties = {
  border: `1px solid ${ui.primaryBd}`,
  borderRadius: 8,
  background: ui.primaryBg,
  color: ui.primaryTx,
  padding: "8px 12px",
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
};

const money = (n: number) =>
  new Intl.NumberFormat("ko-KR").format(Number.isFinite(n) ? n : 0);

/* ================= 컴포넌트 ================= */

const BranchOrderNewPage: React.FC = () => {
  const navigate = useNavigate();

  // 마스터 데이터
  const [branches, set_branches] = useState<BranchOption[]>([]);
  const [items, set_items] = useState<ItemOption[]>([]);

  // 선택 값
  const [branch_id, set_branch_id] = useState<string>("");
  const [item_id, set_item_id] = useState<string>("");
  const [quantity, set_quantity] = useState<string>("");

  const [request_note, set_request_note] = useState<string>("");
  const [desired_due_date, set_desired_due_date] = useState<string>("");

  // 상태
  const [is_submitting, set_is_submitting] = useState<boolean>(false);
  const [load_error, set_load_error] = useState<string>("");
  const [submit_error, set_submit_error] = useState<string>("");

  // item lookup 맵
  const item_by_id = useMemo(() => {
    const m = new Map<number, ItemOption>();
    items.forEach((it) => m.set(it.id, it));
    return m;
  }, [items]);

  const selected_item = useMemo(() => {
    const id_num = Number(item_id);
    if (!Number.isFinite(id_num)) return undefined;
    return item_by_id.get(id_num);
  }, [item_id, item_by_id]);

  const unit_price_num = selected_item?.unit_price ?? 0;
  const quantity_num = Number(quantity);
  const amount_num =
    Number.isFinite(quantity_num) && quantity_num > 0 ? unit_price_num * quantity_num : 0;

  // 마스터 데이터 로딩
  useEffect(() => {
    let is_cancelled = false;
    (async () => {
      try {
        set_load_error("");
        const [br, it] = await Promise.all([fetch_branches(), fetch_items()]);
        if (is_cancelled) return;
        set_branches(br);
        set_items(it);
      } catch (err: any) {
        if (!is_cancelled) {
          set_load_error(err?.message || "데이터 로딩 중 오류가 발생했습니다.");
        }
      }
    })();
    return () => {
      is_cancelled = true;
    };
  }, []);

  // 제출 전에 기본 검증
  function validate(): string | null {
    if (!branch_id) return "지점을 선택하세요.";
    if (!item_id) return "품목을 선택하세요.";

    if (!Number.isFinite(quantity_num) || quantity_num <= 0) {
      return "수량을 올바르게 입력하세요.";
    }
    if (!selected_item) {
      return "선택한 품목 정보를 찾을 수 없습니다.";
    }
    if (!desired_due_date) {
      return "희망 입고일을 선택하세요.";
    }
    return null;
  }

  async function handle_submit() {
    if (is_submitting) return;

    const msg = validate();
    if (msg) {
      set_submit_error(msg);
      return;
    }

    const ok = window.confirm("수주 요청을 등록하시겠습니까?");
    if (!ok) return;

    const payload: CreateBranchOrderInput = {
      branch_id: Number(branch_id),
      item_id: Number(item_id),
      quantity: quantity_num,
      unit_price: unit_price_num,
      amount: amount_num,
      request_note,
      status: "PENDING", // 기본값
      desired_due_date, // "YYYY-MM-DD" 문자열
    };

    try {
      set_is_submitting(true);
      set_submit_error("");
      await create_branch_order(payload);
      alert("수주 요청이 등록되었습니다.");
      navigate("/branch-order");
    } catch (err: any) {
      set_submit_error(err?.message || "등록 중 오류가 발생했습니다.");
    } finally {
      set_is_submitting(false);
    }
  }

  function handle_cancel() {
    const is_dirty =
      branch_id ||
      item_id ||
      quantity ||
      request_note ||
      desired_due_date;

    if (is_dirty) {
      const go = window.confirm("작성 중인 내용이 사라집니다. 나가시겠습니까?");
      if (!go) return;
    }
    navigate("/branch-order");
  }

  return (
    <div style={page_wrap}>
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
            수주 요청 작성
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: ui.muted }}>
            지점을 선택하고, 요청할 품목과 수량을 입력하면 단가와 금액이 자동 계산됩니다.
          </p>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            onClick={handle_cancel}
            style={ghost_btn}
            disabled={is_submitting}
          >
            취소
          </button>
          <button
            type="button"
            onClick={handle_submit}
            style={primary_btn}
            disabled={is_submitting}
          >
            {is_submitting ? "등록 중..." : "등록"}
          </button>
        </div>
      </div>

      {/* 지점 / 품목 선택 카드 */}
      <div style={card}>
        <div style={row_grid}>
          {/* 지점 선택 */}
          <div>
            <label style={label_style}>지점</label>
            <select
              style={select_style}
              value={branch_id}
              onChange={(e) => set_branch_id(e.target.value)}
              disabled={is_submitting}
            >
              <option value="">선택하세요</option>
              {branches.map((b) => (
                <option key={b.id} value={String(b.id)}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* 품목 선택 */}
          <div>
            <label style={label_style}>품목</label>
            <select
              style={select_style}
              value={item_id}
              onChange={(e) => set_item_id(e.target.value)}
              disabled={is_submitting}
            >
              <option value="">선택하세요</option>
              {items.map((it) => (
                <option key={it.id} value={String(it.id)}>
                  {it.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {load_error && (
          <div style={{ marginTop: 12, fontSize: 13, color: ui.danger }}>
            {load_error}
          </div>
        )}
      </div>

      {/* 수량/금액/비고 카드 */}
      <div style={card}>
        <div style={row_grid}>
          {/* 수량 */}
          <div>
            <label style={label_style}>수량</label>
            <input
              type="number"
              min={1}
              step={1}
              style={input_style}
              value={quantity}
              onChange={(e) => set_quantity(e.target.value)}
              disabled={is_submitting}
            />
          </div>

          {/* 단가 (자동) */}
          <div>
            <label style={label_style}>단가 (자동)</label>
            <input
              style={{ ...input_style, background: "#f9fafb" }}
              value={
                selected_item
                  ? `${money(unit_price_num)}원`
                  : "품목 선택 시 자동 표시"
              }
              readOnly
            />
          </div>

          {/* 금액 (자동) */}
          <div>
            <label style={label_style}>금액 (자동)</label>
            <input
              style={{ ...input_style, background: "#f9fafb" }}
              value={amount_num > 0 ? `${money(amount_num)}원` : ""}
              readOnly
            />
          </div>

          {/* 희망 입고일 */}
          <div>
            <label style={label_style}>희망 입고일</label>
            <input
              type="date"
              style={input_style}
              value={desired_due_date}
              onChange={(e) => set_desired_due_date(e.target.value)}
              disabled={is_submitting}
            />
          </div>
        </div>

        {/* 요청 사유 */}
        <div style={{ marginTop: 16 }}>
          <label style={label_style}>요청 사유</label>
          <textarea
            style={textarea_style}
            value={request_note}
            onChange={(e) => set_request_note(e.target.value)}
            placeholder="예: 주문량 증가로 인한 긴급 요청"
            disabled={is_submitting}
          />
        </div>

        {/* 에러 / 요약 */}
        {submit_error && (
          <div style={{ marginTop: 12, fontSize: 13, color: ui.danger }}>
            {submit_error}
          </div>
        )}

        {selected_item && quantity_num > 0 && (
          <div
            style={{
              marginTop: 12,
              fontSize: 13,
              color: ui.muted,
              textAlign: "right",
            }}
          >
            • {selected_item.name} × {quantity_num} →{" "}
            {money(amount_num)}원
          </div>
        )}
      </div>
    </div>
  );
};

export default BranchOrderNewPage;

// src/pages/BranchOrderNewPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  fetch_branches,
  fetch_items,
  fetch_warehouses,
  type BranchOption,
  type ItemOption,
  type WarehouseOption,
} from "@/api/master_data";

import {
  create_branch_order,
  type CreateBranchOrderPayload,
} from "@/api/branch_orders";

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
  gridTemplateColumns: "1fr 1fr 1fr", // 지점 / 창고 / 희망입고일
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
  width: "100%",
  minHeight: 72,
  border: `1px solid ${ui.border}`,
  borderRadius: 8,
  padding: "10px 12px",
  fontSize: 14,
  resize: "vertical",
};

const table_wrap: React.CSSProperties = {
  overflowX: "auto",
  border: `1px solid ${ui.border}`,
  borderRadius: ui.radius,
  maxHeight: "360px",
  overflowY: "auto",
};

const table_style: React.CSSProperties = {
  width: "100%",
  borderCollapse: "separate",
  borderSpacing: 0,
  fontSize: 14,
};

const th_style: React.CSSProperties = {
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

const td_style: React.CSSProperties = {
  borderBottom: `1px solid ${ui.border}`,
  padding: "9px 8px",
  whiteSpace: "nowrap",
  verticalAlign: "middle",
  fontSize: 14,
};

const ghost_btn: React.CSSProperties = {
  border: `1px solid ${ui.border}`,
  borderRadius: 8,
  background: "#fff",
  padding: "8px 12px",
  fontSize: 14,
  cursor: "pointer",
};

const danger_btn: React.CSSProperties = {
  border: `1px solid ${ui.border}`,
  borderRadius: 8,
  background: "#fff",
  color: ui.danger,
  padding: "6px 10px",
  cursor: "pointer",
  fontSize: 13,
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

/* ================= 유틸 ================= */

const money = (n: number) =>
  new Intl.NumberFormat("ko-KR").format(Number.isFinite(n) ? n : 0);

type DraftLine = {
  item_id: string;
  qty: string;
};

const empty_line = (): DraftLine => ({
  item_id: "",
  qty: "",
});

/** 기본 유효성 검사 */
function validate_before_submit(
  branch_id: string,
  warehouse_id: string,
  desired_due_date: string,
  lines: DraftLine[],
): string | null {
  if (!branch_id) return "지점을 선택하세요.";
  if (!warehouse_id) return "출고 창고를 선택하세요.";
  if (!desired_due_date) return "희망 입고일을 선택하세요.";
  if (!lines.length) return "수주 품목을 추가하세요.";

  for (let i = 0; i < lines.length; i++) {
    const ln = lines[i];
    if (!ln.item_id) {
      return `${i + 1}행: 품목을 선택하세요.`;
    }
    const q = Number(ln.qty);
    if (!Number.isFinite(q) || q <= 0) {
      return `${i + 1}행: 수량을 올바르게 입력하세요.`;
    }
  }

  return null;
}

/* ================= 메인 컴포넌트 ================= */

const BranchOrderNewPage: React.FC = () => {
  const navigate = useNavigate();

  // 마스터 데이터
  const [branches, set_branches] = useState<BranchOption[]>([]);
  const [items, set_items] = useState<ItemOption[]>([]);
  const [warehouses, set_warehouses] = useState<WarehouseOption[]>([]);

  // 선택 값
  const [branch_id, set_branch_id] = useState<string>("");
  const [warehouse_id, set_warehouse_id] = useState<string>("");
  const [desired_due_date, set_desired_due_date] = useState<string>("");
  const [request_note, set_request_note] = useState<string>("");

  // 라인
  const [lines, set_lines] = useState<DraftLine[]>([empty_line()]);

  // 상태
  const [is_submitting, set_is_submitting] = useState<boolean>(false);
  const [load_error, set_load_error] = useState<string>("");
  const [submit_error, set_submit_error] = useState<string>("");

  // itemId → ItemOption 맵
  const item_by_id = useMemo(() => {
    const m = new Map<number, ItemOption>();
    items.forEach((it) => {
      m.set(it.id, it);
    });
    return m;
  }, [items]);

  // 단가/금액 계산된 라인
  const enriched_lines = useMemo(() => {
    return lines.map((ln) => {
      const item_id_num = Number(ln.item_id);
      const qty_num = Number(ln.qty);

      const info = Number.isFinite(item_id_num)
        ? item_by_id.get(item_id_num)
        : undefined;

      const unit_price = info?.unit_price ?? 0;
      const line_total =
        Number.isFinite(unit_price) && Number.isFinite(qty_num) && qty_num > 0
          ? unit_price * qty_num
          : 0;

      return {
        ...ln,
        unit_price,
        line_total,
      };
    });
  }, [lines, item_by_id]);

  const total_amount = useMemo(
    () => enriched_lines.reduce((sum, ln) => sum + (ln.line_total ?? 0), 0),
    [enriched_lines],
  );

  // 마스터 로딩
  useEffect(() => {
    let is_cancelled = false;

    (async () => {
      try {
        set_load_error("");
        const [br, its, whs] = await Promise.all([
          fetch_branches(),
          fetch_items(),
          fetch_warehouses(),
        ]);
        if (is_cancelled) return;
        set_branches(br);
        set_items(its);
        set_warehouses(whs);
      } catch (err: any) {
        if (!is_cancelled) {
          set_load_error(
            err?.message || "데이터 로딩 중 오류가 발생했습니다.",
          );
        }
      }
    })();

    return () => {
      is_cancelled = true;
    };
  }, []);

  // 라인 조작
  const update_line_item = (idx: number, id: string) => {
    set_lines((prev) =>
      prev.map((ln, i) => (i === idx ? { ...ln, item_id: id } : ln)),
    );
  };

  const update_line_qty = (idx: number, qty: string) => {
    set_lines((prev) =>
      prev.map((ln, i) => (i === idx ? { ...ln, qty } : ln)),
    );
  };

  const add_line = () => {
    set_lines((prev) => [...prev, empty_line()]);
  };

  const remove_line = (idx: number) => {
    set_lines((prev) => prev.filter((_, i) => i !== idx));
  };

  // 제출
  const on_submit = async () => {
    const err_msg = validate_before_submit(
      branch_id,
      warehouse_id,
      desired_due_date,
      lines,
    );
    if (err_msg) {
      set_submit_error(err_msg);
      return;
    }

    const filtered_lines = enriched_lines.filter(
      (ln) => ln.item_id && Number(ln.qty) > 0,
    );
    if (filtered_lines.length === 0) {
      set_submit_error("유효한 수주 품목이 없습니다.");
      return;
    }

    const ok = window.confirm("수주를 등록하시겠습니까?");
    if (!ok) return;

    const items_payload = filtered_lines.map((ln) => {
      const item_id_num = Number(ln.item_id);
      const qty_num = Number(ln.qty);
      const unit_price = Number(ln.unit_price) || 0;
      const amount = Number(ln.line_total) || unit_price * qty_num;

      return {
        item_id: item_id_num,
        quantity: qty_num,
        unit_price,
        amount,
      };
    });

    const payload: CreateBranchOrderPayload = {
      branch_id: Number(branch_id),
      items: items_payload,
      request_note: request_note.trim(),
      status: "PENDING",
      desired_due_date: `${desired_due_date}T00:00:00.000Z`,
    };

    set_is_submitting(true);
    set_submit_error("");

    try {
      await create_branch_order(payload);
      alert("수주가 등록되었습니다.");
      navigate("/branch-order");
    } catch (err: any) {
      set_submit_error(
        err?.message || "등록 중 오류가 발생했습니다.",
      );
    } finally {
      set_is_submitting(false);
    }
  };

  const cancel_and_back = () => {
    const is_dirty =
      branch_id ||
      warehouse_id ||
      desired_due_date ||
      request_note.trim() ||
      lines.length > 1 ||
      (lines.length === 1 && (lines[0].item_id || lines[0].qty));

    if (is_dirty) {
      const go = window.confirm(
        "작성 중인 내용이 사라집니다. 나가시겠습니까?",
      );
      if (!go) return;
    }
    navigate("/branch-order");
  };

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
          <h1
            style={{
              margin: 0,
              fontSize: 22,
              fontWeight: 800,
            }}
          >
            수주 등록
          </h1>
          <p
            style={{
              margin: "4px 0 0",
              fontSize: 13,
              color: ui.muted,
            }}
          >
            지점과 출고 창고, 품목, 수량을 입력해 본사 수주 요청을 등록합니다.
          </p>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            onClick={cancel_and_back}
            style={ghost_btn}
            disabled={is_submitting}
          >
            취소
          </button>
          <button
            type="button"
            onClick={on_submit}
            style={primary_btn}
            disabled={is_submitting}
          >
            {is_submitting ? "등록 중..." : "등록"}
          </button>
        </div>
      </div>

      {/* 지점 / 창고 / 희망입고일 / 비고 카드 */}
      <div style={card}>
        <div style={row_grid}>
          {/* 지점 */}
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

          {/* 출고 창고 */}
          <div>
            <label style={label_style}>출고 창고</label>
            <select
              style={select_style}
              value={warehouse_id}
              onChange={(e) => set_warehouse_id(e.target.value)}
              disabled={is_submitting}
            >
              <option value="">선택하세요</option>
              {warehouses.map((w) => (
                <option key={w.id} value={String(w.id)}>
                  {w.name}
                </option>
              ))}
            </select>
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

        <div style={{ marginTop: 16 }}>
          <label style={label_style}>요청 메모</label>
          <textarea
            style={textarea_style}
            value={request_note}
            onChange={(e) => set_request_note(e.target.value)}
            disabled={is_submitting}
          />
        </div>

        {load_error && (
          <div
            style={{
              marginTop: 12,
              fontSize: 13,
              color: ui.danger,
            }}
          >
            {load_error}
          </div>
        )}
      </div>


      {/* 품목/수량 테이블 */}
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
          <div
            style={{
              fontSize: 15,
              fontWeight: 700,
            }}
          >
            수주 품목 / 수량
          </div>
          <button
            type="button"
            onClick={add_line}
            style={ghost_btn}
            disabled={is_submitting}
          >
            + 품목 추가
          </button>
        </div>

        <div style={table_wrap}>
          <table style={table_style}>
            <thead>
              <tr>
                <th style={th_style}>품목</th>
                <th style={th_style}>수량</th>
                <th style={th_style}>단가</th>
                <th style={th_style}>금액</th>
                <th style={th_style}></th>
              </tr>
            </thead>
            <tbody>
              {enriched_lines.map((ln, idx) => {
                const zebra_bg =
                  idx % 2 === 1 ? { background: ui.zebra } : undefined;
                const item_id_num = Number(ln.item_id);
                const item_info = Number.isFinite(item_id_num)
                  ? item_by_id.get(item_id_num)
                  : undefined;

                return (
                  <tr key={idx} style={zebra_bg}>
                    {/* 품목 선택 */}
                    <td style={td_style}>
                      <select
                        style={select_style}
                        value={ln.item_id}
                        onChange={(e) =>
                          update_line_item(idx, e.target.value)
                        }
                        disabled={is_submitting}
                      >
                        <option value="">품목 선택</option>
                        {items.map((it) => (
                          <option key={it.id} value={String(it.id)}>
                            {it.name}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* 수량 */}
                    <td style={td_style}>
                      <input
                        type="number"
                        min={1}
                        step={1}
                        style={input_style}
                        value={ln.qty}
                        onChange={(e) =>
                          update_line_qty(idx, e.target.value)
                        }
                        disabled={is_submitting}
                      />
                    </td>

                    {/* 단가 */}
                    <td
                      style={{
                        ...td_style,
                        textAlign: "right",
                      }}
                    >
                      {money(item_info?.unit_price ?? 0)}
                    </td>

                    {/* 금액 */}
                    <td
                      style={{
                        ...td_style,
                        textAlign: "right",
                      }}
                    >
                      {money(ln.line_total ?? 0)}
                    </td>

                    {/* 삭제 */}
                    <td style={td_style}>
                      {lines.length > 1 ? (
                        <button
                          type="button"
                          style={danger_btn}
                          disabled={is_submitting}
                          onClick={() => remove_line(idx)}
                        >
                          삭제
                        </button>
                      ) : (
                        <span
                          style={{
                            fontSize: 13,
                            color: ui.muted,
                          }}
                        >
                          -
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {lines.length === 0 && (
                <tr>
                  <td
                    style={{
                      ...td_style,
                      textAlign: "center",
                      color: ui.muted,
                      fontStyle: "italic",
                    }}
                    colSpan={5}
                  >
                    수주 품목을 추가하세요.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 에러 메시지 */}
        {submit_error && (
          <div
            style={{
              marginTop: 12,
              fontSize: 13,
              color: ui.danger,
            }}
          >
            {submit_error}
          </div>
        )}

        {/* 요약 & 총합 */}
        <div
          style={{
            marginTop: 16,
            fontSize: 14,
            color: "#111",
          }}
        >
          {enriched_lines.map((ln, i) => {
            if (!ln.item_id || !ln.qty) return null;
            const item_id_num = Number(ln.item_id);
            const info = Number.isFinite(item_id_num)
              ? item_by_id.get(item_id_num)
              : undefined;
            const nm = info?.name;
            const q_num = Number(ln.qty);
            if (!nm || !Number.isFinite(q_num) || q_num <= 0) return null;

            return (
              <div
                key={i}
                style={{
                  fontSize: 13,
                  color: ui.muted,
                }}
              >
                • {nm} × {q_num} → {money(ln.line_total ?? 0)}원
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
            총 금액: {money(total_amount)}원
          </div>
        </div>
      </div>
    </div>
  );
};

export default BranchOrderNewPage;

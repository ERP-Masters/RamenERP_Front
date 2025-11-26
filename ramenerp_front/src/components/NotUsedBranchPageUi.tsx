// src/components/NotUsedBranchPageUi.tsx
import React, { useEffect, useState } from "react";
import { fetchNotUsedBranches, type ApiBranch } from "../pages/BranchNotUsedFunction";
import { markManyBranchesUsed } from "../pages/BranchUsedFunction";
import { ui_tok } from "@/ui/ui_tok";
import { SectionCard } from "./common/SectionCard";
import { UsedIconButton } from "./common/IconButtons";

const page_wrap_style: React.CSSProperties = {
  background: ui_tok.bg_page,
  minHeight: "100vh",
  padding: "24px 16px",
};

const page_inner_style: React.CSSProperties = {
  maxWidth: 960,
  margin: "0 auto",
};

const title_style: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 800,
  marginBottom: 4,
};

const description_style: React.CSSProperties = {
  fontSize: 13,
  color: ui_tok.label,
  marginBottom: 12,
};

const select_btn_style: React.CSSProperties = {
  padding: "6px 10px",
  borderRadius: 999,
  border: `1px solid ${ui_tok.border}`,
  background: ui_tok.surface,
  fontSize: 12,
};

const table_wrap_style: React.CSSProperties = {
  width: "100%",
  overflowX: "auto",
};

const table_style: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: 13,
};

const thead_style: React.CSSProperties = {
  background: ui_tok.header_bg,
};

const th_style: React.CSSProperties = {
  borderBottom: `1px solid ${ui_tok.border}`,
  padding: "10px 8px",
  textAlign: "left" as const,
  whiteSpace: "nowrap" as const,
  fontSize: 13,
  fontWeight: 700,
};

const td_style = {
  borderBottom: `1px solid ${ui_tok.border}`,
  padding: "10px 8px",
  textAlign: "left" as const,
  whiteSpace: "nowrap" as const,
  fontSize: 14,
} as const;

const empty_style = { padding: 24, textAlign: "center", color: ui_tok.label } as const;

const NotUsedBranchPageUi: React.FC = () => {
  const [rows, set_rows] = useState<ApiBranch[]>([]);
  const [loading, set_loading] = useState(false);
  const [error, set_error] = useState<string | null>(null);

  const [select_mode, set_select_mode] = useState(false);
  const [selected_ids, set_selected_ids] = useState<Set<string | number>>(new Set());

  const load = async () => {
    try {
      set_loading(true);
      set_error(null);
      const list = await fetchNotUsedBranches();
      set_rows(list);
      set_selected_ids(new Set());
    } catch (e: any) {
      set_error(e?.message || "불러오는 중 오류가 발생했습니다.");
    } finally {
      set_loading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const toggle_select_mode = () => {
    set_select_mode((prev) => !prev);
    set_selected_ids(new Set());
  };

  const handle_toggle_row = (branch_id: string | number) => {
    set_selected_ids((prev) => {
      const next = new Set(prev);
      if (next.has(branch_id)) {
        next.delete(branch_id);
      } else {
        next.add(branch_id);
      }
      return next;
    });
  };

  const is_checked = (branch_id: string | number) => {
    return selected_ids.has(branch_id);
  };

  const handle_restore_use = async () => {
    if (selected_ids.size === 0) {
      alert("사용으로 전환할 지점을 선택하세요.");
      return;
    }

    const target_ids = Array.from(selected_ids);
    const id_map: Record<string | number, number> = {};

    for (const row of rows) {
      if (!row.id) continue;
      if (target_ids.includes(row.branch_id)) {
        id_map[row.branch_id] = row.id;
      }
    }

    const ids = target_ids
      .map((code) => id_map[code])
      .filter((pk) => Number.isFinite(pk)) as number[];

    if (ids.length === 0) {
      alert("유효한 PK를 찾지 못했습니다.");
      return;
    }

    try {
      set_loading(true);
      await markManyBranchesUsed(ids);
      await load();
      set_select_mode(false);
      alert("사용으로 전환되었습니다.");
    } catch (e: any) {
      alert(e?.message || "전환 중 오류가 발생했습니다.");
      await load();
    } finally {
      set_loading(false);
    }
  };

  const is_empty = rows.length === 0;

  return (
    <div style={page_wrap_style}>
      <div style={page_inner_style}>
        <h1 style={title_style}>미사용 지점 관리</h1>
        <p style={description_style}>
          현재 사용하지 않는 지점 목록입니다. 선택한 지점을 다시 사용 상태로 전환할 수 있습니다.
        </p>

        <SectionCard
          title="미사용 지점 목록"
          subtitle={`총 ${rows.length.toLocaleString()}개`}
          right_slot={
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button
                type="button"
                style={select_btn_style}
                onClick={toggle_select_mode}
                title="선택 모드"
              >
                {select_mode ? "선택 해제" : "선택"}
              </button>
              {select_mode && (
                <UsedIconButton
                  onClick={handle_restore_use}
                />
              )}
            </div>
          }
        >
          <div style={table_wrap_style}>
            <table style={table_style}>
              <thead style={thead_style}>
                <tr>
                  {select_mode && <th style={th_style}>선택</th>}
                  <th style={th_style}>지점 ID</th>
                  <th style={th_style}>지점명</th>
                  <th style={th_style}>주소</th>
                  <th style={th_style}>연락처</th>
                </tr>
              </thead>
              <tbody>
                {is_empty ? (
                  <tr>
                    <td
                      style={empty_style}
                      colSpan={select_mode ? 5 : 4}
                    >
                      미사용 지점이 없습니다.
                    </td>
                  </tr>
                ) : (
                  rows.map((row, idx) => (
                    <tr
                      key={row.branch_id}
                      style={idx % 2 === 1 ? { background: ui_tok.zebra } : undefined}
                    >
                      {select_mode && (
                        <td style={td_style}>
                          <input
                            type="checkbox"
                            checked={is_checked(row.branch_id)}
                            onChange={() => handle_toggle_row(row.branch_id)}
                          />
                        </td>
                      )}
                      <td style={td_style}>{row.branch_id}</td>
                      <td style={td_style}>{row.name}</td>
                      <td style={td_style}>{row.address}</td>
                      <td style={td_style}>{row.contact}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {loading && <div style={{ padding: 12, color: ui_tok.label }}>불러오는 중…</div>}
          {error && <div style={{ padding: 12, color: "#c62828" }}>{error}</div>}
        </SectionCard>
      </div>
    </div>
  );
};

export default NotUsedBranchPageUi;

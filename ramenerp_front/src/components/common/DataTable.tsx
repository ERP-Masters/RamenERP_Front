// src/components/common/DataTable.tsx
import React from "react";
import { ui_tok } from "@/ui/ui_tok";

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
  padding: "8px 10px",
  borderBottom: `1px solid ${ui_tok.border}`,
  textAlign: "left",
  fontWeight: 600,
  fontSize: 12,
  color: ui_tok.label,
  whiteSpace: "nowrap",
};

const td_style: React.CSSProperties = {
  padding: "7px 10px",
  borderBottom: `1px solid ${ui_tok.border}`,
  fontSize: 13,
};

type DataTableProps = {
  head_cells: React.ReactNode[];
  body_rows: React.ReactNode[];
  empty_text?: string;
};

export const DataTable: React.FC<DataTableProps> = ({
  head_cells,
  body_rows,
  empty_text = "조회 결과가 없습니다.",
}) => {
  const is_empty = body_rows.length === 0;

  return (
    <div style={table_wrap_style}>
      <table style={table_style}>
        <thead style={thead_style}>
          <tr>
            {head_cells.map((cell, index) => (
              <th key={index} style={th_style}>
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {is_empty ? (
            <tr>
              <td
                style={{
                  ...td_style,
                  padding: "20px 10px",
                  textAlign: "center",
                  color: ui_tok.label,
                }}
                colSpan={head_cells.length}
              >
                {empty_text}
              </td>
            </tr>
          ) : (
            body_rows.map((row, index) => <React.Fragment key={index}>{row}</React.Fragment>)
          )}
        </tbody>
      </table>
    </div>
  );
};

export const data_table_td_style = td_style;

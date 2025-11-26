// src/components/common/SearchToolbar.tsx
import React from "react";
import { ui_tok } from "@/ui/ui_tok";

const toolbar_wrap_style: React.CSSProperties = {
  display: "flex",
  gap: 10,
  alignItems: "center",
  marginBottom: 10,
  flexWrap: "wrap",
};

const left_style: React.CSSProperties = {
  display: "flex",
  gap: 8,
  alignItems: "center",
  flexWrap: "wrap",
};

const right_style: React.CSSProperties = {
  marginLeft: "auto",
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
};

const search_input_style: React.CSSProperties = {
  height: 32,
  padding: "0 10px",
  borderRadius: ui_tok.radius,
  border: `1px solid ${ui_tok.border}`,
  fontSize: 13,
};

type SearchToolbarProps = {
  is_search_input?: boolean;
  search_value?: string;
  on_change_search?: (value: string) => void;
  left_slot?: React.ReactNode;
  right_slot?: React.ReactNode;
};

export const SearchToolbar: React.FC<SearchToolbarProps> = ({
  is_search_input,
  search_value,
  on_change_search,
  left_slot,
  right_slot,
}) => {
  return (
    <div style={toolbar_wrap_style}>
      <div style={left_style}>
        {is_search_input && (
          <input
            type="text"
            placeholder="검색어를 입력하세요"
            value={search_value ?? ""}
            onChange={(event) => on_change_search?.(event.target.value)}
            style={search_input_style}
          />
        )}
        {left_slot}
      </div>
      <div style={right_style}>{right_slot}</div>
    </div>
  );
};

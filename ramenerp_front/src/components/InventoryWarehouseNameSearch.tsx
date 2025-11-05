// src/components/InventoryWarehouseNameSearch.tsx
import React from "react";

const input_style: React.CSSProperties = {
  height: 36,
  padding: "0 10px",
  minWidth: 220,
  borderRadius: 10,
  border: "1px solid #e5e7eb",
  outline: "none",
  background: "#fff",
};

const btn_base: React.CSSProperties = {
  height: 36,
  padding: "0 14px",
  borderRadius: 10,
  border: "1px solid #e5e7eb",
  cursor: "pointer",
  whiteSpace: "nowrap",
  fontSize: 13,
};
const primary_btn: React.CSSProperties = {
  ...btn_base,
  background: "#111827",
  borderColor: "#020617",
  color: "#ffffff",
};
const gray_btn: React.CSSProperties = {
  ...btn_base,
  background: "#6b7280",
  borderColor: "#4b5563",
  color: "#ffffff",
};

type Props = {
  value: string;
  loading: boolean;
  onChange: (v: string) => void;
  onSearch: () => void;
  onReset: () => void;
};

const InventoryWarehouseNameSearch: React.FC<Props> = ({
  value,
  loading,
  onChange,
  onSearch,
  onReset,
}) => {
  const disabledSearch = loading || !value.trim();

  return (
    <>
      <input
        style={input_style}
        placeholder="창고 이름 입력"
        value={value}
        disabled={loading}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            if (!disabledSearch) onSearch();
          }
        }}
      />
      <button
        type="button"
        style={{
          ...primary_btn,
          opacity: disabledSearch ? 0.6 : 1,
          cursor: disabledSearch ? "not-allowed" : "pointer",
        }}
        disabled={disabledSearch}
        onClick={onSearch}
      >
        조회
      </button>
      <button
        type="button"
        style={gray_btn}
        disabled={loading}
        onClick={onReset}
      >
        초기화
      </button>
    </>
  );
};

export default InventoryWarehouseNameSearch;

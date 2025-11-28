import React from "react";

type Props = {
  nameValue: string;
  managerValue: string;
  onChangeName: (v: string) => void;
  onChangeManager: (v: string) => void;
  onSearch: () => void;
  onReset: () => void;
};

const row_style: React.CSSProperties = {
  display: "flex",
  gap: 8,
  alignItems: "center",
  flexWrap: "wrap",
  marginBottom: 10,
};

const input_style: React.CSSProperties = {
  padding: "6px 8px",
  minWidth: 160,
  boxSizing: "border-box",
};

const btn_style: React.CSSProperties = {
  padding: "6px 10px",
  borderRadius: 6,
  border: "1px solid #d1d5db",
  background: "#111827",
  color: "#fff",
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const reset_btn_style: React.CSSProperties = { ...btn_style, background: "#6b7280" };

const VendorSearchBar: React.FC<Props> = ({
  nameValue,
  managerValue,
  onChangeName,
  onChangeManager,
  onSearch,
  onReset,
}) => {
  const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onSearch();
    }
  };

  return (
    <div style={row_style}>
      <label style={{ whiteSpace: "nowrap" }}>거래처명</label>
      <input
        type="text"
        value={nameValue}
        onChange={(e) => onChangeName(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder="예) CJ 식품"
        style={input_style}
      />

      <label style={{ whiteSpace: "nowrap" }}>담당자명</label>
      <input
        type="text"
        value={managerValue}
        onChange={(e) => onChangeManager(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder="예) 이건호"
        style={input_style}
      />

      <button type="button" style={btn_style} onClick={onSearch}>검색</button>
      <button type="button" style={reset_btn_style} onClick={onReset}>초기화</button>
    </div>
  );
};

export default VendorSearchBar;

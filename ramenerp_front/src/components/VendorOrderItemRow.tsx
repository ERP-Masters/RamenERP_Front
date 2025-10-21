import React from "react";
import { ItemOption, VendorOrderItemInput } from "@/types/vendor_order";

type Props = {
  index: number;
  row: VendorOrderItemInput;
  item_options: ItemOption[];
  on_change: (patch: Partial<VendorOrderItemInput>) => void;
  on_remove: () => void;
};

const cell: React.CSSProperties = { display: "grid", gap: 6 };
const input_style: React.CSSProperties = {
  width: "100%", padding: "8px 10px", border: "1px solid #ddd", borderRadius: 10,
};
const button_style: React.CSSProperties = {
  padding: "8px 10px", border: "1px solid #ddd", borderRadius: 10, background: "#fff", cursor: "pointer",
};

const VendorOrderItemRow: React.FC<Props> = ({ index, row, item_options, on_change, on_remove }) => {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr auto", gap: 8, marginBottom: 8 }}>
      <div style={cell}>
        <label style={{ fontSize: 12, color: "#666" }}>품목</label>
        <select
          style={input_style}
          value={row.item_id || ""}
          onChange={(e) => on_change({ item_id: e.target.value ? Number(e.target.value) : 0 })}
        >
          <option value="">선택</option>
          {item_options.map((it) => (
            <option key={`${index}-${it.id}`} value={it.id}>
              {it.name}
            </option>
          ))}
        </select>
      </div>

      <div style={cell}>
        <label style={{ fontSize: 12, color: "#666" }}>단위 ID</label>
        <input
          style={input_style}
          value={row.unit_id || ""}
          onChange={(e) => on_change({ unit_id: e.target.value ? Number(e.target.value) : 0 })}
          placeholder="unit_id"
        />
      </div>

      <div style={cell}>
        <label style={{ fontSize: 12, color: "#666" }}>수량</label>
        <input
          style={input_style}
          type="number"
          min={1}
          value={row.qty_ordered}
          onChange={(e) => on_change({ qty_ordered: Number(e.target.value || 0) })}
        />
      </div>

      <div style={cell}>
        <label style={{ fontSize: 12, color: "#666" }}>단가</label>
        <input
          style={input_style}
          type="number"
          min={0}
          step="0.01"
          value={row.unit_price}
          onChange={(e) => on_change({ unit_price: Number(e.target.value || 0) })}
        />
      </div>

      <div style={{ display: "flex", alignItems: "end" }}>
        <button style={button_style} onClick={on_remove}>삭제</button>
      </div>
    </div>
  );
};

export default VendorOrderItemRow;

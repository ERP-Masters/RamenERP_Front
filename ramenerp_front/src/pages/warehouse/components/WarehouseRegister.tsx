// src/pages/WareHouseRegister.tsx
import React, { useState } from "react";

type CreateWarehouseDto = {
  name: string;
  location: string;
  isused?: "USED" | "NOTUSED"; // ✅ 서버가 받는 상태값(선택 필드로 선언)
};

const form_wrap_style: React.CSSProperties = {
  fontSize: "clamp(12px, 1.05vw, 16px)",
};

const row_style: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(160px, 1fr) minmax(260px, 2fr) auto",
  gap: 12,
  alignItems: "center",
  marginBottom: 10,
};

const group_style: React.CSSProperties = {
  display: "grid",
  gridTemplateRows: "auto 1fr",
  rowGap: 6,
  minWidth: 0,
};

const label_style: React.CSSProperties = { whiteSpace: "nowrap", color: "#6b7280", fontWeight: 600 };

const input_style: React.CSSProperties = {
  width: "100%",
  minWidth: 0,
  height: 40,
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid #e5e7eb",
  boxSizing: "border-box",
  outline: "none",
  background: "#fff",
};

const submit_btn_style: React.CSSProperties = {
  height: 42,
  padding: "0 14px",
  borderRadius: 10,
  border: "1px solid #0284c7",
  background: "#0ea5e9",
  color: "#fff",
  fontWeight: 800,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const ghost_btn_style: React.CSSProperties = {
  height: 42,
  padding: "0 14px",
  borderRadius: 10,
  border: "1px solid #e5e7eb",
  background: "#fff",
  color: "#111827",
  fontWeight: 700,
  cursor: "pointer",
  whiteSpace: "nowrap",
  marginLeft: 8,
};

const WareHouseRegister: React.FC = () => {
  const [name, set_name] = useState("");
  const [location, set_location] = useState("");
  const [is_submitting, set_is_submitting] = useState(false);

  const handle_submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (is_submitting) return;

    const payload: CreateWarehouseDto = {
      name: name.trim(),
      location: location.trim(),
      isused: "USED", // ✅ 항상 USED로 등록
    };

    if (!payload.name || !payload.location) {
      alert("등록에 실패하였습니다. (이름/주소를 입력해 주세요)");
      return;
    }

    try {
      set_is_submitting(true);

      const res = await fetch("/api/warehouses", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload), // ✅ isused 함께 전송
      });

      const text = await res.text();
      if (!res.ok) {
        let msg = `HTTP ${res.status}`;
        try {
          const j = text ? JSON.parse(text) : null;
          msg = j?.message || msg;
        } catch {}
        throw new Error(msg);
      }

      alert("등록이 완료되었습니다.");
      set_name("");
      set_location("");

      window.dispatchEvent(new Event("warehouse:created"));
      window.dispatchEvent(new Event("warehouse:register:cancel"));
    } catch (e: any) {
      alert(`등록에 실패하였습니다. ${e?.message || ""}`);
    } finally {
      set_is_submitting(false);
    }
  };

  const handle_cancel = () => {
    window.dispatchEvent(new Event("warehouse:register:cancel"));
  };

  return (
    <form onSubmit={handle_submit} style={form_wrap_style}>
      <div style={row_style}>
        <div style={group_style}>
          <label style={label_style}>창고명</label>
          <input
            type="text"
            value={name}
            onChange={(e) => set_name(e.target.value)}
            placeholder="예) 서울 1창고"
            style={input_style}
            required
          />
        </div>

        <div style={group_style}>
          <label style={label_style}>창고 위치</label>
          <input
            type="text"
            value={location}
            onChange={(e) => set_location(e.target.value)}
            placeholder="예) 서울특별시 강남구 ..."
            style={input_style}
            required
          />
        </div>

        <div style={{ display: "flex", alignItems: "center" }}>
          <button type="submit" style={submit_btn_style} disabled={is_submitting}>
            {is_submitting ? "등록 중…" : "등록"}
          </button>
          {/* 필요 시 수동 닫기 버튼
          <button type="button" style={ghost_btn_style} onClick={handle_cancel}>닫기</button> */}
        </div>
      </div>
    </form>
  );
};

export default WareHouseRegister;

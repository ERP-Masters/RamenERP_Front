// src/pages/WareHouseRegister.tsx
import React, { useState } from "react";
import WarehouseListPanel from "../components/WarehouseListPanel";

type CreateWarehouseDto = {
  name: string;
  location: string;
};

const container_style: React.CSSProperties = {
  maxWidth: 1200,
  margin: "0 auto",
  padding: "12px 8px",
  fontSize: "clamp(12px, 1.1vw, 16px)",
  boxSizing: "border-box",
};

const title_style: React.CSSProperties = {
  fontSize: "clamp(22px, 2.2vw, 32px)",
  margin: "4px 0 12px 0",
  fontWeight: 700,
};

const row_style: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  flexWrap: "nowrap",   // 한 줄 유지
  overflowX: "auto",    // 화면이 좁아져도 한 줄 + 가로 스크롤
  paddingBottom: 8,
};

const group_style: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  flex: "1 1 0",
  minWidth: 0,
};

const label_style: React.CSSProperties = { whiteSpace: "nowrap", flex: "0 0 auto" };

const input_style: React.CSSProperties = {
  width: "100%",
  minWidth: 0,
  padding: "6px 8px",
  boxSizing: "border-box",
};

const btn_style: React.CSSProperties = {
  flex: "0 0 auto",
  padding: "8px 14px",
  borderRadius: 6,
  border: "1px solid #d1d5db",
  background: "#111827",
  color: "#fff",
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const WareHouseRegister: React.FC = () => {
  const [name, set_name] = useState("");
  const [location, set_location] = useState("");
  const [is_submitting, set_is_submitting] = useState(false);

  // ✅ 추가: 등록 후 패널을 즉시 리프레시하기 위한 key
  const [panelKey, set_panelKey] = useState(0);

  const handle_submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (is_submitting) return;

    const payload: CreateWarehouseDto = {
      name: name.trim(),
      location: location.trim(),
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
        body: JSON.stringify(payload),
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

      // ✅ 여기서 패널 리마운트 → 즉시 재조회
      set_panelKey((k) => k + 1);
    } catch (e: any) {
      alert(`등록에 실패하였습니다. ${e?.message || ""}`);
    } finally {
      set_is_submitting(false);
    }
  };

  return (
    <div style={container_style}>
      <h1 style={title_style}>창고 관리</h1>

      <form onSubmit={handle_submit}>
        {/* 1줄: 창고 이름 / 위치 / 등록 버튼 */}
        <div style={row_style}>
          <div style={group_style}>
            <label style={label_style}>name</label>
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
            <label style={label_style}>location</label>
            <input
              type="text"
              value={location}
              onChange={(e) => set_location(e.target.value)}
              placeholder="예) 서울특별시 강남구 ..."
              style={input_style}
              required
            />
          </div>

          <button type="submit" style={btn_style} disabled={is_submitting}>
            {is_submitting ? "등록 중…" : "등록"}
          </button>
        </div>
      </form>

      {/* 목록 패널(내장 위치 검색 포함) — ✅ key로 즉시 리프레시 */}
      <WarehouseListPanel key={panelKey} />
    </div>
  );
};

export default WareHouseRegister;

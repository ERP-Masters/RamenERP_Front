// src/pages/UnitRegisterPage.tsx
import React, { useState } from "react";

const UnitRegisterPage: React.FC = () => {
  const [unit_code, set_unit_code] = useState<string>("");
  const [unit_name, set_unit_name] = useState<string>("");

  const handle_change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === "unit_code") set_unit_code(value);
    if (name === "unit_name") set_unit_name(value);
  };

  const handle_submit = (e: React.FormEvent) => {
    e.preventDefault();

    // API 연동은 추후에: 지금은 팝업만 표시
    alert("단위 등록이 완료되었습니다.");

    // 입력값 초기화 (원하면 유지해도 됨)
    set_unit_code("");
    set_unit_name("");
  };

  return (
    <div>
      <h1>단위 등록</h1>

      <form onSubmit={handle_submit}>
        <label style={{ marginRight: 8 }}>단위</label>
        <input
          type="text"
          name="unit_code"
          value={unit_code}
          onChange={handle_change}
          placeholder="예) KG"
          style={{ marginRight: 12 }}
          required
        />

        <label style={{ marginRight: 8 }}>단위명</label>
        <input
          type="text"
          name="unit_name"
          value={unit_name}
          onChange={handle_change}
          placeholder="예) 킬로그램"
          style={{ marginRight: 12 }}
          required
        />

        <button type="submit">등록</button>
      </form>
    </div>
  );
};

export default UnitRegisterPage;

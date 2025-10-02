// src/pages/UnitRegisterPage.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const UnitRegisterPage: React.FC = () => {
  const [unit_code, set_unit_code] = useState<string>("");
  const [unit_name, set_unit_name] = useState<string>("");
   const navigate_fn = useNavigate();

  const handle_change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === "unit_code") set_unit_code(value);
    if (name === "unit_name") set_unit_name(value);
  };

  const handle_submit = (e: React.FormEvent) => {
  e.preventDefault();
  navigate_fn("/unit/register/check", {
    state: {
      unit: {
        code: unit_code.trim(),
        name: unit_name.trim(),
      },
    },
    replace: true,
  });
  // 원래처럼 초기화하고 싶으면 유지
  set_unit_code("");
  set_unit_name("");
};


  return (
    <div>
      <h1>단위 등록</h1>

      <form onSubmit={handle_submit}>
        <label style={{ marginRight: 8 }}>code</label>
        <input
          type="text"
          name="unit_code"
          value={unit_code}
          onChange={handle_change}
          placeholder="예) KG"
          style={{ marginRight: 12 }}
          required
        />

        <label style={{ marginRight: 8 }}>name</label>
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

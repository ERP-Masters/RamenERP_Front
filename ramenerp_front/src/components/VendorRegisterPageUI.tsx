// src/components/VendorRegisterPageUI.tsx
import React from "react";

export interface VendorFormViewState {
  name: string;
  contact_name: string;
  address_road: string;
  address_detail: string;
}

export interface VendorRegisterPageUIProps {
  formData: VendorFormViewState;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;

  // ✅ 연락처 대신 이메일 1칸
  contactEmail: string;
  onContactEmailChange: (e: React.ChangeEvent<HTMLInputElement>) => void;

  // 주소 검색
  openAddressSearch: () => void;

  // 상세주소 포커스 이동용
  detailRef: React.RefObject<HTMLInputElement | null>;

  // 제출
  onSubmit: (e: React.FormEvent) => void;
}

const VendorRegisterPageUI: React.FC<VendorRegisterPageUIProps> = (props) => {
  // ✅ 외부 prop 이름은 유지, 내부에서는 snake_case 별칭으로 사용
  const {
    formData,
    onChange,
    contactEmail,
    onContactEmailChange,
    openAddressSearch,
    detailRef,
    onSubmit,
  } = props;

  const form_data = formData;
  const on_change = onChange;
  const contact_email = contactEmail;
  const on_contact_email_change = onContactEmailChange;
  const open_address_search = openAddressSearch;
  const detail_ref = detailRef;
  const on_submit = onSubmit;

  return (
    <form onSubmit={on_submit}>
      {/* 1줄: 거래처명 / 담당자명 */}
      <div
        style={{
          display: "flex",
          gap: 12,
          alignItems: "center",
          flexWrap: "wrap",
          marginBottom: 8,
        }}
      >
        <label>거래처명</label>
        <input
          type="text"
          name="name"
          value={form_data.name}
          onChange={on_change}
          placeholder="예) OO식자재"
        />

        <label>담당자명</label>
        <input
          type="text"
          name="contact_name"
          value={form_data.contact_name}
          onChange={on_change}
          placeholder="예) 홍길동"
        />
      </div>

      {/* 2줄: 담당자 이메일 (전화번호 3칸 → 이메일 1칸) */}
      <div style={{ margin: "8px 0" }}>
        <label style={{ display: "block", marginBottom: 4 }}>담당자 이메일</label>
        <input
          type="email"
          name="contact_email"
          value={contact_email}
          onChange={on_contact_email_change}
          placeholder="example@company.com"
          style={{ width: 240 }}
          required
        />
      </div>

      {/* 3줄: 도로명 주소 (라벨 옆에 검색 버튼, 인풋은 라벨 아래) */}
      <div
        style={{
          margin: "8px 0",
          display: "grid",
          gridTemplateColumns: "auto auto",
          columnGap: 8,
          rowGap: 4,
          alignItems: "center",
        }}
      >
        <label style={{ gridColumn: "1 / 2" }}>도로명 주소</label>
        <button type="button" onClick={open_address_search} style={{ gridColumn: "2 / 3" }}>
          도로명 주소 검색
        </button>

        <input
          type="text"
          name="address_road"
          value={form_data.address_road}
          onChange={on_change}
          placeholder="예) 서울특별시 강서구 방화대로50길 7"
          readOnly
          style={{ width: 420, background: "#f4f4f4", gridColumn: "1 / 2" }}
          title="검색 버튼으로 자동 입력됩니다"
        />
      </div>

      {/* 4줄: 상세 주소 */}
      <div style={{ margin: "8px 0" }}>
        <label style={{ display: "block" }}>상세 주소</label>
        <input
          ref={detail_ref}
          type="text"
          name="address_detail"
          value={form_data.address_detail}
          onChange={on_change}
          placeholder="예) 12층 1201호"
          style={{ width: 420 }}
        />
      </div>

      <button type="submit">등록</button>
    </form>
  );
};

export default VendorRegisterPageUI;

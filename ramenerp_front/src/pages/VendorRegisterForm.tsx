// src/pages/VendorRegisterForm.tsx
import React, { useEffect, useRef, useState } from "react";
import VendorRegisterPageUI, { VendorFormViewState } from "../components/VendorRegisterPageUI";

// 전송 데이터 타입
export interface VendorData {
  name: string;             // 거래처명
  contact_name: string;     // 담당자명
  contact_email: string;    // ✅ 담당자 이메일(변경)
  address_road: string;     // 도로명 주소
  address_detail: string;   // 상세 주소
}

interface VendorRegisterFormProps {
  onSubmit: (data: VendorData) => void;
}

// window.daum 타입 선언(간단)
declare global {
  interface Window {
    daum?: any;
  }
}

// 다음(카카오) 우편번호 스크립트 로더
function use_daum_postcode() {
  const [is_loaded, set_is_loaded] = useState(false);

  useEffect(() => {
    if (window.daum?.Postcode) {
      set_is_loaded(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
    script.async = true;
    script.onload = () => set_is_loaded(true);
    document.body.appendChild(script);
  }, []);

  return is_loaded;
}

const VendorRegisterForm: React.FC<VendorRegisterFormProps> = ({ onSubmit }) => {
  const is_loaded = use_daum_postcode();

  const [form_data, set_form_data] = useState<VendorData>({
    name: "",
    contact_name: "",
    contact_email: "",        // ✅ 이메일 필드 추가
    address_road: "",
    address_detail: "",
  });

  // 상세주소 포커스 이동용
  const detail_ref = useRef<HTMLInputElement | null>(null);

  const handle_change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    set_form_data(prev => ({ ...prev, [name]: value }));
  };

  // 도로명 주소 검색 열기
  const open_address_search = () => {
    if (!is_loaded || !window.daum?.Postcode) {
      alert("주소 검색 로딩 중입니다. 잠시 후 다시 시도해 주세요.");
      return;
    }

    new window.daum.Postcode({
      oncomplete: (data: any) => {
        const road = data.roadAddress || "";
        set_form_data(prev => ({
          ...prev,
          address_road: road,
        }));
        // 상세주소로 포커스 이동
        setTimeout(() => detail_ref.current?.focus(), 0);
      },
    }).open();
  };

  const handle_submit = (e: React.FormEvent) => {
    e.preventDefault();

    // 도로명 + 상세주소를 평문 한 줄로 합쳐 전송
    const full_address = [form_data.address_road?.trim(), form_data.address_detail?.trim()]
      .filter(Boolean)
      .join(" ");

    onSubmit({
      ...form_data,
      address_road: full_address,
      address_detail: "", // 중복 전송 방지(원하면 유지 가능)
    });
  };

  // View에 필요한 상태를 원형 그대로 내려줌
  const view_state: VendorFormViewState = {
    name: form_data.name,
    contact_name: form_data.contact_name,
    address_road: form_data.address_road,
    address_detail: form_data.address_detail,
  };

  return (
    <VendorRegisterPageUI
      formData={view_state}
      onChange={handle_change}
      // ✅ 전화번호 props 제거, 이메일 props로 대체 (UI에서도 동일 이름을 받게 수정 필요)
      contactEmail={form_data.contact_email}
      onContactEmailChange={(e: React.ChangeEvent<HTMLInputElement>) =>
        set_form_data(prev => ({ ...prev, contact_email: e.target.value }))
      }
      openAddressSearch={open_address_search}
      detailRef={detail_ref}
      onSubmit={handle_submit}
    />
  );
};

export default VendorRegisterForm;

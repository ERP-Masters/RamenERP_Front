// src/pages/VendorRegisterForm.tsx
import React, { useEffect, useRef, useState } from "react";
import VendorRegisterPageUI, { VendorFormViewState } from "../components/VendorRegisterPageUI";

// 전송 데이터 타입
export interface VendorData {
  name: string;             // 거래처명
  contact_name: string;     // 담당자명
  contact_phone: string;    // "000-0000-0000"
  postal_code: string;      // 우편번호 (zonecode)
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

  const [form_data, set_form_data] = useState<Omit<VendorData, "contact_phone">>({
    name: "",
    contact_name: "",
    postal_code: "",
    address_road: "",
    address_detail: "",
  });

  // 연락처 3칸
  const [phone_1, set_phone_1] = useState("");
  const [phone_2, set_phone_2] = useState("");
  const [phone_3, set_phone_3] = useState("");

  // 상세주소 포커스 이동용
  const detail_ref = useRef<HTMLInputElement | null>(null);

  const handle_change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    set_form_data(prev => ({ ...prev, [name]: value }));
  };

  const handle_phone_change =
    (setter: React.Dispatch<React.SetStateAction<string>>, max: number) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const only_digits = e.target.value.replace(/\D/g, "");
      setter(only_digits.slice(0, max));
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
        const zone = data.zonecode || "";
        set_form_data(prev => ({
          ...prev,
          address_road: road,
          postal_code: zone,
        }));
        // 상세주소로 포커스 이동
        setTimeout(() => detail_ref.current?.focus(), 0);
      },
    }).open();
  };

  const handle_submit = (e: React.FormEvent) => {
    e.preventDefault();
    const contact_phone = [phone_1, phone_2, phone_3].filter(Boolean).join("-");
    onSubmit({
      ...form_data,
      contact_phone,
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
      phone1={phone_1}
      phone2={phone_2}
      phone3={phone_3}
      onPhone1Change={handle_phone_change(set_phone_1, 3)}
      onPhone2Change={handle_phone_change(set_phone_2, 4)}
      onPhone3Change={handle_phone_change(set_phone_3, 4)}
      openAddressSearch={open_address_search}
      detailRef={detail_ref}
      onSubmit={handle_submit}
    />
  );
};

export default VendorRegisterForm;

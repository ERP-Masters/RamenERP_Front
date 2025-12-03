// src/pages/Notice/function/NoticeRegisterPageFunction.ts
import type React from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

type UseNoticeFormReturn = {
  title: string;
  set_title: (v: string) => void;
  content: string;
  set_content: (v: string) => void;
  author_id_text: string;
  set_author_id_text: (v: string) => void;
  is_submitting: boolean;
  error: string;
  handle_submit: (e: React.FormEvent<HTMLFormElement>) => void;
  handle_cancel: () => void;             // ✅ 여기 추가
};

type NoticeCreatePayload = {
  title: string;
  content: string;
  author_id: number;
};

export const useNoticeForm = (): UseNoticeFormReturn => {
  const navigate = useNavigate();

  const [title, set_title] = useState("");
  const [content, set_content] = useState("");
  const [author_id_text, set_author_id_text] = useState("");
  const [is_submitting, set_is_submitting] = useState(false);
  const [error, set_error] = useState("");

  const handle_submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const trimmed_title = title.trim();
    const trimmed_content = content.trim();
    const trimmed_author_id = author_id_text.trim();

    if (!trimmed_title) {
      set_error("제목을 입력해주세요.");
      return;
    }

    if (!trimmed_content) {
      set_error("내용을 입력해주세요.");
      return;
    }

    if (!trimmed_author_id) {
      set_error("작성자 ID를 입력해주세요.");
      return;
    }

    const author_id_num = Number(trimmed_author_id);

    if (!Number.isInteger(author_id_num)) {
      set_error("작성자 ID는 정수로 입력해주세요.");
      return;
    }

    set_error("");
    set_is_submitting(true);

    try {
      const payload: NoticeCreatePayload = {
        title: trimmed_title,
        content: trimmed_content,
        author_id: author_id_num,
      };

      const res = await fetch("/api/notice", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }

      // 성공 시 공지 리스트로 이동
      navigate("/notice");
    } catch (err: any) {
      set_error(err?.message || "공지 등록 중 오류가 발생했습니다.");
    } finally {
      set_is_submitting(false);
    }
  };

  const handle_cancel = () => {
    // 뒤로가기 (보통 /notice 에서 /notice/new로 왔으니 한 단계 뒤로)
    navigate(-1);
  };

  return {
    title,
    set_title,
    content,
    set_content,
    author_id_text,
    set_author_id_text,
    is_submitting,
    error,
    handle_submit,
    handle_cancel,      // ✅ 반환에 포함
  };
};

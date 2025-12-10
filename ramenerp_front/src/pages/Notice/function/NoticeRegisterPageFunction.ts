// src/pages/Notice/function/NoticeRegisterPageFunction.ts
import type React from "react";
import { useEffect, useRef, useState } from "react";
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

  // ✅ 성공 알림 상태
  is_success_open: boolean;
  success_msg: string;

  handle_submit: (e: React.FormEvent<HTMLFormElement>) => void;
  handle_cancel: () => void;
};

type NoticeCreatePayload = {
  title: string;
  content: string;
  author_id: number;
};

type UseNoticeFormOptions = {
  on_success_close?: () => void;
  success_timeout_ms?: number; // ✅ 필요하면 페이지별로 조절 가능
};

export const useNoticeForm = (
  options?: UseNoticeFormOptions,
): UseNoticeFormReturn => {
  const navigate = useNavigate();

  const [title, set_title] = useState("");
  const [content, set_content] = useState("");
  const [author_id_text, set_author_id_text] = useState("");
  const [is_submitting, set_is_submitting] = useState(false);
  const [error, set_error] = useState("");

  const [is_success_open, set_is_success_open] = useState(false);
  const [success_msg, set_success_msg] = useState("");

  const success_timer_ref = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (success_timer_ref.current) {
        window.clearTimeout(success_timer_ref.current);
        success_timer_ref.current = null;
      }
    };
  }, []);

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

      // ✅ 성공 알림 오픈
      set_success_msg("등록이 완료되었습니다.");
      set_is_success_open(true);

      const timeout_ms = options?.success_timeout_ms ?? 3000;

      if (success_timer_ref.current) {
        window.clearTimeout(success_timer_ref.current);
      }

      success_timer_ref.current = window.setTimeout(() => {
        set_is_success_open(false);
        set_success_msg("");

        // ✅ 모달형이면 닫기 콜백 우선
        if (options?.on_success_close) {
          options.on_success_close();
          return;
        }

        // ✅ 페이지형이면 리스트로 이동
        navigate("/notice");
      }, timeout_ms);
    } catch (err: any) {
      set_error(err?.message || "공지 등록 중 오류가 발생했습니다.");
    } finally {
      set_is_submitting(false);
    }
  };

  const handle_cancel = () => {
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

    is_success_open,
    success_msg,

    handle_submit,
    handle_cancel,
  };
};

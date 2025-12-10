// src/pages/Notice/function/NoticeEditModalFunction.ts
import { useState } from "react";

export type NoticeForEdit = {
  id: number;
  title: string;
  content: string;
  author_id: number;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
};

type UseNoticeEditFormOptions = {
  notice: NoticeForEdit;
  on_success: (updated: NoticeForEdit) => void;
  on_close: () => void;
};

export const useNoticeEditForm = ({
  notice,
  on_success,
  on_close,
}: UseNoticeEditFormOptions) => {
  const [title, set_title] = useState(notice.title);
  const [content, set_content] = useState(notice.content);
  const [is_submitting, set_is_submitting] = useState(false);
  const [error, set_error] = useState("");

  const handle_submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const trimmed_title = title.trim();
    const trimmed_content = content.trim();

    if (!trimmed_title) {
      set_error("제목을 입력해주세요.");
      return;
    }

    if (!trimmed_content) {
      set_error("내용을 입력해주세요.");
      return;
    }

    set_is_submitting(true);
    set_error("");

    try {
      const res = await fetch(`/api/notice/${notice.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          title: trimmed_title,
          content: trimmed_content,
          // ⚠ author_id 는 수정하지 않음
        }),
      });

      const text = await res.text();
      if (!res.ok) {
        throw new Error(text || `HTTP ${res.status}`);
      }

      const json = text ? JSON.parse(text) : null;

      const updated: NoticeForEdit = {
        ...notice,
        ...json,
        title: json?.title ?? trimmed_title,
        content: json?.content ?? trimmed_content,
      };

      on_success(updated);
      on_close();
    } catch (e: any) {
      set_error(e?.message || "공지 수정에 실패했습니다.");
    } finally {
      set_is_submitting(false);
    }
  };

  const handle_cancel = () => {
    if (!is_submitting) {
      on_close();
    }
  };

  return {
    title,
    set_title,
    content,
    set_content,
    is_submitting,
    error,
    handle_submit,
    handle_cancel,
  };
};

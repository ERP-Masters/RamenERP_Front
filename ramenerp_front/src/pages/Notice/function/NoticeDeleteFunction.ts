// src/pages/Notice/function/NoticeDeleteFunction.ts
export const delete_notice = async (id: number): Promise<void> => {
  const res = await fetch(`/api/notice/${id}`, {
    method: "DELETE",
    headers: {
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    let message = "";
    try {
      message = await res.text();
    } catch {
      // ignore
    }
    throw new Error(message || `공지 삭제 실패 (HTTP ${res.status})`);
  }
};

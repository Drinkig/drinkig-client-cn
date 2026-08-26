import client from "./client";

export type ContentReportType = "REVIEW" | "PRICE" | "COMMENT" | "OTHER";

export interface ReportCreateRequest {
  type: ContentReportType;
  targetId?: number | null;
  targetSummary?: string | null;
  reason?: string | null;
}

// 리뷰/가격 정보 등 콘텐츠 신고 접수 — 어드민에서 조회/처리된다
export const submitReport = async (
  request: ReportCreateRequest
): Promise<void> => {
  await client.post("/report", request);
};

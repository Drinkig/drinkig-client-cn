import { Alert, Platform } from "react-native";
import i18n from "../i18n";
import { submitReport } from "../api/report";

type ReportType = "REVIEW" | "PRICE";

interface ReportData {
  // Review Report Data
  writerName?: string;
  reviewDate?: string;
  reviewContent?: string;

  // Price Report Data
  vintage?: string;
  shopName?: string;
  price?: number;
  purchaseDate?: string;
}

// 어드민이 신고 시점의 대상을 식별할 수 있도록 남기는 스냅샷 (서버 500자 제한)
const buildTargetSummary = (type: ReportType, data: ReportData): string => {
  if (type === "REVIEW") {
    return [
      `작성자: ${data.writerName || "-"}`,
      `작성일: ${data.reviewDate || "-"}`,
      `내용: ${(data.reviewContent || "").substring(0, 150)}`,
    ].join(" / ");
  }
  return [
    `빈티지: ${data.vintage || "NV"}`,
    `구매처: ${data.shopName || "-"}`,
    `가격: ${data.price != null ? `${data.price.toLocaleString()}원` : "-"}`,
    `구매일: ${data.purchaseDate || "-"}`,
  ].join(" / ");
};

// 리뷰/가격 정보 신고 — 사유 입력(선택) 확인 후 서버로 접수한다.
// (이메일 작성 방식에서 전환: 신고가 서버에 쌓여 어드민에서 처리 상태를 관리한다)
export const sendContentReport = (
  type: ReportType,
  data: ReportData,
  callbacks?: { onSuccess?: () => void; onError?: () => void }
) => {
  const title = i18n.t(
    type === "REVIEW" ? "contentReport.reviewTitle" : "contentReport.priceTitle"
  );

  const submit = async (reason?: string) => {
    try {
      await submitReport({
        type,
        targetSummary: buildTargetSummary(type, data).substring(0, 500),
        reason: reason?.trim() ? reason.trim().substring(0, 500) : null,
      });
      callbacks?.onSuccess?.();
    } catch (error) {
      console.error("Failed to submit report:", error);
      callbacks?.onError?.();
    }
  };

  if (Platform.OS === "ios") {
    // iOS는 사유를 바로 입력받는다
    Alert.prompt(
      title,
      i18n.t("contentReport.promptMessage"),
      [
        { text: i18n.t("contentReport.cancel"), style: "cancel" },
        {
          text: i18n.t("contentReport.submit"),
          style: "destructive",
          onPress: (reason?: string) => submit(reason),
        },
      ],
      "plain-text"
    );
    return;
  }

  // Android는 Alert.prompt 미지원 — 확인만 받고 접수
  Alert.alert(title, i18n.t("contentReport.confirmMessage"), [
    { text: i18n.t("contentReport.cancel"), style: "cancel" },
    {
      text: i18n.t("contentReport.submit"),
      style: "destructive",
      onPress: () => submit(),
    },
  ]);
};

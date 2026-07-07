import { Platform } from "react-native";
import {
  initConnection,
  purchaseUpdatedListener,
  purchaseErrorListener,
  finishTransaction,
  SubscriptionPurchase,
  PurchaseError,
} from "react-native-iap";
import { verifyReceipt } from "../api/subscription";

// IAP 연결과 구매 리스너를 앱 수명주기 동안 1회만 전역 등록한다.
// PaywallScreen 마운트 중에만 리스너가 살아있으면, 결제 직후 강제종료·
// Ask to Buy·네트워크 단절로 Apple이 거래를 재전송해도 받지 못해
// "돈은 나갔는데 프리미엄이 안 됨" 상태가 된다. (등록처: SubscriptionContext)

type PurchaseUiHandlers = {
  onSuccess?: () => void;
  onVerifyFailed?: () => void;
  onError?: (error: PurchaseError) => void;
};

let listenersRegistered = false;
let connectionReady = false;
let uiHandlers: PurchaseUiHandlers = {};
let onPurchaseVerified: (() => void | Promise<void>) | null = null;

// Paywall 등 화면이 마운트 중일 때만 토스트/스피너 해제 등 UI 피드백을 받는다.
export const setPurchaseUiHandlers = (
  handlers: PurchaseUiHandlers | null
): void => {
  uiHandlers = handlers ?? {};
};

export const ensureIapConnection = async (): Promise<boolean> => {
  if (Platform.OS !== "ios") return false;
  if (connectionReady) return true;
  try {
    await initConnection();
    connectionReady = true;
    return true;
  } catch (error) {
    console.warn("IAP not available (simulator or unsupported device):", error);
    return false;
  }
};

export const initIap = async (
  onVerified: () => void | Promise<void>
): Promise<void> => {
  // 항상 최신 콜백으로 갱신 (refreshSubscription 아이덴티티 변경 대응)
  onPurchaseVerified = onVerified;

  if (listenersRegistered) return;
  const ok = await ensureIapConnection();
  if (!ok) return; // 다음 initIap 호출에서 재시도
  listenersRegistered = true;

  purchaseUpdatedListener(async (purchase: SubscriptionPurchase) => {
    try {
      const transactionId = purchase.transactionId || "";
      const originalTransactionId =
        purchase.originalTransactionIdentifierIOS || transactionId;

      const verifyResult = await verifyReceipt(
        transactionId,
        originalTransactionId,
        purchase.productId
      );

      // 서버(Apple) 검증이 실패하면 거래를 finish하지 않고 에러 처리
      // (finish하지 않으면 Apple이 거래를 재전송하므로 추후 재검증 가능)
      if (!verifyResult?.result?.success) {
        throw new Error(verifyResult?.message || "verification failed");
      }

      await finishTransaction({ purchase, isConsumable: false });
      await onPurchaseVerified?.();
      uiHandlers.onSuccess?.();
    } catch (error) {
      console.error("Purchase verification failed:", error);
      uiHandlers.onVerifyFailed?.();
    }
  });

  purchaseErrorListener((error: PurchaseError) => {
    uiHandlers.onError?.(error);
  });
};

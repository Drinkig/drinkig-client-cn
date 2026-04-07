import client from './client';

export interface SubscriptionFeatures {
  unlimitedScan: boolean;
  wineCompatibility: boolean;
  foodPairing: boolean;
  tasteReset: boolean;
}

export interface SubscriptionStatusResponse {
  isSuccess: boolean;
  code: string;
  message: string;
  result: {
    plan: 'FREE' | 'MONTHLY' | 'YEARLY';
    status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'GRACE_PERIOD';
    expiresAt: string | null;
    platform: 'APPLE' | 'PROMO' | null;
    isPremium: boolean;
    features: SubscriptionFeatures;
  };
}

export interface VerifyReceiptResponse {
  isSuccess: boolean;
  code: string;
  message: string;
  result: {
    success: boolean;
    plan: string;
    expiresAt: string;
  };
}

export interface RestoreResponse {
  isSuccess: boolean;
  code: string;
  message: string;
  result: {
    success: boolean;
    plan: string;
    expiresAt: string;
  };
}

export interface RedeemPromoResponse {
  isSuccess: boolean;
  code: string;
  message: string;
  result: {
    success: boolean;
    plan: string;
    expiresAt: string;
    message: string;
  };
}

export interface ScanRemainingResponse {
  isSuccess: boolean;
  code: string;
  message: string;
  result: {
    remaining: number;
    limit: number;
    isUnlimited: boolean;
  };
}

export interface ScanUseResponse {
  isSuccess: boolean;
  code: string;
  message: string;
  result: {
    success: boolean;
    remaining: number;
  };
}

export const getSubscriptionStatus = async () => {
  const response = await client.get<SubscriptionStatusResponse>('/subscription/status');
  return response.data;
};

export const verifyReceipt = async (transactionId: string, originalTransactionId: string, productId: string) => {
  const response = await client.post<VerifyReceiptResponse>('/subscription/verify-receipt', {
    transactionId,
    originalTransactionId,
    productId,
  });
  return response.data;
};

export const restoreSubscription = async (originalTransactionId: string) => {
  const response = await client.post<RestoreResponse>('/subscription/restore', {
    originalTransactionId,
  });
  return response.data;
};

export const redeemPromoCode = async (code: string) => {
  const response = await client.post<RedeemPromoResponse>('/promo/redeem', {
    code,
  });
  return response.data;
};

export const getScanRemaining = async () => {
  const response = await client.get<ScanRemainingResponse>('/scan/remaining');
  return response.data;
};

export const useScan = async () => {
  const response = await client.post<ScanUseResponse>('/scan/use');
  return response.data;
};

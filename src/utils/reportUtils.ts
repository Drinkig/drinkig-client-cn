import { Linking, Alert, Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';

type ReportType = 'REVIEW' | 'PRICE';

interface ReportData {
    // Review Report Data
    reviewId?: string;
    writerName?: string;
    reviewDate?: string;
    reviewContent?: string;

    // Price Report Data
    priceId?: number;
    vintage?: string;
    shopName?: string;
    price?: number;
    purchaseDate?: string;
}

export const sendReportEmail = async (type: ReportType, data: ReportData) => {
    const email = 'drinkeasyy@gmail.com';
    const subject = `[신고] ${type === 'REVIEW' ? '리뷰' : '가격 정보'} 신고`;

    let body = '';
    const commonInfo = `
-------------------
Device: ${DeviceInfo.getModel()}
OS: ${DeviceInfo.getSystemName()} ${DeviceInfo.getSystemVersion()}
App Version: ${DeviceInfo.getVersion()}
-------------------
`;

    if (type === 'REVIEW') {
        body = `
신고 사유를 작성해 주세요:
(여기에 내용을 작성해 주세요)

-------------------
[신고 대상 리뷰 정보]
작성자: ${data.writerName}
작성일: ${data.reviewDate}
내용 일부: ${data.reviewContent?.substring(0, 50)}...
-------------------
${commonInfo}
`;
    } else if (type === 'PRICE') {
        body = `
신고 사유를 작성해 주세요 (예: 가격 부정확, 판매처 폐업 등):
(여기에 내용을 작성해 주세요)

-------------------
[신고 대상 가격 정보]
빈티지: ${data.vintage || 'NV'}
구매처: ${data.shopName || '정보 없음'}
가격: ${data.price?.toLocaleString()}원
구매일: ${data.purchaseDate}
-------------------
${commonInfo}
`;
    }

    const url = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    try {
        const supported = await Linking.canOpenURL(url);
        if (supported) {
            await Linking.openURL(url);
        } else {
            Alert.alert('알림', '메일 앱을 열 수 없습니다.');
        }
    } catch (error) {
        console.error('Failed to open email:', error);
        Alert.alert('오류', '메일 앱을 실행하는 중 문제가 발생했습니다.');
    }
};

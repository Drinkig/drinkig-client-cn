import React from 'react';
import { View, Platform } from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';
import Config from 'react-native-config';

// 개발 중에는 Test ID, 배포 시에는 .env의 실제 ID를 사용합니다.
const adUnitId = __DEV__
    ? TestIds.BANNER
    : Platform.select({
        ios: Config.ADMOB_BANNER_ID_IOS || TestIds.BANNER,
        android: TestIds.BANNER,
        default: TestIds.BANNER,
    });

interface AdBannerProps {
    style?: any;
}

const AdBanner: React.FC<AdBannerProps> = ({ style }) => {
    return (
        <View style={[{ alignItems: 'center', justifyContent: 'center', marginVertical: 10 }, style]}>
            <BannerAd
                unitId={adUnitId}
                size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
                requestOptions={{
                    requestNonPersonalizedAdsOnly: true,
                }}
            />
        </View>
    );
};

export default AdBanner;

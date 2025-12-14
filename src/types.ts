import { WineDBItem } from './data/dummyWines';
import { MyWine } from './context/WineContext';

export type RootStackParamList = {
  Login: undefined;
  Onboarding: undefined; // 온보딩 화면
  RecommendationResult: undefined; // 온보딩 결과 추천 화면
  Main: undefined;
  ProfileEdit: undefined; // 프로필 수정 화면
  Setting: undefined; // 설정 화면
  WineAdd: { wine?: any } | undefined; // 와인 등록 화면 (초기 데이터 전달 가능)
  Notification: undefined; // 알림 화면
  Wishlist: undefined; // 위시리스트 화면 (NEW)
  Search: undefined; // 검색 화면
  SearchResult: { searchKeyword: string }; // 검색 결과 화면
  WineDetail: { wine: WineDBItem | MyWine }; // 와인 상세 화면 (DB 정보)
  MyWineDetail: { wineId: number }; // 내 와인 상세 화면 (API 연동)
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}

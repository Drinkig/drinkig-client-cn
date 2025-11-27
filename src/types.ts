import { WineDBItem } from './data/dummyWines';
import { MyWine } from './context/WineContext';

export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
  ProfileEdit: undefined; // 프로필 수정 화면
  Setting: undefined; // 설정 화면
  WineAdd: undefined; // 와인 등록 화면
  Notification: undefined; // 알림 화면
  Search: undefined; // 검색 화면
  WineDetail: { wine: WineDBItem | MyWine }; // 와인 상세 화면 (DB 정보)
  MyWineDetail: { wine: MyWine }; // 내 와인 상세 화면 (내 기록)
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}

import { WineDBItem } from './types/Wine';
import { MyWine } from './context/WineContext';

export type RootStackParamList = {
  Login: undefined;
  Onboarding: undefined;
  RecommendationResult: undefined;
  Main: undefined;
  ProfileEdit: undefined;
  Setting: undefined;
  WineAdd: { wine?: any } | undefined;
  Notification: undefined;
  Wishlist: undefined;
  Search: { returnScreen?: keyof RootStackParamList } | undefined;
  WineSearch: { returnScreen?: keyof RootStackParamList } | undefined;
  SearchResult: { searchKeyword: string; returnScreen?: keyof RootStackParamList };
  WineDetail: { wine: WineDBItem | MyWine };
  MyWineDetail: { wineId: number };
  TastingNoteWrite: { wineId?: number; wineName?: string; wineImage?: string; wineType?: string } | undefined;
  TastingNoteDetail: { tastingNoteId: number };
  WithdrawRetention: { authType: string };
  WithdrawReason: { authType: string };
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList { }
  }
}

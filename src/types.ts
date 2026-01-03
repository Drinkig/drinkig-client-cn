import { WineDBItem } from './types/Wine';
import { MyWine } from './context/WineContext';

export type RootStackParamList = {
  Login: undefined;
  EmailLogin: undefined;
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
  MyWineDetail: { wineId: number; wineImageUrl?: string };
  TastingNoteWrite: { wineId?: number; wineName?: string; wineImage?: string; wineType?: string } | undefined;
  TastingNoteDetail: { tastingNoteId: number };
  WithdrawRetention: { authType: string };
  WithdrawReason: { authType: string };
  PlaceSelection: { place?: 'RESTAURANT' | 'SHOP' } | undefined;
  FoodSelection: { place: 'RESTAURANT' | 'SHOP'; country?: string };
  CountrySelection: { place: 'RESTAURANT' };
  FoodPairingResult: { place: 'RESTAURANT' | 'SHOP'; foodId?: number; foodName?: string; country?: string };
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList { }
  }
}

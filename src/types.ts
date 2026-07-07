import { WineDBItem } from "./types/Wine";
import { MyWine } from "./context/WineContext";

export type RootStackParamList = {
  Login: undefined;

  Onboarding: undefined;
  OnboardingResult: { flavorProfile?: any; nickname?: string } | undefined;
  RecommendationResult:
    | { flavorProfile?: any; nickname?: string; fromReset?: boolean }
    | undefined;
  TasteReset: undefined;
  Main: undefined;
  ProfileEdit: undefined;
  Setting: undefined;
  WineAdd: { wine?: any } | undefined;
  Notification: undefined;
  Wishlist: undefined;
  Search: { returnScreen?: keyof RootStackParamList } | undefined;
  SearchResult: {
    searchKeyword: string;
    returnScreen?: keyof RootStackParamList;
  };
  WineDetail: { wine: WineDBItem | MyWine };
  MyWineDetail: { wineId: number; wineImageUrl?: string };
  TastingNoteWrite:
    | {
        wineId?: number;
        wineName?: string;
        wineImage?: string;
        wineType?: string;
      }
    | undefined;
  TastingNoteDetail: { tastingNoteId: number };
  WithdrawRetention: { authType: string };
  WithdrawReason: { authType: string };
  SommelierChat: undefined;
  RecommendationList:
    | { flavorProfile?: any; nickname?: string; fromReset?: boolean }
    | undefined;
  Paywall: undefined;
  PremiumWelcome: undefined;
  WineRegister: undefined;
  AdminWineApproval: undefined;
  Camera: { scanType?: "label" | "list" } | undefined;
  MenuScanResult: { imageUri: string; scanType?: "label" | "list" };
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}

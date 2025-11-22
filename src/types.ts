export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
  ProfileEdit: undefined; // 프로필 수정 화면
  Setting: undefined; // 설정 화면 추가
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}

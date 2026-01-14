import analytics from "@react-native-firebase/analytics";

export const logEvent = (eventName: string, params?: any) => {
  analytics().logEvent(eventName, params);
};

export const logScreen = (screen_name: string, screen_class?: string) => {
  analytics().logScreenView({ screen_name, screen_class });
};

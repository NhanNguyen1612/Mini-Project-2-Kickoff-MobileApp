import type { NavigatorScreenParams } from '@react-navigation/native';

export type MainTabParamList = {
  BrowseRooms: undefined;
  MyBookings: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList>;
  RoomDetail: { roomId: string };
};

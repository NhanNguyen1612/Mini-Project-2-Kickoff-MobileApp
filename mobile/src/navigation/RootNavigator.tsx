import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { MainTabs } from './MainTabs';
import { RoomDetailScreen } from '../screens/RoomDetailScreen';
import { AuthScreen } from '../screens/AuthScreen';
import { useBookingStore } from '../store/useBookingStore';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  const { isAuthenticated } = useBookingStore();

  return (
    <Stack.Navigator
      screenOptions={{
        headerBackTitle: 'Quay lại',
        headerTintColor: '#1E293B',
        headerTitleStyle: {
          fontWeight: '700',
        },
      }}
    >
      {!isAuthenticated ? (
        // Khi chưa đăng nhập -> Màn hình Đăng nhập / Đăng ký
        <Stack.Screen
          name="Auth"
          component={AuthScreen}
          options={{ headerShown: false }}
        />
      ) : (
        // Khi đã đăng nhập -> Vào giao diện chính của ứng dụng
        <>
          <Stack.Screen
            name="MainTabs"
            component={MainTabs}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="RoomDetail"
            component={RoomDetailScreen}
            options={{
              title: 'Chi Tiết Phòng Học',
              headerBackTitle: 'Danh sách',
            }}
          />
        </>
      )}
    </Stack.Navigator>
  );
};

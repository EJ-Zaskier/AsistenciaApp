import { Stack } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';

export default function Layout() {
  const router = useRouter();
  const pathname = usePathname();

  const isLoginScreen = pathname === '/login';

  return (
    <Stack
      screenOptions={{
        headerShown: !isLoginScreen,
        headerTitle: '',
        headerStyle: {
          backgroundColor: isLoginScreen ? 'transparent' : '#7697a0',
        },
        headerShadowVisible: false,
        headerLeft: () => {
          if (isLoginScreen) {
            return null;
          }
          return (
            <TouchableOpacity 
              onPress={() => router.back()}
              style={{ marginLeft: 8 }}
            >
              <MaterialIcons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
          );
        },
        contentStyle: { 
          backgroundColor: isLoginScreen ? 'transparent' : '#7697a0' 
        },
      }}
    />
  );
  }
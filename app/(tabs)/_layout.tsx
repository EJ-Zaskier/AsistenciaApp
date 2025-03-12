import { Stack } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import { StatusBar } from 'react-native';

export default function Layout() {
  const router = useRouter();
  const pathname = usePathname();

  const isLoginScreen = pathname === '/login';

  return (
    <Stack
      screenOptions={{
        headerShown: false, // Hide the header
        contentStyle: { 
          backgroundColor: 'transparent' // Make the background transparent
        },
      }}
    />
  );
}
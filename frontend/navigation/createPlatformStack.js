import { Platform } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

export function createPlatformStack() {
  if (Platform.OS === 'web') {
    const Stack = createStackNavigator();
    return Stack;
  }

  const NativeStack = createNativeStackNavigator();
  return NativeStack;
}

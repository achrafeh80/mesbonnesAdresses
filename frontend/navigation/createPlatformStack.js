// navigation/createPlatformStack.js
import { Platform } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

export function createPlatformStack() {
  // Sur web, on utilise le stack "JS" (createStackNavigator).
  if (Platform.OS === 'web') {
    const Stack = createStackNavigator();
    return Stack;
  }

  // Sur iOS/Android, on utilise le native stack pour de meilleures perfs.
  const NativeStack = createNativeStackNavigator();
  return NativeStack;
}

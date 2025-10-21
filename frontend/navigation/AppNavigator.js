import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MyAddressesStack from './MyAddressesStack';
import PublicAddressesStack from './PublicAddressesStack';
import MapScreen from '../screens/MapScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { Ionicons } from '@expo/vector-icons';

const Tab = createBottomTabNavigator();

export default function AppNavigator() {
  return (
    <Tab.Navigator initialRouteName="Map">
      <Tab.Screen name="Map" component={MapScreen} options={{ tabBarIcon: ({ color, size }) => <Ionicons name="map" color={color} size={size} /> }} />
      <Tab.Screen name="MyAddressesTab" component={MyAddressesStack} options={{ title: 'My Addresses', tabBarIcon: ({ color, size }) => <Ionicons name="list" color={color} size={size} /> }} />
      <Tab.Screen name="PublicAddressesTab" component={PublicAddressesStack} options={{ title: 'Public Addresses', tabBarIcon: ({ color, size }) => <Ionicons name="people" color={color} size={size} /> }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarIcon: ({ color, size }) => <Ionicons name="person" color={color} size={size} /> }} />
    </Tab.Navigator>
  );
}

import React from 'react';
import PublicAddressesScreen from '../screens/PublicAddressesScreen';
import AddressDetailScreen from '../screens/AddressDetailScreen';
import { createPlatformStack } from './createPlatformStack';

const Stack = createPlatformStack();

export default function PublicAddressesStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="PublicAddresses" component={PublicAddressesScreen} options={{ title: 'Public Addresses' }} />
      <Stack.Screen name="AddressDetail" component={AddressDetailScreen} options={{ title: 'Address Detail' }} />
    </Stack.Navigator>
  );
}

import React from 'react';
import MyAddressesScreen from '../screens/MyAddressesScreen';
import CreateAddressScreen from '../screens/CreateAddressScreen';
import AddressDetailScreen from '../screens/AddressDetailScreen';
import { createPlatformStack } from './createPlatformStack';

const Stack = createPlatformStack();

export default function MyAddressesStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="MyAddresses" component={MyAddressesScreen} options={{ title: 'My Addresses' }} />
      <Stack.Screen name="CreateAddress" component={CreateAddressScreen} options={{ title: 'New Address' }} />
      <Stack.Screen name="AddressDetail" component={AddressDetailScreen} options={{ title: 'Address Detail' }} />
    </Stack.Navigator>
  );
}

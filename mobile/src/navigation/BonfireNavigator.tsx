import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { BonfireScreen } from '../screens/BonfireScreen';

const Stack = createStackNavigator();

export const BonfireNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="BonfireRoot" component={BonfireScreen} />
    </Stack.Navigator>
  );
};

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { COLORS } from '../constants/colors';
import { Compass, Flame, Map, Mountain } from 'lucide-react-native';
import { HomeNavigator } from './HomeNavigator';
import { BonfireNavigator } from './BonfireNavigator';
import { LogbookScreen } from '../screens/LogbookScreen';
import { BasecampScreen } from '../screens/BasecampScreen';

const Tab = createBottomTabNavigator();

const TabIcon = ({ icon: Icon, color, size, label, focused }: any) => (
  <View style={tabIconStyles.container}>
    <View style={[tabIconStyles.iconWrap, focused && { backgroundColor: COLORS.primaryGlow }]}>
      <Icon color={color} size={size - 2} strokeWidth={focused ? 2.5 : 1.8} />
    </View>
    <Text style={[tabIconStyles.label, { color }]}>{label}</Text>
  </View>
);

const tabIconStyles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', paddingTop: 4 },
  iconWrap: {
    width: 36, height: 36, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  label: { fontSize: 10, fontWeight: '700', marginTop: 2, letterSpacing: 0.3 },
});

export const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0D1829',
          borderTopColor: COLORS.border,
          height: 72,
          paddingBottom: 8,
          paddingTop: 4,
          borderTopWidth: 1,
          elevation: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.3,
          shadowRadius: 12,
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeNavigator}
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon icon={Compass} color={color} size={size} label="Quests" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Bonfire"
        component={BonfireNavigator}
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon icon={Flame} color={color} size={size} label="Bonfire" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Logbook"
        component={LogbookScreen}
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon icon={Map} color={color} size={size} label="Logbook" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Basecamp"
        component={BasecampScreen}
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon icon={Mountain} color={color} size={size} label="Basecamp" focused={focused} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

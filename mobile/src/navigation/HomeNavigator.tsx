import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { HomeScreen } from '../screens/HomeScreen';
import { GenerateQuestsScreen } from '../screens/GenerateQuestsScreen';
import { QuestDetailScreen } from '../screens/QuestDetailScreen';
import { CompleteQuestScreen } from '../screens/CompleteQuestScreen';

const Stack = createStackNavigator();

export const HomeNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeRoot" component={HomeScreen} />
      <Stack.Screen name="GenerateQuests" component={GenerateQuestsScreen} />
      <Stack.Screen name="QuestDetail" component={QuestDetailScreen} />
      <Stack.Screen name="CompleteQuest" component={CompleteQuestScreen} />
    </Stack.Navigator>
  );
};

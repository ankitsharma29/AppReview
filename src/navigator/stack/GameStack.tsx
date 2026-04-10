import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import GameList from '../../screens/GameList/GameList';
const Stack = createNativeStackNavigator();
const GameStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
      initialRouteName="GameList"
    >
      <Stack.Screen name="GameList" component={GameList} />
    </Stack.Navigator>
  );
};

export default GameStack;

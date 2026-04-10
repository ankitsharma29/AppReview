import React, { useState, useRef, useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Shorts from '../../screens/Shorts/Shorts';
const Stack = createNativeStackNavigator();
const ShortsStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
      initialRouteName="Shorts"
    >
      <Stack.Screen name="Shorts" component={Shorts} />
    </Stack.Navigator>
  );
};

export default ShortsStack;

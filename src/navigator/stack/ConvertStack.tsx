import React, { useState, useRef, useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Shorts from '../../screens/Shorts/Shorts';
import Content from '../../screens/Convert/Content';
const Stack = createNativeStackNavigator();
const ConvertStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
      initialRouteName="Content"
    >
      <Stack.Screen name="Content" component={Content} />
    </Stack.Navigator>
  );
};

export default ConvertStack;

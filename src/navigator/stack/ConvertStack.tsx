import React, { useState, useRef, useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Shorts from '../../screens/Shorts/Shorts';
import Content from '../../screens/Convert/Content';
import PdfResizeScreen from '../../screens/Convert/PdfResizeScreen';
import ImageResizeScreen from '../../screens/Convert/ImageResizeScreen';
import Convert from '../../screens/Convert/Convert';
const Stack = createNativeStackNavigator();
const ConvertStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
      initialRouteName="Convert"
    >
      <Stack.Screen name="Convert" component={Convert} />
      <Stack.Screen name="Content" component={Content} />
      <Stack.Screen name="ImageResizeScreen" component={ImageResizeScreen} />
      <Stack.Screen name="PdfResizeScreen" component={PdfResizeScreen} />
    </Stack.Navigator>
  );
};

export default ConvertStack;

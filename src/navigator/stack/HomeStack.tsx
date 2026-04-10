import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../../screens/Home/HomeScreen';
import ProfileScreen from '../../screens/Profile/ProfileScreen';
import PageWindow from '../../screens/PageWindow/PageWindow';
import WebViewWindow from '../../screens/WebViewWindow/WebViewWindow';
import WebViewPage from '../../components/WebViewPage';
import TodoApp from '../../screens/Todos/Todo';
import TodoFireStore from '../../screens/Todos/TodoFireStore';
import GameList from '../../screens/GameList/GameList';
import AdsList from '../../screens/PromoBanner/AdsList';
import HistoryScreen from '../../screens/History/HistoryScreen';
import Shorts from '../../screens/Shorts/Shorts';
import PhoneSignIn from '../../screens/Todos/PhoneLogin';
const Stack = createNativeStackNavigator();
const HomeStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
      initialRouteName="Home"
    >
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="PageWindow" component={PageWindow} />
      <Stack.Screen name="WebViewWindow" component={WebViewWindow} />
      <Stack.Screen name="WebViewPage" component={WebViewPage} />
      <Stack.Screen name="TodoApp" component={TodoApp} />
      <Stack.Screen name="TodoFireStore" component={TodoFireStore} />
      <Stack.Screen name="PhoneSignIn" component={PhoneSignIn} />
      <Stack.Screen name="GameList" component={GameList} />
      <Stack.Screen name="AdsList" component={AdsList} />
      <Stack.Screen name="HistoryScreen" component={HistoryScreen} />
      <Stack.Screen name="Shorts" component={Shorts} />
    </Stack.Navigator>
  );
};

export default HomeStack;

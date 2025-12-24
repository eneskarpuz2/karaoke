import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Home from '../screens/Home';
import Output from '../screens/Output';
import OnboardingSwiper from '../screens/Onboarding';
import Onboarding from '../screens/Onboarding';

const Stack = createNativeStackNavigator();

const AppStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName={'Onboarding'}
    >
      <Stack.Screen
        options={{ headerShown: false }}
        name="Onboarding"
        component={Onboarding}
      />
      <Stack.Screen
        options={{ headerShown: false }}
        name="Home"
        component={Home}
      />
      <Stack.Screen
        options={{ headerShown: true }}
        name="Output"
        component={Output}
      />
    </Stack.Navigator>
  );
};

const RootNavigation = () => {
  return (
    <NavigationContainer>
      <StatusBar
        barStyle={'light-content'}
        translucent
        backgroundColor={'#000'}
      />
      <AppStack />
    </NavigationContainer>
  );
};

export default RootNavigation;

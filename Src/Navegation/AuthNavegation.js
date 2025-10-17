import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import IniciarSession from '../../Screen/Auth/iniciarSession';

const Stack = createNativeStackNavigator();

export default function AuthNavegation() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="IniciarSession" 
        component={IniciarSession} 
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}


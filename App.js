import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { navigationRef } from './Src/Services/NavegationService';
import InicioStack from './Screen/inicio/inicio';
import CitasStack from './Src/Navegation/Stack/CitasStack';
import PacientesStack from './Src/Navegation/Stack/PacientesStack';
import MedicosStack from './Src/Navegation/Stack/MedicosStack';
import horariosDisponiblesStack from './Src/Navegation/Stack/horariosDisponiblesStack';
import EspecialidadesStack from './Src/Navegation/Stack/EspecialidadesStack'

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator>
        <Stack.Screen name="InicioStack" component={InicioStack} options={{ headerShown: false }} />
        <Stack.Screen name="CitasStack" component={CitasStack} options={{ headerShown: false }} />
        <Stack.Screen name="PacientesStack" component={PacientesStack} options={{ headerShown: false }} />
        <Stack.Screen name="MedicosStack" component={MedicosStack} options={{ headerShown: false }} />
        <Stack.Screen name="horariosDisponiblesStack" component={horariosDisponiblesStack} options={{ headerShown: false }} />
        <Stack.Screen name="EspecialidadesStack" component={EspecialidadesStack} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

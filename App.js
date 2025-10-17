import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
// import * as Notifications from 'expo-notifications'; // Comentado temporalmente para Expo Go
import { navigationRef } from './Src/Services/NavegationService';
import InicioStack from './Screen/inicio/inicio';
import CitasStack from './Src/Navegation/Stack/CitasStack';
import PacientesStack from './Src/Navegation/Stack/PacientesStack';
import MedicosStack from './Src/Navegation/Stack/MedicosStack';
import horariosDisponiblesStack from './Src/Navegation/Stack/horariosDisponiblesStack';
import EspecialidadesStack from './Src/Navegation/Stack/EspecialidadesStack';
import AdminStack from './Src/Navegation/Stack/AdminStack';
import Crear_EditarCitas from './Screen/Citas/Crear_EditarCitas';
import Perfil from './Screen/inicio/perfil';

const Stack = createNativeStackNavigator();

export default function App() {

  useEffect(() => {
  // Código de notificaciones comentado temporalmente para Expo Go
  // Las notificaciones push no funcionan en Expo Go SDK 53+
  // Para usar notificaciones, necesitas crear un development build
  
  /*
  Notifications.setNotificationHandler({
    handleNotification: async () => {
      return {
        shouldShowAlert: true, // muestra notificación como alerta
        shouldShowBanner: true, // muestra notificación como banner en la parte superior
        shouldPlaySound: true, // reproduce sonido
        shouldSetBadge: false, // NO cambia icono de notificación
      };
    },
  });

  const getPermisos = async () =>{
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      alert('Se requieren permisos para recibir notificaciones');
    }
  }
  getPermisos();
  */

}, []);

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator>
        <Stack.Screen name="InicioStack" component={InicioStack} options={{ headerShown: false }} />
        <Stack.Screen name="CitasStack" component={CitasStack} options={{ headerShown: false }} />
        <Stack.Screen name="PacientesStack" component={PacientesStack} options={{ headerShown: false }} />
        <Stack.Screen name="MedicosStack" component={MedicosStack} options={{ headerShown: false }} />
        <Stack.Screen name="horariosDisponiblesStack" component={horariosDisponiblesStack} options={{ headerShown: false }} />
        <Stack.Screen name="EspecialidadesStack" component={EspecialidadesStack} options={{ headerShown: false }} />
        <Stack.Screen name="AdminStack" component={AdminStack} options={{ headerShown: false }} />
        <Stack.Screen name="Perfil" component={Perfil} options={{ headerShown: false }} />
        <Stack.Screen name="Crear_EditarCitas" component={Crear_EditarCitas} options={{ title: "Crear/Editar Cita" }}/>
      </Stack.Navigator>
    </NavigationContainer>
  );
}
import React, { useState, useEffect } from 'react';
import { View, Text, Switch, Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

export default function Configuracion() {
  const [permisoNotificaciones, setPermisoNotificaciones] = useState(false);
  const [loading, setLoading] = useState(true);

  //  Verificar permisos y preferencias guardadas
  const checkPermisos = async () => {
    const { status } = await Notifications.getPermissionsAsync(); // ← corregido: es getPermissionsAsync()
    const preferencia = await AsyncStorage.getItem('notificaciones_activas');
    setPermisoNotificaciones(status === 'granted' && preferencia === 'true');
    setLoading(false);
  };

  //  Cargar al iniciar
  useEffect(() => {
    checkPermisos();
  }, []);

  //  Cargar al volver a enfocar la pantalla
  useFocusEffect(
    React.useCallback(() => {
      checkPermisos();
    }, [])
  );

  //  Cambiar estado del switch y guardar preferencia
  const toggleSwitch = async (valor) => {
    if (valor) {
      const { status } = await Notifications.requestPermissionsAsync(); // solicitar permiso si no está dado
      if (status === 'granted') {
        await AsyncStorage.setItem('notificaciones_activas', 'true');
        setPermisoNotificaciones(true);
      } else {
        Alert.alert('Permiso denegado', 'No puedes activar las notificaciones sin permiso.');
      }
    } else {
      await AsyncStorage.setItem('notificaciones_activas', 'false'); 
      setPermisoNotificaciones(false);
      Alert.alert('Notificaciones desactivadas');
    }
  };

  //  Ejemplo de programación de notificación
  const programarNotificacion = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    const preferencia = await AsyncStorage.getItem('notificaciones_activas');

    if (status !== 'granted' || preferencia !== 'true') {
      Alert.alert('No tienes permisos para recibir notificaciones');
      return;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Recordatorio',
        body: 'Esta es una notificación programada correctamente.',
      },
      trigger: { seconds: 5 },
    });

    Alert.alert('Notificación programada en 5 segundos');
  };

  //  Interfaz básica
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Notificaciones: {permisoNotificaciones ? 'Activadas' : 'Desactivadas'}</Text>
      <Switch value={permisoNotificaciones} onValueChange={toggleSwitch} />
      <Text onPress={programarNotificacion} style={{ marginTop: 20, color: 'blue' }}>
        Programar notificación de prueba
      </Text>
    </View>
  );
}
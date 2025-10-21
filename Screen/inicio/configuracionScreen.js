import React, { useState, useEffect } from 'react';
import { View, Text, Switch, Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

export default function Configuracion() {
  const [permisoNotificaciones, setPermisoNotificaciones] = useState(false);

  const checkPermisos = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    const preferencia = await AsyncStorage.getItem('notificaciones_activas');
    setPermisoNotificaciones(status === 'granted' && preferencia === 'true');
  };

  useEffect(() => {
    checkPermisos();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      checkPermisos();
    }, [])
  );

  const toggleSwitch = async (valor) => {
    if (valor) {
      const { status } = await Notifications.requestPermissionsAsync();
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
import React, { createContext, useContext, useEffect, useState } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const NotificationContext = createContext();

export const useNotificationContext = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationContext debe ser usado dentro de NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [settings, setSettings] = useState({
    appointmentReminders: true,
    appointmentUpdates: true,
    userNotifications: true,
    scheduleNotifications: true,
    specialtyNotifications: true,
  });

  useEffect(() => {
    initializeNotifications();
    loadSettings();
    setupNotificationListeners();
  }, []);

  const initializeNotifications = async () => {
    try {
      
      const { status } = await Notifications.requestPermissionsAsync();
      
      if (status !== 'granted') {
        setPermissionsGranted(false);
        setIsInitialized(true);
        return;
      }


      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Notificaciones Médicas',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
          description: 'Notificaciones para citas médicas y administración',
        });
      }

      setPermissionsGranted(true);
      setIsInitialized(true);
    } catch (error) {
      console.error('❌ Error inicializando notificaciones:', error);
      setPermissionsGranted(false);
      setIsInitialized(true);
    }
  };

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('notificationSettings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error('Error cargando configuración:', error);
    }
  };

  const saveSettings = async (newSettings) => {
    try {
      await AsyncStorage.setItem('notificationSettings', JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('Error guardando configuración:', error);
    }
  };

  const setupNotificationListeners = () => {
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
    });

    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      handleNotificationResponse(response);
    });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener);
      Notifications.removeNotificationSubscription(responseListener);
    };
  };

  const handleNotificationResponse = (response) => {
    const { type, appointmentId, userId, specialtyId, scheduleId } = response.notification.request.content.data;
    
    switch (type) {
      case 'appointment_reminder':
      case 'appointment_soon':
      case 'appointment_created':
      case 'appointment_updated':
      case 'appointment_cancelled':
        break;
      case 'user_created':
      case 'user_deleted':
        break;
      case 'schedule_created':
        break;
      case 'specialty_created':
        break;
      default:
    }
  };

  const scheduleAppointmentReminder = async (appointmentData) => {
    if (!permissionsGranted || !settings.appointmentReminders) return false;
    
    try {
      const { id, fechaCita, horaCita, medico_nombre, medico_apellido, paciente_nombre } = appointmentData;
      
      const appointmentDate = new Date(`${fechaCita}T${horaCita}`);
      const reminderDate = new Date(appointmentDate.getTime() - (24 * 60 * 60 * 1000));
      
      if (reminderDate > new Date()) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: '🏥 Recordatorio de Cita Médica',
            body: `Su cita con Dr. ${medico_nombre} ${medico_apellido} es mañana a las ${horaCita}`,
            data: { 
              type: 'appointment_reminder',
              appointmentId: id,
              patientName: paciente_nombre
            },
            sound: 'default',
          },
          trigger: reminderDate,
        });
      }

      const reminder2Hours = new Date(appointmentDate.getTime() - (2 * 60 * 60 * 1000));
      
      if (reminder2Hours > new Date()) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: '⏰ Cita Médica Próxima',
            body: `Su cita con Dr. ${medico_nombre} ${medico_apellido} es en 2 horas`,
            data: { 
              type: 'appointment_soon',
              appointmentId: id,
              patientName: paciente_nombre
            },
            sound: 'default',
          },
          trigger: reminder2Hours,
        });
      }

      return true;
    } catch (error) {
      console.error('Error programando recordatorio:', error);
      return false;
    }
  };

  const notifyAppointmentCreated = async (appointmentData) => {
    if (!permissionsGranted || !settings.appointmentUpdates) {
      return false;
    }
    
    try {
      const { medico_nombre, medico_apellido, fechaCita, horaCita } = appointmentData;
      
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '✅ Cita Médica Confirmada',
          body: `Su cita con Dr. ${medico_nombre} ${medico_apellido} ha sido programada para el ${fechaCita} a las ${horaCita}`,
          data: { 
            type: 'appointment_created',
            appointmentId: appointmentData.id
          },
          sound: 'default',
        },
        trigger: null,
      });

      return true;
    } catch (error) {
      console.error('❌ Error notificando creación de cita:', error);
      return false;
    }
  };

  const notifyAppointmentUpdated = async (appointmentData) => {
    if (!permissionsGranted || !settings.appointmentUpdates) return false;
    
    try {
      const { medico_nombre, medico_apellido, fechaCita, horaCita } = appointmentData;
      
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '📝 Cita Médica Actualizada',
          body: `Su cita con Dr. ${medico_nombre} ${medico_apellido} ha sido modificada para el ${fechaCita} a las ${horaCita}`,
          data: { 
            type: 'appointment_updated',
            appointmentId: appointmentData.id
          },
          sound: 'default',
        },
        trigger: null,
      });

      return true;
    } catch (error) {
      console.error('Error notificando actualización de cita:', error);
      return false;
    }
  };

  const notifyAppointmentCancelled = async (appointmentData) => {
    if (!permissionsGranted || !settings.appointmentUpdates) return false;
    
    try {
      const { medico_nombre, medico_apellido, fechaCita, horaCita } = appointmentData;
      
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '❌ Cita Médica Cancelada',
          body: `Su cita con Dr. ${medico_nombre} ${medico_apellido} del ${fechaCita} a las ${horaCita} ha sido cancelada`,
          data: { 
            type: 'appointment_cancelled',
            appointmentId: appointmentData.id
          },
          sound: 'default',
        },
        trigger: null,
      });

      return true;
    } catch (error) {
      console.error('Error notificando cancelación de cita:', error);
      return false;
    }
  };

  const notifyUserCreated = async (userData, userType) => {
    if (!permissionsGranted || !settings.userNotifications) return false;
    
    try {
      const { nombre, apellido } = userData;
      
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '👤 Nuevo Usuario Registrado',
          body: `${userType === 'paciente' ? 'Paciente' : userType === 'medico' ? 'Médico' : 'Administrador'} ${nombre} ${apellido} ha sido registrado exitosamente`,
          data: { 
            type: 'user_created',
            userType: userType,
            userId: userData.id
          },
          sound: 'default',
        },
        trigger: null,
      });

      return true;
    } catch (error) {
      console.error('Error notificando creación de usuario:', error);
      return false;
    }
  };

  const notifyScheduleCreated = async (scheduleData) => {
    if (!permissionsGranted || !settings.scheduleNotifications) return false;
    
    try {
      const { medico_nombre, medico_apellido, diaSemana, horaInicio, horaFin } = scheduleData;
      
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '📅 Nuevo Horario Médico',
          body: `Dr. ${medico_nombre} ${medico_apellido} tiene nuevo horario: ${diaSemana} de ${horaInicio} a ${horaFin}`,
          data: { 
            type: 'schedule_created',
            scheduleId: scheduleData.id
          },
          sound: 'default',
        },
        trigger: null,
      });

      return true;
    } catch (error) {
      console.error('Error notificando creación de horario:', error);
      return false;
    }
  };

  const notifySpecialtyCreated = async (specialtyData) => {
    if (!permissionsGranted || !settings.specialtyNotifications) return false;
    
    try {
      const { nombre } = specialtyData;
      
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🏥 Nueva Especialidad Médica',
          body: `La especialidad "${nombre}" ha sido agregada al sistema`,
          data: { 
            type: 'specialty_created',
            specialtyId: specialtyData.id
          },
          sound: 'default',
        },
        trigger: null,
      });

      return true;
    } catch (error) {
      console.error('Error notificando creación de especialidad:', error);
      return false;
    }
  };

  const cancelAllNotifications = async () => {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      return true;
    } catch (error) {
      console.error('Error cancelando notificaciones:', error);
      return false;
    }
  };

  const getScheduledNotifications = async () => {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error obteniendo notificaciones programadas:', error);
      return [];
    }
  };

  const updateSettings = async (newSettings) => {
    await saveSettings(newSettings);
  };

  const testLocalNotification = async () => {
    if (!permissionsGranted) {
      return false;
    }
    
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🧪 Prueba de Notificación Local',
          body: '¡Las notificaciones locales funcionan correctamente!',
          data: { type: 'test' },
          sound: 'default',
        },
        trigger: null, 
      });
      
      return true;
    } catch (error) {
      console.error('❌ Error en notificación de prueba:', error);
      return false;
    }
  };

  const value = {
    isInitialized,
    permissionsGranted,
    settings,
    scheduleAppointmentReminder,
    notifyAppointmentCreated,
    notifyAppointmentUpdated,
    notifyAppointmentCancelled,
    notifyUserCreated,
    notifyScheduleCreated,
    notifySpecialtyCreated,
    cancelAllNotifications,
    getScheduledNotifications,
    updateSettings,
    testLocalNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

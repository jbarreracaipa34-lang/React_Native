import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useNotificationContext } from '../../Src/Services/NotificationService';

export default function NotificationSettings({ navigation }) {
  const {
    permissionsGranted,
    settings,
    cancelAllNotifications,
    getScheduledNotifications,
    updateSettings,
    testLocalNotification
  } = useNotificationContext();

  const toggleSetting = async (key) => {
    const newSettings = {
      ...settings,
      [key]: !settings[key]
    };
    
    await updateSettings(newSettings);
    
    if (!newSettings.appointmentReminders && !newSettings.appointmentUpdates) {
      await cancelAllNotifications();
    }
  };

  const handleClearAllNotifications = async () => {
    Alert.alert(
      'Limpiar Notificaciones',
      '¿Estás seguro de que quieres cancelar todas las notificaciones programadas?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpiar',
          style: 'destructive',
          onPress: async () => {
            await cancelAllNotifications();
            Alert.alert('Éxito', 'Todas las notificaciones han sido canceladas');
          }
        }
      ]
    );
  };

  const handleViewScheduledNotifications = async () => {
    try {
      const scheduled = await getScheduledNotifications();
      Alert.alert(
        'Notificaciones Programadas',
        `Tienes ${scheduled.length} notificaciones programadas`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', 'No se pudieron obtener las notificaciones programadas');
    }
  };

  const handleTestNotification = async () => {
    const success = await testLocalNotification();
    if (success) {
      Alert.alert('Éxito', 'Notificación de prueba enviada. Revisa la barra de notificaciones.');
    } else {
      Alert.alert('Error', 'No se pudo enviar la notificación de prueba. Verifica los permisos.');
    }
  };

  const renderSettingItem = (title, description, key, icon) => (
    <View style={styles.settingItem}>
      <View style={styles.settingInfo}>
        <View style={styles.settingHeader}>
          <Ionicons name={icon} size={24} color="#2196F3" />
          <Text style={styles.settingTitle}>{title}</Text>
        </View>
        <Text style={styles.settingDescription}>{description}</Text>
      </View>
      <Switch
        value={settings[key]}
        onValueChange={() => toggleSetting(key)}
        trackColor={{ false: '#E0E0E0', true: '#81C784' }}
        thumbColor={settings[key] ? '#4CAF50' : '#F4F3F4'}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Configuración de Notificaciones</Text>
      </View>

      <ScrollView style={styles.content}>
        {!permissionsGranted && (
          <View style={styles.warningContainer}>
            <Ionicons name="warning" size={24} color="#FF9800" />
            <Text style={styles.warningText}>
              Los permisos de notificación no están habilitados. 
              Ve a la configuración del dispositivo para habilitarlos.
            </Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Citas Médicas</Text>
          
          {renderSettingItem(
            'Recordatorios de Citas',
            'Recibe notificaciones 24 horas y 2 horas antes de tu cita',
            'appointmentReminders',
            'alarm-outline'
          )}
          
          {renderSettingItem(
            'Actualizaciones de Citas',
            'Notificaciones cuando se crean, modifican o cancelan citas',
            'appointmentUpdates',
            'calendar-outline'
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Administración</Text>
          
          {renderSettingItem(
            'Notificaciones de Usuarios',
            'Notificaciones cuando se crean o eliminan usuarios',
            'userNotifications',
            'people-outline'
          )}
          
          {renderSettingItem(
            'Notificaciones de Horarios',
            'Notificaciones cuando se crean nuevos horarios médicos',
            'scheduleNotifications',
            'time-outline'
          )}
          
          {renderSettingItem(
            'Notificaciones de Especialidades',
            'Notificaciones cuando se agregan nuevas especialidades',
            'specialtyNotifications',
            'medical-outline'
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Gestionar Notificaciones</Text>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleTestNotification}
          >
            <Ionicons name="flask-outline" size={24} color="#4CAF50" />
            <Text style={styles.actionButtonText}>Probar Notificación Local</Text>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleViewScheduledNotifications}
          >
            <Ionicons name="list-outline" size={24} color="#2196F3" />
            <Text style={styles.actionButtonText}>Ver Notificaciones Programadas</Text>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.dangerButton]}
            onPress={handleClearAllNotifications}
          >
            <Ionicons name="trash-outline" size={24} color="#F44336" />
            <Text style={[styles.actionButtonText, styles.dangerText]}>
              Cancelar Todas las Notificaciones
            </Text>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Las notificaciones te ayudan a mantenerte informado sobre tus citas médicas y cambios importantes en el sistema.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  warningText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: '#E65100',
  },
  section: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    marginBottom: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginLeft: 12,
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
    marginLeft: 36,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  actionButtonText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  dangerButton: {
    borderBottomWidth: 0,
  },
  dangerText: {
    color: '#F44336',
  },
  footer: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 16,
    marginTop: 8,
  },
  footerText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});

import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Alert, RefreshControl} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AuthService from '../../Src/Services/AuthService';
import NavigationService from '../../Src/Services/NavegationService';

export default function MedicoInicio({ navigation }) {
  const [usuario, setUsuario] = useState(null);
  const [horarios, setHorarios] = useState([]);
  const [citasHoy, setCitasHoy] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadUsuarioData();
    loadMedicoData();
  }, []);

  const loadUsuarioData = async () => {
    const authData = await AuthService.isAuthenticated();
    if (authData.isAuthenticated) {
      setUsuario(authData.usuario);
    }
  };

  const loadMedicoData = async () => {
    try {
      const horariosResult = await AuthService.getHorariosDisponiblesPorMedico();
      if (horariosResult.success) {
        setHorarios(horariosResult.data);
      }

      const today = new Date().toISOString().split('T')[0];
    } catch (error) {
      console.error('Error loading medico data:', error);
    }
  };

  const handleLogout = () => {
    Alert.alert('Cerrar Sesion', '¿Estas seguro que quieres cerrar sesion?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Cerrar Sesion', 
          style: 'destructive',
          onPress: async () => {
            await AuthService.logout();
            navigation.reset({
              index: 0,
              routes: [{ name: 'Inicio' }]
            });
          }
        }
      ]
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMedicoData();
    setRefreshing(false);
  };

  const formatTime = (time) => {
    if (!time) return '';
    return time.substring(0, 5);
  };

  const navigateToPerfil = () => {
    navigation.getParent()?.navigate('Perfil');
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>👨‍⚕️</Text>
          </View>
          <View>
            <Text style={styles.welcomeText}>¡Hola Doctor!</Text>
            <Text style={styles.nameText}>
              {usuario?.nombre && usuario?.apellido 
                ? `${usuario.nombre} ${usuario.apellido}` 
                : usuario?.name || 'Medico'
              }
            </Text>
          </View>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.actionsContainer}>
          <Text style={styles.sectionTitle}>Acciones Rapidas</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => NavigationService.navigate('CitasStack', { screen: 'VerAgenda' })}
            >
              <MaterialCommunityIcons name="calendar-today" size={40} color="#1E88E5" />
              <Text style={styles.actionTitle}>Ver Agenda</Text>
              <Text style={styles.actionDescription}>Consultar citas programadas</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => NavigationService.navigate('horariosDisponiblesStack', { screen: 'MisHorarios' })}
            >
              <MaterialCommunityIcons name="clock-outline" size={40} color="#4CAF50" />
              <Text style={styles.actionTitle}>Mis Horarios</Text>
              <Text style={styles.actionDescription}>Gestionar disponibilidad</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => NavigationService.navigate('PacientesStack', { screen: 'MisPacientes' })}
            >
              <MaterialCommunityIcons name="account-group" size={40} color="#8E24AA" />
              <Text style={styles.actionTitle}>Mis Pacientes</Text>
              <Text style={styles.actionDescription}>Ver historial medico</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => NavigationService.navigate('EspecialidadesStack', { screen: 'MiEspecialidad' })}
            >
              <MaterialCommunityIcons name="medical-bag" size={40} color="#FF5722" />
              <Text style={styles.actionTitle}>Mi Especialidad</Text>
              <Text style={styles.actionDescription}>Informacion profesional</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>

      <View style={styles.bottomNav}>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => NavigationService.navigate('MedicoInicio')}
        >
          <MaterialCommunityIcons name="home" size={24} color="#4CAF50" />
          <Text style={[styles.navLabel, styles.navLabelActive]}>Inicio</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => NavigationService.navigate('CitasStack', { screen: 'VerAgenda' })}
        >
          <MaterialCommunityIcons name="calendar-blank" size={24} color="#6B7280" />
          <Text style={styles.navLabel}>Citas</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => NavigationService.navigate('horariosDisponiblesStack', { screen: 'MisHorarios' })}
        >
          <MaterialCommunityIcons name="clock-outline" size={24} color="#6B7280" />
          <Text style={styles.navLabel}>Horarios</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => NavigationService.navigate('PacientesStack', { screen: 'MisPacientes' })}
        >
          <MaterialCommunityIcons name="account-group" size={24} color="#6B7280" />
          <Text style={styles.navLabel}>Pacientes</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => NavigationService.navigate('EspecialidadesStack', { screen: 'MiEspecialidad' })}
        >
          <MaterialCommunityIcons name="medical-bag" size={24} color="#6B7280" />
          <Text style={styles.navLabel}>Especialidad</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navItem}
          onPress={navigateToPerfil}
        >
          <Ionicons name="person-outline" size={24} color="#6B7280" />
          <Text style={styles.navLabel}>Perfil</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#4CAF50',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 24,
  },
  welcomeText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  nameText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  logoutButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  actionsContainer: {
    marginBottom: 20,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionCard: {
    width: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginTop: 12,
    marginBottom: 6,
    textAlign: 'center',
  },
  actionDescription: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 16,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingTop: 12,
    paddingBottom: 20,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  navLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 4,
    fontWeight: '500',
  },
  navLabelActive: {
    color: '#4CAF50',
    fontWeight: '600',
  },
});